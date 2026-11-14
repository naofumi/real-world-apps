<?php

declare(strict_types=1);

namespace App\Http\Controller;

use App\Http\Request;
use App\Http\Response;
use App\Http\View;
use App\Persistence\UserRepository;
use App\Security\Csrf;
use App\Security\Password;
use App\Security\Session;

final class AuthController
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly Session $session,
        private readonly Csrf $csrf,
    ) {
    }

    public function showLogin(Request $request, array $params = []): Response
    {
        if ($this->session->userId() !== null) {
            return Response::redirect('/');
        }

        return Response::html(View::render('auth/login', [
            'title' => 'Sign in — Conduit',
            'viewer' => null,
            'error' => null,
            'email' => '',
            'csrf' => $this->csrf->token(),
        ]));
    }

    public function login(Request $request, array $params = []): Response
    {
        if (!$this->csrf->validate($request->input('_csrf'))) {
            return Response::html(View::render('auth/login', [
                'title' => 'Sign in — Conduit',
                'viewer' => null,
                'error' => 'Invalid security token. Please try again.',
                'email' => $request->input('email'),
                'csrf' => $this->csrf->token(),
            ]), 422);
        }

        $email = trim($request->input('email'));
        $password = $request->input('password');
        $user = $this->users->findByEmail($email);

        if ($user === null || !Password::verify($password, (string) $user['password_hash'])) {
            return Response::html(View::render('auth/login', [
                'title' => 'Sign in — Conduit',
                'viewer' => null,
                'error' => 'email or password is invalid',
                'email' => $email,
                'csrf' => $this->csrf->token(),
            ]), 422);
        }

        $this->session->login((int) $user['id']);
        $this->session->flash('notice', 'Signed in as ' . $user['username'] . '.');

        return Response::redirect('/');
    }

    public function logout(Request $request, array $params = []): Response
    {
        if (!$this->csrf->validate($request->input('_csrf'))) {
            return Response::redirect('/');
        }

        $this->session->logout();
        return Response::redirect('/');
    }
}
