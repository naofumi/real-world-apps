# Agent notes (apps/go-htmx)

## Style goals

1. **Resourceful HTML URLs** with chi — `/articles/{slug}`, `/users/{username}`, form POSTs + redirects.
2. **sqlc** generated queries over hand-rolled string SQL in handlers; multi-step writes use transactions in Go.
3. **HTMX** for favorite/follow button swaps; everything else is full-page forms first.
4. **Conduit Minimal CSS** vendored at `static/css/conduit.css` (same as Rails ERB / React-Hono). Do not introduce a PHP-style custom `app.css`.

## Layout

| Path | Role |
| --- | --- |
| `cmd/server` | HTTP entrypoint |
| `cmd/seed` | Demo users + articles |
| `internal/httpx` | chi router, handlers, templates renderer |
| `internal/db` | sqlc output + `Open` / goose |
| `internal/auth` | password hashing, cookie sessions, CSRF |
| `sql/schema` | sqlc schema |
| `sql/queries` | sqlc queries |
| `sql/migrations` | goose migrations |
| `templates/` | `html/template` layouts, pages, partials |
| `static/css/conduit.css` | Conduit Minimal CSS v4 |
| `e2e/` | Playwright flows |

## Testing strategy

Aligned with monorepo [testing-strategies](../../docs/comparisons/testing-strategies.md) philosophy (no LoC comparison yet):

1. **sqlc / DB tests** (`go test ./internal/db/...`) — in-memory SQLite + goose; favorites, feeds, follows.
2. **httptest handler tests** (`go test ./internal/httpx/...`) — register/login CSRF + cookies; not every template.
3. **Playwright E2E** (`npm run test:e2e`) — auth, feeds/tags, publish, favorite, follow, comments against `go run ./cmd/server` + seeded DB.

Do not unit-test every template partial. Prefer E2E for HTML flows; keep Go tests at SQL and a thin HTTP seam.

## Run

```bash
go run ./cmd/seed
go run ./cmd/server   # http://127.0.0.1:8090
```

## Learning the codebase

If you are new to Go or chi, read [`docs/go-tour.md`](./docs/go-tour.md) (maps this tree to Rails/PHP/Laravel ideas and walks login + favorite).
