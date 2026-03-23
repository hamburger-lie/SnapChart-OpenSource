/**
 * 可编辑图表组件（增强版 v2）
 * 核心升级：
 *   1. Y 轴智能数值格式化（万/亿/K/M/B 自适应）
 *   2. X 轴超长标签截断 + 智能旋转
 *   3. 对数轴支持（解决 Whale Test 数据悬殊问题）
 *   4. Tooltip 同步格式化（悬浮时也显示易读数值）
 */

import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart, ScatterChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useEditorStore } from "../../store";
import type { DatasetItem, DisplayChartType } from "../../types/chart";
import type { TitleStyle, LegendConfig, GridPadding, XAxisConfig, YAxisConfig } from "../../types/editor";
import { getBaseChartType } from "../../constants/chartTemplates";

// 按需注册（新增 DataZoom）
echarts.use([
  BarChart, LineChart, PieChart, ScatterChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, ToolboxComponent, DataZoomComponent,
  CanvasRenderer,
]);

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
  const allValues = datasets.flatMap((ds) => ds.values).filter((v) => v > 0);
  if (allValues.length < 2) return false;
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);
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
    // 将 store 中记录的点击状态回填，防止 notMerge:true 重置用户的图例选择
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
      // 超长标签截断，Tooltip 会显示完整文本
      formatter: (val: string) => truncateLabel(val, maxLen),
      // 标签间距，避免堆叠
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
    // 对数轴：固定从 1 开始，忽略 autoScale / min / max（log 轴自行处理）
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

  // 线性轴：精确映射三个新控制项
  return {
    type: "value" as const,
    // scale: true → 轴不强制从 0 开始（仅在未手动设置 min 时生效）
    scale: yConfig.autoScale && yConfig.min === null,
    // 强制极值（null → undefined → 交由 ECharts 自动计算）
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
      // 完整的 X 轴标签（不截断）
      let result = `<div style="font-weight:600;margin-bottom:6px">${params[0].axisValueLabel}</div>`;
      for (const p of params) {
        const fmtVal = formatTooltipValue(p.value, numberFormat);
        result += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0">${p.marker}<span>${p.seriesName}</span><span style="margin-left:auto;font-weight:600">${fmtVal}</span></div>`;
      }
      return result;
    },
  };
}

// ========== 各图表类型构建 ==========

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
  // 对每个数据值，正值用第一色，负值用第二色
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
): echarts.EChartsCoreOption {
  const base = {
    color: colors,
    title: buildTitle(title, subtitle, titleStyle),
    toolbox: buildToolbox(title),
  };

  const baseType = getBaseChartType(chartType);

  // 饼图类走独立路径（pie / doughnut / rose）
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

  // 非饼图类型（bar / line / scatter 及其子类型）
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

  // 数据量过多时自动启用滚动条
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
  const isEditMode = useEditorStore((s) => s.isEditMode);
  const setSelectedElement = useEditorStore((s) => s.setSelectedElement);
  const setYAxisConfig = useEditorStore((s) => s.setYAxisConfig);

  // 初始化 ECharts 实例 + ResizeObserver 监听容器尺寸变化
  useEffect(() => {
    if (!chartRef.current) return;
    const dom = chartRef.current;

    chartInstance.current = echarts.init(dom, undefined, { renderer: "canvas" });
    // 暴露到 window，供 Header 的高清导出使用
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__ECHARTS_INSTANCE__ = chartInstance.current;

    // 使用 ResizeObserver 监听容器 div 的尺寸变化
    // 当侧边栏折叠/展开触发 CSS transition 时，容器宽度持续变化
    // ResizeObserver 会连续触发回调，配合 rAF 实现丝滑跟随
    let rafId: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      // 合并同一帧内的多次触发，避免重复 resize
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        chartInstance.current?.resize();
        rafId = null;
      });
    });
    resizeObserver.observe(dom);

    // window resize 作为兜底（如浏览器窗口缩放）
    const handleWindowResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", handleWindowResize);

    return () => {
      // 清理所有副作用
      if (rafId !== null) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleWindowResize);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__ECHARTS_INSTANCE__ = null;
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  // 数据变化时自动检测是否需要对数轴（仅在用户未手动开启时干预）
  useEffect(() => {
    if (datasets.length > 0 && getBaseChartType(chartType) !== "pie") {
      const isSkewed = detectDataSkew(datasets);
      if (isSkewed && !yAxisConfig.useLogScale) {
        setYAxisConfig({ useLogScale: true, autoScale: false, min: null, max: null });
        console.log("📊 检测到极端数据悬殊，已自动启用对数轴");
      } else if (!isSkewed && yAxisConfig.useLogScale) {
        setYAxisConfig({ useLogScale: false });
      }
    }
  }, [datasets, chartType]);

  // 数据或样式变化时重新渲染
  useEffect(() => {
    if (!chartInstance.current || labels.length === 0) return;
    const option = buildFullOption(
      chartType, labels, datasets, title, subtitle, titleStyle, colors, legend, legendSelected,
      gridPadding, xAxisConfig, yAxisConfig, xAxisName, yAxisName,
    );
    chartInstance.current.setOption(option, { notMerge: true });
  }, [labels, datasets, chartType, title, subtitle, titleStyle, colors, legend, legendSelected, gridPadding, xAxisConfig, yAxisConfig, xAxisName, yAxisName]);

  // 监听用户点击图例 → 将 ECharts 内部 selected 状态提升到 store
  // 这是防止 notMerge:true 每次重绘时重置图例选中状态的关键
  useEffect(() => {
    if (!chartInstance.current) return;
    const onLegendChange = (params: { selected: Record<string, boolean> }) => {
      setLegendSelected({ ...params.selected });
    };
    chartInstance.current.on("legendselectchanged", onLegendChange);
    return () => { chartInstance.current?.off("legendselectchanged", onLegendChange); };
  }, [setLegendSelected]);

  // 当数据系列名称发生变化时（新上传、重命名、增删系列），重置 legendSelected
  // 避免旧系列名的 key 污染新图表的显示状态
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
