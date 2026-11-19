-- name: ListGlobalArticles :many
SELECT a.id, a.title, a.description, a.slug, a.favorites_count, a.created_at,
       u.username AS author_username, u.image AS author_image
FROM articles a
INNER JOIN users u ON u.id = a.user_id
ORDER BY a.created_at DESC, a.id DESC
LIMIT ? OFFSET ?;

-- name: ListGlobalArticlesByTag :many
SELECT a.id, a.title, a.description, a.slug, a.favorites_count, a.created_at,
       u.username AS author_username, u.image AS author_image
FROM articles a
INNER JOIN users u ON u.id = a.user_id
INNER JOIN article_tags at ON at.article_id = a.id
INNER JOIN tags t ON t.id = at.tag_id
WHERE t.name = ? COLLATE NOCASE
ORDER BY a.created_at DESC, a.id DESC
LIMIT ? OFFSET ?;

-- name: CountGlobalArticles :one
SELECT COUNT(*) FROM articles;

-- name: CountGlobalArticlesByTag :one
SELECT COUNT(*)
FROM articles a
INNER JOIN article_tags at ON at.article_id = a.id
INNER JOIN tags t ON t.id = at.tag_id
WHERE t.name = ? COLLATE NOCASE;

-- name: ListFeedArticles :many
SELECT a.id, a.title, a.description, a.slug, a.favorites_count, a.created_at,
       u.username AS author_username, u.image AS author_image
FROM articles a
INNER JOIN users u ON u.id = a.user_id
INNER JOIN follows f ON f.followed_id = a.user_id
WHERE f.follower_id = ?
ORDER BY a.created_at DESC, a.id DESC
LIMIT ? OFFSET ?;

-- name: CountFeedArticles :one
SELECT COUNT(*)
FROM articles a
INNER JOIN follows f ON f.followed_id = a.user_id
WHERE f.follower_id = ?;

-- name: ListArticlesByAuthor :many
SELECT a.id, a.title, a.description, a.slug, a.favorites_count, a.created_at,
       u.username AS author_username, u.image AS author_image
FROM articles a
INNER JOIN users u ON u.id = a.user_id
WHERE a.user_id = ?
ORDER BY a.created_at DESC, a.id DESC
LIMIT ? OFFSET ?;

-- name: ListArticlesFavoritedBy :many
SELECT a.id, a.title, a.description, a.slug, a.favorites_count, a.created_at,
       u.username AS author_username, u.image AS author_image
FROM articles a
INNER JOIN users u ON u.id = a.user_id
INNER JOIN favorites fav ON fav.article_id = a.id
WHERE fav.user_id = ?
ORDER BY fav.created_at DESC, a.id DESC
LIMIT ? OFFSET ?;

-- name: GetArticleBySlug :one
SELECT a.id, a.user_id, a.title, a.description, a.body, a.slug, a.favorites_count,
       a.created_at, a.updated_at,
       u.username AS author_username, u.bio AS author_bio, u.image AS author_image
FROM articles a
INNER JOIN users u ON u.id = a.user_id
WHERE a.slug = ?;

-- name: CreateArticle :one
INSERT INTO articles (user_id, title, description, body, slug)
VALUES (?, ?, ?, ?, ?)
RETURNING *;

-- name: UpdateArticle :one
UPDATE articles
SET title = ?, description = ?, body = ?, slug = ?, updated_at = datetime('now')
WHERE id = ?
RETURNING *;

-- name: DeleteArticle :exec
DELETE FROM articles WHERE id = ?;

-- name: ArticleSlugExists :one
SELECT EXISTS(SELECT 1 FROM articles WHERE slug = ? AND id != ?);

-- name: IsFavorited :one
SELECT EXISTS(
  SELECT 1 FROM favorites WHERE user_id = ? AND article_id = ?
);

-- name: InsertFavorite :execrows
INSERT OR IGNORE INTO favorites (user_id, article_id)
VALUES (?, ?);

-- name: DeleteFavorite :execrows
DELETE FROM favorites WHERE user_id = ? AND article_id = ?;

-- name: IncrementFavoritesCount :exec
UPDATE articles SET favorites_count = favorites_count + 1 WHERE id = ?;

-- name: DecrementFavoritesCount :exec
UPDATE articles SET favorites_count = CASE WHEN favorites_count > 0 THEN favorites_count - 1 ELSE 0 END WHERE id = ?;

-- name: GetArticlePreviewByID :one
SELECT a.id, a.title, a.description, a.slug, a.favorites_count, a.created_at,
       u.username AS author_username, u.image AS author_image
FROM articles a
INNER JOIN users u ON u.id = a.user_id
WHERE a.id = ?;
