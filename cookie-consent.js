/**
 * ═══════════════════════════════════════════════════════════
 *  Cookie Consent System — cookie-consent.js
 *  Version: 1.0.0
 *  Compatible: All modern browsers + GitHub Pages
 *  Dependencies: None (pure vanilla JS)
 * ═══════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ─── CONFIGURATION ────────────────────────────────────────
  const CONFIG = {
    storageKey: 'cc_preferences',       // localStorage key
    version: '1.0',                     // bump to re-show banner after policy change
    bannerDelay: 800,                   // ms before banner appears
    animDuration: 320,                  // ms for transitions

    // Scripts to inject on consent — add your real ones here
    scripts: {
      analytics: [
        // Example: Google Analytics
        // { type: 'src', value: 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX' },
        // { type: 'inline', value: "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-XXXXXXXX');" }
      ],
      marketing: [
        // Example: Facebook Pixel
        // { type: 'inline', value: "!function(f,b,e,v,n,t,s)..." }
      ]
    }
  };

  // ─── STATE ────────────────────────────────────────────────
  let prefs = null;

  // ─── STORAGE ──────────────────────────────────────────────
  function savePrefs(data) {
    const payload = { ...data, version: CONFIG.version, savedAt: Date.now() };
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(payload)); } catch (e) {}
    prefs = payload;
  }

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      // Re-show banner if policy version changed
      if (data.version !== CONFIG.version) return null;
      return data;
    } catch (e) { return null; }
  }

  // ─── SCRIPT INJECTION ─────────────────────────────────────
  function injectScripts(category) {
    const scripts = CONFIG.scripts[category] || [];
    scripts.forEach(s => {
      if (s.type === 'src') {
        if (document.querySelector(`script[src="${s.value}"]`)) return;
        const el = document.createElement('script');
        el.src = s.value; el.async = true;
        document.head.appendChild(el);
      } else if (s.type === 'inline') {
        const el = document.createElement('script');
        el.textContent = s.value;
        document.head.appendChild(el);
      }
    });
  }

  function applyConsent(p) {
    if (p.analytics) injectScripts('analytics');
    if (p.marketing) injectScripts('marketing');
    // Dispatch event for other scripts to listen
    window.dispatchEvent(new CustomEvent('cc:consent', { detail: p }));
  }

  // ─── BANNER HTML ──────────────────────────────────────────
  function buildBanner() {
    const el = document.createElement('div');
    el.id = 'cc-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cookie consent');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML = `
      <div class="cc-banner-inner">
        <div class="cc-banner-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" opacity=".12"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
            <circle cx="15.5" cy="10.5" r="1" fill="currentColor"/>
            <circle cx="10" cy="15" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="15" r="1" fill="currentColor"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10" stroke="currentColor" stroke-width="1.5" fill="none"/>
          </svg>
        </div>
        <div class="cc-banner-text">
          <strong>We use cookies</strong>
          <p>We use essential cookies to make our site work. With your consent, we may also use analytics and marketing cookies to improve your experience and show relevant content. <a href="cookie-policy.html" class="cc-link">Cookie Policy</a> · <a href="privacy-policy.html" class="cc-link">Privacy Policy</a></p>
        </div>
        <div class="cc-banner-actions">
          <button id="cc-manage" class="cc-btn cc-btn-ghost" aria-label="Manage cookie preferences">Manage Preferences</button>
          <button id="cc-reject" class="cc-btn cc-btn-outline" aria-label="Reject non-essential cookies">Reject All</button>
          <button id="cc-accept" class="cc-btn cc-btn-primary" aria-label="Accept all cookies">Accept All</button>
        </div>
      </div>`;
    return el;
  }

  // ─── MODAL HTML ───────────────────────────────────────────
  function buildModal(current) {
    const el = document.createElement('div');
    el.id = 'cc-modal-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cookie preferences');
    el.setAttribute('aria-modal', 'true');

    const analytics = current?.analytics ?? false;
    const marketing = current?.marketing ?? false;

    el.innerHTML = `
      <div class="cc-modal" role="document">
        <div class="cc-modal-header">
          <div class="cc-modal-title">
            <span class="cc-modal-icon" aria-hidden="true">🍪</span>
            Cookie Preferences
          </div>
          <button id="cc-modal-close" class="cc-modal-close" aria-label="Close preferences">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="cc-modal-body">
          <p class="cc-modal-intro">Choose which cookies you allow. You can update your preferences at any time using the Cookie Settings button.</p>

          <!-- Necessary -->
          <div class="cc-category">
            <div class="cc-category-header">
              <div class="cc-category-info">
                <div class="cc-category-name">
                  <span class="cc-badge cc-badge-required">Required</span>
                  Necessary Cookies
                </div>
                <p class="cc-category-desc">Essential for the website to function. Cannot be disabled — they handle security, navigation, and core features.</p>
              </div>
              <div class="cc-toggle cc-toggle-disabled" aria-label="Necessary cookies always enabled">
                <div class="cc-toggle-track cc-track-on">
                  <div class="cc-toggle-thumb"></div>
                </div>
                <span class="cc-toggle-label">Always on</span>
              </div>
            </div>
          </div>

          <!-- Analytics -->
          <div class="cc-category">
            <div class="cc-category-header">
              <div class="cc-category-info">
                <div class="cc-category-name">
                  <span class="cc-badge cc-badge-optional">Optional</span>
                  Analytics Cookies
                </div>
                <p class="cc-category-desc">Help us understand how visitors use the site — page views, traffic sources, and behaviour patterns. Used to improve content.</p>
                <div class="cc-examples">Examples: Google Analytics, Mixpanel</div>
              </div>
              <label class="cc-toggle" aria-label="Toggle analytics cookies">
                <input type="checkbox" id="cc-analytics-toggle" class="cc-toggle-input" ${analytics ? 'checked' : ''}>
                <div class="cc-toggle-track">
                  <div class="cc-toggle-thumb"></div>
                </div>
                <span class="cc-toggle-label" id="cc-analytics-label">${analytics ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>
          </div>

          <!-- Marketing -->
          <div class="cc-category">
            <div class="cc-category-header">
              <div class="cc-category-info">
                <div class="cc-category-name">
                  <span class="cc-badge cc-badge-optional">Optional</span>
                  Marketing Cookies
                </div>
                <p class="cc-category-desc">Used to deliver relevant ads and track campaign performance. May share data with advertising partners.</p>
                <div class="cc-examples">Examples: Facebook Pixel, Google Ads</div>
              </div>
              <label class="cc-toggle" aria-label="Toggle marketing cookies">
                <input type="checkbox" id="cc-marketing-toggle" class="cc-toggle-input" ${marketing ? 'checked' : ''}>
                <div class="cc-toggle-track">
                  <div class="cc-toggle-thumb"></div>
                </div>
                <span class="cc-toggle-label" id="cc-marketing-label">${marketing ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="cc-modal-footer">
          <button id="cc-save-prefs" class="cc-btn cc-btn-primary">Save My Preferences</button>
          <button id="cc-accept-all-modal" class="cc-btn cc-btn-outline">Accept All</button>
        </div>
      </div>`;
    return el;
  }

  // ─── FLOATING SETTINGS BUTTON ─────────────────────────────
  function buildFloatingBtn() { return null; }

  // ─── BANNER SHOW / HIDE ───────────────────────────────────
  function showBanner(banner) {
    document.body.appendChild(banner);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => banner.classList.add('cc-visible'));
    });
  }

  function hideBanner(banner) {
    banner.classList.remove('cc-visible');
    banner.classList.add('cc-hiding');
    setTimeout(() => banner.remove(), CONFIG.animDuration);
  }

  // ─── MODAL SHOW / HIDE ────────────────────────────────────
  function showModal(current) {
    const overlay = buildModal(current);
    document.body.appendChild(overlay);
    document.body.classList.add('cc-modal-open');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('cc-visible'));
    });

    // Update labels on toggle
    ['analytics', 'marketing'].forEach(cat => {
      const toggle = document.getElementById(`cc-${cat}-toggle`);
      const label = document.getElementById(`cc-${cat}-label`);
      if (toggle && label) {
        toggle.addEventListener('change', () => {
          label.textContent = toggle.checked ? 'Enabled' : 'Disabled';
          toggle.closest('.cc-toggle-track') && updateTrack(toggle);
        });
        // Sync track state on load
        updateTrack(toggle);
      }
    });

    // Close modal
    document.getElementById('cc-modal-close')?.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', handleModalKey);

    // Save
    document.getElementById('cc-save-prefs')?.addEventListener('click', () => {
      const p = {
        necessary: true,
        analytics: document.getElementById('cc-analytics-toggle')?.checked || false,
        marketing: document.getElementById('cc-marketing-toggle')?.checked || false
      };
      savePrefs(p);
      applyConsent(p);
      closeModal();
      showFloatingBtn();
    });

    // Accept all from modal
    document.getElementById('cc-accept-all-modal')?.addEventListener('click', () => {
      const p = { necessary: true, analytics: true, marketing: true };
      savePrefs(p);
      applyConsent(p);
      closeModal();
      showFloatingBtn();
    });
  }

  function updateTrack(toggle) {
    const track = toggle.closest('label')?.querySelector('.cc-toggle-track');
    if (track) {
      track.classList.toggle('cc-track-on', toggle.checked);
    }
  }

  function closeModal() {
    const overlay = document.getElementById('cc-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('cc-visible');
    document.body.classList.remove('cc-modal-open');
    document.removeEventListener('keydown', handleModalKey);
    setTimeout(() => overlay.remove(), CONFIG.animDuration);
  }

  function handleModalKey(e) {
    if (e.key === 'Escape') closeModal();
  }

  // ─── FLOATING BUTTON ──────────────────────────────────────
  let floatingBtn = null;

  function showFloatingBtn() {
    // Floating button hidden — user can re-open via footer link
    return;
  });
    floatingBtn.addEventListener('click', () => {
      showModal(loadPrefs());
    });
  }

  // ─── INIT ─────────────────────────────────────────────────
  function init() {
    prefs = loadPrefs();

    if (prefs) {
      // User already consented — apply scripts silently
      applyConsent(prefs);
      showFloatingBtn();
      return;
    }

    // Show banner after delay
    setTimeout(() => {
      const banner = buildBanner();
      showBanner(banner);

      // Accept All
      document.getElementById('cc-accept')?.addEventListener('click', () => {
        const p = { necessary: true, analytics: true, marketing: true };
        savePrefs(p);
        applyConsent(p);
        hideBanner(banner);
        showFloatingBtn();
      });

      // Reject All
      document.getElementById('cc-reject')?.addEventListener('click', () => {
        const p = { necessary: true, analytics: false, marketing: false };
        savePrefs(p);
        hideBanner(banner);
        showFloatingBtn();
      });

      // Manage Preferences
      document.getElementById('cc-manage')?.addEventListener('click', () => {
        showModal(null);
        // Save from modal will hide banner too
        const observer = new MutationObserver(() => {
          if (!document.getElementById('cc-modal-overlay')) {
            if (loadPrefs()) hideBanner(banner);
            observer.disconnect();
          }
        });
        observer.observe(document.body, { childList: true });
      });

    }, CONFIG.bannerDelay);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── PUBLIC API ───────────────────────────────────────────
  window.CookieConsent = {
    getPrefs: () => loadPrefs(),
    openSettings: () => showModal(loadPrefs()),
    reset: () => {
      try { localStorage.removeItem(CONFIG.storageKey); } catch (e) {}
      document.getElementById('cc-settings-btn')?.remove();
      init();
    }
  };

})();
