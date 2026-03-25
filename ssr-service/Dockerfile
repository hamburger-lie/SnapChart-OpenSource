FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm ci --omit=dev
COPY . .
EXPOSE 3100
CMD ["node", "server.js"]
