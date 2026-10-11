/**
 * R.R Teen Set Solution — Booking confirmation SMS (Cloudflare Worker)
 * ─────────────────────────────────────────────────────────────────────
 * book-site-visit.html calls this Worker AFTER the booking is saved in the CRM.
 * The Worker sends ONE short confirmation SMS to the customer through httpSMS
 * (https://httpsms.com), i.e. from our own Android phone + SIM.
 *
 * Safety design (this endpoint is public, so it must not be abusable):
 *  - The SMS text is built HERE from validated fields only. The caller can never
 *    send free text, so the Worker cannot be used as a general SMS sender.
 *  - Origin lock, strict validation, one SMS per mobile number per 24 h,
 *    per-IP hourly cap and a global daily cap (all counted in KV).
 *  - The httpSMS API key lives only in a Cloudflare Secret, never in the website.
 *  - A failure here must never affect the booking: the page ignores the result.
 *
 * Needed in Cloudflare (Worker -> Settings):
 *   Secret    HTTPSMS_API_KEY   API key from https://httpsms.com/settings
 *   Variable  SMS_FROM          our Android phone number, e.g. +919876543210
 *   KV bind   SMS_LIMITS        a KV namespace (rate-limit counters)
 *   Variable  SMS_DAILY_CAP     optional, default 20 (max SMS per day, all customers)
 */

const ALLOWED_ORIGIN = 'https://rrteensetsolution.com';
const HTTPSMS_URL = 'https://api.httpsms.com/v1/messages/send';
const PHONE_RE = /^[6-9]\d{9}$/;
const REF_RE = /^RR-[A-Z0-9]{4}$/;
const SLOT_TEXT = { m: '9 AM-12 PM', a: '12-3 PM', e: '3-6 PM' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEFAULT_DAILY_CAP = 20;
const IP_HOURLY_CAP = 5;
const MAX_DAYS_AHEAD = 60;
const IST_OFFSET_MS = 330 * 60 * 1000;

/** Today's date in India as 'YYYY-MM-DD' (Date.now() is injectable for tests via the argument). */
function istDate(ms = Date.now()) {
  return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Validates 'YYYY-MM-DD': real date, today..+60 days (IST), not a Sunday. Returns {day, month} or null. */
function parseVisitDate(iso, nowMs = Date.now()) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const t = Date.parse(iso + 'T12:00:00Z');
  if (Number.isNaN(t)) return null;
  const d = new Date(t);
  if (d.toISOString().slice(0, 10) !== iso) return null; // rejects 2026-02-31 etc.
  if (d.getUTCDay() === 0) return null; // we do not visit on Sundays
  const today = Date.parse(istDate(nowMs) + 'T12:00:00Z');
  const diffDays = Math.round((t - today) / 86400000);
  if (diffDays < 0 || diffDays > MAX_DAYS_AHEAD) return null;
  return { day: d.getUTCDate(), month: MONTHS[d.getUTCMonth()] };
}

/** First name, plain Latin letters only (keeps the SMS in the cheap 160-char GSM-7 alphabet). */
function firstName(name) {
  const first = String(name || '').trim().split(/\s+/)[0] || '';
  if (!/^[A-Za-z][A-Za-z.'-]{1,11}$/.test(first)) return '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

/** The one and only SMS we send. Plain, specific, no links, no promotional wording. */
function buildMessage({ name, ref, when }) {
  const n = firstName(name);
  return 'Hi' + (n ? ' ' + n : '') + ', your site visit request (Ref ' + ref + ') for ' + when +
    ' has reached our team. We will call you shortly. - R.R Teen Set Solution, 85272 58462';
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
    if (request.method !== 'POST') {
      return jsonError('Method not allowed', 405, 'method_not_allowed',
        'This endpoint only accepts POST with a JSON body.', { Allow: 'POST, OPTIONS' });
    }
    if ((request.headers.get('Origin') || '') !== ALLOWED_ORIGIN) {
      return jsonError('Origin not allowed', 403, 'origin_not_allowed',
        'This endpoint only serves ' + ALLOWED_ORIGIN + '.');
    }

    let body;
    try { body = await request.json(); } catch {
      return jsonError('Invalid request body', 400, 'invalid_json', 'Send a valid JSON body.');
    }

    const phone = String(body.phone || '').replace(/\D/g, '');
    const ref = String(body.ref || '');
    const slot = String(body.slot || '');
    const date = parseVisitDate(body.date);
    if (!PHONE_RE.test(phone)) return jsonError('Invalid phone', 400, 'invalid_phone', 'Provide a 10-digit Indian mobile number.');
    if (!REF_RE.test(ref)) return jsonError('Invalid reference', 400, 'invalid_ref', 'Booking reference format is RR-XXXX.');
    if (!SLOT_TEXT[slot]) return jsonError('Invalid slot', 400, 'invalid_slot', 'slot must be one of m, a, e.');
    if (!date) return jsonError('Invalid date', 400, 'invalid_date', 'date must be YYYY-MM-DD, Monday-Saturday, within the next ' + MAX_DAYS_AHEAD + ' days.');

    if (!env.HTTPSMS_API_KEY || !env.SMS_FROM || !env.SMS_LIMITS) {
      return jsonError('SMS not configured', 503, 'not_configured', 'Set HTTPSMS_API_KEY, SMS_FROM and the SMS_LIMITS KV binding.');
    }

    // ── limits ──
    const kv = env.SMS_LIMITS;
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const hour = Math.floor(Date.now() / 3600000);
    const dayKey = 'd:' + istDate();
    const dailyCap = Number(env.SMS_DAILY_CAP) > 0 ? Number(env.SMS_DAILY_CAP) : DEFAULT_DAILY_CAP;

    if (await kv.get('p:' + phone)) {
      // Same number already got an SMS in the last 24 h: succeed quietly, do not send again.
      return json({ ok: true, sent: false, reason: 'already_sent' });
    }
    const ipKey = 'i:' + ip + ':' + hour;
    const ipCount = Number(await kv.get(ipKey)) || 0;
    if (ipCount >= IP_HOURLY_CAP) return jsonError('Too many requests', 429, 'rate_limited', 'Please try again later.');
    const dayCount = Number(await kv.get(dayKey)) || 0;
    if (dayCount >= dailyCap) return jsonError('Daily SMS limit reached', 429, 'daily_cap', 'The team will call you shortly.');

    // ── send ──
    const content = buildMessage({ name: body.name, ref, when: date.day + ' ' + date.month + ', ' + SLOT_TEXT[slot] });
    let res;
    try {
      res = await fetch(HTTPSMS_URL, {
        method: 'POST',
        headers: { 'x-api-key': env.HTTPSMS_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ content, from: env.SMS_FROM, to: '+91' + phone })
      });
    } catch (err) {
      console.error('httpSMS unreachable:', err.message);
      return jsonError('SMS provider unreachable', 502, 'send_failed', 'The booking is saved; the team will call you.');
    }
    if (!res.ok) {
      console.error('httpSMS error status', res.status);
      return jsonError('SMS provider error', 502, 'send_failed', 'The booking is saved; the team will call you.');
    }

    await Promise.all([
      kv.put('p:' + phone, '1', { expirationTtl: 86400 }),
      kv.put(ipKey, String(ipCount + 1), { expirationTtl: 3700 }),
      kv.put(dayKey, String(dayCount + 1), { expirationTtl: 172800 })
    ]).catch(err => console.error('KV write failed:', err.message));

    return json({ ok: true, sent: true });
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin'
  };
}

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...corsHeaders(), ...extra }
  });
}

function jsonError(msg, status, code = 'error', hint = '', extraHeaders = {}) {
  return json({ error: msg, code, hint, status }, status, extraHeaders);
}
