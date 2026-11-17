<?php

declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

use App\Support\Markdown;

$slug = trim(query('slug'));
$article = $slug !== '' ? $articles->findBySlug($slug) : null;
if ($article === null) {
    http_response_code(404);
    echo 'Article not found.';
    exit;
}

$viewer = viewer($session, $users);
$csrfToken = $csrf->token();
$flash = $session->pullFlash('notice');
$alert = $session->pullFlash('alert');

$favorited = false;
$following = false;
if ($viewer !== null) {
    $favorited = $articles->isFavorited((int) $viewer['id'], (int) $article['id']);
    $following = $users->isFollowing((int) $viewer['id'], (int) $article['user_id']);
}
$canEdit = $viewer !== null && (int) $viewer['id'] === (int) $article['user_id'];
$bodyHtml = Markdown::toHtml((string) $article['body']);
$commentRows = $comments->forArticle((int) $article['id']);
/** @var list<string> $tags */
$tags = $article['tags'] ?? [];

$title = (string) $article['title'] . ' — Conduit';
require dirname(__DIR__) . '/includes/header.php';
?>
<div class="article-banner">
    <div class="container">
        <h1><?= e((string) $article['title']) ?></h1>
        <div class="article-meta">
            <a href="/profile.php?username=<?= rawurlencode((string) $article['author_username']) ?>">
                <?= e((string) $article['author_username']) ?>
            </a>
            <span class="date"><?= e((string) $article['created_at']) ?></span>

            <?php if ($viewer && !$canEdit): ?>
                <?php if ($following): ?>
                    <form class="inline-form" method="post" action="/unfollow.php">
                        <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                        <input type="hidden" name="username" value="<?= e((string) $article['author_username']) ?>">
                        <input type="hidden" name="redirect" value="/article.php?slug=<?= rawurlencode((string) $article['slug']) ?>">
                        <button class="button ghost" type="submit">Unfollow <?= e((string) $article['author_username']) ?></button>
                    </form>
                <?php else: ?>
                    <form class="inline-form" method="post" action="/follow.php">
                        <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                        <input type="hidden" name="username" value="<?= e((string) $article['author_username']) ?>">
                        <input type="hidden" name="redirect" value="/article.php?slug=<?= rawurlencode((string) $article['slug']) ?>">
                        <button class="button ghost" type="submit">Follow <?= e((string) $article['author_username']) ?></button>
                    </form>
                <?php endif; ?>
            <?php endif; ?>

            <?php if ($viewer): ?>
                <?php if ($favorited): ?>
                    <form class="inline-form" method="post" action="/article_unfavorite.php">
                        <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                        <input type="hidden" name="slug" value="<?= e((string) $article['slug']) ?>">
                        <button class="button ghost" type="submit">♥ Unfavorite (<?= (int) $article['favorites_count'] ?>)</button>
                    </form>
                <?php else: ?>
                    <form class="inline-form" method="post" action="/article_favorite.php">
                        <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                        <input type="hidden" name="slug" value="<?= e((string) $article['slug']) ?>">
                        <button class="button ghost" type="submit">♡ Favorite (<?= (int) $article['favorites_count'] ?>)</button>
                    </form>
                <?php endif; ?>
            <?php else: ?>
                <span class="favorites-count">♥ <?= (int) $article['favorites_count'] ?></span>
            <?php endif; ?>

            <?php if ($canEdit): ?>
                <a class="button ghost" href="/article_edit.php?slug=<?= rawurlencode((string) $article['slug']) ?>">Edit Article</a>
                <form class="inline-form" method="post" action="/article_delete.php" onsubmit="return confirm('Delete this article?');">
                    <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                    <input type="hidden" name="slug" value="<?= e((string) $article['slug']) ?>">
                    <button class="button danger" type="submit">Delete Article</button>
                </form>
            <?php endif; ?>
        </div>
    </div>
</div>

<main class="container article-page">
    <div class="article-body"><?= $bodyHtml ?></div>

    <?php if ($tags !== []): ?>
        <ul class="tag-list">
            <?php foreach ($tags as $tagName): ?>
                <li><a href="/?tag=<?= rawurlencode($tagName) ?>"><?= e($tagName) ?></a></li>
            <?php endforeach; ?>
        </ul>
    <?php endif; ?>

    <hr>

    <section class="comments">
        <h2>Comments</h2>

        <?php if ($viewer): ?>
            <form method="post" action="/comment_create.php" class="comment-form">
                <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                <input type="hidden" name="slug" value="<?= e((string) $article['slug']) ?>">
                <label for="body">Write a comment</label>
                <textarea id="body" name="body" rows="3" required></textarea>
                <button class="button" type="submit">Post Comment</button>
            </form>
        <?php else: ?>
            <p class="empty"><a href="/login.php">Sign in</a> to add comments.</p>
        <?php endif; ?>

        <?php foreach ($commentRows as $comment): ?>
            <div class="comment">
                <p><?= e((string) $comment['body']) ?></p>
                <p class="meta">
                    <a href="/profile.php?username=<?= rawurlencode((string) $comment['author_username']) ?>">
                        <?= e((string) $comment['author_username']) ?>
                    </a>
                    · <?= e((string) $comment['created_at']) ?>
                    <?php
                    $canDeleteComment = $viewer !== null && (
                        (int) $viewer['id'] === (int) $comment['user_id']
                        || (int) $viewer['id'] === (int) $article['user_id']
                    );
                    ?>
                    <?php if ($canDeleteComment): ?>
                        <form class="inline-form" method="post" action="/comment_delete.php">
                            <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                            <input type="hidden" name="id" value="<?= (int) $comment['id'] ?>">
                            <button class="button ghost" type="submit">Delete</button>
                        </form>
                    <?php endif; ?>
                </p>
            </div>
        <?php endforeach; ?>
    </section>
</main>
<?php require dirname(__DIR__) . '/includes/footer.php'; ?>
