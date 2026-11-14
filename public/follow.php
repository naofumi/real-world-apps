<?php

declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

require_post();
require_csrf($csrf);
$viewer = require_login($session, $users);

$username = trim(post('username'));
$profile = $users->findByUsername($username);
if ($profile === null) {
    http_response_code(404);
    echo 'Profile not found.';
    exit;
}

$users->follow((int) $viewer['id'], (int) $profile['id']);

$redirect = post('redirect', '/profile.php?username=' . rawurlencode((string) $profile['username']));
if (!str_starts_with($redirect, '/')) {
    $redirect = '/profile.php?username=' . rawurlencode((string) $profile['username']);
}
redirect($redirect);
