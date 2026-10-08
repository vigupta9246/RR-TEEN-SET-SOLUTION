/**
 * R.R Teen Set Solution — AI Chatbot Proxy (Cloudflare Worker) v2
 * ─────────────────────────────────────────────────────────────
 * Changes vs v1:
 *  - Facts now come from knowledge.json on the website (edit the JSON,
 *    push to GitHub, bot updates within ~1 hour — NO Worker redeploy).
 *  - Whole knowledge base is sent to Gemini on every request (it is small),
 *    so there is no retrieval step that can miss the right fact.
 *  - Strict language/tone rules (one script, one language, professional).
 *  - Reply parser joins ALL text parts and maxOutputTokens raised, so
 *    replies don't get cut off or come back empty on "thinking" models.
 *
 * Secret needed (unchanged): GEMINI_API_KEY (Cloudflare Secret).
 */

const ALLOWED_ORIGIN = 'https://rrteensetsolution.com';
const KB_URL = 'https://rrteensetsolution.com/knowledge.json';
const KB_CACHE_SECONDS = 3600;
// Tried in order. If a model is overloaded (503) / rate-limited (429) / missing (404), the next one is used.
const MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
const MAX_MESSAGE_LEN = 800;
const MAX_HISTORY_TURNS = 8;
const DEBUG_ERRORS = false; // set true only when debugging: shows Gemini's real error text in the chat

// Only used if knowledge.json cannot be fetched. Keep it minimal & safe.
const FALLBACK_FACTS = `R.R Teen Set Solution: GST-registered tin shed, industrial shed, PEB and prefab warehouse contractor in Najafgarh, New Delhi, serving Delhi NCR since 2016. Free site visit. Phone/WhatsApp +91 85272 58462. For prices or any detail, ask the visitor to call or WhatsApp.`;

const BEHAVIOUR_RULES = `You are the AI assistant on the website of R.R Teen Set Solution (tin shed, industrial shed, PEB, prefab warehouse and roofing contractor, Delhi NCR).

SOURCE OF TRUTH
- Answer ONLY from the BUSINESS FACTS below. If a fact is not there, do not guess. Say you don't have that detail and offer a callback or WhatsApp on +91 85272 58462.
- Prices: give only the per sq.ft range from the facts and say it is before 18% GST and indicative. NEVER calculate or promise a final price, timeline or warranty for a specific project. Point to the free cost calculator (shed-cost-calculator.html) or a free site visit.
- Never invent projects, clients, certifications, discounts or offers. Never give structural-engineering, legal or tax advice beyond the facts; refer to the team.
- If asked something unrelated to sheds/construction/this business, politely bring the conversation back.
- You are an AI assistant, not a human. Say so if asked.

LANGUAGE AND TONE
- Reply in the visitor's language: English -> English; Hindi/Hinglish -> Hinglish written in Roman script. Never use Devanagari. Never mix two scripts.
- Keep ONE consistent register: polite, simple, professional. Use "aap" (never "tum"/"tu"). No slang, no filler like "bhai", "yaar", "boss". No emojis.
- Write natural, grammatically correct sentences. Do not translate word-by-word and do not stuff English words into Hindi sentences unnecessarily; use common ones (shed, site visit, quotation, GST, sq.ft).
- Plain text only: no markdown, no asterisks, no bullet symbols, no headings.
- Short: 2-4 sentences, max about 60 words. Answer the question first, then at most one helpful next step (for example, offer the site visit or ask for the area/size).
- Ask at most one question per reply, and only when it helps (location, approximate size, shed type).

LEAD CAPTURE (quote / site visit / callback requests)
- When the visitor wants a quote, site visit, callback or to be contacted, ask for their name and 10-digit mobile number in one short message. If one of them is already given, ask only for the missing one. Do not ask for email or address. Never ask for or accept card, bank, OTP or Aadhaar details.
- Only when you have BOTH a real name and a valid 10-digit Indian mobile number that the visitor typed in this conversation: thank them by name, say the team will call them soon (Mon-Sat, 9 AM-7 PM), and then add this exact line at the very END of your reply:
<<LEAD>>{"name":"<name>","phone":"<10 digits>","service":"<one of: Tin Shed Fabrication | Industrial Shed | Prefab Warehouse | PEB Structure | Agricultural Shed | Other>","city":"<city or area, or empty>","note":"<requirement in under 15 words, e.g. 1000 sq ft terrace shed>"}<<END>>
- Output that line only once per conversation, never before you have both details, and never in any other format.
- For urgent or complaint cases, also mention call/WhatsApp +91 85272 58462.

EXAMPLES OF GOOD REPLIES
Visitor: 1000 sq ft tin shed ka kharcha?
Reply: Tin shed ka rate aam taur par Rs 180 se Rs 250 per sq.ft hota hai (GST alag), to 1000 sq.ft ke liye approx Rs 1.8 se 2.5 lakh ka andaza lagaiye. Exact quotation free site visit ke baad milti hai. Aap kis area mein shed banwana chahte hain?
Visitor: Do you work in Gurgaon?
Reply: Yes, we serve Gurugram, including Udyog Vihar, Sector 37, Basai Road and IMT Manesar. We offer a free site visit and a written quotation. Would you like us to arrange a visit?
Visitor: Mujhe callback chahiye
Reply: Zaroor. Kripya apna naam aur 10 digit mobile number share karein, hamari team aapko jald call karegi.
Visitor: warranty kitni milti hai?
Reply: Hum fabrication aur installation par standard workmanship warranty dete hain. Exact terms project ke hisaab se hoti hain, isliye team se confirm karna behtar rahega. Aap +91 85272 58462 par call ya WhatsApp kar sakte hain.`;

let kbCache = { text: null, at: 0 };

async function getFacts() {
  const now = Date.now();
  if (kbCache.text && now - kbCache.at < KB_CACHE_SECONDS * 1000) return kbCache.text;
  try {
    const res = await fetch(KB_URL, { cf: { cacheTtl: KB_CACHE_SECONDS, cacheEverything: true } });
    if (!res.ok) throw new Error('KB status ' + res.status);
    const kb = await res.json();
    const text = (kb.entries || [])
      .map(e => `## ${e.title}\n${e.text}${e.page ? `\n(page: ${e.page})` : ''}`)
      .join('\n\n');
    if (!text) throw new Error('KB empty');
    kbCache = { text, at: now };
    return text;
  } catch (err) {
    console.error('KB fetch failed:', err.message);
    return kbCache.text || FALLBACK_FACTS; // stale cache beats fallback
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== 'POST') {
      return jsonError('Method not allowed', 405, 'method_not_allowed',
        'This endpoint only accepts POST with a JSON body {"message": string, "history"?: [{"role","text"}]}.',
        { Allow: 'POST, OPTIONS' });
    }

    const origin = request.headers.get('Origin') || '';
    if (origin !== ALLOWED_ORIGIN) {
      return jsonError('Origin not allowed', 403, 'origin_not_allowed',
        'This chat endpoint only serves the website ' + ALLOWED_ORIGIN + '. For enquiries call or WhatsApp +91 85272 58462.');
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError('Invalid request body', 400, 'invalid_json', 'Send a valid JSON body: {"message": "your question"}.');
    }

    const message = String(body.message || '').slice(0, MAX_MESSAGE_LEN).trim();
    if (!message) return jsonError('Message is required', 400, 'message_required', 'Include a non-empty "message" string (max ' + MAX_MESSAGE_LEN + ' characters).');

    const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY_TURNS * 2) : [];
    const contents = [
      ...history
        .filter(h => h && typeof h.text === 'string' && (h.role === 'user' || h.role === 'model'))
        .map(h => ({ role: h.role, parts: [{ text: String(h.text).slice(0, MAX_MESSAGE_LEN) }] })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const facts = await getFacts();
    const systemPrompt = `${BEHAVIOUR_RULES}\n\n===== BUSINESS FACTS (only source of truth) =====\n${facts}`;

    try {
      const payload = JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
      });
      let geminiRes;
      for (const model of MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        geminiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
          body: payload
        });
        if (geminiRes.ok) break;
        if (![404, 429, 500, 503].includes(geminiRes.status)) break; // real client error: don't try others
        console.error('Model', model, 'failed with', geminiRes.status, '- trying next');
      }

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error('Gemini API error:', geminiRes.status, errText);
        const detail = DEBUG_ERRORS ? ` [debug: Gemini ${geminiRes.status} ${errText.slice(0, 300)}]` : '';
        return jsonError('The assistant is having trouble right now — please WhatsApp us instead.' + detail, 502, 'upstream_unavailable', 'Retry in a few seconds, or call/WhatsApp +91 85272 58462.');
      }

      const data = await geminiRes.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const rawReply = parts.filter(p => typeof p.text === 'string' && !p.thought).map(p => p.text).join('').trim();
      const visitorText = [...history.filter(h => h && h.role === 'user').map(h => String(h.text || '')), message].join(' ');
      const { reply: cleaned, lead } = extractLead(rawReply, visitorText);
      const reply = cleaned
        || "Sorry, main ye samajh nahi paaya. Kripya dobara likhein, ya WhatsApp karein: +91 85272 58462.";

      return new Response(JSON.stringify(lead ? { reply, lead } : { reply }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
      });
    } catch (err) {
      console.error('Worker error:', err.message);
      return jsonError('Something went wrong — please try again or WhatsApp us.', 500, 'internal_error', 'Retry shortly, or call/WhatsApp +91 85272 58462.');
    }
  }
};

// Pulls the hidden <<LEAD>>{json}<<END>> tag out of the model's reply.
// The tag is ALWAYS removed from the visitor-facing text. A lead is returned
// only if it passes validation, including: the phone number must literally
// appear in what the visitor typed (stops the model inventing numbers).
function extractLead(rawReply, visitorText) {
  const re = /<<LEAD>>([\s\S]*?)<<END>>/;
  const m = rawReply.match(re);
  const reply = rawReply.replace(/<<LEAD>>[\s\S]*?<<END>>/g, '').replace(/<<LEAD>>[\s\S]*$/, '').trim();
  if (!m) return { reply, lead: null };
  try {
    const d = JSON.parse(m[1]);
    let phone = String(d.phone || '').replace(/\D/g, '');
    if (phone.length > 10) phone = phone.slice(-10);
    if (!/^[6-9]\d{9}$/.test(phone)) return { reply, lead: null };
    if (!visitorText.replace(/\D/g, '').includes(phone)) return { reply, lead: null };
    const clean = (v, n) => String(v || '').replace(/<[^>]*>/g, '').replace(/[<>"'`\\&{}\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
    const name = clean(d.name, 60);
    if (name.length < 2) return { reply, lead: null };
    const services = ['Tin Shed Fabrication', 'Industrial Shed', 'Prefab Warehouse', 'PEB Structure', 'Agricultural Shed', 'Other'];
    const service = services.includes(d.service) ? d.service : 'Other';
    return { reply, lead: { name, phone, service, city: clean(d.city, 60), note: clean(d.note, 160) } };
  } catch {
    return { reply, lead: null };
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

// Structured error: `error` stays a plain string (the website widget displays it), plus machine-readable fields.
function jsonError(msg, status, code = 'error', hint = '', extraHeaders = {}) {
  return new Response(JSON.stringify({ error: msg, code, status, hint }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders, ...corsHeaders() }
  });
}
