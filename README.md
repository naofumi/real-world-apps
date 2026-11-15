# RealWorld — PHP page scripts

A [RealWorld](https://realworld-docs.netlify.app/) (Conduit) blogging app in **PHP 8.4** with **no framework and no app router**. Each URL is a real PHP file under `public/`; the web server does the routing. Data access is **PDO + SQLite**.

Companions:

- Rails ERB — `real-world-app-rails-erb`
- React + Hono — `real-world-app-react-hono`

Agent coding norms: [`AGENTS.md`](./AGENTS.md) and [`.cursor/rules/`](./.cursor/rules/).

## Stack

| Piece | Choice |
| --- | --- |
| PHP | 8.4 (`.php-version`) |
| Routing | Page scripts (`/login.php`, `/article.php?slug=…`) |
| Shared boot | `includes/bootstrap.php` |
| DB | SQLite via PDO (`storage/conduit.sqlite3`) |
| Templates | `include` header/footer + page HTML |
| Auth | Cookie sessions, `password_hash`, CSRF |
| Markdown | `league/commonmark` |
| Tests | PHPUnit against repositories |

## Setup

Needs [Composer](https://getcomposer.org/) **2.7+** (`composer --version`; upgrade with `composer self-update`).

```bash
composer install
php bin/migrate
php bin/seed
```

## Run

```bash
php bin/dev
```

App: [http://127.0.0.1:8080](http://127.0.0.1:8080) — built-in server serves files in `public/` directly (no rewrite router).

Seeded users (password `password`): `alice@example.com`, `bob@example.com`, `cara@example.com`.

## Layout

```text
public/           # web root — one script per action/page
includes/         # bootstrap, header, footer, partials
src/Persistence/  # PDO repositories
src/Security/     # session, csrf, password
src/Support/      # slug, markdown, paths
sql/              # schema
bin/              # migrate, seed, dev
```

## Tests

Repository PHPUnit (in-memory SQLite):

```bash
composer test
```

Playwright E2E against a fresh `storage/e2e.sqlite3` and `php -S` on port 8081:

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

E2E covers auth, feeds/tags, article publish, favorite, follow, and comments. Page scripts stay unextracted — flows are asserted in the browser instead of a custom request harness.

