/**
 * 可编辑数据网格（v2）
 * 优化：长文本标签截断显示 + 大数值智能格式化 + Tooltip 显示完整内容
 */

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useEditorStore } from "../../store";

/** 格式化大数值在网格中的显示 */
function formatGridNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e8) return `${(value / 1e8).toFixed(1)}亿`;
  if (abs >= 1e4) return `${(value / 1e4).toFixed(1)}万`;
  return value.toLocaleString("zh-CN");
}

export default function DataGridEditor() {
  const labels = useEditorStore((s) => s.labels);
  const datasets = useEditorStore((s) => s.datasets);
  const updateLabel = useEditorStore((s) => s.updateLabel);
  const updateDatasetValue = useEditorStore((s) => s.updateDatasetValue);
  const renameDataset = useEditorStore((s) => s.renameDataset);
  const addRow = useEditorStore((s) => s.addRow);
  const removeRow = useEditorStore((s) => s.removeRow);
  const addDataset = useEditorStore((s) => s.addDataset);
  const removeDataset = useEditorStore((s) => s.removeDataset);

  // 当前正在编辑的单元格 [行, 列]（-1 标签列，-2 列头，0+ 数据列）
  const [editingCell, setEditingCell] = useState<[number, number] | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (row: number, col: number, currentValue: string) => {
    setEditingCell([row, col]);
    setEditValue(currentValue);
  };

  const confirmEdit = () => {
    if (!editingCell) return;
    const [row, col] = editingCell;

    if (col === -1) {
      updateLabel(row, editValue);
    } else if (col === -2) {
      renameDataset(row, editValue);
    } else {
      const num = parseFloat(editValue);
      updateDatasetValue(col, row, isNaN(num) ? 0 : num);
    }
    setEditingCell(null);
  };

  /** 渲染标签单元格（长文本截断，Tooltip 显示完整） */
  const renderLabelCell = (row: number, label: string) => {
    const isEditing = editingCell?.[0] === row && editingCell?.[1] === -1;

    if (isEditing) {
      return (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={confirmEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmEdit();
            if (e.key === "Escape") setEditingCell(null);
          }}
          className="w-full px-1.5 py-0.5 text-xs border border-blue-400 rounded outline-none bg-blue-50"
        />
      );
    }

    return (
      <div
        onDoubleClick={() => startEdit(row, -1, label)}
        className="px-1.5 py-1 text-xs text-gray-600 cursor-text truncate hover:bg-blue-50/50 rounded max-w-[120px]"
        title={label}
      >
        {label}
      </div>
    );
  };

  /** 渲染数值单元格（大数值格式化，编辑时恢复原始值） */
  const renderValueCell = (rowIdx: number, colIdx: number, rawValue: number) => {
    const isEditing = editingCell?.[0] === rowIdx && editingCell?.[1] === colIdx;

    if (isEditing) {
      return (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={confirmEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmEdit();
            if (e.key === "Escape") setEditingCell(null);
          }}
          className="w-full px-1.5 py-0.5 text-xs text-right border border-blue-400 rounded outline-none bg-blue-50"
        />
      );
    }

    const displayVal = formatGridNumber(rawValue);
    const fullVal = rawValue.toLocaleString("zh-CN");

    return (
      <div
        onDoubleClick={() => startEdit(rowIdx, colIdx, String(rawValue))}
        className="px-1.5 py-1 text-xs text-right text-gray-700 cursor-text truncate hover:bg-blue-50/50 rounded"
        title={displayVal !== fullVal ? `原始值：${fullVal}` : undefined}
      >
        {displayVal}
      </div>
    );
  };

  /** 渲染列头（系列名） */
  const renderHeaderCell = (idx: number, name: string) => {
    const isEditing = editingCell?.[0] === idx && editingCell?.[1] === -2;

    if (isEditing) {
      return (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={confirmEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmEdit();
            if (e.key === "Escape") setEditingCell(null);
          }}
          className="w-full px-1.5 py-0.5 text-xs text-right border border-blue-400 rounded outline-none bg-blue-50"
        />
      );
    }

    return (
      <div
        onDoubleClick={() => startEdit(idx, -2, name)}
        className="px-1.5 py-0.5 text-xs text-right text-gray-600 cursor-text truncate hover:bg-blue-50/50 rounded"
        title={name}
      >
        {name}
      </div>
    );
  };

  if (labels.length === 0) {
    return (
      <div className="text-center text-gray-400 text-sm py-8">
        暂无数据，请先上传文件
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 数据表格 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[50vh]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-2 py-1.5 text-left text-gray-500 font-medium w-28 min-w-[80px]">
                  标签
                </th>
                {datasets.map((ds, i) => (
                  <th key={i} className="px-2 py-1.5 font-medium min-w-[80px] max-w-[120px]">
                    {renderHeaderCell(i, ds.name)}
                  </th>
                ))}
                <th className="w-7 bg-gray-50" />
              </tr>
            </thead>
            <tbody>
              {labels.map((label, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                >
                  <td className="px-2 py-0.5">{renderLabelCell(rowIdx, label)}</td>
                  {datasets.map((ds, colIdx) => (
                    <td key={colIdx} className="px-2 py-0.5">
                      {renderValueCell(rowIdx, colIdx, ds.values[rowIdx] ?? 0)}
                    </td>
                  ))}
                  <td className="px-1">
                    <button
                      onClick={() => removeRow(rowIdx)}
                      className="p-0.5 text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={addRow}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          添加行
        </button>
        <button
          onClick={() => addDataset(`系列${datasets.length + 1}`)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          添加列
        </button>
        {datasets.length > 1 && (
          <button
            onClick={() => removeDataset(datasets.length - 1)}
            className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg hover:border-red-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            <Minus className="w-3 h-3" />
            删除末列
          </button>
        )}
      </div>
    </div>
  );
}
