-- +goose Up
CREATE VIEW IF NOT EXISTS article_previews AS
SELECT a.id, a.user_id, a.title, a.description, a.slug, a.favorites_count, a.created_at,
       u.username AS author_username, u.image AS author_image
FROM articles a
INNER JOIN users u ON u.id = a.user_id;

-- +goose Down
DROP VIEW IF EXISTS article_previews;
