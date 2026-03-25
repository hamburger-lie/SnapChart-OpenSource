# ================================
# SnapChart — 前端 Dockerfile（两阶段构建）
# Stage 1: Node 构建 React + Vite 项目
# Stage 2: Nginx 提供静态文件服务
# ================================

# ---- Stage 1: Build ----
FROM node:22-alpine AS build-stage

WORKDIR /app

# 优先复制 package 文件，利用 Docker 层缓存
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# 复制源码并构建生产包
COPY . .
RUN npm run build

# ---- Stage 2: Production ----
FROM nginx:alpine AS production-stage

# 将构建产物复制到 Nginx 静态目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 用自定义 nginx.conf 覆盖默认配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
