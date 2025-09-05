# AAB Backend

Fastify-based read-only API over the SQLite database used by the dashboard.

- Env: `DATABASE_PATH` points to SQLite file (read-only)
- Routes: `/posts`, `/posts/:id/comments`, `/posts/:id/transcript`, `/analytics`, `/facets`, `/schema`, `/healthz`
- Deploy: Dockerfile provided

