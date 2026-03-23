/**
 * 预设色彩主题方案
 * 从原 ChartConfigPanel 中提取为共享常量
 */

import type { ColorTheme } from "../types/chart";

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
