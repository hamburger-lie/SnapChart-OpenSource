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

  const isEditorView = appStatus === "success";

  /**
   * 高清导出函数 —— 影子图层策略
   * 1:1 复制主实例的尺寸和全部配置，唯一改动是物理删除未选中的系列和图例。
   * 从影子实例截图后立即销毁，主图表完全不受影响。
   */
  const handleExportHD = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mainInstance = (window as any).__ECHARTS_INSTANCE__;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const echartsLib = (window as any).__ECHARTS_LIB__;
    if (!mainInstance || !echartsLib) return;

    // 1. 获取主实例的实际渲染尺寸（与屏幕上看到的完全一致）
    const mainWidth = mainInstance.getWidth();
    const mainHeight = mainInstance.getHeight();

    // 2. 从主实例获取当前完整配置
    const rawOption = mainInstance.getOption();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const legendSelected: Record<string, boolean> =
      (rawOption.legend?.[0]?.selected as any) || {};

    // 3. 深拷贝配置，用于影子实例（保留所有布局参数，不做任何覆盖）
    const shadowOption = JSON.parse(JSON.stringify(rawOption));

    // 4.【核心】仅保留被选中的系列
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shadowOption.series = shadowOption.series.filter((s: any) => {
      return legendSelected[s.name] !== false;
    });

    // 5. 同步过滤图例 data，使图例栏也只显示选中项（无灰色文字）
    if (shadowOption.legend?.[0]?.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shadowOption.legend[0].data = shadowOption.legend[0].data.filter((item: any) => {
        const name = typeof item === "string" ? item : item?.name;
        return legendSelected[name] !== false;
      });
      // 清除 selected 映射，因为已经物理移除了未选中项
      delete shadowOption.legend[0].selected;
    }

    // 6. 隐藏工具栏（导出不需要）
    if (shadowOption.toolbox?.[0]) {
      shadowOption.toolbox[0].show = false;
    }

    // 7. 关闭动画，加速渲染
    shadowOption.animation = false;

    // 8. 创建与主实例同尺寸的隐藏影子容器
    const shadowDiv = document.createElement("div");
    shadowDiv.style.cssText =
      `position:fixed;left:-9999px;top:-9999px;width:${mainWidth}px;height:${mainHeight}px;pointer-events:none;opacity:0;`;
    document.body.appendChild(shadowDiv);

    // 9. 在影子容器中初始化临时 ECharts 实例（与主实例完全同尺寸）
    const shadowInstance = echartsLib.init(shadowDiv, undefined, {
      renderer: "canvas",
      width: mainWidth,
      height: mainHeight,
    });

    // 10. 渲染影子实例（配置与主实例一致，只是少了未选中的系列）
    shadowInstance.setOption(shadowOption);

    // 11. 等待渲染完成后截图
    setTimeout(() => {
      try {
        const dataURL = shadowInstance.getDataURL({
          type: "png",
          pixelRatio: 3,
          backgroundColor: "#fff",
        });

        // 12. 触发下载
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `${useEditorStore.getState().title || "chart"}_HD.png`;
        link.click();
      } finally {
        // 13. 销毁影子实例 + 移除容器
        shadowInstance.dispose();
        document.body.removeChild(shadowDiv);
      }
    }, 100);
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
