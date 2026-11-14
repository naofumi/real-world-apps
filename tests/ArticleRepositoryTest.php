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
    private ArticleRepository $articles;
    private UserRepository $users;
    /** @var array{ok: true, id: int} */
    private array $alice;
    /** @var array{ok: true, id: int} */
    private array $bob;

    protected function setUp(): void
    {
        $pdo = PdoFactory::make(':memory:');
        (new Migrator($pdo))->migrate();
        $this->users = new UserRepository($pdo);
        $this->articles = new ArticleRepository($pdo);

        $alice = $this->users->create('alice@example.com', 'alice', Password::hash('password'));
        $bob = $this->users->create('bob@example.com', 'bob', Password::hash('password'));
        self::assertTrue($alice['ok']);
        self::assertTrue($bob['ok']);
        $this->alice = $alice;
        $this->bob = $bob;
    }

    public function testCreateFindAndTagFilter(): void
    {
        $created = $this->articles->create(
            $this->alice['id'],
            'Hello PHP',
            'Desc',
            'Body with **markdown**',
            ['php', 'sqlite'],
        );
        self::assertTrue($created['ok']);

        $found = $this->articles->findBySlug($created['slug']);
        self::assertNotNull($found);
        self::assertSame('Hello PHP', $found['title']);
        self::assertSame(['php', 'sqlite'], $found['tags']);

        $tagged = $this->articles->listGlobal('php');
        self::assertCount(1, $tagged);
        self::assertSame('hello-php', $tagged[0]['slug']);
    }

    public function testUniqueSlugOnTitleCollision(): void
    {
        $first = $this->articles->create($this->alice['id'], 'Same Title', 'd', 'b', []);
        $second = $this->articles->create($this->bob['id'], 'Same Title', 'd', 'b', []);
        self::assertTrue($first['ok']);
        self::assertTrue($second['ok']);
        self::assertSame('same-title', $first['slug']);
        self::assertSame('same-title-2', $second['slug']);
    }

    public function testFavoriteIsIdempotentAndCounts(): void
    {
        $created = $this->articles->create($this->alice['id'], 'Fav Me', 'd', 'b', []);
        self::assertTrue($created['ok']);
        $article = $this->articles->findBySlug($created['slug']);
        self::assertNotNull($article);

        $this->articles->favorite($this->bob['id'], (int) $article['id']);
        $this->articles->favorite($this->bob['id'], (int) $article['id']);

        $again = $this->articles->findBySlug($created['slug']);
        self::assertNotNull($again);
        self::assertSame(1, (int) $again['favorites_count']);
        self::assertTrue($this->articles->isFavorited($this->bob['id'], (int) $article['id']));

        $this->articles->unfavorite($this->bob['id'], (int) $article['id']);
        $after = $this->articles->findBySlug($created['slug']);
        self::assertNotNull($after);
        self::assertSame(0, (int) $after['favorites_count']);
    }

    public function testFeedOnlyShowsFollowedAuthors(): void
    {
        $this->articles->create($this->alice['id'], 'Alice Post', 'd', 'b', []);
        $this->articles->create($this->bob['id'], 'Bob Post', 'd', 'b', []);
        $this->users->follow($this->bob['id'], $this->alice['id']);

        $feed = $this->articles->listFeed($this->bob['id']);
        self::assertCount(1, $feed);
        self::assertSame('alice-post', $feed[0]['slug']);
        self::assertSame(1, $this->articles->countFeed($this->bob['id']));
    }

    public function testListFavoritedBy(): void
    {
        $created = $this->articles->create($this->alice['id'], 'Starred', 'd', 'b', []);
        self::assertTrue($created['ok']);
        $article = $this->articles->findBySlug($created['slug']);
        self::assertNotNull($article);
        $this->articles->favorite($this->bob['id'], (int) $article['id']);

        $list = $this->articles->listFavoritedBy($this->bob['id']);
        self::assertCount(1, $list);
        self::assertSame('starred', $list[0]['slug']);
    }
}
