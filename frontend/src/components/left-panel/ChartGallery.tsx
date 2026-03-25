/**
 * 左侧图表模板画廊（增强版 v2）
 * 按 柱状图 / 折线图 / 饼图 / 散点图 / 雷达图 / 高级图表 大类分组
 * 顶部新增"快捷模板"区域，点击即加载结构 + mock 数据
 */

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { useEditorStore } from "../../store";
import {
  TEMPLATE_GROUPS,
  STRUCTURE_TEMPLATES,
  getBaseChartType,
  type ChartTemplate,
  type TemplateGroup,
  type StructureTemplate,
} from "../../constants/chartTemplates";
import type { DisplayChartType } from "../../types/chart";

/** 需要特殊数据结构、无法复用普通行列数据的图表类型 */
const SPECIAL_DATA_TYPES = new Set(["sankey", "sunburst"]);

export default function ChartGallery() {
  const chartType = useEditorStore((s) => s.chartType);
  const labels = useEditorStore((s) => s.labels);
  const datasets = useEditorStore((s) => s.datasets);
  const setChartType = useEditorStore((s) => s.setChartType);
  const setTitle = useEditorStore((s) => s.setTitle);
  const loadStructureData = useEditorStore((s) => s.loadStructureData);
  const savedStyles = useEditorStore((s) => s.savedStyles);
  const fetchStyles = useEditorStore((s) => s.fetchStyles);
  const loadStyle = useEditorStore((s) => s.loadStyle);
  const deleteStyle = useEditorStore((s) => s.deleteStyle);
  const setColors = useEditorStore((s) => s.setColors);

  // 组件挂载时加载样式列表
  useEffect(() => {
    fetchStyles();
  }, [fetchStyles]);

  /**
   * 智能融合（Smart Merge）策略：
   * - 用户已有数据 + 普通图表 → 仅切换 chartType，保留数据
   * - 用户已有数据 + 特殊图表（sankey/sunburst）→ 警告后覆盖
   * - 无数据 → 加载 mock 数据
   */
  const applyStructureTemplate = (tmpl: StructureTemplate) => {
    const hasUserData = labels.length > 0 && datasets.length > 0;
    const targetBase = getBaseChartType(tmpl.chartType);
    const isSpecial = SPECIAL_DATA_TYPES.has(targetBase);

    if (hasUserData && !isSpecial) {
      // 智能融合：保留用户数据，仅切换图表类型
      setChartType(tmpl.chartType);
      // 清除可能残留的 rawOption（从特殊图表切回普通图表时）
      loadStructureData({
        labels,
        datasets,
        rawOption: null,
      });
      return;
    }

    if (hasUserData && isSpecial) {
      // 特殊图表需要专属数据格式，弹窗确认
      const ok = window.confirm(
        `「${tmpl.label}」需要特定数据格式，将使用示例数据替换当前内容。\n\n确认切换？`,
      );
      if (!ok) return;
    }

    // 无数据 或 用户确认覆盖 → 全量加载 mock 数据
    setChartType(tmpl.chartType);
    setTitle(tmpl.mockData.title);
    loadStructureData({
      labels: tmpl.mockData.labels,
      datasets: tmpl.mockData.datasets,
      rawOption: tmpl.rawOption ?? null,
    });
  };

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
      {/* ========== 快捷模板（含示例数据） ========== */}
      <div className="mb-3">
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
          快捷模板（含示例数据）
        </h3>
        <div className="grid grid-cols-2 gap-1.5 px-1">
          {STRUCTURE_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => applyStructureTemplate(tmpl)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                chartType === tmpl.chartType
                  ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-300 shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30"
              }`}
              title={tmpl.desc}
            >
              <div
                className="h-14 w-full flex items-center justify-center overflow-hidden mb-1 [&_svg]:w-full [&_svg]:h-full"
                dangerouslySetInnerHTML={{ __html: tmpl.thumbnail }}
              />
              <span className="leading-tight truncate w-full text-center">{tmpl.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========== 分隔线 ========== */}
      <div className="border-t border-gray-200 my-2" />

      {/* ========== 图表类型模板 ========== */}
      <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
        图表类型
      </h3>

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
  const isGroupActive = group.templates.some((t) => t.id === currentType);
  const [expanded, setExpanded] = useState(isGroupActive);

  useEffect(() => {
    if (isGroupActive) setExpanded(true);
  }, [isGroupActive]);

  return (
    <div className="rounded-lg overflow-hidden">
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
      <div
        className="h-14 w-full flex items-center justify-center overflow-hidden mb-1 [&_svg]:w-full [&_svg]:h-full"
        dangerouslySetInnerHTML={{ __html: template.thumbnail }}
      />
      <span className="leading-tight truncate w-full text-center">{template.label}</span>
    </button>
  );
}
