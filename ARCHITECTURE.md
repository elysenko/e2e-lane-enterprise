# Architecture

## Requested stack
- `enterprise` — Angular 19 (frontend) + NestJS + tRPC + Prisma + PostgreSQL (backend)

## Scaffolding status
- `enterprise` — ✅ newly scaffolded (project directory previously contained only a placeholder
  nginx image, `.github` workflow, and `k8s`/`kustomization.yaml` deploy manifests — no
  application source existed).

## Layout
- `frontend/` — Angular 19 app (standalone components, `app.component.ts`, `home/home.component.ts`
  fetching data via tRPC client)
- `backend/` — NestJS app (`src/health` for health checks, `src/users` for the tRPC `users` router,
  `src/trpc` for the tRPC adapter, `prisma/` for the schema/migrations)
- `.pipeline/surface.json` — generated manifest of routes, components, and `data-testid` values;
  authoritative contract for downstream test-spec and Playwright generation agents. Also carries
  the 400-line (soft) / 500-line (hard) per-file budget.
- `.colossus-acceptance.json` — acceptance contract read by the post-deploy render gate
  (`ready_testid: app-ready`); `expect_text` is intentionally empty until the coder fills in real
  front-page content.
- `colossus.yaml` — build manifest for deploy agents (Angular frontend + NestJS backend, ports,
  output dirs). Regenerated on every scaffolder run.
- `Dockerfile`, `k8s/`, `kustomization.yaml`, `.github/workflows/colossus-deploy.yml` — pre-existing
  deploy plumbing, left untouched by this scaffold.

## Next steps for the developer
1. Copy environment templates and fill in real values:
   - `cp .env.template .env` (repo root, if present)
   - `cp backend/.env.template backend/.env`
2. Install dependencies: `npm install` in both `frontend/` and `backend/` (or via the root
   `docker-compose.yml` if present).
3. Run database migrations: `npx prisma migrate dev` from `backend/`.
4. Bring up local services: `docker-compose up` (Postgres, etc.) if using the provided compose file.
5. Implement the plan's habit-tracker feature set (`/habits`, `/habits/new`, `/about`) as Angular
   routes/components backed by NestJS/tRPC endpoints and Prisma models — the stack is fixed to
   Angular + NestJS + tRPC + Prisma per platform contract; adapt the plan's data model (habits,
   streaks) onto Prisma/PostgreSQL instead of the plan's original SQLite suggestion.
6. Update `.pipeline/surface.json` and `.colossus-acceptance.json` (`expect_text`) as real routes,
   components, and front-page content are added.

## Template source
- `template-enterprise/` from the platform's `scaffold-templates` directory.
