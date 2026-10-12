# Conduit

A RealWorld implementation: React SPA, Hono API, SQLite, Drizzle.

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

`npm test` runs the API contract tests. `JWT_SECRET` overrides the development signing key.
