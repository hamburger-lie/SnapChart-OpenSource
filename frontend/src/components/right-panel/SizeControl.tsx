/**
 * 布局与坐标轴控制面板
 * 图表高度 + 图例 + 内边距 + X轴标签 + Y轴格式化 + 对数轴
 */

import { useEditorStore } from "../../store";
import { getBaseChartType } from "../../constants/chartTemplates";

/** 预设高度选项 */
const HEIGHT_PRESETS = [
  { label: "S", value: 320 },
  { label: "M", value: 480 },
  { label: "L", value: 640 },
  { label: "XL", value: 800 },
];

export default function SizeControl() {
  const chartHeight = useEditorStore((s) => s.chartHeight);
  const setChartSize = useEditorStore((s) => s.setChartSize);
  const gridPadding = useEditorStore((s) => s.gridPadding);
  const setGridPadding = useEditorStore((s) => s.setGridPadding);
  const legend = useEditorStore((s) => s.legend);
  const setLegend = useEditorStore((s) => s.setLegend);
  const xAxisConfig = useEditorStore((s) => s.xAxisConfig);
  const setXAxisConfig = useEditorStore((s) => s.setXAxisConfig);
  const yAxisConfig = useEditorStore((s) => s.yAxisConfig);
  const setYAxisConfig = useEditorStore((s) => s.setYAxisConfig);
  const yAxisName = useEditorStore((s) => s.yAxisName);
  const setYAxisName = useEditorStore((s) => s.setYAxisName);
  const chartType = useEditorStore((s) => s.chartType);

  const isPie = getBaseChartType(chartType) === "pie";

  return (
    <div className="space-y-5">
      {/* ===== 图表高度 ===== */}
      <Section title={`图表高度：${chartHeight}px`}>
        <div className="flex gap-1.5 mb-2">
          {HEIGHT_PRESETS.map(({ label, value }) => (
            <ToggleButton
              key={value}
              active={chartHeight === value}
              onClick={() => setChartSize(0, value)}
            >
              {label}
            </ToggleButton>
          ))}
        </div>
        <input
          type="range" min={240} max={1000} step={10} value={chartHeight}
          onChange={(e) => setChartSize(0, Number(e.target.value))}
          className="w-full accent-blue-600"
        />
      </Section>

      {/* ===== X 轴标签控制 ===== */}
      {!isPie && (
        <Section title="X 轴标签">
          {/* 标签截断长度 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-gray-400 w-16 shrink-0">截断字数</span>
            <input
              type="range" min={4} max={20} value={xAxisConfig.labelMaxLength}
              onChange={(e) => setXAxisConfig({ labelMaxLength: Number(e.target.value) })}
              className="flex-1 accent-blue-600"
            />
            <span className="text-xs text-gray-500 w-6 text-right">{xAxisConfig.labelMaxLength}</span>
          </div>

          {/* 自动旋转 vs 手动旋转 */}
          <div className="flex items-center gap-2 mb-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox" checked={xAxisConfig.autoRotate}
                onChange={(e) => setXAxisConfig({ autoRotate: e.target.checked })}
                className="accent-blue-600"
              />
              自动旋转
            </label>
          </div>

          {!xAxisConfig.autoRotate && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 w-16 shrink-0">旋转角度</span>
              <input
                type="range" min={0} max={90} step={5} value={xAxisConfig.labelRotate}
                onChange={(e) => setXAxisConfig({ labelRotate: Number(e.target.value) })}
                className="flex-1 accent-blue-600"
              />
              <span className="text-xs text-gray-500 w-8 text-right">{xAxisConfig.labelRotate}°</span>
            </div>
          )}
        </Section>
      )}

      {/* ===== Y 轴控制 ===== */}
      {!isPie && (
        <Section title="Y 轴">
          {/* ── 数值格式化模式 ── */}
          <p className="text-[10px] text-gray-400 mb-1.5">数值格式</p>
          <div className="flex gap-1.5 mb-1.5">
            {([
              { id: "smart" as const,   label: "智能" },
              { id: "raw" as const,     label: "原始" },
              { id: "percent" as const, label: "百分比" },
            ]).map(({ id, label }) => (
              <ToggleButton
                key={id}
                active={yAxisConfig.numberFormat === id}
                onClick={() => setYAxisConfig({ numberFormat: id })}
              >
                {label}
              </ToggleButton>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mb-3">
            {yAxisConfig.numberFormat === "smart" && "自动使用 万/亿 等单位，告别长串零"}
            {yAxisConfig.numberFormat === "raw" && "显示原始数值，不做任何转换"}
            {yAxisConfig.numberFormat === "percent" && "所有数值后追加 % 符号"}
          </p>

          {/* ── 单位名称 ── */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] text-gray-400 w-14 shrink-0">轴单位</span>
            <input
              type="text"
              value={yAxisName}
              placeholder="如：分、万元、cm"
              onChange={(e) => setYAxisName(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded outline-none focus:border-blue-400"
            />
          </div>

          {/* ── 自适应缩放 ── */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs text-gray-700">自适应缩放</span>
              <p className="text-[10px] text-gray-400">不强制从 0 开始，贴近数据范围</p>
            </div>
            <Switch
              checked={yAxisConfig.autoScale}
              disabled={yAxisConfig.useLogScale}
              onChange={(v) => setYAxisConfig({ autoScale: v })}
              color="blue"
            />
          </div>

          {/* ── 强制极值 ── */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <p className="text-[10px] text-gray-400 mb-1">最小值</p>
              <input
                type="number"
                value={yAxisConfig.min ?? ""}
                placeholder="自动"
                disabled={yAxisConfig.useLogScale}
                onChange={(e) =>
                  setYAxisConfig({ min: e.target.value === "" ? null : Number(e.target.value) })
                }
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded outline-none focus:border-blue-400 disabled:opacity-40"
              />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-1">最大值</p>
              <input
                type="number"
                value={yAxisConfig.max ?? ""}
                placeholder="自动"
                disabled={yAxisConfig.useLogScale}
                onChange={(e) =>
                  setYAxisConfig({ max: e.target.value === "" ? null : Number(e.target.value) })
                }
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded outline-none focus:border-blue-400 disabled:opacity-40"
              />
            </div>
          </div>

          {/* ── 对数轴开关 ── */}
          <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-amber-800">对数轴 (Log Scale)</span>
                <p className="text-[10px] text-amber-600 mt-0.5">
                  数据差距极大时启用，让小值也清晰可见
                </p>
              </div>
              <Switch
                checked={yAxisConfig.useLogScale}
                onChange={(v) => {
                  // 开启对数轴时，同步关闭自适应缩放并清空极值（log 轴有自己的处理）
                  setYAxisConfig({ useLogScale: v, ...(v ? { autoScale: false, min: null, max: null } : {}) });
                }}
                color="amber"
              />
            </div>
          </div>
        </Section>
      )}

      {/* ===== 图例 ===== */}
      <Section title="图例">
        <div className="flex items-center gap-3 mb-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox" checked={legend.show}
              onChange={(e) => setLegend({ show: e.target.checked })}
              className="accent-blue-600"
            />
            显示图例
          </label>
        </div>
        {legend.show && (
          <div className="flex gap-1.5">
            {(["top", "bottom", "left", "right"] as const).map((pos) => (
              <ToggleButton
                key={pos}
                active={legend.position === pos}
                onClick={() => setLegend({ position: pos })}
              >
                {{ top: "上", bottom: "下", left: "左", right: "右" }[pos]}
              </ToggleButton>
            ))}
          </div>
        )}
      </Section>

      {/* ===== 内边距 ===== */}
      <Section title="内边距 (px)">
        <div className="grid grid-cols-2 gap-2">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <div key={side} className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 w-6">
                {{ top: "上", right: "右", bottom: "下", left: "左" }[side]}
              </span>
              <input
                type="number" value={gridPadding[side]}
                onChange={(e) => setGridPadding({ [side]: Number(e.target.value) })}
                className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded outline-none focus:border-blue-400 w-0"
              />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ========== 内部通用小组件 ==========

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-2">{title}</label>
      {children}
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
        active
          ? "bg-blue-50 text-blue-700 border border-blue-200"
          : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

/** 开关按钮（iOS 风格） */
function Switch({
  checked,
  onChange,
  disabled = false,
  color = "blue",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  color?: "blue" | "amber";
}) {
  const trackOn = color === "amber" ? "bg-amber-500" : "bg-blue-500";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
        checked ? trackOn : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
