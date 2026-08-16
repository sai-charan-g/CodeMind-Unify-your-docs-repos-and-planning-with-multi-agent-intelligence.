"""
CodeMind — Custom Exception Handlers

Centralized exception classes and FastAPI exception handlers
for consistent error responses across the API.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from loguru import logger


# --- Custom Exception Classes ---

class CodeMindException(Exception):
    """Base exception for all CodeMind errors."""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class AuthenticationError(CodeMindException):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message=message, status_code=status.HTTP_401_UNAUTHORIZED)


class AuthorizationError(CodeMindException):
    """Raised when user lacks required permissions."""

    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message=message, status_code=status.HTTP_403_FORBIDDEN)


class NotFoundError(CodeMindException):
    """Raised when a requested resource is not found."""

    def __init__(self, resource: str = "Resource", identifier: str = ""):
        message = f"{resource} not found"
        if identifier:
            message = f"{resource} '{identifier}' not found"
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND)


class ConflictError(CodeMindException):
    """Raised when a resource already exists."""

    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message=message, status_code=status.HTTP_409_CONFLICT)


class ValidationError(CodeMindException):
    """Raised for business logic validation failures."""

    def __init__(self, message: str = "Validation failed"):
        super().__init__(
            message=message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
        )


class RateLimitError(CodeMindException):
    """Raised when rate limit is exceeded."""

    def __init__(self, message: str = "Rate limit exceeded. Please try again later."):
        super().__init__(
            message=message, status_code=status.HTTP_429_TOO_MANY_REQUESTS
        )


class ExternalServiceError(CodeMindException):
    """Raised when an external service (GitHub, Gemini) fails."""

    def __init__(self, service: str, message: str = ""):
        full_message = f"External service error: {service}"
        if message:
            full_message += f" — {message}"
        super().__init__(
            message=full_message, status_code=status.HTTP_502_BAD_GATEWAY
        )


# --- Exception Handlers ---

def register_exception_handlers(app: FastAPI) -> None:
    """Register all custom exception handlers with the FastAPI app."""

    @app.exception_handler(CodeMindException)
    async def codemind_exception_handler(
        request: Request, exc: CodeMindException
    ) -> JSONResponse:
        logger.warning(
            f"CodeMindException: {exc.status_code} — {exc.message} | "
            f"path={request.url.path}"
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message, "error_type": type(exc).__name__},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.exception(
            f"Unhandled exception: {exc} | path={request.url.path}"
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An unexpected error occurred. Please try again later.",
                "error_type": "InternalServerError",
            },
        )
