# RealWorld — Go + HTMX

A [RealWorld](https://realworld-docs.netlify.app/) (Conduit) blogging app in **Go** with **chi**, **html/template**, **HTMX**, **sqlc + SQLite**, cookie sessions, and CSRF.

Part of the [`real-world-apps`](../../) monorepo. Companions: [`../rails-erb`](../rails-erb), [`../react-hono`](../react-hono), [`../php`](../php).

Run all commands from this directory (`apps/go-htmx`).

Agent notes: [`AGENTS.md`](./AGENTS.md).

New to Go / chi? Start with the guided tour: [`docs/go-tour.md`](./docs/go-tour.md).

## Stack

| Piece | Choice |
| --- | --- |
| Router | chi |
| Templates | `html/template` + layouts/partials |
| UI | HTMX (full-page forms; partial swaps for favorite/follow) |
| CSS | Conduit Minimal CSS v4 (`static/css/conduit.css`, same as Rails/React-Hono) |
| DB | SQLite via `database/sql` + sqlc + goose |
| Auth | Cookie sessions + CSRF (not JWT) |
| Tests | `httptest` + Playwright |

## Setup

Needs Go 1.22+ and (for E2E) Node.js.

```bash
go mod tidy
go run ./cmd/seed
```

## Run

```bash
go run ./cmd/server
# or: make run
```

App: [http://127.0.0.1:8090](http://127.0.0.1:8090)

Env overrides: `APP_ADDR`, `APP_DATABASE_PATH`, `APP_ROOT`.

Seeded users (password `password`): `alice@example.com`, `bob@example.com`, `cara@example.com`.

## Tests

```bash
go test ./...

npm install
npx playwright install chromium
npm run test:e2e
```

## Implemented

- Auth: register / login / logout
- Settings (profile edit + optional password change)
- Home global feed, tag filter, Your Feed
- Article CRUD (resourceful `/articles/...`)
- Favorites (HTMX button swap)
- Comments create/delete
- Profiles + follow/unfollow (HTMX)
- Profile favorites tab

## Not in this port

- Password reset (Rails-only today)
- JWT / RealWorld JSON API
- Pagination UI (queries support limit/offset; pages not wired yet)
