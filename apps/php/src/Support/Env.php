<?php

declare(strict_types=1);

namespace App\Support;

final class Env
{
    public static function root(): string
    {
        return dirname(__DIR__, 2);
    }

    public static function databasePath(): string
    {
        $override = getenv('APP_DATABASE_PATH');
        if (is_string($override) && $override !== '') {
            return $override;
        }

        return self::root() . '/storage/conduit.sqlite3';
    }
}
