/* WORKSHOP: Narrator looks. Takes her template (1376 x 768 on chroma green) with new hair and accessories painted
   in, and makes the head's base layer for that look: the green keyed out (the same key as the site's renders), the
   head cut to the layer's box, and her original face, eyes, jaw and neck laid back over it through the face lock
   (/assets/narrator/look-lock.png), so the jaw, eyelids and wink of the live narrator still fit. Shows her at
   rest, talking and blinking (with her eyes on top, as on the site), and live in a Listen bar, then hands over the file and its looks.json line. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  if (!$('looks')) return;
  var A = '/assets/narrator/', TW = 1376, TH = 768, BOX = [150, 10, 1230, 768], LW = 623, LH = 437, DROP = 0.0448;
  var out = null, name = '';
  function img(src) { return new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { no(new Error('Could not load ' + src)); }; i.src = src; }); }
  var parts = Promise.all(['head-base.webp', 'head-jaw.webp', 'head-jaw-sides.webp', 'head-lids.webp', 'look-lock.png', 'head-iris.webp', 'head-shine.webp', 'head-lens.png'].map(function (f) { return img(A + f + '?v=18'); }));
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function status(t, bad) { var s = $('lStatus'); s.textContent = t; s.style.color = bad ? '#a33' : ''; }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40); }

  // the key: background where green clearly beats both red and blue (cyan glass has more blue, so it stays),
  // soft at the edges, and green spill on the edges pulled down
  function key(c) {
    var g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height), p = d.data;
    for (var i = 0; i < p.length; i += 4) {
      var r = p[i], gr = p[i + 1], b = p[i + 2], m = Math.max(r, b), dd = gr - m;
      var a = Math.min(1, Math.max(0, 1 - (dd - 18) / 37));
      if (dd > 0) p[i + 1] = Math.min(gr, m + 4);
      p[i + 3] = Math.round(a * 255);
    }
    g.putImageData(d, 0, 0); return c;
  }
  function make(file) {
    status('Working…');
    var url = URL.createObjectURL(file);
    Promise.all([img(url), parts]).then(function (r) {
      var src = r[0], P = r[1], warn = '';
      if (src.naturalWidth !== TW || src.naturalHeight !== TH) {
        if (Math.abs(src.naturalWidth / src.naturalHeight - TW / TH) > 0.01) warn = ' It isn\'t 16:9 like her template, so it may not line up: start from her-template.png.';
        else warn = ' (Scaled from ' + src.naturalWidth + ' × ' + src.naturalHeight + '.)';
      }
      var full = canvas(TW, TH); full.getContext('2d').drawImage(src, 0, 0, TW, TH);
      var cut = canvas(LW, LH), cg = cut.getContext('2d');
      cg.imageSmoothingQuality = 'high'; cg.drawImage(key(full), BOX[0], BOX[1], BOX[2] - BOX[0], BOX[3] - BOX[1], 0, 0, LW, LH);
      // her own face, eyes, jaw and neck back over it, through the lock
      var face = canvas(LW, LH), fg = face.getContext('2d');
      fg.drawImage(P[0], 0, 0, LW, LH); fg.globalCompositeOperation = 'destination-in'; fg.drawImage(P[4], 0, 0, LW, LH);
      cg.globalCompositeOperation = 'destination-out'; cg.drawImage(P[4], 0, 0, LW, LH);
      cg.globalCompositeOperation = 'source-over'; cg.drawImage(face, 0, 0);
      out = cut; URL.revokeObjectURL(url);
      show(P);
      status('Her new look is ready.' + warn, !!warn && warn.charAt(1) === 'I');
      $('lSave').disabled = $('lCopy').disabled = false;
    }).catch(function (e) { status(e.message, true); });
  }
  // her eyes, as the site lays them over every look: the iris through the glass under her lid, the catchlights on top
  function eyes(P) {
    var c = canvas(LW, LH), g = c.getContext('2d');
    g.drawImage(P[5], 0, 0, LW, LH); g.globalCompositeOperation = 'destination-in'; g.drawImage(P[7], 0, 0, LW, LH);
    g.globalCompositeOperation = 'source-over'; g.drawImage(P[6], 0, 0, LW, LH); return c;
  }
  function show(P) {
    var box = $('lStates'), E = eyes(P); box.innerHTML = '';
    [[0, 0], [1, 0], [0, 1]].forEach(function (s) {
      var c = canvas(LW, LH), g = c.getContext('2d');
      g.drawImage(out, 0, 0); g.drawImage(E, 0, 0);
      g.drawImage(P[2], 0, s[0] * DROP * 0.55 * LH); g.drawImage(P[1], 0, s[0] * DROP * LH);
      if (s[1]) g.drawImage(P[3], 0, 0);
      box.appendChild(c);
    });
    out.toBlob(function (b) {
      var base = document.querySelector('.ws-look-bar .nb-base');
      if (base) base.src = URL.createObjectURL(b);
      var nb = document.querySelector('.ws-look-bar .nb'); if (nb) nb.classList.toggle('nb-nobulb', !$('lBulb').checked);
    }, 'image/png');
    $('lOut').hidden = false;
  }
  function entry() {
    var e = { name: name || 'new-look', file: (name || 'new-look') + '.webp' }, f = $('lFrom').value.trim(), t = $('lTo').value.trim();
    if (/^\d{2}-\d{2}$/.test(f) && /^\d{2}-\d{2}$/.test(t)) { e.from = f; e.to = t; }
    if ($('lRotate').checked) e.rotate = true;
    if (!$('lBulb').checked) e.bulb = false;
    return JSON.stringify(e);
  }
  var drop = $('lDrop');
  ['dragover', 'dragenter'].forEach(function (t) { drop.addEventListener(t, function (ev) { ev.preventDefault(); drop.classList.add('on'); }); });
  drop.addEventListener('dragleave', function () { drop.classList.remove('on'); });
  drop.addEventListener('drop', function (ev) { ev.preventDefault(); drop.classList.remove('on'); var f = ev.dataTransfer.files[0]; if (f) pick(f); });
  $('lFile').addEventListener('change', function () { if (this.files[0]) pick(this.files[0]); this.value = ''; });
  function pick(f) {
    if (!$('lName').value.trim()) $('lName').value = slug(f.name.replace(/\.[a-z]+$/i, '').replace(/^look-/, '').replace(/-(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\d.*$/, ''));
    name = slug($('lName').value); $('lBarName').textContent = name || 'Her new look';
    make(f);
  }
  $('lName').addEventListener('input', function () { name = slug(this.value); $('lBarName').textContent = name || 'Her new look'; });
  $('lBulb').addEventListener('change', function () { var nb = document.querySelector('.ws-look-bar .nb'); if (nb) nb.classList.toggle('nb-nobulb', !this.checked); });
  $('lSave').addEventListener('click', function () {
    if (!out) return;
    out.toBlob(function (b) {
      var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (name || 'new-look') + '.webp';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    }, 'image/webp', 0.9);
  });
  $('lCopy').addEventListener('click', function () {
    var t = entry();
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { status('Copied: ' + t); }, function () { status(t); });
  });
})();
