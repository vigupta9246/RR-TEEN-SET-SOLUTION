import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorker, mockFetch } from './helpers.mjs';

const mod = await loadWorker('sms-worker.js', ['buildMessage', 'parseVisitDate', 'firstName']);
const worker = mod.default;
const { buildMessage, parseVisitDate, firstName } = mod;
const ORIGIN = 'https://rrteensetsolution.com';
const DAY = 86400000;
const IST = 330 * 60 * 1000;

/** Next Mon–Sat date at least `ahead` days from today (IST), as 'YYYY-MM-DD'. */
function visitDate(ahead = 1) {
  let t = Date.now() + IST + ahead * DAY;
  while (new Date(t).getUTCDay() === 0) t += DAY;
  return new Date(t).toISOString().slice(0, 10);
}
function sunday() {
  let t = Date.now() + IST + DAY;
  while (new Date(t).getUTCDay() !== 0) t += DAY;
  return new Date(t).toISOString().slice(0, 10);
}
function fakeKV() {
  const m = new Map();
  return { m, get: async k => m.get(k) ?? null, put: async (k, v) => { m.set(k, v); } };
}
const baseEnv = (over = {}) => ({ HTTPSMS_API_KEY: 'key_test', SMS_FROM: '+919999900000', SMS_LIMITS: fakeKV(), ...over });
const payload = (over = {}) => ({ name: 'Ramesh Kumar', phone: '98765 43210', ref: 'RR-MQFM', date: visitDate(), slot: 'a', ...over });
const call = (body, env, { origin = ORIGIN, ip = '1.2.3.4', method = 'POST' } = {}) =>
  worker.fetch(new Request('https://sms.example.workers.dev/', {
    method, headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
    body: method === 'POST' ? JSON.stringify(body) : undefined
  }), env);

function stubSms(status = 200) {
  const calls = [];
  const restore = mockFetch(async req => { calls.push({ url: req.url, headers: Object.fromEntries(req.headers), body: JSON.parse(await req.text()) }); return new Response('{}', { status }); });
  return { calls, restore };
}

test('GET -> 405 JSON with Allow header', async () => {
  const r = await call(null, baseEnv(), { method: 'GET' });
  assert.equal(r.status, 405);
  assert.equal(r.headers.get('Allow'), 'POST, OPTIONS');
  assert.deepEqual(Object.keys(await r.json()).sort(), ['code', 'error', 'hint', 'status']);
});

test('OPTIONS preflight returns CORS for the site only', async () => {
  const r = await call(null, baseEnv(), { method: 'OPTIONS' });
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGIN);
});

test('foreign origin -> 403 and no SMS', async () => {
  const s = stubSms();
  try { const r = await call(payload(), baseEnv(), { origin: 'https://evil.example' }); assert.equal(r.status, 403); assert.equal(s.calls.length, 0); } finally { s.restore(); }
});

test('validation: bad phone / ref / slot / date (Sunday, past, far future, impossible)', async () => {
  const s = stubSms();
  try {
    for (const [over, code] of [
      [{ phone: '12345' }, 'invalid_phone'], [{ phone: '5876543210' }, 'invalid_phone'],
      [{ ref: 'XX-1234' }, 'invalid_ref'], [{ slot: 'x' }, 'invalid_slot'],
      [{ date: sunday() }, 'invalid_date'], [{ date: '2020-01-01' }, 'invalid_date'],
      [{ date: visitDate(90) }, 'invalid_date'], [{ date: '2026-02-31' }, 'invalid_date']
    ]) {
      const r = await call(payload(over), baseEnv());
      assert.equal(r.status, 400, JSON.stringify(over));
      assert.equal((await r.json()).code, code);
    }
    assert.equal(s.calls.length, 0);
  } finally { s.restore(); }
});

test('missing secret / KV -> 503 not_configured, no SMS', async () => {
  const s = stubSms();
  try {
    for (const env of [baseEnv({ HTTPSMS_API_KEY: '' }), baseEnv({ SMS_FROM: '' }), baseEnv({ SMS_LIMITS: undefined })]) {
      const r = await call(payload(), env); assert.equal(r.status, 503); assert.equal((await r.json()).code, 'not_configured');
    }
    assert.equal(s.calls.length, 0);
  } finally { s.restore(); }
});

test('success: one httpSMS call with server-built text, +91 number, API key header', async () => {
  const s = stubSms();
  try {
    const env = baseEnv();
    const r = await call(payload(), env);
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true, sent: true });
    assert.equal(s.calls.length, 1);
    const c = s.calls[0];
    assert.equal(c.url, 'https://api.httpsms.com/v1/messages/send');
    assert.equal(c.headers['x-api-key'], 'key_test');
    assert.equal(c.body.to, '+919876543210');
    assert.equal(c.body.from, '+919999900000');
    assert.match(c.body.content, /^Hi Ramesh, your site visit request \(Ref RR-MQFM\) for \d{1,2} [A-Z][a-z]{2}, 12-3 PM has reached our team\. We will call you shortly\./);
    assert.ok(env.SMS_LIMITS.m.has('p:9876543210'));
  } finally { s.restore(); }
});

test('SMS text: <=160 chars, GSM-safe ASCII, no links, no promo words', () => {
  const t = buildMessage({ name: 'Ramesh Kumar', ref: 'RR-MQFM', when: '13 Oct, 12-3 PM' });
  assert.ok(t.length <= 160, 'length ' + t.length);
  assert.match(t, /^[\x20-\x7E]+$/);
  assert.doesNotMatch(t, /https?:|www\.|\.com|\.in\b|bit\.ly/i);
  assert.doesNotMatch(t, /free|offer|discount|sale|win|limited|click|urgent|%/i);
  assert.match(t, /R\.R Teen Set Solution/); // recipient can tell who sent it
});

test('firstName: non-Latin or odd names are dropped, not sent', () => {
  assert.equal(firstName('ramesh KUMAR'), 'Ramesh');
  assert.equal(firstName('रमेश कुमार'), '');
  assert.equal(firstName('<script>'), '');
  assert.equal(firstName('Chandrashekhar Rao'), ''); // too long: keep SMS short
  assert.ok(buildMessage({ name: 'रमेश', ref: 'RR-AAAA', when: '1 Jan, 9 AM-12 PM' }).startsWith('Hi, your'));
});

test('caller cannot inject free text into the SMS', async () => {
  const s = stubSms();
  try {
    await call(payload({ content: 'WIN A PRIZE http://spam.example', message: 'x', text: 'y', name: 'Ramesh http://spam.example' }), baseEnv());
    assert.doesNotMatch(s.calls[0].body.content, /spam|PRIZE/);
  } finally { s.restore(); }
});

test('same number twice within 24h -> only one SMS', async () => {
  const s = stubSms();
  try {
    const env = baseEnv();
    await call(payload(), env);
    const r2 = await call(payload(), env);
    assert.equal(r2.status, 200);
    assert.deepEqual(await r2.json(), { ok: true, sent: false, reason: 'already_sent' });
    assert.equal(s.calls.length, 1);
  } finally { s.restore(); }
});

test('per-IP hourly cap (5) -> 429', async () => {
  const s = stubSms();
  try {
    const env = baseEnv();
    for (let i = 0; i < 5; i++) assert.equal((await call(payload({ phone: '98765432' + (10 + i) }), env)).status, 200);
    const r = await call(payload({ phone: '9876543299' }), env);
    assert.equal(r.status, 429); assert.equal((await r.json()).code, 'rate_limited');
    assert.equal(s.calls.length, 5);
  } finally { s.restore(); }
});

test('global daily cap -> 429', async () => {
  const s = stubSms();
  try {
    const env = baseEnv({ SMS_DAILY_CAP: '2' });
    assert.equal((await call(payload({ phone: '9876543211' }), env, { ip: '1.1.1.1' })).status, 200);
    assert.equal((await call(payload({ phone: '9876543212' }), env, { ip: '2.2.2.2' })).status, 200);
    const r = await call(payload({ phone: '9876543213' }), env, { ip: '3.3.3.3' });
    assert.equal(r.status, 429); assert.equal((await r.json()).code, 'daily_cap');
  } finally { s.restore(); }
});

test('httpSMS failure -> 502 and the number is NOT marked as sent (can retry)', async () => {
  const s = stubSms(500);
  try {
    const env = baseEnv();
    const r = await call(payload(), env);
    assert.equal(r.status, 502); assert.equal((await r.json()).code, 'send_failed');
    assert.equal(env.SMS_LIMITS.m.has('p:9876543210'), false);
  } finally { s.restore(); }
});

test('parseVisitDate: accepts today..+60 days Mon-Sat only', () => {
  assert.ok(parseVisitDate(visitDate(1)));
  assert.equal(parseVisitDate(sunday()), null);
  assert.equal(parseVisitDate('not-a-date'), null);
});
