# Cloudflare Workers for rrteensetsolution.com

Two single-file Workers (no dependencies, no build step). Paste each into the Cloudflare dashboard
(**Workers & Pages → Create → Create Worker → Edit code**). **Do not connect them to Git** — a Git-connected
Worker is overwritten by the website's static files on every push.

| File | Worker name | What it does |
|---|---|---|
| `edge-worker.js` | `rrts-edge` | Runs in front of the site. `Accept: text/markdown` → page as Markdown (`Vary: Accept`, q-values, 406); JSON errors for machines. |
| `chatbot-worker.js` | `rrts-chatbot-v2` | AI chat proxy (Gemini). Needs Secret `GEMINI_API_KEY`. Answers from `/knowledge.json`. Structured JSON errors. |

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

## Tests
Node 20+ (no packages): `node --test workers/tests/*.test.mjs`
