"""
CodeMind — FastAPI Application Factory

Creates and configures the main FastAPI application with all routers,
middleware, CORS, rate limiting, and exception handlers.
"""

import sys
from pathlib import Path
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

# Ensure project root and backend dir are in sys.path so top-level modules (e.g. agents) can be imported
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application startup and shutdown events."""
    logger.info(f"🚀 Starting {settings.app_name} ({settings.app_env})")
    yield
    logger.info(f"👋 Shutting down {settings.app_name}")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        description="Multi-Agent AI Engineering Workspace",
        version="1.0.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    # --- CORS ---
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Exception Handlers ---
    register_exception_handlers(app)

    # --- Routers ---
    from app.api.v1.auth import router as auth_router
    from app.api.v1.chat import router as chat_router
    from app.api.v1.knowledge import router as knowledge_router
    from app.api.v1.github import router as github_router
    from app.api.v1.projects import router as projects_router

    api_prefix = "/api/v1"
    app.include_router(auth_router, prefix=api_prefix)
    app.include_router(chat_router, prefix=api_prefix)
    app.include_router(knowledge_router, prefix=api_prefix)
    app.include_router(github_router, prefix=api_prefix)
    app.include_router(projects_router, prefix=api_prefix)

    # --- Health Check ---
    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "healthy", "app": settings.app_name, "env": settings.app_env}

    return app


app = create_app()
