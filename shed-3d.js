/* Realistic 3D view for the shed designer (three.js, self-hosted in /vendor/three).
   Lit scene with shadows, corrugated sheet, purlins, doors, cars, people, trees and a road.
   Drag to rotate, pinch or wheel to zoom, slider moves the sun. Builds itself up when the design changes. */
import * as THREE from './vendor/three/three.module.min.js';

var probe = document.createElement('canvas');
var hasGL = false;
try { hasGL = !!(probe.getContext('webgl2') || probe.getContext('webgl')); } catch (e) {}
window.ShedGL = { ok: hasGL };

if (hasGL) {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var host, canvas, renderer, scene, camera, sun, hemi, root, parts, last = null, active = false, raf = 0, inited = false;
  var yaw = 0.85, pitch = 0.3, dist = 150, target = new THREE.Vector3(), autoRot = !reduce, userMoved = false, fitR = 100;
  var anim = null, sunT = 0.45, shadowR = 0;

  /* ---------- textures and shared materials ---------- */
  function canvasTex(w, h, draw, repeat) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4; if (repeat) t.repeat.set(repeat[0], repeat[1]); return t;
  }
  var ribTex = canvasTex(64, 8, function (g, w, h) {
    for (var x = 0; x < w; x++) {
      var t = x / w, v = t < .25 ? 1 - t * 4 * .0 : 1; /* flat crest */
      var s = Math.sin(t * Math.PI * 2), k = 0.80 + 0.20 * (0.5 + 0.5 * s);
      if (t > .42 && t < .58) k = 0.68; /* groove */
      g.fillStyle = 'rgb(' + Math.round(255 * k) + ',' + Math.round(255 * k) + ',' + Math.round(255 * k) + ')'; g.fillRect(x, 0, 1, h);
    }
  }, [1 / 0.75, 1 / 40]);
  var groundTex = canvasTex(256, 256, function (g, w, h) {
    g.fillStyle = '#b3ad8f'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 2600; i++) { var a = Math.random(); g.fillStyle = 'rgba(' + (a > .5 ? '120,125,90' : '200,190,150') + ',' + (0.12 + Math.random() * .2) + ')'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  }, [60, 60]);
  var slabTex = canvasTex(128, 128, function (g, w, h) {
    g.fillStyle = '#c4c2bb'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 900; i++) { g.fillStyle = 'rgba(90,90,85,' + (Math.random() * .12) + ')'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    g.strokeStyle = 'rgba(80,80,75,.35)'; g.strokeRect(0, 0, w, h);
  }, [1, 1]);
  var roadTex = canvasTex(64, 256, function (g, w, h) {
    g.fillStyle = '#3d4046'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 500; i++) { g.fillStyle = 'rgba(255,255,255,' + Math.random() * .06 + ')'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    g.fillStyle = '#e9c545'; g.fillRect(w / 2 - 2, 20, 4, 90); g.fillRect(w / 2 - 2, 150, 4, 90);
  }, [1, 1]);
  var M = {
    steel: new THREE.MeshStandardMaterial({ color: 0x5a6574, metalness: .25, roughness: .55 }),
    steelDk: new THREE.MeshStandardMaterial({ color: 0x39414d, metalness: .25, roughness: .5 }),
    plate: new THREE.MeshStandardMaterial({ color: 0x8a919b, metalness: .7, roughness: .4 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x2f62b3, map: ribTex, metalness: 0, roughness: .8, side: THREE.DoubleSide }),
    wall: new THREE.MeshStandardMaterial({ color: 0xdfe3e8, map: ribTex, metalness: 0, roughness: .85, side: THREE.DoubleSide }),
    door: new THREE.MeshStandardMaterial({ color: 0x59616d, metalness: .4, roughness: .55 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x8cc4ee, metalness: .1, roughness: .1, transparent: true, opacity: .65 }),
    vent: new THREE.MeshStandardMaterial({ color: 0xd5dbe2, metalness: .8, roughness: .3 }),
    louver: new THREE.MeshStandardMaterial({ color: 0x555d68, metalness: .5, roughness: .5, side: THREE.DoubleSide }),
    ground: new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1 }),
    slab: new THREE.MeshStandardMaterial({ map: slabTex, roughness: .95 }),
    road: new THREE.MeshStandardMaterial({ map: roadTex, roughness: .9 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x3f7a3a, roughness: .9 }),
    leaf2: new THREE.MeshStandardMaterial({ color: 0x5a8f46, roughness: .9 }),
    tyre: new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: .9 }),
    skin: new THREE.MeshStandardMaterial({ color: 0xc89b7b, roughness: .8 }),
    shirt: new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: .8 }),
    pants: new THREE.MeshStandardMaterial({ color: 0x2c3a5a, roughness: .8 }),
    helmet: new THREE.MeshStandardMaterial({ color: 0xffd23a, roughness: .5 })
  };

  /* ---------- init ---------- */
  function init() {
    if (inited) return; inited = true;
    host = $('gl'); canvas = $('glc');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xdde8ec, 500, 1500);
    camera = new THREE.PerspectiveCamera(38, 1.6, 1, 4000);
    hemi = new THREE.HemisphereLight(0xcfe6ff, 0x8a8468, 1.0); scene.add(hemi);
    sun = new THREE.DirectionalLight(0xfff2d8, 2.6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.3;
    scene.add(sun); scene.add(sun.target);
    var g = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), M.ground); g.rotation.x = -Math.PI / 2; g.position.y = -0.02; g.receiveShadow = true; scene.add(g);
    root = new THREE.Group(); scene.add(root);
    bindUI(); setupMini(); resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(host); else addEventListener('resize', resize);
    if (window.matchMedia) matchMedia('(min-width:901px) and (min-height:700px)').addEventListener && matchMedia('(min-width:901px) and (min-height:700px)').addEventListener('change', resize);
    setSun();
  }
  function fitDist() {
    var v = THREE.MathUtils.degToRad(camera.fov / 2), hh = Math.atan(Math.tan(v) * camera.aspect);
    return Math.max(fitR / Math.sin(v), fitR / Math.sin(hh)) * 0.78;
  }
  function resize() {
    if (!renderer || !host.clientWidth) return;
    var w = host.clientWidth, big = window.matchMedia('(min-width:901px) and (min-height:700px)').matches,
      h = big ? Math.max(300, Math.min(Math.round(w * 0.62), window.innerHeight - 390)) : Math.max(260, Math.min(Math.round(w * 0.62), window.innerHeight * 0.72));
    canvas.style.height = h + 'px'; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  /* ---------- helpers ---------- */
  function mesh(geo, mat, cast, recv) { var m = new THREE.Mesh(geo, mat); m.castShadow = cast !== false; m.receiveShadow = !!recv; return m; }
  function box(w, h, d, mat, cast) { return mesh(new THREE.BoxGeometry(w, h, d), mat, cast); }
  function disposeGroup(g) {
    g.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
    while (g.children.length) g.remove(g.children[0]);
  }
  function rnd(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  /* ---------- scene build ---------- */
  function build(d) {
    var S = d.S, Mo = d.M, L = S.L, W = S.W, E = S.E, zAt = d.zAt, prof = Mo.prof;
    disposeGroup(root);
    parts = { cols: [], frame: new THREE.Group(), roof: new THREE.Group(), walls: new THREE.Group(), extras: new THREE.Group() };
    var base = new THREE.Group(); base.position.set(-L / 2, 0, -W / 2); root.add(base);
    M.roof.color.set(d.colour);
    var wallsOn = S.walls !== 'open';

    /* slab */
    var slab = mesh(new THREE.BoxGeometry(L + 4, 0.5, W + 4), M.slab, false, true); slab.position.set(L / 2, -0.1, W / 2); base.add(slab);

    /* columns with base plates */
    Mo.bx.forEach(function (x) {
      Mo.cols.forEach(function (y) {
        var h = zAt(prof, y) - 0.3, cg = new THREE.BoxGeometry(0.85, h, 0.55); cg.translate(0, h / 2, 0);
        var c = mesh(cg, M.steel); c.position.set(x, 0.15, y); base.add(c); parts.cols.push(c);
        var bp = box(1.7, 0.18, 1.7, M.plate); bp.position.set(x, 0.24, y); base.add(bp);
      });
    });

    /* rafters (one instanced run per roof segment) and purlins */
    var segs = [];
    for (var i = 0; i < prof.length - 1; i++) { var A = prof[i], B = prof[i + 1]; if (Math.abs(B[0] - A[0]) > 1e-6) segs.push([A, B]); }
    var depth = Math.max(0.9, Math.min(3, W / segs.length / 18));
    segs.forEach(function (sg) {
      var A = sg[0], B = sg[1], dw = B[0] - A[0], dh = B[1] - A[1], len = Math.sqrt(dw * dw + dh * dh), ang = Math.atan2(dh, dw);
      var im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, depth, len), M.steelDk, Mo.bx.length); im.castShadow = true;
      var dm = new THREE.Object3D();
      Mo.bx.forEach(function (x, k) { dm.position.set(x, (A[1] + B[1]) / 2 - depth / 2 - 0.1, (A[0] + B[0]) / 2); dm.rotation.set(-ang, 0, 0); dm.updateMatrix(); im.setMatrixAt(k, dm.matrix); });
      parts.frame.add(im);
      var n = Math.max(2, Math.round(len / 5));
      for (var p = 0; p <= n; p++) {
        var t = p / n, pw = A[0] + dw * t, ph = A[1] + dh * t;
        var pu = box(L, 0.35, 0.5, M.steel, false); pu.position.set(L / 2, ph - 0.15, pw); pu.rotation.x = -ang; parts.frame.add(pu);
      }
    });
    base.add(parts.frame);

    /* roof sheets, gutters and monitor louvres */
    for (var j = 0; j < prof.length - 1; j++) {
      var A2 = prof[j], B2 = prof[j + 1], vertical = Math.abs(B2[0] - A2[0]) < 1e-6;
      var pos = new Float32Array([0, A2[1], A2[0], L, A2[1], A2[0], L, B2[1], B2[0], 0, B2[1], B2[0]]);
      var uv = new Float32Array([0, 0, L, 0, L, 1, 0, 1]);
      var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
      var rm = mesh(geo, vertical ? M.louver : M.roof, true, false); parts.roof.add(rm);
      if (vertical) {
        for (var sI = 1; sI < 7; sI++) { var sl = box(L, 0.12, 0.25, M.steelDk, false); sl.position.set(L / 2, Math.min(A2[1], B2[1]) + (Math.abs(B2[1] - A2[1])) * sI / 7, A2[0]); parts.roof.add(sl); }
      }
    }
    /* ridge cap over monitor */
    if (S.roof === 'ridge') {
      var a = prof[2], b = prof[3], cap = box(L + .4, .25, (b[0] - a[0]) + .8, M.roof); cap.position.set(L / 2, a[1] + .12, (a[0] + b[0]) / 2); parts.roof.add(cap);
    }
    /* gutters on low edges */
    [0, W].forEach(function (y) {
      var z = zAt(prof, y), isLow = Math.abs(z - E) < 0.01;
      if (isLow && (S.roof !== 'cant' || y !== 0)) { var gu = box(L, .45, .5, M.steelDk, false); gu.position.set(L / 2, z - .1, y); parts.roof.add(gu); }
    });
    base.add(parts.roof);

    /* turbo ventilators (they spin) */
    parts.vents = [];
    if (S.vent) {
      var nv = Math.max(1, Math.min(8, Math.round(L / 20)));
      var vy = (S.roof === 'lean' || S.roof === 'cant') ? W * .15 : (S.roof === 'multi' ? W / S.spans / 2 : W / 2);
      var vz = zAt(prof, vy);
      for (var v = 0; v < nv; v++) {
        var vg = new THREE.Group(), pts = [];
        for (var q = 0; q <= 8; q++) pts.push(new THREE.Vector2(0.15 + Math.sin(q / 8 * Math.PI) * 1.15, q / 8 * 2.4));
        var body = mesh(new THREE.LatheGeometry(pts, 14), M.vent); vg.add(body);
        var neck = mesh(new THREE.CylinderGeometry(.9, .9, .8, 12), M.vent); neck.position.y = -.2; vg.add(neck);
        vg.position.set(L * (v + .5) / nv, vz + .5, vy); parts.roof.add(vg); parts.vents.push(body);
      }
    }

    /* walls, doors, windows */
    var rows = []; /* [y, height] for long walls */
    if (wallsOn) {
      var longYs = (S.walls === 'closed' || S.walls === 'sides') ? [0, W] : [W];
      longYs.forEach(function (y) {
        var h = zAt(prof, y), sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(L, 0); sh.lineTo(L, h); sh.lineTo(0, h); sh.closePath();
        var wm = mesh(new THREE.ShapeGeometry(sh), M.wall, true, false); wm.position.set(0, 0.15, y); parts.walls.add(wm);
      });
      var endXs = S.walls === 'closed' ? [0, L] : [0];
      endXs.forEach(function (x) {
        var sh = new THREE.Shape(); sh.moveTo(0, 0);
        prof.forEach(function (q) { sh.lineTo(q[0], q[1]); }); sh.lineTo(W, 0); sh.closePath();
        var em = mesh(new THREE.ShapeGeometry(sh), M.wall, true, false); em.rotation.y = -Math.PI / 2; em.position.set(x, 0.15, 0); parts.walls.add(em);
      });
      if (S.walls === 'closed') {
        var ds = d.ds;
        for (var di = 0; di < ds.n; di++) {
          var gap = (W - ds.n * ds.w) / (ds.n + 1), y0 = gap + di * (ds.w + gap);
          var dr = box(0.35, ds.h, ds.w, M.door); dr.position.set(L + .25, ds.h / 2 + .15, y0 + ds.w / 2); parts.walls.add(dr);
          for (var rb = 1; rb < 5; rb++) { var ribm = box(.4, ds.h, .12, M.steelDk, false); ribm.position.set(L + .5, ds.h / 2 + .15, y0 + ds.w * rb / 5); parts.walls.add(ribm); }
          var rail = box(.5, .35, ds.w * 2.05, M.steelDk, false); rail.position.set(L + .6, ds.h + .5, y0 + ds.w); parts.walls.add(rail);
          var hd = box(.3, 2.2, .25, M.plate, false); hd.position.set(L + .65, 3.6, y0 + ds.w * .92); parts.walls.add(hd);
        }
        if (S.win) {
          var sideH = zAt(prof, W);
          for (var bI = 0; bI < Mo.bays; bI++) {
            var cx = (Mo.bx[bI] + Mo.bx[bI + 1]) / 2;
            [W].concat(S.walls === 'closed' ? [0] : []).forEach(function (yy) {
              var gl = box(4.4, 3, .25, M.glass, false); gl.position.set(cx, Math.max(4, sideH - 4.5), yy + (yy === 0 ? -.05 : .05)); parts.walls.add(gl);
              var fr = box(4.8, 3.4, .15, M.steelDk, false); fr.position.set(cx, Math.max(4, sideH - 4.5), yy + (yy === 0 ? -.02 : .02)); parts.walls.add(fr);
            });
          }
        }
      }
    }
    base.add(parts.walls);

    /* cars, people, trees, road */
    if (S.cars) {
      var cg2 = d.cg, padx = (L - cg2.cx * 9) / 2, pady = (W - cg2.cy * 18) / 2, pal = [0xe8e8e8, 0x4a5d7a, 0xa33a3a, 0xd7d2bd, 0x2f3a46, 0xb68a2b];
      var maxN = 40, count = 0;
      for (var ax = 0; ax < cg2.cx && count < maxN; ax++) for (var by = 0; by < cg2.cy && count < maxN; by++, count++) {
        base.add(makeCar(pal[(ax * 3 + by) % pal.length], padx + ax * 9 + 4.5, pady + by * 18 + 9));
      }
    }
    var peopleX = L + 5, p1 = makePerson(); p1.position.set(peopleX, 0, W / 2 + 4); p1.rotation.y = -1.2; parts.extras.add(p1);
    var p2 = makePerson(); p2.position.set(peopleX + 2.2, 0, W / 2 + 7); p2.rotation.y = -2.3; parts.extras.add(p2);
    var rn = rnd(7 + L * 3 + W), ringR = Math.max(L, W) * 0.75 + 38, trees = 0;
    for (var tI = 0; tI < 14; tI++) {
      var an = rn() * Math.PI * 2, rr = ringR + rn() * 40, tx = L / 2 + Math.cos(an) * rr * 1.2, tz = W / 2 + Math.sin(an) * rr;
      if (tx > L + 18 && tx < L + 62) continue; /* keep the road side clear */
      var tr = makeTree(.8 + rn() * .9); tr.position.set(tx, 0, tz); parts.extras.add(tr); trees++;
    }
    var road = mesh(new THREE.PlaneGeometry(22, Math.max(500, W * 4)), M.road, false, true); road.rotation.x = -Math.PI / 2; road.rotation.z = Math.PI / 2 * 0; road.position.set(L + 40, 0.01, W / 2);
    road.geometry.attributes.uv.array.forEach(function (_, i, arr) { if (i % 2) arr[i] *= Math.max(500, W * 4) / 40; });
    road.rotation.z = 0; parts.extras.add(road);
    base.add(parts.extras);

    /* shadow camera and fit */
    var Rr = Math.sqrt(L * L + W * W) / 2 + 40; shadowR = Rr;
    var sc = sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 1; sc.far = Rr * 6; sc.updateProjectionMatrix();
    fitR = Math.sqrt(L * L + W * W + Math.pow(Mo.top, 2)) / 2;
    target.set(0, Mo.top * 0.32, 0);
    var fitD = fitDist();
    if (!userMoved || d.animate) dist = fitD;
    setSun();
    return base;
  }
  function makeCar(color, cx, cz) {
    var g = new THREE.Group(), body = new THREE.MeshStandardMaterial({ color: color, metalness: .1, roughness: .45 });
    var ex = function (pts, depth, bev) {
      var sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]); sh.closePath();
      var geo = new THREE.ExtrudeGeometry(sh, { depth: depth, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 2 });
      geo.translate(0, 0, -depth / 2); return geo;
    };
    var lower = mesh(ex([[-7.2, 1.3], [-7.2, 3.0], [-6.0, 3.4], [-2.6, 3.5], [2.8, 3.5], [6.2, 3.2], [7.2, 2.6], [7.2, 1.3]], 5.2, .4), body);
    lower.rotation.y = Math.PI / 2; g.add(lower);
    var glass = mesh(ex([[-3.4, 3.5], [-2.3, 5.0], [1.7, 5.0], [3.3, 3.5]], 5.0, .15), M.glass); glass.rotation.y = Math.PI / 2; glass.castShadow = false; g.add(glass);
    var roofC = mesh(ex([[-2.6, 5.0], [1.9, 5.0], [1.9, 5.25], [-2.6, 5.25]], 4.9, .1), body); roofC.rotation.y = Math.PI / 2; g.add(roofC);
    [[-2.9, 4.6], [2.9, 4.6], [-2.9, -4.4], [2.9, -4.4]].forEach(function (w) {
      var wh = mesh(new THREE.CylinderGeometry(1.35, 1.35, .9, 18), M.tyre); wh.rotation.z = Math.PI / 2; wh.position.set(w[0], 1.35, w[1]); g.add(wh);
      var hub = mesh(new THREE.CylinderGeometry(.7, .7, .95, 12), M.plate); hub.rotation.z = Math.PI / 2; hub.position.set(w[0], 1.35, w[1]); hub.castShadow = false; g.add(hub);
    });
    [-1.8, 1.8].forEach(function (x) {
      var hl = box(1.1, .5, .2, new THREE.MeshStandardMaterial({ color: 0xfff4c2, emissive: 0x665c30 }), false); hl.position.set(x, 2.7, 7.65); g.add(hl);
      var tl = box(1.1, .5, .2, new THREE.MeshStandardMaterial({ color: 0xc01818, emissive: 0x400000 }), false); tl.position.set(x, 2.7, -7.65); g.add(tl);
    });
    g.position.set(cx, 0.15, cz); return g;
  }
  function makePerson() {
    var g = new THREE.Group();
    var legs = mesh(new THREE.CylinderGeometry(.5, .45, 2.5, 8), M.pants); legs.position.y = 1.25; g.add(legs);
    var torso = mesh(new THREE.CylinderGeometry(.75, .65, 2.1, 10), M.shirt); torso.position.y = 3.55; g.add(torso);
    var head = mesh(new THREE.SphereGeometry(.5, 12, 10), M.skin); head.position.y = 5.0; g.add(head);
    var hat = mesh(new THREE.SphereGeometry(.55, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.helmet); hat.position.y = 5.1; g.add(hat);
    return g;
  }
  function makeTree(s) {
    var g = new THREE.Group(), tr = mesh(new THREE.CylinderGeometry(.7 * s, 1 * s, 8 * s, 8), M.trunk); tr.position.y = 4 * s; g.add(tr);
    var l1 = mesh(new THREE.SphereGeometry(5.5 * s, 12, 10), M.leaf); l1.position.y = 11 * s; g.add(l1);
    var l2 = mesh(new THREE.SphereGeometry(4 * s, 12, 10), M.leaf2); l2.position.set(2.5 * s, 13.5 * s, 1 * s); g.add(l2);
    return g;
  }

  /* ---------- sun ---------- */
  function setSun() {
    if (!sun) return;
    var a = Math.PI * (0.1 + 0.8 * sunT), D = Math.max(200, shadowR * 2.4), el = Math.sin(a);
    sun.position.set(-Math.cos(a) * D, el * D * .95 + 12, D * .35); sun.target.position.set(0, 0, 0);
    sun.intensity = 0.8 + 2.4 * el; hemi.intensity = 0.9 + 0.7 * el;
    var warm = 1 - el; sun.color.setRGB(1, 0.93 - warm * .35, 0.82 - warm * .55);
  }

  /* ---------- build-up animation ---------- */
  function startAnim() {
    anim = { t0: performance.now(), dur: reduce ? 1 : 1700 };
    applyAnim(0);
  }
  function ease(x) { return 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3); }
  function seg(t, a, b) { return ease((t - a) / (b - a)); }
  function applyAnim(t) {
    var n = parts.cols.length;
    parts.cols.forEach(function (c, i) { c.scale.y = Math.max(0.001, seg(t, 0, .4 + 0.0 * i) * 1); var k = seg(t, (i / n) * .12, .38 + (i / n) * .12); c.scale.y = Math.max(0.001, k); });
    var f = seg(t, .3, .62); parts.frame.visible = t > .3; parts.frame.position.y = (1 - f) * 22;
    var r = seg(t, .5, .88); parts.roof.visible = t > .5; parts.roof.position.y = (1 - r) * 34;
    var w = seg(t, .7, 1); parts.walls.visible = t > .68; parts.walls.scale.y = Math.max(0.001, w);
    var x = seg(t, .85, 1); parts.extras.scale.setScalar(Math.max(0.001, x));
  }

  /* ---------- loop ---------- */
  function frame(now) {
    raf = 0; if (!active || document.hidden) return;
    if (anim) {
      var t = (now - anim.t0) / anim.dur; if (t >= 1) { t = 1; anim = null; }
      applyAnim(t);
    }
    if (autoRot && !userMoved) yaw += 0.0025;
    if (parts && parts.vents) parts.vents.forEach(function (v) { v.rotation.y += 0.08; });
    var cp = Math.cos(pitch), sp = Math.sin(pitch);
    camera.position.set(target.x + dist * cp * Math.sin(yaw), target.y + dist * sp, target.z + dist * cp * Math.cos(yaw));
    camera.lookAt(target); renderer.render(scene, camera);
    if (miniOn && mini && (++tick % 6 === 0)) { try { miniCtx.drawImage(canvas, 0, 0, miniC.width, miniC.height); } catch (e) {} }
    raf = requestAnimationFrame(frame);
  }
  /* small live preview shown on phones while the big view is scrolled out of sight */
  var mini = null, miniC = null, miniCtx = null, miniOn = false, tick = 0;
  function lakh(n) { return n >= 1e5 ? (n / 1e5).toFixed(1).replace('.0', '') + ' L' : Math.round(n / 1000) + 'k'; }
  function setupMini() {
    mini = $('mini'); if (!mini || !window.IntersectionObserver) return; miniC = $('mini-c'); miniCtx = miniC.getContext('2d');
    new IntersectionObserver(function (en) { miniOn = !en[0].isIntersecting && innerWidth <= 900; mini.hidden = !(miniOn && active); }, { threshold: 0.05 }).observe(document.querySelector('.sd-stage'));
    mini.addEventListener('click', function () { var r = document.querySelector('.sd-stage').getBoundingClientRect(); window.scrollTo({ top: window.scrollY + r.top - 78, behavior: reduce ? 'auto' : 'smooth' }); });
  }
  function kick() { if (!raf && active) raf = requestAnimationFrame(frame); }

  /* ---------- input ---------- */
  function bindUI() {
    var ptrs = {}, startD = 0;
    var mark = function () { userMoved = true; };
    canvas.addEventListener('pointerdown', function (e) { canvas.setPointerCapture(e.pointerId); ptrs[e.pointerId] = [e.clientX, e.clientY]; mark(); host.classList.add('drag'); });
    canvas.addEventListener('pointermove', function (e) {
      var p = ptrs[e.pointerId]; if (!p) return; var ids = Object.keys(ptrs);
      if (ids.length === 2) {
        var o = ptrs[ids[0] == e.pointerId ? ids[1] : ids[0]], nd = Math.hypot(e.clientX - o[0], e.clientY - o[1]), od = Math.hypot(p[0] - o[0], p[1] - o[1]);
        dist = clamp(dist * od / Math.max(nd, 1), fitR * .5, fitR * 7);
      } else {
        yaw -= (e.clientX - p[0]) * 0.007; pitch = clamp(pitch + (e.clientY - p[1]) * 0.005, 0.05, 1.5);
      }
      ptrs[e.pointerId] = [e.clientX, e.clientY]; kick();
    });
    var up = function (e) { delete ptrs[e.pointerId]; if (!Object.keys(ptrs).length) host.classList.remove('drag'); };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', function (e) { e.preventDefault(); mark(); dist = clamp(dist * Math.exp(e.deltaY * 0.0012), fitR * .5, fitR * 7); kick(); }, { passive: false });
    canvas.addEventListener('keydown', function (e) {
      var k = e.key, h = true; mark();
      if (k === 'ArrowLeft') yaw -= .12; else if (k === 'ArrowRight') yaw += .12; else if (k === 'ArrowUp') pitch = clamp(pitch + .08, .05, 1.5); else if (k === 'ArrowDown') pitch = clamp(pitch - .08, .05, 1.5);
      else if (k === '+' || k === '=') dist = clamp(dist * .9, fitR * .5, fitR * 7); else if (k === '-') dist = clamp(dist * 1.1, fitR * .5, fitR * 7); else h = false;
      if (h) { e.preventDefault(); kick(); }
    });
    $('gl-rot').addEventListener('click', function () { autoRot = !autoRot; userMoved = false; this.setAttribute('aria-pressed', autoRot ? 'true' : 'false'); kick(); });
    $('gl-rot').setAttribute('aria-pressed', autoRot ? 'true' : 'false');
    $('gl-reset').addEventListener('click', function () { userMoved = false; yaw = 0.85; pitch = 0.3; if (last) { dist = fitDist(); } kick(); });
    $('gl-top').addEventListener('click', function () { userMoved = true; pitch = 1.45; kick(); });
    $('gl-sun').addEventListener('input', function (e) { sunT = e.target.value / 100; setSun(); kick(); });
    $('gl-save').addEventListener('click', function () {
      renderer.render(scene, camera);
      canvas.toBlob(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'my-shed-design.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000); }, 'image/png');
    });
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- events from the designer ---------- */
  var pending = null, scheduled = false;
  function applyRender() {
    scheduled = false; if (!pending || !inited) return;
    last = pending; pending = null; build(last);
    if ($('mini-p')) $('mini-p').textContent = '₹' + lakh(last.E.lo) + ' to ' + lakh(last.E.hi) + ' + GST'; if (last.animate && !reduce) startAnim(); else if (parts) applyAnim(1);
    kick();
  }
  window.addEventListener('shed:render', function (e) {
    pending = e.detail; if (!inited) return;
    if (!scheduled) { scheduled = true; requestAnimationFrame(applyRender); }
  });
  window.addEventListener('shed:view', function (e) {
    active = e.detail.v === 'real'; if (mini) mini.hidden = !(miniOn && active);
    if (active) { init(); resize(); if (pending) applyRender(); else if (!last && window.__lastShed) { } kick(); }
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
  /* first render may arrive before the 3D tab is opened */
  window.addEventListener('shed:render', function (e) { if (!last) pending = e.detail; });
}
