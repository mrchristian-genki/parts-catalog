// WORKSHOP -- step 1 builds an image-generation prompt for a new part: a character in the cast's
// papercraft style, or a landscape piece (trees, shores, streams, hills…) in either that style or
// the lake scenery's flat vector style; step 2 traces the generated image back into flat colour paths, in the browser, the way
// puppet-refs/doe-pilot/trace.py does it, and exports an origami-art.js entry
// ({ vb, fills, body, parts }) plus a *-traced.svg like the ones in puppet-refs/cast/.
// Step 3 (cutting into rigged pieces, parts.json-style hulls, pivots and caps) comes next.
(function () {
  const $ = (id) => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const ART = window.ORIGAMI_ART || {};
  const slug = (s) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // ── 1. PROMPT ─────────────────────────────────────────────────────────
  // frame: how the piece sits in the image. 'figure' = centred, whole, with a margin; 'strip' = a
  // wide horizontal band, flat along the bottom, clean cut-offs left and right (ground pieces).
  const KINDS = {
    animal: { poses: ['standing still', 'walking mid-stride', 'grazing with its head down', 'sitting', 'running'], frame: 'figure',
      shape: 'all four legs visible and clearly separated with gaps between them, the far legs a shade darker than the near legs; head, ears and tail clearly distinct from the body',
      parts: 'body, near front leg, far front leg, near hind leg, far hind leg, neck and head, ears, tail' },
    bird: { poses: ['perched', 'standing', 'flying with wings spread', 'gliding'], frame: 'figure',
      shape: 'wings clearly outlined against the body, head and tail distinct', parts: 'body, head, near wing, far wing, tail' },
    person: { poses: ['standing', 'walking', 'sitting', 'holding something in front'], frame: 'figure',
      shape: 'arms separated from the body, head distinct, a simple calm face', parts: 'body, head, arm (or both arms)' },
    tree: { poses: ['a pine / conifer', 'a leafy broadleaf tree', 'a birch or aspen', 'a palm', 'a bare winter tree', 'a small sapling'], frame: 'figure', noun: true,
      shape: 'one standalone tree from the base of the trunk to the top, trunk visible, no ground, no roots showing',
      parts: 'crown that sways in the wind from a pivot on the trunk, trunk' },
    plant: { poses: ['a leafy bush', 'a clump of grass', 'reeds / cattails', 'wildflowers', 'a fern', 'a succulent / agave'], frame: 'figure', noun: true,
      shape: 'one standalone clump, cut off flat where it meets the ground, no soil', parts: 'one piece that sways from its base (or a few stems)' },
    rock: { poses: ['a single boulder', 'a cluster of boulders', 'a flat stepping stone', 'a boulder with grass tufts'], frame: 'figure', noun: true,
      shape: 'resting on a flat base, fully visible', parts: 'one still piece (grass tufts can sway)' },
    island: { poses: ['a small tree-covered island', 'a rocky islet', 'a sandy island with a palm'], frame: 'figure', noun: true,
      shape: 'seen from the side at water level, cut off flat along the waterline, no water drawn', parts: 'island, with its trees as separate swaying pieces' },
    shore: { poses: ['a sandy beach', 'a grassy lake bank', 'a pebble shore', 'a muddy riverbank with reeds'], frame: 'strip', noun: true,
      shape: 'seen from the side, the top edge is the land\'s silhouette and the bottom edge is the flat waterline', parts: 'one ground piece' },
    stream: { poses: ['a winding stream seen from a low angle', 'a small waterfall over rocks', 'a river bend', 'a creek with stones'], frame: 'strip', noun: true,
      shape: 'the water in a few flat blue tones with simple highlight shapes, its banks included', parts: 'banks, with the water as a separate layer that can shimmer' },
    hills: { poses: ['rolling green hills', 'a meadow band', 'dunes', 'a forested ridge', 'snowy slopes'], frame: 'strip', noun: true,
      shape: 'a layered band seen from the side, nearer layers darker', parts: 'one ground band per layer (for parallax)' },
    mountain: { poses: ['a single peak', 'a range of peaks', 'a snow-capped peak', 'a desert butte'], frame: 'strip', noun: true,
      shape: 'a silhouette with a few flat shading facets, flat along the bottom', parts: 'one distant layer' },
    sky: { poses: ['a fluffy cumulus cloud', 'a long thin cloud', 'a cloud bank', 'a sun', 'a crescent moon'], frame: 'figure', noun: true,
      shape: 'one standalone piece, soft flat shading in two or three tones', parts: 'one piece that drifts' },
    prop: { poses: ['upright'], frame: 'figure', shape: 'one standalone object, fully visible', parts: 'one piece (or a few, if it has moving bits)' },
  };
  // [lead, look]: "<lead> of a <subject>. <look>"
  const STYLES = {
    origami: ['Flat low-poly origami papercraft illustration', 'Folded-paper look: crisp angular facets, every facet one flat colour, no gradients, no texture, no outlines.'],
    vector: ['Flat vector illustration', 'Clean, friendly storybook style: smooth simple shapes, each area one flat colour with at most two flat shading tones, no gradients, no texture, no outlines.'],
  };
  const castIds = Object.keys(ART).sort();

  function fillSelect(sel, first) {
    castIds.forEach((id) => { const o = document.createElement('option'); o.value = id; o.textContent = first ? `the ${id}` : id; sel.appendChild(o); });
  }
  fillSelect($('pPalette'), true);
  fillSelect($('tPalette'), true);
  fillSelect($('vCompare'), false);
  $('vCompare').value = ART.doe ? 'doe' : castIds[0];

  function swatches(el, colors) {
    el.textContent = '';
    (colors || []).forEach((c) => { const s = document.createElement('span'); s.style.background = c; s.title = c; el.appendChild(s); });
  }
  function setPoses() {
    const k = KINDS[$('pKind').value], sel = $('pPose'), prev = sel.value;
    sel.textContent = '';
    k.poses.forEach((p) => { const o = document.createElement('option'); o.value = o.textContent = p; sel.appendChild(o); });
    if (k.poses.includes(prev)) sel.value = prev;
  }
  function buildPrompt() {
    const kind = $('pKind').value, k = KINDS[kind];
    const subject = $('pSubject').value.trim();
    const pose = $('pPose').value;
    const pal = $('pPalette').value;
    const extra = $('pExtra').value.trim();
    // Characters: "<subject>, <pose>". Landscape: the pose list names the thing ("a sandy
    // beach"); a typed subject refines it ("tropical beach").
    const what = k.noun ? pose.replace(/^an? /, '') + (subject ? ` (${subject})` : '') : `${subject || 'fox'}, ${pose}`;
    const colours = pal && ART[pal]
      ? `Use a palette of 6 to 8 flat colours close to these: ${ART[pal].fills.join(', ')}.`
      : 'Use a limited palette of 6 to 8 flat, natural colours.';
    const view = k.frame === 'strip'
      ? `Composition: one wide horizontal strip across the full width of the image, ${k.shape}; the bottom edge is a straight horizontal line, and the left and right ends are cut off cleanly so it can sit on a scene's ground line or repeat side by side. Wide landscape image, 2048 x 1024.`
      : `Composition: ${kind === 'animal' || kind === 'bird' || kind === 'person' ? `in full side profile facing ${$('pFacing').value}, ` : ''}the whole piece in frame with a margin, ${k.shape}. Square image, 2048 x 2048.`;
    const text = [
      `${STYLES[$('pStyle').value][0]} of ${/^[aeiou]/i.test(what) ? 'an' : 'a'} ${what}.`,
      STYLES[$('pStyle').value][1],
      view,
      colours,
      extra ? `Details: ${extra}.` : '',
      'Plain pure white background (#FFFFFF). No shadow, no text, no border, no other objects' + (k.frame === 'strip' ? ', no sky.' : ', no ground.'),
    ].filter(Boolean).join(' ');
    $('pOut').value = text;
    swatches($('pSwatches'), pal && ART[pal] ? ART[pal].fills : []);
    $('pParts').textContent = `Pieces: ${k.parts}. The clearer the gaps between those pieces in the image, the cleaner the cut.`;
    $('pFacing').closest('label').hidden = !(kind === 'animal' || kind === 'bird' || kind === 'person');
    const id = slug(k.noun ? [subject, pose.replace(/^an? /, '').split(/[ /]/).pop()].filter(Boolean).join(' ') : subject || 'fox');
    $('pFile').textContent = `Save the result as ${id}-${k.noun ? 'art' : 'origami'}.png.`;
    if (!$('tId').dataset.touched) $('tId').value = id;
  }
  ['pSubject', 'pKind', 'pStyle', 'pPose', 'pFacing', 'pPalette', 'pExtra'].forEach((id) =>
    $(id).addEventListener(id === 'pKind' ? 'change' : 'input', () => { if (id === 'pKind') setPoses(); buildPrompt(); }));
  ['pStyle', 'pPose', 'pFacing', 'pPalette'].forEach((id) => $(id).addEventListener('change', buildPrompt));
  $('pCopy').addEventListener('click', () => copy($('pOut').value, $('pCopy'), 'Copy prompt'));
  setPoses(); buildPrompt();

  async function copy(text, btn, label) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
    btn.textContent = 'Copied'; btn.classList.add('is-done');
    setTimeout(() => { btn.textContent = label; btn.classList.remove('is-done'); }, 1400);
  }

  // ── 2. TRACE ──────────────────────────────────────────────────────────
  // Port of trace.py. Work happens at up to 1024 px on the long side (fast on a phone); every
  // coordinate is scaled back to the source image's pixels, so the output lines up with the
  // 2048 x 2048 cast art like the existing entries.
  const MAX_SIDE = 1024;
  let src = null;        // { img, W, H, s, w, h, data } of the loaded image
  let result = null;     // { entry, svg } of the last trace

  const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

  function loadFile(file) {
    if (!file || !/^image\//.test(file.type)) { status('That is not an image.', true); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const W = img.naturalWidth, H = img.naturalHeight, s = Math.min(1, MAX_SIDE / Math.max(W, H));
      const w = Math.round(W * s), h = Math.round(H * s);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const cx = cv.getContext('2d', { willReadFrequently: true });
      cx.drawImage(img, 0, 0, w, h);
      src = { img, W, H, s, w, h, data: cx.getImageData(0, 0, w, h).data };
      $('vOrig').textContent = ''; $('vOrig').appendChild(img);
      $('tDropText').innerHTML = `<b>${file.name}</b> · ${W} × ${H} · choose another`;
      const guess = slug(file.name.replace(/\.[a-z]+$/i, '').replace(/-origami$/, ''));
      if (guess && !$('tId').dataset.touched) $('tId').value = guess;
      runTrace();
    };
    img.onerror = () => status('Could not read that image.', true);
    img.src = url;
  }
  $('tFile').addEventListener('change', (e) => loadFile(e.target.files[0]));
  const drop = $('tDrop');
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, () => drop.classList.remove('is-over')));
  drop.addEventListener('drop', (e) => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); });
  $('tId').addEventListener('input', () => { $('tId').dataset.touched = '1'; if (result) runTrace(); });
  let rt = 0;
  const later = () => { clearTimeout(rt); rt = setTimeout(runTrace, 120); };
  $('tK').addEventListener('input', () => { $('tKOut').textContent = $('tK').value; later(); });
  $('tEps').addEventListener('input', () => { $('tEpsOut').textContent = (+$('tEps').value).toFixed(1); later(); });
  $('tPalette').addEventListener('change', () => { $('tK').disabled = !!$('tPalette').value; later(); });
  $('vCompare').addEventListener('change', () => result && renderCompare());

  function status(msg, err) { const el = $('tStatus'); el.textContent = msg; el.classList.toggle('is-error', !!err); }

  function runTrace() {
    if (!src) return;
    status('Tracing…');
    setTimeout(() => {
      try {
        const t0 = performance.now();
        result = trace(src, {
          k: +$('tK').value, eps: +$('tEps').value,
          palette: $('tPalette').value && ART[$('tPalette').value] ? ART[$('tPalette').value].fills : null,
          id: slug($('tId').value) || 'part',
        });
        swatches($('tSwatches'), result.entry.fills);
        $('vTrace').innerHTML = result.svg;
        renderCompare();
        ['tSvg', 'tJson', 'tCopy'].forEach((id) => { $(id).disabled = false; });
        const kb = (result.svg.length / 1024).toFixed(0);
        status(`${result.entry.fills.length} colours · ${result.entry.body.length} paths · ${kb} KB · ${Math.round(performance.now() - t0)} ms`);
      } catch (e) { console.error(e); status('Tracing failed: ' + e.message, true); }
    }, 20);
  }

  function trace(S, opt) {
    const { w, h, data, s } = S, N = w * h;
    // Silhouette, first pass: opaque and not near-white (cream is close to white, hence the
    // small threshold, as in trace.py).
    const dW = new Float32Array(N), pre = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
      dW[i] = Math.hypot(255 - r, 255 - g, 255 - b);
      pre[i] = a >= 128 && dW[i] > 18 ? 1 : 0;
    }
    const pal = (opt.palette || kmeans(data, pre, opt.k)).map(rgbOf);
    // Nearest palette colour; silhouette = pre-pass AND closer to a palette colour than to white.
    const lab = new Int8Array(N).fill(-1);
    let sil = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      if (!pre[i]) continue;
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
      let best = 0, bd = 1e9;
      for (let c = 0; c < pal.length; c++) {
        const d = (r - pal[c][0]) ** 2 + (g - pal[c][1]) ** 2 + (b - pal[c][2]) ** 2;
        if (d < bd) { bd = d; best = c; }
      }
      if (Math.sqrt(bd) < dW[i]) { sil[i] = 1; lab[i] = best; }
    }
    sil = close(open(sil, w, h, 1), w, h, 2);              // 3x3 open, 5x5 close
    // Majority clean-up: the most common label within 7x7 (trace.py uses a 7 px median).
    const lab2 = modeFilter(lab, sil, w, h, 3, pal.length);
    const counts = new Array(pal.length).fill(0);
    for (let i = 0; i < N; i++) if (lab2[i] >= 0) counts[lab2[i]]++;
    const order = counts.map((n, i) => [n, i]).filter(([n]) => n > 0).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
    if (!order.length) throw new Error('no figure found: the background must be white or transparent');
    // Paths: the whole silhouette in the most common colour, then each other colour on top.
    const inv = 1 / s, eps = opt.eps * s;
    const fills = order.map((i) => hex(...pal[i]));
    const body = [];
    const base = outline(sil, w, h, Math.max(0.6, eps * 0.75), 200 * s * s, inv);
    if (base) body.push([0, base]);
    order.slice(1).forEach((ci, n) => {
      const m = new Uint8Array(N);
      for (let i = 0; i < N; i++) m[i] = lab2[i] === ci ? 1 : 0;
      const d = outline(open(m, w, h, 1), w, h, eps, 60 * s * s, inv);
      if (d) body.push([n + 1, d]);
    });
    // View box: the silhouette's bounds plus a small margin, in source pixels.
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (sil[y * w + x]) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    const pad = Math.round(0.02 * Math.max(x1 - x0, y1 - y0));
    const vb = [Math.max(0, Math.round(x0 * inv) - pad), Math.max(0, Math.round(y0 * inv) - pad),
      Math.round((x1 - x0 + 1) * inv) + 2 * pad, Math.round((y1 - y0 + 1) * inv) + 2 * pad];
    const entry = { vb, fills, body, parts: [] };
    const svg = `<svg xmlns="${NS}" viewBox="${vb.join(' ')}">` +
      body.map(([f, d], i) => `<path id="${i ? 't' + i : 'base'}" fill="${fills[f]}" fill-rule="evenodd" d="${d}"/>`).join('') + '</svg>';
    return { entry, svg, id: opt.id, W: S.W, H: S.H };
  }

  // k-means++ over up to 30k silhouette pixels, seeded so the same image gives the same palette.
  function kmeans(data, mask, k) {
    let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const idx = []; for (let i = 0; i < mask.length; i++) if (mask[i]) idx.push(i);
    if (!idx.length) throw new Error('no figure found: the background must be white or transparent');
    const step = Math.max(1, Math.floor(idx.length / 30000));
    const P = []; for (let j = 0; j < idx.length; j += step) { const i = idx[j] * 4; P.push([data[i], data[i + 1], data[i + 2]]); }
    const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    const C = [P[Math.floor(rnd() * P.length)].slice()];
    const D = P.map((p) => d2(p, C[0]));
    while (C.length < Math.min(k, P.length)) {
      let sum = 0; D.forEach((v) => { sum += v; });
      let r = rnd() * sum, j = 0; while (j < P.length - 1 && (r -= D[j]) > 0) j++;
      C.push(P[j].slice()); P.forEach((p, n) => { D[n] = Math.min(D[n], d2(p, C[C.length - 1])); });
    }
    const A = new Uint8Array(P.length);
    for (let it = 0; it < 14; it++) {
      P.forEach((p, n) => { let b = 0, bd = 1e12; C.forEach((c, ci) => { const d = d2(p, c); if (d < bd) { bd = d; b = ci; } }); A[n] = b; });
      const acc = C.map(() => [0, 0, 0, 0]);
      P.forEach((p, n) => { const a = acc[A[n]]; a[0] += p[0]; a[1] += p[1]; a[2] += p[2]; a[3]++; });
      acc.forEach((a, ci) => { if (a[3]) C[ci] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]; });
    }
    return C.map((c) => hex(...c));
  }

  // Binary morphology with a (2r+1)^2 box, separable.
  function erodeDilate(m, w, h, r, dilate) {
    const t = new Uint8Array(m.length), o = new Uint8Array(m.length);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let v = dilate ? 0 : 1;
      for (let dx = -r; dx <= r; dx++) { const xx = x + dx; const p = xx < 0 || xx >= w ? 0 : m[y * w + xx]; if (dilate ? p : !p) { v = dilate ? 1 : 0; break; } }
      t[y * w + x] = v;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let v = dilate ? 0 : 1;
      for (let dy = -r; dy <= r; dy++) { const yy = y + dy; const p = yy < 0 || yy >= h ? 0 : t[yy * w + x]; if (dilate ? p : !p) { v = dilate ? 1 : 0; break; } }
      o[y * w + x] = v;
    }
    return o;
  }
  const open = (m, w, h, r) => erodeDilate(erodeDilate(m, w, h, r, false), w, h, r, true);
  const close = (m, w, h, r) => erodeDilate(erodeDilate(m, w, h, r, true), w, h, r, false);

  function modeFilter(lab, sil, w, h, r, k) {
    const out = new Int8Array(lab.length).fill(-1), cnt = new Int32Array(k);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (!sil[i]) continue;
      cnt.fill(0);
      for (let dy = -r; dy <= r; dy++) { const yy = y + dy; if (yy < 0 || yy >= h) continue;
        for (let dx = -r; dx <= r; dx++) { const xx = x + dx; if (xx < 0 || xx >= w) continue; const l = lab[yy * w + xx]; if (l >= 0) cnt[l]++; } }
      let b = lab[i] >= 0 ? lab[i] : 0; for (let c = 0; c < k; c++) if (cnt[c] > cnt[b]) b = c;
      out[i] = b;
    }
    return out;
  }

  // Outline a binary mask: walk the pixel-edge boundary into closed loops (outer edges and holes
  // alike; paths use evenodd), drop tiny loops, simplify with Douglas-Peucker, and write
  // "Mx,y x,y …Z" subpaths in source pixels, the format trace.py writes.
  function outline(m, w, h, eps, minArea, inv) {
    const W1 = w + 1;
    const out = new Map();                               // vertex -> [edge dirs]
    const add = (vx, vy, dir) => { const k = vy * W1 + vx; const a = out.get(k); if (a) a.push(dir); else out.set(k, [dir]); };
    const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];         // +x, +y, -x, -y (clockwise on screen)
    const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      if (!inside(x, y - 1)) add(x, y, 0);
      if (!inside(x + 1, y)) add(x + 1, y, 1);
      if (!inside(x, y + 1)) add(x + 1, y + 1, 2);
      if (!inside(x - 1, y)) add(x, y + 1, 3);
    }
    let d = '';
    for (const [start, dirs0] of out) {
      while (dirs0.length) {
        let vx = start % W1, vy = (start / W1) | 0, dir = dirs0.pop();
        const pts = [[vx, vy]];
        for (let guard = 0; guard < 4 * w * h; guard++) {
          vx += DX[dir]; vy += DY[dir];
          const k = vy * W1 + vx;
          if (k === start) break;                          // closed (any edges left here start new loops)
          const a = out.get(k);
          if (!a || !a.length) break;
          // At a pinch point (two ways out) keep turning right, so touching diagonals split.
          let pick = a.indexOf((dir + 1) % 4); if (pick < 0) pick = a.indexOf(dir); if (pick < 0) pick = 0;
          const nd = a.splice(pick, 1)[0];
          if (nd !== dir) pts.push([vx, vy]);
          dir = nd;
        }
        if (pts.length < 3) continue;
        let area = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; area += p[0] * q[1] - q[0] * p[1]; }
        if (Math.abs(area / 2) < minArea) continue;
        // Closed loop: Douglas-Peucker needs two distinct ends, so split at the point farthest
        // from the start and simplify each half.
        let f = 0, fd = -1;
        pts.forEach(([x, y], i) => { const dd = (x - pts[0][0]) ** 2 + (y - pts[0][1]) ** 2; if (dd > fd) { fd = dd; f = i; } });
        const sp = rdp(pts.slice(0, f + 1), eps).concat(rdp(pts.slice(f).concat([pts[0]]), eps).slice(1, -1));
        if (sp.length < 3) continue;
        d += 'M' + sp.map(([x, y]) => `${Math.round(x * inv)},${Math.round(y * inv)}`).join(' ') + 'Z';
      }
    }
    return d;
  }
  function rdp(P, eps) {
    if (P.length < 3) return P.slice();
    const keep = new Uint8Array(P.length); keep[0] = keep[P.length - 1] = 1;
    const stack = [[0, P.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop(); const [ax, ay] = P[a], [bx, by] = P[b];
      const L = Math.hypot(bx - ax, by - ay) || 1; let md = -1, mi = -1;
      for (let i = a + 1; i < b; i++) { const d = Math.abs((by - ay) * P[i][0] - (bx - ax) * P[i][1] + bx * ay - by * ax) / L; if (d > md) { md = d; mi = i; } }
      if (md > eps) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
    }
    return P.filter((_, i) => keep[i]);
  }

  // ── preview beside a cast member, same pixel scale, feet on one line ──
  function drawEntry(A, parent) {
    const paint = (layers, g) => layers.forEach(([f, d]) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('fill', A.fills[f]); p.setAttribute('fill-rule', 'evenodd'); g.appendChild(p); });
    const part = (node, g) => { node.k.filter((k) => k.z < 0).forEach((k) => part(k, g)); paint(node.L, g); node.k.filter((k) => k.z >= 0).forEach((k) => part(k, g)); };
    (A.parts || []).filter((p) => p.z < 0).forEach((p) => part(p, parent));
    paint(A.body, parent);
    (A.parts || []).filter((p) => p.z >= 0).forEach((p) => part(p, parent));
  }
  function renderCompare() {
    const view = $('vCompareView'); view.textContent = '';
    const other = ART[$('vCompare').value], mine = result && result.entry;
    if (!mine) return;
    const items = [other, mine].filter(Boolean), gap = 80;
    const bottom = Math.max(...items.map((A) => A.vb[1] + A.vb[3])), top = Math.min(...items.map((A) => A.vb[1]));
    let x = 0; const svg = document.createElementNS(NS, 'svg');
    items.forEach((A) => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('transform', `translate(${x - A.vb[0]} ${bottom - (A.vb[1] + A.vb[3])})`);
      drawEntry(A, g); svg.appendChild(g); x += A.vb[2] + gap;
    });
    svg.setAttribute('viewBox', `0 ${top - 40} ${x - gap} ${bottom - top + 80}`);
    view.appendChild(svg);
  }

  // ── exports ──
  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  const entryText = () => `  ${JSON.stringify(result.id)}: ${JSON.stringify(result.entry)},\n`;
  $('tSvg').addEventListener('click', () => result && download(`${result.id}-traced.svg`, result.svg, 'image/svg+xml'));
  $('tJson').addEventListener('click', () => result && download(`${result.id}-origami.json`, JSON.stringify({ [result.id]: result.entry }), 'application/json'));
  $('tCopy').addEventListener('click', () => result && copy(entryText(), $('tCopy'), 'Copy entry'));

  window.__workshop = { trace, get result() { return result; } };
})();
