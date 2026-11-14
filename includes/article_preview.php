<?php

declare(strict_types=1);

/** @var array<string, mixed> $article */
/** @var list<string> $tags */
$tags = $article['tags'] ?? [];
?>
<article class="article-preview">
    <div class="preview-meta">
        <a class="author" href="/profile.php?username=<?= rawurlencode((string) $article['author_username']) ?>">
            <?= e((string) $article['author_username']) ?>
        </a>
        <span class="date"><?= e((string) $article['created_at']) ?></span>
        <span class="favorites-count">♥ <?= (int) $article['favorites_count'] ?></span>
    </div>
    <h2>
        <a href="/article.php?slug=<?= rawurlencode((string) $article['slug']) ?>">
            <?= e((string) $article['title']) ?>
        </a>
    </h2>
    <p><?= e((string) $article['description']) ?></p>
    <?php if ($tags !== []): ?>
        <ul class="tag-list">
            <?php foreach ($tags as $tagName): ?>
                <li><a href="/?tag=<?= rawurlencode($tagName) ?>"><?= e($tagName) ?></a></li>
            <?php endforeach; ?>
        </ul>
    <?php endif; ?>
</article>
