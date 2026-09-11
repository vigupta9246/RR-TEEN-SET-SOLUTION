/* ════════════════════════════════════════════════════════════
   BLOG ENHANCEMENTS — Reading progress bar + Social share buttons
   Self-contained: injects its own CSS, progress bar, and a share
   row at the top of .blog-body. Only meant for article pages.
════════════════════════════════════════════════════════════ */
(function () {

  function injectStyles() {
    if (document.getElementById('blog-enh-styles')) return;
    var css = `
      #scroll-progress{position:fixed;top:0;left:0;height:3px;width:0%;background:linear-gradient(90deg,#d79922,#f13c20);z-index:99998;transition:width .1s linear}
      .share-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #e8e8ec}
      .share-row span{font-size:12.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#888;margin-right:2px}
      .share-btn{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;color:#fff;text-decoration:none;transition:transform .15s,opacity .15s;border:none;cursor:pointer}
      .share-btn:hover{transform:translateY(-2px);opacity:.9}
      .share-btn svg{width:16px;height:16px}
      .share-btn.wa{background:#25D366}
      .share-btn.fb{background:#1877F2}
      .share-btn.x{background:#000}
      .share-btn.copy{background:#4056a1}
      .share-btn.copy.copied{background:#2e7d32}
      #article-toc{background:#f8f8fb;border:1.5px solid #e8e8ec;border-radius:12px;padding:16px 20px;margin-bottom:28px}
      #article-toc summary{font-weight:800;font-size:14px;color:#16264f;cursor:pointer;list-style:none;outline:none}
      #article-toc summary::-webkit-details-marker{display:none}
      #article-toc ul{margin:14px 0 2px;padding-left:20px}
      #article-toc li{margin-bottom:8px;font-size:13.5px}
      #article-toc a{color:#4056a1;text-decoration:none}
      #article-toc a:hover{text-decoration:underline}
    `;
    var style = document.createElement('style');
    style.id = 'blog-enh-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function addProgressBar() {
    if (document.getElementById('scroll-progress')) return;
    var bar = document.createElement('div');
    bar.id = 'scroll-progress';
    document.body.prepend(bar);
    window.addEventListener('scroll', function () {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight * 100) : 0;
      bar.style.width = Math.min(pct, 100) + '%';
    }, { passive: true });
  }

  function addShareRow() {
    var body = document.querySelector('.blog-body');
    if (!body || document.querySelector('.share-row')) return;

    var url = encodeURIComponent(window.location.href);
    var title = encodeURIComponent(document.title.split('|')[0].trim());

    var row = document.createElement('div');
    row.className = 'share-row';
    row.innerHTML =
      '<span>Share</span>' +
      '<a class="share-btn wa" target="_blank" rel="noopener" aria-label="Share on WhatsApp" href="https://api.whatsapp.com/send?text=' + title + '%20' + url + '">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.85.5 3.58 1.36 5.07L2 22l5.2-1.47a9.9 9.9 0 0 0 4.84 1.28h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.79 14.02c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.12.11-1.8-.11a16.6 16.6 0 0 1-1.62-.6c-2.86-1.24-4.72-4.13-4.86-4.32-.14-.19-1.16-1.55-1.16-2.96 0-1.4.73-2.09 1-2.38.26-.28.57-.35.76-.35h.55c.18 0 .42-.03.65.5.24.55.8 1.9.87 2.04.07.14.12.3.02.49-.09.19-.14.3-.28.46-.14.16-.29.36-.42.48-.14.13-.28.28-.12.55.16.28.7 1.17 1.51 1.9 1.04.94 1.92 1.24 2.19 1.38.28.14.44.12.6-.07.16-.19.7-.82.89-1.1.19-.28.37-.23.62-.14.26.09 1.62.77 1.9.91.28.14.46.21.53.33.07.12.07.7-.17 1.38z"/></svg>' +
      '</a>' +
      '<a class="share-btn fb" target="_blank" rel="noopener" aria-label="Share on Facebook" href="https://www.facebook.com/sharer/sharer.php?u=' + url + '">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg>' +
      '</a>' +
      '<a class="share-btn x" target="_blank" rel="noopener" aria-label="Share on X" href="https://twitter.com/intent/tweet?text=' + title + '&url=' + url + '">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23.3 22H16.7l-5.2-6.8L5.5 22H2.4l8.1-9.3L1.7 2h6.8l4.7 6.2zm-1.2 18h1.7L7.4 4h-1.8z"/></svg>' +
      '</a>' +
      '<button class="share-btn copy" type="button" aria-label="Copy link">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
      '</button>';

    body.insertBefore(row, body.firstChild);

    var copyBtn = row.querySelector('.copy');
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(window.location.href).then(function () {
        copyBtn.classList.add('copied');
        setTimeout(function () { copyBtn.classList.remove('copied'); }, 1500);
      });
    });
  }

  function slugify(text) {
    return text.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60);
  }

  function addTOC() {
    var body = document.querySelector('.blog-body');
    if (!body || document.getElementById('article-toc')) return;
    var headings = Array.prototype.slice.call(body.querySelectorAll('h2'));
    if (headings.length < 3) return; // not worth a TOC for short articles

    var usedIds = {};
    var items = headings.map(function (h) {
      var text = h.textContent.trim();
      var base = slugify(text) || 'section';
      var id = base;
      var n = 1;
      while (usedIds[id]) { id = base + '-' + (++n); }
      usedIds[id] = true;
      if (!h.id) h.id = id;
      return { id: h.id, text: text };
    });

    var toc = document.createElement('details');
    toc.id = 'article-toc';
    toc.open = true;
    var listHtml = items.map(function (it) {
      return '<li><a href="#' + it.id + '">' + it.text + '</a></li>';
    }).join('');
    toc.innerHTML = '<summary>📋 Table of Contents</summary><ul>' + listHtml + '</ul>';

    var shareRow = document.querySelector('.share-row');
    if (shareRow) {
      shareRow.insertAdjacentElement('afterend', toc);
    } else {
      body.insertBefore(toc, body.firstChild);
    }
  }

  function init() {
    injectStyles();
    addProgressBar();
    addShareRow();
    addTOC();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
