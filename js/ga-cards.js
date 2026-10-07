/* GlazyArray's catalog cards (catalog-data.js: narrator-gestures, narrator-looks, narrator-flair). Her body is the site's own narrator
   video (or its rest frame), her head the same layers narrator.js stacks: the look, the eyes in their lens, the
   catchlights, the chin plates and the lids. Geometry, in her 576 x 300 body box: the video runs 200 px past it each
   side (976 wide), and her head layer is 598 wide, 420 tall, its bottom 57.09% up the box. */
(function () {
  'use strict';
  var A = '/assets/narrator/', V = '?v=38', D = 193 / 24;
  var GESTURES = [[20, 'Making a point'], [22, 'Counting it off'], [24, 'The size of an idea'], [26, 'Arms open, palms up'], [28, 'Hands together'],
    [30, 'Over to you'], [12, 'Talking with both hands'], [1, 'The storyteller'], [8, 'A little hand dance'], [10, 'The brass ball'], [16, 'The teal ball'],
    [18, 'The glowing orb'], [32, 'A fresh new look'], [0, 'Waiting: fingers tapping'], [5, 'Hint: psst, over there'], [6, 'Hint: boop, boop, thumbs up'], [7, 'Hint: a little wave']];
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
      '<img class="ga-lids" alt="" src="' + A + 'head-lids.webp' + V + '">' +
      '<i class="ga-hit" role="button" tabindex="0" aria-label="Change her cap" title="Change her cap"></i>');   // a click on her head changes her look, as on the site
    st.appendChild(h);
    (function blink() { setTimeout(function () { if (!st.isConnected && st.dataset.gone) return; h.classList.add('ga-blink'); setTimeout(function () { h.classList.remove('ga-blink'); }, 140); blink(); }, 2500 + Math.random() * 4000); })();
    return { st: st, head: h, hit: h.querySelector('.ga-hit') };
  }
  // her looks for a card: the list (all of them, or only those with flair, caps first), a picker (‹ list ›) and a click
  // on her head that steps to the next one with a little shake, as on the site. onShow(look) after each change.
  function lookList(j, flairOnly) {
    var cats = {}; Object.keys(j.categories || {}).forEach(function (c) { (cats[j.categories[c]] = cats[j.categories[c]] || []).push(c.replace(/-/g, ' ')); });
    var all = (j.looks || []).filter(function (l) { return l.file && (!flairOnly || l.flair); }).map(function (l) {
      var when = l.from ? 'Holiday: ' + md(l.from) + ' to ' + md(l.to) : l.rotate ? 'Hair style, in rotation' : cats[l.name] ? 'For ' + cats[l.name].join(' and ') + (l.about ? ': ' + l.about : '') : (l.about ? l.about : 'Made for a Note');
      return { name: l.name, file: l.file, v: l.v, flair: l.flair || '', k: l.flairK || .45, dye: l.flairDye || '', when: when };
    });
    if (flairOnly) {
      var caps = ['grad-cap', 'bike-helmet', 'trail-cap', 'workshop-goggles', 'beach-shades'], rank = function (l) { var i = caps.indexOf(l.name); return i < 0 ? 99 : i; };
      return all.sort(function (a, b) { return rank(a) - rank(b); });
    }
    return [{ name: 'curls', file: null, when: 'Her own hair' }].concat(all);
  }
  function wardrobe(s, flairOnly, start, onShow, withBar) {
    var base = s.head.querySelector('.ga-base'), bar = null, sel = null, list = [], at = 0;
    if (withBar) {
      bar = el('div', 'ga-lookbar', '<button type="button" aria-label="Previous look">‹</button><select class="ga-pick" aria-label="Look"></select><button type="button" aria-label="Next look">›</button>');
      sel = bar.querySelector('select');
    }
    function show(i, shake) {
      if (!list.length) return; at = (i + list.length) % list.length; var l = list[at];
      base.src = l.file ? A + 'looks/' + l.file + V + (l.v ? '.' + l.v : '') : A + 'head-base.webp' + V;
      if (sel) sel.value = at;
      if (shake) { s.head.classList.remove('ga-shake'); void s.head.offsetWidth; s.head.classList.add('ga-shake'); }
      if (onShow) onShow(l);
    }
    s.hit.onclick = function () { show(at + 1, true); };
    s.hit.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(at + 1, true); } };
    getLooks().then(function (j) {
      list = lookList(j, flairOnly);
      if (sel) {
        list.forEach(function (l, i) { var o = el('option'); o.value = i; o.textContent = (i + 1) + '. ' + l.name.replace(/-/g, ' '); sel.appendChild(o); });
        sel.onchange = function () { show(+sel.value, true); };
        bar.firstChild.onclick = function () { show(at - 1, true); }; bar.lastChild.onclick = function () { show(at + 1, true); };
      }
      var i = list.findIndex(function (l) { return l.name === start; }); show(i >= 0 ? i : 0);
    });
    return bar;
  }
  function gestures() {
    var box = el('div', 'ga-card'), v = el('video', 'ga-body');
    v.muted = true; v.playsInline = true; v.preload = 'none'; v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.poster = A + 'rest.jpg' + V;
    var s = stage(v), sel = el('select', 'ga-pick'); sel.setAttribute('aria-label', 'Gesture');
    GESTURES.forEach(function (g, i) { var o = el('option'); o.value = i; o.textContent = (i < 13 ? (i + 1) + '. ' : '') + g[1]; sel.appendChild(o); });
    box.appendChild(sel); box.appendChild(s.st);
    wardrobe(s, false, 'grad-cap');   // a click on her head changes her cap
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
    var s = stage(img), cap = el('p', 'ga-cap');
    var bar = wardrobe(s, false, 'grad-cap', function (l) { cap.textContent = l.when; }, true);
    box.appendChild(bar); box.appendChild(s.st); box.appendChild(cap);
    return box;
  }
  // her flair (the Note palette): any look with flair masks, its coloured parts tinted 45% in two colours (as narrator.css
  // does with a Note's palette), the bar's shade behind her taking them too. The cap and the colours each from a list,
  // or two colours of your own; a click on her head changes the cap.
  var COMBOS = [['Tahoe evening', '#699bd3', '#9d98e1'], ['Library teal', '#26bfac', '#b57835'], ['Rim Trail', '#96b234', '#d38869'],
    ['Marlette gold', '#d7c566', '#3467b2'], ['Studio river', '#b8692d', '#d6d257'], ['Sunset', '#e0533d', '#f2a33a']];
  function flairCard() {
    var box = el('div', 'ga-card ga-flaircard'), img = el('img', 'ga-body'); img.alt = ''; img.src = A + 'kit/rest-body.webp' + V;   // keyed, so the tinted shade shows behind her
    var s = stage(img), base = s.head.querySelector('.ga-base');
    var fa = el('i', 'ga-flair'), fb = el('i', 'ga-flair ga-flair-b'); base.after(fa, fb);
    var colbar = el('div', 'ga-colbar', '<select class="ga-pick" aria-label="Colours"></select>' +
      '<label class="ga-sw" title="First colour"><input type="color" data-k="0" aria-label="First colour"></label><label class="ga-sw" title="Second colour"><input type="color" data-k="1" aria-label="Second colour"></label>');
    var csel = colbar.querySelector('select'), ins = colbar.querySelectorAll('input[type=color]');
    COMBOS.forEach(function (c, i) { var o = el('option'); o.value = i; o.textContent = c[0]; csel.appendChild(o); });
    var mine = el('option'); mine.value = 'own'; mine.textContent = 'Your colours'; mine.hidden = true; csel.appendChild(mine);
    function paint(c1, c2, i) {
      box.style.setProperty('--c1', c1); box.style.setProperty('--c2', c2); ins[0].value = c1; ins[1].value = c2;
      mine.hidden = i !== 'own'; csel.value = String(i);
    }
    function wear(l) {   // its flair masks, one per colour
      var u = A + 'looks/' + l.file.replace(/\.[a-z]+$/, '') + '.flair-', v = V + (l.v ? '.' + l.v : '');
      [[fa, 'a'], [fb, 'b']].forEach(function (f) { var on = l.flair.indexOf(f[1]) >= 0; f[0].hidden = !on; if (on) { f[0].style.setProperty('--fm', 'url(' + u + f[1] + '.png' + v + ')'); f[0].style.setProperty('--fk', l.k); f[0].classList.toggle('dye', l.dye.indexOf(f[1]) >= 0); } });   // white parts dyed (multiply), the rest tinted   // --fk: its strength, 45% on brass, more on fabric
    }
    var pick = wardrobe(s, true, 'grad-cap', wear, true);
    box.appendChild(pick); box.appendChild(colbar); box.appendChild(s.st);
    csel.onchange = function () { if (csel.value !== 'own') { var c = COMBOS[+csel.value]; paint(c[1], c[2], +csel.value); } };
    [].forEach.call(ins, function (inp) { inp.oninput = function () { var c = [ins[0].value, ins[1].value]; paint(c[0], c[1], 'own'); }; });
    paint(COMBOS[0][1], COMBOS[0][2], 0);
    return box;
  }
  window.GA = { card: function (k) { return k === 'gestures' ? gestures() : k === 'flair' ? flairCard() : looksCard(); } };
})();
