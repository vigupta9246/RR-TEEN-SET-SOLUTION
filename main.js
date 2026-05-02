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
