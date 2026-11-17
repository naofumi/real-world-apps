<?php

declare(strict_types=1);

namespace App\Persistence;

use App\Support\Slug;
use PDO;

final class ArticleRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listGlobal(?string $tag = null, int $limit = 20, int $offset = 0): array
    {
        if ($tag !== null && $tag !== '') {
            $sql = 'SELECT a.id, a.title, a.description, a.slug, a.favorites_count,
                           a.created_at, u.username AS author_username, u.image AS author_image
                    FROM articles a
                    INNER JOIN users u ON u.id = a.user_id
                    INNER JOIN article_tags at ON at.article_id = a.id
                    INNER JOIN tags t ON t.id = at.tag_id
                    WHERE t.name = :tag COLLATE NOCASE
                    ORDER BY a.created_at DESC, a.id DESC
                    LIMIT :limit OFFSET :offset';
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue('tag', $tag);
        } else {
            $sql = 'SELECT a.id, a.title, a.description, a.slug, a.favorites_count,
                           a.created_at, u.username AS author_username, u.image AS author_image
                    FROM articles a
                    INNER JOIN users u ON u.id = a.user_id
                    ORDER BY a.created_at DESC, a.id DESC
                    LIMIT :limit OFFSET :offset';
            $stmt = $this->pdo->prepare($sql);
        }

        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        /** @var list<array<string, mixed>> $rows */
        $rows = $stmt->fetchAll();
        return $this->attachTags($rows);
    }

    public function countGlobal(?string $tag = null): int
    {
        if ($tag !== null && $tag !== '') {
            $stmt = $this->pdo->prepare(
                'SELECT COUNT(*)
                 FROM articles a
                 INNER JOIN article_tags at ON at.article_id = a.id
                 INNER JOIN tags t ON t.id = at.tag_id
                 WHERE t.name = :tag COLLATE NOCASE'
            );
            $stmt->execute(['tag' => $tag]);
            return (int) $stmt->fetchColumn();
        }

        return (int) $this->pdo->query('SELECT COUNT(*) FROM articles')->fetchColumn();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listFeed(int $viewerId, int $limit = 20, int $offset = 0): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT a.id, a.title, a.description, a.slug, a.favorites_count,
                    a.created_at, u.username AS author_username, u.image AS author_image
             FROM articles a
             INNER JOIN users u ON u.id = a.user_id
             INNER JOIN follows f ON f.followed_id = a.user_id
             WHERE f.follower_id = :viewer_id
             ORDER BY a.created_at DESC, a.id DESC
             LIMIT :limit OFFSET :offset'
        );
        $stmt->bindValue('viewer_id', $viewerId, PDO::PARAM_INT);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        /** @var list<array<string, mixed>> $rows */
        $rows = $stmt->fetchAll();
        return $this->attachTags($rows);
    }

    public function countFeed(int $viewerId): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*)
             FROM articles a
             INNER JOIN follows f ON f.followed_id = a.user_id
             WHERE f.follower_id = :viewer_id'
        );
        $stmt->execute(['viewer_id' => $viewerId]);
        return (int) $stmt->fetchColumn();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listByAuthor(int $authorId, int $limit = 20, int $offset = 0): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT a.id, a.title, a.description, a.slug, a.favorites_count,
                    a.created_at, u.username AS author_username, u.image AS author_image
             FROM articles a
             INNER JOIN users u ON u.id = a.user_id
             WHERE a.user_id = :author_id
             ORDER BY a.created_at DESC, a.id DESC
             LIMIT :limit OFFSET :offset'
        );
        $stmt->bindValue('author_id', $authorId, PDO::PARAM_INT);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        /** @var list<array<string, mixed>> $rows */
        $rows = $stmt->fetchAll();
        return $this->attachTags($rows);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listFavoritedBy(int $userId, int $limit = 20, int $offset = 0): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT a.id, a.title, a.description, a.slug, a.favorites_count,
                    a.created_at, u.username AS author_username, u.image AS author_image
             FROM articles a
             INNER JOIN users u ON u.id = a.user_id
             INNER JOIN favorites fav ON fav.article_id = a.id
             WHERE fav.user_id = :user_id
             ORDER BY fav.created_at DESC, a.id DESC
             LIMIT :limit OFFSET :offset'
        );
        $stmt->bindValue('user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        /** @var list<array<string, mixed>> $rows */
        $rows = $stmt->fetchAll();
        return $this->attachTags($rows);
    }

    /** @return array<string, mixed>|null */
    public function findBySlug(string $slug): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT a.id, a.user_id, a.title, a.description, a.body, a.slug, a.favorites_count,
                    a.created_at, a.updated_at,
                    u.username AS author_username, u.bio AS author_bio, u.image AS author_image
             FROM articles a
             INNER JOIN users u ON u.id = a.user_id
             WHERE a.slug = :slug'
        );
        $stmt->execute(['slug' => $slug]);
        $row = $stmt->fetch();
        if ($row === false) {
            return null;
        }

        $row['tags'] = $this->tagsForArticle((int) $row['id']);
        return $row;
    }

    /**
     * @param list<string> $tags
     * @return array{ok: true, slug: string}|array{ok: false, error: string}
     */
    public function create(int $userId, string $title, string $description, string $body, array $tags): array
    {
        $base = Slug::from($title);
        $slug = $this->uniqueSlug($base);

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare(
                'INSERT INTO articles (user_id, title, description, body, slug)
                 VALUES (:user_id, :title, :description, :body, :slug)'
            );
            $stmt->execute([
                'user_id' => $userId,
                'title' => $title,
                'description' => $description,
                'body' => $body,
                'slug' => $slug,
            ]);
            $articleId = (int) $this->pdo->lastInsertId();
            $this->syncTags($articleId, $tags);
            $this->pdo->commit();

            return ['ok' => true, 'slug' => $slug];
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            return ['ok' => false, 'error' => 'could not publish article'];
        }
    }

    /**
     * @param list<string> $tags
     * @return array{ok: true, slug: string}|array{ok: false, error: string}
     */
    public function update(int $articleId, string $title, string $description, string $body, array $tags, string $currentSlug): array
    {
        $slug = $currentSlug;
        $desired = Slug::from($title);
        if ($desired !== $currentSlug) {
            $slug = $this->uniqueSlug($desired, $articleId);
        }

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare(
                'UPDATE articles
                 SET title = :title, description = :description, body = :body, slug = :slug,
                     updated_at = datetime(\'now\')
                 WHERE id = :id'
            );
            $stmt->execute([
                'id' => $articleId,
                'title' => $title,
                'description' => $description,
                'body' => $body,
                'slug' => $slug,
            ]);
            $this->pdo->prepare('DELETE FROM article_tags WHERE article_id = :id')->execute(['id' => $articleId]);
            $this->syncTags($articleId, $tags);
            $this->pdo->commit();

            return ['ok' => true, 'slug' => $slug];
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            return ['ok' => false, 'error' => 'could not update article'];
        }
    }

    public function delete(int $articleId): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM articles WHERE id = :id');
        $stmt->execute(['id' => $articleId]);
    }

    public function isFavorited(int $userId, int $articleId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM favorites WHERE user_id = :user_id AND article_id = :article_id'
        );
        $stmt->execute(['user_id' => $userId, 'article_id' => $articleId]);
        return (bool) $stmt->fetchColumn();
    }

    public function favorite(int $userId, int $articleId): void
    {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare(
                'INSERT OR IGNORE INTO favorites (user_id, article_id)
                 VALUES (:user_id, :article_id)'
            );
            $stmt->execute(['user_id' => $userId, 'article_id' => $articleId]);
            if ($stmt->rowCount() > 0) {
                $this->pdo->prepare(
                    'UPDATE articles SET favorites_count = favorites_count + 1 WHERE id = :id'
                )->execute(['id' => $articleId]);
            }
            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function unfavorite(int $userId, int $articleId): void
    {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare(
                'DELETE FROM favorites WHERE user_id = :user_id AND article_id = :article_id'
            );
            $stmt->execute(['user_id' => $userId, 'article_id' => $articleId]);
            if ($stmt->rowCount() > 0) {
                $this->pdo->prepare(
                    'UPDATE articles SET favorites_count = MAX(favorites_count - 1, 0) WHERE id = :id'
                )->execute(['id' => $articleId]);
            }
            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * @return list<string>
     */
    public function popularTags(int $limit = 20): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT t.name, COUNT(*) AS c
             FROM tags t
             INNER JOIN article_tags at ON at.tag_id = t.id
             GROUP BY t.id
             ORDER BY c DESC, t.name ASC
             LIMIT :limit'
        );
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        $names = [];
        foreach ($stmt->fetchAll() as $row) {
            $names[] = (string) $row['name'];
        }

        return $names;
    }

    /**
     * @param list<array<string, mixed>> $rows
     * @return list<array<string, mixed>>
     */
    private function attachTags(array $rows): array
    {
        if ($rows === []) {
            return $rows;
        }

        $ids = array_map(static fn (array $row): int => (int) $row['id'], $rows);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $this->pdo->prepare(
            "SELECT at.article_id, t.name
             FROM article_tags at
             INNER JOIN tags t ON t.id = at.tag_id
             WHERE at.article_id IN ($placeholders)
             ORDER BY t.name ASC"
        );
        $stmt->execute($ids);

        $map = [];
        foreach ($stmt->fetchAll() as $tagRow) {
            $map[(int) $tagRow['article_id']][] = (string) $tagRow['name'];
        }

        foreach ($rows as &$row) {
            $row['tags'] = $map[(int) $row['id']] ?? [];
        }

        return $rows;
    }

    /** @return list<string> */
    private function tagsForArticle(int $articleId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT t.name
             FROM tags t
             INNER JOIN article_tags at ON at.tag_id = t.id
             WHERE at.article_id = :id
             ORDER BY t.name ASC'
        );
        $stmt->execute(['id' => $articleId]);
        return array_map(static fn (array $r): string => (string) $r['name'], $stmt->fetchAll());
    }

    /** @param list<string> $tags */
    private function syncTags(int $articleId, array $tags): void
    {
        $find = $this->pdo->prepare('SELECT id FROM tags WHERE name = :name COLLATE NOCASE');
        $insertTag = $this->pdo->prepare('INSERT INTO tags (name) VALUES (:name)');
        $link = $this->pdo->prepare(
            'INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (:article_id, :tag_id)'
        );

        $seen = [];
        foreach ($tags as $raw) {
            $name = strtolower(trim($raw));
            if ($name === '' || isset($seen[$name])) {
                continue;
            }
            $seen[$name] = true;

            $find->execute(['name' => $name]);
            $tagId = $find->fetchColumn();
            if ($tagId === false) {
                $insertTag->execute(['name' => $name]);
                $tagId = (int) $this->pdo->lastInsertId();
            } else {
                $tagId = (int) $tagId;
            }

            $link->execute(['article_id' => $articleId, 'tag_id' => $tagId]);
        }
    }

    private function uniqueSlug(string $base, ?int $exceptId = null): string
    {
        $slug = $base;
        $i = 2;
        while ($this->slugTaken($slug, $exceptId)) {
            $slug = $base . '-' . $i;
            $i++;
        }

        return $slug;
    }

    private function slugTaken(string $slug, ?int $exceptId): bool
    {
        if ($exceptId === null) {
            $stmt = $this->pdo->prepare('SELECT 1 FROM articles WHERE slug = :slug');
            $stmt->execute(['slug' => $slug]);
        } else {
            $stmt = $this->pdo->prepare('SELECT 1 FROM articles WHERE slug = :slug AND id != :id');
            $stmt->execute(['slug' => $slug, 'id' => $exceptId]);
        }

        return (bool) $stmt->fetchColumn();
    }
}
