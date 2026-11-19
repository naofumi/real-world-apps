<?php

declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

$viewer = require_login($session, $users);
$csrfToken = $csrf->token();
$flash = $session->pullFlash('notice');
$alert = $session->pullFlash('alert');

$page = max(1, (int) query('page', '1'));
$perPage = 10;
$offset = ($page - 1) * $perPage;
$viewerId = (int) $viewer['id'];

$feedArticles = $articles->listFeed($viewerId, $perPage, $offset);
$articleCount = $articles->countFeed($viewerId);
$totalPages = max(1, (int) ceil($articleCount / $perPage));
$popularTags = $articles->popularTags();

$title = 'Your Feed — Conduit';
require dirname(__DIR__) . '/includes/header.php';
?>
<div class="home-page">
    <div class="banner">
        <div class="container">
            <h1 class="logo-font">conduit</h1>
            <p>A place to share your knowledge.</p>
        </div>
    </div>

    <div class="container page">
        <div class="row">
            <div class="col-md-9">
                <div class="feed-toggle">
                    <ul class="nav nav-pills outline-active">
                        <li class="nav-item"><a class="nav-link active" href="/feed.php">Your Feed</a></li>
                        <li class="nav-item"><a class="nav-link" href="/">Global Feed</a></li>
                    </ul>
                </div>

                <?php if ($feedArticles === []): ?>
                    <div class="article-preview"><p class="empty-feed-message">No articles are here… yet. Follow authors to fill Your Feed.</p></div>
                <?php else: ?>
                    <?php foreach ($feedArticles as $article): ?>
                        <?php require dirname(__DIR__) . '/includes/article_preview.php'; ?>
                    <?php endforeach; ?>
                <?php endif; ?>

                <?php if ($totalPages > 1): ?>
                    <ul class="pagination">
                        <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                            <li class="page-item<?= $i === $page ? ' active' : '' ?>">
                                <a class="page-link" href="/feed.php?page=<?= $i ?>"><?= $i ?></a>
                            </li>
                        <?php endfor; ?>
                    </ul>
                <?php endif; ?>
            </div>

            <div class="col-md-3">
                <div class="sidebar">
                    <p>Popular Tags</p>
                    <div class="tag-list">
                        <?php foreach ($popularTags as $popularTag): ?>
                            <a class="tag-pill tag-default" href="/?tag=<?= rawurlencode($popularTag) ?>"><?= e($popularTag) ?></a>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<?php require dirname(__DIR__) . '/includes/footer.php'; ?>
