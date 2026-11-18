<?php

namespace App\Support;

use League\CommonMark\CommonMarkConverter;

class Markdown
{
    public static function toHtml(string $markdown): string
    {
        $converter = new CommonMarkConverter([
            'html_input' => 'strip',
            'allow_unsafe_links' => false,
        ]);

        return (string) $converter->convert($markdown);
    }
}
