"""
数据模型定义
定义前后端通信的 JSON 数据结构，确保 API 契约的严格性与强类型约束。
"""

from datetime import datetime

from pydantic import BaseModel, Field


# ========== 图表数据相关 ==========

class DatasetItem(BaseModel):
    """单个数据系列，例如柱状图中的一组柱子"""

    name: str = Field(..., description="数据系列名称，如 '销量'、'营收'")
    values: list[int | float] = Field(..., description="数值列表，与 labels 一一对应")


class ChartData(BaseModel):
    """图表核心数据结构，由后端解析表格后生成"""

    chartType: str = Field(
        ...,
        description="图表类型：bar（柱状图）、line（折线图）、pie（饼图）",
    )
    title: str = Field(..., description="图表标题")
    labels: list[str] = Field(..., description="X 轴标签或饼图分类标签")
    datasets: list[DatasetItem] = Field(..., description="一个或多个数据系列")


class ChartResponse(BaseModel):
    """上传解析接口的成功响应"""

    status: str = Field(default="success", description="响应状态")
    data: ChartData = Field(..., description="图表数据")


class ErrorResponse(BaseModel):
    """统一错误响应格式"""

    status: str = Field(default="error", description="响应状态")
    message: str = Field(..., description="错误描述信息")
    detail: str | None = Field(default=None, description="详细错误信息（调试用）")


# ========== 自定义样式相关 ==========

class StyleCreate(BaseModel):
    """创建/更新样式的请求体"""

    name: str = Field(..., min_length=1, max_length=100, description="样式名称")
    chart_type: str = Field(..., description="图表类型")
    echarts_option: dict = Field(..., description="ECharts 样式配置（JSON）")
    data_snapshot: dict | None = Field(default=None, description="数据快照（用于预览）")
    thumbnail: str | None = Field(default=None, description="缩略图 base64")


class StyleResponse(BaseModel):
    """单个样式的完整响应"""

    id: str
    name: str
    chart_type: str
    echarts_option: dict
    data_snapshot: dict | None = None
    thumbnail: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StyleListItem(BaseModel):
    """样式列表项（不含完整 option，节省带宽）"""

    id: str
    name: str
    chart_type: str
    thumbnail: str | None = None
    updated_at: datetime

    model_config = {"from_attributes": True}


# ========== 共享图表相关 ==========

class SharedChartCreate(BaseModel):
    """创建共享图表的请求体"""

    chartType: str = Field(..., description="图表类型")
    title: str = Field(..., description="图表标题")
    labels: list = Field(..., description="标签列表")
    datasets: list = Field(..., description="数据系列列表")


class SharedChartResponse(BaseModel):
    """共享图表创建成功的响应"""

    status: str = Field(default="success", description="响应状态")
    uuid: str = Field(..., description="共享图表唯一标识")
    shareUrl: str = Field(..., description="共享访问链接")


# ========== API Key 相关 ==========

class ApiKeyCreate(BaseModel):
    """创建 API Key 的请求体"""

    customer_name: str = Field(..., description="客户名称")
    initial_credits: int = Field(..., description="初始额度")
