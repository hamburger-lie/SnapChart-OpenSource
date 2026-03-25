# SnapChart Backend — 轻量级镜像（~250MB vs 旧版 Playwright 1.5GB）
FROM python:3.10-slim

# cairosvg 系统依赖 + 中文字体（防止 PNG 中文变豆腐块 □□□）
# 字体装在 Python 容器，因为 Cairo 才是真正把 SVG 文字渲染成像素的引擎
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libffi-dev \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
