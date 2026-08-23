# Architecture

## Stack
- `enterprise` — Angular 19 (frontend) + NestJS + **REST** + Prisma + PostgreSQL (backend)

The scaffold template mentions tRPC, but this app does **not** use it: the frontend talks to the
backend over plain REST via Angular's `HttpClient`. There is no tRPC router, adapter or client
anywhere in the tree. Do not reintroduce one.

## Layout
- `frontend/` — Angular 19 app, standalone components with lazy `loadComponent` routes:
  - `app.component.ts` — root shell; owns the `data-testid="app-ready"` render landmark
  - `habits/habits-list/` — `/habits`, the habit list
  - `habits/habit-new/` — `/habits/new`, the create form
  - `about/` — `/about`
  - `shared/nav/` — persistent top bar + mobile tab bar (no auth chrome)
  - `shared/api/habits-api.service.ts` — the **only** data-fetching service; wraps `HttpClient`
  - `shared/api/api.config.ts` — `API_BASE = 'api'` (base-href-relative on purpose, see below)
  - `core/models.ts` — the `Habit` interface, the app's only domain entity
- `backend/` — NestJS app:
  - `src/health/` — `GET /api/health`, `GET /api/health/deep` (deep pings the DB, 503 when down)
  - `src/habits/` — `GET /api/habits`, `POST /api/habits`; seeds three example habits on first boot
  - `src/prisma/` — `PrismaService` (non-fatal connect, so a DB outage degrades instead of crash-looping)
  - `prisma/` — schema, migrations, and an idempotent `seed/seed.js`
- `.pipeline/surface.json` — manifest of routes, components and `data-testid` values; the contract
  for downstream test-spec and Playwright generation. Also carries the 400-line (soft) /
  500-line (hard) per-file budget.
- `.colossus-acceptance.json` — post-deploy render gate (`ready_testid: app-ready`, plus the
  `expect_text` / `reject_signatures` checks).
- `colossus.yaml` — build manifest for deploy agents (Angular frontend + NestJS backend, ports,
  output dirs).
- `Dockerfile`, `docker/`, `k8s/`, `kustomization.yaml`, `.github/workflows/` — deploy plumbing.

## How the frontend reaches the backend
One container runs both processes under supervisord (`docker/supervisord.conf`):

```
browser
  -> ingress   https://<host>/e2e-lane-enterprise/*   (strips the prefix)
  -> nginx     :8080   /api/*  -> proxy_pass 127.0.0.1:3000
                       /*      -> try_files ... /index.html   (SPA deep links)
  -> NestJS    :3000   global prefix `api`
  -> Postgres
```

**The API base is the relative string `api`, never `/api`.** The SPA is built with
`--base-href=/e2e-lane-enterprise/`, and `HttpClient` resolves a relative URL against
`document.baseURI` — so `api/habits` becomes `/e2e-lane-enterprise/api/habits` from *every* route
and travels back through the ingress. A leading slash would resolve to the host root, skip the
ingress prefix and 404. In dev the base href is `/`, so the same string resolves to `/api/habits`
and `frontend/proxy.conf.json` forwards it to `localhost:3000`.

## Data flow
`HabitsListComponent` starts with an **empty** list and fills it only from `GET /api/habits`; it
renders explicit loading, error (with retry) and empty states. It deliberately holds no placeholder
rows — fabricated data would make a dead backend look healthy to the deploy gate. The example
habits a visitor sees on a fresh deploy come from the real database, seeded by
`HabitsService.onModuleInit`.

## Local development
1. Install dependencies: `npm install` in both `frontend/` and `backend/`.
2. Point `DATABASE_URL` at a Postgres instance (`docker-compose.yml` provides one).
3. From `backend/`: `npx prisma generate && npx prisma migrate deploy` (`npx prisma db seed` is
   optional — the app self-seeds on boot, and both paths are idempotent).
4. Run the backend (`npm run start:dev`, listens on :3000) and the frontend
   (`npm start -- --proxy-config proxy.conf.json`, serves on :4200).

## Constraints
- **No authentication**, per spec: no login/signup/admin routes, no guards, no session state, and no
  sign-out affordance. Every route and every `/api` endpoint is public. The dormant Prisma `User`
  model is retained only to avoid a destructive migration; no code reads it.
- **Ephemeral data**: the deployment mounts no PersistentVolume, so visitor-added habits are lost on
  pod restart and the three seeds reappear.
