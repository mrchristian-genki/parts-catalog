// ============================================================
// reference-parts.js -- CATALOG ONLY. Builders that the parts catalog still
// demos but the live V2 scene never calls, moved out of components.js
// (Sept 23 cleanup) so the live page stops downloading them. Loaded by the
// catalog right after components.js; relies on its globals (el, rand,
// lighten, darken) and attaches to the same window.SceneComponents object.
//   makePine / makeGrass     -- early procedural pine + grass clump
//   makeDeciduous            -- flat lobed-canopy tree
//   makeSnowfall / makeRainfall -- SVG weather demos (the scene uses canvas)
//   buildBirdFlockCanvas     -- boids flocking experiment (canvas)
// ============================================================
(function () {

// ---------- PINE: 4 foliage tiers + static base. Gust travels DOWN (top catches first). ----------
// opts: {x, y, h (height in art units), tone ('summer'|'fall'|'winter'|'spring'), tier ('d'|'md'|'mobile')}
function makePine(opts){
  const {x, y, h=520, tier='d'} = opts;
  const w = h*0.62;                                  // canopy width ~ proportional to height
  const g = el('g', { class:'obj pine', 'data-tier':tier, transform:`translate(${x} ${y})` });
  // trunk (static anchor)
  el('path', { d:`M${-w*0.03} 0 L${w*0.03} 0 L${w*0.018} ${-h*0.16} L${-w*0.018} ${-h*0.16} Z`, fill:'#6b4a2f', class:'pine-trunk' }, g);
  // 4 tiers bottom->top. weight decreases upward: amplitude up, duration down, delay down.
  // tier geometry: stacked triangles, each narrower and higher.
  const tierDefs = [
    // [yBase, width, height, dur, delay]  (heavier bottom first)
    [-h*0.14, w*1.00, h*0.34, 4.6, 0.45],
    [-h*0.36, w*0.80, h*0.32, 3.9, 0.30],
    [-h*0.56, w*0.60, h*0.30, 3.2, 0.16],
    [-h*0.74, w*0.40, h*0.30, 2.5, 0.00],
  ];
  // Three-tone palette per tone (shadow/base/highlight), replacing the original flat
  // dark+light pair. Studied from the real artist trees in landscape.svg: light reads
  // as coming from the upper-right on every tier -- a darker inset wedge on the left,
  // a brighter wedge reaching further up on the right, plus a thin dark gap line at
  // each tier's base to separate it visually from the tier below.
  const palettes = {
    summer: ['#2f6b2c', '#3f7d3a', '#7ec44a'],
    spring: ['#3d8536', '#4f9a44', '#9ad866'],
    fall:   ['#4a6b2a', '#5a7d38', '#b8c24a'],
    // Frosted, not just a duller green -- pines don't go bare in winter, so
    // what should read is snow/frost sitting on the needles, close to white
    // with just enough cool tint to still look like a conifer underneath.
    winter: ['#a7bcc2', '#cddade', '#f2f7f8'],
  };
  const [shadow, base, highlight] = palettes[opts.tone||'summer'];
  tierDefs.forEach(([yb, tw, th, dur, delay], i)=>{
    // each tier is its own ruffling unit
    const t = el('g', { class:'pine-tier', 'data-tier':tier, style:`--dur:${dur}s;--delay:${delay}s` }, g);
    // base tier shape (mid tone), full triangle both sides
    el('path', { d:`M0 ${yb} L${-tw/2} ${yb} L0 ${yb-th} Z M0 ${yb} L${tw/2} ${yb} L0 ${yb-th} Z`, fill:base }, t);
    // shadow wedge: left side only, inset slightly -- suggests light from the right
    el('path', { d:`M0 ${yb} L${-tw/2} ${yb} L${-tw*0.08} ${yb-th*0.94} L0 ${yb-th} Z`, fill:shadow, opacity:0.9 }, t);
    // highlight wedge: right side, brighter, reaching a bit further toward the tip
    el('path', { d:`M0 ${yb} L${tw*0.42} ${yb-th*0.12} L${tw*0.1} ${yb-th*0.96} L0 ${yb-th} Z`, fill:highlight, opacity:0.85 }, t);
    // thin dark gap line at the tier's bottom edge, separating it from the tier below
    el('path', { d:`M${-tw*0.5} ${yb} L${tw*0.5} ${yb} L${tw*0.46} ${yb+th*0.05} L${-tw*0.46} ${yb+th*0.05} Z`, fill:shadow, opacity:0.35 }, t);
  });
  return g;
}

// ---------- GRASS CLUMP: base-pivot bend, springy. Split into sub-fans w/ phase offsets. ----------
// opts: {x, y, h, tier}
function makeGrass(opts){
  const {x, y, h=90, tier='d'} = opts;
  const g = el('g', { class:'obj grass', 'data-tier':tier, transform:`translate(${x} ${y})` });
  const cols = ['#5a8f3a','#6fa348','#4f7d33'];
  const n = tier==='mobile' ? 3 : 5;                // fewer blades on mobile
  // sub-fans: 2-3 groups with different phase so the clump shimmers, not one stiff block
  const fans = tier==='mobile' ? 1 : 2;
  for(let f=0; f<fans; f++){
    const fan = el('g', { class:'grass-bend', 'data-tier':tier, style:`--dur:${(2.0+f*0.6).toFixed(1)}s;--delay:${(f*0.5).toFixed(1)}s` }, g);
    for(let i=0;i<n;i++){
      const bx = rand(-h*0.35, h*0.35);
      const bh = h*rand(0.6,1.0);
      const lean = rand(-h*0.12, h*0.12);
      el('path', { d:`M${bx} 0 Q ${bx+lean*0.5} ${-bh*0.6} ${bx+lean} ${-bh}`, fill:'none', stroke:cols[i%cols.length], 'stroke-width':h*0.06, 'stroke-linecap':'round' }, fan);
    }
  }
  return g;
}


// ---------- DECIDUOUS TREE: seasonal canopy blobs + branching trunk. ----------
// Extracted from scene_parts_catalog_4.html (lines 674-703).
// viewBox source: 1212 126 919 1708 — tree center X≈1671, base Y=1834.
// Seasonal fills driven by CSS class on parent g: .summer .fall .spring .winter
// (same data-r="canopy-hi/mid/dk" system as the catalog).
// Wind: canopy groups get leaf-flutter class; trunk is static anchor.
// opts: {x, y, h (height in art units, default 900), season ('summer'|'fall'|'spring'|'winter'), tier}
function makeDeciduous(opts) {
  // ── Flat-style deciduous tree, lobed-cluster canopy ─────────────────────
  // Previous version used 2 giant overlapping circles for the whole canopy,
  // which read as a plain round blob rather than a tree (flagged directly:
  // "big blob of a tree"). This builds the canopy from a cluster of smaller
  // lobes instead -- same lighting convention as the pines (light from the
  // upper-right: darker lobes lower-left, brighter lobes upper-right) so it
  // reads as one coherent illustration style across the catalog.
  //
  // Seasonal palette [winter, spring, summer, fall]:
  //   winter: frosted near-white -- these trees aren't bare, they're
  //           snow/frost-covered, so winter should read as white, not a
  //           duller green.
  //   spring: bright fresh green
  //   summer: baseline art colors
  //   fall:   warm amber-orange

  const CANOPY = {
    winter: { main: '#eef3f4', shadow: '#cddadd', dark: '#b9c9cd' },
    spring: { main: '#7aa823', shadow: '#4a881d', dark: '#3c7a1b' },
    summer: { main: '#689648', shadow: '#365d17', dark: '#3d5e00' },
    fall:   { main: '#a97232', shadow: '#7a5020', dark: '#5a3010' },
  };
  const TRUNK = {
    // Bark gets a light frosted dusting in winter, not full white.
    winter: { main: '#9aa4a2', shadow: '#7c8886' },
    spring: { main: '#8c6238', shadow: '#6a4828' },
    summer: { main: '#86643f', shadow: '#7a5b3b' },
    fall:   { main: '#86643f', shadow: '#6a4828' },
  };

  const { x, y, h = 900, season = 'summer', tier = 'd' } = opts;
  const sns = season in CANOPY ? season : 'summer';
  const C = CANOPY[sns], T = TRUNK[sns];

  const tw = h * 0.10, th = h * 0.38;
  const cr = h * 0.34; // canopy reference radius
  const cx = x, cy = y - th - cr * 0.15; // crown sits a bit above the trunk top

  const gNS = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(gNS, 'g');
  g.setAttribute('class', `obj deciduous ${sns}`);
  g.setAttribute('data-tier', tier);

  const p = (tag, attrs) => {
    const e = document.createElementNS(gNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    g.appendChild(e); return e;
  };

  // ── Trunk ──
  p('path', {
    'data-bucket': 'trunk',
    d: `M${cx-tw*1.3},${y} C${cx-tw},${y-th*0.5} ${cx-tw*0.6},${y-th*0.8} ${cx-tw*0.4},${y-th} L${cx+tw*0.4},${y-th} C${cx+tw*0.6},${y-th*0.8} ${cx+tw},${y-th*0.5} ${cx+tw*1.3},${y} Z`,
    fill: T.main,
  });
  p('path', {
    'data-bucket': 'trunkShd',
    d: `M${cx+tw*0.1},${y} C${cx+tw*0.3},${y-th*0.5} ${cx+tw*0.5},${y-th*0.8} ${cx+tw*0.4},${y-th} L${cx+tw*0.4},${y-th} C${cx+tw*0.6},${y-th*0.8} ${cx+tw},${y-th*0.5} ${cx+tw*1.3},${y} Z`,
    fill: T.shadow,
  });

  // ── Canopy: a lobed cluster instead of two giant circles ─────────────────
  // Fixed relative layout (not fully random) so the silhouette is reliably
  // tree-shaped rather than accidentally lumpy: shadow lobes lower-left
  // (drawn first, behind), a broad base of mid-tone lobes filling most of
  // the mass, highlight lobes upper-right (drawn last, in front) -- same
  // light-direction convention the pines use.
  const shadowLobes = [
    [-0.55, 0.18, 0.60], [-0.18, 0.38, 0.56], [0.22, 0.40, 0.50], [-0.62, -0.05, 0.42],
  ];
  const midLobes = [
    [-0.42, -0.12, 0.66], [0.00, -0.22, 0.76], [0.36, -0.02, 0.64],
    [-0.14, 0.10, 0.68], [0.16, 0.20, 0.60], [-0.58, -0.08, 0.48],
    [0.52, 0.16, 0.50], [0.00, 0.30, 0.58], [-0.30, 0.28, 0.50],
  ];
  const hiLobes = [
    [0.30, -0.44, 0.40], [0.50, -0.24, 0.36], [0.10, -0.50, 0.38], [0.56, 0.00, 0.30],
  ];
  shadowLobes.forEach(([dx, dy, r]) => {
    p('circle', { 'data-bucket': 'shadow', cx: cx + dx * cr, cy: cy + dy * cr, r: r * cr, fill: C.shadow });
  });
  midLobes.forEach(([dx, dy, r]) => {
    p('circle', { 'data-bucket': 'main', cx: cx + dx * cr, cy: cy + dy * cr, r: r * cr, fill: C.main });
  });
  hiLobes.forEach(([dx, dy, r]) => {
    p('circle', { 'data-bucket': 'hi', cx: cx + dx * cr, cy: cy + dy * cr, r: r * cr, fill: C.main });
  });
  // Grounding shadow beneath the canopy, same role the old dark base ellipse played.
  p('ellipse', { 'data-bucket': 'dark', cx, cy: cy + cr * 0.5, rx: cr * 0.78, ry: cr * 0.24, fill: C.dark });

  // Live season update -- recolors every bucketed shape in place (CSS
  // transition on fill handles the fade) without rebuilding anything, so
  // this never interrupts an animation. 'hi' lobes use the same C.main as
  // 'main' lobes today (the highlight read comes from lobe SIZE/POSITION,
  // not a separate tone) but is tagged separately so a future pass can give
  // it its own lighter tone without touching placement logic.
  g.setSeason = function (newSeason) {
    const nc = CANOPY[newSeason] || CANOPY.summer;
    const nt = TRUNK[newSeason] || TRUNK.summer;
    const map = { shadow: nc.shadow, main: nc.main, hi: nc.main, dark: nc.dark, trunk: nt.main, trunkShd: nt.shadow };
    g.querySelectorAll('[data-bucket]').forEach(e => e.setAttribute('fill', map[e.dataset.bucket]));
  };
  // Kept as an alias -- scene.js and any existing callers use setDecidSeason.
  g.setDecidSeason = g.setSeason;

  return g;
}


// ---------- SNOWFALL: falling snow particles, mirrors the existing rain-canvas
// approach but as SVG circles so it can live inside a catalog demo card
// without needing its own <canvas>. The production/scene-wide version should
// stay canvas-based like rain, for the same performance reasons. ----------
// opts: {width, height, intensity: 'calm'|'blizzard'}
// Intensity controls density, fall speed, and flake size range -- the point
// of this card is to show the RANGE a weather object covers in the scene,
// not just "does it move" (see project note: a snow panel should showcase
// calm vs blizzard directly, with everything else in the micro-scene kept
// trivial so the range itself is what reads).
const SNOW_INTENSITY = {
  calm:     { count: 18, durRange: [7, 12], sizeRange: [1.0, 2.2], driftRange: [-8, 8] },
  blizzard: { count: 60, durRange: [2.2, 4], sizeRange: [1.8, 3.6], driftRange: [-40, 40] },
};
function makeSnowfall(opts){
  const { width = 300, height = 300, intensity = 'calm' } = opts;
  const preset = SNOW_INTENSITY[intensity] || SNOW_INTENSITY.calm;
  const g = el('g', { class: `obj snowfall snow-${intensity}` });
  for (let i = 0; i < preset.count; i++) {
    el('circle', {
      cx: rand(0, width), cy: rand(-height, height), r: rand(...preset.sizeRange),
      fill: '#ffffff', opacity: String(rand(0.5, 0.95)),
      class: 'snow-flake',
      style: `--fall-dur:${rand(...preset.durRange).toFixed(1)}s; --fall-delay:${rand(0, 6).toFixed(1)}s; --drift:${rand(...preset.driftRange).toFixed(0)}px;`,
    }, g);
  }
  return g;
}

// opts: {width, height, intensity: 'calm'|'monsoon'}
// Rain already exists live in scene.js as a canvas-drawn effect; this SVG
// version is for the catalog demo only, same reasoning as makeSnowfall.
const RAIN_INTENSITY = {
  calm:    { count: 20, durRange: [0.9, 1.4], lenRange: [12, 20], opacityRange: [0.25, 0.5] },
  monsoon: { count: 70, durRange: [0.35, 0.55], lenRange: [22, 34], opacityRange: [0.4, 0.75] },
};
function makeRainfall(opts){
  const { width = 300, height = 300, intensity = 'calm' } = opts;
  const preset = RAIN_INTENSITY[intensity] || RAIN_INTENSITY.calm;
  const g = el('g', { class: `obj rainfall rain-${intensity}` });
  for (let i = 0; i < preset.count; i++) {
    const len = rand(...preset.lenRange);
    const rx = rand(0, width), ry = rand(-height, height);
    el('line', {
      x1: rx, y1: ry, x2: rx + 4, y2: ry + len,
      stroke: `rgba(180,210,240,${rand(...preset.opacityRange).toFixed(2)})`,
      'stroke-width': 1.4, 'stroke-linecap': 'round',
      class: 'rain-drop',
      style: `--fall-dur:${rand(...preset.durRange).toFixed(2)}s; --fall-delay:${rand(0, 1.4).toFixed(2)}s;`,
    }, g);
  }
  return g;
}



// ---------- BIRDS (flocking, canvas) ----------
// A second, separate bird variant from the wing-rig above -- built
// specifically to answer "can these birds flock?" for the wing-rig design:
// no, not without breaking its asymmetric head/body calibration (see that
// entry's note). This shape is different on purpose: a single rigid
// silhouette (nose at one tip, swept wings, forked tail streamers) that
// looks correct rotating to face ANY heading, which is exactly what real
// boids flocking needs every frame. Shape supplied directly (not traced or
// measured by me) -- a clean, already rotation-safe design.
//
// Rendered on canvas rather than as SVG/DOM elements: a real boids flock
// needs an O(n^2) neighbor check every frame (each boid compares itself to
// every other boid for separation/alignment/cohesion) PLUS a per-boid
// transform update -- fine for canvas's immediate-mode redraw, but doing
// the same through 25+ live SVG DOM elements would mean that many style/
// attribute writes every frame, the exact pattern the lessons-learned doc
// already warns off ("setting properties on many elements every frame is
// expensive"). Canvas sidesteps that entirely by not keeping any of it in
// the DOM.
const FLOCK_BIRD_PATH_D = "M493,714.45c21.43-67.32,38.48-117.16,49.56-148.84,16.57-47.42,29.68-82.55,22.29-130A200.16,200.16,0,0,0,549.74,385l-25.75.1c7.75-.76,24.82-2.87,40.26-9a82.78,82.78,0,0,0,13.66-6.71A95.93,95.93,0,0,0,591,359.3l36.52-12.67-34.89-6.09a123.15,123.15,0,0,0-17.18-9.29,126.73,126.73,0,0,0-25.29-8.14l-1.08-.57v-.05a17.6,17.6,0,0,1,1.37-2.77c.67-1.11,12.1-44.77,10.25-67.57C558.48,224,528,129.31,466.79,6.5c.36,8.6,5.92,141.44,6.58,172.06.16,7.29.21,10.93.2,11.93,0,13.56-.18,27.11-.08,40.67,0,1.5,1.7,3,2,4.57.43,2.48,1.31,5.47.28,7.46-3.16,6.06-2,11.49,1.48,17.21a8.69,8.69,0,0,1,1.28,6.4c-.46,4.61-4.08,5.65-5.14,9.7-.55,2.11-.49,5.33,2.59,10-8.88,3.77-11.06,7.49-11.36,10.23-.39,3.61,2.48,5.42,1.48,9.74-.78,3.36-2.85,3.76-4.66,8.08a20.7,20.7,0,0,0-1.5,7.91c-.28,4.48-8,11.37-39.52,22.15q-28.89.9-58.64,2.55c-65.1,3.63-126.93,9.73-185.29,17.55,101.06,9.46,167.58,14.64,194.45,14.62,3.63,0,14.47-.11,16.33,4.08,3,6.68-18.9,19.94-31.33,27.39-24.17,14.48-60.87,36-110.92,64,93.52-43,163-73.74,179.94-79.74a57.74,57.74,0,0,1,17.24-3.43c12.87-.54,23.66,3.37,30.55,6.63a28.71,28.71,0,0,0-4.41,4.6c-2.53,3.33-5.24,6.91-4.2,10.09,1.45,4.46,9.22,4.95,9.2,7.86,0,2.25-4.67,2.4-4.91,4.9-.33,3.51,8.64,5.72,8.87,11.82a1.05,1.05,0,0,1,0,.79c-3.71,7.8-2.76,15.34,2.19,22.78.4.59-.93,1.92-.93,2.93,0,6,.1,12.1.2,18.15.06,2.81.23,5.64.27,8.45.09,5,.06,10.09.18,15.13.11,4.35.14,5.38.54,6.93a22.26,22.26,0,0,0,4.29,8.43C487.22,525.21,490.43,574.55,493,714.45Z";
const FLOCK_BIRD_PIVOT = { x: 402, y: 357 }; // centroid of the raw (untranslated) path coordinates, used as the rotate/scale pivot since Path2D ignores the source SVG's own transform attribute

function buildBirdFlockCanvas(wrap, w, h, opts) {
  const count = (opts && opts.count) || 26;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block' });
  wrap.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const birdPath = new Path2D(FLOCK_BIRD_PATH_D);

  const visualRange = w * 0.09, protectedRange = w * 0.028;
  const centeringFactor = 0.0008, avoidFactor = 0.05, matchingFactor = 0.05;
  const maxSpeed = w * 0.006, minSpeed = w * 0.0024, turnFactor = 0.3;
  const scaleFactor = w / 12500; // tuned so a bird reads clearly at this card's size

  const boids = [];
  for (let i = 0; i < count; i++) {
    boids.push({
      x: rand(0, w), y: rand(0, h),
      vx: rand(-2, 2), vy: rand(-2, 2),
      flapSpeed: 0.006 + Math.random() * 0.003,
      flapOffset: rand(0, Math.PI * 2),
    });
  }

  function step() {
    for (let i = 0; i < boids.length; i++) {
      const b = boids[i];
      let closeDx = 0, closeDy = 0, xPos = 0, yPos = 0, xVel = 0, yVel = 0, n = 0;
      for (let j = 0; j < boids.length; j++) {
        if (i === j) continue;
        const o = boids[j];
        const dx = b.x - o.x, dy = b.y - o.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < visualRange * visualRange) {
          if (d2 < protectedRange * protectedRange) { closeDx += dx; closeDy += dy; }
          xPos += o.x; yPos += o.y; xVel += o.vx; yVel += o.vy; n++;
        }
      }
      b.vx += closeDx * avoidFactor;
      b.vy += closeDy * avoidFactor;
      if (n > 0) {
        b.vx += (xPos / n - b.x) * centeringFactor;
        b.vy += (yPos / n - b.y) * centeringFactor;
        b.vx += (xVel / n - b.vx) * matchingFactor;
        b.vy += (yVel / n - b.vy) * matchingFactor;
      }
      const margin = w * 0.08;
      if (b.x < margin) b.vx += turnFactor;
      if (b.x > w - margin) b.vx -= turnFactor;
      if (b.y < margin) b.vy += turnFactor;
      if (b.y > h - margin) b.vy -= turnFactor;
      const speed = Math.hypot(b.vx, b.vy);
      if (speed > maxSpeed) { b.vx = b.vx / speed * maxSpeed; b.vy = b.vy / speed * maxSpeed; }
      else if (speed < minSpeed && speed > 0) { b.vx = b.vx / speed * minSpeed; b.vy = b.vy / speed * minSpeed; }
      b.x += b.vx; b.y += b.vy;
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, w, h);
    for (const b of boids) {
      const angle = Math.atan2(b.vy, b.vx);
      const flap = Math.sin(time * b.flapSpeed + b.flapOffset);
      const verticalScale = 1 + flap * 0.12;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(angle);
      ctx.scale(scaleFactor, scaleFactor);
      ctx.translate(FLOCK_BIRD_PIVOT.x, FLOCK_BIRD_PIVOT.y);
      ctx.scale(1, verticalScale);
      ctx.translate(-FLOCK_BIRD_PIVOT.x, -FLOCK_BIRD_PIVOT.y);
      ctx.fillStyle = '#1a1a1a';
      ctx.fill(birdPath);
      ctx.restore();
    }
  }

  let raf = null, stopped = false;
  const loop = (t) => {
    if (stopped) return;
    step();
    draw(t);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return { canvas, stop: () => { stopped = true; if (raf) cancelAnimationFrame(raf); } };
}


Object.assign(window.SceneComponents, { makePine, makeGrass, makeDeciduous, makeSnowfall, makeRainfall, buildBirdFlockCanvas });
})();
