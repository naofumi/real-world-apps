# Comparison docs

Canonical home for cross-stack RealWorld findings (architecture, LoC, testing approaches, preferences).

App-specific agent guides and diagrams stay next to each app:

- [`apps/rails-erb/README.md`](../apps/rails-erb/README.md)
- [`apps/react-hono/README.md`](../apps/react-hono/README.md) · [`AGENTS.md`](../apps/react-hono/AGENTS.md)
- [`apps/php/README.md`](../apps/php/README.md) · [`AGENTS.md`](../apps/php/AGENTS.md) · [`docs/`](../apps/php/docs/)

## How the variants relate

All three implement the Conduit blogging surface (feeds, articles, comments, favorites, follows, auth). They differ mainly in rendering and server style:

| Concern | Rails ERB | React + Hono | PHP |
| --- | --- | --- | --- |
| UI | Server-rendered ERB + Hotwire | React SPA | PHP page scripts + includes |
| API | Controllers (HTML / Turbo) | Hono JSON (`/api/...`, JWT) | Form POSTs to `.php` files |
| Auth | Cookie sessions | JWT bearer | Cookie sessions + CSRF |
| DB | Active Record + SQLite | Drizzle + SQLite | PDO repositories + SQLite |

Longer writeup with fresh LoC and page-size tables: [`comparisons/rails-hono-php.md`](./comparisons/rails-hono-php.md). Qualitative testing-layer comparison (no LoC): [`comparisons/testing-strategies.md`](./comparisons/testing-strategies.md). Index: [`comparisons/README.md`](./comparisons/README.md).

## CI note

Each app still carries its own tooling under its directory. Nested workflows such as `apps/rails-erb/.github/workflows/` are **not** picked up by GitHub Actions from the monorepo root until they are moved/adapted with `defaults.run.working-directory` (or path filters) under a top-level `.github/`.

## Planned

- Topic slices split out of the three-way note (authz-only, “illegal states”)
- Path-filtered CI per app at the monorepo root
