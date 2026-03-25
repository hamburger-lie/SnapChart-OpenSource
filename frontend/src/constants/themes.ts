/**
 * 主题注册中心
 * 包含纯色彩方案 + ECharts 完整主题对象（坐标轴/网格/文字等全局接管）
 */

import type { ColorTheme } from "../types/chart";
import { macaronsTheme } from "../themes/macarons";
import { vintageTheme } from "../themes/vintage";
import { echartsDarkTheme } from "../themes/echarts-dark";
import { brandProTheme } from "../themes/brand-pro";
import { darkTechTheme } from "../themes/dark-tech";

// ========== 纯色彩方案（向后兼容） ==========

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: "business",
    name: "商务科技",
    colors: ["#2563eb", "#0891b2", "#0d9488", "#475569", "#64748b", "#7c3aed", "#059669", "#0e7490"],
  },
  {
    id: "vibrant",
    name: "活力多巴胺",
    colors: ["#ef4444", "#f59e0b", "#8b5cf6", "#22c55e", "#ec4899", "#06b6d4", "#f97316", "#6366f1"],
  },
  {
    id: "morandi",
    name: "莫兰迪柔和",
    colors: ["#8d9db6", "#b8a9c9", "#d4a5a5", "#a8c3a0", "#c9b99a", "#9ab7c4", "#c4a882", "#a0b4a3"],
  },
  {
    id: "ocean",
    name: "深海渐变",
    colors: ["#0c4a6e", "#0369a1", "#0284c7", "#0ea5e9", "#38bdf8", "#7dd3fc", "#155e75", "#164e63"],
  },
];

// ========== 完整 ECharts 主题对象 ==========

export interface FullTheme {
  id: string;
  name: string;
  colors: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  themeObject: Record<string, any>;
}

export const FULL_THEMES: FullTheme[] = [
  {
    id: "brand-pro",
    name: "麦肯锡商务灰",
    colors: brandProTheme.color as string[],
    themeObject: brandProTheme,
  },
  {
    id: "dark-tech",
    name: "暗黑科技",
    colors: darkTechTheme.color as string[],
    themeObject: darkTechTheme,
  },
  {
    id: "macarons",
    name: "马卡龙",
    colors: (macaronsTheme.color as string[]).slice(0, 8),
    themeObject: macaronsTheme,
  },
  {
    id: "vintage",
    name: "复古经典",
    colors: vintageTheme.color as string[],
    themeObject: vintageTheme,
  },
  {
    id: "echarts-dark",
    name: "官方暗黑",
    colors: echartsDarkTheme.color as string[],
    themeObject: echartsDarkTheme,
  },
];

// ========== 合并：所有可用主题 ==========

export const ALL_THEMES = [
  ...COLOR_THEMES.map((t) => ({ ...t, themeObject: null as FullTheme["themeObject"] | null })),
  ...FULL_THEMES.map((t) => ({ ...t })),
];

// ========== 主题注册函数（在 EditableChart 模块初始化时调用一次） ==========

let _registered = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerAllThemes(echarts: any) {
  if (_registered) return;
  for (const t of FULL_THEMES) {
    echarts.registerTheme(t.id, t.themeObject);
  }
  _registered = true;
}
