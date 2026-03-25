/**
 * 麦肯锡商务高级灰主题 — 自主设计
 * 灵感来源：顶级咨询报告的极简专业风格
 */
export const brandProTheme = {
  color: [
    '#2D3436', '#636E72', '#B2BEC3', '#D4A373',
    '#E6B89C', '#8C939D', '#A0A8B4', '#4A5568',
  ],
  title: {
    textStyle: {
      color: '#1a202c',
      fontSize: 20,
      fontWeight: 700,
    },
    subtextStyle: {
      color: '#718096',
      fontSize: 13,
    },
  },
  legend: {
    textStyle: { color: '#5C6370', fontSize: 12 },
    itemWidth: 14,
    itemHeight: 10,
    itemGap: 16,
  },
  tooltip: {
    borderWidth: 0,
    backgroundColor: 'rgba(26, 32, 44, 0.92)',
    textStyle: { color: '#f7fafc', fontSize: 13 },
    axisPointer: {
      type: 'shadow' as const,
      shadowStyle: { color: 'rgba(45, 52, 54, 0.06)' },
    },
  },
  grid: {
    containLabel: true,
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#DCDFE6' } },
    axisTick: { show: false },
    axisLabel: { color: '#5C6370', fontSize: 12, margin: 14 },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#8C939D', fontSize: 12 },
    splitLine: {
      lineStyle: { color: '#EBEEF5', type: 'dashed' as const },
    },
  },
  bar: {
    itemStyle: { borderRadius: [2, 2, 0, 0] },
    barMaxWidth: 40,
  },
  line: {
    smooth: true,
    symbol: 'none',
    lineStyle: { width: 3 },
  },
  scatter: {
    symbol: 'circle',
    symbolSize: 10,
  },
};
