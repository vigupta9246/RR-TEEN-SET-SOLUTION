/* Delhi industrial-area pages: scroll reveal, animated counters, SVG draw triggers. No dependencies. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function countUp(el) {
    var end = parseFloat(el.getAttribute('data-count'));
    if (isNaN(end)) return;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = end + suffix; return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function reveal(el) {
    el.classList.add('in');
    var counters = el.querySelectorAll ? el.querySelectorAll('[data-count]') : [];
    for (var i = 0; i < counters.length; i++) countUp(counters[i]);
  }

  var targets = document.querySelectorAll('.ap .reveal, .ap .ap-tl, .ap .ap-rates, .ap .ap-diagram');
  if (!('IntersectionObserver' in window)) {
    for (var i = 0; i < targets.length; i++) reveal(targets[i]);
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  for (var j = 0; j < targets.length; j++) io.observe(targets[j]);
})();
