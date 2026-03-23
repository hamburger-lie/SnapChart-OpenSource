/**
 * 文本样式编辑器
 * 编辑标题、副标题、坐标轴单位标签、字号、字重、颜色
 */

import { useEditorStore } from "../../store";
import { getBaseChartType } from "../../constants/chartTemplates";

export default function TextStyleEditor() {
  const title = useEditorStore((s) => s.title);
  const subtitle = useEditorStore((s) => s.subtitle);
  const titleStyle = useEditorStore((s) => s.titleStyle);
  const setTitle = useEditorStore((s) => s.setTitle);
  const setSubtitle = useEditorStore((s) => s.setSubtitle);
  const setTitleStyle = useEditorStore((s) => s.setTitleStyle);
  const xAxisName = useEditorStore((s) => s.xAxisName);
  const yAxisName = useEditorStore((s) => s.yAxisName);
  const setXAxisName = useEditorStore((s) => s.setXAxisName);
  const setYAxisName = useEditorStore((s) => s.setYAxisName);
  const chartType = useEditorStore((s) => s.chartType);

  const isPie = getBaseChartType(chartType) === "pie";

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <Field label="图表标题">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors"
          placeholder="输入图表标题"
        />
      </Field>

      {/* 副标题 */}
      <Field label="副标题（可选）">
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors"
          placeholder="如：数据来源 / 时间范围 / 单位说明"
        />
      </Field>

      {/* 坐标轴单位 */}
      {!isPie && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="X 轴标签">
            <input
              value={xAxisName}
              onChange={(e) => setXAxisName(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-400"
              placeholder="如：月份"
            />
          </Field>
          <Field label="Y 轴标签">
            <input
              value={yAxisName}
              onChange={(e) => setYAxisName(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-400"
              placeholder="如：万元"
            />
          </Field>
        </div>
      )}

      {/* 字号 */}
      <Field label={`标题字号：${titleStyle.fontSize}px`}>
        <input
          type="range" min={12} max={36}
          value={titleStyle.fontSize}
          onChange={(e) => setTitleStyle({ fontSize: Number(e.target.value) })}
          className="w-full accent-blue-600"
        />
      </Field>

      {/* 字重 */}
      <Field label="字重">
        <div className="flex gap-1">
          {[
            { label: "细", value: 300 },
            { label: "常规", value: 400 },
            { label: "中", value: 500 },
            { label: "粗", value: 600 },
            { label: "黑", value: 700 },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setTitleStyle({ fontWeight: value })}
              className={`flex-1 py-1.5 text-[10px] rounded-md transition-colors cursor-pointer ${
                titleStyle.fontWeight === value
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      {/* 标题颜色 */}
      <Field label="标题颜色">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={titleStyle.color}
            onChange={(e) => setTitleStyle({ color: e.target.value })}
            className="w-7 h-7 rounded border border-gray-200 cursor-pointer"
          />
          <input
            value={titleStyle.color}
            onChange={(e) => setTitleStyle({ color: e.target.value })}
            className="flex-1 px-2.5 py-1.5 text-xs font-mono border border-gray-200 rounded-lg outline-none focus:border-blue-400"
          />
        </div>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
