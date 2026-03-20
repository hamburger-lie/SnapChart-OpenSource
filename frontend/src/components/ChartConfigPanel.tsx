/**
 * 图表配置面板组件
 * 提供图表类型切换和色彩主题选择，类似 ioDraw 的侧边配置栏
 */

import {
  BarChart3,
  LineChart,
  PieChart,
  Layers,
  CircleDot,
} from "lucide-react";
import type { DisplayChartType, ColorThemeId, ColorTheme } from "../types/chart";

/** 预设色彩主题方案 */
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

/** 图表类型配置列表 */
const CHART_TYPES: { type: DisplayChartType; label: string; icon: React.ReactNode }[] = [
  { type: "bar",         label: "柱状图",     icon: <BarChart3 className="w-4 h-4" /> },
  { type: "line",        label: "折线图",     icon: <LineChart className="w-4 h-4" /> },
  { type: "stackedArea", label: "面积堆叠图", icon: <Layers className="w-4 h-4" /> },
  { type: "pie",         label: "饼图",       icon: <PieChart className="w-4 h-4" /> },
  { type: "scatter",     label: "散点图",     icon: <CircleDot className="w-4 h-4" /> },
];

interface ChartConfigPanelProps {
  /** 当前选中的图表类型 */
  chartType: DisplayChartType;
  /** 当前选中的色彩主题 */
  colorTheme: ColorThemeId;
  /** 图表类型变更回调 */
  onChartTypeChange: (type: DisplayChartType) => void;
  /** 色彩主题变更回调 */
  onColorThemeChange: (theme: ColorThemeId) => void;
}

export default function ChartConfigPanel({
  chartType,
  colorTheme,
  onChartTypeChange,
  onColorThemeChange,
}: ChartConfigPanelProps) {
  return (
    <div className="w-full space-y-6">
      {/* ========== 图表类型选择 ========== */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          图表类型
        </h3>
        <div className="space-y-1.5">
          {CHART_TYPES.map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => onChartTypeChange(type)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 cursor-pointer
                ${
                  chartType === type
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 border border-transparent"
                }
              `}
            >
              <span className={chartType === type ? "text-blue-500" : "text-gray-400"}>
                {icon}
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ========== 色彩主题选择 ========== */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          色彩主题
        </h3>
        <div className="space-y-2">
          {COLOR_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onColorThemeChange(theme.id)}
              className={`
                w-full px-3 py-3 rounded-lg text-left transition-all duration-150 cursor-pointer
                ${
                  colorTheme === theme.id
                    ? "bg-blue-50 border border-blue-200 shadow-sm"
                    : "bg-white border border-gray-200 hover:border-gray-300"
                }
              `}
            >
              {/* 主题名称 */}
              <p className={`text-xs font-medium mb-2 ${
                colorTheme === theme.id ? "text-blue-700" : "text-gray-600"
              }`}>
                {theme.name}
              </p>
              {/* 色块预览条 */}
              <div className="flex gap-1">
                {theme.colors.slice(0, 6).map((color, i) => (
                  <div
                    key={i}
                    className="h-4 flex-1 rounded-sm first:rounded-l-md last:rounded-r-md"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
