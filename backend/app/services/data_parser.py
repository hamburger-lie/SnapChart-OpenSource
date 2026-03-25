"""
数据解析服务（升级版 v2）
负责将上传的 Excel / CSV 文件解析为结构化的图表数据。

核心升级：
  1. .xls 格式支持（xlrd 引擎）
  2. CSV 多编码自动降级（utf-8 → gbk → gb18030 → latin-1）
  3. "伪数值"黑名单过滤（学号、身份证等不应被绘图的数字列）
  4. 智能标签列识别（优先寻找姓名/名称/项目等语义列）
"""

import logging
import re

import pandas as pd

logger = logging.getLogger(__name__)

# ========== 配置常量 ==========

# 伪数值黑名单：列名包含以下关键字时，即使是数值列也不纳入数据集
_PSEUDO_NUMERIC_KEYWORDS: list[str] = [
    "学号", "序号", "编号", "工号", "学籍",
    "ID", "id", "Id",
    "电话", "手机", "联系",
    "身份证", "证件", "证号",
    "邮编", "邮政",
    "房间号", "座位",
]

# 标签列优先关键字：含有这些词的列优先作为 X 轴标签
_LABEL_PREFERRED_KEYWORDS: list[str] = [
    "姓名", "名称", "名字",
    "项目", "科目", "学科",
    "班级", "年级", "部门", "组",
    "类别", "类型", "类",
    "地区", "城市", "省",
]


def _is_pseudo_numeric(col_name: str) -> bool:
    """判断列名是否属于伪数值黑名单"""
    col_str = str(col_name)
    return any(kw in col_str for kw in _PSEUDO_NUMERIC_KEYWORDS)


def _find_label_col(non_numeric_cols: list[str], all_cols: list[str]) -> str | None:
    """
    智能寻找最合适的标签列。
    优先级：
      1. 非数值列中包含优先关键字的列
      2. 任意第一个非数值列
      3. None（全数值表）
    """
    # 优先：非数值列中有语义关键字的
    for col in non_numeric_cols:
        if any(kw in str(col) for kw in _LABEL_PREFERRED_KEYWORDS):
            logger.debug("标签列（语义匹配）：%s", col)
            return col

    # 次选：第一个非数值列
    if non_numeric_cols:
        logger.debug("标签列（首个非数值列）：%s", non_numeric_cols[0])
        return non_numeric_cols[0]

    return None


def read_file_to_dataframe(file_path: str, content_type: str) -> pd.DataFrame:
    """
    根据文件类型/扩展名将文件读取为 Pandas DataFrame。

    Args:
        file_path: 文件本地路径
        content_type: 文件的 MIME 类型（辅助判断）

    Returns:
        解析后的 DataFrame

    Raises:
        ValueError: 格式不支持或读取失败
    """
    path_lower = file_path.lower()

    try:
        # ---- CSV ----
        if path_lower.endswith(".csv") or content_type == "text/csv":
            # 国内导出文件常用 GBK，依次降级尝试
            for encoding in ["utf-8", "gbk", "gb18030", "latin-1"]:
                try:
                    df = pd.read_csv(file_path, encoding=encoding)
                    logger.info("CSV 读取成功，编码：%s", encoding)
                    return df
                except UnicodeDecodeError:
                    continue
            raise ValueError("CSV 文件编码无法识别，请使用 UTF-8 或 GBK 编码保存后重新上传")

        # ---- .xlsx ----
        elif path_lower.endswith(".xlsx") or content_type == (
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ):
            df = pd.read_excel(file_path, engine="openpyxl")
            logger.info("Excel (.xlsx) 读取成功")
            return df

        # ---- .xls（老版本 Excel）----
        elif path_lower.endswith(".xls") or content_type == "application/vnd.ms-excel":
            # xlrd >= 2.0 仅支持 .xls，不支持 .xlsx，正好符合需求
            df = pd.read_excel(file_path, engine="xlrd")
            logger.info("Excel (.xls) 读取成功（xlrd 引擎）")
            return df

        else:
            raise ValueError(
                f"不支持的文件格式（{content_type}）。"
                "请上传 Excel (.xlsx / .xls) 或 CSV (.csv) 文件"
            )

    except ValueError:
        raise
    except Exception as e:
        logger.error("文件读取异常：%s", str(e), exc_info=True)
        raise ValueError(f"文件读取失败：{e}")


def infer_chart_type(numeric_cols_count: int, row_count: int) -> str:
    """
    根据数据规模推荐最合适的图表类型。

    规则：
      - 单数值列 + 行数 ≤ 8 → 饼图（展示占比）
      - 其他            → 柱状图（通用性最强）
    """
    if numeric_cols_count == 1 and row_count <= 8:
        return "pie"
    return "bar"


def parse_to_chart_data(file_path: str, content_type: str) -> dict:
    """
    核心解析函数：将表格文件转换为前端所需的图表 JSON。

    处理流程：
      1. 读取文件 → DataFrame
      2. 基础清洗（去空行/列）
      3. 过滤伪数值列（黑名单）
      4. 智能识别标签列（语义优先）
      5. 组装标准化图表 JSON
      6. 推荐图表类型

    Args:
        file_path: 本地临时文件路径
        content_type: MIME 类型

    Returns:
        ChartData 格式的字典

    Raises:
        ValueError: 数据不满足绘图条件
    """
    # ── 第一步：读取文件 ──────────────────────────────────────────────
    df = read_file_to_dataframe(file_path, content_type)

    # ── 第二步：基础清洗 ──────────────────────────────────────────────
    df = df.dropna(how="all")           # 删除全空行
    df = df.dropna(axis=1, how="all")   # 删除全空列

    if df.empty:
        raise ValueError("文件中没有有效数据，请检查文件内容")

    if len(df) > 100:
        logger.warning("数据行数 %d 超过上限，仅取前 100 行", len(df))
        df = df.head(100)

    # ── 第二步半：智能清洗表头 ─────────────────────────────────────────
    # 去除括号及里面的说明文字，去除换行符和多余空白
    def clean_col_name(name: str) -> str:
        if not isinstance(name, str):
            return str(name)
        # 移除中文或英文括号及其内部的全部内容
        name = re.sub(r'[\(（].*?[\)）]', '', name)
        # 移除换行符、回车符和所有空白字符
        name = re.sub(r'\s+', '', name)
        return name

    df.rename(columns=clean_col_name, inplace=True)
    logger.info("表头清洗后列名：%s", df.columns.tolist())

    # ── 第三步：识别原始列类型 ─────────────────────────────────────────
    all_numeric_cols: list[str] = df.select_dtypes(include=["number"]).columns.tolist()
    non_numeric_cols: list[str] = df.select_dtypes(exclude=["number"]).columns.tolist()

    # ── 第四步：过滤伪数值列（黑名单） ───────────────────────────────────
    # 黑名单列移出数值列，但保留在原 DataFrame 中（可能作为标签列备用）
    pseudo_cols: list[str] = [c for c in all_numeric_cols if _is_pseudo_numeric(c)]
    real_numeric_cols: list[str] = [c for c in all_numeric_cols if not _is_pseudo_numeric(c)]

    if pseudo_cols:
        logger.info(
            "已过滤伪数值列（共 %d 列）：%s",
            len(pseudo_cols),
            pseudo_cols,
        )

    if not real_numeric_cols:
        raise ValueError(
            "文件中未找到可用的数值列，无法生成图表。\n"
            "提示：如果所有数值列都是学号/编号等标识性字段，请确认文件中包含真实的统计数据列（如成绩、金额、数量等）"
        )

    # ── 第五步：智能确定标签列 ─────────────────────────────────────────
    # 标签列候选：非数值列 + 被过滤掉的伪数值列（如"学号"可转为字符串标签）
    label_candidates = non_numeric_cols + pseudo_cols

    if label_candidates:
        # 智能寻找最具区分度的文本列作为 X 轴（比如"姓名"而非"班级"）
        # 优先：语义关键字匹配的列
        label_col = _find_label_col(label_candidates, df.columns.tolist())

        if not label_col:
            # 兜底：取唯一值最多的列（信息熵最高）
            best_col = label_candidates[0]
            max_unique = -1
            for col in label_candidates:
                unique_count = df[col].nunique()
                if unique_count > max_unique:
                    max_unique = unique_count
                    best_col = col
            label_col = best_col
        else:
            # 语义匹配到了，但如果匹配的列区分度极低（如全是同一个班级名），
            # 则切换到唯一值最多的列
            matched_unique = df[label_col].nunique()
            best_col = label_col
            max_unique = matched_unique
            for col in label_candidates:
                unique_count = df[col].nunique()
                if unique_count > max_unique:
                    max_unique = unique_count
                    best_col = col
            if max_unique > matched_unique * 2:
                logger.info("语义列 '%s' 区分度不足（%d），切换为 '%s'（%d）",
                            label_col, matched_unique, best_col, max_unique)
                label_col = best_col

        labels = df[label_col].astype(str).tolist()
        logger.info("标签列：%s（共 %d 项，唯一值 %d）", label_col, len(labels), df[label_col].nunique())
    else:
        # 全是有效数值列 → 用行号兜底
        label_col = "__index__"
        labels = [f"第{i + 1}行" for i in range(len(df))]
        logger.info("未找到文本标签列，使用行号作为标签")

    # ── 第六步：组装数据系列 ───────────────────────────────────────────
    datasets: list[dict] = []
    for col in real_numeric_cols:
        raw_values = df[col].fillna(0).tolist()
        # 将 numpy 原生类型统一转为 Python 原生类型，避免 JSON 序列化报错
        values = [
            int(v) if (isinstance(v, float) and v == int(v)) else round(float(v), 4)
            for v in raw_values
        ]
        datasets.append({"name": str(col), "values": values})

    # ── 第七步：推荐图表类型 ───────────────────────────────────────────
    chart_type = infer_chart_type(len(real_numeric_cols), len(df))

    # ── 第八步：生成标题 ───────────────────────────────────────────────
    title = f"{label_col}数据概览" if label_col != "__index__" else "数据概览"

    logger.info(
        "解析完成 → 图表类型: %s | 标签列: %s | 数值列(%d): %s",
        chart_type,
        label_col,
        len(real_numeric_cols),
        real_numeric_cols,
    )

    return {
        "chartType": chart_type,
        "title": title,
        "labels": labels,
        "datasets": datasets,
    }
