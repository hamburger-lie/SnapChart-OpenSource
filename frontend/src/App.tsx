/**
 * 主页面组件
 * 左右分栏布局：左侧配置面板 | 右侧图表预览 + 数据概要
 */

import { useState } from "react";
import {
  BarChart3,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import UploadArea from "./components/UploadArea";
import DynamicChart from "./components/DynamicChart";
import ChartConfigPanel, { COLOR_THEMES } from "./components/ChartConfigPanel";
import { uploadAndParse } from "./services/api";
import type {
  ChartData,
  AppStatus,
  DisplayChartType,
  ColorThemeId,
} from "./types/chart";

export default function App() {
  // ========== 全局状态 ==========
  const [status, setStatus] = useState<AppStatus>("idle");
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // ========== 图表配置状态（由配置面板控制） ==========
  const [displayChartType, setDisplayChartType] = useState<DisplayChartType>("bar");
  const [colorThemeId, setColorThemeId] = useState<ColorThemeId>("business");
  const [showRawJson, setShowRawJson] = useState(false);

  /** 根据主题 ID 获取对应的颜色数组 */
  const currentColors =
    COLOR_THEMES.find((t) => t.id === colorThemeId)?.colors ?? COLOR_THEMES[0].colors;

  /** 处理文件上传 */
  const handleFileSelect = async (file: File) => {
    setStatus("uploading");
    setChartData(null);
    setErrorMessage("");
    setShowRawJson(false);

    try {
      const response = await uploadAndParse(file);
      setChartData(response.data);
      setStatus("success");
      // 使用后端推荐的图表类型作为初始值
      const recommended = response.data.chartType;
      if (["bar", "line", "pie"].includes(recommended)) {
        setDisplayChartType(recommended as DisplayChartType);
      }
      console.log("✅ 后端返回的图表数据：", JSON.stringify(response.data, null, 2));
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      setErrorMessage(message);
      setStatus("error");
      console.error("❌ 上传失败：", message);
    }
  };

  /** 重置为初始状态 */
  const handleReset = () => {
    setStatus("idle");
    setChartData(null);
    setErrorMessage("");
    setShowRawJson(false);
    setDisplayChartType("bar");
    setColorThemeId("business");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-800">
              数据解析与图表可视化系统
            </h1>
          </div>
          {status === "success" && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              重新上传
            </button>
          )}
        </div>
      </header>

      {/* ========== 上传 / Loading / 错误 页面 ========== */}
      {status !== "success" && (
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-xl py-16">
            {/* 空闲 & 错误：展示上传区域 */}
            {(status === "idle" || status === "error") && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    上传数据文件
                  </h2>
                  <p className="text-gray-500">
                    上传 Excel 或 CSV 文件，系统将自动解析数据并生成可视化图表
                  </p>
                </div>
                <UploadArea onFileSelect={handleFileSelect} isUploading={false} />
                {status === "error" && (
                  <div className="mt-6 p-5 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-red-700 mb-1">解析失败</h3>
                        <p className="text-red-600 text-sm">{errorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 上传中 */}
            {status === "uploading" && (
              <div className="flex flex-col items-center gap-3 py-10">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-gray-500 text-lg">正在解析文件，请稍候...</p>
              </div>
            )}
          </div>
        </main>
      )}

      {/* ========== 成功页面：左右分栏布局 ========== */}
      {status === "success" && chartData && (
        <main className="flex-1 flex max-w-[1400px] w-full mx-auto">
          {/* 左侧：配置面板 */}
          <aside className="w-64 shrink-0 border-r border-gray-200 bg-white/60 backdrop-blur px-5 py-6 overflow-y-auto">
            <ChartConfigPanel
              chartType={displayChartType}
              colorTheme={colorThemeId}
              onChartTypeChange={setDisplayChartType}
              onColorThemeChange={setColorThemeId}
            />
          </aside>

          {/* 右侧：图表预览 + 数据概要 */}
          <div className="flex-1 min-w-0 px-8 py-6 space-y-6 overflow-y-auto">
            {/* 状态标题 */}
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-700">数据解析成功</h3>
              <span className="ml-1 px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium uppercase">
                {displayChartType}
              </span>
            </div>

            {/* 数据概要卡片 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <p className="text-2xl font-bold text-gray-800">
                  {chartData.labels.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">数据分类数</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <p className="text-2xl font-bold text-gray-800">
                  {chartData.datasets.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">数据系列数</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <p className="text-2xl font-bold text-gray-800 truncate px-2">
                  {chartData.title}
                </p>
                <p className="text-sm text-gray-500 mt-1">图表标题</p>
              </div>
            </div>

            {/* ECharts 图表 */}
            <DynamicChart
              data={chartData}
              chartType={displayChartType}
              colors={currentColors}
            />

            {/* 折叠式原始 JSON */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="w-full px-5 py-3 flex items-center justify-between text-sm text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="font-mono">查看原始 JSON 数据</span>
                {showRawJson ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {showRawJson && (
                <div className="border-t border-gray-200 bg-gray-900">
                  <pre className="p-5 text-sm text-green-300 overflow-x-auto leading-relaxed font-mono">
                    {JSON.stringify(chartData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* 底部 */}
      <footer className="text-center py-6 text-sm text-gray-400 border-t border-gray-100">
        数据解析与图表可视化系统 v1.0
      </footer>
    </div>
  );
}
