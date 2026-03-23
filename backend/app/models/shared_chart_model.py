"""
共享图表 ORM 模型
用于 AI Agent 通过 OpenAPI 通道创建的图表数据持久化。
"""

import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.database import Base


class SharedChart(Base):
    """AI Agent 创建的共享图表（只读分享，无需登录即可查看）"""

    __tablename__ = "shared_charts"

    # UUID 主键（由后端生成，对外即为分享 ID）
    uuid: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # 图表类型：bar / line / pie / stackedBar / doughnut 等
    chart_type: Mapped[str] = mapped_column(String(30), nullable=False)

    # 图表标题
    title: Mapped[str] = mapped_column(String(200), nullable=False)

    # X 轴标签 / 饼图分类（JSON 数组）
    labels: Mapped[list] = mapped_column(JSON, nullable=False)

    # 数据系列（JSON 数组，每项格式：{"name": "...", "values": [...]}）
    datasets: Mapped[list] = mapped_column(JSON, nullable=False)

    # 可选主题配置（如 {"colors": ["#2563eb", ...]}）
    theme: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # 创建时间
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
