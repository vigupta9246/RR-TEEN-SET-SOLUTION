/* ============================================================
   RR TEEN SET SOLUTION — animations.js
   Add before </body>:
   <script src="animations.js"></script>
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. SCROLL PROGRESS BAR ── */
  const progressBar = document.createElement('div');
  progressBar.id = 'scroll-progress';
  document.body.prepend(progressBar);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (scrollTop / docHeight * 100) + '%';
  }, { passive: true });


  /* ── 2. NAV SCROLL CLASS ── */
  const nav = document.querySelector('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }


  /* ── 3. INTERSECTION OBSERVER — SCROLL REVEAL ── */
  // Auto-add reveal classes to key sections
  const autoRevealSelectors = [
    '.stats-bar .stat-item',
    'section > div',
    '.grid-2 > *',
    'h2.section-title',
    '.feat-list',
    '.btn-group',
    'footer > *',
  ];

  // Only add if not already present
  autoRevealSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      if (!el.classList.contains('reveal') &&
          !el.classList.contains('reveal-left') &&
          !el.classList.contains('reveal-right') &&
          !el.classList.contains('reveal-scale')) {
        el.classList.add('reveal');
        el.style.transitionDelay = (i * 0.08) + 's';
      }
    });
  });

  // Observer
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children').forEach(el => {
    revealObserver.observe(el);
  });


  /* ── 4. STAT COUNTER ANIMATION ── */
  const statNums = document.querySelectorAll('.stat-num');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const text = el.textContent.trim();
      const numMatch = text.match(/\d+/);
      if (!numMatch) return;

      const target = parseInt(numMatch[0]);
      const prefix = text.slice(0, numMatch.index);
      const suffix = text.slice(numMatch.index + numMatch[0].length);
      const duration = 1400;
      const start = performance.now();

      function easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
      }

      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.round(easeOut(progress) * target);
        el.textContent = prefix + current + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  statNums.forEach(el => counterObserver.observe(el));


  /* ── 5. ACTIVE NAV LINK HIGHLIGHT ── */
  const navLinks = document.querySelectorAll('.nav-links a');
  const currentPage = location.pathname.split('/').pop() || 'index.html';

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });


  /* ── 6. RIPPLE EFFECT ON BUTTONS ── */
  document.querySelectorAll('.btn, .nav-cta, .mob-cta-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);

      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255,255,255,0.3);
        width: ${size}px;
        height: ${size}px;
        left: ${e.clientX - rect.left - size / 2}px;
        top: ${e.clientY - rect.top - size / 2}px;
        transform: scale(0);
        animation: rippleAnim 0.55s ease-out forwards;
        pointer-events: none;
      `;

      if (!document.querySelector('#ripple-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-style';
        style.textContent = '@keyframes rippleAnim { to { transform: scale(2.5); opacity: 0; } }';
        document.head.appendChild(style);
      }

      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });


  /* ── 7. MOBILE MENU ANIMATION ── */
  const hamburger = document.querySelector('.hamburger');
  const mobMenu = document.getElementById('mob-menu');

  if (hamburger && mobMenu) {
    hamburger.addEventListener('click', () => {
      mobMenu.classList.toggle('open');
    });
  }


  /* ── 8. IMAGE LAZY LOAD WITH SHIMMER ── */
  const images = document.querySelectorAll('img[src]:not([loading])');
  images.forEach(img => {
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');

    if (!img.complete) {
      img.closest('[style*="border-radius"]')?.classList.add('shimmer');
      img.addEventListener('load', () => {
        img.closest('[style*="border-radius"]')?.classList.remove('shimmer');
      }, { once: true });
    }
  });


  /* ── 9. SMOOTH ANCHOR SCROLL ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });


  /* ── 10. CURSOR GLOW (desktop only) ── */
  if (window.matchMedia('(pointer: fine)').matches) {
    const glow = document.createElement('div');
    glow.id = 'cursor-glow';
    glow.style.cssText = `
      position: fixed;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,111,0,0.06) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
      transform: translate(-50%, -50%);
      transition: left 0.08s ease, top 0.08s ease;
      will-change: left, top;
    `;
    document.body.appendChild(glow);

    window.addEventListener('mousemove', e => {
      glow.style.left = e.clientX + 'px';
      glow.style.top  = e.clientY + 'px';
    }, { passive: true });
  }


  /* ── 11. PAGE LOAD — REMOVE TRANSITION BLOCK ── */
  document.documentElement.classList.add('no-transition');
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.documentElement.classList.remove('no-transition');
    }, 50);
  });


  /* ── 12. SECTION TITLE LINE REVEAL ── */
  document.querySelectorAll('h2.section-title').forEach(el => {
    el.querySelectorAll('br + *').forEach(span => {
      span.classList.add('line-reveal');
    });
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    obs.observe(el);
  });

  console.log('✅ RR Teen Set Solution — Animations loaded');

})();
