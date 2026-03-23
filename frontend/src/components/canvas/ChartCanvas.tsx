/**
 * 图表画布容器
 * 包裹 EditableChart，管理编辑模式下的内联文本编辑覆盖层
 */

import { useEditorStore } from "../../store";
import EditableChart from "./EditableChart";
import InlineTextEditor from "./InlineTextEditor";

export default function ChartCanvas() {
  const title = useEditorStore((s) => s.title);
  const setTitle = useEditorStore((s) => s.setTitle);
  const selectedElement = useEditorStore((s) => s.selectedElement);
  const setSelectedElement = useEditorStore((s) => s.setSelectedElement);
  const isEditMode = useEditorStore((s) => s.isEditMode);
  const labels = useEditorStore((s) => s.labels);
  const datasets = useEditorStore((s) => s.datasets);

  const hasData = labels.length > 0 && datasets.length > 0;

  return (
    <div className="p-6 h-full flex flex-col">
      {/* 数据概要 */}
      {hasData && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 border border-gray-200 text-center">
            <p className="text-xl font-bold text-gray-800">{labels.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">分类数</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200 text-center">
            <p className="text-xl font-bold text-gray-800">{datasets.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">系列数</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200 text-center">
            <p className="text-xl font-bold text-gray-800 truncate px-1">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">标题</p>
          </div>
        </div>
      )}

      {/* 图表容器 */}
      {hasData ? (
        <div className="relative flex-1">
          <EditableChart />

          {/* 编辑模式提示 */}
          {isEditMode && !selectedElement && (
            <div className="absolute top-4 left-4 px-2.5 py-1 bg-blue-600 text-white text-xs rounded-md shadow-lg pointer-events-none">
              编辑模式 — 点击标题可直接编辑
            </div>
          )}

          {/* 标题内联编辑 */}
          {selectedElement === "title" && (
            <InlineTextEditor
              value={title}
              onConfirm={(val) => {
                setTitle(val);
                setSelectedElement(null);
              }}
              onCancel={() => setSelectedElement(null)}
            />
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          请先上传数据文件或从左侧选择样式
        </div>
      )}
    </div>
  );
}
