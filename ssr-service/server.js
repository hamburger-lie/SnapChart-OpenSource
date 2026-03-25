/**
 * SnapChart SSR Microservice (v2)
 *
 * ECharts server-side rendering engine.
 * Receives raw chart data, builds full ECharts option, renders to SVG.
 * Supports 21 chart types including radar, funnel, gauge, heatmap, treemap,
 * waterfall, sankey, sunburst, candlestick, and barLine.
 *
 * Architecture: FastAPI → POST /render → SVG string → cairosvg (Python) → PNG
 */

const echarts = require('echarts');
const express = require('express');

const app = express();
app.use(express.json({ limit: '10mb' }));

// ========== 主题注册（同步 frontend/src/themes/*） ==========

const brandProTheme = {
  color: ['#2D3436', '#636E72', '#B2BEC3', '#D4A373', '#E6B89C', '#8C939D', '#A0A8B4', '#4A5568'],
  title: {
    textStyle: { color: '#1a202c', fontSize: 20, fontWeight: 700 },
    subtextStyle: { color: '#718096', fontSize: 13 },
  },
  legend: { textStyle: { color: '#5C6370', fontSize: 12 }, itemWidth: 14, itemHeight: 10, itemGap: 16 },
  tooltip: {
    borderWidth: 0, backgroundColor: 'rgba(26, 32, 44, 0.92)',
    textStyle: { color: '#f7fafc', fontSize: 13 },
    axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(45, 52, 54, 0.06)' } },
  },
  grid: { containLabel: true },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#DCDFE6' } }, axisTick: { show: false },
    axisLabel: { color: '#5C6370', fontSize: 12, margin: 14 }, splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false }, axisTick: { show: false },
    axisLabel: { color: '#8C939D', fontSize: 12 },
    splitLine: { lineStyle: { color: '#EBEEF5', type: 'dashed' } },
  },
  bar: { itemStyle: { borderRadius: [2, 2, 0, 0] }, barMaxWidth: 40 },
  line: { smooth: true, symbol: 'none', lineStyle: { width: 3 } },
  scatter: { symbol: 'circle', symbolSize: 10 },
};

const darkTechTheme = {
  darkMode: true,
  color: ['#00F5D4', '#00BBF9', '#7B2FF7', '#F15BB5', '#FEE440', '#00CFDD', '#9B5DE5', '#00D2FF'],
  backgroundColor: '#1a1a2e',
  title: {
    textStyle: { color: '#e2e8f0', fontSize: 20, fontWeight: 700 },
    subtextStyle: { color: '#a0aec0' },
  },
  legend: { textStyle: { color: '#a0aec0', fontSize: 12 }, itemWidth: 14, itemHeight: 10, itemGap: 16 },
  tooltip: {
    borderWidth: 0, backgroundColor: 'rgba(10, 10, 30, 0.92)',
    textStyle: { color: '#e2e8f0', fontSize: 13 },
    axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0, 245, 212, 0.08)' } },
  },
  grid: { containLabel: true },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#2d3748' } }, axisTick: { show: false },
    axisLabel: { color: '#a0aec0', fontSize: 12 }, splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false }, axisTick: { show: false },
    axisLabel: { color: '#718096', fontSize: 12 },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
  },
  bar: { itemStyle: { borderRadius: [3, 3, 0, 0] }, barMaxWidth: 36 },
  line: { smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { width: 2.5 } },
  scatter: { symbol: 'circle', symbolSize: 12 },
};

const macaronsTheme = {
  color: [
    '#2ec7c9', '#b6a2de', '#5ab1ef', '#ffb980', '#d87a80',
    '#8d98b3', '#e5cf0d', '#97b552', '#95706d', '#dc69aa',
    '#07a2a4', '#9a7fd1', '#588dd5', '#f5994e', '#c05050',
    '#59678c', '#c9ab00', '#7eb00a', '#6f5553', '#c14089',
  ],
  title: { textStyle: { fontWeight: 'normal', color: '#008acd' } },
  tooltip: {
    borderWidth: 0, backgroundColor: 'rgba(50,50,50,0.5)', textStyle: { color: '#FFF' },
    axisPointer: { type: 'line', lineStyle: { color: '#008acd' }, crossStyle: { color: '#008acd' } },
  },
  grid: { borderColor: '#eee' },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#008acd' } },
    splitLine: { lineStyle: { color: ['#eee'] } },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#008acd' } },
    splitArea: { show: true, areaStyle: { color: ['rgba(250,250,250,0.1)', 'rgba(200,200,200,0.1)'] } },
    splitLine: { lineStyle: { color: ['#eee'] } },
  },
  line: { smooth: true, symbol: 'emptyCircle', symbolSize: 3 },
};

const vintageTheme = {
  color: ['#d87c7c', '#919e8b', '#d7ab82', '#6e7074', '#61a0a8', '#efa18d', '#787464', '#cc7e63', '#724e58', '#4b565b'],
  backgroundColor: '#fef8ef',
  title: { textStyle: { color: '#333' } },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#b0a28e' } },
    splitLine: { lineStyle: { color: ['#e8e2d6'] } },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#b0a28e' } },
    splitLine: { lineStyle: { color: ['#e8e2d6'] } },
  },
};

const contrastColor = '#B9B8CE';
const echartsDarkBg = '#100C2A';
const axisCommon = {
  axisLine: { lineStyle: { color: contrastColor } },
  splitLine: { lineStyle: { color: '#484753' } },
  splitArea: { areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)'] } },
  minorSplitLine: { lineStyle: { color: '#20203B' } },
};

const echartsDarkTheme = {
  darkMode: true,
  color: ['#4992ff', '#7cffb2', '#fddd60', '#ff6e76', '#58d9f9', '#05c091', '#ff8a45', '#8d48e3', '#dd79ff'],
  backgroundColor: echartsDarkBg,
  axisPointer: { lineStyle: { color: '#817f91' }, crossStyle: { color: '#817f91' }, label: { color: '#fff' } },
  legend: { textStyle: { color: contrastColor } },
  textStyle: { color: contrastColor },
  title: { textStyle: { color: '#EEF1FA' }, subtextStyle: { color: '#B9B8CE' } },
  toolbox: { iconStyle: { borderColor: contrastColor } },
  categoryAxis: { ...axisCommon, splitLine: { ...axisCommon.splitLine, show: false } },
  valueAxis: { ...axisCommon },
  timeAxis: { ...axisCommon },
  logAxis: { ...axisCommon },
  line: { symbol: 'circle' },
};

// 注册所有主题
const THEME_MAP = {
  'brand-pro': brandProTheme,
  'dark-tech': darkTechTheme,
  'macarons': macaronsTheme,
  'vintage': vintageTheme,
  'echarts-dark': echartsDarkTheme,
};

for (const [id, themeObj] of Object.entries(THEME_MAP)) {
  echarts.registerTheme(id, themeObj);
}
console.log(`Registered ${Object.keys(THEME_MAP).length} ECharts themes`);

// ========== 数据清洗器（同步 frontend/src/utils/optionSanitizer.ts） ==========

function sanitizeChartData(rawLabels, rawDatasets) {
  const labels = (rawLabels || []).map(l =>
    l == null || l === '' ? '未命名' : String(l)
  );

  const datasets = (rawDatasets || []).map((ds, idx) => {
    const name = ds.name && ds.name.trim() ? ds.name.trim() : `系列${idx + 1}`;
    const rawValues = Array.isArray(ds.values) ? ds.values : [];
    const cleanValues = rawValues.map(v => {
      if (v == null || typeof v !== 'number' || isNaN(v) || !isFinite(v)) return 0;
      return v;
    });

    let values;
    if (cleanValues.length > labels.length) {
      values = cleanValues.slice(0, labels.length);
    } else if (cleanValues.length < labels.length) {
      values = [...cleanValues, ...Array(labels.length - cleanValues.length).fill(0)];
    } else {
      values = cleanValues;
    }

    return { name, values };
  });

  return { labels, datasets };
}

// ========== Default Colors ==========

const DEFAULT_COLORS = [
  '#2563eb', '#0891b2', '#0d9488', '#475569',
  '#64748b', '#7c3aed', '#059669', '#0e7490',
];

// ========== Series Builders (ported from EditableChart.tsx) ==========

function buildBarSeries(datasets) {
  return datasets.map(ds => ({
    name: ds.name, type: 'bar', data: ds.values,
    barMaxWidth: 40,
    itemStyle: { borderRadius: [4, 4, 0, 0] },
  }));
}

function buildStackedBarSeries(datasets) {
  return datasets.map(ds => ({
    name: ds.name, type: 'bar', data: ds.values,
    stack: 'total', barMaxWidth: 40,
    itemStyle: { borderRadius: [2, 2, 0, 0] },
  }));
}

function buildNegativeBarSeries(datasets, colors) {
  return datasets.map(ds => ({
    name: ds.name, type: 'bar', data: ds.values.map(v => ({
      value: v,
      itemStyle: {
        color: v >= 0 ? (colors[0] || '#2563eb') : (colors[1] || '#ef4444'),
        borderRadius: v >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4],
      },
    })),
    barMaxWidth: 40,
  }));
}

function buildBarLineSeries(datasets) {
  return datasets.map((ds, idx) => {
    const isLine = idx === datasets.length - 1 && datasets.length > 1;
    if (isLine) {
      return {
        name: ds.name, type: 'line', data: ds.values,
        smooth: true, symbol: 'circle', symbolSize: 6,
        lineStyle: { width: 2.5 },
        yAxisIndex: 1,
      };
    }
    return {
      name: ds.name, type: 'bar', data: ds.values,
      barMaxWidth: 40, itemStyle: { borderRadius: [4, 4, 0, 0] },
    };
  });
}

function buildWaterfallSeries(datasets, colors) {
  const ds = datasets[0];
  if (!ds) return [];
  const values = ds.values;

  const transparentData = [];
  const positiveData = [];
  const negativeData = [];

  let cumulative = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (i === 0 || i === values.length - 1) {
      transparentData.push(0);
      positiveData.push(Math.abs(v));
      negativeData.push('-');
    } else if (v >= 0) {
      transparentData.push(cumulative);
      positiveData.push(v);
      negativeData.push('-');
    } else {
      transparentData.push(cumulative + v);
      positiveData.push('-');
      negativeData.push(Math.abs(v));
    }
    if (i > 0 && i < values.length - 1) {
      cumulative += v;
    }
  }

  return [
    {
      name: '透明', type: 'bar', stack: 'waterfall', data: transparentData,
      barMaxWidth: 40, itemStyle: { color: 'transparent' },
    },
    {
      name: '增加', type: 'bar', stack: 'waterfall', data: positiveData,
      barMaxWidth: 40, itemStyle: { color: colors[0] || '#22c55e', borderRadius: [4, 4, 0, 0] },
    },
    {
      name: '减少', type: 'bar', stack: 'waterfall', data: negativeData,
      barMaxWidth: 40, itemStyle: { color: colors[1] || '#ef4444', borderRadius: [4, 4, 0, 0] },
    },
  ];
}

function buildLineSeries(datasets) {
  return datasets.map(ds => ({
    name: ds.name, type: 'line', data: ds.values,
    smooth: false, symbol: 'circle', symbolSize: 6,
    lineStyle: { width: 2.5 },
  }));
}

function buildSmoothLineSeries(datasets) {
  return datasets.map(ds => ({
    name: ds.name, type: 'line', data: ds.values,
    smooth: true, symbol: 'circle', symbolSize: 6,
    lineStyle: { width: 2.5 },
  }));
}

function buildGradientAreaSeries(datasets, colors) {
  return datasets.map((ds, idx) => {
    const baseColor = colors[idx % colors.length] || '#2563eb';
    return {
      name: ds.name, type: 'line', data: ds.values,
      smooth: true, symbol: 'circle', symbolSize: 5,
      lineStyle: { width: 2.5, color: baseColor },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: baseColor + '80' },
            { offset: 1, color: baseColor + '08' },
          ],
        },
      },
    };
  });
}

function buildStackedAreaSeries(datasets) {
  return datasets.map(ds => ({
    name: ds.name, type: 'line', data: ds.values,
    smooth: true, stack: 'total', symbol: 'none',
    lineStyle: { width: 1.5 }, areaStyle: { opacity: 0.4 },
  }));
}

function buildPieSeries(labels, datasets) {
  const ds = datasets[0];
  const pieData = labels.map((l, i) => ({ name: l, value: ds?.values[i] ?? 0 }));
  return [{
    type: 'pie', radius: ['0%', '68%'], center: ['42%', '55%'],
    data: pieData,
    label: { color: '#475569', fontSize: 12 },
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 3 },
  }];
}

function buildDoughnutSeries(labels, datasets) {
  const ds = datasets[0];
  const pieData = labels.map((l, i) => ({ name: l, value: ds?.values[i] ?? 0 }));
  return [{
    type: 'pie', radius: ['40%', '68%'], center: ['42%', '55%'],
    data: pieData,
    label: { color: '#475569', fontSize: 12 },
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 3 },
  }];
}

function buildRoseSeries(labels, datasets) {
  const ds = datasets[0];
  const pieData = labels.map((l, i) => ({ name: l, value: ds?.values[i] ?? 0 }));
  return [{
    type: 'pie', radius: ['15%', '68%'], center: ['42%', '55%'],
    roseType: 'area',
    data: pieData,
    label: { color: '#475569', fontSize: 12 },
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
  }];
}

function buildScatterSeries(datasets) {
  return datasets.map(ds => ({
    name: ds.name, type: 'scatter', data: ds.values,
    symbolSize: 14,
  }));
}

function buildFunnelSeries(labels, datasets) {
  const ds = datasets[0];
  const data = labels.map((l, i) => ({ name: l, value: ds?.values[i] ?? 0 }));
  return [{
    type: 'funnel',
    left: '10%', right: '10%', top: 80, bottom: 30,
    width: '80%', sort: 'descending', gap: 4,
    label: { show: true, position: 'inside', fontSize: 13 },
    labelLine: { show: false },
    itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 4 },
    data,
  }];
}

function buildGaugeSeries(datasets) {
  const ds = datasets[0];
  const value = ds?.values[0] ?? 0;
  return [{
    type: 'gauge',
    center: ['50%', '60%'], radius: '80%',
    startAngle: 200, endAngle: -20,
    min: 0, max: 100,
    progress: { show: true, width: 18 },
    pointer: { show: true, length: '60%', width: 6 },
    axisLine: { lineStyle: { width: 18 } },
    axisTick: { show: false },
    splitLine: { length: 10, lineStyle: { width: 2, color: '#999' } },
    axisLabel: { distance: 25, fontSize: 12, color: '#64748b' },
    detail: {
      fontSize: 28, fontWeight: 700,
      offsetCenter: [0, '40%'],
      formatter: '{value}%',
      color: '#1e293b',
    },
    data: [{ value, name: ds?.name || '' }],
  }];
}

function buildTreemapSeries(labels, datasets) {
  const ds = datasets[0];
  const data = labels.map((l, i) => ({ name: l, value: ds?.values[i] ?? 0 }));
  return [{
    type: 'treemap',
    width: '90%', height: '75%', top: 60,
    roam: false,
    label: { show: true, fontSize: 13, color: '#fff', fontWeight: 600 },
    upperLabel: { show: false },
    itemStyle: { borderColor: '#fff', borderWidth: 3, gapWidth: 3, borderRadius: 4 },
    breadcrumb: { show: false },
    data,
  }];
}

// ========== Base Type Mapper ==========

function getBaseChartType(chartType) {
  const map = {
    bar: 'bar', stackedBar: 'bar', negativeBar: 'bar', barLine: 'bar', waterfall: 'bar',
    line: 'line', smoothLine: 'line', gradientArea: 'line', stackedArea: 'line',
    pie: 'pie', doughnut: 'pie', rose: 'pie',
    scatter: 'scatter',
    radar: 'radar',
    funnel: 'funnel', gauge: 'gauge', heatmap: 'heatmap', treemap: 'treemap',
    sankey: 'sankey', sunburst: 'sunburst', candlestick: 'candlestick',
  };
  return map[chartType] || 'bar';
}

// ========== Full Option Builder ==========

function buildOption(chartData) {
  const {
    chartType = 'bar',
    title = '',
    colors = DEFAULT_COLORS,
    rawOption = null,
  } = chartData;

  // 防爆清洗
  const { labels, datasets } = sanitizeChartData(chartData.labels, chartData.datasets);

  const baseOption = {
    color: colors,
    title: {
      text: title,
      left: 'center',
      top: 12,
      textStyle: { color: '#1e293b', fontSize: 18, fontWeight: 700 },
    },
    animation: false, // SSR doesn't need animation
  };

  const baseType = getBaseChartType(chartType);

  // ========== Pie family ==========
  if (baseType === 'pie') {
    const pieBuildMap = {
      pie: () => buildPieSeries(labels, datasets),
      doughnut: () => buildDoughnutSeries(labels, datasets),
      rose: () => buildRoseSeries(labels, datasets),
    };

    return {
      ...baseOption,
      tooltip: { trigger: 'item' },
      legend: {
        orient: 'vertical', right: 20, top: 'middle',
        textStyle: { color: '#64748b', fontSize: 12 },
        itemWidth: 12, itemHeight: 12, itemGap: 12,
      },
      series: (pieBuildMap[chartType] || pieBuildMap.pie)(),
    };
  }

  // ========== Radar ==========
  if (baseType === 'radar') {
    const maxValues = labels.map((_, i) => {
      const vals = datasets.map(ds => ds.values[i] || 0);
      return Math.max(...vals);
    });

    return {
      ...baseOption,
      tooltip: { trigger: 'item' },
      legend: {
        show: true, top: 48, left: 'center',
        textStyle: { color: '#64748b', fontSize: 13 },
      },
      radar: {
        indicator: labels.map((name, i) => ({
          name,
          max: Math.ceil(maxValues[i] * 1.2) || 100,
        })),
        shape: 'polygon',
        radius: '60%',
        center: ['50%', '55%'],
        axisName: { color: '#64748b', fontSize: 12 },
        splitArea: { areaStyle: { color: ['rgba(37,99,235,0.02)', 'rgba(37,99,235,0.05)'] } },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
      },
      series: [{
        type: 'radar',
        data: datasets.map(ds => ({
          name: ds.name,
          value: ds.values,
          areaStyle: { opacity: 0.15 },
        })),
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2 },
      }],
    };
  }

  // ========== Funnel ==========
  if (baseType === 'funnel') {
    return {
      ...baseOption,
      tooltip: { trigger: 'item', formatter: '{b}: {c}' },
      legend: {
        show: true, top: 48, left: 'center',
        textStyle: { color: '#64748b', fontSize: 13 },
      },
      series: buildFunnelSeries(labels, datasets),
    };
  }

  // ========== Gauge ==========
  if (baseType === 'gauge') {
    return {
      ...baseOption,
      series: buildGaugeSeries(datasets),
    };
  }

  // ========== Heatmap ==========
  if (baseType === 'heatmap') {
    const yLabels = datasets.map(ds => ds.name);
    const heatData = [];
    let maxVal = 0;
    datasets.forEach((ds, yi) => {
      ds.values.forEach((v, xi) => {
        heatData.push([xi, yi, v]);
        if (v > maxVal) maxVal = v;
      });
    });

    return {
      ...baseOption,
      tooltip: { position: 'top' },
      grid: { top: 60, left: 80, right: 30, bottom: 40, containLabel: false },
      xAxis: {
        type: 'category', data: labels,
        axisLabel: { color: '#64748b', fontSize: 11 },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        splitArea: { show: true },
      },
      yAxis: {
        type: 'category', data: yLabels,
        axisLabel: { color: '#64748b', fontSize: 11 },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        splitArea: { show: true },
      },
      visualMap: {
        min: 0, max: maxVal || 10,
        calculable: true, orient: 'horizontal',
        left: 'center', bottom: 4,
        inRange: { color: ['#e0f2fe', '#7dd3fc', '#0284c7', '#1e3a5f'] },
        textStyle: { color: '#64748b', fontSize: 11 },
      },
      series: [{
        type: 'heatmap', data: heatData,
        label: { show: true, color: '#1e293b', fontSize: 11 },
        itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 3 },
      }],
    };
  }

  // ========== Treemap ==========
  if (baseType === 'treemap') {
    return {
      ...baseOption,
      tooltip: { trigger: 'item', formatter: '{b}: {c}' },
      series: buildTreemapSeries(labels, datasets),
    };
  }

  // ========== Sankey (uses rawOption) ==========
  if (baseType === 'sankey') {
    return {
      ...baseOption,
      tooltip: { trigger: 'item', triggerOn: 'mousemove' },
      ...(rawOption || {}),
    };
  }

  // ========== Sunburst (uses rawOption) ==========
  if (baseType === 'sunburst') {
    return {
      ...baseOption,
      tooltip: { trigger: 'item' },
      ...(rawOption || {}),
    };
  }

  // ========== Candlestick ==========
  if (baseType === 'candlestick') {
    const ds = datasets[0];
    const ohlcData = [];
    if (ds) {
      for (let i = 0; i < ds.values.length; i += 4) {
        ohlcData.push([ds.values[i], ds.values[i + 1], ds.values[i + 2], ds.values[i + 3]]);
      }
    }

    return {
      ...baseOption,
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: { show: false },
      grid: { top: 80, left: 50, right: 30, bottom: 60, containLabel: true },
      xAxis: {
        type: 'category', data: labels,
        axisLabel: { color: '#64748b', fontSize: 12 },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#94a3b8', fontSize: 12 },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [{
        type: 'candlestick', data: ohlcData,
        itemStyle: {
          color: '#ef4444', color0: '#22c55e',
          borderColor: '#ef4444', borderColor0: '#22c55e',
        },
      }],
    };
  }

  // ========== BarLine (dual Y axis) ==========
  if (chartType === 'barLine') {
    return {
      ...baseOption,
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: {
        show: true, top: 48, left: 'center',
        textStyle: { color: '#64748b', fontSize: 13 },
        itemWidth: 14, itemHeight: 10, itemGap: 16,
      },
      grid: { top: 80, left: 50, right: 50, bottom: 60, containLabel: true },
      xAxis: {
        type: 'category', data: labels,
        axisLabel: { color: '#64748b', fontSize: 12 },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          axisLabel: { color: '#94a3b8', fontSize: 12 },
          splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        {
          type: 'value', position: 'right',
          axisLabel: { color: '#94a3b8', fontSize: 12 },
          splitLine: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
        },
      ],
      series: buildBarLineSeries(datasets),
    };
  }

  // ========== Waterfall ==========
  if (chartType === 'waterfall') {
    return {
      ...baseOption,
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { show: false },
      grid: { top: 80, left: 50, right: 30, bottom: 60, containLabel: true },
      xAxis: {
        type: 'category', data: labels,
        axisLabel: { color: '#64748b', fontSize: 12 },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#94a3b8', fontSize: 12 },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: buildWaterfallSeries(datasets, colors),
    };
  }

  // ========== Standard axis charts (bar / line / scatter) ==========
  const seriesMap = {
    bar: () => buildBarSeries(datasets),
    stackedBar: () => buildStackedBarSeries(datasets),
    negativeBar: () => buildNegativeBarSeries(datasets, colors),
    line: () => buildLineSeries(datasets),
    smoothLine: () => buildSmoothLineSeries(datasets),
    gradientArea: () => buildGradientAreaSeries(datasets, colors),
    stackedArea: () => buildStackedAreaSeries(datasets),
    scatter: () => buildScatterSeries(datasets),
  };

  return {
    ...baseOption,
    tooltip: {
      trigger: getBaseChartType(chartType) === 'scatter' ? 'item' : 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      show: true, top: 48, left: 'center',
      textStyle: { color: '#64748b', fontSize: 13 },
      itemWidth: 14, itemHeight: 10, itemGap: 16,
    },
    grid: { top: 80, left: 50, right: 30, bottom: 60, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: '#64748b', fontSize: 12 },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8', fontSize: 12 },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: (seriesMap[chartType] || seriesMap.bar)(),
  };
}

// ========== API Routes ==========

app.post('/render', (req, res) => {
  try {
    const { chartData, width = 1200, height = 800 } = req.body;

    if (!chartData) {
      return res.status(400).json({ error: 'Missing chartData' });
    }

    // Build full ECharts option from raw data
    const option = buildOption(chartData);

    // 确定使用的主题（从 chartData.theme 中读取）
    const themeName = chartData.theme && THEME_MAP[chartData.theme] ? chartData.theme : null;

    // SSR render to SVG
    const chart = echarts.init(null, themeName, {
      renderer: 'svg',
      ssr: true,
      width: Number(width),
      height: Number(height),
    });

    chart.setOption(option);
    const svgStr = chart.renderToSVGString();
    chart.dispose();

    res.type('image/svg+xml').send(svgStr);

  } catch (err) {
    console.error('Render error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'snapchart-ssr',
    themes: Object.keys(THEME_MAP),
    chartTypes: [
      'bar', 'stackedBar', 'negativeBar', 'barLine', 'waterfall',
      'line', 'smoothLine', 'gradientArea', 'stackedArea',
      'pie', 'doughnut', 'rose',
      'scatter', 'radar',
      'funnel', 'gauge', 'heatmap', 'treemap',
      'sankey', 'sunburst', 'candlestick',
    ],
  });
});

// Start server
const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
  console.log(`SnapChart SSR service running on port ${PORT}`);
  console.log(`Supported chart types: 21`);
});
