# Investa Farm — Web Platform

Africa's leading financially inclusive agricultural investment platform. Investors earn up to **28% returns**; farmers earn **35–55% revenue share** at harvest — no loans, no debt.

**Live app:** [app.investafarm.com](https://app.investafarm.com) · **Website:** [investafarm.com](https://investafarm.com)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript — served by Vite |
| API | Node.js + Express 5, TypeScript |
| AI Chat | Groq API — Llama 3.3-70b (rules-based fallback if key absent) |
| Payments | Paystack (M-Pesa + card), Stripe |
| Map | Leaflet.js (OpenStreetMap) |
| Emails | Resend |
| PWA | manifest.json + service worker |
| Monorepo | pnpm workspaces, Node 20+ |

---

## Project Structure

```
/
├── artifacts/
│   ├── investa-farm/              # Frontend (Vite static server)
│   │   ├── index.html             # Homepage
│   │   └── public/
│   │       ├── investors.html     # For Investors page
│   │       ├── farmers.html       # For Farmers page
│   │       ├── cooperatives.html  # Cooperatives & Partners
│   │       ├── app.html           # App / PWA page
│   │       ├── team.html          # Team & Awards
│   │       ├── admin.html         # Admin dashboard (password-protected)
│   │       ├── styles.css         # All site styles — grass-green design system
│   │       ├── script.js          # Frontend JS — chat UI, map, animations, visit beacon
│   │       ├── manifest.json      # PWA manifest
│   │       ├── sw.js              # Service worker — offline caching
│   │       └── *.png / *.jpg      # App screenshots & site imagery
│   │
│   └── api-server/                # Express API (TypeScript)
│       └── src/
│           ├── routes/
│           │   ├── chat.ts        # POST /api/chat  — Groq AI chatbot
│           │   ├── admin.ts       # POST /api/visit + /api/admin/* — auth & analytics
│           │   └── health.ts      # GET  /api/healthz
│           └── index.ts           # Server entry point (reads PORT env var)
│
└── package.json                   # pnpm workspace root
```

---

## Running Locally

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)

### Setup

```bash
# Install all dependencies
pnpm install

# Start the API server (runs on port from env or defaults to 8080)
pnpm --filter @workspace/api-server run dev

# In a second terminal — start the frontend dev server
pnpm --filter @workspace/investa-farm run dev
```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:8080`.

### Environment variables

Create a `.env` file in `artifacts/api-server/` (or export these in your shell):

```env
# Required for AI chatbot
GROQ_API_KEY=your_groq_api_key

# Required for admin dashboard at /admin.html
ADMIN_PASSWORD=your_chosen_password

# Payment providers
PAYSTACK_SECRET_KEY=sk_...
PAYSTACK_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="Investa Farm <onboarding@app.investafarm.com>"

# Daraja (M-Pesa)
DARAJA_CONSUMER_KEY=...
DARAJA_CONSUMER_SECRET=...

# Circle
CIRCLE_API_KEY=...

# Vapid (push notifications)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# News feeds
GNEWS_API_KEY=...
MEDIASTACK_API_KEY=...

# CORS — comma-separated allowed origins
ALLOWED_ORIGINS=http://localhost:5173
```

Without `GROQ_API_KEY` the chat widget falls back to a rules-based response engine. All pages still load and display correctly.

---

## Deploying to Render

This project deploys as **two Render services**: a static site (frontend) and a web service (API). Both can be created from one GitHub repo.

### Step 1 — Deploy the API server (Web Service)

1. Go to [render.com/new](https://render.com/new) → **Web Service**
2. Connect your GitHub repo
3. Configure the service:

| Setting | Value |
|---|---|
| **Root directory** | `artifacts/api-server` |
| **Runtime** | Node |
| **Build command** | `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm run build` |
| **Start command** | `node dist/index.mjs` |
| **Instance type** | Free (or Starter for production) |

4. Under **Environment Variables**, add all the keys from the table above (especially `GROQ_API_KEY` and `ADMIN_PASSWORD`).
5. Note the service URL Render assigns — e.g. `https://investa-farm-api.onrender.com`. You'll need it in Step 2.

### Step 2 — Deploy the frontend (Static Site)

1. Go to **render.com/new** → **Static Site**
2. Connect the same GitHub repo
3. Configure the service:

| Setting | Value |
|---|---|
| **Root directory** | `artifacts/investa-farm` |
| **Build command** | `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm run build` |
| **Publish directory** | `dist` |

4. Add a **Redirect/Rewrite rule** so `/api/*` calls reach your API server:

| Source | Destination | Action |
|---|---|---|
| `/api/*` | `https://investa-farm-api.onrender.com/api/:splat` | Rewrite (200) |

   *(Replace the destination URL with your actual API service URL from Step 1)*

5. Click **Deploy** — the site will be live at a `*.onrender.com` URL within a few minutes.

### Step 3 — Custom domain (optional)

In each Render service → **Settings → Custom Domains**, add your domain and follow the DNS instructions. Point your apex domain (`investafarm.com`) to the static site and a subdomain (`api.investafarm.com`) to the API service if preferred.

### Auto-deploys

Every `git push` to `main` triggers a new deployment on both services automatically.

---

## Pages

| Page | URL | Description |
|---|---|---|
| Homepage | `/` | Hero, metrics, live farm listings, partners marquee, PWA CTA |
| For Investors | `/investors.html` | Returns, exit strategies, portfolio management, stockbroker programme |
| For Farmers | `/farmers.html` | Revenue share by crop, KYC flow, farm management app screenshots |
| Cooperatives | `/cooperatives.html` | Partner portal, farmer recruitment, agribusiness partnerships |
| App | `/app.html` | PWA install walkthrough, investor & farmer screen guides |
| Team | `/team.html` | Founders, story timeline, awards |
| Admin | `/admin.html` | Password-protected visit analytics dashboard |

---

## Design System

All styles live in `public/styles.css` using CSS custom properties:

| Token | Value | Use |
|---|---|---|
| `--primary` | `#2e7d32` | Buttons, kickers, step numbers |
| `--primary-strong` | `#1b5e20` | Gradients, hero darks |
| `--forest` | `#1a3d2e` | Hero darkest shade |
| `--grass` | `#43a047` | Hover states |
| `--leaf` | `#66bb6a` | Hero accents |
| `--bg` | `#fafdf8` | Page background |
| `--bg-soft` | `#edf5eb` | Alternating section backgrounds |

Hero gradient: `linear-gradient(150deg, #1a3d2e 0%, #2d6e3b 40%, #3a8c46 100%)`

---

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/healthz` | None | Health check |
| `POST` | `/api/chat` | None | Groq AI chat. Body: `{ messages: [{role, content}] }` |
| `POST` | `/api/visit` | None | Page visit beacon. Body: `{ page: "/investors.html" }` |
| `POST` | `/api/admin/login` | None | Admin login. Body: `{ password }` → sets session cookie |
| `POST` | `/api/admin/logout` | Cookie | Clears session |
| `GET` | `/api/admin/check` | Cookie | Returns `{ authenticated: boolean }` |
| `GET` | `/api/admin/stats` | Cookie | Returns visit counts by page |

---

## Contributing

1. Fork the repo and create a feature branch
2. Run `pnpm install` from the repo root
3. Make your changes
4. Open a pull request against `main`
