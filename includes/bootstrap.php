<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use App\Persistence\ArticleRepository;
use App\Persistence\CommentRepository;
use App\Persistence\PdoFactory;
use App\Persistence\UserRepository;
use App\Security\Csrf;
use App\Security\Session;

$session = new Session();
$session->start();
$csrf = new Csrf($session);
$pdo = PdoFactory::make();
$users = new UserRepository($pdo);
$articles = new ArticleRepository($pdo);
$comments = new CommentRepository($pdo);

function e(?string $value): string
{
    return htmlspecialchars($value ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function redirect(string $location): never
{
    header('Location: ' . $location);
    exit;
}

function is_post(): bool
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
}

function require_post(): void
{
    if (!is_post()) {
        http_response_code(405);
        echo 'Method Not Allowed';
        exit;
    }
}

function post(string $key, string $default = ''): string
{
    $value = $_POST[$key] ?? $default;
    return is_string($value) ? $value : $default;
}

function query(string $key, string $default = ''): string
{
    $value = $_GET[$key] ?? $default;
    return is_string($value) ? $value : $default;
}

function require_csrf(Csrf $csrf): void
{
    if (!$csrf->validate(post('_csrf'))) {
        http_response_code(422);
        echo 'Invalid security token.';
        exit;
    }
}

/** @return array<string, mixed>|null */
function viewer(Session $session, UserRepository $users): ?array
{
    $id = $session->userId();
    return $id === null ? null : $users->findById($id);
}

/** @return array<string, mixed> */
function require_login(Session $session, UserRepository $users): array
{
    $user = viewer($session, $users);
    if ($user === null) {
        $session->flash('notice', 'Please sign in.');
        redirect('/login.php');
    }

    return $user;
}

/** @return list<string> */
function parse_tags(string $tagList): array
{
    $parts = preg_split('/[,\s]+/', $tagList) ?: [];
    $tags = [];
    foreach ($parts as $part) {
        $part = trim($part);
        if ($part !== '') {
            $tags[] = $part;
        }
    }

    return $tags;
}
