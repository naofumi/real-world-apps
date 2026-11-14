<?php

declare(strict_types=1);

namespace App\Tests;

use App\App;
use App\Http\Request;
use App\Persistence\Migrator;
use App\Persistence\PdoFactory;
use App\Security\Password;
use PHPUnit\Framework\TestCase;

final class AppHomeTest extends TestCase
{
    public function testHomeRendersGlobalFeed(): void
    {
        $pdo = PdoFactory::make(':memory:');
        (new Migrator($pdo))->migrate();
        $pdo->prepare(
            'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)'
        )->execute(['alice@example.com', 'alice', Password::hash('password')]);
        $userId = (int) $pdo->lastInsertId();
        $pdo->prepare(
            'INSERT INTO articles (user_id, title, description, body, slug)
             VALUES (?, ?, ?, ?, ?)'
        )->execute([$userId, 'Hello', 'Desc', 'Body', 'hello']);

        $app = new App($pdo);
        $response = $app->handle(new Request('GET', '/', [], [], [], []));

        self::assertSame(200, $response->status);
        self::assertStringContainsString('Hello', $response->body);
        self::assertStringContainsString('alice', $response->body);
        self::assertStringContainsString('conduit', $response->body);
    }
}
