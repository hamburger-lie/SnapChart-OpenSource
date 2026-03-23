"""
数据解析与图表可视化编辑器 - 后端入口
启动 FastAPI 应用，注册路由、中间件和数据库初始化。
"""

import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.models.database import init_db
from app.routers import chart, style
from app.routers import agent_api
# 确保 ORM 模型在 init_db 前已导入，使其表结构被注册到 Base.metadata
from app.models import shared_chart_model as _  # noqa: F401
from app.models.api_key_model import ApiKey  # noqa: F401 — 确保 SQLAlchemy 注册表结构

# 配置日志格式
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理：启动时初始化数据库"""
    logger.info("正在初始化数据库...")
    await init_db()
    logger.info("数据库初始化完成")
    yield


# 创建 FastAPI 应用实例
app = FastAPI(
    title="SnapChart — 数据解析与图表可视化编辑器",
    description="上传 Excel/CSV 表格，自动提取数据并提供所见即所得的图表编辑器",
    version="2.0.0",
    lifespan=lifespan,
)

# 上传体积限制中间件（5MB）
MAX_BODY_SIZE = 5 * 1024 * 1024  # 5MB


class LimitUploadSizeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_BODY_SIZE:
            return JSONResponse(
                status_code=413,
                content={"detail": "文件大小不能超过 5MB"},
            )
        return await call_next(request)


app.add_middleware(LimitUploadSizeMiddleware)

# 配置 CORS 跨域中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由模块
app.include_router(chart.router)
app.include_router(style.router)
app.include_router(agent_api.router)  # AI Agent OpenAPI 专属通道


@app.get("/", tags=["系统"])
async def root():
    """根路径健康检查"""
    return {
        "service": "SnapChart",
        "version": "2.0.0",
        "status": "running",
    }


@app.get("/api/health", tags=["系统"])
async def health_check():
    """API 健康检查端点"""
    return {"status": "healthy"}


if __name__ == "__main__":
    logger.info("服务启动中，监听 %s:%d", settings.app_host, settings.app_port)
    uvicorn.run(
        "main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=True,
    )
