/* ════════════════════════════════════════════════════════════
   BLOG INDEX — Search + Category filter + Pagination for blog.html
   Progressive enhancement: all article cards stay in the HTML
   (crawlers and no-JS visitors see everything). This script only
   shows/hides cards. State is kept in the URL: ?q=&cat=&page=
════════════════════════════════════════════════════════════ */
(function () {
  var PER_PAGE = 9;

  var cards = Array.prototype.slice.call(document.querySelectorAll('section article'));
  if (!cards.length) return;
  var grid = cards[0].parentElement;

  /* Read data from the existing card markup */
  var items = cards.map(function (el) {
    var badge = el.querySelector('span');
    var h2 = el.querySelector('h2');
    var p = el.querySelector('p');
    var cat = badge ? badge.textContent.trim() : 'Other';
    var title = h2 ? h2.textContent.trim() : '';
    var desc = p ? p.textContent.trim() : '';
    return { el: el, cat: cat, hay: (title + ' ' + desc + ' ' + cat).toLowerCase() };
  });

  var cats = [];
  var counts = {};
  items.forEach(function (it) {
    if (!counts[it.cat]) { counts[it.cat] = 0; cats.push(it.cat); }
    counts[it.cat]++;
  });
  cats.sort();

  var state = { q: '', cat: 'All', page: 1 };

  function readUrl() {
    var sp = new URLSearchParams(window.location.search);
    state.q = (sp.get('q') || '').slice(0, 80);
    var c = sp.get('cat');
    state.cat = (c && counts[c]) ? c : 'All';
    var pg = parseInt(sp.get('page'), 10);
    state.page = pg > 0 ? pg : 1;
  }

  function writeUrl() {
    var sp = new URLSearchParams();
    if (state.q) sp.set('q', state.q);
    if (state.cat !== 'All') sp.set('cat', state.cat);
    if (state.page > 1) sp.set('page', state.page);
    var qs = sp.toString();
    try { history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '')); } catch (e) {}
  }

  /* Styles */
  var style = document.createElement('style');
  style.id = 'blog-index-styles';
  style.textContent =
    '.bi-wrap{margin-bottom:30px}' +
    '.bi-search{position:relative;max-width:520px;margin:0 auto 18px}' +
    '.bi-search input{width:100%;padding:13px 44px 13px 16px;border-radius:50px;border:1.5px solid var(--border,#c5cbe3);background:var(--bg-card,#fff);color:var(--text,#0a1628);font:600 15px var(--font-b,Nunito,sans-serif);outline:none;transition:border-color .2s,box-shadow .2s}' +
    '.bi-search input:focus{border-color:var(--blue,#4056a1);box-shadow:0 0 0 3px rgba(64,86,161,.15)}' +
    '.bi-clear{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:30px;height:30px;border:none;border-radius:50%;background:transparent;color:var(--text-muted,#4b5a6e);font-size:20px;line-height:1;cursor:pointer;display:none}' +
    '.bi-clear.on{display:block}' +
    '.bi-chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}' +
    '.bi-chip{border:1.5px solid var(--border,#c5cbe3);background:var(--bg-card,#fff);color:var(--text,#0a1628);padding:7px 14px;border-radius:50px;font:700 12.5px var(--font-b,Nunito,sans-serif);cursor:pointer;white-space:nowrap;transition:all .2s}' +
    '.bi-chip:hover{border-color:var(--blue,#4056a1)}' +
    '.bi-chip.on{background:var(--accent,#f13c20);border-color:var(--accent,#f13c20);color:#fff}' +
    '.bi-chip small{opacity:.7;font-weight:600;margin-left:4px}' +
    '.bi-status{text-align:center;font-size:13px;color:var(--text-muted,#4b5a6e);margin:14px 0 0}' +
    '.bi-empty{display:none;text-align:center;padding:40px 16px;color:var(--text-muted,#4b5a6e);font-size:15px;grid-column:1/-1}' +
    '.bi-empty a{color:var(--blue,#4056a1);font-weight:700;cursor:pointer;text-decoration:underline}' +
    '.bi-pager{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:34px}' +
    '.bi-pager button{min-width:40px;height:40px;padding:0 14px;border-radius:10px;border:1.5px solid var(--border,#c5cbe3);background:var(--bg-card,#fff);color:var(--text,#0a1628);font:700 14px var(--font-b,Nunito,sans-serif);cursor:pointer;transition:all .2s}' +
    '.bi-pager button:hover:not([disabled]){border-color:var(--blue,#4056a1)}' +
    '.bi-pager button.on{background:var(--navy,#16264f);border-color:var(--navy,#16264f);color:#fff}' +
    '.bi-pager button[disabled]{opacity:.4;cursor:default}' +
    '.bi-chips::-webkit-scrollbar{display:none}' +
    '@media(max-width:640px){.bi-wrap{margin-bottom:22px}.bi-search{margin-bottom:12px}.bi-search input{padding:11px 40px 11px 14px;font-size:14px}.bi-chips{flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;scrollbar-width:none;margin:0 -5%;padding:2px 5% 4px;-webkit-overflow-scrolling:touch}.bi-chip{padding:6px 12px;font-size:12px;flex:0 0 auto}.bi-status{margin-top:10px;font-size:12px}.bi-pager{gap:6px;margin-top:26px}.bi-pager button{min-width:36px;height:36px;padding:0 10px;font-size:13px}}';
  document.head.appendChild(style);

  /* Controls */
  var wrap = document.createElement('div');
  wrap.className = 'bi-wrap';
  wrap.innerHTML =
    '<div class="bi-search" role="search">' +
      '<input type="search" id="bi-q" placeholder="Search articles — e.g. cost, PEB, leakage…" aria-label="Search blog articles" autocomplete="off" maxlength="80">' +
      '<button type="button" class="bi-clear" aria-label="Clear search">&times;</button>' +
    '</div>' +
    '<div class="bi-chips" role="group" aria-label="Filter by category"></div>' +
    '<p class="bi-status" aria-live="polite"></p>';
  grid.parentNode.insertBefore(wrap, grid);

  var input = wrap.querySelector('#bi-q');
  var clearBtn = wrap.querySelector('.bi-clear');
  var chipsEl = wrap.querySelector('.bi-chips');
  var statusEl = wrap.querySelector('.bi-status');

  var empty = document.createElement('div');
  empty.className = 'bi-empty';
  empty.innerHTML = 'Koi article nahi mila. <a role="button" tabindex="0">Filters reset karein</a>';
  grid.appendChild(empty);

  var pager = document.createElement('div');
  pager.className = 'bi-pager';
  pager.setAttribute('role', 'navigation');
  pager.setAttribute('aria-label', 'Blog pages');
  grid.parentNode.insertBefore(pager, grid.nextSibling);

  function chip(label, count) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'bi-chip';
    b.setAttribute('data-cat', label);
    b.innerHTML = label.replace(/&/g, '&amp;') + '<small>' + count + '</small>';
    return b;
  }
  chipsEl.appendChild(chip('All', items.length));
  cats.forEach(function (c) { chipsEl.appendChild(chip(c, counts[c])); });

  function pageBtn(label, page, opts) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    if (opts && opts.disabled) b.disabled = true;
    if (opts && opts.on) { b.className = 'on'; b.setAttribute('aria-current', 'page'); }
    if (!(opts && opts.disabled)) b.addEventListener('click', function () { state.page = page; render(true); });
    return b;
  }

  function render(scroll) {
    var terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    var matched = items.filter(function (it) {
      if (state.cat !== 'All' && it.cat !== state.cat) return false;
      return terms.every(function (t) { return it.hay.indexOf(t) !== -1; });
    });

    var pages = Math.max(1, Math.ceil(matched.length / PER_PAGE));
    if (state.page > pages) state.page = pages;
    var start = (state.page - 1) * PER_PAGE;
    var visible = matched.slice(start, start + PER_PAGE);

    items.forEach(function (it) { it.el.style.display = 'none'; });
    visible.forEach(function (it) { it.el.style.display = ''; });
    empty.style.display = matched.length ? 'none' : 'block';

    Array.prototype.forEach.call(chipsEl.children, function (b) {
      var on = b.getAttribute('data-cat') === state.cat;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    clearBtn.classList.toggle('on', !!state.q);

    statusEl.textContent = matched.length
      ? 'Showing ' + (start + 1) + '–' + (start + visible.length) + ' of ' + matched.length + ' articles'
      : '';

    pager.innerHTML = '';
    if (pages > 1) {
      pager.appendChild(pageBtn('← Prev', state.page - 1, { disabled: state.page === 1 }));
      for (var i = 1; i <= pages; i++) pager.appendChild(pageBtn(String(i), i, { on: i === state.page }));
      pager.appendChild(pageBtn('Next →', state.page + 1, { disabled: state.page === pages }));
    }

    writeUrl();
    if (scroll) {
      var top = wrap.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  /* Events */
  var timer;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { state.q = input.value.trim(); state.page = 1; render(false); }, 150);
  });
  clearBtn.addEventListener('click', function () { input.value = ''; state.q = ''; state.page = 1; render(false); input.focus(); });
  chipsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.bi-chip');
    if (!b) return;
    state.cat = b.getAttribute('data-cat');
    state.page = 1;
    render(false);
  });
  function resetAll() { input.value = ''; state.q = ''; state.cat = 'All'; state.page = 1; render(false); }
  var resetLink = empty.querySelector('a');
  resetLink.addEventListener('click', resetAll);
  resetLink.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); resetAll(); } });

  readUrl();
  input.value = state.q;
  render(false);
})();
