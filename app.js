/* TATOOA prototype – client flow (studio → price → artists → request) and artist inbox.
   All data here (artists, pricing table) is DEMO data. No backend: leads live in localStorage. */
'use strict';
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const round50 = n => Math.round(n / 50) * 50;
  const depositOf = q => Math.round(q * PRICING.deposit); // PRICING is defined below; only called after init
  const fmt = n => '₪' + Math.round(n).toLocaleString('he-IL');
  const cm = n => (Math.round(n * 2) / 2).toLocaleString('he-IL');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const INK = '#141414';
  const W = 800, H = 1000; // stage canvas size (4:5)

  /* ================= DATA (demo placeholders) ================= */
  const STYLES = { fineline: 'קווים עדינים', minimal: 'מינימליזם', blackwork: 'בלאקוורק', realism: 'ריאליזם', color: 'צבעוני' };
  const PLACEMENTS = {
    forearm: { label: 'אמה', cm: 14 }, upperarm: { label: 'זרוע / כתף', cm: 22 }, calf: { label: 'שוק', cm: 18 },
    wrist: { label: 'שורש כף היד', cm: 8 }, back: { label: 'גב', cm: 40 }, chest: { label: 'חזה', cm: 30 },
    ribs: { label: 'צלעות', cm: 28 }, neck: { label: 'צוואר', cm: 12 }
  };
  const BODIES = {
    forearm: { label: 'אמה', placement: 'forearm', x0: 240, x1: 570,
      d: 'M250 1000 C 235 800, 255 560, 290 330 C 300 250, 300 170, 310 0 L 500 0 C 505 170, 510 250, 520 330 C 548 560, 575 800, 565 1000 Z' },
    shoulder: { label: 'כתף', placement: 'upperarm', x0: 180, x1: 725,
      d: 'M200 1000 C 190 800, 170 560, 190 400 C 210 230, 330 130, 470 130 C 610 130, 700 230, 720 380 C 735 520, 700 760, 640 1000 Z' },
    calf: { label: 'שוק', placement: 'calf', x0: 210, x1: 580,
      d: 'M300 0 C 280 150, 210 300, 215 470 C 220 640, 300 800, 320 1000 L 510 1000 C 520 800, 570 620, 575 450 C 580 280, 520 140, 505 0 Z' }
  };
  const TONES = [
    { name: 'בהיר', hex: '#f1c9a5' }, { name: 'בינוני', hex: '#d9a57c' },
    { name: 'שחום', hex: '#a8714a' }, { name: 'כהה', hex: '#6b4429' }
  ];
  // Pricing table – PLACEHOLDER until the ~50-artist market survey exists.
  const PRICING = {
    base: 250, minimum: 350, coverage: 0.6, spread: [0.85, 1.25],
    perCm2: { fineline: 7, minimal: 6, blackwork: 10, realism: 20, color: 14 },
    placement: { forearm: 1, upperarm: 1, calf: 1, wrist: 1.1, back: 0.95, chest: 1.15, ribs: 1.3, neck: 1.35 },
    complexity: { 1: 0.85, 2: 1, 3: 1.35 },
    color: 1.25, coverUp: 1.3, deposit: 0.15
  };
  // Demo artists – made-up.
  const ARTISTS = [
    { id: 'a1', name: 'נועה ל.', studio: 'סטודיו קו דק', city: 'תל אביב', styles: ['fineline', 'minimal'], rating: 4.9, reviews: 128, factor: 1.1, min: 400, portfolio: ['flower', 'moon', 'script'] },
    { id: 'a2', name: 'עידו ב.', studio: 'Black Ink', city: 'רמת גן', styles: ['blackwork', 'minimal'], rating: 4.7, reviews: 86, factor: 1.0, min: 500, coverUp: true, portfolio: ['wave', 'swallow', 'geo'] },
    { id: 'a3', name: 'מאיה ש.', studio: 'Realism Lab', city: 'חיפה', styles: ['realism', 'blackwork'], rating: 4.8, reviews: 64, factor: 1.25, min: 900, coverUp: true, portfolio: ['swallow', 'mandala', 'moon'] },
    { id: 'a4', name: 'אורי כ.', studio: 'Color Room', city: 'באר שבע', styles: ['color', 'fineline'], rating: 4.6, reviews: 41, factor: 0.9, min: 350, portfolio: ['flower', 'mandala', 'wave'] },
    { id: 'a5', name: 'דנה ר.', studio: 'Geometry Studio', city: 'ירושלים', styles: ['minimal', 'fineline', 'blackwork'], rating: 4.8, reviews: 97, factor: 0.95, min: 400, portfolio: ['geo', 'mandala', 'script'] }
  ];
  // Built-in sketches as SVG path data on a 200×200 box (drawn with Path2D, so the canvas never gets tainted).
  const circle = (cx, cy, r) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
  const SKETCHES = [
    { id: 'flower', name: 'פרח', parts: [
      { d: 'M100 75 C 86 56, 90 40, 100 30 C 110 40, 114 56, 100 75 Z', repeat: 5, cx: 100, cy: 75, w: 2.2, color: '#e06a8b' },
      { d: circle(100, 75, 8), w: 2.2, color: '#f2c14e' },
      { d: 'M100 83 C 95 120, 106 150, 100 192', w: 2.2 },
      { d: 'M101 140 C 118 124, 138 124, 152 116 C 142 138, 122 148, 101 140 Z', w: 2.2, color: '#5f9e6e' },
      { d: 'M99 160 C 84 148, 66 150, 52 144 C 62 164, 82 170, 99 160 Z', w: 2.2, color: '#5f9e6e' }] },
    { id: 'swallow', name: 'סנונית', parts: [
      { d: 'M20 90 C 50 80, 75 85, 95 95 C 105 80, 120 70, 140 68 C 150 60, 165 60, 172 66 C 165 70, 160 74, 158 80 C 175 90, 185 110, 195 135 C 175 120, 160 112, 145 108 C 140 120, 130 135, 110 150 C 115 130, 112 118, 105 110 C 80 112, 50 105, 20 90 Z', fill: true, w: 1.6, color: '#2d5d8a' },
      { d: circle(160, 70, 2.5), fill: true, w: 0, fillOverride: '#fff' }] },
    { id: 'mandala', name: 'מנדלה', parts: [
      { d: circle(100, 100, 14), w: 1.8, color: '#e3b341' },
      { d: circle(100, 100, 40), w: 1.6 },
      { d: circle(100, 100, 78), w: 1.6 },
      { d: 'M100 60 C 92 46, 93 34, 100 24 C 107 34, 108 46, 100 60 Z', repeat: 12, cx: 100, cy: 100, w: 1.8, color: '#7b5ea7' },
      { d: 'M100 86 C 95 78, 95 70, 100 62 C 105 70, 105 78, 100 86 Z', repeat: 8, cx: 100, cy: 100, w: 1.6, color: '#c2402c' },
      { d: circle(100, 15, 2.2), repeat: 24, cx: 100, cy: 100, fill: true, w: 0 }] },
    { id: 'geo', name: 'גיאומטרי', parts: [
      { d: 'M100 18 L182 162 L18 162 Z', w: 2 },
      { d: circle(100, 115, 42), w: 2, color: '#2f7fb5' },
      { d: 'M100 8 L100 192', w: 1.4 },
      { d: 'M10 115 L190 115', w: 1.4 },
      { d: circle(100, 115, 6), fill: true, w: 0 }] },
    { id: 'moon', name: 'ירח', parts: [
      { d: 'M122 28 A72 72 0 1 0 122 172 A90 90 0 0 1 122 28 Z', fill: true, w: 1.6, color: '#e3b341' },
      { d: 'M150 60 l4 10 l10 1 l-8 7 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -7 l10 -1 Z', fill: true, w: 1, color: '#e3b341' },
      { d: 'M162 112 l3 7 l7 1 l-5 5 l2 7 l-7 -4 l-7 4 l2 -7 l-5 -5 l7 -1 Z', fill: true, w: 1, color: '#e3b341' }] },
    { id: 'wave', name: 'גל', parts: [
      { d: 'M12 150 C 30 90, 70 52, 118 64 C 150 72, 160 104, 140 118 C 124 128, 104 116, 112 100 C 118 88, 136 92, 134 104 C 150 96, 146 78, 124 74 C 84 68, 58 110, 60 150 Z', fill: true, w: 1.6, color: '#2f7fb5' },
      { d: 'M12 162 C 60 152, 140 172, 190 160', w: 2 },
      { d: 'M30 176 C 80 168, 130 184, 175 174', w: 1.6 }] },
    { id: 'script', name: 'כיתוב', parts: [
      { text: 'חופש', x: 100, y: 118, size: 64, weight: 300, color: '#b0413e' },
      { d: 'M40 138 C 80 150, 130 126, 168 140', w: 1.6 }] }
  ];
  const WIDTH_BY_STYLE = { fineline: 0.7, minimal: 0.9, blackwork: 1.7, realism: 1.1, color: 1 };

  /* ================= STATE ================= */
  const S = {
    bodySrc: 'builtin', bodyKind: 'forearm', tone: 1, coverUp: false, userBody: null,
    sketchId: 'flower', userSketch: null, style: 'fineline',
    x: 0.5, y: 0.45, scale: 0.38, rot: 0, opacity: 0.92,
    placement: 'forearm', areaCm: 14,
    price: null,            // price form values, filled on entering #/price
    estimate: null, artistId: null, quote: null, lastLeadId: null
  };

  /* ================= HELPERS ================= */
  function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const ch = s => clamp(Math.round(((n >> s) & 255) * f), 0, 255);
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  let toastTimer;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3200); }
  function loadImageFile(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = fr.result; };
      fr.onerror = rej; fr.readAsDataURL(file);
    });
  }
  function downscale(img, max) {
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = mkCanvas(Math.round(img.width * s), Math.round(img.height * s));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  /* ================= LEAD STORAGE ================= */
  const Store = {
    key: 'tatooa.leads.v1', mem: null,
    all() {
      try { const raw = localStorage.getItem(this.key); if (raw) this.mem = JSON.parse(raw); } catch (e) { /* blocked: keep memory copy */ }
      if (!Array.isArray(this.mem)) this.mem = [];
      return this.mem;
    },
    save() { try { localStorage.setItem(this.key, JSON.stringify(this.mem)); return true; } catch (e) { return false; } },
    add(lead) { this.all().unshift(lead); return this.save(); },
    get(id) { return this.all().find(l => l.id === id); },
    update(id, patch) { const l = this.get(id); if (l) { Object.assign(l, patch); this.save(); } return l; },
    clear() { this.mem = []; try { localStorage.removeItem(this.key); } catch (e) { } }
  };

  /* ================= DRAWING ================= */
  const bodyCache = new Map();
  function builtinBody(kind, toneIdx, cover) {
    const key = `${kind}|${toneIdx}|${cover}`;
    if (bodyCache.has(key)) return bodyCache.get(key);
    const b = BODIES[kind], tone = TONES[toneIdx].hex;
    const c = mkCanvas(W, H), g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#3a3431'); bg.addColorStop(1, '#1d1a18');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const p = new Path2D(b.d);
    g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 40; g.fillStyle = tone; g.fill(p); g.restore();
    g.save(); g.clip(p);
    const sh = g.createLinearGradient(b.x0, 0, b.x1, 0);
    sh.addColorStop(0, shade(tone, .55)); sh.addColorStop(.28, shade(tone, .95)); sh.addColorStop(.48, shade(tone, 1.07));
    sh.addColorStop(.72, shade(tone, .9)); sh.addColorStop(1, shade(tone, .5));
    g.fillStyle = sh; g.fillRect(0, 0, W, H);
    const r = rng(7);
    for (let i = 0; i < 6000; i++) { g.fillStyle = r() < .5 ? 'rgba(0,0,0,.035)' : 'rgba(255,255,255,.035)'; g.fillRect(r() * W, r() * H, 2, 2); }
    if (cover) { // a faded old tattoo to cover up
      g.save(); g.globalAlpha = .62; g.filter = 'blur(1.6px)'; g.fillStyle = '#2f4250'; g.strokeStyle = '#2f4250'; g.lineWidth = 7;
      const cx = 400, cy = 450;
      g.translate(cx, cy); g.scale(1.25, 1.25); g.translate(-400, -470);
      g.fill(new Path2D('M330 420 C 360 380, 400 400, 400 440 C 400 400, 440 380, 470 420 C 500 470, 430 530, 400 560 C 370 530, 300 470, 330 420 Z'));
      g.stroke(new Path2D('M300 590 C 340 570, 460 570, 500 590'));
      g.restore();
    }
    g.restore();
    bodyCache.set(key, c);
    return c;
  }

  const sketchCache = new Map();
  function renderSketch(def, style, size = 600) {
    const key = `${def.id}|${style}|${size}`;
    if (sketchCache.has(key)) return sketchCache.get(key);
    const c = mkCanvas(size, size), g = c.getContext('2d');
    const k = size / 200; g.scale(k, k);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const wMul = WIDTH_BY_STYLE[style] || 1;
    for (const p of def.parts) {
      const reps = p.repeat || 1;
      for (let i = 0; i < reps; i++) {
        g.save();
        if (p.repeat) { g.translate(p.cx, p.cy); g.rotate(i * 2 * Math.PI / reps); g.translate(-p.cx, -p.cy); }
        if (p.text) {
          g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
          g.font = `${style === 'blackwork' ? 700 : p.weight} ${p.size}px Heebo, Arial, sans-serif`;
          g.fillStyle = style === 'color' ? p.color : INK;
          g.fillText(p.text, p.x, p.y);
        } else {
          const path = new Path2D(p.d);
          let fill = null;
          if (p.fillOverride) fill = p.fillOverride;
          else if (style === 'color' && p.color) fill = p.color;
          else if (p.fill || (style === 'blackwork' && p.color)) fill = INK;
          else if (style === 'realism' && p.color) fill = 'rgba(20,20,20,.38)';
          if (fill) { g.fillStyle = fill; g.fill(path); }
          if (p.w) { g.strokeStyle = INK; g.lineWidth = p.w * wMul; g.stroke(path); }
        }
        g.restore();
      }
    }
    sketchCache.set(key, c);
    return c;
  }
  function currentSketch() {
    if (S.sketchId === 'user' && S.userSketch) return S.userSketch;
    return renderSketch(SKETCHES.find(s => s.id === S.sketchId) || SKETCHES[0], S.style);
  }
  function currentBody() {
    if (S.bodySrc === 'upload' && S.userBody) return S.userBody;
    return builtinBody(S.bodyKind, S.tone, S.coverUp);
  }
  function drawCover(g, img, w, h) {
    const s = Math.max(w / img.width, h / img.height);
    const dw = img.width * s, dh = img.height * s;
    g.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }
  function drawWatermark(g, w, h) {
    g.save();
    g.globalAlpha = .13; g.fillStyle = '#fff'; g.font = `800 ${w * .06}px Heebo, Arial, sans-serif`; g.textAlign = 'center';
    g.translate(w / 2, h / 2); g.rotate(-Math.PI / 6);
    for (let yy = -h; yy <= h; yy += w * .22) for (let xx = -w; xx <= w; xx += w * .5) g.fillText('TATOOA', xx + (yy / 3 % (w * .25)), yy);
    g.restore();
    g.save();
    const pad = w * .025, bh = w * .055;
    g.fillStyle = 'rgba(20,18,16,.72)'; g.fillRect(pad, h - pad - bh, w * .5, bh);
    g.fillStyle = '#fff'; g.font = `500 ${bh * .48}px Heebo, Arial, sans-serif`; g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('TATOOA · הדמיה להשראה בלבד', pad + w * .25, h - pad - bh / 2);
    g.restore();
  }
  function compose(g, w, h, { watermark = true, outline = false } = {}) {
    g.save();
    g.clearRect(0, 0, w, h); g.fillStyle = '#1d1a18'; g.fillRect(0, 0, w, h);
    drawCover(g, currentBody(), w, h);
    const sk = currentSketch();
    const sw = S.scale * w, shh = sw * sk.height / sk.width;
    g.save();
    g.translate(S.x * w, S.y * h); g.rotate(S.rot * Math.PI / 180);
    g.globalAlpha = S.opacity; g.globalCompositeOperation = 'multiply';
    g.drawImage(sk, -sw / 2, -shh / 2, sw, shh);
    g.restore();
    if (outline) {
      g.save(); g.translate(S.x * w, S.y * h); g.rotate(S.rot * Math.PI / 180);
      g.lineWidth = 2; g.strokeStyle = 'rgba(20,18,16,.45)';
      g.strokeRect(-sw / 2 - 6, -shh / 2 - 6, sw + 12, shh + 12);
      g.setLineDash([10, 8]); g.strokeStyle = 'rgba(255,255,255,.8)';
      g.strokeRect(-sw / 2 - 6, -shh / 2 - 6, sw + 12, shh + 12); g.restore();
    }
    if (watermark) drawWatermark(g, w, h);
    g.restore();
  }
  function snapshot(w, h, type = 'image/jpeg', q = .82) {
    const c = mkCanvas(w, h); compose(c.getContext('2d'), w, h); return c.toDataURL(type, q);
  }
  function stencilDataURL() {
    const sk = currentSketch(); const s = Math.min(1, 500 / Math.max(sk.width, sk.height));
    const c = mkCanvas(Math.round(sk.width * s), Math.round(sk.height * s)); const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(sk, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }
  function sizeCm() {
    const sk = currentSketch();
    const w = S.scale * S.areaCm;
    return { w, h: w * sk.height / sk.width };
  }

  /* ================= STUDIO ================= */
  const stage = $('#stage'), sg = stage.getContext('2d');
  let raf = 0;
  function draw() { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { compose(sg, W, H, { outline: true }); updateReadout(); }); }
  function updateReadout() {
    const { w, h } = sizeCm();
    $('#sizeReadout').textContent = `גודל משוער: ${cm(w)} × ${cm(h)} ס״מ · ${PLACEMENTS[S.placement].label}`;
  }
  function chip(label, pressed, attrs = '') { return `<button type="button" class="chip" aria-pressed="${pressed}" ${attrs}>${esc(label)}</button>`; }

  function renderStudioControls() {
    const bodyChips = Object.entries(BODIES).map(([k, b]) => chip(b.label, S.bodySrc === 'builtin' && S.bodyKind === k, `data-body="${k}"`)).join('')
      + (S.userBody ? chip('התמונה שלי', S.bodySrc === 'upload', 'data-body="upload"') : '');
    $('#bodyChips').innerHTML = bodyChips;
    $('#toneChips').innerHTML = TONES.map((t, i) =>
      `<button type="button" class="chip swatch" style="background:${t.hex}" aria-pressed="${S.tone === i}" aria-label="גוון ${t.name}" title="${t.name}" data-tone="${i}"></button>`).join('');
    $('#toneWrap').hidden = S.bodySrc === 'upload';
    $('#coverUp').checked = S.coverUp;
    $('#coverHint').hidden = !S.coverUp;
    $('#styleChips').innerHTML = Object.entries(STYLES).map(([k, v]) => chip(v, S.style === k, `data-style="${k}"`)).join('');
    renderSketchGrid();
    syncSliders();
  }
  function renderSketchGrid() {
    const grid = $('#sketchGrid'); grid.innerHTML = '';
    const items = SKETCHES.map(s => ({ id: s.id, name: s.name, cv: renderSketch(s, S.style, 600) }));
    if (S.userSketch) items.push({ id: 'user', name: 'הסקיצה שלי', cv: S.userSketch });
    for (const it of items) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'sketch-btn'; b.dataset.sketch = it.id;
      b.setAttribute('aria-pressed', S.sketchId === it.id); b.setAttribute('aria-label', it.name); b.title = it.name;
      const t = mkCanvas(120, 120), tg = t.getContext('2d');
      const s = Math.min(120 / it.cv.width, 120 / it.cv.height);
      tg.drawImage(it.cv, (120 - it.cv.width * s) / 2, (120 - it.cv.height * s) / 2, it.cv.width * s, it.cv.height * s);
      b.appendChild(t); grid.appendChild(b);
    }
  }
  function syncSliders() {
    $('#scale').value = Math.round(S.scale * 100); $('#scaleOut').textContent = Math.round(S.scale * 100) + '%';
    $('#rot').value = Math.round(S.rot); $('#rotOut').textContent = Math.round(S.rot) + '°';
    $('#opacity').value = Math.round(S.opacity * 100); $('#opOut').textContent = Math.round(S.opacity * 100) + '%';
    $('#placement').value = S.placement; $('#areaCm').value = S.areaCm;
  }
  function setPlacement(p, setArea = true) { S.placement = p; if (setArea) S.areaCm = PLACEMENTS[p].cm; }

  function initStudio() {
    $('#placement').innerHTML = Object.entries(PLACEMENTS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');
    $('#bodyChips').addEventListener('click', e => {
      const b = e.target.closest('[data-body]'); if (!b) return;
      if (b.dataset.body === 'upload') S.bodySrc = 'upload';
      else { S.bodySrc = 'builtin'; S.bodyKind = b.dataset.body; setPlacement(BODIES[S.bodyKind].placement); }
      renderStudioControls(); draw();
    });
    $('#toneChips').addEventListener('click', e => { const b = e.target.closest('[data-tone]'); if (!b) return; S.tone = +b.dataset.tone; renderStudioControls(); draw(); });
    $('#styleChips').addEventListener('click', e => { const b = e.target.closest('[data-style]'); if (!b) return; S.style = b.dataset.style; renderStudioControls(); draw(); });
    $('#sketchGrid').addEventListener('click', e => { const b = e.target.closest('[data-sketch]'); if (!b) return; S.sketchId = b.dataset.sketch; renderStudioControls(); draw(); });
    $('#coverUp').addEventListener('change', e => { S.coverUp = e.target.checked; renderStudioControls(); draw(); });
    $('#placement').addEventListener('change', e => { setPlacement(e.target.value); syncSliders(); draw(); });
    $('#areaCm').addEventListener('input', e => { const v = parseFloat(e.target.value); if (v > 0) { S.areaCm = clamp(v, 2, 120); draw(); } });
    $('#scale').addEventListener('input', e => { S.scale = e.target.value / 100; syncSliders(); draw(); });
    $('#rot').addEventListener('input', e => { S.rot = +e.target.value; syncSliders(); draw(); });
    $('#opacity').addEventListener('input', e => { S.opacity = e.target.value / 100; syncSliders(); draw(); });
    $('#resetPos').addEventListener('click', () => { Object.assign(S, { x: .5, y: .45, scale: .38, rot: 0, opacity: .92 }); syncSliders(); draw(); });

    $('#bodyFile').addEventListener('change', async e => {
      const f = e.target.files[0]; if (!f) return;
      try { S.userBody = downscale(await loadImageFile(f), 1600); S.bodySrc = 'upload'; renderStudioControls(); draw(); toast('התמונה נטענה. עכשיו מקמו את הסקיצה.'); }
      catch (err) { toast('לא הצלחנו לקרוא את התמונה. נסו קובץ JPG או PNG.'); }
      e.target.value = '';
    });
    $('#sketchFile').addEventListener('change', async e => {
      const f = e.target.files[0]; if (!f) return;
      try { S.userSketch = removeWhite(downscale(await loadImageFile(f), 800)); S.sketchId = 'user'; renderStudioControls(); draw(); toast('הסקיצה נטענה והרקע הלבן הוסר.'); }
      catch (err) { toast('לא הצלחנו לקרוא את הסקיצה. נסו קובץ JPG או PNG.'); }
      e.target.value = '';
    });
    $('#shareBtn').addEventListener('click', share);
    initGestures();
  }
  function removeWhite(c) {
    const g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
      if (l > 235) d[i + 3] = 0; else if (l > 170) d[i + 3] = d[i + 3] * (235 - l) / 65;
    }
    g.putImageData(im, 0, 0); return c;
  }

  function initGestures() {
    const ptrs = new Map(); let gs = null;
    const pt = e => { const r = stage.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
    const start = () => {
      const v = [...ptrs.values()];
      if (v.length === 1) gs = { p0: v[0], x0: S.x, y0: S.y };
      else if (v.length >= 2) gs = { d0: Math.hypot(v[1].x - v[0].x, v[1].y - v[0].y) || 1, a0: Math.atan2(v[1].y - v[0].y, v[1].x - v[0].x), s0: S.scale, r0: S.rot };
      else gs = null;
    };
    stage.addEventListener('pointerdown', e => { stage.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, pt(e)); start(); e.preventDefault(); });
    stage.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId) || !gs) return;
      ptrs.set(e.pointerId, pt(e));
      const v = [...ptrs.values()];
      if (v.length === 1 && gs.p0) {
        S.x = clamp(gs.x0 + (v[0].x - gs.p0.x) / W, 0, 1); S.y = clamp(gs.y0 + (v[0].y - gs.p0.y) / H, 0, 1);
      } else if (v.length >= 2 && gs.d0) {
        const d = Math.hypot(v[1].x - v[0].x, v[1].y - v[0].y), a = Math.atan2(v[1].y - v[0].y, v[1].x - v[0].x);
        S.scale = clamp(gs.s0 * d / gs.d0, .08, .9);
        S.rot = ((gs.r0 + (a - gs.a0) * 180 / Math.PI + 540) % 360) - 180;
      }
      syncSliders(); draw();
    });
    const end = e => { ptrs.delete(e.pointerId); start(); };
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    stage.addEventListener('wheel', e => { e.preventDefault(); S.scale = clamp(S.scale * (e.deltaY < 0 ? 1.05 : .95), .08, .9); syncSliders(); draw(); }, { passive: false });
    stage.addEventListener('keydown', e => {
      const step = e.shiftKey ? .05 : .01; let used = true;
      switch (e.key) {
        case 'ArrowLeft': S.x = clamp(S.x - step, 0, 1); break;
        case 'ArrowRight': S.x = clamp(S.x + step, 0, 1); break;
        case 'ArrowUp': S.y = clamp(S.y - step, 0, 1); break;
        case 'ArrowDown': S.y = clamp(S.y + step, 0, 1); break;
        case '+': case '=': S.scale = clamp(S.scale + .02, .08, .9); break;
        case '-': S.scale = clamp(S.scale - .02, .08, .9); break;
        case '[': S.rot = Math.max(-180, S.rot - 5); break;
        case ']': S.rot = Math.min(180, S.rot + 5); break;
        default: used = false;
      }
      if (used) { e.preventDefault(); syncSliders(); draw(); }
    });
  }

  function share() {
    const c = mkCanvas(W, H); compose(c.getContext('2d'), W, H);
    c.toBlob(async blob => {
      if (!blob) return;
      const file = new File([blob], 'tatooa-preview.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'TATOOA', text: 'מה דעתכם על הקעקוע הזה?' }); } catch (e) { /* cancelled */ }
      } else {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'tatooa-preview.png';
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        toast('התמונה נשמרה. אפשר לשתף אותה בוואטסאפ או בסטורי.');
      }
    }, 'image/png');
  }

  /* ================= PRICE ================= */
  function estimate(p) {
    const area = Math.max(4, p.w * p.h);
    const mult = PRICING.placement[p.placement] * PRICING.complexity[p.complexity]
      * (p.color === 'color' ? PRICING.color : 1) * (p.coverUp ? PRICING.coverUp : 1);
    const per = PRICING.perCm2[p.style];
    const mid = Math.max(PRICING.minimum, (PRICING.base + area * per * PRICING.coverage) * mult);
    return { area, mult, per, mid: round50(mid), low: round50(Math.max(PRICING.minimum, mid * PRICING.spread[0])), high: round50(mid * PRICING.spread[1]) };
  }
  function enterPrice() {
    const { w, h } = sizeCm();
    S.price = {
      w: Math.round(w * 2) / 2, h: Math.round(h * 2) / 2, placement: S.placement, style: S.style,
      color: S.style === 'color' ? 'color' : (S.price?.color === 'color' && S.style !== 'color' ? 'bw' : (S.price?.color || 'bw')),
      complexity: S.price?.complexity || 2, coverUp: S.coverUp, budget: S.price?.budget || ''
    };
    $('#pW').value = S.price.w; $('#pH').value = S.price.h;
    $('#pPlacement').value = S.price.placement; $('#pStyle').value = S.price.style; $('#pColor').value = S.price.color;
    $$('input[name=pCx]').forEach(r => r.checked = +r.value === S.price.complexity);
    $('#pCover').checked = S.price.coverUp; $('#pBudget').value = S.price.budget;
    renderPrice();
  }
  function readPrice() {
    S.price = {
      w: clamp(parseFloat($('#pW').value) || 1, .5, 120), h: clamp(parseFloat($('#pH').value) || 1, .5, 120),
      placement: $('#pPlacement').value, style: $('#pStyle').value, color: $('#pColor').value,
      complexity: +($('input[name=pCx]:checked')?.value || 2), coverUp: $('#pCover').checked,
      budget: $('#pBudget').value === '' ? '' : Math.max(0, parseFloat($('#pBudget').value) || 0)
    };
  }
  function renderPrice() {
    const p = S.price, e = estimate(p); S.estimate = e;
    $('#priceRange').textContent = `${fmt(e.low)} – ${fmt(e.high)}`;
    const rows = [
      ['גודל', `${cm(p.w)} × ${cm(p.h)} ס״מ (≈ ${Math.round(e.area)} סמ״ר)`],
      ['סגנון', `${STYLES[p.style]} · ${fmt(e.per)} לסמ״ר מכוסה`],
      ['אזור בגוף', `${PLACEMENTS[p.placement].label} · ×${PRICING.placement[p.placement]}`],
      ['מורכבות', `×${PRICING.complexity[p.complexity]}`]
    ];
    if (p.color === 'color') rows.push(['צבע', `×${PRICING.color}`]);
    if (p.coverUp) rows.push(['Cover-Up', `×${PRICING.coverUp}`]);
    $('#priceBreakdown').innerHTML = rows.map(([a, b]) => `<li><span>${a}</span><b>${esc(b)}</b></li>`).join('');
    const al = $('#budgetAlert');
    if (p.budget === '' || p.budget === 0) { al.hidden = true; return; }
    al.hidden = false;
    if (p.budget >= e.low) {
      al.className = 'alert ok';
      al.textContent = p.budget >= e.high ? 'התקציב שלכם מכסה את כל הטווח.' : 'התקציב שלכם בתוך הטווח המקובל.';
    } else {
      al.className = 'alert warn';
      const k = e.mult * PRICING.spread[0];
      const maxArea = (p.budget / k - PRICING.base) / (e.per * PRICING.coverage);
      const ratio = p.w / p.h;
      let tip = 'כדאי לשקול סגנון מינימליסטי או לפנות לאמן/ית לייעוץ.';
      if (maxArea >= 6) {
        const nw = Math.sqrt(maxArea * ratio), nh = nw / ratio;
        tip = `בתקציב הזה אפשר בערך ${cm(nw)} × ${cm(nh)} ס״מ באותו סגנון.`;
      }
      const severe = p.budget < e.low * .6;
      al.innerHTML = `<b>${severe ? 'התקציב לא ריאלי לעבודה הזו.' : 'התקציב נמוך מהטווח המקובל.'}</b> ${esc(tip)}`;
    }
  }
  function initPrice() {
    $('#pPlacement').innerHTML = Object.entries(PLACEMENTS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');
    $('#pStyle').innerHTML = Object.entries(STYLES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
    $('#priceForm').addEventListener('input', () => { readPrice(); renderPrice(); });
    $('#priceForm').addEventListener('change', () => { readPrice(); renderPrice(); });
  }

  /* ================= ARTISTS ================= */
  function quoteFor(a) { return Math.max(a.min, round50(S.estimate.mid * a.factor)); }
  function portfolioCanvas(id, style) {
    const c = mkCanvas(160, 160), g = c.getContext('2d');
    g.fillStyle = '#f1e3d3'; g.fillRect(0, 0, 160, 160);
    g.globalCompositeOperation = 'multiply';
    g.drawImage(renderSketch(SKETCHES.find(s => s.id === id), style, 600), 14, 14, 132, 132);
    return c;
  }
  function rankedArtists() {
    const p = S.price;
    return ARTISTS.map(a => {
      const q = quoteFor(a), styleMatch = a.styles.includes(p.style);
      const fits = p.budget ? q <= p.budget : null;
      const score = (styleMatch ? 3 : 0) + (fits === true ? 2 : fits === null ? 1 : 0) + (p.coverUp && a.coverUp ? 2 : 0) + a.rating;
      return { a, q, styleMatch, fits, score };
    }).sort((x, y) => y.score - x.score);
  }
  function enterArtists() {
    if (!S.price) enterPrice();
    const p = S.price, list = rankedArtists();
    $('#artistsIntro').textContent = `${STYLES[p.style]} · ${PLACEMENTS[p.placement].label} · ${cm(p.w)}×${cm(p.h)} ס״מ` + (p.budget ? ` · תקציב עד ${fmt(p.budget)}` : '') + '. ממוינים לפי התאמה.';
    const wrap = $('#artistList'); wrap.innerHTML = '';
    list.forEach((r, i) => {
      const { a } = r;
      const el = document.createElement('article'); el.className = 'card artist';
      const tags = a.styles.map(s => `<span class="tag ${s === p.style ? 'match' : ''}">${STYLES[s]}</span>`).join('')
        + (a.coverUp ? '<span class="tag">מתמחה ב־Cover-Up</span>' : '');
      const fitTag = r.fits === true ? '<span class="tag good">בתקציב</span>' : r.fits === false ? '<span class="tag bad">מעל התקציב</span>' : '';
      el.innerHTML = `
        ${i < 3 ? `<span class="rank">התאמה #${i + 1}</span>` : ''}
        <div class="artist-top"><div class="avatar" aria-hidden="true">${esc(a.name[0])}</div>
          <div><h3>${esc(a.name)} · ${esc(a.studio)}</h3><p class="meta">${esc(a.city)} · ★ ${a.rating} (${a.reviews} ביקורות)</p></div></div>
        <div class="tags">${tags}</div>
        <div class="portfolio" aria-label="תיק עבודות לדוגמה"></div>
        <div class="quote"><span>הצעה משוערת ${fitTag}</span><b>${fmt(r.q)}</b></div>
        <button type="button" class="btn primary" data-pick="${a.id}">שליחת בקשה להצעת מחיר</button>`;
      const pf = el.querySelector('.portfolio');
      a.portfolio.forEach(id => pf.appendChild(portfolioCanvas(id, a.styles[0])));
      wrap.appendChild(el);
    });
  }
  function initArtists() {
    $('#artistList').addEventListener('click', e => {
      const b = e.target.closest('[data-pick]'); if (!b) return;
      S.artistId = b.dataset.pick; location.hash = '#/request';
    });
  }

  /* ================= REQUEST ================= */
  let simPreview = '';
  function enterRequest() {
    const a = ARTISTS.find(x => x.id === S.artistId);
    S.quote = quoteFor(a);
    const p = S.price, dep = depositOf(S.quote);
    simPreview = snapshot(480, 600);
    $('#requestSummary').innerHTML = `
      <img src="${simPreview}" alt="ההדמיה שתישלח לאמן/ית">
      <dl>
        <dt>אמן/ית</dt><dd>${esc(a.name)} · ${esc(a.studio)}, ${esc(a.city)}</dd>
        <dt>סגנון</dt><dd>${STYLES[p.style]}${p.coverUp ? ' · Cover-Up' : ''}</dd>
        <dt>מיקום</dt><dd>${PLACEMENTS[p.placement].label}</dd>
        <dt>גודל</dt><dd>${cm(p.w)} × ${cm(p.h)} ס״מ</dd>
        <dt>הערכה</dt><dd>${fmt(S.estimate.low)} – ${fmt(S.estimate.high)}</dd>
        <dt>תקציב</dt><dd>${p.budget ? fmt(p.budget) : 'לא צוין'}</dd>
      </dl>`;
    $('#depositBox').innerHTML = `
      <b>הצעה משוערת: ${fmt(S.quote)}</b>
      <div class="split" aria-hidden="true"><i></i><i></i></div>
      <div class="legend"><span>מקדמה 15% בעת קביעת התור: <b>${fmt(dep)}</b></span><span>יתרה 85% בסטודיו: <b>${fmt(S.quote - dep)}</b></span></div>
      <p class="fine" style="margin:8px 0 0">כולל <b>ביטוח קעקוע</b>: תיקון בחינם כשהתור נקבע דרך TATOOA.</p>`;
    $('#requestError').hidden = true;
  }
  function initRequest() {
    $('#requestForm').addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target, err = $('#requestError');
      const bad = [...f.querySelectorAll('input[required]')].find(i => !i.checkValidity());
      if (bad) {
        const msg = bad.type === 'checkbox' ? 'יש לאשר את שתי ההצהרות כדי לשלוח.' : bad.id === 'rPhone' ? 'מספר הטלפון לא נראה תקין.' : 'יש למלא שם וטלפון.';
        err.textContent = msg; err.hidden = false; bad.focus(); return;
      }
      err.hidden = true;
      const p = S.price, a = ARTISTS.find(x => x.id === S.artistId);
      const lead = {
        id: 'L' + Date.now().toString(36), createdAt: new Date().toISOString(), artistId: a.id, status: 'new',
        client: { name: $('#rName').value.trim(), phone: $('#rPhone').value.trim(), city: $('#rCity').value.trim(), dates: $('#rDates').value.trim(), notes: $('#rNotes').value.trim() },
        details: { ...p }, estimate: { low: S.estimate.low, high: S.estimate.high, mid: S.estimate.mid }, quote: S.quote,
        sim: simPreview, stencil: stencilDataURL(), healthSent: false, aftercareSent: false
      };
      const saved = Store.add(lead);
      S.lastLeadId = lead.id;
      if (!saved) toast('הדפדפן חוסם שמירה מקומית: הפנייה תישמר רק עד רענון הדף.');
      f.reset();
      location.hash = '#/done';
    });
  }
  function enterDone() {
    const l = Store.get(S.lastLeadId); if (!l) { location.hash = '#/home'; return false; }
    const a = ARTISTS.find(x => x.id === l.artistId);
    $('#doneSummary').innerHTML = `<p>הבקשה נשלחה אל <b>${esc(a.name)}</b> (${esc(a.studio)}). בדרך כלל עונים תוך 24 שעות.</p>
      <p class="fine">אם התור יאושר תתבקשו לשלם מקדמה של 15% (${fmt(depositOf(l.quote))}). לפני ההגעה יישלח אליכם טופס הצהרת בריאות.</p>`;
    return true;
  }

  /* ================= ARTIST INBOX ================= */
  const STATUS = { new: 'חדש', countered: 'הצעה נגדית', approved: 'ממתין למקדמה', booked: 'תור נקבע', declined: 'נדחה' };
  let counterOpen = null;
  function enterArtist() {
    const sel = $('#artistSelect');
    if (!sel.options.length) {
      sel.innerHTML = '<option value="all">כל האמנים (תצוגת הדגמה)</option>' + ARTISTS.map(a => `<option value="${a.id}">${esc(a.name)} · ${esc(a.studio)}</option>`).join('');
    }
    const last = Store.get(S.lastLeadId);
    if (last && sel.dataset.auto !== S.lastLeadId) { sel.value = last.artistId; sel.dataset.auto = S.lastLeadId; }
    renderInbox();
  }
  function renderInbox() {
    const who = $('#artistSelect').value || 'all';
    const leads = Store.all().filter(l => who === 'all' || l.artistId === who);
    const count = s => leads.filter(l => l.status === s).length;
    $('#inboxStats').innerHTML = `<span class="stat"><b>${count('new')}</b>חדשות</span><span class="stat"><b>${count('approved') + count('countered')}</b>ממתינות</span><span class="stat"><b>${count('booked')}</b>תורים</span>`;
    $('#leadEmpty').hidden = leads.length > 0;
    $('#leadList').innerHTML = leads.map(leadCard).join('');
  }
  function leadCard(l) {
    const a = ARTISTS.find(x => x.id === l.artistId), d = l.details, dep = depositOf(l.quote);
    const price = l.counter ? l.counter.price : l.quote;
    const budgetLine = d.budget
      ? `${fmt(d.budget)} ${d.budget >= l.estimate.low ? '<span class="tag good">מתאים להערכה</span>' : '<span class="tag bad">מתחת להערכה</span>'}`
      : 'לא צוין';
    const date = new Date(l.createdAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
    let actions = '';
    if (l.status === 'new') {
      actions = counterOpen === l.id ? `
        <div class="counter">
          <label class="field"><span>מחיר מוצע (₪)</span><input type="number" min="0" step="50" id="cPrice-${l.id}" value="${l.quote}"></label>
          <label class="field"><span>מועד מוצע</span><input type="text" id="cDate-${l.id}" placeholder="למשל: יום ג׳, 16:00"></label>
          <button type="button" class="btn dark small" data-act="sendCounter" data-id="${l.id}">שליחת ההצעה</button>
          <button type="button" class="btn text" data-act="cancelCounter" data-id="${l.id}">ביטול</button>
        </div>` : `
        <button type="button" class="btn primary small" data-act="approve" data-id="${l.id}">אישור ב־${fmt(l.quote)}</button>
        <button type="button" class="btn ghost small" data-act="counter" data-id="${l.id}">הצעת מחיר/מועד אחר</button>
        <button type="button" class="btn text" data-act="decline" data-id="${l.id}">דחייה</button>`;
    } else if (l.status === 'countered') {
      actions = `<p class="fine">נשלחה הצעה: ${fmt(l.counter.price)}${l.counter.date ? ', ' + esc(l.counter.date) : ''}. ממתין ללקוח/ה.</p>
        <button type="button" class="btn dark small" data-act="clientAccepts" data-id="${l.id}">סימולציה: הלקוח/ה אישר/ה</button>`;
    } else if (l.status === 'approved') {
      actions = `<p class="fine">ממתין למקדמה של ${fmt(depositOf(price))} מהלקוח/ה.</p>
        <button type="button" class="btn dark small" data-act="pay" data-id="${l.id}">סימולציה: המקדמה נסלקה</button>`;
    } else if (l.status === 'booked') {
      const pdep = depositOf(price);
      actions = `<p class="fine">מקדמה ${fmt(pdep)} נסלקה · יתרה לגבייה בסטודיו: <b>${fmt(price - pdep)}</b></p>
        <button type="button" class="btn ghost small" data-act="health" data-id="${l.id}" ${l.healthSent ? 'disabled' : ''}>${l.healthSent ? 'הצהרת בריאות נשלחה ✓' : 'שליחת הצהרת בריאות'}</button>
        <button type="button" class="btn ghost small" data-act="aftercare" data-id="${l.id}" ${l.aftercareSent ? 'disabled' : ''}>${l.aftercareSent ? 'הוראות טיפול נשלחו ✓' : 'שליחת הוראות טיפול (Aftercare)'}</button>`;
    } else {
      actions = '<p class="fine">הפנייה נדחתה.</p>';
    }
    const stencil = l.status === 'booked'
      ? `<div class="stencil"><img src="${l.stencil}" alt="סטנסיל נקי של הסקיצה"><a class="btn dark small" href="${l.stencil}" download="tatooa-stencil-${l.id}.png">הורדת סטנסיל נקי</a></div>`
      : `<div class="stencil locked"><b>הסטנסיל נעול</b><br>הסקיצה הנקייה, ללא סימן מים, נפתחת אחרי סליקת המקדמה.</div>`;
    return `<article class="card lead">
      <div class="sim"><img src="${l.sim}" alt="הדמיית הלקוח/ה עם סימן מים"></div>
      <div>
        <h3>${esc(l.client.name)} <span class="status ${l.status}">${STATUS[l.status]}</span></h3>
        <p class="fine">${date}${$('#artistSelect').value === 'all' ? ' · אל ' + esc(a.name) : ''}</p>
        <dl>
          <dt>סגנון</dt><dd>${STYLES[d.style]}${d.color === 'color' ? ' · צבעוני' : ''}${d.coverUp ? ' · <b>Cover-Up</b>' : ''}</dd>
          <dt>מיקום</dt><dd>${PLACEMENTS[d.placement].label}</dd>
          <dt>גודל</dt><dd>${cm(d.w)} × ${cm(d.h)} ס״מ</dd>
          <dt>הערכה</dt><dd>${fmt(l.estimate.low)} – ${fmt(l.estimate.high)}</dd>
          <dt>תקציב</dt><dd>${budgetLine}</dd>
          <dt>טלפון</dt><dd dir="ltr" style="text-align:end">${esc(l.client.phone)}</dd>
          ${l.client.city ? `<dt>עיר</dt><dd>${esc(l.client.city)}</dd>` : ''}
          ${l.client.dates ? `<dt>מועדים</dt><dd>${esc(l.client.dates)}</dd>` : ''}
        </dl>
        ${l.client.notes ? `<p class="notes">${esc(l.client.notes)}</p>` : ''}
      </div>
      <div class="lead-actions">${actions}${stencil}</div>
    </article>`;
  }
  function initArtist() {
    $('#artistSelect').addEventListener('change', renderInbox);
    $('#leadList').addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const id = b.dataset.id;
      switch (b.dataset.act) {
        case 'approve': Store.update(id, { status: 'approved' }); toast('אושר. הלקוח/ה יתבקש/תתבקש לשלם מקדמה.'); break;
        case 'counter': counterOpen = id; break;
        case 'cancelCounter': counterOpen = null; break;
        case 'sendCounter': {
          const price = Math.max(0, parseFloat($(`#cPrice-${id}`).value) || 0);
          Store.update(id, { status: 'countered', counter: { price, date: $(`#cDate-${id}`).value.trim() } });
          counterOpen = null; toast('ההצעה נשלחה ללקוח/ה.'); break;
        }
        case 'clientAccepts': Store.update(id, { status: 'approved' }); break;
        case 'decline': Store.update(id, { status: 'declined' }); break;
        case 'pay': Store.update(id, { status: 'booked' }); toast('המקדמה נסלקה. הסטנסיל הנקי נפתח.'); break;
        case 'health': Store.update(id, { healthSent: true }); toast('טופס הצהרת בריאות נשלח ללקוח/ה.'); break;
        case 'aftercare': Store.update(id, { aftercareSent: true }); toast('הוראות הטיפול נשלחו.'); break;
      }
      renderInbox();
    });
    $('#clearDemo').addEventListener('click', () => {
      if (!confirm('למחוק את כל פניות ההדגמה מהדפדפן הזה?')) return;
      Store.clear(); S.lastLeadId = null; renderInbox(); toast('נתוני ההדגמה נמחקו.');
    });
    window.addEventListener('storage', e => { if (e.key === Store.key && currentScreen === 'artist') renderInbox(); });
  }

  /* ================= SOUND ================= */
  // Store-entry style "achievement" chime, synthesized with Web Audio (no audio file, no licensing).
  // Plays when the client finishes the simulation (clicks "להערכת מחיר"). Mute choice is remembered.
  const Sound = (() => {
    const KEY = 'tatooa.muted.v1';
    let ctx = null, muted = false;
    try { muted = localStorage.getItem(KEY) === '1'; } catch (e) { }
    const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function bell(ac, freq, t, dur, gain) {
      // a bell = a few sine partials with a fast attack and an exponential decay
      [[1, 1], [2.01, .35], [3.99, .12]].forEach(([mult, amp]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = freq * mult;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(gain * amp, t + .012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(ac.destination);
        o.start(t); o.stop(t + dur + .05);
      });
    }
    function chime() {
      if (muted || reduceMotion()) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = ctx || new AC();
        if (ctx.state === 'suspended') ctx.resume();
        const t = ctx.currentTime + .02;
        // ding-dong-DING: E5, G5, then a bright C6 that rings longer
        bell(ctx, 659.25, t, .45, .22);
        bell(ctx, 783.99, t + .14, .45, .22);
        bell(ctx, 1046.5, t + .30, 1.1, .26);
      } catch (e) { }
    }
    function setMuted(m) {
      muted = m;
      try { localStorage.setItem(KEY, m ? '1' : '0'); } catch (e) { }
    }
    return { chime, setMuted, get muted() { return muted; } };
  })();
  function initSound() {
    const btn = $('#muteBtn');
    const paint = () => {
      btn.setAttribute('aria-pressed', String(Sound.muted));
      btn.textContent = Sound.muted ? '🔇' : '🔔';
      btn.title = btn.ariaLabel = Sound.muted ? 'הפעלת צלילים' : 'השתקת צלילים';
    };
    btn.addEventListener('click', () => { Sound.setMuted(!Sound.muted); paint(); if (!Sound.muted) Sound.chime(); });
    paint();
    // The click is a user gesture, so the browser allows audio to start.
    $('[data-screen="studio"] .actions a[href="#/price"]').addEventListener('click', Sound.chime);
  }

  /* ================= ROUTER ================= */
  const FLOW = ['studio', 'price', 'artists', 'request'];
  let currentScreen = null;
  function route() {
    let name = (location.hash.match(/^#\/(\w+)/) || [])[1] || 'home';
    if (!$(`[data-screen="${name}"]`)) name = 'home';
    if (name === 'request' && !S.artistId) { location.replace('#/artists'); return; }
    if ((name === 'artists' || name === 'request') && !S.price) enterPrice();
    if (name === 'price') enterPrice();
    if (name === 'artists') enterArtists();
    if (name === 'request') enterRequest();
    if (name === 'done' && !enterDone()) return;
    if (name === 'artist') enterArtist();
    if (name === 'studio') draw();

    $$('.screen').forEach(s => s.classList.toggle('active', s.dataset.screen === name));
    $$('[data-nav]').forEach(a => {
      const on = a.dataset.nav === name || (a.dataset.nav === 'studio' && FLOW.includes(name));
      a.classList.toggle('active', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });
    const idx = FLOW.indexOf(name);
    $('#stepper').hidden = idx < 0;
    $$('#stepper li').forEach((li, i) => { li.classList.toggle('current', i === idx); li.classList.toggle('done', idx > -1 && i < idx); });
    if (currentScreen !== null) { window.scrollTo(0, 0); $(`[data-screen="${name}"] h1`)?.focus({ preventScroll: true }); }
    currentScreen = name;
  }

  /* ================= INIT ================= */
  function drawHero() {
    const c = $('#heroCanvas');
    compose(c.getContext('2d'), W, H);
  }
  initSound();
  initStudio(); initPrice(); initArtists(); initRequest(); initArtist();
  renderStudioControls();
  drawHero();
  window.addEventListener('hashchange', route);
  route();
  // Re-render canvases once Heebo is loaded (used by the script sketch and the watermark).
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('300 64px Heebo'), document.fonts.load('800 40px Heebo'), document.fonts.load('500 20px Heebo')])
      .then(() => { sketchCache.clear(); renderSketchGrid(); drawHero(); draw(); }).catch(() => { });
  }
})();
