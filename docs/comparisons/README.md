# Comparisons

Side-by-side notes across the Conduit stacks under `apps/`.

## Documents

| Doc | What it covers |
| --- | --- |
| [`conduit-stacks.md`](./conduit-stacks.md) | **Current** five-way: Rails ERB / PHP / Go+HTMX / Laravel+Inertia / React+Hono — LoC, architecture, auth, data access, per-screen size |
| [`images/conduit-stacks-loc.png`](./images/conduit-stacks-loc.png) | Poster for the five-way doc |
| [`rails-hono-php.md`](./rails-hono-php.md) | Original three-way Rails / Hono / PHP (kept for history; points forward) |
| [`testing-strategies.md`](./testing-strategies.md) | Qualitative testing strategies (layers, fixtures, CI posture — no LoC) |
| [`images/rails-hono-php-loc.png`](./images/rails-hono-php-loc.png) | Original three-stack LoC poster |
| [`images/generate_conduit_stacks_poster.py`](./images/generate_conduit_stacks_poster.py) | Pillow regenerator for the five-stack poster |

Prefer concrete diffs (file paths, patterns, measured LoC where relevant) over abstract stack marketing.

## Starter framing

| Topic | Rails ERB | React + Hono | PHP | Go + HTMX | Laravel + Inertia |
| --- | --- | --- | --- | --- | --- |
| Request story | Controller → view / Turbo Stream | Hono route → JSON → SPA | `public/*.php` page script | chi handler → template / HTMX | Controller → Inertia props → React |
| Authority | Server (CanCanCan / session) | Server `permissions` in JSON | Server (session + CSRF) | Server (session + CSRF) | Server (Policies + session) |
| Data access | Active Record | Drizzle schema + hand SQL modules | PDO repositories (hand SQL) | sqlc + hand orchestration | Eloquent |
| Tests | Rails tests + system | API/`node:test` + Vitest + Playwright | PHPUnit repos + Playwright e2e | sqlc/`httptest` + Playwright | Feature tests + Playwright |
| CSS | Conduit Minimal | Conduit Minimal | custom `app.css` | Conduit Minimal | Conduit Minimal |

See also the high-level matrix in [`../README.md`](../README.md).
