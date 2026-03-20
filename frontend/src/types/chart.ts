/**
 * 图表数据类型定义
 * 与后端 API 契约严格对齐，确保前后端类型一致
 */

/** 单个数据系列 */
export interface DatasetItem {
  name: string;     // 系列名称，如 "销量"
  values: number[]; // 数值列表，与 labels 一一对应
}

/** 图表核心数据结构（后端返回） */
export interface ChartData {
  chartType: "bar" | "line" | "pie"; // 后端推荐的图表类型
  title: string;                      // 图表标题
  labels: string[];                   // X 轴标签或饼图分类
  datasets: DatasetItem[];            // 数据系列列表
}

/** 上传成功的响应结构 */
export interface ChartResponse {
  status: "success";
  data: ChartData;
}

/** 上传失败的响应结构 */
export interface ErrorResponse {
  status: "error";
  message: string;
  detail?: string;
}

/** 页面状态枚举 */
export type AppStatus = "idle" | "uploading" | "success" | "error";

/** 前端支持的所有图表类型（比后端更丰富） */
export type DisplayChartType = "bar" | "line" | "stackedArea" | "pie" | "scatter";

/** 色彩主题标识 */
export type ColorThemeId = "business" | "vibrant" | "morandi" | "ocean";

/** 色彩主题配置 */
export interface ColorTheme {
  id: ColorThemeId;
  name: string;
  colors: string[];
}
