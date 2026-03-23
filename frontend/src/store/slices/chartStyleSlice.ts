/**
 * 图表样式 Slice
 * 管理图表类型、标题/副标题、颜色、尺寸、图例、坐标轴等所有视觉配置
 */

import type { StateCreator } from "zustand";
import type { DisplayChartType, ColorThemeId } from "../../types/chart";
import type { TitleStyle, LegendConfig, GridPadding, XAxisConfig, YAxisConfig } from "../../types/editor";
import { COLOR_THEMES } from "../../constants/themes";

export interface ChartStyleSlice {
  chartType: DisplayChartType;
  setChartType: (type: DisplayChartType) => void;

  // 标题 + 副标题
  title: string;
  subtitle: string;
  titleStyle: TitleStyle;
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  setTitleStyle: (style: Partial<TitleStyle>) => void;

  // 坐标轴单位标签
  xAxisName: string;
  yAxisName: string;
  setXAxisName: (name: string) => void;
  setYAxisName: (name: string) => void;

  // 颜色
  colors: string[];
  colorThemeId: ColorThemeId;
  setColor: (index: number, color: string) => void;
  setColors: (colors: string[]) => void;
  applyColorTheme: (themeId: ColorThemeId) => void;

  // 尺寸
  chartWidth: number;
  chartHeight: number;
  setChartSize: (w: number, h: number) => void;

  // 图例
  legend: LegendConfig;
  setLegend: (config: Partial<LegendConfig>) => void;
  /** 用户在画布上点击图例后的选中状态（key = 系列名，value = 是否可见） */
  legendSelected: Record<string, boolean>;
  setLegendSelected: (selected: Record<string, boolean>) => void;

  // 网格
  gridPadding: GridPadding;
  setGridPadding: (padding: Partial<GridPadding>) => void;

  // 坐标轴配置
  xAxisConfig: XAxisConfig;
  yAxisConfig: YAxisConfig;
  setXAxisConfig: (config: Partial<XAxisConfig>) => void;
  setYAxisConfig: (config: Partial<YAxisConfig>) => void;
}

export const createChartStyleSlice: StateCreator<ChartStyleSlice> = (set) => ({
  chartType: "bar",
  setChartType: (chartType) => set({ chartType }),

  title: "数据概览",
  subtitle: "",
  titleStyle: { fontSize: 18, fontWeight: 600, color: "#1e293b" },
  setTitle: (title) => set({ title }),
  setSubtitle: (subtitle) => set({ subtitle }),
  setTitleStyle: (style) =>
    set((s) => ({ titleStyle: { ...s.titleStyle, ...style } })),

  xAxisName: "",
  yAxisName: "",
  setXAxisName: (xAxisName) => set({ xAxisName }),
  setYAxisName: (yAxisName) => set({ yAxisName }),

  colors: COLOR_THEMES[0].colors,
  colorThemeId: "business",
  setColor: (index, color) =>
    set((s) => {
      const colors = [...s.colors];
      colors[index] = color;
      return { colors, colorThemeId: "business" as ColorThemeId };
    }),
  setColors: (colors) => set({ colors }),
  applyColorTheme: (themeId) => {
    const theme = COLOR_THEMES.find((t) => t.id === themeId);
    if (theme) set({ colors: [...theme.colors], colorThemeId: themeId });
  },

  chartWidth: 0,
  chartHeight: 480,
  setChartSize: (chartWidth, chartHeight) => set({ chartWidth, chartHeight }),

  legend: { show: true, position: "top" },
  setLegend: (config) => set((s) => ({ legend: { ...s.legend, ...config } })),
  legendSelected: {},
  setLegendSelected: (legendSelected) => set({ legendSelected }),

  gridPadding: { top: 90, right: 30, bottom: 16, left: 20 },
  setGridPadding: (padding) =>
    set((s) => ({ gridPadding: { ...s.gridPadding, ...padding } })),

  xAxisConfig: { labelMaxLength: 8, labelRotate: 0, autoRotate: true },
  yAxisConfig: { useLogScale: false, numberFormat: "smart", autoScale: false, min: null, max: null },
  setXAxisConfig: (config) =>
    set((s) => ({ xAxisConfig: { ...s.xAxisConfig, ...config } })),
  setYAxisConfig: (config) =>
    set((s) => ({ yAxisConfig: { ...s.yAxisConfig, ...config } })),
});
