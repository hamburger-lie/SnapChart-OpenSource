/**
 * 左侧图表模板画廊（重构版）
 * 按 柱状图 / 折线图 / 饼图 / 散点图 大类分组
 * 每组内展示多个模板变体（基础、堆叠、渐变等）
 * 点击模板仅切换视觉配置，绝不清空用户数据
 */

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { useEditorStore } from "../../store";
import { TEMPLATE_GROUPS, type ChartTemplate, type TemplateGroup } from "../../constants/chartTemplates";
import type { DisplayChartType } from "../../types/chart";

export default function ChartGallery() {
  const chartType = useEditorStore((s) => s.chartType);
  const setChartType = useEditorStore((s) => s.setChartType);
  const savedStyles = useEditorStore((s) => s.savedStyles);
  const fetchStyles = useEditorStore((s) => s.fetchStyles);
  const loadStyle = useEditorStore((s) => s.loadStyle);
  const deleteStyle = useEditorStore((s) => s.deleteStyle);
  const setTitle = useEditorStore((s) => s.setTitle);
  const setColors = useEditorStore((s) => s.setColors);

  // 组件挂载时加载样式列表
  useEffect(() => {
    fetchStyles();
  }, [fetchStyles]);

  /** 加载并应用保存的样式 */
  const handleLoadStyle = async (id: string) => {
    const style = await loadStyle(id);
    if (!style) return;
    setChartType(style.chart_type as DisplayChartType);
    const opt = style.echarts_option;
    if (opt.title && typeof opt.title === "object" && "text" in opt.title) {
      setTitle(opt.title.text as string);
    }
    if (Array.isArray(opt.color)) {
      setColors(opt.color as string[]);
    }
  };

  return (
    <div className="p-3 space-y-1">
      {/* 标题 */}
      <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
        图表模板
      </h3>

      {/* 按大类分组 */}
      {TEMPLATE_GROUPS.map((group) => (
        <TemplateGroupSection
          key={group.category}
          group={group}
          currentType={chartType}
          onSelect={setChartType}
        />
      ))}

      {/* 已保存的样式 */}
      {savedStyles.length > 0 && (
        <div className="pt-3 border-t border-gray-100 mt-3">
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            已保存样式
          </h3>
          <div className="space-y-1">
            {savedStyles.map((style) => (
              <div
                key={style.id}
                className="group flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer"
                onClick={() => handleLoadStyle(style.id)}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">
                    {style.name}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase">
                    {style.chart_type}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteStyle(style.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ========== 模板分组折叠区 ==========

function TemplateGroupSection({
  group,
  currentType,
  onSelect,
}: {
  group: TemplateGroup;
  currentType: DisplayChartType;
  onSelect: (type: DisplayChartType) => void;
}) {
  // 如果当前选中的类型属于该组，默认展开
  const isGroupActive = group.templates.some((t) => t.id === currentType);
  const [expanded, setExpanded] = useState(isGroupActive);

  // 当外部切换导致激活状态变化时自动展开
  useEffect(() => {
    if (isGroupActive) setExpanded(true);
  }, [isGroupActive]);

  return (
    <div className="rounded-lg overflow-hidden">
      {/* 分组标题 */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`w-full flex items-center gap-1.5 px-2 py-2 text-xs font-medium transition-colors cursor-pointer rounded-lg ${
          isGroupActive
            ? "text-blue-700 bg-blue-50/60"
            : "text-gray-500 hover:bg-gray-100/60"
        }`}
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        )}
        <span>{group.label}</span>
        <span className="text-[10px] text-gray-400 ml-auto">{group.templates.length}</span>
      </button>

      {/* 模板列表 */}
      {expanded && (
        <div className="grid grid-cols-2 gap-1.5 px-1 pb-2 pt-1">
          {group.templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isActive={currentType === template.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ========== 单个模板卡片 ==========

function TemplateCard({
  template,
  isActive,
  onSelect,
}: {
  template: ChartTemplate;
  isActive: boolean;
  onSelect: (type: DisplayChartType) => void;
}) {
  return (
    <button
      onClick={() => onSelect(template.id)}
      className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
        isActive
          ? "bg-blue-50 text-blue-700 border-2 border-blue-300 shadow-sm"
          : "bg-white text-gray-500 border border-gray-200 hover:border-blue-200 hover:bg-blue-50/30"
      }`}
      title={template.desc}
    >
      {/* 缩略图 SVG */}
      <div
        className="w-full h-8"
        dangerouslySetInnerHTML={{ __html: template.thumbnail }}
      />
      <span className="leading-tight">{template.label}</span>
    </button>
  );
}
