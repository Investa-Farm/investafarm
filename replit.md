# Investa Farm

Africa's financially inclusive agricultural investment platform — connecting investors with smallholder farmers in Kenya, UK, and USA. Investors earn up to 28% returns; farmers earn 35–55% revenue share at harvest.

## Run & Operate

- Workflows auto-start both services when you open the project
- `pnpm --filter @workspace/api-server run dev` — run the API server manually
- `pnpm run typecheck` — full typecheck across all packages
- Required secrets: `GROQ_API_KEY` (AI chatbot), `ADMIN_PASSWORD` (admin dashboard)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: Vite serving vanilla HTML/CSS/JS (artifacts/investa-farm/)
- API: Express 5 (artifacts/api-server/)
- AI: Groq (llama-3.3-70b-versatile) for the in-page chatbot

## Where things live

- `artifacts/investa-farm/index.html` — homepage (vanilla HTML, served by Vite at `/`)
- `artifacts/investa-farm/public/` — all other pages + assets (investors.html, farmers.html, etc.)
- `artifacts/investa-farm/public/script.js` — shared vanilla JS (chatbot UI, visit beacon, animations)
- `artifacts/investa-farm/public/styles.css` — all site styles
- `artifacts/api-server/src/routes/chat.ts` — POST /api/chat (Groq AI chatbot)
- `artifacts/api-server/src/routes/admin.ts` — /api/admin/* (auth + stats) + POST /api/visit

## Architecture decisions

- Frontend is served as static HTML/CSS/JS via Vite's public directory — no React conversion needed since the app is vanilla JS.
- Admin sessions stored in-memory (lost on restart) — suitable for single-instance MVP.
- Visit tracking uses a client-side beacon (POST /api/visit at page load) since Vite serves the HTML, not Express.
- Chat route has 20s AbortController timeout to prevent stalled Groq requests hanging the server.
- Admin login cookie uses `Secure` flag only in production (`NODE_ENV === "production"`).

## Product

- **Homepage** (`/`) — hero, live farm listings, partners marquee, testimonials, FAQ
- **For Investors** (`/investors.html`) — investor guide, exit strategies, how to invest
- **For Farmers** (`/farmers.html`) — farmer onboarding, revenue share by crop
- **App** (`/app.html`) — PWA walkthrough and app screenshots
- **Cooperatives** (`/cooperatives.html`) — cooperative partnership info
- **Team** (`/team.html`) — founding team and awards
- **Admin** (`/admin.html`) — password-protected dashboard with visit analytics

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Do NOT run `pnpm dev` at workspace root — use the managed workflows or filter commands.
- The Vite app has no React entry point; `src/main.tsx` is scaffold-only. The real content is in `public/`.
- Adding a new HTML page: drop it in `artifacts/investa-farm/public/` and it's immediately served.
- GROQ_API_KEY must be set as a Replit secret for the chatbot to work (returns 503 otherwise).
- ADMIN_PASSWORD must be set as a Replit secret for the admin dashboard to work.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
