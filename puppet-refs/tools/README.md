# Origami animal pipeline

How the traced papercraft animals in `js/origami-art.js` are made. Run in order:

1. **trace3.py** `<image.jpg> <name>.json [colours]` — traces one flat-colour origami image into
   layered polygons (a base silhouette plus one layer per colour). Default 7 colours.
2. **rigs/<name>.json** — the cut list for that animal: each moving part's polygon (`hull`), its
   hinge (`pivot`), a round overlap around the hinge (`cap`), parent part (head on neck, ears on
   head), and draw order (`z` < 0 = behind the body). Optional `erase` (e.g. the waves under the
   boat) and `recolor` (e.g. the hare's dapples).
3. **compile.py** `<name>` — cuts every part out of the art ahead of time and writes `out/<name>.json`.
   It reports leftover pieces ("ISLAND") so a cut that stops short is caught.
4. **gen.py** — bundles every `out/*.json` into `js/origami-art.js` for the scene and the catalog.

Motion lives in `js/creatures.js` (search "origami puppets"): each animal's behaviours (graze,
walk, hop, howl…), travel speed and seasonal coat swaps. `runtime.js` here is a copy of that
section for reference. Copy the same `creatures.js` and `origami-art.js` to both the scene and the catalog.
