<?php

declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

use App\Security\Password;

if (viewer($session, $users) !== null) {
    redirect('/');
}

$error = null;
$email = '';

if (is_post()) {
    require_csrf($csrf);
    $email = trim(post('email'));
    $password = post('password');
    $user = $users->findByEmail($email);

    if ($user === null || !Password::verify($password, (string) $user['password_hash'])) {
        $error = 'email or password is invalid';
    } else {
        $session->login((int) $user['id']);
        $session->flash('notice', 'Signed in as ' . $user['username'] . '.');
        redirect('/');
    }
}

$viewer = null;
$csrfToken = $csrf->token();
$flash = $session->pullFlash('notice');
$alert = $session->pullFlash('alert');
$title = 'Sign in — Conduit';
require dirname(__DIR__) . '/includes/header.php';
?>
<main class="auth-page">
    <h1>Sign in</h1>
    <p class="sub"><a href="/register.php">Need an account?</a></p>

    <?php if ($error !== null): ?>
        <div class="error"><?= e($error) ?></div>
    <?php endif; ?>

    <form method="post" action="/login.php">
        <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
        <label for="email">Email</label>
        <input id="email" type="email" name="email" value="<?= e($email) ?>" required autocomplete="username">
        <label for="password">Password</label>
        <input id="password" type="password" name="password" required autocomplete="current-password">
        <button class="button" type="submit">Sign in</button>
    </form>
</main>
<?php require dirname(__DIR__) . '/includes/footer.php'; ?>
