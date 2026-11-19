<?php

declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

use App\Security\Password;

$viewer = require_login($session, $users);
$error = null;
$form = [
    'image' => (string) ($viewer['image'] ?? ''),
    'username' => (string) $viewer['username'],
    'bio' => (string) ($viewer['bio'] ?? ''),
    'email' => (string) $viewer['email'],
];

if (is_post()) {
    require_csrf($csrf);
    $form = [
        'image' => trim(post('image')),
        'username' => trim(post('username')),
        'bio' => trim(post('bio')),
        'email' => trim(post('email')),
    ];
    $password = post('password');

    if ($form['username'] === '' || $form['email'] === '') {
        $error = 'username and email are required';
    } else {
        $passwordHash = null;
        if ($password !== '') {
            if (strlen($password) < 8) {
                $error = 'password is too short (minimum is 8 characters)';
            } else {
                $passwordHash = Password::hash($password);
            }
        }

        if ($error === null) {
            $result = $users->updateProfile(
                (int) $viewer['id'],
                $form['email'],
                $form['username'],
                $form['bio'] !== '' ? $form['bio'] : null,
                $form['image'] !== '' ? $form['image'] : null,
                $passwordHash,
            );
            if (!$result['ok']) {
                $error = $result['error'];
            } else {
                $session->flash('notice', 'Settings saved.');
                redirect('/settings.php');
            }
        }
    }

    $viewer = viewer($session, $users);
}

$csrfToken = $csrf->token();
$flash = $session->pullFlash('notice');
$alert = $session->pullFlash('alert');
$title = 'Settings — Conduit';
require dirname(__DIR__) . '/includes/header.php';
?>
<div class="settings-page">
    <div class="container page">
        <div class="row">
            <div class="col-md-6 offset-md-3 col-xs-12">
                <h1 class="text-xs-center">Your Settings</h1>

                <?php if ($error !== null): ?>
                    <ul class="error-messages"><li><?= e($error) ?></li></ul>
                <?php endif; ?>

                <form method="post" action="/settings.php">
                    <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                    <fieldset class="form-group">
                        <label for="image">URL of profile picture</label>
                        <input id="image" class="form-control" type="url" name="image" value="<?= e($form['image']) ?>" placeholder="URL of profile picture">
                    </fieldset>
                    <fieldset class="form-group">
                        <label for="username">Username</label>
                        <input id="username" class="form-control form-control-lg" type="text" name="username" value="<?= e($form['username']) ?>" required placeholder="Username">
                    </fieldset>
                    <fieldset class="form-group">
                        <label for="bio">Short bio about you</label>
                        <textarea id="bio" class="form-control form-control-lg" name="bio" rows="8" placeholder="Short bio about you"><?= e($form['bio']) ?></textarea>
                    </fieldset>
                    <fieldset class="form-group">
                        <label for="email">Email</label>
                        <input id="email" class="form-control form-control-lg" type="email" name="email" value="<?= e($form['email']) ?>" required placeholder="Email">
                    </fieldset>
                    <fieldset class="form-group">
                        <label for="password">New password</label>
                        <input id="password" class="form-control form-control-lg" type="password" name="password" minlength="8" autocomplete="new-password" placeholder="New password">
                    </fieldset>
                    <button class="btn btn-lg btn-primary pull-xs-right" type="submit">Update Settings</button>
                </form>
            </div>
        </div>
    </div>
</div>
<?php require dirname(__DIR__) . '/includes/footer.php'; ?>
