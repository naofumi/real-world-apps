<?php

declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

require_post();
require_csrf($csrf);
$viewer = require_login($session, $users);

$slug = trim(post('slug'));
$article = $articles->findBySlug($slug);
if ($article === null) {
    http_response_code(404);
    echo 'Article not found.';
    exit;
}

$articles->unfavorite((int) $viewer['id'], (int) $article['id']);
redirect('/article.php?slug=' . rawurlencode((string) $article['slug']));
