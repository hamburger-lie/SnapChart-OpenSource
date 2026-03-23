# ================================
# SnapChart — 后端 Dockerfile
# 基础镜像：python:3.10-slim
# ================================

FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖（pandas 需要 gcc 编译部分包）
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 优先复制依赖文件，利用 Docker 层缓存加速构建
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 预建数据库目录（volume 挂载前需要目录存在）
RUN mkdir -p /app/data /app/uploads

# 暴露端口
EXPOSE 8000

# 启动命令：使用 uvicorn 生产模式（不开 reload）
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
