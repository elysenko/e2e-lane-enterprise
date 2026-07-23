# syntax=docker/dockerfile:1
# Combined single-container image deployed by k8s/deployment.yaml
# (image: e2e-lane-enterprise, Service :80 -> targetPort :8080).
#
#   - Angular 19 SPA, served by nginx on :8080
#   - NestJS + Prisma REST backend on :3000, reached via nginx at /api/*
#
# nginx and the backend run together under supervisord
# (serve_topology: nginx_frontend_plus_backend_supervisor). The ingress routes
# https://<host>/e2e-lane-enterprise/* to this pod and strips the prefix, so the
# SPA is built with --base-href=/e2e-lane-enterprise/ and nginx serves at root.

# ---------- Stage 1: build the Angular frontend ----------
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# base-href must match the ingress path prefix so browser asset + API URLs
# resolve back through the ingress to this pod.
RUN npx ng build --configuration production --base-href=/e2e-lane-enterprise/

# ---------- Stage 2: build the NestJS backend ----------
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate
# Compile with tsc directly (deterministic emit to ./dist/main.js).
RUN npx tsc -p tsconfig.build.json

# ---------- Stage 3: runtime ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
RUN apk add --no-cache nginx supervisor \
    && mkdir -p /run/nginx /usr/share/nginx/html

# Frontend static assets (Angular application builder emits to dist/frontend/browser).
COPY --from=frontend-build /app/frontend/dist/frontend/browser /usr/share/nginx/html

# Backend runtime: compiled output, deps, generated Prisma client + schema.
WORKDIR /app/backend
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/prisma ./prisma
COPY --from=backend-build /app/backend/package*.json ./

# nginx + supervisor configuration.
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf

EXPOSE 8080
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
