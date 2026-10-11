/* A.L.T.A.'s catalog cards (catalog-data.js: alta, alta-moves, alta-colours). Each is her real player from the site
   (/js/alta.js, /css/alta.css): the tank with her tail looping, her head in layers (resting face, irises in their lens,
   lids, mouth shapes), her gestures over her torso and her dives underwater. The site builds it on any
   section.listen.alta; bar.alta (alta.js) lets these cards cue each part. Every change eases, as on the site. */
(function () {
  'use strict';
  var NOTE = '2026-10-09-a-l-t-a';
  // her episode's cues, as on her Note (field/data/events/2026-10-09-a-l-t-a.json episode.cues)
  var CUES = [{ at: 143.5, eyes: 'amber' }, { at: 147, eyes: 'cyan' }, { at: 152, eyes: '' }];
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }
  function tank(title, audio) {
    var s = el('section', 'listen alta', '<div><span class="listen-label">' + (audio ? 'Listen' : 'A.L.T.A.') + '</span><b>' + title + '</b></div>' +
      (audio ? '<audio controls preload="none" src="' + audio + '"></audio>' : ''));
    s.setAttribute('data-narrator', 'alta');
    if (audio) s.setAttribute('data-cues', JSON.stringify(CUES));
    return s;
  }
  // the player, with her own episode
  function player() {
    var box = el('div', 'cat-alta-card');
    box.appendChild(tank('A.L.T.A., in her own words', '/play/media/' + NOTE + '/episode.mp3'));
    return box;
  }
  // every part on a button: her routines underwater, her gesture, her eye moods, her mouth shapes, a blink
  function moves() {
    var box = el('div', 'cat-alta-card'), bar = tank('Every move'), rows = el('div', 'alta-rows');
    var groups = [
      ['Underwater', [['hover', 'Hover at the glass'], ['glide', 'Glide a lap'], ['glow', 'Meditate and glow']], function (k) { bar.alta.dive(k); }],
      ['Hands', [['palms', 'Open palms']], function () { bar.alta.gesture(); }],
      ['Eyes', [['', 'Resting'], ['talk', 'Talking'], ['amber', 'Steady amber'], ['cyan', 'Cyan-green bloom']], function (k) { bar.alta.eyes(k); }],
      ['Mouth', [['rest', 'Resting smile'], ['smile', 'Smile'], ['neutral', 'Neutral'], ['ah', 'Ah'], ['oh', 'Oh'], ['oo', 'Oo'], ['ee', 'Ee'], ['laugh', 'Laugh']], function (k) { bar.alta.say(k); }],
      ['Lids', [['blink', 'Blink']], function () { bar.alta.blink(); }]
    ];
    groups.forEach(function (g) {
      var row = el('div', 'alta-row', '<span>' + g[0] + '</span>');
      g[1].forEach(function (o) {
        var b = el('button', 'alta-chip', o[1]); b.type = 'button';
        b.onclick = function () {
          if (!bar.alta) return;
          if (g[0] !== 'Underwater' && bar.alta.state() !== 'up') return;   // she's under: her head comes back when she rises
          [].forEach.call(row.querySelectorAll('.alta-chip'), function (x) { x.classList.toggle('on', x === b && g[0] !== 'Hands' && g[0] !== 'Lids' && g[0] !== 'Underwater'); });
          g[2](o[0]);
        };
        row.appendChild(b);
      });
      rows.appendChild(row);
    });
    box.appendChild(bar); box.appendChild(rows);
    return box;
  }
  // a Note's two colours on her crown's filigree and her hair's botanicals (data-palette on the site)
  function colours() {
    var box = el('div', 'cat-alta-card'), bar = tank('Her colours'), rows = el('div', 'alta-rows');
    // the palettes of real Notes (each Note's two colours, picked from its hero in the Studio)
    var SAMPLES = [['Her own', null], ['A.L.T.A.', ['#329ab4', '#5b7ad2']], ['Gold on the doubletrack', ['#ec8209', '#ffc800']], ['The Tumble', ['#d4521c', '#e3a12b']],
      ['Clear Creek after dark', ['#4e7a27', '#9d98e1']], ['Whale Beach at sunset', ['#21a7c5', '#4c76e1']], ['A river through the Studio', ['#00f100', '#fe781e']]];
    var a = el('input'), b = el('input'); a.type = b.type = 'color'; a.value = '#38b1c0'; b.value = '#e3a12b';
    a.setAttribute('aria-label', 'Her crown'); b.setAttribute('aria-label', 'Her hair');
    function set(p) {
      if (!p) { bar.classList.remove('has-pal'); return; }
      bar.style.setProperty('--al1', p[0]); bar.style.setProperty('--al2', p[1]); bar.classList.add('has-pal');
      a.value = p[0]; b.value = p[1];
    }
    var row = el('div', 'alta-row', '<span>Colours</span>');
    SAMPLES.forEach(function (x, i) {
      var c = el('button', 'alta-chip' + (i ? '' : ' on'), (x[1] ? '<i style="background:' + x[1][0] + '"></i><i style="background:' + x[1][1] + '"></i>' : '') + x[0]); c.type = 'button';
      c.onclick = function () { [].forEach.call(row.querySelectorAll('.alta-chip'), function (y) { y.classList.toggle('on', y === c); }); set(x[1]); };
      row.appendChild(c);
    });
    var own = el('div', 'alta-row', '<span>Your own</span>'), la = el('label', 'alta-pick', 'Crown '), lb = el('label', 'alta-pick', 'Hair ');
    la.appendChild(a); lb.appendChild(b); own.appendChild(la); own.appendChild(lb);
    a.oninput = b.oninput = function () { [].forEach.call(row.querySelectorAll('.alta-chip'), function (y) { y.classList.remove('on'); }); set([a.value, b.value]); };
    rows.appendChild(row); rows.appendChild(own);
    box.appendChild(bar); box.appendChild(rows);
    return box;
  }
  window.ALTA = { card: function (k) { return k === 'moves' ? moves() : k === 'colours' ? colours() : player(); } };
})();
