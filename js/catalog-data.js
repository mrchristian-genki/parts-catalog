// ============================================================
// catalog-data.js — the registry of every scene part.
//
// HOW TO ADD A NEW PART (the Engine Intake Process):
//   1. Log the asset first: what's its native viewBox/size, does it match
//      an existing coordinate-space family? (see project memory:
//      areas/asset-intake-process.md)
//   2. Add ONE entry to the CATALOG array below. Two shapes:
//        kind:'svg'   — for objects built by a components.js factory
//                       function (makePine, makeFlower, etc). `build`
//                       returns the SVG element to drop into the card.
//        kind:'image' — for background/terrain assets that are plain
//                       <img> files. `build` returns an <img> element.
//   3. Only list controls the object actually supports. A control you
//      add here should map to something the real engine does — this
//      catalog is a mirror of the engine, not a wishlist.
//   4. Set `status` honestly:
//        'live'       — wired into scene.js right now
//        'reference'  — built, working, but not currently called by
//                       the live scene (kept for future reuse)
//        'progress'   — asset exists but the animation/season/wind
//                       system for it isn't finished yet
//   5. Assign `zones` — NOT coordinates, categories. A pine is tagged
//      `zones:['grass']`; it doesn't know where the grass is in any
//      given scene, only that it belongs wherever a scene's own manifest
//      says the grass zone is. This is what makes an object portable
//      across scenes (Tahoe today, Hawaii/Ireland later) instead of
//      tied to one set of guessed coordinates. See a scene's own
//      manifest file (e.g. scenes/tahoe.manifest.js) for where each
//      zone actually sits in that scene's art.
// ============================================================

const FLOWER_SEASON_COLS = { spring: '#e85fa0', summer: '#d64b4b', fall: '#d4822a', winter: '#8a9898' };

const CATALOG = [

  // ── TREES ──────────────────────────────────────────────────────────
  {
    id: 'detailed-pine',
    name: 'Pine (traced art)',
    category: 'Trees',
    status: 'live',
    tags: ['pine', 'conifer', 'tree', 'wind', 'season'],
    zones: ['grass'],
    kind: 'svg',
    note: 'The pine actually used on the live banks. Whole-tree sway (.pine-detailed-sway) keeps running uninterrupted through a season change now -- setSeason() recolors in place instead of rebuilding. Winter reads as frosted (near-white), not just a duller green, since the needles aren\u2019t bare. Flagged as a strong future hero-tree candidate -- real traced detail, live season/wind response, no leaf-placement system needed the way deciduous trees require.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'spring' },
      { type: 'wind' },
    ],
    build(state) {
      return window.SceneComponents.makeDetailedPine({
        x: 150, y: 230, scale: 0.046, season: state.season, sway: true, tier: 'd',
      });
    },
    onSeasonChange(obj, season) {
      if (typeof obj.setSeason === 'function') obj.setSeason(season);
    },
  },
  {
    id: 'simple-pine',
    name: 'Pine (procedural)',
    category: 'Trees',
    status: 'reference',
    tags: ['pine', 'conifer', 'tree', 'procedural'],
    zones: ['grass'],
    kind: 'svg',
    note: 'Simpler 4-tier triangle pine. Built and working, but not currently placed anywhere in the live scene — kept in case a distant/background tier wants something cheaper than the traced art.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'summer' },
      { type: 'wind' },
    ],
    build(state) {
      return window.SceneComponents.makePine({ x: 150, y: 230, h: 175, tone: state.season, tier: 'd' });
    },
  },
  {
    id: 'deciduous-blob',
    name: 'Deciduous (procedural)',
    category: 'Trees',
    status: 'reference',
    tags: ['deciduous', 'tree', 'retired', 'procedural'],
    zones: ['grass'],
    kind: 'svg',
    note: 'Rebuilt as a lobed cluster of smaller circles (shadow lower-left, highlights upper-right, same light convention as the pines) instead of two giant overlapping circles, which read as a plain round blob rather than a tree. Still retired from the live scene, kept for reference. Winter is now frosted white rather than a duller green. setSeason() recolors in place, no rebuild.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'spring' },
    ],
    build(state) {
      return window.SceneComponents.makeDeciduous({ x: 150, y: 230, h: 175, season: state.season, tier: 'd' });
    },
    onSeasonChange(obj, season) {
      if (typeof obj.setSeason === 'function') obj.setSeason(season);
    },
  },
  {
    id: 'aspen-cutout',
    name: 'Aspen tree (image cutout)',
    category: 'Trees',
    status: 'progress',
    tags: ['tree', 'aspen', 'wind', 'season'],
    zones: ['grass', 'shoreline'],
    kind: 'image',
    src: 'assets/landscape-hills-scenic-green-isolated-tree.svg',
    // No longer "the" hero tree -- per the scene-hero-per-scene idea, this
    // is just a regular tree object: seasonal color + wind sway, usable
    // anywhere a scene wants it, not tied to one designated role. The Alder
    // tree (below) is the current Tahoe hero instead, since it's the most
    // detailed tree built so far; a future scene (Hawaii, etc.) would pick
    // whichever tree fits it best -- see areas/asset-intake-process.md.
    //
    // The source file is a huge 8192x1298 canvas where the tree itself only
    // occupies a small region (roughly x:1780-2530, y:490-1080, measured
    // from the traced path data). Without cropRect, object-fit:contain
    // shrinks the WHOLE canvas -- including all the empty space -- to fit
    // the card, crushing the tree down to a barely-visible speck (confirmed
    // in testing). cropRect crops to just that region instead.
    // Computed by actually parsing the SVG's path data (a proper path
    // tokenizer handling M/L/C/S commands and relative coordinates), not
    // eyeballed from reading the raw text -- that first attempt guessed the
    // canopy started around y=490 and cut off the whole top ~21% of the
    // tree. The real bounding box (excluding a few stray zero-length
    // artifact paths elsewhere in the file) is x:1773-2533, y:218-1081 out
    // of the 8192x1298 canvas; this is that box plus a 6% margin.
    cropRect: { x0: 0.2109, y0: 0.1280, x1: 0.3148, y1: 0.8725 },
    // Display box aspect now matches the crop's real aspect (~0.88:1,
    // taller than wide) instead of the previous guess, which had the wrong
    // orientation entirely (was wider than tall).
    cropDisplayBox: { left: '31%', bottom: '18%', width: '38%', height: '43%' },
    note: 'A real traced tree, now a regular catalog object rather than a designated hero. Whole-image sway is wired (.tree-isolated-sway). Season is a CSS filter shift over its baked-in green (same technique as Mountain Range, not a true recolor) since this is a static image, not a generator function -- less flexible than the pine/deciduous live setSeason() methods. Crop region is computed from actually parsing the source path data (proper path tokenizer, not eyeballed).',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'summer' },
      { type: 'wind' },
    ],
    seasonFilter: {
      winter: 'saturate(.15) brightness(1.25)',
      spring: 'hue-rotate(-6deg) saturate(1.1) brightness(1.03)',
      summer: 'saturate(1) brightness(1)',
      // Was hue-rotate(70deg), which pushes the source's baked-in green
      // (~110-120° hue) further AROUND the wheel into teal/cyan territory --
      // exactly the "odd green or teal" fall color reported. Green needs a
      // NEGATIVE rotation to swing back through yellow into orange/red
      // (roughly -90 to -100deg lands near 20-30° hue, true fall orange).
      // Saturation boosted too since a straight hue-rotate alone tends to
      // look washed out rather than a rich autumn color.
      fall: 'hue-rotate(-95deg) saturate(1.6) brightness(0.98)',
    },
  },
  {
    id: 'bare-tree-shell',
    name: 'Bare tree shell',
    category: 'Trees',
    status: 'progress',
    tags: ['tree', 'bare', 'branches', 'leaves-pending'],
    zones: ['grass', 'shoreline'],
    kind: 'image',
    src: 'assets/simple-black-and-white-bare-tree.svg',
    note: 'Trunk + branch silhouette meant to carry scattered individual leaf clusters (season color, wind sway per-leaf, falling in autumn). Not wired into any animation yet — needs a single exported leaf shape first.',
    controls: [],
  },

  // ── GROUND FOLIAGE ────────────────────────────────────────────────
  {
    id: 'flower',
    name: 'Flower',
    category: 'Plants',
    status: 'live',
    tags: ['flower', 'bloom', 'ground', 'season', 'wind'],
    zones: ['grass', 'shoreline'],
    kind: 'svg',
    note: 'Redesigned Sept 20: two-tone painterly petals (a darker base ellipse plus a smaller lighter highlight, both flat shapes, no filters) and 3 bloom variants (round/daisy/cup) so a cluster reads as different plants instead of one shape recolored. Nods on its stem as one unit (.flower-nod) — petals are stiff by design, only the whole bloom moves. setColor() re-derives the highlight from the new base color and recolors in place on a season change, no rebuild, so the nod animation never restarts. tier now defaults to ‘mobile’ (always visible) — the old ‘d’ default was hiding every live flower below 1024px.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'spring' },
      { type: 'wind' },
    ],
    build(state) {
      return window.SceneComponents.makeFlower({
        x: 150, y: 230, h: 95, color: FLOWER_SEASON_COLS[state.season], tier: 'mobile', variant: state.variant || 0,
      });
    },
    onSeasonChange(obj, season) {
      if (typeof obj.setColor === 'function') obj.setColor(FLOWER_SEASON_COLS[season]);
    },
  },
  {
    id: 'grass-clump',
    name: 'Grass clump',
    category: 'Plants',
    status: 'reference',
    tags: ['grass', 'reed', 'ground', 'procedural'],
    zones: ['grass', 'shoreline'],
    kind: 'svg',
    note: 'Base-pivot bend, springy recovery, two phase-offset sub-fans so it shimmers rather than moving as one stiff block. Built and working, not currently placed in the live scene.',
    controls: [
      { type: 'wind' },
    ],
    build() {
      return window.SceneComponents.makeGrass({ x: 150, y: 230, h: 72, tier: 'd' });
    },
  },

  // ── TERRAIN ───────────────────────────────────────────────────────
  {
    id: 'mountain-range',
    name: 'Mountain range (foothills)',
    category: 'Mountains',
    status: 'live',
    tags: ['mountain', 'background', 'terrain', 'season'],
    zones: ['foothill'],
    kind: 'image',
    src: 'assets/Mountain_Range_1.svg',
    note: 'The low foothills band behind the hero peak. Season filter here is the exact CSS filter recipe scene.js applies (GRADE.mtn), not a lookalike.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'summer' },
    ],
    seasonFilter: {
      winter: 'saturate(.28) brightness(.88) hue-rotate(195deg)',
      spring: 'hue-rotate(-8deg) saturate(1.12) brightness(1.04)',
      summer: 'saturate(1) brightness(1)',
      fall:   'hue-rotate(10deg) saturate(1.18) sepia(.10)',
    },
    // From the asset ledger (memory: areas/asset-intake-process.md): this
    // file's real art only occupies the bottom 61.2% of its own canvas.
    // Without this, the preview would be mostly the transparent top half.
    cropBottomFraction: 0.612,
  },
  {
    id: 'mountain-iso-0',
    name: 'Mountain A (isolated)',
    category: 'Mountains',
    status: 'live',
    tags: ['mountain', 'background', 'terrain', 'season', 'range', 'isolated'],
    zones: ['foothill'],
    kind: 'svg',
    note: 'One of 8 mountains Christian isolated and cropped himself directly in Illustrator, uploaded as separate files -- exactly 2 fill classes each, one dark body + one near-white cap, confirmed by reading the file rather than assumed. Body/cap here are told apart by comparing luminance (whichever fill is darker is body), not by which CSS class number happens to appear first, since that varies file to file. Both body and cap now come from MOUNTAIN_PALETTE (a real per-season color pair, not a white/body mix), and each is filled with a 3-stop vertical gradient (shadow/base/highlight, painterly-shading pass, Sept 20) re-stopped in place on season change rather than a flat color.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'winter' },
    ],
    build(state) {
      return window.SceneComponents.makeMountainIsolated({ shape: window.MOUNTAIN_SHAPES[0], x: 10, y: 93.2, scale: 0.301, season: state.season });
    },
    onSeasonChange(obj, season) { if (typeof obj.setSeason === 'function') obj.setSeason(season); },
  },
  {
    id: 'mountain-iso-1',
    name: 'Mountain B (isolated)',
    category: 'Mountains',
    status: 'live',
    tags: ['mountain', 'background', 'terrain', 'season', 'range', 'isolated'],
    zones: ['foothill'],
    kind: 'svg',
    note: 'Same source set as Mountain A, a different one of the 8 files Christian isolated. See Mountain A\u2019s note for how this system works.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'winter' },
    ],
    build(state) {
      return window.SceneComponents.makeMountainIsolated({ shape: window.MOUNTAIN_SHAPES[1], x: 10, y: 113.6, scale: 0.2617, season: state.season });
    },
    onSeasonChange(obj, season) { if (typeof obj.setSeason === 'function') obj.setSeason(season); },
  },
  {
    id: 'mountain-iso-2',
    name: 'Mountain C (isolated)',
    category: 'Mountains',
    status: 'live',
    tags: ['mountain', 'background', 'terrain', 'season', 'range', 'isolated'],
    zones: ['foothill'],
    kind: 'svg',
    note: 'Same source set as Mountain A, a different one of the 8 files Christian isolated. See Mountain A\u2019s note for how this system works.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'winter' },
    ],
    build(state) {
      return window.SceneComponents.makeMountainIsolated({ shape: window.MOUNTAIN_SHAPES[2], x: 10, y: 123.5, scale: 0.2427, season: state.season });
    },
    onSeasonChange(obj, season) { if (typeof obj.setSeason === 'function') obj.setSeason(season); },
  },
  {
    id: 'mountain-iso-3',
    name: 'Mountain D (isolated)',
    category: 'Mountains',
    status: 'live',
    tags: ['mountain', 'background', 'terrain', 'season', 'range', 'isolated'],
    zones: ['foothill'],
    kind: 'svg',
    note: 'Same source set as Mountain A, the widest of the 8 files Christian isolated. See Mountain A\u2019s note for how this system works.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'winter' },
    ],
    build(state) {
      return window.SceneComponents.makeMountainIsolated({ shape: window.MOUNTAIN_SHAPES[3], x: 10, y: 132.2, scale: 0.226, season: state.season });
    },
    onSeasonChange(obj, season) { if (typeof obj.setSeason === 'function') obj.setSeason(season); },
  },
  {
    id: 'mountain-iso-4',
    name: 'Mountain E (isolated)',
    category: 'Mountains',
    status: 'live',
    tags: ['mountain', 'background', 'terrain', 'season', 'range', 'isolated'],
    zones: ['foothill'],
    kind: 'svg',
    note: 'Same source set as Mountain A, a different one of the 8 files Christian isolated. See Mountain A\u2019s note for how this system works.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'winter' },
    ],
    build(state) {
      return window.SceneComponents.makeMountainIsolated({ shape: window.MOUNTAIN_SHAPES[4], x: 10, y: 102.6, scale: 0.2829, season: state.season });
    },
    onSeasonChange(obj, season) { if (typeof obj.setSeason === 'function') obj.setSeason(season); },
  },
  {
    id: 'mountain-iso-5',
    name: 'Mountain F (isolated)',
    category: 'Mountains',
    status: 'live',
    tags: ['mountain', 'background', 'terrain', 'season', 'range', 'isolated'],
    zones: ['foothill'],
    kind: 'svg',
    note: 'Same source set as Mountain A, a different one of the 8 files Christian isolated. See Mountain A\u2019s note for how this system works.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'winter' },
    ],
    build(state) {
      return window.SceneComponents.makeMountainIsolated({ shape: window.MOUNTAIN_SHAPES[5], x: 10, y: 109.6, scale: 0.2693, season: state.season });
    },
    onSeasonChange(obj, season) { if (typeof obj.setSeason === 'function') obj.setSeason(season); },
  },
  {
    id: 'mountain-iso-6',
    name: 'Mountain G (isolated)',
    category: 'Mountains',
    status: 'live',
    tags: ['mountain', 'background', 'terrain', 'season', 'range', 'isolated'],
    zones: ['foothill'],
    kind: 'svg',
    note: 'Same source set as Mountain A, a different one of the 8 files Christian isolated. See Mountain A\u2019s note for how this system works.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'winter' },
    ],
    build(state) {
      return window.SceneComponents.makeMountainIsolated({ shape: window.MOUNTAIN_SHAPES[6], x: 10, y: 114.5, scale: 0.2599, season: state.season });
    },
    onSeasonChange(obj, season) { if (typeof obj.setSeason === 'function') obj.setSeason(season); },
  },
  {
    id: 'mountain-iso-7',
    name: 'Mountain H (isolated)',
    category: 'Mountains',
    status: 'live',
    tags: ['mountain', 'background', 'terrain', 'season', 'range', 'isolated'],
    zones: ['foothill'],
    kind: 'svg',
    note: 'Same source set as Mountain A, the last of the 8 files Christian isolated -- this one\u2019s body is a lighter medium grey (#797A7A) rather than the near-black the others use, which is why its cap swap reads a little differently at the summer end (its own body color is lighter to begin with).',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'winter' },
    ],
    build(state) {
      return window.SceneComponents.makeMountainIsolated({ shape: window.MOUNTAIN_SHAPES[7], x: 10, y: 140.7, scale: 0.2266, season: state.season });
    },
    onSeasonChange(obj, season) { if (typeof obj.setSeason === 'function') obj.setSeason(season); },
  },
  {
    id: 'mountain-range-assembled',
    name: 'Mountain range (assembled)',
    category: 'Mountains',
    status: 'live',
    tags: ['mountain', 'background', 'terrain', 'season', 'range', 'isolated'],
    zones: ['foothill'],
    kind: 'composite',
    note: 'Four of the 8 isolated mountains (B, D, E, G) overlapped and layered back-to-front like a real skyline, per the "stacked together to build iconic ranges" idea -- farther/smaller peaks placed first (behind), the largest nearest peak last (in front, at the bottom of the DOM stack so it draws on top). Each mountain still recolors its own cap independently on season change; this card demos them acting together as one range. UPDATE: makeMountainIsolated now recolors via a real MOUNTAIN_PALETTE (per-season body/cap hex pairs), not a CSS filter over gray -- confirmed live in the V2 scene, which replaced the old static hero_peak_snow.svg with this same 3-mountain composition approach.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'winter' },
    ],
    build(state) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 300 300');
      svg.setAttribute('preserveAspectRatio', 'xMidYMax meet');
      // Back-to-front: smallest/farthest first, largest/nearest last (drawn on top).
      const picks = [
        { shapeIdx: 3, x: -30, y: 145, scale: 0.16 },   // farthest, smallest, widest shape shrunk down
        { shapeIdx: 6, x: 90,  y: 138, scale: 0.185 },
        { shapeIdx: 1, x: 40,  y: 120, scale: 0.21 },
        { shapeIdx: 4, x: 130, y: 108, scale: 0.235 },  // nearest, largest, frontmost
      ];
      const objs = picks.map(p => window.SceneComponents.makeMountainIsolated({
        shape: window.MOUNTAIN_SHAPES[p.shapeIdx], x: p.x, y: p.y, scale: p.scale, season: state.season,
      }));
      objs.forEach(o => svg.appendChild(o));
      svg.__mountainObjs = objs;
      return svg;
    },
    onSeasonChange(obj, season) {
      if (obj && obj.__mountainObjs) obj.__mountainObjs.forEach(o => { if (typeof o.setSeason === 'function') o.setSeason(season); });
    },
  },

  // ── SKY & WEATHER ─────────────────────────────────────────────────
  // Ported verbatim from catalog_final_optimized_v3.html (a previous, more
  // complete catalog build) after the user pointed out these weren't moving
  // and weren't geometrically correct in my earlier from-memory
  // reconstruction. Real puff() coordinates, real seasonal opacity gates,
  // real requestAnimationFrame drift loop -- see components.js
  // buildCloudFamily(). Season updates opacity live; Wind updates drift
  // speed live; neither rebuilds the cloud, matching the source behavior.
  {
    id: 'cloud-cumulus',
    name: 'Cumulus cloud',
    category: 'Sky & Weather',
    status: 'live',
    tags: ['cloud', 'sky', 'weather'],
    zones: ['sky'],
    kind: 'cloud',
    family: 'cumulus',
    note: 'Fat, flat-bottomed, 5 clouds. Purple-lavender body, warm mauve underside, white sunlit cap. Opacity by season: winter .9, spring .2, summer .7, fall .25. Not yet wired into scene.js.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'summer' },
      { type: 'intensity', options: ['still', 'breeze', 'gust', 'blizzard'], default: 'breeze' },
    ],
  },
  {
    id: 'cloud-cirrus',
    name: 'Cirrus wisps',
    category: 'Sky & Weather',
    status: 'live',
    tags: ['cloud', 'sky', 'weather', 'high-altitude'],
    zones: ['sky'],
    kind: 'cloud',
    family: 'cirrus',
    note: 'Thin high-altitude wisps, 7 of them, drawn as quadratic-curve paths rather than filled lobes. Opacity by season: winter .8, spring .6, summer .1, fall .9. Not yet wired into scene.js.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'fall' },
      { type: 'intensity', options: ['still', 'breeze', 'gust', 'blizzard'], default: 'breeze' },
    ],
  },
  {
    id: 'cloud-altocumulus',
    name: 'Altocumulus row',
    category: 'Sky & Weather',
    status: 'live',
    tags: ['cloud', 'sky', 'weather'],
    zones: ['sky'],
    kind: 'cloud',
    family: 'altocumulus',
    note: 'Two rows of 8 small puffs, evenly spaced like sheep. Opacity by season: winter .1, spring .9, summer .2, fall .7. Not yet wired into scene.js.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'spring' },
      { type: 'intensity', options: ['still', 'breeze', 'gust', 'blizzard'], default: 'breeze' },
    ],
  },
  {
    id: 'cloud-cumulonimbus',
    name: 'Cumulonimbus (storm)',
    category: 'Sky & Weather',
    status: 'live',
    tags: ['cloud', 'sky', 'weather', 'storm'],
    zones: ['sky'],
    kind: 'cloud',
    family: 'cumulonimbus',
    note: 'Tall stacked tower (6 puffs) with a flattened anvil top. Dominant in summer, absent in winter. Opacity by season: winter 0, spring .1, summer .9, fall .15. Not yet wired into scene.js.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'summer' },
      { type: 'intensity', options: ['still', 'breeze', 'gust', 'blizzard'], default: 'breeze' },
    ],
  },
  {
    id: 'sun',
    name: 'Sun',
    category: 'Sky & Weather',
    status: 'live',
    tags: ['sun', 'celestial', 'sky'],
    zones: ['sky'],
    kind: 'svg',
    note: 'Matches the live celestial layer exactly: soft radial glow + solid disc, no beams. Checked directly against scene.js — there are no beam paths in the current build and none are planned; the plate order already keeps this behind the mountains and in front of the sky, so both were already correct going into this pass.',
    controls: [],
    build() {
      const NS = 'http://www.w3.org/2000/svg';
      const mk = (tag, attrs, parent) => {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
      };
      const defs = mk('defs', {});
      defs.innerHTML = `<radialGradient id="catSunGlow"><stop offset="0" stop-color="#fff7d6" stop-opacity=".9"/><stop offset=".4" stop-color="#ffe9a8" stop-opacity=".35"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>`;
      const body = mk('g', {});
      body.appendChild(defs);
      mk('circle', { cx: 150, cy: 90, r: 60, fill: 'url(#catSunGlow)' }, body);
      mk('circle', { cx: 150, cy: 90, r: 20, fill: '#ffe9a8' }, body);
      return body;
    },
  },
  {
    id: 'moon',
    name: 'Moon',
    category: 'Sky & Weather',
    status: 'live',
    tags: ['moon', 'celestial', 'sky', 'night'],
    zones: ['sky'],
    kind: 'svg',
    note: 'Matches the live celestial layer: glow + disc + two soft crater shadows.',
    controls: [],
    build() {
      const NS = 'http://www.w3.org/2000/svg';
      const mk = (tag, attrs, parent) => {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
      };
      const defs = mk('defs', {});
      defs.innerHTML = `<radialGradient id="catMoonGlow"><stop offset="0" stop-color="#eaf0ff" stop-opacity=".8"/><stop offset=".5" stop-color="#cdd8f0" stop-opacity=".3"/><stop offset="1" stop-color="#cdd8f0" stop-opacity="0"/></radialGradient>`;
      const body = mk('g', {});
      body.appendChild(defs);
      mk('circle', { cx: 150, cy: 90, r: 46, fill: 'url(#catMoonGlow)' }, body);
      mk('circle', { cx: 150, cy: 90, r: 15, fill: '#eef1f7' }, body);
      mk('circle', { cx: 145, cy: 96, r: 3, fill: '#d4dcec', opacity: '.5' }, body);
      mk('circle', { cx: 154, cy: 85, r: 2, fill: '#d4dcec', opacity: '.45' }, body);
      return body;
    },
  },
  {
    id: 'rainfall',
    name: 'Rainfall',
    category: 'Sky & Weather',
    status: 'live',
    tags: ['rain', 'weather', 'monsoon'],
    zones: [],
    kind: 'svg',
    note: 'The base rain effect already runs live in scene.js (canvas-drawn, opacity driven by season). This calm/monsoon range is the intensity axis that exists in the season curve but was never demoed on its own before — checked directly against the live code, "monsoon" isn\u2019t a separate tier there yet, just the higher end of the same curve.',
    controls: [
      { type: 'intensity', options: ['calm', 'monsoon'], default: 'calm' },
    ],
    build(state) {
      return window.SceneComponents.makeRainfall({ width: 300, height: 300, intensity: state.intensity });
    },
  },
  {
    id: 'snowfall',
    name: 'Snowfall',
    category: 'Sky & Weather',
    status: 'live',
    tags: ['snow', 'weather', 'winter', 'blizzard'],
    zones: [],
    kind: 'svg',
    note: 'Net-new — checked scene.js directly and there is no falling-snow system yet, only the static snow-capped peak art and an unfinished stub. This card demos it as SVG circles for the catalog; the real scene-wide version should mirror the existing rain implementation and stay canvas-based for the same performance reasons. Not wired into scene.js.',
    controls: [
      { type: 'intensity', options: ['calm', 'blizzard'], default: 'calm' },
    ],
    build(state) {
      return window.SceneComponents.makeSnowfall({ width: 300, height: 300, intensity: state.intensity });
    },
  },
  {
    id: 'leaf-single',
    name: 'Leaf (single)',
    category: 'Plants',
    status: 'live',
    tags: ['leaf', 'aspen', 'foliage', 'wind', 'season'],
    zones: [],
    kind: 'image',
    src: 'assets/single-leaf-01.svg',
    swayClass: 'leaf-img-flutter',
    note: 'Now live: this leaf and the 4-color aspen-leaf.svg set (rasterized once to small transparent PNGs, assets/leaves/) are the sprites drawn by the fall-only leaf-fall canvas particle system in scene.js (rotating, swaying, tumbling across the whole scene, same canvas rain/snow already use). No CSS filter recoloring in that system -- the 5 pre-colored sprites (green/chartreuse/gold/orange aspen + red maple) provide the season’s color variety directly.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'fall' },
      { type: 'wind' },
    ],
    seasonFilter: {
      // brightness(0) crushes the leaf to solid black regardless of its
      // original red/orange color, then invert() flips that to a frosted
      // near-white -- the only filter combination that reliably gets to
      // "white" from an arbitrary starting hue. The old version
      // (saturate+brightness<1) just darkened and muddied the leaf instead
      // of whitening it, which isn't what winter should look like next to
      // the pine/deciduous/mountain objects, all of which read as frosted
      // white in winter.
      winter: 'brightness(0) invert(0.95)',
      spring: 'hue-rotate(95deg) saturate(1.05) brightness(1.05)',
      summer: 'hue-rotate(105deg) saturate(.95) brightness(.95)',
      fall:   'none',
    },
  },
  {
    id: 'alder-hero',
    name: 'Alder tree (Tahoe hero)',
    category: 'Trees',
    status: 'live',
    tags: ['tree', 'alder', 'leaf', 'foliage', 'season', 'wind', 'falling', 'hero'],
    zones: ['grass', 'shoreline'],
    kind: 'composite',
    hero: 'tahoe',
    note: 'The current hero tree for the Tahoe scene -- white bark with black marks reads as alder (not aspen), and it\u2019s the most detailed tree built so far (real bark, individually-swaying leaves, full seasonal range), which is the actual bar for "hero" status now: whichever tree is most detailed for a given scene. A future scene picks its own -- a palm or banyan for Hawaii, for instance -- rather than reusing this one by default. Honest caveat: leaf positions here are ESTIMATED against the shell\\u2019s rough canopy area, not measured against its actual branch endpoints (that would need the shell\\u2019s geometry read the same way Tahoe\\u2019s shoreline was) -- so treat the exact placement as a first pass, not final. The Leaves control demos the full-canopy-to-bare range directly, the same way the snow panel demos calm vs blizzard.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'fall' },
      { type: 'coverage', options: ['full', 'sparse', 'bare'], default: 'full' },
      { type: 'wind' },
    ],
    build(state) {
      const LEAF_SEASON_FILTER = {
        // Same fix as the standalone leaf entry: brightness(0)+invert
        // reliably produces frosted white regardless of the leaf's
        // original color, matching pine/deciduous/mountains all reading
        // as white in winter. The old saturate+brightness<1 version just
        // darkened the leaf instead of whitening it.
        winter: 'brightness(0) invert(0.95)',
        spring: 'hue-rotate(95deg) saturate(1.05) brightness(1.05)',
        summer: 'hue-rotate(105deg) saturate(.95) brightness(.95)',
        fall:   'none',
      };
      // Calibrated against a reference photo of an aspen in full autumn
      // color: the canopy should read as one dense, essentially solid mass
      // with no visible gaps or branch structure -- not a sprinkle of
      // individual leaves. 26 was far too sparse; this uses ~9x more,
      // smaller individually so density comes from overlap and count
      // rather than a few oversized leaves.
      const COVERAGE_FRACTION = { full: 1, sparse: 0.32, bare: 0 };
      const wrap = document.createElement('div');
      Object.assign(wrap.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });

      // White bark patch, placed BEHIND the shell so the shell's black trunk
      // lines read as marks/lenticels ON a white trunk (real aspen/birch/
      // alder bark) instead of a solid black silhouette against the sky.
      // The shell file itself is just black outline paths with no fill
      // color of its own, so without this the trunk area was showing the
      // card's sky-blue background right through it.
      // Position is an ESTIMATE of where the trunk sits within the shell's
      // own rendered box (lower-center, below where branches spread out) --
      // not measured against the shell's actual path geometry the way the
      // hero-tree crop above now is.
      const bark = document.createElement('div');
      Object.assign(bark.style, {
        // Narrowed from 9% to 5% width -- it was wider than the trunk's own
        // black trim at the base, sticking out past the edges there. Height
        // trimmed slightly and bottom raised a touch to stay clear of the
        // root-flare/ground-shadow area where the trunk silhouette is
        // narrowest and most likely to be poked through by a too-wide patch.
        position: 'absolute', left: '47.5%', bottom: '19%', width: '5%', height: '26%',
        background: '#f7f5f0', borderRadius: '50% 50% 20% 20% / 60% 60% 15% 15%',
        opacity: '0.95',
      });
      wrap.appendChild(bark);

      // Bare branch shell -- the static base, always fully visible.
      const shell = document.createElement('img');
      shell.src = 'assets/simple-black-and-white-bare-tree.svg';
      shell.alt = 'Bare tree shell';
      Object.assign(shell.style, {
        position: 'absolute', left: '30%', bottom: '18%', width: '40%', height: '68%',
        objectFit: 'contain', objectPosition: 'bottom',
      });
      window.attachImgFallback(shell, 'assets/simple-black-and-white-bare-tree.svg');
      wrap.appendChild(shell);

      // Scattered leaves -- built ONCE, at the FULL pool size, regardless of
      // the season or coverage this card opens on. Season and coverage
      // changes NEVER regenerate this scatter: nature doesn't reshuffle
      // which leaves exist when it gets colder, it changes their color and
      // gradually drops them. So:
      //   - season change -> update each existing leaf's color filter in
      //     place (CSS transition on `filter` makes it ease, not snap)
      //   - coverage change -> fade individual EXISTING leaves in/out via
      //     opacity (which leaves stay visible at "sparse" is fixed by
      //     creation index, not re-randomized, so full->sparse->full always
      //     shows/hides the exact same leaves)
      // Tapered into a rough teardrop but with a wider, denser crown --
      // branches were still poking through mainly at the TOP per an earlier
      // screenshot, so sampling is biased toward the top (more leaves land
      // near t=0) and the taper there is softened so the crown isn't
      // pinched to a near-zero-width point. Still an ESTIMATE against the
      // shell's rough canopy area, not measured branch geometry -- scrapped
      // trying to measure exact branch-tip positions since the source file
      // has genuinely malformed path data at two points (confirmed against
      // three independent parsers, not a bug in how it was read).
      const total = 320;
      const canopyTop = 10, canopyBottom = 60; // % from top of card
      const centerX = 51, maxHalfWidth = 22; // %
      const leafEls = [];
      for (let i = 0; i < total; i++) {
        // Milder bias than before (1.6 -> 1.15) -- the stronger version
        // fixed branches poking through at the top but overcorrected into
        // a top-heavy canopy. This keeps a slight lean toward the top
        // (still no branch-poking) without leaving the rest of the tree
        // comparatively bare.
        const t = Math.pow(Math.random(), 1.15);
        const ly = canopyTop + t * (canopyBottom - canopyTop);
        const widthFactor = t < 0.5 ? 0.4 + (t / 0.5) * 0.6 : 1;
        const lx = centerX + (Math.random() - 0.5) * 2 * maxHalfWidth * widthFactor;
        const leaf = document.createElement('img');
        leaf.src = 'assets/single-leaf-01.svg';
        leaf.alt = '';
        const size = 4 + Math.random() * 3.2;
        Object.assign(leaf.style, {
          position: 'absolute', left: lx + '%', top: ly + '%', width: size + '%', height: 'auto',
          filter: LEAF_SEASON_FILTER[state.season],
          transform: `rotate(${(Math.random() * 40 - 20).toFixed(0)}deg)`,
          transition: 'filter 0.8s ease, opacity 0.8s ease',
          opacity: i < Math.round(total * COVERAGE_FRACTION[state.coverage]) ? '1' : '0',
        });
        leaf.classList.add('leaf-img-flutter');
        leaf.style.setProperty('--dur', (0.7 + Math.random() * 0.6).toFixed(2) + 's');
        leaf.style.setProperty('--delay', (Math.random() * 1.2).toFixed(2) + 's');
        window.attachImgFallback(leaf, '');
        wrap.appendChild(leaf);
        leafEls.push(leaf);
      }
      wrap._leafEls = leafEls;
      wrap._leafTotal = total;

      wrap.setSeason = function (season) {
        leafEls.forEach(el => { el.style.filter = LEAF_SEASON_FILTER[season]; });
      };
      wrap.setCoverage = function (coverage) {
        const showCount = Math.round(total * COVERAGE_FRACTION[coverage]);
        leafEls.forEach((el, i) => { el.style.opacity = i < showCount ? '1' : '0'; });
      };

      return wrap;
    },
    onSeasonChange(obj, season) { if (obj && typeof obj.setSeason === 'function') obj.setSeason(season); },
    onCoverageChange(obj, coverage) { if (obj && typeof obj.setCoverage === 'function') obj.setCoverage(coverage); },
  },

  // ── FAUNA ─────────────────────────────────────────────────────────
  {
    id: 'birds-real',
    name: 'Birds (wing rig)',
    category: 'Birds',
    status: 'live',
    tags: ['bird', 'fauna', 'sky', 'flying', 'animated', 'wings'],
    zones: ['sky'],
    kind: 'bird',
    note: 'Replaces the earlier dart-shaped boids-flocking version. That shape could flock (rotate freely to face any heading) because a dart looks correct pointing any direction -- this bird can\u2019t: its design (head leaning right, body hanging below the wing root, wings spread left-right) only reads correctly upright and roughly horizontal, so rotating it to face a boid\u2019s arbitrary heading would break the calibrated head/body relationship. Real 2D boids flocking was deliberately not attempted here for that reason. What this has instead: real per-frame wing geometry (span/chord/taper math, not a static shape) for 4 species (song/swift/gull/dove), each with its own timing and dihedral feel, independently flapping with gentle horizontal drift at different speeds so the group reads as flying rather than flapping in place -- no rotation-to-heading needed, so the asymmetric head/body design stays correct at every moment. Species table, wing geometry, and the head/body/beak hang position are ported verbatim from the validated standalone rig (studies/bird-rig-test.html) -- the proportions came from several rounds of measuring Christian\u2019s own reference files directly, not guessed here. If a looser, more flock-like group feel is wanted later, horizontal drift with only mild vertical bobbing (no rotation) is the safe way to add more birds without revisiting this constraint.',
    controls: [],
    build() {
      // Bird kind is handled directly in catalog-app.js's renderPreview
      // (own rAF loop, needs an explicit stop() on rebuild) -- this build()
      // is never called for kind:'bird', present only so this entry matches
      // the shape every other catalog entry has.
      return null;
    },
  },
  // ── FAUNA: creatures.js rigs (added Sept 23) ─────────────────────────
  // Cut from animal-sprite-master.svg (+ chipmunk.svg, fisherman-boat.svg)
  // into tight per-animal SVG, animated by clipping moving parts (head,
  // tail, wings) out of the same art and rotating them. See creatures.js.
  {
    id: 'creature-deer',
    name: "Mule deer buck",
    category: 'Animals',
    status: 'reference',
    tags: ['deer', 'buck', 'antlers', 'fauna', 'mammal'],
    zones: ['shoreline', 'grass', 'treeline'],
    kind: 'creature',
    creature: 'deer',
    note: "Origami buck on the doe's rig: grazes, walks, looks up alert. Antlers ride on the head joint.",
    controls: [
      { type: 'season', options: ['spring', 'summer', 'fall', 'winter'], default: 'summer' },
      { type: 'time', default: 'day' },
      { type: 'behavior', options: ['story', 'idle', 'alert', 'graze', 'walk'], default: 'story' },
    ],
  },
  {
    id: 'creature-doe',
    name: "Doe",
    category: 'Animals',
    status: 'reference',
    tags: ['deer', 'doe', 'grazing', 'fauna', 'mammal'],
    zones: ['shoreline', 'grass'],
    kind: 'creature',
    creature: 'doe',
    note: "Traced origami puppet in 9 hinged parts: grazes all the way to the grass, walks, flicks ears and tail.",
    controls: [
      { type: 'season', options: ['spring', 'summer', 'fall', 'winter'], default: 'summer' },
      { type: 'time', default: 'day' },
      { type: 'behavior', options: ['story', 'graze', 'idle', 'alert', 'walk'], default: 'story' },
    ],
  },
  {
    id: 'creature-elk',
    name: "Elk bull",
    category: 'Animals',
    status: 'reference',
    tags: ['elk', 'antlers', 'fauna', 'mammal'],
    zones: ['grass', 'treeline'],
    kind: 'creature',
    creature: 'elk',
    note: "Origami elk with a dark maned neck: grazes, walks, looks up alert. Not really a Lake Tahoe animal, so better kept for another scene.",
    controls: [
      { type: 'season', options: ['spring', 'summer', 'fall', 'winter'], default: 'summer' },
      { type: 'time', default: 'day' },
      { type: 'behavior', options: ['story', 'idle', 'alert', 'graze', 'walk'], default: 'story' },
    ],
  },
  {
    id: 'creature-bear',
    name: "Black bear",
    category: 'Animals',
    status: 'reference',
    tags: ['bear', 'fauna', 'mammal', 'walking'],
    zones: ['shoreline', 'grass'],
    kind: 'creature',
    creature: 'bear',
    note: "Origami bear: a rolling amble across the card, or stands and noses the ground. Spring through fall only (hibernates in winter).",
    controls: [
      { type: 'season', options: ['spring', 'summer', 'fall', 'winter'], default: 'summer' },
      { type: 'time', default: 'day' },
      { type: 'behavior', options: ['story', 'walk', 'forage'], default: 'story' },
    ],
  },
  {
    id: 'creature-fox',
    name: "Red fox",
    category: 'Animals',
    status: 'reference',
    tags: ['fox', 'fauna', 'mammal'],
    zones: ['grass', 'boulder', 'shoreline'],
    kind: 'creature',
    creature: 'fox',
    note: "Standing origami fox: ear flicks and looks about, noses the ground, or trots. Walks out of the trees in the scene.",
    controls: [
      { type: 'season', options: ['spring', 'summer', 'fall', 'winter'], default: 'summer' },
      { type: 'time', default: 'day' },
      { type: 'behavior', options: ['story', 'sit', 'sniff', 'walk'], default: 'story' },
    ],
  },
  {
    id: 'creature-hare',
    name: "Hare",
    category: 'Animals',
    status: 'reference',
    tags: ['hare', 'rabbit', 'fauna', 'mammal', 'hopping'],
    zones: ['grass'],
    kind: 'creature',
    creature: 'hare',
    sink: 0,
    note: "Origami hare: sits and sniffs, or hops (crouch, spring, land). White snowshoe coat in winter.",
    controls: [
      { type: 'season', options: ['spring', 'summer', 'fall', 'winter'], default: 'summer' },
      { type: 'time', default: 'day' },
      { type: 'behavior', options: ['story', 'hop', 'sit'], default: 'story' },
    ],
  },
  {
    id: 'creature-squirrel',
    name: "Red squirrel",
    category: 'Animals',
    status: 'reference',
    tags: ['squirrel', 'acorn', 'fauna', 'mammal'],
    zones: ['tree', 'boulder'],
    kind: 'creature',
    creature: 'squirrel',
    note: "Origami squirrel: paws up to the mouth, nibbling, with tail twitches. Lives on the hero tree.",
    controls: [
      { type: 'season', options: ['spring', 'summer', 'fall', 'winter'], default: 'summer' },
      { type: 'time', default: 'day' },
      { type: 'behavior', options: ['nibble'] },
    ],
  },
  {
    id: 'creature-chipmunk',
    name: "Chipmunk",
    category: 'Animals',
    status: 'reference',
    tags: ['chipmunk', 'fauna', 'mammal', 'engraved'],
    zones: ['boulder', 'grass'],
    kind: 'creature',
    creature: 'chipmunk',
    maxH: 175,
    maxW: 190,
    note: "Origami chipmunk: quick looks, paw tucks and tail flicks, snapping between poses.",
    controls: [
      { type: 'season', options: ['spring', 'summer', 'fall', 'winter'], default: 'summer' },
      { type: 'time', default: 'day' },
      { type: 'behavior', options: ['alert'] },
    ],
  },
  {
    id: 'creature-owl',
    name: "Great horned owl",
    category: 'Birds',
    status: 'reference',
    tags: ['owl', 'bird', 'fauna', 'night'],
    zones: ['tree'],
    kind: 'creature',
    creature: 'owl',
    note: "Origami owl: slow head turns on the pine tops at night. Snowy in winter.",
    controls: [
      { type: 'season', options: ['spring', 'summer', 'fall', 'winter'], default: 'summer' },
      { type: 'time', default: 'night' },
    ],
  },
  {
    id: 'creature-hawk',
    name: "Hawk (perched)",
    category: 'Birds',
    status: 'reference',
    tags: ['hawk', 'bird', 'raptor', 'fauna'],
    zones: ['tree', 'boulder'],
    kind: 'creature',
    creature: 'hawk',
    note: "Origami hawk: snappy head turns and a tail flick, perched on a pine top.",
    controls: [
      { type: 'season', options: ['spring', 'summer', 'fall', 'winter'], default: 'summer' },
      { type: 'time', default: 'day' },
      { type: 'behavior', options: ['perch'] },
    ],
  },
  {
    id: 'creature-eagle',
    name: "Bald eagle",
    category: 'Birds',
    status: 'reference',
    tags: ['eagle', 'bird', 'raptor', 'fauna', 'sky', 'flying'],
    zones: ['sky'],
    kind: 'creature',
    creature: 'eagle',
    maxW: 240,
    maxH: 150,
    note: "Origami eagle, both wings hinged: soars, or beats its wings. The scene tilts it into a diving stoop.",
    controls: [
      { type: 'season', options: ['spring', 'summer', 'fall', 'winter'], default: 'summer' },
      { type: 'time', default: 'day' },
      { type: 'behavior', options: ['story', 'soar', 'flap'], default: 'story' },
    ],
  },
  {
    id: 'creature-wolf-howl',
    name: "Wolf (howling)",
    category: 'Animals',
    status: 'reference',
    tags: ['wolf', 'fauna', 'mammal', 'night'],
    zones: ['foothill', 'boulder'],
    kind: 'creature',
    creature: 'wolf-howl',
    note: "Origami wolf: looks out, then lifts its head into a long howl. Fall and winter nights.",
    controls: [
      { type: 'season', options: ['spring', 'summer', 'fall', 'winter'], default: 'summer' },
      { type: 'time', default: 'night' },
    ],
  },
  {
    id: 'creature-wolf-run',
    name: "Wolf (trotting)",
    category: 'Animals',
    status: 'reference',
    tags: ['wolf', 'fauna', 'mammal', 'running'],
    zones: ['grass', 'shoreline'],
    kind: 'creature',
    creature: 'wolf-run',
    note: "Origami wolf with a full trot: diagonal legs swing together and the body rises on each stride.",
    controls: [
      { type: 'season', options: ['spring', 'summer', 'fall', 'winter'], default: 'summer' },
      { type: 'time', default: 'day' },
      { type: 'behavior', options: ['story', 'run', 'walk'], default: 'story' },
    ],
  },
  {
    id: 'creature-marley',
    name: "Marley",
    category: 'Animals',
    status: 'live',
    tags: ['dog', 'marley', 'ridgeback', 'beagle', 'tent', 'fauna', 'mammal', 'pet'],
    zones: ['grass', 'shoreline'],
    kind: 'creature',
    creature: 'marley',
    note: "Half Rhodesian ridgeback, half beagle, pit bull sized. Comes out of the tent on the right bank, sniffs about with her tail going, and trots back in. At night she wears a glow-in-the-dark collar. Origami only.",
    controls: [
      { type: 'season', options: ['spring', 'summer', 'fall', 'winter'], default: 'summer' },
      { type: 'time', default: 'day' },
      { type: 'behavior', options: ['story', 'idle', 'sniff', 'walk'], default: 'story' },
    ],
  },
  {
    id: 'creature-fisherman',
    name: "Fisherman in a paper boat",
    category: 'People',
    status: 'reference',
    tags: ['fisherman', 'boat', 'person', 'water'],
    zones: ['water-surface'],
    kind: 'creature',
    creature: 'fisherman',
    maxW: 240,
    maxH: 190,
    note: "Origami fisherman in a folded paper boat, rod bobbing with a plumb line. At night a lantern hangs at the stern.",
    controls: [
      { type: 'season', options: ['spring', 'summer', 'fall', 'winter'], default: 'summer' },
      { type: 'time', default: 'day' },
      { type: 'behavior', options: ['fish'] },
    ],
  },
  {
    id: 'birds-flock-canvas',
    name: 'Birds (flocking)',
    category: 'Birds',
    status: 'progress',
    tags: ['bird', 'fauna', 'sky', 'flying', 'flocking', 'animated', 'canvas'],
    zones: ['sky'],
    kind: 'flock',
    note: 'A second, deliberately separate bird -- built specifically to answer whether the wing-rig bird (see that entry) could flock: it can\u2019t, since its asymmetric head/body design only reads correctly upright and roughly horizontal. This one is a single rigid silhouette (nose at one tip, swept wings, forked tail streamers) supplied ready-made, already rotation-safe by design -- it looks correct facing any heading, which is exactly what real boids flocking needs every frame. Real separation/alignment/cohesion flocking (not the loose independent-drift approximation on the wing-rig entry), prototyped first outside this session and ported in. Rendered on canvas rather than as SVG/DOM elements on purpose: a real flock needs an O(n^2) neighbor check every frame per boid PLUS a transform update, and doing that through many live SVG elements would mean that many style writes every frame -- exactly the per-frame-DOM-write cost the lessons-learned doc already warns off. Canvas sidesteps it by never touching the DOM after the initial element. Wing flap is a simple vertical-scale oscillation (no separate moving wing parts, since the shape is one static silhouette) -- a reasonable illusion for a small fast-moving flock, not attempting the wing-rig\u2019s real per-frame wing geometry.',
    controls: [],
    build() {
      // Flock kind is handled directly in catalog-app.js's renderPreview
      // (own rAF loop + canvas element, needs an explicit stop() on
      // rebuild) -- this build() is never called for kind:'flock', present
      // only so this entry matches the shape every other catalog entry has.
      return null;
    },
  },

  // ── TERRAIN DETAIL ────────────────────────────────────────────────
  {
    id: 'boulder-grass-1',
    name: 'Boulder with grass (1)',
    category: 'Land & Water',
    status: 'live',
    tags: ['boulder', 'rock', 'grass', 'terrain', 'wind', 'season'],
    zones: ['grass', 'foothill'],
    kind: 'boulder',
    src: 'assets/boulder-grass-0_0.svg',
    note: 'One of 12 variants from a single sprite-sheet source (Boulder_grass-nosky.svg, a 4x3 grid of distinct boulder+grass pairs) -- split apart by grid position, then each variant\u2019s own paths classified into rock vs. grass by hue (grass = green hue with high saturation; rock = the grey-teal low-saturation remainder), confirmed visually before extraction. Stored as its own small SVG file rather than inlined -- embedding real path data for even one variant runs 80-95KB, and all 12 together would have added ~1.6MB to this file. Only 3 of the 12 source variants are in the catalog so far (this one, boulder-grass-2, boulder-grass-3) -- the other 9 use the identical extraction technique and can be added the same way. Wind sways only the grass clump (pivoted at its own base via transform-box:fill-box, 50% 100% -- lines up naturally since that\u2019s the same point used to compute the clump\u2019s bounding box during extraction); the rock never moves. Season is a single CSS filter per group rather than recoloring the 10-40 individual shading paths inside each by hand -- grass shifts green through gold/brown (fall) to heavily frosted (winter) back to fresh green (spring); rock gets only a light frost in winter and is otherwise untouched, since real rock doesn\u2019t change color with the seasons the way foliage does.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'summer' },
      { type: 'wind' },
    ],
  },
  {
    id: 'boulder-grass-2',
    name: 'Boulder with grass (2)',
    category: 'Land & Water',
    status: 'live',
    tags: ['boulder', 'rock', 'grass', 'terrain', 'wind', 'season'],
    zones: ['grass', 'foothill'],
    kind: 'boulder',
    src: 'assets/boulder-grass-0_2.svg',
    note: 'Same source sheet and extraction technique as boulder-grass-1 -- see that entry for the full method. This variant has noticeably more grass paths (42, vs. 23 on variant 1), so it\u2019s a good one to check first if a future wind-timing tweak needs a denser clump to look right on.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'summer' },
      { type: 'wind' },
    ],
  },
  {
    id: 'boulder-grass-3',
    name: 'Boulder with grass (3)',
    category: 'Land & Water',
    status: 'live',
    tags: ['boulder', 'rock', 'grass', 'terrain', 'wind', 'season'],
    zones: ['grass', 'foothill'],
    kind: 'boulder',
    src: 'assets/boulder-grass-1_1.svg',
    note: 'Same source sheet and extraction technique as boulder-grass-1 -- see that entry for the full method. Smallest grass clump of the three picked so far (7 paths), and the tallest/narrowest rock silhouette -- a useful contrast case for spotting whether the sway amplitude still reads on a sparse clump.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'summer' },
      { type: 'wind' },
    ],
  },
  {
    id: 'weather-levels',
    name: 'Weather: rain and snow',
    category: 'Sky & Weather',
    status: 'live',
    tags: ['weather', 'rain', 'snow', 'storm', 'drizzle', 'shower', 'tempest', 'flurries', 'blizzard', 'drops', 'flakes'],
    zones: ['sky', 'ui'],
    kind: 'weather',
    note: "The scene's weather in three levels, the same as its links: rain is drizzle, shower, tempest; in winter snow is flurries, snow, blizzard. Everything turns up with the level: the darker sky, the amount falling, the wind (gusts in bursts at a blizzard), lightning at a tempest. Rain beads sit on the headline and button and drip off their lower edges; snowflakes drift down, stick to the tops of the letters and the button, then melt (flurries melt almost as they land). The shapes' outlines are read once from a raster, so the weather lands on the real ink. Every animal card has the same Weather control.",
    controls: [
      { type: 'season', options: ['spring', 'summer', 'fall', 'winter'], default: 'fall' },
      { type: 'weather', default: 2 },
    ],
  },
  {
    id: 'water-shimmer',
    name: 'Water shimmer',
    category: 'Land & Water',
    status: 'live',
    tags: ['water', 'lake', 'shimmer', 'wind', 'rain', 'snow', 'ripple'],
    zones: ['water'],
    kind: 'water',
    note: 'Ported from a working interactive prototype (built through several rounds of feedback before this ever touched the catalog) rather than designed fresh here. Deliberately an OVERLAY, not a replacement for painted lake art: V1\u2019s own precedent for this exact system is one motion source (the GPU wobble) plus the artist\u2019s own highlights -- more effects piled on reads as junk, per the lessons-learned doc. Wind drives an feTurbulence/feDisplacementMap filter on painted highlight streaks, with both the displacement scale AND the frequency swing widening at each of the 4 levels (an earlier pass only scaled displacement, which left None/Light barely visible). Rain and snow spawn actual falling drops above the waterline, each one triggering its own ripple exactly where it lands -- not independently randomized -- so falling precipitation and the water reacting to it read as one connected system. Ripples are ovals, not circles (matching drops landing at a shallow angle rather than straight overhead), heavy on impact and thinning as they expand outward. Snow\u2019s ripples are pure white with a slower, gentler fade than rain\u2019s, which is a steadier linear-ish fade. Not yet placed against real lake art or tested at actual V2 scene scale -- built and verified as a standalone overlay only; sizing/timing may need retuning once it sits over a real background instead of a flat color.',
    controls: [
      { type: 'wind' },
      { type: 'precip', options: ['none', 'rain', 'snow'], default: 'none' },
    ],
  },
  {
    id: 'distant-treeline',
    name: 'Distant treeline',
    category: 'Land & Water',
    status: 'live',
    tags: ['trees', 'treeline', 'forest', 'silhouette', 'terrain', 'depth', 'season'],
    zones: ['foothill'],
    kind: 'svg',
    note: 'A depth layer that was entirely missing from the catalog until it showed up as a gap comparing against a reference scene -- the dark, dense forest band sitting at the base of the mountains, before the lake starts. No new source art: individual tree detail (needles, branch structure) would never actually be visible at this distance, so the shape is deliberately simple procedural triangles, dense and jittered rather than hand-placed, in two overlapping rows (a darker front row, a lighter back row peeking over it) so it reads as a mass of trees rather than one flat cutout. Static, not wind-reactive -- a real treeline at this scale and distance doesn\u2019t show individual tree sway, only a whole hillside moving together would, and that\u2019s not attempted here. Season is a light whole-band filter tint, more restrained than close-up foliage gets, since distance flattens color without erasing it entirely (a real distant fall forest still reads with a coppery cast, just muted). UPDATE: confirmed live in the V2 scene -- wired into buildMidground() at world y:1450, height 150, right after lakeAsset in DOM order, as the scene\u2019s one dark middle-distance layer (see the standing rule on the left/right shore entries below for why the middle layer stays dark rather than a second light hill).',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'summer' },
    ],
    build() {
      return window.SceneComponents.buildDistantTreeline(300, 230, { baseY: 228, bandH: 30 });
    },
    onSeasonChange(obj, season) {
      if (obj && typeof obj.setSeason === 'function') obj.setSeason(season);
    },
  },
  {
    id: 'left-shore',
    name: 'Left shore (bank)',
    category: 'Land & Water',
    status: 'live',
    tags: ['shore', 'bank', 'lagoon', 'terrain', 'grass'],
    zones: ['water', 'grass'],
    kind: 'shore',
    src: 'assets/left-shore.svg',
    viewBox: '-100 400 3300 800',
    note: 'One of the two near-camera lagoon banks added during the Sept 17-18 lagoon rework, replacing an earlier single full-width foreground hill. Was entirely missing from this catalog -- added now along with right-shore (below), neither of which had a card yet despite being load-bearing pieces of the live V2 scene. Cropped from its own standalone asset (not sliced from the shared lakeAsset/landscape art) via buildCroppedSvgAsset with preserveAspectRatio:\u2019none\u2019, matching exactly how scene.js\u2019s placeShore() places it in the live scene at world x:-200, y:1450, width:2000. Static -- no season recolor of its own in the live scene (the pines/boulders grounded on top of it carry the seasonal change instead). Standing rule from that rework, worth keeping here: only ONE light-green hill layer belongs in the composition (the foreground band) -- these two banks and the foreground band read as one continuous lagoon shore, while the treeline/foothills stay dark as the middle-distance layer.',
    controls: [],
  },
  {
    id: 'right-shore',
    name: 'Right shore (bank)',
    category: 'Land & Water',
    status: 'live',
    tags: ['shore', 'bank', 'lagoon', 'terrain', 'grass'],
    zones: ['water', 'grass'],
    kind: 'shore',
    src: 'assets/right-shore.svg',
    viewBox: '3450 0 5550 1298',
    note: 'The right-side counterpart to left-shore (see that entry for the shared method and the standing "one light hill layer" rule). Taller and starts higher than the left bank, matching the real asset\u2019s own proportions -- placed in the live scene at world x:2700, y:1250, width:2600, deliberately extending past the world\u2019s right edge (x:5300 vs. viewBox width 5003.89) so its outer edge runs off-canvas rather than showing a hard cutoff.',
    controls: [],
  },

  // ── FOREGROUND PLANTS ─────────────────────────────────────────────
  {
    id: 'fg-plant-fern',
    name: 'Foreground fern',
    category: 'Plants',
    status: 'live',
    tags: ['fern', 'foliage', 'foreground', 'wind', 'season'],
    zones: ['grass', 'shoreline'],
    kind: 'plant',
    src: 'assets/fg-plant-fern.svg',
    note: 'One of 26 plants across two sprite sheets (14 in sprite-1, 12 in sprite-2) -- Christian\u2019s direct answer to the foreground-plant-variety gap flagged when the catalog was compared against a reference scene. Neither sheet groups its paths at all, and bounding boxes vary too much in size for a fixed grid split (a fern\u2019s fronds spread far wider than a small vine\u2019s leaves) -- so plants were separated by clustering path bounding boxes by PROXIMITY (union-find on box-to-box distance) instead, which correctly found all 14 and all 12 plants once tuned. Getting a correct bounding box in the first place needed a real path parser (svgpathtools): both sheets use H/V/S/T/A commands with non-alternating parameter counts, which silently corrupted every bounding box computed by naively reading numbers in x,y pairs -- caught because the resulting clusters merged into one giant blob, not because it looked subtly wrong. Only 5 of the 26 plants are in the catalog so far, picked for variety (this fern, a flowering stem, two spiky/succulent forms, a rounded shrub) -- the other 21 use the identical technique. Sways as one unit from its base -- reuses the same grass-clump-sway mechanism the boulder grass uses, since it\u2019s the same physical motion (a small foliage mass rooted at one point).',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'summer' },
      { type: 'wind' },
    ],
  },
  {
    id: 'fg-plant-yellow-flower-stem',
    name: 'Foreground flowering stem',
    category: 'Plants',
    status: 'live',
    tags: ['flower', 'foliage', 'foreground', 'wind', 'season'],
    zones: ['grass', 'shoreline'],
    kind: 'plant',
    src: 'assets/fg-plant-yellow-flower-stem.svg',
    note: 'Same source sheets and extraction technique as fg-plant-fern -- see that entry for the full method. Directly answers the "budding flowers" half of the foreground-variety gap. Note the season filter recolors the whole plant as one unit (stem, leaves, AND the yellow blossoms together) -- unlike the standalone Flower entry, which recolors petals separately from the stem via setColor(). A future pass could split the blossom paths out for independent color control the same way, not attempted here.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'summer' },
      { type: 'wind' },
    ],
  },
  {
    id: 'fg-plant-agave',
    name: 'Foreground agave',
    category: 'Plants',
    status: 'live',
    tags: ['agave', 'succulent', 'foliage', 'foreground', 'wind', 'season'],
    zones: ['grass', 'shoreline'],
    kind: 'plant',
    src: 'assets/fg-plant-agave.svg',
    note: 'Same source sheets and extraction technique as fg-plant-fern -- see that entry for the full method. Directly answers the "agave/yucca-type spiky plants" half of the foreground-variety gap -- this was the single most specifically-named missing element from the original reference comparison.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'summer' },
      { type: 'wind' },
    ],
  },
  {
    id: 'fg-plant-spiky-yucca',
    name: 'Foreground spiky yucca',
    category: 'Plants',
    status: 'live',
    tags: ['yucca', 'succulent', 'foliage', 'foreground', 'wind', 'season'],
    zones: ['grass', 'shoreline'],
    kind: 'plant',
    src: 'assets/fg-plant-spiky-yucca.svg',
    note: 'Same source sheets and extraction technique as fg-plant-fern -- see that entry for the full method. A second, taller/narrower spiky succulent form alongside fg-plant-agave, for variety rather than repeating the same silhouette twice.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'summer' },
      { type: 'wind' },
    ],
  },
  {
    id: 'fg-plant-rounded-bush',
    name: 'Foreground rounded bush',
    category: 'Plants',
    status: 'live',
    tags: ['bush', 'shrub', 'foliage', 'foreground', 'wind', 'season'],
    zones: ['grass', 'shoreline'],
    kind: 'plant',
    src: 'assets/fg-plant-rounded-bush.svg',
    note: 'Same source sheets and extraction technique as fg-plant-fern -- see that entry for the full method. A compact rounded shrub form -- useful as a lower, denser foreground shape alongside the taller ferns and spiky succulents already in this set.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'summer' },
      { type: 'wind' },
    ],
  },
  {
    id: 'foothills-range-long',
    name: 'Foothills range (long, cropped)',
    category: 'Mountains',
    status: 'live',
    tags: ['foothills', 'hills', 'mountain', 'terrain', 'depth', 'season', 'croppable'],
    zones: ['foothill'],
    kind: 'foothills',
    src: 'assets/Mountain_Range_Long.svg',
    cropOpts: { cropWidth: 2999.72 },
    note: 'Real 4-layer depth-graded rolling-hills illustration (farthest/lightest teal ridge through to a nearest/darkest layer with its own real traced treeline silhouette), deliberately built ~3x wider than any single scene needs (native 11998.88 x 891.49) specifically so a scene crops whatever width window it needs rather than stretching a normal-width image and distorting it -- this card shows a representative quarter-width slice via viewBox + preserveAspectRatio slice, not the whole elongated strip squashed in. Season is one whole-image filter using the exact same restrained values as distant-treeline (distance flattens color without erasing it, so this gets the same light tint distant elements get, not close-up foliage treatment). Worth flagging directly rather than deciding here: this asset\u2019s nearest layer already has a real traced treeline silhouette baked into it, doing conceptually the same job as the separately-built distant-treeline catalog object (small procedural triangles). These likely shouldn\u2019t both end up in the same scene -- whether this replaces that one, or they serve different specific spots, is an open question, not resolved by adding this.',
    controls: [
      { type: 'season', options: ['winter', 'spring', 'summer', 'fall'], default: 'summer' },
    ],
  },
  // ── CHARACTERS ─────────────────────────────────────────────────────
  {
    id: 'narrator-robot',
    name: 'GlazyArray, the narrator',
    category: 'Characters',
    status: 'live',
    tags: ['glazyarray', 'narrator', 'robot', 'automaton', 'character', 'her', 'listen', 'audio', 'episode', 'talking', 'brass', 'hands', 'look', 'hair'],
    zones: [],
    kind: 'composite',
    note: 'GlazyArray tells the episodes, in every Listen bar on the Note pages and in Notes opened on the homepage. Her torso and hands are one video (narrator.mp4, 976 x 300, 32 parts of 8 s; see her gestures card), keyed live over the bar\u2019s backdrop (a library for case studies, a bike shop for rides, and so on). She only ever jumps within that one file, so a move never blanks the frame; every part starts and ends on the same rest pose, and a gesture can play part way and come back through its backwards copy. Her head is cut-out layers over it: the head (her look), her calm eyes (they glance about, and look toward Play in the hints), her chin plate and side plates (they open with the loudness of the voice, measured live with Web Audio), and the eyelids (blinks, and a wink at the Play button). Her look comes from the Note, its category, or the coming holiday (see her looks card). Files: /assets/narrator/, /js/narrator.js, /css/narrator.css.',
    controls: [],
    build() {
      const box = document.createElement('div');
      box.className = 'cat-narrator-card';
      box.innerHTML = '<section class="listen"><div><span class="listen-label">Listen</span><b>The whole machine</b></div>' +
        '<audio controls preload="none" src="/play/media/2026-10-06-the-whole-machine/episode.mp3"></audio></section>';
      return box;
    },
  },

  {
    id: 'narrator-gestures',
    name: 'GlazyArray: every gesture',
    category: 'Characters',
    status: 'live',
    tags: ['glazyarray', 'narrator', 'gesture', 'hands', 'talking', 'video', 'loop', 'character', 'brass', 'robot'],
    zones: [],
    kind: 'composite',
    note: 'Every move her hands make, live from the one narrator video (narrator.mp4: 34 parts of 193 frames, each starting and ending in the same rest pose; every gesture has a backwards copy right after it). Pick one and it loops: the thirteen she makes while she talks (six conversational ones, which come round twice as often, plus the storyteller, a hand dance, the brass ball, both hands talking, the teal ball, the glowing orb and buffing up a fresh new look), the fingers tapping while she waits, and the three hints to press play. Her head, calm eyes and chin plate sit over it as on the site. Files: /assets/narrator/narrator.mp4, the gesture list in /js/narrator.js.',
    controls: [],
    build() { return GA.card('gestures'); },
  },
  {
    id: 'narrator-looks',
    name: 'GlazyArray: every look',
    category: 'Characters',
    status: 'live',
    tags: ['glazyarray', 'narrator', 'look', 'hair', 'hat', 'cap', 'helmet', 'holiday', 'style array', 'character'],
    zones: [],
    kind: 'composite',
    note: 'Her Style Array, read live from /assets/narrator/looks.json: her own curls, the hair styles that rotate, the holiday looks (each worn for its own dates), and the looks made for content, a Note or a whole category (the grad cap for case studies, the bike helmet for rides, the trail cap for hikes, workshop goggles for the automaton and the Mini-Cast, beach shades). Step through them with the arrows or the list, or click her head as on the site; each shows when she wears it. A look is only her head layer: her face, eyes, chin plate and neck are the same in every one, so she talks and blinks whatever she wears. New looks are made in the Workshop or the Studio.',
    controls: [],
    build() { return GA.card('looks'); },
  },
  {
    id: 'narrator-flair',
    name: 'GlazyArray: her flair',
    category: 'Characters',
    status: 'live',
    tags: ['glazyarray', 'narrator', 'flair', 'palette', 'colour', 'color', 'tint', 'hue', 'cap', 'look', 'character'],
    zones: [],
    kind: 'composite',
    note: 'Each Note dresses her in its own two colours, picked from its hero photo (its palette). The coloured parts of her cap, the flair, take them as a 45% tint over the original (a "color" blend, so the brass, folds and shading show through), and the Listen bar\'s glass player and backdrop shade take them too. Pick the cap from the list (every look with flair, caps first; masks in /assets/narrator/looks/<look>.flair-a.png and -b.png, one per colour) and the colours from sample combos (most from real Notes), or set your own two with the pickers. As on the site, a click on her head changes her cap (on every GlazyArray card). Files: narrator.css (.nb-flair), narrator.js flair(), looks.json "flair".',
    controls: [],
    build() { return GA.card('flair'); },
  },

  // ── LOGOS ──────────────────────────────────────────────────────────
  {
    id: 'logo-deep-sea',
    name: 'Logo: Parts Catalog (the diver)',
    category: 'Logos',
    status: 'live',
    tags: ['logo', 'badge', 'catalog', 'person', 'diver', 'christian', 'helmet', 'ocean', 'underwater', 'bubbles', 'glow'],
    zones: [],
    kind: 'composite',
    note: 'The Parts Catalog logo: Christian in the deep-sea diving helmet. One portrait (assets/logo/diver.webp, -2x) under an SVG of light: the two shoulder lamps pulse out of step, a violet glow breathes below the visor, bubbles rise past the helmet, and the portrait drifts very slightly. Ring in the catalog colours. css/logo.css (.logo-diver).',
    controls: [],
    build() {
      const tpl = document.getElementById('logoDeep');
      const src = tpl && tpl.content.querySelector('.logo-diver');
      const box = document.createElement('div');
      box.className = 'cat-logo-card';
      if (!src) return box;
      const logo = src.cloneNode(true);
      logo.classList.remove('cat-logo');
      logo.querySelectorAll('img[sizes]').forEach((i) => i.setAttribute('sizes', '190px'));
      box.appendChild(logo);
      return box;
    },
  },
  {
    id: 'logo-canyon-portrait',
    name: 'Logo: Marley and Christian at the canyon edge',
    category: 'Logos',
    status: 'live',
    tags: ['logo', 'badge', 'portrait', 'person', 'christian', 'dog', 'marley', 'animal', 'canyon', 'season', 'night'],
    zones: [],
    kind: 'composite',
    note: 'The site logo, used at 120px in the homepage and Workshop headers and larger on About. Five low-poly layers (canyon, dog body, Christian, calm-eye lids, dog head) in a ring: one slow 6 s loop where he slips down and his eyes go wide, she eases him back up and he relaxes. Seasonal overlays and ring colours follow the page (html[data-season], html.night-page); here the card sets data-season / data-night on the logo itself. The card clones a template of the header logo kept in index.html. Files: assets/logo/*.webp (+ -2x), css/logo.css.',
    controls: [
      { type: 'season', options: ['spring', 'summer', 'fall', 'winter'], default: 'summer' },
      { type: 'time', default: 'day' },
    ],
    build(state) {
      const tpl = document.getElementById('logoCanyon');
      const src = tpl && tpl.content.querySelector('.logo');
      const box = document.createElement('div');
      box.className = 'cat-logo-card';
      if (!src) return box;
      const logo = src.cloneNode(true);
      logo.classList.remove('cat-logo');
      logo.dataset.season = state.season;
      logo.dataset.night = state.night ? '1' : '0';
      logo.querySelectorAll('img[sizes]').forEach((i) => i.setAttribute('sizes', '190px'));
      box.appendChild(logo);
      return box;
    },
    onSeasonChange(box, season) { const l = box.querySelector('.logo'); if (l) l.dataset.season = season; },
    onTimeChange(box, night) { const l = box.querySelector('.logo'); if (l) l.dataset.night = night ? '1' : '0'; },
  },
];
