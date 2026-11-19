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
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/ionicons/2.0.1/css/ionicons.min.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700|Lora:400,700">
    <link rel="stylesheet" href="/css/conduit.css">
    <link rel="stylesheet" href="/css/app.css">
</head>
<body>
<nav class="navbar navbar-light">
    <div class="container">
        <a class="navbar-brand" href="/">conduit</a>
        <ul class="nav navbar-nav pull-xs-right">
            <li class="nav-item"><a class="nav-link" href="/">Home</a></li>
            <?php if ($viewer): ?>
                <li class="nav-item">
                    <a class="nav-link" href="/article_new.php"><i class="ion-compose"></i>&nbsp;New Article</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/settings.php"><i class="ion-gear-a"></i>&nbsp;Settings</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/profile.php?username=<?= rawurlencode((string) $viewer['username']) ?>">
                        <?= e((string) $viewer['username']) ?>
                    </a>
                </li>
                <li class="nav-item">
                    <form method="post" action="/logout.php">
                        <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                        <button class="nav-link nav-link-button" type="submit">Sign out</button>
                    </form>
                </li>
            <?php else: ?>
                <li class="nav-item"><a class="nav-link" href="/login.php">Sign in</a></li>
                <li class="nav-item"><a class="nav-link" href="/register.php">Sign up</a></li>
            <?php endif; ?>
        </ul>
    </div>
</nav>

<?php if (is_string($flash) && $flash !== ''): ?>
    <div class="container"><div class="flash notice"><?= e($flash) ?></div></div>
<?php endif; ?>
<?php if (is_string($alert) && $alert !== ''): ?>
    <div class="container"><div class="flash alert"><?= e($alert) ?></div></div>
<?php endif; ?>
