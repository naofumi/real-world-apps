<?php

use App\Http\View;

/** @var string $title */
/** @var string $content */
/** @var array<string, mixed>|null $viewer */
/** @var string $csrf */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= View::e($title) ?></title>
    <link rel="stylesheet" href="/css/app.css">
</head>
<body>
<header class="site-header">
    <div class="container">
        <a class="brand" href="/">conduit</a>
        <nav>
            <ul class="nav">
                <li><a class="active" href="/">Home</a></li>
                <?php if ($viewer): ?>
                    <li><span><?= View::e((string) $viewer['username']) ?></span></li>
                    <li>
                        <form class="inline-form" method="post" action="/logout">
                            <input type="hidden" name="_csrf" value="<?= View::e($csrf) ?>">
                            <button class="button ghost" type="submit">Sign out</button>
                        </form>
                    </li>
                <?php else: ?>
                    <li><a href="/login">Sign in</a></li>
                <?php endif; ?>
            </ul>
        </nav>
    </div>
</header>

<?= $content ?>

<footer class="site-footer">
    <div class="container">
        <a href="/">conduit</a>
        — PHP 8.4, no framework, PDO + SQLite.
    </div>
</footer>
</body>
</html>
