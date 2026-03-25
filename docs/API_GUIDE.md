# SnapChart API Developer Guide (v1.0)

## Introduction

SnapChart is an enterprise-grade **Headless Chart Rendering Platform**. Through a minimal JSON input, the API generates publication-quality chart images (PNG/SVG) in under **10ms**, complete with premium commercial themes (McKinsey gray, dark-tech cyberpunk, etc.) and industrial-grade dirty-data sanitization.

**Core Advantages:**

- **Extreme Performance**: Node.js SSR pure-CPU rendering, no headless browsers — **300x faster** than Playwright (8ms vs 3-5s).
- **Visual Decoupling**: Submit raw business data, skip complex ECharts option assembly — the system auto-applies commercial-grade skins.
- **Crash-Proof**: Built-in smart Sanitizer auto-intercepts and fixes `null`, `NaN`, mismatched array lengths, and missing field names — guaranteeing **zero service crashes**.

---

## Authentication

All API requests require authentication. Include your API key in the HTTP request headers.

**Two supported methods:**

| Method | Header |
|--------|--------|
| Bearer Token (recommended) | `Authorization: Bearer <YOUR_API_KEY>` |
| Custom Header | `X-API-Key: <YOUR_API_KEY>` |

**Test environment key:**

```
sk-wxgInpoDpWFxF-tskvIxFQaXUAzd5Nrl
```

---

## Core Endpoint: Render Chart

```
POST /api/render-chart
```

Accepts structured business data and returns a high-definition chart image as a binary stream.

### Request Body (`application/json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `chartType` | String | **Yes** | Chart structure type. See [Supported Chart Types](#supported-chart-types) below. |
| `title` | String | **Yes** | Chart title (1-200 characters). |
| `labels` | String[] | No | X-axis labels or category names. |
| `datasets` | Object[] | No | Data series array. Each object: `{ "name": "Series Name", "values": [1, 2, 3] }`. |
| `theme` | String | No | Commercial visual skin. See [Themes](#themes). If omitted, uses default palette. |
| `colors` | String[] | No | Custom color palette (overrides theme). e.g. `["#2563eb", "#16a34a"]`. |
| `rawOption` | Object | No | Raw ECharts option for special charts (sankey/sunburst). Merged directly into config. |
| `width` | Integer | No | Output image width in px. Default: `1200`. Range: 200-4000. |
| `height` | Integer | No | Output image height in px. Default: `800`. Range: 200-3000. |

> **Important:** The field name is `chartType` (camelCase), not `chart_type`. The `labels` and `datasets` fields are top-level, not nested inside a `data` object.

### Supported Chart Types

| Category | `chartType` Values |
|----------|--------------------|
| Bar | `bar`, `stackedBar`, `negativeBar`, `barLine`, `waterfall` |
| Line | `line`, `smoothLine`, `gradientArea`, `stackedArea` |
| Pie | `pie`, `doughnut`, `rose` |
| Scatter | `scatter` |
| Radar | `radar` |
| Advanced | `funnel`, `gauge`, `heatmap`, `treemap`, `sankey`, `sunburst`, `candlestick` |

**Total: 21 chart types.**

### Themes

| Theme ID | Style | Best For |
|----------|-------|----------|
| `brand-pro` | McKinsey business gray | Board reports, whitepapers |
| `dark-tech` | Cyberpunk neon on dark | Data dashboards, tech demos |
| `macarons` | Soft pastel tones | Consumer products, lifestyle |
| `vintage` | Warm retro colors | Traditional industries |
| `echarts-dark` | Official ECharts dark | General dark mode |

---

## Data Structure Examples

### Standard Chart (bar, line, radar, etc.)

```json
{
  "chartType": "radar",
  "title": "Enterprise Capability Assessment",
  "labels": ["Brand", "Product", "Channel", "Service", "Innovation", "Pricing"],
  "datasets": [
    { "name": "Our Company", "values": [90, 80, 85, 95, 70, 88] },
    { "name": "Industry Avg", "values": [75, 70, 80, 75, 65, 80] }
  ],
  "theme": "brand-pro"
}
```

### Special Chart (sankey — uses `rawOption`)

```json
{
  "chartType": "sankey",
  "title": "Traffic Flow Analysis",
  "rawOption": {
    "series": [{
      "type": "sankey",
      "data": [
        { "name": "Google" },
        { "name": "Baidu" },
        { "name": "Homepage" },
        { "name": "Checkout" }
      ],
      "links": [
        { "source": "Google", "target": "Homepage", "value": 100 },
        { "source": "Baidu", "target": "Homepage", "value": 80 },
        { "source": "Homepage", "target": "Checkout", "value": 60 }
      ]
    }]
  },
  "theme": "brand-pro"
}
```

### Dirty Data (auto-sanitized)

The Sanitizer automatically handles:

- `null` / `NaN` / `Infinity` in values → converted to `0`
- Mismatched array lengths (values vs labels) → truncated or zero-padded
- Empty `name` field → auto-assigned as "Series 1", "Series 2", etc.

```json
{
  "chartType": "bar",
  "title": "Dirty Data Test",
  "labels": ["Q1", "Q2"],
  "datasets": [
    { "name": "", "values": [100, null, null, 999] }
  ]
}
```

Result: name → "系列1", values → `[100, 0]` (nulls cleaned, array truncated to match 2 labels).

---

## Response

| Scenario | Content-Type | Description |
|----------|-------------|-------------|
| Cairo available (Docker/Linux) | `image/png` | 2x high-DPI PNG binary stream |
| Cairo unavailable (Windows dev) | `image/svg+xml` | Vector SVG fallback |

**Response Headers:**

| Header | Description |
|--------|-------------|
| `X-Credits-Remaining` | Remaining API call credits after deduction |
| `Content-Disposition` | Suggested filename: `chart.png` or `chart.svg` |

The response body is the **raw image binary** — save it directly to a file or display via `<img src="blob:..." />`.

---

## Quick Start Examples

### cURL

```bash
curl -X POST http://localhost:8000/api/render-chart \
  -H "Authorization: Bearer sk-wxgInpoDpWFxF-tskvIxFQaXUAzd5Nrl" \
  -H "Content-Type: application/json" \
  -d '{
    "chartType": "radar",
    "title": "Q4 Performance Review",
    "labels": ["Revenue", "Growth", "Retention", "NPS"],
    "datasets": [{"name": "Actual", "values": [120, 200, 150, 80]}],
    "theme": "brand-pro"
  }' --output chart.png
```

### Python (httpx)

```python
import httpx

url = "http://localhost:8000/api/render-chart"
headers = {
    "Authorization": "Bearer sk-wxgInpoDpWFxF-tskvIxFQaXUAzd5Nrl",
}
payload = {
    "chartType": "rose",
    "title": "Cloud Market Share 2025",
    "labels": ["SaaS", "PaaS", "IaaS"],
    "datasets": [{"name": "Revenue", "values": [45, 30, 25]}],
    "theme": "dark-tech",
}

resp = httpx.post(url, json=payload, headers=headers)

if resp.status_code == 200:
    with open("market_share.png", "wb") as f:
        f.write(resp.content)
    remaining = resp.headers.get("x-credits-remaining")
    print(f"Chart saved! Credits remaining: {remaining}")
else:
    print(f"Error {resp.status_code}: {resp.text}")
```

### JavaScript (fetch)

```javascript
const resp = await fetch("http://localhost:8000/api/render-chart", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk-wxgInpoDpWFxF-tskvIxFQaXUAzd5Nrl",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    chartType: "barLine",
    title: "Revenue vs Growth Rate",
    labels: ["Q1", "Q2", "Q3", "Q4"],
    datasets: [
      { name: "Revenue (M)", values: [12, 19, 15, 25] },
      { name: "Growth %", values: [8, 12, 6, 18] },
    ],
    theme: "brand-pro",
  }),
});

const blob = await resp.blob();
const img = document.createElement("img");
img.src = URL.createObjectURL(blob);
document.body.appendChild(img);
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| `401` | Unauthorized | Missing or invalid API Key. |
| `402` | Payment Required | Credit balance exhausted. Please top up. |
| `422` | Unprocessable Entity | Malformed JSON (e.g. missing required `chartType` or `title` field). |
| `429` | Too Many Requests | Rate limit exceeded (30 requests/minute per IP). |
| `503` | Service Unavailable | SSR rendering engine is offline. Ensure `ssr-service` is running on port 3100. |
| `500` | Internal Server Error | Unexpected rendering engine failure. |

---

## Architecture

```
Client Request
     │
     ▼
┌─────────────────────────┐
│  FastAPI Gateway (:8000) │
│  ├─ Auth (Bearer/X-API) │
│  ├─ Sanitizer (cleanup) │
│  └─ Billing (credits)   │
└────────┬────────────────┘
         │ POST /render
         ▼
┌─────────────────────────┐
│  Node.js SSR Engine     │
│  (:3100)                │
│  ├─ ECharts 6 (modular) │
│  ├─ 21 chart builders   │
│  ├─ 5 premium themes    │
│  └─ ~8ms per render     │
└────────┬────────────────┘
         │ SVG
         ▼
┌─────────────────────────┐
│  CairoSVG (Python)      │
│  SVG → 2x HD PNG        │
│  (auto-fallback to SVG  │
│   on Windows dev env)   │
└─────────────────────────┘
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `POST /api/render-chart` | 30 requests / minute per IP |
| `POST /api/upload-and-parse` | 10 requests / minute per IP |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2026-03-25 | Initial release: 21 chart types, 5 themes, auth gateway, billing, sanitizer |
