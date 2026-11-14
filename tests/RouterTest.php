<?php

declare(strict_types=1);

namespace App\Tests;

use App\Http\Request;
use App\Http\Response;
use App\Http\Router;
use PHPUnit\Framework\TestCase;

final class RouterTest extends TestCase
{
    public function testMatchesPathParams(): void
    {
        $router = new Router();
        $router->get('/article/{slug}', function (Request $request, array $params): Response {
            return Response::html($params['slug']);
        });

        $response = $router->dispatch(new Request(
            'GET',
            '/article/a-vanilla-php-stack',
            [],
            [],
            [],
            [],
        ));

        self::assertSame(200, $response->status);
        self::assertSame('a-vanilla-php-stack', $response->body);
    }

    public function testReturns404WhenMissing(): void
    {
        $router = new Router();
        $response = $router->dispatch(new Request('GET', '/missing', [], [], [], []));
        self::assertSame(404, $response->status);
    }
}
