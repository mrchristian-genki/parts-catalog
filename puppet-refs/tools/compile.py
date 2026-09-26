# Compile traced layers + a rig spec into pre-cut part geometry (no runtime clipping).
import json, sys, math
from shapely import wkt
from shapely.geometry import Polygon, Point, box
from shapely.ops import unary_union
name = sys.argv[1]
T = json.load(open(f'{name}.json')); R = json.load(open(f'rigs/{name}.json'))
parts = R['parts']
PAD = 3   # px overlap across every seam, so antialiased edges never show a hairline
def poly(p): return Polygon(p).buffer(0)
layers = [(L['fill'], wkt.loads(L['geom'])) for L in T['layers']]
# optional art clean-up: erase regions (e.g. waves under the boat) and recolour spots
if R.get('erase'):
    er = unary_union([poly(e) for e in R['erase']])
    layers = [(f, g.difference(er)) for f, g in layers]
if R.get('recolor'):   # [{from, to, maxArea, within}] small shapes of one fill folded into another
    out = []
    for f, g in layers:
        for rc in R['recolor']:
            if f == rc['from']:
                within = poly(rc['within']) if rc.get('within') else None
                geoms = list(g.geoms) if hasattr(g, 'geoms') else [g]
                keep = [x for x in geoms if not (x.area < rc['maxArea'] and (within is None or within.contains(x)))]
                g = unary_union(keep) if keep else Polygon()
        out.append((f, g))
    layers = out
art = unary_union([g for f, g in layers])
bx = art.bounds
byname = {p['name']: p for p in parts}
def desc(n):
    out = [p for p in parts if p.get('parent') == n]
    for k in list(out): out += desc(k['name'])
    return out
cuts = {p['name']: poly(p.get('cut', p['hull'])) for p in parts}
regions = {}
for p in parts:
    g = poly(p['hull'])
    if p.get('cap'): cx, cy, r = p['cap']; g = g.union(Point(cx, cy).buffer(r, 24))
    if p.get('extra'): g = g.union(poly(p['extra']))
    kids = desc(p['name'])
    if kids: g = g.difference(unary_union([cuts[k['name']] for k in kids]))
    regions[p['name']] = g.buffer(PAD)
torso = box(bx[0] - 50, bx[1] - 50, bx[2] + 50, bx[3] + 50).difference(unary_union(list(cuts.values())))
# Slivers: thin strips of art left on the body along a cut line (an outline edge just outside a
# part's polygon) would stay behind when that part turns. Find them (art that an opening removes)
# and hand each to the nearest part.
tart = art.intersection(torso)
opened = tart.buffer(-7).buffer(7)
thin = tart.difference(opened.buffer(1))
moved = 0
for piece in (list(thin.geoms) if hasattr(thin, 'geoms') else [thin]):
    if piece.is_empty or piece.area < 20: continue
    near = min(parts, key=lambda p: cuts[p['name']].distance(piece))
    if cuts[near['name']].distance(piece) < 12:
        grab = piece.buffer(2)
        cuts[near['name']] = cuts[near['name']].union(grab)
        regions[near['name']] = regions[near['name']].union(grab.buffer(PAD))
        torso = torso.difference(grab); moved += 1
print('slivers moved', moved)
# Islands: pieces of body art cut off from the main body (a part's hull that stops short of the
# art's edge). They'd float in place while the part moves.
tb = art.intersection(torso)
comps = sorted(list(tb.geoms) if hasattr(tb, 'geoms') else [tb], key=lambda g: -g.area)
for c in comps[1:]:
    if c.area > 150: print('  ISLAND left on body:', round(c.area), [round(v) for v in c.bounds])
def d_of(g):
    if g.is_empty: return ''
    geoms = list(g.geoms) if hasattr(g, 'geoms') else [g]
    s = ''
    for pg in geoms:
        if pg.geom_type != 'Polygon' or pg.area < 4: continue
        pg = pg.simplify(0.6)
        for ring in [pg.exterior] + list(pg.interiors):
            c = list(ring.coords)[:-1]
            if len(c) < 3: continue
            s += 'M' + ' '.join(f'{round(x)} {round(y)}' for x, y in c) + 'Z'
    return s
def cutlayers(region):
    out = []
    for f, g in layers:
        d = d_of(g.intersection(region))
        if d: out.append([f, d])
    return out
def node(p):
    kids = sorted([k for k in parts if k.get('parent') == p['name']], key=lambda k: k.get('z', 0))
    return {'n': p['name'], 'p': p['pivot'], 'z': p.get('z', 0), 'L': cutlayers(regions[p['name']]), 'k': [node(k) for k in kids]}
top = sorted([p for p in parts if not p.get('parent')], key=lambda p: p.get('z', 0))
out = {'vb': [round(bx[0]), round(bx[1]), round(bx[2] - bx[0]), round(bx[3] - bx[1])], 'fills': T['fills'],
       'body': cutlayers(torso), 'parts': [node(p) for p in top]}
s = json.dumps(out, separators=(',', ':'))
open(f'out/{name}.json', 'w').write(s)
print(name, len(s) // 1024, 'KB', out['vb'])
