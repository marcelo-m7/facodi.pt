"""Agents orchestrator package for Codoo.

Provides LLM-powered agents that use Odoo as a data and action backend.
Architecture:
  schema.py       - discovers ir.model, ir.model.fields, ir.actions.server
  tools.py        - wraps Odoo operations as LLM function-calling tools
  orchestrator.py - Gemini-powered loop: interpret request → call tools → return result
"""
