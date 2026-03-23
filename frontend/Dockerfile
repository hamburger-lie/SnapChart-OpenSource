# ================================
# SnapChart — 前端 Dockerfile（多阶段构建）
# Stage 1: Node 构建
# Stage 2: Nginx 生产服务
# ================================

# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

# 优先复制 package 文件，利用缓存
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# 复制源码并构建
COPY . .
RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:1.27-alpine

# 删除默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 写入自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/app.conf

# 将构建产物复制到 Nginx 静态目录
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
