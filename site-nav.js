/* Site navbar behaviour for pages that do not load main.js (copied from main.js: theme toggle, logo link,
   mobile menu, scroll shadow + active link, touch dropdowns). Keep in sync with main.js. */
/* ════════════════════════════════════════════════════════════
   1. DARK MODE
════════════════════════════════════════════════════════════ */
(function(){
  var KEY = 'rr_theme', root = document.documentElement, mq = window.matchMedia ? matchMedia('(prefers-color-scheme:dark)') : null;
  function stored(){ try { return localStorage.getItem(KEY); } catch(e){ return null; } }
  function current(){ return stored() || (mq && mq.matches ? 'dark' : 'light'); }
  function paint(t){
    root.setAttribute('data-theme', t);
    var b = document.getElementById('theme-btn');
    if (b){ b.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false'); b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); b.title = t === 'dark' ? 'Light mode' : 'Dark mode'; }
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'dark' ? '#0d1117' : '#0a1628');
  }
  paint(current());
  document.addEventListener('DOMContentLoaded', function(){
    paint(current());
    var b = document.getElementById('theme-btn');
    if (b) b.addEventListener('click', function(){
      var t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(KEY, t); } catch(e){}
      paint(t);
    });
  });
  /* follow the phone/computer setting until the visitor picks a theme themselves */
  if (mq && mq.addEventListener) mq.addEventListener('change', function(e){ if (!stored()) paint(e.matches ? 'dark' : 'light'); });
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
   TOUCH-FRIENDLY DROPDOWN NAV (Services ▾ / More ▾)
   CSS :hover alone doesn't work on touchscreen laptops/tablets —
   first tap was either navigating straight through (Services) or
   doing nothing at all (More). This makes first tap open the
   dropdown; a second tap on the same trigger follows its link
   (if it has one). Desktop mouse hover keeps working as before.
════════════════════════════════════════════════════════════ */
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var triggers = document.querySelectorAll('.has-dropdown > a');
    triggers.forEach(function(trigger){
      trigger.addEventListener('click', function(e){
        var parent = trigger.parentElement;
        var isOpen = parent.classList.contains('dropdown-open');
        if(!isOpen){
          e.preventDefault();
          document.querySelectorAll('.has-dropdown.dropdown-open').forEach(function(el){
            if(el !== parent) el.classList.remove('dropdown-open');
          });
          parent.classList.add('dropdown-open');
        }
        // if already open, let the default action happen (navigate, or
        // do nothing for javascript:void(0) triggers like "More")
      });
    });
    document.addEventListener('click', function(e){
      if(!e.target.closest('.has-dropdown')){
        document.querySelectorAll('.has-dropdown.dropdown-open').forEach(function(el){
          el.classList.remove('dropdown-open');
        });
      }
    });
  });
})();
