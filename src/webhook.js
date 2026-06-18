import { verifyOTP } from './otp.js';
import { sendText } from './whatsapp.js';

// Verified phone numbers (replace with DB in production)
export const verifiedNumbers = new Set();

export function webhookRouter(app) {

  // Meta calls this once to confirm your webhook URL is real
  app.get('/webhook', (req, res) => {
    const mode  = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      console.log('Webhook verified by Meta');
      res.send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  // Meta calls this every time a student messages your number
  app.post('/webhook', async (req, res) => {
    res.sendStatus(200); // always ack immediately so Meta doesn't retry

    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const msg = change?.messages?.[0];
    if (!msg || msg.type !== 'text') return;

    const phone = msg.from;         // e.g. "19175550198" (no +)
    const text  = msg.text.body.trim();

    console.log(`Incoming from ${phone}: "${text}"`);

    // Check if this looks like an OTP (6 digits)
    if (/^\d{6}$/.test(text)) {
      const result = verifyOTP(phone, text);
      if (result.ok) {
        verifiedNumbers.add(phone);
        console.log(`✅ ${phone} verified`);
        await sendText(phone,
          '✅ You\'re verified! We\'ll be in touch with next steps. Reply STOP anytime to unsubscribe.'
        );
      } else {
        await sendText(phone, `❌ ${result.reason}. Please try again or re-submit the form.`);
      }
    }
    // If your team wants to handle free-text replies from students, add logic here
  });

}