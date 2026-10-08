// ============================================================
// catalog-app.js — renders CATALOG (catalog-data.js) into searchable,
// filterable, live-demo cards. No framework: this is a small utility
// tool, not a product surface.
// ============================================================
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (id) => document.getElementById(id);
  const svgEl = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };

  // Per-card state: id -> { season, windLevel, intensity, coverage, windValue }
  const state = {};
  const CLOUD_WIND_VALUES = { still: 0, breeze: 1, gust: 2, blizzard: 3 };
  CATALOG.forEach((entry) => {
    // Every animal (and the Weather card) gets the scene's weather: clear or one of three levels.
    if (entry.kind === 'creature' && !(entry.controls || []).some((c) => c.type === 'weather')) (entry.controls = entry.controls || []).push({ type: 'weather', default: 0 });
    const s = { windLevel: 'breezy' };
    (entry.controls || []).forEach((c) => {
      if (c.type === 'season') s.season = c.default || c.options[0];
      if (c.type === 'intensity') {
        s.intensity = c.default || c.options[0];
        if (entry.kind === 'cloud') s.windValue = CLOUD_WIND_VALUES[s.intensity] ?? 1;
      }
      if (c.type === 'coverage') s.coverage = c.default || c.options[0];
      if (c.type === 'precip') s.precip = c.default || c.options[0] || 'none';
      if (c.type === 'time') s.night = c.default === 'night';
      if (c.type === 'behavior') s.behavior = c.default || c.options[0];
      if (c.type === 'style') s.style = c.default || 'origami';
      if (c.type === 'weather') s.weather = c.default || 0;
      if (c.type === 'option') s[c.key] = c.default || c.options[0];
    });
    state[entry.id] = s;
  });

  // ── animal stories: each animal's routine from the scene, played across its card ───────
  // Steps: { b: behaviour, t: seconds } holds a pose; { b, to: 'centre'|'right'|'left', from } walks
  // (at the rig's own travel speed); face: -1 turns round. Loops forever.
  const STORIES = {
    doe:  [{ b: 'walk', from: 'left', to: 'centre' }, { b: 'graze', t: 9 }, { b: 'alert', t: 3 }, { b: 'idle', t: 2 }, { b: 'walk', to: 'right' }],
    deer: [{ b: 'walk', from: 'left', to: 'centre' }, { b: 'alert', t: 3 }, { b: 'graze', t: 7 }, { b: 'idle', t: 2 }, { b: 'walk', to: 'right' }],
    elk:  [{ b: 'walk', from: 'left', to: 'centre' }, { b: 'idle', t: 3 }, { b: 'graze', t: 7 }, { b: 'alert', t: 3 }, { b: 'walk', to: 'right' }],
    bear: [{ b: 'walk', from: 'left', to: 'centre' }, { b: 'forage', t: 8 }, { b: 'walk', to: 'right' }],
    fox:  [{ b: 'walk', from: 'right', to: 'centre', speed: 3 }, { b: 'sit', t: 4, face: 1 }, { b: 'sniff', t: 4.5 }, { b: 'sit', t: 2 }, { b: 'walk', face: 1, to: 'right', speed: 3 }],
    hare: [{ b: 'hop', from: 'left', to: 'centre' }, { b: 'sit', t: 4 }, { b: 'hop', to: 'right' }],
    'wolf-run': [{ b: 'walk', from: 'left', to: 'centre' }, { b: 'walk', t: 1.5 }, { b: 'run', to: 'right' }],
    eagle: [{ b: 'soar', from: 'left', to: 'centre' }, { b: 'flap', to: 'right' }],
    marley: [{ b: 'walk', from: 'right', to: 'centre', speed: 1.4 }, { b: 'sniff', t: 5, face: 1 }, { b: 'idle', t: 4 }, { b: 'sniff', t: 3 }, { b: 'walk', face: 1, to: 'right', speed: 1.4 }],
  };

  let activeCategory = 'All';
  let searchTerm = '';

  // ── basic, consistent micro-scene backdrop for every card ───────────
  function buildBackdrop(svg) {
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: 300, height: 230, fill: '#dcebf3' }));
    svg.appendChild(svgEl('rect', { x: 0, y: 230, width: 300, height: 70, fill: '#cdd9bd' }));
    svg.appendChild(svgEl('line', { x1: 0, y1: 230, x2: 300, y2: 230, stroke: '#b7c7a6', 'stroke-width': 1.5 }));
  }

  // Season- and night-aware backdrop for creature cards: sky gradient,
  // then ground, or open water for the fisherman, or sky only for flyers.
  const CREATURE_SKY = {
    spring: ['#cfe5ef', '#eaf3ef', '#b8d29e'], summer: ['#bcdcf0', '#e4f1f6', '#a8c889'],
    fall: ['#e3d3c4', '#f3e9dc', '#c9b27b'], winter: ['#d6dfe7', '#eef2f5', '#e8eef2'],
  };
  let backdropId = 0;
  function buildCreatureBackdrop(svg, entry, rig) {
    const id = 'crbd' + (++backdropId);
    const defs = svgEl('defs', {});
    const grad = svgEl('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
    const s0 = svgEl('stop', { offset: '0' }), s1 = svgEl('stop', { offset: '1' });
    grad.append(s0, s1); defs.appendChild(grad); svg.appendChild(defs);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: 300, height: 300, fill: 'url(#' + id + ')' }));
    let ground = null;
    if (!rig.airborne) {
      ground = svgEl('rect', { x: 0, y: rig.onWater ? 240 : 230, width: 300, height: 70 });
      svg.appendChild(ground);
    }
    [s0, s1, ground].forEach((e) => { if (e) e.style.transition = 'stop-color .7s ease, fill .7s ease'; });
    return {
      update(season, night) {
        const c = CREATURE_SKY[season] || CREATURE_SKY.summer;
        s0.setAttribute('stop-color', night ? '#131e33' : c[0]);
        s1.setAttribute('stop-color', night ? '#3a4a66' : c[1]);
        if (ground) ground.setAttribute('fill', rig.onWater ? (night ? '#1c2c40' : '#86b3c6') : night ? (season === 'winter' ? '#3a4552' : '#1d2821') : c[2]);
      },
    };
  }

  // If an <img> 404s (most likely reason: this catalog isn't sitting next to
  // a real `assets/` folder), replace it with a clean labeled placeholder in
  // its same spot instead of the browser's own broken-image icon + overflowing
  // alt text (which reads as the OBJECT being broken, not a missing file).
  // This was called from below in an earlier pass but never actually written
  // -- that gap is exactly what produced the floating text seen in testing.
  function attachImgFallback(img, label, explicitBox) {
    img.addEventListener('error', () => {
      const ph = document.createElement('div');
      ph.textContent = typeof label === 'string' ? label : 'asset not found';
      // explicitBox is for cases like cropRect where the img's own style is
      // deliberately oversized/offset for cropping -- its raw dimensions
      // aren't the right box to show a placeholder in. Otherwise, the img's
      // own style (correct for a plain image or a composite's shell/leaf
      // images, which aren't inflated) is the right box to copy.
      const box = explicitBox || {
        left: img.style.left || '0', top: img.style.top || '',
        bottom: img.style.bottom || '', right: img.style.right || '',
        width: img.style.width || '100%', height: img.style.height || '100%',
      };
      Object.assign(ph.style, {
        position: 'absolute', ...box,
        display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        fontSize: '9px', lineHeight: '1.3', color: '#9aa89f', padding: '4px', boxSizing: 'border-box',
        background: 'repeating-linear-gradient(45deg, #eef1ea, #eef1ea 6px, #e3e7dc 6px, #e3e7dc 12px)',
        border: '1px dashed #c7d0c2', borderRadius: '4px', pointerEvents: 'none',
      });
      if (img.parentNode) img.parentNode.replaceChild(ph, img);
    }, { once: true });
  }
  window.attachImgFallback = attachImgFallback;

  // ── render (or re-render) one card's live preview ───────────────────
  function renderPreview(entry, wrap) {
    wrap.innerHTML = '';
    wrap.dataset.windLevel = state[entry.id].windLevel || 'breezy';

    // 'creature' -- animals from creatures.js (one shared rAF loop; each
    // card's own travel loop only slides movers like the bear or wolf across
    // the card). Season / day-night / behaviour update the live instance in
    // place; only a full re-render rebuilds it.
    if (entry.kind === 'creature') {
      if (wrap._stopCreature) wrap._stopCreature();
      wrap.innerHTML = '';
      const st = state[entry.id];
      const rig = window.Creatures.RIGS[entry.creature] || {};   // origami-only animals (Marley) have no silhouette rig
      const svg = svgEl('svg', { viewBox: '0 0 300 300', preserveAspectRatio: 'xMidYMax meet' });
      const bd = buildCreatureBackdrop(svg, entry, rig);
      bd.update(st.season, st.night);
      // Natural coats (shared with the scene); the silhouette palette stays as the rig default.
      // Story: the animal's whole scene routine (walk in, graze, look up, walk off...), looped.
      const story = st.behavior === 'story' ? STORIES[entry.creature] : null;
      const c = window.Creatures.build(entry.creature, { season: st.season, night: st.night, behavior: story ? story[0].b : st.behavior, silhouette: false,
        paint: window.Creatures.naturalPaint ? window.Creatures.naturalPaint(entry.creature, false) : undefined });
      const [, , vw, vh] = c.viewBox;
      const maxW = entry.maxW || 230, maxH = entry.maxH || 170;
      const k = Math.min(maxW / vw, maxH / vh);
      const w = vw * k, h = vh * k;
      const groundY = rig.onWater ? 262 : 236;
      const y = rig.airborne ? 125 - h / 2 : groundY - h + (entry.sink || 0) * h;
      let x = (300 - w) / 2;
      c.svg.setAttribute('x', x.toFixed(1)); c.svg.setAttribute('y', y.toFixed(1));
      c.svg.setAttribute('width', w.toFixed(1)); c.svg.setAttribute('height', h.toFixed(1));
      // catalog.css sizes every svg in a card to 100% (meant for the card's
      // own top-level svg); inline px here = user units of the card svg.
      c.svg.style.width = w.toFixed(1) + 'px'; c.svg.style.height = h.toFixed(1) + 'px';
      c.svg.style.position = 'static';
      // A wrapper group mirrors the animal when a story turns it round.
      const holder = svgEl('g', {});
      holder.appendChild(c.svg);
      svg.appendChild(holder);
      wrap.appendChild(svg);
      // Weather on the card and on the animal (js/weather.js): the drops ride in the animal's
      // mirror group and follow its x each frame; its outline is re-read when its pose changes.
      const wx = window.CatalogWeather ? window.CatalogWeather.card(wrap, svg, { parent: holder, target: () => {
        const cl = c.svg.cloneNode(true);
        cl.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); ['x', 'y', 'style'].forEach((a) => cl.removeAttribute(a));
        cl.setAttribute('width', w.toFixed(1)); cl.setAttribute('height', h.toFixed(1));
        return { svgText: new XMLSerializer().serializeToString(cl), w, h };
      } }) : null;
      if (wx) { wx.follow(x, y); wx.set(st.season === 'winter' ? 'snow' : 'rain', st.weather || 0); }
      const setB = c.setBehavior.bind(c);
      c.setBehavior = (b) => { setB(b); if (wx && st.weather) setTimeout(() => wx.rebuild(), 400); };
      let raf = 0, last = 0;
      const centre = (300 - w) / 2;
      let si = 0, sT = 0, face = 1;
      const setFace = (f) => { face = f; holder.setAttribute('transform', f < 0 ? `translate(${(2 * x + w).toFixed(1)} 0) scale(-1 1)` : ''); };
      const startStep = () => {
        const S = story[si];
        sT = 0;
        if (S.b) c.setBehavior(S.b);
        if (S.face) setFace(S.face);
        if (S.from === 'left') { x = -w - 10; setFace(1); }
        if (S.from === 'right') { x = 310; setFace(-1); }
        c.svg.setAttribute('x', x.toFixed(1));
      };
      if (story) { x = story[0].from ? (story[0].from === 'left' ? -w - 10 : 310) : centre; c.svg.setAttribute('x', x.toFixed(1)); startStep(); }
      const storyStep = (dt) => {
        const S = story[si];
        sT += dt;
        let done = false;
        if (S.to != null) {
          const target = S.to === 'centre' ? centre : S.to === 'right' ? 310 : S.to === 'left' ? -w - 10 : S.to;
          const v = Math.max(c.travelSpeed(), 0.06) * w * (S.speed || 2.4);   // cards are small: walk faster than the scene
          const d = target - x;
          x += Math.sign(d) * Math.min(Math.abs(d), v * dt);
          done = Math.abs(target - x) < 0.5;
          c.svg.setAttribute('x', x.toFixed(1));
          if (face < 0) setFace(-1);
        } else done = sT >= S.t;
        if (done) { si = (si + 1) % story.length; startStep(); }
      };
      const step = (ms) => {
        const dt = last ? Math.min(0.1, (ms - last) / 1000) : 0; last = ms;
        if (wx) wx.follow(x, y);
        if (story) { storyStep(dt); raf = requestAnimationFrame(step); return; }
        const v = c.travelSpeed() * w; // body-widths per second -> card px
        if (v) {
          x += v * dt;
          if (x > 300 + 10) x = -w - 10;
          c.svg.setAttribute('x', x.toFixed(1));
        } else if (Math.abs(x - (300 - w) / 2) > 0.5) {
          x += ((300 - w) / 2 - x) * Math.min(1, dt * 3); // ease back to centre
          c.svg.setAttribute('x', x.toFixed(1));
        }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      wrap._creature = c;
      wrap._backdrop = bd;
      wrap._wx = wx;
      wrap._stopCreature = () => { cancelAnimationFrame(raf); c.destroy(); if (wx) wx.stop(); wrap._stopCreature = null; };
      return;
    }

    // 'weather' -- the scene's rain and snow at each level, landing on a headline and a button.
    if (entry.kind === 'weather') {
      if (wrap._wx) wrap._wx.stop();
      const st = state[entry.id];
      const svg = svgEl('svg', { viewBox: '0 0 300 300', preserveAspectRatio: 'xMidYMax meet' });
      const bd = buildCreatureBackdrop(svg, entry, {});
      bd.update(st.season, false);
      const copy = `<text x="150" y="128" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-weight="800" font-size="38" fill="#fff">Sixty-eight</text>`
        + `<text x="150" y="170" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-weight="800" font-size="38" fill="#fff">books</text>`
        + `<rect x="95" y="192" width="110" height="30" rx="10" fill="#1d4f91"/>`
        + `<text x="150" y="212" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#fff">Browse the catalog</text>`;
      const g = svgEl('g', {}); g.innerHTML = copy; svg.appendChild(g);
      wrap.appendChild(svg);
      const wx = window.CatalogWeather.card(wrap, svg, { target: () => ({ svgText: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">${copy}</svg>`, w: 300, h: 300 }) });
      wx.follow(0, 0);
      wx.set(st.season === 'winter' ? 'snow' : 'rain', st.weather);
      wrap._wx = wx; wrap._backdrop = bd;
      return;
    }

    if (entry.kind === 'water') {
      if (wrap._waterAPI) wrap._waterAPI.stop();
      const w = 300, h = 230;
      const api = window.SceneComponents.buildWaterShimmer(wrap, w, h, { skyFrac: 0.32 });
      const windLevels = ['none', 'light', 'breezy', 'heavy'];
      api.setWind(windLevels.indexOf(state[entry.id].windLevel));
      api.setPrecip(state[entry.id].precip || 'none');
      wrap._waterAPI = api;
      return;
    }

    if (entry.kind === 'flock') {
      if (wrap._stopFlock) wrap._stopFlock();
      wrap.innerHTML = '';
      const w = 300, h = 230;
      const { stop } = window.SceneComponents.buildBirdFlockCanvas(wrap, w, h, { count: 26 });
      wrap._stopFlock = stop;
      return;
    }

    if (entry.kind === 'foothills') {
      window.SceneComponents.buildFoothillsRange(wrap, entry.src, state[entry.id].season, entry.cropOpts);
      return;
    }

    // 'shore' -- the two near-camera lagoon banks (left-shore.svg/
    // right-shore.svg) added to the live V2 scene during the lagoon
    // rework. Uses buildCroppedSvgAsset directly (the same call
    // buildMidground's placeShore() makes in scene.js) rather than a
    // season-aware wrapper like buildBoulderGrass -- these are static
    // shore-line art with no per-season recolor of their own in the live
    // scene, so there's nothing for a season control to drive here either.
    if (entry.kind === 'shore') {
      // FIXED (Sept 20): 'none' force-stretched the cropped art to fill
      // this card's fixed box regardless of its real aspect ratio -- the
      // live scene never does this (placeShore() computes an explicit
      // height from the crop's own ratio instead). 'xMidYMid meet' keeps
      // the real proportions and letterboxes instead of distorting.
      window.SceneComponents.buildCroppedSvgAsset(wrap, entry.src, entry.viewBox, { preserveAspectRatio: 'xMidYMid meet' });
      return;
    }

    if (entry.kind === 'plant') {
      window.SceneComponents.buildForegroundPlant(wrap, entry.src, state[entry.id].season);
      return;
    }

    if (entry.kind === 'boulder') {
      window.SceneComponents.buildBoulderGrass(wrap, entry.src, state[entry.id].season);
      return;
    }

    if (entry.kind === 'bird') {
      // Own rAF loop for the wing-flap math (per-frame wingPath geometry),
      // same stop() lifecycle as clouds: cancel the old loop before
      // rebuilding so a re-render doesn't leave a stale loop running.
      if (wrap._stopBirds) wrap._stopBirds();
      wrap.innerHTML = '';
      const vbw = 300, vbh = 230; // sky-only area, matches buildBackdrop's sky rect height
      const svg = svgEl('svg', { viewBox: '0 0 300 300', preserveAspectRatio: 'xMidYMax meet' });
      buildBackdrop(svg);
      const { stop } = window.SceneComponents.buildRealBirdFlock(svg, vbw, vbh);
      wrap.appendChild(svg);
      wrap._stopBirds = stop;
      return;
    }

    if (entry.kind === 'cloud') {
      // Clouds build ONCE and then get updated live (opacity for season,
      // speed for wind) rather than fully rebuilt on every control click --
      // matching how the source file did it, and avoiding a jumpy restart
      // of the drift loop and puff positions on every click.
      if (wrap._stopDrift) wrap._stopDrift();
      wrap.innerHTML = '';
      const vb = entry.viewBox || window.SceneComponents.CLOUD_VIEWBOX[entry.family];
      const [, , vbw, vbh] = vb.split(' ').map(Number);
      const svg = svgEl('svg', { viewBox: vb, preserveAspectRatio: 'xMidYMid meet' });
      // Sky-only backdrop, no ground line -- these are aerial objects with
      // no ground relevance, so a horizon strip would be misleading here.
      svg.appendChild(svgEl('rect', { x: 0, y: 0, width: vbw, height: vbh, fill: '#dcebf3' }));
      wrap.appendChild(svg);
      const { g, stopDrift } = window.SceneComponents.buildCloudFamily(
        entry.family, svg, state[entry.id].season, () => state[entry.id].windValue ?? 1
      );
      wrap._cloudG = g;
      wrap._stopDrift = stopDrift;
      return;
    }

    if (entry.kind === 'svg') {
      const svg = svgEl('svg', { viewBox: '0 0 300 300', preserveAspectRatio: 'xMidYMax meet' });
      buildBackdrop(svg);
      const obj = entry.build(state[entry.id]);
      if (obj) svg.appendChild(obj);
      wrap.appendChild(svg);
      wrap._obj = obj;
      return;
    }

    if (entry.kind === 'composite') {
      // For objects made of more than one layered element (e.g. a bare tree
      // shell plus scattered individual leaves) -- build() returns a ready
      // DOM node (usually a plain <div> with absolutely-positioned <img>s
      // inside it) and this just drops it in after the standard backdrop.
      const svg = svgEl('svg', { viewBox: '0 0 300 300', preserveAspectRatio: 'xMidYMax meet' });
      buildBackdrop(svg);
      wrap.appendChild(svg);
      const node = entry.build(state[entry.id]);
      if (node) wrap.appendChild(node);
      wrap._obj = node;
      return;
    }

    // kind === 'image': flat sky/ground backdrop behind a positioned <img>
    const svg = svgEl('svg', { viewBox: '0 0 300 300', preserveAspectRatio: 'xMidYMax meet' });
    buildBackdrop(svg);
    wrap.appendChild(svg);

    const img = document.createElement('img');
    img.src = entry.src;
    img.alt = entry.name;

    if (entry.cropBottomFraction) {
      // Same crop technique production uses: a wrapper sized to roughly the
      // card's lower two-thirds, with the image oversized and bottom-
      // anchored inside it so only the asset's real art shows, not its
      // transparent top margin.
      const cropWrap = document.createElement('div');
      Object.assign(cropWrap.style, {
        position: 'absolute', left: '0', bottom: '0', width: '100%', height: '78%',
        overflow: 'hidden', pointerEvents: 'none',
      });
      Object.assign(img.style, {
        position: 'absolute', left: '0', bottom: '0', width: '100%',
        height: (100 / entry.cropBottomFraction).toFixed(1) + '%',
        objectFit: 'cover', objectPosition: 'center bottom', display: 'block',
      });
      attachImgFallback(img, entry.src);
      cropWrap.appendChild(img);
      wrap.appendChild(cropWrap);
    } else if (entry.cropRect) {
      // For a source file where the actual subject is a small region inside
      // a much larger mostly-empty canvas (e.g. a tree cut from a wide
      // multi-object composition) -- object-fit:contain would shrink the
      // WHOLE canvas including all that empty space, crushing the subject
      // down to a speck. This crops to just entry.cropRect ({x0,y0,x1,y1},
      // fractions 0-1 of the source's own width/height) by inflating the
      // image so that rectangle exactly fills the display box.
      const { x0, y0, x1, y1 } = entry.cropRect;
      const fw = x1 - x0, fh = y1 - y0;
      const dispBox = entry.cropDisplayBox || { left: '26%', bottom: '18%', width: '48%', height: '48%' };
      const cropWrap = document.createElement('div');
      Object.assign(cropWrap.style, {
        position: 'absolute', left: dispBox.left, bottom: dispBox.bottom,
        width: dispBox.width, height: dispBox.height,
        overflow: 'hidden', pointerEvents: 'none',
      });
      Object.assign(img.style, {
        position: 'absolute',
        width: (100 / fw).toFixed(1) + '%', height: (100 / fh).toFixed(1) + '%',
        left: (-(x0 / fw) * 100).toFixed(1) + '%', top: (-(y0 / fh) * 100).toFixed(1) + '%',
        display: 'block',
      });
      attachImgFallback(img, entry.src, { left: '0', top: '0', width: '100%', height: '100%' });
      cropWrap.appendChild(img);
      wrap.appendChild(cropWrap);
    } else {
      // Fixed numeric dimensions, not 'auto' — an 'auto' width can't be
      // computed for a failed image (no intrinsic size to fall back on),
      // which is what let the alt-text spill out of position instead of
      // staying inside a defined box.
      Object.assign(img.style, {
        position: 'absolute', left: '16%', bottom: '18%', width: '68%', height: '68%',
        objectFit: 'contain', objectPosition: 'center bottom', display: 'block',
      });
      if (entry.tags && entry.tags.includes('wind')) img.classList.add(entry.swayClass || 'tree-isolated-sway');
      attachImgFallback(img, entry.src);
      wrap.appendChild(img);
    }

    if (entry.seasonFilter) {
      img.style.filter = entry.seasonFilter[state[entry.id].season] || '';
      // Transition lives on the element itself so a later live update (see
      // the season click handler) actually eases instead of snapping --
      // this only works because that handler updates THIS SAME img in
      // place now, rather than rebuilding a fresh one with no prior state
      // to transition from.
      img.style.transition = 'filter 0.7s ease';
    }
    wrap._obj = img;
  }

  // ── build one card (chrome + controls), returns the DOM node ────────
  function buildCard(entry) {
    const card = document.createElement('article');
    card.className = 'cat-card';

    const wrap = document.createElement('div');
    wrap.className = 'cat-scene-wrap';
    card.appendChild(wrap);

    const body = document.createElement('div');
    body.className = 'cat-body';

    const titleRow = document.createElement('div');
    titleRow.className = 'cat-title-row';
    const title = document.createElement('h3');
    title.className = 'cat-title';
    title.textContent = entry.name;
    const status = document.createElement('span');
    status.className = 'cat-status';
    status.dataset.state = entry.status;
    status.textContent = entry.status === 'live' ? 'Live' : entry.status === 'progress' ? 'In progress' : 'Reference';
    titleRow.append(title, status);
    body.appendChild(titleRow);

    if (entry.tags && entry.tags.length) {
      const tagRow = document.createElement('div');
      tagRow.className = 'cat-tags';
      entry.tags.forEach((t) => {
        const chip = document.createElement('span');
        chip.className = 'cat-tag';
        chip.textContent = t;
        tagRow.appendChild(chip);
      });
      body.appendChild(tagRow);
    }

    // ── controls ──────────────────────────────────────────────────────
    if (entry.controls && entry.controls.length) {
      const controls = document.createElement('div');
      controls.className = 'cat-controls';

      entry.controls.forEach((c) => {
        const group = document.createElement('div');
        group.className = 'cat-control-group';
        const label = document.createElement('span');
        label.className = 'cat-control-label';

        if (c.type === 'season') {
          label.textContent = 'Season';
          group.appendChild(label);
          c.options.forEach((opt) => {
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.type = 'button';
            btn.textContent = opt[0].toUpperCase() + opt.slice(1);
            btn.setAttribute('aria-pressed', String(state[entry.id].season === opt));
            btn.addEventListener('click', () => {
              state[entry.id].season = opt;
              group.querySelectorAll('.cat-btn').forEach((b) => b.setAttribute('aria-pressed', 'false'));
              btn.setAttribute('aria-pressed', 'true');
              if (wrap._wx) {
                wrap._wx.set(opt === 'winter' ? 'snow' : 'rain', state[entry.id].weather || 0);
                const names = window.CatalogWeather.LEVELS[opt === 'winter' ? 'snow' : 'rain'];
                card.querySelectorAll('.cat-wx-btn').forEach((b) => { const lv = +b.dataset.lv; if (lv) b.textContent = names[lv - 1]; });
                if (entry.kind === 'weather') wrap._backdrop.update(opt, false);
              }
              if (entry.kind === 'creature' && wrap._creature) {
                wrap._creature.setSeason(opt);
                wrap._backdrop.update(opt, state[entry.id].night);
              } else if (entry.kind === 'cloud' && wrap._cloudG) {
                // Update opacity live instead of rebuilding -- rebuilding
                // would restart the drift loop and reshuffle puff positions
                // for no reason, since only the opacity gate changes here.
                const gates = window.SceneComponents.CLOUD_GATES[entry.family];
                const idx = window.SceneComponents.CLOUD_SEASON_IDX[opt];
                wrap._cloudG.setAttribute('opacity', gates[idx]);
              } else if ((entry.kind === 'svg' || entry.kind === 'composite') && wrap._obj && typeof entry.onSeasonChange === 'function') {
                // Same principle, generalized: a season change is a COLOR
                // change, not a new object, so update the existing element's
                // fills in place (via whatever method components.js exposes
                // for this object) instead of tearing it down and rebuilding
                // -- which was restarting the sway animation on every click.
                entry.onSeasonChange(wrap._obj, opt);
              } else if (entry.kind === 'image' && entry.seasonFilter && wrap._obj) {
                // Same fix, for the whole-image CSS-filter approach (aspen
                // cutout, mountains, single leaf): update the SAME <img>'s
                // filter in place. This was previously falling through to a
                // full rebuild every time, which is why winter appeared to
                // instantly snap to white instead of easing -- a freshly
                // created element has no prior filter value to transition
                // FROM, so even with a CSS transition present, there was
                // nothing for it to animate between.
                wrap._obj.style.filter = entry.seasonFilter[opt] || '';
              } else if ((entry.kind === 'boulder' || entry.kind === 'plant' || entry.kind === 'foothills') && typeof wrap.setSeason === 'function') {
                // Same principle again: update in place rather than
                // re-fetching the SVG and rebuilding, which would restart
                // the grass sway animation on every season click.
                wrap.setSeason(opt);
              } else {
                renderPreview(entry, wrap);
              }
            });
            group.appendChild(btn);
          });
        }

        if (c.type === 'intensity') {
          // Same shape as season (a set of named states), but for showing the
          // RANGE a weather-type object covers -- e.g. a snow panel demoing
          // calm vs blizzard directly, rather than just an on/off toggle.
          label.textContent = entry.kind === 'cloud' ? 'Wind' : 'Intensity';
          group.appendChild(label);
          c.options.forEach((opt) => {
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.type = 'button';
            btn.textContent = opt[0].toUpperCase() + opt.slice(1);
            btn.setAttribute('aria-pressed', String(state[entry.id].intensity === opt));
            btn.addEventListener('click', () => {
              state[entry.id].intensity = opt;
              group.querySelectorAll('.cat-btn').forEach((b) => b.setAttribute('aria-pressed', 'false'));
              btn.setAttribute('aria-pressed', 'true');
              if (entry.kind === 'cloud') {
                // The drift loop reads state[entry.id].windValue live on
                // every frame via its getWind() closure -- no rebuild needed.
                state[entry.id].windValue = CLOUD_WIND_VALUES[opt] ?? 1;
              } else {
                renderPreview(entry, wrap);
              }
            });
            group.appendChild(btn);
          });
        }

        if (c.type === 'coverage') {
          // Same pattern again, for showing a range of leaf density -- e.g.
          // full canopy vs sparse vs bare, the way the snow panel shows calm
          // vs blizzard.
          label.textContent = 'Leaves';
          group.appendChild(label);
          c.options.forEach((opt) => {
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.type = 'button';
            btn.textContent = opt[0].toUpperCase() + opt.slice(1);
            btn.setAttribute('aria-pressed', String(state[entry.id].coverage === opt));
            btn.addEventListener('click', () => {
              state[entry.id].coverage = opt;
              group.querySelectorAll('.cat-btn').forEach((b) => b.setAttribute('aria-pressed', 'false'));
              btn.setAttribute('aria-pressed', 'true');
              // Same principle as season: coverage is which existing leaves
              // are visible, not a new scatter -- fading the same fixed set
              // in/out reads as leaves gradually filling in or dropping,
              // not the canopy reshuffling itself.
              if (wrap._obj && typeof entry.onCoverageChange === 'function') {
                entry.onCoverageChange(wrap._obj, opt);
              } else {
                renderPreview(entry, wrap);
              }
            });
            group.appendChild(btn);
          });
        }

        if (c.type === 'wind') {
          label.textContent = 'Wind';
          group.appendChild(label);
          const levels = ['none', 'light', 'breezy', 'heavy'];
          levels.forEach((level) => {
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.type = 'button';
            btn.textContent = level[0].toUpperCase() + level.slice(1);
            btn.setAttribute('aria-pressed', String(state[entry.id].windLevel === level));
            btn.addEventListener('click', () => {
              state[entry.id].windLevel = level;
              group.querySelectorAll('.cat-btn').forEach((b) => b.setAttribute('aria-pressed', 'false'));
              btn.setAttribute('aria-pressed', 'true');
              // Wind only ever changes a data attribute the CSS above reads
              // for --wind-mult/--wind-speed -- never a rebuild, for any
              // entry kind, since the object itself hasn't changed at all.
              wrap.dataset.windLevel = level;
              // Exception: water shimmer's wind reactivity is a filter
              // (baseFrequency/displacement scale), which CSS custom
              // properties can't drive -- call its API directly instead.
              if (wrap._waterAPI) { try { wrap._waterAPI.setWind(levels.indexOf(level)); } catch (e) { console.error('setWind failed:', e); } }
            });
            group.appendChild(btn);
          });
        }

        if (c.type === 'time') {
          // Day / night: swaps the creature palette and card sky in place.
          label.textContent = 'Time';
          group.appendChild(label);
          ['day', 'night'].forEach((opt) => {
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.type = 'button';
            btn.textContent = opt === 'day' ? 'Day' : 'Night';
            btn.setAttribute('aria-pressed', String(!!state[entry.id].night === (opt === 'night')));
            btn.addEventListener('click', () => {
              state[entry.id].night = opt === 'night';
              group.querySelectorAll('.cat-btn').forEach((b) => b.setAttribute('aria-pressed', 'false'));
              btn.setAttribute('aria-pressed', 'true');
              if (wrap._creature) {
                wrap._creature.setNight(state[entry.id].night);
                wrap._backdrop.update(state[entry.id].season, state[entry.id].night);
              }
              else if (wrap._obj && typeof entry.onTimeChange === 'function') entry.onTimeChange(wrap._obj, state[entry.id].night);
            });
            group.appendChild(btn);
          });
        }

        if (c.type === 'behavior') {
          label.textContent = 'Behavior';
          group.appendChild(label);
          c.options.forEach((opt) => {
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.type = 'button';
            btn.textContent = opt[0].toUpperCase() + opt.slice(1);
            btn.setAttribute('aria-pressed', String(state[entry.id].behavior === opt));
            btn.addEventListener('click', () => {
              const wasStory = state[entry.id].behavior === 'story';
              state[entry.id].behavior = opt;
              group.querySelectorAll('.cat-btn').forEach((b) => b.setAttribute('aria-pressed', 'false'));
              btn.setAttribute('aria-pressed', 'true');
              // Story drives position and pose itself: entering or leaving it rebuilds the card.
              if (wrap._obj && typeof entry.onSet === 'function') entry.onSet(wrap._obj, 'behavior', opt);
              else if (opt === 'story' || wasStory) renderPreview(entry, wrap);
              else if (wrap._creature) wrap._creature.setBehavior(opt);
            });
            group.appendChild(btn);
          });
        }

        if (c.type === 'weather') {
          // Clear, or the scene's three levels: drizzle / shower / tempest, or in winter
          // flurries / snow / blizzard.
          label.textContent = 'Weather';
          group.appendChild(label);
          const names = window.CatalogWeather ? window.CatalogWeather.LEVELS[state[entry.id].season === 'winter' ? 'snow' : 'rain'] : ['1', '2', '3'];
          [0, 1, 2, 3].forEach((lv) => {
            const btn = document.createElement('button');
            btn.className = 'cat-btn cat-wx-btn';
            btn.type = 'button'; btn.dataset.lv = lv;
            btn.textContent = lv ? names[lv - 1] : 'Clear';
            btn.setAttribute('aria-pressed', String((state[entry.id].weather || 0) === lv));
            btn.addEventListener('click', () => {
              state[entry.id].weather = lv;
              group.querySelectorAll('.cat-btn').forEach((b) => b.setAttribute('aria-pressed', 'false'));
              btn.setAttribute('aria-pressed', 'true');
              if (wrap._wx) wrap._wx.set(state[entry.id].season === 'winter' ? 'snow' : 'rain', lv);
            });
            group.appendChild(btn);
          });
        }

        if (c.type === 'style') {
          // Origami (the traced papercraft puppet) or the original silhouette rig, for comparison.
          label.textContent = 'Style';
          group.appendChild(label);
          ['origami', 'silhouette'].forEach((opt) => {
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.type = 'button';
            btn.textContent = opt[0].toUpperCase() + opt.slice(1);
            btn.setAttribute('aria-pressed', String((state[entry.id].style || 'origami') === opt));
            btn.addEventListener('click', () => {
              state[entry.id].style = opt;
              group.querySelectorAll('.cat-btn').forEach((b) => b.setAttribute('aria-pressed', 'false'));
              btn.setAttribute('aria-pressed', 'true');
              // Behaviours differ a little between the two rigs; keep the current one if both have it.
              renderPreview(entry, wrap);
            });
            group.appendChild(btn);
          });
        }

        if (c.type === 'option') {
          // Any other named setting a part has (the squid's glow and depth): entry.onSet updates it in place.
          label.textContent = c.label;
          group.appendChild(label);
          c.options.forEach((opt) => {
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.type = 'button';
            btn.textContent = opt[0].toUpperCase() + opt.slice(1);
            btn.setAttribute('aria-pressed', String(state[entry.id][c.key] === opt));
            btn.addEventListener('click', () => {
              state[entry.id][c.key] = opt;
              group.querySelectorAll('.cat-btn').forEach((b) => b.setAttribute('aria-pressed', 'false'));
              btn.setAttribute('aria-pressed', 'true');
              if (wrap._obj && typeof entry.onSet === 'function') entry.onSet(wrap._obj, c.key, opt);
              else renderPreview(entry, wrap);
            });
            group.appendChild(btn);
          });
        }

        if (c.type === 'precip') {
          label.textContent = 'Precipitation';
          group.appendChild(label);
          const opts = c.options || ['none', 'rain', 'snow'];
          opts.forEach((opt) => {
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.type = 'button';
            btn.textContent = opt[0].toUpperCase() + opt.slice(1);
            btn.setAttribute('aria-pressed', String((state[entry.id].precip || 'none') === opt));
            btn.addEventListener('click', () => {
              state[entry.id].precip = opt;
              group.querySelectorAll('.cat-btn').forEach((b) => b.setAttribute('aria-pressed', 'false'));
              btn.setAttribute('aria-pressed', 'true');
              if (wrap._waterAPI) wrap._waterAPI.setPrecip(opt);
            });
            group.appendChild(btn);
          });
        }

        controls.appendChild(group);
      });

      body.appendChild(controls);
    }

    if (entry.note) {
      const note = document.createElement('p');
      note.className = 'cat-tags';
      note.style.color = '#8a9990';
      note.style.fontSize = '11.5px';
      note.style.lineHeight = '1.5';
      note.style.margin = '2px 0 0';
      note.textContent = entry.note;
      body.appendChild(note);
      // a long note shows its first lines; More opens the rest
      if (entry.note.length > 140) {
        note.classList.add('cat-note-clip');
        const more = document.createElement('button');
        more.type = 'button';
        more.className = 'cat-more';
        more.textContent = 'More';
        more.setAttribute('aria-expanded', 'false');
        more.addEventListener('click', () => {
          const open = note.classList.toggle('open');
          more.textContent = open ? 'Less' : 'More';
          more.setAttribute('aria-expanded', String(open));
        });
        body.appendChild(more);
      }
    }

    card.appendChild(body);
    // A single card's preview throwing (a browser-specific API quirk, a
    // fetch failure, anything) must never take the rest of the catalog
    // down with it -- Array.forEach in renderGrid has no built-in recovery,
    // so an uncaught error here previously meant every entry AFTER the
    // broken one silently never rendered at all. Caught here, that entry
    // shows a small visible failure state instead, and the grid moves on.
    try {
      renderPreview(entry, wrap);
    } catch (err) {
      console.error('Catalog card failed to render:', entry.id, err);
      wrap.innerHTML = '';
      const errEl = document.createElement('div');
      errEl.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;color:#b23;font-size:12px;text-align:center;padding:12px';
      errEl.textContent = 'Failed to render (see console): ' + entry.id;
      wrap.appendChild(errEl);
    }
    return card;
  }

  // ── filtering + grid render ──────────────────────────────────────────
  // Pills are fixed and ordered the way the scene is built, back to front: plants and trees,
  // land, sky, then the living things. Each has a URL slug (so ?trees links straight to it) and
  // a few aliases for old or natural names (?fauna, ?terrain, ?sky). Any other bare word in the
  // URL is taken as a search: ?fox, ?pine. Both at once works too: ?animals&q=wolf.
  const PILLS = [
    { label: 'All', slug: 'all', alias: [] },
    { label: 'Trees', slug: 'trees', alias: ['tree'] },
    { label: 'Plants', slug: 'plants', alias: ['plant', 'foliage', 'ground-foliage', 'ground'] },
    { label: 'Mountains', slug: 'mountains', alias: ['mountain', 'terrain'] },
    { label: 'Land & Water', slug: 'land-water', alias: ['land', 'water', 'land-and-water'] },
    { label: 'Sky & Weather', slug: 'sky-weather', alias: ['sky', 'weather', 'sky-and-weather'] },
    { label: 'Animals', slug: 'animals', alias: ['animal', 'fauna', 'wildlife', 'mammals'] },
    { label: 'Birds', slug: 'birds', alias: ['bird'] },
    { label: 'People', slug: 'people', alias: ['person', 'human', 'humans'] },
    { label: 'Characters', slug: 'characters', alias: ['character', 'narrator', 'robot', 'glazyarray'] },
    { label: 'Logos', slug: 'logos', alias: ['logo', 'badge', 'brand', 'icon'] },
  ].filter((p) => p.slug === 'all' || CATALOG.some((e) => e.category === p.label));
  const pillFor = (word) => {
    const w = String(word || '').toLowerCase().trim().replace(/\s*&\s*/g, '-').replace(/\s+/g, '-');
    return PILLS.find((p) => p.slug === w || p.alias.includes(w) || p.label.toLowerCase() === w) || null;
  };

  // Every word must appear somewhere in the name, category, tags or id ("red fox", "pine wind").
  function matchesSearch(entry) {
    if (!searchTerm) return true;
    const hay = (entry.name + ' ' + entry.category + ' ' + (entry.tags || []).join(' ') + ' ' + entry.id).toLowerCase();
    return searchTerm.split(/\s+/).every((w) => hay.includes(w));
  }
  const matches = (entry) => (activeCategory === 'All' || entry.category === activeCategory) && matchesSearch(entry);

  // ── shareable URL: the address bar always shows the current view ─────
  function readUrl() {
    const params = new URLSearchParams(location.search);
    const words = [];
    params.forEach((value, key) => {
      const k = key.toLowerCase();
      if (k === 'q' || k === 'search' || k === 's') { if (value) words.push(value); return; }
      if (k === 'cat' || k === 'category' || k === 'pill') { const p = pillFor(value); if (p) activeCategory = p.label; return; }
      const p = pillFor(key);
      if (p && !value) activeCategory = p.label;
      else if (!value) words.push(key);            // ?fox  ->  search "fox"
    });
    if (words.length) searchTerm = words.join(' ').trim().toLowerCase();
  }
  function writeUrl() {
    const parts = [];
    const p = PILLS.find((x) => x.label === activeCategory);
    if (p && p.slug !== 'all') parts.push(p.slug);
    if (searchTerm) parts.push('q=' + encodeURIComponent(searchTerm).replace(/%20/g, '+'));
    const url = location.pathname + (parts.length ? '?' + parts.join('&') : '') + location.hash;
    try { history.replaceState(null, '', url); } catch (_) { /* file:// or sandboxed */ }
  }

  function renderGrid() {
    const grid = $('catGrid');
    // Stop any per-card animation loops before throwing the cards away, or
    // they keep running (and holding their nodes) after a tab/search change.
    grid.querySelectorAll('.cat-scene-wrap').forEach((w) => {
      ['_stopCreature', '_stopDrift', '_stopBirds', '_stopFlock'].forEach((k) => { if (typeof w[k] === 'function') w[k](); });
      if (w._waterAPI) w._waterAPI.stop();
    });
    grid.innerHTML = '';
    const visible = CATALOG.filter(matches);
    visible.forEach((entry) => grid.appendChild(buildCard(entry)));
    const empty = $('catEmpty');
    empty.hidden = visible.length > 0;
    if (!visible.length) {
      const inAll = activeCategory !== 'All' && CATALOG.filter(matchesSearch).length;
      empty.innerHTML = '';
      empty.append(searchTerm ? `Nothing in ${activeCategory === 'All' ? 'the catalog' : activeCategory} matches “${searchTerm}”.` : 'Nothing here yet.');
      if (inAll) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'cat-empty-link';
        b.textContent = `Show ${inAll} match${inAll === 1 ? '' : 'es'} in All`;
        b.addEventListener('click', () => setCategory('All'));
        empty.append(' ', b);
      }
    }
    updateCounts();
    writeUrl();
  }

  function setCategory(label) {
    activeCategory = label;
    $('catTabs').querySelectorAll('.cat-tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.label === label)));
    renderGrid();
  }

  // Counts follow the search, so a pill shows how many results it would give; empty pills dim.
  function updateCounts() {
    const hits = CATALOG.filter(matchesSearch);
    $('catTabs').querySelectorAll('.cat-tab').forEach((b) => {
      const n = b.dataset.label === 'All' ? hits.length : hits.filter((e) => e.category === b.dataset.label).length;
      b.querySelector('.cat-count').textContent = n;
      b.classList.toggle('is-empty', n === 0);
    });
  }

  function renderTabs() {
    const tabsEl = $('catTabs');
    tabsEl.innerHTML = '';
    PILLS.forEach((p) => {
      const btn = document.createElement('button');
      btn.className = 'cat-tab';
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.dataset.label = p.label;
      btn.title = 'Link: ?' + p.slug;
      btn.append(p.label + ' ');
      const count = document.createElement('span');
      count.className = 'cat-count';
      btn.appendChild(count);
      btn.setAttribute('aria-selected', String(p.label === activeCategory));
      btn.addEventListener('click', () => setCategory(p.label));
      tabsEl.appendChild(btn);
    });
    const sel = tabsEl.querySelector('[aria-selected="true"]');
    if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  const input = $('catSearch'), clearBtn = $('catClear');
  const syncClear = () => { if (clearBtn) clearBtn.hidden = !input.value; };
  let searchT = null;
  input.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    syncClear();
    clearTimeout(searchT); searchT = setTimeout(renderGrid, 120);   // rebuilding live cards per key is heavy
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape' && input.value) { input.value = ''; input.dispatchEvent(new Event('input')); } });
  if (clearBtn) clearBtn.addEventListener('click', () => { input.value = ''; input.dispatchEvent(new Event('input')); input.focus(); });

  // Copy link to the current view (pill + search).
  const copyBtn = $('catCopy');
  if (copyBtn) copyBtn.addEventListener('click', async () => {
    writeUrl();
    const label = copyBtn.querySelector('span');
    let ok = false;
    try { await navigator.clipboard.writeText(location.href); ok = true; } catch (_) {
      const t = document.createElement('textarea'); t.value = location.href; document.body.appendChild(t); t.select();
      try { ok = document.execCommand('copy'); } catch (__) { ok = false; } t.remove();
    }
    label.textContent = ok ? 'Link copied' : 'Copy failed';
    copyBtn.classList.add('is-done');
    setTimeout(() => { label.textContent = 'Copy link'; copyBtn.classList.remove('is-done'); }, 1600);
  });

  readUrl();
  input.value = searchTerm; syncClear();
  renderTabs();
  renderGrid();
})();
