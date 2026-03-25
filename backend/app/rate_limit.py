"""
全局速率限制器（单例）
所有路由模块共享同一个 Limiter 实例，避免重复初始化。
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
