"""
API 鉴权与计费依赖模块
提供轻量级 Bearer Token / X-API-Key 鉴权和模拟计费功能。

用法：
    在路由函数中注入 `api_key: str = Depends(verify_api_key)`
    鉴权通过后调用 `deduct_credit(api_key)` 扣减额度。
"""

import logging
import os

from fastapi import HTTPException, Request, Security
from fastapi.security import APIKeyHeader

logger = logging.getLogger(__name__)

# ---------- 配置 ----------
# 从环境变量读取有效 Key 列表（逗号分隔），兜底使用默认测试 Key
_DEFAULT_KEY = "sk-wxgInpoDpWFxF-tskvIxFQaXUAzd5Nrl"
_VALID_KEYS: set[str] = set(
    k.strip()
    for k in os.getenv("VALID_API_KEYS", _DEFAULT_KEY).split(",")
    if k.strip()
)

# 模拟额度存储（进程内存，重启归零）
_credit_ledger: dict[str, int] = {}
_INITIAL_CREDITS = 100

# ---------- 安全头提取器 ----------
_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(
    request: Request,
    x_api_key: str | None = Security(_api_key_header),
) -> str:
    """
    提取并验证 API Key。
    支持两种携带方式：
      1. Header  Authorization: Bearer <token>
      2. Header  X-API-Key: <token>
    验证通过返回有效的 key 字符串，否则抛出 401。
    """
    token: str | None = x_api_key

    # 尝试从 Authorization 头提取 Bearer token
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.lower().startswith("bearer "):
            token = auth_header[7:].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="缺少 API Key，请在请求头中携带 Authorization: Bearer <token> 或 X-API-Key",
        )

    if token not in _VALID_KEYS:
        raise HTTPException(
            status_code=401,
            detail="无效的 API Key",
        )

    logger.info("[Auth] API Key 验证通过：%s...%s", token[:6], token[-4:])
    return token


def deduct_credit(api_key: str) -> int:
    """
    模拟计费扣减：每次调用扣 1 点额度，返回剩余额度。
    首次使用的 Key 自动获得 100 点初始额度。
    """
    if api_key not in _credit_ledger:
        _credit_ledger[api_key] = _INITIAL_CREDITS

    _credit_ledger[api_key] -= 1
    remaining = _credit_ledger[api_key]
    logger.info(
        "[Billing] Deducted 1 credit for key %s...%s. Remaining: %d",
        api_key[:6], api_key[-4:], remaining,
    )
    return remaining
