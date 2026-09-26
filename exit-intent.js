/* ════════════════════════════════════════════════════════════
   EXIT-INTENT POPUP — catches a visitor about to leave the shed
   cost calculator without submitting, and offers a one-tap
   WhatsApp estimate instead of losing the lead entirely.

   Desktop trigger : mouse leaves the viewport at the very top
                      (toward the tab bar / address bar / close).
   Mobile trigger   : visitor scrolls back up fast toward the top
                      after having scrolled down a meaningful
                      amount (the classic "about to bail" gesture
                      on a phone, where mouseleave doesn't exist).

   Shown at most once per browser session (sessionStorage), and
   only after a minimum engagement time so it never fires the
   instant the page loads. The WhatsApp link uses the site's
   normal wa.me href, so site-tracker.js's existing delegated
   click listener logs it under whatsappClicks automatically —
   no extra tracking code needed here.
════════════════════════════════════════════════════════════ */
(function () {
  const SESSION_KEY = 'rrts_exit_intent_shown';
  const MIN_ENGAGEMENT_MS = 8000;   // don't arm until visitor has been on page this long
  const SCROLL_DOWN_THRESHOLD = 300; // px scrolled down before an upward flick counts as "leaving"
  const SCROLL_UP_TRIGGER = 120;     // px scrolled back up within one check to count as a flick
  const NEAR_TOP_Y = 150;            // must be back near the top of the page to trigger
  const WHATSAPP_NUMBER = '918527258462';

  if (sessionStorage.getItem(SESSION_KEY)) return;

  const pageLoadedAt = Date.now();
  let armed = false;
  let shown = false;
  let maxScrollY = 0;

  setTimeout(() => { armed = true; }, MIN_ENGAGEMENT_MS);

  function waLink() {
    const msg = encodeURIComponent(
      "Hi! Main apne shed/structure ka estimate dekh raha tha — thoda kam samajh nahi aaya, kya aap madad kar sakte hain?"
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  }

  function buildPopup() {
    const overlay = document.createElement('div');
    overlay.id = 'exit-intent-overlay';
    overlay.innerHTML = `
      <div id="exit-intent-card" role="dialog" aria-modal="true" aria-labelledby="ei-title">
        <button type="button" id="exit-intent-close" aria-label="Close">&times;</button>
        <div id="exit-intent-icon">👋</div>
        <h3 id="ei-title">Ruko! Free estimate abhi paayein</h3>
        <p>Form bharne ki zaroorat nahi — apna shed/structure ka size WhatsApp pe bata dein, hum 10 minute mein estimate bhej denge.</p>
        <a id="exit-intent-cta" href="${waLink()}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.38 1.26 4.8L2 22l5.42-1.42a9.87 9.87 0 0 0 4.62 1.18h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.06h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 1 1 6.98 3.86zm4.5-6.14c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.24-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.42.06-.65.31-.22.25-.85.83-.85 2.03s.87 2.36.99 2.52c.12.17 1.71 2.61 4.15 3.66.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.14-1.18-.06-.1-.22-.16-.47-.28z"/></svg>
          WhatsApp par estimate paayein
        </a>
        <button type="button" id="exit-intent-dismiss">Nahi, main khud calculate karunga</button>
      </div>`;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('open'));

    function close() {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 250);
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('#exit-intent-close').addEventListener('click', close);
    overlay.querySelector('#exit-intent-dismiss').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
  }

  function trigger() {
    if (shown || !armed) return;
    if (Date.now() - pageLoadedAt < MIN_ENGAGEMENT_MS) return;
    shown = true;
    sessionStorage.setItem(SESSION_KEY, '1');
    buildPopup();
    document.removeEventListener('mouseout', onMouseOut);
    window.removeEventListener('scroll', onScroll);
  }

  // ── Desktop: mouse truly leaves the window at the top ──────────
  function onMouseOut(e) {
    if (e.clientY <= 0 && !e.relatedTarget) trigger();
  }
  document.addEventListener('mouseout', onMouseOut);

  // ── Mobile: fast scroll back up toward the top after real engagement ──
  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (y > maxScrollY) maxScrollY = y;
    if (
      maxScrollY >= SCROLL_DOWN_THRESHOLD &&
      y <= NEAR_TOP_Y &&
      (maxScrollY - y) >= SCROLL_UP_TRIGGER
    ) {
      trigger();
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();
