// Credentials come from environment variables — never hardcode them.
// Set WA_TOKEN and WA_PHONE_NUMBER_ID in Railway's Variables tab.
const TOKEN = process.env.WA_TOKEN;
const PHONE_ID = process.env.WA_PHONE_NUMBER_ID;

// Fail loudly at startup if they're missing, instead of a confusing 401 later.
if (!TOKEN || !PHONE_ID) {
  throw new Error('Missing WA_TOKEN or WA_PHONE_NUMBER_ID environment variables');
}

const BASE = `https://graph.facebook.com/v25.0/${PHONE_ID}/messages`;

async function post(body) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
  });

  const data = await res.json();

  if (!res.ok) {
    // Surface Meta's FULL error (code, subcode, message) so you can diagnose.
    throw new Error(`WhatsApp API ${res.status}: ${JSON.stringify(data.error ?? data)}`);
  }
  return data;
}

// --- Send OTP ---
// NOTE: 'hello_world' is Meta's built-in demo template. It takes NO parameters,
// so it will deliver a generic "Hello World" message that does NOT contain `code`.
// Use this only to confirm the connection works. To actually send the OTP,
// switch to an approved authentication template (see sendOTP_real below).
export function sendOTP(phone, code) {
  return post({
    to: phone,
    type: 'template',
    template: {
      name: 'vssie_event_registration',
      language: { code: 'en_US' },
    },
  });
}

// --- Send OTP via a real approved authentication template ---
// Once you have an approved auth-category template (e.g. WA_TEMPLATE_NAME),
// use this version. The exact components depend on how your template is built;
// authentication templates usually need the code in BOTH the body and the
// copy-code button.
export function sendOTP_real(phone, code) {
  return post({
    to: phone,
    type: 'template',
    template: {
      name: process.env.WA_TEMPLATE_NAME, // e.g. 'otp_verification'
      language: { code: 'en_US' },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: code }],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: 0,
          parameters: [{ type: 'text', text: code }],
        },
      ],
    },
  });
}

// --- Send any free-text message (only works within 24h of the user messaging you) ---
export function sendText(phone, text) {
  return post({
    to: phone,
    type: 'text',
    text: { body: text },
  });
}

// --- Send a generic template message (for proactive automated messages) ---
export function sendTemplate(phone, templateName, params = []) {
  return post({
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en_US' },
      components: params.length ? [{
        type: 'body',
        parameters: params.map(text => ({ type: 'text', text })),
      }] : [],
    },
  });
}