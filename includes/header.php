<?php

declare(strict_types=1);

/** @var string $title */
/** @var array<string, mixed>|null $viewer */
/** @var string $csrfToken */
/** @var mixed $flash */
/** @var mixed $alert */

$flash = $flash ?? null;
$alert = $alert ?? null;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= e($title) ?></title>
    <link rel="stylesheet" href="/css/app.css">
</head>
<body>
<header class="site-header">
    <div class="container">
        <a class="brand" href="/">conduit</a>
        <nav>
            <ul class="nav">
                <li><a href="/">Home</a></li>
                <?php if ($viewer): ?>
                    <li><a href="/article_new.php">New Article</a></li>
                    <li><a href="/settings.php">Settings</a></li>
                    <li>
                        <a href="/profile.php?username=<?= rawurlencode((string) $viewer['username']) ?>">
                            <?= e((string) $viewer['username']) ?>
                        </a>
                    </li>
                    <li>
                        <form class="inline-form" method="post" action="/logout.php">
                            <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                            <button class="button ghost" type="submit">Sign out</button>
                        </form>
                    </li>
                <?php else: ?>
                    <li><a href="/login.php">Sign in</a></li>
                    <li><a href="/register.php">Sign up</a></li>
                <?php endif; ?>
            </ul>
        </nav>
    </div>
</header>

<?php if (is_string($flash) && $flash !== ''): ?>
    <div class="container"><div class="flash"><?= e($flash) ?></div></div>
<?php endif; ?>
<?php if (is_string($alert) && $alert !== ''): ?>
    <div class="container"><div class="error"><?= e($alert) ?></div></div>
<?php endif; ?>
