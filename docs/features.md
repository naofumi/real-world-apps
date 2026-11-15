# Conduit surface inventory

Reference for which [RealWorld](https://realworld-docs.netlify.app/) (Conduit) capabilities this PHP port implements. Product behavior follows the RealWorld family. This page maps those capabilities to `public/*.php` and `e2e/*.spec.ts`.

Structure and request flow live in [`architecture.md`](./architecture.md). Agent coding norms live in [`../AGENTS.md`](../AGENTS.md).

## Inventory

| Capability | Page scripts | E2E |
| --- | --- | --- |
| Register | `register.php` | (none yet) |
| Sign in / sign out | `login.php`, `logout.php` | `auth.spec.ts` |
| Global feed | `index.php` | `feed.spec.ts` |
| Your feed (followed authors) | `feed.php` | `feed.spec.ts` |
| Tag filter on the home feed | `index.php` | `feed.spec.ts` |
| Read article | `article.php` | `article.spec.ts` |
| Create article | `article_new.php` | `article.spec.ts` |
| Edit article | `article_edit.php` | `article.spec.ts` |
| Delete article | `article_delete.php` | (none yet) |
| Favorite / unfavorite | `article_favorite.php`, `article_unfavorite.php` | `favorite.spec.ts` |
| Comment create / delete | `comment_create.php`, `comment_delete.php` | `comment.spec.ts` (create) |
| Profile (authored articles) | `profile.php` | `profile.spec.ts` |
| Profile favorites tab | `profile_favorites.php` | `profile.spec.ts` |
| Follow / unfollow | `follow.php`, `unfollow.php` | `profile.spec.ts` |
| Settings (profile edit) | `settings.php` | (none yet) |

Every mutating page above expects POST plus CSRF except where the script is GET-only chrome (`index.php`, `feed.php`, `article.php`, `profile.php`, `profile_favorites.php`, and the GET forms of `login.php`, `register.php`, `settings.php`, `article_new.php`, `article_edit.php`).

## Non-goals for this port

- No JWT JSON API. This companion is server-rendered HTML only.
- No app-level router. URLs are real files under `public/` with query strings (`article.php?slug=…`, `profile.php?username=…`).
- No framework (Laravel, Symfony, Slim) and no ORM.

## Page script index

Complete list under `public/` (18 scripts):

`article.php`, `article_delete.php`, `article_edit.php`, `article_favorite.php`, `article_new.php`, `article_unfavorite.php`, `comment_create.php`, `comment_delete.php`, `feed.php`, `follow.php`, `index.php`, `login.php`, `logout.php`, `profile.php`, `profile_favorites.php`, `register.php`, `settings.php`, `unfollow.php`.
