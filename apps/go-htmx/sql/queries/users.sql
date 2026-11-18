-- name: CreateUser :one
INSERT INTO users (email, username, password_hash, bio, image)
VALUES (?, ?, ?, ?, ?)
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = ?;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = ? COLLATE NOCASE;

-- name: GetUserByUsername :one
SELECT * FROM users WHERE username = ? COLLATE NOCASE;

-- name: UpdateUser :one
UPDATE users
SET email = ?,
    username = ?,
    password_hash = ?,
    bio = ?,
    image = ?,
    updated_at = datetime('now')
WHERE id = ?
RETURNING *;
