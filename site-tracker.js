/* ════════════════════════════════════════════════════════════
   SITE TRACKER — call clicks, WhatsApp clicks, page views
   Feeds the CRM Dashboard's marketing analytics. Every write here is
   fire-and-forget: nothing on this page ever waits on it, and nothing
   the visitor is doing (calling, opening WhatsApp, browsing) is ever
   delayed or blocked if a write fails (offline, rules not deployed yet).
════════════════════════════════════════════════════════════ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp }
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
