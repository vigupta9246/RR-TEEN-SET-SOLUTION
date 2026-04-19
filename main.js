/* ═══════════════════════════════════════════════════════════
   R.R Teen Set Solution — main.js v5.0
   Google Business Profile + Smart Chat (No API, Instant)
   Dark Mode + Mobile Nav + Social Icons + Forms
═══════════════════════════════════════════════════════════ */
'use strict';

/* ════════════════════════════════════════════════════════════
   1. DARK MODE
════════════════════════════════════════════════════════════ */
(function(){
  var KEY = 'rr_theme';
  function get(){ return localStorage.getItem(KEY) || (matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'); }
  function apply(t){
    document.documentElement.setAttribute('data-theme',t);
    localStorage.setItem(KEY,t);
    var b=document.getElementById('theme-btn');
    if(b) b.textContent = t==='dark'?'☀️':'🌙';
  }
  apply(get());
  document.addEventListener('DOMContentLoaded',function(){
    apply(get());
    var b=document.getElementById('theme-btn');
    if(b) b.addEventListener('click',function(){
      apply(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark');
    });
  });
})();

/* ════════════════════════════════════════════════════════════
   2. LOGO CLICK → HOME
════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.logo').forEach(function(el){
    el.style.cursor='pointer';
    el.addEventListener('click',function(){ window.location.href='index.html'; });
  });
});

/* ════════════════════════════════════════════════════════════
   3. MOBILE MENU
════════════════════════════════════════════════════════════ */
(function(){
  document.addEventListener('DOMContentLoaded',function(){
    var ham=document.querySelector('.hamburger'), mob=document.getElementById('mob-menu');
    if(!ham||!mob) return;
    function close(){ ham.classList.remove('open'); mob.classList.remove('open'); document.body.style.overflow=''; }
    ham.addEventListener('click',function(e){
      e.stopPropagation();
      var open=!ham.classList.contains('open');
      ham.classList.toggle('open'); mob.classList.toggle('open');
      document.body.style.overflow=open?'hidden':'';
    });
    mob.querySelectorAll('a').forEach(function(a){ a.addEventListener('click',close); });
    document.addEventListener('click',function(e){ if(!ham.contains(e.target)&&!mob.contains(e.target)) close(); });
  });
})();

/* ════════════════════════════════════════════════════════════
   4. NAV SCROLL + ACTIVE LINK
════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded',function(){
  var nav=document.querySelector('nav');
  if(nav) window.addEventListener('scroll',function(){ nav.classList.toggle('scrolled',scrollY>30); },{passive:true});
  var page=(location.pathname.split('/').pop()||'index.html');
  document.querySelectorAll('.nav-links a,#mob-menu a').forEach(function(a){
    if((a.getAttribute('href')||'').split('/').pop()===page) a.classList.add('active');
  });
});

/* ════════════════════════════════════════════════════════════
   5. SCROLL ANIMATIONS
════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded',function(){
  if(!('IntersectionObserver' in window)) return;
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.style.opacity='1'; e.target.style.transform='translateY(0)'; io.unobserve(e.target); }
    });
  },{threshold:0.08,rootMargin:'0px 0px -30px 0px'});
  document.querySelectorAll('.scard,.wcard,.tcard,.pstep,.gallery-item').forEach(function(el){
    el.style.opacity='0'; el.style.transform='translateY(18px)'; el.style.transition='opacity .5s ease,transform .5s ease';
    io.observe(el);
  });
});

/* ════════════════════════════════════════════════════════════
   6. ENQUIRY FORM → WHATSAPP
════════════════════════════════════════════════════════════ */
window.handleEnquiry=function(e){
  e.preventDefault();
  var f=e.target;
  function g(n){ return ((f.querySelector('[name="'+n+'"]')||{}).value||'').trim(); }
  var name=g('name'), phone=g('phone'), svc=g('service')||'General Enquiry', area=g('area'), city=g('city'), msg=g('message');
  function err(field,txt){
    var i=f.querySelector('[name="'+field+'"]'); if(!i) return;
    i.style.borderColor='#f44336'; i.focus();
    var s=i.parentNode.querySelector('.err-msg');
    if(!s){s=document.createElement('span');s.className='err-msg';s.style.cssText='font-size:11px;color:#f44336;margin-top:3px;display:block';i.parentNode.appendChild(s);}
    s.textContent=txt; setTimeout(function(){i.style.borderColor='';s.textContent='';},3000);
  }
  if(!name){err('name','Please enter your name');return;}
  if(!phone||phone.replace(/\D/g,'').length<10){err('phone','Enter valid 10-digit number');return;}
  var lines=['Hello R.R Teen Set Solution! \uD83C\uDFD7\uFE0F','','*New Website Enquiry*','\u2500'.repeat(18),'Name: '+name,'Phone: '+phone,'Service: '+svc,area?'Area: '+area:'',city?'City: '+city:'',msg?'Message: '+msg:'','','Please call me. Thank you!'].filter(Boolean).join('\n');
  var btn=f.querySelector('button[type="submit"]'), orig=btn.textContent;
  btn.textContent='Opening WhatsApp\u2026'; btn.disabled=true; btn.style.background='#25D366';
  setTimeout(function(){
    window.open('https://api.whatsapp.com/send?phone=918527258462&text='+encodeURIComponent(lines),'_blank');
    btn.textContent='\u2705 Sent! We will call you soon.'; f.reset();
    setTimeout(function(){btn.textContent=orig;btn.disabled=false;btn.style.background='';},3500);
  },400);
};

/* ════════════════════════════════════════════════════════════
   7. SOCIAL ICONS (YouTube, Facebook, Instagram)
════════════════════════════════════════════════════════════ */
(function(){
  var SOCIAL={youtube:'https://youtube.com/@subhashgupta6957',facebook:'#',instagram:'#'};
  var YT='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>';
  var FB='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>';
  var IG='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>';
  function mkIcons(){
    return '<div class="social-icons">'+
      '<a href="'+SOCIAL.youtube+'" target="_blank" rel="noopener" aria-label="YouTube" class="social-btn yt">'+YT+'</a>'+
      '<a href="'+SOCIAL.facebook+'" target="_blank" rel="noopener" aria-label="Facebook" class="social-btn fb">'+FB+'</a>'+
      '<a href="'+SOCIAL.instagram+'" target="_blank" rel="noopener" aria-label="Instagram" class="social-btn ig">'+IG+'</a>'+
    '</div>';
  }
  document.addEventListener('DOMContentLoaded',function(){
    var fa=document.querySelector('.footer-about');
    if(fa){var d=document.createElement('div');d.innerHTML=mkIcons();fa.appendChild(d);}
    var last=document.querySelector('.cinfo-item:last-of-type');
    if(last){var item=document.createElement('div');item.className='cinfo-item';item.innerHTML='<div class="cinfo-icon">\uD83D\uDCF1</div><div><div class="cinfo-label">Follow Us</div>'+mkIcons()+'</div>';last.after(item);}
  });
})();

/* ════════════════════════════════════════════════════════════
   8. GOOGLE BUSINESS PROFILE BADGE
   Adds GBP link in footer contact + contact page
════════════════════════════════════════════════════════════ */
(function(){
  var GBP_URL = 'https://share.google/UulUhMi2agMC8ODDI';
  var GBP_MAPS = 'https://maps.app.goo.gl/UulUhMi2agMC8ODDI';

  document.addEventListener('DOMContentLoaded', function(){
    // 1. Add Google Business badge in footer contact
    var footerContact = document.querySelector('.footer-contact');
    if(footerContact){
      var gbpLine = document.createElement('p');
      gbpLine.innerHTML = '<span>\u2B50</span> <a href="'+GBP_URL+'" target="_blank" rel="noopener" style="color:#4285f4;font-weight:600">View on Google Maps</a>';
      footerContact.appendChild(gbpLine);
    }

    // 2. Add GBP Review button in footer bottom
    var footerBottom = document.querySelector('.footer-bottom');
    if(footerBottom){
      var reviewBtn = document.createElement('a');
      reviewBtn.href = GBP_URL;
      reviewBtn.target = '_blank';
      reviewBtn.rel = 'noopener';
      reviewBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#4285f4" style="vertical-align:middle;margin-right:4px"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>Write a Google Review';
      reviewBtn.style.cssText = 'display:inline-flex;align-items:center;font-size:11px;color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.12);padding:5px 12px;border-radius:6px;transition:all .2s;text-decoration:none';
      reviewBtn.onmouseover = function(){ this.style.borderColor='#4285f4'; this.style.color='#4285f4'; };
      reviewBtn.onmouseout  = function(){ this.style.borderColor='rgba(255,255,255,.12)'; this.style.color='rgba(255,255,255,.5)'; };
      footerBottom.appendChild(reviewBtn);
    }

    // 3. Add GBP section on contact page
    var cinfoArea = document.querySelector('.cinfo-item');
    if(cinfoArea && location.pathname.includes('contact')){
      var gbpCard = document.createElement('div');
      gbpCard.style.cssText = 'background:rgba(66,133,244,.1);border:1px solid rgba(66,133,244,.3);border-radius:12px;padding:16px 18px;margin-top:20px;display:flex;align-items:center;gap:14px';
      gbpCard.innerHTML =
        '<div style="width:42px;height:42px;background:#4285f4;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>'+
        '</div>'+
        '<div style="flex:1">'+
          '<div style="font-size:11px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Google Business Profile</div>'+
          '<div style="color:#fff;font-weight:700;font-size:14px;margin-bottom:5px">R.R Teen Set Solution</div>'+
          '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
            '<a href="'+GBP_URL+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#4285f4;background:rgba(66,133,244,.15);padding:5px 12px;border-radius:6px;text-decoration:none">View Profile</a>'+
            '<a href="'+GBP_URL+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#fbbc04;background:rgba(251,188,4,.15);padding:5px 12px;border-radius:6px;text-decoration:none">\u2B50 Write Review</a>'+
          '</div>'+
        '</div>';
      cinfoArea.parentNode.insertBefore(gbpCard, cinfoArea.parentNode.querySelector('.cform') || cinfoArea.parentNode.lastElementChild);
    }
  });
})();

/* ════════════════════════════════════════════════════════════
   9. SMART CHAT WIDGET
   - No auto-open (click only)
   - No API dependency (instant local responses)
   - Predefined menu + custom message fallback
   - WhatsApp-speed feel
════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var WA     = 'https://api.whatsapp.com/send?phone=918527258462';
var PHONE  = 'tel:+918527258462';
var CONTACT= 'contact.html';

/* ── SMART RESPONSES DATABASE ── */
var RESPONSES = {
  'tin shed': {
    text: 'Tin shed ke liye hamare paas best options hain! \uD83C\uDFD7\uFE0F\n\n\u2705 Rate: \u20B9180-250/sq.ft\n\u2705 IS-grade steel\n\u2705 Free site visit\n\u2705 GST invoice\n\nKitne sq.ft ka shed chahiye aapko?',
    qr: ['500-1000 sq.ft', '1000-5000 sq.ft', '5000+ sq.ft', 'Price confirm karo']
  },
  'price': {
    text: 'Hamare rates 2026 mein:\n\n\uD83C\uDFD7\uFE0F Tin Shed: \u20B9180-250/sq.ft\n\uD83C\uDFED Industrial Shed: \u20B9200-300/sq.ft\n\uD83D\uDCE6 Warehouse: \u20B9185-250/sq.ft\n\uD83D\uDD29 PEB Structure: \u20B9220-350/sq.ft\n\nFinal price site visit ke baad confirm hogi. Free site visit ke liye call karein!',
    qr: ['Free site visit chahiye', 'WhatsApp karo', 'Call Now']
  },
  'rate': {
    text: 'Hamare rates 2026 mein:\n\n\uD83C\uDFD7\uFE0F Tin Shed: \u20B9180-250/sq.ft\n\uD83C\uDFED Industrial Shed: \u20B9200-300/sq.ft\n\uD83D\uDCE6 Warehouse: \u20B9185-250/sq.ft\n\nSite visit ke baad exact quote milegi!',
    qr: ['Free site visit chahiye', 'WhatsApp karo', 'Call Now']
  },
  'industrial': {
    text: 'Industrial shed ke liye hum specialists hain! \uD83C\uDFED\n\n\u2705 Span up to 60m\n\u2705 Height up to 15m\n\u2705 Earthquake resistant\n\u2705 Crane support available\n\n20+ years experience with 200+ industrial projects in Delhi NCR.',
    qr: ['Price batao', 'Free site visit', 'WhatsApp karo']
  },
  'warehouse': {
    text: 'Warehouse/godown shed ke liye:\n\n\u2705 High clearance (7-12m)\n\u2705 Wide span, no middle columns\n\u2705 Forklift compatible\n\u2705 Loading dock available\n\u2705 Rate: \u20B9185-250/sq.ft\n\nServing Delhi, Noida, Gurgaon, Faridabad.',
    qr: ['Size batao', 'Site visit chahiye', 'WhatsApp karo']
  },
  'parking': {
    text: 'Car parking shed ke liye best option! \uD83D\uDE97\n\n\u2705 Starting \u20B9180/sq.ft\n\u2705 GI sheet roofing\n\u2705 Weather proof\n\u2705 Ready in 7-10 days\n\nNajafgarh, Dwarka, Uttam Nagar mein free site visit!',
    qr: ['Quote chahiye', 'WhatsApp karo', 'Call Now']
  },
  'rooftop': {
    text: 'Terrace/rooftop shed ke liye hum expert hain! \uD83C\uDFE0\n\n\u2705 Lightweight structure\n\u2705 No damage to roof\n\u2705 Waterproof design\n\u2705 Rate: \u20B9180-220/sq.ft\n\nFree site visit available in Najafgarh & Delhi NCR.',
    qr: ['Quote chahiye', 'Site visit chahiye', 'WhatsApp karo']
  },
  'peb': {
    text: 'PEB (Pre-Engineered Building) Structure:\n\n\u2705 Clear span up to 90m\n\u2705 40% faster than RCC\n\u2705 30% cheaper than traditional\n\u2705 Expandable in future\n\u2705 Rate: \u20B9220-350/sq.ft\n\nFree design consultation available!',
    qr: ['Design consultation', 'Price confirm', 'WhatsApp karo']
  },
  'gst': {
    text: 'Ji haan! Hum GST registered hain. \uD83D\uDCCB\n\nGST Number: 07DJCPK0635M1Z5\n\nHar project mein proper GST invoice milti hai. B2B companies aur government tenders ke liye perfect.',
    qr: ['Quote chahiye', 'Contact karo', 'WhatsApp karo']
  },
  'visit': {
    text: 'Free site visit available hai! \uD83D\uDCCD\n\nService Area:\n\u2705 Najafgarh (same day)\n\u2705 Dwarka, Uttam Nagar\n\u2705 Delhi, Noida, Gurgaon\n\u2705 Faridabad, Ghaziabad\n\nCall karein aur date fix karein!',
    qr: ['Call Now', 'WhatsApp karo', 'Enquiry form']
  },
  'contact': {
    text: 'Hum se contact karein:\n\n\uD83D\uDCDE +91 85272 58462\n\uD83D\uDCAC WhatsApp: Same number\n\uD83D\uDD52 Mon-Sat: 9AM - 7PM\n\uD83D\uDCCD Najafgarh, New Delhi\n\nSubhash Kumar personally handle karte hain har project.',
    qr: ['Call Now', 'WhatsApp karo', 'Free site visit']
  },
  'hello': {
    text: 'Namaste! \uD83D\uDC4B Welcome to R.R Teen Set Solution!\n\nHum Delhi NCR ke trusted tin shed aur steel structure experts hain. Kaise help kar sakta hoon?',
    qr: ['Services dekhna hai', 'Price poochna hai', 'Free site visit', 'Contact karo']
  },
  'hi': {
    text: 'Namaste! \uD83D\uDC4B R.R Teen Set Solution mein aapka swagat hai!\n\n8+ saal experience \u2022 500+ projects \u2022 5.0 IndiaMART rating\n\nKya chahiye aapko?',
    qr: ['Tin Shed', 'Industrial Shed', 'Warehouse', 'Price List']
  },
  'najafgarh': {
    text: 'Ji haan! Hum Najafgarh based company hain. \uD83D\uDCCD\n\nNajafgarh aur surrounding areas mein SAME DAY site visit available hai!\n\n\u2705 Dwarka, Uttam Nagar\n\u2705 Delhi, Gurgaon\n\u2705 Noida, Faridabad',
    qr: ['Site visit book karo', 'Price poochna', 'Call Now']
  },
  'default': {
    text: 'Theek hai! \uD83D\uDE0A Hum aapki poori help karenge.\n\nInmein se kya chahiye?',
    qr: ['Tin Shed Price', 'Industrial Shed', 'Free Site Visit', 'WhatsApp karo', 'Call Now']
  }
};

/* ── MATCH RESPONSE ── */
function matchResponse(text){
  var t = text.toLowerCase();
  var keys = ['najafgarh','parking','rooftop','terrace','warehouse','godown','industrial','factory','peb','tin shed','shed','price','rate','cost','kitna','gst','invoice','visit','contact','hello','hi','namaste','helo'];
  for(var i=0;i<keys.length;i++){
    if(t.indexOf(keys[i])>-1 && RESPONSES[keys[i]]) return RESPONSES[keys[i]];
  }
  return RESPONSES['default'];
}

/* ── BUILD WIDGET ── */
var CSS = [
  '#ch-btn{position:fixed;bottom:80px;right:22px;z-index:9999;width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#0a1628,#1565c0);border:none;cursor:pointer;box-shadow:0 6px 24px rgba(21,101,192,.5);display:flex;align-items:center;justify-content:center;transition:transform .2s}',
  '#ch-btn:hover{transform:scale(1.1)}',
  '#ch-btn svg{width:24px;height:24px;fill:white}',
  '#ch-notif{position:absolute;top:0;right:0;width:18px;height:18px;background:#ff6f00;border-radius:50%;font-size:10px;font-weight:700;color:white;display:flex;align-items:center;justify-content:center;border:2px solid white;font-family:sans-serif}',
  '#ch-win{position:fixed;bottom:145px;right:22px;z-index:9998;width:330px;max-height:490px;background:var(--bg-card,#fff);border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.25);display:flex;flex-direction:column;overflow:hidden;transform:scale(0) translateY(20px);transform-origin:bottom right;transition:transform .3s cubic-bezier(.34,1.56,.64,1),opacity .3s;opacity:0;border:1px solid var(--border,#e5e7ef)}',
  '#ch-win.open{transform:scale(1) translateY(0);opacity:1}',
  '.chh{background:linear-gradient(135deg,#0a1628,#1565c0);padding:13px 15px;display:flex;align-items:center;gap:10px;border-bottom:3px solid #ff6f00;flex-shrink:0}',
  '.chav{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#ff6f00,#e65100);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;color:white;flex-shrink:0;border:2px solid rgba(255,255,255,.25)}',
  '.chif{flex:1}.chnm{font-weight:700;font-size:13px;color:white}',
  '.chst{font-size:10px;color:rgba(255,255,255,.6);display:flex;align-items:center;gap:4px;margin-top:2px}',
  '.chol{width:6px;height:6px;background:#00e676;border-radius:50%;animation:ch_pulse 2s infinite}',
  '@keyframes ch_pulse{0%,100%{opacity:1}50%{opacity:.3}}',
  '.chcl{width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.1);border:none;cursor:pointer;color:white;font-size:15px;display:flex;align-items:center;justify-content:center;transition:background .2s}',
  '.chcl:hover{background:rgba(255,255,255,.2)}',
  '#ch-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:7px;scroll-behavior:smooth;background:var(--bg-alt,#f4f7fb)}',
  '#ch-msgs::-webkit-scrollbar{width:3px}#ch-msgs::-webkit-scrollbar-thumb{background:var(--border,#dde);border-radius:3px}',
  '.cmsg{display:flex;gap:7px;align-items:flex-end;max-width:90%;animation:ch_in .2s ease}',
  '.cmsg.bot{align-self:flex-start}.cmsg.usr{align-self:flex-end;flex-direction:row-reverse}',
  '@keyframes ch_in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}',
  '.cmav{width:24px;height:24px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#ff6f00,#e65100);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:white}',
  '.cmb{padding:8px 12px;border-radius:13px;font-size:12.5px;line-height:1.55;max-width:100%;word-wrap:break-word;font-family:inherit}',
  '.cmsg.bot .cmb{background:var(--bg-card,#fff);color:var(--text,#1a2a3a);border-radius:4px 13px 13px 13px;border:1px solid var(--border,#dde8ff)}',
  '.cmsg.usr .cmb{background:linear-gradient(135deg,#1565c0,#0d47a1);color:white;border-radius:13px 4px 13px 13px}',
  '.cmt{font-size:9.5px;color:var(--text-muted,#8a9bb5);margin-top:2px;display:block;white-space:nowrap}',
  '.cmsg.bot .cmt{text-align:left}.cmsg.usr .cmt{text-align:right}',
  '.ch-typing{display:flex;gap:4px;padding:9px 13px;background:var(--bg-card,#fff);border-radius:4px 13px 13px 13px;border:1px solid var(--border,#dde);width:fit-content;align-self:flex-start;animation:ch_in .2s ease}',
  '.cht2{width:6px;height:6px;background:#1565c0;border-radius:50%;animation:ch_type 1.2s ease infinite}',
  '.cht2:nth-child(2){animation-delay:.2s}.cht2:nth-child(3){animation-delay:.4s}',
  '@keyframes ch_type{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-4px);opacity:1}}',
  '#ch-qr{display:flex;flex-wrap:wrap;gap:5px;padding:5px 12px;flex-shrink:0;background:var(--bg-alt,#f4f7fb)}',
  '.chqb{background:var(--bg-card,#fff);border:1.5px solid #1565c0;color:#1565c0;padding:5px 10px;border-radius:50px;font-size:11px;font-weight:700;cursor:pointer;transition:all .15s;white-space:nowrap;font-family:inherit}',
  '.chqb:hover{background:#1565c0;color:white}.chqb:active{transform:scale(.95)}',
  '.ch-inp{padding:9px 11px;border-top:1px solid var(--border,#eee);display:flex;gap:7px;align-items:flex-end;background:var(--bg-card,#fff);flex-shrink:0}',
  '#ch-input{flex:1;border:1.5px solid var(--border,#dde);border-radius:17px;padding:7px 11px;font-size:12.5px;outline:none;resize:none;font-family:inherit;max-height:65px;line-height:1.4;transition:border-color .3s;background:var(--bg-alt,#f4f7fb);color:var(--text,#1a2a3a)}',
  '#ch-input:focus{border-color:#1565c0}#ch-input::placeholder{color:var(--text-muted,#aaa)}',
  '#ch-send{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#2196f3,#1565c0);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}',
  '#ch-send:hover{transform:scale(1.1)}.#ch-send svg{width:15px;height:15px;fill:white}',
  '.ch-cta{display:flex;flex-direction:column;gap:5px;margin-top:4px}',
  '.ch-cta a{display:flex;align-items:center;gap:6px;padding:7px 11px;border-radius:9px;font-size:11.5px;font-weight:700;text-decoration:none;transition:all .2s;font-family:inherit}',
  '.ch-cta .call{background:#ff6f00;color:white}.ch-cta .call:hover{background:#e65100}',
  '.ch-cta .wa{background:#25D366;color:white}.ch-cta .wa:hover{background:#1da851}',
  '.ch-cta .form{background:#0a1628;color:white}.ch-cta .form:hover{background:#1a3a5c}',
  '@media(max-width:400px){#ch-win{width:calc(100vw - 14px);right:7px;bottom:138px}#ch-btn{right:14px;bottom:80px}}'
].join('');

var HTML =
  '<button id="ch-btn" aria-label="Chat with us">'+
    '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>'+
    '<div id="ch-notif">1</div>'+
  '</button>'+
  '<div id="ch-win">'+
    '<div class="chh">'+
      '<div class="chav">RR</div>'+
      '<div class="chif">'+
        '<div class="chnm">R.R Teen Set Solution</div>'+
        '<div class="chst"><div class="chol"></div>Usually replies instantly</div>'+
      '</div>'+
      '<button class="chcl" id="ch-close">\u2715</button>'+
    '</div>'+
    '<div id="ch-msgs"></div>'+
    '<div id="ch-qr"></div>'+
    '<div class="ch-inp">'+
      '<textarea id="ch-input" placeholder="Type your question..." rows="1"></textarea>'+
      '<button id="ch-send"><svg viewBox="0 0 24 24" width="15" height="15" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>'+
    '</div>'+
  '</div>';

/* ── INIT ── */
document.addEventListener('DOMContentLoaded',function(){
  // Inject CSS
  var st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);

  // Inject HTML
  var wrap=document.createElement('div'); wrap.innerHTML=HTML; document.body.appendChild(wrap);

  var btn    = document.getElementById('ch-btn');
  var win    = document.getElementById('ch-win');
  var close  = document.getElementById('ch-close');
  var msgs   = document.getElementById('ch-msgs');
  var qrDiv  = document.getElementById('ch-qr');
  var inp    = document.getElementById('ch-input');
  var snd    = document.getElementById('ch-send');
  var notif  = document.getElementById('ch-notif');
  var isOpen = false;
  var inited = false;

  function now(){ return new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}); }

  function fmt(t){
    return t.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
  }

  function scrollBot(){ msgs.scrollTop=msgs.scrollHeight; }

  function setQR(qrs){
    qrDiv.innerHTML='';
    if(!qrs||!qrs.length) return;
    qrs.forEach(function(q){
      var b=document.createElement('button');
      b.className='chqb'; b.textContent=q;
      b.onclick=function(){ send(q); };
      qrDiv.appendChild(b);
    });
  }

  function botMsg(text, qrs, delay){
    delay = delay||0;
    // Show typing indicator
    var typer = document.createElement('div');
    typer.className='ch-typing'; typer.id='ch-typing-el';
    typer.innerHTML='<div class="cht2"></div><div class="cht2"></div><div class="cht2"></div>';
    setTimeout(function(){
      msgs.appendChild(typer); scrollBot();
    }, delay);

    setTimeout(function(){
      if(typer.parentNode) typer.remove();
      var d=document.createElement('div');
      d.className='cmsg bot';
      d.innerHTML='<div class="cmav">RR</div><div><div class="cmb">'+fmt(text)+'</div><span class="cmt">'+now()+'</span></div>';
      msgs.appendChild(d); scrollBot();
      setQR(qrs);
    }, delay+600);
  }

  function usrMsg(text){
    setQR([]);
    var d=document.createElement('div');
    d.className='cmsg usr';
    d.innerHTML='<div><div class="cmb">'+fmt(text)+'</div><span class="cmt">'+now()+'</span></div>';
    msgs.appendChild(d); scrollBot();
  }

  function showCTA(){
    var d=document.createElement('div');
    d.className='cmsg bot';
    d.innerHTML='<div class="cmav">RR</div><div style="width:100%"><div class="ch-cta">'+
      '<a href="'+PHONE+'" class="call">\uD83D\uDCDE Call Subhash Kumar</a>'+
      '<a href="'+WA+'&text='+encodeURIComponent('Hello! Shed enquiry karna tha.')+'" target="_blank" class="wa">\uD83D\uDCAC WhatsApp Now</a>'+
      '<a href="'+CONTACT+'" class="form">\uD83D\uDCCB Fill Enquiry Form</a>'+
    '</div></div>';
    msgs.appendChild(d); scrollBot();
  }

  function welcome(){
    botMsg('Namaste! \uD83D\uDC4B Welcome to R.R Teen Set Solution!\n\nMain aapka assistant hoon. Kaise help kar sakta hoon?',
      ['Tin Shed', 'Industrial Shed', 'Warehouse Shed', 'Price List', 'Free Site Visit', 'Contact Karo'], 0);
  }

  function send(text){
    text=(text||inp.value).trim();
    if(!text) return;
    inp.value=''; inp.style.height='auto';
    usrMsg(text);

    var low=text.toLowerCase();
    var ctaKeys=['call','whatsapp','contact','number','visit book','fix karo'];
    var wantCTA=ctaKeys.some(function(k){return low.indexOf(k)>-1;});

    var resp=matchResponse(text);
    botMsg(resp.text, resp.qr, 200);

    if(wantCTA) setTimeout(showCTA, 1000);
  }

  /* ── TOGGLE — click only, NO auto-open ── */
  function toggle(){
    isOpen=!isOpen;
    win.classList.toggle('open',isOpen);
    if(isOpen){
      if(notif) notif.style.display='none';
      if(!inited){ inited=true; welcome(); }
      setTimeout(function(){inp.focus();},350);
    }
  }

  btn.addEventListener('click', toggle);
  close.addEventListener('click',function(e){e.stopPropagation(); toggle();});

  /* ── INPUT ── */
  snd.addEventListener('click',function(){send();});
  inp.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}
  });
  inp.addEventListener('input',function(){
    this.style.height='auto';
    this.style.height=Math.min(this.scrollHeight,65)+'px';
  });

  /* ── Quick reply special handlers ── */
  document.addEventListener('click',function(e){
    if(!e.target.classList.contains('chqb')) return;
    var t=e.target.textContent;
    if(t==='Call Now'||t==='Call Karo'){window.location.href=PHONE;return;}
    if(t==='WhatsApp karo'||t==='WhatsApp Karo'){window.open(WA+'&text='+encodeURIComponent('Hello! Shed enquiry karna tha.'),'_blank');return;}
  });
});

})();
