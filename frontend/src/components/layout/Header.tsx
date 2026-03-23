/**
 * 顶部工具栏
 * 品牌标识 + 编辑模式切换 + 高清导出 + 导入/重置
 */

import { BarChart3, Upload, RotateCcw, Pencil, Eye, Download } from "lucide-react";
import { useEditorStore } from "../../store";

interface HeaderProps {
  onUploadClick: () => void;
}

export default function Header({ onUploadClick }: HeaderProps) {
  const appStatus = useEditorStore((s) => s.appStatus);
  const isEditMode = useEditorStore((s) => s.isEditMode);
  const toggleEditMode = useEditorStore((s) => s.toggleEditMode);
  const resetAll = useEditorStore((s) => s.resetAll);
  const title = useEditorStore((s) => s.title);

  const isEditorView = appStatus === "success";

  /** 高清导出函数：强制 pixelRatio=3，不受浏览器缩放影响 */
  const handleExportHD = () => {
    // 查找 ECharts 实例所在的容器
    const chartDom = document.querySelector("[data-echarts-container]") as HTMLDivElement | null;
    if (!chartDom) return;

    // 通过 ECharts 全局 API 获取实例
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const echartsLib = (window as any).__ECHARTS_INSTANCE__;
    if (!echartsLib) return;

    const dataURL = echartsLib.getDataURL({
      type: "png",
      pixelRatio: 3,
      backgroundColor: "#fff",
      excludeComponents: ["toolbox"],
    });

    // 创建下载链接
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `${title || "chart"}_HD.png`;
    link.click();
  };

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
      {/* 品牌 */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <span className="text-base font-semibold text-gray-800">SnapChart</span>
        {isEditorView && (
          <span className="text-[10px] text-gray-400 ml-1 hidden sm:inline">图表编辑器</span>
        )}
      </div>

      {/* 操作区 */}
      {isEditorView && (
        <div className="flex items-center gap-1.5">
          <HeaderBtn
            onClick={toggleEditMode}
            active={isEditMode}
            icon={isEditMode ? <Eye className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
            label={isEditMode ? "预览" : "编辑"}
          />
          <HeaderBtn
            onClick={handleExportHD}
            icon={<Download className="w-3.5 h-3.5" />}
            label="导出HD"
          />
          <HeaderBtn
            onClick={onUploadClick}
            icon={<Upload className="w-3.5 h-3.5" />}
            label="导入"
          />
          <HeaderBtn
            onClick={resetAll}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            label="重置"
          />
        </div>
      )}
    </header>
  );
}

function HeaderBtn({
  onClick,
  icon,
  label,
  active,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
        active
          ? "bg-blue-50 text-blue-700 border border-blue-200"
          : "text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
