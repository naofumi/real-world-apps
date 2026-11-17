<?php

declare(strict_types=1);

namespace App\Security;

final class Session
{
    private bool $started = false;

    public function start(): void
    {
        if ($this->started || session_status() === PHP_SESSION_ACTIVE) {
            $this->started = true;
            return;
        }

        session_start([
            'cookie_httponly' => true,
            'cookie_samesite' => 'Lax',
            'use_strict_mode' => true,
        ]);
        $this->started = true;
    }

    public function get(string $key, mixed $default = null): mixed
    {
        $this->start();
        return $_SESSION[$key] ?? $default;
    }

    public function set(string $key, mixed $value): void
    {
        $this->start();
        $_SESSION[$key] = $value;
    }

    public function flash(string $key, mixed $value): void
    {
        $this->start();
        $_SESSION['_flash'][$key] = $value;
    }

    public function pullFlash(string $key, mixed $default = null): mixed
    {
        $this->start();
        $value = $_SESSION['_flash'][$key] ?? $default;
        unset($_SESSION['_flash'][$key]);
        return $value;
    }

    public function userId(): ?int
    {
        $id = $this->get('user_id');
        return is_int($id) ? $id : (is_numeric($id) ? (int) $id : null);
    }

    public function login(int $userId): void
    {
        $this->start();
        session_regenerate_id(true);
        $this->set('user_id', $userId);
    }

    public function logout(): void
    {
        $this->start();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $params['path'],
                'domain' => $params['domain'],
                'secure' => (bool) $params['secure'],
                'httponly' => (bool) $params['httponly'],
                'samesite' => $params['samesite'] ?? 'Lax',
            ]);
        }
        session_destroy();
        $this->started = false;
    }
}
