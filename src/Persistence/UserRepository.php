<?php

declare(strict_types=1);

namespace App\Persistence;

use PDO;

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

    public function create(string $email, string $username, string $passwordHash): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO users (email, username, password_hash)
             VALUES (:email, :username, :password_hash)'
        );
        $stmt->execute([
            'email' => $email,
            'username' => $username,
            'password_hash' => $passwordHash,
        ]);

        return (int) $this->pdo->lastInsertId();
    }
}
