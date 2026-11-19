<?php

namespace App\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class Pagination
{
    /**
     * @return array{data: mixed, meta: array{currentPage: int, lastPage: int, total: int}, links: array{prev: ?string, next: ?string, pages: array<int, string>}}
     */
    public static function toInertia(LengthAwarePaginator $paginator, callable $mapItem): array
    {
        $pages = [];
        for ($page = 1; $page <= $paginator->lastPage(); $page++) {
            $pages[$page] = $paginator->url($page);
        }

        return [
            'data' => $paginator->getCollection()->map($mapItem)->values(),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'lastPage' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
            'links' => [
                'prev' => $paginator->previousPageUrl(),
                'next' => $paginator->nextPageUrl(),
                'pages' => $pages,
            ],
        ];
    }
}
