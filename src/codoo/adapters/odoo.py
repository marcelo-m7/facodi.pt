"""Odoo adapter factory."""

from codoo.config import Config
from codoo.core.exceptions import ConfigurationError
from codoo.odoo.client import AsyncOdooClient


async def create_odoo_client(config: Config) -> AsyncOdooClient:
    """
    Factory function to create AsyncOdooClient from config.

    Args:
        config: Codoo configuration

    Returns:
        Authenticated AsyncOdooClient

    Raises:
        ConfigurationError: If credentials invalid
    """
    if not config.validate_odoo_credentials():
        raise ConfigurationError(
            "Missing Odoo credentials. "
            "Set ODOO_HOST, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD in .env"
        )

    client = AsyncOdooClient(
        host=config.odoo_host,
        database=config.odoo_db,
        username=config.odoo_username,
        password=config.odoo_password,
    )

    await client.authenticate()
    return client
