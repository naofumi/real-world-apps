<?php

use App\Http\View;

/** @var array<string, mixed>|null $viewer */
/** @var list<array<string, mixed>> $articles */
/** @var int $articleCount */
/** @var mixed $flash */
?>
<div class="banner">
    <div class="container">
        <h1>conduit</h1>
        <p>A place to share your knowledge.</p>
    </div>
</div>

<main class="container">
    <?php if (is_string($flash) && $flash !== ''): ?>
        <div class="flash"><?= View::e($flash) ?></div>
    <?php endif; ?>

    <h2>Global Feed</h2>
    <p class="meta"><?= (int) $articleCount ?> article<?= $articleCount === 1 ? '' : 's' ?></p>

    <?php if ($articles === []): ?>
        <p class="empty">No articles yet. Sign in after seeding the database.</p>
    <?php else: ?>
        <?php foreach ($articles as $article): ?>
            <article class="article-preview">
                <p class="meta">
                    <?= View::e((string) $article['author_username']) ?>
                    · <?= View::e((string) $article['created_at']) ?>
                    · ♥ <?= (int) $article['favorites_count'] ?>
                </p>
                <h2>
                    <a href="/article/<?= View::e((string) $article['slug']) ?>">
                        <?= View::e((string) $article['title']) ?>
                    </a>
                </h2>
                <p><?= View::e((string) $article['description']) ?></p>
            </article>
        <?php endforeach; ?>
    <?php endif; ?>
</main>
