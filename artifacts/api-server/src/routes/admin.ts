import { Router, type Request, type Response, type NextFunction } from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const VISITS_FILE = path.join(DATA_DIR, "visits.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

interface VisitData {
  totalVisits: number;
  pageViews: Record<string, number>;
  dailyVisits: Record<string, number>;
  recentVisits: Array<{
    page: string;
    timestamp: string;
    referrer: string;
    userAgent: string;
  }>;
}

function loadVisits(): VisitData {
  try {
    return JSON.parse(fs.readFileSync(VISITS_FILE, "utf8")) as VisitData;
  } catch {
    return {
      totalVisits: 0,
      pageViews: {},
      dailyVisits: {},
      recentVisits: [],
    };
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

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const adminSessions = new Set<string>();

// ── Simple in-memory rate limiter (no extra deps) ──────────────────────────
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_MAX_ATTEMPTS = 10;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (raw?.split(",")[0] ?? req.socket.remoteAddress ?? "unknown").trim();
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now >= entry.resetAt) return false;
  return entry.count >= RATE_MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now >= entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

// Prune old entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts) {
    if (now >= entry.resetAt) loginAttempts.delete(ip);
  }
}, 30 * 60 * 1000);

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const cookies = parseCookies(req);
  const token = cookies.admin_session;
  if (token && adminSessions.has(token)) return next();
  return res.status(401).json({ error: "unauthorized" });
}

const router = Router();

// Visit tracking endpoint — called by frontend JS for page views
router.post("/visit", (req, res) => {
  const { page } = req.body as { page?: string };
  const validPage = page && typeof page === "string" ? page : "/index.html";
  const today = new Date().toISOString().slice(0, 10);

  visitData.totalVisits += 1;
  visitData.pageViews[validPage] = (visitData.pageViews[validPage] || 0) + 1;
  visitData.dailyVisits[today] = (visitData.dailyVisits[today] || 0) + 1;
  visitData.recentVisits.unshift({
    page: validPage,
    timestamp: new Date().toISOString(),
    referrer: req.get("referrer") || req.get("referer") || "direct",
    userAgent: req.get("user-agent") || "unknown",
  });
  if (visitData.recentVisits.length > 200) visitData.recentVisits.length = 200;
  saveVisitsSoon();

  return res.json({ ok: true });
});

router.post("/admin/login", (req, res) => {
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({ error: "admin_not_configured" });
  }
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "too_many_attempts", message: "Too many failed attempts. Try again in 15 minutes." });
  }
  const { password } = req.body as { password?: string };
  if (password !== ADMIN_PASSWORD) {
    recordFailedAttempt(ip);
    return res.status(401).json({ error: "invalid_password" });
  }
  clearAttempts(ip);
  const token = crypto.randomBytes(32).toString("hex");
  adminSessions.add(token);
  const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `admin_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400${secureFlag}`,
  );
  return res.json({ ok: true });
});

router.post("/admin/logout", (req, res) => {
  const cookies = parseCookies(req);
  if (cookies.admin_session) adminSessions.delete(cookies.admin_session);
  res.setHeader(
    "Set-Cookie",
    "admin_session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0",
  );
  return res.json({ ok: true });
});

router.get("/admin/check", (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies.admin_session;
  return res.json({ authenticated: !!(token && adminSessions.has(token)) });
});

router.get("/admin/stats", requireAdmin, (_req, res) => {
  return res.json(visitData);
});

export default router;
