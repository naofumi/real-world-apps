<?php

declare(strict_types=1);

namespace App\Tests;

use App\Persistence\ArticleRepository;
use App\Persistence\Migrator;
use App\Persistence\PdoFactory;
use App\Persistence\UserRepository;
use App\Security\Password;
use PHPUnit\Framework\TestCase;

final class ArticleRepositoryTest extends TestCase
{
    public function testCreateFindAndTagFilter(): void
    {
        $pdo = PdoFactory::make(':memory:');
        (new Migrator($pdo))->migrate();
        $users = new UserRepository($pdo);
        $articles = new ArticleRepository($pdo);

        $user = $users->create('alice@example.com', 'alice', Password::hash('password'));
        self::assertTrue($user['ok']);

        $created = $articles->create(
            $user['id'],
            'Hello PHP',
            'Desc',
            "Body with **markdown**",
            ['php', 'sqlite'],
        );
        self::assertTrue($created['ok']);

        $found = $articles->findBySlug($created['slug']);
        self::assertNotNull($found);
        self::assertSame('Hello PHP', $found['title']);
        self::assertSame(['php', 'sqlite'], $found['tags']);

        $tagged = $articles->listGlobal('php');
        self::assertCount(1, $tagged);
        self::assertSame('hello-php', $tagged[0]['slug']);
    }
}
