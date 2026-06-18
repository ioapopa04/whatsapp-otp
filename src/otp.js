import crypto from 'crypto';

// In-memory store: { [phone]: { code, expiresAt } }
// Replace with Redis or a DB table before going to production
const store = new Map();

export function generateAndSaveOTP(phone) {
  const code = crypto.randomInt(100000, 999999).toString();
  store.set(phone, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
  return code;
}

export function verifyOTP(phone, input) {
  const record = store.get(phone);
  if (!record)                    return { ok: false, reason: 'No code found for this number' };
  if (Date.now() > record.expiresAt) { store.delete(phone); return { ok: false, reason: 'Code expired' }; }
  if (record.code !== input.trim())  return { ok: false, reason: 'Wrong code' };
  store.delete(phone); // one-time use
  return { ok: true };
}