"""
API Key 模型
用于 AI Agent 商业化通道的密钥与额度管理。

安全策略：
  - 数据库中仅存储 Key 的 SHA-256 哈希值（key_hash 字段）
  - 验证时将请求中的明文 Key 哈希后与数据库比对
  - 即使数据库泄露，攻击者也无法还原原始 Key
"""

import hashlib

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.database import Base


def hash_api_key(raw_key: str) -> str:
    """将明文 API Key 转为 SHA-256 哈希（十六进制字符串）"""
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


class ApiKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # 存储哈希值而非明文，保持 unique + index 便于快速查找
    key_hash: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    customer_name: Mapped[str] = mapped_column(String, nullable=False)
    credits: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
