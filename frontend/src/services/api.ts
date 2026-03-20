/**
 * API 服务层
 * 封装与后端的所有网络通信，统一处理请求和错误
 */

import type { ChartResponse } from "../types/chart";

/** 后端 API 基础路径（通过 Vite 代理转发，无需写完整域名） */
const API_BASE = "/api";

/**
 * 上传文件并解析为图表数据
 *
 * @param file - 用户选择的 Excel/CSV 文件
 * @returns 解析后的图表数据
 * @throws Error 包含用户友好的错误信息
 */
export async function uploadAndParse(file: File): Promise<ChartResponse> {
  // 构建 FormData，字段名 "file" 需与后端 UploadFile 参数名一致
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;

  try {
    response = await fetch(`${API_BASE}/upload-and-parse`, {
      method: "POST",
      body: formData,
      // 注意：不要手动设置 Content-Type，浏览器会自动添加 multipart/form-data 和 boundary
    });
  } catch {
    // 网络级别错误（断网、后端未启动等）
    throw new Error("无法连接到服务器，请检查后端服务是否已启动");
  }

  // 解析响应体
  const body = await response.json().catch(() => null);

  // 处理 HTTP 错误状态码
  if (!response.ok) {
    // 优先使用后端返回的 detail 字段（FastAPI HTTPException 格式）
    const message =
      body?.detail || body?.message || `服务器错误（状态码：${response.status}）`;
    throw new Error(message);
  }

  // 校验响应结构
  if (!body || body.status !== "success" || !body.data) {
    throw new Error("服务器返回了异常的数据格式");
  }

  return body as ChartResponse;
}

/**
 * 健康检查：测试后端是否可用
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
