"""
数据库初始化模块
使用 SQLAlchemy 异步引擎 + aiosqlite 驱动，管理 SQLite 数据库连接。
"""

import os
from collections.abc import AsyncGenerator

from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# 确保数据库目录存在
db_path = settings.database_url.replace("sqlite+aiosqlite:///", "")
os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)

# 创建异步引擎（timeout 防止并发锁）
engine = create_async_engine(
    settings.database_url,
    echo=False,
    connect_args={"timeout": 15},
)


# 每次建立连接时启用 WAL 模式（提升并发读写性能）
@event.listens_for(engine.sync_engine, "connect")
def _set_sqlite_pragma(dbapi_conn, _connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA synchronous=NORMAL;")
    cursor.close()

# 创建异步 Session 工厂
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """所有 ORM 模型的基类"""
    pass


async def init_db() -> None:
    """初始化数据库，创建所有表"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI 依赖注入：获取数据库会话"""
    async with async_session() as session:
        yield session
