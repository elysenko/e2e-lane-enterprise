/**
 * Base path for REST calls to the NestJS backend.
 *
 * The Angular app never talks to the backend directly. Instead it calls
 * `api/*` URLs which are forwarded to the NestJS service:
 *   - dev:  `ng serve` proxy (proxy.conf.json) → http://localhost:3000
 *   - prod: nginx proxies `/api/*` → the backend on the same pod
 *
 * The path is BASE-HREF-RELATIVE (no leading slash) on purpose: in production
 * the app is served under the ingress prefix `/e2e-lane-enterprise/` (set as
 * `<base href>` at build time). A leading-slash `/api` would resolve to the
 * host root and bypass the ingress prefix (→ 404); a relative `api` resolves
 * against `document.baseURI` to `/e2e-lane-enterprise/api/...`, so requests
 * flow back through the ingress → nginx → backend. In dev the base href is `/`,
 * so it resolves to `/api/...` and the `ng serve` proxy forwards it unchanged.
 */
export const API_BASE = 'api';
