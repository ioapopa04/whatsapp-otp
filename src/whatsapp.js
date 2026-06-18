const TOKEN = 'EAAO1YFmbQlABRprVmYrHPbW5jxiZCSceRf9mJRIBG2PhWCKZAXZCgztXn9uZBZB6LZBy39fkTBmSArbFhk6oCvb5Xs4OYUyGoe1WRqZCvGAZBcVzuAaNLgwbrIYJEQZBUEgc8xJFaNnKQIltHDi3adgPBxi5TQphWZAskmwZCsyGZA7VPSWHHZAx2NtYqfUR0NfrdrtcbwcEZBAIsS7OZBHUO5jCZBEmQ74T6GtmQZCOj2VxafVCVtbsF9tAtfvRfWeGIoMD4KkMAKGsZBXotl2MBLvo0BJFh4wZBkZD';
const PHONE_ID = '1186731034517960';

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
  if (!res.ok) throw new Error(data.error?.message ?? 'WhatsApp API error');
  return data;
}

// --- Send OTP (uses approved template) ---
export function sendOTP(phone, code) {
  return post({
    to: phone,
    type: 'template',
    template: {
      name: 'hello_world',
      language: { code: 'en_US' },
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