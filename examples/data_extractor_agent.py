"""
SnapChart 数据清洗大脑 — AI 数据提取 Agent

完整工作流：杂乱文本 → LLM 结构化 → API 渲染 → 资产落盘

架构思想：
  ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────┐
  │  非结构化文本    │ ──▶ │  大模型深度解析   │ ──▶ │  SnapChart API  │ ──▶ │  高清图表PNG  │
  │  (口语/会议纪要) │     │  (Gemini 2.5)    │     │  (SSR 渲染引擎)  │     │  (资产落盘)   │
  └─────────────────┘     └──────────────────┘     └─────────────────┘     └──────────────┘

用法：
  python examples/data_extractor_agent.py

前置条件：
  - FastAPI 后端运行中（端口 8000）
  - SSR 微服务运行中（端口 3100）
  - pip install httpx
"""

import json
import os
import sys
import time
import asyncio
from pathlib import Path

import httpx

# ========== 配置 ==========

API_BASE_URL = os.getenv("SNAPCHART_API_URL", "http://localhost:8000")
API_KEY = os.getenv("SNAPCHART_API_KEY", "sk-wxgInpoDpWFxF-tskvIxFQaXUAzd5Nrl")
OUTPUT_DIR = Path(__file__).parent / "output"


# ========================================================================
# 步骤 1：模拟业务输入 — 非结构化杂乱文本
# ========================================================================

UNSTRUCTURED_INPUT = """
哎呀，我们这次展会主要推了几个能力。跟行业平均比起来吧，我们的品牌力能打 90 分，
行业也就 75；产品力我们 80，行业 70；渠道力我们 85，行业 80；服务力我们绝对有 95，
行业才 75；创新力稍微弱点 70，行业有 65；价格优势我们 88，行业 80 左右。
这块你帮我做个对比图放白皮书里。
"""


# ========================================================================
# 步骤 2：构建大模型 Prompt 模板
# ========================================================================

SYSTEM_PROMPT = """\
你是一位专业的商业数据分析师 & 图表架构师。你的任务是：

1. 仔细阅读用户提供的【非结构化文本】（可能是口语、会议纪要、聊天记录等）。
2. 从中精准提取出所有可量化的数据维度和对应数值。
3. 根据数据特征，智能判断最适合的商业图表类型：
   - 多维度对比 → radar（雷达图）
   - 趋势+对比 → barLine（柱线混合图）
   - 占比分布 → pie / rose（饼图/南丁格尔玫瑰图）
   - 流程漏斗 → funnel（漏斗图）
   - 单一KPI → gauge（仪表盘）
4. 推荐一个最匹配商业场景的主题皮肤：
   - brand-pro：麦肯锡商务灰（正式报告）
   - dark-tech：暗黑科技风（技术展示）
   - macarons：柔和马卡龙（消费品/时尚）
   - vintage：复古暖色（传统行业）

【输出要求】
严格输出一个 JSON 对象，不要有任何多余文字。结构如下：
{
  "chart_type": "识别出的图表类型（如 radar / barLine / pie 等）",
  "theme": "推荐的主题名称",
  "reasoning": "一句话解释为什么选择这个图表类型",
  "data": {
    "title": "图表标题（专业、简洁）",
    "labels": ["维度1", "维度2", ...],
    "datasets": [
      {"name": "系列名称", "values": [数值1, 数值2, ...], "type": "数据类型说明"}
    ]
  }
}
"""

USER_PROMPT_TEMPLATE = """\
请分析以下非结构化文本，提取数据并生成图表配置 JSON：

---
{text}
---
"""


# ========================================================================
# 步骤 3：Mock LLM 调用（模拟 Gemini 2.5 深度解析）
# ========================================================================

def call_gemini_2_5_api(system_prompt: str, user_prompt: str) -> str:
    """
    模拟调用 Gemini 2.5 Flash/Pro API 进行文本解析。

    生产环境中，此函数应替换为真实的 LLM API 调用：
        import google.generativeai as genai
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content([system_prompt, user_prompt])
        return response.text

    当前为 Mock 实现：硬编码返回 LLM「应该」输出的完美 JSON，
    确保脚本开箱即用，无需任何 API Key。
    """
    print("  [LLM] 模型：Gemini 2.5 Flash")
    print("  [LLM] System Prompt 长度：%d chars" % len(system_prompt))
    print("  [LLM] User Prompt 长度：%d chars" % len(user_prompt))
    print("  [LLM] Gemini 2.5 正在深度解析文本...")

    # 模拟思考延迟
    for i in range(3):
        time.sleep(0.3)
        dots = "." * (i + 1)
        print(f"  [LLM] 语义理解中{dots} 提取维度数据{dots} 推理图表类型{dots}")

    # ---- 模拟 LLM 输出：完美结构化 JSON ----
    llm_output = json.dumps({
        "chart_type": "radar",
        "theme": "brand-pro",
        "reasoning": "文本包含6个能力维度的双方对比数据，雷达图最适合展示多维度竞争力差异",
        "data": {
            "title": "企业核心能力 vs 行业平均对标分析",
            "labels": ["品牌力", "产品力", "渠道力", "服务力", "创新力", "价格优势"],
            "datasets": [
                {
                    "name": "我方企业",
                    "values": [90, 80, 85, 95, 70, 88],
                    "type": "企业自评得分"
                },
                {
                    "name": "行业平均",
                    "values": [75, 70, 80, 75, 65, 80],
                    "type": "行业基准值"
                }
            ]
        }
    }, ensure_ascii=False, indent=2)

    print("  [LLM] 解析完成！输出 token 数：~%d" % (len(llm_output) // 4))
    return llm_output


# ========================================================================
# 步骤 4：LLM 输出 → SnapChart API 请求体转换
# ========================================================================

def transform_to_api_payload(llm_json: dict) -> dict:
    """
    将 LLM 输出的结构化 JSON 转换为 SnapChart /api/render-chart 请求体。

    LLM 输出格式（自由）→ API 输入格式（严格）的映射桥梁，
    解耦 LLM prompt 工程与 API 契约。
    """
    chart_data = llm_json["data"]

    payload = {
        "chartType": llm_json["chart_type"],
        "title": chart_data["title"],
        "labels": chart_data["labels"],
        "datasets": [
            {"name": ds["name"], "values": ds["values"]}
            for ds in chart_data["datasets"]
        ],
        "theme": llm_json.get("theme", "brand-pro"),
        "width": 1200,
        "height": 800,
    }

    return payload


# ========================================================================
# 步骤 5：调用 SnapChart API 渲染图表
# ========================================================================

async def call_render_api(payload: dict) -> bytes:
    """
    携带 Bearer Token 鉴权，POST /api/render-chart，
    获取 SSR 引擎渲染的高清图表图片。
    """
    url = f"{API_BASE_URL}/api/render-chart"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    print(f"  [API] POST {url}")
    print(f"  [API] 鉴权：Bearer {API_KEY[:10]}...{API_KEY[-4:]}")
    print(f"  [API] 图表类型：{payload['chartType']}  主题：{payload.get('theme')}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
    except httpx.ConnectError:
        print("\n  [ERROR] 无法连接到 SnapChart API 服务。")
        print("  请确认后端（端口 8000）和 SSR 服务（端口 3100）已启动。")
        sys.exit(1)

    if resp.status_code == 401:
        print(f"\n  [ERROR] 鉴权失败（401）：{resp.json().get('detail')}")
        sys.exit(1)

    if resp.status_code != 200:
        print(f"\n  [ERROR] API 返回 {resp.status_code}：{resp.text[:300]}")
        sys.exit(1)

    content_type = resp.headers.get("content-type", "")
    remaining = resp.headers.get("x-credits-remaining", "N/A")

    print(f"  [API] 响应：{resp.status_code} OK")
    print(f"  [API] 格式：{content_type}  大小：{len(resp.content):,} bytes")
    print(f"  [API] 剩余额度：{remaining}")

    return resp.content


# ========================================================================
# 步骤 6：资产落盘
# ========================================================================

def save_image(image_bytes: bytes, filename: str) -> Path:
    """将渲染好的图表图片保存到本地。"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / filename
    output_path.write_bytes(image_bytes)
    print(f"  [Save] {output_path}  ({len(image_bytes):,} bytes)")
    return output_path


# ========================================================================
# 主流程：杂乱文本 → LLM 结构化 → API 渲染 → 资产落盘
# ========================================================================

async def main():
    print()
    print("#" * 64)
    print("#  SnapChart 数据清洗大脑 — AI 数据提取 Agent")
    print("#  架构：非结构化文本 → LLM 解析 → API 渲染 → 图表落盘")
    print("#" * 64)

    # ---- Phase 1：展示原始输入 ----
    print("\n" + "=" * 64)
    print("[Phase 1] 原始业务输入（非结构化文本）")
    print("=" * 64)
    print(UNSTRUCTURED_INPUT.strip())

    # ---- Phase 2：LLM 深度解析 ----
    print("\n" + "=" * 64)
    print("[Phase 2] 大模型深度解析（Gemini 2.5 Flash）")
    print("=" * 64)

    user_prompt = USER_PROMPT_TEMPLATE.format(text=UNSTRUCTURED_INPUT.strip())
    llm_raw_output = call_gemini_2_5_api(SYSTEM_PROMPT, user_prompt)

    print("\n  [LLM] 结构化输出：")
    print("  " + "-" * 50)

    llm_json = json.loads(llm_raw_output)
    for line in json.dumps(llm_json, ensure_ascii=False, indent=2).split("\n"):
        print(f"  {line}")

    print("  " + "-" * 50)
    print(f"  [LLM] 推理依据：{llm_json['reasoning']}")

    # ---- Phase 3：转换 & 调用 API ----
    print("\n" + "=" * 64)
    print("[Phase 3] 调用 SnapChart API 渲染图表")
    print("=" * 64)

    api_payload = transform_to_api_payload(llm_json)
    image_bytes = await call_render_api(api_payload)

    # ---- Phase 4：资产落盘 ----
    print("\n" + "=" * 64)
    print("[Phase 4] 资产落盘")
    print("=" * 64)

    output_path = save_image(image_bytes, "ai_extracted_radar.png")

    # ---- 完成 ----
    print("\n" + "=" * 64)
    print("[Done] 全链路完成！")
    print("=" * 64)
    print(f"  输入：{len(UNSTRUCTURED_INPUT)} 字符的口语化杂乱文本")
    print(f"  解析：Gemini 2.5 → {llm_json['chart_type']} + {llm_json['theme']}")
    print(f"  输出：{output_path}")
    print(f"  维度：{len(llm_json['data']['labels'])} 个能力维度 × {len(llm_json['data']['datasets'])} 组对比数据")
    print()


if __name__ == "__main__":
    asyncio.run(main())
