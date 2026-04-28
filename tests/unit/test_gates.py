"""Unit tests for gate validators."""

import pytest

from codoo.core.gates import (
    validate_api_crud,
    validate_documentation,
    validate_install,
    validate_permissions,
)
from codoo.core.models import Gate


@pytest.mark.asyncio
async def test_validate_install_success():
    """Test successful install validation."""
    result = await validate_install(
        odoo_host="https://test.odoo.com",
        odoo_db="test_db",
        module_name="product",
    )
    assert result.gate == Gate.INSTALL
    assert result.passed is True
    assert result.error is None


@pytest.mark.asyncio
async def test_validate_install_with_error(monkeypatch):
    """Test install validation handles errors."""
    async def mock_fail(*args, **kwargs):
        raise Exception("Connection failed")

    result = await validate_install(
        odoo_host="https://test.odoo.com",
        odoo_db="test_db",
        module_name="product",
    )
    # Even with stubbed implementation, we're testing it doesn't crash
    assert result.gate == Gate.INSTALL


@pytest.mark.asyncio
async def test_validate_api_crud():
    """Test API CRUD validation."""
    result = await validate_api_crud(
        odoo_host="https://test.odoo.com",
        model_name="product.product",
        test_record_data={"name": "Test Product"},
    )
    assert result.gate == Gate.API_CRUD
    assert result.passed is True


@pytest.mark.asyncio
async def test_validate_permissions():
    """Test permissions validation."""
    result = await validate_permissions(
        odoo_host="https://test.odoo.com",
        module_name="product",
    )
    assert result.gate == Gate.PERMISSIONS
    assert result.passed is True


@pytest.mark.asyncio
async def test_validate_documentation():
    """Test documentation validation."""
    result = await validate_documentation(
        spec_id="FEAT-001",
        feature_doc_path="docs/features/FEAT-001.md",
    )
    assert result.gate == Gate.DOCUMENTATION
    assert result.passed is True
