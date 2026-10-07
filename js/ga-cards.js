/* GlazyArray's catalog cards (catalog-data.js: narrator-gestures, narrator-looks, narrator-flair). Her body is the site's own narrator
   video (or its rest frame), her head the same layers narrator.js stacks: the look, the eyes in their lens, the
   catchlights, the chin plates and the lids. Geometry, in her 576 x 300 body box: the video runs 200 px past it each
   side (976 wide), and her head layer is 598 wide, 420 tall, its bottom 57.09% up the box. */
(function () {
  'use strict';
  var A = '/assets/narrator/', V = '?v=34', D = 193 / 24;
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
      '<img class="ga-lids" alt="" src="' + A + 'head-lids.webp' + V + '">');
    st.appendChild(h);
    (function blink() { setTimeout(function () { if (!st.isConnected && st.dataset.gone) return; h.classList.add('ga-blink'); setTimeout(function () { h.classList.remove('ga-blink'); }, 140); blink(); }, 2500 + Math.random() * 4000); })();
    return { st: st, head: h };
  }
  function gestures() {
    var box = el('div', 'ga-card'), v = el('video', 'ga-body');
    v.muted = true; v.playsInline = true; v.preload = 'none'; v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.poster = A + 'rest.jpg' + V;
    var s = stage(v), sel = el('select', 'ga-pick'); sel.setAttribute('aria-label', 'Gesture');
    GESTURES.forEach(function (g, i) { var o = el('option'); o.value = i; o.textContent = (i < 13 ? (i + 1) + '. ' : '') + g[1]; sel.appendChild(o); });
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

  // her flair (the Note palette): any look with flair masks, its coloured parts tinted 45% in two colours (as narrator.css
  // does with a Note's palette), the bar's shade behind her taking them too. Change cap, change colours, or pick your own.
  var COMBOS = [['Tahoe evening', '#699bd3', '#9d98e1'], ['Library teal', '#26bfac', '#b57835'], ['Rim Trail', '#96b234', '#d38869'],
    ['Marlette gold', '#d7c566', '#3467b2'], ['Studio river', '#b8692d', '#d6d257'], ['Clear water', '#1c97c9', '#4762e5'],
    ['Sunset', '#e0533d', '#f2a33a'], ['Berry', '#c2408f', '#5b6cd6'], ['Mint', '#3fbf8f', '#e6c34a']];
  function flairCard() {
    var box = el('div', 'ga-card ga-flaircard'), img = el('img', 'ga-body'); img.alt = ''; img.src = A + 'kit/rest-body.webp' + V;   // keyed, so the tinted shade shows behind her
    var s = stage(img), base = s.head.querySelector('.ga-base');
    var fa = el('i', 'ga-flair'), fb = el('i', 'ga-flair ga-flair-b'); base.after(fa, fb);
    var bar = el('div', 'ga-flairbar',
      '<div class="ga-flairbtns"><button type="button" class="ga-btn" data-cap>Change cap</button><button type="button" class="ga-btn" data-col>Change colours</button></div>' +
      '<div class="ga-flairpick"><span class="ga-combos"></span><label class="ga-sw" title="First colour"><input type="color" data-k="0"></label><label class="ga-sw" title="Second colour"><input type="color" data-k="1"></label></div>');
    var cap = el('p', 'ga-cap ga-flaircap');
    box.appendChild(bar); box.appendChild(cap); box.appendChild(s.st);
    var combos = bar.querySelector('.ga-combos'), ins = bar.querySelectorAll('input[type=color]');
    COMBOS.forEach(function (c, i) {
      var b = el('button', 'ga-combo'); b.type = 'button'; b.title = c[0]; b.setAttribute('aria-label', 'Colours: ' + c[0]);
      b.style.background = 'linear-gradient(135deg,' + c[1] + ' 50%,' + c[2] + ' 50%)'; b.onclick = function () { ci = i; paint(c[1], c[2], c[0]); }; combos.appendChild(b);
    });
    var list = [], li = 0, ci = 0, col = [COMBOS[0][1], COMBOS[0][2]], label = COMBOS[0][0];
    function paint(c1, c2, name) {
      col = [c1, c2]; label = name || 'Your colours';
      box.style.setProperty('--c1', c1); box.style.setProperty('--c2', c2); ins[0].value = c1; ins[1].value = c2;
      [].forEach.call(combos.children, function (b, i) { b.classList.toggle('on', !!name && i === ci); });
      say();
    }
    function say() { var l = list[li]; cap.textContent = (l ? l.name.replace(/-/g, ' ') : '') + ' · ' + label; }
    function wear(i) {
      if (!list.length) return; li = (i + list.length) % list.length; var l = list[li], u = A + 'looks/' + l.file.replace(/\.[a-z]+$/, '') + '.flair-', v = V + (l.v ? '.' + l.v : '');
      base.src = A + 'looks/' + l.file + v;
      [[fa, 'a'], [fb, 'b']].forEach(function (f) { var on = (l.flair || '').indexOf(f[1]) >= 0; f[0].hidden = !on; if (on) f[0].style.setProperty('--fm', 'url(' + u + f[1] + '.png' + v + ')'); });
      say();
    }
    bar.querySelector('[data-cap]').onclick = function () { wear(li + 1); };
    bar.querySelector('[data-col]').onclick = function () { ci = (ci + 1) % COMBOS.length; paint(COMBOS[ci][1], COMBOS[ci][2], COMBOS[ci][0]); };
    [].forEach.call(ins, function (inp) { inp.oninput = function () { var c = col.slice(); c[+inp.getAttribute('data-k')] = inp.value; ci = -1; paint(c[0], c[1]); }; });
    paint(col[0], col[1], label);
    getLooks().then(function (j) {
      var caps = ['grad-cap', 'bike-helmet', 'trail-cap', 'workshop-goggles', 'beach-shades'], rank = function (l) { var i = caps.indexOf(l.name); return i < 0 ? 99 : i; };
      list = (j.looks || []).filter(function (l) { return l.flair && l.file; }).sort(function (a, b) { return rank(a) - rank(b); });   // the caps first
      var g = list.findIndex(function (l) { return l.name === 'grad-cap'; }); wear(g >= 0 ? g : 0);
    });
    return box;
  }
  window.GA = { card: function (k) { return k === 'gestures' ? gestures() : k === 'flair' ? flairCard() : looksCard(); } };
})();
