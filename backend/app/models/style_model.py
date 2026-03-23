"""
自定义样式 ORM 模型
用于持久化用户保存的图表样式配置。
"""

import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.database import Base


class ChartStyle(Base):
    """图表样式模板"""

    __tablename__ = "chart_styles"

    # UUID 主键
    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # 样式名称，如"Q1季度报告样式"
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # 图表类型：bar / line / pie / stackedArea / scatter
    chart_type: Mapped[str] = mapped_column(String(20), nullable=False)

    # ECharts 完整样式配置（JSON 存储，不含数据部分）
    echarts_option: Mapped[dict] = mapped_column(JSON, nullable=False)

    # 数据快照（可选，用于预览）
    data_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # 缩略图 base64 字符串（可选，用于画廊展示）
    thumbnail: Mapped[str | None] = mapped_column(String, nullable=True)

    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
