<?php

declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

$username = trim(query('username'));
$profile = $username !== '' ? $users->findByUsername($username) : null;
if ($profile === null) {
    http_response_code(404);
    echo 'Profile not found.';
    exit;
}

$viewer = viewer($session, $users);
$csrfToken = $csrf->token();
$flash = $session->pullFlash('notice');
$alert = $session->pullFlash('alert');

$following = $viewer !== null && $users->isFollowing((int) $viewer['id'], (int) $profile['id']);
$isSelf = $viewer !== null && (int) $viewer['id'] === (int) $profile['id'];
$page = max(1, (int) query('page', '1'));
$perPage = 10;
$offset = ($page - 1) * $perPage;
$feedArticles = $articles->listFavoritedBy((int) $profile['id'], $perPage, $offset);
$tab = 'favorites';

$title = '@' . $profile['username'] . ' favorites — Conduit';
require dirname(__DIR__) . '/includes/header.php';
require dirname(__DIR__) . '/includes/profile_shell.php';

foreach ($feedArticles as $article) {
    require dirname(__DIR__) . '/includes/article_preview.php';
}
if ($feedArticles === []) {
    echo '<div class="article-preview"><p class="empty-feed-message">No favorited articles.</p></div>';
}
?>
            </div>
        </div>
    </div>
</div>
<?php require dirname(__DIR__) . '/includes/footer.php'; ?>
