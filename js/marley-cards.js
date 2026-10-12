/* Robot Marley's catalog cards (catalog-data.js: marley, marley-colours). Each is her real player from the site
   (/js/marley.js, /css/marley.css): her parts in layers, breathing and a slow wag. A card is for trying her out, so
   nothing else happens on a timer (data-manual): her moves, blinks, ear flicks and tilts wait for a button. The site builds her on any .marley; el.marley (marley.js) lets these cards
   cue each part. Every change eases, as on the site. */
(function () {
  'use strict';
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }
  // her player with her own buttons: moves, eye moods, head, charms
  function player() {
    var box = el('div', 'cat-mly-card'), m = el('div', 'marley');
    m.setAttribute('data-controls', ''); m.setAttribute('data-manual', '');
    box.appendChild(m);
    return box;
  }
  // a Note's two colours on her collar and her charm (the dyeable charms from the cyan renders)
  function colours() {
    var box = el('div', 'cat-mly-card'), m = el('div', 'marley'), rows = el('div', 'alta-rows');
    m.setAttribute('data-charm', 'heart'); m.setAttribute('data-manual', '');
    var SAMPLES = [['Her own', null], ['A.L.T.A.', ['#329ab4', '#5b7ad2']], ['Gold on the doubletrack', ['#ec8209', '#ffc800']], ['The Tumble', ['#d4521c', '#e3a12b']],
      ['Clear Creek after dark', ['#4e7a27', '#9d98e1']], ['Whale Beach at sunset', ['#21a7c5', '#4c76e1']], ['A river through the Studio', ['#00f100', '#fe781e']]];
    var a = el('input'), b = el('input'); a.type = b.type = 'color'; a.value = '#2f6fe0'; b.value = '#e8603c';
    a.setAttribute('aria-label', 'Her collar'); b.setAttribute('aria-label', 'Her charm');
    var api = function () { return m.marley; };
    function set(p) { if (api()) api().colours(p); if (p) { a.value = p[0]; b.value = p[1]; } }
    var row = el('div', 'alta-row', '<span>Colours</span>');
    SAMPLES.forEach(function (x, i) {
      var c = el('button', 'alta-chip' + (i ? '' : ' on'), (x[1] ? '<i style="background:' + x[1][0] + '"></i><i style="background:' + x[1][1] + '"></i>' : '') + x[0]); c.type = 'button';
      c.onclick = function () { [].forEach.call(row.querySelectorAll('.alta-chip'), function (y) { y.classList.toggle('on', y === c); }); set(x[1]); };
      row.appendChild(c);
    });
    var charms = el('div', 'alta-row', '<span>Charm</span>');
    ['bone', 'heart', 'paw', 'star', 'pinecone', 'ball', 'bike', 'leaf'].forEach(function (k) {
      var c = el('button', 'alta-chip' + (k === 'heart' ? ' on' : ''), k === 'bike' ? 'bike wheel' : k); c.type = 'button';
      c.onclick = function () { [].forEach.call(charms.querySelectorAll('.alta-chip'), function (y) { y.classList.toggle('on', y === c); }); if (api()) api().charm(k); };
      charms.appendChild(c);
    });
    var own = el('div', 'alta-row', '<span>Your own</span>'), la = el('label', 'alta-pick', 'Collar '), lb = el('label', 'alta-pick', 'Charm ');
    la.appendChild(a); lb.appendChild(b); own.appendChild(la); own.appendChild(lb);
    a.oninput = b.oninput = function () { [].forEach.call(row.querySelectorAll('.alta-chip'), function (y) { y.classList.remove('on'); }); set([a.value, b.value]); };
    rows.appendChild(row); rows.appendChild(charms); rows.appendChild(own);
    box.appendChild(m); box.appendChild(rows);
    return box;
  }
  window.MARLEY = { card: function (k) { return k === 'colours' ? colours() : player(); } };
})();
