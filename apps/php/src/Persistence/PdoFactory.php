<?php

declare(strict_types=1);

namespace App\Persistence;

use App\Support\Env;
use PDO;

final class PdoFactory
{
    public static function make(?string $path = null): PDO
    {
        $path ??= Env::databasePath();
        $isMemory = str_contains($path, ':memory:');

        if (!$isMemory) {
            $dir = dirname($path);
            if (!is_dir($dir)) {
                mkdir($dir, 0775, true);
            }
        }

        $pdo = new PDO('sqlite:' . $path, options: [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        $pdo->exec('PRAGMA foreign_keys = ON');

        return $pdo;
    }
}
