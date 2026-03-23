"""
共享图表模型
存储通过分享链接公开的图表快照数据。
"""

import uuid

from sqlalchemy import DateTime, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.database import Base


class SharedChart(Base):
    __tablename__ = "shared_charts"

    uuid: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    chart_type: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    labels: Mapped[dict] = mapped_column(JSON, nullable=False)
    datasets: Mapped[dict] = mapped_column(JSON, nullable=False)
    theme: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at = mapped_column(DateTime, server_default=func.now())
