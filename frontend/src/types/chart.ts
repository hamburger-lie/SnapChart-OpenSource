/**
 * 图表数据类型定义
 * 与后端 API 契约严格对齐，确保前后端类型一致
 */

/** 单个数据系列 */
export interface DatasetItem {
  name: string;
  values: number[];
}

/** 图表核心数据结构（后端返回） */
export interface ChartData {
  chartType: "bar" | "line" | "pie";
  title: string;
  labels: string[];
  datasets: DatasetItem[];
}

/** 上传成功的响应 */
export interface ChartResponse {
  status: "success";
  data: ChartData;
}

/** 上传失败的响应 */
export interface ErrorResponse {
  status: "error";
  message: string;
  detail?: string;
}

/** 页面状态 */
export type AppStatus = "idle" | "uploading" | "success" | "error";

/** 前端支持的所有图表类型（含子类型） */
export type DisplayChartType =
  | "bar" | "stackedBar" | "negativeBar" | "barLine" | "waterfall"
  | "line" | "smoothLine" | "gradientArea" | "stackedArea"
  | "pie" | "doughnut" | "rose"
  | "scatter"
  | "radar"
  | "funnel" | "gauge" | "heatmap" | "treemap"
  | "sankey" | "sunburst" | "candlestick";

/** 图表大类（用于模板分组） */
export type ChartCategory = "bar" | "line" | "pie" | "scatter" | "radar" | "advanced";

/** 色彩主题标识 */
export type ColorThemeId = "business" | "vibrant" | "morandi" | "ocean";

/** 色彩主题配置 */
export interface ColorTheme {
  id: ColorThemeId;
  name: string;
  colors: string[];
}

/** 样式创建请求 */
export interface StyleCreate {
  name: string;
  chart_type: string;
  echarts_option: Record<string, unknown>;
  data_snapshot?: Record<string, unknown> | null;
  thumbnail?: string | null;
}

/** 样式完整响应 */
export interface StyleResponse {
  id: string;
  name: string;
  chart_type: string;
  echarts_option: Record<string, unknown>;
  data_snapshot?: Record<string, unknown> | null;
  thumbnail?: string | null;
  created_at: string;
  updated_at: string;
}

/** 样式列表项 */
export interface StyleListItem {
  id: string;
  name: string;
  chart_type: string;
  thumbnail?: string | null;
  updated_at: string;
}

// ========== Agent OpenAPI 共享图表类型 ==========

/** Agent 共享图表的数据系列 */
export interface SharedDatasetItem {
  name: string;
  values: number[];
}

/** GET /api/agent/chart/{uuid} 返回的完整数据 */
export interface SharedChartData {
  uuid: string;
  chartType: string;
  title: string;
  labels: string[];
  datasets: SharedDatasetItem[];
  theme?: { colors?: string[] } | null;
  created_at: string;
}
