/* R.R Teen Set Solution — main.js v3.0 */
'use strict';

// ── LOGO CLICK → HOME PAGE ──────────────────────
document.querySelectorAll('.logo').forEach(function(logo){
  logo.style.cursor = 'pointer';
  logo.addEventListener('click', function(){
    window.location.href = 'index.html';
  });
});


// ── MOBILE LAYOUT FIX ───────────────────────────
(function(){
  var mobileStyle = document.createElement('style');
  mobileStyle.textContent = [
    /* Hero buttons — stack properly on mobile */
    '@media(max-width:768px){',
      /* Fix hero section top gap */
      '#home,section:first-of-type{padding-top:80px!important;min-height:auto!important}',
      /* Badge text wrap fix */
      '#home div[style*="inline-flex"]{font-size:9px!important;padding:5px 10px!important;flex-wrap:wrap!important;gap:4px!important}',
      /* Buttons — full width stacked */
      '.flex-gap{flex-direction:column!important;gap:10px!important}',
      '.flex-gap .btn,.flex-gap a{width:100%!important;justify-content:center!important;text-align:center!important}',
      /* Fix 3 buttons not aligning */
      '#home .flex-gap{display:flex!important;flex-direction:column!important}',
      /* Hero title size */
      '#home h1{font-size:44px!important;letter-spacing:1px!important}',
      /* Hero paragraph */
      '#home p{font-size:14px!important}',
      /* Hide ghost image on mobile */
      '#home>div[style*="absolute"]{display:none!important}',
    '}',
    '@media(max-width:480px){',
      '#home h1{font-size:38px!important}',
    '}',
  ].join('');
  document.head.appendChild(mobileStyle);
})();


// ── SOCIAL MEDIA ICONS ──────────────────────────
var SOCIAL = {
  youtube:   'https://youtube.com/@subhashgupta6957',
  facebook:  '#',
  instagram: '#'
};

(function(){
  // CSS for social buttons
  var style = document.createElement('style');
  style.textContent =
    '.social-icons{display:flex;gap:10px;margin-top:14px}' +
    '.social-btn{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:all .3s;flex-shrink:0;text-decoration:none}' +
    '.social-btn svg{width:18px;height:18px}' +
    '.social-btn.yt{background:#ff0000;color:#fff}' +
    '.social-btn.yt:hover{background:#cc0000;transform:translateY(-2px)}' +
    '.social-btn.fb{background:#1877f2;color:#fff}' +
    '.social-btn.fb:hover{background:#0d6efd;transform:translateY(-2px)}' +
    '.social-btn.ig{background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);color:#fff}' +
    '.social-btn.ig:hover{opacity:.85;transform:translateY(-2px)}';
  document.head.appendChild(style);

  var YT_SVG  = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>';
  var FB_SVG  = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>';
  var IG_SVG  = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>';

  function makeSocialIcons(){
    return '<div class="social-icons">' +
      '<a href="' + SOCIAL.youtube   + '" target="_blank" rel="noopener" aria-label="YouTube"   class="social-btn yt">' + YT_SVG + '</a>' +
      '<a href="' + SOCIAL.facebook  + '" target="_blank" rel="noopener" aria-label="Facebook"  class="social-btn fb">' + FB_SVG + '</a>' +
      '<a href="' + SOCIAL.instagram + '" target="_blank" rel="noopener" aria-label="Instagram" class="social-btn ig">' + IG_SVG + '</a>' +
    '</div>';
  }

  document.addEventListener('DOMContentLoaded', function(){
    // Footer about section
    var footerAbout = document.querySelector('.footer-about');
    if(footerAbout){
      var d = document.createElement('div');
      d.innerHTML = makeSocialIcons();
      footerAbout.appendChild(d);
    }
    // Contact page
    var lastCinfo = document.querySelector('.cinfo-item:last-of-type');
    if(lastCinfo){
      var item = document.createElement('div');
      item.className = 'cinfo-item';
      item.innerHTML = '<div class="cinfo-icon">📱</div><div><div class="cinfo-label">Follow Us</div>' + makeSocialIcons() + '</div>';
      lastCinfo.after(item);
    }
  });
})();


// ── MOBILE MENU ─────────────────────────────────
(function(){
  var ham = document.querySelector('.hamburger');
  var mob = document.getElementById('mob-menu');
  if(!ham || !mob) return;

  ham.addEventListener('click', function(e){
    e.stopPropagation();
    this.classList.toggle('open');
    mob.classList.toggle('open');
    document.body.style.overflow = mob.classList.contains('open') ? 'hidden' : '';
  });

  mob.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      ham.classList.remove('open');
      mob.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  document.addEventListener('click', function(e){
    if(!ham.contains(e.target) && !mob.contains(e.target)){
      ham.classList.remove('open');
      mob.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
})();

// ── ACTIVE NAV LINK ─────────────────────────────
(function(){
  var page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, #mob-menu a').forEach(function(a){
    var href = a.getAttribute('href') || '';
    if(href === page || (page === '' && href === 'index.html')){
      a.classList.add('active');
    }
  });
})();

// ── SCROLL: NAV SHADOW ──────────────────────────
window.addEventListener('scroll', function(){
  var nav = document.querySelector('nav');
  if(nav) nav.style.boxShadow = window.scrollY > 30 ? '0 4px 24px rgba(0,0,0,.35)' : 'none';
}, {passive:true});

// ── INTERSECTION OBSERVER ───────────────────────
if('IntersectionObserver' in window){
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        io.unobserve(entry.target);
      }
    });
  }, {threshold:0.08, rootMargin:'0px 0px -30px 0px'});

  document.querySelectorAll('.scard,.wcard,.tcard,.pstep,.gallery-item,.feat-animate').forEach(function(el){
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    io.observe(el);
  });
}

// ── CONTACT FORM HANDLER ────────────────────────
window.handleEnquiry = function(e){
  e.preventDefault();
  var f = e.target;
  var name  = (f.querySelector('[name="name"]')  || {}).value || '';
  var phone = (f.querySelector('[name="phone"]') || {}).value || '';
  var svc   = (f.querySelector('[name="service"]')|| {}).value || 'General Enquiry';
  var city  = (f.querySelector('[name="city"]')  || {}).value || '';
  var msg_t = (f.querySelector('[name="message"]')|| {}).value || '';
  var area  = (f.querySelector('[name="area"]')  || {}).value || '';

  name = name.trim(); phone = phone.trim();

  if(!name){ showError(f, 'name', 'Please enter your name'); return; }
  if(!phone || phone.replace(/\D/g,'').length < 10){ showError(f, 'phone', 'Please enter a valid 10-digit phone number'); return; }

  var lines = [
    'Hello R.R Teen Set Solution! \uD83C\uDFD7\uFE0F',
    '',
    '*New Website Enquiry*',
    '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500',
    'Name: ' + name,
    'Phone: ' + phone,
    'Service: ' + svc,
    area  ? 'Area/Size: ' + area  : '',
    city  ? 'City: '     + city  : '',
    msg_t ? 'Message: '  + msg_t : '',
    '',
    'Please call me. Thank you!'
  ].filter(Boolean).join('\n');

  var btn = f.querySelector('button[type="submit"]');
  var orig = btn.textContent;
  btn.textContent = 'Opening WhatsApp...';
  btn.disabled = true;
  btn.style.background = '#25D366';

  setTimeout(function(){
    window.open('https://api.whatsapp.com/send?phone=918527258462&text=' + encodeURIComponent(lines), '_blank');
    btn.textContent = '\u2705 Sent! We will call you soon.';
    f.reset();
    setTimeout(function(){
      btn.textContent = orig;
      btn.disabled = false;
      btn.style.background = '';
    }, 3500);
  }, 400);
};

function showError(form, field, msg){
  var inp = form.querySelector('[name="' + field + '"]');
  if(!inp) return;
  inp.style.borderColor = '#f44336';
  inp.focus();
  var err = inp.parentNode.querySelector('.err-msg');
  if(!err){ err = document.createElement('span'); err.className = 'err-msg'; err.style.cssText = 'font-size:11px;color:#f44336;margin-top:3px'; inp.parentNode.appendChild(err); }
  err.textContent = msg;
  setTimeout(function(){ inp.style.borderColor = ''; if(err) err.textContent = ''; }, 3000);
}

// ── SMOOTH ANCHOR SCROLL ────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click', function(e){
    var t = document.querySelector(this.getAttribute('href'));
    if(t){ e.preventDefault(); t.scrollIntoView({behavior:'smooth', block:'start'}); }
  });
});
