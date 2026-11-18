-- name: IsFollowing :one
SELECT EXISTS(
  SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = ?
);

-- name: InsertFollow :exec
INSERT OR IGNORE INTO follows (follower_id, followed_id)
VALUES (?, ?);

-- name: DeleteFollow :exec
DELETE FROM follows WHERE follower_id = ? AND followed_id = ?;
