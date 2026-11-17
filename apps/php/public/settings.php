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
<main class="auth-page wide">
    <h1>Your Settings</h1>

    <?php if ($error !== null): ?>
        <div class="error"><?= e($error) ?></div>
    <?php endif; ?>

    <form method="post" action="/settings.php">
        <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
        <label for="image">URL of profile picture</label>
        <input id="image" type="url" name="image" value="<?= e($form['image']) ?>">
        <label for="username">Username</label>
        <input id="username" type="text" name="username" value="<?= e($form['username']) ?>" required>
        <label for="bio">Short bio about you</label>
        <textarea id="bio" name="bio" rows="6"><?= e($form['bio']) ?></textarea>
        <label for="email">Email</label>
        <input id="email" type="email" name="email" value="<?= e($form['email']) ?>" required>
        <label for="password">New password</label>
        <input id="password" type="password" name="password" minlength="8" autocomplete="new-password" placeholder="Leave blank to keep current">
        <button class="button" type="submit">Update Settings</button>
    </form>
</main>
<?php require dirname(__DIR__) . '/includes/footer.php'; ?>
