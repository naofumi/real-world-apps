-- name: ListGlobalArticles :many
SELECT p.* FROM article_previews p
ORDER BY p.created_at DESC, p.id DESC
LIMIT ? OFFSET ?;

-- name: ListGlobalArticlesByTag :many
SELECT p.* FROM article_previews p
INNER JOIN article_tags at ON at.article_id = p.id
INNER JOIN tags t ON t.id = at.tag_id
WHERE t.name = ? COLLATE NOCASE
ORDER BY p.created_at DESC, p.id DESC
LIMIT ? OFFSET ?;

-- name: ListFeedArticles :many
SELECT p.* FROM article_previews p
INNER JOIN follows f ON f.followed_id = p.user_id
WHERE f.follower_id = ?
ORDER BY p.created_at DESC, p.id DESC
LIMIT ? OFFSET ?;

-- name: ListArticlesByAuthor :many
SELECT p.* FROM article_previews p
WHERE p.user_id = ?
ORDER BY p.created_at DESC, p.id DESC
LIMIT ? OFFSET ?;

-- name: ListArticlesFavoritedBy :many
SELECT p.* FROM article_previews p
INNER JOIN favorites fav ON fav.article_id = p.id
WHERE fav.user_id = ?
ORDER BY fav.created_at DESC, p.id DESC
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

-- name: GetArticleSlugByID :one
SELECT slug FROM articles WHERE id = ?;

-- name: ListFavoritedArticleIDs :many
SELECT article_id FROM favorites
WHERE user_id = sqlc.arg(user_id) AND article_id IN (sqlc.slice(article_ids));
