"""Async Odoo JSON-RPC client using httpx (session-based, SaaS compatible)."""

from typing import Any, Optional

import httpx

from codoo.core.exceptions import (
    OdooAuthenticationError,
    OdooConnectionError,
    OdooError,
)


class AsyncOdooClient:
    """
    Async HTTP client for Odoo JSON-RPC API (session-based).

    Uses /web/session/authenticate + /web/dataset/call_kw which works on
    Odoo SaaS (online) and self-hosted instances. Maintains session cookie
    across requests for the lifetime of the client.
    """

    def __init__(
        self,
        host: str,
        database: str,
        username: str,
        password: str,
        timeout: float = 30.0,
    ) -> None:
        """
        Initialize Odoo client.

        Args:
            host: Odoo instance URL (e.g., https://open22.odoo.com)
            database: Database name
            username: Odoo login (email)
            password: Odoo password or API key
            timeout: Request timeout in seconds
        """
        self.host = host.rstrip("/")
        self.database = database
        self.username = username
        self.password = password
        self.timeout = timeout
        self.uid: Optional[int] = None
        # httpx.AsyncClient persists cookies across requests (session)
        self._http_client = httpx.AsyncClient(timeout=timeout)

    async def authenticate(self) -> int:
        """
        Authenticate via /web/session/authenticate (JSON-RPC, SaaS compatible).

        Returns:
            User ID (uid) if successful

        Raises:
            OdooConnectionError: If cannot connect
            OdooAuthenticationError: If credentials invalid
        """
        try:
            url = f"{self.host}/web/session/authenticate"
            payload = {
                "jsonrpc": "2.0",
                "method": "call",
                "id": 1,
                "params": {
                    "db": self.database,
                    "login": self.username,
                    "password": self.password,
                },
            }

            response = await self._http_client.post(url, json=payload)
            response.raise_for_status()

            data = response.json()
            if "error" in data:
                err = data["error"].get("data", {}).get("message", str(data["error"]))
                raise OdooAuthenticationError(f"Authentication failed: {err}")

            uid = data.get("result", {}).get("uid")
            if not uid:
                raise OdooAuthenticationError(
                    "Authentication failed: invalid credentials or database"
                )

            self.uid = uid
            return self.uid

        except httpx.ConnectError as e:
            raise OdooConnectionError(f"Cannot connect to {self.host}: {e}")
        except httpx.HTTPStatusError as e:
            raise OdooError(f"HTTP error: {e}")

    async def call(
        self,
        model: str,
        method: str,
        args: list[Any] = None,
        kwargs: dict[str, Any] = None,
    ) -> Any:
        """
        Make authenticated JSON-RPC call via /web/dataset/call_kw.

        Args:
            model: Model name (e.g., 'product.product')
            method: Method name (e.g., 'search_read', 'create', 'write', 'unlink')
            args: Positional arguments
            kwargs: Keyword arguments

        Returns:
            Method result

        Raises:
            OdooError: If call fails
        """
        if self.uid is None:
            await self.authenticate()

        args = args or []
        kwargs = kwargs or {}

        try:
            url = f"{self.host}/web/dataset/call_kw"
            payload = {
                "jsonrpc": "2.0",
                "method": "call",
                "id": 1,
                "params": {
                    "model": model,
                    "method": method,
                    "args": args,
                    "kwargs": kwargs,
                },
            }

            response = await self._http_client.post(url, json=payload)
            response.raise_for_status()

            result = response.json()
            if "error" in result:
                error_msg = result["error"].get("data", {}).get("message", str(result["error"]))
                raise OdooError(f"Odoo call failed [{model}.{method}]: {error_msg}")
            return result["result"]

        except httpx.HTTPStatusError as e:
            raise OdooError(f"HTTP error during call: {e}")

    async def search(
        self, model: str, domain: list[Any] = None, limit: int = 0, offset: int = 0
    ) -> list[int]:
        """
        Search for records.

        Args:
            model: Model name
            domain: Search domain (Odoo domain syntax)
            limit: Limit results
            offset: Offset results

        Returns:
            List of record IDs
        """
        domain = domain or []
        return await self.call(
            model, "search", [domain], {"limit": limit, "offset": offset}
        )

    async def read(
        self, model: str, ids: list[int], fields: list[str] = None
    ) -> list[dict[str, Any]]:
        """
        Read records.

        Args:
            model: Model name
            ids: Record IDs to read
            fields: Fields to read (None = all)

        Returns:
            List of record data
        """
        fields = fields or []
        return await self.call(model, "read", [ids, fields])

    async def create(self, model: str, data: dict[str, Any]) -> int:
        """
        Create a new record.

        Args:
            model: Model name
            data: Record data

        Returns:
            Created record ID
        """
        return await self.call(model, "create", [data])

    async def write(self, model: str, ids: list[int], data: dict[str, Any]) -> bool:
        """
        Update records.

        Args:
            model: Model name
            ids: Record IDs to update
            data: Data to update

        Returns:
            True if successful
        """
        return await self.call(model, "write", [ids, data])

    async def unlink(self, model: str, ids: list[int]) -> bool:
        """
        Delete records.

        Args:
            model: Model name
            ids: Record IDs to delete

        Returns:
            True if successful
        """
        return await self.call(model, "unlink", [ids])

    async def close(self) -> None:
        """Close HTTP client connection."""
        await self._http_client.aclose()

    async def __aenter__(self) -> "AsyncOdooClient":
        """Async context manager entry."""
        await self.authenticate()
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Async context manager exit."""
        await self.close()
