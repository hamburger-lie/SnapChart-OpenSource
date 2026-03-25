"""
SnapChart 白皮书 Agent — 实战演示脚本

模拟大模型自动生成行业白皮书的完整工作流：
  1. LLM 思考 → 构造图表 JSON（雷达图 + brand-pro 主题）
  2. 调用 SnapChart API → 获取高清图表图片
  3. 资产落盘 → 保存 PNG 到本地
  4. 生成白皮书 → 输出 Markdown 文件并嵌入图表

用法：
  python examples/whitepaper_agent.py

前置条件：
  - FastAPI 后端运行中（端口 8000）
  - SSR 微服务运行中（端口 3100）
  - pip install httpx  （如未安装）
"""

import os
import sys
from datetime import datetime
from pathlib import Path

import httpx

# ========== 配置 ==========

API_BASE_URL = os.getenv("SNAPCHART_API_URL", "http://localhost:8000")
API_KEY = os.getenv("SNAPCHART_API_KEY", "sk-wxgInpoDpWFxF-tskvIxFQaXUAzd5Nrl")
OUTPUT_DIR = Path(__file__).parent / "output"


# ========== 步骤 1：模拟 LLM 思考 — 构造图表数据 ==========

def step1_prepare_chart_data() -> dict:
    """
    模拟大模型「思考」环节：
    根据行业调研数据，构造一张企业能力雷达图（radar）的 JSON 请求体，
    搭配 brand-pro（麦肯锡商务灰）主题。
    """
    print("\n" + "=" * 60)
    print("[Step 1] LLM 思考：构造企业能力评估雷达图数据")
    print("=" * 60)

    chart_payload = {
        "chartType": "radar",
        "title": "2025 年度企业核心能力评估",
        "labels": [
            "技术创新力",
            "市场渗透率",
            "客户满意度",
            "运营效率",
            "人才储备",
            "品牌影响力",
        ],
        "datasets": [
            {
                "name": "本企业",
                "values": [92, 78, 88, 85, 71, 80],
            },
            {
                "name": "行业标杆",
                "values": [85, 90, 82, 88, 86, 92],
            },
        ],
        "colors": [
            "#2D3436",
            "#D4A373",
            "#636E72",
            "#B2BEC3",
            "#E6B89C",
            "#8C939D",
        ],
        "theme": "brand-pro",
        "width": 1200,
        "height": 800,
    }

    print(f"  图表类型：{chart_payload['chartType']}")
    print(f"  标    题：{chart_payload['title']}")
    print(f"  维度数量：{len(chart_payload['labels'])}")
    print(f"  数据系列：{len(chart_payload['datasets'])} 组")
    print(f"  主    题：{chart_payload['theme']}（麦肯锡商务灰）")

    return chart_payload


# ========== 步骤 2：调用 SnapChart API ==========

def step2_call_api(chart_payload: dict) -> bytes:
    """
    携带 Bearer Token 鉴权，POST 请求 /api/render-chart，
    获取 SSR 渲染的高清图表图片（PNG 或 SVG）。
    """
    print("\n" + "=" * 60)
    print("[Step 2] 调用 SnapChart API：渲染图表")
    print("=" * 60)

    url = f"{API_BASE_URL}/api/render-chart"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    print(f"  端    点：POST {url}")
    print(f"  鉴权方式：Bearer Token ({API_KEY[:10]}...{API_KEY[-4:]})")

    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, json=chart_payload, headers=headers)
    except httpx.ConnectError:
        print("\n  [ERROR] 无法连接到 SnapChart API 服务。")
        print("  请确认：")
        print("    1. FastAPI 后端已启动（python main.py / uvicorn main:app）")
        print("    2. SSR 微服务已启动（cd ssr-service && node server.js）")
        sys.exit(1)

    if resp.status_code == 401:
        print(f"\n  [ERROR] 鉴权失败（401）：{resp.json().get('detail', '未知错误')}")
        sys.exit(1)

    if resp.status_code != 200:
        print(f"\n  [ERROR] API 返回 {resp.status_code}：{resp.text[:300]}")
        sys.exit(1)

    content_type = resp.headers.get("content-type", "")
    remaining = resp.headers.get("x-credits-remaining", "N/A")
    image_bytes = resp.content

    print(f"  响应状态：{resp.status_code} OK")
    print(f"  内容类型：{content_type}")
    print(f"  图片大小：{len(image_bytes):,} bytes")
    print(f"  剩余额度：{remaining}")

    return image_bytes


# ========== 步骤 3：资产落盘 ==========

def step3_save_image(image_bytes: bytes) -> Path:
    """将 API 返回的图片二进制流保存到本地文件。"""
    print("\n" + "=" * 60)
    print("[Step 3] 资产落盘：保存图表图片")
    print("=" * 60)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / "capability_radar.png"
    output_path.write_bytes(image_bytes)

    print(f"  保存路径：{output_path}")
    print(f"  文件大小：{output_path.stat().st_size:,} bytes")

    return output_path


# ========== 步骤 4：生成白皮书 ==========

def step4_generate_whitepaper(image_path: Path) -> Path:
    """
    自动生成一份 Markdown 格式的行业白皮书，
    内嵌之前渲染的雷达图图片。
    """
    print("\n" + "=" * 60)
    print("[Step 4] 生成白皮书：industry_whitepaper.md")
    print("=" * 60)

    today = datetime.now().strftime("%Y年%m月%d日")

    whitepaper_content = f"""\
# 2025 年度企业数字化转型能力白皮书

> **发布日期**：{today}
> **编制单位**：SnapChart 行业研究院
> **机密等级**：内部参考

---

## 一、研究背景

在数字经济快速发展的背景下，企业核心竞争力的构建已从单一技术维度，
扩展到涵盖市场、客户、运营、人才和品牌的全方位能力体系。
本白皮书基于对 200+ 家行业领军企业的深度调研，
建立了六维能力评估模型，旨在为企业管理层提供决策参考。

## 二、评估方法论

本研究采用 **六维雷达评估模型（Hexagonal Capability Radar）**，
从以下六个核心维度对企业能力进行量化评估（满分 100）：

| 维度 | 权重 | 说明 |
|------|------|------|
| 技术创新力 | 20% | 研发投入占比、专利数量、技术栈先进性 |
| 市场渗透率 | 18% | 目标市场覆盖率、新市场拓展速度 |
| 客户满意度 | 18% | NPS 净推荐值、客户留存率、投诉响应时效 |
| 运营效率 | 16% | 人均产出、流程自动化率、成本控制能力 |
| 人才储备 | 14% | 核心人才密度、培训体系、雇主品牌吸引力 |
| 品牌影响力 | 14% | 品牌知名度、行业话语权、ESG 评级 |

## 三、核心发现

### 3.1 企业能力雷达图

![企业能力评估](./capability_radar.png)

**关键洞察：**

- **技术创新力（92 vs 85）**：目标企业在技术创新维度显著领先行业标杆，
  得益于过去三年持续加大的研发投入（占营收比达 15.3%）。
- **市场渗透率（78 vs 90）**：这是当前最明显的能力短板。
  尽管产品技术领先，但市场推广和渠道建设仍有较大提升空间。
- **客户满意度（88 vs 82）**：NPS 值达到行业 Top 10%，
  客户服务体系成为核心竞争优势。
- **运营效率（85 vs 88）**：与行业标杆基本持平，
  建议在供应链数字化和 RPA 领域加大投入。
- **人才储备（71 vs 86）**：技术人才流失率偏高（18%），
  需加强雇主品牌建设和核心人才长期激励机制。
- **品牌影响力（80 vs 92）**：品牌全球化布局滞后，
  建议加强海外市场的品牌宣传和行业峰会参与。

### 3.2 战略建议优先级矩阵

| 优先级 | 改进方向 | 预期投入 | ROI 预测 |
|--------|---------|---------|---------|
| P0 | 市场渗透率提升 | ¥2,000万 | 24个月 回本 |
| P0 | 人才储备强化 | ¥800万/年 | 12个月 见效 |
| P1 | 品牌影响力建设 | ¥500万/年 | 18个月 见效 |
| P2 | 运营效率优化 | ¥300万 | 6个月 见效 |

## 四、结论

本企业在技术创新和客户满意度方面已建立显著优势，
但在市场拓展和人才建设方面存在明显短板。
建议管理层在未来 12-18 个月内，将资源重点向 P0 级改进方向倾斜，
以实现能力的均衡发展。

---

*本白皮书由 SnapChart 白皮书 Agent 自动生成。*
*图表由 SnapChart SSR 引擎渲染，数据仅供演示参考。*
"""

    whitepaper_path = OUTPUT_DIR / "industry_whitepaper.md"
    whitepaper_path.write_text(whitepaper_content, encoding="utf-8")

    print(f"  保存路径：{whitepaper_path}")
    print(f"  文件大小：{whitepaper_path.stat().st_size:,} bytes")
    print(f"  内嵌图片：./capability_radar.png")

    return whitepaper_path


# ========== 主流程 ==========

def main():
    print("\n" + "#" * 60)
    print("#  SnapChart 白皮书 Agent — 自动化工作流演示")
    print("#" * 60)

    # Step 1: 构造图表数据
    chart_payload = step1_prepare_chart_data()

    # Step 2: 调用 API 渲染图表
    image_bytes = step2_call_api(chart_payload)

    # Step 3: 保存图片到本地
    image_path = step3_save_image(image_bytes)

    # Step 4: 生成白皮书
    whitepaper_path = step4_generate_whitepaper(image_path)

    # 完成
    print("\n" + "=" * 60)
    print("[Done] 白皮书生成完成！")
    print("=" * 60)
    print(f"  图表文件：{image_path}")
    print(f"  白皮书  ：{whitepaper_path}")
    print(f"  用 Markdown 预览器打开白皮书即可查看嵌入的图表。")
    print()


if __name__ == "__main__":
    main()
