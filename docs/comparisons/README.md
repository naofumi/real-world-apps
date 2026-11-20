# Comparisons

Side-by-side notes across the five Conduit stacks under `apps/`.

## Documents

| Doc | What it covers |
| --- | --- |
| [`conduit-stacks.md`](./conduit-stacks.md) | **Primary** five-way LoC + architecture (Rails, Laravel, PHP, Go, Hono); Laravel vs Rails server gap and Laravel vs Hono UI |
| [`rails-hono-php.md`](./rails-hono-php.md) | Older three-way deep dive (page character tables, Hono≈2× PHP server drivers). Forward-pointer to the five-way doc |
| [`testing-strategies.md`](./testing-strategies.md) | Qualitative testing strategies (layers, fixtures, CI posture — no LoC) |
| [`images/conduit-stacks-loc.png`](./images/conduit-stacks-loc.png) | Five-stack LoC poster (regenerate via `images/generate_conduit_stacks_poster.py`) |
| [`images/rails-hono-php-loc.png`](./images/rails-hono-php-loc.png) | Legacy three-stack poster for the three-way doc |

Prefer concrete diffs (file paths, patterns, measured LoC where relevant) over abstract stack marketing.

## Starter framing

| Topic | Rails ERB | React + Hono | PHP | Laravel + Inertia | Go + HTMX |
| --- | --- | --- | --- | --- | --- |
| Request story | Controller → view / Turbo Stream | Hono route → JSON → SPA | `public/*.php` page script | Controller → Inertia props → React | chi handler → template / HTMX partial |
| Authority | Server (CanCanCan / session) | Server `permissions` in JSON | Server (session + CSRF) | Server (Policies + session) | Server (session + CSRF) |
| Data access | Active Record | Drizzle schema + hand SQL modules | PDO repositories (hand SQL) | Eloquent | sqlc + hand orchestration |
| Tests | Rails tests + system | API/`node:test` + Vitest + Playwright | PHPUnit repos + Playwright e2e | Feature tests + Playwright | sqlc/`httptest` + Playwright e2e |
| CSS | Conduit Minimal | Conduit Minimal | Conduit Minimal + `app.css` glue | Conduit Minimal | Conduit Minimal |

See also the high-level matrix in [`../README.md`](../README.md).
