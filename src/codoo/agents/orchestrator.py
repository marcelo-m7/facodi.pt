"""Gemini-powered agents orchestrator for Odoo.

Implements an agentic loop:
  1. User sends a natural language request
  2. Gemini decides which Odoo tools to call
  3. Tools execute against the live Odoo instance
  4. Gemini synthesizes the results into a final answer
  5. Repeat until done (no more tool calls)

Usage:
    orchestrator = await OdooOrchestrator.create(client, schema, gemini_api_key)
    result = await orchestrator.run("List all open sale orders for customer Acme")
    print(result.answer)
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from typing import Any

from google import genai
from google.genai import types as genai_types

from codoo.agents.schema import OdooSchema
from codoo.agents.tools import OdooToolRegistry
from codoo.odoo.client import AsyncOdooClient

logger = logging.getLogger(__name__)

# Max agentic loop iterations (safety guard against infinite loops)
MAX_ITERATIONS = 10

SYSTEM_PROMPT = """You are an expert Odoo business assistant.
You have access to tools that let you read and manage data in an Odoo ERP instance.

Rules:
- Always search before creating to avoid duplicates.
- When asked to "list" or "show" records, use the search tools.
- When a user asks about a specific record by name, search first, then get by ID.
- Return results in a clear, readable format with key field values.
- If a requested model does not have a specific tool, use odoo_search_any.
- For server actions, use odoo_list_server_actions first to find the right action ID.
- Never expose internal IDs as the primary identifier to users — always show names/references too.
- If an operation would modify or delete data, confirm the intent is clear before proceeding.

Available Odoo instance: {host} / {database}
Installed models: {model_count} models available.
"""


@dataclass
class AgentStep:
    iteration: int
    tool_name: str
    tool_args: dict[str, Any]
    result: dict[str, Any]


@dataclass
class OrchestratorResult:
    answer: str
    steps: list[AgentStep] = field(default_factory=list)
    iterations: int = 0
    success: bool = True
    error: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "answer": self.answer,
            "iterations": self.iterations,
            "steps": [
                {
                    "iteration": s.iteration,
                    "tool": s.tool_name,
                    "args": s.tool_args,
                    "result_summary": (
                        f"{len(s.result.get('data', []))} records"
                        if isinstance(s.result.get("data"), list)
                        else str(s.result.get("data", ""))[:200]
                    ),
                }
                for s in self.steps
            ],
            "success": self.success,
            "error": self.error,
        }


class OdooOrchestrator:
    """
    Agentic orchestrator: Gemini LLM + Odoo tool registry.

    Runs a ReAct-style loop: think → call tool → observe → repeat → answer.
    Uses google.genai SDK (v1+).
    """

    def __init__(
        self,
        client: AsyncOdooClient,
        schema: OdooSchema,
        registry: OdooToolRegistry,
        genai_client: genai.Client,
        gemini_model: str = "gemini-2.0-flash",
    ) -> None:
        self._client = client
        self._schema = schema
        self._registry = registry
        self._genai = genai_client
        self._model_name = gemini_model

    @classmethod
    async def create(
        cls,
        client: AsyncOdooClient,
        schema: OdooSchema,
        gemini_api_key: str,
        gemini_model: str = "gemini-2.0-flash",
    ) -> "OdooOrchestrator":
        """Factory: authenticate client, configure Gemini, return ready orchestrator."""
        if client.uid is None:
            await client.authenticate()

        genai_client = genai.Client(api_key=gemini_api_key)
        registry = OdooToolRegistry(client, schema)
        return cls(client, schema, registry, genai_client, gemini_model)

    def _build_tools(self) -> list[genai_types.Tool]:
        """Build google.genai Tool objects from the registry's function declarations."""
        function_declarations = [
            genai_types.FunctionDeclaration(
                name=d["name"],
                description=d["description"],
                parameters=genai_types.Schema(
                    type=genai_types.Type.OBJECT,
                    properties={
                        k: genai_types.Schema(
                            type=genai_types.Type.STRING if v.get("type") == "string"
                            else genai_types.Type.INTEGER,
                            description=v.get("description", ""),
                        )
                        for k, v in d.get("parameters", {}).get("properties", {}).items()
                    },
                    required=d.get("parameters", {}).get("required", []),
                ),
            )
            for d in self._registry.declarations
        ]
        return [genai_types.Tool(function_declarations=function_declarations)]

    def _build_system(self) -> str:
        return SYSTEM_PROMPT.format(
            host=self._schema.host,
            database=self._schema.database,
            model_count=len(self._schema.models),
        )

    async def run(self, user_request: str) -> OrchestratorResult:
        """
        Execute the agentic loop for a user request.

        Args:
            user_request: Natural language request from the user

        Returns:
            OrchestratorResult with final answer and execution trace
        """
        import asyncio

        tools = self._build_tools()
        config = genai_types.GenerateContentConfig(
            system_instruction=self._build_system(),
            tools=tools,
        )

        history: list[genai_types.Content] = [
            genai_types.Content(
                role="user",
                parts=[genai_types.Part(text=user_request)],
            )
        ]

        steps: list[AgentStep] = []
        loop = asyncio.get_event_loop()

        logger.debug("Orchestrator starting: %s", user_request)

        for iteration in range(MAX_ITERATIONS):
            response = await loop.run_in_executor(
                None,
                lambda h=history: self._genai.models.generate_content(
                    model=self._model_name,
                    contents=h,
                    config=config,
                ),
            )

            # Collect all parts from this response turn
            response_parts: list[genai_types.Part] = []
            function_calls: list[genai_types.FunctionCall] = []

            for candidate in response.candidates:
                for part in candidate.content.parts:
                    response_parts.append(part)
                    if part.function_call and part.function_call.name:
                        function_calls.append(part.function_call)

            # Append model turn to history
            history.append(
                genai_types.Content(role="model", parts=response_parts)
            )

            if not function_calls:
                # No tool calls — extract final answer
                answer = self._extract_text(response)
                return OrchestratorResult(
                    answer=answer,
                    steps=steps,
                    iterations=iteration + 1,
                )

            # Execute tool calls and build function response parts
            fn_response_parts: list[genai_types.Part] = []
            for fc in function_calls:
                tool_name = fc.name
                tool_args = dict(fc.args) if fc.args else {}

                logger.debug("Tool call [%d]: %s(%s)", iteration, tool_name, tool_args)

                tool_result = await self._registry.execute(tool_name, tool_args)
                step = AgentStep(
                    iteration=iteration,
                    tool_name=tool_name,
                    tool_args=tool_args,
                    result=tool_result.to_dict(),
                )
                steps.append(step)

                fn_response_parts.append(
                    genai_types.Part(
                        function_response=genai_types.FunctionResponse(
                            name=tool_name,
                            response=tool_result.to_dict(),
                        )
                    )
                )

            # Append tool results as user turn
            history.append(
                genai_types.Content(role="user", parts=fn_response_parts)
            )

        answer = self._extract_text(response) if "response" in dir() else "Max iterations reached."
        return OrchestratorResult(
            answer=answer,
            steps=steps,
            iterations=MAX_ITERATIONS,
            success=False,
            error="Max iterations reached",
        )

    def _extract_text(self, response: Any) -> str:
        """Extract plain text from a Gemini response."""
        try:
            return response.text
        except Exception:
            parts = []
            for candidate in response.candidates:
                for part in candidate.content.parts:
                    if hasattr(part, "text") and part.text:
                        parts.append(part.text)
            return " ".join(parts)
