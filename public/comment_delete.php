<?php

declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

require_post();
require_csrf($csrf);
$viewer = require_login($session, $users);

$comment = $comments->findById((int) post('id'));
if ($comment === null) {
    http_response_code(404);
    echo 'Comment not found.';
    exit;
}

$article = $articles->findBySlug((string) $comment['article_slug']);
$allowed = (int) $viewer['id'] === (int) $comment['user_id']
    || ($article !== null && (int) $viewer['id'] === (int) $article['user_id']);

if (!$allowed) {
    $session->flash('alert', 'You can only delete your comments.');
    redirect('/article.php?slug=' . rawurlencode((string) $comment['article_slug']));
}

$comments->delete((int) $comment['id']);
redirect('/article.php?slug=' . rawurlencode((string) $comment['article_slug']));
