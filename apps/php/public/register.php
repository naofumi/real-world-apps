<?php

declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

use App\Security\Password;

if (viewer($session, $users) !== null) {
    redirect('/');
}

$error = null;
$username = '';
$email = '';

if (is_post()) {
    require_csrf($csrf);
    $username = trim(post('username'));
    $email = trim(post('email'));
    $password = post('password');

    if ($username === '' || $email === '' || $password === '') {
        $error = 'username, email, and password are required';
    } elseif (strlen($password) < 8) {
        $error = 'password is too short (minimum is 8 characters)';
    } else {
        $result = $users->create($email, $username, Password::hash($password));
        if (!$result['ok']) {
            $error = $result['error'];
        } else {
            $session->login($result['id']);
            $session->flash('notice', 'Welcome to Conduit.');
            redirect('/');
        }
    }
}

$viewer = null;
$csrfToken = $csrf->token();
$flash = $session->pullFlash('notice');
$alert = $session->pullFlash('alert');
$title = 'Sign up — Conduit';
require dirname(__DIR__) . '/includes/header.php';
?>
<main class="auth-page">
    <h1>Sign up</h1>
    <p class="sub"><a href="/login.php">Have an account?</a></p>

    <?php if ($error !== null): ?>
        <div class="error"><?= e($error) ?></div>
    <?php endif; ?>

    <form method="post" action="/register.php">
        <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
        <label for="username">Username</label>
        <input id="username" type="text" name="username" value="<?= e($username) ?>" required>
        <label for="email">Email</label>
        <input id="email" type="email" name="email" value="<?= e($email) ?>" required>
        <label for="password">Password</label>
        <input id="password" type="password" name="password" required minlength="8" autocomplete="new-password">
        <button class="button" type="submit">Sign up</button>
    </form>
</main>
<?php require dirname(__DIR__) . '/includes/footer.php'; ?>
