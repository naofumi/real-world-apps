# RealWorld apps

Comparison monorepo for [RealWorld](https://realworld-docs.netlify.app/) (Conduit) implementations. Same product surface, different stacks — useful for side-by-side architecture and style notes.

| App | Path | Stack |
| --- | --- | --- |
| Rails ERB | [`apps/rails-erb`](./apps/rails-erb) | Rails 8, ERB, Hotwire, SQLite |
| React + Hono | [`apps/react-hono`](./apps/react-hono) | React SPA, Hono API, Drizzle, SQLite |
| PHP | [`apps/php`](./apps/php) | PHP 8.4 page scripts, PDO + SQLite |
| Laravel + Inertia | [`apps/laravel-inertia`](./apps/laravel-inertia) | Laravel, Inertia + React, Policies, SQLite |
| Go + HTMX | [`apps/go-htmx`](./apps/go-htmx) | chi, html/template, HTMX, sqlc + SQLite |

Cross-stack comparison writeups live in [`docs/`](./docs). Five-stack LoC and architecture: [`docs/comparisons/conduit-stacks.md`](./docs/comparisons/conduit-stacks.md).

Each app is self-contained. **Run commands from that app’s directory** (see its README for setup, ports, and tests).

## Quick start

```bash
# Rails ERB → http://localhost:3000
cd apps/rails-erb && bin/setup --skip-server && bin/dev

# React + Hono → web :5173, API :8787
cd apps/react-hono && npm install && npm run db:seed && npm run dev

# PHP → http://127.0.0.1:8080
cd apps/php && composer install && php bin/migrate && php bin/seed && php bin/dev

# Laravel + Inertia → http://127.0.0.1:8000
cd apps/laravel-inertia && composer install && php artisan migrate --seed && npm install && npm run build && php artisan serve

# Go + HTMX → http://127.0.0.1:8090
cd apps/go-htmx && go run ./cmd/seed && go run ./cmd/server
```

## Source remotes (pre-monorepo)

Standalone repos are still available; this monorepo imports them under `apps/` (history preserved via `git subtree`):

- https://github.com/naofumi/real-world-app-rails-erb
- https://github.com/naofumi/real-world-app-react-hono
- https://github.com/naofumi/real-world-app-php

`apps/laravel-inertia` and `apps/go-htmx` are native to this monorepo.
