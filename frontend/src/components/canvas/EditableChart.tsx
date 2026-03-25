/**
 * 可编辑图表组件（增强版 v3）
 * 核心升级：
 *   1. Y 轴智能数值格式化（万/亿/K/M/B 自适应）
 *   2. X 轴超长标签截断 + 智能旋转
 *   3. 对数轴支持（解决 Whale Test 数据悬殊问题）
 *   4. Tooltip 同步格式化（悬浮时也显示易读数值）
 *   5. 10 种新图表类型：barLine/radar/funnel/gauge/heatmap/treemap/waterfall/sankey/sunburst/candlestick
 */

import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import {
  BarChart, LineChart, PieChart, ScatterChart,
  RadarChart, FunnelChart, GaugeChart, HeatmapChart,
  TreemapChart, SankeyChart, SunburstChart, CandlestickChart,
} from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,
  DataZoomComponent,
  RadarComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useEditorStore } from "../../store";
import type { DatasetItem, DisplayChartType } from "../../types/chart";
import type { TitleStyle, LegendConfig, GridPadding, XAxisConfig, YAxisConfig } from "../../types/editor";
import { getBaseChartType } from "../../constants/chartTemplates";
import { registerAllThemes, FULL_THEMES } from "../../constants/themes";
import { sanitizeChartData } from "../../utils/optionSanitizer";

// 按需注册（含所有新增图表类型）
echarts.use([
  BarChart, LineChart, PieChart, ScatterChart,
  RadarChart, FunnelChart, GaugeChart, HeatmapChart,
  TreemapChart, SankeyChart, SunburstChart, CandlestickChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent,
  ToolboxComponent, DataZoomComponent, RadarComponent, VisualMapComponent,
  CanvasRenderer,
]);

// 注册所有完整 ECharts 主题（仅执行一次）
registerAllThemes(echarts);

// ========== 智能数值格式化引擎 ==========

/**
 * 将原始数值格式化为易读字符串
 * 自动选择最佳单位：直接显示 / 万 / 亿 / K / M / B
 */
function formatNumber(value: number, mode: YAxisConfig["numberFormat"]): string {
  if (mode === "raw") return String(value);
  if (mode === "percent") return `${value}%`;

  // smart 模式：自动选择最佳单位
  const abs = Math.abs(value);
  if (abs === 0) return "0";

  // 中文语境：优先使用 万/亿
  if (abs >= 1e8) {
    const v = value / 1e8;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}亿`;
  }
  if (abs >= 1e4) {
    const v = value / 1e4;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}万`;
  }
  if (abs >= 1000) {
    // 千位以上加逗号分隔
    return value.toLocaleString("zh-CN");
  }
  // 小数保留 2 位
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

/**
 * Tooltip 内的数值格式化（保留更多精度）
 */
function formatTooltipValue(value: number, mode: YAxisConfig["numberFormat"]): string {
  if (mode === "raw") return value.toLocaleString("zh-CN");
  if (mode === "percent") return `${value}%`;

  const abs = Math.abs(value);
  if (abs >= 1e8) return `${(value / 1e8).toFixed(2)}亿`;
  if (abs >= 1e4) return `${(value / 1e4).toFixed(2)}万`;
  return value.toLocaleString("zh-CN");
}

/**
 * 智能截断超长文本
 */
function truncateLabel(label: string, maxLen: number): string {
  if (label.length <= maxLen) return label;
  return label.slice(0, maxLen - 1) + "…";
}

/**
 * 根据标签数据智能计算旋转角度
 */
function calcSmartRotate(labels: string[], maxLen: number): number {
  const avgLen = labels.reduce((sum, l) => sum + l.length, 0) / labels.length;
  if (labels.length <= 4 && avgLen <= maxLen) return 0;
  if (labels.length <= 8 && avgLen <= 6) return 0;
  if (avgLen > 10 || labels.length > 12) return 45;
  return 30;
}

/**
 * 检测数据是否存在极端悬殊（最大值/最小非零值 > 100）
 */
function detectDataSkew(datasets: DatasetItem[]): boolean {
  const allValues = datasets.flatMap((ds) => ds.values);
  // 防御：只要有负数或0，绝对禁止触发对数轴
  if (allValues.some(v => v <= 0)) return false;
  const validValues = allValues.filter(v => v > 0);
  if (validValues.length < 2) return false;

  const max = Math.max(...validValues);
  const min = Math.min(...validValues);
  return min > 0 && max / min > 100;
}

// ========== 通用配置工厂 ==========

function buildTitle(title: string, subtitle: string, style: TitleStyle) {
  return {
    text: title,
    subtext: subtitle || undefined,
    left: "center",
    top: 12,
    textStyle: { fontSize: style.fontSize, fontWeight: style.fontWeight, color: style.color },
    subtextStyle: { fontSize: 13, color: "#94a3b8" },
  };
}

function buildToolbox(title: string) {
  return {
    right: 20, top: 12,
    feature: {
      saveAsImage: { title: "导出为图片", pixelRatio: 3, backgroundColor: "#fff", name: title || "chart" },
    },
    iconStyle: { borderColor: "#94a3b8" },
    emphasis: { iconStyle: { borderColor: "#2563eb" } },
  };
}

function buildLegend(config: LegendConfig, selected: Record<string, boolean>) {
  if (!config.show) return { show: false };
  const posMap = {
    top:    { top: 48, left: "center" },
    bottom: { bottom: 10, left: "center" },
    left:   { left: 10, top: "middle", orient: "vertical" as const },
    right:  { right: 20, top: "middle", orient: "vertical" as const },
  };
  return {
    show: true, ...posMap[config.position],
    textStyle: { color: "#64748b", fontSize: 13 },
    itemWidth: 14, itemHeight: 10, itemGap: 16,
    selected: Object.keys(selected).length > 0 ? selected : undefined,
  };
}

function buildGrid(padding: GridPadding) {
  return { ...padding, containLabel: true };
}

function buildXAxis(labels: string[], xConfig: XAxisConfig, xAxisName?: string) {
  const rotate = xConfig.autoRotate
    ? calcSmartRotate(labels, xConfig.labelMaxLength)
    : xConfig.labelRotate;

  const maxLen = xConfig.labelMaxLength;

  return {
    type: "category" as const,
    data: labels,
    axisLabel: {
      color: "#64748b",
      fontSize: 12,
      rotate,
      formatter: (val: string) => truncateLabel(val, maxLen),
      interval: labels.length > 20 ? "auto" : 0,
    },
    axisLine: { lineStyle: { color: "#e2e8f0" } },
    axisTick: { show: false },
    name: xAxisName || undefined,
    nameTextStyle: { color: "#94a3b8", fontSize: 12, padding: [8, 0, 0, 0] },
    axisPointer: {
      label: { formatter: (params: { value: string }) => params.value },
    },
  };
}

function buildYAxis(yConfig: YAxisConfig, yAxisName?: string) {
  if (yConfig.useLogScale) {
    return {
      type: "log" as const,
      logBase: 10,
      min: 1,
      axisLabel: {
        color: "#94a3b8",
        fontSize: 12,
        formatter: (val: number) => formatNumber(val, yConfig.numberFormat),
      },
      splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" as const } },
      axisLine: { show: false },
      axisTick: { show: false },
      name: yAxisName || undefined,
      nameTextStyle: { color: "#94a3b8", fontSize: 12, padding: [0, 0, 8, 0] },
    };
  }

  return {
    type: "value" as const,
    scale: yConfig.autoScale && yConfig.min === null,
    min: yConfig.min !== null ? yConfig.min : undefined,
    max: yConfig.max !== null ? yConfig.max : undefined,
    axisLabel: {
      color: "#94a3b8",
      fontSize: 12,
      formatter: (val: number) => formatNumber(val, yConfig.numberFormat),
    },
    splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" as const } },
    axisLine: { show: false },
    axisTick: { show: false },
    name: yAxisName || undefined,
    nameTextStyle: { color: "#94a3b8", fontSize: 12, padding: [0, 0, 8, 0] },
  };
}

function buildTooltip(
  trigger: "item" | "axis",
  numberFormat: YAxisConfig["numberFormat"],
) {
  const style = {
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderColor: "transparent",
    textStyle: { color: "#f1f5f9", fontSize: 13 },
    extraCssText: "max-width: 400px; white-space: normal; word-break: break-all;",
  };

  if (trigger === "item") {
    return { trigger, ...style };
  }

  return {
    trigger,
    ...style,
    axisPointer: { type: "shadow" as const },
    formatter: (params: Array<{ marker: string; seriesName: string; value: number; axisValueLabel: string }>) => {
      if (!Array.isArray(params) || params.length === 0) return "";
      let result = `<div style="font-weight:600;margin-bottom:6px">${params[0].axisValueLabel}</div>`;
      for (const p of params) {
        const fmtVal = formatTooltipValue(p.value, numberFormat);
        result += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0">${p.marker}<span>${p.seriesName}</span><span style="margin-left:auto;font-weight:600">${fmtVal}</span></div>`;
      }
      return result;
    },
  };
}

// ========== 原有图表类型构建 ==========

function buildBarSeries(datasets: DatasetItem[]) {
  return datasets.map((ds) => ({
    name: ds.name, type: "bar" as const, data: ds.values,
    barMaxWidth: 40, itemStyle: { borderRadius: [4, 4, 0, 0] },
    emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(37, 99, 235, 0.3)" } },
    animationDuration: 800, animationEasing: "cubicOut",
  }));
}

function buildStackedBarSeries(datasets: DatasetItem[]) {
  return datasets.map((ds) => ({
    name: ds.name, type: "bar" as const, data: ds.values,
    stack: "total", barMaxWidth: 40,
    itemStyle: { borderRadius: [2, 2, 0, 0] },
    emphasis: { focus: "series" as const },
    animationDuration: 800, animationEasing: "cubicOut",
  }));
}

function buildNegativeBarSeries(datasets: DatasetItem[], colors: string[]) {
  return datasets.map((ds) => ({
    name: ds.name, type: "bar" as const, data: ds.values.map((v) => ({
      value: v,
      itemStyle: {
        color: v >= 0 ? (colors[0] || "#2563eb") : (colors[1] || "#ef4444"),
        borderRadius: v >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4],
      },
    })),
    barMaxWidth: 40,
    emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(37, 99, 235, 0.3)" } },
    animationDuration: 800, animationEasing: "cubicOut",
  }));
}

function buildLineSeries(datasets: DatasetItem[]) {
  return datasets.map((ds) => ({
    name: ds.name, type: "line" as const, data: ds.values,
    smooth: false, symbol: "circle", symbolSize: 6,
    lineStyle: { width: 2.5 },
    animationDuration: 800, animationEasing: "cubicOut",
  }));
}

function buildSmoothLineSeries(datasets: DatasetItem[]) {
  return datasets.map((ds) => ({
    name: ds.name, type: "line" as const, data: ds.values,
    smooth: true, symbol: "circle", symbolSize: 6,
    lineStyle: { width: 2.5 },
    animationDuration: 800, animationEasing: "cubicOut",
  }));
}

function buildGradientAreaSeries(datasets: DatasetItem[], colors: string[]) {
  return datasets.map((ds, idx) => {
    const baseColor = colors[idx % colors.length] || "#2563eb";
    return {
      name: ds.name, type: "line" as const, data: ds.values,
      smooth: true, symbol: "circle", symbolSize: 5,
      lineStyle: { width: 2.5, color: baseColor },
      areaStyle: {
        color: {
          type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: baseColor + "80" },
            { offset: 1, color: baseColor + "08" },
          ],
        },
      },
      animationDuration: 800, animationEasing: "cubicOut",
    };
  });
}

function buildStackedAreaSeries(datasets: DatasetItem[]) {
  return datasets.map((ds) => ({
    name: ds.name, type: "line" as const, data: ds.values,
    smooth: true, stack: "total", symbol: "none",
    lineStyle: { width: 1.5 }, areaStyle: { opacity: 0.4 },
    emphasis: { focus: "series" as const },
    animationDuration: 800, animationEasing: "cubicOut",
  }));
}

function buildPieSeries(
  labels: string[],
  datasets: DatasetItem[],
  xConfig: XAxisConfig,
  numberFormat: YAxisConfig["numberFormat"],
) {
  const ds = datasets[0];
  const pieData = labels.map((l, i) => ({ name: l, value: ds?.values[i] ?? 0 }));
  const maxLen = xConfig.labelMaxLength;

  return [{
    type: "pie" as const, radius: ["0%", "68%"], center: ["42%", "55%"],
    data: pieData,
    label: {
      color: "#475569", fontSize: 12,
      formatter: (params: { name: string; percent: number; value: number }) => {
        const shortName = truncateLabel(params.name, maxLen);
        const fmtVal = formatTooltipValue(params.value, numberFormat);
        return `${shortName}\n${fmtVal} (${params.percent}%)`;
      },
    },
    labelLine: { lineStyle: { color: "#cbd5e1" } },
    itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 3 },
    emphasis: { scaleSize: 8, itemStyle: { shadowBlur: 20, shadowColor: "rgba(0,0,0,0.15)" } },
    animationType: "scale", animationDuration: 800, animationEasing: "cubicOut",
  }];
}

function buildDoughnutSeries(
  labels: string[],
  datasets: DatasetItem[],
  xConfig: XAxisConfig,
  numberFormat: YAxisConfig["numberFormat"],
) {
  const ds = datasets[0];
  const pieData = labels.map((l, i) => ({ name: l, value: ds?.values[i] ?? 0 }));
  const maxLen = xConfig.labelMaxLength;

  return [{
    type: "pie" as const, radius: ["40%", "68%"], center: ["42%", "55%"],
    data: pieData,
    label: {
      color: "#475569", fontSize: 12,
      formatter: (params: { name: string; percent: number; value: number }) => {
        const shortName = truncateLabel(params.name, maxLen);
        const fmtVal = formatTooltipValue(params.value, numberFormat);
        return `${shortName}\n${fmtVal} (${params.percent}%)`;
      },
    },
    labelLine: { lineStyle: { color: "#cbd5e1" } },
    itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 3 },
    emphasis: { scaleSize: 8, itemStyle: { shadowBlur: 20, shadowColor: "rgba(0,0,0,0.15)" } },
    animationType: "scale", animationDuration: 800, animationEasing: "cubicOut",
  }];
}

function buildRoseSeries(
  labels: string[],
  datasets: DatasetItem[],
  xConfig: XAxisConfig,
  numberFormat: YAxisConfig["numberFormat"],
) {
  const ds = datasets[0];
  const pieData = labels.map((l, i) => ({ name: l, value: ds?.values[i] ?? 0 }));
  const maxLen = xConfig.labelMaxLength;

  return [{
    type: "pie" as const, radius: ["15%", "68%"], center: ["42%", "55%"],
    roseType: "area" as const,
    data: pieData,
    label: {
      color: "#475569", fontSize: 12,
      formatter: (params: { name: string; percent: number; value: number }) => {
        const shortName = truncateLabel(params.name, maxLen);
        const fmtVal = formatTooltipValue(params.value, numberFormat);
        return `${shortName}\n${fmtVal} (${params.percent}%)`;
      },
    },
    labelLine: { lineStyle: { color: "#cbd5e1" } },
    itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
    emphasis: { scaleSize: 6, itemStyle: { shadowBlur: 20, shadowColor: "rgba(0,0,0,0.15)" } },
    animationType: "scale", animationDuration: 800, animationEasing: "cubicOut",
  }];
}

function buildScatterSeries(datasets: DatasetItem[]) {
  return datasets.map((ds) => ({
    name: ds.name, type: "scatter" as const, data: ds.values,
    symbolSize: 14,
    emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(37, 99, 235, 0.4)" } },
    animationDuration: 800, animationEasing: "cubicOut",
  }));
}

// ========== 新增图表类型构建 ==========

/** 柱线混合：最后一个 dataset 渲染为 line，其余为 bar */
function buildBarLineSeries(datasets: DatasetItem[]) {
  return datasets.map((ds, idx) => {
    const isLine = idx === datasets.length - 1 && datasets.length > 1;
    if (isLine) {
      return {
        name: ds.name, type: "line" as const, data: ds.values,
        smooth: true, symbol: "circle", symbolSize: 6,
        lineStyle: { width: 2.5 },
        yAxisIndex: 1,
        animationDuration: 800, animationEasing: "cubicOut",
      };
    }
    return {
      name: ds.name, type: "bar" as const, data: ds.values,
      barMaxWidth: 40, itemStyle: { borderRadius: [4, 4, 0, 0] },
      animationDuration: 800, animationEasing: "cubicOut",
    };
  });
}

/** 瀑布图：用透明+实色堆叠 bar 模拟 */
function buildWaterfallSeries(datasets: DatasetItem[], colors: string[]) {
  const ds = datasets[0];
  if (!ds) return [];
  const values = ds.values;

  // 计算每个柱子的底部透明区域和实际显示值
  const transparentData: number[] = [];
  const positiveData: (number | string)[] = [];
  const negativeData: (number | string)[] = [];

  let cumulative = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    // 第一个和最后一个视为"总计"柱（从 0 开始）
    if (i === 0 || i === values.length - 1) {
      transparentData.push(0);
      positiveData.push(Math.abs(v));
      negativeData.push("-");
    } else if (v >= 0) {
      // 正增量不需要调整（从上一个累计值开始）
      transparentData.push(cumulative);
      positiveData.push(v);
      negativeData.push("-");
    } else {
      // 负增量：透明区域 = 累计值 + 负值（即新的累计值）
      transparentData.push(cumulative + v);
      positiveData.push("-");
      negativeData.push(Math.abs(v));
    }
    if (i > 0 && i < values.length - 1) {
      cumulative += v;
    }
  }

  return [
    {
      name: "透明",
      type: "bar" as const,
      stack: "waterfall",
      data: transparentData,
      barMaxWidth: 40,
      itemStyle: { color: "transparent" },
      emphasis: { itemStyle: { color: "transparent" } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    {
      name: "增加",
      type: "bar" as const,
      stack: "waterfall",
      data: positiveData,
      barMaxWidth: 40,
      itemStyle: { color: colors[0] || "#22c55e", borderRadius: [4, 4, 0, 0] },
      animationDuration: 800,
    },
    {
      name: "减少",
      type: "bar" as const,
      stack: "waterfall",
      data: negativeData,
      barMaxWidth: 40,
      itemStyle: { color: colors[1] || "#ef4444", borderRadius: [4, 4, 0, 0] },
      animationDuration: 800,
    },
  ];
}

/** 漏斗图 */
function buildFunnelSeries(labels: string[], datasets: DatasetItem[]) {
  const ds = datasets[0];
  const data = labels.map((l, i) => ({ name: l, value: ds?.values[i] ?? 0 }));
  return [{
    type: "funnel" as const,
    left: "10%", right: "10%", top: 80, bottom: 30,
    width: "80%",
    sort: "descending" as const,
    gap: 4,
    label: { show: true, position: "inside", fontSize: 13 },
    labelLine: { show: false },
    itemStyle: { borderColor: "#fff", borderWidth: 2, borderRadius: 4 },
    emphasis: { label: { fontSize: 16 } },
    data,
    animationDuration: 800, animationEasing: "cubicOut",
  }];
}

/** 仪表盘 */
function buildGaugeSeries(datasets: DatasetItem[]) {
  const ds = datasets[0];
  const value = ds?.values[0] ?? 0;
  return [{
    type: "gauge" as const,
    center: ["50%", "60%"],
    radius: "80%",
    startAngle: 200,
    endAngle: -20,
    min: 0,
    max: 100,
    progress: { show: true, width: 18 },
    pointer: { show: true, length: "60%", width: 6 },
    axisLine: { lineStyle: { width: 18 } },
    axisTick: { show: false },
    splitLine: { length: 10, lineStyle: { width: 2, color: "#999" } },
    axisLabel: { distance: 25, fontSize: 12, color: "#64748b" },
    detail: {
      fontSize: 28, fontWeight: 700,
      offsetCenter: [0, "40%"],
      formatter: "{value}%",
      color: "#1e293b",
    },
    data: [{ value, name: datasets[0]?.name || "" }],
    animationDuration: 800, animationEasing: "cubicOut",
  }];
}

/** 矩形树图 */
function buildTreemapSeries(labels: string[], datasets: DatasetItem[]) {
  const ds = datasets[0];
  const data = labels.map((l, i) => ({ name: l, value: ds?.values[i] ?? 0 }));
  return [{
    type: "treemap" as const,
    width: "90%", height: "75%",
    top: 60,
    roam: false,
    label: { show: true, fontSize: 13, color: "#fff", fontWeight: 600 },
    upperLabel: { show: false },
    itemStyle: { borderColor: "#fff", borderWidth: 3, gapWidth: 3, borderRadius: 4 },
    breadcrumb: { show: false },
    data,
    animationDuration: 800, animationEasing: "cubicOut",
  }];
}

// ========== 完整 Option 构建 ==========

function buildFullOption(
  chartType: DisplayChartType,
  labels: string[],
  datasets: DatasetItem[],
  title: string,
  subtitle: string,
  titleStyle: TitleStyle,
  colors: string[],
  legend: LegendConfig,
  legendSelected: Record<string, boolean>,
  gridPadding: GridPadding,
  xAxisConfig: XAxisConfig,
  yAxisConfig: YAxisConfig,
  xAxisName: string,
  yAxisName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawOption: Record<string, any> | null,
): echarts.EChartsCoreOption {
  const base = {
    color: colors,
    title: buildTitle(title, subtitle, titleStyle),
    toolbox: buildToolbox(title),
  };

  const baseType = getBaseChartType(chartType);

  // ========== 饼图类（pie / doughnut / rose） ==========
  if (baseType === "pie") {
    const pieBuildMap: Record<string, () => echarts.EChartsCoreOption["series"]> = {
      pie:      () => buildPieSeries(labels, datasets, xAxisConfig, yAxisConfig.numberFormat),
      doughnut: () => buildDoughnutSeries(labels, datasets, xAxisConfig, yAxisConfig.numberFormat),
      rose:     () => buildRoseSeries(labels, datasets, xAxisConfig, yAxisConfig.numberFormat),
    };

    return {
      ...base,
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        borderColor: "transparent",
        textStyle: { color: "#f1f5f9", fontSize: 13 },
        extraCssText: "max-width: 400px; white-space: normal; word-break: break-all;",
        formatter: (params: { name: string; value: number; percent: number; marker: string }) => {
          const fmtVal = formatTooltipValue(params.value, yAxisConfig.numberFormat);
          return `${params.marker} ${params.name}<br/><b>${fmtVal}</b> (${params.percent}%)`;
        },
      },
      legend: {
        orient: "vertical" as const, right: 20, top: "middle",
        textStyle: { color: "#64748b", fontSize: 12 },
        itemWidth: 12, itemHeight: 12, itemGap: 12,
        formatter: (name: string) => truncateLabel(name, xAxisConfig.labelMaxLength + 4),
        selected: Object.keys(legendSelected).length > 0 ? legendSelected : undefined,
      },
      series: (pieBuildMap[chartType] || pieBuildMap.pie)(),
    };
  }

  // ========== 雷达图 ==========
  if (baseType === "radar") {
    const maxValues = labels.map((_, i) => {
      const vals = datasets.map(ds => ds.values[i] ?? 0);
      return Math.max(...vals);
    });

    return {
      ...base,
      tooltip: { trigger: "item" },
      legend: buildLegend(legend, legendSelected),
      radar: {
        indicator: labels.map((name, i) => ({
          name,
          max: Math.ceil(maxValues[i] * 1.2) || 100,
        })),
        shape: "polygon" as const,
        radius: "60%",
        center: ["50%", "55%"],
        axisName: { color: "#64748b", fontSize: 12 },
        splitArea: { areaStyle: { color: ["rgba(37,99,235,0.02)", "rgba(37,99,235,0.05)"] } },
        splitLine: { lineStyle: { color: "#e2e8f0" } },
      },
      series: [{
        type: "radar" as const,
        data: datasets.map(ds => ({
          name: ds.name,
          value: ds.values,
          areaStyle: { opacity: 0.15 },
        })),
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2 },
        animationDuration: 800,
      }],
    };
  }

  // ========== 漏斗图 ==========
  if (baseType === "funnel") {
    return {
      ...base,
      tooltip: { trigger: "item", formatter: "{b}: {c}" },
      legend: buildLegend(legend, legendSelected),
      series: buildFunnelSeries(labels, datasets),
    };
  }

  // ========== 仪表盘 ==========
  if (baseType === "gauge") {
    return {
      ...base,
      series: buildGaugeSeries(datasets),
    };
  }

  // ========== 热力图 ==========
  if (baseType === "heatmap") {
    // X 轴 = labels, Y 轴 = dataset names, values = 热力值矩阵
    const yLabels = datasets.map(ds => ds.name);
    const heatData: [number, number, number][] = [];
    let maxVal = 0;
    datasets.forEach((ds, yi) => {
      ds.values.forEach((v, xi) => {
        heatData.push([xi, yi, v]);
        if (v > maxVal) maxVal = v;
      });
    });

    return {
      ...base,
      tooltip: {
        position: "top",
        formatter: (params: { value: [number, number, number] }) => {
          const [xi, yi, val] = params.value;
          return `${labels[xi]} × ${yLabels[yi]}: <b>${val}</b>`;
        },
      },
      grid: { top: 60, left: 80, right: 30, bottom: 40, containLabel: false },
      xAxis: {
        type: "category" as const,
        data: labels,
        axisLabel: { color: "#64748b", fontSize: 11 },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#e2e8f0" } },
        splitArea: { show: true },
      },
      yAxis: {
        type: "category" as const,
        data: yLabels,
        axisLabel: { color: "#64748b", fontSize: 11 },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#e2e8f0" } },
        splitArea: { show: true },
      },
      visualMap: {
        min: 0,
        max: maxVal || 10,
        calculable: true,
        orient: "horizontal" as const,
        left: "center",
        bottom: 4,
        inRange: { color: ["#e0f2fe", "#7dd3fc", "#0284c7", "#1e3a5f"] },
        textStyle: { color: "#64748b", fontSize: 11 },
      },
      series: [{
        type: "heatmap" as const,
        data: heatData,
        label: { show: true, color: "#1e293b", fontSize: 11 },
        itemStyle: { borderColor: "#fff", borderWidth: 2, borderRadius: 3 },
        emphasis: { itemStyle: { shadowBlur: 10 } },
        animationDuration: 800,
      }],
    };
  }

  // ========== 矩形树图 ==========
  if (baseType === "treemap") {
    return {
      ...base,
      tooltip: { trigger: "item", formatter: "{b}: {c}" },
      series: buildTreemapSeries(labels, datasets),
    };
  }

  // ========== 桑基图（使用 rawOption） ==========
  if (baseType === "sankey") {
    return {
      ...base,
      tooltip: { trigger: "item", triggerOn: "mousemove" },
      ...(rawOption || {}),
    };
  }

  // ========== 旭日图（使用 rawOption） ==========
  if (baseType === "sunburst") {
    return {
      ...base,
      tooltip: { trigger: "item" },
      ...(rawOption || {}),
    };
  }

  // ========== K线图 ==========
  if (baseType === "candlestick") {
    // 从 flattened 四元组数组解析 [open, close, low, high]
    const ds = datasets[0];
    const ohlcData: number[][] = [];
    if (ds) {
      for (let i = 0; i < ds.values.length; i += 4) {
        ohlcData.push([ds.values[i], ds.values[i + 1], ds.values[i + 2], ds.values[i + 3]]);
      }
    }

    return {
      ...base,
      tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
      legend: { show: false },
      grid: buildGrid(gridPadding),
      xAxis: buildXAxis(labels, xAxisConfig, xAxisName),
      yAxis: buildYAxis(yAxisConfig, yAxisName),
      series: [{
        type: "candlestick" as const,
        data: ohlcData,
        itemStyle: {
          color: "#ef4444",       // 阴线（跌）
          color0: "#22c55e",      // 阳线（涨）
          borderColor: "#ef4444",
          borderColor0: "#22c55e",
        },
        animationDuration: 800,
      }],
    };
  }

  // ========== 柱线混合 ==========
  if (chartType === "barLine") {
    const needsZoom = labels.length > 15;
    const dataZoom = needsZoom
      ? [{ type: "slider", bottom: 4, height: 20, start: 0, end: Math.min(100, (15 / labels.length) * 100) }]
      : undefined;

    return {
      ...base,
      tooltip: buildTooltip("axis", yAxisConfig.numberFormat),
      legend: buildLegend(legend, legendSelected),
      grid: buildGrid(gridPadding),
      xAxis: buildXAxis(labels, xAxisConfig, xAxisName),
      yAxis: [
        buildYAxis(yAxisConfig, yAxisName),
        {
          type: "value" as const,
          position: "right" as const,
          axisLabel: { color: "#94a3b8", fontSize: 12 },
          splitLine: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
        },
      ],
      ...(dataZoom ? { dataZoom } : {}),
      series: buildBarLineSeries(datasets),
    };
  }

  // ========== 瀑布图 ==========
  if (chartType === "waterfall") {
    return {
      ...base,
      tooltip: buildTooltip("axis", yAxisConfig.numberFormat),
      legend: { show: false },
      grid: buildGrid(gridPadding),
      xAxis: buildXAxis(labels, xAxisConfig, xAxisName),
      yAxis: buildYAxis(yAxisConfig, yAxisName),
      series: buildWaterfallSeries(datasets, colors),
    };
  }

  // ========== 标准轴图表（bar / line / scatter） ==========
  const seriesMap: Record<string, () => echarts.EChartsCoreOption["series"]> = {
    bar:          () => buildBarSeries(datasets),
    stackedBar:   () => buildStackedBarSeries(datasets),
    negativeBar:  () => buildNegativeBarSeries(datasets, colors),
    line:         () => buildLineSeries(datasets),
    smoothLine:   () => buildSmoothLineSeries(datasets),
    gradientArea: () => buildGradientAreaSeries(datasets, colors),
    stackedArea:  () => buildStackedAreaSeries(datasets),
    scatter:      () => buildScatterSeries(datasets),
  };

  const needsZoom = labels.length > 15;
  const dataZoom = needsZoom
    ? [{ type: "slider", bottom: 4, height: 20, start: 0, end: Math.min(100, (15 / labels.length) * 100) }]
    : undefined;

  return {
    ...base,
    tooltip: buildTooltip(baseType === "scatter" ? "item" : "axis", yAxisConfig.numberFormat),
    legend: buildLegend(legend, legendSelected),
    grid: buildGrid(gridPadding),
    xAxis: buildXAxis(labels, xAxisConfig, xAxisName),
    yAxis: buildYAxis(yAxisConfig, yAxisName),
    ...(dataZoom ? { dataZoom } : {}),
    series: (seriesMap[chartType] || seriesMap.bar)(),
  };
}

// ========== React 组件 ==========

export default function EditableChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  // 记录上一次的系列名，用于检测名称变更（触发 legendSelected 重置）
  const prevDatasetNamesRef = useRef<string[]>([]);

  // 从 store 读取所有状态
  const labels = useEditorStore((s) => s.labels);
  const datasets = useEditorStore((s) => s.datasets);
  const rawOption = useEditorStore((s) => s.rawOption);
  const chartType = useEditorStore((s) => s.chartType);
  const title = useEditorStore((s) => s.title);
  const subtitle = useEditorStore((s) => s.subtitle);
  const titleStyle = useEditorStore((s) => s.titleStyle);
  const colors = useEditorStore((s) => s.colors);
  const legend = useEditorStore((s) => s.legend);
  const legendSelected = useEditorStore((s) => s.legendSelected);
  const setLegendSelected = useEditorStore((s) => s.setLegendSelected);
  const gridPadding = useEditorStore((s) => s.gridPadding);
  const chartHeight = useEditorStore((s) => s.chartHeight);
  const xAxisConfig = useEditorStore((s) => s.xAxisConfig);
  const yAxisConfig = useEditorStore((s) => s.yAxisConfig);
  const xAxisName = useEditorStore((s) => s.xAxisName);
  const yAxisName = useEditorStore((s) => s.yAxisName);
  const fullThemeId = useEditorStore((s) => s.fullThemeId);
  const isEditMode = useEditorStore((s) => s.isEditMode);
  const setSelectedElement = useEditorStore((s) => s.setSelectedElement);
  const setYAxisConfig = useEditorStore((s) => s.setYAxisConfig);

  // 初始化 ECharts 实例 + ResizeObserver 监听容器尺寸变化
  // 当 fullThemeId 变化时重建实例以应用新主题
  useEffect(() => {
    if (!chartRef.current) return;
    const dom = chartRef.current;

    // 切换主题必须 dispose 再 init（ECharts 不支持动态换主题）
    if (chartInstance.current) {
      chartInstance.current.dispose();
      chartInstance.current = null;
    }

    // 确定初始化时使用的主题名
    const themeName = fullThemeId && FULL_THEMES.some((t) => t.id === fullThemeId) ? fullThemeId : undefined;
    chartInstance.current = echarts.init(dom, themeName, { renderer: "canvas" });
    // 暴露到 window，供 Header 的高清导出使用
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__ECHARTS_INSTANCE__ = chartInstance.current;
    // 暴露 echarts 库本身，供 Header 影子图层导出使用
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__ECHARTS_LIB__ = echarts;

    // 使用 ResizeObserver 监听容器 div 的尺寸变化
    let rafId: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        chartInstance.current?.resize();
        rafId = null;
      });
    });
    resizeObserver.observe(dom);

    // window resize 作为兜底
    const handleWindowResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", handleWindowResize);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleWindowResize);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__ECHARTS_INSTANCE__ = null;
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [fullThemeId]);

  // 数据变化时自动检测是否需要对数轴（仅对标准轴类型）
  useEffect(() => {
    const bt = getBaseChartType(chartType);
    if (datasets.length > 0 && (bt === "bar" || bt === "line" || bt === "scatter")) {
      if (chartType === "negativeBar" || chartType === "waterfall") {
        if (yAxisConfig.useLogScale) {
          setYAxisConfig({ useLogScale: false });
        }
        return;
      }
      const isSkewed = detectDataSkew(datasets);
      if (isSkewed && !yAxisConfig.useLogScale) {
        setYAxisConfig({ useLogScale: true });
        console.log("📊 检测到极端数据悬殊，已自动启用对数轴");
      } else if (!isSkewed && yAxisConfig.useLogScale) {
        setYAxisConfig({ useLogScale: false });
      }
    }
  }, [datasets, chartType]);

  // 数据或样式变化时重新渲染
  useEffect(() => {
    if (!chartInstance.current) return;

    // 特殊图表（桑基/旭日）使用 rawOption，可能 labels 为空
    const baseType = getBaseChartType(chartType);
    const usesRawOption = baseType === "sankey" || baseType === "sunburst";
    if (!usesRawOption && labels.length === 0) return;

    // 防爆清洗
    const { labels: safeLabels, datasets: safeDatasets } = sanitizeChartData(labels, datasets);

    const option = buildFullOption(
      chartType, safeLabels, safeDatasets, title, subtitle, titleStyle, colors, legend, legendSelected,
      gridPadding, xAxisConfig, yAxisConfig, xAxisName, yAxisName, rawOption,
    );
    chartInstance.current.setOption(option, { notMerge: true });
  }, [labels, datasets, rawOption, chartType, title, subtitle, titleStyle, colors, legend, legendSelected, gridPadding, xAxisConfig, yAxisConfig, xAxisName, yAxisName, fullThemeId]);

  // 监听用户点击图例
  useEffect(() => {
    if (!chartInstance.current) return;
    const onLegendChange = (params: { selected: Record<string, boolean> }) => {
      setLegendSelected({ ...params.selected });
    };
    chartInstance.current.on("legendselectchanged", onLegendChange as (...args: unknown[]) => void);
    return () => { chartInstance.current?.off("legendselectchanged", onLegendChange); };
  }, [setLegendSelected]);

  // 当数据系列名称发生变化时重置 legendSelected
  useEffect(() => {
    const currentNames = datasets.map((ds) => ds.name);
    const prev = prevDatasetNamesRef.current;
    const changed =
      currentNames.length !== prev.length ||
      currentNames.some((n, i) => n !== prev[i]);
    if (changed) {
      setLegendSelected({});
      prevDatasetNamesRef.current = currentNames;
    }
  }, [datasets, setLegendSelected]);

  // 编辑模式下监听标题点击
  useEffect(() => {
    if (!chartInstance.current) return;
    const handler = (params: { componentType?: string }) => {
      if (isEditMode && params.componentType === "title") {
        setSelectedElement("title");
      }
    };
    chartInstance.current.on("click", handler);
    return () => { chartInstance.current?.off("click", handler); };
  }, [isEditMode, setSelectedElement]);

  return (
    <div
      ref={chartRef}
      data-echarts-container
      className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm"
      style={{ height: chartHeight }}
    />
  );
}
