<?php

declare(strict_types=1);

namespace App\Tests;

use App\Support\Slug;
use PHPUnit\Framework\TestCase;

final class SlugTest extends TestCase
{
    public function testFromTitle(): void
    {
        self::assertSame('a-vanilla-php-stack', Slug::from('A Vanilla PHP Stack'));
        self::assertSame('article', Slug::from('@@@'));
    }
}
