import 'dotenv/config';
import express from 'express';
import { generateAndSaveOTP } from './otp.js';
import { sendOTP, sendText, sendTemplate } from './whatsapp.js';
import { webhookRouter, verifiedNumbers } from './webhook.js';

const app = express();
app.use(express.json());
app.use(express.static('public'));

// ── Webhook (OTP verification via WhatsApp reply) ────────────────────────────
webhookRouter(app);

// ── Registration: form hits this, OTP is sent ────────────────────────────────
app.post('/api/register', async (req, res) => {
  let { phone } = req.body;

  // Normalise to E.164 without + for WhatsApp API (it accepts both, but be consistent)
  phone = phone.replace(/\D/g, ''); // strip everything except digits
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  const code = generateAndSaveOTP(phone);

  try {
    await sendOTP(phone, code);
    console.log(`OTP ${code} sent to ${phone}`);
    res.json({ ok: true, message: 'OTP sent — check WhatsApp' });
  } catch (err) {
    console.error("WA send failed:", err);
    console.error("CAUSE:", err?.cause);
    return res.status(500).json({ error: "Failed to send WhatsApp message", detail: String(err?.cause || err) });
  }
});

// ── Manual OTP verify endpoint (if you prefer form-based verify over WA reply) ─
app.post('/api/verify', (req, res) => {
  const { phone, code } = req.body;
  const clean = phone.replace(/\D/g, '');
  const result = verifyOTP(clean, code);  // imported via otp.js if needed
  if (result.ok) verifiedNumbers.add(clean);
  res.json(result);
});

// ── Send an automated message to a verified number ───────────────────────────
// Call this from your own scripts/cron jobs/admin panel
app.post('/api/send', async (req, res) => {
  const { phone, message } = req.body;
  const clean = phone.replace(/\D/g, '');

  if (!verifiedNumbers.has(clean)) {
    return res.status(403).json({ error: 'Number not verified — student must complete OTP first' });
  }

  try {
    // sendText works if the student messaged you in the last 24h
    // Otherwise use sendTemplate() with an approved template
    await sendText(clean, message);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on http://localhost:${process.env.PORT}`)
);