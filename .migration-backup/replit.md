# Investa Farm

A fintech-enabled agricultural investment platform connecting investors with smallholder farmers and cooperatives in Kenya, UK, and USA. Structured like a "digital stock exchange for agriculture."

## Stack
- **Backend**: Node.js + Express serving static files, a `/api/chat` endpoint, visit-tracking middleware, and admin APIs
- **Frontend**: Vanilla HTML/CSS/JS with Leaflet.js maps and Paystack payments
- **AI Chat**: Groq API (Llama 3.3) with a rules-based fallback when no key is set
- **PWA**: manifest.json + service worker for installable mobile experience

## Pages
- `index.html` — homepage
- `investors.html`, `farmers.html`, `cooperatives.html` — audience-specific landing pages
- `app.html` — app walkthrough with an investor/farmer step navigator and a "Book a Demo Call" CTA
- `team.html` — company story, founders, and awards
- `admin.html` — password-protected dashboard showing site visit analytics

## Site Visit Tracking
- Every page view to a tracked page is logged server-side (in-memory + persisted to `data/visits.json`)
- Tracks total visits, per-page view counts, daily visit counts, and the last 200 visits (page, timestamp, referrer, user agent)
- No cookies or tracking are used on the visitor's side — this is server-side aggregate analytics only

## Admin Dashboard
- Available at `/admin.html`
- Protected by the `ADMIN_PASSWORD` secret; login issues an HttpOnly session cookie (in-memory session store)
- Shows total page views, today's visits, a per-page breakdown, and a recent-visits table via `/api/admin/stats`

## Running the app
```
npm install
node server.js
```
Runs on port 5000.

## Environment Variables
- `GROQ_API_KEY` — Groq API key for the AI chat assistant (optional; falls back to rules-based chat)
- `ADMIN_PASSWORD` — password to access the `/admin.html` visit-tracking dashboard
- `PORT` — Server port (defaults to 5000)

## User preferences
- Keep the existing project structure and file layout
