# Test Specification

> **WARNING — `.pipeline/surface.json` is stale at the time of writing.** It advertises `GET /health`,
> `GET /trpc/users.findAll`, `GET /trpc/users.findById` and an `app-home` component that were never
> built. Spec Step 9 replaces that file with the real REST contract. This test spec is written against
> the **post-Step-9 surface** (`GET /api/health`, `GET /api/health/deep`, `GET /api/habits`,
> `POST /api/habits`), derived from `backend/src/habits/habits.controller.ts`,
> `backend/src/health/health.controller.ts` and `frontend/src/app/app.routes.ts`. The three stale
> routes are still covered — as **absence** checks (§ API tests → Removed surface), which double as the
> regression test that Step 9 actually landed.
>
> **NOTE — this file replaces a prior revision written against a superseded Express/EJS/SQLite plan.**
> That stack was never built; the deployed stack is Angular 19 (nginx :8080) + NestJS (:3000, proxied
> at `/api/`) + Prisma/Postgres.
>
> All UI paths assume base href `/e2e-lane-enterprise/` behind the ingress. API tests may be run
> directly against the backend on `:3000`; paths below are the `/api/…`-prefixed public form.

## Coverage summary
- Total cases: 67
- API endpoints covered: 4 / 4 live endpoints in the corrected surface contract (plus 5 absence checks covering the 3 stale `surface.json` routes and the deleted `/api/users` surface)
- User journeys covered: 8

---

## API tests

### `GET /api/health`
- **Happy path**: no body, no headers → `200`, `content-type: application/json`, body exactly `{"status":"ok"}`.
  - `HL-01` — status is `200` and body deep-equals `{"status":"ok"}` (no extra keys such as `db`, `uptime`, `version`).
- **Validation failures**: n/a — endpoint takes no input.
- **Auth failures**: none expected — endpoint is public.
  - `HL-02` — request sent with **no** `Authorization`, `Cookie`, or session header → still `200`. Never `401`/`403`.
- **Idempotency / edge cases**:
  - `HL-03` — with Postgres stopped (`DATABASE_URL` unreachable), `GET /api/health` still returns `200 {"status":"ok"}`. The shallow check must not touch the DB, so a DB outage must not take the liveness probe down.

### `GET /api/health/deep`
- **Happy path**: DB reachable → `200`, body deep-equals `{"status":"ok","db":"ok"}`.
  - `DP-01` — status `200`; both `status` and `db` are the literal string `"ok"`.
- **Validation failures**: n/a — endpoint takes no input.
- **Auth failures**: none expected — endpoint is public.
  - `DP-02` — request with no credentials → `200` (not `401`/`403`).
- **Idempotency / edge cases**:
  - `DP-03` — with Postgres stopped mid-run, the response status is exactly `503` and the body has `status: "error"`, `db: "down"`. Assert the status is **not** `500` — an unhandled Prisma throw surfacing as `500` is a failure of this case. After Postgres is restarted, a subsequent call returns to `200 {"status":"ok","db":"ok"}` with no process restart.

### `GET /api/habits`
- **Happy path**: freshly booted backend against a migrated DB → `200`, JSON array of exactly the 3 seeded habits.
  - `GH-01` — `200`; array length `3`; the `(name, streak)` pairs are exactly `("Drink water", 5)`, `("Read 20 minutes", 2)`, `("Morning walk", 0)` — compared as a set, ordering asserted separately in `GH-02`.
  - `GH-02` — ordering is **newest first** (`createdAt` descending). Create a habit `"Ordering probe"` via `POST /api/habits`, then re-`GET`: the new habit is at index `0`, ahead of all three seeds.
  - `GH-03` — element shape: every object has exactly the keys `id` (non-empty string), `name` (string), `streak` (integer ≥ 0), `created_at` (string parseable by `Date.parse`, ISO-8601 with `Z`). Assert **no** `userId`, `user`, `role`, `password`, or camelCase `createdAt` key appears on any element — the wire shape is snake_case `created_at` only, and no account data may leak.
- **Validation failures**: n/a — endpoint takes no input. Unknown query params (e.g. `?limit=1`) are ignored, not rejected: `200` with the full list.
- **Auth failures**: none expected — endpoint is public.
  - `GH-04` — request with no `Authorization` header and an empty cookie jar → `200`. Never `401`/`403`.
- **Idempotency / edge cases**:
  - `GH-05` — against a migrated but **empty** `Habit` table (boot seed suppressed), returns `200` with body `[]`, not `404` and not `500`.

### `POST /api/habits`
- **Happy path**: body `{"name":"Meditate for 10 minutes"}`, `content-type: application/json`.
  - `PH-01` — `201`; body has `name: "Meditate for 10 minutes"`, `streak: 0` (spec: streak is a static stored integer, no check-in flow), a non-empty `id` not equal to any existing habit `id`, and a `created_at` ISO timestamp within 60s of now.
  - `PH-02` — body `{"name":"  Yoga  "}` → `201` with `name` exactly `"Yoga"` (leading/trailing whitespace trimmed server-side by `HabitsController.create`). Internal whitespace is preserved: `{"name":"Read 20  minutes"}` → `name` is `"Read 20  minutes"` verbatim.
  - `PH-03` — persistence: after `PH-01`, a follow-up `GET /api/habits` contains the created habit with the same `id`, `name`, and `streak: 0`, and the array length increased by exactly 1.
- **Validation failures** (all expect HTTP `400` with a JSON error body, and **no** row created — verified by comparing `GET /api/habits` length before and after):
  - `PH-04` — `{"name":""}` → `400`, message `"Habit name is required."`.
  - `PH-05` — `{"name":"   "}` (whitespace-only; also `"\t\n"`) → `400`. This is the trim-then-reject path.
  - `PH-06` — `{}` (name absent) → `400`.
  - `PH-07` — `{"name":123}` and `{"name":null}` (non-string) → `400`, not `500`.
- **Idempotency / edge cases**:
  - `PH-08` — **not idempotent by design**: POSTing `{"name":"Drink water"}` (a name that already exists) returns `201` and creates a *second* row. `GET /api/habits` then contains two entries named `"Drink water"` with distinct `id`s. There is no unique constraint on `name`; a `409` here would be a regression.
  - `PH-09` — client-supplied extra fields are ignored, not honoured: `{"name":"Injected","streak":99,"id":"forced-id","created_at":"1999-01-01T00:00:00.000Z"}` → `201` with `streak: 0`, a server-generated `id` ≠ `"forced-id"`, and a `created_at` of now. Mass-assignment of `streak` must not be possible.
  - `PH-10` — a 200-character name and a name containing Unicode/emoji (`"Läuf 5km 🏃"`) are both accepted → `201` with the name round-tripped byte-identically through a subsequent `GET`.

### Removed surface (regression — these must NOT exist)
Covers the 3 stale `surface.json` routes plus the `/api/users` surface the spec forbids. Every case
asserts the response is `404` (or `501`), and specifically **not** `200` and not `401`/`403` — a
`401` would prove the handler still exists behind a guard rather than having been deleted.
- `RM-01` — `GET /api/users` → `404`.
- `RM-02` — `GET /api/users/1` and `POST /api/users` → `404`.
- `RM-03` — `GET /trpc/users.findAll` → `404` (stale `surface.json` entry; never implemented).
- `RM-04` — `GET /trpc/users.findById` → `404` (stale `surface.json` entry; never implemented).
- `RM-05` — `GET /health` **without** the `/api` prefix → `404`. All REST routes are mounted under `/api` by `main.ts`; the unprefixed path in the stale `surface.json` must not resolve.

---

## UI / journey tests

Unless stated otherwise: start from a clean browser context (no cookies, no `localStorage`, no
`sessionStorage`), DB in the seeded 3-habit state, and wait for `[data-testid="app-ready"]` before
asserting.

### Journey: View the habit list
- **Steps**: navigate to `/habits`.
- **Expected outcomes**:
  - `J1-01` — `[data-testid="habits-main"]` is visible and `[data-testid="habits-title"]` has text exactly `My Habits`. Assert the old string `My Habit Tracker` appears **nowhere** on the page (this is the acceptance gate that fails today).
  - `J1-02` — the subtitle is visible with text `Keep the momentum — your best run is 5 days.` (em dash U+2014; `5` = max streak of the seeds). Required verbatim by `.colossus-acceptance.json` `expect_text: "keep the momentum"`.
  - `J1-03` — exactly 3 `[data-testid^="habit-item-"]` rows, one per seeded habit, each `data-testid` suffixed with that habit's `id` from `GET /api/habits`.
  - `J1-04` — within each row, `[data-testid="habit-name"]` shows the habit name and `[data-testid="habit-streak"]` shows the streak count. For the seeds the visible pairs are `Drink water` / `5`, `Read 20 minutes` / `2`, `Morning walk` / `0`. A zero streak still renders a visible `0` — the row must not hide or blank it.
  - `J1-05` — **strict-mode singleton**: `getByRole('link', { name: 'Add Habit', exact: true })` resolves to exactly **1** element, visible and enabled, and `page.getByText('Add Habit', { exact: true })` also has count `1`. The floating action button (`.fab`) and any `+ New Habit` text are absent from the DOM.
  - `J1-06` — the single Add control is visible at **both** a mobile viewport (375×667) and a desktop viewport (1440×900) — no media query may hide it. Assert `isVisible()` and a non-zero bounding box at each width.
- **Negative path**: with `GET /api/habits` stubbed to `500`, the page still renders `[data-testid="habits-title"]` (`My Habits`) and the subtitle (`your best run is 0 days.`), falls back to the empty state, and shows no unhandled-error overlay or blank shell. Reviewer note: this silent fallback is the risk the spec flags — a green render gate here does **not** imply a healthy API, which is why `GH-01` must be run independently.

### Journey: Add a habit (happy path)
- **Steps**: from `/habits`, click `[data-testid="add-habit"]` → type `Evening stretch` into `[data-testid="habit-name-input"]` → click `[data-testid="habit-create"]`.
- **Expected outcomes**:
  - `J2-01` — after the click, the URL path is `/habits/new` and `[data-testid="habit-new-main"]` is visible with `<h1>Add a habit</h1>`.
  - `J2-02` — the form shows a `<label for="habit-name">` with text `Name` bound to the input, the input carries `required`, and the submit button's text is exactly `Create`.
  - `J2-03` — on submit, a `POST /api/habits` request is issued with body `{"name":"Evening stretch"}` and returns `201`.
  - `J2-04` — the router navigates to `/habits` (URL path is `/habits`, not `/habits/new`) and `[data-testid="habits-title"]` is visible again.
  - `J2-05` — the list now has 4 rows; `Evening stretch` is present at **index 0** (newest first) with a visible streak of `0`. A full page reload keeps it there (persisted server-side, not client state).
- **Negative path**: with `POST /api/habits` stubbed to `500`, the URL stays `/habits/new`, an inline `role="alert"` error reading `Could not create habit. Please try again.` is visible, the typed name is retained in the input, and no row is added to the list.

### Journey: Add a habit (client-side validation)
- **Steps**: navigate to `/habits/new`, then submit under each invalid condition below.
- **Expected outcomes**:
  - `J3-01` — click `[data-testid="habit-create"]` with the input untouched/empty → URL stays `/habits/new`, an inline `role="alert"` shows `Please enter a habit name.`, and **no** `POST /api/habits` request is sent (assert via network interception — the client blocks before the call).
  - `J3-02` — type `"   "` (spaces only) then submit → same as `J3-01`: no navigation, inline error, no network request. This is the trim-then-block path in `HabitNewComponent.create()`.
  - `J3-03` — after a blocked submit, typing a valid name and re-submitting succeeds: `POST` fires once, `201`, navigation to `/habits`. Assert the `POST` count is exactly 1 (the blocked attempts left no queued request), and that a rapid double-click on `Create` also produces exactly 1 `POST` (the `submitting` guard).
- **Negative path**: covered above — the API-side mirror of these cases is `PH-04`/`PH-05` (server returns `400` if a client ever bypasses the guard).

### Journey: Empty state
- **Steps**: with the `Habit` table emptied and boot-seeding suppressed (or `GET /api/habits` stubbed to `[]`), navigate to `/habits`.
- **Expected outcomes**:
  - `J4-01` — the empty-state block is visible with the copy `No habits yet.` and a link whose accessible name is exactly `Add your first habit`, carrying `[data-testid="add-habit-empty"]`.
  - `J4-02` — **strict-mode singleton in the empty state too**: `getByRole('link', { name: 'Add Habit', exact: true })` resolves to exactly 1 element (the header control). `Add your first habit` must not collide with it under exact-name matching; the total count of elements whose accessible name is exactly `Add Habit` across the page is 1.
  - `J4-03` — clicking `[data-testid="add-habit-empty"]` navigates to `/habits/new`. The heading (`My Habits`) and the subtitle (`your best run is 0 days.`) still render in the empty state, so the acceptance text gate passes with zero habits.
- **Negative path**: no `[data-testid^="habit-item-"]` element exists, and no skeleton/loading row is left stranded in the DOM.

### Journey: About page
- **Steps**: navigate to `/about` (directly, and via the nav link from `/habits`).
- **Expected outcomes**:
  - `J5-01` — `[data-testid="about-main"]` is visible and `[data-testid="about-title"]` is an `<h1>` with text exactly `About Habit Tracker` (matches `approved_landmarks.headings`).
  - `J5-02` — the descriptive body copy and the `Track` / `Add` / `Stay` fact list render.
  - `J5-03` — reaching `/about` via `[data-testid="nav-about"]` from `/habits` yields the same page and the URL path is `/about`.
- **Negative path**: n/a — static page, no data dependency. It must render identically with the backend fully down.

### Journey: Navigation chrome (auth affordances removed)
- **Steps**: on each of `/habits`, `/habits/new`, `/about`, inspect the nav at 375×667 (mobile tabbar) and 1440×900 (desktop topbar).
- **Expected outcomes**:
  - `J6-01` — the brand `Habit Tracker` plus exactly two primary links are present: `[data-testid="nav-habits"]` (`Habits`) and `[data-testid="nav-about"]` (`About`).
  - `J6-02` — **no** element anywhere in the page with the text `Sign out` (case-insensitive), at either viewport. A visitor with no account must never see a sign-out affordance.
  - `J6-03` — **no** `Admin` link and no `href`/`routerLink` targeting `/admin/settings` or `/admin/login` in the rendered DOM, at either viewport.
  - `J6-04` — no user-name chip: no `.topbar__user`, `.topbar__logout`, or `.topbar__end` element in the DOM.
  - `J6-05` — `routerLinkActive` still works: on `/habits` the Habits link carries `is-active` and the About link does not; on `/about` the inverse.
  - `J6-06` — the nav renders with `localStorage` and `sessionStorage` empty and no cookies set — i.e. nothing in the nav reads a session. Assert no `AuthService`-shaped request (`/api/users`, `/api/auth/*`, `/api/me`) is issued on any of the three pages.
- **Negative path**: n/a.

### Journey: No-authentication routing
- **Steps**: from a clean context with no storage, navigate directly to each URL below.
- **Expected outcomes**:
  - `J7-01` — `/habits`, `/habits/new`, `/about` each load their own page with no redirect to a login screen and no `401`/`403` on any XHR.
  - `J7-02` — `/login` falls through the `**` wildcard: final URL path is `/habits` and `[data-testid="habits-title"]` (`My Habits`) is visible. No login form, no `Welcome back` heading.
  - `J7-03` — `/signup` → same wildcard fallthrough to `/habits`. No `Create your account` heading.
  - `J7-04` — `/admin/login` → `/habits`. No `Administrator sign in` heading.
  - `J7-05` — `/admin/settings` → `/habits`. No `Admin · Service Settings` heading, and no `[data-testid="admin-settings-main"]` or `[data-testid^="service-"]` element. (These `approved_landmarks.json` entries are deliberately unreachable per spec — this case asserts their *absence*, so the landmark checker must be updated accordingly.)
  - `J7-06` — the root path `/` redirects to `/habits`, and an arbitrary unknown path `/nonsense/deep/path` also lands on `/habits`.
- **Negative path**: n/a — every deleted route is expected to fall through, never to 404 the SPA shell.

### Journey: Deep links behind the ingress
- **Steps**: with the app deployed, load each URL directly in a fresh tab (no prior SPA navigation).
- **Expected outcomes**:
  - `J8-01` — `https://<host>/e2e-lane-enterprise/habits` returns `200` (nginx `try_files … /index.html` serves the SPA shell) and renders the list, not an nginx 404.
  - `J8-02` — `https://<host>/e2e-lane-enterprise/about` likewise renders the About page.
  - `J8-03` — on the deep-linked `/habits`, the habits XHR resolves to `/e2e-lane-enterprise/api/habits` (relative `api` base + `<base href="/e2e-lane-enterprise/">`) and returns `200`. Assert the observed request URL is **not** root-absolute `/api/habits` and did not `404`.
- **Negative path**: if the XHR 404s or 502s the page still renders the heading (see `J1` negative path) — so this journey must assert the **network status**, not just visible text.

### Journey: Render / acceptance gate
- **Steps**: load `/habits` and wait for readiness.
- **Expected outcomes**:
  - `J9-01` — `[data-testid="app-ready"]` is present in the DOM (the `.colossus-acceptance.json` `ready_testid`).
  - `J9-02` — the page's lowercased text content contains both `my habits` and `keep the momentum` (`expect_text`).
  - `J9-03` — none of the `reject_signatures` appear in the served HTML or rendered DOM: `home-title">Users<`, `Loading...`, `Failed to load users.`, `This repository is a bare template`.
- **Negative path**: n/a — this is the gate itself.

---

## Data integrity tests

Invariants the database must hold after each mutation. Run against a real Postgres, not a stub.

- `DI-01` — **Seed count on a fresh DB**: after `prisma migrate deploy` on an empty database and one backend boot, `SELECT count(*) FROM "Habit"` is exactly `3`, with the `(name, streak)` pairs `("Drink water",5)`, `("Read 20 minutes",2)`, `("Morning walk",0)`.
- `DI-02` — **Seed idempotency across restarts**: restart the backend process twice more without clearing the DB → the count is still exactly `3`. `HabitsService.onModuleInit` must no-op when `count() !== 0`. Zero duplicate rows.
- `DI-03` — **`npx prisma db seed` idempotency**: run the standalone seed script against the already-seeded DB → exit code `0` and the count is still `3`. Run it against an empty DB → count becomes `3` with the same pairs. Running it twice in a row never duplicates.
- `DI-04` — **Seed lists do not diverge**: the habit list in `backend/prisma/seed/seed.js` is identical (same names, same streaks, same order) to `SEED_HABITS` in `backend/src/habits/habits.service.ts`. Assert by parsing both, not by eyeballing. Also assert `seed.js` contains no `SEED_USERS`, `derivePassword`, or `SEED_CRED` credential logging.
- `DI-05` — **Create invariants**: after each successful `POST /api/habits`, the new row has `streak = 0`, a non-null server-generated `id` unique across the table, a non-null `createdAt` within 60s of the request, and `name` equal to the trimmed submitted string. Exactly one row is added per `201`.
- `DI-06` — **Rejected creates write nothing**: `SELECT count(*)` is unchanged after each of the `400` cases (`PH-04`–`PH-07`). No partial or empty-named row exists: `SELECT count(*) FROM "Habit" WHERE trim(name) = ''` is `0` at all times.
- `DI-07` — **`User`/`Role` tables are dormant, not dropped**: the `User` table still exists (no destructive migration was generated; migration head is still `20260722234442_init`), *and* its row count never changes across the entire suite — no code path reads or writes it. Assert both: the table is queryable, and `count(*)` before the suite equals `count(*)` after.
- `DI-08` — **Seed rows survive user-created rows**: after adding habits via the API and restarting, the 3 seeds are still present unmodified (the seed guard checks total count, so it will not re-run and will not overwrite user data).

---

## Out of scope

- **Streak increment / check-in flow** — the spec explicitly defines `streak` as a static stored integer set at creation (`0`) or by the seed. There is no `PATCH`/`POST /habits/:id/checkin` endpoint and no UI control, so no test asserts a streak changing over time. Flagged as an open question in `tasks.md`.
- **Editing or deleting a habit** — no endpoint and no UI exists; the spec adds none.
- **Authentication, authorization, sessions, roles** — deliberately removed per the spec's "No authentication" scenario, which overrides the pipeline's `full_auth` baseline. Tested only *negatively* (`J6-02`–`J6-04`, `J7-02`–`J7-05`, `RM-01`–`RM-02`) to prove absence.
- **The `approved_landmarks.json` auth headings** (`Welcome back`, `Create your account`, `Administrator sign in`, `Admin · Service Settings`) and the `admin-settings-main` / `service-` test ids — now unreachable by design. No positive assertion is written for them; `J7-05` asserts the opposite. The landmark checker must be updated or these will fail the gate spuriously.
- **Data persistence across pod restarts** — there is no PersistentVolume; visitor-added habits are expected to be lost and the 3 seeds to reappear. Per the spec this is expected behaviour, not a defect, so no test asserts durability beyond a process restart against the *same* database.
- **`minio` / object storage** — declared in `spec_deployments` but referenced nowhere in the spec's scope. Untested pending the open question in `tasks.md`.
- **Third-party integrations** — the spec states there are none; the single malformed `spec_integrations` entry is a parser artifact, not a real service. No integration-config or `ServiceUnconfiguredError` tests.
- **Prisma migration correctness for `User`/`Role`** beyond `DI-07`'s "still exists, still dormant" check — no drop migration is in scope.
- **Visual regression / pixel diffing, accessibility audit, performance budgets, cross-browser matrix** — the spec is silent on all four; only the functional assertions above are required.
- **`DATABASE_URL` secret presence** (`app-secrets`, `optional: true`) — an infra precondition, not an application behaviour. Called out as a spec risk: a green render gate can coexist with a 502ing API, which is why `GH-01` and `J8-03` assert network status directly.
- **Superseded `verify_ledger` findings a1-8, a1-9, a3-9 and the a2-*/a4-* Express checks** — they assert an Express/EJS/SQLite stack (`src/server.js`, `CMD ["node","src/server.js"]`, "no `loadComponent`") that was never built. Implementing them would break the deployed Angular/NestJS container. Not covered here; they must be closed as invalid, not fixed.
