/* R.R Teen Set Solution — main.js v3.0 */
'use strict';

// ── YOUTUBE CHANNEL LINK ────────────────────────
// Add YouTube icon to footer and nav wherever needed
document.addEventListener('DOMContentLoaded', function(){
  var ytUrl = 'https://youtube.com/@subhashgupta6957';
  var ytBtn = '<a href="' + ytUrl + '" target="_blank" rel="noopener" title="R.R Teen Set Solution YouTube Channel" style="display:inline-flex;align-items:center;gap:8px;background:#ff0000;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;transition:all .3s" onmouseover=\'this.style.background=\"#cc0000\";this.style.transform=\"translateY(-2px)\"\' onmouseout=\'this.style.background=\"#ff0000\";this.style.transform=\"\"\'><svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"white\"><path d=\"M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z\"/></svg>YouTube Channel</a>';

  // Add to footer-contact section
  var footerContact = document.querySelector('.footer-contact');
  if(footerContact){
    var ytDiv = document.createElement('p');
    ytDiv.innerHTML = '<span>▶️</span> <a href="' + ytUrl + '" target="_blank" rel="noopener" style="color:#ff4444">YouTube Channel</a>';
    footerContact.appendChild(ytDiv);
  }

  // Add YouTube button in contact page info section
  var cinfoItems = document.querySelectorAll('.cinfo-item');
  if(cinfoItems.length > 3){
    var ytItem = document.createElement('div');
    ytItem.className = 'cinfo-item';
    ytItem.innerHTML = '<div class="cinfo-icon">▶️</div><div><div class="cinfo-label">YouTube</div><div class="cinfo-value"><a href="' + ytUrl + '" target="_blank" rel="noopener" style="color:#ff4444">@subhashgupta6957</a></div></div>';
    cinfoItems[cinfoItems.length-1].parentNode.insertBefore(ytItem, cinfoItems[cinfoItems.length-1].nextSibling);
  }
});


// ── LOGO CLICK → HOME PAGE ──────────────────────
document.querySelectorAll('.logo').forEach(function(logo){
  logo.addEventListener('click', function(){
    window.location.href = 'index.html';
  });
});


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
