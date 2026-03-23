"""
应用配置模块
通过 pydantic-settings 从 .env 文件加载所有环境变量，统一管理配置项。
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用全局配置，所有可变参数均从 .env 读取"""

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

    @property
    def cors_origin_list(self) -> list[str]:
        """将逗号分隔的 CORS 来源字符串转为列表"""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def max_file_size_bytes(self) -> int:
        """将 MB 转换为字节"""
        return self.max_file_size_mb * 1024 * 1024

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


# 全局单例配置对象
settings = Settings()
