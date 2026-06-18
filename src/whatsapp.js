const BASE = `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;

async function post(body) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? 'WhatsApp API error');
  return data;
}

// --- Send OTP (uses approved template) ---
export function sendOTP(phone, code) {
  return post({
    to: phone,
    type: 'template',
    template: {
      name: process.env.WA_TEMPLATE_NAME,
      language: { code: 'en_US' },
      components: [{
        type: 'body',
        parameters: [{ type: 'text', text: code }], // {{1}} in your template
      }],
    },
  });
}

// --- Send any free-text message (only works after student has messaged you first,
//     OR use another approved template for proactive messages) ---
export function sendText(phone, text) {
  return post({
    to: phone,
    type: 'text',
    text: { body: text },
  });
}

// --- Send a template message (for proactive automated messages) ---
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