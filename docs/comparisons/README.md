# Comparisons

Short starter index for side-by-side notes across the three Conduit stacks.

Add one topic per file under this folder (for example `auth.md`, `testing.md`, `data-access.md`). Prefer concrete diffs (file paths, patterns) over abstract stack marketing.

## Starter framing

| Topic | Rails ERB | React + Hono | PHP |
| --- | --- | --- | --- |
| Request story | Controller → view / Turbo Stream | Hono route → JSON → SPA | `public/*.php` page script |
| Authority | Server (CanCanCan / session) | Server `permissions` in JSON | Server (session + CSRF) |
| Tests | Rails tests + system | API/Vitest + Playwright e2e | PHPUnit repos + Playwright e2e |

See also the high-level matrix in [`../README.md`](../README.md).
