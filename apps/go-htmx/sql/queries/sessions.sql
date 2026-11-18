-- name: CreateSession :one
INSERT INTO sessions (token, user_id, csrf_token, expires_at)
VALUES (?, ?, ?, ?)
RETURNING *;

-- name: GetSessionByToken :one
SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now');

-- name: DeleteSession :exec
DELETE FROM sessions WHERE token = ?;

-- name: DeleteExpiredSessions :exec
DELETE FROM sessions WHERE expires_at <= datetime('now');
