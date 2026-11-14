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

        $id = $users->create('alice@example.com', 'alice', Password::hash('password'));
        $found = $users->findByEmail('ALICE@example.com');

        self::assertNotNull($found);
        self::assertSame($id, (int) $found['id']);
        self::assertSame('alice', $found['username']);
        self::assertTrue(Password::verify('password', (string) $found['password_hash']));
    }
}
