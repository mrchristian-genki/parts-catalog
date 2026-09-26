# Trace a flat-colour origami PNG into layered polygons (base silhouette + colour regions on top).
# Output JSON: {size, bbox, fills:[hex...], layers:[{fill:i, geom: WKT}]}
import cv2, numpy as np, json, sys
from sklearn.cluster import KMeans
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union
from shapely.validation import make_valid
from shapely import wkt
src, out = sys.argv[1], sys.argv[2]
K = int(sys.argv[3]) if len(sys.argv) > 3 else 7
rgb = cv2.cvtColor(cv2.imread(src), cv2.COLOR_BGR2RGB).astype(float)
H, W = rgb.shape[:2]
nw = np.linalg.norm(rgb - 255, axis=2) > 22
km = KMeans(K, n_init=4, random_state=0).fit(rgb[nw][::15])
cnt = np.bincount(km.labels_, minlength=K); order = np.argsort(-cnt)
P = km.cluster_centers_[order]
d = np.stack([np.linalg.norm(rgb - c, axis=2) for c in P], 2)
lab = d.argmin(2); dmin = d.min(2); dwhite = np.linalg.norm(rgb - 255, axis=2)
sil = ((dwhite > 18) & (dmin < dwhite)).astype(np.uint8)
sil = cv2.morphologyEx(sil, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
sil = cv2.morphologyEx(sil, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
lab = np.where(sil > 0, lab, -1)
lab = cv2.medianBlur((lab + 1).astype(np.uint8), 7).astype(int) - 1
lab = np.where(sil > 0, np.maximum(lab, 0), -1)

IS_BASE=[False]
def geom(mask, eps, minarea):
    cs, hier = cv2.findContours(mask.astype(np.uint8), cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    if hier is None: return None
    hier = hier[0]; polys = []
    for i, c in enumerate(cs):
        if hier[i][3] != -1 or cv2.contourArea(c) < minarea: continue
        outer = cv2.approxPolyDP(c, eps, True).reshape(-1, 2)
        if len(outer) < 3: continue
        holes = []
        j = hier[i][2]
        while j != -1:
            if cv2.contourArea(cs[j]) >= minarea:
                h = cv2.approxPolyDP(cs[j], eps, True).reshape(-1, 2)
                if len(h) >= 3: holes.append(h)
            j = hier[j][0]
        p = make_valid(Polygon(outer, holes))
        # drop antialias slivers: thin strips along outlines (mean width under ~7 px)
        if p.length > 0 and 2 * p.area / p.length < 3.5 and not IS_BASE[0]: continue
        polys.append(p)
    return unary_union(polys) if polys else None

IS_BASE[0]=True
base = geom(sil > 0, 1.2, 200)
IS_BASE[0]=False
layers = [{'fill': 0, 'geom': base.wkt}]
counts = np.bincount(lab[lab >= 0].ravel(), minlength=K)
for i in np.argsort(-counts):
    if i == 0: continue
    m = cv2.morphologyEx((lab == i).astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    g = geom(m, 1.6, 60)
    if g is not None and not g.is_empty: layers.append({'fill': int(i), 'geom': g.intersection(base.buffer(1)).wkt})
fills = ['#%02x%02x%02x' % tuple(int(round(v)) for v in c) for c in P]
json.dump({'size': [W, H], 'bbox': [round(v) for v in base.bounds], 'fills': fills, 'layers': layers}, open(out, 'w'))
print(out, fills, [round(v) for v in base.bounds])
