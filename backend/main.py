"""
数据解析与图表可视化系统 - 后端入口
启动 FastAPI 应用，注册路由和中间件。
"""

import logging

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import chart

# 配置日志格式
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# 创建 FastAPI 应用实例
app = FastAPI(
    title="数据解析与图表可视化系统",
    description="上传 Excel/CSV 表格文件，自动提取数据并生成可视化图表配置",
    version="1.0.0",
)

# 配置 CORS 跨域中间件，允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由模块
app.include_router(chart.router)


@app.get("/", tags=["系统"])
async def root():
    """根路径健康检查"""
    return {
        "service": "数据解析与图表可视化系统",
        "version": "1.0.0",
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
        reload=True,  # 开发模式下自动热重载
    )
