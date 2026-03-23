/**
 * Zustand 全局状态管理
 * 使用 slice pattern 将 store 按关注点拆分，最终合并为单一 store
 */

import { create } from "zustand";
import { createChartDataSlice, type ChartDataSlice } from "./slices/chartDataSlice";
import { createChartStyleSlice, type ChartStyleSlice } from "./slices/chartStyleSlice";
import { createUISlice, type UISlice } from "./slices/uiSlice";
import { createStyleLibSlice, type StyleLibSlice } from "./slices/styleLibSlice";

/** 编辑器全局状态类型 */
export type EditorStore = ChartDataSlice & ChartStyleSlice & UISlice & StyleLibSlice;

/** 全局 store hook */
export const useEditorStore = create<EditorStore>()((...a) => ({
  ...createChartDataSlice(...a),
  ...createChartStyleSlice(...a),
  ...createUISlice(...a),
  ...createStyleLibSlice(...a),
}));
