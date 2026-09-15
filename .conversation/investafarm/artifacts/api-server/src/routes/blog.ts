import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { notifySubscribers } from "../lib/mailer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const BLOG_CACHE_FILE = path.join(DATA_DIR, "blog-cache.json");

const router = Router();

// ── Disk-backed cache: survives server restarts, regenerates at most hourly ───
interface CachedPosts {
  posts: BlogPost[];
  generatedAt: number;
  headlines: string[];
}
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function loadCacheFromDisk(): CachedPosts | null {
  try {
    const raw = fs.readFileSync(BLOG_CACHE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as CachedPosts;
    // Only restore if still fresh
    if (Date.now() - parsed.generatedAt < CACHE_TTL_MS) return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveCacheToDisk(c: CachedPosts): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(BLOG_CACHE_FILE, JSON.stringify(c), "utf-8");
  } catch {
    // Non-fatal — fall back to in-memory only
  }
}

let cache: CachedPosts | null = loadCacheFromDisk();

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  category: "investment" | "farming" | "news" | "impact";
  emoji: string;
  date: string;
  source?: string;
  featured?: boolean;
}

// ── RSS sources focused on agriculture, agri-fintech, and African farming ─────
const RSS_SOURCES = [
  {
    url: "https://www.theguardian.com/environment/agriculture/rss",
    label: "Guardian Agriculture",
  },
  {
    url: "https://www.fao.org/newsroom/rss/en/",
    label: "FAO News",
  },
  {
    url: "https://agfundernews.com/feed",
    label: "AgFunder News",
  },
  {
    url: "https://feeds.bbci.co.uk/news/world/africa/rss.xml",
    label: "BBC Africa",
  },
];

async function fetchRss(url: string, label: string): Promise<string[]> {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 6_000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "InvestaFarm/1.0 blog-aggregator" },
    });
    if (!res.ok) return [];
    const text = await res.text();

    // Extract <title> and <description> from <item> blocks
    const items: string[] = [];
    const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/gi);
    for (const m of itemMatches) {
      const block = m[1];
      const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i) ||
        block.match(/<title>(.*?)<\/title>/i))?.[1]?.trim();
      const desc = (
        block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/i) ||
        block.match(/<description>(.*?)<\/description>/i)
      )?.[1]
        ?.replace(/<[^>]+>/g, "")
        .trim()
        .slice(0, 200);
      if (title && title.length > 10) {
        items.push(desc ? `${title}: ${desc}` : title);
      }
      if (items.length >= 5) break;
    }
    return items.map((t) => `[${label}] ${t}`);
  } catch {
    return [];
  }
}

async function fetchAllHeadlines(): Promise<string[]> {
  const results = await Promise.allSettled(
    RSS_SOURCES.map((s) => fetchRss(s.url, s.label)),
  );
  const all: string[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }
  return all.slice(0, 20);
}

const BLOG_SYSTEM_PROMPT = `You are the content team at Investa Farm — Africa's leading financially inclusive agricultural investment platform based in Kenya, operating also in the UK and USA.

Generate exactly 6 blog posts for Investa Farm's website. Write 3 posts grounded in the real news headlines provided AND 3 posts as practical how-to guides for users of the Investa Farm platform.

News-based posts (3 posts) should:
- Be written in Investa Farm's voice: warm, knowledgeable, empowering, Africa-focused
- Connect the news to Investa Farm's mission (farm investment, revenue share, agri-fintech, Kenya agriculture, diaspora investment, food security, climate & crops)
- Feel timely — reference "right now" and "this season" naturally
- NOT be generic; anchor each post to a real news angle you were given

App tutorial posts (3 posts) — pick 3 topics from this list (rotate each time, do not always pick the same ones):
- "How to start investing in farms from KES 100 — a step-by-step guide"
- "Mid-Season Exit vs Full Season Exit: which is right for you?"
- "How Investa Farm's revenue share works for farmers — no loans, no debt"
- "How to read your portfolio dashboard and track your harvest returns"
- "How to earn commissions through the Investa Farm Stock Broker Programme"
- "How cooperatives can join Investa Farm as a group and earn collectively"
- "How farm listings are verified before they go live on the platform"
- "Funding your account: M-Pesa and bank transfer explained"
- "Primary Market vs Secondary Market: trading farm shares explained"
- "KYC verification on Investa Farm: what you need and why it matters"
- "How to apply as a farmer partner — the full onboarding process"
- "Maximising your returns: diversifying across multiple farm listings"

Tutorial posts should be warm, educational, and feel like they were written by someone who uses the product daily.

Return ONLY valid JSON — an array of exactly 6 objects with these keys:
{
  "id": "1" through "6",
  "title": "Engaging blog title (max 90 chars)",
  "excerpt": "2–3 sentence summary teasing the post (max 220 chars)",
  "body": "Full blog post body, 3–4 paragraphs, ~280–350 words. Plain text, no markdown.",
  "category": one of: "investment" | "farming" | "news" | "impact",
  "emoji": single relevant emoji,
  "date": current month and year like "July 2026",
  "source": "Investa Farm Guide" for tutorial posts, or the news source label for news posts,
  "featured": true for the single best post, false for the rest
}

Make the first post (id:"1") the featured one (featured:true). It should be either a powerful news angle or a must-read app tutorial — whichever is strongest.`;

async function generatePosts(headlines: string[]): Promise<BlogPost[]> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");

  const userMessage =
    headlines.length > 0
      ? `Here are today's real news headlines. Use these to inspire and ground your 6 blog posts:\n\n${headlines.join("\n")}\n\nWrite 6 Investa Farm blog posts based on these headlines. Return only the JSON array.`
      : `Write 6 timely Investa Farm blog posts about current trends in agricultural investment, Kenya farming, agri-fintech, diaspora investment, food security, and farmer empowerment. Return only the JSON array.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: BLOG_SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          max_tokens: 4000,
          temperature: 0.72,
          response_format: { type: "json_object" },
          stream: false,
        }),
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq error ${response.status}: ${errText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0]?.message?.content ?? "{}";

    // The model returns a JSON object — extract the array
    const parsed = JSON.parse(content) as
      | BlogPost[]
      | { posts?: BlogPost[] }
      | Record<string, BlogPost[]>;
    if (Array.isArray(parsed)) return parsed as BlogPost[];
    if ("posts" in parsed && Array.isArray(parsed.posts))
      return parsed.posts as BlogPost[];
    // Sometimes wrapped in another key
    const firstArray = Object.values(parsed).find((v) => Array.isArray(v));
    if (firstArray) return firstArray as BlogPost[];
    throw new Error("Unexpected JSON shape from Groq");
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ── Route: GET /api/blog/posts ────────────────────────────────────────────────
router.get("/blog/posts", async (req, res) => {
  // Serve from cache if fresh
  if (cache && Date.now() - cache.generatedAt < CACHE_TTL_MS) {
    return res.json({
      posts: cache.posts,
      generatedAt: new Date(cache.generatedAt).toISOString(),
      headlineCount: cache.headlines.length,
      cached: true,
    });
  }

  try {
    const headlines = await fetchAllHeadlines();
    const posts = await generatePosts(headlines);
    cache = { posts, generatedAt: Date.now(), headlines };
    saveCacheToDisk(cache);
    // Notify newsletter subscribers in the background (non-blocking)
    notifySubscribers(posts).catch(() => {});
    return res.json({
      posts,
      generatedAt: new Date(cache.generatedAt).toISOString(),
      headlineCount: headlines.length,
      cached: false,
    });
  } catch (err) {
    req.log.error({ err }, "Blog generation error");
    // Return stale cache if available rather than an error
    if (cache) {
      return res.json({
        posts: cache.posts,
        generatedAt: new Date(cache.generatedAt).toISOString(),
        headlineCount: cache.headlines.length,
        cached: true,
        stale: true,
      });
    }
    return res.status(503).json({
      error: "blog_unavailable",
      message:
        "Blog generation requires GROQ_API_KEY. Add it in Replit Secrets.",
    });
  }
});

// ── Route: POST /api/blog/refresh — force regeneration (admin only) ───────────
router.post("/blog/refresh", async (req, res) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const { password } = req.body as { password?: string };
  if (!adminPassword || password !== adminPassword) {
    return res.status(401).json({ error: "unauthorized" });
  }
  cache = null; // bust cache
  return res.json({ ok: true, message: "Cache cleared. Next GET will regenerate." });
});

export default router;
