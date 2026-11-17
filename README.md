# RealWorld apps

Comparison monorepo for three [RealWorld](https://realworld-docs.netlify.app/) (Conduit) implementations. Same product surface, different stacks — useful for side-by-side architecture and style notes.

| App | Path | Stack |
| --- | --- | --- |
| Rails ERB | [`apps/rails-erb`](./apps/rails-erb) | Rails 8, ERB, Hotwire, SQLite |
| React + Hono | [`apps/react-hono`](./apps/react-hono) | React SPA, Hono API, Drizzle, SQLite |
| PHP | [`apps/php`](./apps/php) | PHP 8.4 page scripts, PDO + SQLite |

Cross-stack comparison writeups live in [`docs/`](./docs). Three-way LoC and architecture note: [`docs/comparisons/rails-hono-php.md`](./docs/comparisons/rails-hono-php.md).

Each app is self-contained. **Run commands from that app’s directory** (see its README for setup, ports, and tests).

## Quick start

```bash
# Rails ERB → http://localhost:3000
cd apps/rails-erb && bin/setup --skip-server && bin/dev

# React + Hono → web :5173, API :8787
cd apps/react-hono && npm install && npm run db:seed && npm run dev

# PHP → http://127.0.0.1:8080
cd apps/php && composer install && php bin/migrate && php bin/seed && php bin/dev
```

## Source remotes (pre-monorepo)

Standalone repos are still available; this monorepo imports them under `apps/` (history preserved via `git subtree`):

- https://github.com/naofumi/real-world-app-rails-erb
- https://github.com/naofumi/real-world-app-react-hono
- https://github.com/naofumi/real-world-app-php
