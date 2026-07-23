# syntax=docker/dockerfile:1
# Single-container image deployed by k8s/deployment.yaml
# (image: e2e-lane-enterprise, Service :80 -> targetPort :8080).
#
# Server-rendered habit tracker: Node 20 + Express + EJS, SQLite storage.
# The ingress routes https://<host>/e2e-lane-enterprise/* to this pod and strips
# the prefix; the app prefixes every rendered link/form/asset via BASE_PATH.

FROM node:20-alpine

# better-sqlite3 ships prebuilt binaries for common platforms, but keep the
# build toolchain available so `npm install` can compile from source if needed.
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install production dependencies first for better layer caching.
COPY package*.json ./
RUN npm install --omit=dev

# Application source.
COPY src ./src
COPY views ./views
COPY public ./public

# Writable location for the ephemeral SQLite database.
RUN mkdir -p /app/data
ENV NODE_ENV=production \
    BASE_PATH=/e2e-lane-enterprise \
    PORT=8080 \
    DB_PATH=/app/data/habits.db

EXPOSE 8080
CMD ["node", "src/server.js"]
