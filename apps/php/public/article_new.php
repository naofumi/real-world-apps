<?php

declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

$viewer = require_login($session, $users);
$error = null;
$form = ['title' => '', 'description' => '', 'body' => '', 'tag_list' => ''];

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
        $result = $articles->create(
            (int) $viewer['id'],
            $form['title'],
            $form['description'],
            $form['body'],
            parse_tags($form['tag_list']),
        );
        if (!$result['ok']) {
            $error = $result['error'];
        } else {
            $session->flash('notice', 'Article published.');
            redirect('/article.php?slug=' . rawurlencode($result['slug']));
        }
    }
}

$csrfToken = $csrf->token();
$flash = $session->pullFlash('notice');
$alert = $session->pullFlash('alert');
$title = 'New Article — Conduit';
require dirname(__DIR__) . '/includes/header.php';
?>
<div class="editor-page">
    <div class="container page">
        <div class="row">
            <div class="col-md-10 offset-md-1 col-xs-12">
                <h1>New Article</h1>
                <?php if ($error !== null): ?>
                    <ul class="error-messages"><li><?= e($error) ?></li></ul>
                <?php endif; ?>
                <form method="post" action="/article_new.php">
                    <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
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
                    <button class="btn btn-lg btn-primary pull-xs-right" type="submit">Publish Article</button>
                </form>
            </div>
        </div>
    </div>
</div>
<?php require dirname(__DIR__) . '/includes/footer.php'; ?>
