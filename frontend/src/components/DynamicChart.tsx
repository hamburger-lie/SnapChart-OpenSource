/**
 * 动态图表组件（增强版）
 * 支持 5 种图表类型 + 4 套色彩主题的动态切换
 * 基于原生 ECharts + React useRef/useEffect 封装
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
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { ChartData, DisplayChartType } from "../types/chart";

// 按需注册 ECharts 组件
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,
  CanvasRenderer,
]);

interface DynamicChartProps {
  /** 后端返回的原始图表数据 */
  data: ChartData;
  /** 用户选择的图表类型（由配置面板控制） */
  chartType: DisplayChartType;
  /** 当前色彩主题的颜色数组 */
  colors: string[];
}

// ========== 通用配置片段 ==========

/** 标题配置 */
function titleConfig(text: string) {
  return {
    text,
    left: "center",
    top: 16,
    textStyle: { fontSize: 18, fontWeight: 600, color: "#1e293b" },
  };
}

/** 工具栏：导出高清 PNG */
function toolboxConfig(title: string) {
  return {
    right: 20,
    top: 12,
    feature: {
      saveAsImage: {
        title: "导出为图片",
        pixelRatio: 3,
        backgroundColor: "#ffffff",
        name: title || "chart",
      },
    },
    iconStyle: { borderColor: "#94a3b8" },
    emphasis: { iconStyle: { borderColor: "#2563eb" } },
  };
}

/** 深色半透明提示框样式 */
const TOOLTIP_STYLE = {
  backgroundColor: "rgba(15, 23, 42, 0.9)",
  borderColor: "transparent",
  textStyle: { color: "#f1f5f9", fontSize: 13 },
};

// ========== 各图表类型的 option 构建 ==========

/** 柱状图 */
function buildBarOption(data: ChartData, colors: string[]): echarts.EChartsCoreOption {
  return {
    color: colors,
    title: titleConfig(data.title),
    tooltip: { trigger: "axis", ...TOOLTIP_STYLE, axisPointer: { type: "shadow" } },
    legend: legendHorizontal(),
    toolbox: toolboxConfig(data.title),
    grid: gridConfig(data),
    xAxis: xAxisConfig(data),
    yAxis: yAxisConfig(),
    series: data.datasets.map((ds) => ({
      name: ds.name,
      type: "bar" as const,
      data: ds.values,
      barMaxWidth: 40,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(37, 99, 235, 0.3)" } },
      animationDuration: 800,
      animationEasing: "cubicOut",
    })),
  };
}

/** 折线图（平滑曲线） */
function buildLineOption(data: ChartData, colors: string[]): echarts.EChartsCoreOption {
  return {
    color: colors,
    title: titleConfig(data.title),
    tooltip: { trigger: "axis", ...TOOLTIP_STYLE },
    legend: legendHorizontal(),
    toolbox: toolboxConfig(data.title),
    grid: gridConfig(data),
    xAxis: xAxisConfig(data),
    yAxis: yAxisConfig(),
    series: data.datasets.map((ds) => ({
      name: ds.name,
      type: "line" as const,
      data: ds.values,
      smooth: true,
      symbol: "circle",
      symbolSize: 6,
      lineStyle: { width: 2.5 },
      areaStyle: { opacity: 0 }, // 纯折线，无填充
      animationDuration: 800,
      animationEasing: "cubicOut",
    })),
  };
}

/** 面积堆叠图 */
function buildStackedAreaOption(data: ChartData, colors: string[]): echarts.EChartsCoreOption {
  return {
    color: colors,
    title: titleConfig(data.title),
    tooltip: { trigger: "axis", ...TOOLTIP_STYLE },
    legend: legendHorizontal(),
    toolbox: toolboxConfig(data.title),
    grid: gridConfig(data),
    xAxis: xAxisConfig(data),
    yAxis: yAxisConfig(),
    series: data.datasets.map((ds) => ({
      name: ds.name,
      type: "line" as const,
      data: ds.values,
      smooth: true,
      stack: "total",            // 堆叠关键字
      symbol: "none",
      lineStyle: { width: 1.5 },
      areaStyle: { opacity: 0.4 }, // 半透明填充
      emphasis: { focus: "series" as const },
      animationDuration: 800,
      animationEasing: "cubicOut",
    })),
  };
}

/** 饼图 / 环形图 —— 数据结构转换：datasets → [{name, value}] */
function buildPieOption(data: ChartData, colors: string[]): echarts.EChartsCoreOption {
  const dataset = data.datasets[0];
  const pieData = data.labels.map((label, i) => ({
    name: label,
    value: dataset?.values[i] ?? 0,
  }));

  return {
    color: colors,
    title: titleConfig(data.title),
    tooltip: {
      trigger: "item",
      ...TOOLTIP_STYLE,
      formatter: "{b}：{c} ({d}%)",
    },
    legend: {
      orient: "vertical" as const,
      right: 20,
      top: "middle",
      textStyle: { color: "#64748b", fontSize: 13 },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 14,
    },
    toolbox: toolboxConfig(data.title),
    series: [
      {
        type: "pie" as const,
        radius: ["40%", "68%"],
        center: ["42%", "55%"],
        data: pieData,
        label: { color: "#475569", fontSize: 13, formatter: "{b}\n{d}%" },
        labelLine: { lineStyle: { color: "#cbd5e1" } },
        itemStyle: { borderRadius: 6, borderColor: "#ffffff", borderWidth: 3 },
        emphasis: {
          scaleSize: 8,
          itemStyle: { shadowBlur: 20, shadowColor: "rgba(0, 0, 0, 0.15)" },
        },
        animationType: "scale",
        animationDuration: 800,
        animationEasing: "cubicOut",
      },
    ],
  };
}

/** 散点图 —— 将分类数据映射为散点 */
function buildScatterOption(data: ChartData, colors: string[]): echarts.EChartsCoreOption {
  return {
    color: colors,
    title: titleConfig(data.title),
    tooltip: {
      trigger: "item",
      ...TOOLTIP_STYLE,
      formatter: (params: { seriesName?: string; name?: string; value?: number }) =>
        `${params.seriesName}<br/>${params.name}：${params.value}`,
    },
    legend: legendHorizontal(),
    toolbox: toolboxConfig(data.title),
    grid: gridConfig(data),
    xAxis: {
      type: "category" as const,
      data: data.labels,
      axisLabel: {
        color: "#64748b",
        fontSize: 12,
        rotate: data.labels.length > 8 ? 30 : 0,
      },
      axisLine: { lineStyle: { color: "#e2e8f0" } },
      axisTick: { show: false },
    },
    yAxis: yAxisConfig(),
    series: data.datasets.map((ds) => ({
      name: ds.name,
      type: "scatter" as const,
      data: ds.values,
      symbolSize: 14,
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowColor: "rgba(37, 99, 235, 0.4)" },
      },
      animationDuration: 800,
      animationEasing: "cubicOut",
    })),
  };
}

// ========== 共用子配置工厂 ==========

function legendHorizontal() {
  return {
    top: 48,
    textStyle: { color: "#64748b", fontSize: 13 },
    itemWidth: 14,
    itemHeight: 10,
    itemGap: 20,
  };
}

function gridConfig(data: ChartData) {
  return {
    left: 20,
    right: 30,
    bottom: 16,
    top: 90,
    containLabel: true,
  };
}

function xAxisConfig(data: ChartData) {
  return {
    type: "category" as const,
    data: data.labels,
    axisLabel: {
      color: "#64748b",
      fontSize: 12,
      rotate: data.labels.length > 8 ? 30 : 0,
    },
    axisLine: { lineStyle: { color: "#e2e8f0" } },
    axisTick: { show: false },
  };
}

function yAxisConfig() {
  return {
    type: "value" as const,
    axisLabel: { color: "#94a3b8", fontSize: 12 },
    splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" as const } },
    axisLine: { show: false },
    axisTick: { show: false },
  };
}

// ========== 总调度器 ==========

function buildOption(
  data: ChartData,
  chartType: DisplayChartType,
  colors: string[]
): echarts.EChartsCoreOption {
  switch (chartType) {
    case "bar":         return buildBarOption(data, colors);
    case "line":        return buildLineOption(data, colors);
    case "stackedArea": return buildStackedAreaOption(data, colors);
    case "pie":         return buildPieOption(data, colors);
    case "scatter":     return buildScatterOption(data, colors);
    default:            return buildBarOption(data, colors);
  }
}

// ========== React 组件 ==========

export default function DynamicChart({ data, chartType, colors }: DynamicChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // 初始化 ECharts 实例
  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current, undefined, {
      renderer: "canvas",
    });

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  // data / chartType / colors 任意变化时重新渲染
  useEffect(() => {
    if (!chartInstance.current) return;
    const option = buildOption(data, chartType, colors);
    // notMerge=true：完整替换 option，避免类型切换时残留旧配置
    chartInstance.current.setOption(option, { notMerge: true });
  }, [data, chartType, colors]);

  return (
    <div
      ref={chartRef}
      className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm"
      style={{ height: 480 }}
    />
  );
}
