# --- збірка ---------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# true — демо-образ без бекенду (мок-адаптер усередині бандла)
ARG VITE_USE_MOCKS=false
ARG VITE_API_URL=/api
ENV VITE_USE_MOCKS=$VITE_USE_MOCKS VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- статика в nginx --------------------------------------------------------------
FROM nginx:1.27-alpine
# nginx проксує /api на бекенд, тож CORS не потрібен і в продакшені
ENV BACKEND_URL=http://api:8080
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
