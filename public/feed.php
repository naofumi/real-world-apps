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
$tag = null;

$title = 'Your Feed — Conduit';
require dirname(__DIR__) . '/includes/header.php';
?>
<div class="banner">
    <div class="container">
        <h1>conduit</h1>
        <p>A place to share your knowledge.</p>
    </div>
</div>

<main class="container home-layout">
    <section class="feed-column">
        <ul class="feed-toggle">
            <li class="active"><a href="/feed.php">Your Feed</a></li>
            <li><a href="/">Global Feed</a></li>
        </ul>

        <p class="meta"><?= $articleCount ?> article<?= $articleCount === 1 ? '' : 's' ?></p>

        <?php if ($feedArticles === []): ?>
            <p class="empty">No articles are here… yet. Follow authors to fill Your Feed.</p>
        <?php else: ?>
            <?php foreach ($feedArticles as $article): ?>
                <?php require dirname(__DIR__) . '/includes/article_preview.php'; ?>
            <?php endforeach; ?>
        <?php endif; ?>

        <?php if ($totalPages > 1): ?>
            <nav class="pagination">
                <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                    <a class="<?= $i === $page ? 'active' : '' ?>" href="/feed.php?page=<?= $i ?>"><?= $i ?></a>
                <?php endfor; ?>
            </nav>
        <?php endif; ?>
    </section>

    <aside class="sidebar">
        <p class="sidebar-title">Popular Tags</p>
        <ul class="tag-list wrap">
            <?php foreach ($popularTags as $popularTag): ?>
                <li><a href="/?tag=<?= rawurlencode($popularTag) ?>"><?= e($popularTag) ?></a></li>
            <?php endforeach; ?>
        </ul>
    </aside>
</main>
<?php require dirname(__DIR__) . '/includes/footer.php'; ?>
