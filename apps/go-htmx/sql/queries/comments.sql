-- name: ListCommentsForArticle :many
SELECT c.id, c.body, c.created_at, c.user_id,
       u.username AS author_username, u.image AS author_image
FROM comments c
INNER JOIN users u ON u.id = c.user_id
WHERE c.article_id = ?
ORDER BY c.created_at ASC, c.id ASC;

-- name: CreateComment :one
INSERT INTO comments (article_id, user_id, body)
VALUES (?, ?, ?)
RETURNING *;

-- name: GetCommentByID :one
SELECT * FROM comments WHERE id = ?;

-- name: DeleteComment :exec
DELETE FROM comments WHERE id = ?;
