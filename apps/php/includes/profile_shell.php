<?php

declare(strict_types=1);

/** @var array<string, mixed> $profile */
/** @var array<string, mixed>|null $viewer */
/** @var bool $following */
/** @var bool $isSelf */
/** @var string $tab */
/** @var string $csrfToken */
?>
<div class="profile-page">
    <div class="user-info">
        <div class="container">
            <div class="row">
                <div class="col-xs-12 col-md-10 offset-md-1">
                    <h4><?= e((string) $profile['username']) ?></h4>
                    <?php if (!empty($profile['bio'])): ?>
                        <p><?= e((string) $profile['bio']) ?></p>
                    <?php endif; ?>

                    <?php if ($viewer && !$isSelf): ?>
                        <?php if ($following): ?>
                            <form method="post" action="/unfollow.php">
                                <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                                <input type="hidden" name="username" value="<?= e((string) $profile['username']) ?>">
                                <input type="hidden" name="redirect" value="/profile.php?username=<?= rawurlencode((string) $profile['username']) ?>">
                                <button class="btn btn-sm btn-secondary action-btn" type="submit">
                                    <i class="ion-plus-round"></i>&nbsp;Unfollow <?= e((string) $profile['username']) ?>
                                </button>
                            </form>
                        <?php else: ?>
                            <form method="post" action="/follow.php">
                                <input type="hidden" name="_csrf" value="<?= e($csrfToken) ?>">
                                <input type="hidden" name="username" value="<?= e((string) $profile['username']) ?>">
                                <input type="hidden" name="redirect" value="/profile.php?username=<?= rawurlencode((string) $profile['username']) ?>">
                                <button class="btn btn-sm btn-outline-secondary action-btn" type="submit">
                                    <i class="ion-plus-round"></i>&nbsp;Follow <?= e((string) $profile['username']) ?>
                                </button>
                            </form>
                        <?php endif; ?>
                    <?php elseif ($isSelf): ?>
                        <a class="btn btn-sm btn-outline-secondary action-btn" href="/settings.php">
                            <i class="ion-gear-a"></i>&nbsp;Edit Profile Settings
                        </a>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <div class="container">
        <div class="row">
            <div class="col-xs-12 col-md-10 offset-md-1">
                <div class="articles-toggle">
                    <ul class="nav nav-pills outline-active">
                        <li class="nav-item">
                            <a class="nav-link<?= $tab === 'articles' ? ' active' : '' ?>" href="/profile.php?username=<?= rawurlencode((string) $profile['username']) ?>">My Articles</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link<?= $tab === 'favorites' ? ' active' : '' ?>" href="/profile_favorites.php?username=<?= rawurlencode((string) $profile['username']) ?>">Favorited Articles</a>
                        </li>
                    </ul>
                </div>
