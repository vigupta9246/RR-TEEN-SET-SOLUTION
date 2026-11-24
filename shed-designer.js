/* Shed Designer: live drawings (3D, front, side, plan) and a planning estimate. No dependencies. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var NS = 'http://www.w3.org/2000/svg';

  var PRESETS = {
    terrace:  { name: 'Terrace cover',   L: 30, W: 20, E: 10, roof: 'lean',   slope: 10, bay: 15, walls: 'open',  grade: 'tin',  doors: 0, cars: false },
    parking:  { name: 'Car parking',     L: 27, W: 18, E: 9,  roof: 'cant',   slope: 10, bay: 18, walls: 'open',  grade: 'tin',  doors: 0, cars: true },
    godown:   { name: 'Godown or store', L: 40, W: 25, E: 12, roof: 'gable',  slope: 10, bay: 15, walls: 'closed', grade: 'tin', doors: 1, cars: false },
    workshop: { name: 'Workshop',        L: 50, W: 30, E: 14, roof: 'ridge',  slope: 10, bay: 20, walls: 'sides', grade: 'ind',  doors: 1, cars: false },
    warehouse:{ name: 'Warehouse',       L: 100, W: 50, E: 20, roof: 'gable', slope: 10, bay: 25, walls: 'closed', grade: 'pre', doors: 2, cars: false },
    factory:  { name: 'Factory',         L: 120, W: 60, E: 22, roof: 'multi', slope: 10, bay: 25, walls: 'closed', grade: 'peb', doors: 2, cars: false },
    shop:     { name: 'Shop front cover',L: 24, W: 10, E: 10, roof: 'lean',   slope: 10, bay: 12, walls: 'open',  grade: 'tin',  doors: 0, cars: false }
  };
  var GRADES = {
    tin: { n: 'Tin shed', lo: 150, hi: 220 }, ind: { n: 'Industrial shed', lo: 200, hi: 300 },
    pre: { n: 'Prefab warehouse', lo: 240, hi: 340 }, peb: { n: 'PEB structure', lo: 250, hi: 450 }
  };
  var ROOFS = { lean: 'Single slope (lean-to)', gable: 'Gable (two slopes)', cant: 'Cantilever (columns on one side)', ridge: 'Gable with raised ridge', multi: 'Multi-span (M shape)' };
  var COLOURS = {
    blue: ['Blue', '#2f62b3', 1], red: ['Brick red', '#b5412f', 1], green: ['Green', '#2f7d52', 1],
    grey: ['Grey', '#7d8895', 1], white: ['White', '#eef1f4', 1], silver: ['Plain silver', '#b7c0ca', 0]
  };
  var SLOPES = { 10: '1 in 10 (flattest for sheets)', 8: '1 in 8', 6: '1 in 6', 4: '1 in 4 (steep)' };

  var S = { p: 'warehouse', L: 100, W: 50, E: 20, roof: 'gable', slope: 10, bay: 25, walls: 'closed', grade: 'pre',
    doors: 2, spans: 2, colour: 'blue', ins: 0, vent: 0, win: 0, rust: 0, cars: false, view: '3d' };

  /* ---------- helpers ---------- */
  function el(n, a, parent) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (parent) parent.appendChild(e); return e; }
  function f1(n) { return (Math.round(n * 10) / 10).toString(); }
  function inr(n) {
    n = Math.round(n); var s = String(n), l = s.slice(-3), r = s.slice(0, -3);
    if (r) l = ',' + l; return '₹' + r.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + l;
  }
  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var m = function (c) { return Math.max(0, Math.min(255, Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k)))); };
    return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
  }
  function INK() { return getComputedStyle(document.documentElement).getPropertyValue('--av-ink').trim() || '#16264f'; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- geometry ---------- */
  function model() {
    var W = S.W, E = S.E, s = 1 / S.slope, n = 1, prof = [], cols = [], rise, top;
    var r = S.roof;
    if (r === 'lean') { rise = W * s; prof = [[0, E + rise], [W, E]]; cols = [0, W]; top = E + rise; }
    else if (r === 'cant') { rise = W * s; prof = [[0, E + rise], [W, E]]; cols = [0]; top = E + rise; }
    else if (r === 'gable') { rise = W / 2 * s; prof = [[0, E], [W / 2, E + rise], [W, E]]; cols = [0, W]; top = E + rise; }
    else if (r === 'ridge') {
      var m = Math.max(6, W * 0.12), z1 = E + (W / 2 - m / 2) * s; rise = W / 2 * s;
      prof = [[0, E], [W / 2 - m / 2, z1], [W / 2 - m / 2, z1 + 3], [W / 2 + m / 2, z1 + 3], [W / 2 + m / 2, z1], [W, E]];
      cols = [0, W]; top = z1 + 3;
    } else {
      n = S.spans; rise = W / n / 2 * s; prof = [[0, E]];
      for (var i = 0; i < n; i++) { prof.push([W / n * (i + .5), E + rise]); prof.push([W / n * (i + 1), E]); cols.push(W / n * i); }
      cols.push(W); top = E + rise;
    }
    var bays = Math.max(1, Math.ceil(S.L / S.bay)), bx = [];
    for (var j = 0; j <= bays; j++) bx.push(S.L * j / bays);
    var area = S.L * S.W, slopeF = Math.sqrt(1 + s * s);
    var rowsN = cols.length;
    return { prof: prof, cols: cols, rise: rise, top: top, bays: bays, bx: bx, area: area, sheet: area * slopeF, nCols: bx.length * rowsN, spans: n };
  }
  function zAt(prof, y) {
    for (var i = 0; i < prof.length - 1; i++) {
      var a = prof[i], b = prof[i + 1];
      if (y >= a[0] - 1e-6 && y <= b[0] + 1e-6) { if (b[0] === a[0]) return Math.min(a[1], b[1]); return a[1] + (b[1] - a[1]) * (y - a[0]) / (b[0] - a[0]); }
    }
    return prof[prof.length - 1][1];
  }
  function doorSpec() {
    var dw = 12, dh = Math.min(10, S.E - 1.5), maxN = Math.max(0, Math.floor((S.W - 2) / (dw + 2)));
    return { n: Math.min(S.doors, maxN), w: dw, h: dh };
  }
  function carGrid() { return { cx: Math.max(0, Math.floor(S.L / 9)), cy: Math.max(0, Math.floor(S.W / 18)) }; }

  /* ---------- estimate ---------- */
  function estimate(M) {
    var g = GRADES[S.grade], col = COLOURS[S.colour], ex = 0, items = [];
    if (col[2]) { ex += 10; items.push('colour-coated sheet +₹10'); }
    if (S.ins) { ex += 15; items.push('insulation +₹15'); }
    if (S.vent) { ex += 8; items.push('turbo ventilators +₹8'); }
    if (S.win) { ex += 12; items.push('windows +₹12'); }
    if (S.rust) { ex += 25; items.push('anti-rust coating +₹25'); }
    var dn = S.walls === 'closed' ? doorSpec().n : 0, dc = dn * 20000;
    var lo = M.area * (g.lo + ex) + dc, hi = M.area * (g.hi + ex) + dc;
    return { lo: lo, hi: hi, glo: lo * 1.18, ghi: hi * 1.18, items: items, doors: dn, g: g };
  }

  /* ---------- 3D view ---------- */
  function draw3d(M) {
    var svg = $('v3d'); svg.innerHTML = '';
    var L = S.L, W = S.W, k0 = 1, c30 = 0.8660254;
    var P = function (x, y, z) { return [(x - y) * c30, (x + y) * 0.5 - z]; };
    var zmax = M.top + 1, pts = [P(0, 0, 0), P(L, 0, 0), P(0, W, 0), P(L, W, 0), P(0, 0, zmax), P(L, 0, zmax), P(0, W, zmax), P(L, W, zmax)];
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    pts.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    var vw = 760, vh = 440, pad = 34, k = Math.min((vw - 2 * pad) / (x1 - x0), (vh - 2 * pad) / (y1 - y0));
    var ox = pad + ((vw - 2 * pad) - (x1 - x0) * k) / 2 - x0 * k, oy = pad + ((vh - 2 * pad) - (y1 - y0) * k) / 2 - y0 * k;
    svg.setAttribute('viewBox', '0 0 ' + vw + ' ' + vh);
    var T = function (x, y, z) { var p = P(x, y, z); return [ox + p[0] * k, oy + p[1] * k]; };
    var poly = function (arr, fill, stroke, sw, extra) {
      var d = arr.map(function (q) { var t = T(q[0], q[1], q[2]); return f1(t[0]) + ',' + f1(t[1]); }).join(' ');
      var a = { points: d, fill: fill, stroke: stroke || 'none', 'stroke-width': sw || 1, 'stroke-linejoin': 'round' };
      for (var kk in extra) a[kk] = extra[kk];
      return el('polygon', a, svg);
    };
    var line = function (a, b, stroke, sw, dash) {
      var p = T(a[0], a[1], a[2]), q = T(b[0], b[1], b[2]);
      return el('line', { x1: f1(p[0]), y1: f1(p[1]), x2: f1(q[0]), y2: f1(q[1]), stroke: stroke, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-dasharray': dash || '' }, svg);
    };
    var ink = getComputedStyle(document.documentElement).getPropertyValue('--av-ink').trim() || '#16264f';
    var base = COLOURS[S.colour][1];
    /* ground */
    poly([[-3, -3, 0], [L + 3, -3, 0], [L + 3, W + 3, 0], [-3, W + 3, 0]], 'rgba(120,130,120,.14)', 'rgba(120,130,120,.35)', 1);
    /* slab line */
    poly([[0, 0, 0], [L, 0, 0], [L, W, 0], [0, W, 0]], 'rgba(120,120,120,.18)', 'rgba(90,90,90,.45)', 1);
    /* cars */
    if (S.cars) {
      var cg = carGrid(), nx = Math.min(cg.cx, 12), ny = Math.min(cg.cy, 4);
      var padx = (L - cg.cx * 9) / 2, pady = (W - cg.cy * 18) / 2, cCol = ['#d9d9d9', '#5b6b82', '#a33a3a', '#e6e2d0'];
      for (var a = 0; a < nx; a++) for (var b = 0; b < ny; b++) {
        var cx = padx + a * 9 + 1.5, cy = pady + b * 18 + 1.5, cl = 15, cw = 6, ch = 4.6, col = cCol[(a + b) % 4];
        poly([[cx, cy, 0], [cx + cw, cy, 0], [cx + cw, cy + cl, 0], [cx, cy + cl, 0]], 'rgba(0,0,0,.12)', 'none');
        poly([[cx, cy + cl, 0], [cx + cw, cy + cl, 0], [cx + cw, cy + cl, ch * .6], [cx, cy + cl, ch * .6]], shade(col, -.15));
        poly([[cx + cw, cy, 0], [cx + cw, cy + cl, 0], [cx + cw, cy + cl, ch * .6], [cx + cw, cy, ch * .6]], shade(col, -.3));
        poly([[cx, cy + 3, ch * .6], [cx + cw, cy + 3, ch * .6], [cx + cw, cy + cl - 3, ch * .6], [cx, cy + cl - 3, ch * .6]], col);
        poly([[cx + .6, cy + 4.5, ch * .6], [cx + cw - .6, cy + 4.5, ch * .6], [cx + cw - 1, cy + 9, ch], [cx + 1, cy + 9, ch]], shade(col, .25), 'none', 1, { 'fill-opacity': .9 });
        poly([[cx, cy, ch * .6], [cx + cw, cy, ch * .6], [cx + cw, cy + 3, ch * .6], [cx, cy + 3, ch * .6]], col);
      }
    }
    /* columns */
    var sw = clamp(M.nCols > 60 ? 1.4 : 2.2, 1, 3);
    M.bx.forEach(function (x) { M.cols.forEach(function (y) { line([x, y, 0], [x, y, zAt(M.prof, y)], ink, sw); }); });
    /* walls */
    if (S.walls !== 'open') {
      var wcol = '#d8dde3';
      var endWall = [[L, 0, 0]];
      M.prof.forEach(function (q) { endWall.push([L, q[0], q[1]]); });
      endWall.push([L, W, 0]);
      var sideH = zAt(M.prof, W);
      /* side face (y = W) */
      poly([[0, W, 0], [L, W, 0], [L, W, sideH], [0, W, sideH]], shade(wcol, -.08), 'rgba(0,0,0,.25)', 1);
      if (S.walls === 'closed') {
        poly(endWall, wcol, 'rgba(0,0,0,.25)', 1);
        var ds = doorSpec();
        for (var i = 0; i < ds.n; i++) {
          var gap = (W - ds.n * ds.w) / (ds.n + 1), y = gap + i * (ds.w + gap);
          poly([[L, y, 0], [L, y + ds.w, 0], [L, y + ds.w, ds.h], [L, y, ds.h]], shade('#4b5563', 0), '#222', 1);
          for (var r = 1; r < 4; r++) line([L, y + ds.w * r / 4, 0], [L, y + ds.w * r / 4, ds.h], 'rgba(255,255,255,.35)', .8);
        }
        if (S.win) {
          for (var wv = 0; wv < M.bays; wv++) {
            var xw = M.bx[wv] + (M.bx[wv + 1] - M.bx[wv]) / 2 - 2;
            poly([[xw, W, sideH - 5.5], [xw + 4, W, sideH - 5.5], [xw + 4, W, sideH - 2.5], [xw, W, sideH - 2.5]], 'rgba(120,180,230,.85)', '#33506f', .8);
          }
        }
      }
    }
    /* roof */
    var faces = [], pr = M.prof, i2;
    for (i2 = 0; i2 < pr.length - 1; i2++) {
      var A = pr[i2], B = pr[i2 + 1], vertical = Math.abs(B[0] - A[0]) < 1e-6;
      faces.push({ A: A, B: B, v: vertical, key: (A[0] + B[0]) / 2 + (vertical ? 0.001 : 0) });
    }
    faces.sort(function (a, b) { return a.key - b.key; });
    faces.forEach(function (fc) {
      var A = fc.A, B = fc.B, quad = [[0, A[0], A[1]], [L, A[0], A[1]], [L, B[0], B[1]], [0, B[0], B[1]]];
      if (fc.v) {
        poly(quad, 'rgba(255,111,0,.82)', '#7a3b00', 1);
        for (var q = 1; q < 6; q++) { var xx = L * q / 6; line([xx, A[0], Math.min(A[1], B[1])], [xx, A[0], Math.max(A[1], B[1])], 'rgba(60,30,0,.55)', 1.2); }
      } else {
        var down = B[1] < A[1] ? 1 : (B[1] > A[1] ? -1 : 0);
        var tone = down > 0 ? -.05 : (down < 0 ? -.22 : -.1);
        poly(quad, shade(base, tone), 'rgba(0,0,0,.35)', 1, S.cars ? { 'fill-opacity': .78 } : {});
        var nr = clamp(Math.round(L / 6), 4, 22);
        for (var q2 = 1; q2 < nr; q2++) { var x2 = L * q2 / nr; line([x2, A[0], A[1]], [x2, B[0], B[1]], 'rgba(0,0,0,.13)', .9); }
      }
    });
    /* roof cap on raised ridge top */
    if (S.roof === 'ridge') {
      var yy = pr[2][0], yy2 = pr[3][0], zt = pr[2][1];
      poly([[0, yy, zt], [L, yy, zt], [L, yy2, zt], [0, yy2, zt]], shade(base, -.3), '#222', 1);
    }
    /* turbo vents */
    if (S.vent) {
      var ridgeY = (S.roof === 'lean' || S.roof === 'cant') ? W * 0.15 : W / 2, nv = clamp(Math.round(L / 20), 1, 8);
      var zr = (S.roof === 'ridge') ? M.top : zAt(M.prof, ridgeY);
      if (S.roof === 'multi') ridgeY = W / M.spans / 2;
      zr = zAt(M.prof, ridgeY);
      for (var v = 0; v < nv; v++) {
        var xv = L * (v + .5) / nv, t = T(xv, ridgeY, zr);
        el('ellipse', { cx: f1(t[0]), cy: f1(t[1] - 5), rx: 6, ry: 6, fill: '#c9d2dc', stroke: '#33404f', 'stroke-width': 1 }, svg);
      }
    }
    /* north-free label */
    var lab = T(L / 2, W + 4, 0), l1 = T(L, W / 2, 0);
    var t1 = el('text', { x: f1(lab[0] - 40), y: f1(lab[1] + 16), class: 't' }, svg); t1.textContent = 'Length ' + S.L + ' ft';
    var t2 = el('text', { x: f1(l1[0] + 10), y: f1(l1[1] + 22), class: 't' }, svg); t2.textContent = 'Width ' + S.W + ' ft';
    var t3 = el('text', { x: 14, y: 24, class: 'ts' }, svg); t3.textContent = 'Highest point ' + f1(M.top) + ' ft above floor';
  }

  /* ---------- front (end) elevation ---------- */
  function drawFront(M) {
    var svg = $('vfront'); svg.innerHTML = '';
    var W = S.W, top = M.top, vw = 760, vh = 400, padL = 120, padR = 120, padT = 40, padB = 64;
    var k = Math.min((vw - padL - padR) / W, (vh - padT - padB) / top), ox = padL + ((vw - padL - padR) - W * k) / 2, gy = vh - padB;
    svg.setAttribute('viewBox', '0 0 ' + vw + ' ' + vh);
    var X = function (y) { return ox + y * k; }, Z = function (z) { return gy - z * k; };
    var ink = INK(), base = COLOURS[S.colour][1];
    el('rect', { x: ox - 30, y: gy, width: W * k + 60, height: 6, fill: 'rgba(120,120,120,.35)' }, svg);
    if (S.walls === 'closed') {
      var d = 'M' + f1(X(0)) + ',' + f1(Z(0));
      M.prof.forEach(function (q) { d += ' L' + f1(X(q[0])) + ',' + f1(Z(q[1])); });
      d += ' L' + f1(X(W)) + ',' + f1(Z(0)) + ' Z';
      el('path', { d: d, fill: '#dde2e8', stroke: 'rgba(0,0,0,.3)' }, svg);
      var ds = doorSpec();
      for (var i = 0; i < ds.n; i++) {
        var gap = (W - ds.n * ds.w) / (ds.n + 1), y = gap + i * (ds.w + gap);
        el('rect', { x: f1(X(y)), y: f1(Z(ds.h)), width: f1(ds.w * k), height: f1(ds.h * k), fill: '#4b5563', stroke: '#222' }, svg);
      }
    } else if (S.walls === 'sides') {
      /* end open: show the frame only */
    }
    /* columns */
    M.cols.forEach(function (y) { el('line', { x1: f1(X(y)), x2: f1(X(y)), y1: f1(Z(0)), y2: f1(Z(zAt(M.prof, y))), stroke: ink, 'stroke-width': Math.max(3, k * .5) }, svg); });
    /* roof */
    var pts = M.prof.map(function (q) { return f1(X(q[0])) + ',' + f1(Z(q[1])); }).join(' ');
    el('polyline', { points: pts, fill: 'none', stroke: base, 'stroke-width': 7, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
    if (S.roof === 'ridge') {
      var a = M.prof[2], b = M.prof[3], c0 = M.prof[1];
      el('rect', { x: f1(X(a[0])), y: f1(Z(a[1])), width: f1((b[0] - a[0]) * k), height: f1(3 * k), fill: 'rgba(255,111,0,.7)', stroke: '#7a3b00' }, svg);
    }
    /* scale figure: person 5.5 ft */
    var px = X(W) + 100;
    el('circle', { cx: f1(px), cy: f1(Z(5.0)), r: f1(Math.max(2, .35 * k)), fill: '#555' }, svg);
    el('line', { x1: f1(px), y1: f1(Z(4.6)), x2: f1(px), y2: f1(Z(2.2)), stroke: '#555', 'stroke-width': Math.max(2, .5 * k) }, svg);
    el('line', { x1: f1(px), y1: f1(Z(2.2)), x2: f1(px), y2: f1(Z(0)), stroke: '#555', 'stroke-width': Math.max(2, .4 * k) }, svg);
    /* dimensions */
    dimH(svg, X(0), X(W), gy + 30, W + ' ft');
    dimV(svg, X(0) - 24, Z(0), Z(M.top), f1(M.top) + ' ft');
    var eaveZ = S.E; dimV(svg, X(W) + 20, Z(0), Z(eaveZ), 'eave ' + S.E + ' ft', true);
    var tt = el('text', { x: 14, y: 22, class: 'ts' }, svg); tt.textContent = 'Front view, looking at the end of the shed. Person shown at 5.5 ft for scale.';
  }
  function dimH(svg, x1, x2, y, txt) {
    el('line', { x1: f1(x1), y1: f1(y), x2: f1(x2), y2: f1(y), stroke: '#8a5d06', 'stroke-width': 1.3 }, svg);
    [x1, x2].forEach(function (x) { el('line', { x1: f1(x), y1: f1(y - 6), x2: f1(x), y2: f1(y + 6), stroke: '#8a5d06', 'stroke-width': 1.3 }, svg); });
    var t = el('text', { x: f1((x1 + x2) / 2), y: f1(y + 20), 'text-anchor': 'middle', class: 't' }, svg); t.textContent = txt;
  }
  function dimV(svg, x, y1, y2, txt, right) {
    el('line', { x1: f1(x), y1: f1(y1), x2: f1(x), y2: f1(y2), stroke: '#8a5d06', 'stroke-width': 1.3 }, svg);
    [y1, y2].forEach(function (y) { el('line', { x1: f1(x - 6), y1: f1(y), x2: f1(x + 6), y2: f1(y), stroke: '#8a5d06', 'stroke-width': 1.3 }, svg); });
    var t = el('text', { x: f1(x + (right ? 8 : -8)), y: f1((y1 + y2) / 2), 'text-anchor': right ? 'start' : 'end', class: 't' }, svg); t.textContent = txt;
  }

  /* ---------- side elevation ---------- */
  function drawSide(M) {
    var svg = $('vside'); svg.innerHTML = '';
    var L = S.L, top = M.top, vw = 760, vh = 360, padL = 120, padR = 40, padT = 40, padB = 64;
    var k = Math.min((vw - padL - padR) / L, (vh - padT - padB) / top), ox = padL + ((vw - padL - padR) - L * k) / 2, gy = vh - padB;
    svg.setAttribute('viewBox', '0 0 ' + vw + ' ' + vh);
    var X = function (x) { return ox + x * k; }, Z = function (z) { return gy - z * k; };
    var ink = INK(), base = COLOURS[S.colour][1];
    el('rect', { x: ox - 30, y: gy, width: L * k + 60, height: 6, fill: 'rgba(120,120,120,.35)' }, svg);
    var sideH = (S.roof === 'lean' || S.roof === 'cant') ? S.E : S.E;
    if (S.walls !== 'open') {
      el('rect', { x: f1(X(0)), y: f1(Z(sideH)), width: f1(L * k), height: f1(sideH * k), fill: '#dde2e8', stroke: 'rgba(0,0,0,.3)' }, svg);
      if (S.win && S.walls === 'closed') {
        for (var w = 0; w < M.bays; w++) {
          var xw = (M.bx[w] + M.bx[w + 1]) / 2 - 2;
          el('rect', { x: f1(X(xw)), y: f1(Z(sideH - 2.5)), width: f1(4 * k), height: f1(3 * k), fill: 'rgba(120,180,230,.85)', stroke: '#33506f' }, svg);
        }
      }
    }
    M.bx.forEach(function (x) { el('line', { x1: f1(X(x)), x2: f1(X(x)), y1: f1(Z(0)), y2: f1(Z(sideH)), stroke: ink, 'stroke-width': Math.max(2, Math.min(5, k * .5)) }, svg); });
    el('rect', { x: f1(X(0)), y: f1(Z(M.top)), width: f1(L * k), height: f1((M.top - sideH) * k), fill: shade(base, -.08), stroke: 'rgba(0,0,0,.35)' }, svg);
    var nr = clamp(Math.round(L / 3), 8, 60);
    for (var q = 1; q < nr; q++) el('line', { x1: f1(X(L * q / nr)), x2: f1(X(L * q / nr)), y1: f1(Z(M.top)), y2: f1(Z(sideH)), stroke: 'rgba(0,0,0,.14)' }, svg);
    el('line', { x1: f1(X(0)), x2: f1(X(L)), y1: f1(Z(sideH)), y2: f1(Z(sideH)), stroke: base, 'stroke-width': 5 }, svg);
    /* bay labels */
    for (var b = 0; b < M.bays; b++) {
      if (M.bays > 14 && b % 2) continue;
      var t = el('text', { x: f1(X((M.bx[b] + M.bx[b + 1]) / 2)), y: f1(Z(0) + 18), 'text-anchor': 'middle', class: 'ts' }, svg); t.textContent = f1(M.bx[b + 1] - M.bx[b]) + "'";
    }
    dimH(svg, X(0), X(L), gy + 40, L + ' ft long, ' + M.bays + ' bays');
    dimV(svg, X(0) - 24, Z(0), Z(S.E), 'eave ' + S.E + ' ft');
    var tt = el('text', { x: 14, y: 22, class: 'ts' }, svg); tt.textContent = 'Side view, along the length. Numbers under the shed are bay widths.';
  }

  /* ---------- plan ---------- */
  function drawPlan(M) {
    var svg = $('vplan'); svg.innerHTML = '';
    var L = S.L, W = S.W, vw = 760, vh = 420, pad = 70;
    var k = Math.min((vw - 2 * pad) / L, (vh - 2 * pad) / W), ox = (vw - L * k) / 2, oy = (vh - W * k) / 2 - 6;
    svg.setAttribute('viewBox', '0 0 ' + vw + ' ' + vh);
    var X = function (x) { return ox + x * k; }, Y = function (y) { return oy + y * k; };
    el('rect', { x: f1(X(0)), y: f1(Y(0)), width: f1(L * k), height: f1(W * k), fill: 'rgba(47,98,179,.08)', stroke: '#16264f', 'stroke-width': 2 }, svg);
    M.bx.forEach(function (x) { el('line', { x1: f1(X(x)), x2: f1(X(x)), y1: f1(Y(0)), y2: f1(Y(W)), stroke: '#8a5d06', 'stroke-dasharray': '4 4', 'stroke-width': 1 }, svg); });
    M.cols.forEach(function (y) { el('line', { x1: f1(X(0)), x2: f1(X(L)), y1: f1(Y(y)), y2: f1(Y(y)), stroke: '#8a5d06', 'stroke-dasharray': '2 5', 'stroke-width': 1 }, svg); });
    if (S.cars) {
      var cg = carGrid(), padx = (L - cg.cx * 9) / 2, pady = (W - cg.cy * 18) / 2;
      for (var a = 0; a < cg.cx; a++) for (var b = 0; b < cg.cy; b++)
        el('rect', { x: f1(X(padx + a * 9 + 1.5)), y: f1(Y(pady + b * 18 + 1.5)), width: f1(6 * k), height: f1(15 * k), rx: f1(Math.min(6, k * 1.2)), fill: 'rgba(22,38,79,.13)', stroke: '#16264f', 'stroke-width': .8 }, svg);
    }
    var r = Math.max(2.5, Math.min(5.5, k * .5));
    M.bx.forEach(function (x) { M.cols.forEach(function (y) { el('rect', { x: f1(X(x) - r), y: f1(Y(y) - r), width: f1(2 * r), height: f1(2 * r), fill: '#16264f' }, svg); }); });
    if (S.walls === 'closed') {
      var ds = doorSpec();
      for (var i = 0; i < ds.n; i++) {
        var gap = (W - ds.n * ds.w) / (ds.n + 1), y = gap + i * (ds.w + gap);
        el('rect', { x: f1(X(L) - 4), y: f1(Y(y)), width: 8, height: f1(ds.w * k), fill: '#f13c20' }, svg);
      }
    }
    if (S.vent) {
      var nv = clamp(Math.round(L / 20), 1, 8), yv = (S.roof === 'lean' || S.roof === 'cant') ? W * .15 : (S.roof === 'multi' ? W / S.spans / 2 : W / 2);
      for (var v = 0; v < nv; v++) el('circle', { cx: f1(X(L * (v + .5) / nv)), cy: f1(Y(yv)), r: 5, fill: '#fff', stroke: '#33404f', 'stroke-width': 1.5 }, svg);
    }
    /* fall arrow */
    var arrowY = Y(W / 2), dir = (S.roof === 'lean' || S.roof === 'cant');
    if (dir) {
      el('line', { x1: f1(X(L * .5)), y1: f1(Y(W * .25)), x2: f1(X(L * .5)), y2: f1(Y(W * .75)), stroke: '#2f62b3', 'stroke-width': 2, 'marker-end': 'url(#ah)' }, svg);
      var defs = el('defs', {}, svg); var m = el('marker', { id: 'ah', markerWidth: 8, markerHeight: 8, refX: 6, refY: 4, orient: 'auto' }, defs); el('path', { d: 'M0,0 L8,4 L0,8 Z', fill: '#2f62b3' }, m);
      var t0 = el('text', { x: f1(X(L * .5) + 8), y: f1(Y(W * .5)), class: 'ts' }, svg); t0.textContent = 'water falls this way';
    }
    dimH(svg, X(0), X(L), Y(W) + 24, L + ' ft  ·  ' + M.bays + ' bays, ' + M.bx.length + ' column lines');
    dimV(svg, X(0) - 18, Y(W), Y(0), W + ' ft', false);
    var tt = el('text', { x: 14, y: 22, class: 'ts' }, svg); tt.textContent = 'Plan view from above. Black squares are columns; red marks are doors on the front end (right side).';
  }

  /* ---------- summary ---------- */
  function summary(M, E) {
    var set = function (id, v) { $(id).textContent = v; };
    set('o-area', M.area.toLocaleString('en-IN')); set('o-top', f1(M.top) + ' ft');
    set('o-bays', M.bays + ' bays'); set('o-cols', M.nCols + ' columns'); set('o-sheet', Math.round(M.sheet).toLocaleString('en-IN'));
    var cg = carGrid();
    set('o-extra', S.cars ? (cg.cx * cg.cy) + ' cars' : f1(M.rise) + ' ft');
    set('o-extra-l', S.cars ? 'approx. cars at 9 by 18 ft each' : 'rise of the roof');
    set('o-range', inr(E.lo) + ' to ' + inr(E.hi));
    set('o-gst', 'With 18% GST: ' + inr(E.glo) + ' to ' + inr(E.ghi));
    set('o-basis', E.g.n + ' at ₹' + E.g.lo + ' to ₹' + E.g.hi + ' per sq ft' + (E.items.length ? ', plus ' + E.items.join(', ') : '') + (E.doors ? ', plus ' + E.doors + ' sliding door' + (E.doors > 1 ? 's' : '') + ' at ₹20,000' : '') + '. Planning figure before site visit.');
    /* warnings */
    var w = [], bad = [];
    if (S.roof === 'cant' && S.W > 20) w.push('A cantilever this deep needs heavy columns and footings. It is usually priced higher than the figure above, and the final price comes after the design.');
    if (S.roof === 'cant') w.push('Cantilever and parking roofs are priced after design, as the column and footing size set the cost.');
    if (S.grade === 'tin' && S.W > 30) w.push('A span of ' + S.W + ' ft is wide for a tin shed frame. Consider the industrial shed or prefab option.');
    if (S.grade === 'ind' && S.W > 50) w.push('A span of ' + S.W + ' ft is wide for an industrial shed. A prefab warehouse or PEB frame usually suits better.');
    if (S.grade === 'tin' && S.bay > 20) w.push('A bay of ' + S.bay + ' ft is long for light sections. Check purlin sizes with us.');
    if (S.roof === 'multi' && S.W / S.spans < 20) w.push('Each span is under 20 ft, so you may be better with fewer spans.');
    if (S.slope > 10 && false) bad.push('');
    if (S.walls !== 'open' && S.E < 8) w.push('A low eave limits vehicle and stacking height.');
    if (S.vent && S.walls === 'open') w.push('Ventilators matter less on an open shed. You may not need them.');
    if (S.walls !== 'closed' && S.doors) w.push('Doors are drawn only when the shed is closed on all sides.');
    var ul = $('o-warn'); ul.innerHTML = '';
    w.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
    bad.forEach(function (t) { if (!t) return; var li = document.createElement('li'); li.className = 'bad'; li.textContent = t; ul.appendChild(li); });
    return w;
  }

  /* ---------- text for WhatsApp and print ---------- */
  function specText(M, E) {
    var ds = doorSpec(), wl = { open: 'open on all sides', sides: 'walls on sides and back, front end open', closed: 'closed on all sides' }[S.walls];
    var t = ['Namaste, I designed a shed on your website:',
      'Use: ' + PRESETS[S.p].name,
      'Size: ' + S.L + ' x ' + S.W + ' ft (' + M.area.toLocaleString('en-IN') + ' sq ft), eave ' + S.E + ' ft, high point ' + f1(M.top) + ' ft',
      'Roof: ' + ROOFS[S.roof] + (S.roof === 'multi' ? ', ' + S.spans + ' spans' : '') + ', slope 1 in ' + S.slope + ', ' + COLOURS[S.colour][0] + ' sheet',
      'Frame: ' + E.g.n + ', bays ' + M.bays + ', columns ' + M.nCols,
      'Walls: ' + wl + (S.walls === 'closed' && ds.n ? ', ' + ds.n + ' sliding door(s)' : '')];
    var ex = []; if (S.ins) ex.push('insulation'); if (S.vent) ex.push('turbo ventilators'); if (S.win) ex.push('windows'); if (S.rust) ex.push('anti-rust coating');
    if (ex.length) t.push('Extras: ' + ex.join(', '));
    t.push('Planning estimate before GST: ' + inr(E.lo) + ' to ' + inr(E.hi));
    t.push('Please call me for a site visit and final quote.');
    t.push(location.href);
    return t.join('\n');
  }

  /* ---------- state in URL ---------- */
  var KEYS = ['p', 'L', 'W', 'E', 'roof', 'slope', 'bay', 'walls', 'grade', 'doors', 'spans', 'colour', 'ins', 'vent', 'win', 'rust', 'cars'];
  function save() {
    try { var q = KEYS.map(function (k) { return k + '=' + (k === 'cars' ? (S[k] ? 1 : 0) : S[k]); }).join('&'); history.replaceState(null, '', '#' + q); } catch (e) {}
  }
  function load() {
    try {
      var h = location.hash.replace('#', ''); if (!h) return false;
      h.split('&').forEach(function (kv) {
        var a = kv.split('='), k = a[0], v = decodeURIComponent(a[1] || '');
        if (KEYS.indexOf(k) < 0) return;
        if (['L', 'W', 'E', 'slope', 'bay', 'doors', 'spans', 'ins', 'vent', 'win', 'rust'].indexOf(k) >= 0) { if (v === '' || !isFinite(+v)) throw 0; S[k] = +v; }
        else if (k === 'cars') S.cars = v === '1';
        else S[k] = v;
      });
      if (!PRESETS[S.p] || !ROOFS[S.roof] || !GRADES[S.grade] || !COLOURS[S.colour] || !SLOPES[S.slope]) throw 0;
      S.L = clamp(S.L, 8, 250); S.W = clamp(S.W, 6, 120); S.E = clamp(S.E, 7, 45); S.bay = clamp(S.bay, 8, 35);
      S.doors = clamp(S.doors, 0, 4); S.spans = clamp(S.spans, 2, 4);
      return true;
    } catch (e) { return false; }
  }

  /* ---------- UI ---------- */
  var timer, animNext = true;
  function render() {
    var M = model(), E = estimate(M);
    draw3d(M); drawFront(M); drawSide(M); drawPlan(M); summary(M, E);
    $('o-title').textContent = PRESETS[S.p].name + ', ' + S.L + ' x ' + S.W + ' ft';
    var wa = $('wa'); wa.href = 'https://wa.me/918527258462?text=' + encodeURIComponent(specText(M, E));
    $('o-print-t').textContent = PRESETS[S.p].name + ', ' + S.L + ' x ' + S.W + ' ft. Planning design by R.R Teen Set Solution, +91 85272 58462';
    clearTimeout(timer); timer = setTimeout(save, 250);
    var an = animNext; animNext = false;
    window.dispatchEvent(new CustomEvent('shed:render', { detail: { S: S, M: M, E: E, ds: doorSpec(), cg: carGrid(), colour: COLOURS[S.colour][1], animate: an, zAt: zAt, name: PRESETS[S.p].name } }));
  }
  function syncControls() {
    [['L', 'L'], ['W', 'W'], ['E', 'E'], ['bay', 'bay']].forEach(function (p) { $('i-' + p[0]).value = S[p[1]]; $('r-' + p[0]).textContent = S[p[1]] + ' ft'; });
    $('i-slope').value = S.slope; $('i-roof').value = S.roof; $('i-walls').value = S.walls; $('i-grade').value = S.grade;
    $('i-doors').value = S.doors; $('r-doors').textContent = S.doors; $('i-spans').value = S.spans; $('r-spans').textContent = S.spans;
    $('spans-row').style.display = S.roof === 'multi' ? '' : 'none';
    ['ins', 'vent', 'win', 'rust'].forEach(function (k) { $('c-' + k).checked = !!S[k]; });
    [].forEach.call(document.querySelectorAll('[data-p]'), function (b) { b.setAttribute('aria-pressed', b.dataset.p === S.p ? 'true' : 'false'); });
    [].forEach.call(document.querySelectorAll('[data-c]'), function (b) { b.setAttribute('aria-pressed', b.dataset.c === S.colour ? 'true' : 'false'); });
    $('doors-row').style.opacity = S.walls === 'closed' ? 1 : .45;
    $('cars-chk').checked = S.cars;
  }
  function applyPreset(id) {
    var p = PRESETS[id]; S.p = id;
    ['L', 'W', 'E', 'roof', 'slope', 'bay', 'walls', 'grade', 'doors', 'cars'].forEach(function (k) { S[k] = p[k]; });
    S.spans = 2; if (id === 'factory') S.spans = 3;
    S.vent = id === 'workshop' || id === 'warehouse' || id === 'factory' ? 1 : 0;
    S.ins = 0; S.win = 0; syncControls(); render();
  }
  function setView(v) {
    S.view = v;
    [].forEach.call(document.querySelectorAll('.sd-tabs button'), function (b) { b.setAttribute('aria-selected', b.dataset.v === v ? 'true' : 'false'); b.tabIndex = b.dataset.v === v ? 0 : -1; });
    [].forEach.call(document.querySelectorAll('.sd-view'), function (d) { d.classList.toggle('on', d.dataset.v === v); });
    window.dispatchEvent(new CustomEvent('shed:view', { detail: { v: v } }));
  }
  function init() {
    var pc = $('presets'), cw = $('colours'), roofSel = $('i-roof'), slSel = $('i-slope'), gr = $('i-grade');
    Object.keys(PRESETS).forEach(function (id) {
      var b = document.createElement('button'); b.type = 'button'; b.dataset.p = id; b.textContent = PRESETS[id].name; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { applyPreset(id); }); pc.appendChild(b);
    });
    Object.keys(COLOURS).forEach(function (id) {
      var b = document.createElement('button'); b.type = 'button'; b.dataset.c = id; b.style.background = COLOURS[id][1]; b.title = COLOURS[id][0]; b.setAttribute('aria-label', COLOURS[id][0] + ' sheet'); b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { S.colour = id; syncControls(); render(); }); cw.appendChild(b);
    });
    Object.keys(ROOFS).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = ROOFS[k]; roofSel.appendChild(o); });
    Object.keys(SLOPES).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = SLOPES[k]; slSel.appendChild(o); });
    Object.keys(GRADES).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = GRADES[k].n + ' (₹' + GRADES[k].lo + ' to ' + GRADES[k].hi + ' per sq ft)'; gr.appendChild(o); });
    ['L', 'W', 'E', 'bay', 'doors', 'spans'].forEach(function (k) {
      $('i-' + k).addEventListener('input', function (e) { S[k] = +e.target.value; syncControls(); render(); });
    });
    [['i-roof', 'roof'], ['i-walls', 'walls'], ['i-grade', 'grade']].forEach(function (p) { $(p[0]).addEventListener('change', function (e) { animNext = p[1] !== 'grade'; S[p[1]] = e.target.value; syncControls(); render(); }); });
    $('i-slope').addEventListener('change', function (e) { S.slope = +e.target.value; render(); });
    ['ins', 'vent', 'win', 'rust'].forEach(function (k) { $('c-' + k).addEventListener('change', function (e) { S[k] = e.target.checked ? 1 : 0; render(); }); });
    $('cars-chk').addEventListener('change', function (e) { S.cars = e.target.checked; render(); });
    var tabs = [].slice.call(document.querySelectorAll('.sd-tabs button'));
    if (!(window.ShedGL && window.ShedGL.ok)) tabs = tabs.filter(function (b) { return b.dataset.v !== 'real'; });
    tabs.forEach(function (b, i) {
      b.id = 'tab-' + b.dataset.v; b.setAttribute('aria-controls', 'view-' + b.dataset.v);
      b.addEventListener('click', function () { setView(b.dataset.v); });
      b.addEventListener('keydown', function (e) {
        var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
        if (j < 0) return; j = (j + tabs.length) % tabs.length; tabs[j].focus(); setView(tabs[j].dataset.v); e.preventDefault();
      });
    });
    $('print').addEventListener('click', function () { window.print(); });
    $('copy').addEventListener('click', function () {
      var b = $('copy'), done = function () { b.textContent = 'Link copied'; setTimeout(function () { b.textContent = 'Copy design link'; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, done); else done();
    });
    if (load()) { syncControls(); render(); } else { applyPreset('warehouse'); }
    var gl = window.ShedGL && window.ShedGL.ok;
    if (!gl) { var t = document.querySelector('.sd-tabs [data-v="real"]'), pn = $('view-real'); if (t) t.remove(); if (pn) pn.remove(); }
    setView(gl ? 'real' : '3d');
    if (window.matchMedia) { var mq = matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', render); }
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
  document.addEventListener('DOMContentLoaded', init);
})();
