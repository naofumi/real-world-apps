<?php

declare(strict_types=1);

namespace App\Tests;

use App\Persistence\ArticleRepository;
use App\Persistence\CommentRepository;
use App\Persistence\Migrator;
use App\Persistence\PdoFactory;
use App\Persistence\UserRepository;
use App\Security\Password;
use PHPUnit\Framework\TestCase;

final class CommentRepositoryTest extends TestCase
{
    public function testCreateListAndDelete(): void
    {
        $pdo = PdoFactory::make(':memory:');
        (new Migrator($pdo))->migrate();
        $users = new UserRepository($pdo);
        $articles = new ArticleRepository($pdo);
        $comments = new CommentRepository($pdo);

        $alice = $users->create('alice@example.com', 'alice', Password::hash('password'));
        $bob = $users->create('bob@example.com', 'bob', Password::hash('password'));
        self::assertTrue($alice['ok']);
        self::assertTrue($bob['ok']);

        $created = $articles->create($alice['id'], 'Talk', 'd', 'b', []);
        self::assertTrue($created['ok']);
        $article = $articles->findBySlug($created['slug']);
        self::assertNotNull($article);

        $id = $comments->create((int) $article['id'], $bob['id'], 'Nice post');
        $rows = $comments->forArticle((int) $article['id']);
        self::assertCount(1, $rows);
        self::assertSame('Nice post', $rows[0]['body']);
        self::assertSame('bob', $rows[0]['author_username']);

        $found = $comments->findById($id);
        self::assertNotNull($found);
        self::assertSame('talk', $found['article_slug']);

        $comments->delete($id);
        self::assertSame([], $comments->forArticle((int) $article['id']));
    }
}
