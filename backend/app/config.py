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

    # CORS 配置
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

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
