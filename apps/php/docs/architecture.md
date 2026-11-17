# Architecture

Visual map for agents and humans new to this Conduit PHP app. Coding norms stay in [`AGENTS.md`](../AGENTS.md) and [`.cursor/rules/`](../.cursor/rules/).

## Request stack

The web server maps the URL to a file under `public/`. There is no app-level router. Shared boot lives in `includes/bootstrap.php`.

```mermaid
flowchart TB
  browser[Browser]
  server["php -S -t public\n(bin/dev)"]
  page["public/*.php\npage script"]
  boot["includes/bootstrap.php"]
  security["src/Security\nSession, Csrf"]
  persist["src/Persistence\n*Repository"]
  html["includes/\nheader, partials, footer"]
  db[("SQLite\nstorage/*.sqlite3")]

  browser -->|HTTP| server
  server -->|open matching .php file| page
  page -->|require| boot
  boot --> security
  boot --> persist
  persist --> db
  page -->|GET pages require| html
```

GET pages load data, set chrome variables (`$title`, `$viewer`, `$csrfToken`), then `require` the HTML includes. POST siblings such as `article_favorite.php` act and redirect without rendering a full layout.

## Favorite POST walkthrough

Example of a mutating page script. Source of truth: `public/article_favorite.php` plus helpers in `includes/bootstrap.php`.

```mermaid
sequenceDiagram
  actor User
  participant Form as article.php form
  participant Fav as article_favorite.php
  participant Boot as bootstrap.php
  participant Csrf as Csrf
  participant Sess as Session
  participant Users as UserRepository
  participant Arts as ArticleRepository
  participant DB as SQLite

  User->>Form: POST favorite
  Form->>Fav: slug, _csrf
  Fav->>Boot: require
  Boot->>Sess: start
  Boot->>Arts: new ArticleRepository
  Boot->>Users: new UserRepository
  Fav->>Fav: require_post()
  Fav->>Csrf: require_csrf($csrf)
  Fav->>Sess: require_login → userId
  Sess->>Users: findById
  Users->>DB: SELECT users
  Fav->>Arts: findBySlug(slug)
  Arts->>DB: SELECT articles
  Fav->>Arts: favorite(viewerId, articleId)
  Arts->>DB: INSERT favorites / bump count
  Fav-->>User: 302 /article.php?slug=…
```

Other POST endpoints (`follow.php`, `comment_create.php`, `login.php`, and similar) follow the same shape. Guard, load, mutate through a repository, redirect.

## Data model

Tables and foreign keys from `sql/schema.sql`.

```mermaid
erDiagram
  users ||--o{ articles : writes
  users ||--o{ comments : writes
  users ||--o{ favorites : marks
  users ||--o{ follows : "follower_id"
  users ||--o{ follows : "followed_id"
  articles ||--o{ comments : has
  articles ||--o{ favorites : receives
  articles ||--o{ article_tags : tagged
  tags ||--o{ article_tags : used

  users {
    int id PK
    text email UK
    text username UK
    text password_hash
    text bio
    text image
  }

  articles {
    int id PK
    int user_id FK
    text title
    text description
    text body
    text slug UK
    int favorites_count
  }

  comments {
    int id PK
    int article_id FK
    int user_id FK
    text body
  }

  favorites {
    int id PK
    int user_id FK
    int article_id FK
  }

  follows {
    int id PK
    int follower_id FK
    int followed_id FK
  }

  tags {
    int id PK
    text name UK
  }

  article_tags {
    int article_id PK_FK
    int tag_id PK_FK
  }
```

Repositories under `src/Persistence/` run SQL against these tables and return associative arrays for the page scripts. They are not rich domain entities.
