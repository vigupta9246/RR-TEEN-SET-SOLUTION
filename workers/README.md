# Cloudflare Workers for rrteensetsolution.com

Single-file Workers (no dependencies, no build step). Paste each into the Cloudflare dashboard
(**Workers & Pages → Create → Create Worker → Edit code**). **Do not connect them to Git** — a Git-connected
Worker is overwritten by the website's static files on every push.

| File | Worker name | What it does |
|---|---|---|
| `edge-worker.js` | `rrts-edge` | Runs in front of the site. `Accept: text/markdown` → page as Markdown (`Vary: Accept`, q-values, 406); JSON errors for machines. |
| `chatbot-worker.js` | `rrts-chatbot-v2` | AI chat proxy (Gemini). Needs Secret `GEMINI_API_KEY`. Answers from `/knowledge.json`. Structured JSON errors. |
| `sms-worker.js` | `rrts-sms` | Booking confirmation SMS via [httpSMS](https://httpsms.com) (our Android phone). Called by `book-site-visit.html` only after the lead is saved. Text is built server-side; one SMS per number per 24 h; rate-limited. |

These files contain no secrets (the API key lives in a Cloudflare Secret).

## Deploy `edge-worker.js`
1. Create Worker `rrts-edge`, paste `edge-worker.js`, **Deploy**.
2. Worker → **Settings → Domains & Routes → Add → Route**: `rrteensetsolution.com/*`, zone `rrteensetsolution.com`.
   (The domain must be proxied through Cloudflare — orange cloud on the DNS record.)
3. Verify (below). To roll back, delete the route; the site keeps working exactly as before.

## Let verified AI agents through (Cloudflare dashboard, zone `rrteensetsolution.com`)
Bot challenges run **before** Workers, so they must be relaxed in the dashboard:
- **Security → Bots → Bot Fight Mode: Off** (or, on paid plans, Super Bot Fight Mode → *Verified bots: Allow*).
- **Security → Settings → "Block AI bots" / "AI Scrapers and Crawlers": Do not block.**
- **Security → Events**: filter on user-agents `GPTBot`, `ClaudeBot`, `ChatGPT-User`, `PerplexityBot` and confirm none is challenged/blocked.
- Optional: **Scrape Shield → Email Address Obfuscation: Off** so agents see the contact e-mail in HTML (the Markdown view already decodes it).

## Verify
```sh
# Markdown representation: 200, Content-Type: text/markdown; charset=utf-8, Vary includes Accept, non-empty body
curl -sS -L -i -H 'Accept: text/markdown' https://rrteensetsolution.com/
# HTML representation: 200, text/html, Vary includes Accept
curl -sS -L -i -H 'Accept: text/html' https://rrteensetsolution.com/
# q-values: HTML preferred -> HTML ; Markdown preferred -> Markdown
curl -sS -I -H 'Accept: text/html;q=1.0, text/markdown;q=0.5' https://rrteensetsolution.com/
curl -sS -I -H 'Accept: text/html;q=0.5, text/markdown;q=1.0' https://rrteensetsolution.com/
# Unsupported type -> 406 JSON with Vary: Accept
curl -sS -i -H 'Accept: application/x-content-negotiation-probe' https://rrteensetsolution.com/
# JSON errors
curl -sS -i -H 'Accept: application/json' https://rrteensetsolution.com/no-such-page
curl -sS -i https://rrteensetsolution.com/api/anything
# Machine-readable files
curl -sS -i https://rrteensetsolution.com/openapi.json
curl -sS -i https://rrteensetsolution.com/robots.txt
# Agent user-agents reach the homepage (expect 200, not a challenge page)
for ua in GPTBot ClaudeBot ChatGPT-User PerplexityBot Applebot-Extended; do
  curl -sS -o /dev/null -w "$ua %{http_code}\n" -A "$ua" https://rrteensetsolution.com/; done
```

## Deploy `sms-worker.js` (booking confirmation SMS)
1. **httpSMS**: create an account at httpsms.com, install the Android app on the office phone (sign in with the API key, allow SMS permission, disable battery optimisation for the app, keep the phone on and online). Copy the API key from httpsms.com/settings.
2. Cloudflare dashboard -> **Workers & Pages -> Create Worker**, name it exactly `rrts-sms`, paste `sms-worker.js`, **Deploy**. (Do not connect it to Git.)
3. **Storage & Databases -> KV -> Create** a namespace (e.g. `rrts-sms-limits`). Worker -> **Settings -> Bindings -> Add -> KV namespace**, variable name `SMS_LIMITS`.
4. Worker -> **Settings -> Variables and Secrets**:
   - Secret `HTTPSMS_API_KEY` = the httpSMS API key
   - Variable `SMS_FROM` = the phone's number with country code, e.g. `+919876543210`
   - Variable `SMS_DAILY_CAP` (optional, default 20)
5. The site already calls `https://rrts-sms.vikashlogistics00.workers.dev`. If the Worker gets a different URL, change `SMS_URL` in `book-site-visit.html`.

Without the secret, variable or KV binding the Worker answers `503 not_configured` and **no SMS is sent**; bookings are never affected.

Test (replace the number and use a Mon-Sat date within 60 days; this sends a real SMS):
```sh
curl -sS -i -X POST https://rrts-sms.vikashlogistics00.workers.dev/ \
  -H 'Origin: https://rrteensetsolution.com' -H 'Content-Type: application/json' \
  -d '{"name":"Test","phone":"98XXXXXXXX","ref":"RR-TEST","date":"2026-10-14","slot":"a"}'
```

## Tests
Node 20+ (no packages): `node --test workers/tests/*.test.mjs`
