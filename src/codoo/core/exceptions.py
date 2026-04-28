"""Custom exceptions for Codoo."""


class CodooException(Exception):
    """Base exception for all Codoo errors."""

    pass


class ConfigurationError(CodooException):
    """Raised when configuration is invalid or missing."""

    pass


class OdooError(CodooException):
    """Raised when Odoo XML-RPC operation fails."""

    pass


class OdooConnectionError(OdooError):
    """Raised when cannot connect to Odoo instance."""

    pass


class OdooAuthenticationError(OdooError):
    """Raised when Odoo authentication fails."""

    pass


class TaskExecutionError(CodooException):
    """Raised when task execution fails."""

    pass


class GateValidationError(CodooException):
    """Raised when gate validation fails."""

    pass


class SpecValidationError(CodooException):
    """Raised when spec contract is invalid."""

    pass


class StageTransitionError(CodooException):
    """Raised when attempting invalid stage transition."""

    pass
