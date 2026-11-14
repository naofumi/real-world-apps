<?php

declare(strict_types=1);

namespace App\Http\Controller;

use App\Http\Request;
use App\Http\Response;
use App\Http\View;
use App\Persistence\ArticleRepository;
use App\Persistence\UserRepository;
use App\Security\Csrf;
use App\Security\Session;

final class HomeController
{
    public function __construct(
        private readonly ArticleRepository $articles,
        private readonly UserRepository $users,
        private readonly Session $session,
        private readonly Csrf $csrf,
    ) {
    }

    public function index(Request $request, array $params = []): Response
    {
        $viewer = null;
        $userId = $this->session->userId();
        if ($userId !== null) {
            $viewer = $this->users->findById($userId);
        }

        $html = View::render('home/index', [
            'title' => 'Home — Conduit',
            'viewer' => $viewer,
            'articles' => $this->articles->listGlobal(),
            'articleCount' => $this->articles->countGlobal(),
            'flash' => $this->session->pullFlash('notice'),
            'csrf' => $this->csrf->token(),
        ]);

        return Response::html($html);
    }
}
