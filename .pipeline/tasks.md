# Pipeline Task Decomposition

## Summary
A server-rendered Node.js + Express habit tracker (EJS views, SQLite storage) that replaces the placeholder nginx image. It serves `/habits`, `/habits/new`, and `/about` on port 8080 under the `/e2e-lane-enterprise` base path, with seed-on-start data (3 example habits) so the list is never empty. All rendered links/forms/assets are prefixed via a `BASE_PATH` env var. Health endpoints (`/api/health`, `/api/health/deep`) support pipeline smoke tests. Per pipeline auth policy the app also carries a User/role model, admin route group, and admin settings backed by the provisioned `postgresql` and `minio` services.

## Surface contract
Routes (root-relative; ingress strips the `/e2e-lane-enterprise` prefix, views prefix all links via `url()`):
- `GET /` → 302 redirect to `url('/habits')`
- `GET /habits` → render habit list ("My Habits", rows of name + streak, "Add Habit" button)
- `GET /habits/new` → render create form (Name field + Create button)
- `POST /habits` → validate non-empty name, insert habit, 302 back to `url('/habits')`
- `GET /about` → static "About Habit Tracker" page
- `GET /api/health` → `200 {status:'ok'}`
- `GET /api/health/deep` → `200 {status:'ok',db:'ok'}` or `503`
- `POST /login`, `POST /signup`, `POST /logout` → user auth flows (full_auth policy)
- `GET/POST /admin/login` → admin login
- `(admin)` route group (guarded): `GET /admin`, `GET /admin/settings`
- `GET /api/admin/settings` (list masked service keys + configured status), `PATCH /api/admin/settings` (upsert, admin only)

Screens: `/habits` (list), `/habits/new` (form), `/about`, `/login`, `/signup`, `/admin/login`, `/admin/settings`.

Entities: `Habit` (id, name, streak, created_at); `User` (id, email, passwordHash, role); `SystemSetting` (key, value, updatedAt).

## db_agent tasks
- [ ] Initialize SQLite at `process.env.DB_PATH || './data/habits.db'` in `src/db.js`, creating the parent dir if missing.
- [ ] Create the `habits` table: `id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, streak INTEGER NOT NULL DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))`.
- [ ] Seed 3 example habits when the table is empty: "Drink water" (streak 5), "Read 20 minutes" (streak 2), "Morning walk" (streak 0).
- [ ] Export `listHabits()`, `addHabit(name)`, and `ping()` (trivial `SELECT 1`) helpers from `src/db.js`.
- [ ] Add a `User` model/table with a `role` field using `enum UserRole { ADMIN USER }` and `role @default(USER)` (full_auth policy); include `email` (unique) and `passwordHash`.
- [ ] Add a `SystemSetting` model/table: `key String @id`, `value String`, `updatedAt DateTime @updatedAt` (required by admin settings for provisioned `postgresql`/`minio` services).

## backend_agent tasks
- [ ] Build the Express app in `src/server.js`: set EJS view engine + `views/` dir, mount `express.static('public')`, add `express.urlencoded({ extended: false })`, listen on `0.0.0.0:8080`.
- [ ] Add `const BASE = process.env.BASE_PATH || '/e2e-lane-enterprise'` and expose `res.locals.url = p => BASE + p` for all views (links/forms/assets, e.g. `url('/static/styles.css')`).
- [ ] Implement routes: `GET /` → redirect to `url('/habits')`; `GET /habits` → render with `listHabits()`; `GET /habits/new` → render `new`; `POST /habits` → validate non-empty name, `addHabit(name)`, redirect to `url('/habits')`; `GET /about` → render `about`.
- [ ] Implement health endpoints: `GET /api/health` → `200 {status:'ok'}`; `GET /api/health/deep` → run `db.ping()`, return `200 {status:'ok',db:'ok'}` or `503` on failure. Keep public.
- [ ] Add admin guard middleware and a protected `(admin)` route group; admin can always log in at `/admin/login` (full_auth policy).
- [ ] Add user auth flows (login, signup, logout); first user created via signup gets `ADMIN` role, subsequent users get `USER`; admin section access gated by role check in the `(admin)` group.
- [ ] Add `lib/config.ts` with `resolveConfig(key)`: reads `process.env[key]` first; if value equals `PLACEHOLDER_CONFIGURE_IN_SETTINGS` or is absent, reads from the `SystemSetting` DB row; returns null if neither is set.
- [ ] Add `GET /api/admin/settings` (list `postgresql` + `minio` service keys with masked values + configured status) and `PATCH /api/admin/settings` (upsert key-value pairs, admin role required).

## ui_agent tasks
- [ ] Create `views/layout.ejs`: `<!doctype html>`, `<meta name="viewport">`, `<link rel="stylesheet" href="<%= url('/static/styles.css') %>">`, a nav linking Habits / About via `url()`, and a page-content yield block.
- [ ] Create `views/habits.ejs`: `<h1>My Habits</h1>`, one row per habit showing `habit.name` and a streak counter (e.g. "🔥 <%= habit.streak %> day streak"), and a prominent `<a class="btn" href="<%= url('/habits/new') %>">Add Habit</a>`.
- [ ] Create `views/new.ejs`: `<form method="post" action="<%= url('/habits') %>">` with a labeled required "Name" input (`name="name"`) and a `<button>Create</button>`.
- [ ] Create `views/about.ejs`: `<h1>About Habit Tracker</h1>` plus a short static description.
- [ ] Create `public/styles.css`: system-font, centered max-width container, styled habit rows, prominent `.btn`, clean form layout.
- [ ] Generate `/login` and `/signup` screens as part of the main app, and an `/admin/login` screen; show an admin nav entry only to admins (full_auth policy).
- [ ] Generate the `/admin/settings` page listing each service in `postgresql`, `minio` with a configured/unconfigured badge and a per-service credential form. (No third-party integrations are declared, so no integration credential fields are needed.)

## service_agent tasks
- [ ] Confirm views consume backend-provided data via `res.locals` (server-rendered) — verify `listHabits()` output shape maps to `views/habits.ejs` rows (name + streak).
- [ ] Verify the create flow wiring: `views/new.ejs` form action `url('/habits')` → `POST /habits` handler → redirect back to `url('/habits')` with the new row visible.
- [ ] Ensure all client-facing links/forms/assets resolve through the `url()` helper (no hard-coded root-relative URLs) so they work behind the `/e2e-lane-enterprise` prefix.
- [ ] Wire the `/admin/settings` page forms to `GET`/`PATCH /api/admin/settings` (fetch current masked values + submit upserts).

## tester tasks
- [ ] Seed: start with empty/removed db → `GET /habits` shows exactly 3 seeded habits with names + streaks.
- [ ] List: `/habits` renders "My Habits" heading, one row per habit, and the "Add Habit" button.
- [ ] Add flow: `GET /habits/new` shows Name field + Create button; POST a name → 302 back to `/habits`; new habit appears with streak 0.
- [ ] About: `/about` shows the "About Habit Tracker" heading.
- [ ] Base path: hit `https://ubuntu.desmana-truck.ts.net/e2e-lane-enterprise/habits`; confirm nav links, "Add Habit", form action, and CSS all resolve under the prefix (no 404s).
- [ ] Health: `GET /api/health` → 200; `GET /api/health/deep` → 200 with `db:'ok'`.
- [ ] Container: `docker build` succeeds; container listens on 8080 and serves `/habits`.
- [ ] Auth: signup first user → ADMIN; second user → USER; `/admin` and `/admin/settings` reachable only by admin; `/admin/login` works.
- [ ] Admin settings: `/admin/settings` lists `postgresql` and `minio` with configured/unconfigured badges; `PATCH /api/admin/settings` upserts values (admin only) and `resolveConfig` reflects them.

## Open questions
- The spec explicitly declares "No authentication," but pipeline policy (`<auth_model>full_auth</auth_model>`) mandates User/role tables, login/signup/logout, and an admin group. Downstream agents must reconcile this: keep the public habit routes unauthenticated while layering the mandated auth surface, or confirm whether auth should be suppressed for this app.
- The spec declares no backing services and "No external network services," but `<spec_deployments>` lists `postgresql` and `minio`. Clarify whether these are actually used (e.g., migrate SQLite → Postgres, MinIO for storage) or are provisioned-but-unused; current tasks only expose them via admin settings.
- `<spec_integrations>` contains a "None" placeholder (env key `NONE_..._API_KEY`); treated as no real integrations, so no integration client modules were created. Confirm this is correct.
- Container base image: alpine (`node:20-alpine` + `python3 make g++`) vs `node:20-slim` for the `better-sqlite3` native build — pick one and verify the build in CI.
