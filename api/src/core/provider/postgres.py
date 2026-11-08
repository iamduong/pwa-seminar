from collections.abc import AsyncIterator

from core.setting import get_setting
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

setting = get_setting()

engine = create_async_engine(
    setting.POSTGRES_ENDPOINT,
    echo=True,
    pool_pre_ping=True,
)

SessionFactory = async_sessionmaker(
    engine,
    expire_on_commit=False,
)


async def connect_postgres() -> None:
    """Verify that PostgreSQL is reachable when the application starts."""
    async with engine.connect() as connection:
        await connection.execute(text("SELECT 1"))


async def close_postgres() -> None:
    """Close every connection managed by the engine pool."""
    await engine.dispose()


async def get_postgres() -> AsyncIterator[AsyncSession]:
    """Provide one SQLAlchemy session per request."""
    async with SessionFactory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
