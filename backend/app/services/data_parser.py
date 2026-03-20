"""
数据解析服务
负责将上传的 Excel / CSV 文件解析为结构化的图表数据。
纯 Pandas 驱动，不依赖任何 AI 模型。

核心策略：
  1. 读取表格 → 自动识别「标签列」和「数值列」
  2. 第一个非数值列作为 labels（X 轴分类标签）
  3. 所有数值列作为 datasets（数据系列）
  4. 根据数据特征自动推荐图表类型
"""

import logging

import pandas as pd

logger = logging.getLogger(__name__)


def read_file_to_dataframe(file_path: str, content_type: str) -> pd.DataFrame:
    """
    根据文件类型将文件读取为 Pandas DataFrame。

    Args:
        file_path: 文件本地路径
        content_type: 文件的 MIME 类型

    Returns:
        解析后的 DataFrame

    Raises:
        ValueError: 文件格式不支持或读取失败
    """
    try:
        if content_type == "text/csv" or file_path.lower().endswith(".csv"):
            # CSV 文件：尝试多种编码
            for encoding in ["utf-8", "gbk", "gb2312", "latin-1"]:
                try:
                    df = pd.read_csv(file_path, encoding=encoding)
                    logger.info("CSV 文件使用 %s 编码读取成功", encoding)
                    return df
                except UnicodeDecodeError:
                    continue
            raise ValueError("CSV 文件编码无法识别，请使用 UTF-8 或 GBK 编码")

        elif (
            content_type
            == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            or file_path.lower().endswith(".xlsx")
        ):
            # Excel .xlsx 文件
            df = pd.read_excel(file_path, engine="openpyxl")
            logger.info("Excel (.xlsx) 文件读取成功")
            return df

        elif (
            content_type == "application/vnd.ms-excel"
            or file_path.lower().endswith(".xls")
        ):
            # 旧版 Excel .xls 文件
            raise ValueError(
                "不支持旧版 .xls 格式，请将文件另存为 .xlsx 后重新上传"
            )

        else:
            raise ValueError(
                f"不支持的文件格式：{content_type}。仅支持 Excel (.xlsx) 和 CSV (.csv) 文件"
            )

    except ValueError:
        raise  # 直接向上抛出已知的 ValueError
    except Exception as e:
        logger.error("文件读取异常：%s", str(e))
        raise ValueError(f"文件读取失败：{e}")


def infer_chart_type(df: pd.DataFrame, label_col: str, numeric_cols: list[str]) -> str:
    """
    根据数据特征自动推荐最合适的图表类型。

    推荐规则：
      - 只有 1 个数值列 且 行数 ≤ 8 → 饼图（适合展示占比）
      - 其他情况 → 柱状图（通用性最强）

    Args:
        df: 数据表
        label_col: 标签列名
        numeric_cols: 数值列名列表

    Returns:
        图表类型字符串：'bar' | 'pie' | 'line'
    """
    row_count = len(df)
    col_count = len(numeric_cols)

    # 单数值列 + 少量分类 → 饼图更直观
    if col_count == 1 and row_count <= 8:
        return "pie"

    # 默认使用柱状图
    return "bar"


def parse_to_chart_data(file_path: str, content_type: str) -> dict:
    """
    核心解析函数：将表格文件转换为前端所需的图表 JSON 数据。

    处理流程：
      1. 读取文件为 DataFrame
      2. 清洗数据（去除全空行/列）
      3. 自动识别标签列和数值列
      4. 组装标准化的图表 JSON

    Args:
        file_path: 文件本地路径
        content_type: 文件 MIME 类型

    Returns:
        符合 ChartData 结构的字典

    Raises:
        ValueError: 数据不符合要求时抛出
    """
    # 第一步：读取文件
    df = read_file_to_dataframe(file_path, content_type)

    # 第二步：基础数据清洗
    df = df.dropna(how="all")  # 删除全空行
    df = df.dropna(axis=1, how="all")  # 删除全空列

    if df.empty:
        raise ValueError("文件中没有有效数据，请检查文件内容")

    if len(df) > 100:
        logger.warning("数据行数超过 100，仅取前 100 行进行可视化")
        df = df.head(100)

    # 第三步：自动识别列类型
    # 分离数值列和非数值列
    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    non_numeric_cols = df.select_dtypes(exclude=["number"]).columns.tolist()

    if not numeric_cols:
        raise ValueError(
            "文件中未找到任何数值列，无法生成图表。请确保表格中包含数值数据"
        )

    # 第四步：确定标签列
    if non_numeric_cols:
        # 取第一个非数值列作为标签列
        label_col = non_numeric_cols[0]
        labels = df[label_col].astype(str).tolist()
    else:
        # 全是数值列 → 用行号作为标签
        label_col = "index"
        labels = [f"第{i+1}行" for i in range(len(df))]

    # 第五步：组装数据系列
    datasets = []
    for col in numeric_cols:
        # 将 NaN 替换为 0，确保前端渲染不出错
        values = df[col].fillna(0).tolist()
        # 将 numpy 类型转为 Python 原生类型，确保 JSON 序列化正常
        values = [
            int(v) if isinstance(v, (int,)) or (isinstance(v, float) and v == int(v))
            else round(float(v), 2)
            for v in values
        ]
        datasets.append({"name": str(col), "values": values})

    # 第六步：推荐图表类型
    chart_type = infer_chart_type(df, label_col, numeric_cols)

    # 第七步：生成标题
    if label_col != "index":
        title = f"{label_col}数据概览"
    else:
        title = "数据概览"

    logger.info(
        "数据解析完成 → 标签列: %s, 数值列: %s, 图表类型: %s",
        label_col,
        numeric_cols,
        chart_type,
    )

    return {
        "chartType": chart_type,
        "title": title,
        "labels": labels,
        "datasets": datasets,
    }
