# Investa Farm — Web Platform

Africa's financially inclusive agricultural investment platform. Investors earn up to 28% returns; farmers earn 35–55% revenue share at harvest — no loans, no debt.

## How to run

Both services start automatically via Replit workflows:

| Service | Workflow | Preview |
|---|---|---|
| Frontend (Vite) | `artifacts/investa-farm: web` | `/` |
| API (Express) | `artifacts/api-server: API Server` | `/api` |

The API server runs `pnpm run build` (esbuild) then starts the compiled output on each dev restart.

## Stack

- **Frontend**: Vanilla HTML/CSS/JS served by Vite (`artifacts/investa-farm/public/`)
- **API**: Node.js + Express 5 + TypeScript (`artifacts/api-server/src/`)
- **Monorepo**: pnpm workspaces, Node 20

## Environment variables / secrets

Set in `.replit` (shared env):
- `ADMIN_PASSWORD` — password for the `/admin.html` dashboard (currently `admin2024!`)
- `ALLOWED_ORIGINS` — CORS origin for the API
- `RESEND_FROM_EMAIL` — sender address for emails

Optional secrets (features degrade gracefully without them):
- `GROQ_API_KEY` — enables AI chat (Llama 3.3-70b via Groq); falls back to rules-based responses
- `PAYSTACK_SECRET_KEY` — Paystack payments (M-Pesa + card)
- `STRIPE_SECRET_KEY` — Stripe payments (international)
- `RESEND_API_KEY` — transactional emails via Resend
- `SESSION_SECRET` — already available as a Replit secret

## Project structure

```
artifacts/
  investa-farm/       # Vite static server — vanilla HTML/CSS/JS
    public/           # All site pages, styles, scripts, images
  api-server/         # Express API — TypeScript, compiled by esbuild
    src/routes/       # chat, admin, blog, newsletter, health
    data/             # visits.json (in-process visit analytics)
```

## User preferences

- Keep the vanilla HTML/CSS/JS frontend — do not convert to React
- Maintain existing project structure and pnpm workspace layout
