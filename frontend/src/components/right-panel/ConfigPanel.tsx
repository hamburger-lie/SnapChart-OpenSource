/**
 * 右侧配置面板（Tab 容器）
 * 整合数据网格、文本样式、尺寸控制、调色盘、样式保存五大功能区
 */

import { Table2, Type, Maximize2, Palette, BookmarkPlus } from "lucide-react";
import { useEditorStore } from "../../store";
import type { RightPanelTab } from "../../types/editor";
import DataGridEditor from "./DataGridEditor";
import TextStyleEditor from "./TextStyleEditor";
import SizeControl from "./SizeControl";
import ColorPalette from "./ColorPalette";
import StyleSaveDialog from "./StyleSaveDialog";

/** Tab 配置 */
const TABS: { id: RightPanelTab; label: string; icon: React.ReactNode }[] = [
  { id: "data",   label: "数据",  icon: <Table2 className="w-3.5 h-3.5" /> },
  { id: "text",   label: "文本",  icon: <Type className="w-3.5 h-3.5" /> },
  { id: "size",   label: "布局",  icon: <Maximize2 className="w-3.5 h-3.5" /> },
  { id: "color",  label: "配色",  icon: <Palette className="w-3.5 h-3.5" /> },
  { id: "styles", label: "保存",  icon: <BookmarkPlus className="w-3.5 h-3.5" /> },
];

export default function ConfigPanel() {
  const activeTab = useEditorStore((s) => s.activeRightPanel);
  const setActiveTab = useEditorStore((s) => s.setActiveRightPanel);

  return (
    <div className="flex flex-col h-full">
      {/* Tab 切换栏 */}
      <div className="flex border-b border-gray-200 shrink-0">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors cursor-pointer ${
              activeTab === id
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Tab 内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "data" && <DataGridEditor />}
        {activeTab === "text" && <TextStyleEditor />}
        {activeTab === "size" && <SizeControl />}
        {activeTab === "color" && <ColorPalette />}
        {activeTab === "styles" && <StyleSaveDialog />}
      </div>
    </div>
  );
}
