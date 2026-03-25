"""
图表生成路由
处理 Excel/CSV 文件上传、数据解析和图表配置生成的核心业务路由。
"""

import logging
import os
import uuid

from fastapi import APIRouter, HTTPException, Request, UploadFile

from app.config import settings
from app.rate_limit import limiter
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
