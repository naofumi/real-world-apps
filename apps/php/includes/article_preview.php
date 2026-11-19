<?php

declare(strict_types=1);

/** @var array<string, mixed> $article */
/** @var list<string> $tags */
$tags = $article['tags'] ?? [];
?>
<div class="article-preview">
    <div class="article-meta">
        <div class="info">
            <a class="author" href="/profile.php?username=<?= rawurlencode((string) $article['author_username']) ?>">
                <?= e((string) $article['author_username']) ?>
            </a>
            <span class="date"><?= e((string) $article['created_at']) ?></span>
        </div>
        <span class="pull-xs-right"><i class="ion-heart"></i> <?= (int) $article['favorites_count'] ?></span>
    </div>
    <a class="preview-link" href="/article.php?slug=<?= rawurlencode((string) $article['slug']) ?>">
        <h1><?= e((string) $article['title']) ?></h1>
        <p><?= e((string) $article['description']) ?></p>
        <span>Read more...</span>
        <?php if ($tags !== []): ?>
            <ul class="tag-list">
                <?php foreach ($tags as $tagName): ?>
                    <li class="tag-default tag-pill tag-outline"><?= e($tagName) ?></li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </a>
</div>
