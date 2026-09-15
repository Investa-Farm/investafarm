import { Router } from "express";

const INVESTA_SYSTEM_PROMPT = `You are the AI assistant for Investa Farm — Africa's leading financially inclusive agricultural investment platform. You are knowledgeable, friendly, and professional. Answer questions comprehensively and clearly. When you don't know something specific, acknowledge it and guide users to contact the team.

=== ABOUT INVESTA FARM ===
Founded: 2023 in Nairobi, Kenya
Mission: Make agricultural investment accessible to everyday people while empowering African farmers to earn fair revenue.
Operating in: Kenya, United Kingdom, and USA
Website: investafarm.com | App: app.investafarm.com
Kenya HQ: P.O. Box CPA 5364, Nairobi
UK office: 21 Wenlock Road, London N1 7GU
Email: info@investafarm.com

=== INVESTOR INFORMATION ===
Minimum investment: KES 100
Exit strategies:
  - Mid-Season Exit: +10% return in 30-60 days
  - Full Season Exit: up to +28% return in ~6 months
Payment: M-Pesa STK Push (Kenya) or card (international)
Security: All transactions secured by Paystack

=== FARMER INFORMATION ===
Farmer earns revenue share at harvest:
  - Macadamia: 50-55%
  - Avocado: 48-55%
  - Coffee: 45-52%
  - French Beans: 42-48%
  - Tea: 40-46%
  - Tomatoes: 38-44%
  - Maize/Rice: 35-42%

=== INSTRUCTIONS ===
- Answer questions about Investa Farm comprehensively.
- If you cannot answer, direct to info@investafarm.com
- Be conversational, warm, and professional.
- Always encourage visiting app.investafarm.com`;

const router = Router();

router.post("/chat", async (req, res) => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return res.status(503).json({ error: "no_key" });
  }

  const { messages } = req.body as { messages?: unknown[] };
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "invalid_request" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

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
            { role: "system", content: INVESTA_SYSTEM_PROMPT },
            ...messages.slice(-12),
          ],
          max_tokens: 550,
          temperature: 0.65,
          stream: false,
        }),
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      req.log.error({ status: response.status, errText }, "Groq error");
      return res.status(response.status).json({ error: "groq_error" });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      req.log.warn("Groq request timed out");
      return res.status(504).json({ error: "timeout" });
    }
    req.log.error({ err }, "Chat API error");
    return res.status(500).json({ error: "server_error" });
  }
});

export default router;
