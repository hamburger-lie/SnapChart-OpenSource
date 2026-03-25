/**
 * 数据清洗中间件 — 防爆装甲
 * Inspired by echarts/src/model/OptionManager.ts
 *
 * 确保任何残缺/脏数据都不会导致 ECharts 崩溃：
 *   - NaN / undefined / null → 0
 *   - series.data 长度与 xAxis.data 对齐
 *   - 自动补全缺失的 name
 */

import type { DatasetItem } from "../types/chart";

/**
 * 清洗图表原始数据，返回安全的 labels + datasets
 */
export function sanitizeChartData(
  rawLabels: string[],
  rawDatasets: DatasetItem[],
): { labels: string[]; datasets: DatasetItem[] } {
  // 1. 确保 labels 是字符串数组
  const labels = (rawLabels || []).map((l) =>
    l == null || l === "" ? "未命名" : String(l),
  );

  // 2. 确保 datasets 是数组
  const datasets = (rawDatasets || []).map((ds, idx) => {
    // 2a. 确保 name 非空
    const name = ds.name && ds.name.trim() ? ds.name.trim() : `系列${idx + 1}`;

    // 2b. 清洗 values：NaN/undefined/null → 0
    const rawValues = Array.isArray(ds.values) ? ds.values : [];
    const cleanValues = rawValues.map((v) => {
      if (v == null || typeof v !== "number" || isNaN(v) || !isFinite(v)) {
        return 0;
      }
      return v;
    });

    // 2c. 对齐长度：截断或填充 0
    let values: number[];
    if (cleanValues.length > labels.length) {
      values = cleanValues.slice(0, labels.length);
    } else if (cleanValues.length < labels.length) {
      values = [
        ...cleanValues,
        ...Array(labels.length - cleanValues.length).fill(0),
      ];
    } else {
      values = cleanValues;
    }

    return { name, values };
  });

  return { labels, datasets };
}
