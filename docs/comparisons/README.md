# Comparisons

Side-by-side notes across the Conduit stacks (Rails / Hono / PHP today; Laravel + Inertia is in `apps/laravel-inertia` and can join comparison docs later).

## Documents

| Doc | What it covers |
| --- | --- |
| [`rails-hono-php.md`](./rails-hono-php.md) | Three-way Rails ERB / React+Hono / PHP: LoC, architecture, auth, data access (incl. why Hono’s server row is ~2× PHP’s), page size, testing |
| [`testing-strategies.md`](./testing-strategies.md) | Qualitative Rails / Hono / PHP testing strategies (layers, fixtures, CI posture — no LoC) |
| [`images/rails-hono-php-loc.png`](./images/rails-hono-php-loc.png) | One-page LoC poster (totals, server vs UI, Hono≈2× PHP drivers) embedded at the top of the three-way doc |

Prefer concrete diffs (file paths, patterns, measured LoC where relevant) over abstract stack marketing. Add further topic files here as needed (`auth.md`, …).

## Starter framing

| Topic | Rails ERB | React + Hono | PHP |
| --- | --- | --- | --- |
| Request story | Controller → view / Turbo Stream | Hono route → JSON → SPA | `public/*.php` page script |
| Authority | Server (CanCanCan / session) | Server `permissions` in JSON | Server (session + CSRF) |
| Data access | Active Record | Drizzle schema + hand SQL modules | PDO repositories (hand SQL) |
| Tests | Rails tests + system | API/`node:test` + Vitest + Playwright | PHPUnit repos + Playwright e2e |

See also the high-level matrix in [`../README.md`](../README.md).
