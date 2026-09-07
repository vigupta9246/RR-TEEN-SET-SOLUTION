/**
 * R.R Teen Set Solution — AI Chat Widget
 * ─────────────────────────────────────────────────────────────
 * Loaded on every marketing page (same pattern as site-tracker.js).
 * Renders a floating chat button (stacked above the WhatsApp button),
 * and talks to the Cloudflare Worker proxy — never calls Gemini
 * directly, so no API key is ever exposed in this file or the browser.
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
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" id="chatbot-icon-chat">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" id="chatbot-icon-close" class="hidden">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `);
    const panel = el(`
      <div id="chatbot-panel" class="hidden">
        <div id="chatbot-header">
          <div id="chatbot-header-title">
            <div id="chatbot-avatar">🏗️</div>
            <div>
              <div id="chatbot-name">R.R Teen Set Assistant</div>
              <div id="chatbot-status"><span class="chatbot-dot"></span>AI Assistant · Online</div>
            </div>
          </div>
          <button id="chatbot-close-btn" aria-label="Close chat">✕</button>
        </div>
        <div id="chatbot-messages"></div>
        <div id="chatbot-typing" class="hidden"><span></span><span></span><span></span></div>
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
  }

  function addMessage(role, text) {
    const messagesEl = document.getElementById('chatbot-messages');
    const bubble = el(`<div class="chatbot-msg chatbot-msg-${role === 'user' ? 'user' : 'bot'}">${esc(text)}</div>`);
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setTyping(show) {
    document.getElementById('chatbot-typing').classList.toggle('hidden', !show);
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
    document.getElementById('chatbot-panel').classList.toggle('hidden', !isOpen);
    document.getElementById('chatbot-icon-chat').classList.toggle('hidden', isOpen);
    document.getElementById('chatbot-icon-close').classList.toggle('hidden', !isOpen);
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
