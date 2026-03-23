/**
 * 样式保存组件
 * 将当前图表配置保存为可复用模板
 */

import { useState } from "react";
import { Save, Check } from "lucide-react";
import { useEditorStore } from "../../store";

export default function StyleSaveDialog() {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const chartType = useEditorStore((s) => s.chartType);
  const title = useEditorStore((s) => s.title);
  const titleStyle = useEditorStore((s) => s.titleStyle);
  const colors = useEditorStore((s) => s.colors);
  const legend = useEditorStore((s) => s.legend);
  const gridPadding = useEditorStore((s) => s.gridPadding);
  const chartHeight = useEditorStore((s) => s.chartHeight);
  const labels = useEditorStore((s) => s.labels);
  const datasets = useEditorStore((s) => s.datasets);
  const saveCurrentStyle = useEditorStore((s) => s.saveCurrentStyle);

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const echartsOption = {
        title: { text: title, textStyle: titleStyle },
        color: colors,
        legend,
        grid: gridPadding,
        chartHeight,
      };
      const dataSnapshot = { labels, datasets };

      await saveCurrentStyle(name.trim(), chartType, echartsOption, dataSnapshot);
      setSaved(true);
      setName("");
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // 错误已在 slice 中打印
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-gray-500">
        保存当前样式为模板
      </label>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="输入样式名称..."
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors"
        />
        <button
          onClick={handleSave}
          disabled={!name.trim() || isSaving}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            saved
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          }`}
        >
          {saved ? (
            <>
              <Check className="w-3.5 h-3.5" />
              已保存
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              保存
            </>
          )}
        </button>
      </div>
    </div>
  );
}
