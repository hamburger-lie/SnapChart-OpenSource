# 📊 SnapChart — 数据解析与图表可视化系统

> 上传 Excel / CSV 文件，一键生成可交互、可导出的高清商业图表。

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![ECharts](https://img.shields.io/badge/ECharts-5.6-AA344D?logo=apacheecharts&logoColor=white)](https://echarts.apache.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ 功能特性

- **拖拽上传** — 支持 `.xlsx` 和 `.csv` 文件的拖拽上传与点击选择
- **智能解析** — Pandas 自动识别标签列与数值列，零配置生成图表
- **5 种图表** — 柱状图 / 折线图 / 面积堆叠图 / 饼图 / 散点图，一键切换
- **4 套配色** — 商务科技 / 活力多巴胺 / 莫兰迪柔和 / 深海渐变，实时预览
- **高清导出** — 3x 像素比 PNG 导出，可直接用于商业报告和 PPT
- **响应式布局** — 类 ioDraw 左右分栏设计，适配各种屏幕尺寸
- **前后端解耦** — RESTful API + JSON 契约，前后端可独立部署

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────┐
│                      前端 (Frontend)                 │
│  React 19 + TypeScript + Tailwind CSS + ECharts     │
│  拖拽上传 → API 调用 → 动态渲染 → 交互控制台        │
└──────────────────────┬──────────────────────────────┘
                       │  JSON (RESTful API)
┌──────────────────────┴──────────────────────────────┐
│                      后端 (Backend)                   │
│  FastAPI + Pandas + OpenPyXL                         │
│  文件接收 → 数据清洗 → 智能推断 → 标准化输出         │
└─────────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 环境要求

- **Python** >= 3.10
- **Node.js** >= 18
- **npm** >= 9

### 1. 克隆项目

```bash
git clone https://github.com/hamburger-lie/SnapChart.git
cd SnapChart
```

### 2. 启动后端

```bash
cd backend
pip install -r requirements.txt

# 复制环境变量配置（按需修改端口等）
cp .env.example .env

# 启动服务
python main.py
```

后端运行于 `http://localhost:8000`，访问 `/docs` 查看 Swagger API 文档。

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行于 `http://localhost:5174`，打开浏览器即可使用。

## 📁 项目结构

```
.
├── backend/                    # 后端服务
│   ├── main.py                 # FastAPI 应用入口
│   ├── requirements.txt        # Python 依赖
│   ├── .env.example            # 环境变量模板
│   └── app/
│       ├── config.py           # 配置管理
│       ├── models/
│       │   └── schemas.py      # Pydantic 数据模型
│       ├── routers/
│       │   └── chart.py        # 图表生成路由
│       └── services/
│           └── data_parser.py  # 数据解析引擎
│
├── frontend/                   # 前端应用
│   ├── vite.config.ts          # Vite 配置（含 API 代理）
│   └── src/
│       ├── App.tsx             # 主页面（左右分栏布局）
│       ├── components/
│       │   ├── UploadArea.tsx       # 拖拽上传组件
│       │   ├── DynamicChart.tsx     # ECharts 动态图表
│       │   └── ChartConfigPanel.tsx # 配置面板
│       ├── services/
│       │   └── api.ts          # API 请求封装
│       └── types/
│           └── chart.ts        # TypeScript 类型定义
└── README.md
```

## 📡 API 文档

### `POST /api/upload-and-parse`

上传 Excel/CSV 文件，返回图表 JSON 配置。

**请求**：`multipart/form-data`，字段名 `file`

**响应示例**：

```json
{
  "status": "success",
  "data": {
    "chartType": "bar",
    "title": "产品数据概览",
    "labels": ["Q1", "Q2", "Q3", "Q4"],
    "datasets": [
      { "name": "销量", "values": [120, 200, 150, 80] },
      { "name": "营收", "values": [90, 160, 130, 70] }
    ]
  }
}
```

### `GET /api/health`

健康检查，返回 `{"status": "healthy"}`。

## 🎨 色彩主题预览

| 主题 | 配色 |
|------|------|
| 商务科技 | 🔵 深蓝 · 湖蓝 · 青色 · 石板灰 |
| 活力多巴胺 | 🔴 红 · 🟡 琥珀 · 🟣 紫 · 🟢 绿 |
| 莫兰迪柔和 | 低饱和度灰蓝 · 灰紫 · 灰粉 · 灰绿 |
| 深海渐变 | 深海蓝 → 天蓝色系渐变 |

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: 添加某功能'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 发起 Pull Request

## 📄 开源许可

本项目基于 [MIT License](LICENSE) 开源。
