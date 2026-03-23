/**
 * 图表数据 Slice
 * 管理 labels、datasets 等核心数据，提供行/列的增删改操作
 */

import type { StateCreator } from "zustand";
import type { DatasetItem, ChartData } from "../../types/chart";

export interface ChartDataSlice {
  // 数据状态
  labels: string[];
  datasets: DatasetItem[];

  // 数据操作
  setLabels: (labels: string[]) => void;
  updateLabel: (index: number, value: string) => void;
  updateDatasetValue: (datasetIdx: number, valueIdx: number, value: number) => void;
  renameDataset: (index: number, name: string) => void;
  addRow: () => void;
  removeRow: (index: number) => void;
  addDataset: (name: string) => void;
  removeDataset: (index: number) => void;

  /** 从后端上传数据导入 */
  importFromUpload: (data: ChartData) => void;
}

export const createChartDataSlice: StateCreator<ChartDataSlice> = (set) => ({
  labels: [],
  datasets: [],

  setLabels: (labels) => set({ labels }),

  updateLabel: (index, value) =>
    set((s) => {
      const labels = [...s.labels];
      labels[index] = value;
      return { labels };
    }),

  updateDatasetValue: (datasetIdx, valueIdx, value) =>
    set((s) => {
      const datasets = s.datasets.map((ds, i) => {
        if (i !== datasetIdx) return ds;
        const values = [...ds.values];
        values[valueIdx] = value;
        return { ...ds, values };
      });
      return { datasets };
    }),

  renameDataset: (index, name) =>
    set((s) => {
      const datasets = s.datasets.map((ds, i) =>
        i === index ? { ...ds, name } : ds
      );
      return { datasets };
    }),

  addRow: () =>
    set((s) => ({
      labels: [...s.labels, `分类${s.labels.length + 1}`],
      datasets: s.datasets.map((ds) => ({
        ...ds,
        values: [...ds.values, 0],
      })),
    })),

  removeRow: (index) =>
    set((s) => ({
      labels: s.labels.filter((_, i) => i !== index),
      datasets: s.datasets.map((ds) => ({
        ...ds,
        values: ds.values.filter((_, i) => i !== index),
      })),
    })),

  addDataset: (name) =>
    set((s) => ({
      datasets: [
        ...s.datasets,
        { name, values: new Array(s.labels.length).fill(0) },
      ],
    })),

  removeDataset: (index) =>
    set((s) => ({
      datasets: s.datasets.filter((_, i) => i !== index),
    })),

  importFromUpload: (data) =>
    set({
      labels: data.labels,
      datasets: data.datasets,
    }),
});
