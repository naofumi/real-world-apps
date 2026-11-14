<?php

declare(strict_types=1);

/** @var array<string, mixed> $profile */
/** @var array<string, mixed>|null $viewer */
/** @var bool $following */
/** @var bool $isSelf */
/** @var string $tab */
/** @var string $csrfToken */
?>
<div class="profile-banner">
    <div class="container">
        <h1><?= e((string) $profile['username']) ?></h1>
        <?php if (!empty($profile['bio'])): ?>
            <p><?= e((string) $profile['bio']) ?></p>
        <?php endif; ?>

        <?php if ($viewer && !$isSelf): ?>
            <?php if ($following): ?>
                <form class="inline-form" method="post" action="/unfollow.php">
                    <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                    <input type="hidden" name="username" value="<?= e((string) $profile['username']) ?>">
                    <input type="hidden" name="redirect" value="/profile.php?username=<?= rawurlencode((string) $profile['username']) ?>">
                    <button class="button ghost" type="submit">Unfollow <?= e((string) $profile['username']) ?></button>
                </form>
            <?php else: ?>
                <form class="inline-form" method="post" action="/follow.php">
                    <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                    <input type="hidden" name="username" value="<?= e((string) $profile['username']) ?>">
                    <input type="hidden" name="redirect" value="/profile.php?username=<?= rawurlencode((string) $profile['username']) ?>">
                    <button class="button ghost" type="submit">Follow <?= e((string) $profile['username']) ?></button>
                </form>
            <?php endif; ?>
        <?php elseif ($isSelf): ?>
            <a class="button ghost" href="/settings.php">Edit Profile Settings</a>
        <?php endif; ?>
    </div>
</div>

<main class="container">
    <ul class="feed-toggle">
        <li class="<?= $tab === 'articles' ? 'active' : '' ?>">
            <a href="/profile.php?username=<?= rawurlencode((string) $profile['username']) ?>">My Articles</a>
        </li>
        <li class="<?= $tab === 'favorites' ? 'active' : '' ?>">
            <a href="/profile_favorites.php?username=<?= rawurlencode((string) $profile['username']) ?>">Favorited Articles</a>
        </li>
    </ul>
