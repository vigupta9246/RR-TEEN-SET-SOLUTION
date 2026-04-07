// R.R Teen Set Solution — Main JS
// Version 2.0

document.addEventListener('DOMContentLoaded', function(){

  // ── MOBILE MENU ──────────────────────────────
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  if(hamburger && mobileMenu){
    hamburger.addEventListener('click', function(){
      this.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });
    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
      });
    });
    // Close on outside click
    document.addEventListener('click', function(e){
      if(!hamburger.contains(e.target) && !mobileMenu.contains(e.target)){
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
      }
    });
  }

  // ── ACTIVE NAV LINK ──────────────────────────
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if(href === currentPage || (currentPage === '' && href === 'index.html')){
      a.classList.add('active');
    }
  });

  // ── STICKY NAV SHADOW ────────────────────────
  window.addEventListener('scroll', function(){
    const nav = document.querySelector('nav');
    if(nav) nav.style.boxShadow = window.scrollY > 20 ? '0 4px 20px rgba(0,0,0,.3)' : 'none';
  });

  // ── SMOOTH SCROLL FOR ANCHOR LINKS ──────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e){
      const target = document.querySelector(this.getAttribute('href'));
      if(target){
        e.preventDefault();
        target.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
  });

  // ── INTERSECTION OBSERVER (Animate on scroll) ─
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, {threshold: 0.1});

  document.querySelectorAll('.scard, .wcard, .pstep, .gallery-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    observer.observe(el);
  });

});

// ── WHATSAPP QUOTE SENDER ────────────────────────
function sendWhatsApp(name, phone, service, city, note){
  const msg = [
    'Hello R.R Teen Set Solution! 🏗️',
    '',
    '*New Enquiry from Website*',
    '──────────────────────',
    'Name: ' + (name || 'Not provided'),
    'Phone: ' + (phone || 'Not provided'),
    'Service: ' + (service || 'General Enquiry'),
    'City: ' + (city || 'Delhi NCR'),
    note ? 'Message: ' + note : '',
    '',
    'Please call/WhatsApp me. Thank you!'
  ].filter(Boolean).join('\n');

  window.open('https://api.whatsapp.com/send?phone=918527258462&text=' + encodeURIComponent(msg), '_blank');
}

// ── CONTACT FORM HANDLER ─────────────────────────
function handleContactForm(e){
  e.preventDefault();
  const name = document.getElementById('f-name')?.value || '';
  const phone = document.getElementById('f-phone')?.value || '';
  const service = document.getElementById('f-service')?.value || '';
  const city = document.getElementById('f-city')?.value || '';
  const note = document.getElementById('f-note')?.value || '';
  sendWhatsApp(name, phone, service, city, note);
}
