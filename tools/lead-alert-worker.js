// Cloudflare Worker: receives a new enquiry from rrteensetsolution.com and sends it to the owner's Telegram.
// Secrets (set in the Cloudflare dashboard, never in this file): TG_TOKEN (bot token), TG_CHAT (chat id).
const ALLOWED = ['https://rrteensetsolution.com', 'https://www.rrteensetsolution.com'];

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST' || !ALLOWED.includes(origin)) return new Response('forbidden', { status: 403, headers: cors });

    let b;
    try { b = await req.json(); } catch (e) { return new Response('bad request', { status: 400, headers: cors }); }
    const s = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
    const name = s(b.name, 80), phone = s(b.phone, 20), digits = phone.replace(/\D/g, '');
    if (!name || digits.length < 10) return new Response('bad request', { status: 400, headers: cors });

    const text = [
      'New website enquiry',
      'Name: ' + name,
      'Phone: ' + phone,
      'Type: ' + s(b.svc, 60),
      b.area ? 'Area: ' + s(b.area, 12) + ' sq.ft' : '',
      b.city ? 'City: ' + s(b.city, 60) : '',
      b.msg ? 'Notes: ' + s(b.msg, 400) : ''
    ].filter(Boolean).join('\n');

    const r = await fetch('https://api.telegram.org/bot' + env.TG_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TG_CHAT, text })
    });
    return new Response(r.ok ? 'ok' : 'failed', { status: r.ok ? 200 : 502, headers: cors });
  }
};
