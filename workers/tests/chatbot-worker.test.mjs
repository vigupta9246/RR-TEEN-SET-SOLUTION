import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorker, mockFetch } from './helpers.mjs';

const mod = await loadWorker('chatbot-worker.js', ['extractLead']);
const worker = mod.default;
const { extractLead } = mod;
const ORIGIN = 'https://rrteensetsolution.com';
const KB = { version: 't', entries: [{ id: 'c', title: 'Company', text: 'R.R Teen Set Solution fact', page: 'https://rrteensetsolution.com/about.html' }] };

const call = (init = {}) => worker.fetch(new Request('https://chat.example.workers.dev/', { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'hi' }), ...init }), { GEMINI_API_KEY: 'k' });
const gemini = text => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });

function stub({ kb = () => new Response(JSON.stringify(KB)), model = () => gemini('ok') } = {}) {
  const calls = [];
  const restore = mockFetch(async req => {
    const u = new URL(req.url);
    calls.push({ url: req.url, body: req.method === 'POST' ? await req.clone().text() : '' });
    if (u.hostname === 'rrteensetsolution.com') return kb(req);
    return model(req, u);
  });
  return { calls, restore };
}

// ───────── structured JSON errors ─────────
const SHAPE = ['code', 'error', 'hint', 'status'];

test('GET -> 405 JSON with Allow header (no plain-text error)', async () => {
  const res = await call({ method: 'GET', body: undefined });
  assert.equal(res.status, 405);
  assert.match(res.headers.get('Content-Type'), /^application\/json/);
  assert.equal(res.headers.get('Allow'), 'POST, OPTIONS');
  const j = await res.json();
  assert.deepEqual(Object.keys(j).sort(), SHAPE);
  assert.equal(j.code, 'method_not_allowed'); assert.equal(typeof j.error, 'string'); assert.ok(j.hint);
});

test('foreign Origin -> 403 JSON', async () => {
  const res = await call({ headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' } });
  assert.equal(res.status, 403);
  const j = await res.json();
  assert.equal(j.code, 'origin_not_allowed'); assert.equal(j.status, 403);
});

test('invalid JSON and missing message -> 400 JSON with distinct codes', async () => {
  const bad = await call({ body: '{nope' });
  assert.equal(bad.status, 400); assert.equal((await bad.json()).code, 'invalid_json');
  const empty = await call({ body: JSON.stringify({ message: '   ' }) });
  assert.equal(empty.status, 400); assert.equal((await empty.json()).code, 'message_required');
});

test('OPTIONS preflight still works (CORS for the website only)', async () => {
  const res = await worker.fetch(new Request('https://chat.example.workers.dev/', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), {});
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  assert.match(res.headers.get('Access-Control-Allow-Methods'), /POST/);
});

test('all models failing -> 502 JSON (error stays a string for the widget), no debug text by default', async () => {
  const { restore } = stub({ model: () => new Response(JSON.stringify({ error: { code: 503, message: 'high demand' } }), { status: 503 }) });
  try {
    const res = await call();
    assert.equal(res.status, 502);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), ORIGIN);
    const j = await res.json();
    assert.equal(typeof j.error, 'string');
    assert.equal(j.code, 'upstream_unavailable');
    assert.doesNotMatch(j.error, /debug|high demand/);
  } finally { restore(); }
});

// ───────── behaviour that must not regress ─────────
test('happy path: reply returned, knowledge base sent to the model', async () => {
  const { calls, restore } = stub({ model: () => gemini('Namaste, ye jawab hai.') });
  try {
    const res = await call();
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { reply: 'Namaste, ye jawab hai.' });
    const sent = JSON.parse(calls.find(c => c.url.includes('generativelanguage')).body);
    assert.match(sent.systemInstruction.parts[0].text, /R\.R Teen Set Solution fact/);
  } finally { restore(); }
});

test('model fallback: busy primary model -> next model answers', async () => {
  let n = 0;
  const { calls, restore } = stub({ model: () => (++n === 1 ? new Response('busy', { status: 503 }) : gemini('from fallback')) });
  try {
    const res = await call();
    assert.equal((await res.json()).reply, 'from fallback');
    const models = calls.filter(c => c.url.includes('generativelanguage')).map(c => c.url.match(/models\/([^:]+):/)[1]);
    assert.equal(models.length, 2); assert.notEqual(models[0], models[1]);
  } finally { restore(); }
});

test('knowledge.json unreachable -> still answers using the built-in fallback facts', async () => {
  const { restore } = stub({ kb: () => new Response('nope', { status: 500 }) });
  try {
    const res = await call();
    assert.equal(res.status, 200);
  } finally { restore(); }
});

test('lead capture: hidden tag stripped, lead validated against what the visitor typed', async () => {
  const tag = o => `Dhanyavaad.\n<<LEAD>>${JSON.stringify(o)}<<END>>`;
  const ok = extractLead(tag({ name: '<b>Amit</b> Kumar', phone: '+91 91234 56789', service: 'Weird', note: 'a "q" <i>x</i>' }), 'Amit +91 91234 56789');
  assert.equal(ok.reply, 'Dhanyavaad.');
  assert.deepEqual(ok.lead, { name: 'Amit Kumar', phone: '9123456789', service: 'Other', city: '', note: 'a q x' });
  assert.equal(extractLead(tag({ name: 'A', phone: '9876543210', service: 'Other' }), 'no number typed here').lead, null); // invented number
  assert.equal(extractLead(tag({ name: 'Amit', phone: '12345', service: 'Other' }), '12345').lead, null);                 // invalid mobile
  assert.equal(extractLead('Thanks\n<<LEAD>>{oops<<END>>', 'x').lead, null);                                               // broken JSON
  assert.deepEqual(extractLead('Thanks\n<<LEAD>>{"name":"A"', 'x'), { reply: 'Thanks', lead: null });                       // truncated tag never shown
});
