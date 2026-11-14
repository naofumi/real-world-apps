<?php

declare(strict_types=1);

namespace App;

use App\Http\Controller\AuthController;
use App\Http\Controller\HomeController;
use App\Http\Request;
use App\Http\Response;
use App\Http\Router;
use App\Persistence\ArticleRepository;
use App\Persistence\PdoFactory;
use App\Persistence\UserRepository;
use App\Security\Csrf;
use App\Security\Session;
use PDO;

final class App
{
    private Router $router;
    private Session $session;

    public function __construct(?PDO $pdo = null)
    {
        $pdo ??= PdoFactory::make();
        $this->session = new Session();
        $csrf = new Csrf($this->session);
        $users = new UserRepository($pdo);
        $articles = new ArticleRepository($pdo);
        $home = new HomeController($articles, $users, $this->session, $csrf);
        $auth = new AuthController($users, $this->session, $csrf);

        $this->router = new Router();
        $this->router->get('/', $home->index(...));
        $this->router->get('/login', $auth->showLogin(...));
        $this->router->post('/login', $auth->login(...));
        $this->router->post('/logout', $auth->logout(...));
    }

    public function handle(Request $request): Response
    {
        $this->session->start();
        return $this->router->dispatch($request);
    }
}
