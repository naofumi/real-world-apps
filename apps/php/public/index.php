<?php

declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

$viewer = viewer($session, $users);
$csrfToken = $csrf->token();
$flash = $session->pullFlash('notice');
$alert = $session->pullFlash('alert');

$tag = trim(query('tag'));
$tag = $tag !== '' ? $tag : null;
$page = max(1, (int) query('page', '1'));
$perPage = 10;
$offset = ($page - 1) * $perPage;

$feedArticles = $articles->listGlobal($tag, $perPage, $offset);
$articleCount = $articles->countGlobal($tag);
$totalPages = max(1, (int) ceil($articleCount / $perPage));
$popularTags = $articles->popularTags();

$title = 'Home — Conduit';
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
            <?php if ($viewer): ?>
                <li><a href="/feed.php">Your Feed</a></li>
            <?php endif; ?>
            <li class="<?= $tag === null ? 'active' : '' ?>"><a href="/">Global Feed</a></li>
            <?php if ($tag !== null): ?>
                <li class="active"><a href="/?tag=<?= rawurlencode($tag) ?>">#<?= e($tag) ?></a></li>
            <?php endif; ?>
        </ul>

        <p class="meta"><?= $articleCount ?> article<?= $articleCount === 1 ? '' : 's' ?></p>

        <?php if ($feedArticles === []): ?>
            <p class="empty">No articles are here… yet.</p>
        <?php else: ?>
            <?php foreach ($feedArticles as $article): ?>
                <?php require dirname(__DIR__) . '/includes/article_preview.php'; ?>
            <?php endforeach; ?>
        <?php endif; ?>

        <?php if ($totalPages > 1): ?>
            <nav class="pagination">
                <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                    <?php $href = '/?' . http_build_query(array_filter(['tag' => $tag, 'page' => $i])); ?>
                    <a class="<?= $i === $page ? 'active' : '' ?>" href="<?= e($href) ?>"><?= $i ?></a>
                <?php endfor; ?>
            </nav>
        <?php endif; ?>
    </section>

    <aside class="sidebar">
        <p class="sidebar-title">Popular Tags</p>
        <?php if ($popularTags === []): ?>
            <p class="empty">No tags yet.</p>
        <?php else: ?>
            <ul class="tag-list wrap">
                <?php foreach ($popularTags as $popularTag): ?>
                    <li><a href="/?tag=<?= rawurlencode($popularTag) ?>"><?= e($popularTag) ?></a></li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </aside>
</main>
<?php require dirname(__DIR__) . '/includes/footer.php'; ?>
