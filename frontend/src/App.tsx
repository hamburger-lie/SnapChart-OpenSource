/**
 * 主页面入口
 * idle 状态：展示上传页面
 * success 状态：展示三栏编辑器
 * 支持弹窗式数据导入
 */

import { useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import Header from "./components/layout/Header";
import EditorLayout from "./components/layout/EditorLayout";
import UploadArea from "./components/UploadArea";
import { uploadAndParse } from "./services/api";
import { useEditorStore } from "./store";
import type { DisplayChartType } from "./types/chart";

export default function App() {
  const appStatus = useEditorStore((s) => s.appStatus);
  const errorMessage = useEditorStore((s) => s.errorMessage);
  const setAppStatus = useEditorStore((s) => s.setAppStatus);
  const importFromUpload = useEditorStore((s) => s.importFromUpload);
  const setTitle = useEditorStore((s) => s.setTitle);
  const setChartType = useEditorStore((s) => s.setChartType);

  // 弹窗式上传对话框状态
  const [showUploadModal, setShowUploadModal] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  /** 处理文件上传 */
  const handleFileSelect = async (file: File) => {
    setAppStatus("uploading");
    setShowUploadModal(false);

    try {
      const response = await uploadAndParse(file);
      // 导入数据到 store
      importFromUpload(response.data);
      setTitle(response.data.title);
      // 使用后端推荐的图表类型
      if (["bar", "line", "pie"].includes(response.data.chartType)) {
        setChartType(response.data.chartType as DisplayChartType);
      }
      setAppStatus("success");
      console.log("✅ 数据导入成功");
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      setAppStatus("error", message);
      console.error("❌ 上传失败：", message);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <Header onUploadClick={() => setShowUploadModal(true)} />

      {/* 主内容区 */}
      {appStatus === "idle" || appStatus === "error" ? (
        /* 首页：上传区域 */
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                上传数据文件
              </h2>
              <p className="text-gray-500">
                上传 Excel 或 CSV 文件，进入图表编辑器
              </p>
            </div>
            <UploadArea onFileSelect={handleFileSelect} isUploading={false} />
            {appStatus === "error" && (
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
          </div>
        </main>
      ) : appStatus === "uploading" ? (
        /* 加载中 */
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-gray-500 text-lg">正在解析文件，请稍候...</p>
          </div>
        </main>
      ) : (
        /* 编辑器三栏布局 */
        <EditorLayout />
      )}

      {/* 弹窗式上传对话框（在编辑器中导入新数据） */}
      {showUploadModal && (
        <div
          ref={backdropRef}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === backdropRef.current) setShowUploadModal(false);
          }}
        >
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              导入新数据
            </h3>
            <UploadArea
              onFileSelect={handleFileSelect}
              isUploading={false}
            />
            <button
              onClick={() => setShowUploadModal(false)}
              className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
