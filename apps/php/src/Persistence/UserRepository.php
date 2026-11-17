<?php

declare(strict_types=1);

namespace App\Persistence;

use PDO;
use PDOException;

final class UserRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return array<string, mixed>|null */
    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, email, username, password_hash, bio, image, created_at, updated_at
             FROM users WHERE id = :id'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    /** @return array<string, mixed>|null */
    public function findByEmail(string $email): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, email, username, password_hash, bio, image, created_at, updated_at
             FROM users WHERE email = :email COLLATE NOCASE'
        );
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    /** @return array<string, mixed>|null */
    public function findByUsername(string $username): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, email, username, password_hash, bio, image, created_at, updated_at
             FROM users WHERE username = :username COLLATE NOCASE'
        );
        $stmt->execute(['username' => $username]);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    /**
     * @return array{ok: true, id: int}|array{ok: false, error: string}
     */
    public function create(string $email, string $username, string $passwordHash): array
    {
        try {
            $stmt = $this->pdo->prepare(
                'INSERT INTO users (email, username, password_hash)
                 VALUES (:email, :username, :password_hash)'
            );
            $stmt->execute([
                'email' => $email,
                'username' => $username,
                'password_hash' => $passwordHash,
            ]);

            return ['ok' => true, 'id' => (int) $this->pdo->lastInsertId()];
        } catch (PDOException $e) {
            return ['ok' => false, 'error' => $this->uniqueError($e, $email, $username)];
        }
    }

    /**
     * @return array{ok: true}|array{ok: false, error: string}
     */
    public function updateProfile(
        int $id,
        string $email,
        string $username,
        ?string $bio,
        ?string $image,
        ?string $passwordHash,
    ): array {
        try {
            if ($passwordHash !== null) {
                $stmt = $this->pdo->prepare(
                    'UPDATE users
                     SET email = :email, username = :username, bio = :bio, image = :image,
                         password_hash = :password_hash, updated_at = datetime(\'now\')
                     WHERE id = :id'
                );
                $stmt->execute([
                    'id' => $id,
                    'email' => $email,
                    'username' => $username,
                    'bio' => $bio,
                    'image' => $image,
                    'password_hash' => $passwordHash,
                ]);
            } else {
                $stmt = $this->pdo->prepare(
                    'UPDATE users
                     SET email = :email, username = :username, bio = :bio, image = :image,
                         updated_at = datetime(\'now\')
                     WHERE id = :id'
                );
                $stmt->execute([
                    'id' => $id,
                    'email' => $email,
                    'username' => $username,
                    'bio' => $bio,
                    'image' => $image,
                ]);
            }

            return ['ok' => true];
        } catch (PDOException $e) {
            return ['ok' => false, 'error' => $this->uniqueError($e, $email, $username)];
        }
    }

    public function isFollowing(int $followerId, int $followedId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM follows WHERE follower_id = :follower_id AND followed_id = :followed_id'
        );
        $stmt->execute([
            'follower_id' => $followerId,
            'followed_id' => $followedId,
        ]);

        return (bool) $stmt->fetchColumn();
    }

    public function follow(int $followerId, int $followedId): void
    {
        if ($followerId === $followedId) {
            return;
        }

        $stmt = $this->pdo->prepare(
            'INSERT OR IGNORE INTO follows (follower_id, followed_id)
             VALUES (:follower_id, :followed_id)'
        );
        $stmt->execute([
            'follower_id' => $followerId,
            'followed_id' => $followedId,
        ]);
    }

    public function unfollow(int $followerId, int $followedId): void
    {
        $stmt = $this->pdo->prepare(
            'DELETE FROM follows WHERE follower_id = :follower_id AND followed_id = :followed_id'
        );
        $stmt->execute([
            'follower_id' => $followerId,
            'followed_id' => $followedId,
        ]);
    }

    private function uniqueError(PDOException $e, string $email, string $username): string
    {
        $message = $e->getMessage();
        if (str_contains($message, 'users.email') || str_contains(strtolower($message), 'email')) {
            return 'email has already been taken';
        }
        if (str_contains($message, 'users.username') || str_contains(strtolower($message), 'username')) {
            return 'username has already been taken';
        }

        return 'could not save user';
    }
}
