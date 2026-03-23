/**
 * API 服务层
 * 封装与后端的所有网络通信，统一处理请求和错误
 */

import type { ChartResponse, SharedChartData, StyleCreate, StyleListItem, StyleResponse } from "../types/chart";

const API_BASE = "/api";

// ========== 文件上传 ==========

/**
 * 上传文件并解析为图表数据
 */
export async function uploadAndParse(file: File): Promise<ChartResponse> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/upload-and-parse`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error("无法连接到服务器，请检查后端服务是否已启动");
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = body?.detail || body?.message || `服务器错误（状态码：${response.status}）`;
    throw new Error(message);
  }

  if (!body || body.status !== "success" || !body.data) {
    throw new Error("服务器返回了异常的数据格式");
  }

  return body as ChartResponse;
}

// ========== 样式 CRUD ==========

/**
 * 获取所有已保存的样式列表
 */
export async function fetchStyles(): Promise<StyleListItem[]> {
  const response = await fetch(`${API_BASE}/styles`);
  if (!response.ok) throw new Error("获取样式列表失败");
  return response.json();
}

/**
 * 根据 ID 获取样式详情
 */
export async function fetchStyleById(id: string): Promise<StyleResponse> {
  const response = await fetch(`${API_BASE}/styles/${id}`);
  if (!response.ok) throw new Error("获取样式详情失败");
  return response.json();
}

/**
 * 创建新样式
 */
export async function createStyle(data: StyleCreate): Promise<StyleResponse> {
  const response = await fetch(`${API_BASE}/styles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("保存样式失败");
  return response.json();
}

/**
 * 更新样式
 */
export async function updateStyle(id: string, data: StyleCreate): Promise<StyleResponse> {
  const response = await fetch(`${API_BASE}/styles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("更新样式失败");
  return response.json();
}

/**
 * 删除样式
 */
export async function deleteStyleApi(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/styles/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("删除样式失败");
}

// ========== Agent 共享图表 ==========

/**
 * 获取 Agent 创建的共享图表数据（无需鉴权）
 * 对应后端 GET /api/agent/chart/{uuid}
 */
export async function fetchSharedChart(uuid: string): Promise<SharedChartData> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/agent/chart/${uuid}`);
  } catch {
    throw new Error("无法连接到服务器");
  }

  if (response.status === 404) {
    throw new Error("CHART_NOT_FOUND");
  }
  if (!response.ok) {
    throw new Error(`获取图表数据失败（${response.status}）`);
  }

  return response.json() as Promise<SharedChartData>;
}

/**
 * 健康检查
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
