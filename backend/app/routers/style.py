"""
样式管理路由
提供自定义样式的 CRUD 操作，支持用户保存和复用图表配置。
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.schemas import StyleCreate, StyleListItem, StyleResponse
from app.models.style_model import ChartStyle

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/styles", tags=["样式管理"])


@router.post(
    "",
    response_model=StyleResponse,
    status_code=201,
    summary="保存新样式",
)
async def create_style(body: StyleCreate, db: AsyncSession = Depends(get_db)):
    """将当前图表的样式配置保存为模板，便于后续复用"""
    style = ChartStyle(
        name=body.name,
        chart_type=body.chart_type,
        echarts_option=body.echarts_option,
        data_snapshot=body.data_snapshot,
        thumbnail=body.thumbnail,
    )
    db.add(style)
    await db.commit()
    await db.refresh(style)
    logger.info("新样式已保存：%s（%s）", style.name, style.id)
    return style


@router.get(
    "",
    response_model=list[StyleListItem],
    summary="获取样式列表",
)
async def list_styles(db: AsyncSession = Depends(get_db)):
    """获取所有已保存的样式（仅返回元信息 + 缩略图，不含完整 option）"""
    result = await db.execute(
        select(ChartStyle).order_by(ChartStyle.updated_at.desc())
    )
    return result.scalars().all()


@router.get(
    "/{style_id}",
    response_model=StyleResponse,
    summary="获取样式详情",
)
async def get_style(style_id: str, db: AsyncSession = Depends(get_db)):
    """根据 ID 获取完整的样式配置"""
    style = await db.get(ChartStyle, style_id)
    if not style:
        raise HTTPException(status_code=404, detail="样式不存在")
    return style


@router.put(
    "/{style_id}",
    response_model=StyleResponse,
    summary="更新样式",
)
async def update_style(
    style_id: str, body: StyleCreate, db: AsyncSession = Depends(get_db)
):
    """更新已有样式的配置"""
    style = await db.get(ChartStyle, style_id)
    if not style:
        raise HTTPException(status_code=404, detail="样式不存在")

    style.name = body.name
    style.chart_type = body.chart_type
    style.echarts_option = body.echarts_option
    style.data_snapshot = body.data_snapshot
    style.thumbnail = body.thumbnail
    await db.commit()
    await db.refresh(style)
    logger.info("样式已更新：%s（%s）", style.name, style.id)
    return style


@router.delete(
    "/{style_id}",
    status_code=204,
    summary="删除样式",
)
async def delete_style(style_id: str, db: AsyncSession = Depends(get_db)):
    """删除指定样式"""
    style = await db.get(ChartStyle, style_id)
    if not style:
        raise HTTPException(status_code=404, detail="样式不存在")

    await db.delete(style)
    await db.commit()
    logger.info("样式已删除：%s", style_id)
