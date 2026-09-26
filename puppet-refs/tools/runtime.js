
  // ── origami puppets ───────────────────────────────────────────────────
  // Flat papercraft animals traced from AI images (see puppet-refs/ on the Mac). Unlike the
  // silhouettes above, every part is PRE-CUT at build time (origami-art.js holds the pieces), so
  // the browser draws plain filled paths in nested groups and only turns groups: no clip paths,
  // no masks. Each piece carries a few px of overlap across its seam and a round cap around its
  // pivot, so turning a part never opens a gap.
  // ORIGAMI_ART[id] = { vb, fills:[hex], body:[[fill,d]..], parts:[{n,p:[x,y],z,L:[[fill,d]..],k:[..]}] }
  // z < 0 draws a part behind its parent (far legs, tail, neck, ears); z >= 0 in front.
  // Rigs below: behaviours (same names the scene already asks for), travel speeds, coats.
  // Coats: fills are the traced colours; `coats[season]` swaps some by index (winter greys, the
  // white winter hare). At night on ungraded stages every colour is darkened and cooled here.
  const O_TAU = Math.PI * 2;
  const sw = (t, hz, ph) => Math.sin(O_TAU * hz * t + (ph || 0));
  // A walk cycle for four legs: diagonal pairs swing together. amp in degrees.
  const legs4 = (t, hz, amp, names) => {
    const s = sw(t, hz);
    return { [names[0]]: amp * s, [names[1]]: -amp * s, [names[2]]: -amp * s * 0.9, [names[3]]: amp * s * 0.9 };
  };
  const DEER_LEGS = ['nearFront', 'farFront', 'nearHind', 'farHind'];
  // graze cycle (seconds): lower 1.8, crop 4.7, raise 1.7, look about 2.8
  function deerGraze(t) {
    const c = ((t % 11) + 11) % 11;
    const down = c < 1.8 ? ease(c / 1.8) : c < 6.5 ? 1 : c < 8.2 ? 1 - ease((c - 6.5) / 1.7) : 0;
    const chew = c > 1.8 && c < 6.5 ? 1 : 0;
    return {
      root: { sy: 1 + 0.004 * osc(t, 0.25) },
      parts: {
        neck: 116 * down + 2 * osc(t, 0.25), head: -48 * down + chew * 3 * osc(t, 5.5) + (c > 8.2 ? -4 * Math.sin((c - 8.2) * 1.6) : 0),
        earL: -12 * pulse(c, 11, 8.6, 0.15, 0.1, 0.2) + 5 * down, earR: 10 * pulse(c, 11, 9.4, 0.15, 0.1, 0.2) - 5 * down,
        tail: -24 * pulse(t, 3.7, 1.2, 0.2, 0.1, 0.3),
      },
    };
  }
  const deerIdle = (t) => ({ root: { sy: 1 + 0.005 * osc(t, 0.25) }, parts: { neck: 2 * osc(t, 0.1), head: 1.5 * osc(t, 0.13),
    earL: -14 * pulse(t, 5.2, 1, 0.12, 0.08, 0.2), earR: 12 * pulse(t, 6.7, 3.2, 0.12, 0.08, 0.2), tail: -20 * pulse(t, 4.1, 2, 0.2, 0.1, 0.3) } });
  const deerAlert = (t) => ({ root: { sy: 1 + 0.004 * osc(t, 0.3) }, parts: { neck: -9, head: -5 + 2 * pulse(t, 3.3, 1.5, 0.3, 0.6, 0.4),
    earL: 8 + 6 * pulse(t, 2.6, 0.4, 0.1, 0.1, 0.2), earR: -6 - 8 * pulse(t, 3.1, 1.8, 0.1, 0.1, 0.2), tail: -12 } });
  const deerWalk = (t) => ({ root: { y: -10 * Math.abs(sw(t, 1.05)) }, parts: Object.assign(legs4(t, 1.05, 15, DEER_LEGS),
    { neck: 3 * sw(t, 2.1), head: -2 * sw(t, 2.1), tail: 6 * sw(t, 1.05), earL: 3 * sw(t, 2.1), earR: -3 * sw(t, 2.1) }) });
  const DEER_WINTER = { '#bd8054': '#8f7b69', '#d49b6e': '#ab9784', '#ab7247': '#7f6c5c', '#916240': '#6e5d4f', '#dfc2a1': '#d3c8bb',
    '#b97e55': '#8f7b69', '#a76f4a': '#7f6c5c', '#ca9c78': '#ab9784', '#876045': '#6e5d4f', '#daba9b': '#d3c8bb' };

  const ORIGAMI = {
    doe: { behaviors: { graze: deerGraze, idle: deerIdle, alert: deerAlert, walk: deerWalk }, travel: { walk: 0.09 }, coats: { winter: DEER_WINTER } },
  };

  const shadeNight = (hex) => '#' + [[1, 0.36], [3, 0.4], [5, 0.5]].map(([i, k]) =>
    Math.round(parseInt(hex.substr(i, 2), 16) * k).toString(16).padStart(2, '0')).join('');

  function buildOrigami(id, opts) {
    const A = window.ORIGAMI_ART[id], rig = ORIGAMI[id];
    const [vx, vy, vw, vh] = A.vb;
    const ax = vx + vw / 2, ay = vy + vh;
    const svg = el('svg', { viewBox: A.vb.join(' '), class: 'creature origami origami-' + id, overflow: 'visible', 'aria-hidden': 'true' });
    svg.style.overflow = 'visible';
    const root = el('g', { class: 'cr-root' }, svg);
    const partEls = {};
    const paint = (layers, parent) => layers.forEach(([f, d]) => el('path', { d, class: 'of' + f, 'fill-rule': 'evenodd' }, parent));
    function drawPart(node, parent) {
      const g = el('g', { 'data-part': node.n }, parent);
      partEls[node.n] = { g, x: node.p[0], y: node.p[1] };
      node.k.filter((k) => k.z < 0).forEach((k) => drawPart(k, g));
      paint(node.L, g);
      node.k.filter((k) => k.z >= 0).forEach((k) => drawPart(k, g));
    }
    A.parts.filter((p) => p.z < 0).forEach((p) => drawPart(p, root));
    paint(A.body, root);
    A.parts.filter((p) => p.z >= 0).forEach((p) => drawPart(p, root));

    const behaviors = rig.behaviors;
    const inst = {
      id, svg, visible: true,
      behavior: opts.behavior && behaviors[opts.behavior] ? opts.behavior : Object.keys(behaviors)[0],
      t0: performance.now() / 1000 - (opts.phase != null ? opts.phase : Math.random() * 20),
      season: opts.season || 'summer', night: !!opts.night, rate: opts.rate || 1,
      graded: !!(opts.paint && opts.paint.graded),
    };
    function applyPalette() {
      const swap = (rig.coats && rig.coats[inst.season]) || {};
      A.fills.forEach((hex, i) => {
        let c = swap[hex] || hex;
        if (inst.night && !inst.graded) c = shadeNight(c);
        svg.style.setProperty('--o' + i, c);
      });
    }
    applyPalette();
    inst.frame = function (now) {
      const t = (now - inst.t0) * inst.rate;
      const m = behaviors[inst.behavior](t) || {};
      const r = m.root || {};
      root.setAttribute('transform',
        'translate(' + (r.x || 0).toFixed(1) + ' ' + (r.y || 0).toFixed(1) + ') ' +
        'rotate(' + (r.r || 0).toFixed(2) + ' ' + ax + ' ' + ay + ') ' +
        (r.sy ? 'translate(' + ax + ' ' + ay + ') scale(1 ' + r.sy.toFixed(4) + ') translate(' + -ax + ' ' + -ay + ')' : ''));
      const parts = m.parts || {};
      for (const name in partEls) {
        const a = parts[name] || 0, pe = partEls[name];
        if (pe.a === a) continue;                        // unchanged: skip the DOM write
        pe.a = a;
        pe.g.setAttribute('transform', a ? 'rotate(' + a.toFixed(2) + ' ' + pe.x + ' ' + pe.y + ')' : '');
      }
    };
    inst.api = {
      svg, rig, anchor: [ax, ay], viewBox: A.vb.slice(), facing: 1, origami: true,
      behaviors: Object.keys(behaviors),
      get behavior() { return inst.behavior; },
      travelSpeed() { return ((rig.travel && rig.travel[inst.behavior]) || 0) * inst.rate; },
      setSeason(s) { inst.season = s; applyPalette(); },
      setNight(n) { inst.night = !!n; applyPalette(); },
      setBehavior(b) { if (behaviors[b]) inst.behavior = b; },
      seek(t) { inst.t0 = performance.now() / 1000 - t; inst.frame(performance.now() / 1000); },
      destroy() { live.delete(inst); if (io) io.unobserve(svg); svg.remove(); },
    };
    live.add(inst);
    byEl.set(svg, inst);
    if (io) io.observe(svg);
    inst.frame(performance.now() / 1000);
    ensureLoop();
    return inst.api;
  }
  if (!document.getElementById('origami-style')) {
    const st = document.createElement('style');
    st.id = 'origami-style';
    st.textContent = Array.from({ length: 9 }, (_, i) => '.origami .of' + i + '{fill:var(--o' + i + ');transition:fill .7s ease}').join('');
    document.head.appendChild(st);
  }
