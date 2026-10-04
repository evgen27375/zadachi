# Единый образ: собирает фронтенд и бэкенд, backend раздаёт фронт (один URL).
# Используется для деплоя в один сервис (Render / любой PaaS / VPS).

# ---- frontend build ----
FROM node:22-alpine AS frontend
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
ENV VITE_API_BASE=/api
RUN npm run build

# ---- backend build ----
FROM node:22-alpine AS backend
WORKDIR /be
COPY backend/package.json backend/package-lock.json* ./
RUN npm install
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

# ---- runtime ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev
COPY --from=backend /be/dist ./dist
COPY backend/src/db/migrations ./dist/db/migrations
COPY --from=frontend /fe/dist ./dist/public
EXPOSE 8080
CMD ["sh","-c","node dist/db/migrate.js && node dist/index.js"]
