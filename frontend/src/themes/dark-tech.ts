/**
 * 暗黑科技渐变主题 — 自主设计
 * 适用于科技/数据大屏展示场景
 */
export const darkTechTheme = {
  darkMode: true,
  color: [
    '#00F5D4', '#00BBF9', '#7B2FF7', '#F15BB5',
    '#FEE440', '#00CFDD', '#9B5DE5', '#00D2FF',
  ],
  backgroundColor: '#1a1a2e',
  title: {
    textStyle: {
      color: '#e2e8f0',
      fontSize: 20,
      fontWeight: 700,
    },
    subtextStyle: { color: '#a0aec0' },
  },
  legend: {
    textStyle: { color: '#a0aec0', fontSize: 12 },
    itemWidth: 14,
    itemHeight: 10,
    itemGap: 16,
  },
  tooltip: {
    borderWidth: 0,
    backgroundColor: 'rgba(10, 10, 30, 0.92)',
    textStyle: { color: '#e2e8f0', fontSize: 13 },
    axisPointer: {
      type: 'shadow' as const,
      shadowStyle: { color: 'rgba(0, 245, 212, 0.08)' },
    },
  },
  grid: {
    containLabel: true,
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#2d3748' } },
    axisTick: { show: false },
    axisLabel: { color: '#a0aec0', fontSize: 12 },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#718096', fontSize: 12 },
    splitLine: {
      lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' as const },
    },
  },
  bar: {
    itemStyle: { borderRadius: [3, 3, 0, 0] },
    barMaxWidth: 36,
  },
  line: {
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: { width: 2.5 },
  },
  scatter: {
    symbol: 'circle',
    symbolSize: 12,
  },
};
