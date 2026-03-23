/**
 * 编辑器三栏布局（可折叠版）
 * 左右侧边栏均支持收起/展开，最大化画布空间
 */

import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useEditorStore } from "../../store";
import ChartGallery from "../left-panel/ChartGallery";
import ChartCanvas from "../canvas/ChartCanvas";
import ConfigPanel from "../right-panel/ConfigPanel";

export default function EditorLayout() {
  const leftCollapsed = useEditorStore((s) => s.leftPanelCollapsed);
  const rightCollapsed = useEditorStore((s) => s.rightPanelCollapsed);
  const toggleLeft = useEditorStore((s) => s.toggleLeftPanel);
  const toggleRight = useEditorStore((s) => s.toggleRightPanel);

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* ====== 左侧面板 ====== */}
      <aside
        className={`shrink-0 border-r border-gray-200 bg-gray-50/50 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out ${
          leftCollapsed ? "w-0 border-r-0" : "w-56"
        }`}
      >
        <div className="w-56">
          <ChartGallery />
        </div>
      </aside>

      {/* 左侧折叠按钮 */}
      <button
        onClick={toggleLeft}
        className="absolute top-2 left-1 z-20 p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
        style={{ left: leftCollapsed ? 4 : 216 }}
        title={leftCollapsed ? "展开图表库" : "收起图表库"}
      >
        {leftCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
      </button>

      {/* ====== 中间画布 ====== */}
      <main className="flex-1 min-w-0 bg-gray-100/50 overflow-y-auto">
        <ChartCanvas />
      </main>

      {/* 右侧折叠按钮 */}
      <button
        onClick={toggleRight}
        className="absolute top-2 z-20 p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
        style={{ right: rightCollapsed ? 4 : 308 }}
        title={rightCollapsed ? "展开配置面板" : "收起配置面板"}
      >
        {rightCollapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
      </button>

      {/* ====== 右侧面板 ====== */}
      <aside
        className={`shrink-0 border-l border-gray-200 bg-white overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out ${
          rightCollapsed ? "w-0 border-l-0" : "w-[300px]"
        }`}
      >
        <div className="w-[300px]">
          <ConfigPanel />
        </div>
      </aside>
    </div>
  );
}
