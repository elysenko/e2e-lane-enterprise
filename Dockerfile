# syntax=docker/dockerfile:1
# Minimal static nginx image — the repo contains no application source, so we
# serve a small placeholder page. This still lets the deploy pipeline verify
# the full build → push → deploy → ingress → smoke-test path end-to-end.
FROM nginx:1.27-alpine

# Nginx config: listen on 8080 (matches the port the Service targets), serve
# /usr/share/nginx/html with a simple SPA-style try_files fallback so any path
# returns the placeholder index.
RUN printf '%s\n' \
    'server {' \
    '    listen 8080;' \
    '    server_name _;' \
    '    root /usr/share/nginx/html;' \
    '    index index.html;' \
    '    location / {' \
    '        try_files $uri $uri/ /index.html;' \
    '    }' \
    '}' > /etc/nginx/conf.d/default.conf \
 && rm -f /etc/nginx/conf.d/default.conf.bak

# Placeholder index.html — makes it obvious this is a bare template repo,
# not a broken deploy.
RUN printf '%s\n' \
    '<!doctype html>' \
    '<html lang="en">' \
    '<head><meta charset="utf-8"><title>e2e-lane-enterprise</title>' \
    '<meta name="viewport" content="width=device-width,initial-scale=1">' \
    '<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:4rem auto;padding:0 1rem;color:#111}code{background:#f4f4f5;padding:.1rem .3rem;border-radius:.2rem}</style>' \
    '</head>' \
    '<body>' \
    '<h1>e2e-lane-enterprise</h1>' \
    '<p>This repository is a bare template — no application source has been committed yet.</p>' \
    '<p>The Colossus deploy pipeline built and served this placeholder to verify the end-to-end path (build → push → ingress → smoke test).</p>' \
    '<p>Push application code to <code>main</code> to replace this page.</p>' \
    '</body></html>' > /usr/share/nginx/html/index.html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
