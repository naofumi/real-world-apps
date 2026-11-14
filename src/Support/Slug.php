<?php

declare(strict_types=1);

namespace App\Support;

final class Slug
{
    public static function from(string $title): string
    {
        $slug = strtolower(trim($title));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
        $slug = trim($slug, '-');

        return $slug !== '' ? $slug : 'article';
    }
}
