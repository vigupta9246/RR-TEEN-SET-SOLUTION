/* R.R Teen Set Solution - PEB cost estimate PDF (client side, jsPDF).
   Used by peb-cost-calculator.html. Exposes window.RRPebPdf.build(data) and .download(data).
   All text is plain Latin-1 on purpose: jsPDF's built-in fonts have no Rupee glyph, so amounts use "Rs.". */
(function () {
  'use strict';

  var FT = 0.3048;
  var PW = 595.28, PH = 841.89, M = 36, CW = PW - 2 * M;
  var C = {
    navy: [11, 20, 55], blue: [64, 86, 161], orange: [241, 60, 32], amber: [255, 194, 26],
    panel: [243, 245, 252], line: [221, 226, 240], gray: [85, 96, 122], white: [255, 255, 255],
    teal: [43, 185, 160], green: [30, 150, 90], red: [210, 60, 50], sky: [208, 218, 246]
  };
  var SPLIT_COLORS = [[64, 86, 161], [43, 185, 160], [255, 194, 26], [242, 139, 154], [150, 164, 232], [107, 122, 153]];
  var PHONE = '+91 85272 58462', WA = 'https://wa.me/918527258462', EMAIL = 'info@rrteensetsolution.com',
      SITE = 'rrteensetsolution.com', GST_NO = '07DJCPK0635M1Z5';
  var PHOTOS = [
    ['images/project-001.jpg', 'PEB steel frame under construction'],
    ['images/project-009.jpg', 'Open shed with truss roof'],
    ['images/project-018.jpg', 'Steel truss framing on site']
  ];
  var CLAD_L = { gi: 'Plain GI sheets', cc: 'Colour-coated sheets', pu: 'PUF sandwich panels' };
  var CRANE_L = { none: 'No crane', c5: 'Crane up to 5 tonne', c10: 'Crane up to 10 tonne' };
  var STOREY_L = { single: 'Single storey', multi: 'Multi-storey' };

  /* ---------- formatting ---------- */
  function money(n) {
    if (n >= 1e7) return (n / 1e7).toFixed(2) + ' crore';
    if (n >= 1e5) return (n / 1e5).toFixed(1) + ' lakh';
    return Math.round(n).toLocaleString('en-IN');
  }
  function rs(n) { return 'Rs. ' + money(n); }
  function rng(lo, hi) {
    if (hi >= 1e7 && lo < 1e7) return 'Rs. ' + (lo / 1e5).toFixed(1) + ' lakh to ' + (hi / 1e7).toFixed(2) + ' crore';
    if (hi >= 1e7) return 'Rs. ' + (lo / 1e7).toFixed(2) + ' to ' + (hi / 1e7).toFixed(2) + ' crore';
    if (hi >= 1e5) return 'Rs. ' + (lo / 1e5).toFixed(1) + ' to ' + (hi / 1e5).toFixed(1) + ' lakh';
    return 'Rs. ' + Math.round(lo).toLocaleString('en-IN') + ' to ' + Math.round(hi).toLocaleString('en-IN');
  }
  function sq(n) { return Math.round(n).toLocaleString('en-IN'); }
  function dstr(d) { return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  function ascii(t) { return String(t).replace(/[^\x20-\x7E\xA0-\xFF]/g, ''); }

  /* ---------- images ---------- */
  function loadImg(src) {
    return new Promise(function (res, rej) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { rej(new Error('image ' + src)); };
      im.src = src;
    });
  }
  function logoData() {
    return loadImg('images/rr-logo-original.png').then(function (im) {
      var c = document.createElement('canvas');
      c.width = im.naturalWidth; c.height = im.naturalHeight;
      var x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(im, 0, 0);
      return { data: c.toDataURL('image/png'), ratio: c.width / c.height };
    }).catch(function () { return null; });
  }
  function coverJpeg(src, ratio) {
    return loadImg(src).then(function (im) {
      var tw = 760, th = Math.round(tw / ratio);
      var c = document.createElement('canvas'); c.width = tw; c.height = th;
      var x = c.getContext('2d');
      var sc = Math.max(tw / im.naturalWidth, th / im.naturalHeight);
      var sw = tw / sc, sh = th / sc;
      x.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) / 2, sw, sh, 0, 0, tw, th);
      return c.toDataURL('image/jpeg', 0.82);
    }).catch(function () { return null; });
  }

  /* ---------- drawing helpers ---------- */
  function fill(doc, c) { doc.setFillColor(c[0], c[1], c[2]); }
  function stroke(doc, c) { doc.setDrawColor(c[0], c[1], c[2]); }
  function ink(doc, c) { doc.setTextColor(c[0], c[1], c[2]); }
  function font(doc, style, size) { doc.setFont('helvetica', style); doc.setFontSize(size); }

  function sectionTitle(doc, text, x, y) {
    font(doc, 'bold', 12.5); ink(doc, C.navy); doc.text(text, x, y);
    fill(doc, C.orange); doc.rect(x, y + 5, 30, 2.6, 'F');
  }
  function tick(doc, x, y, color) {
    stroke(doc, color); doc.setLineWidth(1.5);
    doc.line(x, y - 1, x + 2.6, y + 1.8); doc.line(x + 2.6, y + 1.8, x + 7.2, y - 4);
  }
  function cross(doc, x, y, color) {
    stroke(doc, color); doc.setLineWidth(1.5);
    doc.line(x, y - 4, x + 6, y + 2); doc.line(x + 6, y - 4, x, y + 2);
  }
  function footer(doc, n, total, ref) {
    stroke(doc, C.line); doc.setLineWidth(0.8); doc.line(M, PH - 38, PW - M, PH - 38);
    font(doc, 'normal', 7.8); ink(doc, C.gray);
    doc.text('R.R Teen Set Solution  |  GST ' + GST_NO + '  |  ' + SITE, M, PH - 25);
    doc.text('Ref ' + ref + '   |   Page ' + n + ' of ' + total, PW - M, PH - 25, { align: 'right' });
  }
  function header(doc, logo, d, big) {
    var h = big ? 100 : 54;
    fill(doc, C.navy); doc.rect(0, 0, PW, h, 'F');
    fill(doc, C.orange); doc.rect(0, h, PW, 4, 'F');
    var bw = big ? 124 : 86, bh = big ? 58 : 36, by = big ? 21 : 9;
    fill(doc, C.white); doc.roundedRect(M, by, bw, bh, 7, 7, 'F');
    if (logo) {
      var lh = bh - 12, lw = lh * logo.ratio;
      if (lw > bw - 14) { lw = bw - 14; lh = lw / logo.ratio; }
      doc.addImage(logo.data, 'PNG', M + (bw - lw) / 2, by + (bh - lh) / 2, lw, lh);
    } else {
      font(doc, 'bold', 10); ink(doc, C.navy); doc.text('R.R TEEN SET', M + 10, by + bh / 2 + 3);
    }
    ink(doc, C.white);
    if (big) {
      font(doc, 'bold', 21); doc.text('PEB Cost Estimate', PW - M, 40, { align: 'right' });
      font(doc, 'normal', 9.5); ink(doc, C.amber);
      doc.text('Pre-engineered steel buildings  |  Delhi NCR', PW - M, 56, { align: 'right' });
      font(doc, 'normal', 8.6); ink(doc, [205, 213, 240]);
      doc.text('Ref ' + d.ref + '   |   Generated ' + dstr(d.today) + '   |   Valid till ' + dstr(d.valid), PW - M, 74, { align: 'right' });
    } else {
      font(doc, 'bold', 12); doc.text('PEB Cost Estimate (continued)', PW - M, 28, { align: 'right' });
      font(doc, 'normal', 8.4); ink(doc, [205, 213, 240]);
      doc.text('Ref ' + d.ref + '   |   ' + d.sizeTxt, PW - M, 42, { align: 'right' });
    }
  }

  /* isometric portal-frame drawing, same geometry as the on-page illustration */
  function drawFrame(doc, bx, by, sc, Wf, Hf, bays) {
    var Wp = 190 + (Wf - 30) / 270 * 210, Hp = 60 + (Hf - 12) / 38 * 90, rise = 14 + Wp * 0.06;
    var n = Math.max(2, Math.min(8, bays)), dx = 110 / (n - 1), dy = -60 / (n - 1);
    var gx = Math.max(36, (560 - Wp - 110) / 2), gy = 262;
    var ye = Hp, yr = Hp + rise, xm = Wp / 2, xr = Wp, bk = n - 1;
    function P(i, x, y) { return [bx + (gx + x + dx * i) * sc, by + (gy - y + dy * i) * sc]; }
    function poly(pts, style) {
      var rel = [];
      for (var k = 1; k < pts.length; k++) rel.push([pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]]);
      doc.lines(rel, pts[0][0], pts[0][1], [1, 1], style, style !== 'S');
    }
    function line(a, b) { doc.line(a[0], a[1], b[0], b[1]); }
    doc.setLineJoin('round'); doc.setLineCap('round');
    /* floor and roof planes */
    fill(doc, [231, 235, 247]); stroke(doc, [190, 200, 230]); doc.setLineWidth(0.5);
    poly([P(0, 0, 0), P(0, xr, 0), P(bk, xr, 0), P(bk, 0, 0)], 'FD');
    fill(doc, [214, 223, 247]);
    poly([P(0, 0, ye), P(0, xm, yr), P(bk, xm, yr), P(bk, 0, ye)], 'FD');
    fill(doc, [200, 212, 244]);
    poly([P(0, xm, yr), P(0, xr, ye), P(bk, xr, ye), P(bk, xm, yr)], 'FD');
    /* purlin runs */
    stroke(doc, [140, 156, 214]); doc.setLineWidth(0.6);
    [[0, ye], [xm, yr], [xr, ye]].forEach(function (p) { line(P(0, p[0], p[1]), P(bk, p[0], p[1])); });
    /* frames, back to front */
    for (var i = bk; i >= 0; i--) {
      var pts = [P(i, 0, 0), P(i, 0, ye), P(i, xm, yr), P(i, xr, ye), P(i, xr, 0)];
      if (i === 0) { stroke(doc, C.navy); doc.setLineWidth(2); } else { stroke(doc, [120, 138, 205]); doc.setLineWidth(0.9); }
      poly(pts, 'S');
    }
    /* knee braces on the front frame */
    stroke(doc, C.blue); doc.setLineWidth(1.2);
    line(P(0, 0, ye - Hp * 0.28), P(0, Wp * 0.1, ye));
    line(P(0, xr, ye - Hp * 0.28), P(0, xr - Wp * 0.1, ye));
    /* purlin dots on the front roof plane */
    fill(doc, C.orange);
    for (var j = 1; j <= 4; j++) {
      var t = j / 5, a = P(0, xm * t, ye + (yr - ye) * t), b = P(0, xm + xm * t, yr - (yr - ye) * t);
      doc.circle(a[0], a[1], 1.7, 'F'); doc.circle(b[0], b[1], 1.7, 'F');
    }
    /* dimension lines */
    var yd = gy + 34, d1 = [bx + gx * sc, by + yd * sc], d2 = [bx + (gx + Wp) * sc, by + yd * sc];
    stroke(doc, C.orange); fill(doc, C.orange); doc.setLineWidth(0.9);
    doc.line(d1[0], d1[1], d2[0], d2[1]);
    doc.triangle(d1[0], d1[1], d1[0] + 5, d1[1] - 2.4, d1[0] + 5, d1[1] + 2.4, 'F');
    doc.triangle(d2[0], d2[1], d2[0] - 5, d2[1] - 2.4, d2[0] - 5, d2[1] + 2.4, 'F');
    font(doc, 'bold', 7.8); ink(doc, C.navy);
    doc.text(Math.round(Wf) + ' ft (' + (Wf * FT).toFixed(1) + ' m) clear span', (d1[0] + d2[0]) / 2, d1[1] + 11, { align: 'center' });
    var xd = bx + (gx - 16) * sc, yb = by + gy * sc, yt = by + (gy - Hp) * sc;
    doc.line(xd, yb, xd, yt);
    doc.triangle(xd, yt, xd - 2.4, yt + 5, xd + 2.4, yt + 5, 'F');
    doc.triangle(xd, yb, xd - 2.4, yb - 5, xd + 2.4, yb - 5, 'F');
    doc.text(Math.round(Hf) + ' ft eave', xd - 5, (yb + yt) / 2 + 14, { angle: 90 });
  }

  /* ---------- the document ---------- */
  function build(d) {
    var JS = window.jspdf && window.jspdf.jsPDF;
    if (!JS) return Promise.reject(new Error('jsPDF missing'));
    var s = d.s, r = d.r;
    d.today = new Date(); d.valid = new Date(d.today.getTime() + 7 * 864e5);
    var yy = String(d.today.getFullYear()).slice(2), mm = ('0' + (d.today.getMonth() + 1)).slice(-2), dd = ('0' + d.today.getDate()).slice(-2);
    d.ref = 'RRPEB-' + yy + mm + dd + '-' + String(Math.floor(1000 + Math.random() * 9000));
    d.sizeTxt = s.len + ' x ' + s.wid + ' ft, ' + s.ht + ' ft eave';
    var ratio = 166 / 100;

    return Promise.all([logoData()].concat(PHOTOS.map(function (p) { return coverJpeg(p[0], ratio); }))).then(function (assets) {
      var logo = assets[0], photos = assets.slice(1);
      var doc = new JS({ unit: 'pt', format: 'a4', compress: true });
      doc.setProperties({ title: 'PEB Cost Estimate - R.R Teen Set Solution', subject: 'Planning estimate for a pre-engineered steel building, Delhi NCR',
        author: 'R.R Teen Set Solution', keywords: 'PEB, steel building, cost estimate, Delhi NCR', creator: SITE });

      /* ===== PAGE 1 ===== */
      header(doc, logo, d, true);

      /* summary card */
      var y = 124;
      fill(doc, C.navy); doc.roundedRect(M, y, CW, 108, 9, 9, 'F');
      fill(doc, C.orange); doc.roundedRect(M, y, 5, 108, 2.5, 2.5, 'F');
      font(doc, 'bold', 8.6); ink(doc, [160, 175, 230]); doc.text('ESTIMATED PEB COST', M + 22, y + 24);
      font(doc, 'bold', 25); ink(doc, C.amber); doc.text(rng(r.tLo, r.tHi), M + 22, y + 56);
      font(doc, 'normal', 9.6); ink(doc, [225, 230, 248]);
      doc.text('About ' + rng(r.rLo, r.rHi) + ' per sq ft', M + 22, y + 76);
      font(doc, 'normal', 8.8); ink(doc, [170, 182, 232]);
      doc.text((s.found ? 'Foundation and floor slab included' : 'Foundation not included') + '   |   ' + (s.gst ? 'GST included' : 'GST extra'), M + 22, y + 92);
      /* right mini stats */
      var rx = PW - M - 128;
      stroke(doc, [60, 76, 140]); doc.setLineWidth(0.8); doc.line(rx - 12, y + 18, rx - 12, y + 90);
      font(doc, 'normal', 8); ink(doc, [160, 175, 230]); doc.text('BUILT-UP AREA', rx, y + 28);
      font(doc, 'bold', 15); ink(doc, C.white); doc.text(sq(r.area) + ' sq ft', rx, y + 46);
      font(doc, 'normal', 8); ink(doc, [160, 175, 230]); doc.text('(' + sq(r.area * 0.092903) + ' sq m)', rx, y + 58);
      font(doc, 'normal', 8); ink(doc, [160, 175, 230]); doc.text('FRAMES AT 6 M BAYS', rx, y + 80);
      font(doc, 'bold', 11); ink(doc, C.white); doc.text(String(r.bays), rx + 98, y + 80);

      /* specification grid */
      y = 262; sectionTitle(doc, 'Building specification', M, y);
      var spec = [
        ['Building size', s.len + ' ft x ' + s.wid + ' ft  (' + (s.len * FT).toFixed(1) + ' m x ' + (s.wid * FT).toFixed(1) + ' m)'],
        ['Rate band', d.tierLabel],
        ['Clear span (width)', s.wid + ' ft  (' + (s.wid * FT).toFixed(1) + ' m)'],
        ['Eave height', s.ht + ' ft  (' + (s.ht * FT).toFixed(1) + ' m)'],
        ['Roof and wall cladding', CLAD_L[s.clad] || s.clad],
        ['Crane inside the building', CRANE_L[s.crane] || s.crane],
        ['Floors', STOREY_L[s.storey] || s.storey],
        ['Site location', d.locLabel],
        ['Foundation and floor slab', s.found ? 'Included (Rs. 150 to 350 per sq ft)' : 'Not included'],
        ['GST at 18 percent', s.gst ? 'Included in the estimate' : 'Extra, not included']
      ];
      var gy0 = y + 18, rh = 33, colW = CW / 2;
      for (var i = 0; i < spec.length; i++) {
        var col = i % 2, row = Math.floor(i / 2), cx = M + col * colW, cy = gy0 + row * rh;
        if (col === 0 && row % 2 === 0) { fill(doc, C.panel); doc.rect(M, cy, CW, rh, 'F'); }
        font(doc, 'bold', 7.4); ink(doc, C.gray); doc.text(ascii(spec[i][0]).toUpperCase(), cx + 10, cy + 13);
        font(doc, 'bold', 9.8); ink(doc, C.navy); doc.text(ascii(spec[i][1]), cx + 10, cy + 26);
      }
      stroke(doc, C.line); doc.setLineWidth(0.8); doc.rect(M, gy0, CW, rh * 5, 'S');

      /* illustration */
      y = gy0 + rh * 5 + 26; sectionTitle(doc, 'Your building at a glance', M, y);
      var ib = y + 14, ih = 188;
      fill(doc, [250, 251, 255]); stroke(doc, C.line); doc.setLineWidth(0.8); doc.roundedRect(M, ib, CW, ih, 8, 8, 'FD');
      var sc = Math.min((CW * 0.62) / 560, (ih - 22) / 322);
      drawFrame(doc, M + 14, ib + 8, sc, s.wid, s.ht, r.bays);
      var tx = M + CW * 0.66, ty = ib + 28;
      font(doc, 'bold', 9.6); ink(doc, C.navy); doc.text('Reading the drawing', tx, ty);
      font(doc, 'normal', 8.8); ink(doc, C.gray);
      var note = doc.splitTextToSize(ascii('The steel portal frames carry the roof over a clear span with no columns inside. Frames repeat about every 6 m along the ' +
        s.len + ' ft length. Orange dots show the roof purlins that carry the sheeting.'), CW * 0.32);
      doc.text(note, tx, ty + 15);
      font(doc, 'italic', 7.8); ink(doc, C.gray);
      doc.text('Illustration, not to scale.', tx, ib + ih - 12);

      /* why us */
      y = ib + ih + 24; sectionTitle(doc, 'Why R.R Teen Set Solution', M, y);
      var why = ['GST-registered steel fabricator working in Delhi NCR since 2016', 'IS-grade steel, frames designed for Delhi NCR wind and Seismic Zone IV (IS 1893)',
        '500+ projects delivered across Delhi NCR, rated 5.0 on IndiaMART', 'Free site visit, then a written quotation with drawings'];
      font(doc, 'normal', 9.2);
      why.forEach(function (t, k) {
        var wy = y + 24 + k * 15;
        tick(doc, M + 2, wy - 2, C.green); ink(doc, C.navy); doc.text(ascii(t), M + 16, wy);
      });
      footer(doc, 1, 2, d.ref);

      /* ===== PAGE 2 ===== */
      doc.addPage();
      header(doc, logo, d, false);

      y = 84; sectionTitle(doc, 'Where the money goes', M, y);
      var total = r.parts.reduce(function (a, b) { return a + b; }, 0), bxp = M, byp = y + 16;
      stroke(doc, C.white); doc.setLineWidth(0.6);
      r.pct.forEach(function (p, k) {
        var w = CW * p / 100; fill(doc, SPLIT_COLORS[k % 6]); doc.rect(bxp, byp, w, 15, 'F'); bxp += w;
      });
      var ly = byp + 36;
      r.parts.forEach(function (amt, k) {
        var yy2 = ly + k * 18;
        if (k % 2 === 0) { fill(doc, C.panel); doc.rect(M, yy2 - 12, CW, 18, 'F'); }
        fill(doc, SPLIT_COLORS[k % 6]); doc.roundedRect(M + 8, yy2 - 8, 9, 9, 2, 2, 'F');
        font(doc, 'normal', 9.4); ink(doc, C.navy); doc.text(ascii(d.names[k]), M + 26, yy2);
        font(doc, 'bold', 9.4); doc.text(Math.round(r.pct[k]) + '%', M + CW - 120, yy2, { align: 'right' });
        doc.text(rs(amt), M + CW - 10, yy2, { align: 'right' });
      });
      var ny = ly + r.parts.length * 18 + 2;
      font(doc, 'italic', 7.9); ink(doc, C.gray);
      doc.text('Indicative split of the mid-range estimate (' + rs(total) + ' before GST). Not a quotation.', M, ny);

      /* photos */
      y = ny + 24; sectionTitle(doc, 'Recent PEB and steel shed work', M, y);
      var pw3 = (CW - 24) / 3, ph3 = pw3 / ratio, py = y + 16;
      photos.forEach(function (p, k) {
        var px = M + k * (pw3 + 12);
        if (p) {
          doc.addImage(p, 'JPEG', px, py, pw3, ph3, undefined, 'FAST');
        } else { fill(doc, C.panel); doc.rect(px, py, pw3, ph3, 'F'); }
        stroke(doc, C.line); doc.setLineWidth(0.8); doc.rect(px, py, pw3, ph3, 'S');
        font(doc, 'bold', 8.4); ink(doc, C.navy); doc.text(PHOTOS[k][1], px, py + ph3 + 13);
      });
      font(doc, 'italic', 7.6); ink(doc, C.gray);
      doc.text('Photos from R.R Teen Set Solution project gallery.', M, py + ph3 + 27);

      /* included / not included */
      y = py + ph3 + 46; sectionTitle(doc, 'What this estimate covers', M, y);
      var inc = ['Structural design and fabrication drawings', 'Main steel frames, purlins, girts and bracing',
        (CLAD_L[s.clad] || 'Roof and wall sheeting') + ' for roof and walls', 'Gutters, flashing and ventilators', 'Fabrication, transport and erection at site'];
      if (s.crane !== 'none') inc.splice(2, 0, 'Frame strengthening for the selected crane');
      if (s.found) inc.push('Civil foundation and floor slab');
      var exc = ['Electrical, plumbing and interior finishing', 'Land levelling and soil investigation', 'Statutory approvals (unless agreed)'];
      if (!s.gst) exc.splice(1, 0, 'GST at 18 percent');
      if (!s.found) exc.splice(1, 0, 'Foundation and floor slab');
      var half = CW / 2 - 8, iy = y + 24;
      font(doc, 'bold', 8.4); ink(doc, C.green); doc.text('INCLUDED', M, iy);
      ink(doc, C.red); doc.text('NOT INCLUDED', M + half + 16, iy);
      font(doc, 'normal', 8.9);
      var yl = iy + 15, yr = iy + 15;
      inc.forEach(function (t) {
        var lines = doc.splitTextToSize(ascii(t), half - 16); tick(doc, M + 1, yl - 2, C.green); ink(doc, C.navy);
        doc.text(lines, M + 15, yl); yl += lines.length * 11.5 + 3;
      });
      exc.forEach(function (t) {
        var lines = doc.splitTextToSize(ascii(t), half - 16); cross(doc, M + half + 17, yr - 2, C.red); ink(doc, C.navy);
        doc.text(lines, M + half + 31, yr); yr += lines.length * 11.5 + 3;
      });

      /* process */
      y = Math.max(yl, yr) + 12; sectionTitle(doc, 'From estimate to finished building', M, y);
      var steps = [['Free site visit', 'Plot, access, soil and use'], ['Design and drawings', 'Wind and seismic checks'], ['Factory fabrication', 'Frames cut and welded'],
        ['Erection at site', 'Lifted, bolted, braced'], ['Sheeting and handover', 'Cladding and GST invoice']];
      var sw = CW / 5, sy = y + 30;
      stroke(doc, C.line); doc.setLineWidth(1.4); doc.line(M + sw / 2, sy, M + CW - sw / 2, sy);
      steps.forEach(function (st, k) {
        var cx2 = M + sw * k + sw / 2;
        fill(doc, C.blue); doc.circle(cx2, sy, 10, 'F');
        font(doc, 'bold', 10); ink(doc, C.white); doc.text(String(k + 1), cx2, sy + 3.6, { align: 'center' });
        font(doc, 'bold', 8.2); ink(doc, C.navy); doc.text(st[0], cx2, sy + 24, { align: 'center' });
        font(doc, 'normal', 7.4); ink(doc, C.gray); doc.text(st[1], cx2, sy + 35, { align: 'center' });
      });

      /* contact block */
      y = sy + 52; var cbH = 78;
      fill(doc, C.navy); doc.roundedRect(M, y, CW, cbH, 9, 9, 'F');
      fill(doc, C.orange); doc.roundedRect(M, y, 5, cbH, 2.5, 2.5, 'F');
      font(doc, 'bold', 12); ink(doc, C.amber); doc.text('Get this estimate checked by a fabricator, free', M + 20, y + 22);
      font(doc, 'normal', 9.2); ink(doc, [225, 230, 248]);
      doc.text('Call / WhatsApp  ' + PHONE + '     Email  ' + EMAIL, M + 20, y + 40);
      doc.text('Najafgarh, New Delhi  |  Mon to Sat, 9 AM to 7 PM  |  ' + SITE, M + 20, y + 54);
      var msg = encodeURIComponent('Hello R.R Teen Set Solution, I got a PEB estimate (' + d.ref + ') for ' + d.sizeTxt + ': ' + rng(r.tLo, r.tHi) + '. Please arrange a site visit.');
      fill(doc, C.amber); doc.roundedRect(M + 20, y + 60, 128, 13, 4, 4, 'F');
      font(doc, 'bold', 7.8); ink(doc, C.navy); doc.text('Chat on WhatsApp', M + 84, y + 69.2, { align: 'center' });
      doc.link(M + 20, y + 60, 128, 13, { url: WA + '?text=' + msg });
      if (d.url) {
        stroke(doc, C.amber); doc.setLineWidth(0.9); doc.roundedRect(M + 158, y + 60, 150, 13, 4, 4, 'S');
        ink(doc, C.amber); doc.text('Reopen this estimate online', M + 233, y + 69.2, { align: 'center' });
        doc.link(M + 158, y + 60, 150, 13, { url: d.url });
      }
      font(doc, 'italic', 7.6); ink(doc, C.gray);
      var disc = doc.splitTextToSize('Planning-stage estimate from the R.R Teen Set Solution PEB cost calculator, based on indicative 2026 Delhi NCR rate bands. ' +
        'The final price is confirmed only after a site visit, soil details, loads and drawings. Prices exclude GST unless stated above.', CW);
      doc.text(disc, M, y + cbH + 16);
      footer(doc, 2, 2, d.ref);
      return doc;
    });
  }

  function fileName(d) {
    var t = new Date(), p = function (n) { return ('0' + n).slice(-2); };
    return 'RR-Teen-Set-PEB-Estimate-' + d.s.len + 'x' + d.s.wid + 'ft-' + t.getFullYear() + p(t.getMonth() + 1) + p(t.getDate()) + '.pdf';
  }
  window.RRPebPdf = {
    build: build,
    download: function (d) { return build(d).then(function (doc) { doc.save(fileName(d)); return doc; }); }
  };
})();
