<?php

declare(strict_types=1);

namespace App\Persistence;

use PDO;

final class CommentRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function forArticle(int $articleId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT c.id, c.body, c.created_at, c.user_id,
                    u.username AS author_username, u.image AS author_image
             FROM comments c
             INNER JOIN users u ON u.id = c.user_id
             WHERE c.article_id = :article_id
             ORDER BY c.created_at ASC, c.id ASC'
        );
        $stmt->execute(['article_id' => $articleId]);

        /** @var list<array<string, mixed>> */
        return $stmt->fetchAll();
    }

    public function create(int $articleId, int $userId, string $body): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO comments (article_id, user_id, body)
             VALUES (:article_id, :user_id, :body)'
        );
        $stmt->execute([
            'article_id' => $articleId,
            'user_id' => $userId,
            'body' => $body,
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    /** @return array<string, mixed>|null */
    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT c.id, c.article_id, c.user_id, c.body, a.slug AS article_slug
             FROM comments c
             INNER JOIN articles a ON a.id = c.article_id
             WHERE c.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM comments WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
