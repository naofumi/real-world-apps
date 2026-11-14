<?php

use App\Http\View;

/** @var string|null $error */
/** @var string $email */
/** @var string $csrf */
?>
<main class="auth-page">
    <h1>Sign in</h1>
    <p class="sub"><a href="/">Need an account? Home for now.</a></p>

    <?php if (is_string($error) && $error !== ''): ?>
        <div class="error"><?= View::e($error) ?></div>
    <?php endif; ?>

    <form method="post" action="/login">
        <input type="hidden" name="_csrf" value="<?= View::e($csrf) ?>">

        <label for="email">Email</label>
        <input id="email" type="email" name="email" value="<?= View::e($email) ?>" required autocomplete="username">

        <label for="password">Password</label>
        <input id="password" type="password" name="password" required autocomplete="current-password">

        <button class="button" type="submit">Sign in</button>
    </form>
</main>
