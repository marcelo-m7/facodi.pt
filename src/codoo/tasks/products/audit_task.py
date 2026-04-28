from typing import Any
from codoo.tasks.base import Task

class StubTask(Task):
    async def _inspect(self) -> dict[str, Any]:
        return {"mode": "inspect", "status": "stub"}
    async def _dry_run(self) -> dict[str, Any]:
        return {"mode": "dry-run", "status": "stub"}
    async def _apply(self) -> dict[str, Any]:
        return {"mode": "apply", "status": "stub"}
    async def _verify(self) -> dict[str, Any]:
        return {"mode": "verify", "status": "stub"}
