// ===== VISIT TRACKING BEACON =====
(function () {
  try {
    const page = window.location.pathname || '/index.html';
    fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page }),
      keepalive: true
    }).catch(function () {});
  } catch (e) {}
})();

// ===== CHATBOT KNOWLEDGE BASE (Rules-Based — No External API) =====
const CHAT_STORAGE_KEY = "if_chat_v2";

const RULES = [
  {
    match: ["hello", "hi ", "hey ", "good morning", "good afternoon", "good evening", "howdy", "sup", "what's up", "greetings"],
    response: "Hi there! 👋 Welcome to **Investa Farm**!\n\nI can help you with:\n• 💰 How to invest in farms\n• 🌾 How farmers earn revenue share\n• 📊 The Stock Broker Programme\n• 📱 The Investa Farm app\n• 🤝 Cooperative partnerships\n• 📞 Contacting the team\n\nWhat would you like to know?"
  },
  {
    match: ["what is investa", "about investa", "tell me about", "what do you do", "explain", "overview", "who are you"],
    response: "**Investa Farm** is Africa's leading financially inclusive agricultural investment platform 🌍\n\n**For investors**: Buy farm shares from KES 100. Earn up to **+28% returns** at harvest.\n\n**For farmers**: We own the entire production process — providing 100% capital, seeds, inputs, equipment & hands-on support. You earn **35–55% revenue share** at harvest. No loans, no debt.\n\nFounded in 2023. Based in Kenya 🇰🇪 and the UK 🇬🇧. Operating in Kenya, UK & USA."
  },
  {
    match: ["invest", "how to invest", "get started", "buy share", "start investing", "begin", "sign up", "register"],
    response: "**How to invest on Investa Farm:**\n\n1. Sign up at **app.investafarm.com**\n2. Browse verified farm listings\n3. Choose your exit strategy:\n   • **Mid-Season Exit**: +10% return in 30–60 days\n   • **Full Season Exit**: up to +28% in ~6 months\n4. Pay securely via **M-Pesa** STK Push\n5. Track your portfolio & receive returns at harvest\n\n💡 Minimum investment: **KES 100** (≈ £0.60 / $0.75)"
  },
  {
    match: ["return", "how much earn", "profit", "interest", "roi", "income", "yield", "percentage", "28%", "10%"],
    response: "**Investor Returns:**\n\n• **Mid-Season Exit**: +10% return (30–60 days)\n• **Full Season Exit**: up to **+28%** return (~6 months)\n\nReturns are paid directly to your M-Pesa at harvest. All listed farms are verified before investment opens. Past performance has shown consistent payouts across all farms on the platform."
  },
  {
    match: ["farmer", "revenue share", "35", "55%", "not a loan", "no loan", "partnership", "how farmer earn", "farmer earn"],
    response: "**Farmer Revenue Share Model:**\n\nThis is **not a loan** — it's a real partnership:\n\n✅ We fund **100% of production costs** (seeds, fertilisers, equipment, labour, irrigation)\n✅ Our team provides **expert agronomic support** throughout the season\n✅ We connect your harvest to verified **offtakers** at competitive prices\n✅ You earn **35–55% of harvest revenue** depending on crop type\n\nNo debt. No interest. No repayment. Just farming and earning. 🌾"
  },
  {
    match: ["crop", "avocado", "coffee", "macadamia", "tea", "french bean", "tomato", "maize", "rice", "sunflower", "which crop"],
    response: "**Revenue share by crop type:**\n\n• 🥑 **Macadamia**: 50–55% (Premium Crop)\n• 🫒 **Avocado**: 48–55% (Export Premium)\n• ☕ **Coffee**: 45–52% (Export Premium)\n• 🫘 **French Beans**: 42–48% (Export Crop)\n• 🍵 **Tea**: 40–46% (Stable Income)\n• 🍅 **Tomatoes**: 38–44% (Balanced Growth)\n• 🌽 **Maize / Rice**: 35–42% (Stable Income)\n\nHigher-value export crops attract the highest farmer revenue shares."
  },
  {
    match: ["broker", "stock broker", "commission", "referral", "$500", "500 dollar", "500 usd", "broker programme"],
    response: "**Stock Broker Programme:**\n\nInvestors who have invested **$500 or more** qualify to become Investa Farm Stock Brokers:\n\n• Receive a **personalised broker portfolio** to share with your network\n• **Onboard new investors** through your unique referral link\n• **Earn commissions** on every investment made through your link\n• Commissions paid to your M-Pesa at each harvest cycle\n\nApply at app.investafarm.com once you've reached the $500 threshold. 📊"
  },
  {
    match: ["app", "download", "install", "pwa", "progressive web", "phone", "mobile app", "android", "ios", "iphone"],
    response: "**The Investa Farm App:**\n\nIt's a **Progressive Web App (PWA)** — no app store needed!\n\n1. Open **app.investafarm.com** in your browser\n2. Tap the Share/Menu icon\n3. Tap **\"Add to Home Screen\"**\n4. Done — works like a native app!\n\nAvailable on iOS (Safari) and Android (Chrome). Optimised for 2G/3G networks in Kenya. 📱"
  },
  {
    match: ["cooperative", "coop", "farmer group", "group farm", "collective", "join as group"],
    response: "**Cooperative Partnerships:**\n\nInvesta Farm works directly with farmer cooperatives! 🤝\n\n• Groups list farm shares **collectively** on the platform\n• We fund **100% of production costs** for the cooperative\n• Revenue is distributed **transparently** to all members at harvest\n• Minimum: **5 members** with a group certificate\n\nCooperatives unlock larger capital than individual farmers and build a verified track record on the platform."
  },
  {
    match: ["agribusiness", "input provider", "offtaker", "supplier", "buyer", "partner with us", "sourcing"],
    response: "**Agribusiness Partnerships:**\n\nWe work with the full agricultural value chain:\n\n• 🌱 **Input providers** — seeds, fertilisers, equipment\n• 🏪 **Offtakers** — buyers who purchase harvests at fair prices\n• 👥 **Farmer sourcing partners** — organisations connecting us with farmers\n• 🏦 **Financial partners** — impact investors & institutions\n\nEmail **info@investafarm.com** to explore a partnership."
  },
  {
    match: ["mpesa", "m-pesa", "paystack", "payment", "how to pay", "pay", "deposit"],
    response: "**Payments on Investa Farm:**\n\n• All investments made via **M-Pesa STK Push** — fast & secure\n• UK/international investors can pay by **card**\n• All transactions secured by **Paystack** (PCI-DSS compliant)\n• Returns paid directly to your **M-Pesa** at harvest\n\nNo manual bank transfers needed — everything happens in the app. 🔐"
  },
  {
    match: ["secondary market", "trade share", "sell share", "buy from investor", "resell", "exit early"],
    response: "**Secondary Market:**\n\nCan't wait for the full season? Use the **Secondary Market**:\n\n• **Sell your shares** to another investor before harvest for early liquidity\n• **Buy shares** from investors who need to exit early\n• Trade mid-season at market-determined prices\n\nFind it in the Investa Farm app under **'Secondary Market'**."
  },
  {
    match: ["primary market", "farm listing", "available farm", "which farm", "live farm"],
    response: "**Primary Market:**\n\nThe Primary Market is where you buy **shares directly in new farm listings** at fixed prices. Browse by:\n\n• 🌱 **Stable Income** — Tea, Maize, Rice (Low-Moderate risk)\n• ⚖️ **Balanced Growth** — Tomatoes (Moderate risk)\n• 🌍 **Export & Premium Crops** — Avocado, Beans (Moderate risk)\n• 🚀 **High Growth** — Macadamia (Moderate-High risk)\n\nBrowse live listings at app.investafarm.com"
  },
  {
    match: ["risk", "safe", "secure", "protect", "guarantee", "insure", "what if crop fail"],
    response: "**Risk & Security:**\n\nInvesta Farm takes risk management seriously:\n\n• Every farm is **verified** before listing (land title, KYC, farm reports)\n• All payments secured by **Paystack** (PCI-DSS compliant)\n• Expert **agronomists** monitor farms throughout the season\n• Verified **offtakers** are arranged before planting\n• **Diversify** across crops and farms to reduce exposure\n\nAgricultural investment carries inherent weather & market risks — we mitigate these through expertise and verified supply chains."
  },
  {
    match: ["award", "recognition", "winner", "africarena", "mest", "gitex", "startupbootcamp", "blockchain", "ats", "africa tech"],
    response: "**Investa Farm Awards & Recognition:**\n\n🏆 **AfricArena Winner** — Best Pre-Seed Startup, Nairobi 2026\n🌍 **MEST Africa Top 10 Finalist** 2025, Cape Town\n🌐 **GITEX Africa** Exhibitor 2025, Morocco\n🔗 **Africa Tech Summit** — Web3 Finalist, Nairobi\n🚀 **Startupbootcamp FinTech** Cohort 2024, Netherlands\n⛓️ **Kenya Blockchain Conference** Spotlight 2024\n🌱 **AFRISE Challenge** 2026 — Concordia University"
  },
  {
    match: ["team", "founder", "who built", "ceo", "moses", "corrine", "who started", "history"],
    response: "**Investa Farm was founded in 2023 by:**\n\n👤 **Moses Ochieng** — CEO & Co-founder. Product, technology & strategy. ygap Kenya alumnus.\n\n👤 **Corrine Munyi** — Co-founder. Operations & farmer partnerships. Selected for iBiz Women in Tech by Standard Chartered Futuremakers at Strathmore University.\n\nBoth are committed to making agricultural investment accessible to everyday people across Africa."
  },
  {
    match: ["contact", "email", "reach you", "talk to", "speak to", "phone", "get in touch", "enquiry"],
    response: "**Contact Investa Farm:**\n\n📧 **Email**: info@investafarm.com\n💬 **WhatsApp**: chat.whatsapp.com/BWfnSpL4GTl0EsFpuPMKOK\n📍 **Kenya**: P.O. Box CPA 5364, Nairobi\n📍 **London**: 21 Wenlock Road, N1 7GU\n\nAvailable Mon–Fri, 8:00–18:00 EAT. Or use the **Contact Form** on our homepage. 📋"
  },
  {
    match: ["newsletter", "subscribe", "update", "news", "notification", "stay informed"],
    response: "📬 **Subscribe to our newsletter!**\n\nScroll to the **Contact section** on our homepage to subscribe. Enter your email and you'll receive:\n\n• 🌾 New farm investment opportunities\n• 💰 Harvest results & payout announcements\n• 📊 Platform updates & market insights\n\nOr join our **WhatsApp Community** for real-time updates!"
  },
  {
    match: ["minimum", "how much to invest", "minimum invest", "least amount", "kes 100", "start with"],
    response: "**Minimum Investment:**\n\nYou can invest from as little as **KES 100** (approximately £0.60 or $0.75).\n\nThis makes Investa Farm accessible to everyday investors — you don't need large sums to start earning from real African farms. You can invest across multiple farms to diversify your portfolio."
  },
  {
    match: ["kenya", "uk", "united kingdom", "nairobi", "london", "location", "where", "country"],
    response: "**Investa Farm operates in:**\n\n🇰🇪 **Kenya** — P.O. Box CPA 5364, Nairobi (Farm operations)\n🇬🇧 **United Kingdom** — 21 Wenlock Road, London N1 7GU\n🇺🇸 **United States** — Strategic operations\n\nOur farms are across Kenya's key agricultural counties: Kiambu, Nakuru, Nyeri, Meru, Taita Hills, Laikipia, Meru, Kisumu and more."
  },
  {
    match: ["partner", "partners", "microsoft", "mastercard", "startupbootcamp", "katapult"],
    response: "**Our Key Partners:**\n\n• Microsoft for Startups Founders Hub\n• Mastercard Foundation Scholars\n• Startupbootcamp FinTech\n• Katapult Africa\n• ygap Kenya\n• iShamba\n• TerraLima\n• KNCCI (Kenya National Chamber of Commerce)\n• Paystack & M-Pesa (payments)\n\nPlus 10+ additional ecosystem partners across Africa, Europe, and North America."
  },
  {
    match: ["thank", "thanks", "great", "perfect", "awesome", "excellent", "helpful"],
    response: "You're welcome! 😊 Is there anything else I can help you with about Investa Farm?\n\nFeel free to also:\n• 📱 Visit **app.investafarm.com** to get started\n• 💬 Join our **WhatsApp Community**\n• 📧 Email us at **info@investafarm.com**"
  },
  {
    match: ["bye", "goodbye", "see you", "ciao", "later"],
    response: "Goodbye! 👋 Thanks for your interest in Investa Farm. Visit **app.investafarm.com** to start investing in real Kenyan farms — and remember, every share you buy helps a farmer earn their fair revenue share. 🌾🇰🇪"
  }
];

const FALLBACK_NO_MATCH = "I'm not totally sure about that one 🤔 I can help with investing, farmer revenue share, the app, cooperatives, stock brokers, and more.\n\nCould you rephrase your question, or reach our team directly?";

function normalizeForMatch(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s%$]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBotResponse(userText) {
  const text = normalizeForMatch(userText);
  let bestRule = null;
  let bestScore = 0;
  for (const rule of RULES) {
    let score = 0;
    for (const kw of rule.match) {
      const kwNorm = normalizeForMatch(kw);
      if (!kwNorm) continue;
      if (text.includes(kwNorm)) score += kwNorm.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }
  if (bestRule) return bestRule.response;
  return FALLBACK_NO_MATCH;
}

// ===== VISUAL STEP-BY-STEP WALKTHROUGHS =====
const WALKTHROUGHS = {
  invest: {
    title: "How to Invest on Investa Farm",
    reply: "Here's a visual, step-by-step walkthrough of how to invest 👇",
    steps: [
      { img: "appscreens/app-onboard1.png", caption: "1. Open the app & get started" },
      { img: "appscreens/app-onboard2.png", caption: "2. Learn how the platform works" },
      { img: "appscreens/app-register.png", caption: "3. Create your free account" },
      { img: "appscreens/app-inv-market.png", caption: "4. Browse live farm listings" },
      { img: "appscreens/app-inv-buy-shares.png", caption: "5. Choose how many shares to buy" },
      { img: "appscreens/app-inv-review-order.png", caption: "6. Review your order" },
      { img: "appscreens/app-inv-mpesa.png", caption: "7. Pay securely via M-Pesa" },
      { img: "appscreens/app-inv-complete.png", caption: "8. Investment confirmed 🎉" },
      { img: "appscreens/app-inv-portfolio.png", caption: "9. Track your returns in your portfolio" }
    ]
  },
  farmer: {
    title: "How to Join as a Farmer",
    reply: "Here's how farmers get set up on Investa Farm 👇",
    steps: [
      { img: "app-onboard-farmer.png", caption: "1. Apply as a farmer partner" },
      { img: "appscreens/app-register.png", caption: "2. Create your account" },
      { img: "appscreens/app-kyc.png", caption: "3. Complete KYC verification" },
      { img: "appscreens/app-farmer-profile.png", caption: "4. Set up your farm profile" },
      { img: "appscreens/app-farmer-dash.png", caption: "5. Manage your farm & track earnings" }
    ]
  },
  exit: {
    title: "How to Exit / Sell Your Shares",
    reply: "Here's how to exit an investment or sell shares early 👇",
    steps: [
      { img: "appscreens/app-inv-portfolio.png", caption: "1. Open your portfolio" },
      { img: "appscreens/app-inv-exit-choose.png", caption: "2. Choose Mid-Season or Full Season exit" },
      { img: "appscreens/app-inv-exit-confirm.png", caption: "3. Confirm your exit request" },
      { img: "appscreens/app-inv-exit-done.png", caption: "4. Payout sent to your M-Pesa 🎉" }
    ]
  },
  kyc: {
    title: "How to Complete KYC Verification",
    reply: "Here's how to verify your account 👇",
    steps: [
      { img: "appscreens/app-register.png", caption: "1. Create your account" },
      { img: "appscreens/app-kyc.png", caption: "2. Upload your ID & required documents" },
      { img: "appscreens/app-inv-complete.png", caption: "3. You're verified and ready to go 🎉" }
    ]
  }
};

function detectWalkthroughIntent(userText) {
  const text = userText.toLowerCase();
  const triggerPhrases = [
    "take me through", "walk me through", "walk through", "show me how",
    "guide me through", "guide me", "step by step", "show me the steps",
    "show me pictures", "show pictures", "show screenshots", "with pictures", "with images"
  ];
  const looseTrigger = text.includes("how") && (text.includes("use the app") || text.includes("get started") || text.includes("use investa"));
  if (!triggerPhrases.some(p => text.includes(p)) && !looseTrigger) return null;

  if (text.includes("exit") || text.includes("sell") || text.includes("cash out") || text.includes("withdraw")) return "exit";
  if (text.includes("kyc") || text.includes("verify") || text.includes("verification")) return "kyc";
  if (text.includes("farmer") || (text.includes("farm") && !text.includes("invest"))) return "farmer";
  return "invest";
}

function addWalkthroughMsg(key) {
  const flow = WALKTHROUGHS[key];
  if (!flow || !chatMessages) return flow ? flow.reply : "";

  const div = document.createElement("div");
  div.className = "chat-msg bot";
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble msg-bubble-walkthrough";

  const introP = document.createElement("p");
  introP.textContent = flow.reply;
  bubble.appendChild(introP);

  const gallery = document.createElement("div");
  gallery.className = "walkthrough-gallery";
  flow.steps.forEach(step => {
    const stepEl = document.createElement("div");
    stepEl.className = "walkthrough-step";
    const img = document.createElement("img");
    img.src = step.img;
    img.alt = step.caption;
    img.loading = "lazy";
    const cap = document.createElement("span");
    cap.textContent = step.caption;
    stepEl.appendChild(img);
    stepEl.appendChild(cap);
    gallery.appendChild(stepEl);
  });
  bubble.appendChild(gallery);

  div.appendChild(bubble);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return `${flow.reply} (Visual walkthrough: ${flow.title})`;
}

// ===== CHAT STORAGE =====
function saveChatSession(historyArr, htmlContent) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ history: historyArr, html: htmlContent }));
  } catch (e) {}
}

function loadChatSession() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function clearChatSession() {
  try { localStorage.removeItem(CHAT_STORAGE_KEY); } catch (e) {}
}

// ===== NAVBAR SCROLL SHADOW =====
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  window.addEventListener('scroll', () => {
    siteHeader.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

// ===== LIVE TICKER =====
const tickerTrack = document.getElementById('tickerTrack');
if (tickerTrack) {
  tickerTrack.innerHTML += tickerTrack.innerHTML;
}

// ===== SCROLL REVEAL =====
const revealTargets = Array.from(document.querySelectorAll(".reveal"));
if (revealTargets.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in-view"); observer.unobserve(e.target); }
      });
    },
    { threshold: 0.07 }
  );
  revealTargets.forEach((t) => observer.observe(t));
}

// ===== MOBILE NAV =====
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
  navLinks.addEventListener("click", (e) => {
    if (e.target.tagName === "A") navLinks.classList.remove("open");
  });
}

// ===== COOKIE BANNER =====
const cookieBanner = document.getElementById("cookieBanner");
const cookieAccept = document.getElementById("cookieAccept");
const cookieDecline = document.getElementById("cookieDecline");

if (cookieBanner && !localStorage.getItem("cookieConsent")) {
  setTimeout(() => cookieBanner.classList.add("show"), 1200);
}
cookieAccept && cookieAccept.addEventListener("click", () => {
  localStorage.setItem("cookieConsent", "accepted");
  cookieBanner.classList.remove("show");
});
cookieDecline && cookieDecline.addEventListener("click", () => {
  localStorage.setItem("cookieConsent", "declined");
  cookieBanner.classList.remove("show");
});

// ===== FAQ ACCORDION =====
document.querySelectorAll('.faq-item').forEach(item => {
  const question = item.querySelector('.faq-question');
  if (!question) return;
  question.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(openItem => {
      if (openItem !== item) {
        openItem.classList.remove('open');
        const btn = openItem.querySelector('.faq-question');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });
    item.classList.toggle('open', !isOpen);
    question.setAttribute('aria-expanded', String(!isOpen));
  });
});

// ===== CHATBOT =====
const chatFab     = document.getElementById("chatFab");
const chatPanel   = document.getElementById("chatPanel");
const chatCloseEl = document.getElementById("chatClose");
const chatNewEl   = document.getElementById("chatNew");
const chatInput   = document.getElementById("chatInput");
const chatSend    = document.getElementById("chatSend");
const chatMessages= document.getElementById("chatMessages");
const chatSuggestionsEl = document.getElementById("chatSuggestions");

let chatHistory = [];

function openChat() {
  if (!chatPanel) return;
  chatPanel.classList.add("open");
  if (chatInput) setTimeout(() => chatInput.focus(), 300);
  const notifDot = chatFab && chatFab.querySelector('.fab-notification-dot');
  if (notifDot) notifDot.style.display = 'none';
}

function closeChat() {
  if (chatPanel) chatPanel.classList.remove("open");
}

function resetChat() {
  chatHistory = [];
  clearChatSession();
  if (chatMessages) {
    chatMessages.innerHTML = `
      <div class="chat-msg bot">
        <div class="msg-bubble">Hi! 👋 I'm the <strong>Investa Farm Bot</strong>. What would you like to know? 🌾</div>
      </div>`;
  }
  renderFollowups();
}

// Restore saved chat history on load
const savedSession = loadChatSession();
if (savedSession && savedSession.html && chatMessages && savedSession.html.length > 100) {
  chatMessages.innerHTML = savedSession.html;
  chatHistory = savedSession.history || [];
  if (chatSuggestionsEl) chatSuggestionsEl.style.display = 'none';
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatFab   && chatFab.addEventListener("click", openChat);
chatNewEl && chatNewEl.addEventListener("click", resetChat);

// Close button — robust fix with stopPropagation
if (chatCloseEl) {
  chatCloseEl.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    closeChat();
  });
}
// Also allow clicking the panel overlay area to close
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeChat();
});

// Close on backdrop click (outside panel)
document.addEventListener("click", (e) => {
  if (chatPanel && chatPanel.classList.contains("open")) {
    if (!chatPanel.contains(e.target) && chatFab && !chatFab.contains(e.target)) {
      closeChat();
    }
  }
});

// ===== CONTEXTUAL FOLLOW-UP SUGGESTIONS =====
const FOLLOWUP_POOL = [
  { q: "How do I invest in a farm?", label: "💰 How to invest" },
  { q: "What returns can investors expect?", label: "📈 Investor returns" },
  { q: "How do farmers earn on Investa Farm?", label: "🌾 Farmer revenue share" },
  { q: "What is a stock broker on Investa Farm?", label: "📊 Stock brokers" },
  { q: "How do I complete KYC?", label: "🪪 KYC verification" },
  { q: "How do I exit or sell my shares?", label: "💸 Exiting an investment" },
  { q: "What crops can I invest in?", label: "🌱 Crop types" },
  { q: "Is my money safe?", label: "🔒 Risk & security" },
  { q: "How do cooperatives work?", label: "🤝 Cooperatives" },
  { q: "How can I contact the team?", label: "📞 Contact us" }
];

function renderFollowups() {
  if (!chatSuggestionsEl) return;
  const askedTexts = chatHistory.filter(m => m.role === 'user').map(m => m.content);
  let remaining = FOLLOWUP_POOL.filter(item => !askedTexts.includes(item.q));
  if (remaining.length < 3) remaining = FOLLOWUP_POOL;
  const picks = remaining.slice(0, 3);
  chatSuggestionsEl.innerHTML = '';
  picks.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'suggestion-chip';
    btn.dataset.q = item.q;
    btn.textContent = item.label;
    chatSuggestionsEl.appendChild(btn);
  });
  chatSuggestionsEl.style.display = '';
}

// Suggestion chips (delegated so dynamically-rendered chips keep working)
chatSuggestionsEl && chatSuggestionsEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.suggestion-chip');
  if (!chip) return;
  const q = chip.dataset.q;
  if (!q || !chatInput) return;
  chatInput.value = q;
  chatSuggestionsEl.style.display = 'none';
  sendMessage();
});

function formatBotMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^• (.+)$/gm, '<li>$1</li>')
    .replace(/^✅ (.+)$/gm, '<li class="check-li">✅ $1</li>')
    .replace(/^🌾 (.+)$/gm, '<li>🌾 $1</li>')
    .replace(/^💰 (.+)$/gm, '<li>💰 $1</li>')
    .replace(/^🏆 (.+)$/gm, '<li>🏆 $1</li>')
    .replace(/^🌍 (.+)$/gm, '<li>🌍 $1</li>')
    .replace(/^🌐 (.+)$/gm, '<li>🌐 $1</li>')
    .replace(/^🔗 (.+)$/gm, '<li>🔗 $1</li>')
    .replace(/^🚀 (.+)$/gm, '<li>🚀 $1</li>')
    .replace(/^⛓️ (.+)$/gm, '<li>⛓️ $1</li>')
    .replace(/^🌱 (.+)$/gm, '<li>🌱 $1</li>')
    .replace(/^   • (.+)$/gm, '<li class="sub-li">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>(\n|$))+/g, match => `<ul>${match}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^<\/p>/, '')
    .replace(/<p>$/, '')
    .replace(/\n/g, '<br>');
}

function addMsg(role, text, skipSave, options = {}) {
  if (!chatMessages) return;
  const div = document.createElement("div");
  div.className = `chat-msg ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  if (role === "bot") {
    bubble.innerHTML = formatBotMessage(text);
  } else {
    const safe = text.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    bubble.innerHTML = safe;
  }
  div.appendChild(bubble);

  if (role === "bot" && options.showHandoff) {
    const handoff = document.createElement("div");
    handoff.className = "msg-handoff-actions";
    handoff.innerHTML = `
      <a href="mailto:info@investafarm.com" class="msg-handoff-btn">📧 Email us</a>
      <a href="https://chat.whatsapp.com/BWfnSpL4GTl0EsFpuPMKOK" target="_blank" rel="noopener" class="msg-handoff-btn">💬 WhatsApp</a>
    `;
    div.appendChild(handoff);
  }

  const meta = document.createElement("div");
  meta.className = "msg-meta";
  const time = document.createElement("span");
  time.className = "msg-time";
  time.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  meta.appendChild(time);

  if (role === "bot") {
    const actions = document.createElement("div");
    actions.className = "msg-actions";
    actions.innerHTML = `
      <button type="button" class="msg-action-btn msg-copy-btn" title="Copy reply">📋</button>
      <button type="button" class="msg-action-btn msg-feedback-btn" data-fb="up" title="Helpful">👍</button>
      <button type="button" class="msg-action-btn msg-feedback-btn" data-fb="down" title="Not helpful">👎</button>
    `;
    meta.appendChild(actions);
  }
  div.appendChild(meta);

  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  if (!skipSave) {
    saveChatSession(chatHistory, chatMessages.innerHTML);
  }
}

// Delegated handlers for copy / feedback buttons (works for restored history too)
chatMessages && chatMessages.addEventListener("click", (e) => {
  const copyBtn = e.target.closest(".msg-copy-btn");
  if (copyBtn) {
    const msgEl = copyBtn.closest(".chat-msg");
    const bubble = msgEl && msgEl.querySelector(".msg-bubble");
    const plain = bubble ? bubble.innerText : "";
    if (navigator.clipboard && plain) {
      navigator.clipboard.writeText(plain).then(() => {
        const original = copyBtn.textContent;
        copyBtn.textContent = "✅";
        setTimeout(() => { copyBtn.textContent = original; }, 1200);
      }).catch(() => {});
    }
    return;
  }
  const fbBtn = e.target.closest(".msg-feedback-btn");
  if (fbBtn) {
    const group = fbBtn.closest(".msg-actions");
    if (group) group.querySelectorAll(".msg-feedback-btn").forEach(b => b.classList.remove("active"));
    fbBtn.classList.add("active");
  }
});

function showTyping() {
  if (!chatMessages) return;
  const div = document.createElement("div");
  div.className = "chat-msg bot";
  div.id = "typingIndicator";
  div.innerHTML = `<div class="msg-typing"><span></span><span></span><span></span></div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById("typingIndicator");
  if (t) t.remove();
}

async function sendMessage() {
  if (!chatInput) return;
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";

  if (chatSuggestionsEl) chatSuggestionsEl.style.display = 'none';
  addMsg("user", text, true);
  chatHistory.push({ role: "user", content: text });
  if (chatHistory.length > 24) chatHistory = chatHistory.slice(-24);

  const walkthroughKey = detectWalkthroughIntent(text);
  if (walkthroughKey) {
    showTyping();
    if (chatSend) chatSend.disabled = true;
    await new Promise(r => setTimeout(r, 500 + Math.random() * 400));
    removeTyping();
    const summary = addWalkthroughMsg(walkthroughKey);
    chatHistory.push({ role: "assistant", content: summary });
    if (chatHistory.length > 24) chatHistory = chatHistory.slice(-24);
    saveChatSession(chatHistory, chatMessages ? chatMessages.innerHTML : '');
    if (chatSend) chatSend.disabled = false;
    if (chatInput) chatInput.focus();
    renderFollowups();
    return;
  }

  showTyping();
  if (chatSend) chatSend.disabled = true;

  let reply = null;
  let usedFallback = false;

  try {
    // Try Groq AI first
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory.slice(-12) })
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.choices && data.choices[0]) {
        reply = data.choices[0].message.content;
      }
    }
  } catch (_) {}

  // Fallback to rules-based if Groq unavailable or failed
  if (!reply) {
    await new Promise(r => setTimeout(r, 700 + Math.random() * 500));
    reply = getBotResponse(text);
    usedFallback = (reply === FALLBACK_NO_MATCH);
  }

  const AI_HANDOFF_MARKER = "I'd recommend reaching out to our team directly.";
  let showHandoff = usedFallback;
  if (reply.includes(AI_HANDOFF_MARKER)) {
    showHandoff = true;
    reply = reply.replace(AI_HANDOFF_MARKER, '').trim();
  }

  removeTyping();
  addMsg("bot", reply, false, { showHandoff });
  chatHistory.push({ role: "assistant", content: reply });
  if (chatHistory.length > 24) chatHistory = chatHistory.slice(-24);
  saveChatSession(chatHistory, chatMessages ? chatMessages.innerHTML : '');
  if (chatSend) chatSend.disabled = false;
  if (chatInput) chatInput.focus();
  renderFollowups();
}

chatSend  && chatSend.addEventListener("click", sendMessage);
chatInput && chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

// ===== PRIMARY MARKET FILTER =====
const pmCatBtns = document.querySelectorAll('.pm-cat');
const pmRows    = document.querySelectorAll('.pm-row, .pm-full-row, .imt-row');

pmCatBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    pmCatBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.cat;
    pmRows.forEach(row => {
      const show = (cat === 'all' || row.dataset.cat === cat);
      row.style.display = show ? (row.classList.contains('imt-row') ? 'grid' : '') : 'none';
    });
  });
});

// ===== PWA INSTALL =====
let deferredPrompt = null;

function buildPWABanner() {
  if (localStorage.getItem("if_pwa_dismissed") === "1") return;
  if (window.innerWidth > 820) return;
  if (document.getElementById("if-pwa-banner")) return;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  if (isInStandaloneMode) return;

  const banner = document.createElement("div");
  banner.id = "if-pwa-banner";
  banner.innerHTML = `
    <div class="if-pwa-banner-inner">
      <img src="Investa_8_-removebg-preview (1).png" alt="Investa Farm" class="if-pwa-logo" />
      <div class="if-pwa-text">
        <strong>Add Investa Farm to your home screen</strong>
        <span>${isIOS ? 'Tap <b>Share</b> → <b>Add to Home Screen</b>' : 'Open app.investafarm.com in your browser'}</span>
      </div>
      <a href="https://app.investafarm.com" target="_blank" rel="noopener" class="if-pwa-cta" id="ifPwaCta">Open App</a>
      <button class="if-pwa-close" id="ifPwaClose" aria-label="Dismiss">✕</button>
    </div>
  `;
  document.body.appendChild(banner);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => banner.classList.add("if-pwa-banner--visible"));
  });

  document.getElementById("ifPwaClose").addEventListener("click", () => {
    banner.classList.remove("if-pwa-banner--visible");
    setTimeout(() => banner.remove(), 350);
    localStorage.setItem("if_pwa_dismissed", "1");
  });

  const ctaBtn = document.getElementById("ifPwaCta");
  if (deferredPrompt) {
    ctaBtn.textContent = "Install App";
    ctaBtn.removeAttribute("href");
    ctaBtn.addEventListener("click", async () => {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        ctaBtn.textContent = "Installed ✓";
        setTimeout(() => {
          banner.classList.remove("if-pwa-banner--visible");
          setTimeout(() => banner.remove(), 350);
        }, 1200);
      }
      deferredPrompt = null;
    });
  }
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById("pwaInstallBtn");
  if (btn) {
    btn.textContent = "Install App";
    btn.addEventListener("click", async (ev) => {
      if (deferredPrompt) {
        ev.preventDefault();
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") btn.textContent = "Installed ✓";
        deferredPrompt = null;
      }
    });
  }
});

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(buildPWABanner, 2500);
});

// ===== CONTACT FORM SUCCESS =====
const contactForm = document.querySelector('.contact-form');
const newsletterForm = document.querySelector('.newsletter-form');

function handleFormSubmit(form, successMsg) {
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn ? btn.textContent : '';
    if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }

    try {
      const data = new FormData(form);
      const res = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        form.innerHTML = `<div class="form-success">${successMsg}</div>`;
      } else {
        if (btn) { btn.textContent = originalText; btn.disabled = false; }
        alert('Something went wrong. Please email us at info@investafarm.com');
      }
    } catch (err) {
      if (btn) { btn.textContent = originalText; btn.disabled = false; }
      alert('Something went wrong. Please email us at info@investafarm.com');
    }
  });
}

handleFormSubmit(contactForm, '✅ <strong>Message sent!</strong> Our team will get back to you within 24 hours. Thank you! 🌾');
handleFormSubmit(newsletterForm, '📬 <strong>Subscribed!</strong> Thank you — you\'ll hear from us soon!');
