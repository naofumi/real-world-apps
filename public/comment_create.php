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

$body = trim(post('body'));
if ($body === '') {
    $session->flash('alert', 'Comment body can\'t be blank.');
    redirect('/article.php?slug=' . rawurlencode((string) $article['slug']));
}

$comments->create((int) $article['id'], (int) $viewer['id'], $body);
redirect('/article.php?slug=' . rawurlencode((string) $article['slug']));
