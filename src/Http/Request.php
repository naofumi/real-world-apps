<?php

declare(strict_types=1);

namespace App\Http;

final class Request
{
    /**
     * @param array<string, string> $query
     * @param array<string, string> $body
     * @param array<string, string> $server
     * @param array<string, string> $cookies
     */
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $query,
        public readonly array $body,
        public readonly array $server,
        public readonly array $cookies,
    ) {
    }

    public static function fromGlobals(): self
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH);
        if (!is_string($path) || $path === '') {
            $path = '/';
        }

        /** @var array<string, string> $query */
        $query = [];
        foreach ($_GET as $key => $value) {
            if (is_string($key) && is_string($value)) {
                $query[$key] = $value;
            }
        }

        /** @var array<string, string> $body */
        $body = [];
        foreach ($_POST as $key => $value) {
            if (is_string($key) && is_string($value)) {
                $body[$key] = $value;
            }
        }

        /** @var array<string, string> $server */
        $server = [];
        foreach ($_SERVER as $key => $value) {
            if (is_string($key) && is_string($value)) {
                $server[$key] = $value;
            }
        }

        /** @var array<string, string> $cookies */
        $cookies = [];
        foreach ($_COOKIE as $key => $value) {
            if (is_string($key) && is_string($value)) {
                $cookies[$key] = $value;
            }
        }

        return new self($method, $path, $query, $body, $server, $cookies);
    }

    public function input(string $key, string $default = ''): string
    {
        return $this->body[$key] ?? $this->query[$key] ?? $default;
    }
}
