/* R.R Teen Set Solution - service worker
   - pages: network first (always fresh when online), cached copy + offline page when not
   - same-origin css/js/images: stale-while-revalidate (instant repeat visits)
   - Google Fonts cached; everything else (Firebase, analytics, YouTube, forms) is never touched */
const VERSION = 'v1';
const PREFIX = 'rr-';
const C_STATIC = PREFIX + 'static-' + VERSION;
const C_PAGES  = PREFIX + 'pages-' + VERSION;
const C_FONTS  = PREFIX + 'fonts-' + VERSION;
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/android-chrome-192x192.png', '/images/rr-logo-nav.webp', '/favicon-32x32.png'];
const MAX_PAGES = 40, MAX_STATIC = 120, MAX_FONTS = 30, NAV_TIMEOUT = 6000;
const STATIC_RE = /\.(?:css|js|png|jpe?g|webp|avif|gif|svg|ico|woff2?|json|webmanifest)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(C_STATIC)
      .then((cache) => Promise.all(PRECACHE.map((u) => cache.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [C_STATIC, C_PAGES, C_FONTS];
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.indexOf(PREFIX) === 0 && keep.indexOf(k) === -1).map((k) => caches.delete(k)));
    if (self.registration && self.registration.navigationPreload) { try { await self.registration.navigationPreload.enable(); } catch (e) {} }
    await self.clients.claim();
  })());
});

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

async function handleNavigation(event) {
  const req = event.request;
  const cache = await caches.open(C_PAGES);
  try {
    const preloaded = await event.preloadResponse;
    const res = preloaded || await withTimeout(fetch(req), NAV_TIMEOUT);
    const type = (res.headers && res.headers.get('content-type')) || '';
    if (res && res.ok && res.type === 'basic' && type.indexOf('text/html') !== -1) {
      event.waitUntil(cache.put(req, res.clone()).then(() => trim(C_PAGES, MAX_PAGES)));
    }
    return res;
  } catch (err) {
    const hit = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
    if (hit) return hit;
    const offline = await caches.match(OFFLINE_URL);
    return offline || new Response('You are offline. Call +91 85272 58462.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

async function staleWhileRevalidate(event, cacheName, max) {
  const req = event.request;
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const network = fetch(req).then((res) => {
    if (res && (res.ok || res.type === 'opaque')) {
      return cache.put(req, res.clone()).then(() => trim(cacheName, max)).then(() => res);
    }
    return res;
  }).catch(() => null);
  if (hit) { event.waitUntil(network); return hit; }
  return (await network) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (url.pathname === '/sw.js' || url.pathname.indexOf('/cdn-cgi/') === 0) return;
    if (req.mode === 'navigate') { event.respondWith(handleNavigation(event)); return; }
    if (STATIC_RE.test(url.pathname)) { event.respondWith(staleWhileRevalidate(event, C_STATIC, MAX_STATIC)); }
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(event, C_FONTS, MAX_FONTS));
  }
});
