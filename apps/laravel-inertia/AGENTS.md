# Agent notes (apps/laravel-inertia)

## Style goals

1. **Inertia pages + thin controllers**: each Conduit screen is a React page under `resources/js/Pages/`; controllers validate, authorize, and pass plain props.
2. **Eloquent + Policies**: domain lives on models; ownership rules live in `app/Policies/` (CanCanCan analogue). Prefer `$this->authorize(...)` over ad-hoc checks.
3. **Conduit Minimal CSS** for product chrome — do not restyle the app with Breeze/Tailwind as the primary look.
4. **Resourceful HTML/Inertia routes** (`articles`, `users/{username}`, `settings`, `feed`) rather than a JSON API.

## Layout

| Path | Role |
| --- | --- |
| `routes/web.php` | Conduit routes |
| `routes/auth.php` | Breeze auth + password reset |
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

Mirror product behavior from `apps/rails-erb` (closest structural analogue) and feature inventory from `apps/php/docs/features.md` when adding surface area.
