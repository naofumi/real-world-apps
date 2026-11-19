-- name: ListPopularTags :many
SELECT t.name, COUNT(at.article_id) AS article_count
FROM tags t
INNER JOIN article_tags at ON at.tag_id = t.id
GROUP BY t.id
ORDER BY article_count DESC, t.name ASC
LIMIT ?;

-- name: GetOrCreateTag :one
INSERT INTO tags (name)
VALUES (?)
ON CONFLICT(name) DO UPDATE SET name = excluded.name
RETURNING *;

-- name: ClearArticleTags :exec
DELETE FROM article_tags WHERE article_id = ?;

-- name: AddArticleTag :exec
INSERT OR IGNORE INTO article_tags (article_id, tag_id)
VALUES (?, ?);

-- name: ListTagsForArticle :many
SELECT t.name
FROM tags t
INNER JOIN article_tags at ON at.tag_id = t.id
WHERE at.article_id = ?
ORDER BY t.name ASC;

-- name: ListAllArticleTags :many
SELECT at.article_id, t.name
FROM tags t
INNER JOIN article_tags at ON at.tag_id = t.id
ORDER BY at.article_id, t.name ASC;
