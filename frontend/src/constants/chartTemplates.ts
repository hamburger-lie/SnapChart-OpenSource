/**
 * 图表模板预设配置
 * 参考 ioDraw 的丰富模板体系，按大类分组，每个模板携带预览缩略 SVG + 系列构建配置
 */

import type { DisplayChartType, ChartCategory, DatasetItem } from "../types/chart";

/** 单个模板定义 */
export interface ChartTemplate {
  /** 唯一标识 = DisplayChartType */
  id: DisplayChartType;
  /** 所属大类 */
  category: ChartCategory;
  /** 显示名称 */
  label: string;
  /** 简短描述 */
  desc: string;
  /** 缩略图 SVG（内联） */
  thumbnail: string;
}

/** 模板分组 */
export interface TemplateGroup {
  category: ChartCategory;
  label: string;
  templates: ChartTemplate[];
}

// ========== 缩略图 SVG ==========

const svgBar = `<svg viewBox="0 0 48 36" fill="none"><rect x="6" y="18" width="8" height="14" rx="1.5" fill="#2563eb" opacity=".85"/><rect x="17" y="10" width="8" height="22" rx="1.5" fill="#0891b2" opacity=".85"/><rect x="28" y="14" width="8" height="18" rx="1.5" fill="#0d9488" opacity=".85"/><line x1="4" y1="33" x2="44" y2="33" stroke="#cbd5e1" stroke-width=".8"/></svg>`;

const svgStackedBar = `<svg viewBox="0 0 48 36" fill="none"><rect x="6" y="20" width="8" height="12" rx="1.5" fill="#2563eb" opacity=".85"/><rect x="6" y="10" width="8" height="10" rx="1.5" fill="#7dd3fc" opacity=".7"/><rect x="17" y="14" width="8" height="18" rx="1.5" fill="#2563eb" opacity=".85"/><rect x="17" y="6" width="8" height="8" rx="1.5" fill="#7dd3fc" opacity=".7"/><rect x="28" y="16" width="8" height="16" rx="1.5" fill="#2563eb" opacity=".85"/><rect x="28" y="8" width="8" height="8" rx="1.5" fill="#7dd3fc" opacity=".7"/><line x1="4" y1="33" x2="44" y2="33" stroke="#cbd5e1" stroke-width=".8"/></svg>`;

const svgNegativeBar = `<svg viewBox="0 0 48 36" fill="none"><rect x="6" y="8" width="8" height="10" rx="1.5" fill="#2563eb" opacity=".85"/><rect x="17" y="18" width="8" height="10" rx="1.5" fill="#ef4444" opacity=".75"/><rect x="28" y="6" width="8" height="12" rx="1.5" fill="#2563eb" opacity=".85"/><rect x="39" y="18" width="8" height="8" rx="1.5" fill="#ef4444" opacity=".75"/><line x1="2" y1="18" x2="48" y2="18" stroke="#94a3b8" stroke-width=".8" stroke-dasharray="2 2"/></svg>`;

const svgLine = `<svg viewBox="0 0 48 36" fill="none"><polyline points="4,26 14,18 24,22 34,10 44,14" stroke="#2563eb" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="4" cy="26" r="2" fill="#2563eb"/><circle cx="14" cy="18" r="2" fill="#2563eb"/><circle cx="24" cy="22" r="2" fill="#2563eb"/><circle cx="34" cy="10" r="2" fill="#2563eb"/><circle cx="44" cy="14" r="2" fill="#2563eb"/></svg>`;

const svgSmoothLine = `<svg viewBox="0 0 48 36" fill="none"><path d="M4,26 C10,26 10,14 18,14 C26,14 26,22 32,22 C38,22 38,10 44,10" stroke="#2563eb" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="4" cy="26" r="2" fill="#2563eb"/><circle cx="18" cy="14" r="2" fill="#2563eb"/><circle cx="32" cy="22" r="2" fill="#2563eb"/><circle cx="44" cy="10" r="2" fill="#2563eb"/></svg>`;

const svgGradientArea = `<svg viewBox="0 0 48 36" fill="none"><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2563eb" stop-opacity=".5"/><stop offset="100%" stop-color="#2563eb" stop-opacity=".05"/></linearGradient></defs><path d="M4,26 C10,26 10,14 18,14 C26,14 26,22 32,22 C38,22 38,10 44,10 L44,34 L4,34 Z" fill="url(#ga)"/><path d="M4,26 C10,26 10,14 18,14 C26,14 26,22 32,22 C38,22 38,10 44,10" stroke="#2563eb" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;

const svgStackedArea = `<svg viewBox="0 0 48 36" fill="none"><path d="M4,28 L14,22 L24,24 L34,16 L44,20 L44,34 L4,34 Z" fill="#2563eb" opacity=".35"/><path d="M4,22 L14,16 L24,20 L34,10 L44,14 L44,20 L34,16 L24,24 L14,22 L4,28 Z" fill="#0891b2" opacity=".35"/><polyline points="4,28 14,22 24,24 34,16 44,20" stroke="#2563eb" stroke-width="1.2" fill="none"/><polyline points="4,22 14,16 24,20 34,10 44,14" stroke="#0891b2" stroke-width="1.2" fill="none"/></svg>`;

const svgPie = `<svg viewBox="0 0 48 36" fill="none"><path d="M24,18 L24,4 A14,14 0 0,1 36.1,24.5 Z" fill="#2563eb" opacity=".85"/><path d="M24,18 L36.1,24.5 A14,14 0 0,1 11.9,24.5 Z" fill="#0891b2" opacity=".75"/><path d="M24,18 L11.9,24.5 A14,14 0 0,1 24,4 Z" fill="#0d9488" opacity=".65"/></svg>`;

const svgDoughnut = `<svg viewBox="0 0 48 36" fill="none"><path d="M24,18 L24,4 A14,14 0 0,1 36.1,24.5 Z" fill="#2563eb" opacity=".85"/><path d="M24,18 L36.1,24.5 A14,14 0 0,1 11.9,24.5 Z" fill="#0891b2" opacity=".75"/><path d="M24,18 L11.9,24.5 A14,14 0 0,1 24,4 Z" fill="#0d9488" opacity=".65"/><circle cx="24" cy="18" r="7" fill="white"/></svg>`;

const svgRose = `<svg viewBox="0 0 48 36" fill="none"><path d="M24,18 L24,3 A15,15 0 0,1 37,24 Z" fill="#2563eb" opacity=".85"/><path d="M24,18 L37,24 A11,11 0 0,1 13,26 Z" fill="#0891b2" opacity=".75"/><path d="M24,18 L13,26 A13,13 0 0,1 24,3 Z" fill="#0d9488" opacity=".65"/></svg>`;

const svgScatter = `<svg viewBox="0 0 48 36" fill="none"><circle cx="10" cy="22" r="3" fill="#2563eb" opacity=".7"/><circle cx="18" cy="12" r="3" fill="#2563eb" opacity=".7"/><circle cx="26" cy="20" r="3" fill="#0891b2" opacity=".7"/><circle cx="34" cy="8" r="3" fill="#0891b2" opacity=".7"/><circle cx="40" cy="16" r="3" fill="#2563eb" opacity=".7"/><circle cx="14" cy="28" r="3" fill="#0891b2" opacity=".7"/></svg>`;

// ========== 模板定义 ==========

const BAR_TEMPLATES: ChartTemplate[] = [
  { id: "bar",        category: "bar", label: "基础柱状图", desc: "分类对比",     thumbnail: svgBar },
  { id: "stackedBar", category: "bar", label: "堆叠柱状图", desc: "组成对比",     thumbnail: svgStackedBar },
  { id: "negativeBar",category: "bar", label: "正负柱状图", desc: "盈亏/增减",   thumbnail: svgNegativeBar },
];

const LINE_TEMPLATES: ChartTemplate[] = [
  { id: "line",         category: "line", label: "基础折线图", desc: "趋势变化",   thumbnail: svgLine },
  { id: "smoothLine",   category: "line", label: "平滑折线图", desc: "柔和趋势",   thumbnail: svgSmoothLine },
  { id: "gradientArea", category: "line", label: "渐变面积图", desc: "趋势填充",   thumbnail: svgGradientArea },
  { id: "stackedArea",  category: "line", label: "堆叠面积图", desc: "占比趋势",   thumbnail: svgStackedArea },
];

const PIE_TEMPLATES: ChartTemplate[] = [
  { id: "pie",      category: "pie", label: "基础饼图",   desc: "占比分布",   thumbnail: svgPie },
  { id: "doughnut", category: "pie", label: "环形图",     desc: "环状占比",   thumbnail: svgDoughnut },
  { id: "rose",     category: "pie", label: "南丁格尔图", desc: "极坐标对比", thumbnail: svgRose },
];

const SCATTER_TEMPLATES: ChartTemplate[] = [
  { id: "scatter", category: "scatter", label: "基础散点图", desc: "数据分布", thumbnail: svgScatter },
];

/** 所有模板按分组输出 */
export const TEMPLATE_GROUPS: TemplateGroup[] = [
  { category: "bar",     label: "柱状图",   templates: BAR_TEMPLATES },
  { category: "line",    label: "折线图",   templates: LINE_TEMPLATES },
  { category: "pie",     label: "饼图",     templates: PIE_TEMPLATES },
  { category: "scatter", label: "散点图",   templates: SCATTER_TEMPLATES },
];

/** 根据 id 快速查找模板 */
export function findTemplate(id: DisplayChartType): ChartTemplate | undefined {
  for (const group of TEMPLATE_GROUPS) {
    const t = group.templates.find((t) => t.id === id);
    if (t) return t;
  }
  return undefined;
}

/**
 * 判断一个 DisplayChartType 的 "基础类型" (用于 ECharts series.type)
 * 例如 stackedBar → "bar", smoothLine → "line", doughnut → "pie"
 */
export function getBaseChartType(type: DisplayChartType): "bar" | "line" | "pie" | "scatter" {
  switch (type) {
    case "bar":
    case "stackedBar":
    case "negativeBar":
      return "bar";
    case "line":
    case "smoothLine":
    case "gradientArea":
    case "stackedArea":
      return "line";
    case "pie":
    case "doughnut":
    case "rose":
      return "pie";
    case "scatter":
      return "scatter";
  }
}

/**
 * 数据适配：当切换到饼图类型时，只取第一个 dataset
 * 当从饼图切换到多系列类型，保持现有数据不变
 */
export function adaptDataForChartType(
  targetType: DisplayChartType,
  labels: string[],
  datasets: DatasetItem[],
): { labels: string[]; datasets: DatasetItem[] } {
  const base = getBaseChartType(targetType);

  if (base === "pie") {
    // 饼图只能显示一个 dataset
    return {
      labels,
      datasets: datasets.length > 0 ? [datasets[0]] : datasets,
    };
  }

  // 其余类型保持原样
  return { labels, datasets };
}
