# Conduit

A RealWorld implementation: React SPA, Hono API, SQLite, Drizzle.

Part of the [`real-world-apps`](../../) monorepo. Companions: [`../rails-erb`](../rails-erb), [`../php`](../php).

Run all commands from this directory (`apps/react-hono`). This package is its own npm workspaces root (`apps/*` and `packages/*` here are relative to this folder).

The HTTP API matches the [RealWorld contract](https://docs.realworld.show/specifications/backend/introduction/) (`/api/...`, `Authorization: Token <jwt>`, the documented JSON shapes and error bodies). Domain modules sit behind that adapter. Each module writes only its own tables. Screens that need a join, such as an article card with its author, live in a query file.

| Module | Writes |
| --- | --- |
| Identity | `users` |
| Profiles | `follows` |
| Articles | `articles`, `tags`, `article_tags`, `favorites` |
| Comments | `comments` |

## Run

```bash
npm install
npm run db:seed
npm run dev
```

The app is at http://127.0.0.1:5173. The API is at http://127.0.0.1:8787.

Seeded accounts, password `password123`:

- `demo@realworld.local`
- `jane@realworld.local`
- `anika@realworld.local`

`JWT_SECRET` overrides the development signing key.

## Tests

```bash
npm test
npm run test:e2e
```

`npm test` runs the API tests, then the web tests.

The API tests use an in-memory SQLite database. `apps/api/test/contract.test.ts` walks the RealWorld HTTP workflows. `apps/api/test/queries.test.ts` checks article queries and writes, and rolls the transaction back after each test. The web Vitest suite covers thin presenters and lib helpers (no page-level API mocks).

`npm run test:e2e` runs Playwright against the real API and the real React app. It deletes `data/e2e.sqlite`, seeds it, and starts the API on port 8797 and the web app on port 4173. Those processes are separate from `npm run dev`. Install the browser once with `npx playwright install chromium`.

| Spec | What it checks |
| --- | --- |
| `e2e/auth.spec.ts` | A wrong password, a rejected token, and a server error on the current user |
| `e2e/feed.spec.ts` | Empty Your Feed, followed-author Your Feed, and tag-filtered home |
| `e2e/profile.spec.ts` | Authored vs favorited profile tabs show different lists |
| `e2e/article.spec.ts` | The author sees Edit Article, and someone else sees Follow |
| `e2e/favorite.spec.ts` | Guest → login, detail favorite/unfavorite + reload, feed preview count without reload |
| `e2e/editor.spec.ts` | Create publishes, edit own saves, edit others is refused |
