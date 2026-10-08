/* CATALOG WEATHER -- the scene's rain and snow, in a card. The same three levels as the scene's
   links: rain drizzle / shower / tempest, snow (winter) flurries / snow / blizzard.

   CatalogWeather.card(wrap, svg, opts) adds weather to one card:
     - a canvas over the card with the falling rain or snow (slanted by the wind, gusting in
       bursts at the top snow level), a darker sky with the level, lightning at a tempest;
     - weather ON a shape: rain beads and drips off its lower edges, or snowflakes that drift
       down and stick to its top edges, then melt (flurries melt almost at once). The shape's
       outline comes from a one-off raster of it; the drops live in an SVG group that the card
       moves along with the shape (follow(x, y)).
   opts: { target: () => ({ svgText, w, h }) } the shape to weather, as a standalone SVG string
   at w x h card units. Returns { set(kind, level), follow(x, y), rebuild(), stop() }. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LEVELS = { rain: ['Drizzle', 'Shower', 'Tempest'], snow: ['Flurries', 'Snow', 'Blizzard'] };
  const LV = [0, 0.4, 0.7, 1];

  // Where the ink is: top edges (open air above), bottom edges (open air below), inside points.
  function outline(svgText, w, h, R) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const W = Math.round(w * R), H = Math.round(h * R);
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0, W, H);
        let px; try { px = ctx.getImageData(0, 0, W, H).data; } catch (e) { res(null); return; }
        const ink = (x, y) => y >= 0 && y < H && px[(y * W + x) * 4 + 3] > 140, clear = Math.max(4, Math.round(H * 0.06));
        const top = [], bottom = [], coat = [];
        for (let x = 2; x < W - 2; x += 2) for (let y = 1; y < H - 1; y++) {
          if (!ink(x, y)) continue;
          if (!ink(x, y - 1)) { let ok = true; for (let k = 2; k <= clear && ok; k++) if (ink(x, y - k)) ok = false; if (ok) top.push([x / R, y / R]); }
          if (!ink(x, y + 1)) { let ok = true; for (let k = 2; k <= clear && ok; k++) if (ink(x, y + k)) ok = false; if (ok && y < H * 0.97) bottom.push([x / R, y / R]); }
          else if (y % 7 === 0 && x % 8 === 2 && ink(x, y - 4) && ink(x, y + 4)) coat.push([x / R, y / R]);
        }
        res({ top, bottom, coat });
      };
      img.onerror = () => res(null);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);
    });
  }
  const any = (a) => a[Math.floor(Math.random() * a.length)];

  function card(wrap, svg, opts) {
    const uid = 'wx' + Math.random().toString(36).slice(2, 7);
    const defs = el('defs', {}, svg);
    defs.innerHTML = `<radialGradient id="${uid}f" cx=".45" cy=".4"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#eef4fb"/><stop offset=".7" stop-color="#e9f1fb" stop-opacity=".5"/><stop offset="1" stop-color="#e9f1fb" stop-opacity="0"/></radialGradient>`
      + `<radialGradient id="${uid}d" cx=".5" cy=".62"><stop offset="0" stop-color="#aacdf0" stop-opacity=".5"/><stop offset=".68" stop-color="#193255" stop-opacity=".6"/><stop offset=".82" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;
    const shade = el('rect', { x: 0, y: 0, width: 300, height: 300, fill: '#1c2434', opacity: 0, 'pointer-events': 'none' });
    svg.insertBefore(shade, svg.children[2] || null);                 // over the sky and ground, under the animal
    shade.style.transition = 'opacity 1s ease-in-out';                // the sky darkens and clears gently
    const onShape = el('g', { 'pointer-events': 'none' }, opts.parent || svg);   // weather riding on the shape (inside its mirror group, if any)
    onShape.style.transition = 'opacity .7s ease-in-out';
    const cv = document.createElement('canvas');
    cv.className = 'wx-canvas'; cv.style.opacity = '0';               // fades in and out (catalog.css)
    wrap.appendChild(cv);
    const flash = document.createElement('div'); flash.className = 'wx-flash'; wrap.appendChild(flash);
    let kind = 'rain', level = 0, raf = 0, last = 0, gust = 0, gustT = 0, gustTo = 0, boltT = 0, gen = 0;
    // what the canvas draws: the last weather turned on, kept while it fades out; dens eases toward its level, so a
    // change of level thickens or thins the fall gradually
    let drawKind = 'rain', drawLevel = 0, dens = 0, offT = 0;
    const parts = Array.from({ length: 260 }, (_, i) => ({ x: Math.random() * 340 - 20, y: Math.random() * 300,
      d: i % 10 < 5 ? 0 : i % 10 < 8 ? 1 : 2, ph: Math.random() * 6, s: 0.7 + Math.random() * 0.6 }));

    // the beads and flakes on the shape fade out before they change, and the new ones fade in
    function weatherShape() {
      const my = ++gen, had = onShape.childNodes.length > 0;
      onShape.style.opacity = '0';
      setTimeout(() => { if (my === gen) shapeWeather(my); }, had && !reduced ? 700 : 0);
    }
    function shapeWeather(my) {
      onShape.textContent = '';
      if (!level || reduced || !opts.target) return;
      const t = opts.target(); if (!t) return;
      const k = kind, lv = level;
      outline(t.svgText, t.w, t.h, 2).then((o) => {
        if (!o || my !== gen) return;
        const n = Math.round(10 + 22 * lv), sz = 5.5;
        const add = (shape, x, y, kf, T) => { shape.style.transformBox = 'view-box'; onShape.appendChild(shape);
          shape.animate(kf, { duration: T, iterations: Infinity, delay: -Math.random() * T }); };
        if (k === 'snow' && o.top.length) {
          const flurry = lv < 0.55;
          for (let i = 0; i < n; i++) {
            const [x, y] = any(o.top), w = sz * (0.7 + Math.random() * 0.6), drop = 30 + Math.random() * 60, dr = (Math.random() - 0.5) * 20;
            const fall = drop / (14 + Math.random() * 10) * 1000, sit = flurry ? 200 + Math.random() * 500 : 2500 + Math.random() * 4000;
            const melt = flurry ? 900 + Math.random() * 1200 : 4000 + Math.random() * 4000, T = fall + sit + melt + 800 + Math.random() * (lv < 0.55 ? 8000 : 3000);
            const P = (dx, dy, sx, sy) => `translate(${(x + dx).toFixed(1)}px, ${(y + dy - w * 0.35).toFixed(1)}px) scale(${sx}, ${sy})`;
            const kf = [];
            for (let j = 0; j <= 5; j++) { const u = j / 5; kf.push({ offset: u * fall / T, opacity: j ? 0.95 : 0, transform: P(-dr * (1 - u) + Math.sin(u * 9.4) * 3 * (1 - u), -drop * (1 - u), 1, 1) }); }
            kf.push({ offset: (fall + 200) / T, opacity: 0.95, transform: P(0, 0.3, 1.2, 0.8) });
            kf.push({ offset: (fall + sit) / T, opacity: 0.95, transform: P(0, 0.3, 1.2, 0.8) });
            kf.push({ offset: (fall + sit + melt) / T, opacity: 0, transform: P(0, 0.6, 1.05, 0.55) });
            kf.push({ offset: 1, opacity: 0, transform: P(0, 0.6, 1.05, 0.55) });
            add(el('circle', { r: w / 2, fill: `url(#${uid}f)` }), x, y, kf, T);
          }
        } else if (k === 'rain') {
          if (o.coat.length) for (let i = 0; i < n; i++) {
            const [x, y] = any(o.coat), w = sz * (0.6 + Math.random() * 0.5), T = 5000 + Math.random() * 6000, sl = 1 + Math.random() * 3;
            const P = (dy, s) => `translate(${x.toFixed(1)}px, ${(y + dy).toFixed(1)}px) scale(${s})`;
            add(el('ellipse', { rx: w / 2, ry: w * 0.55, fill: `url(#${uid}d)` }), x, y,
              [{ offset: 0, opacity: 0, transform: P(0, 0.3) }, { offset: 0.15, opacity: 0.9, transform: P(0, 1) }, { offset: 0.7, opacity: 0.9, transform: P(sl, 1) },
               { offset: 0.85, opacity: 0, transform: P(sl + 0.5, 0.8) }, { offset: 1, opacity: 0, transform: P(sl + 0.5, 0.8) }], T);
          }
          if (o.bottom.length) for (let i = 0; i < Math.ceil(n * 0.6); i++) {
            const [x, y] = any(o.bottom), w = sz * (0.6 + Math.random() * 0.4), T = 3000 + Math.random() * 3500, f = 14 + Math.random() * 26;
            const P = (dy, sx, sy) => `translate(${x.toFixed(1)}px, ${(y + dy + w * 0.5).toFixed(1)}px) scale(${sx}, ${sy})`;
            add(el('ellipse', { rx: w / 2, ry: w * 0.58, fill: `url(#${uid}d)` }), x, y,
              [{ offset: 0, opacity: 0, transform: P(0, 0.2, 0.2) }, { offset: 0.5, opacity: 0.95, transform: P(0, 1, 1) },
               { offset: 0.66, opacity: 0.95, transform: P(1, 0.92, 1.4), easing: 'cubic-bezier(.55,0,1,.45)' },
               { offset: 0.76, opacity: 0.8, transform: P(f, 0.7, 1.9) }, { offset: 0.8, opacity: 0, transform: P(f + 5, 0.6, 2) }, { offset: 1, opacity: 0, transform: P(f + 5, 0.6, 2) }], T);
          }
        }
        void onShape.getBoundingClientRect(); onShape.style.opacity = '';
      });
    }

    function draw(ms) {
      raf = drawLevel ? requestAnimationFrame(draw) : 0;
      const dt = last ? Math.min(0.1, (ms - last) / 1000) : 0; last = ms;
      const W = wrap.clientWidth, H = wrap.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
      if (!W || !H) return;
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      const ctx = cv.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      if (!drawLevel) return;
      dens = dens ? dens + (drawLevel - dens) * Math.min(1, dt * 1.5) : drawLevel;
      const kind = drawKind, level = drawLevel;   // the weather being drawn (still the old one while it fades out)
      // the card's 300-unit square, fitted like the card svg (xMidYMax meet)
      const k = Math.min(W, H) / 300 * dpr, ox = (cv.width - 300 * k) / 2, oy = cv.height - 300 * k;
      ctx.setTransform(k, 0, 0, k, ox, oy);
      // wind: random gusts, hard and in bursts for a blizzard
      if (ms > gustTo) { gustT = Math.random() < 0.5 ? Math.random() * level * 1.3 : 0; gustTo = ms + 600 + Math.random() * (level > 0.9 && kind === 'snow' ? 2500 : 4000); }
      gust += (gustT - gust) * Math.min(1, dt * (gustT > gust ? 2.2 : 0.6));
      const n = Math.round(parts.length * (0.25 + 0.75 * dens));
      if (kind === 'rain') {
        const fine = level < 0.55, slant = 0.08 + level * 0.3 + gust * 0.35;
        ctx.strokeStyle = 'rgba(190,212,236,.75)'; ctx.lineWidth = fine ? 0.7 : 1.1; ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const p = parts[i], v = (420 + p.d * 120) * p.s, len = (fine ? 6 : 12) + p.d * 4;
          p.y += v * dt; p.x += v * slant * dt;
          if (p.y > 300) { p.y = -len; p.x = Math.random() * 360 - 60; }
          ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + len * slant, p.y + len);
        }
        ctx.stroke();
      } else {
        const blow = level * (level > 0.9 ? 0.5 : 0.15) + gust * (0.6 + level * 1.6);
        ctx.fillStyle = '#fff';
        for (let i = 0; i < n; i++) {
          const p = parts[i], v = (18 + p.d * 12) * p.s, r = 0.8 + p.d * 0.7;
          p.y += v * dt; p.x += v * blow * dt; p.ph += dt;
          if (p.y > 300) { p.y = -4; p.x = Math.random() * 360 - 60 * Math.min(1, blow); }
          if (p.x > 320) p.x -= 340;
          ctx.globalAlpha = 0.55 + p.d * 0.15;
          ctx.beginPath(); ctx.arc(p.x + Math.sin(p.ph * 1.3) * 3, p.y, r, 0, 6.283); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      if (kind === 'rain' && level > 0.85 && !offT && ms > boltT) {
        boltT = ms + 5000 + Math.random() * 9000;
        flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
      }
    }

    const api = {
      levelNames: () => LEVELS[kind],
      set(k, lv) {
        kind = k; level = LV[lv] || 0;
        shade.setAttribute('opacity', (level * 0.45).toFixed(2));
        boltT = performance.now() + 2500;
        weatherShape();
        clearTimeout(offT); offT = 0;
        if (level && drawLevel && drawKind !== kind && !reduced) {
          // rain to snow (or back): the old fall fades out, then the new one fades in
          cv.style.opacity = '0';
          offT = setTimeout(() => { offT = 0; drawKind = kind; drawLevel = level; dens = 0; cv.style.opacity = ''; }, 950);
        } else if (level) {
          if (drawKind !== kind) dens = 0;
          drawKind = kind; drawLevel = level; cv.style.opacity = '';
          if (!raf) { last = 0; raf = requestAnimationFrame(draw); }
        } else if (drawLevel) {
          // the fall fades out (catalog.css), then stops
          cv.style.opacity = '0';
          offT = setTimeout(() => { offT = 0; drawLevel = 0; dens = 0; const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); }, reduced ? 0 : 950);
        }
      },
      follow(x, y) { onShape.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`); },
      rebuild: weatherShape,
      stop() { cancelAnimationFrame(raf); raf = 0; clearTimeout(offT); drawLevel = 0; gen++; cv.remove(); flash.remove(); },
    };
    return api;
  }
  window.CatalogWeather = { card, LEVELS };
})();
