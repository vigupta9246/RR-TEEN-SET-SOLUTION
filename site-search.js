/* ════════════════════════════════════════════════════════════
   SITE SEARCH — Fuse.js powered, lazy-loaded, no backend needed
   Injects a search trigger into the nav (all pages via main.js)
   and a modal overlay with live fuzzy-search results.
════════════════════════════════════════════════════════════ */
(function () {
  var fuseInstance = null;
  var indexData = null;
  var modal, input, resultsBox;

  function injectStyles() {
    if (document.getElementById('site-search-styles')) return;
    var css = `
      #site-search-btn{background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;color:var(--navy,#16264f);transition:background .2s}
      #site-search-btn:hover{background:rgba(0,0,0,.06)}
      #site-search-btn svg{width:19px;height:19px}
      #site-search-modal{position:fixed;inset:0;background:rgba(10,22,40,.6);backdrop-filter:blur(2px);z-index:99999;display:none;align-items:flex-start;justify-content:center;padding:10vh 5% 5%}
      #site-search-modal.open{display:flex}
      #site-search-box{background:#fff;border-radius:14px;width:100%;max-width:640px;max-height:70vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35)}
      #site-search-input-row{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid #eee}
      #site-search-input-row svg{width:20px;height:20px;color:#888;flex-shrink:0}
      #site-search-input{flex:1;border:none;outline:none;font-size:16px;font-family:inherit;color:#16264f}
      #site-search-close{background:none;border:none;cursor:pointer;color:#888;font-size:22px;line-height:1;padding:4px 6px}
      #site-search-results{overflow-y:auto;flex:1}
      .ss-result{display:block;padding:14px 18px;border-bottom:1px solid #f2f2f2;text-decoration:none;color:inherit}
      .ss-result:hover{background:#f8f8fb}
      .ss-result h4{font-size:14.5px;color:#16264f;margin:0 0 4px;font-family:var(--font-b,inherit)}
      .ss-result p{font-size:12.5px;color:#777;margin:0;line-height:1.5}
      .ss-empty{padding:30px 18px;text-align:center;color:#999;font-size:14px}
      @media(max-width:600px){#site-search-modal{padding:8vh 4% 4%}}
    `;
    var style = document.createElement('style');
    style.id = 'site-search-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function injectTrigger() {
    if (document.getElementById('site-search-btn')) return;
    var themeBtn = document.getElementById('theme-btn') || document.querySelector('.theme-toggle');
    var btn = document.createElement('button');
    btn.id = 'site-search-btn';
    btn.setAttribute('aria-label', 'Search this site');
    btn.title = 'Search';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>';
    btn.addEventListener('click', openSearch);
    if (themeBtn && themeBtn.parentNode) {
      themeBtn.parentNode.insertBefore(btn, themeBtn);
    } else {
      var nav = document.querySelector('nav');
      if (nav) nav.appendChild(btn);
    }
  }

  function buildModal() {
    if (document.getElementById('site-search-modal')) return;
    modal = document.createElement('div');
    modal.id = 'site-search-modal';
    modal.innerHTML =
      '<div id="site-search-box">' +
        '<div id="site-search-input-row">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
          '<input id="site-search-input" type="text" placeholder="Search services, cities, guides..." autocomplete="off">' +
          '<button id="site-search-close" aria-label="Close search">&times;</button>' +
        '</div>' +
        '<div id="site-search-results"><div class="ss-empty">Type to search the site...</div></div>' +
      '</div>';
    document.body.appendChild(modal);
    input = document.getElementById('site-search-input');
    resultsBox = document.getElementById('site-search-results');

    modal.addEventListener('click', function (e) { if (e.target === modal) closeSearch(); });
    document.getElementById('site-search-close').addEventListener('click', closeSearch);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeSearch();
    });
    input.addEventListener('input', function () { runSearch(input.value); });
  }

  function runSearch(query) {
    if (!query || !query.trim()) {
      resultsBox.innerHTML = '<div class="ss-empty">Type to search the site...</div>';
      return;
    }
    if (!fuseInstance) return;
    var results = fuseInstance.search(query, { limit: 8 });
    if (!results.length) {
      resultsBox.innerHTML = '<div class="ss-empty">No results for "' + query.replace(/</g, '&lt;') + '"</div>';
      return;
    }
    resultsBox.innerHTML = results.map(function (r) {
      var item = r.item;
      return '<a class="ss-result" href="' + item.url + '"><h4>' + item.title + '</h4><p>' + item.desc + '</p></a>';
    }).join('');
  }

  function openSearch() {
    injectStyles();
    buildModal();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { input.focus(); }, 50);
    loadIndexIfNeeded();
  }

  function closeSearch() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function loadIndexIfNeeded() {
    if (fuseInstance) return;
    Promise.all([
      import('./vendor/fusejs/fuse.min.mjs'),
      fetch('search-index.json').then(function (r) { return r.json(); })
    ]).then(function (res) {
      var Fuse = res[0].default;
      indexData = res[1];
      fuseInstance = new Fuse(indexData, {
        keys: [{ name: 'title', weight: 0.6 }, { name: 'desc', weight: 0.4 }],
        threshold: 0.35,
        ignoreLocation: true
      });
      if (input.value) runSearch(input.value);
    }).catch(function (err) {
      resultsBox.innerHTML = '<div class="ss-empty">Search unavailable right now.</div>';
      console.error('Site search failed to load:', err);
    });
  }

  // Keyboard shortcut: Ctrl/Cmd+K opens search from anywhere
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearch();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { injectStyles(); injectTrigger(); });
  } else {
    injectStyles();
    injectTrigger();
  }
})();
