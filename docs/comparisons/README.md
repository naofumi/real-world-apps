# Comparisons

Side-by-side notes across the Conduit stacks under `apps/` (Rails / Hono / PHP documented in depth; Laravel + Inertia and Go + HTMX are in-tree and appear in testing-strategies / index tables — full LoC poster update may land separately).

## Documents

| Doc | What it covers |
| --- | --- |
| [`rails-hono-php.md`](./rails-hono-php.md) | Three-way Rails ERB / React+Hono / PHP: LoC, architecture, auth, data access (incl. why Hono’s server row is ~2× PHP’s), page size, testing |
| [`testing-strategies.md`](./testing-strategies.md) | Qualitative testing strategies (layers, fixtures, CI posture — no LoC). Includes Go+HTMX. |
| [`images/rails-hono-php-loc.png`](./images/rails-hono-php-loc.png) | One-page LoC poster (totals, server vs UI, Hono≈2× PHP drivers) embedded at the top of the three-way doc |

Prefer concrete diffs (file paths, patterns, measured LoC where relevant) over abstract stack marketing. Add further topic files here as needed (`auth.md`, …). Go+HTMX and Laravel+Inertia are not in the three-way LoC poster yet.

## Starter framing

| Topic | Rails ERB | React + Hono | PHP | Laravel + Inertia | Go + HTMX |
| --- | --- | --- | --- | --- | --- |
| Request story | Controller → view / Turbo Stream | Hono route → JSON → SPA | `public/*.php` page script | Controller → Inertia props → React | chi handler → template / HTMX partial |
| Authority | Server (CanCanCan / session) | Server `permissions` in JSON | Server (session + CSRF) | Server (Policies + session) | Server (session + CSRF) |
| Data access | Active Record | Drizzle schema + hand SQL modules | PDO repositories (hand SQL) | Eloquent | sqlc + hand orchestration |
| Tests | Rails tests + system | API/`node:test` + Vitest + Playwright | PHPUnit repos + Playwright e2e | Feature tests + Playwright | sqlc/`httptest` + Playwright e2e |
| CSS | Conduit Minimal | Conduit Minimal | custom `app.css` | Conduit Minimal | Conduit Minimal |

See also the high-level matrix in [`../README.md`](../README.md).
