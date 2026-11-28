-- name: CreateSession :one
INSERT INTO sessions (token, user_id, csrf_token, expires_at)
VALUES (?, ?, ?, ?)
RETURNING *;

-- name: GetSessionUser :one
SELECT sqlc.embed(users), sessions.csrf_token
FROM sessions
INNER JOIN users ON users.id = sessions.user_id
WHERE sessions.token = ? AND sessions.expires_at > datetime('now');

-- name: DeleteSession :exec
DELETE FROM sessions WHERE token = ?;

-- name: DeleteExpiredSessions :exec
DELETE FROM sessions WHERE expires_at <= datetime('now');
