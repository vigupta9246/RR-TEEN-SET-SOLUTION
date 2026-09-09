/**
 * R.R Teen Set Solution — AI Chat Widget
 * ─────────────────────────────────────────────────────────────
 * Loaded on every marketing page (same pattern as site-tracker.js).
 * Renders a floating chat button (stacked above the WhatsApp button),
 * and talks to the Cloudflare Worker proxy — never calls Gemini
 * directly, so no API key is ever exposed in this file or the browser.
 *
 * NOTE: show/hide is done via direct .style.display (not a CSS class)
 * so it can never silently fail if some page doesn't define a given
 * utility class — this was the cause of a bug where the panel showed
 * open by default on every page.
 */

const WORKER_URL = 'https://rrts-chatbot.vikashlogistics00.workers.dev';

(function () {
  const WELCOME_MSG = "Namaste! 👋 Main R.R Teen Set Solution ka AI assistant hoon. Tin shed, industrial shed, PEB structure ya prefab warehouse ke baare mein kuch bhi pooch sakte hain.";

  let history = []; // {role:'user'|'model', text:string}
  let isOpen = false;
  let isSending = false;

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function buildUI() {
    const btn = el(`
      <button id="chatbot-fab" aria-label="Chat with us" title="Chat with us">
        <svg viewBox="0 0 24 24" fill="none" id="chatbot-icon-chat">
          <path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8c-1.1 0-2.2-.2-3.1-.6L4 21l1.7-4.8C4.6 14.9 4 13.5 4 12z" fill="white"/>
          <circle cx="8.5" cy="12" r="1.15" fill="#1565c0"/>
          <circle cx="12" cy="12" r="1.15" fill="#1565c0"/>
          <circle cx="15.5" cy="12" r="1.15" fill="#1565c0"/>
        </svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" id="chatbot-icon-close">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        <span id="chatbot-ai-badge">AI</span>
      </button>
    `);
    const panel = el(`
      <div id="chatbot-panel">
        <div id="chatbot-header">
          <div id="chatbot-header-title">
            <div id="chatbot-avatar"><img src="images/rr-logo-original.png" alt="R.R Teen Set Solution"></div>
            <div>
              <div id="chatbot-name">R.R Teen Set Assistant</div>
              <div id="chatbot-status"><span class="chatbot-dot"></span>AI Assistant · Online</div>
            </div>
          </div>
          <button id="chatbot-close-btn" aria-label="Close chat">✕</button>
        </div>
        <div id="chatbot-messages"></div>
        <div id="chatbot-typing"><span></span><span></span><span></span></div>
        <div id="chatbot-input-row">
          <input type="text" id="chatbot-input" placeholder="Apna sawal likhein..." maxlength="500">
          <button id="chatbot-send-btn" aria-label="Send">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
          </button>
        </div>
        <div id="chatbot-footer">AI se baat ho rahi hai — pakka jawab chahiye? <a href="https://api.whatsapp.com/send?phone=918527258462" target="_blank" rel="noopener">WhatsApp karein →</a></div>
      </div>
    `);
    document.body.appendChild(btn);
    document.body.appendChild(panel);

    // Explicit initial state, set directly via JS (not CSS classes) so
    // there is zero chance of the panel appearing open by accident.
    panel.style.display = 'none';
    document.getElementById('chatbot-icon-close').style.display = 'none';
    document.getElementById('chatbot-typing').style.display = 'none';
  }

  function positionFab() {
    const fab = document.getElementById('chatbot-fab');
    const panel = document.getElementById('chatbot-panel');
    if (!fab) return;

    // Different pages use different floating-button systems: most use a
    // single .wa-float button, but some (homepage, calculator) use a
    // custom .fab-wrap with a stacked Call + WhatsApp pair. Detecting
    // the actual element at runtime (instead of guessing a fixed pixel
    // value) means this keeps working correctly regardless of which
    // system a given page uses, or if either one's size/position ever
    // changes.
    const existing = document.querySelector('.fab-wrap') || document.querySelector('.wa-float');
    let bottomPx = 90; // sensible fallback if neither is found
    if (existing) {
      const rect = existing.getBoundingClientRect();
      const gap = 14;
      bottomPx = Math.round(window.innerHeight - rect.top + gap);
    }
    fab.style.bottom = bottomPx + 'px';
    if (panel) panel.style.bottom = (bottomPx + 68) + 'px';
  }

  function addMessage(role, text) {
    const messagesEl = document.getElementById('chatbot-messages');
    const bubble = el(`<div class="chatbot-msg chatbot-msg-${role === 'user' ? 'user' : 'bot'}">${esc(text)}</div>`);
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setTyping(show) {
    document.getElementById('chatbot-typing').style.display = show ? 'flex' : 'none';
    if (show) {
      const messagesEl = document.getElementById('chatbot-messages');
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  async function sendMessage(text) {
    if (!text.trim() || isSending) return;
    isSending = true;
    addMessage('user', text);
    history.push({ role: 'user', text });
    document.getElementById('chatbot-input').value = '';
    setTyping(true);

    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(0, -1) })
      });
      const data = await res.json();
      setTyping(false);
      const reply = data.reply || data.error || "Sorry, kuch gadbad ho gayi. WhatsApp pe try karein.";
      addMessage('model', reply);
      history.push({ role: 'model', text: reply });
    } catch (err) {
      setTyping(false);
      addMessage('model', "Connection mein dikkat aa rahi hai. Please WhatsApp karein: +91 85272 58462");
    } finally {
      isSending = false;
    }
  }

  function toggleChat() {
    isOpen = !isOpen;
    document.getElementById('chatbot-panel').style.display = isOpen ? 'flex' : 'none';
    document.getElementById('chatbot-icon-chat').style.display = isOpen ? 'none' : '';
    document.getElementById('chatbot-icon-close').style.display = isOpen ? '' : 'none';
    document.getElementById('chatbot-ai-badge').style.display = isOpen ? 'none' : '';
    if (isOpen && history.length === 0) {
      addMessage('model', WELCOME_MSG);
    }
    if (isOpen) document.getElementById('chatbot-input').focus();
  }

  function init() {
    if (WORKER_URL.includes('YOUR-SUBDOMAIN')) {
      console.warn('[chatbot-widget] WORKER_URL not configured yet — chat widget hidden.');
      return; // don't show a broken widget in production
    }
    buildUI();
    positionFab();
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(positionFab, 150);
    });
    document.getElementById('chatbot-fab').addEventListener('click', toggleChat);
    document.getElementById('chatbot-close-btn').addEventListener('click', toggleChat);
    document.getElementById('chatbot-send-btn').addEventListener('click', () => {
      sendMessage(document.getElementById('chatbot-input').value);
    });
    document.getElementById('chatbot-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage(document.getElementById('chatbot-input').value);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
