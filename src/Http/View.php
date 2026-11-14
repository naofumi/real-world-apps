<?php

declare(strict_types=1);

namespace App\Http;

use App\Support\Env;

final class View
{
    /**
     * @param array<string, mixed> $data
     */
    public static function render(string $template, array $data = [], string $layout = 'layouts/app'): string
    {
        $content = self::renderPartial($template, $data);
        return self::renderPartial($layout, array_merge($data, ['content' => $content]));
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function renderPartial(string $template, array $data = []): string
    {
        $path = Env::root() . '/views/' . $template . '.php';
        if (!is_file($path)) {
            throw new \RuntimeException('View not found: ' . $template);
        }

        extract($data, EXTR_SKIP);
        ob_start();
        require $path;
        $html = ob_get_clean();
        if ($html === false) {
            throw new \RuntimeException('Failed to render view: ' . $template);
        }

        return $html;
    }

    public static function e(?string $value): string
    {
        return htmlspecialchars($value ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
