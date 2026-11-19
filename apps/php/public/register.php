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
<div class="auth-page">
    <div class="container page">
        <div class="row">
            <div class="col-md-6 offset-md-3 col-xs-12">
                <h1 class="text-xs-center">Sign up</h1>
                <p class="text-xs-center"><a href="/login.php">Have an account?</a></p>

                <?php if ($error !== null): ?>
                    <ul class="error-messages"><li><?= e($error) ?></li></ul>
                <?php endif; ?>

                <form method="post" action="/register.php">
                    <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                    <fieldset class="form-group">
                        <label for="username">Username</label>
                        <input id="username" class="form-control form-control-lg" type="text" name="username" value="<?= e($username) ?>" required placeholder="Username">
                    </fieldset>
                    <fieldset class="form-group">
                        <label for="email">Email</label>
                        <input id="email" class="form-control form-control-lg" type="email" name="email" value="<?= e($email) ?>" required placeholder="Email">
                    </fieldset>
                    <fieldset class="form-group">
                        <label for="password">Password</label>
                        <input id="password" class="form-control form-control-lg" type="password" name="password" required minlength="8" autocomplete="new-password" placeholder="Password">
                    </fieldset>
                    <button class="btn btn-lg btn-primary pull-xs-right" type="submit">Sign up</button>
                </form>
            </div>
        </div>
    </div>
</div>
<?php require dirname(__DIR__) . '/includes/footer.php'; ?>
