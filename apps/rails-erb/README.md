# RealWorld — Rails ERB

A [RealWorld](https://realworld-docs.netlify.app/) (Conduit) blogging app built with **Rails 8**, **ERB**, and **Hotwire**. Cookie sessions, server-rendered pages, and Turbo Streams for favorite/follow toggles — no SPA client.

Part of the [`real-world-apps`](../../) monorepo. Companions: [`../react-hono`](../react-hono), [`../php`](../php).

Run all commands from this directory (`apps/rails-erb`).

## Stack

| Piece | Choice |
| --- | --- |
| Ruby | 4.0.4 (see `.ruby-version`) |
| Rails | ~> 8.1 |
| DB | SQLite (`storage/*.sqlite3`) |
| Front end | Propshaft, importmap, Turbo, Stimulus |
| Auth | `has_secure_password`, signed-cookie sessions |
| Markdown | Commonmarker (article bodies; sanitized in views) |

## Setup

```bash
bin/setup --skip-server
```

That installs gems and prepares the database. To wipe and reseeds as part of setup:

```bash
bin/setup --reset --skip-server
```

## Run

```bash
bin/dev
```

App: [http://localhost:3000](http://localhost:3000)

Seeded demo users (password `password`): `alice@example.com`, `bob@example.com`, `cara@example.com`.

```bash
bin/rails db:seed
# or reset + seed:
bin/rails db:reset
```

## Tests & CI

```bash
bin/rails test
bin/rails test:system   # Capybara + Selenium; optional in CI
bin/ci                  # setup, RuboCop, bundler-audit, importmap audit, Brakeman, tests, seed replant
```

## What’s implemented

- Global feed, tag filter, and following feed
- Articles (CRUD, slugs, Markdown body, pagination)
- Comments, favorites, follows
- Registration, login/logout, settings, password reset
- Profiles (authored articles + favorited articles)

Routes live in `config/routes.rb`. Controllers under `app/controllers/`; templates under `app/views/`.
