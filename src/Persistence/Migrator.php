<?php

declare(strict_types=1);

namespace App\Persistence;

use App\Support\Env;
use PDO;

final class Migrator
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function migrate(): void
    {
        $sql = file_get_contents(Env::root() . '/sql/schema.sql');
        if ($sql === false) {
            throw new \RuntimeException('Unable to read sql/schema.sql');
        }

        $this->pdo->exec($sql);
    }
}
