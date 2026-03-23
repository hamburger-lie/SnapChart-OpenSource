/**
 * 样式库 Slice
 * 管理已保存的样式模板的加载、保存、删除等操作
 */

import type { StateCreator } from "zustand";
import type { StyleListItem, StyleResponse } from "../../types/chart";
import * as api from "../../services/api";

export interface StyleLibSlice {
  // 已保存的样式列表
  savedStyles: StyleListItem[];

  // 加载样式列表
  fetchStyles: () => Promise<void>;

  // 保存当前配置为新样式
  saveCurrentStyle: (
    name: string,
    chartType: string,
    echartsOption: Record<string, unknown>,
    dataSnapshot?: Record<string, unknown>,
    thumbnail?: string,
  ) => Promise<void>;

  // 加载指定样式并应用
  loadStyle: (id: string) => Promise<StyleResponse | null>;

  // 删除样式
  deleteStyle: (id: string) => Promise<void>;
}

export const createStyleLibSlice: StateCreator<StyleLibSlice> = (set) => ({
  savedStyles: [],

  fetchStyles: async () => {
    try {
      const styles = await api.fetchStyles();
      set({ savedStyles: styles });
    } catch (e) {
      console.error("加载样式列表失败：", e);
    }
  },

  saveCurrentStyle: async (name, chartType, echartsOption, dataSnapshot, thumbnail) => {
    try {
      await api.createStyle({
        name,
        chart_type: chartType,
        echarts_option: echartsOption,
        data_snapshot: dataSnapshot || null,
        thumbnail: thumbnail || null,
      });
      // 保存后刷新列表
      const styles = await api.fetchStyles();
      set({ savedStyles: styles });
    } catch (e) {
      console.error("保存样式失败：", e);
      throw e;
    }
  },

  loadStyle: async (id) => {
    try {
      return await api.fetchStyleById(id);
    } catch (e) {
      console.error("加载样式失败：", e);
      return null;
    }
  },

  deleteStyle: async (id) => {
    try {
      await api.deleteStyleApi(id);
      set((s) => ({
        savedStyles: s.savedStyles.filter((style) => style.id !== id),
      }));
    } catch (e) {
      console.error("删除样式失败：", e);
    }
  },
});
