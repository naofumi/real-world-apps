# Comparison docs

Canonical home for cross-stack RealWorld findings (architecture, LoC, testing approaches, preferences).

App-specific agent guides and diagrams stay next to each app:

- [`apps/rails-erb/README.md`](../apps/rails-erb/README.md)
- [`apps/react-hono/README.md`](../apps/react-hono/README.md) · [`AGENTS.md`](../apps/react-hono/AGENTS.md)
- [`apps/php/README.md`](../apps/php/README.md) · [`AGENTS.md`](../apps/php/AGENTS.md) · [`docs/`](../apps/php/docs/)
- [`apps/go-htmx/README.md`](../apps/go-htmx/README.md) · [`AGENTS.md`](../apps/go-htmx/AGENTS.md)
- [`apps/laravel-inertia/README.md`](../apps/laravel-inertia/README.md) · [`AGENTS.md`](../apps/laravel-inertia/AGENTS.md)

## How the variants relate

They implement the Conduit blogging surface (feeds, articles, comments, favorites, follows, auth). They differ mainly in rendering and server style:

| Concern | Rails ERB | React + Hono | PHP | Go + HTMX | Laravel + Inertia |
| --- | --- | --- | --- | --- | --- |
| UI | Server-rendered ERB + Hotwire | React SPA | PHP page scripts + includes | html/template + HTMX | Inertia + React |
| API | Controllers (HTML / Turbo) | Hono JSON (`/api/...`, JWT) | Form POSTs to `.php` files | Form POSTs to resourceful routes | Controllers → Inertia props |
| Auth | Cookie sessions | JWT bearer | Cookie sessions + CSRF | Cookie sessions + CSRF | Cookie sessions + CSRF |
| DB | Active Record + SQLite | Drizzle + SQLite | PDO repositories + SQLite | sqlc + SQLite | Eloquent + SQLite |
| CSS | Conduit Minimal | Conduit Minimal | custom `app.css` | Conduit Minimal | Conduit Minimal |

Five-way LoC and architecture: [`comparisons/conduit-stacks.md`](./comparisons/conduit-stacks.md). Older three-way (Rails/Hono/PHP): [`comparisons/rails-hono-php.md`](./comparisons/rails-hono-php.md). Qualitative testing-layer comparison: [`comparisons/testing-strategies.md`](./comparisons/testing-strategies.md). Index: [`comparisons/README.md`](./comparisons/README.md).

## CI note

Each app still carries its own tooling under its directory. Nested workflows such as `apps/rails-erb/.github/workflows/` are **not** picked up by GitHub Actions from the monorepo root until they are moved/adapted with `defaults.run.working-directory` (or path filters) under a top-level `.github/`.

## Planned

- Topic slices split out of the multi-stack note (authz-only, “illegal states”)
- Path-filtered CI per app at the monorepo root
