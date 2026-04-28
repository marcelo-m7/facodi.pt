"""Pytest configuration and fixtures."""

import asyncio
from pathlib import Path
from typing import AsyncGenerator

import pytest

from codoo.config import Config
from codoo.odoo.client import AsyncOdooClient


@pytest.fixture
def event_loop() -> asyncio.AbstractEventLoop:
    """Provide event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def temp_env(tmp_path: Path) -> dict[str, str]:
    """Provide temporary environment variables."""
    env = {
        "ODOO_HOST": "https://test.odoo.com",
        "ODOO_DB": "test_db",
        "ODOO_USERNAME": "test_user",
        "ODOO_PASSWORD": "test_pass",
        "LOG_LEVEL": "DEBUG",
    }
    return env


@pytest.fixture
def test_config(temp_env: dict[str, str]) -> Config:
    """Provide test configuration."""
    return Config(
        odoo_host=temp_env["ODOO_HOST"],
        odoo_db=temp_env["ODOO_DB"],
        odoo_username=temp_env["ODOO_USERNAME"],
        odoo_password=temp_env["ODOO_PASSWORD"],
    )


@pytest.fixture
def evidence_dir(tmp_path: Path) -> Path:
    """Provide temporary evidence directory."""
    evidence = tmp_path / "evidence"
    evidence.mkdir()
    return evidence


@pytest.fixture
async def mock_odoo_client(test_config: Config) -> AsyncGenerator[AsyncOdooClient, None]:
    """Provide mock Odoo client for testing."""
    client = AsyncOdooClient(
        host=test_config.odoo_host,
        database=test_config.odoo_db,
        username=test_config.odoo_username,
        password=test_config.odoo_password,
    )
    # Note: Don't actually authenticate in tests; mock responses instead
    client.uid = 2  # Mock user ID
    yield client
    await client.close()
