# Testing strategies — five Conduit stacks

Qualitative comparison of how the RealWorld (Conduit) apps under `apps/` choose test layers. Based on each app’s stated strategy (`AGENTS.md`, README test sections, `.cursor/rules`, architecture/features docs, CI) and spot-checks of representative suites — not on test size or LoC.

For architecture and measured LoC across all five, see [`conduit-stacks.md`](./conduit-stacks.md). Rails / Hono / PHP deep dive: [`rails-hono-php.md`](./rails-hono-php.md).

| App | Path |
| --- | --- |
| Rails ERB | [`apps/rails-erb`](../../apps/rails-erb) |
| React + Hono | [`apps/react-hono`](../../apps/react-hono) |
| PHP page scripts | [`apps/php`](../../apps/php) |
| Laravel + Inertia | [`apps/laravel-inertia`](../../apps/laravel-inertia) |
| Go + HTMX | [`apps/go-htmx`](../../apps/go-htmx) |

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

## Laravel + Inertia (`apps/laravel-inertia`)

**Layers**

1. **Feature / HTTP** — PHPUnit under `tests/Feature/` (including `Auth/`). Hits controllers through the HTTP kernel with Inertia assertions (`assertInertia`) for props and shared auth state. Covers articles/social flows and lean register/login.
2. **Browser E2E** — Playwright (`e2e/*.spec.ts`) against `artisan serve` + seeded SQLite. Auth, feed, and article journeys on the real Inertia React pages.

**What they deliberately do not unit-test**

Full React page trees under jsdom with mocked Inertia. Pages are thin relative to a JWT SPA; Feature tests own prop contracts, Playwright owns browser wiring (same spirit as Hono’s “e2e over page mocks,” with a richer middle HTTP layer because Laravel provides one).

**Auth / DB / fixtures**

- **Auth:** Cookie session + CSRF. Feature tests use Laravel’s acting-as / HTTP session helpers; E2E logs in through the real forms.
- **DB:** RefreshDatabase (or migrate) on SQLite for Feature tests; E2E uses a dedicated seeded DB per Playwright config.
- **CI:** `php artisan test` and `npm run test:e2e` per README; no nested monorepo workflow yet.

**Why it fits**

Inertia keeps a real server HTML/JSON-prop seam, so Feature tests are high leverage (closer to Rails controller tests than to Hono’s pure JSON contract). The React pages still need Playwright for client navigation and form posts.

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

## Cross-cutting comparison

**Shared philosophies**

- Prefer **real browser coverage** for multi-step Conduit flows over mock-heavy UI tests (stated most clearly for Hono and PHP; Rails uses system tests for the same job; Go+HTMX follows Playwright).
- Keep a **fast, DB-backed** non-browser layer for data and/or HTTP rules (Rails controllers + Ability; Hono API contract/queries/permissions; PHP repositories; Go sqlc + httptest).
- **SQLite everywhere**; E2E (or system) runs against a dedicated/fresh DB, not the developer’s long-lived file.
- **Seeded demo users** for browser flows; Rails additionally uses YAML fixtures for its integration/system suite.
- None treat page/UI scripts as the primary unit-test target once a cheaper seam exists (or, for PHP/Go, once E2E owns the page story).

**Real differences**

| Dimension | Rails | Hono | PHP | Laravel + Inertia | Go + HTMX |
| --- | --- | --- | --- | --- | --- |
| Middle request layer | Rich controller integration + HTML assertions | In-process API contract (JSON), not HTML | None by design | Feature tests + Inertia prop assertions | Light `httptest` (auth/CSRF), not full HTML matrix |
| Authorization tests | `Ability` unit + controller redirects | Pure `permissions` helpers + contract JSON shapes | Inline in page scripts; exercised via E2E | Policies via Feature HTTP | Inline in handlers; E2E + occasional httptest |
| Client / UI isolation | ERB checked via integration/`assert_select` | Vitest only for thin seams | No page-script unit tests | No page-level Vitest; Playwright for React | No template unit tests |
| Browser tool | Capybara / Selenium (Rails system) | Playwright | Playwright | Playwright | Playwright |
| Auth under test | Signed session cookie (+ form in system) | JWT bearer / SPA login | Session cookie + CSRF forms | Session cookie + CSRF forms | Session cookie + CSRF forms |
| Documented CI posture | GH Actions: `test` + `test:system` | README scripts | README scripts | README scripts | README scripts |

**How the product architecture drives the matrix**

- **SSR forms (Rails)** → controller integration is high leverage; system tests fill Turbo/mail gaps.
- **SPA + RealWorld API (Hono)** → contract + query tests own the server; Playwright owns pages; Vitest stays small.
- **Page scripts (PHP)** → repository PHPUnit + Playwright only; avoiding a homemade controller-test harness is an explicit style choice.
- **Inertia (Laravel)** → Feature tests own props/authz; Playwright owns React page wiring.
- **Go + HTMX** → sqlc + thin httptest + Playwright; HTMX swaps covered in the browser like Turbo.

Test *volume* across stacks is not a quality score: the suites optimize for different seams and are not aligned to the same bar. Compare strategies by which layer answers which failure mode (wrong SQL, wrong HTTP contract, wrong form/CSRF/redirect, wrong SPA wiring), not by how large the trees are.
