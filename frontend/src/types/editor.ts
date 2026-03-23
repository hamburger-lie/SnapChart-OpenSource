/**
 * 编辑器相关类型定义
 */

/** 标题样式配置 */
export interface TitleStyle {
  fontSize: number;
  fontWeight: number;
  color: string;
}

/** 图例配置 */
export interface LegendConfig {
  show: boolean;
  position: "top" | "bottom" | "left" | "right";
}

/** 网格内边距 */
export interface GridPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** X 轴标签配置 */
export interface XAxisConfig {
  /** 标签最大显示字符数（超出截断+省略号） */
  labelMaxLength: number;
  /** 标签旋转角度 */
  labelRotate: number;
  /** 是否自动旋转（根据标签数量和长度智能决定） */
  autoRotate: boolean;
}

/** Y 轴配置 */
export interface YAxisConfig {
  /** 是否使用对数轴（应对数据悬殊） */
  useLogScale: boolean;
  /** 数值格式化模式：raw=原始值 / smart=智能K/万/亿 / percent=百分比 */
  numberFormat: "raw" | "smart" | "percent";
  /** 自适应缩放：true 时轴不强制从 0 开始，贴近数据真实范围 */
  autoScale: boolean;
  /** 强制最小值（null = 交由 ECharts 自动计算） */
  min: number | null;
  /** 强制最大值（null = 交由 ECharts 自动计算） */
  max: number | null;
}

/** 右侧面板 Tab 类型 */
export type RightPanelTab = "data" | "text" | "size" | "color" | "styles";

/** 可编辑元素类型 */
export type EditableElement = "title" | null;
