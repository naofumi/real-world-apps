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

$articleMeta = static function () use ($article, $viewer, $canEdit, $following, $favorited, $csrfToken): void {
    ?>
    <div class="article-meta">
        <div class="info">
            <a class="author" href="/profile.php?username=<?= rawurlencode((string) $article['author_username']) ?>">
                <?= e((string) $article['author_username']) ?>
            </a>
            <span class="date"><?= e((string) $article['created_at']) ?></span>
        </div>

        <?php if ($canEdit): ?>
            <a class="btn btn-sm btn-outline-secondary" href="/article_edit.php?slug=<?= rawurlencode((string) $article['slug']) ?>">
                <i class="ion-edit"></i>&nbsp;Edit Article
            </a>
            <form method="post" action="/article_delete.php" onsubmit="return confirm('Delete this article?');">
                <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                <input type="hidden" name="slug" value="<?= e((string) $article['slug']) ?>">
                <button class="btn btn-sm btn-outline-danger" type="submit">
                    <i class="ion-trash-a"></i>&nbsp;Delete Article
                </button>
            </form>
        <?php elseif ($viewer): ?>
            <?php if ($following): ?>
                <form method="post" action="/unfollow.php">
                    <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                    <input type="hidden" name="username" value="<?= e((string) $article['author_username']) ?>">
                    <input type="hidden" name="redirect" value="/article.php?slug=<?= rawurlencode((string) $article['slug']) ?>">
                    <button class="btn btn-sm btn-secondary" type="submit">
                        <i class="ion-plus-round"></i>&nbsp;Unfollow <?= e((string) $article['author_username']) ?>
                    </button>
                </form>
            <?php else: ?>
                <form method="post" action="/follow.php">
                    <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                    <input type="hidden" name="username" value="<?= e((string) $article['author_username']) ?>">
                    <input type="hidden" name="redirect" value="/article.php?slug=<?= rawurlencode((string) $article['slug']) ?>">
                    <button class="btn btn-sm btn-outline-secondary" type="submit">
                        <i class="ion-plus-round"></i>&nbsp;Follow <?= e((string) $article['author_username']) ?>
                    </button>
                </form>
            <?php endif; ?>
        <?php endif; ?>

        <?php if ($viewer): ?>
            <?php if ($favorited): ?>
                <form method="post" action="/article_unfavorite.php">
                    <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                    <input type="hidden" name="slug" value="<?= e((string) $article['slug']) ?>">
                    <button class="btn btn-sm btn-primary" type="submit">
                        <i class="ion-heart"></i>&nbsp;Unfavorite <span class="counter">(<?= (int) $article['favorites_count'] ?>)</span>
                    </button>
                </form>
            <?php else: ?>
                <form method="post" action="/article_favorite.php">
                    <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                    <input type="hidden" name="slug" value="<?= e((string) $article['slug']) ?>">
                    <button class="btn btn-sm btn-outline-primary" type="submit">
                        <i class="ion-heart"></i>&nbsp;Favorite <span class="counter">(<?= (int) $article['favorites_count'] ?>)</span>
                    </button>
                </form>
            <?php endif; ?>
        <?php else: ?>
            <span class="btn btn-sm btn-outline-primary disabled">
                <i class="ion-heart"></i>&nbsp;<span class="counter">(<?= (int) $article['favorites_count'] ?>)</span>
            </span>
        <?php endif; ?>
    </div>
    <?php
};
?>
<div class="article-page">
    <div class="banner">
        <div class="container">
            <h1><?= e((string) $article['title']) ?></h1>
            <?php $articleMeta(); ?>
        </div>
    </div>

    <div class="container page">
        <div class="row article-content">
            <div class="col-md-12">
                <?= $bodyHtml ?>
                <?php if ($tags !== []): ?>
                    <ul class="tag-list">
                        <?php foreach ($tags as $tagName): ?>
                            <li class="tag-default tag-pill tag-outline">
                                <a href="/?tag=<?= rawurlencode($tagName) ?>"><?= e($tagName) ?></a>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                <?php endif; ?>
            </div>
        </div>

        <hr>

        <div class="article-actions">
            <?php $articleMeta(); ?>
        </div>

        <div class="row">
            <div class="col-xs-12 col-md-8 offset-md-2">
                <?php if ($viewer): ?>
                    <form method="post" action="/comment_create.php" class="card comment-form">
                        <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                        <input type="hidden" name="slug" value="<?= e((string) $article['slug']) ?>">
                        <div class="card-block">
                            <label class="visually-hidden" for="body">Comment</label>
                            <textarea id="body" class="form-control" name="body" rows="3" required placeholder="Write a comment..."></textarea>
                        </div>
                        <div class="card-footer">
                            <button class="btn btn-sm btn-primary" type="submit">Post Comment</button>
                        </div>
                    </form>
                <?php else: ?>
                    <p><a href="/login.php">Sign in</a> to add comments on this article.</p>
                <?php endif; ?>

                <?php foreach ($commentRows as $comment): ?>
                    <div class="card">
                        <div class="card-block">
                            <p class="card-text"><?= e((string) $comment['body']) ?></p>
                        </div>
                        <div class="card-footer">
                            <a class="comment-author" href="/profile.php?username=<?= rawurlencode((string) $comment['author_username']) ?>">
                                <?= e((string) $comment['author_username']) ?>
                            </a>
                            <span class="date-posted"><?= e((string) $comment['created_at']) ?></span>
                            <?php
                            $canDeleteComment = $viewer !== null && (
                                (int) $viewer['id'] === (int) $comment['user_id']
                                || (int) $viewer['id'] === (int) $article['user_id']
                            );
                            ?>
                            <?php if ($canDeleteComment): ?>
                                <span class="mod-options">
                                    <form method="post" action="/comment_delete.php">
                                        <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                                        <input type="hidden" name="id" value="<?= (int) $comment['id'] ?>">
                                        <button type="submit" aria-label="Delete comment">Delete</button>
                                    </form>
                                </span>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</div>
<?php require dirname(__DIR__) . '/includes/footer.php'; ?>
