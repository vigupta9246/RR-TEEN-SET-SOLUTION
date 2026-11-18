/* Article V2 — progress bar, sticky contents with scroll-spy, draw-on-view figures,
   count-up numbers, copy-link. No dependencies. Content is fully readable without JS. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reading progress */
  var bar = document.getElementById('av-progress');
  if (bar) {
    var ticking = false;
    var upd = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0) + '%';
      ticking = false;
    };
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* Contents + scroll-spy */
  var toc = document.querySelector('.av-toc ol');
  var heads = [].slice.call(document.querySelectorAll('.av-body h2[id]'));
  if (toc && heads.length) {
    heads.forEach(function (h) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.getAttribute('data-toc') || h.textContent;
      li.appendChild(a);
      toc.appendChild(li);
    });
    var links = [].slice.call(toc.querySelectorAll('a'));
    var setOn = function (id) {
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('on', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        if (on && toc.parentElement.scrollWidth > toc.parentElement.clientWidth && getComputedStyle(toc).display === 'flex') {
          var box = toc.parentElement;
          box.scrollTo({ left: a.offsetLeft - 24, behavior: reduce ? 'auto' : 'smooth' });
        }
      });
    };
    var spy = function () {
      var cur = heads[0].id;
      var line = (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 72) + 90;
      heads.forEach(function (h) { if (h.getBoundingClientRect().top - line <= 0) cur = h.id; });
      setOn(cur);
    };
    var t2 = false;
    addEventListener('scroll', function () { if (!t2) { t2 = true; requestAnimationFrame(function () { spy(); t2 = false; }); } }, { passive: true });
    spy();
  }

  /* Draw-on-view for figures, bars, numbers */
  var figs = [].slice.call(document.querySelectorAll('.av-fig, .av-hero-art, .av-spec'));
  var countUp = function (el) {
    var end = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (isNaN(end)) return;
    if (reduce) { el.textContent = end.toFixed(dec) + suffix; return; }
    var t0 = null, dur = 1100;
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = (end * e).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  var reveal = function (el) {
    el.classList.add('is-in');
    [].forEach.call(el.querySelectorAll('[data-count]'), countUp);
  };
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.25 });
    figs.forEach(function (f) { io.observe(f); });
  } else { figs.forEach(reveal); }

  /* Copy link */
  var cp = document.getElementById('av-copy');
  if (cp) cp.addEventListener('click', function () {
    var done = function () { cp.textContent = 'Link copied'; setTimeout(function () { cp.textContent = 'Copy link'; }, 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(location.href.split('#')[0]).then(done, done); else done();
  });
})();
