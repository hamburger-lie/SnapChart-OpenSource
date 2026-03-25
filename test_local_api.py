# -*- coding: utf-8 -*-
"""
SnapChart 外部 API 调用模拟脚本
模拟 n8n / Coze / Dify 等第三方调用 Agent API 的完整流程。

用法：
  python test_local_api.py

流程：
  1. 输入 API Key
  2. 创建一张测试图表 → 获取 UUID
  3. 获取图表数据（公开接口）
  4. 验证鉴权失败场景
  5. 打印完整测试报告
"""

import json
import sys

try:
    import requests
except ImportError:
    print("请先安装 requests: pip install requests")
    sys.exit(1)

BASE_URL = "http://localhost"  # Nginx 80 端口
# 如果未通过 Nginx，直接访问后端：
# BASE_URL = "http://localhost:8000"


def test_create_chart(api_key: str) -> str | None:
    """测试创建图表（需鉴权 + 扣费）"""
    print("\n" + "=" * 60)
    print("  TEST 1: 创建图表 (POST /api/agent/create-chart)")
    print("=" * 60)

    url = f"{BASE_URL}/api/agent/create-chart"
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "chartType": "bar",
        "title": "API 自动化测试 - 季度营收",
        "labels": ["Q1", "Q2", "Q3", "Q4"],
        "datasets": [
            {"name": "营收", "values": [12000, 18500, 22000, 28000]},
            {"name": "成本", "values": [8000, 11000, 14000, 17000]},
            {"name": "利润", "values": [4000, 7500, 8000, 11000]},
        ],
    }

    resp = requests.post(url, headers=headers, json=payload, timeout=15)
    print(f"  Status: {resp.status_code}")
    print(f"  Response: {json.dumps(resp.json(), ensure_ascii=False, indent=4)}")

    if resp.status_code == 200:
        data = resp.json()
        print(f"\n  [PASS] 图表创建成功！")
        print(f"     UUID:     {data['uuid']}")
        print(f"     ShareUrl: {data['shareUrl']}")
        return data["uuid"]
    else:
        print(f"\n  [FAIL] 创建失败: {resp.status_code}")
        return None


def test_get_chart(uuid: str):
    """测试获取图表数据（公开，无需鉴权）"""
    print("\n" + "=" * 60)
    print(f"  TEST 2: 获取图表 (GET /api/agent/chart/{uuid})")
    print("=" * 60)

    url = f"{BASE_URL}/api/agent/chart/{uuid}"
    resp = requests.get(url, timeout=10)
    print(f"  Status: {resp.status_code}")

    if resp.status_code == 200:
        data = resp.json()
        print(f"  Title:    {data['title']}")
        print(f"  Type:     {data['chartType']}")
        print(f"  Labels:   {data['labels']}")
        print(f"  Datasets: {len(data['datasets'])} series")
        for ds in data["datasets"]:
            print(f"    - {ds['name']}: {ds['values']}")
        print(f"\n  [PASS] 数据获取成功！")
    else:
        print(f"\n  [FAIL] 获取失败: {resp.text}")


def test_no_key():
    """测试无 Key 调用（预期 401）"""
    print("\n" + "=" * 60)
    print("  TEST 3: 无 API Key 调用 (预期 401)")
    print("=" * 60)

    url = f"{BASE_URL}/api/agent/create-chart"
    payload = {"chartType": "bar", "title": "test", "labels": ["A"], "datasets": [{"name": "s", "values": [1]}]}
    resp = requests.post(url, json=payload, timeout=10)
    print(f"  Status: {resp.status_code}")

    if resp.status_code == 401:
        print(f"  [PASS] 正确拒绝！{resp.json().get('detail', '')}")
    else:
        print(f"  [FAIL] 预期 401，实际 {resp.status_code}")


def test_wrong_key():
    """测试错误 Key（预期 401）"""
    print("\n" + "=" * 60)
    print("  TEST 4: 错误 API Key 调用 (预期 401)")
    print("=" * 60)

    url = f"{BASE_URL}/api/agent/create-chart"
    headers = {"X-API-Key": "sk-this-is-a-wrong-key-12345"}
    payload = {"chartType": "bar", "title": "test", "labels": ["A"], "datasets": [{"name": "s", "values": [1]}]}
    resp = requests.post(url, headers=headers, json=payload, timeout=10)
    print(f"  Status: {resp.status_code}")

    if resp.status_code == 401:
        print(f"  [PASS] 正确拒绝！{resp.json().get('detail', '')}")
    else:
        print(f"  [FAIL] 预期 401，实际 {resp.status_code}")


def test_not_found():
    """测试不存在的图表（预期 404）"""
    print("\n" + "=" * 60)
    print("  TEST 5: 请求不存在的图表 (预期 404)")
    print("=" * 60)

    url = f"{BASE_URL}/api/agent/chart/00000000-0000-0000-0000-000000000000"
    resp = requests.get(url, timeout=10)
    print(f"  Status: {resp.status_code}")

    if resp.status_code == 404:
        print(f"  [PASS] 正确返回 404！{resp.json().get('detail', '')}")
    else:
        print(f"  [FAIL] 预期 404，实际 {resp.status_code}")


def main():
    print("+" + "=" * 58 + "+")
    print("|        SnapChart Agent API 闭环测试              |")
    print("+" + "=" * 58 + "+")
    print(f"\n  Target: {BASE_URL}")

    # 获取 API Key
    api_key = input("\n  请输入 API Key (sk-...): ").strip()
    if not api_key:
        print("  未输入 Key，退出。")
        return

    # 运行全部测试
    passed = 0
    total = 5

    # Test 1: 创建图表
    uuid = test_create_chart(api_key)
    if uuid:
        passed += 1

    # Test 2: 获取图表
    if uuid:
        test_get_chart(uuid)
        passed += 1
    else:
        print("\n  [SKIP]  跳过 Test 2（依赖 Test 1 的 UUID）")

    # Test 3: 无 Key
    test_no_key()
    passed += 1

    # Test 4: 错误 Key
    test_wrong_key()
    passed += 1

    # Test 5: 404
    test_not_found()
    passed += 1

    # 汇总
    print("\n" + "=" * 60)
    print(f"  测试结果: {passed}/{total} 通过")
    print("=" * 60)

    if uuid:
        print(f"\n  你可以在浏览器中访问分享页面:")
        print(f"  {BASE_URL}/share/{uuid}")


if __name__ == "__main__":
    main()
