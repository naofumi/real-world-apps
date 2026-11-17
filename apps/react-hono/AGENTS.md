# Agent notes (apps/react-hono)

## Style goals

1. Make illegal states unrepresentable (discriminated unions over parallel flags).
2. Prefer small modeling wins; avoid extract or polish spirals.
3. Authority lives on the server; the SPA renders `permissions` from JSON.

## Where the rules live

Actionable coding norms are in `.cursor/rules/`:

- `client-state-unions.mdc`
- `server-permissions-json.mdc`
- `hono-zod-middleware.mdc`
- `naming-return-type.mdc`
- `testing-e2e-over-mocks.mdc`

Follow those over older patterns in the tree when they conflict.
