/* The giant paper squid's card (catalog-data.js: creature-squid). The header's two clips, each one swim from black to
   black (squid-rise.mp4: it rises out of the dark and its lights come on; squid-lunge.mp4: it lunges close past the
   glass), on screen blend over a sea drawn in code: the water's gradient, light shafts, marine snow on a canvas.
   Glow: off (its lights out, a dim paper shape), soft, or full (brighter, with a halo: a small blurred copy of each
   frame). Depth: the shallows, the twilight zone, the abyss. Behavior: still (a held frame, hovering), swim (the rise
   on a loop), or story: the view becomes a brass porthole in a deep-sea submarine and the squid swims past it again
   and again, from every side and depth, far and small or right up against the glass, with dark water in between.
   Plays only while the card is on screen; with reduced motion, a still. If the clips can't play, the stills glide. */
(function () {
  'use strict';
  var H = 'assets/hero/', CL = { rise: H + 'squid-rise.mp4?v=1', lunge: H + 'squid-lunge.mp4?v=1' },
    PO = { rise: H + 'squid-rise.jpg?v=1', lunge: H + 'squid-lunge.jpg?v=1' }, DUR = { rise: 7, lunge: 6.3 }, IN = { rise: 1, lunge: .7 };   // seconds of each clip from its first light
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SNOW = { shallows: 70, twilight: 50, abyss: 32 };
  // the passes past the porthole, in turn: the squid's box (16:9, w = % of the glass's width), its centre from a to b
  // (% of the glass) over the clip, its angle and mirror. The rise swims head first to the left (f -1: to the right;
  // r -90: down, r 90: up); the lunge starts far off at the top right and comes up huge against the glass.
  var P = [
    { c: 'rise', w: 150, a: [78, 50], b: [26, 54] },                              // in from the right, mid-water
    { c: 'lunge', w: 175, a: [56, 54], b: [44, 50], near: 1 },                    // up against the glass
    { c: 'rise', w: 72, f: -1, a: [14, 34], b: [84, 42], far: 1 },                // far off, small, left to right
    { c: 'lunge', w: 140, f: -1, r: 12, a: [40, 58], b: [58, 44] },               // from the top left, close
    { c: 'rise', w: 120, r: -90, a: [50, 4], b: [54, 92] },                       // diving from above
    { c: 'lunge', w: 95, r: -150, a: [38, 46], b: [56, 58], far: 1 },             // from below, further back
    { c: 'rise', w: 135, r: 40, a: [80, 82], b: [26, 24] },                       // up from the bottom right
    { c: 'lunge', w: 210, f: -1, r: -8, a: [44, 46], b: [56, 54], near: 1 },      // the big one, from the left
    { c: 'rise', w: 66, r: 90, a: [36, 96], b: [30, 12], far: 1 },               // far, rising from the deep
    { c: 'lunge', w: 150, r: 90, a: [58, 56], b: [46, 40] },                      // from the right, turning up
    { c: 'rise', w: 115, f: -1, r: 30, a: [16, 18], b: [80, 80] },                // down from the top left
  ];
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }

  var PORT = '<svg class="sq-port" viewBox="0 0 300 300" aria-hidden="true"><defs>' +
    '<radialGradient id="sqHull" cx="50%" cy="38%" r="78%"><stop offset="0" stop-color="#2a3d46"/><stop offset=".55" stop-color="#18262e"/><stop offset="1" stop-color="#0a1116"/></radialGradient>' +
    '<radialGradient id="sqLamp" cx="0" cy="0" r="1"><stop offset="0" stop-color="#ffb35c" stop-opacity=".2"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="sqBr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7d996"/><stop offset=".22" stop-color="#c58d3c"/><stop offset=".5" stop-color="#6e4518"/><stop offset=".74" stop-color="#d8a556"/><stop offset="1" stop-color="#4f3110"/></linearGradient>' +
    '<linearGradient id="sqBr2" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f2cf85"/><stop offset=".35" stop-color="#a06a2a"/><stop offset=".7" stop-color="#5a3812"/><stop offset="1" stop-color="#3a240b"/></linearGradient>' +
    '<radialGradient id="sqBolt" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff1c4"/><stop offset=".45" stop-color="#b98234"/><stop offset="1" stop-color="#4a2e0e"/></radialGradient>' +
    '<radialGradient id="sqRiv" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#6d838e"/><stop offset="1" stop-color="#121c22"/></radialGradient>' +
    '<radialGradient id="sqGlass" cx="50%" cy="50%" r="50%"><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset=".9" stop-color="#01070b" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient>' +
    '<radialGradient id="sqDial" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#16303a"/><stop offset="1" stop-color="#071116"/></radialGradient>' +
    '<filter id="sqSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>' +
    '</defs>' +
    // the hull, with the glass cut out of it, its plate seams and rivets, and a warm lamp off to the top left
    '<path fill-rule="evenodd" fill="url(#sqHull)" d="M0 0H300V300H0Z M150 52a98 98 0 1 0 .01 0Z"/>' +
    '<circle cx="0" cy="0" r="190" fill="url(#sqLamp)"/>' +
    '<g stroke-width="1.2"><path d="M0 74H300M0 228H300" stroke="#060b0e"/><path d="M0 75.4H300M0 229.4H300" stroke="#33474f" stroke-opacity=".5"/></g>' +
    '<g fill="url(#sqRiv)">' + [12, 40, 68, 232, 260, 288].map(function (x) { return '<circle cx="' + x + '" cy="66" r="2.1"/><circle cx="' + x + '" cy="237" r="2.1"/>'; }).join('') + '</g>' +
    // the flange: an outer ring, its bolts, the inner lip, a hinge and a clamp
    '<circle cx="150" cy="150" r="112" fill="none" stroke="#05090c" stroke-width="20" opacity=".55" filter="url(#sqSoft)"/>' +
    '<circle cx="150" cy="150" r="108" fill="none" stroke="url(#sqBr)" stroke-width="16"/>' +
    '<circle cx="150" cy="150" r="116" fill="none" stroke="#3a240b" stroke-width="1"/>' +
    '<circle cx="150" cy="150" r="103.5" fill="none" stroke="#2a1906" stroke-width="1.4"/>' +
    '<g>' + Array.apply(null, Array(12)).map(function (_, i) {
      var t = i * Math.PI / 6 + Math.PI / 12, x = (150 + 110 * Math.cos(t)).toFixed(1), y = (150 + 110 * Math.sin(t)).toFixed(1);
      return '<circle cx="' + x + '" cy="' + y + '" r="3.9" fill="#2a1906" opacity=".6"/><circle cx="' + x + '" cy="' + y + '" r="3.3" fill="url(#sqBolt)"/>';
    }).join('') + '</g>' +
    '<circle cx="150" cy="150" r="100.5" fill="none" stroke="url(#sqBr2)" stroke-width="7"/>' +
    '<circle cx="150" cy="150" r="97" fill="none" stroke="#1c1004" stroke-width="1.2"/>' +
    '<rect x="22" y="136" width="14" height="28" rx="3" fill="url(#sqBr)" stroke="#3a240b" stroke-width=".8"/><rect x="26" y="133" width="6" height="34" rx="3" fill="url(#sqBr2)"/>' +
    '<path d="M266 140h10a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3h-10z" fill="url(#sqBr)" stroke="#3a240b" stroke-width=".8"/><circle cx="273" cy="150" r="3" fill="url(#sqBolt)"/>' +
    // the glass: shadowed round its edge, a curved reflection, a glint
    '<circle cx="150" cy="150" r="97" fill="url(#sqGlass)"/>' +
    '<path d="M82 112a78 78 0 0 1 60-50" fill="none" stroke="#e8f8ff" stroke-opacity=".22" stroke-width="7" stroke-linecap="round" filter="url(#sqSoft)"/>' +
    '<path d="M90 128a70 70 0 0 1 8-17" fill="none" stroke="#e8f8ff" stroke-opacity=".18" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M214 200a80 80 0 0 1-30 22" fill="none" stroke="#bfefff" stroke-opacity=".08" stroke-width="5" stroke-linecap="round" filter="url(#sqSoft)"/>' +
    // two dials (depth and pressure), three lamps, a valve wheel on its pipe
    [[34, 266, 'sq-n1'], [266, 266, 'sq-n2']].map(function (d) {
      var ticks = ''; for (var i = 0; i <= 8; i++) { var t = (-225 + i * 33.75) * Math.PI / 180; ticks += '<line x1="' + (d[0] + 12 * Math.cos(t)).toFixed(1) + '" y1="' + (d[1] + 12 * Math.sin(t)).toFixed(1) + '" x2="' + (d[0] + 15 * Math.cos(t)).toFixed(1) + '" y2="' + (d[1] + 15 * Math.sin(t)).toFixed(1) + '"/>'; }
      return '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="21" fill="url(#sqBr)"/><circle cx="' + d[0] + '" cy="' + d[1] + '" r="17.5" fill="url(#sqDial)" stroke="#2a1906" stroke-width="1"/>' +
        '<g stroke="#9fd8e4" stroke-opacity=".7" stroke-width="1">' + ticks + '</g>' +
        '<path d="M' + (d[0] + 8.8) + ' ' + (d[1] - 12.4) + 'a15 15 0 0 1 5.5 6.5" fill="none" stroke="#e0533d" stroke-width="2"/>' +
        '<g class="sq-needle ' + d[2] + '" style="transform-origin:' + d[0] + 'px ' + d[1] + 'px"><line x1="' + d[0] + '" y1="' + (d[1] + 3) + '" x2="' + d[0] + '" y2="' + (d[1] - 13) + '" stroke="#f3e2b0" stroke-width="1.6" stroke-linecap="round"/></g>' +
        '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="2.4" fill="url(#sqBolt)"/>' +
        '<path d="M' + (d[0] - 11) + ' ' + (d[1] - 9) + 'a14 14 0 0 1 12-6" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="2" stroke-linecap="round"/>';
    }).join('') +
    '<rect x="12" y="16" width="52" height="20" rx="5" fill="#0b1418" stroke="#33474f" stroke-opacity=".6"/>' +
    '<circle cx="25" cy="26" r="4" fill="#39d98a" class="sq-lamp"/><circle cx="38" cy="26" r="4" fill="#f2b33a" opacity=".85"/><circle cx="51" cy="26" r="4" fill="#e0533d" class="sq-lamp sq-lamp-b"/>' +
    '<path d="M300 30H270a8 8 0 0 0-8 8v6" fill="none" stroke="url(#sqBr2)" stroke-width="7"/>' +
    '<g class="sq-wheel" style="transform-origin:262px 50px"><circle cx="262" cy="50" r="11" fill="none" stroke="#a8392b" stroke-width="3"/><path d="M262 39v22M251 50h22M254.2 42.2l15.6 15.6M254.2 57.8l15.6-15.6" stroke="#a8392b" stroke-width="1.6"/><circle cx="262" cy="50" r="3" fill="url(#sqBolt)"/></g>' +
    '</svg>';

  function card(st) {
    var box = el('div', 'sq-card'), water = el('div', 'sq-water'),
      bg = el('div', 'sq-bg'), shafts = el('div', 'sq-shafts', '<i></i><i></i><i></i><i></i>'),
      snow = el('canvas', 'sq-snow'), front = el('canvas', 'sq-snow sq-front'),
      sq = el('div', 'sq-sq'), img = el('img', 'sq-img'), glow = el('canvas', 'sq-glow'), V = {};
    img.alt = ''; img.src = PO.rise; img.decoding = 'async';
    ['rise', 'lunge'].forEach(function (c) {
      var v = el('video', 'sq-v sq-' + c); v.muted = true; v.playsInline = true; v.preload = 'none';
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); V[c] = v; sq.appendChild(v);
    });
    sq.appendChild(img); sq.appendChild(glow);
    water.append(bg, shafts, snow, sq, front);
    box.appendChild(water);
    box.insertAdjacentHTML('beforeend', PORT);
    glow.width = 192; glow.height = 108;
    var gx = glow.getContext('2d'), sx = snow.getContext('2d'), fx = front.getContext('2d');
    var on = false, raf = 0, timer = 0, modeT = 0, lastB = null, k = 0, cur = null, src = img, noVideo = false, flakes = [], specks = [], W = 0, Ht = 0, last = 0;

    function set(key, val) {
      st[key] = val;
      box.dataset[key] = val;
      if (key === 'depth') seed();
      if (key === 'behavior') mode();
    }
    function seed() {
      var n = SNOW[st.depth] || 50; flakes = []; specks = [];
      for (var i = 0; i < n; i++) flakes.push({ x: Math.random(), y: Math.random(), r: .4 + Math.random() * Math.random() * 1.6, v: .004 + Math.random() * .012, d: Math.random() * 6.28, a: .25 + Math.random() * .55, c: st.depth === 'abyss' && Math.random() < .14 });
      for (i = 0; i < (st.depth === 'abyss' ? 4 : 7); i++) specks.push({ x: Math.random(), y: Math.random(), r: 2 + Math.random() * 3, v: .01 + Math.random() * .015, d: Math.random() * 6.28, a: .12 + Math.random() * .16 });
      if (RM || !on) draw(0);
    }
    function size() {
      var w = water.clientWidth, h = water.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
      if (w === W && h === Ht) return;
      W = w; Ht = h;
      [snow, front].forEach(function (c) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); });
    }
    function dots(cx, list, dt, t, blurry) {
      cx.clearRect(0, 0, W, Ht);
      list.forEach(function (p) {
        p.y += p.v * dt; p.x += Math.sin(t / 2400 + p.d) * .0009 * dt * 10;
        if (p.y > 1.03) { p.y = -.03; p.x = Math.random(); }
        var tw = p.c ? .45 + .55 * Math.sin(t / 500 + p.d * 3) : 1;
        cx.globalAlpha = p.a * tw;
        cx.fillStyle = p.c ? '#7ff3ff' : blurry ? '#a9c6d4' : '#d8ecf4';
        cx.beginPath(); cx.arc(p.x * W, p.y * Ht, p.r * (p.c ? 1.3 : 1), 0, 6.283); cx.fill();
      });
      cx.globalAlpha = 1;
    }
    function draw(t) {
      size();
      var dt = last ? Math.min(.1, (t - last) / 1000) : 0; last = t;
      dots(sx, flakes, dt, t); dots(fx, specks, dt, t, true);
      if (st.glow !== 'off' && (src !== img || img.complete) && (src === img || src.readyState >= 2)) {
        try { gx.clearRect(0, 0, 192, 108); gx.drawImage(src, 0, 0, 192, 108); } catch (e) { /* not ready */ }
      }
    }
    function tick(t) { if (!box.isConnected) return kill(); if (!on) { raf = 0; return; } draw(t); raf = requestAnimationFrame(tick); }
    function show(which) { sq.dataset.show = which; src = which === 'img' ? img : V[which]; }
    // the squid fades in and out gently (FADE); it only jumps to a pass's start while it's out of sight
    var FADE = 'opacity .9s ease-in-out';
    function place(p, end, dur) {
      var s = sq.style, xy = end ? p.b : p.a;
      s.transition = dur ? 'left ' + dur + 's linear,top ' + dur + 's linear,' + FADE + ',width 1s ease-in-out,filter 1s ease-in-out' : FADE;
      s.left = xy[0] + '%'; s.top = xy[1] + '%';
      if (!end) { s.setProperty('--w', p.w + '%'); s.setProperty('--r', (p.r || 0) + 'deg'); s.setProperty('--f', p.f || 1); }
    }
    function stopAll() { clearTimeout(timer); clearTimeout(modeT); Object.keys(V).forEach(function (c) { V[c].pause(); V[c].onended = null; }); sq.classList.remove('on'); }
    function load(c) { var v = V[c]; if (!v.getAttribute('src')) { v.src = CL[c]; v.preload = 'auto'; } return v; }
    // story: one pass, then dark water, then the next
    function pass() {
      if (!box.isConnected) return kill();
      if (!on || st.behavior !== 'story') return;
      var p = P[k++ % P.length]; cur = p;
      sq.className = 'sq-sq' + (p.far ? ' far' : p.near ? ' near' : '');
      place(p, false, 0);
      var go = function (dur) { void sq.offsetWidth; sq.classList.add('on'); place(p, true, dur); };
      var after = function () { sq.classList.remove('on'); timer = setTimeout(pass, 1000 + Math.random() * 1800); };   // dark water once it has faded out
      if (noVideo || RM) {   // the still glides through instead
        img.src = PO[p.c]; show('img'); go(DUR[p.c] - 1);
        timer = setTimeout(function () { sq.classList.remove('on'); timer = setTimeout(after, 900); }, (DUR[p.c] - 2.2) * 1000);
        return;
      }
      var v = load(p.c); show(p.c); v.loop = false; v.currentTime = IN[p.c];
      v.onended = after;
      v.play().then(function () { if (cur === p && on) go(DUR[p.c]); }).catch(function () { if (cur !== p) return; k--; noVideo = true; pass(); });
    }
    // a new behavior: the porthole eases in or out, and a squid on screen fades out before the new one fades in
    function mode() {
      var shown = st.behavior !== lastB && sq.classList.contains('on') && on && !RM;
      lastB = st.behavior;
      stopAll(); cur = null;
      box.classList.toggle('story', st.behavior === 'story');
      if (shown) modeT = setTimeout(apply, 950); else apply();
    }
    function apply() {
      var b = st.behavior;
      sq.className = 'sq-sq'; sq.style.cssText = '';
      if (b === 'story') {
        if (RM) { img.src = PO.rise; show('img'); place({ w: 120, a: [50, 52] }, false, 0); sq.classList.add('on'); }
        else if (on) timer = setTimeout(pass, 700);
        return;
      }
      sq.classList.add('on');
      if (b === 'still' || RM || noVideo) { img.src = PO.rise; show('img'); sq.classList.toggle('bob', !RM); return; }
      var v = load('rise'); show('rise'); v.loop = true;
      if (on) v.play().catch(function () { noVideo = true; apply(); });
    }
    // a card thrown away (a new search or tab) lets go of its clips
    function kill() { on = false; stopAll(); cancelAnimationFrame(raf); raf = 0; Object.keys(V).forEach(function (c) { if (V[c].getAttribute('src')) { V[c].removeAttribute('src'); V[c].load(); } }); if (io) io.disconnect(); }
    function wake(vis) {
      if (!box.isConnected) return kill();
      if (vis === on) return;
      on = vis;
      if (on) { last = 0; if (!RM && !raf) raf = requestAnimationFrame(tick); else if (RM) draw(0); mode(); }
      else { stopAll(); cancelAnimationFrame(raf); raf = 0; }
    }
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { wake(es[es.length - 1].isIntersecting); }) : null;
    ['glow', 'depth', 'behavior'].forEach(function (key) { box.dataset[key] = st[key]; });
    seed(); mode();
    if (io) io.observe(box); else setTimeout(function () { wake(true); });
    img.addEventListener('load', function () { if (!on || RM) draw(0); });
    box._set = set;
    return box;
  }
  window.SquidCard = { card: card };
})();
