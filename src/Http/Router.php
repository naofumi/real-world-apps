<?php

declare(strict_types=1);

namespace App\Http;

final class Router
{
    /** @var list<array{methods: list<string>, pattern: string, handler: callable}> */
    private array $routes = [];

    /**
     * @param list<string>|string $methods
     */
    public function add(array|string $methods, string $pattern, callable $handler): void
    {
        $methods = is_array($methods) ? $methods : [$methods];
        $methods = array_map(static fn (string $m): string => strtoupper($m), $methods);
        $this->routes[] = [
            'methods' => $methods,
            'pattern' => $pattern,
            'handler' => $handler,
        ];
    }

    public function get(string $pattern, callable $handler): void
    {
        $this->add('GET', $pattern, $handler);
    }

    public function post(string $pattern, callable $handler): void
    {
        $this->add('POST', $pattern, $handler);
    }

    public function dispatch(Request $request): Response
    {
        foreach ($this->routes as $route) {
            if (!in_array($request->method, $route['methods'], true)) {
                continue;
            }

            $params = $this->match($route['pattern'], $request->path);
            if ($params === null) {
                continue;
            }

            $result = ($route['handler'])($request, $params);
            if (!$result instanceof Response) {
                throw new \RuntimeException('Route handler must return Response');
            }

            return $result;
        }

        return Response::html($this->notFoundBody(), 404);
    }

    /**
     * @return array<string, string>|null
     */
    private function match(string $pattern, string $path): ?array
    {
        $regex = preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', '(?P<$1>[^/]+)', $pattern);
        if (!is_string($regex)) {
            return null;
        }

        $regex = '#^' . $regex . '$#';
        if (!preg_match($regex, $path, $matches)) {
            return null;
        }

        $params = [];
        foreach ($matches as $key => $value) {
            if (is_string($key)) {
                $params[$key] = $value;
            }
        }

        return $params;
    }

    private function notFoundBody(): string
    {
        return '<!DOCTYPE html><html><head><title>Not Found</title></head>'
            . '<body><h1>404 Not Found</h1><p><a href="/">Home</a></p></body></html>';
    }
}
