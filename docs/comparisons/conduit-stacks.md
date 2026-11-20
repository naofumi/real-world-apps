# Conduit stacks — five-way LoC and architecture

Same RealWorld (Conduit) product surface under `apps/`. Numbers are fresh `cloc` on current `main` (git-tracked sources). Exclusions: no `node_modules` / `vendor`, lockfiles, or generated Drizzle migration meta; **vendored Conduit Minimal CSS** and **sqlc-generated Go** are listed separately, not in application totals.

The older three-stack deep dive ([`rails-hono-php.md`](./rails-hono-php.md)) remains for Rails / Hono / PHP detail; prefer **this document** for cross-stack ordering and for Laravel + Go.

| App | Path |
| --- | --- |
| Rails ERB | [`apps/rails-erb`](../../apps/rails-erb) |
| Laravel + Inertia | [`apps/laravel-inertia`](../../apps/laravel-inertia) |
| PHP page scripts | [`apps/php`](../../apps/php) |
| Go + HTMX | [`apps/go-htmx`](../../apps/go-htmx) |
| React + Hono | [`apps/react-hono`](../../apps/react-hono) |

![Five-stack Conduit LoC poster](./images/conduit-stacks-loc.png)

*Poster of the tables below. Regenerator: [`images/generate_conduit_stacks_poster.py`](./images/generate_conduit_stacks_poster.py).*

## High-level LoC

**Application** = product server + UI (path buckets below). No vendored CSS, no tests, no sqlc `*.sql.go` / `models.go`.

| Bucket | Rails | Laravel | PHP | Go (hand) | Hono |
| --- | ---: | ---: | ---: | ---: | ---: |
| Application | ~1,082 | ~1,820 | ~1,891 | ~2,260 | ~3,028 |
| vs Rails | 1.0× | ~1.7× | ~1.7× | ~2.1× | ~2.8× |
| Tests | ~592 | ~265 | ~314 | ~293 | ~1,105 |
| Vendored Conduit CSS | 1,205 | 1,221 | 1,205 (+ glue `app.css`) | 1,205 | 1,205 |
| sqlc generated (Go only) | — | — | — | ~1,060 | — |

**Ordering (application):** Rails &lt; Laravel ≈ PHP &lt; Go (hand) &lt; Hono.  
If sqlc generated code is folded into Go, Go becomes the largest (~3,396) — that is **generated persistence**, not hand-written product logic; keep it out of the headline total the same way we exclude compiled assets.

### Method (path buckets)

| Stack | Server / persistence | Product UI / pages |
| --- | --- | --- |
| Rails | `app/models`, `controllers`, `helpers`, `jobs`, `mailers` | `app/views`, `javascript`, `application.css` |
| Laravel | `app/{Models,Http,Policies,Support,Providers}` + `routes/{web,auth}.php` | `resources/js` + `resources/views` (Blade shell) |
| PHP | `src/` | `public/*.php` + `includes/` (excl. CSS) |
| Go | `internal/{httpx,auth,config,slug}` + `internal/db/{open,db}.go` + `cmd/` + `sql/queries/` (excl. `*_test.go`, excl. sqlc gen) | `templates/` |
| Hono | `apps/api/src` + `packages/{db,contracts}/src` | `apps/web/src` excl. `*.test.*` and CSS |

### Server vs product UI

| Row | Rails | Laravel | PHP | Go (hand) | Hono |
| --- | ---: | ---: | ---: | ---: | ---: |
| Server / persistence | ~475 | ~880 | ~764 | ~1,767 | ~1,492 |
| Product UI / pages | ~587 | ~940 | ~1,127 | ~493 | ~1,536 |

**What you can read**

- **SSR HTML** (Rails, Go templates, PHP pages) keeps UI rows smaller than the **SPA** (Hono) except where PHP folds request logic into page files.
- **Laravel UI (~940) is below Hono (~1,536)** after dropping Breeze: live Conduit React pages + layout only; no dead Tailwind kit. Hono still carries SPA `lib/` (~299) and per-page fetch/mutate state.
- **Go templates (~493) are the smallest UI row** — markup + HTMX partials, no React. Go’s cost sits in the **server** row (handlers + hand SQL).
- **Laravel server (~880) sits between PHP (~764) and Hono (~1,492)** — Eloquent like Rails, but larger than Rails (see below).

**What you should not read**

- PHP’s UI row is not “frontend-only”: page scripts own CSRF, redirects, and auth checks that Rails/Laravel/Go keep in controllers/handlers.
- Go’s server row is not “2× Hono of SQL complexity” by itself — it includes chi wiring, render helpers, and session middleware; sqlc **generated** Go (~1,060) is excluded from these totals.
- Laravel’s server row is not “Eloquent needs more SQL than Active Record.” Both ORMs hide list/filter SQL; the gap is ceremony + Inertia prop shaping (next section).

## Architecture snapshot

| Concern | Rails ERB | Laravel + Inertia | PHP | Go + HTMX | React + Hono |
| --- | --- | --- | --- | --- | --- |
| Request story | Router → controller → ERB / Turbo | Router → controller → Inertia props → React | `public/*.php` page script | chi → handler → template / HTMX partial | Hono JSON `/api` → React SPA |
| Rendering | Server HTML + Hotwire | Inertia + React pages | Server HTML via includes | `html/template` + HTMX swaps | Client SPA (Router, Query) |
| Auth | Cookie session + CSRF; **password reset** | Cookie session + CSRF; lean register/login/logout/settings | Cookie session + CSRF | Cookie session + CSRF | JWT bearer (no CSRF) |
| Authority | CanCanCan `Ability` | Laravel Policies | Inline in page scripts | Inline in handlers | `permissions` in JSON |
| Data access | Active Record | Eloquent | PDO repositories (hand SQL) | sqlc from hand SQL | Drizzle schema + hand query modules |

Favorite UX: Rails Turbo Stream · Laravel Inertia visit · PHP redirect · Go HTMX partial · Hono client mutation.

## Laravel vs Rails — server gap (post-Breeze)

| | Rails | Laravel | Δ |
| --- | ---: | ---: | ---: |
| Server row | ~475 | ~880 | **~+405** |

Earlier notes (~+710) included a large **Breeze** auth suite (verify / confirm / reset controllers + fat `auth.php`). That surface is gone: Laravel auth is Hono-parity lean (`SessionController`, `RegisterController`, `routes/auth.php` ≈ **78** code lines). Rails still carries password-reset (`PasswordsController` + mailer); Laravel does not.

**Remaining drivers (not “ORM can’t query”):**

1. **Inertia prop-shaping (~half the remaining gap)** — Controllers build JSON-ish props (`Inertia::render` arrays, `canEdit` flags, comment maps, Markdown HTML). Example: `ArticleController` ~139 lines vs Rails `ArticlesController` ~67. Models add `toInertia` / `toFeedInertia` helpers Rails never needs because ERB reads associations.
2. **Denser Eloquent models (~+170 on the models bucket)** — Same domain graph; PHP relation methods, `$fillable`/`$casts`, boot hooks vs compact Active Record DSL (`Article.php` ~cloc  vs `article.rb` ~53–66 lines of substance).
3. **Policies + Support + routes** — Three policy classes vs one `Ability`; `Support\Pagination` + `Markdown`; slightly larger route files.

**Do not conclude** that Eloquent requires more hand SQL than Active Record for feeds/favorites. **Do conclude** that Inertia moves presentation serialization into the server row (and still leaves a real React UI row).

## Laravel vs Hono — UI counting (post-Breeze)

| | Laravel UI | Hono UI |
| --- | ---: | ---: |
| Product UI / pages row | ~940 | ~1,536 |

Breakdown (approx.):

| Slice | Laravel | Hono |
| --- | ---: | ---: |
| Product / auth pages | ~667 (`Pages/`) | pages under `features/` (majority of UI) |
| Shared layout / components | ~236 | shell + shared bits |
| SPA client lib / auth plumbing | — (props from Laravel) | ~299 (`lib/`) |
| Blade / entry shell | ~17 + `app.jsx` | `main.tsx` / `app.tsx` |

**Read carefully:**

- Pre-Breeze-drop Laravel UI looked near Hono (~1.6k) because **~500+ lines of unused Breeze layouts/components** sat in `resources/js`. Those are gone; the near-tie was an artifact.
- Live Laravel Conduit UI is **smaller** than Hono’s SPA UI. Laravel still pays some UI cost on the **server** (prop arrays); Hono pays fetch/cache/mutation lifecycle in the UI row instead.
- Auth pages are parity-sized now (login/register only on both); no forgot/verify/confirm on Laravel.

## Server / data access (who writes SQL)

| Style | Stacks | Article-area signal (approx. code lines) |
| --- | --- | --- |
| ORM (little hand SQL) | Rails, Laravel | Rails article model+controllers ~155; Laravel article model+controllers+policy ~381 (DTO/ceremony, not raw SQL) |
| Hand SQL in app code | PHP, Hono, Go | PHP `ArticleRepository` ~349; Hono `modules/articles` ~381; Go `sql/queries` articles+tags ~98 **plus** large handlers (~550 for article handlers/helpers) |

PHP repositories ≈ Hono query modules in *kind*. Go keeps SQL in `sql/queries/` and generates typed Go — headline Go totals **exclude** that generated layer (~1,060); including it double-counts persistence relative to PHP/Hono hand query code.

## Frontend / page weight (qualitative)

- **Smallest markup surface:** Go templates, then Rails ERB.
- **Middle:** Laravel Inertia pages (props in, forms out via Inertia) and PHP page scripts (SSR + inline request story).
- **Largest:** Hono SPA pages (client lifecycle). See character-count tables in [`rails-hono-php.md`](./rails-hono-php.md) for Rails/Hono/PHP screens; Laravel/Go follow the SSR-or-props pattern rather than SPA fetch loops.

## Testing (pointer)

Qualitative testing-layer comparison (all five, including Laravel Feature + Playwright): [`testing-strategies.md`](./testing-strategies.md).

## Takeaways

1. **Size order (application, hand-written):** Rails → Laravel ≈ PHP → Go → Hono.
2. **ORM stacks are not equal in LoC:** Rails stays smallest; Laravel’s extra server LoC after dropping Breeze is mostly **Inertia serialization + PHP/Eloquent ceremony**, not missing query power.
3. **Hand-SQL stacks** (PHP, Hono, Go) spend on persistence differently: PHP/Hono in repository/query modules; Go in sqlc SQL + fat handlers (generated Go excluded here).
4. **UI:** Go/Rails SSR markup are compact; Laravel React UI &lt; Hono SPA UI once Breeze dead code is gone; PHP pages look larger because they mix controller logic into `public/*.php`.
5. **Auth:** Cookie+CSRF everywhere except Hono (JWT). Password reset remains **Rails-only**.
