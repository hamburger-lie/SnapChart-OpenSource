/**
 * 图表模板预设配置
 * 按大类分组，每个模板携带预览缩略 SVG + 系列构建配置
 * 同时包含"结构模板"——带 mock 数据的一键体验模板
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

/** 结构模板（含 mock 数据） */
export interface StructureTemplate {
  id: string;
  chartType: DisplayChartType;
  label: string;
  desc: string;
  thumbnail: string;
  mockData: {
    title: string;
    labels: string[];
    datasets: DatasetItem[];
  };
  /** 桑基图/旭日图等特殊结构：直接提供 ECharts option 片段 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawOption?: Record<string, any>;
}

// ========== 缩略图 SVG ==========

const svgBar = `<svg viewBox="0 0 48 36" fill="none"><rect x="6" y="18" width="8" height="14" rx="1.5" fill="#2563eb" opacity=".85"/><rect x="17" y="10" width="8" height="22" rx="1.5" fill="#0891b2" opacity=".85"/><rect x="28" y="14" width="8" height="18" rx="1.5" fill="#0d9488" opacity=".85"/><line x1="4" y1="33" x2="44" y2="33" stroke="#cbd5e1" stroke-width=".8"/></svg>`;

const svgStackedBar = `<svg viewBox="0 0 48 36" fill="none"><rect x="6" y="20" width="8" height="12" rx="1.5" fill="#2563eb" opacity=".85"/><rect x="6" y="10" width="8" height="10" rx="1.5" fill="#7dd3fc" opacity=".7"/><rect x="17" y="14" width="8" height="18" rx="1.5" fill="#2563eb" opacity=".85"/><rect x="17" y="6" width="8" height="8" rx="1.5" fill="#7dd3fc" opacity=".7"/><rect x="28" y="16" width="8" height="16" rx="1.5" fill="#2563eb" opacity=".85"/><rect x="28" y="8" width="8" height="8" rx="1.5" fill="#7dd3fc" opacity=".7"/><line x1="4" y1="33" x2="44" y2="33" stroke="#cbd5e1" stroke-width=".8"/></svg>`;

const svgNegativeBar = `<svg viewBox="0 0 48 36" fill="none"><rect x="6" y="8" width="8" height="10" rx="1.5" fill="#2563eb" opacity=".85"/><rect x="17" y="18" width="8" height="10" rx="1.5" fill="#ef4444" opacity=".75"/><rect x="28" y="6" width="8" height="12" rx="1.5" fill="#2563eb" opacity=".85"/><rect x="39" y="18" width="8" height="8" rx="1.5" fill="#ef4444" opacity=".75"/><line x1="2" y1="18" x2="48" y2="18" stroke="#94a3b8" stroke-width=".8" stroke-dasharray="2 2"/></svg>`;

const svgBarLine = `<svg viewBox="0 0 48 36" fill="none"><rect x="5" y="16" width="6" height="16" rx="1.5" fill="#2563eb" opacity=".8"/><rect x="14" y="10" width="6" height="22" rx="1.5" fill="#2563eb" opacity=".8"/><rect x="23" y="14" width="6" height="18" rx="1.5" fill="#2563eb" opacity=".8"/><rect x="32" y="8" width="6" height="24" rx="1.5" fill="#2563eb" opacity=".8"/><polyline points="8,14 17,8 26,11 35,5" stroke="#ef4444" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="14" r="1.5" fill="#ef4444"/><circle cx="17" cy="8" r="1.5" fill="#ef4444"/><circle cx="26" cy="11" r="1.5" fill="#ef4444"/><circle cx="35" cy="5" r="1.5" fill="#ef4444"/></svg>`;

const svgWaterfall = `<svg viewBox="0 0 48 36" fill="none"><rect x="4" y="6" width="7" height="26" rx="1" fill="#2563eb" opacity=".8"/><rect x="13" y="6" width="7" height="14" rx="1" fill="#ef4444" opacity=".7"/><rect x="22" y="20" width="7" height="6" rx="1" fill="#ef4444" opacity=".7"/><rect x="31" y="14" width="7" height="12" rx="1" fill="#22c55e" opacity=".7"/><rect x="40" y="14" width="7" height="18" rx="1" fill="#2563eb" opacity=".8"/><line x1="2" y1="33" x2="48" y2="33" stroke="#cbd5e1" stroke-width=".8"/></svg>`;

const svgLine = `<svg viewBox="0 0 48 36" fill="none"><polyline points="4,26 14,18 24,22 34,10 44,14" stroke="#2563eb" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="4" cy="26" r="2" fill="#2563eb"/><circle cx="14" cy="18" r="2" fill="#2563eb"/><circle cx="24" cy="22" r="2" fill="#2563eb"/><circle cx="34" cy="10" r="2" fill="#2563eb"/><circle cx="44" cy="14" r="2" fill="#2563eb"/></svg>`;

const svgSmoothLine = `<svg viewBox="0 0 48 36" fill="none"><path d="M4,26 C10,26 10,14 18,14 C26,14 26,22 32,22 C38,22 38,10 44,10" stroke="#2563eb" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="4" cy="26" r="2" fill="#2563eb"/><circle cx="18" cy="14" r="2" fill="#2563eb"/><circle cx="32" cy="22" r="2" fill="#2563eb"/><circle cx="44" cy="10" r="2" fill="#2563eb"/></svg>`;

const svgGradientArea = `<svg viewBox="0 0 48 36" fill="none"><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2563eb" stop-opacity=".5"/><stop offset="100%" stop-color="#2563eb" stop-opacity=".05"/></linearGradient></defs><path d="M4,26 C10,26 10,14 18,14 C26,14 26,22 32,22 C38,22 38,10 44,10 L44,34 L4,34 Z" fill="url(#ga)"/><path d="M4,26 C10,26 10,14 18,14 C26,14 26,22 32,22 C38,22 38,10 44,10" stroke="#2563eb" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;

const svgStackedArea = `<svg viewBox="0 0 48 36" fill="none"><path d="M4,28 L14,22 L24,24 L34,16 L44,20 L44,34 L4,34 Z" fill="#2563eb" opacity=".35"/><path d="M4,22 L14,16 L24,20 L34,10 L44,14 L44,20 L34,16 L24,24 L14,22 L4,28 Z" fill="#0891b2" opacity=".35"/><polyline points="4,28 14,22 24,24 34,16 44,20" stroke="#2563eb" stroke-width="1.2" fill="none"/><polyline points="4,22 14,16 24,20 34,10 44,14" stroke="#0891b2" stroke-width="1.2" fill="none"/></svg>`;

const svgPie = `<svg viewBox="0 0 48 36" fill="none"><path d="M24,18 L24,4 A14,14 0 0,1 36.1,24.5 Z" fill="#2563eb" opacity=".85"/><path d="M24,18 L36.1,24.5 A14,14 0 0,1 11.9,24.5 Z" fill="#0891b2" opacity=".75"/><path d="M24,18 L11.9,24.5 A14,14 0 0,1 24,4 Z" fill="#0d9488" opacity=".65"/></svg>`;

const svgDoughnut = `<svg viewBox="0 0 48 36" fill="none"><path d="M24,18 L24,4 A14,14 0 0,1 36.1,24.5 Z" fill="#2563eb" opacity=".85"/><path d="M24,18 L36.1,24.5 A14,14 0 0,1 11.9,24.5 Z" fill="#0891b2" opacity=".75"/><path d="M24,18 L11.9,24.5 A14,14 0 0,1 24,4 Z" fill="#0d9488" opacity=".65"/><circle cx="24" cy="18" r="7" fill="white"/></svg>`;

const svgRose = `<svg viewBox="0 0 48 36" fill="none"><path d="M24,18 L24,3 A15,15 0 0,1 37,24 Z" fill="#2563eb" opacity=".85"/><path d="M24,18 L37,24 A11,11 0 0,1 13,26 Z" fill="#0891b2" opacity=".75"/><path d="M24,18 L13,26 A13,13 0 0,1 24,3 Z" fill="#0d9488" opacity=".65"/></svg>`;

const svgScatter = `<svg viewBox="0 0 48 36" fill="none"><circle cx="10" cy="22" r="3" fill="#2563eb" opacity=".7"/><circle cx="18" cy="12" r="3" fill="#2563eb" opacity=".7"/><circle cx="26" cy="20" r="3" fill="#0891b2" opacity=".7"/><circle cx="34" cy="8" r="3" fill="#0891b2" opacity=".7"/><circle cx="40" cy="16" r="3" fill="#2563eb" opacity=".7"/><circle cx="14" cy="28" r="3" fill="#0891b2" opacity=".7"/></svg>`;

const svgRadar = `<svg viewBox="0 0 48 36" fill="none"><polygon points="24,4 40,14 36,30 12,30 8,14" stroke="#cbd5e1" stroke-width=".6" fill="none"/><polygon points="24,10 34,16 32,26 16,26 14,16" stroke="#cbd5e1" stroke-width=".5" fill="none"/><polygon points="24,8 36,15 33,28 15,28 12,15" fill="#2563eb" opacity=".2" stroke="#2563eb" stroke-width="1.5"/><polygon points="24,12 32,17 30,25 18,25 16,17" fill="#0891b2" opacity=".2" stroke="#0891b2" stroke-width="1.5"/></svg>`;

const svgFunnel = `<svg viewBox="0 0 48 36" fill="none"><path d="M4,4 L44,4 L44,10 L4,10 Z" fill="#2563eb" opacity=".85"/><path d="M8,12 L40,12 L40,18 L8,18 Z" fill="#0891b2" opacity=".8"/><path d="M13,20 L35,20 L35,26 L13,26 Z" fill="#0d9488" opacity=".75"/><path d="M18,28 L30,28 L30,34 L18,34 Z" fill="#7c3aed" opacity=".7"/></svg>`;

const svgGauge = `<svg viewBox="0 0 48 36" fill="none"><path d="M8,28 A16,16 0 0,1 40,28" stroke="#e2e8f0" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M8,28 A16,16 0 0,1 35,12" stroke="#2563eb" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="24" cy="28" r="2" fill="#2563eb"/><line x1="24" y1="28" x2="33" y2="14" stroke="#2563eb" stroke-width="1.5" stroke-linecap="round"/></svg>`;

const svgHeatmap = `<svg viewBox="0 0 48 36" fill="none"><rect x="4" y="4" width="8" height="8" rx="1" fill="#2563eb" opacity=".3"/><rect x="14" y="4" width="8" height="8" rx="1" fill="#2563eb" opacity=".8"/><rect x="24" y="4" width="8" height="8" rx="1" fill="#2563eb" opacity=".5"/><rect x="34" y="4" width="8" height="8" rx="1" fill="#2563eb" opacity=".2"/><rect x="4" y="14" width="8" height="8" rx="1" fill="#2563eb" opacity=".9"/><rect x="14" y="14" width="8" height="8" rx="1" fill="#2563eb" opacity=".4"/><rect x="24" y="14" width="8" height="8" rx="1" fill="#2563eb" opacity=".7"/><rect x="34" y="14" width="8" height="8" rx="1" fill="#2563eb" opacity=".6"/><rect x="4" y="24" width="8" height="8" rx="1" fill="#2563eb" opacity=".5"/><rect x="14" y="24" width="8" height="8" rx="1" fill="#2563eb" opacity=".3"/><rect x="24" y="24" width="8" height="8" rx="1" fill="#2563eb" opacity=".9"/><rect x="34" y="24" width="8" height="8" rx="1" fill="#2563eb" opacity=".4"/></svg>`;

const svgTreemap = `<svg viewBox="0 0 48 36" fill="none"><rect x="2" y="2" width="22" height="20" rx="1.5" fill="#2563eb" opacity=".8"/><rect x="26" y="2" width="20" height="12" rx="1.5" fill="#0891b2" opacity=".75"/><rect x="26" y="16" width="10" height="6" rx="1" fill="#0d9488" opacity=".7"/><rect x="38" y="16" width="8" height="6" rx="1" fill="#7c3aed" opacity=".65"/><rect x="2" y="24" width="14" height="10" rx="1.5" fill="#ef4444" opacity=".6"/><rect x="18" y="24" width="14" height="10" rx="1.5" fill="#f59e0b" opacity=".6"/><rect x="34" y="24" width="12" height="10" rx="1.5" fill="#22c55e" opacity=".55"/></svg>`;

const svgSankey = `<svg viewBox="0 0 48 36" fill="none"><path d="M4,4 C20,4 20,8 36,8 L36,14 C20,14 20,10 4,10 Z" fill="#2563eb" opacity=".6"/><path d="M4,14 C20,14 20,18 36,18 L36,24 C20,24 20,20 4,20 Z" fill="#0891b2" opacity=".6"/><path d="M4,24 C20,24 20,26 36,26 L36,32 C20,32 20,30 4,30 Z" fill="#0d9488" opacity=".6"/></svg>`;

const svgSunburst = `<svg viewBox="0 0 48 36" fill="none"><circle cx="24" cy="18" r="5" fill="#2563eb" opacity=".9"/><path d="M24,18 L24,4 A14,14 0 0,1 36,24 Z" fill="#0891b2" opacity=".4" stroke="white" stroke-width=".5"/><path d="M24,18 L36,24 A14,14 0 0,1 12,24 Z" fill="#0d9488" opacity=".4" stroke="white" stroke-width=".5"/><path d="M24,18 L12,24 A14,14 0 0,1 24,4 Z" fill="#7c3aed" opacity=".4" stroke="white" stroke-width=".5"/></svg>`;

const svgCandlestick = `<svg viewBox="0 0 48 36" fill="none"><line x1="10" y1="4" x2="10" y2="32" stroke="#22c55e" stroke-width="1"/><rect x="7" y="10" width="6" height="14" rx=".5" fill="#22c55e" opacity=".8"/><line x1="22" y1="8" x2="22" y2="30" stroke="#ef4444" stroke-width="1"/><rect x="19" y="14" width="6" height="12" rx=".5" fill="#ef4444" opacity=".8"/><line x1="34" y1="2" x2="34" y2="28" stroke="#22c55e" stroke-width="1"/><rect x="31" y="8" width="6" height="16" rx=".5" fill="#22c55e" opacity=".8"/><line x1="2" y1="33" x2="44" y2="33" stroke="#cbd5e1" stroke-width=".8"/></svg>`;

// ========== 模板定义 ==========

const BAR_TEMPLATES: ChartTemplate[] = [
  { id: "bar",        category: "bar", label: "基础柱状图", desc: "分类对比",     thumbnail: svgBar },
  { id: "stackedBar", category: "bar", label: "堆叠柱状图", desc: "组成对比",     thumbnail: svgStackedBar },
  { id: "negativeBar",category: "bar", label: "正负柱状图", desc: "盈亏/增减",   thumbnail: svgNegativeBar },
  { id: "barLine",    category: "bar", label: "柱线混合图", desc: "双轴对比",     thumbnail: svgBarLine },
  { id: "waterfall",  category: "bar", label: "瀑布图",     desc: "逐步累计",     thumbnail: svgWaterfall },
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

const RADAR_TEMPLATES: ChartTemplate[] = [
  { id: "radar", category: "radar", label: "雷达图", desc: "多维对比", thumbnail: svgRadar },
];

const ADVANCED_TEMPLATES: ChartTemplate[] = [
  { id: "funnel",      category: "advanced", label: "漏斗图",   desc: "转化分析",   thumbnail: svgFunnel },
  { id: "gauge",       category: "advanced", label: "仪表盘",   desc: "进度指标",   thumbnail: svgGauge },
  { id: "heatmap",     category: "advanced", label: "热力图",   desc: "密度分布",   thumbnail: svgHeatmap },
  { id: "treemap",     category: "advanced", label: "矩形树图", desc: "层级占比",   thumbnail: svgTreemap },
  { id: "sankey",      category: "advanced", label: "桑基图",   desc: "流量流向",   thumbnail: svgSankey },
  { id: "sunburst",    category: "advanced", label: "旭日图",   desc: "层级结构",   thumbnail: svgSunburst },
  { id: "candlestick", category: "advanced", label: "K线图",    desc: "金融走势",   thumbnail: svgCandlestick },
];

/** 所有模板按分组输出 */
export const TEMPLATE_GROUPS: TemplateGroup[] = [
  { category: "bar",      label: "柱状图",   templates: BAR_TEMPLATES },
  { category: "line",     label: "折线图",   templates: LINE_TEMPLATES },
  { category: "pie",      label: "饼图",     templates: PIE_TEMPLATES },
  { category: "scatter",  label: "散点图",   templates: SCATTER_TEMPLATES },
  { category: "radar",    label: "雷达图",   templates: RADAR_TEMPLATES },
  { category: "advanced", label: "高级图表", templates: ADVANCED_TEMPLATES },
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
 * 判断一个 DisplayChartType 的 "基础类型"
 */
export type BaseChartType = "bar" | "line" | "pie" | "scatter" | "radar" | "funnel" | "gauge" | "heatmap" | "treemap" | "sankey" | "sunburst" | "candlestick";

export function getBaseChartType(type: DisplayChartType): BaseChartType {
  switch (type) {
    case "bar":
    case "stackedBar":
    case "negativeBar":
    case "barLine":
    case "waterfall":
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
    case "radar":
      return "radar";
    case "funnel":
      return "funnel";
    case "gauge":
      return "gauge";
    case "heatmap":
      return "heatmap";
    case "treemap":
      return "treemap";
    case "sankey":
      return "sankey";
    case "sunburst":
      return "sunburst";
    case "candlestick":
      return "candlestick";
  }
}

/**
 * 数据适配：当切换图表类型时的数据转换规则
 */
export function adaptDataForChartType(
  targetType: DisplayChartType,
  labels: string[],
  datasets: DatasetItem[],
): { labels: string[]; datasets: DatasetItem[] } {
  const base = getBaseChartType(targetType);

  if (base === "pie" || base === "funnel" || base === "gauge" || base === "treemap") {
    // 这些类型只能显示一个 dataset
    return {
      labels,
      datasets: datasets.length > 0 ? [datasets[0]] : datasets,
    };
  }

  // 其余类型保持原样
  return { labels, datasets };
}

// ========== 结构模板（含 mock 数据） ==========

export const STRUCTURE_TEMPLATES: StructureTemplate[] = [
  {
    id: "struct-barLine",
    chartType: "barLine",
    label: "柱线混合",
    desc: "收入 vs 增长率",
    thumbnail: svgBarLine,
    mockData: {
      title: "季度收入与增长率",
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [
        { name: "收入(万元)", values: [120, 200, 150, 280] },
        { name: "成本(万元)", values: [80, 130, 100, 180] },
        { name: "增长率(%)", values: [15, 25, 18, 35] },
      ],
    },
  },
  {
    id: "struct-rose",
    chartType: "rose",
    label: "南丁格尔",
    desc: "市场份额分布",
    thumbnail: svgRose,
    mockData: {
      title: "2024年浏览器市场份额",
      labels: ["Chrome", "Safari", "Edge", "Firefox", "Opera", "其他"],
      datasets: [
        { name: "份额(%)", values: [64.7, 18.6, 5.2, 3.3, 2.1, 6.1] },
      ],
    },
  },
  {
    id: "struct-radar",
    chartType: "radar",
    label: "雷达图",
    desc: "产品能力对比",
    thumbnail: svgRadar,
    mockData: {
      title: "产品能力对比",
      labels: ["性能", "易用性", "安全性", "扩展性", "稳定性", "文档"],
      datasets: [
        { name: "产品A", values: [90, 75, 88, 70, 92, 65] },
        { name: "产品B", values: [70, 90, 72, 85, 78, 88] },
      ],
    },
  },
  {
    id: "struct-funnel",
    chartType: "funnel",
    label: "漏斗图",
    desc: "用户转化漏斗",
    thumbnail: svgFunnel,
    mockData: {
      title: "用户转化漏斗",
      labels: ["访问", "注册", "激活", "付费", "续费"],
      datasets: [
        { name: "用户数", values: [10000, 6500, 4200, 1800, 950] },
      ],
    },
  },
  {
    id: "struct-gauge",
    chartType: "gauge",
    label: "仪表盘",
    desc: "KPI 达成率",
    thumbnail: svgGauge,
    mockData: {
      title: "Q4 销售目标达成率",
      labels: ["达成率"],
      datasets: [
        { name: "达成率", values: [78.5] },
      ],
    },
  },
  {
    id: "struct-heatmap",
    chartType: "heatmap",
    label: "热力图",
    desc: "周活跃时段",
    thumbnail: svgHeatmap,
    mockData: {
      title: "一周活跃时段分布",
      labels: ["9:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
      datasets: [
        { name: "周一", values: [5, 8, 12, 10, 7, 3] },
        { name: "周二", values: [7, 10, 15, 12, 9, 5] },
        { name: "周三", values: [6, 9, 11, 14, 8, 4] },
        { name: "周四", values: [8, 12, 18, 16, 11, 6] },
        { name: "周五", values: [4, 7, 9, 8, 6, 2] },
      ],
    },
  },
  {
    id: "struct-treemap",
    chartType: "treemap",
    label: "矩形树图",
    desc: "部门预算分配",
    thumbnail: svgTreemap,
    mockData: {
      title: "2024年部门预算分配",
      labels: ["研发部", "市场部", "销售部", "运维部", "人事部", "财务部"],
      datasets: [
        { name: "预算(万元)", values: [450, 280, 320, 180, 120, 90] },
      ],
    },
  },
  {
    id: "struct-waterfall",
    chartType: "waterfall",
    label: "瀑布图",
    desc: "利润分解",
    thumbnail: svgWaterfall,
    mockData: {
      title: "季度利润分解",
      labels: ["总收入", "人工成本", "材料成本", "运营费用", "税费", "净利润"],
      datasets: [
        { name: "金额(万元)", values: [500, -180, -120, -65, -35, 100] },
      ],
    },
  },
  {
    id: "struct-sankey",
    chartType: "sankey",
    label: "桑基图",
    desc: "流量来源分析",
    thumbnail: svgSankey,
    mockData: {
      title: "网站流量来源分析",
      labels: [],
      datasets: [],
    },
    rawOption: {
      series: [{
        type: "sankey",
        layout: "none",
        emphasis: { focus: "adjacency" },
        data: [
          { name: "搜索引擎" }, { name: "社交媒体" }, { name: "直接访问" },
          { name: "首页" }, { name: "产品页" }, { name: "博客" },
          { name: "注册" }, { name: "购买" },
        ],
        links: [
          { source: "搜索引擎", target: "首页", value: 3200 },
          { source: "搜索引擎", target: "产品页", value: 1800 },
          { source: "社交媒体", target: "首页", value: 2100 },
          { source: "社交媒体", target: "博客", value: 1400 },
          { source: "直接访问", target: "首页", value: 1600 },
          { source: "直接访问", target: "产品页", value: 900 },
          { source: "首页", target: "注册", value: 3500 },
          { source: "产品页", target: "购买", value: 2200 },
          { source: "博客", target: "注册", value: 800 },
        ],
      }],
    },
  },
  {
    id: "struct-sunburst",
    chartType: "sunburst",
    label: "旭日图",
    desc: "产品分类层级",
    thumbnail: svgSunburst,
    mockData: {
      title: "产品分类销售额",
      labels: [],
      datasets: [],
    },
    rawOption: {
      series: [{
        type: "sunburst",
        radius: ["10%", "90%"],
        label: { rotate: "radial", fontSize: 11 },
        data: [
          {
            name: "电子产品", value: 0,
            children: [
              { name: "手机", value: 4500 },
              { name: "笔记本", value: 3200 },
              { name: "平板", value: 1800 },
            ],
          },
          {
            name: "服装", value: 0,
            children: [
              { name: "男装", value: 2800 },
              { name: "女装", value: 3600 },
              { name: "童装", value: 1200 },
            ],
          },
          {
            name: "食品", value: 0,
            children: [
              { name: "零食", value: 2100 },
              { name: "饮料", value: 1500 },
              { name: "生鲜", value: 2400 },
            ],
          },
        ],
      }],
    },
  },
  {
    id: "struct-candlestick",
    chartType: "candlestick",
    label: "K线图",
    desc: "股票走势",
    thumbnail: svgCandlestick,
    mockData: {
      title: "某股票近10日走势",
      labels: ["03/11", "03/12", "03/13", "03/14", "03/15", "03/18", "03/19", "03/20", "03/21", "03/22"],
      datasets: [
        // K线图特殊：每个"值"是 [open, close, low, high]
        // 这里用 values 存放 flattened 的四元组，渲染时按 4 个一组解析
        { name: "OHLC", values: [
          20, 34, 10, 38,   // 03/11: open=20, close=34, low=10, high=38
          40, 35, 30, 50,   // 03/12
          31, 38, 28, 42,   // 03/13
          38, 15, 12, 40,   // 03/14
          15, 22, 10, 28,   // 03/15
          23, 35, 20, 38,   // 03/18
          36, 42, 32, 48,   // 03/19
          40, 38, 33, 45,   // 03/20
          37, 45, 35, 50,   // 03/21
          45, 52, 42, 55,   // 03/22
        ]},
      ],
    },
  },
];
