# Investa Farm — Web Platform

Africa's leading financially inclusive agricultural investment platform. Investors earn up to 28% returns; farmers earn 35–55% revenue share.

**Live app:** [app.investafarm.com](https://app.investafarm.com) · **Website:** [investafarm.com](https://investafarm.com)

---

## Stack

| Layer | Technology |
|---|---|
| Server (dev) | Node.js + Express |
| Server (prod) | Vercel — static files + serverless API |
| Frontend | Vanilla HTML, CSS, JavaScript |
| AI Chat | Groq API — Llama 3.3 (rules-based fallback if key absent) |
| Map | Leaflet.js (OpenStreetMap) |
| Payments | Paystack (M-Pesa + card) |
| PWA | manifest.json + service worker |

---

## Deploying to Vercel

### One-time setup

1. **Push this repo to GitHub** (or GitLab / Bitbucket)

2. **Import the project into Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click **"Import Git Repository"** and select this repo
   - Framework preset: **Other** (not Vite, not Next.js)
   - Root directory: leave as `/`
   - Build command: leave **empty**
   - Output directory: leave **empty**
   - Click **Deploy**

3. **Add the environment variable**
   - In your Vercel project → **Settings → Environment Variables**
   - Add: `GROQ_API_KEY` = `your_groq_api_key_here`
   - Scope: **Production** (and Preview if you want AI chat in previews)
   - Click **Save**, then **Redeploy** so the variable takes effect

4. **Connect your custom domain** (optional)
   - Vercel project → **Settings → Domains**
   - Add `investafarm.com` and/or `www.investafarm.com`
   - Follow the DNS instructions Vercel provides (usually add an A record or CNAME)

That's it — every `git push` to `main` triggers a new deployment automatically.

---

### How it works on Vercel

```
/                          ← static HTML/CSS/JS served directly by Vercel CDN
├── index.html
├── app.html
├── investors.html
├── farmers.html
├── cooperatives.html
├── team.html
├── styles.css
├── script.js
├── manifest.json
├── sw.js
├── public/                ← app screenshots served as static assets
│
└── api/
    └── chat.js            ← Vercel serverless function (Node 20)
                              POST /api/chat  →  Groq Llama 3.3 AI chat
```

`vercel.json` configures the serverless runtime:
```json
{
  "functions": {
    "api/chat.js": {
      "runtime": "nodejs20.x"
    }
  }
}
```

---

## Running Locally (development)

```bash
npm install
node server.js
# Open http://localhost:5000
```

### Environment Variable (optional)
```
GROQ_API_KEY=your_groq_key
```
Without it, the AI chat widget uses a rules-based fallback. All other features (map, market, animations) work without any API key.

---

## File Structure

```
/
├── server.js                  # Express server — static files + /api/chat proxy
├── package.json               # npm config — "start": "node server.js"
├── vercel.json                # Vercel serverless function config
│
├── index.html                 # Homepage — hero, metrics, live farms, partners, PWA CTA
├── investors.html             # Investors — returns, market, portfolio management fees
├── farmers.html               # Farmers — KYC flow screenshots, farm management app
├── cooperatives.html          # Cooperatives — partner portal, farmer recruitment steps
├── app.html                   # App page — PWA install, investor & farmer screen walkthroughs
├── team.html                  # Team — founders (photos), story timeline, awards
│
├── styles.css                 # All CSS — grass-green design system
├── script.js                  # Frontend JS — chat, Leaflet map, PWA banner, animations
│
├── manifest.json              # PWA manifest — icons, theme colour, display mode
├── sw.js                      # Service worker — offline caching
│
├── api/
│   └── chat.js                # Vercel serverless function — Groq AI chat endpoint
│
└── public/                    # App screenshots served at /public/xxx.png
    ├── FARMER SCREENS
    ├── app-farmer-home-dashboard.png
    ├── app-my-farm-gps.png
    ├── app-kyc-required.png
    ├── app-kyc-email-otp.png
    ├── app-kyc-email-review.png
    ├── app-farmer-home.png
    ├── app-my-farm.png
    ├── app-farm-market-inputs.png
    ├── app-farm-contracts.png
    ├── app-farmer-wallet.png
    ├── app-farmer-profile.png
    ├── app-farmer-kyc.png
    ├── app-investment-form.png
    ├── INVESTOR SCREENS
    ├── app-portfolio.png
    ├── app-holdings.png
    ├── app-inv-wallet.png
    ├── app-activity.png
    ├── app-dividends.png
    ├── app-primary-market.png
    ├── app-farm-exchange.png
    └── PARTNER SCREENS
        ├── app-partner-portal.png
        └── app-input-provider.png
```

---

## Pages & Key Sections

### `index.html` — Homepage
- Hero with investor/farmer dual role selector
- Metrics strip: 120,000+ farmers, £4.8M deployed, Kenya/UK/USA
- How it works (3-step investor flow)
- Live farm listings with interactive Leaflet.js map
- Partners marquee (Microsoft, Mastercard, ygap, etc.)
- Social proof photos
- PWA download CTA

### `investors.html` — For Investors
- Hero: up to 28% returns, real portfolio app screenshots
- App step walkthrough with real screenshots
- Feature cards (market, portfolio, exit strategies)
- Stockbroker / referral programme
- Live primary market listings table
- **Portfolio Management** — fee tiers (2.5% / 2.0% / 1.5% per season)

### `farmers.html` — For Farmers
- Hero: 35–55% revenue share, 0% debt, 100% capital provided
- Revenue share table by crop type
- **KYC Flow App Screenshots** — home dashboard, KYC required, OTP email, review email
- **Farm Management App Screenshots** — GPS map, inputs, contracts, wallet
- Eligibility requirements + step-by-step how to get started

### `cooperatives.html` — Cooperatives & Partners
- Hero: 120,000+ farmers in network, $4.8M deployed
- Farmer cooperative onboarding steps
- Agribusiness partnership types
- Partner Portal screenshots + Farmer Recruitment section

### `app.html` — The App (PWA)
- Hero: install as PWA — no app store needed
- Investor side screen walkthrough
- Farmer side screen walkthrough

### `team.html` — Team & Awards
- Story timeline (2023 → present)
- Founders: Moses Ochieng (CEO) + Corrine Munyi — with photos
- Awards: AfricArena Winner, MEST Finalist, GITEX Africa, ATS Web3 Finalist, iBiz Women in Tech, Kenya Blockchain Conference, Startupbootcamp, AFRISE

---

## Design System (CSS Variables)

| Token | Value | Use |
|---|---|---|
| `--primary` | `#2e7d32` | Buttons, kickers, step numbers |
| `--primary-strong` | `#1b5e20` | Gradients, hero darks |
| `--forest` | `#1a3d2e` | Inner hero darkest |
| `--grass` | `#43a047` | Hover states |
| `--leaf` | `#66bb6a` | Hero accents |
| `--bg` | `#fafdf8` | Page background |
| `--bg-soft` | `#edf5eb` | Section alternates |

Hero backgrounds: `linear-gradient(150deg, #1a3d2e 0%, #2d6e3b 40%, #3a8c46 100%)`
