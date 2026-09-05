/* ════════════════════════════════════════════════════════════
   SITE TRACKER — call clicks, WhatsApp clicks, page views
   Feeds the CRM Dashboard's marketing analytics. Every write here is
   fire-and-forget: nothing on this page ever waits on it, and nothing
   the visitor is doing (calling, opening WhatsApp, browsing) is ever
   delayed or blocked if a write fails (offline, rules not deployed yet).
════════════════════════════════════════════════════════════ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC0vwKNfJ4cb9WvGrir8U5oGyWdwNk3TvQ",
  authDomain: "rr-teen-set-quotation.firebaseapp.com",
  databaseURL: "https://rr-teen-set-quotation-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rr-teen-set-quotation",
  storageBucket: "rr-teen-set-quotation.firebasestorage.app",
  messagingSenderId: "871289668592",
  appId: "1:871289668592:web:6bda2d9f255e61294f1335",
  measurementId: "G-N28CZBQ66C"
};
const app = initializeApp(firebaseConfig, 'site-tracker');
const db = getFirestore(app);

const currentPage = () => location.pathname.replace(/^\//, '') || 'index.html';

function logEvent(colName, data) {
  addDoc(collection(db, colName), { ...data, page: currentPage(), ts: serverTimestamp() })
    .catch(err => console.warn(`[site-tracker] Could not log ${colName}:`, err.message));
}

// ── Call + WhatsApp click tracking ──────────────────────────────
document.addEventListener('click', (e) => {
  const telLink = e.target.closest('a[href^="tel:"]');
  if (telLink) {
    logEvent('callClicks', {
      phone: telLink.getAttribute('href').replace('tel:', ''),
      pageTitle: document.title || '',
      referrer: document.referrer || ''
    });
    return; // a single link can't be both — no need to also check whatsapp
  }
  const waLink = e.target.closest('a[href*="wa.me/"], a[href*="api.whatsapp.com/"]');
  if (waLink) {
    logEvent('whatsappClicks', {
      pageTitle: document.title || '',
      referrer: document.referrer || ''
    });
  }
  // Never preventDefault / never delay — the tel:/WhatsApp link proceeds immediately either way.
}, { capture: true });

// ── Page view tracking ───────────────────────────────────────────
// One event per page load. Fired immediately — this script is loaded
// with `defer`/`type="module"`, both of which already wait for the DOM,
// so no extra "DOMContentLoaded" listener is needed here.
logEvent('pageViews', {
  pageTitle: document.title || '',
  referrer: document.referrer || ''
});

// ── Steel Rate widget (Admin sets this from the CRM's Team tab) ─────
// Only fires a Firestore read on pages that actually have the widget
// element — most pages don't, so this stays a no-op for them. No login
// needed (see settings/{id} rule's 'steelRate' exception).
const rateEl = document.getElementById('steel-rate-widget');
if (rateEl) {
  getDoc(doc(db, 'settings', 'steelRate')).then(snap => {
    if (!snap.exists() || typeof snap.data().ratePerKg !== 'number') {
      rateEl.style.display = 'none';
      return;
    }
    const { ratePerKg, updatedAt } = snap.data();
    const updatedDate = updatedAt?.toDate ? updatedAt.toDate() : null;
    const daysOld = updatedDate ? Math.floor((Date.now() - updatedDate.getTime()) / 86400000) : null;
    const dateStr = updatedDate
      ? updatedDate.toLocaleDateString('en-IN', { day:'numeric', month:'short' }) + ', ' + updatedDate.toLocaleTimeString('en-IN', { hour:'numeric', minute:'2-digit' })
      : 'recently';
    const staleNote = (daysOld !== null && daysOld >= 7)
      ? `<div class="steel-rate-stale">⚠️ Rate updated ${daysOld} days ago — call for today's exact price</div>`
      : '';
    rateEl.innerHTML = `
      <div class="steel-rate-icon">🔩</div>
      <div>
        <div class="steel-rate-label">Aaj Ka Steel Rate</div>
        <div class="steel-rate-value">₹${ratePerKg}<span>/kg</span></div>
        <div class="steel-rate-updated">Last updated: ${dateStr}</div>
        ${staleNote}
      </div>`;
    rateEl.classList.add('loaded');
  }).catch(err => {
    console.warn('[site-tracker] Could not load steel rate:', err.message);
    rateEl.style.display = 'none';
  });
}
