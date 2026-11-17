<?php

declare(strict_types=1);

namespace App\Tests;

use App\Persistence\Migrator;
use App\Persistence\PdoFactory;
use App\Persistence\UserRepository;
use App\Security\Password;
use PHPUnit\Framework\TestCase;

final class UserRepositoryTest extends TestCase
{
    public function testCreateAndFindByEmail(): void
    {
        $pdo = PdoFactory::make(':memory:');
        (new Migrator($pdo))->migrate();
        $users = new UserRepository($pdo);

        $result = $users->create('alice@example.com', 'alice', Password::hash('password'));
        self::assertTrue($result['ok']);

        $found = $users->findByEmail('ALICE@example.com');
        self::assertNotNull($found);
        self::assertSame($result['id'], (int) $found['id']);
        self::assertSame('alice', $found['username']);
        self::assertTrue(Password::verify('password', (string) $found['password_hash']));
    }

    public function testDuplicateEmailFails(): void
    {
        $pdo = PdoFactory::make(':memory:');
        (new Migrator($pdo))->migrate();
        $users = new UserRepository($pdo);

        self::assertTrue($users->create('alice@example.com', 'alice', Password::hash('password'))['ok']);
        $dup = $users->create('alice@example.com', 'alice2', Password::hash('password'));
        self::assertFalse($dup['ok']);
    }

    public function testFollowUnfollowAndIgnoreSelf(): void
    {
        $pdo = PdoFactory::make(':memory:');
        (new Migrator($pdo))->migrate();
        $users = new UserRepository($pdo);

        $alice = $users->create('alice@example.com', 'alice', Password::hash('password'));
        $bob = $users->create('bob@example.com', 'bob', Password::hash('password'));
        self::assertTrue($alice['ok']);
        self::assertTrue($bob['ok']);

        $users->follow($bob['id'], $bob['id']);
        self::assertFalse($users->isFollowing($bob['id'], $bob['id']));

        $users->follow($bob['id'], $alice['id']);
        self::assertTrue($users->isFollowing($bob['id'], $alice['id']));

        $users->unfollow($bob['id'], $alice['id']);
        self::assertFalse($users->isFollowing($bob['id'], $alice['id']));
    }
}
