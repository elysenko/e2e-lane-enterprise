# Pipeline Task Decomposition

## Summary
A minimal, unauthenticated habit tracker already deployed as Angular 19 (nginx :8080) + NestJS (:3000, proxied at `/api/`) + Prisma/Postgres. This iteration is a correction pass, not a greenfield build: fix the habit list heading to the spec's exact wording ("My Habits"), collapse the duplicated add controls into exactly one control named "Add Habit", add stable `data-testid` hooks across the three screens, delete the entire auth/admin surface (login, signup, admin login, admin settings, `AuthService`, `UsersModule`), make the production seed habit-only and idempotent, and refresh the stale `.pipeline/surface.json` + `ARCHITECTURE.md` which still advertise a tRPC/`app-home` scaffold that was never built. The working `/habits`, `/habits/new`, `/about` routes, the REST API (`GET`/`POST /api/habits`, `GET /api/health`, `GET /api/health/deep`), and seed-on-boot behaviour are preserved as-is.

## Surface contract

**Routes (frontend, Angular router, base href `/e2e-lane-enterprise/`)**

| Path | Flow (`data.flow`) | Component | Auth |
| --- | --- | --- | --- |
| `''` | — | redirect → `/habits` | public |
| `/habits` | `habits-list` | `app-habits-list` | public |
| `/habits/new` | `habit-create` | `app-habit-new` | public |
| `/about` | `about` | `app-about` | public |
| `**` | — | wildcard → `/habits` | public |

Deleted routes: `/login`, `/signup`, `/admin/login`, `/admin/settings` — these must fall through the wildcard to `/habits`.

**Routes (backend, NestJS, all public)**

| Method | Path | Behaviour |
| --- | --- | --- |
| GET | `/api/health` | `200 {"status":"ok"}` |
| GET | `/api/health/deep` | `200 {"status":"ok","db":"ok"}`, or `503` when the DB is down (never 500) |
| GET | `/api/habits` | list of `Habit` |
| POST | `/api/habits` | body `{ name }`; trims; `400` on empty/whitespace; creates with `streak = 0`; `201` |

Deleted backend surface: `/api/users/*` (`UsersModule`, `users.controller.ts`, `users.service.ts`).

**Entities**
- `Habit` — `id`, `name`, `streak` (static stored integer, no check-in flow), `created_at`. Migration `20260722234442_init` already creates it; no new migration.
- `User` / `Role` — remain in `schema.prisma` but dormant. No code path may read them. No destructive migration.

**Components**: `app-root`, `app-nav`, `app-habits-list`, `app-habit-new`, `app-about`.

**Test ids** (source of truth for tester + `.pipeline/surface.json`): `app-ready`, `habits-main`, `habits-title`, `add-habit`, `add-habit-empty`, `habit-item-{id}`, `habit-name`, `habit-streak`, `habit-new-main`, `habit-name-input`, `habit-create`, `about-main`, `about-title`, `nav-habits`, `nav-about`.

**Fixed copy** (exact strings, asserted by acceptance gates):
- `<h1>My Habits</h1>` (`.colossus-acceptance.json` `expect_text: "my habits"`)
- subtitle `Keep the momentum — your best run is N days.` kept verbatim (`expect_text: "keep the momentum"`)
- exactly one control with the accessible name `Add Habit`; the empty-state link is reworded to `Add your first habit`
- `<label for="habit-name">Name</label>`, submit button `Create`
- `<h1>About Habit Tracker</h1>`

## db_agent tasks
- [ ] No schema change and no new migration. Confirm `backend/prisma/schema.prisma` still defines `Habit` (`id`, `name`, `streak`, `created_at`) matching `backend/src/habits/habit.entity.ts`, and that `20260722234442_init` is the current migration head.
- [ ] Leave the `User` / `Role` models in `schema.prisma` untouched and dormant — do NOT generate a drop migration (destructive, zero spec benefit). Note in the migration log that the tables are intentionally unreferenced.
- [ ] Rewrite `backend/prisma/seed/seed.js` to be habit-only and idempotent: delete `SEED_USERS`, `derivePassword`, and the `SEED_CRED` credential logging; insert `Drink water` (streak 5), `Read 20 minutes` (streak 2), `Morning walk` (streak 0) only when `await prisma.habit.count() === 0`, so `npx prisma db seed` stays production-runnable and never duplicates rows.
- [ ] Verify the seed list stays byte-identical to `HabitsService.SEED_HABITS` (the `onModuleInit` boot seed remains the primary path, running after `npx prisma migrate deploy` in `docker/supervisord.conf`) — the two must not diverge.

## backend_agent tasks
- [ ] Remove the `UsersModule` import statement and its entry in `@Module({ imports: [...] })` in `backend/src/app.module.ts`, leaving exactly `ConfigModule`, `PrismaModule`, `HealthModule`, `HabitsModule`.
- [ ] Delete `backend/src/users/` (`users.controller.ts`, `users.service.ts`, `users.module.ts`) — this removes the `/api/users` accounts surface the spec forbids.
- [ ] Leave `HabitsController` (`GET`/`POST /api/habits`) and `HealthController` (`/api/health`, `/api/health/deep`) unchanged, including the existing `400` rejection of empty/whitespace `name` and the `streak = 0` default; both health endpoints stay public.
- [ ] Confirm the backend compiles clean after the deletion: `npx prisma generate && npx tsc -p tsconfig.build.json` in `backend/`, with no unresolved import referencing the removed users module.

## ui_agent tasks
- [ ] `frontend/src/app/habits/habits-list/habits-list.component.html`: change `<h1>My Habit Tracker</h1>` → `<h1 data-testid="habits-title">My Habits</h1>`; keep the `page__sub` "Keep the momentum — your best run is N days." line verbatim.
- [ ] Same file: replace the header link with the single prominent control `<a class="btn btn--primary" data-testid="add-habit" routerLink="/habits/new">Add Habit</a>`, delete the entire `<a class="fab">` block, and reword the empty-state link to `Add your first habit` with `data-testid="add-habit-empty"` — exactly one element named "Add Habit" must exist in every list state (Playwright strict mode).
- [ ] Same file: add `data-testid="habit-name"` and `data-testid="habit-streak"` to the two spans inside each `<li>`, keeping the existing `[attr.data-testid]="'habit-item-' + habit.id"`.
- [ ] `frontend/src/app/habits/habits-list/habits-list.component.css`: delete the `.fab`, `.fab__label`, and `.add-btn--desktop` rules plus any media query hiding the add button on mobile; ensure the `.page__head` `.btn` is visible and prominent at all viewport widths.
- [ ] `frontend/src/app/habits/habit-new/habit-new.component.html`: add `data-testid="habit-name-input"` to `#habit-name` and `data-testid="habit-create"` to the `Create` submit button. Do not change the `Name` label text, the `required` attribute, or the `Create` button label.
- [ ] `frontend/src/app/about/about.component.html`: add `data-testid="about-title"` to the existing (already correct) `<h1>About Habit Tracker</h1>`.
- [ ] `frontend/src/app/shared/nav/nav.component.html`: delete the `@if (auth.isAdmin())` admin links in both the desktop `<nav>` and the mobile `.tabbar`, the `@if (auth.user(); as u)` user-name block, and the unconditional mobile "Sign out" `<button>`. Keep the brand plus the Habits/About links and add `data-testid="nav-habits"` / `data-testid="nav-about"`.
- [ ] `frontend/src/app/shared/nav/nav.component.ts`: drop the `AuthService` and `Router` injections and the `logout()` method, leaving only the `RouterLink` / `RouterLinkActive` imports. `frontend/src/app/shared/nav/nav.component.css`: remove the now-dead `.topbar__end`, `.topbar__user`, `.topbar__logout` rules.
- [ ] `frontend/src/app/app.routes.ts`: delete the `login`, `signup`, `admin/login`, `admin/settings` entries; keep the `'' → habits` redirect, `habits`, `habits/new`, `about`, and the `**` wildcard; attach `data: { flow: 'habits-list' | 'habit-create' | 'about' }` to the three navigable routes.
- [ ] Delete `frontend/src/app/auth/login/*`, `frontend/src/app/auth/signup/*`, `frontend/src/app/admin/admin-login/*`, `frontend/src/app/admin/admin-settings/*` (i.e. the whole `auth/` and `admin/` directories) and `frontend/src/app/core/auth.service.ts`.
- [ ] `frontend/src/app/core/models.ts`: reduce to the `Habit` interface only (`id`, `name`, `streak`, `created_at`); delete `UserRole`, `User`, `ServiceSetting`, `ServiceField`, whose only consumers were the deleted components.
- [ ] Verify the production build is clean: `npm ci && npx ng build --configuration production --base-href=/e2e-lane-enterprise/` in `frontend/` — this is what catches any missed `AuthService` / `ServiceSetting` reference.

## service_agent tasks
- [ ] No new client-side data layer. Confirm the existing habits HTTP client keeps its relative base (`api`) so `<base href="/e2e-lane-enterprise/">` resolves calls to `/e2e-lane-enterprise/api/habits` behind the ingress rather than a root-absolute 404.
- [ ] Remove any remaining client-side call site for the deleted `/api/users` surface and any `AuthService`-mediated interceptor or auth header, so no request path references accounts.
- [ ] Preserve `HabitsListComponent`'s existing fetch-error handling (renders the empty state on API failure) and `HabitNewComponent.create()`'s trim → block-empty → `POST /api/habits` → navigate-to-`/habits` sequence, unchanged.
- [ ] `.pipeline/surface.json`: replace `routes` with `GET /api/health`, `GET /api/health/deep`, `GET /api/habits`, `POST /api/habits`; replace `components` with `app-root`, `app-nav`, `app-habits-list`, `app-habit-new`, `app-about`; replace `testIds` with the fifteen ids listed in the Surface contract; drop the stale `GET /trpc/users.findAll` route and `app-home` component; keep `fileBudget` (400 soft / 500 hard).
- [ ] `ARCHITECTURE.md`: correct the stale tRPC / `src/trpc` / `home.component.ts` references to the actual REST + habits layout. Leave `.colossus-acceptance.json` untouched.

## tester tasks
- [ ] Seed: against an empty DB, boot the backend → `GET /api/habits` returns exactly 3 rows with the seeded name/streak pairs; restart → still exactly 3 (no duplicates).
- [ ] List happy path: `/habits` renders `<h1>My Habits</h1>`, one row per habit with visible name + streak, and exactly one element with the accessible name "Add Habit" — assert the strict-mode single match in both the populated and the empty state.
- [ ] Add happy path: click "Add Habit" → URL is `/habits/new`; fill `habit-name-input`, click `habit-create` → `POST /api/habits` returns 201, the router navigates to `/habits`, and the new row appears with streak 0.
- [ ] Add edge cases: empty and whitespace-only names → no navigation, inline error shown, and the API rejects with `400`.
- [ ] About: `/about` shows `<h1>About Habit Tracker</h1>` carrying `data-testid="about-title"`.
- [ ] No-auth regression: `/habits`, `/habits/new`, `/about` all load with no session and no storage; `/login`, `/signup`, `/admin/login`, `/admin/settings` fall through the wildcard to `/habits`; no "Sign out" control, admin link, or user name appears in the nav at any viewport width.
- [ ] Deep links behind the ingress: load `https://<host>/e2e-lane-enterprise/habits` and `/about` directly — nginx `try_files … /index.html` serves the SPA and the relative API base resolves to `/e2e-lane-enterprise/api/habits` (200, not 404).
- [ ] Health: `GET /api/health` → `200 {"status":"ok"}`; `GET /api/health/deep` → `200 {"status":"ok","db":"ok"}`, and `503` (never 500) with the DB down.
- [ ] Render gate: `data-testid="app-ready"` is present and page text contains both "my habits" and "keep the momentum".

## Open questions
- **Pipeline `auth_model` is `full_auth`, but the approved spec mandates no authentication.** The spec's explicit "No authentication" scenario is the source of truth and the bulk of this change set is the *removal* of the auth/admin surface, so no `/login`, `/signup`, `/admin/login` screens, no route guards, and no `role UserRole @default(USER)` work are scheduled above. Regenerating the full_auth baseline would undo the spec. The `auth_model` input should be flipped to none/public for this project, or the conflict resolved by a human before the next run.
- **`spec_deployments` lists `postgresql, minio`, which would normally require a `SystemSetting` model plus an `/admin/settings` page — but the spec deletes `/admin/settings` outright.** No admin-settings tasks are scheduled. Postgres is consumed via `DATABASE_URL` from the `app-secrets` secretRef; minio is not referenced anywhere in the spec's scope. Confirm whether minio is actually needed or is a stale deployment declaration.
- **`spec_integrations` contains a single malformed entry** — `"None. No third-party APIs, SDKs, or external services."` with derived env key `NONE_NO_THIRD_PARTY_APIS_SDKS_OR_EXTERNAL_SERVICES_API_KEY`. That is the spec's literal "no integrations" sentence parsed as an integration name. No `lib/integrations/*` client, `resolveConfig`, or `ServiceUnconfiguredError` is scheduled; the upstream parser should be fixed.
- **Superseded verify_ledger findings.** a1-8, a1-9, a3-9 and the a2-*/a4-* Express checks assert `src/server.js`, `CMD ["node","src/server.js"]`, and "no `loadComponent`" — artifacts of an Express/EJS/SQLite plan that was never built. They must be closed as invalid against the deployed Angular/NestJS stack, not implemented. Needs an explicit decision on who closes them.
- **`.pipeline/approved_landmarks.json` will contain unreachable entries** after this change: the headings "Welcome back", "Create your account", "Administrator sign in", "Admin · Service Settings", plus the `admin-settings-main` and `service-` test ids. Deliberate per spec — confirm the landmark checker is updated so these do not fail the gate.
- **`DATABASE_URL` is `optional: true` in `k8s/deployment.yaml`.** If `app-secrets` is missing, `prisma migrate deploy` loops and `/api/habits` 502s while the render gate still passes (the list falls back to the empty state). Someone must verify the secret exists before treating a green gate as a green deploy.
- **Streak has no update path.** The spec defines no check-in flow, so `streak` is a static stored integer set at creation (0) or by the seed. Confirm this is intended rather than a deferred feature.

Total tasks: 30
