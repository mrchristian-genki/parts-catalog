/* SCENE TEST -- renders a scene recipe (window.SCENE) as parallax layers.
   Each layer sits in world units; the world is scaled to cover the stage a little
   larger than it, and the camera pans across the spare width: by mouse on desktop,
   by dragging on touch. A layer at depth d moves d times as far as the ground, so
   far layers are drawn wider than the world (see the recipe boxes) to cover it. */
(function () {
  const S = window.SCENE;
  const stage = document.getElementById('stage');
  const world = document.getElementById('world');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OVERSCAN = 1.08;           // world drawn this much larger than the stage
  const els = [];

  stage.style.background = `linear-gradient(180deg, ${S.sky.join(', ')})`;

  function gulls(list) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    const [, , w, h] = S.layers.find((l) => l.svg === 'birds').box;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    list.forEach(([x, y, s], i) => {
      const g = document.createElementNS(ns, 'g');
      g.setAttribute('transform', `translate(${x} ${y})`);
      const p = document.createElementNS(ns, 'path');
      // a gull: two swept wings meeting at a small body, filled so it reads at a distance
      p.setAttribute('d', `M${-s} ${-s * 0.35} Q${-s * 0.45} ${-s * 0.5} 0 ${s * 0.12} Q${s * 0.45} ${-s * 0.5} ${s} ${-s * 0.35} Q${s * 0.45} ${-s * 0.2} 0 ${s * 0.3} Q${-s * 0.45} ${-s * 0.2} ${-s} ${-s * 0.35}Z`);
      p.setAttribute('class', 'st-gull');
      p.style.animationDelay = `${-(i * 0.37) % 1.4}s`;
      g.appendChild(p); svg.appendChild(g);
    });
    return svg;
  }

  function add(l) {
    const outer = document.createElement('div');
    outer.className = 'st-layer';
    const inner = document.createElement('div');
    inner.className = 'st-inner' + (l.anim && !reduced ? ' a-' + l.anim : '');
    if (l.origin) inner.style.transformOrigin = l.origin;
    if (l.svg === 'birds') inner.appendChild(gulls(S.birds));
    else {
      const img = new Image(); img.src = l.src; img.alt = ''; img.decoding = 'async';
      inner.appendChild(img);
      if (l.anim === 'shimmer') {
        const sh = document.createElement('i');
        sh.className = 'st-shimmer';
        sh.style.webkitMaskImage = sh.style.maskImage = `url(${l.src})`;
        inner.appendChild(sh);
      }
    }
    outer.appendChild(inner); world.appendChild(outer);
    els.push({ l, el: outer });
    return outer;
  }
  S.layers.forEach(add);

  const ref = add({ id: 'ref', src: 'reference.webp', box: [0, 0, S.world.w, S.world.h], depth: 1 });
  ref.classList.add('st-ref');
  document.getElementById('ref').addEventListener('change', (e) => ref.classList.toggle('on', e.target.checked));

  let sc = 1, range = 0, cam = 0, target = 0, raf = 0;

  function layout() {
    const W = stage.clientWidth, H = stage.clientHeight;
    sc = Math.max(W / S.world.w, H / S.world.h) * OVERSCAN;
    const ww = S.world.w * sc, wh = S.world.h * sc;
    world.style.width = ww + 'px'; world.style.height = wh + 'px';
    world.style.top = (H - wh) / 2 + 'px';
    range = Math.max(0, ww - W);
    els.forEach(({ l, el }) => {
      const [x, y, w, h] = l.box;
      Object.assign(el.style, { left: x * sc + 'px', top: y * sc + 'px', width: w * sc + 'px', height: h * sc + 'px' });
    });
    // first view: the recipe's opening framing (0 = left edge, 1 = right edge)
    const start = W < H ? (S.openPhone ?? 0.5) : 0.5;
    target = cam = Math.min(Math.max(cam || range * start, 0), range);
    paint();
  }

  function paint() {
    const mid = range / 2;
    els.forEach(({ l, el }) => { el.style.transform = `translate3d(${-mid - (cam - mid) * l.depth}px,0,0)`; });
  }

  function glide() {
    cam += (target - cam) * 0.12;
    paint();
    raf = Math.abs(target - cam) > 0.3 ? requestAnimationFrame(glide) : 0;
  }
  const aim = (x) => { target = Math.min(Math.max(x, 0), range); if (!raf) raf = requestAnimationFrame(glide); };

  // desktop: the mouse position across the stage picks the view
  stage.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') aim((e.offsetX / stage.clientWidth) * range);
  });
  // touch: drag to pan
  let drag = null;
  stage.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') drag = { x: e.clientX, c: target }; });
  addEventListener('pointermove', (e) => { if (drag) aim(drag.c - (e.clientX - drag.x)); });
  addEventListener('pointerup', () => { drag = null; });
  addEventListener('pointercancel', () => { drag = null; });

  addEventListener('resize', layout);
  layout();
})();
