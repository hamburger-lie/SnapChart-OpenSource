"""
图表生成路由
处理 Excel/CSV 文件上传、数据解析和图表配置生成的核心业务路由。
新增 /api/render-chart：鉴权保护的 SSR 图表直出端点。
"""

import logging
import math
import os
import uuid
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field, field_validator

from app.config import settings
from app.rate_limit import limiter
from app.dependencies import verify_api_key, deduct_credit
from app.models.schemas import ChartResponse, ErrorResponse
from app.services.data_parser import parse_to_chart_data

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["图表生成"])

# 允许的文件 MIME 类型白名单
ALLOWED_CONTENT_TYPES = {
    # Excel .xlsx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    # CSV
    "text/csv",
    # 某些系统对 CSV 的 MIME 识别不同
    "application/vnd.ms-excel",
    # 部分浏览器上传 CSV 时会标记为 application/octet-stream
    "application/octet-stream",
}

# 允许的文件扩展名（作为二次校验，含老版本 .xls）
ALLOWED_EXTENSIONS = {".xlsx", ".xls", ".csv"}


@router.post(
    "/upload-and-parse",
    response_model=ChartResponse,
    responses={
        400: {"model": ErrorResponse, "description": "请求参数错误"},
        422: {"model": ErrorResponse, "description": "文件处理失败"},
        500: {"model": ErrorResponse, "description": "服务器内部错误"},
    },
    summary="上传表格文件并解析为图表数据",
    description="上传 Excel (.xlsx) 或 CSV (.csv) 文件，系统自动提取数据并返回结构化的图表 JSON 配置。",
)
@limiter.limit("10/minute")
async def upload_and_parse(request: Request, file: UploadFile):
    """
    核心接口：上传表格 → 解析数据 → 返回图表 JSON

    处理流程：
      1. 校验文件类型和大小
      2. 保存文件到临时目录
      3. 调用 Pandas 解析表格数据
      4. 返回标准化的图表 JSON
    """

    # ========== 第一步：文件类型校验 ==========
    file_ext = os.path.splitext(file.filename or "unknown")[1].lower()

    # 优先以扩展名判断（更可靠），MIME 类型作为辅助
    if file_ext not in ALLOWED_EXTENSIONS:
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件格式：{file_ext}（{file.content_type}）。仅支持 Excel (.xlsx) 和 CSV (.csv) 文件",
            )

    # ========== 第二步：文件大小校验 ==========
    content = await file.read()

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="上传的文件为空")

    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"文件大小超过限制（最大 {settings.max_file_size_mb}MB）",
        )

    # ========== 第三步：保存临时文件 ==========
    temp_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(settings.upload_dir, temp_filename)

    try:
        os.makedirs(settings.upload_dir, exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(content)
        logger.info("文件已保存：%s（原始文件名：%s）", temp_filename, file.filename)
    except OSError as e:
        logger.error("文件保存失败：%s", str(e))
        raise HTTPException(status_code=500, detail="文件保存失败，请稍后重试")

    # ========== 第四步：解析数据并生成图表配置 ==========
    try:
        chart_data = parse_to_chart_data(file_path, file.content_type or "")
        logger.info("数据解析成功，图表类型：%s", chart_data.get("chartType"))
    except ValueError as e:
        # 业务校验错误（如无数值列、空数据等）
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        # 未知异常兜底
        logger.error("数据解析异常：%s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"数据解析时发生内部错误：{e}")
    finally:
        # 无论成功失败，都清理临时文件
        _cleanup_temp_file(file_path)

    # ========== 第五步：返回标准化响应 ==========
    return ChartResponse(status="success", data=chart_data)


def _cleanup_temp_file(file_path: str) -> None:
    """安全删除临时文件"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.debug("临时文件已清理：%s", file_path)
    except OSError as e:
        logger.warning("临时文件清理失败：%s", str(e))


# ================================================================
# SSR 图表直出端点（鉴权 + 计费）
# ================================================================


class RenderDataset(BaseModel):
    """数据系列（含数据清洗）"""
    name: str = Field(default="", description="系列名称，缺省自动补齐")
    values: list[float | None] = Field(..., description="数值列表，null/NaN 自动清洗为 0")

    @field_validator("values", mode="before")
    @classmethod
    def sanitize_values(cls, v: Any) -> list[float]:
        """清洗脏数据：null → 0, NaN → 0, 非数字 → 0"""
        cleaned = []
        for item in v:
            if item is None:
                cleaned.append(0.0)
            elif isinstance(item, (int, float)):
                cleaned.append(0.0 if math.isnan(item) or math.isinf(item) else float(item))
            else:
                cleaned.append(0.0)
        return cleaned


class RenderChartRequest(BaseModel):
    """直出图表的请求体"""
    chartType: str = Field(
        ...,
        description="图表类型：bar / line / pie / radar / funnel / gauge / heatmap / treemap / sankey / sunburst / candlestick / barLine / waterfall 等",
        examples=["radar"],
    )
    title: str = Field(..., min_length=1, max_length=200, description="图表标题")
    labels: list[str] = Field(default_factory=list, description="X轴标签或分类")
    datasets: list[RenderDataset] = Field(default_factory=list, description="数据系列列表")
    colors: list[str] | None = Field(default=None, description="自定义配色列表")
    theme: str | None = Field(default=None, description="内置主题名称，如 brand-pro / dark-tech")
    rawOption: dict[str, Any] | None = Field(default=None, description="特殊图表的原始 ECharts option（sankey/sunburst）")
    width: int = Field(default=1200, ge=200, le=4000, description="图表宽度(px)")
    height: int = Field(default=800, ge=200, le=3000, description="图表高度(px)")


@router.post(
    "/render-chart",
    summary="[鉴权] SSR 图表直出",
    description=(
        "接收图表 JSON 数据，通过 ECharts SSR 引擎渲染为高清 PNG 图片。\n\n"
        "**鉴权要求**：请求头必须携带 `Authorization: Bearer <token>` 或 `X-API-Key`。\n"
        "**计费**：每次成功渲染扣减 1 次额度。\n\n"
        "支持 21 种图表类型，包括 radar、funnel、gauge、heatmap、treemap、"
        "sankey、sunburst、candlestick、barLine、waterfall 等。"
    ),
    responses={
        200: {"content": {"image/png": {}}, "description": "图表 PNG 图片"},
        401: {"description": "API Key 无效"},
        500: {"description": "渲染失败"},
    },
)
@limiter.limit("30/minute")
async def render_chart(
    request: Request,
    payload: RenderChartRequest,
    api_key: str = Depends(verify_api_key),
):
    """
    鉴权保护的图表直出接口：
    JSON → Node.js SSR 渲染 SVG → cairosvg 转 PNG → 返回二进制图片流
    """

    # 0. 数据清洗：对齐 labels 与 datasets.values 长度，补齐缺省名称
    label_len = len(payload.labels)
    sanitized_datasets = []
    for i, ds in enumerate(payload.datasets):
        name = ds.name.strip() if ds.name.strip() else f"系列{i + 1}"
        values = [float(v) if v is not None else 0.0 for v in ds.values]
        # 截断或补零：使 values 长度与 labels 对齐
        if label_len > 0:
            if len(values) > label_len:
                values = values[:label_len]
            elif len(values) < label_len:
                values = values + [0.0] * (label_len - len(values))
        sanitized_datasets.append({"name": name, "values": values})
        if len(ds.values) != label_len or ds.name != name:
            logger.info(
                "[Sanitizer] 数据清洗：ds[%d] name=%r→%r, values长度 %d→%d",
                i, ds.name, name, len(ds.values), len(values),
            )

    # 1. 构造发送给 SSR 微服务的数据
    chart_data: dict[str, Any] = {
        "chartType": payload.chartType,
        "title": payload.title,
        "labels": payload.labels,
        "datasets": sanitized_datasets,
    }
    if payload.colors:
        chart_data["colors"] = payload.colors
    if payload.theme:
        chart_data["theme"] = payload.theme
    if payload.rawOption:
        chart_data["rawOption"] = payload.rawOption

    # 2. 调用 Node.js SSR 微服务
    ssr_url = settings.ssr_service_url
    logger.info("[RenderChart] 请求 SSR 渲染：type=%s  title=%s", payload.chartType, payload.title)

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{ssr_url}/render",
                json={
                    "chartData": chart_data,
                    "width": payload.width,
                    "height": payload.height,
                },
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail=f"SSR 服务返回错误：{resp.status_code} — {resp.text[:300]}",
                )
            svg_bytes = resp.content
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="SSR 渲染服务不可用，请确认 ssr-service 已启动（端口 3100）",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("[RenderChart] SSR 调用异常：%s", str(e))
        raise HTTPException(status_code=500, detail=f"SSR 渲染失败：{str(e)}")

    # 3. SVG → PNG（2x 高清），Windows 无 Cairo 时降级返回 SVG
    png_bytes = None
    try:
        import cairosvg
        png_bytes = cairosvg.svg2png(
            bytestring=svg_bytes,
            output_width=payload.width * 2,
            output_height=payload.height * 2,
        )
    except (ImportError, OSError) as e:
        logger.warning("[RenderChart] Cairo 不可用（%s），降级返回 SVG", str(e)[:60])
    except Exception as e:
        logger.error("[RenderChart] SVG→PNG 转换失败：%s", str(e))
        raise HTTPException(status_code=500, detail=f"PNG 转换失败：{str(e)}")

    # 4. 计费扣减
    remaining = deduct_credit(api_key)

    if png_bytes:
        media = "image/png"
        content = png_bytes
        ext = "png"
    else:
        media = "image/svg+xml"
        content = svg_bytes
        ext = "svg"

    logger.info(
        "[RenderChart] 渲染成功：type=%s  format=%s  size=%d bytes  remaining_credits=%d",
        payload.chartType, ext, len(content), remaining,
    )

    return Response(
        content=content,
        media_type=media,
        headers={
            "Content-Disposition": f'inline; filename="chart.{ext}"',
            "X-Credits-Remaining": str(remaining),
            "Cache-Control": "no-cache",
        },
    )
