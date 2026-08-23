FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
# Fail loudly if the compile silently emits nothing (a stale *.tsbuildinfo makes
# incremental tsc skip emit after nest build deletes dist/, and the build still
# exits 0 — the failure would otherwise only surface as a missing module at boot).
RUN npm run build \
    && test -f /app/dist/main.js \
    || (echo 'ERROR: dist/main.js missing after build — check tsconfig.build.json rootDir: src and stale *.tsbuildinfo' && exit 1)

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
# Port must match `backend.port` in colossus.yaml — main.ts reads process.env.PORT
# (defaulting to 3000). This standalone image is only used if the backend is built
# as its own service; in the primary single-container topology the root Dockerfile
# runs the same code under supervisord with PORT=3000 behind nginx.
ENV PORT=3001
EXPOSE 3001
# Apply any pending migrations before boot; container exits non-zero (and K8s
# withholds traffic) if a migration fails.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
