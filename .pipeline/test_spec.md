# Test Specification

> **⚠️ Surface warning — `surface.json` is a stale scaffold placeholder.**
> `.pipeline/surface.json` was auto-generated (`"_generated": true`) and lists an
> Angular / tRPC surface (`GET /health`, `GET /trpc/users.findAll`,
> `GET /trpc/users.findById`) that does **not** match this spec. Those routes do not
> exist in the habit-tracker application and are **not** under test. The API surface
> below is instead derived from the approved spec + `tasks.md` surface contract.
>
> **⚠️ Auth surface is contested and treated as out of scope.** The spec explicitly
> declares "No authentication," while pipeline policy (`full_auth`) asks for a
> User/role model, login/signup/logout, an admin group, and `/api/admin/settings`.
> This conflict is an unresolved open question in `tasks.md`. Until reconciled, the
> auth/admin surface is listed under **Out of scope** and no auth cases are asserted.

## Coverage summary
- Total cases: 34
- API endpoints covered: 7 / 7 (spec-derived surface; `surface.json`'s 3 stale routes excluded)
- User journeys covered: 5

## API tests

Routes are root-relative (ingress strips the `/e2e-lane-enterprise` prefix). Tests
exercise handlers at their root-relative paths; base-path resolution of rendered
links/assets is covered separately under **UI / journey tests → Base-path resolution**.

### `GET /`
- **Happy path**: request `/` → **302** redirect; `Location` header equals `${BASE_PATH}/habits` (default `/e2e-lane-enterprise/habits`; when `BASE_PATH=""`, `Location` is `/habits`).
- **Validation failures**: n/a (no input).
- **Auth failures**: none — route is public, reachable with no cookie/session.
- **Idempotency / edge cases**: repeated GETs always 302 to the same location; no body content required.

### `GET /habits`
- **Happy path**: on a freshly seeded DB → **200**, `Content-Type: text/html`. Body contains `<h1>My Habits</h1>`, exactly 3 habit rows ("Drink water" / "🔥 5", "Read 20 minutes" / "🔥 2", "Morning walk" / "🔥 0"), and an "Add Habit" link/button pointing to `${BASE_PATH}/habits/new`.
- **Validation failures**: n/a (no input).
- **Auth failures**: none — public route, no login required.
- **Idempotency / edge cases**: after N habits added, response shows `3 + N` rows; renders without error when only seeded rows exist. Streak values render as integers.

### `GET /habits/new`
- **Happy path**: request → **200**, HTML contains a `<form method="post" action="${BASE_PATH}/habits">` with a labeled required text input `name="name"` and a `<button>Create</button>`.
- **Validation failures**: n/a (no input).
- **Auth failures**: none — public route.
- **Idempotency / edge cases**: GET does not mutate state (habit count unchanged before/after).

### `POST /habits`
- **Happy path**: form-encoded body `name=Meditate` → **302**, `Location` = `${BASE_PATH}/habits`; a subsequent `GET /habits` shows a new "Meditate" row with streak **0**.
- **Validation failures**:
  - Empty name (`name=`) → non-2xx / no insert; DB habit count unchanged (expected 4xx or re-render of the form, per handler). New row must NOT be created.
  - Whitespace-only name (`name=%20%20`) → treated as empty; no insert.
  - Missing `name` field entirely → no insert; habit count unchanged.
- **Auth failures**: none — public route, accepts POST with no session.
- **Idempotency / edge cases**: posting the same name twice creates two distinct rows (no uniqueness constraint on `name`); leading/trailing spaces on an otherwise valid name are stored trimmed or as-provided but a row IS created; unusually long name does not 500.

### `GET /about`
- **Happy path**: request → **200**, HTML contains `<h1>About Habit Tracker</h1>` and a short static description.
- **Validation failures**: n/a.
- **Auth failures**: none — public route.
- **Idempotency / edge cases**: purely static; identical output across requests.

### `GET /api/health`
- **Happy path**: request → **200**, JSON body exactly `{"status":"ok"}`, `Content-Type: application/json`.
- **Validation failures**: n/a.
- **Auth failures**: none — kept public for smoke tests.
- **Idempotency / edge cases**: does not touch the DB; returns 200 even if the DB is degraded.

### `GET /api/health/deep`
- **Happy path**: with a reachable DB (`db.ping()` / `SELECT 1` succeeds) → **200**, JSON `{"status":"ok","db":"ok"}`.
- **Validation failures**: n/a.
- **Auth failures**: none — public.
- **Idempotency / edge cases**: when `db.ping()` throws/fails → **503** (body indicates db not ok, e.g. `db:'error'`/`'down'`); response never 500s on a DB failure.

## UI / journey tests

### Journey: View seeded habit list
- **Steps**: navigate to `${BASE_PATH}/habits` against a fresh container (empty/removed DB, so seed-on-start runs).
- **Expected outcomes**: page shows heading "My Habits"; exactly 3 seeded rows visible — "Drink water" with streak 5, "Read 20 minutes" with streak 2, "Morning walk" with streak 0; a prominent "Add Habit" control is visible and links to `${BASE_PATH}/habits/new`.
- **Negative path**: list is never empty — even with no user-added habits, the 3 seeds appear (seed-on-start guarantee).

### Journey: Add a new habit
- **Steps**: from `/habits` click "Add Habit" → land on `/habits/new`; type "Evening stretch" into the Name field; click "Create".
- **Expected outcomes**: browser is redirected (302) back to `${BASE_PATH}/habits`; the list now includes an "Evening stretch" row showing streak 0; total rows = previous count + 1.
- **Negative path**: submitting the form with an empty Name does not create a habit — user stays on the form (HTML5 `required` blocks submit) or is returned an error/re-render; the habit list count is unchanged.

### Journey: About page
- **Steps**: from any page, use the nav link "About" → land on `/about`.
- **Expected outcomes**: heading "About Habit Tracker" plus a short description is visible; nav remains present.
- **Negative path**: n/a (static page).

### Journey: Navigation between pages
- **Steps**: starting at `/habits`, click nav links Habits ↔ About; use "Add Habit" to reach the form and browser back to return.
- **Expected outcomes**: every nav link, the "Add Habit" button, and the form `action` resolve to real, addressable URLs under `${BASE_PATH}`; each navigation loads a **200** page (no client-side routing required — each route is a real URL).
- **Negative path**: no link resolves to a bare root-relative path that would 404 behind the ingress prefix.

### Journey: Base-path resolution (behind ingress)
- **Steps**: request `https://ubuntu.desmana-truck.ts.net/e2e-lane-enterprise/habits`; inspect rendered HTML for nav hrefs, the "Add Habit" href, the create-form `action`, and the stylesheet `<link href>`.
- **Expected outcomes**: all of the above are prefixed with `/e2e-lane-enterprise` (via the `url()` helper) — nav → `/e2e-lane-enterprise/habits` & `/e2e-lane-enterprise/about`, Add Habit → `/e2e-lane-enterprise/habits/new`, form action → `/e2e-lane-enterprise/habits`, stylesheet → `/e2e-lane-enterprise/static/styles.css`; each resolves to a **200** (CSS served with a CSS content-type), **no 404s**.
- **Negative path**: any hard-coded root-relative URL (bypassing `url()`) is a failure — asset/link returns 404 behind the prefix. Also verify empty `BASE_PATH` (local dev) yields root-relative links that still resolve (`/habits`, `/static/styles.css`).

## Data integrity tests
- After seed-on-start on an empty DB, `SELECT COUNT(*) FROM habits` = **3** with the exact seeded (name, streak) pairs; seeding runs only when the table is empty (restart with existing rows must not duplicate seeds).
- The `habits` table schema holds: `id` autoincrement PK, `name TEXT NOT NULL`, `streak INTEGER NOT NULL DEFAULT 0`, `created_at` defaulting to `datetime('now')`.
- A successful `POST /habits` inserts exactly one row with the submitted `name` and `streak = 0` (default); `id` and `created_at` populated automatically.
- A rejected `POST /habits` (empty/whitespace/missing name) inserts **zero** rows — count before == count after.
- Data is ephemeral (no PVC): after a container restart the DB resets to the 3 seeds and user-added rows are gone — this is expected, not a defect.
- `db.ping()` executes `SELECT 1` without side effects (row count unchanged before/after a deep health check).

## Out of scope
- **Stale `surface.json` routes** (`GET /health`, `GET /trpc/users.findAll`, `GET /trpc/users.findById`): belong to an unrelated auto-generated scaffold; not part of this app.
- **Authentication & authorization** (login/signup/logout, sessions, cookies, admin guard): the spec explicitly declares "No authentication"; the pipeline `full_auth` policy in `tasks.md` conflicts with the spec and is an unresolved open question. No auth behaviour is asserted until reconciled.
- **Admin surface** (`/admin`, `/admin/login`, `/admin/settings`, `GET`/`PATCH /api/admin/settings`, `resolveConfig`, `SystemSetting`/`User` tables): mandated by policy but contested and absent from the approved spec's file/route list; excluded pending reconciliation.
- **`postgresql` / `minio` services**: spec declares "No external network services"; provisioned-but-unused per the open question — no integration tests.
- **Check-in / streak-increment flow**: no check-in behaviour is specified; `streak` is a static stored integer (seeded samples). The create form collects only "Name".
- **Container build specifics** (`docker build` success, `better-sqlite3` native toolchain, alpine vs slim base): a build/CI concern rather than an application behavioural test; verified by the build stage, not asserted here beyond "container listens on 8080 and serves `/habits`".
- **Deployment concerns** (Recreate-strategy downtime, single-replica availability): infrastructure, not application behaviour.

Wrote .pipeline/test_spec.md (34 cases across 7 endpoints / 5 journeys).
