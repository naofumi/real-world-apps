<?php

declare(strict_types=1);

namespace App\Support;

use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\MarkdownConverter;

final class Markdown
{
    private static ?MarkdownConverter $converter = null;

    public static function toHtml(string $markdown): string
    {
        return self::converter()->convert($markdown)->getContent();
    }

    private static function converter(): MarkdownConverter
    {
        if (self::$converter !== null) {
            return self::$converter;
        }

        $environment = new Environment([
            'html_input' => 'strip',
            'allow_unsafe_links' => false,
        ]);
        $environment->addExtension(new CommonMarkCoreExtension());
        self::$converter = new MarkdownConverter($environment);

        return self::$converter;
    }
}
