# Testing strategies — five Conduit stacks

Qualitative comparison of how the RealWorld (Conduit) apps under `apps/` choose test layers. Based on each app’s stated strategy (`AGENTS.md`, README test sections, `.cursor/rules`, architecture/features docs, CI) and spot-checks of representative suites — not on test size or LoC.

For architecture and measured LoC, see [`conduit-stacks.md`](./conduit-stacks.md) (older three-way: [`rails-hono-php.md`](./rails-hono-php.md)).

| App | Path |
| --- | --- |
| Rails ERB | [`apps/rails-erb`](../../apps/rails-erb) |
| React + Hono | [`apps/react-hono`](../../apps/react-hono) |
| PHP page scripts | [`apps/php`](../../apps/php) |
| Go + HTMX | [`apps/go-htmx`](../../apps/go-htmx) |
| Laravel + Inertia | [`apps/laravel-inertia`](../../apps/laravel-inertia) |

---

## Rails ERB (`apps/rails-erb`)

**Layers**

1. **Controller / integration** — Minitest `ActionDispatch::IntegrationTest` under `test/controllers/`. Issue GETs/POSTs, assert status, redirects, and HTML with `assert_select`. This is the main non-browser safety net.
2. **Focused unit** — `test/models/ability_test.rb` for CanCanCan authorization rules. Almost no other pure model unit suite; Active Record behavior is exercised through controllers and fixtures.
3. **System / browser** — Capybara + headless Chrome (`test/system/`, `ApplicationSystemTestCase`). Multi-step flows: signup/logout, password reset (with enqueued mail), article CRUD, favorite/follow/feed, settings.

**What they do not unit-test**

There is no separate “page object” or view-unit layer. Views are checked via controller `assert_select` and system tests. That matches SSR: the controller + ERB path is a first-class Rails seam, so request/response tests cover markup and redirects without extracting presenters for isolation.

**Auth / DB / fixtures**

- **Auth in tests:** `SessionTestHelper#sign_in_as` plants a signed `session_id` cookie for integration tests; system tests fill the real login form (`sign_in`).
- **Data:** YAML fixtures (`test/fixtures/*.yml`, `fixtures :all`). Shared demo users (`alice`, `bob`, …) with `password` digests.
- **DB:** Rails test DB via `db:test:prepare`. Parallel workers. Seeds are separately smoke-checked in `bin/ci` (`db:seed:replant`), not used as the primary fixture source for controller/system tests.
- **CI:** `.github/workflows/ci.yml` runs `bin/rails test` and `bin/rails test:system`. Local `bin/ci` runs unit/integration + seed replant; system tests are commented as optional there, but the GitHub workflow does run them.

**Why it fits**

Server-rendered forms and Hotwire mean most product behavior is “HTTP in → HTML/redirect/Turbo out.” Rails gives a cheap middle layer for that without a browser. System tests cover the remaining JS/Turbo and multi-page journeys (including password-reset mail).

---

## React + Hono (`apps/react-hono`)

Paths below are relative to [`apps/react-hono`](../../apps/react-hono) (that package nests its own `apps/` and `packages/`).

**Layers**

1. **API contract** — `apps/api/test/contract.test.ts` (`node:test`) drives the Hono app with `app.request` over in-memory SQLite, walking RealWorld HTTP workflows (auth, articles, feeds, favorites, comments, permission-shaped JSON).
2. **API module / unit** — `queries.test.ts` (article queries/writes with per-test transaction rollback), `permissions.test.ts`, `parse-errors.test.ts`.
3. **Web Vitest** — thin presenters, lib helpers, and small components (e.g. login-state helpers, `ArticleList` loading/empty states). Explicit rule: not page-level suites with a mocked API client.
4. **Browser E2E** — Playwright against a real API + real SPA (`e2e/*.spec.ts`). Specs cover auth failures, feeds/tags, profile tabs, article permissions UI, favorite persistence, editor create/edit/refuse.

**What they deliberately do not unit-test**

Full page flows under jsdom with a heavy mocked `api` client. `.cursor/rules/testing-e2e-over-mocks.mdc` and the README say: keep Vitest for genuine seams; prove page flows with Playwright against the real stack. Do not rebuild the page a second time under mocks when E2E already covers the journey.

**Auth / DB / fixtures**

- **Auth:** JWT (`Authorization: Token …`). Contract tests mint/reuse tokens on the in-process app. E2E logs in through the SPA form (`e2e/session.ts`) against seeded accounts (`demo@…`, `jane@…`, `anika@…` / `password123`).
- **DB:** API tests use `:memory:` SQLite + migrate; query tests roll back via intentional transaction abort. E2E deletes `data/e2e.sqlite`, seeds it, starts API `:8797` and web `:4173` (Playwright `webServer`) — separate from `npm run dev`.
- **CI:** Documented as `npm test` then `npm run test:e2e` in the app README; no app-level GitHub workflow in this monorepo tree (unlike Rails).

**Why it fits**

Split SPA + JSON API needs a contract suite: the published RealWorld HTTP shapes and `permissions` fields are the server’s product surface. Client UI is stateful and fetch-driven, so mock-heavy page tests are expensive and brittle; Playwright on the real pair is the deliberate page-coverage layer. Vitest stays at pure helpers and small presenters.

---

## PHP page scripts (`apps/php`)

**Layers**

1. **Repository PHPUnit** — `tests/*RepositoryTest.php` (+ `SlugTest`) on in-memory SQLite (`PdoFactory::make(':memory:')` + `Migrator`). Covers data shapes and SQL behavior: feeds, favorites, follows, comments, slug uniqueness.
2. **Browser E2E** — Playwright against `php -S` and a reseeded `storage/e2e.sqlite3` (`e2e/*.spec.ts`). Auth, feeds/tags, publish, favorite, follow, comments. `docs/features.md` maps capabilities → page scripts → which E2E specs exist (some surfaces still “none yet”).

**What they deliberately do not unit-test**

Page scripts under `public/`. `AGENTS.md` and `testing-repos-and-e2e.mdc` forbid extracting orchestration into services *just* to unit-test them, and discourage a custom PHP request harness (`ob_start` + include) unless E2E is too coarse for a recurring bug class. They also reject mirroring the Rails controller-test matrix without a framework to hang it on. CSRF, form `action`s, includes, and redirects are proven in the browser instead.

**Auth / DB / fixtures**

- **Auth:** Cookie sessions + CSRF on mutating POSTs. E2E signs in through `login.php` (`e2e/session.ts`). No JWT / JSON API.
- **DB:** PHPUnit builds users/articles in `setUp` per test on `:memory:`. E2E wipes and reseeds via `APP_DATABASE_PATH` + `php bin/seed` before serving `public/` on `:8081`.
- **CI:** `composer test` and `npm run test:e2e` per README; no GitHub workflow under this app in the monorepo.

**Why it fits**

Classic page scripts have no router/controller framework seam. Repositories (plain arrays/SQL) are the natural fast unit boundary — analogous to Hono query modules more than to Rails models. Full request stories stay readable top-to-bottom in `public/*.php` and are asserted end-to-end, not via a second harness.

---

## Go + HTMX (`apps/go-htmx`)

**Layers**

1. **sqlc / DB tests** — `go test ./internal/db/...` on in-memory SQLite + goose. Favorites count, feed-from-follows, and similar SQL behavior.
2. **httptest handlers** — thin request tests for register/login CSRF + session cookies (`internal/httpx`). Not a full matrix of every template.
3. **Browser E2E** — Playwright against `go run ./cmd/server` and a reseeded `storage/e2e.sqlite3`. Auth, feeds/tags, publish, favorite, follow, comments.

**What they deliberately do not unit-test**

Every template partial. `AGENTS.md` keeps Go tests at SQL + a thin HTTP seam; HTML flows belong to Playwright (same philosophy as PHP/Hono page coverage).

**Auth / DB / fixtures**

- **Auth:** Cookie sessions + CSRF. E2E signs in through `/login`.
- **DB:** Unit/httptest use shared in-memory SQLite; E2E uses `APP_DATABASE_PATH` + `go run ./cmd/seed`.
- **CI:** README scripts (`go test ./...`, `npm run test:e2e`); no app workflow in the monorepo root yet.

**Why it fits**

SSR + HTMX is closer to Rails/PHP than to the Hono SPA. sqlc is the cheap data seam (like PHP repositories); chi+`httptest` covers CSRF/session without a browser; Playwright proves resourceful URLs and HTMX swaps.

---

## Laravel + Inertia (`apps/laravel-inertia`)

**Layers**

1. **Feature / HTTP tests** — `php artisan test` under `tests/Feature/`. Hit controllers with session auth; assert redirects, authorization (Policies), and Inertia page props where useful. Main non-browser safety net (Rails-like).
2. **Browser E2E** — Playwright against `artisan serve` + seeded SQLite. A smaller suite than PHP/Go today: login, feed/tag, publish. README prefers Playwright over Dusk for monorepo consistency.

**What they deliberately do not unit-test**

Inertia page components and Breeze leftovers as a Vitest/jsdom matrix. `AGENTS.md`: prefer Feature tests for server/policies; Playwright for a few UI flows; do not extract controllers solely for unit tests.

**Auth / DB / fixtures**

- **Auth:** Laravel session + CSRF; Feature tests authenticate via helpers; E2E uses the login form. Password reset exists (Breeze) — covered more in Feature tests than E2E so far.
- **DB:** RefreshDatabase / migrations for Feature tests; E2E seeds a dedicated DB per README.
- **CI:** README scripts; no monorepo-root workflow yet.

**Why it fits**

Laravel gives a cheap controller/Inertia assertion seam (like Rails integration tests). The React pages are still “real browser” territory for multi-step UI, so Playwright mirrors Hono/PHP/Go without introducing Dusk as a second browser stack.

---

## Cross-cutting comparison

**Shared philosophies**

- Prefer **real browser coverage** for multi-step Conduit flows over mock-heavy UI tests (Hono/PHP/Go/Laravel Playwright; Rails system tests).
- Keep a **fast, DB-backed** non-browser layer for data and/or HTTP rules (Rails controllers + Ability; Hono API contract; PHP repositories; Go sqlc + httptest; Laravel Feature + Policies).
- **SQLite everywhere**; E2E (or system) runs against a dedicated/fresh DB, not the developer’s long-lived file.
- **Seeded demo users** for browser flows; Rails additionally uses YAML fixtures for its integration/system suite.
- None treat full page/UI scripts as the primary unit-test target once a cheaper seam exists.

**Real differences**

| Dimension | Rails | Hono | PHP | Go + HTMX | Laravel |
| --- | --- | --- | --- | --- | --- |
| Middle request layer | Rich controller integration + HTML assertions | In-process API contract (JSON), not HTML | None by design | Light `httptest` (auth/CSRF) | Feature tests + Inertia prop assertions |
| Authorization tests | `Ability` unit + controller redirects | Pure `permissions` helpers + contract JSON | Inline in pages; E2E | Inline in handlers; E2E | Policy + Feature tests |
| Client / UI isolation | ERB via integration/`assert_select` | Vitest for thin seams | No page-script units | No template units | No Inertia page unit matrix |
| Browser tool | Capybara / Selenium | Playwright | Playwright | Playwright | Playwright |
| Auth under test | Signed session cookie | JWT / SPA login | Session + CSRF | Session + CSRF | Session + CSRF (+ reset) |
| Documented CI posture | GH Actions: `test` + `test:system` | README scripts | README scripts | README scripts | README scripts |

**How the product architecture drives the matrix**

- **SSR forms (Rails)** → controller integration is high leverage; system tests fill Turbo/mail gaps.
- **SPA + RealWorld API (Hono)** → contract + query tests own the server; Playwright owns pages; Vitest stays small.
- **Page scripts (PHP)** → repository PHPUnit + Playwright only.
- **Go + HTMX** → sqlc + thin httptest + Playwright; HTMX swaps covered in the browser.
- **Laravel + Inertia** → Feature/Policy tests like Rails; Playwright for a few React UI flows (not Dusk).

Test *volume* across stacks is not a quality score: the suites optimize for different seams and are not aligned to the same bar. Compare strategies by which layer answers which failure mode (wrong SQL, wrong HTTP contract, wrong form/CSRF/redirect, wrong SPA wiring), not by how large the trees are.
