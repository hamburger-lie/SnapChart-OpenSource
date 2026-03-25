"""
应用配置模块
通过 pydantic-settings 从 .env 文件加载所有环境变量，统一管理配置项。
"""

import logging
import sys

from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """应用全局配置，所有可变参数均从 .env 读取"""

    # 运行环境：dev / prod
    environment: str = "dev"

    # 服务配置
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    # 上传文件配置
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 20

    # 数据库配置
    database_url: str = "sqlite+aiosqlite:///./data/styles.db"

    # CORS 配置
    cors_origins: str = "http://localhost:5174,http://localhost:3000"

    # ---- Agent OpenAPI 专属配置 ----
    # API Key 鉴权（生产环境必须替换为强随机字符串）
    agent_api_key: str = "change-me-in-production"
    # 前端域名（用于生成 shareUrl，生产环境改为实际域名）
    frontend_base_url: str = "http://localhost:5174"
    # SSR 渲染微服务地址（Docker 内网用 http://ssr-service:3100）
    ssr_service_url: str = "http://localhost:3100"

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "prod"

    @property
    def cors_origin_list(self) -> list[str]:
        """将逗号分隔的 CORS 来源字符串转为列表"""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def max_file_size_bytes(self) -> int:
        """将 MB 转换为字节"""
        return self.max_file_size_mb * 1024 * 1024

    def validate_production(self) -> None:
        """生产环境启动时校验关键配置，不合规则直接退出"""
        if not self.is_production:
            return

        errors: list[str] = []

        if self.agent_api_key in ("change-me-in-production", "your-secret-api-key-here", ""):
            errors.append("AGENT_API_KEY 未配置，请设置为 32 位以上的强随机字符串")

        if "localhost" in self.frontend_base_url:
            errors.append("FRONTEND_BASE_URL 仍为 localhost，请改为实际线上域名")

        if any("localhost" in o for o in self.cors_origin_list):
            logger.warning("CORS_ORIGINS 包含 localhost，生产环境建议移除")

        if errors:
            for e in errors:
                logger.error("配置校验失败：%s", e)
            sys.exit(1)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


# 全局单例配置对象
settings = Settings()
