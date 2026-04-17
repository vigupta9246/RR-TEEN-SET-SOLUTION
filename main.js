/* ═══════════════════════════════════════════════════════════
   R.R Teen Set Solution — main.js v4.0
   Dark Mode + Ultra Fast Chat + Mobile Nav + Social Icons
═══════════════════════════════════════════════════════════ */
'use strict';

/* ════════════════════════════════════════════════════════════
   1. DARK MODE — system preference + localStorage + toggle
════════════════════════════════════════════════════════════ */
(function () {
  var STORE = 'rr_theme';

  function getTheme() {
    var saved = localStorage.getItem(STORE);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(STORE, t);
    var btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
  }

  // Apply immediately to avoid flash
  applyTheme(getTheme());

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getTheme()); // re-apply after DOM ready

    var btn = document.getElementById('theme-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme') || 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    }
  });
})();

/* ════════════════════════════════════════════════════════════
   2. LOGO CLICK → HOME PAGE
════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.logo').forEach(function (el) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', function () {
      window.location.href = 'index.html';
    });
  });
});

/* ════════════════════════════════════════════════════════════
   3. MOBILE MENU
════════════════════════════════════════════════════════════ */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var ham = document.querySelector('.hamburger');
    var mob = document.getElementById('mob-menu');
    if (!ham || !mob) return;

    function close() {
      ham.classList.remove('open');
      mob.classList.remove('open');
      document.body.style.overflow = '';
    }

    ham.addEventListener('click', function (e) {
      e.stopPropagation();
      var opening = !ham.classList.contains('open');
      ham.classList.toggle('open');
      mob.classList.toggle('open');
      document.body.style.overflow = opening ? 'hidden' : '';
    });

    mob.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });

    document.addEventListener('click', function (e) {
      if (!ham.contains(e.target) && !mob.contains(e.target)) close();
    });
  });
})();

/* ════════════════════════════════════════════════════════════
   4. NAV — scroll shadow + active link
════════════════════════════════════════════════════════════ */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var nav = document.querySelector('nav');
    if (!nav) return;

    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });

    var page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, #mob-menu a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('/').pop();
      if (href === page || (page === '' && href === 'index.html')) {
        a.classList.add('active');
      }
    });
  });
})();

/* ════════════════════════════════════════════════════════════
   5. SCROLL ANIMATION — IntersectionObserver
════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.scard,.wcard,.tcard,.pstep,.gallery-item').forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    io.observe(el);
  });
});

/* ════════════════════════════════════════════════════════════
   6. ENQUIRY FORM → WhatsApp
════════════════════════════════════════════════════════════ */
window.handleEnquiry = function (e) {
  e.preventDefault();
  var f = e.target;
  var get = function (n) { return (f.querySelector('[name="' + n + '"]') || {}).value || ''; };
  var name  = get('name').trim();
  var phone = get('phone').trim();
  var svc   = get('service') || 'General Enquiry';
  var area  = get('area');
  var city  = get('city');
  var msg   = get('message');

  function setErr(field, txt) {
    var inp = f.querySelector('[name="' + field + '"]');
    if (!inp) return;
    inp.style.borderColor = '#f44336';
    inp.focus();
    var err = inp.parentNode.querySelector('.err-msg');
    if (!err) {
      err = document.createElement('span');
      err.className = 'err-msg';
      err.style.cssText = 'font-size:11px;color:#f44336;margin-top:3px;display:block';
      inp.parentNode.appendChild(err);
    }
    err.textContent = txt;
    setTimeout(function () { inp.style.borderColor = ''; err.textContent = ''; }, 3000);
  }

  if (!name)  { setErr('name', 'Please enter your name'); return; }
  if (!phone || phone.replace(/\D/g, '').length < 10) { setErr('phone', 'Enter valid 10-digit number'); return; }

  var lines = [
    'Hello R.R Teen Set Solution! \uD83C\uDFD7\uFE0F',
    '',
    '*New Website Enquiry*',
    '\u2500'.repeat(20),
    'Name: '    + name,
    'Phone: '   + phone,
    'Service: ' + svc,
    area  ? 'Area: '    + area  : '',
    city  ? 'City: '    + city  : '',
    msg   ? 'Message: ' + msg   : '',
    '',
    'Please call me. Thank you!'
  ].filter(Boolean).join('\n');

  var btn = f.querySelector('button[type="submit"]');
  var orig = btn.textContent;
  btn.textContent = 'Opening WhatsApp\u2026';
  btn.disabled = true;
  btn.style.background = '#25D366';

  setTimeout(function () {
    window.open('https://api.whatsapp.com/send?phone=918527258462&text=' + encodeURIComponent(lines), '_blank');
    btn.textContent = '\u2705 Sent! We will call you soon.';
    f.reset();
    setTimeout(function () {
      btn.textContent = orig;
      btn.disabled = false;
      btn.style.background = '';
    }, 3500);
  }, 400);
};

/* ════════════════════════════════════════════════════════════
   7. SOCIAL MEDIA ICONS (YouTube, Facebook, Instagram)
════════════════════════════════════════════════════════════ */
(function () {
  var SOCIAL = {
    youtube:   'https://youtube.com/@subhashgupta6957',
    facebook:  '#',
    instagram: '#'
  };
  var YT = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>';
  var FB = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>';
  var IG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>';

  function mkIcons() {
    return '<div class="social-icons">' +
      '<a href="' + SOCIAL.youtube   + '" target="_blank" rel="noopener" aria-label="YouTube"   class="social-btn yt">' + YT + '</a>' +
      '<a href="' + SOCIAL.facebook  + '" target="_blank" rel="noopener" aria-label="Facebook"  class="social-btn fb">' + FB + '</a>' +
      '<a href="' + SOCIAL.instagram + '" target="_blank" rel="noopener" aria-label="Instagram" class="social-btn ig">' + IG + '</a>' +
    '</div>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var fa = document.querySelector('.footer-about');
    if (fa) { var d = document.createElement('div'); d.innerHTML = mkIcons(); fa.appendChild(d); }

    var last = document.querySelector('.cinfo-item:last-of-type');
    if (last) {
      var item = document.createElement('div');
      item.className = 'cinfo-item';
      item.innerHTML = '<div class="cinfo-icon">📱</div><div><div class="cinfo-label">Follow Us</div>' + mkIcons() + '</div>';
      last.after(item);
    }
  });
})();

/* ════════════════════════════════════════════════════════════
   8. AI CHAT WIDGET — Ultra Fast WhatsApp-style
   Uses claude-sonnet-4-20250514 via Anthropic Messages API
════════════════════════════════════════════════════════════ */
(function () {
  var WA      = 'https://api.whatsapp.com/send?phone=918527258462';
  var PHONE   = 'tel:+918527258462';
  var CONTACT = 'contact.html';
  var SYS = 'You are an AI assistant for R.R Teen Set Solution — a tin shed and steel structure fabrication company in New Delhi. Services: Tin Shed, Industrial Shed, Prefab Warehouse, PEB Structure, Steel Fabrication. Location: Delhi NCR (Delhi, Noida, Gurgaon, Faridabad, Ghaziabad). Phone: +91 85272 58462. Owner: Subhash Kumar. Price starts ₹180/sq.ft. GST: 07DJCPK0635M1Z5. Rating: 5.0 IndiaMART. 500+ projects. 8+ years.\n\nRules:\n- Keep replies under 50 words\n- Mix Hindi naturally if user writes Hindi\n- Never give fixed price — say depends on size/type\n- Guide toward call/WhatsApp/enquiry\n- Offer free site visit\n- Be warm and confident, not robotic';

  var hist    = [];
  var isOpen  = false;
  var opened  = false;
  var busy    = false;

  // Build widget HTML
  var WIDGET_HTML = '<button id="chat-trigger" aria-label="Chat"><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg><div id="chat-notif">1</div></button><div id="chat-win"><div class="ch"><div class="ch-av">RR</div><div class="ch-inf"><div class="ch-name">R.R Teen Set Solution</div><div class="ch-status"><div class="ch-online"></div>AI Assistant · Instant replies</div></div><button class="ch-close" id="ch-close">✕</button></div><div id="ch-msgs"></div><div class="ch-qr" id="ch-qr"></div><div class="ch-inp"><textarea id="ch-input" placeholder="Type your question..." rows="1"></textarea><button id="ch-send"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button></div></div>';

  document.addEventListener('DOMContentLoaded', function () {
    // Inject widget
    var wrap = document.createElement('div');
    wrap.innerHTML = WIDGET_HTML;
    document.body.appendChild(wrap);

    var trig  = document.getElementById('chat-trigger');
    var win   = document.getElementById('chat-win');
    var close = document.getElementById('ch-close');
    var msgs  = document.getElementById('ch-msgs');
    var qrDiv = document.getElementById('ch-qr');
    var inp   = document.getElementById('ch-input');
    var snd   = document.getElementById('ch-send');
    var notif = document.getElementById('chat-notif');

    // Toggle
    function toggle() {
      isOpen = !isOpen;
      win.classList.toggle('open', isOpen);
      if (isOpen) {
        if (notif) notif.style.display = 'none';
        if (!opened) { opened = true; welcome(); }
        setTimeout(function () { inp.focus(); }, 350);
      }
    }

    trig.addEventListener('click', toggle);
    close.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });

    // Welcome message
    function welcome() {
      botMsg('Namaste! 👋 Welcome to **R.R Teen Set Solution**.\n\nMain aapka AI assistant hoon. Shed ya steel structure ke baare mein kuch bhi poochh sakte hain!', [
        'Tin Shed Price?', 'Industrial Shed', 'Free Site Visit', 'WhatsApp Karo'
      ]);
    }

    // Utilities
    function now() { return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
    function fmt(t) {
      return t
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    }
    function scrollBottom() { msgs.scrollTop = msgs.scrollHeight; }

    // Add bot message with optional quick replies
    function botMsg(text, qrs) {
      var d = document.createElement('div');
      d.className = 'cmsg bot';
      d.innerHTML = '<div class="cmsg-av">RR</div><div><div class="cmsg-b">' + fmt(text) + '</div><span class="cmsg-t">' + now() + '</span></div>';
      msgs.appendChild(d);
      scrollBottom();
      setQR(qrs);
    }

    // Add user message
    function usrMsg(text) {
      setQR([]);
      var d = document.createElement('div');
      d.className = 'cmsg usr';
      d.innerHTML = '<div><div class="cmsg-b">' + fmt(text) + '</div><span class="cmsg-t">' + now() + '</span></div>';
      msgs.appendChild(d);
      scrollBottom();
    }

    // Typing indicator
    function showTyping() {
      var d = document.createElement('div');
      d.id = 'ch-typing-el';
      d.className = 'ch-typing';
      d.innerHTML = '<div class="ch-dot2"></div><div class="ch-dot2"></div><div class="ch-dot2"></div>';
      msgs.appendChild(d);
      scrollBottom();
    }
    function hideTyping() { var t = document.getElementById('ch-typing-el'); if (t) t.remove(); }

    // CTA buttons
    function showCTA() {
      var d = document.createElement('div');
      d.className = 'cmsg bot';
      d.innerHTML = '<div class="cmsg-av">RR</div><div style="width:100%"><div class="cta-btns">' +
        '<a href="' + PHONE + '" class="cta-btn call">📞 Call Subhash Kumar</a>' +
        '<a href="' + WA + '&text=' + encodeURIComponent('Hello! Shed enquiry karna tha.') + '" target="_blank" class="cta-btn wa">💬 WhatsApp Now</a>' +
        '<a href="' + CONTACT + '" class="cta-btn form">📋 Fill Enquiry Form</a>' +
      '</div></div>';
      msgs.appendChild(d);
      scrollBottom();
    }

    // Quick replies
    function setQR(qrs) {
      qrDiv.innerHTML = '';
      if (!qrs || !qrs.length) return;
      qrs.forEach(function (q) {
        var b = document.createElement('button');
        b.className = 'ch-qrb';
        b.textContent = q;
        b.onclick = function () { send(q); };
        qrDiv.appendChild(b);
      });
    }

    // SEND MESSAGE — Optimistic UI (instant feel)
    function send(text) {
      text = (text || inp.value).trim();
      if (!text || busy) return;
      inp.value = '';
      inp.style.height = 'auto';
      snd.disabled = true;

      // Show user message INSTANTLY (optimistic)
      usrMsg(text);
      hist.push({ role: 'user', content: text });

      var lower = text.toLowerCase();
      var ctaKeys = ['whatsapp', 'call', 'contact', 'number', 'visit', 'quote', 'enquiry'];
      var wantCTA = ctaKeys.some(function (k) { return lower.includes(k); });

      busy = true;
      showTyping();

      // API call
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 150,
          system: SYS,
          messages: hist
        })
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        hideTyping();
        busy = false;
        snd.disabled = false;

        var reply = (data.content && data.content[0] && data.content[0].text)
          ? data.content[0].text
          : 'Koi technical issue aa gaya. Please call karein: +91 85272 58462';

        hist.push({ role: 'assistant', content: reply });

        var lr = reply.toLowerCase();
        var qrs = [];
        if (lr.includes('price') || lr.includes('rate') || lr.includes('cost')) {
          qrs = ['Share Requirement', 'WhatsApp Karo', 'Call Now'];
        } else if (lr.includes('visit') || lr.includes('site')) {
          qrs = ['Book Free Visit', 'WhatsApp Karo', 'Call Now'];
        } else {
          qrs = ['Price Puchna Hai', 'Free Site Visit', 'WhatsApp Karo'];
        }

        botMsg(reply, qrs);

        if (wantCTA || lr.includes('call') || lr.includes('whatsapp')) {
          setTimeout(showCTA, 400);
        }
      })
      .catch(function (err) {
        hideTyping();
        busy = false;
        snd.disabled = false;
        console.error('Chat error:', err);
        botMsg('Network issue aa gaya. \n\n📞 Direct call karein: +91 85272 58462', ['WhatsApp Karo', 'Call Now']);
        setTimeout(showCTA, 400);
      });
    }

    // Input events
    snd.addEventListener('click', function () { send(); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    inp.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 70) + 'px';
    });

    // Quick reply special handlers
    document.addEventListener('click', function (e) {
      if (!e.target.classList.contains('ch-qrb')) return;
      var txt = e.target.textContent;
      if (txt === 'WhatsApp Karo') {
        window.open(WA + '&text=' + encodeURIComponent('Hello! Shed enquiry karna tha.'), '_blank');
        return;
      }
      if (txt === 'Call Now') { window.location.href = PHONE; return; }
    });

    // Auto-open after 10 seconds
    setTimeout(function () {
      if (!isOpen && !opened) toggle();
    }, 10000);
  });
})();
