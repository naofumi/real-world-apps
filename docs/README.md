# Comparison docs

Canonical home for cross-stack RealWorld findings (architecture, LoC, testing approaches, preferences).

App-specific agent guides and diagrams stay next to each app:

- [`apps/rails-erb/README.md`](../apps/rails-erb/README.md)
- [`apps/react-hono/README.md`](../apps/react-hono/README.md) · [`AGENTS.md`](../apps/react-hono/AGENTS.md)
- [`apps/php/README.md`](../apps/php/README.md) · [`AGENTS.md`](../apps/php/AGENTS.md) · [`docs/`](../apps/php/docs/)
- [`apps/laravel-inertia/README.md`](../apps/laravel-inertia/README.md) · [`AGENTS.md`](../apps/laravel-inertia/AGENTS.md)
- [`apps/go-htmx/README.md`](../apps/go-htmx/README.md) · [`AGENTS.md`](../apps/go-htmx/AGENTS.md)

## How the variants relate

The apps implement the Conduit blogging surface (feeds, articles, comments, favorites, follows, auth). They differ mainly in rendering and server style:

| Concern | Rails ERB | React + Hono | PHP | Laravel + Inertia | Go + HTMX |
| --- | --- | --- | --- | --- | --- |
| UI | Server-rendered ERB + Hotwire | React SPA | PHP page scripts + includes | Inertia + React pages | html/template + HTMX |
| API | Controllers (HTML / Turbo) | Hono JSON (`/api/...`, JWT) | Form POSTs to `.php` files | Controllers → Inertia props | Form POSTs to resourceful routes |
| Auth | Cookie sessions | JWT bearer | Cookie sessions + CSRF | Cookie sessions + CSRF | Cookie sessions + CSRF |
| Authz | CanCanCan | Server `permissions` JSON | Session checks in pages | Laravel Policies | Inline checks in handlers |
| DB | Active Record + SQLite | Drizzle + SQLite | PDO repositories + SQLite | Eloquent + SQLite | sqlc + SQLite |
| CSS | Conduit Minimal | Conduit Minimal | custom `app.css` | Conduit Minimal | Conduit Minimal |

Longer writeup with fresh LoC and page-size tables: [`comparisons/rails-hono-php.md`](./comparisons/rails-hono-php.md). Qualitative testing-layer comparison (no LoC): [`comparisons/testing-strategies.md`](./comparisons/testing-strategies.md). Index: [`comparisons/README.md`](./comparisons/README.md).

## CI note

Each app still carries its own tooling under its directory. Nested workflows such as `apps/rails-erb/.github/workflows/` are **not** picked up by GitHub Actions from the monorepo root until they are moved/adapted with `defaults.run.working-directory` (or path filters) under a top-level `.github/`.

## Planned

- Topic slices split out of the three-way note (authz-only, “illegal states”)
- Path-filtered CI per app at the monorepo root
- Five-stack LoC comparison (Go + Laravel) — see open comparison PR if present
