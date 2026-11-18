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
<div class="auth-page">
    <div class="container page">
        <div class="row">
            <div class="col-md-6 offset-md-3 col-xs-12">
                <h1 class="text-xs-center">Sign in</h1>
                <p class="text-xs-center"><a href="/register.php">Need an account?</a></p>

                <?php if ($error !== null): ?>
                    <ul class="error-messages"><li><?= e($error) ?></li></ul>
                <?php endif; ?>

                <form method="post" action="/login.php">
                    <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                    <fieldset class="form-group">
                        <label for="email">Email</label>
                        <input id="email" class="form-control form-control-lg" type="email" name="email" value="<?= e($email) ?>" required autocomplete="username" placeholder="Email">
                    </fieldset>
                    <fieldset class="form-group">
                        <label for="password">Password</label>
                        <input id="password" class="form-control form-control-lg" type="password" name="password" required autocomplete="current-password" placeholder="Password">
                    </fieldset>
                    <button class="btn btn-lg btn-primary pull-xs-right" type="submit">Sign in</button>
                </form>
            </div>
        </div>
    </div>
</div>
<?php require dirname(__DIR__) . '/includes/footer.php'; ?>
