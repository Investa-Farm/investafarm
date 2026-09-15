import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { BlogPost } from "../routes/blog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../../data");
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "subscribers.json");

export function loadSubscribers(): string[] {
  try {
    if (!fs.existsSync(SUBSCRIBERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, "utf-8")) as string[];
  } catch {
    return [];
  }
}

export function saveSubscribers(emails: string[]): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    SUBSCRIBERS_FILE,
    JSON.stringify([...new Set(emails)], null, 2),
  );
}

function buildEmailHtml(posts: BlogPost[]): string {
  const top3 = posts.slice(0, 3);
  const cards = top3
    .map(
      (p) => `
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px 24px;margin-bottom:16px;background:#fff;">
      <div style="font-size:24px;margin-bottom:8px">${p.emoji}</div>
      <span style="font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#6b7280;">${p.category}</span>
      <h2 style="font-size:18px;margin:8px 0 10px;color:#111827;line-height:1.4;">${p.title}</h2>
      <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0 0 14px;">${p.excerpt}</p>
      <a href="https://investafarm.com/blog.html" style="display:inline-block;background:#0b744c;color:#fff;text-decoration:none;border-radius:8px;padding:9px 20px;font-size:13px;font-weight:600;">Read more →</a>
    </div>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#f3f4f6;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#149665,#0b744c);border-radius:16px 16px 0 0;padding:32px 32px 24px;text-align:center;">
      <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">🌾 Investa Farm</div>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Fresh from the farm — latest news &amp; guides</p>
    </div>
    <!-- Body -->
    <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;">
      <h1 style="font-size:22px;margin:0 0 6px;color:#111827;">New posts are live 🚀</h1>
      <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.6;">Here's what's new on the Investa Farm blog this week — market insights, investment guides, and farmer stories.</p>
      ${cards}
      <div style="text-align:center;margin-top:24px;">
        <a href="https://investafarm.com/blog.html" style="display:inline-block;background:#0b744c;color:#fff;text-decoration:none;border-radius:999px;padding:13px 32px;font-size:15px;font-weight:700;">See all posts →</a>
      </div>
    </div>
    <!-- Footer -->
    <div style="text-align:center;padding:20px;font-size:12px;color:#9ca3af;">
      You're receiving this because you subscribed at <a href="https://investafarm.com" style="color:#0b744c;">investafarm.com</a>.<br/>
      <a href="https://investafarm.com/blog.html?unsubscribe=1" style="color:#9ca3af;">Unsubscribe</a>
    </div>
  </div>
</body>
</html>`;
}

export async function notifySubscribers(posts: BlogPost[]): Promise<void> {
  const subscribers = loadSubscribers();
  if (subscribers.length === 0) return;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.FROM_EMAIL || user || "noreply@investafarm.com";

  if (!host || !user || !pass) {
    // SMTP not configured — skip silently
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });

  const html = buildEmailHtml(posts);

  await Promise.allSettled(
    subscribers.map((email) =>
      transporter.sendMail({
        from: `"Investa Farm" <${from}>`,
        to: email,
        subject: `🌾 New on Investa Farm Blog — ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`,
        html,
      }),
    ),
  );
}
