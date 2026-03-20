"""
数据模型定义
定义前后端通信的 JSON 数据结构，确保 API 契约的严格性与强类型约束。
"""

from pydantic import BaseModel, Field


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
