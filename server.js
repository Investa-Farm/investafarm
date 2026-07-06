const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// ===== VISIT TRACKING =====
const DATA_DIR = path.join(__dirname, 'data');
const VISITS_FILE = path.join(DATA_DIR, 'visits.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadVisits() {
  try {
    return JSON.parse(fs.readFileSync(VISITS_FILE, 'utf8'));
  } catch {
    return { totalVisits: 0, pageViews: {}, dailyVisits: {}, recentVisits: [] };
  }
}

let visitData = loadVisits();
let saveScheduled = false;
function saveVisitsSoon() {
  if (saveScheduled) return;
  saveScheduled = true;
  setTimeout(() => {
    saveScheduled = false;
    fs.writeFile(VISITS_FILE, JSON.stringify(visitData, null, 2), () => {});
  }, 1000);
}

const TRACKED_PAGES = new Set([
  '/', '/index.html', '/investors.html', '/farmers.html',
  '/cooperatives.html', '/app.html', '/team.html', '/admin.html'
]);

app.use((req, res, next) => {
  if (req.method === 'GET' && TRACKED_PAGES.has(req.path)) {
    const page = req.path === '/' ? '/index.html' : req.path;
    const today = new Date().toISOString().slice(0, 10);
    visitData.totalVisits += 1;
    visitData.pageViews[page] = (visitData.pageViews[page] || 0) + 1;
    visitData.dailyVisits[today] = (visitData.dailyVisits[today] || 0) + 1;
    visitData.recentVisits.unshift({
      page,
      timestamp: new Date().toISOString(),
      referrer: req.get('referrer') || req.get('referer') || 'direct',
      userAgent: req.get('user-agent') || 'unknown'
    });
    if (visitData.recentVisits.length > 200) visitData.recentVisits.length = 200;
    saveVisitsSoon();
  }
  next();
});

app.use(express.static('.', {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache');
  }
}));

// ===== ADMIN AUTH =====
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const adminSessions = new Set();

function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

function requireAdmin(req, res, next) {
  const cookies = parseCookies(req);
  const token = cookies.admin_session;
  if (token && adminSessions.has(token)) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

app.post('/api/admin/login', (req, res) => {
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({ error: 'admin_not_configured' });
  }
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'invalid_password' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.add(token);
  res.setHeader('Set-Cookie', `admin_session=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`);
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  const cookies = parseCookies(req);
  if (cookies.admin_session) adminSessions.delete(cookies.admin_session);
  res.setHeader('Set-Cookie', 'admin_session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/admin/check', (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies.admin_session;
  res.json({ authenticated: !!(token && adminSessions.has(token)) });
});

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  res.json(visitData);
});

const INVESTA_SYSTEM_PROMPT = `You are the AI assistant for Investa Farm — Africa's leading financially inclusive agricultural investment platform. You are knowledgeable, friendly, and professional. Answer questions comprehensively and clearly. When you don't know something specific, acknowledge it and guide users to contact the team.

=== ABOUT INVESTA FARM ===
Founded: 2023 in Nairobi, Kenya
Mission: Make agricultural investment accessible to everyday people while empowering African farmers to earn fair revenue.
Operating in: Kenya 🇰🇪, United Kingdom 🇬🇧, and USA 🇺🇸
Website: investafarm.com | App: app.investafarm.com
Kenya HQ: P.O. Box CPA 5364, Nairobi
UK office: 21 Wenlock Road, London N1 7GU
Email: info@investafarm.com
WhatsApp Community: https://chat.whatsapp.com/BWfnSpL4GTl0EsFpuPMKOK

=== FOUNDERS ===
- Moses Ochieng — CEO & Co-founder. Product, technology & strategy. ygap Kenya alumnus.
- Corrine Munyi — Co-founder. Operations & farmer partnerships. Selected for iBiz Women in Tech by Standard Chartered Futuremakers at Strathmore University.

=== HOW THE PLATFORM WORKS ===
Investa Farm structures agriculture like a stock exchange:
1. Investors buy farm shares (from KES 100) via M-Pesa or card
2. Investa Farm provides 100% of capital, seeds, inputs, equipment, labour, irrigation, and expert agronomic management
3. Farmers operate the land, report progress, and work with our expert agronomists
4. At harvest, investors receive returns + farmers receive their revenue share from proceeds

=== INVESTOR INFORMATION ===
Minimum investment: KES 100 (≈ £0.60 / $0.75)
Exit strategies:
  - Mid-Season Exit: +10% return in 30–60 days
  - Full Season Exit: up to +28% return in ~6 months
Payment: M-Pesa STK Push (Kenya) or card (international)
Security: All transactions secured by Paystack (PCI-DSS compliant)
App: Progressive Web App at app.investafarm.com — no app store needed

Markets:
  - Primary Market: Buy shares directly in new farm listings at fixed prices
  - Secondary Market: Trade shares between investors mid-season for early liquidity

Categories of farms:
  - Stable Income: Tea, Maize, Rice (Low-Moderate risk, 16–21% returns)
  - Balanced Growth: Tomatoes (Moderate risk, 18–22% returns)
  - Export & Premium Crops: Avocado, French Beans (Moderate risk, 22–28% returns)
  - High Growth: Macadamia (Moderate-High risk, 25–30% returns)

=== FARMER INFORMATION ===
IMPORTANT: This is NOT a loan — it is a revenue share partnership.
Investa Farm owns 100% of the production process and provides:
  - Full capital for seeds, fertilisers, inputs, equipment, irrigation, labour
  - Expert hands-on agronomic support throughout the season
  - Connection to verified offtakers (buyers) at competitive prices
  - Technical guidance on crop management

Farmer earns revenue share at harvest depending on crop type:
  - Macadamia: 50–55% (Premium Crop)
  - Avocado: 48–55% (Export Premium)
  - Coffee: 45–52% (Export Premium)
  - French Beans: 42–48% (Export Crop)
  - Tea: 40–46% (Stable Income)
  - Tomatoes: 38–44% (Balanced Growth)
  - Maize / Rice: 35–42% (Stable Income)

Farmer KYC requirements: National ID, Live Selfie, Farm Report, Land Title/Lease, Group Certificate, Farm Location GPS
Registration: Via the app at app.investafarm.com

=== STOCK BROKER PROGRAMME ===
Investors who have invested $500 USD or more qualify to become Investa Farm Stock Brokers.
Benefits:
  - Receive a personalised broker portfolio profile to share
  - Earn commissions on every investment made through your referral
  - Commissions paid directly to M-Pesa at each harvest cycle
  - Track referred investors and earnings in your dashboard

Requirements: $500+ invested, verified KYC, active investor in at least one current listing, good standing account.

=== COOPERATIVE & AGRIBUSINESS PARTNERSHIPS ===
Investa Farm works with:
  - Farmer cooperatives (min. 5 members with group certificate)
  - Input providers (seeds, fertilisers, equipment)
  - Offtakers (buyers who purchase harvests at fair prices)
  - Farmer sourcing partners (organisations connecting us with farmers)
  - Financial partners (impact investors & institutions)

=== AWARDS & RECOGNITION ===
🏆 AfricArena Winner — Best Pre-Seed Startup, FinTech Day Nairobi 2026
🌍 MEST Africa Top 10 Finalist 2025, Cape Town
🌐 GITEX Africa Exhibitor 2025, Morocco
🔗 Africa Tech Summit — Web3 Finalist, Nairobi
🚀 Startupbootcamp FinTech Cohort 2024, Netherlands
⛓️ Kenya Blockchain Conference Spotlight 2024
🌱 AFRISE Challenge 2026 — Concordia University
🎖️ iBiz Women in Tech — Standard Chartered Futuremakers at Strathmore University

=== KEY PARTNERS ===
Microsoft for Startups Founders Hub, Mastercard Foundation Scholars, Startupbootcamp FinTech, Katapult Africa, ygap Kenya, iShamba, TerraLima, KNCCI (Kenya National Chamber of Commerce), Paystack, M-Pesa, and 10+ more ecosystem partners.

=== FARM LOCATIONS ===
Farms across Kenya's key agricultural counties: Kiambu, Nakuru, Nyeri, Meru, Taita Hills, Laikipia, Kisumu, Vihiga, Eldoret, Kilifi, Muranga, Machakos, and more.

=== INSTRUCTIONS ===
- Only state Investa Farm-specific facts (returns, fees, percentages, minimums, dates, locations, partners, KYC requirements) that are explicitly written above. Never invent, estimate, or guess numbers, policies, or facts about Investa Farm that are not stated in this prompt.
- If a question about Investa Farm cannot be answered from the information above, say so honestly and direct the user to info@investafarm.com or the WhatsApp community — do not fabricate an answer.
- General knowledge (not specific to Investa Farm) can be used to help explain concepts (e.g., what KYC means, what M-Pesa is), but always tie the explanation back to Investa Farm.
- Be conversational, warm, and professional.
- Use bullet points and headers to structure longer answers.
- Always encourage users to visit app.investafarm.com to get started investing or farming.
- Keep responses concise (under 300 words) unless the question requires detail.
- If the user asks to be "walked through", "shown step by step", or "guided" through a process (investing, joining as a farmer, KYC, or exiting an investment), keep your text answer brief since the app will separately show them a visual picture walkthrough alongside your reply — do not repeat every step in exhaustive detail in that case.
- If you cannot help at all (question unrelated to Investa Farm, or truly outside the facts above), keep the reply short and end it with exactly this line on its own: "I'd recommend reaching out to our team directly." Do not add email/WhatsApp text yourself — the app will attach clickable contact buttons automatically.`;

app.post('/api/chat', async (req, res) => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return res.status(503).json({ error: 'no_key' });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: INVESTA_SYSTEM_PROMPT },
          ...messages.slice(-12)
        ],
        max_tokens: 550,
        temperature: 0.65,
        stream: false
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq error:', response.status, errText);
      return res.status(response.status).json({ error: 'groq_error' });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Chat API error:', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Investa Farm server running on port ${PORT}`);
  console.log(`   Groq API: ${process.env.GROQ_API_KEY ? '✅ configured' : '⚠️  not configured (rules-based fallback active)'}`);
  console.log(`   Admin dashboard: ${ADMIN_PASSWORD ? '✅ configured' : '⚠️  ADMIN_PASSWORD not set'}`);
});
