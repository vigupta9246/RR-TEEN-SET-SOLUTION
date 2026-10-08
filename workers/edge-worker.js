/**
 * R.R Teen Set Solution — Agent-friendly edge Worker
 * ───────────────────────────────────────────────────
 * Runs in FRONT of the GitHub Pages site (Cloudflare route
 * `rrteensetsolution.com/*`) and adds three things GitHub Pages cannot do:
 *
 *  1. Markdown content negotiation (https://acceptmarkdown.com, RFC 9110 §12)
 *     - `Accept: text/markdown` on an HTML page -> the same page as Markdown
 *       (200, Content-Type: text/markdown; charset=utf-8, Vary: Accept).
 *     - q-values are compared properly (no substring matching); a tie goes to
 *       Markdown only when the client explicitly named text/markdown or text/*.
 *     - Browsers (Accept: text/html,...) keep getting the normal HTML.
 *     - If the Accept header excludes both HTML and Markdown -> 406 (JSON).
 *     - `Vary: Accept` is set on BOTH representations so caches stay correct.
 *
 *  2. Structured JSON errors for machines
 *     - Any 4xx/5xx under /api/*, or any error where the client asked for
 *       application/json, returns
 *       {"error","code","status","hint","docs"} instead of an HTML page.
 *       Normal browsers still get the friendly HTML 404 page.
 *
 *  3. Nothing else changes: assets (css/js/images/json/xml/txt), POSTs and
 *     /cdn-cgi/* are passed straight through untouched.
 *
 * No secrets, no bindings, no dependencies — paste this single file into a
 * Cloudflare Worker and add the route. See workers/README.md.
 */

const DOCS_URL = 'https://rrteensetsolution.com/openapi.json';
// Internal tools: never converted (they're not public content and are disallowed in robots.txt).
const PRIVATE_PATHS = new Set(['/quotation-system.html', '/testimonials-admin.html']);

// ───────────────────────── Content negotiation ─────────────────────────

/** Parse an Accept header into Map<lowercased media range, q>. Invalid / out-of-range q falls back to 1. */
function parseAccept(header) {
  const map = new Map();
  for (const part of String(header || '').split(',')) {
    const [rangeRaw, ...params] = part.split(';');
    const range = rangeRaw.trim().toLowerCase();
    if (!/^[a-z0-9!#$&^_.+*-]+\/[a-z0-9!#$&^_.+*-]+$/.test(range)) continue;
    let q = 1;
    for (const p of params) {
      const eq = p.indexOf('=');
      if (eq === -1) continue;
      if (p.slice(0, eq).trim().toLowerCase() !== 'q') continue;
      const n = Number(p.slice(eq + 1).trim());
      q = Number.isFinite(n) && n >= 0 && n <= 1 ? n : 1;
    }
    map.set(range, Math.max(map.get(range) ?? 0, q));
  }
  return map;
}

// RFC 9110 precedence: exact media type, then its type/* range, then the any-type wildcard.
function qualityFor(map, type) {
  if (map.has(type)) return map.get(type);
  const wild = type.split('/')[0] + '/*';
  if (map.has(wild)) return map.get(wild);
  if (map.has('*/*')) return map.get('*/*');
  return 0;
}

/** @returns {'html'|'markdown'|'not-acceptable'} */
function negotiateRepresentation(acceptHeader) {
  if (acceptHeader == null || !String(acceptHeader).trim()) return 'html'; // no Accept = any
  const map = parseAccept(acceptHeader);
  if (map.size === 0) return 'html'; // unparseable header: behave as if absent
  const md = qualityFor(map, 'text/markdown');
  const html = Math.max(qualityFor(map, 'text/html'), qualityFor(map, 'application/xhtml+xml'));
  if (md === 0 && html === 0) return 'not-acceptable';
  if (md === 0) return 'html';
  if (md > html) return 'markdown';
  if (md === html && (map.has('text/markdown') || map.has('text/*'))) return 'markdown';
  return 'html';
}

/** Client explicitly asked for JSON (and not in preference to HTML). Wildcards alone don't count. */
function prefersJson(acceptHeader) {
  const map = parseAccept(acceptHeader);
  const json = map.get('application/json') ?? 0;
  if (json === 0) return false;
  const html = Math.max(map.get('text/html') ?? 0, map.get('application/xhtml+xml') ?? 0);
  return json >= html;
}

function isHtmlRoute(path) {
  if (path.startsWith('/api/') || path.startsWith('/.well-known/')) return false;
  if (path.endsWith('/')) return true;
  const last = path.split('/').pop();
  return !last.includes('.') || last.endsWith('.html');
}

function mergeVary(existing, token) {
  const parts = String(existing || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!parts.some(p => p.toLowerCase() === token.toLowerCase() || p === '*')) parts.push(token);
  return parts.join(', ');
}

// ───────────────────────── JSON errors ─────────────────────────

const ERROR_INFO = {
  400: ['bad_request', 'The request could not be understood.', 'Check the URL and headers, then retry.'],
  401: ['unauthorized', 'Authentication is required.', 'This site has no authenticated public API; all public resources are listed at /openapi.json.'],
  403: ['forbidden', 'Access to this resource is not allowed.', 'Only public pages and the files listed at /openapi.json are available.'],
  404: ['not_found', 'The requested resource does not exist.', 'Check the path. Page list: /sitemap.xml. Machine-readable resources: /openapi.json and /llms.txt.'],
  405: ['method_not_allowed', 'This method is not supported for this resource.', 'Use GET or HEAD.'],
  406: ['not_acceptable', 'No acceptable representation is available for this Accept header.', 'Send Accept: text/markdown or Accept: text/html (or */*).'],
  410: ['gone', 'This resource has been removed.', 'See /sitemap.xml for current pages.'],
  429: ['rate_limited', 'Too many requests.', 'Wait a few seconds and retry.']
};

function errorResponse(status, method, override = {}) {
  const [code, message, hint] = ERROR_INFO[status] ||
    (status >= 500
      ? ['upstream_error', 'The site is temporarily unable to serve this request.', 'Retry shortly. For urgent enquiries call or WhatsApp +91 85272 58462.']
      : ['error', 'The request failed.', 'See /openapi.json for the available resources.']);
  const body = JSON.stringify({
    error: override.message || message,
    code: override.code || code,
    status,
    hint: override.hint || hint,
    docs: DOCS_URL
  });
  return new Response(method === 'HEAD' ? null : body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Vary': 'Accept',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

// ───────────────────────── HTML → Markdown ─────────────────────────

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const SKIP_TAGS = new Set(['head', 'script', 'style', 'noscript', 'svg', 'template', 'iframe', 'nav', 'form', 'button', 'select', 'textarea', 'option', 'canvas', 'audio', 'video', 'object']);
const SKIP_CLASS = /(?:^|[\s_-])(?:mob-menu|mobile-menu|fab-wrap|cookie[\w-]*|exit-intent[\w-]*|popup|modal|skip-link|sr-only)(?:$|[\s_-])/i;
const FRAME_TAGS = new Set(['a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'code', 'del', 's', 'li', 'ul', 'ol', 'blockquote', 'pre', 'table', 'tr', 'td', 'th']);
const BLOCK = new Set(['address', 'article', 'aside', 'body', 'dd', 'details', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'header', 'hgroup', 'main', 'p', 'section', 'summary']);
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®', trade: '™', mdash: '—', ndash: '–', hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', bull: '•', middot: '·', rarr: '→', larr: '←', times: '×', deg: '°' };

function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]*);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return String.fromCodePoint(code); } catch { return m; }
    }
    const v = NAMED[e.toLowerCase()];
    return v === undefined ? m : v;
  });
}

/** Cloudflare "Email Address Obfuscation" encoding: first byte is the XOR key. */
function decodeCfEmail(hex) {
  if (!/^[0-9a-f]{4,}$/i.test(hex) || hex.length % 2) return '';
  const key = parseInt(hex.slice(0, 2), 16);
  let out = '';
  for (let i = 2; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
  return /^[^\s@<>]+@[^\s@<>]+$/.test(out) ? out : '';
}

function parseAttrs(str) {
  const attrs = {};
  const re = /([^\s=\/"'<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(str))) attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  return attrs;
}

const collapse = s => s.replace(/\s+/g, ' ').trim();

function shouldSkip(tag, attrs) {
  if (SKIP_TAGS.has(tag)) return true;
  if ('hidden' in attrs || attrs['aria-hidden'] === 'true') return true;
  if (/display\s*:\s*none/i.test(attrs.style || '')) return true;
  return SKIP_CLASS.test(`${attrs.id || ''} ${attrs.class || ''}`);
}

function resolveUrl(href, base) {
  try { return new URL(href, base).href; } catch { return ''; }
}

const mdUrl = u => u.replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');

function pickRoot(html) {
  const main = /<main\b[^>]*>/i.exec(html);
  if (main) {
    const end = html.search(/<\/main\s*>/i);
    return html.slice(main.index + main[0].length, end > main.index ? end : undefined);
  }
  const body = /<body\b[^>]*>/i.exec(html);
  if (body) {
    const end = html.search(/<\/body\s*>/i);
    return html.slice(body.index + body[0].length, end > body.index ? end : undefined);
  }
  return html;
}

function pageMeta(html) {
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  let description = '';
  const metaRe = /<meta\b[^>]*>/gi;
  let m;
  while ((m = metaRe.exec(html))) {
    const a = parseAttrs(m[0].slice(5, -1));
    if ((a.name || '').toLowerCase() === 'description' && a.content) { description = a.content; break; }
  }
  return { title: title ? collapse(decodeEntities(title[1])) : '', description: collapse(description) };
}

function renderTable(rows) {
  rows = rows.filter(r => r.length);
  if (!rows.length) return '';
  const w = Math.max(...rows.map(r => r.length));
  const norm = r => Array.from({ length: w }, (_, i) => (r[i] ?? '').replace(/\|/g, '\\|'));
  const lines = ['| ' + norm(rows[0]).join(' | ') + ' |', '| ' + Array(w).fill('---').join(' | ') + ' |'];
  for (const r of rows.slice(1)) lines.push('| ' + norm(r).join(' | ') + ' |');
  return '\n\n' + lines.join('\n') + '\n\n';
}

function htmlToMarkdown(html, baseUrl) {
  const meta = pageMeta(html);
  const src = pickRoot(String(html));
  const root = { tag: '#root', parts: [] };
  const stack = [root];
  const top = () => stack[stack.length - 1];
  const emit = s => { if (s) top().parts.push(s); };
  const inPre = () => stack.some(f => f.tag === 'pre');
  const nearest = tag => { for (let i = stack.length - 1; i >= 0; i--) if (stack[i].tag === tag) return stack[i]; return null; };
  let skipTag = null;
  let skipDepth = 0;

  function finalize(f) {
    const inner = f.parts.join('');
    switch (f.tag) {
      case 'a': {
        const text = collapse(inner);
        let href = (f.attrs.href || '').trim();
        const cf = /\/cdn-cgi\/l\/email-protection#([0-9a-f]+)/i.exec(href);
        if (cf) {
          const email = decodeCfEmail(cf[1]);
          if (email) return `[${text && !/protected/i.test(text) ? text : email}](mailto:${email})`;
        }
        if (!href || href.startsWith('#') || /^javascript:/i.test(href)) return text;
        href = /^(mailto|tel):/i.test(href) ? href : resolveUrl(href, baseUrl);
        if (!href) return text;
        return text ? `[${text}](${mdUrl(href)})` : '';
      }
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': {
        const text = collapse(inner);
        return text ? `\n\n${'#'.repeat(Number(f.tag[1]))} ${text}\n\n` : '';
      }
      case 'strong': case 'b': case 'em': case 'i': case 'del': case 's': {
        const mark = { strong: '**', b: '**', em: '*', i: '*', del: '~~', s: '~~' }[f.tag];
        const flat = inner.replace(/\s+/g, ' ');
        if (!flat.trim()) return flat;
        return `${flat.match(/^\s*/)[0]}${mark}${flat.trim()}${mark}${flat.match(/\s*$/)[0]}`;
      }
      case 'code': {
        if (inPre()) return inner;
        const text = collapse(inner);
        return text ? '`' + text + '`' : '';
      }
      case 'pre': return `\n\n\`\`\`\n${inner.replace(/^\n+|\n+$/g, '')}\n\`\`\`\n\n`;
      case 'blockquote': {
        const text = inner.replace(/\n{3,}/g, '\n\n').trim();
        return text ? '\n\n' + text.split('\n').map(l => (l ? '> ' + l : '>')).join('\n') + '\n\n' : '';
      }
      case 'ul': case 'ol': return f.items.length ? '\n\n' + f.items.join('\n') + '\n\n' : '';
      case 'li': {
        const body = inner.trim().replace(/\n{2,}/g, '\n');
        let parent = null;
        for (let i = stack.length - 1; i >= 0; i--) if (stack[i].tag === 'ul' || stack[i].tag === 'ol') { parent = stack[i]; break; }
        if (!body) return '';
        const prefix = parent && parent.tag === 'ol' ? `${++parent.n}. ` : '- ';
        const line = prefix + body.replace(/\n/g, '\n' + ' '.repeat(prefix.length));
        if (parent) { parent.items.push(line); return ''; }
        return `\n\n${line}\n\n`;
      }
      case 'td': case 'th': { const tr = nearest('tr'); if (tr) tr.cells.push(collapse(inner)); return ''; }
      case 'tr': { const t = nearest('table'); if (t && f.cells.length) t.rows.push(f.cells); return ''; }
      case 'table': return renderTable(f.rows);
      default: return inner;
    }
  }

  function closeFrame(tag) {
    let idx = -1;
    for (let i = stack.length - 1; i > 0; i--) if (stack[i].tag === tag) { idx = i; break; }
    if (idx === -1) return false;
    while (stack.length > idx) {
      const f = stack.pop();
      top().parts.push(finalize(f));
    }
    return true;
  }

  const tokenRe = /<!--[\s\S]*?-->|<![^>]*>|<\/?([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>|[^<]+|</g;
  let m;
  while ((m = tokenRe.exec(src))) {
    const raw = m[0];
    const tag = m[1] ? m[1].toLowerCase() : null;

    if (!tag) {
      if (skipTag || raw.startsWith('<!')) continue;
      if (raw === '<') { emit('<'); continue; }
      let text = decodeEntities(raw);
      if (!inPre()) {
        text = text.replace(/\s+/g, ' ');
        const last = top().parts[top().parts.length - 1];
        if (!last || /\n$/.test(last)) text = text.replace(/^ +/, '');
      }
      emit(text);
      continue;
    }

    const closing = raw[1] === '/';

    if (skipTag) {
      if (tag === skipTag) {
        if (closing) { if (--skipDepth === 0) skipTag = null; }
        else if (!VOID.has(tag) && !raw.endsWith('/>')) skipDepth++;
      }
      continue;
    }

    if (closing) {
      if (FRAME_TAGS.has(tag)) { closeFrame(tag); }
      if (BLOCK.has(tag) || /^(ul|ol|li|table|tr|blockquote|pre)$/.test(tag)) emit('\n\n');
      continue;
    }

    const attrs = parseAttrs(m[2] || '');
    const selfClosing = raw.endsWith('/>') || VOID.has(tag);

    if (attrs['data-cfemail']) { // Cloudflare-obfuscated email inside a <span>/<a>
      const email = decodeCfEmail(attrs['data-cfemail']);
      if (email) emit(email);
      if (!selfClosing) { skipTag = tag; skipDepth = 1; }
      continue;
    }

    if (shouldSkip(tag, attrs)) {
      if (!selfClosing) {
        skipTag = tag; skipDepth = 1;
        if (tag === 'script' || tag === 'style') { // jump straight to the closing tag: raw-text elements
          const end = src.toLowerCase().indexOf('</' + tag, tokenRe.lastIndex);
          if (end !== -1) tokenRe.lastIndex = end;
        }
      }
      continue;
    }

    if (tag === 'br') { emit('  \n'); continue; }
    if (tag === 'hr') { emit('\n\n---\n\n'); continue; }
    if (tag === 'img') {
      const alt = collapse(attrs.alt || '').replace(/[\[\]]/g, '');
      const raw0 = attrs.src || attrs['data-src'] || '';
      const url = raw0 && !/^data:/i.test(raw0) ? resolveUrl(raw0, baseUrl) : '';
      if (alt && url) emit(`![${alt}](${mdUrl(url)})`);
      continue;
    }
    if (selfClosing) continue;

    if (FRAME_TAGS.has(tag)) {
      const frame = { tag, parts: [], attrs };
      if (tag === 'ul' || tag === 'ol') { frame.items = []; frame.n = 0; if (tag === 'ol' && attrs.start) frame.n = Math.max(0, parseInt(attrs.start, 10) - 1) || 0; }
      if (tag === 'table') frame.rows = [];
      if (tag === 'tr') frame.cells = [];
      if (/^(ul|ol|li|table|tr|blockquote|pre|h[1-6])$/.test(tag)) emit('\n\n');
      stack.push(frame);
      continue;
    }
    if (BLOCK.has(tag)) emit('\n\n');
  }
  while (stack.length > 1) { const f = stack.pop(); top().parts.push(finalize(f)); }

  const body = root.parts.join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const front = ['---'];
  if (meta.title) front.push(`title: ${JSON.stringify(meta.title)}`);
  if (meta.description) front.push(`description: ${JSON.stringify(meta.description)}`);
  front.push(`url: ${JSON.stringify(baseUrl)}`, '---', '');
  return body ? front.join('\n') + '\n' + body + '\n' : '';
}

// ───────────────────────── Worker entry ─────────────────────────

function withVary(response) {
  const r = new Response(response.body, response);
  r.headers.set('Vary', mergeVary(response.headers.get('Vary'), 'Accept'));
  return r;
}

export default {
  async fetch(request) {
    const method = request.method;
    if (method !== 'GET' && method !== 'HEAD') return fetch(request);

    const url = new URL(request.url);
    const path = url.pathname;
    if (path.startsWith('/cdn-cgi/')) return fetch(request);

    const accept = request.headers.get('Accept');
    const isApi = path.startsWith('/api/');
    const htmlRoute = isHtmlRoute(path);
    const negotiable = htmlRoute && !PRIVATE_PATHS.has(path);
    const decision = negotiable ? negotiateRepresentation(accept) : 'html';

    if (decision === 'not-acceptable') {
      // A missing page is still a 404 (or 5xx), not a 406: ask the origin for the status first (HEAD = no body).
      let status = 200;
      try { status = (await fetch(new Request(request.url, { method: 'HEAD' }))).status; } catch { /* treat as reachable */ }
      return errorResponse(status >= 400 ? status : 406, method);
    }

    let originReq = request;
    if (decision === 'markdown') {
      // Need the full HTML body, and must never answer a Markdown request with a 304 for the HTML ETag.
      const headers = new Headers(request.headers);
      headers.delete('If-None-Match');
      headers.delete('If-Modified-Since');
      originReq = new Request(request.url, { method: 'GET', headers });
    }

    let origin;
    try {
      origin = await fetch(originReq);
    } catch {
      return errorResponse(502, method);
    }

    if (origin.status >= 400) {
      if (isApi || prefersJson(accept)) return errorResponse(origin.status, method);
      return htmlRoute ? withVary(origin) : origin; // keep the friendly HTML 404 page for browsers
    }

    if (decision === 'markdown' && origin.status === 200 && /text\/html/i.test(origin.headers.get('Content-Type') || '')) {
      const html = await origin.text();
      const md = htmlToMarkdown(html, url.origin + path);
      if (md.trim()) {
        return new Response(method === 'HEAD' ? null : md, {
          status: 200,
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Vary': 'Accept',
            'Cache-Control': origin.headers.get('Cache-Control') || 'public, max-age=600',
            'X-Markdown-Tokens': String(Math.ceil(md.length / 4)),
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }
      // Conversion produced nothing: fall back to the HTML we already read.
      const fallback = new Response(method === 'HEAD' ? null : html, { status: origin.status, headers: origin.headers });
      fallback.headers.delete('Content-Length');
      fallback.headers.set('Vary', mergeVary(origin.headers.get('Vary'), 'Accept'));
      return fallback;
    }

    return htmlRoute ? withVary(origin) : origin;
  }
};
