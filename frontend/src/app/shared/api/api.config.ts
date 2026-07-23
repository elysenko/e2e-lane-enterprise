/**
 * Base path for REST calls to the NestJS backend.
 *
 * The Angular app never talks to the backend directly. Instead it calls
 * root-relative `/api/*` URLs which are forwarded to the NestJS service:
 *   - dev:  `ng serve` proxy (proxy.conf.json) → http://localhost:3000
 *   - prod: the frontend nginx sidecar proxies `/api/*` → backend
 *
 * This matches the stack glue contract (`frontend_api_base: "/api"`) and the
 * backend global prefix (`app.setGlobalPrefix('api')`), so the same URLs work
 * in both environments with no per-environment rewriting.
 */
export const API_BASE = '/api';
