"""
AI Agent OpenAPI 专属通道
提供给第三方 AI 智能体（Coze、Dify、n8n 等）调用的图表创建接口。

设计原则：
  - POST /api/agent/create-chart  需携带 X-API-Key 鉴权
  - GET  /api/agent/chart/{uuid}  无需鉴权，前端只读页面调用
"""

import logging
import uuid as uuid_lib
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Security
from fastapi.responses import Response
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.database import get_db
from app.models.api_key_model import ApiKey, hash_api_key
from app.models.shared_chart_model import SharedChart

logger = logging.getLogger(__name__)

from app.rate_limit import limiter

router = APIRouter(prefix="/api/agent", tags=["Agent OpenAPI"])

# ========== API Key 鉴权 ==========

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key_and_deduct(
    api_key: str = Security(_api_key_header),
    db: AsyncSession = Depends(get_db),
) -> ApiKey:
    """查库鉴权 + 扣费：验证 Key 有效性 → 检查额度 → 扣减 1 次"""
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="缺少 API Key，请在请求头中携带 X-API-Key",
        )

    # 哈希后查库比对，数据库不存储明文 Key
    hashed = hash_api_key(api_key)
    result = await db.execute(select(ApiKey).where(ApiKey.key_hash == hashed))
    record = result.scalar_one_or_none()

    if not record or not record.is_active:
        raise HTTPException(status_code=401, detail="无效的 API Key")

    if record.credits <= 0:
        raise HTTPException(status_code=402, detail="API 额度已耗尽，请充值")

    record.credits -= 1
    await db.commit()
    logger.info("API Key [%s] 扣费 1 次，剩余额度：%d", record.customer_name, record.credits)
    return record


# ========== Pydantic 数据模型 ==========


class DatasetItemPayload(BaseModel):
    """单个数据系列"""
    name: str = Field(..., description="系列名称，如 '销量'、'营收'")
    values: list[float] = Field(..., description="数值列表，与 labels 一一对应")


class CreateChartRequest(BaseModel):
    """Agent 创建图表的请求体"""
    chartType: str = Field(
        ...,
        description="图表类型：bar / line / pie / stackedBar / doughnut / rose 等",
        examples=["bar"],
    )
    title: str = Field(..., min_length=1, max_length=200, description="图表标题")
    labels: list[str] = Field(..., min_length=1, description="X 轴标签或饼图分类")
    datasets: list[DatasetItemPayload] = Field(..., min_length=1, description="数据系列列表")
    theme: dict | None = Field(
        default=None,
        description="可选主题配置，如 {\"colors\": [\"#2563eb\", \"#16a34a\"]}",
    )


class CreateChartResponse(BaseModel):
    """创建成功的响应"""
    status: str = "success"
    uuid: str = Field(..., description="图表唯一标识符")
    shareUrl: str = Field(..., description="可直接分享给用户的只读链接")


class DatasetItemOut(BaseModel):
    """返回给前端的数据系列"""
    name: str
    values: list[float]


class SharedChartResponse(BaseModel):
    """GET 接口返回的完整图表数据"""
    uuid: str
    chartType: str
    title: str
    labels: list[str]
    datasets: list[DatasetItemOut]
    theme: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ========== 路由 ==========


@router.post(
    "/create-chart",
    response_model=CreateChartResponse,
    summary="[鉴权] Agent 创建共享图表",
    description=(
        "接收结构化 JSON 图表数据，持久化后返回唯一分享链接。\n\n"
        "**鉴权要求**：请求头必须携带 `X-API-Key`，值与服务端 `AGENT_API_KEY` 环境变量一致。"
    ),
)
@limiter.limit("30/minute")
async def create_chart(
    request: Request,
    payload: CreateChartRequest,
    db: AsyncSession = Depends(get_db),
    api_key: ApiKey = Depends(verify_api_key_and_deduct),
):
    """Agent 调用此接口创建一张可分享的只读图表"""
    chart_uuid = str(uuid_lib.uuid4())

    record = SharedChart(
        uuid=chart_uuid,
        chart_type=payload.chartType,
        title=payload.title,
        labels=payload.labels,
        datasets=[ds.model_dump() for ds in payload.datasets],
        theme=payload.theme,
    )
    db.add(record)
    await db.commit()

    share_url = f"{settings.frontend_base_url}/share/{chart_uuid}"
    logger.info("Agent 图表已创建：uuid=%s  url=%s", chart_uuid, share_url)

    return CreateChartResponse(uuid=chart_uuid, shareUrl=share_url)


@router.get(
    "/chart/{uuid}",
    response_model=SharedChartResponse,
    summary="[公开] 获取共享图表数据",
    description=(
        "无需鉴权。前端 `/share/:uuid` 只读页面通过此接口拉取图表数据。\n\n"
        "如果 UUID 不存在，返回 404。"
    ),
)
async def get_chart(uuid: str, db: AsyncSession = Depends(get_db)):
    """前端只读页面拉取图表数据，无需 API Key"""
    result = await db.execute(
        select(SharedChart).where(SharedChart.uuid == uuid)
    )
    chart = result.scalar_one_or_none()

    if not chart:
        raise HTTPException(status_code=404, detail=f"图表不存在：{uuid}")

    return SharedChartResponse(
        uuid=chart.uuid,
        chartType=chart.chart_type,
        title=chart.title,
        labels=chart.labels,
        datasets=[DatasetItemOut(**ds) for ds in chart.datasets],
        theme=chart.theme,
        created_at=chart.created_at,
    )


# ========== 图表截图接口 ==========


@router.get(
    "/chart/{uuid}/image",
    summary="[鉴权] 获取图表高清截图",
    description=(
        "通过 ECharts SSR 引擎生成图表 SVG，再由 Cairo 转为高清 PNG 图片。\n\n"
        "**鉴权要求**：请求头必须携带 `X-API-Key`。\n"
        "**扣费**：成功后自动扣减 1 次额度。\n"
        "**性能**：~100ms（vs 旧版 Playwright 3-5s）。"
    ),
    responses={
        200: {"content": {"image/png": {}}, "description": "图表 PNG 截图"},
        401: {"description": "API Key 无效"},
        402: {"description": "额度不足"},
        404: {"description": "图表不存在"},
        500: {"description": "渲染失败"},
    },
)
@limiter.limit("10/minute")
async def get_chart_image(
    request: Request,
    uuid: str,
    db: AsyncSession = Depends(get_db),
    api_key: ApiKey = Depends(verify_api_key_and_deduct),
):
    """ECharts SSR 渲染 → SVG → cairosvg → 高清 PNG"""

    # 1. 验证图表存在
    result = await db.execute(
        select(SharedChart).where(SharedChart.uuid == uuid)
    )
    chart = result.scalar_one_or_none()
    if not chart:
        raise HTTPException(status_code=404, detail=f"图表不存在：{uuid}")

    # 2. 构造渲染请求（原始数据直传 Node SSR，由 JS 端构建 option）
    chart_data = {
        "chartType": chart.chart_type,
        "title": chart.title,
        "labels": chart.labels,
        "datasets": chart.datasets,  # [{name, values}, ...]
    }
    # 如果有自定义主题颜色，传入
    if chart.theme and isinstance(chart.theme, dict):
        chart_data["colors"] = chart.theme.get("colors")

    # 3. 调用 Node.js SSR 微服务，获取 SVG
    # Docker 内网用 ssr-service:3100，本地开发用 localhost:3100
    ssr_url = getattr(settings, "ssr_service_url", "http://localhost:3100")
    logger.info("SSR 渲染：uuid=%s → %s/render", uuid, ssr_url)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{ssr_url}/render",
                json={"chartData": chart_data, "width": 1200, "height": 800},
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail=f"SSR 服务返回错误：{resp.status_code} {resp.text[:200]}",
                )
            svg_bytes = resp.content

    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="SSR 渲染服务不可用，请确认 ssr-service 已启动",
        )
    except Exception as e:
        logger.error("SSR 调用失败：%s", str(e))
        raise HTTPException(status_code=500, detail=f"SSR 渲染失败：{str(e)}")

    # 4. SVG → PNG（2x 高清，Cairo 引擎渲染，字体由 Python 容器提供）
    #    Windows 开发环境缺少 libcairo，自动降级返回 SVG；Docker 生产环境必有 Cairo
    png_bytes = None
    try:
        import cairosvg
        png_bytes = cairosvg.svg2png(
            bytestring=svg_bytes,
            output_width=2400,   # 1200 × 2 = 2x 高清
            output_height=1600,  # 800 × 2
        )
    except (ImportError, OSError) as e:
        # Windows 本地没有 libcairo-2.dll，降级返回 SVG
        logger.warning("Cairo 不可用（%s），降级返回 SVG", str(e)[:60])
    except Exception as e:
        logger.error("SVG→PNG 转换失败：%s", str(e))
        raise HTTPException(status_code=500, detail=f"PNG 转换失败：{str(e)}")

    if png_bytes:
        media = "image/png"
        content = png_bytes
        filename = f"chart_{uuid}.png"
    else:
        # 降级：直接返回 SVG（Windows 开发环境）
        media = "image/svg+xml"
        content = svg_bytes
        filename = f"chart_{uuid}.svg"

    logger.info(
        "图表直出成功：uuid=%s  格式=%s  大小=%d bytes  客户=%s",
        uuid, media.split("/")[1], len(content), api_key.customer_name,
    )

    # 5. 返回图片
    return Response(
        content=content,
        media_type=media,
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Cache-Control": "no-cache",
        },
    )
