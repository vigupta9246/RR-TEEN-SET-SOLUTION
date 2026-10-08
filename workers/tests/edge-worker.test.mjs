import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadWorker, mockFetch } from './helpers.mjs';

const mod = await loadWorker('edge-worker.js', ['negotiateRepresentation', 'prefersJson', 'htmlToMarkdown', 'decodeCfEmail', 'isHtmlRoute', 'parseAccept']);
const worker = mod.default;
const { negotiateRepresentation: negotiate, prefersJson, htmlToMarkdown, decodeCfEmail, isHtmlRoute } = mod;

// ───────── negotiation (RFC 9110 q-values, acceptmarkdown.com rules) ─────────
test('negotiation: decision table', () => {
  const T = (accept, expected) => assert.equal(negotiate(accept), expected, `Accept: ${accept}`);
  T(undefined, 'html'); T(null, 'html'); T('', 'html'); T('garbage', 'html');
  T('text/html', 'html');
  T('text/markdown', 'markdown');
  T('text/markdown, text/html', 'markdown');                       // tie, explicit markdown
  T('text/html, text/markdown;q=0.5', 'html');                     // browser-ish preference for HTML
  T('text/html;q=0.5, text/markdown;q=1.0', 'markdown');
  T('text/html;q=1.0, text/markdown;q=0.1', 'html');
  T('text/markdown;q=0, text/html;q=1.0', 'html');                 // q=0 means "not acceptable"
  T('text/html ; q = 1.0, text/markdown ; q = 0.5', 'html');       // optional whitespace around q
  T('text/html;q=2.0, text/markdown;q=1.0', 'markdown');           // out-of-range q -> 1, tie, explicit markdown
  T('*/*', 'html');                                                // wildcard tie never picks markdown
  T('application/json, text/plain, */*', 'html');                  // axios-style default
  T('text/*', 'markdown');                                         // explicit text/* tie -> markdown
  T('text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8', 'html'); // Chrome
  T('text/markdown;q=0, text/html;q=0', 'not-acceptable');
  T('application/json', 'not-acceptable');
  T('application/x-content-negotiation-probe', 'not-acceptable');
  T('Text/Markdown', 'markdown');                                  // case-insensitive
  T('application/xhtml+xml', 'html');
});

test('prefersJson only for explicit application/json', () => {
  assert.equal(prefersJson('application/json'), true);
  assert.equal(prefersJson('application/json, text/plain, */*'), true);
  assert.equal(prefersJson('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'), false);
  assert.equal(prefersJson('*/*'), false);
  assert.equal(prefersJson('text/html, application/json;q=0.5'), false);
  assert.equal(prefersJson(null), false);
});

test('route classification', () => {
  for (const p of ['/', '/index.html', '/tin-shed', '/blog/', '/tin-shed.html']) assert.equal(isHtmlRoute(p), true, p);
  for (const p of ['/style.css', '/knowledge.json', '/llms.txt', '/images/a.webp', '/api/x', '/.well-known/x', '/sitemap.xml']) assert.equal(isHtmlRoute(p), false, p);
});

// ───────── HTML → Markdown ─────────
const BASE = 'https://rrteensetsolution.com/page.html';

test('markdown: headings, emphasis, links, images, entities', () => {
  const md = htmlToMarkdown(`<html><head><title>My &amp; Title</title><meta name="description" content="A desc"></head><body>
    <h1>Hello <em>World</em></h1><p>Some <strong>bold</strong> &amp; <code>code</code> text <a href="/about.html">About</a> and <a href="tel:+918527258462">call</a>.</p>
    <img src="/images/a.png" alt="Logo"><img src="/images/decor.png" alt=""><h2>Next</h2></body></html>`, BASE);
  assert.match(md, /^---\ntitle: "My & Title"\ndescription: "A desc"\nurl: "https:\/\/rrteensetsolution.com\/page.html"\n---\n/);
  assert.match(md, /# Hello \*World\*/);
  assert.match(md, /Some \*\*bold\*\* & `code` text \[About\]\(https:\/\/rrteensetsolution\.com\/about\.html\) and \[call\]\(tel:\+918527258462\)\./);
  assert.match(md, /!\[Logo\]\(https:\/\/rrteensetsolution\.com\/images\/a\.png\)/);
  assert.doesNotMatch(md, /decor\.png/);       // decorative image (no alt) dropped
  assert.match(md, /\n## Next\n/);
});

test('markdown: lists (nested + ordered), table, blockquote, pre', () => {
  const md = htmlToMarkdown(`<body><ul><li>One<ul><li>Nested</li></ul></li><li>Two</li></ul>
    <ol><li>First</li><li>Second</li></ol>
    <table><tr><th>Type</th><th>Rate</th></tr><tr><td>Tin shed</td><td>180 | 250</td></tr></table>
    <blockquote><p>Quote me</p></blockquote><pre><code>a  b\n  c</code></pre></body>`, BASE);
  assert.match(md, /- One\n  - Nested\n- Two/);
  assert.match(md, /1\. First\n2\. Second/);
  assert.match(md, /\| Type \| Rate \|\n\| --- \| --- \|\n\| Tin shed \| 180 \\\| 250 \|/);
  assert.match(md, /> Quote me/);
  assert.match(md, /```\na {2}b\n {2}c\n```/);
});

test('markdown: boilerplate and non-content are removed', () => {
  const md = htmlToMarkdown(`<body><nav><a href="/x">NAVLINK</a></nav><div id="mob-menu">MOBMENU</div>
    <script>var a = "<h1>SCRIPT</h1>";</script><style>.x{}</style><svg><text>SVGTEXT</text></svg>
    <form><label>FORMLABEL</label><input></form><button>BTN</button><div hidden>HIDDEN</div><span aria-hidden="true">ARIA</span>
    <div style="display:none">NONE</div><div class="fab-wrap">FAB</div><!-- COMMENT --><main><h1>Real</h1><p>Content</p></main></body>`, BASE);
  for (const junk of ['NAVLINK', 'MOBMENU', 'SCRIPT', 'SVGTEXT', 'FORMLABEL', 'BTN', 'HIDDEN', 'ARIA', 'NONE', 'FAB', 'COMMENT']) assert.doesNotMatch(md, new RegExp(junk), junk);
  assert.match(md, /# Real\n\nContent/);
});

test('markdown: Cloudflare-obfuscated email is restored', () => {
  assert.equal(decodeCfEmail('f990979f96b98b8b8d9c9c978a9c8d8a96958c8d909697d79a9694'), 'info@rrteensetsolution.com');
  assert.equal(decodeCfEmail('zz'), '');
  const md = htmlToMarkdown(`<body><p>Mail <a href="/cdn-cgi/l/email-protection#f990979f96b98b8b8d9c9c978a9c8d8a96958c8d909697d79a9694"><span class="__cf_email__" data-cfemail="f990979f96b98b8b8d9c9c978a9c8d8a96958c8d909697d79a9694">[email&#160;protected]</span></a></p></body>`, BASE);
  assert.match(md, /\[info@rrteensetsolution\.com\]\(mailto:info@rrteensetsolution\.com\)/);
  assert.doesNotMatch(md, /protected/);
});

test('markdown: javascript:/# links become plain text; unclosed tags do not throw', () => {
  const md = htmlToMarkdown(`<body><a href="javascript:void(0)">More ▾</a> <a href="#top">Top</a><p>unclosed <b>bold <i>both<p>next`, BASE);
  assert.match(md, /More ▾ Top/);
  assert.doesNotMatch(md, /javascript:/);
  for (const word of ['unclosed', 'bold', 'both', 'next']) assert.match(md, new RegExp(word)); // malformed HTML never loses text
});

test('markdown: real homepage converts to meaningful content', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const md = htmlToMarkdown(html, 'https://rrteensetsolution.com/');
  assert.ok(md.length > 2500, `markdown length ${md.length}`);
  assert.match(md, /^---\ntitle: "/);
  assert.match(md, /\n# TIN SHED CONTRACTOR/);
  assert.match(md, /\[Know More →\]\(https:\/\/rrteensetsolution\.com\/tin-shed\.html\)/);
  assert.match(md, /tel:\+918527258462/);
  assert.doesNotMatch(md, /<[a-z]+[ >]/i);          // no raw HTML left
  assert.doesNotMatch(md, /javascript:/);
  assert.doesNotMatch(md, /Services ▾/);             // desktop nav removed
  assert.equal((md.match(/\n# /g) || []).length, 1); // single H1 survives
});

// ───────── Worker handler ─────────
const HTML_PAGE = `<!doctype html><html><head><title>Home</title></head><body><nav>NAV</nav><h1>Welcome</h1><p>Body text <a href="/about.html">About</a></p></body></html>`;
const NOT_FOUND = `<!doctype html><html><head><title>Not found</title></head><body><h1>Ye Page Nahi Mila</h1></body></html>`;

function origin(overrides = {}) {
  const seen = [];
  const restore = mockFetch(req => {
    const u = new URL(req.url);
    seen.push({ method: req.method, path: u.pathname, headers: Object.fromEntries(req.headers) });
    if (overrides[u.pathname]) return overrides[u.pathname](req);
    if (['/', '/index.html', '/tin-shed'].includes(u.pathname) || u.pathname === '/quotation-system.html')
      return new Response(HTML_PAGE, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'max-age=600', 'Vary': 'Accept-Encoding', 'ETag': 'W/"abc"' } });
    if (u.pathname === '/style.css') return new Response('body{}', { status: 200, headers: { 'Content-Type': 'text/css' } });
    return new Response(NOT_FOUND, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  });
  return { seen, restore };
}
const get = (path, accept, init = {}) => worker.fetch(new Request('https://rrteensetsolution.com' + path, { method: 'GET', ...init, headers: { ...(accept ? { Accept: accept } : {}), ...(init.headers || {}) } }));

test('GET / with Accept: text/markdown -> markdown, correct headers', async () => {
  const { restore } = origin();
  try {
    const res = await get('/', 'text/markdown');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assert.match(res.headers.get('Vary'), /\bAccept\b/);
    assert.ok(Number(res.headers.get('X-Markdown-Tokens')) > 0);
    const body = await res.text();
    assert.ok(body.trim().length > 0);
    assert.match(body, /# Welcome/);
    assert.match(body, /\[About\]\(https:\/\/rrteensetsolution\.com\/about\.html\)/);
    assert.doesNotMatch(body, /NAV|<h1>/);
  } finally { restore(); }
});

test('GET / with Accept: text/html (and no Accept, and browser Accept) -> untouched HTML with Vary: Accept', async () => {
  const { restore } = origin();
  try {
    for (const accept of ['text/html', null, 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', '*/*', 'text/html;q=1.0, text/markdown;q=0.5']) {
      const res = await get('/', accept);
      assert.equal(res.status, 200, String(accept));
      assert.match(res.headers.get('Content-Type'), /^text\/html/);
      const vary = res.headers.get('Vary');
      assert.match(vary, /\bAccept\b/, String(accept));
      assert.match(vary, /Accept-Encoding/);      // existing Vary token preserved
      assert.equal(await res.text(), HTML_PAGE);
    }
  } finally { restore(); }
});

test('extensionless and .html pages are negotiated too', async () => {
  const { restore } = origin();
  try {
    assert.match((await get('/tin-shed', 'text/markdown')).headers.get('Content-Type'), /^text\/markdown/);
    assert.match((await get('/index.html', 'text/markdown')).headers.get('Content-Type'), /^text\/markdown/);
  } finally { restore(); }
});

test('unacceptable Accept -> 406 JSON with Vary: Accept and no-store', async () => {
  const { seen, restore } = origin();
  try {
    for (const accept of ['application/json', 'application/x-content-negotiation-probe', 'text/markdown;q=0, text/html;q=0']) {
      const res = await get('/', accept);
      assert.equal(res.status, 406, accept);
      assert.equal(res.headers.get('Vary'), 'Accept');
      assert.equal(res.headers.get('Cache-Control'), 'no-store');
      assert.match(res.headers.get('Content-Type'), /^application\/json/);
      const j = await res.json();
      assert.equal(j.code, 'not_acceptable'); assert.equal(j.status, 406);
      assert.ok(j.error && j.hint && j.docs);
    }
    assert.ok(seen.every(c => c.method === 'HEAD')); // only a bodyless HEAD status check reaches the origin
  } finally { restore(); }
});

test('Markdown request strips conditional headers (never 304 for HTML etag)', async () => {
  const { seen, restore } = origin();
  try {
    await get('/', 'text/markdown', { headers: { 'If-None-Match': 'W/"abc"', 'If-Modified-Since': 'Sat, 01 Jan 2000 00:00:00 GMT' } });
    assert.equal(seen[0].headers['if-none-match'], undefined);
    assert.equal(seen[0].headers['if-modified-since'], undefined);
  } finally { restore(); }
});

test('HEAD with Accept: text/markdown -> headers only, no body', async () => {
  const { seen, restore } = origin();
  try {
    const res = await worker.fetch(new Request('https://rrteensetsolution.com/', { method: 'HEAD', headers: { Accept: 'text/markdown' } }));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assert.match(res.headers.get('Vary'), /Accept/);
    assert.equal(await res.text(), '');
    assert.equal(seen[0].method, 'GET'); // origin asked with GET to be able to convert
  } finally { restore(); }
});

test('JSON errors: 404 + Accept: application/json -> structured JSON; browsers keep HTML 404', async () => {
  const { restore } = origin();
  try {
    const j = await get('/nope', 'application/json');
    assert.equal(j.status, 404);
    assert.match(j.headers.get('Content-Type'), /^application\/json/);
    const body = await j.json();
    assert.deepEqual(Object.keys(body).sort(), ['code', 'docs', 'error', 'hint', 'status']);
    assert.equal(body.code, 'not_found'); assert.equal(body.status, 404);
    assert.match(body.hint, /sitemap\.xml|openapi\.json/);

    const html = await get('/nope', 'text/html');
    assert.equal(html.status, 404);
    assert.match(html.headers.get('Content-Type'), /^text\/html/);
    assert.equal(await html.text(), NOT_FOUND);
  } finally { restore(); }
});

test('JSON errors: everything under /api/ is JSON regardless of Accept', async () => {
  const { restore } = origin();
  try {
    for (const accept of [null, 'text/html', '*/*', 'application/json']) {
      const res = await get('/api/anything', accept);
      assert.equal(res.status, 404);
      assert.match(res.headers.get('Content-Type'), /^application\/json/);
      assert.equal((await res.json()).code, 'not_found');
    }
  } finally { restore(); }
});

test('JSON errors: 5xx from origin and unreachable origin map to upstream_error', async () => {
  let restore = mockFetch(() => new Response('boom', { status: 503 }));
  try {
    const a = await get('/', 'application/json');
    assert.equal(a.status, 503); assert.equal((await a.json()).code, 'upstream_error');
  } finally { restore(); }
  restore = mockFetch(() => { throw new Error('network down'); });
  try {
    const b = await get('/', 'text/markdown');
    assert.equal(b.status, 502); assert.equal((await b.json()).code, 'upstream_error');
  } finally { restore(); }
});

test('pass-through: assets, POST and /cdn-cgi/ are untouched', async () => {
  const { seen, restore } = origin({ '/cdn-cgi/trace': () => new Response('ok') });
  try {
    const css = await get('/style.css', 'text/markdown');
    assert.equal(css.status, 200); assert.equal(css.headers.get('Content-Type'), 'text/css'); assert.equal(await css.text(), 'body{}');
    assert.equal(css.headers.get('Vary'), null);
    const post = await worker.fetch(new Request('https://rrteensetsolution.com/', { method: 'POST', body: 'x' }));
    assert.equal(post.status, 200);
    assert.equal(seen.at(-1).method, 'POST');
    const trace = await get('/cdn-cgi/trace', 'text/markdown');
    assert.equal(await trace.text(), 'ok');
  } finally { restore(); }
});

test('internal tools are never converted to Markdown', async () => {
  const { restore } = origin();
  try {
    const res = await get('/quotation-system.html', 'text/markdown');
    assert.match(res.headers.get('Content-Type'), /^text\/html/);
    assert.equal(await res.text(), HTML_PAGE);
  } finally { restore(); }
});

test('empty conversion falls back to the original HTML', async () => {
  const restore = mockFetch(() => new Response('<html><body><script>1</script></body></html>', { status: 200, headers: { 'Content-Type': 'text/html' } }));
  try {
    const res = await get('/', 'text/markdown');
    assert.match(res.headers.get('Content-Type'), /^text\/html/);
    assert.match(res.headers.get('Vary'), /Accept/);
  } finally { restore(); }
});

test('406 applies to existing pages; a missing page with a JSON-only Accept is a JSON 404', async () => {
  const { restore } = origin();
  try {
    assert.equal((await get('/', 'application/json')).status, 406);
    const missing = await get('/does-not-exist', 'application/json');
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).code, 'not_found');
  } finally { restore(); }
});
