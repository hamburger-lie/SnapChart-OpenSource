/**
 * SharedViewer — AI Agent 共享图表只读查看页
 *
 * 路由：/share/:uuid
 *
 * 设计原则：
 *   - 无任何编辑控件，100% 宽度展示图表
 *   - 保留 ECharts tooltip（悬浮交互）
 *   - 保留右上角"高清导出 PNG"工具栏按钮（saveAsImage）
 *   - 数据加载失败时展示优雅的 404/Error 状态
 *   - 完全独立，不依赖全局 store
 */

import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { fetchSharedChart } from "../services/api";
import type { SharedChartData, SharedDatasetItem } from "../types/chart";

// 按需注册 ECharts 组件
echarts.use([
  BarChart, LineChart, PieChart,
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, ToolboxComponent, DataZoomComponent,
  CanvasRenderer,
]);

// ========== 默认调色板 ==========
const DEFAULT_COLORS = [
  "#2563eb", "#16a34a", "#dc2626", "#d97706",
  "#7c3aed", "#0891b2", "#db2777", "#65a30d",
];

// ========== 图表 Option 构建 ==========

function buildOption(data: SharedChartData): echarts.EChartsCoreOption {
  const colors = data.theme?.colors?.length ? data.theme.colors : DEFAULT_COLORS;
  const { chartType, title, labels, datasets } = data;

  // 公共配置
  const baseOption = {
    color: colors,
    title: {
      text: title,
      left: "center",
      top: 14,
      textStyle: { fontSize: 18, fontWeight: "bold" as const, color: "#1e293b" },
    },
    toolbox: {
      right: 20,
      top: 14,
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
    },
  };

  // 饼图系列（pie / doughnut / rose）
  const isPie = ["pie", "doughnut", "rose"].includes(chartType);
  if (isPie) {
    const ds: SharedDatasetItem = datasets[0] ?? { name: "", values: [] };
    const pieData = labels.map((l, i) => ({ name: l, value: ds.values[i] ?? 0 }));

    const radiusMap: Record<string, [string, string]> = {
      pie:      ["0%",  "68%"],
      doughnut: ["40%", "68%"],
      rose:     ["15%", "68%"],
    };
    const radius = radiusMap[chartType] ?? radiusMap.pie;

    return {
      ...baseOption,
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(15,23,42,0.92)",
        borderColor: "transparent",
        textStyle: { color: "#f1f5f9", fontSize: 13 },
        formatter: "{b}<br/><b>{c}</b>（{d}%）",
      },
      legend: {
        orient: "vertical" as const,
        right: 20,
        top: "middle",
        textStyle: { color: "#64748b", fontSize: 12 },
      },
      series: [{
        type: "pie" as const,
        radius,
        center: ["42%", "55%"],
        ...(chartType === "rose" ? { roseType: "area" as const } : {}),
        data: pieData,
        label: { color: "#475569", fontSize: 12 },
        labelLine: { lineStyle: { color: "#cbd5e1" } },
        itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 3 },
        emphasis: { scaleSize: 8, itemStyle: { shadowBlur: 20, shadowColor: "rgba(0,0,0,0.15)" } },
        animationType: "scale",
        animationDuration: 800,
      }],
    };
  }

  // 非饼图（bar / line 及其子类型）
  const needsZoom = labels.length > 15;

  const seriesBuilders: Record<string, () => echarts.EChartsCoreOption["series"]> = {
    bar: () => datasets.map((ds) => ({
      name: ds.name, type: "bar" as const, data: ds.values,
      barMaxWidth: 48,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      animationDuration: 800,
    })),
    stackedBar: () => datasets.map((ds) => ({
      name: ds.name, type: "bar" as const, data: ds.values,
      stack: "total", barMaxWidth: 48,
      itemStyle: { borderRadius: [2, 2, 0, 0] },
      animationDuration: 800,
    })),
    line: () => datasets.map((ds) => ({
      name: ds.name, type: "line" as const, data: ds.values,
      smooth: false, symbol: "circle", symbolSize: 6,
      lineStyle: { width: 2.5 },
      animationDuration: 800,
    })),
    smoothLine: () => datasets.map((ds) => ({
      name: ds.name, type: "line" as const, data: ds.values,
      smooth: true, symbol: "circle", symbolSize: 6,
      lineStyle: { width: 2.5 },
      animationDuration: 800,
    })),
    gradientArea: () => datasets.map((ds, idx) => {
      const base = colors[idx % colors.length];
      return {
        name: ds.name, type: "line" as const, data: ds.values,
        smooth: true, symbol: "circle", symbolSize: 5,
        lineStyle: { width: 2.5, color: base },
        areaStyle: {
          color: {
            type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: base + "80" },
              { offset: 1, color: base + "08" },
            ],
          },
        },
        animationDuration: 800,
      };
    }),
    stackedArea: () => datasets.map((ds) => ({
      name: ds.name, type: "line" as const, data: ds.values,
      smooth: true, stack: "total", symbol: "none",
      lineStyle: { width: 1.5 }, areaStyle: { opacity: 0.4 },
      animationDuration: 800,
    })),
  };

  const buildSeries = seriesBuilders[chartType] ?? seriesBuilders.bar;

  return {
    ...baseOption,
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(15,23,42,0.92)",
      borderColor: "transparent",
      textStyle: { color: "#f1f5f9", fontSize: 13 },
      axisPointer: { type: "shadow" as const },
    },
    legend: {
      top: 48,
      left: "center",
      textStyle: { color: "#64748b", fontSize: 13 },
      itemWidth: 14, itemHeight: 10, itemGap: 16,
    },
    grid: { top: 90, bottom: needsZoom ? 60 : 30, left: 20, right: 20, containLabel: true },
    xAxis: {
      type: "category" as const,
      data: labels,
      axisLabel: { color: "#64748b", fontSize: 12 },
      axisLine: { lineStyle: { color: "#e2e8f0" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: { color: "#94a3b8", fontSize: 12 },
      splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" as const } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    ...(needsZoom ? {
      dataZoom: [{ type: "slider", bottom: 4, height: 20, start: 0, end: Math.min(100, (15 / labels.length) * 100) }],
    } : {}),
    series: buildSeries(),
  };
}

// ========== 状态 UI ==========

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-4">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-base">正在加载图表...</p>
    </div>
  );
}

function NotFoundState({ uuid }: { uuid: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-6 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center text-4xl">
        📊
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">图表不存在</h1>
        <p className="text-gray-500 text-sm max-w-sm">
          无法找到 ID 为 <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">{uuid}</code> 的图表。
          <br />该图表可能已被删除，或链接有误。
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-6 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-orange-50 flex items-center justify-center text-4xl">
        ⚠️
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">加载失败</h1>
        <p className="text-gray-500 text-sm max-w-sm">{message}</p>
      </div>
    </div>
  );
}

// ========== 主组件 ==========

export default function SharedViewer() {
  const { uuid } = useParams<{ uuid: string }>();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const [status, setStatus] = useState<"loading" | "success" | "notfound" | "error">("loading");
  const [chartData, setChartData] = useState<SharedChartData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // 拉取图表数据
  useEffect(() => {
    if (!uuid) { setStatus("notfound"); return; }

    fetchSharedChart(uuid)
      .then((data) => {
        setChartData(data);
        setStatus("success");
      })
      .catch((err: Error) => {
        if (err.message === "CHART_NOT_FOUND") {
          setStatus("notfound");
        } else {
          setErrorMsg(err.message);
          setStatus("error");
        }
      });
  }, [uuid]);

  // 初始化 ECharts 实例
  useEffect(() => {
    if (status !== "success" || !chartRef.current || !chartData) return;

    const dom = chartRef.current;
    chartInstance.current = echarts.init(dom, undefined, { renderer: "canvas" });

    const option = buildOption(chartData);
    chartInstance.current.setOption(option);

    // ResizeObserver 让图表跟随容器自适应
    let rafId: number | null = null;
    const ro = new ResizeObserver(() => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        chartInstance.current?.resize();
        rafId = null;
      });
    });
    ro.observe(dom);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("resize", handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [status, chartData]);

  // 状态分支渲染
  if (status === "loading") return <LoadingState />;
  if (status === "notfound") return <NotFoundState uuid={uuid ?? ""} />;
  if (status === "error") return <ErrorState message={errorMsg} />;

  // 成功：全屏纯净图表（无任何控制面板）
  return (
    <div className="w-screen h-screen bg-white flex flex-col">
      {/* 图表容器：占满整个视口 */}
      <div
        ref={chartRef}
        className="flex-1 w-full"
        style={{ minHeight: 0 }}
      />
    </div>
  );
}
