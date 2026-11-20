# Agent notes (apps/laravel-inertia)

## Style goals

1. **Inertia pages + thin controllers**: each Conduit screen is a React page under `resources/js/Pages/`; controllers validate, authorize, and pass plain props.
2. **Eloquent + Policies**: domain lives on models; ownership rules live in `app/Policies/` (CanCanCan analogue). Prefer `$this->authorize(...)` over ad-hoc checks.
3. **Conduit Minimal CSS** for product chrome — do not introduce a parallel Tailwind/Breeze look.
4. **Resourceful HTML/Inertia routes** (`articles`, `users/{username}`, `settings`, `feed`) rather than a JSON API.
5. **Lean auth** matching sibling React+Hono: register, login, logout, cookie session + CSRF. No password-reset / email-verification / confirm-password suite.

## Layout

| Path | Role |
| --- | --- |
| `routes/web.php` | Conduit routes |
| `routes/auth.php` | Register / login / logout |
| `app/Http/Controllers/` | Thin request handlers |
| `app/Models/` | Eloquent + domain helpers |
| `app/Policies/` | Authorization |
| `resources/js/Pages/` | Inertia React screens |
| `resources/css/conduit.css` | Shared Conduit theme |
| `tests/Feature/` | PHPUnit HTTP/Inertia tests |
| `e2e/` | Playwright flows |

## Testing

- Prefer Feature tests for server behavior and policies.
- Prefer Playwright for a few end-to-end UI flows.
- Do not extract controllers/services solely to make unit tests easier.

## Companion stacks

Mirror product behavior from `apps/react-hono` for auth surface area; use `apps/rails-erb` for structural (resourceful HTML) analogues and `apps/php/docs/features.md` for Conduit inventory when adding screens.
