import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8');

// ───────── homepage is readable without JavaScript ─────────
test('homepage: >=500 chars of meaningful text in raw HTML, one H1, sequential headings', () => {
  const html = read('index.html');
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ').replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  assert.ok(text.length >= 500, `visible text ${text.length}`);
  const levels = [...html.matchAll(/<h([1-6])[\s>]/gi)].map(m => Number(m[1]));
  assert.equal(levels.filter(l => l === 1).length, 1, 'exactly one <h1>');
  assert.equal(levels[0], 1);
  levels.slice(1).forEach((l, i) => assert.ok(l <= levels[i] + 1, `heading jump h${levels[i]} -> h${l} at #${i + 1}`));
});

test('homepage: restyled headings keep an identical look (h3 twins of the old h4/h5 rules)', () => {
  const css = read('style.css');
  const decl = sel => { const m = css.match(new RegExp(sel.replace(/[.]/g, '\\.') + '\\s*\\{([^}]*)\\}')); return m && m[1].replace(/\/\*.*?\*\//g, '').replace(/\s+/g, ' ').trim(); };
  const norm = d => d.split(';').map(s => s.trim()).filter(Boolean).sort().join(';');
  // footer: old h5 rule and new h3 rule must be identical
  assert.equal(norm(decl('.footer-col h3')), norm(decl('.footer-col h5')));
  // wcard/pstep: new h3 rule = old h4 rule + the letter-spacing the global h4 rule used to provide (.5px)
  assert.equal(norm(decl('.wcard h3')), norm(decl('.wcard h4') + '; letter-spacing:.5px'));
  assert.equal(norm(decl('.pstep h3')), norm(decl('.pstep h4') + '; letter-spacing:.5px'));
  assert.match(css, /^h4 \{[^}]*letter-spacing:\s*\.5px/m);
});

test('homepage links the stylesheet with the bumped cache-busting version', () => {
  assert.match(read('index.html'), /style\.css\?v=20261006/);
});

// ───────── robots.txt ─────────
test('robots.txt: AI agents explicitly allowed, internal paths blocked, sitemap declared', () => {
  const txt = read('robots.txt');
  const groups = txt.split(/\n\s*\n/).map(g => g.split('\n').filter(l => l && !l.startsWith('#')));
  const agents = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot', 'Applebot-Extended'];
  for (const a of agents) {
    const g = groups.find(lines => lines.includes(`User-agent: ${a}`));
    assert.ok(g, `group for ${a}`);
    assert.ok(g.includes('Allow: /'), `${a} Allow: /`);
    for (const p of ['/quotation-system.html', '/testimonials-admin.html', '/workers/']) assert.ok(g.includes(`Disallow: ${p}`), `${a} Disallow ${p}`);
    // Disallow must precede Allow so first-match parsers and longest-match parsers agree
    assert.ok(g.indexOf('Allow: /') > g.lastIndexOf('Disallow: /workers/'), `${a} rule order`);
  }
  assert.ok(!/^Disallow:\s*\/\s*$/m.test(txt), 'must not block the whole site');
  assert.match(txt, /^Sitemap: https:\/\/rrteensetsolution\.com\/sitemap\.xml$/m);
});

// ───────── OpenAPI ─────────
const spec = JSON.parse(read('openapi.json'));

test('openapi.json: structure, every documented path is a real file/route, errors are JSON', () => {
  assert.match(spec.openapi, /^3\.1\./);
  assert.ok(spec.info.title && spec.info.version && spec.servers[0].url === 'https://rrteensetsolution.com');
  const files = { '/knowledge.json': 'knowledge.json', '/search-index.json': 'search-index.json', '/llms.txt': 'llms.txt', '/sitemap.xml': 'sitemap.xml', '/robots.txt': 'robots.txt', '/': 'index.html' };
  assert.deepEqual(Object.keys(spec.paths).sort(), Object.keys(files).sort());
  for (const [p, f] of Object.entries(files)) assert.ok(existsSync(new URL(f, root)), `${p} -> ${f}`);
  const ids = new Set();
  for (const [p, item] of Object.entries(spec.paths)) {
    assert.deepEqual(Object.keys(item), ['get'], `${p} is read-only`);
    const op = item.get;
    assert.ok(!ids.has(op.operationId) && op.operationId); ids.add(op.operationId);
    assert.ok(op.responses['200'] && op.responses['404']?.content['application/json'], `${p} documents a JSON 404`);
  }
  assert.ok(spec.paths['/'].get.responses['200'].content['text/markdown'], 'homepage documents text/markdown');
  assert.ok(spec.paths['/'].get.responses['406'], 'homepage documents 406');
  assert.deepEqual(spec.components.schemas.Error.required.sort(), ['code', 'error', 'hint', 'status']);
});

test('openapi.json: published data matches the declared schemas', () => {
  const kb = JSON.parse(read('knowledge.json'));
  const need = spec.components.schemas.KnowledgeEntry.required;
  assert.equal(typeof kb.version, 'string');
  for (const e of kb.entries) for (const k of need) assert.equal(typeof e[k], 'string', `${e.id}.${k}`);
  const idx = JSON.parse(read('search-index.json'));
  for (const e of idx) for (const k of spec.components.schemas.SearchIndexEntry.required) assert.equal(typeof e[k], 'string', `${e.url}.${k}`);
});

test('every $ref in openapi.json resolves', () => {
  const refs = [...JSON.stringify(spec).matchAll(/"\$ref":"#\/components\/schemas\/(\w+)"/g)].map(m => m[1]);
  assert.ok(refs.length > 0);
  for (const r of refs) assert.ok(spec.components.schemas[r], r);
});

test('llms.txt points to the machine-readable resources', () => {
  const t = read('llms.txt');
  assert.match(t, /https:\/\/rrteensetsolution\.com\/openapi\.json/);
  assert.match(t, /https:\/\/rrteensetsolution\.com\/knowledge\.json/);
});
