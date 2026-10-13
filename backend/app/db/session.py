"""
CodeMind — Async Database Session

Configures the async SQLAlchemy engine and provides
a dependency-injectable session factory for FastAPI.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

settings = get_settings()


# SQLite needs check_same_thread=False; PostgreSQL uses connection pooling
_connect_args = {}
_engine_kwargs = {"echo": settings.debug}

if settings.database_url.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}
else:
    _engine_kwargs["pool_size"] = 10
    _engine_kwargs["max_overflow"] = 20
    _engine_kwargs["pool_pre_ping"] = True

# Create async engine
engine = create_async_engine(
    settings.database_url,
    connect_args=_connect_args,
    **_engine_kwargs,
)

# Session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an async database session.
    Automatically closes the session after the request.
    """
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
