# Tour of this Go + HTMX Conduit app

Written for someone who knows web apps (Rails / PHP / Laravel / React) but has **not** learned Go yet. It explains just enough Go and just enough of the **chi** router to read *this* codebase, with file pointers you can open while reading.

If you only skim one path, follow: [`cmd/server/main.go`](../cmd/server/main.go) → [`internal/httpx/server.go`](../internal/httpx/server.go) → [`internal/httpx/handlers_auth.go`](../internal/httpx/handlers_auth.go) → [`sql/queries/users.sql`](../sql/queries/users.sql) → [`templates/pages/login.html`](../templates/pages/login.html).

---

## 1. Mental model (map to stacks you know)

| This app | Closest analogue |
| --- | --- |
| `cmd/server` | `bin/rails s` / `php artisan serve` / a single `main` that boots HTTP |
| `internal/httpx` | Controllers + a bit of middleware |
| `templates/` | ERB / Blade / PHP includes (server HTML) |
| `sql/queries/*.sql` + sqlc | Hand SQL like PHP repos / Hono `queries.ts`, but **codegen** produces typed Go |
| `internal/db/*.sql.go` | **Generated** — do not edit by hand; re-run `sqlc generate` |
| chi | A small router on top of Go’s stdlib `net/http` (not a full Rails/Laravel) |
| HTMX | Turbo-like partial updates for favorite/follow only |

There is **no** ORM entity layer and **no** React. A request hits a Go function, that function talks to SQLite through sqlc helpers, then either redirects or renders an HTML template.

---

## 2. How you run it

From `apps/go-htmx`:

```bash
go run ./cmd/seed      # migrate + seed demo users
go run ./cmd/server    # http://127.0.0.1:8090
```

- `go run ./cmd/server` means: compile and run the package in `cmd/server` (the directory that contains `main.go`).
- Env overrides: `APP_ADDR`, `APP_DATABASE_PATH`, `APP_ROOT` (see [`internal/config/config.go`](../internal/config/config.go)).

---

## 3. Go crash course (only what this repo uses)

### Packages and `main`

Every Go file starts with `package …`.

- `package main` + `func main()` = an executable (our server and seed).
- Other packages (`httpx`, `auth`, `db`) are libraries imported by `main`.

```go
package main

import (
    "log"
    "net/http"
    // … local modules
)

func main() {
    // program starts here
}
```

**Import paths** look like URLs. Our module name is in [`go.mod`](../go.mod):

`github.com/naofumi/real-world-apps/apps/go-htmx`

So handlers import `…/internal/httpx`, sqlc code lives under `…/internal/db`, and so on. The `internal/` directory name is a Go convention: other modules outside this tree are not supposed to import it.

### Types, structs, methods

A **struct** is like a plain class/record without inheritance:

```go
type Server struct {
    DB  *sql.DB
    Q   *db.Queries
    R   *Renderer
    Cfg config.Config
}
```

A **method** has a *receiver* before the name — like a function that belongs to that type:

```go
func (s *Server) Login(w http.ResponseWriter, r *http.Request) {
    // s is the Server; w/r are the HTTP response/request
}
```

`*Server` means “pointer to Server” (callers share one instance; methods can use `s.Q`, `s.R`, …).

### Errors are values

Go has no exceptions. Functions often return `(result, error)`:

```go
u, err := s.Q.GetUserByEmail(r.Context(), email)
if err != nil {
    // handle: show form error, 500, etc.
}
```

`err == nil` means success. Ignoring an error on purpose looks like `_ = someCall()` (blank identifier).

### `context.Context`

Almost every DB/HTTP helper takes `ctx context.Context` first. Think of it as “request-scoped bag + cancellation.” We stash the logged-in user and CSRF token on the request context in middleware (see §6).

### Slices and maps

- `[]string` — dynamic array (list).
- `map[string]any` — dictionary; `any` is “any type” (used when passing template data).

### Zero values and `sql.NullString`

Unset strings are `""`, unset pointers are `nil`. Database nullable columns often become `sql.NullString` with `.Valid` and `.String` — see settings / profile templates.

---

## 4. Layout of this app

```text
cmd/server/          → process entry (ListenAndServe)
cmd/seed/            → wipe + seed demo data
internal/
  httpx/             → chi routes, middleware, handlers, HTML renderer
  auth/              → passwords, sessions, CSRF helpers, Viewer
  db/                → sqlc-generated Queries + Open/goose
  config/            → env + paths
  slug/              → title → URL slug
sql/
  schema/            → sqlc schema
  queries/           → hand-written SQL (source of truth for codegen)
  migrations/        → goose migrations applied at startup
templates/           → html/template layouts, pages, partials
static/css/          → Conduit Minimal CSS
e2e/                 → Playwright
```

**Rule of thumb:** change behavior in `internal/httpx` + `sql/queries` + `templates`. After editing SQL, run `sqlc generate` (or `make sqlc`) so `internal/db` updates.

---

## 5. Boot sequence (`cmd/server`)

[`cmd/server/main.go`](../cmd/server/main.go) does four things:

1. Find the app root (so templates/migrations resolve).
2. `config.Load` — address, SQLite path, directories.
3. `db.Open` — open SQLite, `PRAGMA foreign_keys`, run **goose** migrations.
4. `httpx.NewServer` → `http.ListenAndServe(addr, router)`.

`ListenAndServe` is the stdlib HTTP server. The second argument is any `http.Handler` — chi’s router implements that interface.

**`defer sqlDB.Close()`:** `defer` schedules a call to run when the surrounding function returns, so the database connection is closed when `main` exits. Deferred calls run in last-in, first-out order. Here `Close` is only reached if `ListenAndServe` returns; `log.Fatal` exits the process immediately and skips deferred calls, and the OS closes the file anyway. The `defer` is there for tidiness and for any cleanup you add later.

---

## 6. chi + `net/http` (the “framework”)

Go’s standard library already defines:

- `http.Handler` — anything with `ServeHTTP(w, r)`
- `http.HandlerFunc` — a function adapter with that shape
- `http.ResponseWriter`, `*http.Request`

**chi** ([`go-chi/chi`](https://github.com/go-chi/chi)) is a thin router: it matches method + path, extracts URL params, and chains middleware. It is **not** Rails. There are no controllers as classes, no `before_action` DSL beyond middleware you write yourself.

Routes live in [`internal/httpx/server.go`](../internal/httpx/server.go):

```go
r := chi.NewRouter()
r.Use(middleware.Logger)
r.Use(s.SessionMiddleware)

r.Get("/", s.h(s.Home))
r.Get("/login", s.h(s.LoginForm))
r.Get("/articles/{slug}", s.h(s.ArticleShow))

r.Group(func(r chi.Router) {
    r.Use(s.RequireLogin)
    r.Get("/settings", s.h(s.SettingsForm))
    r.Group(func(r chi.Router) {
        r.Use(s.RequireCSRF)
        r.Post("/articles/{slug}/favorite", s.h(s.FavoriteCreate))
    })
})
```

How to read that:

- `r.Get(path, handler)` — GET only.
- `r.Group` + `r.Use(middleware)` — every route inside the group gets that middleware (here: logged in, then a valid CSRF token for POSTs).
- `{slug}` — path param; handlers read it with `chi.URLParam(r, "slug")`.
- `s.h(s.Home)` adapts a handler that returns `error` into a plain `http.HandlerFunc` (see §7).

### Middleware

Middleware is a function that takes an `http.Handler` and returns a new one — “wrap the rest of the stack.”

[`SessionMiddleware`](../internal/httpx/middleware.go):

1. Read `conduit_session` cookie.
2. Look up session + user via sqlc.
3. Put `Viewer` + CSRF on `r.Context()`.
4. Call `next.ServeHTTP(w, r.WithContext(ctx))`.

The middleware body is only three steps: call `s.withSession`, write an error response if it failed, otherwise call `next`.

**`s.withSession(w, r)`** is an ordinary helper method on `Server` that does steps 1–3. It returns `(context.Context, error)`: a context that now carries the viewer and CSRF token, or an error. For a guest it returns a context with just an anonymous CSRF token. Only a missing or expired session counts as “logged out”; a real database error is returned and becomes a 500. It is a separate method so the middleware stays short and each step can `return` early instead of nesting `if` blocks.

**`r.WithContext(ctx)`**: a `*http.Request` is treated as immutable, and its context cannot be changed in place. `WithContext` returns a shallow copy of the request that carries the new context. Passing that copy to `next.ServeHTTP` is how a middleware hands values to everything downstream. Later handlers read them back with `auth.ViewerFrom(r.Context())` and `auth.CSRFFrom(r.Context())`. If you forget to pass the copy on, the handlers never see what the middleware added.

Contexts are also immutable. `auth.WithViewer(ctx, v)` wraps `ctx` in a new context that holds `v` and returns it. That is why the code keeps reassigning `ctx = auth.WithX(ctx, …)`.

[`RequireLogin`](../internal/httpx/middleware.go) redirects to `/login` if there is no viewer.

[`RequireCSRF`](../internal/httpx/middleware.go) compares form `_csrf` (or header) to the token from context.

This is the same idea as Rack/Laravel middleware or Rails `before_action`, just more explicit.

---

## 7. Handlers (controllers)

Handlers are plain methods on `Server` that return an `error`:

```go
func (s *Server) ArticleShow(w http.ResponseWriter, r *http.Request) error {
    a, err := s.articleBySlug(r)
    if err != nil {
        return err // sql.ErrNoRows was already turned into a 404
    }
    // …
    return s.R.HTML(w, r, "article_show", a.Title, view)
}
```

The adapter `s.h` in [`handle.go`](../internal/httpx/handle.go) turns the returned error into a response. An `httpError` (such as `notFound("article")` or `errForbidden`) is written with its status and message. Any other error is logged and the user sees a generic 500, so SQL error text never reaches the browser. This is a common Go idiom: the handler body reads as the happy path, with `return err` at each failure.

Example login POST — [`handlers_auth.go`](../internal/httpx/handlers_auth.go):

1. Read form fields: `r.FormValue("email")` (CSRF middleware already `ParseForm`’d).
2. `s.Q.GetUserByEmail(...)` — DB.
3. `auth.CheckPassword` — bcrypt verify.
4. On failure: re-render the login template with errors (no redirect).
5. On success: `s.signIn` creates the session, sets the cookie and redirects with `303 See Other`.

**GET vs POST naming:** `LoginForm` renders HTML; `Login` mutates. Same pattern as `ArticleNewForm` / `ArticleCreate`.

**Forms** are small structs with an `errors()` method ([`forms.go`](../internal/httpx/forms.go)), e.g. `parseArticleForm(r)` then `f.errors()`. Create and update share the same validation.

**Data for templates** is a small typed struct per page ([`views.go`](../internal/httpx/views.go)), such as `articleShowView` or `profileView`. Article lists use `articlePreview` ([`previews.go`](../internal/httpx/previews.go)), which embeds the sqlc row `db.ArticlePreview` and adds tags and favorited state, loaded in one batched query each rather than one query per article. The renderer always wraps the view in a `PageData` with `Viewer`, `CSRF`, `Title` ([`render.go`](../internal/httpx/render.go)).

---

## 8. Templates (`html/template`)

Go’s `html/template` auto-escapes HTML (like ERB `<%= %>` / Blade `{{ }}`).

Layout pattern:

- [`templates/layouts/base.html`](../templates/layouts/base.html) defines `base.html` and calls `{{template "content" .}}`.
- Each page (e.g. [`login.html`](../templates/pages/login.html)) defines `{{define "content"}}…{{end}}`.
- Partials define named templates (`favorite_button`, `article_preview`) included with `{{template "favorite_button" .}}`.

The renderer parses layout + partials + one page together (`Renderer.load` in `render.go`). Dot (`.`) in templates is the `PageData`; page-specific payload is `.Content`.

**HTMX:** favorite/follow forms include `hx-post` / `hx-swap="outerHTML"`. When the request has header `HX-Request: true`, handlers return only the partial HTML ([`toggleFavorite`](../internal/httpx/handlers_articles.go)); otherwise they redirect like a normal form POST.

---

## 9. Database: sqlc + goose + SQLite

### Migrations (goose)

[`internal/db/open.go`](../internal/db/open.go) runs goose against [`sql/migrations/`](../sql/migrations/). Startup migrates automatically (seed does too).

### Queries (sqlc)

You write SQL with annotations in [`sql/queries/`](../sql/queries/), for example:

```sql
-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = ? COLLATE NOCASE;
```

- `:one` — expect a single row → Go returns `(User, error)`.
- `:many` — slice of rows.
- `:exec` / `:execrows` — mutate; rows-affected for favorites.

Then `sqlc generate` emits typed methods on `*db.Queries`, e.g. `GetUserByEmail(ctx, email)`.

**You edit the `.sql` files, not the generated `*.sql.go`.**

### Transactions

Multi-step writes (create article + tags, favorite + increment count) use:

```go
err := s.inTx(ctx, func(q *db.Queries) error {
    // … use q; returning an error rolls back …
    return nil
})
```

`s.inTx` ([`handle.go`](../internal/httpx/handle.go)) begins the transaction, hands the callback a `q` from sqlc's generated `WithTx`, and commits only if the callback returns `nil`.

---

## 10. Auth in this app

| Piece | Where |
| --- | --- |
| Password hash/verify | [`internal/auth/password.go`](../internal/auth/password.go) (bcrypt) |
| Session row + cookie | [`internal/auth/session.go`](../internal/auth/session.go) + `sessions` table |
| CSRF | Session CSRF for logged-in users; `csrf_anon` cookie for guests |
| Current user | `auth.ViewerFrom(r.Context())` after middleware |

There is **no JWT**. Cookies + server-side session tokens, similar to Rails/PHP/Laravel HTML apps in this monorepo.

---

## 11. Walkthrough: favorite button

1. Article page / feed renders [`templates/partials/favorite_button.html`](../templates/partials/favorite_button.html) — a `<form>` with `_csrf` and `hx-post`.
2. Browser POSTs to `/articles/{slug}/favorite` (or `…/unfavorite`).
3. chi matches route → `RequireLogin` → `RequireCSRF` → `FavoriteCreate`.
4. Handler loads article, then inside `s.inTx` runs `InsertFavorite` and bumps the count.
5. If `HX-Request` → render favorite partial only (button swaps in place). Else redirect back to the article.

Compare to Rails Turbo Stream favorite, PHP `article_favorite.php` + redirect, or Hono JSON + React state: same product idea, different transport.

---

## 12. Tests (so you know what is “proven”)

| Layer | Command | What |
| --- | --- | --- |
| sqlc / DB | `go test ./internal/db/...` | In-memory SQLite: favorites, feed |
| HTTP | `go test ./internal/httpx/...` | `httptest` register/login + CSRF cookies |
| E2E | `npm run test:e2e` | Playwright against real server + seed |

Templates are not unit-tested in isolation — same philosophy as PHP page scripts.

---

## 13. Glossary

| Term | Meaning here |
| --- | --- |
| **chi** | HTTP router + middleware helpers on `net/http` |
| **Handler** | Function/method `func(w, r)` that serves one route |
| **Middleware** | Wrapper around handlers (session, CSRF, auth) |
| **sqlc** | Compile SQL → type-safe Go |
| **goose** | SQL migration runner |
| **Receiver** | `(s *Server)` before a method name |
| **`context.Context`** | Request-scoped values + cancellation |
| **`httptest`** | Stdlib package for testing handlers without a real TCP port |

---

## 14. Suggested reading order in the tree

1. [`cmd/server/main.go`](../cmd/server/main.go) — boot  
2. [`internal/httpx/server.go`](../internal/httpx/server.go) — all routes on one screen  
3. [`internal/httpx/middleware.go`](../internal/httpx/middleware.go) — session + CSRF  
4. [`internal/httpx/handlers_auth.go`](../internal/httpx/handlers_auth.go) — simplest full form flow  
5. [`internal/httpx/handlers_home.go`](../internal/httpx/handlers_home.go) — listing + tags  
6. [`internal/httpx/handlers_articles.go`](../internal/httpx/handlers_articles.go) — CRUD + HTMX favorite  
7. [`sql/queries/articles.sql`](../sql/queries/articles.sql) — what the DB API looks like as SQL  
8. [`templates/layouts/base.html`](../templates/layouts/base.html) + one page under `templates/pages/`  

When something feels “magical,” it is usually either **chi routing**, **context values from middleware**, or **sqlc codegen**. There is very little hidden framework behavior beyond that.
