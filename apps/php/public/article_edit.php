<?php

declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

$viewer = require_login($session, $users);
$slug = trim(query('slug') !== '' ? query('slug') : post('slug'));
$article = $slug !== '' ? $articles->findBySlug($slug) : null;
if ($article === null) {
    http_response_code(404);
    echo 'Article not found.';
    exit;
}
if ((int) $viewer['id'] !== (int) $article['user_id']) {
    $session->flash('alert', 'You can only change your own articles.');
    redirect('/article.php?slug=' . rawurlencode((string) $article['slug']));
}

/** @var list<string> $existingTags */
$existingTags = $article['tags'] ?? [];
$error = null;
$form = [
    'title' => (string) $article['title'],
    'description' => (string) $article['description'],
    'body' => (string) $article['body'],
    'tag_list' => implode(', ', $existingTags),
];

if (is_post()) {
    require_csrf($csrf);
    $form = [
        'title' => trim(post('title')),
        'description' => trim(post('description')),
        'body' => trim(post('body')),
        'tag_list' => trim(post('tag_list')),
    ];

    if ($form['title'] === '' || $form['description'] === '' || $form['body'] === '') {
        $error = 'title, description, and body are required';
    } else {
        $result = $articles->update(
            (int) $article['id'],
            $form['title'],
            $form['description'],
            $form['body'],
            parse_tags($form['tag_list']),
            (string) $article['slug'],
        );
        if (!$result['ok']) {
            $error = $result['error'];
        } else {
            $session->flash('notice', 'Article updated.');
            redirect('/article.php?slug=' . rawurlencode($result['slug']));
        }
    }
}

$csrfToken = $csrf->token();
$flash = $session->pullFlash('notice');
$alert = $session->pullFlash('alert');
$title = 'Edit Article — Conduit';
require dirname(__DIR__) . '/includes/header.php';
?>
<div class="editor-page">
    <div class="container page">
        <div class="row">
            <div class="col-md-10 offset-md-1 col-xs-12">
                <h1>Edit Article</h1>
                <?php if ($error !== null): ?>
                    <ul class="error-messages"><li><?= e($error) ?></li></ul>
                <?php endif; ?>
                <form method="post" action="/article_edit.php?slug=<?= rawurlencode((string) $article['slug']) ?>">
                    <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                    <input type="hidden" name="slug" value="<?= e((string) $article['slug']) ?>">
                    <fieldset class="form-group">
                        <label for="title">Article Title</label>
                        <input id="title" class="form-control form-control-lg" name="title" value="<?= e($form['title']) ?>" required placeholder="Article Title">
                    </fieldset>
                    <fieldset class="form-group">
                        <label for="description">What's this article about?</label>
                        <input id="description" class="form-control" name="description" value="<?= e($form['description']) ?>" required placeholder="What's this article about?">
                    </fieldset>
                    <fieldset class="form-group">
                        <label for="body">Write your article (Markdown)</label>
                        <textarea id="body" class="form-control" name="body" rows="8" required placeholder="Write your article (in markdown)"><?= e($form['body']) ?></textarea>
                    </fieldset>
                    <fieldset class="form-group">
                        <label for="tag_list">Tags</label>
                        <input id="tag_list" class="form-control" name="tag_list" value="<?= e($form['tag_list']) ?>" placeholder="Enter tags">
                    </fieldset>
                    <button class="btn btn-lg btn-primary pull-xs-right" type="submit">Update Article</button>
                </form>
            </div>
        </div>
    </div>
</div>
<?php require dirname(__DIR__) . '/includes/footer.php'; ?>
