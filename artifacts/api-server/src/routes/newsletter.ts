import { Router } from "express";
import { loadSubscribers, saveSubscribers } from "../lib/mailer.js";

const router = Router();

// POST /api/newsletter/subscribe
router.post("/newsletter/subscribe", (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "invalid_email", message: "A valid email address is required." });
  }
  const subs = loadSubscribers();
  const normalized = email.toLowerCase().trim();
  if (subs.includes(normalized)) {
    return res.json({ ok: true, message: "already_subscribed" });
  }
  subs.push(normalized);
  saveSubscribers(subs);
  return res.json({ ok: true, message: "subscribed" });
});

// POST /api/newsletter/unsubscribe
router.post("/newsletter/unsubscribe", (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) return res.status(400).json({ error: "email_required" });
  const filtered = loadSubscribers().filter(
    (e) => e !== email.toLowerCase().trim(),
  );
  saveSubscribers(filtered);
  return res.json({ ok: true, message: "unsubscribed" });
});

// GET /api/newsletter/count (public — for social proof)
router.get("/newsletter/count", (_req, res) => {
  res.json({ count: loadSubscribers().length });
});

export default router;
