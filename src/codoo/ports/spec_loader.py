"""YAML specification loader and validator."""

from pathlib import Path
from typing import Any

import yaml

from codoo.core.exceptions import SpecValidationError
from codoo.core.models import SpecContract


def load_spec_file(spec_file: Path) -> dict[str, Any]:
    """
    Load YAML spec file.

    Args:
        spec_file: Path to spec YAML file

    Returns:
        Parsed spec dict

    Raises:
        SpecValidationError: If file not found or invalid YAML
    """
    if not spec_file.exists():
        raise SpecValidationError(f"Spec file not found: {spec_file}")

    try:
        with open(spec_file, "r") as f:
            data = yaml.safe_load(f)
        return data or {}
    except yaml.YAMLError as e:
        raise SpecValidationError(f"Invalid YAML in {spec_file}: {e}")


def validate_spec(spec_data: dict[str, Any]) -> SpecContract:
    """
    Validate and parse spec data into SpecContract.

    Args:
        spec_data: Parsed spec dict

    Returns:
        SpecContract model

    Raises:
        SpecValidationError: If validation fails
    """
    try:
        return SpecContract(**spec_data)
    except Exception as e:
        raise SpecValidationError(f"Spec validation failed: {e}")


async def load_and_validate_spec(spec_file: Path) -> SpecContract:
    """
    Load and validate a spec file.

    Args:
        spec_file: Path to spec file

    Returns:
        Validated SpecContract

    Raises:
        SpecValidationError: If loading or validation fails
    """
    data = load_spec_file(spec_file)
    return validate_spec(data)
