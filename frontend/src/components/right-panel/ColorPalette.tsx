/**
 * 色彩控制面板
 * 预设主题快速切换 + 单个颜色自定义编辑（react-colorful 调色盘）
 */

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { useEditorStore } from "../../store";
import { COLOR_THEMES } from "../../constants/themes";

export default function ColorPalette() {
  const colors = useEditorStore((s) => s.colors);
  const colorThemeId = useEditorStore((s) => s.colorThemeId);
  const setColor = useEditorStore((s) => s.setColor);
  const applyColorTheme = useEditorStore((s) => s.applyColorTheme);
  const datasets = useEditorStore((s) => s.datasets);

  // 当前打开调色盘的颜色索引（null = 未打开）
  const [activeColorIdx, setActiveColorIdx] = useState<number | null>(null);

  return (
    <div className="space-y-5">
      {/* 预设主题快速切换 */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">
          预设主题
        </label>
        <div className="space-y-1.5">
          {COLOR_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => applyColorTheme(theme.id)}
              className={`w-full px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
                colorThemeId === theme.id
                  ? "bg-blue-50 border border-blue-200"
                  : "bg-gray-50 border border-gray-200 hover:border-gray-300"
              }`}
            >
              <p
                className={`text-xs font-medium mb-1.5 ${
                  colorThemeId === theme.id ? "text-blue-700" : "text-gray-600"
                }`}
              >
                {theme.name}
              </p>
              <div className="flex gap-0.5">
                {theme.colors.slice(0, 8).map((c, i) => (
                  <div
                    key={i}
                    className="h-3 flex-1 rounded-sm first:rounded-l last:rounded-r"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 逐个颜色自定义 */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">
          自定义颜色（点击色块编辑）
        </label>
        <div className="flex flex-wrap gap-2">
          {colors.slice(0, Math.max(datasets.length, 4)).map((color, i) => (
            <div key={i} className="relative">
              <button
                onClick={() =>
                  setActiveColorIdx(activeColorIdx === i ? null : i)
                }
                className={`w-9 h-9 rounded-lg border-2 transition-all cursor-pointer ${
                  activeColorIdx === i
                    ? "border-blue-500 scale-110 shadow-md"
                    : "border-gray-200 hover:border-gray-400"
                }`}
                style={{ backgroundColor: color }}
                title={`系列 ${i + 1}: ${datasets[i]?.name || ""}`}
              />
            </div>
          ))}
        </div>

        {/* 调色盘弹出层 */}
        {activeColorIdx !== null && (
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {datasets[activeColorIdx]?.name || `系列 ${activeColorIdx + 1}`}
              </span>
              <button
                onClick={() => setActiveColorIdx(null)}
                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                关闭
              </button>
            </div>
            <HexColorPicker
              color={colors[activeColorIdx]}
              onChange={(c) => setColor(activeColorIdx, c)}
              style={{ width: "100%" }}
            />
            <input
              value={colors[activeColorIdx]}
              onChange={(e) => setColor(activeColorIdx, e.target.value)}
              className="w-full px-2 py-1 text-xs font-mono text-center border border-gray-200 rounded outline-none focus:border-blue-400"
            />
          </div>
        )}
      </div>
    </div>
  );
}
