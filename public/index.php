<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use App\App;
use App\Http\Request;

$app = new App();
$app->handle(Request::fromGlobals())->send();
