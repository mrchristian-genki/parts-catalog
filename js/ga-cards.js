/* GlazyArray's catalog cards (catalog-data.js: narrator-gestures, narrator-looks). Her body is the site's own narrator
   video (or its rest frame), her head the same layers narrator.js stacks: the look, the eyes in their lens, the
   catchlights, the chin plates and the lids. Geometry, in her 576 x 300 body box: the video runs 200 px past it each
   side (976 wide), and her head layer is 598 wide, 420 tall, its bottom 57.09% up the box. */
(function () {
  'use strict';
  var A = '/assets/narrator/', V = '?v=33', D = 193 / 24;
  var GESTURES = [[20, 'Making a point'], [22, 'Counting it off'], [24, 'The size of an idea'], [26, 'Arms open, palms up'], [28, 'Hands together'],
    [30, 'Over to you'], [12, 'Talking with both hands'], [1, 'The storyteller'], [8, 'A little hand dance'], [10, 'The brass ball'], [16, 'The teal ball'],
    [18, 'The glowing orb'], [0, 'Waiting: fingers tapping'], [5, 'Hint: psst, over there'], [6, 'Hint: boop, boop, thumbs up'], [7, 'Hint: a little wave']];
  var MD = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function md(s) { var p = String(s).split('-'); return MD[+p[0]] + ' ' + (+p[1]); }
  var looks = null;
  function getLooks() { return looks || (looks = fetch(A + 'looks.json' + V).then(function (r) { return r.json(); }).catch(function () { return { looks: [] }; })); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }
  function stage(body) {
    var st = el('div', 'ga-stage');
    st.appendChild(body);
    var h = el('div', 'ga-head',
      '<img class="ga-base" alt="" src="' + A + 'head-base.webp' + V + '">' +
      '<span class="ga-eyes"><img alt="" src="' + A + 'head-iris.webp' + V + '"></span>' +
      '<img alt="" src="' + A + 'head-shine.webp' + V + '">' +
      '<img class="ga-jaws" alt="" src="' + A + 'head-jaw-sides.webp' + V + '">' +
      '<img class="ga-jaw" alt="" src="' + A + 'head-jaw.webp' + V + '">' +
      '<img class="ga-lids" alt="" src="' + A + 'head-lids.webp' + V + '">');
    st.appendChild(h);
    (function blink() { setTimeout(function () { if (!st.isConnected && st.dataset.gone) return; h.classList.add('ga-blink'); setTimeout(function () { h.classList.remove('ga-blink'); }, 140); blink(); }, 2500 + Math.random() * 4000); })();
    return { st: st, head: h };
  }
  function gestures() {
    var box = el('div', 'ga-card'), v = el('video', 'ga-body');
    v.muted = true; v.playsInline = true; v.preload = 'none'; v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.poster = A + 'rest.jpg' + V;
    var s = stage(v), sel = el('select', 'ga-pick'); sel.setAttribute('aria-label', 'Gesture');
    GESTURES.forEach(function (g, i) { var o = el('option'); o.value = i; o.textContent = (i < 12 ? (i + 1) + '. ' : '') + g[1]; sel.appendChild(o); });
    box.appendChild(sel); box.appendChild(s.st);
    var part = GESTURES[0][0], on = false, jaw = s.head.querySelector('.ga-jaw'), jaws = s.head.querySelector('.ga-jaws');
    function start() { v.currentTime = part * D; v.play().catch(function () {}); }
    sel.onchange = function () { part = GESTURES[+sel.value][0]; if (on) start(); };
    (function tick() {   // loops the chosen part, and the chin chatters as if she's talking (not while she waits or hints)
      if (on && !v.paused && v.currentTime >= (part + 1) * D - 0.06) v.currentTime = part * D;
      var talk = on && [0, 5, 6, 7].indexOf(part) < 0, t = performance.now(), l = talk ? Math.max(0, .35 + .35 * Math.sin(t / 90) * Math.sin(t / 233)) : 0;
      jaw.style.transform = 'translateY(' + (l * 4.48).toFixed(2) + '%)'; jaws.style.transform = 'translateY(' + (l * 2.46).toFixed(2) + '%)';
      requestAnimationFrame(tick);
    })();
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
      es.forEach(function (e) { on = e.isIntersecting; if (on) { if (!v.src) { v.src = A + 'narrator.mp4' + V; v.preload = 'auto'; } start(); } else v.pause(); });
    }).observe(box);
    return box;
  }
  function looksCard() {
    var box = el('div', 'ga-card'), img = el('img', 'ga-body'); img.alt = ''; img.src = A + 'rest.jpg' + V;
    var s = stage(img), bar = el('div', 'ga-lookbar', '<button type="button" aria-label="Previous look">‹</button><select class="ga-pick" aria-label="Look"></select><button type="button" aria-label="Next look">›</button>'),
      cap = el('p', 'ga-cap'), sel = bar.querySelector('select'), base = s.head.querySelector('.ga-base');
    box.appendChild(bar); box.appendChild(s.st); box.appendChild(cap);
    getLooks().then(function (j) {
      var cats = {}; Object.keys(j.categories || {}).forEach(function (c) { (cats[j.categories[c]] = cats[j.categories[c]] || []).push(c.replace(/-/g, ' ')); });
      var list = [{ name: 'curls', file: null, when: 'Her own hair' }].concat((j.looks || []).map(function (l) {
        var when = l.from ? 'Holiday: ' + md(l.from) + ' to ' + md(l.to) : l.rotate ? 'Hair style, in rotation' : cats[l.name] ? 'For ' + cats[l.name].join(' and ') + (l.about ? ': ' + l.about : '') : (l.about ? l.about : 'Made for a Note');
        return { name: l.name, file: 'looks/' + l.file + V + (l.v ? '.' + l.v : ''), when: when };
      }));
      list.forEach(function (l, i) { var o = el('option'); o.value = i; o.textContent = (i + 1) + '. ' + l.name.replace(/-/g, ' '); sel.appendChild(o); });
      function show(i) { i = (i + list.length) % list.length; sel.value = i; var l = list[i]; base.src = l.file ? A + l.file : A + 'head-base.webp' + V; cap.textContent = l.when; }
      sel.onchange = function () { show(+sel.value); };
      bar.firstChild.onclick = function () { show(+sel.value - 1); }; bar.lastChild.onclick = function () { show(+sel.value + 1); };
      show(list.findIndex(function (l) { return l.name === 'grad-cap'; }) || 0);
    });
    return box;
  }
  window.GA = { card: function (k) { return k === 'gestures' ? gestures() : looksCard(); } };
})();
