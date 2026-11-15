# Agent notes (real-world-app-php)

## Style goals

1. Classic **page scripts**: each URL is a real file under `public/`. No homemade front controller or router.
2. Repositories return **plain data shapes** (arrays/rows), not rich domain entities.
3. Test with **PHPUnit on repositories** and **Playwright E2E** for flows. Do not extract page scripts just to unit-test them.

## Where the rules live

Actionable coding norms are in `.cursor/rules/`:

- `page-scripts.mdc`
- `repositories-data-shapes.mdc`
- `include-scope.mdc`
- `testing-repos-and-e2e.mdc`

Follow those when they conflict with older patterns or with habits from Laravel/Rails/Hono ports.

## Layout

| Path | Role |
| --- | --- |
| `public/*.php` | Request story: bootstrap, act, include HTML |
| `includes/` | Shared boot, header/footer, partials |
| `src/Persistence/` | PDO SQL adapters |
| `src/Security/` | Session, CSRF, password hashing |
| `tests/` | Repository PHPUnit (in-memory SQLite) |
| `e2e/` | Playwright against `php -S` + seeded DB |

Dev server: `php bin/dev` → `php -S … -t public` (no rewrite router).

## Diagrams

Request stack, one POST walkthrough, and the SQLite data model: [`docs/architecture.md`](./docs/architecture.md).
