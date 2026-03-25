/**
 * 马卡龙主题 — 移植自 ECharts 官方 theme/macarons.js
 * Apache License 2.0
 */
export const macaronsTheme = {
  color: [
    '#2ec7c9', '#b6a2de', '#5ab1ef', '#ffb980', '#d87a80',
    '#8d98b3', '#e5cf0d', '#97b552', '#95706d', '#dc69aa',
    '#07a2a4', '#9a7fd1', '#588dd5', '#f5994e', '#c05050',
    '#59678c', '#c9ab00', '#7eb00a', '#6f5553', '#c14089',
  ],
  title: {
    textStyle: { fontWeight: 'normal', color: '#008acd' },
  },
  visualMap: {
    itemWidth: 15,
    color: ['#5ab1ef', '#e0ffff'],
  },
  toolbox: {
    iconStyle: { borderColor: '#2ec7c9' },
  },
  tooltip: {
    borderWidth: 0,
    backgroundColor: 'rgba(50,50,50,0.5)',
    textStyle: { color: '#FFF' },
    axisPointer: {
      type: 'line' as const,
      lineStyle: { color: '#008acd' },
      crossStyle: { color: '#008acd' },
      shadowStyle: { color: 'rgba(200,200,200,0.2)' },
    },
  },
  dataZoom: {
    dataBackgroundColor: '#efefff',
    fillerColor: 'rgba(182,162,222,0.2)',
    handleColor: '#008acd',
  },
  grid: { borderColor: '#eee' },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#008acd' } },
    splitLine: { lineStyle: { color: ['#eee'] } },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#008acd' } },
    splitArea: {
      show: true,
      areaStyle: { color: ['rgba(250,250,250,0.1)', 'rgba(200,200,200,0.1)'] },
    },
    splitLine: { lineStyle: { color: ['#eee'] } },
  },
  line: { smooth: true, symbol: 'emptyCircle', symbolSize: 3 },
  scatter: { symbol: 'circle', symbolSize: 4 },
  graph: {
    itemStyle: { color: '#d87a80' },
    linkStyle: { color: '#2ec7c9' },
  },
  gauge: {
    axisLine: {
      lineStyle: {
        color: [[0.2, '#2ec7c9'], [0.8, '#5ab1ef'], [1, '#d87a80']],
        width: 10,
      },
    },
  },
};
