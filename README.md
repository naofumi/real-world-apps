# RealWorld — PHP (no framework)

A [RealWorld](https://realworld-docs.netlify.app/) (Conduit) blogging app built with **PHP 8.4**, **PDO + SQLite**, and **plain PHP views**. Cookie sessions, server-rendered pages, no Laravel/Symfony/Slim.

Companions in this Project:

- Rails ERB — `real-world-app-rails-erb`
- React + Hono — `real-world-app-react-hono`

## Stack

| Piece | Choice |
| --- | --- |
| PHP | 8.4 (see `.php-version`) |
| Framework | None |
| HTTP | Front controller (`public/index.php`) + homemade router |
| DB | SQLite via PDO (`storage/conduit.sqlite3`) |
| Templates | Plain PHP views |
| Auth | Cookie sessions, `password_hash` / `password_verify`, CSRF tokens |
| Markdown | `league/commonmark` (ready for article bodies) |
| Autoload / tests | Composer PSR-4, PHPUnit |

## Setup

Needs [Composer](https://getcomposer.org/) **2.7+** (older Composer 2.4.x floods PHP 8.4 with deprecation notices from Composer itself). Check with `composer --version`; upgrade with `composer self-update`.

```bash
composer install
php bin/migrate
php bin/seed
```

## Run

```bash
php bin/dev
```

App: [http://127.0.0.1:8080](http://127.0.0.1:8080)

Seeded demo users (password `password`): `alice@example.com`, `bob@example.com`, `cara@example.com`.

## Tests

```bash
composer test
```

## Current surface

Scaffold covers home (global feed), sign-in, and sign-out. Article detail, editor, profiles, favorites, follows, tags, and comments are next.
