# Proposal (toolmaker lens): The Frame Press: a gesture-first frame engine and Frame Lab (Toolmaker lens)

> One of five competing proposals. Background for [the frame engine design](../frame-engine.md), which builds on the architect proposal with grafts from the others.

## Thesis

A frame is a small, closed set of **relations**, called *pins*, that hang every mark off a few dominant **tracks**. Tracks are anchored to the page box and to the content slots, and the page's real HTML lays out inside those slots. I designed the Frame Lab first. Each direct-manipulation gesture writes exactly one typed pin, never coordinates: dragging a leaf onto a sweep writes `sprout(sweep, golden(1), G2)`, and fanning seven lines writes `fan(count 7, spread uniform)`. So the document format, the evaluator and the validators are simply what those gestures need in order to be undoable, checkable and re-solvable at any size. All seven inspiration styles fit the same vocabulary: Track, Profile, Corner, Terminal, Punctuation, Subdivision, Order/Span, Inset, Cartouche and Layer. Style lives in a separate Theme layer of tokens, light and finish. One rule keeps the frame a real responsive layout system rather than a poster. **Layout parameters compile to CSS, drawing parameters run in TypeScript**, so width drives the frame through CSS, content height closes the frame through measurement, and the drawing never writes layout. A small shipped `frame-core` plus `frame-dom` renders the committed `*.frame.json`. The dev-only Lab never ships, following Theatre.js's core/studio split.

## Core concepts

### Structure (shared by every style)

| Term | Meaning | Victorian example | Mid-century example |
|---|---|---|---|
| **Page** | The root box: the host element's size. It is the only thing not pinned to anything. | – | – |
| **Slot** | A named content region that real HTML flows into (`main`, `nav`, `bay.2`, `cartouche.title`). Its horizontal geometry comes from CSS and its height from content. | text column between the rails | inner panel |
| **Track** | A dominant curve or edge with native arc length: line, rect-loop, arc, clothoid chain, log spiral or superellipse. Everything else is relative to a track. The Lab colours tracks gold. | medallion S-sweep, rail spine | the rect loop of the moulding |
| **Station** | A position on a track: `u` (0..1), `s` (arc length), `golden(k)` (u = φ^-k), a named anchor (`west`, `socket.stem.outer`), or an angle on a circle. | leaf at `golden(1)` on the sweep | chevron home position |
| **Pin** | A typed relation stored **on the child**. It is the only way anything gets positioned. The vocabulary is closed (see *relationships*). | `sprout`, `land`, `fan`, `gnomon` | `sweep`, `repeat`, `corner` |
| **Profile** | A cross-section recipe swept along a track: an ordered list of layers (fill stripe, rule, gap, hatch, bead row, tick lane, text lane, weave lane). Layers can expose a named **lane** where punctuation runs. | 2-line ribbon plus hairline rules | the 12 colour stripes |
| **Corner treatment** | What happens where tracks meet: `mitre`, `block` (rosette or stud block), `drawn` (a motif instance with sockets), `stepped` (deco), `rounded` (superellipse), `notched`, `cartouche`. | drawn medallion | pyramid-stud block |
| **Terminal** | What a track or lane does at an end: chevron, scroll end, socket hand-off, taper. | stems hand off to the weave | arrow points away from the block |
| **Punctuation** | Things placed along a lane. `repeat` (whole-number tiles), `ladder` (graduated major/minor ticks), `sequence` (an ordered list of different motifs), `centrepiece` (one item at a station). | bead band; crest at u=0.5 | travelling chevrons |
| **Subdivision** | A slot split into panels, bays or columns. Gutters are drawn as rules where the CSS grid actually placed them. | – | – |
| **Order / Span** | Order: base and capital stay fixed while the shaft stretches (its flutes fitted to a whole number). Span: an arch or lintel across a width. | – | – |
| **Inset** | A nested frame pinned inside a slot of another frame. It reuses the same machinery recursively. | – | inset frame with notched brackets |
| **Cartouche** | A drawn shape that **hugs live HTML text** in a slot (measured), with real text on top. | title cartouche | lettering in the top band |
| **Motif** | A reusable local drawing (leaf, chevron, stud, sprig) defined by its own small set of nodes, with **sockets** where strokes leave it. A **motif instance** places a motif with a pin. | acanthus leaf | chevron |
| **Layer** | Paint order plus `breaksFrame` (a sprig crossing the border), `knockout` (paper halo) and `overlap`. | over/under halos | – |

### Room (thresholds)
- **widthClass**: `compact` (<600), `medium` (600–1200) or `wide` (≥1200) CSS px. It is decided by CSS and decides which slots and tracks exist.
- **Room level z**, per slot: `z = log_φ(s / sRef)`. One step of z is a factor of ×1.618.
- **Variant**: a designed alternative for a slot (`medallion-l`, `medallion-s`, `block`).
- **Anchor**: a designed parameter set at a given z.
- **Switch**: a discrete change between anchors, with a hysteresis band.

### Theme (separate from structure)
- **Token**: a named colour (`teal`, `ink`, `paper`) emitted as a CSS custom property.
- **Ramp**: 3–5 shades of a token, used for bevel facets.
- **Light**: an azimuth and elevation. Facet shade comes from the facet normal compared against the light.
- **Finish**: `engraved`, `flat`, `blueprint`, `paper`, `shadow`.

### Motion
- A **Motion** is a parameter changing over time on the solved graph (`chevrons.top.phase`, `courier.u`). It has a **trigger** (`routeChange`, `firstVisit`, `focus`) and a **tier**: A (composited transform), B (dash or mask), C (re-solve).

### Checks
Press checks are invariants evaluated live in the Lab and in CI: hairline floor, minimum gap, offset below radius, collisions, G2 at joins, golden drift, text fit, contrast and motion duration.

## Document model

### Principles (derived from what the Lab gestures need)
- **One file per frame:** `frames/<id>.frame.json`, committed to git and validated by a JSON Schema generated from Zod. Session state (zoom, selection, preview size) is never written to this file.
- **Fixed section order:** `header, theme, params, rooms, profiles, motifs, slots, nodes, motions`. Nodes are a **flat map keyed by readable id**, sorted when written. `[x,y]` tuples are written on one line. Numbers are rounded to 4 decimals for units and 6 for ratios, with a trailing newline. The result is diff-friendly.
- **Positioning:** every node has one `pin` (its primary relation) plus typed args. A child stores its relation to its parent (Figma's model), so moving a parent never edits the children.
- **Values** are a literal, a param reference or a tiny arithmetic expression string, parsed by a hand-written parser into an AST (no eval). The language has:
  - numbers with units: `u`, `px`, `deg`, `%`
  - `phi`, `rung(x,k)` meaning x·φ^k, and `golden(k)` meaning a station at u = φ^-k
  - references such as `medR` and `sweep.outer.length`
  - operators `+ - * / ^` and the functions `min max clamp lerp sqrt`
- **Room-dependent values** use a top-level `room` expression only, in MapLibre style (`step` or `interpolate` over `z`, `widthClass` or `length`). This keeps every rule drawable as bars or a stops table.
- **Param kinds:**
  - `continuous`: may interpolate
  - `discrete`: steps only
  - `grow`: new lines are born from zero width
  - `locked`: φ constants; no room expression is allowed
  - `layout`: must compile to CSS, so it may use only `widthClass` steps or linear interpolation in container inline size
- **Per-node `algo: "v1"`:** when the maths is improved, committed art does not shift until the owner opts in. Migrations are ordered integer steps.

### Worked example 1: Victorian corner medallion, its ribbons, side leaf and flame corner
```json
{
  "$schema": "./frame.schema.json",
  "format": "parkington-frame", "formatVersion": 1,
  "id": "front-page", "theme": "ink-on-paper",

  "params": {
    "gutter":      { "kind": "layout", "unit": "px",
                     "room": ["step", ["room","widthClass"], 0, "medium", 96, "wide", 132] },
    "medR":        { "kind": "continuous", "value": 71.4, "unit": "u" },
    "ringK":       { "kind": "locked", "value": 0.5,  "note": "ring radius = medR·φ^0.5 (drawn: 1.20, φ^0.5 = 1.27)" },
    "stemGap":     { "kind": "continuous", "value": 11.5, "unit": "u" },
    "stemGapMid":  { "kind": "locked", "expr": "stemGap * phi" },
    "flameB":      { "kind": "locked", "expr": "ln(phi) / (pi/2)", "note": "golden quarter-turn spiral" },
    "fanCount":    { "kind": "discrete", "room": ["step", ["room","z"], 4, -0.75, 7] }
  },

  "rooms": {
    "corner": { "governs": "min", "sRef": 356, "hysteresis": 0.05,
      "anchors": [
        { "z":  0,   "variant": "medallion-l" },
        { "z": -1.5, "variant": "medallion-s", "params": { "flame.count": 4 } },
        { "z": -3,   "variant": "block" }
      ] },
    "rail": { "governs": "width", "sRef": 132, "hysteresis": 0.05,
      "anchors": [ { "z": 0, "params": { "rail.L.weave.strands": 2 } },
                   { "z": -1.2, "swap": { "rail.L.weave": "rail.L.doubleRule" } } ] }
  },

  "motifs": {
    "medallion": { "sRef": 356, "variant": "medallion-l",
      "sockets": {
        "stem.outer": { "at": ["20.1u", "300.3u"], "heading": "90deg" },
        "stem.inner": { "at": ["20.1u + stemGap", "300.3u"], "heading": "90deg" }
      },
      "nodes": {
        "disc":        { "type": "circle", "pin": { "local": [129.8, 130.6] }, "r": "medR" },
        "ring":        { "type": "arc", "pin": { "concentric": "disc" },
                         "r": "rung(medR, ringK)", "from": "-80deg", "to": "90deg" },
        "sweep.outer": { "type": "chain", "role": "dominant",
                         "start": { "sprout": "ring", "at": "end", "continuity": "G2" },
                         "pieces": [ { "clothoid": { "turn": "-140deg" } } ],
                         "end": { "land": "socket:stem.outer", "continuity": "G1" } },
        "sweep.inner": { "type": "offset", "pin": { "of": "sweep.outer" }, "d": "-stemGap" },
        "leaf.1":      { "type": "instance", "motif": "acanthus-leaf",
                         "pin": { "sprout": "sweep.outer", "at": "golden(1)", "side": "outer", "continuity": "G2" },
                         "scale": "rung(medR, -2) / 37.3u" },
        "fan.A":       { "type": "fan", "count": "fanCount",
                         "pin": { "between": ["sweep.outer", "sweep.inner"], "range": [0.15, 0.85] },
                         "converge": { "on": "disc", "at": "180deg" },
                         "spread": { "law": "geometric", "r": 1.12 },
                         "line": { "profile": "hairline-swell" } }
      } },

    "flame": { "sRef": 210,
      "nodes": {
        "spine":  { "type": "logSpiral", "role": "dominant",
                    "pin": { "local": [89, 1027] }, "b": "flameB", "r0": "45u", "sweep": "120deg" },
        "leaves": { "type": "gnomon", "motif": "flame-leaf", "pin": { "about": "spine" },
                    "count": 6, "step": "24deg", "orient": "tangent + 12deg", "scale": "similar" },
        "tips":   { "type": "check", "rule": "distance(leaves[*].tip, spine) < 0.05u" }
      } },

    "acanthus-leaf": { "sRef": 37.3,
      "nodes": {
        "front": { "type": "chain", "pieces": [ { "logSpiral": { "b": "0.306", "turn": "45deg" } },
                                                   { "logSpiral": { "b": "-0.306", "turn": "49deg" } } ] },
        "back":  { "type": "chain", "pieces": [ { "clothoid": { "turn": "67deg", "kappaPeak": "golden(1)" } } ],
                   "end": { "land": "front.end", "continuity": "G1" } }
      } },

    "side-leaf": { "sRef": 244, "symmetry": { "mirror": "y" } }
  },

  "slots": { "main": { "area": "main" }, "masthead": { "area": "head" } },

  "nodes": {
    "corner.tl": { "type": "corner", "treatment": "drawn", "motif": "medallion",
                   "pin": { "at": "page.tl" }, "room": "corner" },
    "corner.tr": { "type": "mirror", "of": "corner.tl", "axis": "page.centreX" },
    "corner.bl": { "type": "corner", "treatment": "drawn", "motif": "flame",
                   "pin": { "at": "page.bl" }, "room": "corner" },

    "rail.L":       { "type": "track", "shape": "line", "role": "dominant",
                      "pin": { "from": "corner.tl:socket.stem.outer", "to": "corner.bl:socket.top",
                               "inGutter": "railL" } },
    "rail.L.weave": { "type": "weave", "pin": { "on": "rail.L" }, "strands": 2,
                      "crossing": "38deg",
                      "period": { "prefer": "rung(stemGapMid, 3)", "fit": "whole", "half": true },
                      "ribbon": { "profile": "double-line", "width": "stemGap" },
                      "ends": { "start": ["corner.tl:sweep.outer", "corner.tl:sweep.inner"] },
                      "checks": ["amplitude < Rmin(rail.L)", "ribbon/2 < period^2/(4·pi^2·amplitude)"] },
    "rail.L.clasp": { "type": "instance", "motif": "side-leaf",
                      "pin": { "on": "rail.L", "at": "golden(1)", "snap": "weave.crossing" },
                      "layer": "over", "optional": true, "priority": 3 },
    "rail.L.doubleRule": { "type": "sweep", "pin": { "along": "rail.L" }, "profile": "double-rule" }
  }
}
```
Points to notice in this example:
- `leaf.1` holds the owner's sentence ("the leaf grows tangentially out of the sweep at the golden section") as data.
- `flame.leaves` puts the tips on a golden spiral **by construction** (gnomon copies), and `tips` is a regression check.
- The pending choice between a 2-ribbon twist and a 3-strand plait is the discrete param `strands`, which can itself be room-dependent.

### Worked example 2: mid-century moulding, stud corner blocks and travelling chevrons
```json
{
  "format": "parkington-frame", "formatVersion": 1, "id": "midcentury", "theme": "mcm-seven",
  "params": {
    "k":     { "kind": "layout", "unit": "px/u",
               "room": ["step", ["room","widthClass"], 0.55, "medium", 0.8, "wide", 1.0] },
    "pitch": { "kind": "continuous", "expr": "rung(profile.moulding.depth, -1.5)" }
  },
  "profiles": {
    "moulding": { "unit": "u", "scale": "k", "layers": [
      { "fill": "cream",  "w": 7 },   { "fill": "slate", "w": 3 },  { "fill": "teal", "w": 6 },
      { "fill": "cream",  "w": 5 },
      { "rules": { "count": 3, "w": 0.6, "gap": 0.9, "paint": "teal" } },
      { "fill": "mustard","w": 6.5, "lane": "chevron" },
      { "fill": "cream",  "w": 3.5 }, { "fill": "teal", "w": 3 }, { "fill": "cream", "w": 3.5 },
      { "fill": "brown",  "w": 3 },   { "fill": "sage", "w": 2 },  { "fill": "teal", "w": 4.5 }
    ],
      "drop": { "rules": { "below": "0.75devpx", "then": "merge-into-neighbour" } } }
  },
  "motifs": {
    "stud":    { "type": "bevelStack", "levels": 4, "ratio": "1/sqrt(2)", "token": "teal", "light": "theme" },
    "chevron": { "type": "polygon", "points": [[0,0],[0.6,0.5],[0,1],[0.25,0.5]], "fit": "lane" }
  },
  "slots": { "main": { "area": "main" }, "title": { "area": "head", "cartouche": "plaque" } },
  "nodes": {
    "outer":  { "type": "track", "shape": "rectLoop", "role": "dominant", "pin": { "inset": "page", "by": 0 } },
    "border": { "type": "sweep", "pin": { "along": "outer", "side": "inner" }, "profile": "moulding",
                "corners": { "treatment": "block", "motif": "stud", "size": "profile.moulding.depth" } },
    "chev.top": { "type": "repeat", "motif": "chevron",
                  "pin": { "lane": "border:chevron", "edge": "top",
                           "from": "corner.tl.blockEdge", "to": "page.centreX" },
                  "pitch": { "prefer": "pitch", "fit": "whole" }, "mirrorAt": "page.centreX",
                  "terminal": { "start": "arrow-out" } },
    "chev.sides": { "type": "repeat", "motif": "chevron", "pin": { "lane": "border:chevron", "edge": "left|right" },
                    "pitch": { "prefer": "pitch * phi", "fit": "whole" } },
    "inset.1": { "type": "inset", "pin": { "slot": "main", "by": "rung(profile.moulding.depth, -1)" },
                 "profile": "thin-teal-rule", "corners": { "treatment": "notched", "depth": "8u" } },
    "plaque":  { "type": "cartouche", "pin": { "slot": "title" }, "hug": "text", "pad": ["0.618em", "1em"],
                 "shape": "notchedRect", "profile": "plaque-rim" }
  },
  "motions": [
    { "id": "chevron-run", "trigger": "routeChange", "target": "chev.top.phase",
      "from": 0, "to": 1, "unit": "pitch", "duration": "0.62s", "easing": "engrave", "tier": "A",
      "reduced": "fade" },
    { "id": "courier", "trigger": "routeChange", "target": "traveller:chevron@outer.u",
      "from": "corner.tl", "to": "corner.br", "duration": "1.6s", "tier": "A", "reduced": "blink-at-end" }
  ]
}
```
The theme file `themes/mcm-seven.theme.json` contains:
```json
{ "tokens": { "mustard":"#cfaa6d", "teal":"#2c5763", "cream":"#f2e5c7", "brown":"#9d8a62",
              "slate":"#5f7771", "sage":"#a7a891", "sand":"#ddcfaa" },
  "light": { "azimuth": "-135deg", "elevation": "45deg" },
  "ramps": { "teal": ["#1d3d46", "#2c5763", "#3d7380", "#5a92a0"] },
  "finish": "flat" }
```
A chevron run shifts the repeat's phase by one pitch. On a straight lane that is a pure `translate` of the group under a clip, so the end state is identical to the start, it is composited, and it costs nothing.

### Brief example 3: architectural order frame (Beaux-Arts interior)
```json
"order.L": { "type": "order", "pin": { "slot": "pilasterL" },
             "base":    { "motif": "attic-base", "scale": "fixed" },
             "shaft":   { "profile": "fluted", "flutes": { "fit": "whole", "prefer": "rung(width, -2)" } },
             "capital": { "motif": "ionic-cap", "scale": "fixed" },
             "room": ["step", ["room","widthClass"], "thin-pilaster", "medium", "pilaster", "wide", "column"] },
"order.R": { "type": "mirror", "of": "order.L", "axis": "page.centreX" },
"arch":    { "type": "span", "pin": { "between": ["order.L:capital.top", "order.R:capital.top"] },
             "shape": { "room": ["step", ["room","z"], "lintel", -1, "segmental", 0, "semicircle"] },
             "profile": "archivolt", "keystone": { "motif": "keystone", "at": 0.5 } },
"bays":    { "type": "subdivision", "pin": { "slot": "main" }, "columns": "1fr phi 1fr", "gutter": "rule:balustrade" }
```

### Brief example 4: minimal card (Japanese menu)
```json
"card":   { "type": "track", "shape": "superellipseRect", "n": 4, "radius": "rung(16px, 0)", "pin": { "inset": "page", "by": "5%" } },
"edge":   { "type": "sweep", "pin": { "along": "card" }, "profile": "hairline" },
"blockA": { "type": "panel", "fill": "pink", "pin": { "inset": "card", "anchor": "tl", "w": "38.2%", "h": "61.8%" }, "layer": "under" },
"blockB": { "type": "panel", "fill": "sage", "pin": { "inset": "card", "anchor": "br", "w": "61.8%", "h": "38.2%" }, "overlap": "multiply" },
"sprig":  { "type": "instance", "motif": "sprig", "pin": { "at": "card.tr", "offset": ["-14%", "-9%"] },
            "layer": "above", "breaksFrame": true, "excludeFrom": ["slot:main"] }
```
The theme uses finish `paper` (a texture tile) plus `shadow`. The card itself is a CSS `filter: drop-shadow` on the host, not on each path.

## Relationships

### Expressed as pins: a closed vocabulary, each pin created by one gesture

| Pin | Gesture in the Lab | Stored as |
|---|---|---|
| `at` | drag onto a track; it snaps to stations and detents | `{on, at: u \| s \| golden(k) \| anchor \| angle}` |
| `sprout` | press S, then drag the child's base onto a parent | `{sprout, at, side, continuity: G0/G1/G2}`. The child inherits (point, θ, κ). |
| `land` | drag a curve's end onto a socket or track | `{land, heading?, continuity}`, solved as a G1 clothoid connector (Bertolazzi–Frego) |
| `offset` | Alt-drag a duplicate away from a curve | `{of, d}` |
| `fan` | press F, pick two guides or a guide plus a point, then scroll to change the count | `{between, count, converge, spread}` |
| `gnomon` / `copyAlong` | press C on a motif and pick a pole or spine | `{about, count, step, orient, scale: similar \| linear}` |
| `mirror` | press M and click an axis | `{of, axis}` |
| `repeat` / `ladder` / `sequence` / `centre` | drop a motif onto a lane in the Track lane view | `{lane, pitch: {prefer, fit}}`, `{major, minor, every}`, `[motifs]`, `{at}` |
| `sweep` | drop a profile onto a track | `{along, side}` |
| `span` / `order` | drag between two capitals or pilaster slots | `{between}` |
| `inset` / `slot` | drag a rectangle inside a slot | `{slot, by}` |
| `hug` | press H on a cartouche | `{slot, pad}` |
| `check` | right-click, then "Keep this true" | `{rule, tolerance, severity}` |

Each node has **one primary pin** plus at most a few secondary references (for example `fan.converge`). The structure is therefore a tree with cross-reference chips. The Lab shows it as an indented **Lineage outline**, not as a node graph, which avoids spaghetti.

### Solved by directed propagation and local solves only
- **Dependency graph:** edges come from pins, expression references and secondary references. Nodes are sorted topologically once at load. A cycle is refused at the moment of the gesture, never at render. The Lab explains it ("`fan.A` already depends on `leaf.1` via `converge`") and offers to **reverse** the pin or **bake** it.
- **Node-owned local solves**, each with warm start, an iteration cap, a NaN guard and a fallback to the last good value:
  - clothoid G1 connector for `land`
  - Spiro knot chains with a residual check and a Hobby fallback
  - fan convergence
  - whole-number repeat fitting
  - cartouche hugging text
- **No global constraint solver at runtime.** A genuinely mutual relation (for example two curves tangent to each other) is solved once in the Lab, optionally with planegcs, and baked into parameters. The relation is kept as a `check` so drift is flagged.

### Validated as press checks, at three levels
1. **Per node type** (built in): `offset |d| < Rmin`, weave `A < Rmin` and `h < λ²/(4π²A)`, κ continuity at G2 joins, minimum fan gap ≥ 1 device px at the smallest room, hull collisions, hairline ≥ floor, text overflow in a cartouche.
2. **User `check` nodes:** golden drift, symmetry, a tip lying on a spiral.
3. **Page level:** WCAG contrast of slot text against the fill beneath it, every motion shorter than 5 s, no `layout` param that cannot compile to CSS.

Checks run on every Lab write and on every proof cell. CI runs them again through a Node CLI at the proof-sheet sizes.

### Edited by direct manipulation, without writing equations
- **Pin chips:** selecting a node shows its pin as a chip on the canvas at the station, for example `⟂ sprouts · sweep.outer · 1/φ · G2`. You can:
  - drag the chip along the parent to change the station; φ-ladder detents click
  - drag it onto a different parent to re-pin; the gesture previews which dependents will move
  - click it to open the **Pin card** in the inspector, which has a station-law dropdown (`free u`, `arc length`, `golden(k)`, `anchor`) and a continuity selector
- **Handles:** each node type declares handles, and each handle names the 1–2 parameters it may change. A drag minimises |handle(params) − pointer|² over those parameters only. That is a 1-D golden-section search or 2-D Newton. Everything else is held (the Cassowary edit/stay rule). Locked params never move: the handle shows a padlock, and dragging past a detent shows the cost of breaking the lock.
- **Explain:** Alt-click any mark to get its breadcrumb back to the page box, for example `leaf.1 ← sweep.outer@1/φ ← lands on rail.L socket ← rail.L ← gutter railL ← page`. Hovering over a dominant curve tints everything that moves with it.
- **Detach / bake:** deleting a parent offers to bake its dependents to absolute local geometry, so nothing silently breaks.

## Curves

Rule: **every curve family is intrinsic**, described as θ(s) and κ(s) over its own arc length. Stations, offsets, travellers and G2 joins therefore all come from the same data. All of them go through one Bézier fitter to reach SVG, with tolerance set in device px.

| Job | Family | Why |
|---|---|---|
| Page edges, rails, panel rules, deco steps, rays | **line** / stepped polyline | Straight tracks make chevron runs a pure translate. |
| Medallion ring, arch (semicircle or segmental), studs, deco circles | **circle / arc**, emitted with SVG `A` (exact) | Arch radius follows width. Inside outlines, use arms of `4/3·tan(Δθ/4)·R`. |
| Medallion S-sweeps, ribbon centrelines, rococo flourishes, ribbon-banner bodies | **clothoid chain** built by a Cesàro turtle; knot-drawn sweeps via **Spiro** (`spiro` npm, Apache/MIT) | The drawing measured these as clothoids (R² 0.98). Curvature is monotone between knots and G2 by construction. |
| Stem lands on a socket with a fixed heading | **G1 clothoid connector** (Bertolazzi–Frego Newton, ≤5 iterations) | An exact landing without a global solver. |
| Flame tip curve, scroll curls, banner scroll ends, volutes, crest hooks | **log spiral** (closed form). b can be golden 0.30635 or one of Sharp's φ-derived steps (54°, 108°, 144°), or a free volute b with an eye circle of radius b·s | Gnomon copies land on it by construction. |
| Leaf sides | log-spiral or clothoid pieces; **LAC α "character" dial** later | Drawn leaves have curvature peaks in the middle of a cubic. Generated sides are truly golden. |
| Cartouche, jewel, rounded modern card, notched plaques | **superellipse** (Knuth 8-knot construction, n > 2) | Curvature is 0 at the vertices, so straight runs join it with G2. |
| Line families (fans, hatch, nested lines around an eye) | offsets of analytic spines, interpolation between two guides, or rotated copies about a spiral pole | Guarded by \|d\| < Rmin, so there are no cusps. |
| Weave strands | `spine + A·cos(2πs/λ + ψ)·n` with exact derivatives | The designer sets the crossing angle; A is derived as tan(angle/2)·λ/2π. |
| Live drag preview, Spiro failure | **Hobby** | Approximately G2. Never committed. |
| Illustrator sketches | `importedPath` with a fit report | Converted to one of the families above via "Measure & construct". |

The Lab can show the **curvature comb** of any curve and its **κ-plot**, a strip graph of κ against s. Mixing curve families is visible there as a jump in κ at a join. Choosing the right curve for the job is a dropdown on the chain piece, and the comb shows the consequence immediately.

## Golden ratio

### Enforced by construction, not by detection
1. **Locked parameters.** `kind: "locked"` values (`flameB = ln φ/(π/2)`, `stemGapMid = stemGap·φ`, `ringK = 0.5`) cannot take room expressions. Handles cannot move them. The inspector shows them with a padlock.
2. **Rung steppers.** Every size field has a "φ ladder" stepper (`rung(base, k)` with steps of ½ and 1) next to its free number. Arrow keys move along the ladder; Shift+arrow moves freely.
3. **Golden stations.** Tracks expose detents at u = φ^-1, φ^-2 and φ^-3 from either end. These are the default snap targets for `sprout` and `centre`.
4. **Gnomon copies.** Copying one master leaf by a single spiral similarity puts tips, bases and vein ends on one log spiral (Thompson's gnomon theorem). Choosing the golden b makes "the curve through the tips is golden" true exactly, with zero residual.
5. **Golden leaf sides.** Leaf master sides are generated log-spiral pieces with b locked to golden, not snapped cubics.
6. **Layout ratios.** Column ratios such as `1fr phi 1fr` compile to CSS grid. Inset depths are `rung(depth, -1)`. The room ladder itself steps by φ.
7. **Token scales.** Optional φ token scales for durations (0.38, 0.62, 1, 1.62 s) and spacing. These are presented honestly as a convention, not as a perceptual law.

### Where φ is not imposed (following the drawing analysis)
- Fan spacing defaults to `uniform`. The drawing measured uniform spacing, or geometric spacing with r ≈ 1.1–1.15. φ spacing is a choice on the dial.
- Medallion limbs stay clothoids. Forcing a golden spiral on them costs 1.3u RMS and looks wrong.
- Volutes may use their own b.
- The crest heart uses 1/√2.

### Escape hatches
- **Free with drift readout:** any locked value can be unlocked, with a required note. A gold badge then shows the drift, for example "ring 1.20 vs φ^0.5 1.272 (−5.7%)".
- **Tolerance checks:** `check: golden(...) within 2%` accepts near-golden hand values and flags anything further off.
- **Measure & construct.** The Lab fits a sketch, reports free and golden fits ("free b 0.49 RMS 0.21; golden RMS 0.39, max 0.69u"), shows displacement ghosts and switches to construction only when you click. It never infers φ silently. A look-elsewhere note is shown, because any ratio lies within 12% of some power of φ.

## Thresholds

### Model: two tiers of room
- **Page tier (CSS).** A widthClass of compact, medium or wide decides which **slots and tracks exist**. For example, compact has no side gutters, so the rails move into the bottom band or become rules. It also sets `layout` params: gutters, band thickness, profile scale `k`. These compile to CSS, so the layout never waits for JS.
- **Slot tier (JS).** Each slot has a room level `z = log_φ(s/sRef)` from its measured governing size: `min(w,h)` for corners, width for rails, height for bands. z picks the **variant** and its parameters.
  - Length (rail run, page height) drives **counts only**: whole repeats, weave periods, flute counts. It never drives variant choice.
  - Device px drives hairline floors and the merging or dropping of lines. Pinch-zoom never changes the variant.

### Rules
- **Anchors:** 2–4 designed parameter sets per slot, placed more densely at the small end.
- **Interpolation:** continuous params interpolate between adjacent anchors only while all discrete params agree (the compatibility rule).
- **Switches:** where discrete params differ, a switch sits at the log-midpoint between the anchors by default, and can be dragged.
- **Overrides:** a pinned override at any z beats interpolation.
- **Hysteresis:** switches have a hysteresis band of ±0.05 z (Schmitt trigger). A fresh load picks canonically, so reloads are deterministic.
- **Evaluation order:** existence (with visibility parents: a collapsed corner hides its whole subtree), then topology, then continuous params, then weights with floors, then collisions resolved by `priority` and `optional`, with fallbacks tried in order.
- **Generalisation operators:** eliminate, typify (fewer beads or leaves in the same rhythm), collapse (ribbon becomes a rule), simplify (fewer fan lines), exaggerate (thicker hairline), swap (arch becomes lintel, column becomes thin pilaster, medallion becomes block, stepped corner becomes mitre).
- **Count versus size:** an optional α dial splits lost room between element count and element size (0.5 is the radical-law preset).
- **Publishing the variant:** the chosen variant is written back as `--pf-corner: medallion-s` and `data-variant`, so CSS style queries can adapt nearby typography.

### Authoring in the Lab
- **Room strip** (ScaleMaster-style; one per slot, docked at the bottom):
  - rows are elements and discrete params; the x-axis is z on a log scale with φ ticks
  - phone, tablet, laptop and desktop markers show where real devices land
  - coloured bars show each variant's range; the hysteresis band is hatched
  - switch handles can be dragged, and you can add a short note at each switch
- **"Fork variant here":** scrub to a z where press checks go red, press `⇧V`, and the current variant is duplicated as a new anchor. You then edit it (drop the fan, collapse the ribbon), and the switch appears at the log-midpoint.
- **Stops table:** any param can be promoted from a constant, to a stops table with a value-against-z mini-plot, to a raw expression (an escape hatch only).

### Preview
- **Proof sheet** (contact sheet), generated from the rules:
  - one cell per anchor
  - **two cells at each switch**, just below and just above the hysteresis band
  - the clamped extremes
  - device presets
  - every cell carries press-check badges
- **Sweep button:** animates z from minimum to maximum on the big board to catch pops. A toggle switches between live behaviour (with hysteresis) and canonical behaviour.

## Animation

### Model: motion is time-varying parameters of the solved frame
There is no separate animation layer. A Motion record is `{id, trigger, target param path, from, to, duration, easing (CSS linear() string), tier, reduced}`. State is stored relative to tracks (`u` or `s`), never in px. A resize therefore re-solves the geometry and keeps `u`.

### Hooks that exist from M1, although motion ships late
- Every curve exposes `length`, `pointAt(s)`, `tangentAt(s)` and `curvatureAt(s)`.
- Every mark has a stable id and its s-range on the parent track.
- Ribbon pieces keep their over/under order and halos.
- The attachment graph exports a topological order, which construction replay uses.
- Anything movable renders as `<g transform>` or a small HTML wrapper, never `<use x y>`, which Chromium will not composite.

### MotionDirector (in `frame-dom`), three tiers
- **A (composited):** a traveller sampled at uniform s, giving 64–128 WAAPI `transform` keyframes with `offset = s/L`. Repeat-phase runs on straight lanes are a single translate under a clip.
- **B (paint):** `pathLength=1` dash windows. Filled outlines use a mask reveal per ribbon piece, shifted by the piece's start s.
- **C (geometry):** one rAF loop that re-solves only the downstream subgraph, within a measured budget, and falls back to B or A if it runs over.

### First motions, in order
1. **Chevron run** (Tier A): on `routeChange`, the mid-century chevrons advance one pitch (0.62 s). The end state is identical to the start.
2. **Courier** (Tier A): an arrow leaves its medallion socket, rides the ribbon strand at constant arc-length speed, is masked under crossings and docks at the far corner (≤1.6 s).
3. **Focus glow** (opacity only): hovering or focusing a nav link highlights its punctuation node on the track.
4. Later, **construction replay** on first visit (dominants draw first, and each dependent starts when its parent's pen passes its station), plus ink pulse, weave ripple (C) and flame unfurl.

### Rules
- Every motion is event-triggered, finite and under 5 s. There are no ambient loops.
- `prefers-reduced-motion` turns each motion into its `reduced` variant (fade or blink), and there is a per-viewer "still engraving" toggle.
- When the document is hidden, the director pauses and commits end states.
- On resize, a running motion finishes instantly and the frame re-solves.
- When the frame crosses a threshold, it cross-fades (~250 ms) and never morphs across a topology change.
- Route changes use a same-document View Transition on **content only**. The frame is excluded from the raster snapshot, and frame motions fire after `updateCallbackDone`, once the frame has re-solved for the new height.

### In the Lab
- Motions are edited on the **Track lane**: the same unrolled arc-length lane used for punctuation gets a time axis.
- Lab tools: scrub, replay, a reduced-motion preview, the proof sheet playing the same motion at every size, and a ms-per-frame meter for each tier.
- The Lab keeps a small typed-params-plus-keyframes model in the style of Theatre.js. Theatre itself is not a dependency.

## Frame Lab

### Layout of the Lab (`/lab.html`, dev server only)
```
┌──────────── toolbar: V select · K knot pen · S sprout · F fan · C copy/gnomon · M mirror · R repeat · L ladder · T profile probe · X measure&construct · H hug ───────────┐
│ LINEAGE (left)        │ DRAWING BOARD (centre)                                │ INSPECTOR (right)               │
│ page                  │  live frame at chosen size, real or dummy content     │ Pin card · Shape card (φ ladder)│
│  ├ corner.tl ★        │  overlays: Ink | Construction | Slots | Press check   │ Room card (stops/bars)          │
│  │  └ sweep.outer ★   │  pin chips, handles, detents, curvature combs         │ Style card (tokens)             │
│  ├ rail.L ★ …         │  room scrubber [z ◀────●────▶] widthClass pills       │ Checks for selection            │
├───────────────────────┴───────────────────────────────────────────────────────┴─────────────────────────────────┤
│ DOCK tabs: Proof sheet │ Room strip │ Track lane (unrolled) │ Press check │ History                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
Other benches, opened from the top tabs:
- **Profile bench:** a cross-section ruler. Stripes are bars you drag to resize, palette chips set fills, and lanes can be named.
- **Motif bench:** on-curve knot pen with Spiro point types (corner, g2, left/right), sockets and a symmetry axis.
- **Theme bench:** tokens, ramps, a light-direction dial, finish previews and a dark/blueprint swap.
- **Site preview:** the real routes in an iframe with the live frame, plus route-change playback.

### A session, minute by minute
- **0:00 Open.** `npm run dev` and open `/lab.html`. Pick `front-page.frame.json`. The board shows the page at 1280×900 and the proof sheet strip shows 8 cells: anchors, switch edges and devices. Two cells carry red badges.
- **0:02 "This leaf should grow tangentially out of that sweep at the golden section."**
  - Select the leaf (currently an imported instance floating in place) and press **S**. Gold tracks light up, and every track shows small ticks at 1/φ, 1/φ² and ½.
  - Drag the leaf's base towards `sweep.outer`. Within 12 px it snaps on, rotates to the tangent and bends its first piece to match curvature. A **G2** badge appears.
  - Drop it on the 1/φ detent; it clicks. The chip reads `⟂ sweep.outer · 1/φ · G2 · outer`.
  - Press **Tab** to flip the side. Alt-drag along the sweep to leave the detents; the readout changes to `u 0.583 (≠1/φ)`.
  - Release. History gains one entry: *Sprout leaf.1 from sweep.outer*.
- **0:05 "These seven lines should fan with a logical spread."**
  - Shift-select `sweep.outer` and `sweep.inner` and press **F**. A ghost fan of 5 lines appears; scroll the wheel to 7.
  - Click the leftmost point of the medallion disc; it snaps to anchor `west`, and the lines converge there.
  - The inspector shows the **spread comb**, a 1-D strip of tick marks for the gaps, set to `uniform`. Switch to `geometric` and drag the last tick: r reads 1.12.
  - Turn on the press-check overlay. At the smallest proof cell, two gaps fall below 1 device px and glow orange. Click the badge: it offers "Make count room-dependent". Accept, and the Room strip gains a `fanCount` row with bars 7 and 4, the switch at z −0.75.
- **0:09 "The curve through these tips should be golden."**
  - Lasso the six flame leaves and press **X** (Measure & construct). The fit report shows a circle at RMS 0.88, a free log spiral with b 0.49 at RMS 0.21, and a golden spiral at RMS 0.39 (max 0.69u). The leaves are detected as similarity copies, but with linear scales.
  - Choose *Construct as golden gnomon*. Ghost arrows show each tip moving, and a table lists per-tip displacement and the new geometric leaf scales (0.875 per 25° step).
  - Toggle before/after with **`**. Click Apply: one undo step. A `check` node is added, and `flameB` becomes locked with its padlock showing.
- **0:13 "A different corner when there's less room."**
  - Drag the room scrubber left. At z −1.4 the medallion collides with the masthead slot (pink overlap) and the hairlines fall below the floor.
  - Press **⇧V** (Fork variant here) and name it `medallion-s`. In that variant, delete the side fan (it is greyed out, not removed, in the other variants), collapse the inner sweep to a rule with **⌘K "collapse"**, and set leaves to 3.
  - The Room strip shows `medallion-l` ending and `medallion-s` starting at the log-midpoint z −0.75, with a hatched hysteresis band. Drag the switch to −0.9 and type the note "fans illegible on phone".
  - The proof sheet regenerates with cells at −0.95 and −0.85 on either side of the switch. Click **Sweep** and watch for pops.
- **0:18 Mid-century profile from the trace.**
  - Open the Profile bench, import `websiteOutline.svg` as a faint underlay, and use **T** (probe) to draw a line across the left border.
  - The probe reads colour runs, clusters the wobbly edges, snaps each run to the nearest palette token and proposes 12 stripes (cream 7, slate 3 …) with "rules ×3" detected. Accept, then nudge widths with the φ-ladder steppers.
  - Name the mustard stripe as lane `chevron`, then drop the chevron motif onto that lane in the **Track lane** view (the border unrolled into a straight strip). Repeat fitting snaps to whole counts, and the count number flickers only at the switch you allowed.
- **0:24 Corner block.** In the Motif bench, choose bevelStack with 4 levels and ratio 1/√2, then turn the light dial. Facets re-shade from the teal ramp live. Switch the theme to `blueprint` to confirm the structure re-skins without edits.
- **0:28 Motion.** In the Track lane, add a motion to `chev.top.phase` from 0 to 1 over 0.62 s with the `engrave` easing. Press play; preview reduced motion; the meter shows Tier A at 0.1 ms.
- **0:31 Save.** Press **⌘S**. The dev middleware validates against the schema and writes `frames/front-page.frame.json` with deterministic formatting. The site tab hot-reloads, and git shows a readable diff.

### Robustness features
- **Undo:** immer patches. A drag is a mark, then squash on pointerup, or bail on Escape. Session state (zoom, selection, preview size, room scrub) is never undone. The Figma rule (undo, copy, redo leaves the document unchanged) is a test.
- **Validation everywhere:** every write is validated. A bad expression turns the field red and the board keeps showing the last good solve.
- **Explain / dependents:** Alt-click shows the breadcrumb; hovering a dominant curve shows what moves with it.
- **Content in the board:** dummy content of several lengths, or a live route, so height-closing behaviour is always visible.
- **Import:** Illustrator SVG pastes in as `importedPath` underlays. Illustrator is never round-tripped.

## Engine architecture

### Packages (one repo, `packages/`; plain TypeScript; no Vue)
```
frame-core   (shipped, target ≤ 35 KB gz)  types, expression parser, evaluator, curve kernel, node-type registry,
                                           room resolver, profile sweeper, fitter → Scene
frame-svg    (shipped, ~5 KB)              Scene → SVG DOM, keyed patching; theme tokens → CSS custom props
frame-dom    (shipped, ~8 KB)              <pp-frame> custom element: slot publishing, ResizeObserver, route hooks,
                                           MotionDirector
frame-css    (build-time Vite plugin)      compiles `layout` params + slots → frames/<id>.css (grid areas, clamp())
frame-lab    (dev only, never bundled)     editor UI, Zod schema, handles/drag inversion, proof sheet, fit/import,
                                           save middleware (configureServer, apply:'serve')
frame-tools  (Node CLI)                    proof-sheet renders, snapshot tests (tolerance), schema gen, migrations
```

### The node-type registry is the core abstraction, derived from what the Lab needs
```ts
interface NodeType<A, G> {
  kind: string                           // 'chain' | 'fan' | 'gnomon' | 'weave' | 'sweep' | 'repeat' | ...
  args: ArgSpec<A>                       // drives inspector rows, units, φ-ladder steppers, param kinds
  inputs(a: A): NodeId[]                 // edges for the DAG
  evaluate(a: A, inp: Resolved, ctx: Ctx): G      // pure; local solves inside, with status+residual
  handles?(g: G, a: A): Handle[]         // each names ≤2 params it may change
  drag?(h: Handle, p: Vec, init: G, a: A): Partial<A>  // drag inversion (edit/stay)
  checks?(g: G, a: A, ctx: Ctx): Issue[]
  marks(g: G, a: A, theme: Theme): Mark[]          // paint-ready, with stable ids and s-ranges
  stations?(g: G): Station[]             // snap targets / detents
  motionTargets?: string[]               // e.g. 'phase', 'u', 'reveal'
}
interface Curve { length: number; pointAt(s): Vec; tangentAt(s): number; curvatureAt(s): number;
                  endState(): {x,y,theta,kappa}; fittable(): Fittable }
```
The Lab adds no special cases. The board, inspector, snapping and checks all read from this registry.

### Pipeline (per host element)
1. **Layout (CSS):** `frames/<id>.css` places slots with `grid-template-areas`, band thicknesses come from `clamp()` and `cqi`, and `scrollbar-gutter: stable`. Content lays out.
2. **Measure:** a ResizeObserver on the host and on slot elements gives `{W, H, slotRects, devPx, widthClass}`. Results are coalesced into one rAF.
3. **Room:** compute each slot's z, quantise it to 1/32, and apply hysteresis to get the variant key.
4. **Structure:** the active node set, visibility parents and discrete counts. These are cached by `(slot, variantKey, counts)`.
5. **Geometry:** evaluate the DAG in topological order with a version-stamped lazy memo (the Preact "signal boosting" algorithm, about 150 handwritten lines). Epsilon equality on outputs stops propagation. A change in page height only dirties vertical tracks and the repeat fits on them.
6. **Paint:** profiles are swept into filled stripes, variable-width outlines are built, theme tokens are resolved to `var(--pf-*)`, and bevel facets are shaded.
7. **Fit and emit:** a phase-1 fitter (equal-turn subdivision with arc-correct arms) gives the tolerance in device px. A keyed patch rewrites only the changed `d` attributes.
8. **Publish:** the host gets station custom properties (`--pf-station-nav-1-x`) and `data-variant` for CSS and HTML anchoring.

### Solver policy
The engine uses a DAG plus node-owned local solves:
- clothoid G1 Newton
- Spiro with a residual guard and a Hobby fallback
- 1-D searches for fits

Lab-only options are planegcs and bake, Penrose-style evening of spacing then bake, and kiwi only if linear layout inequalities ever appear.

### Determinism
- No `Math.random`; a seeded PRNG only where jitter is wanted.
- Fixed iteration counts.
- Output rounded to 2–3 decimals.
- `algo` versions pinned per node.
- Snapshot tests run in Node with a tolerance and are never compared bit-for-bit.

### Performance targets (to measure in the Lab, not promises)
- Under 4 ms for a full width re-solve of the Victorian page.
- Under 1 ms for a height-only change.
- Fewer than 2,000 SVG nodes. Profiles are one path per stripe per side, and repeats use `<use>` only for static items.
- Animated nodes number in the tens.

## Rendering

### Layers inside `<pp-frame>`
1. **Paper layer:** a CSS background on the host: token colour plus an optional `paper` texture tile. The tile is a 256 px PNG or WebP generated once in the Lab, never `feTurbulence` at runtime.
2. **Static frame SVG:** absolutely positioned, `aria-hidden="true"`, `pointer-events:none`. It contains groups in paint order: `fills` (profile stripes, panels, bevel facets), `under` (ribbon pieces passing under), `halos` (paper knockouts), `over`, `punctuation`, `breakout` (elements above content, such as the sprig).
3. **Content:** real HTML in the CSS grid slots, including cartouche text, which stays a real `<h1>` or `<h2>`.
4. **Motion overlay:** a few absolutely positioned HTML wrappers with tiny SVGs for travellers, so they are composited in every engine.
5. **Optional hit layer:** transparent paths with `pointer-events:stroke` for hover along tracks, mirrored to focusable links in the HTML.

### Finishes (in the theme; structure unchanged)
- **engraved:**
  - every line is a filled outline with a width profile (swell or taper), filled nonzero
  - hairline floor of 0.5–0.75 CSS px, with lines merged or dropped below 1 device px of gap
  - an optional *static* ink-gain filter on ≥2× DPR screens only
- **flat:** filled stripes with no strokes and seams snapped to device px, to avoid hairline gaps between adjacent fills. Adjacent stripes overlap by 0.5 px under the next stripe.
- **bevel:** each facet's shade index is `round(lerp over ramp by dot(n, L))`, computed in core and emitted as `var(--pf-teal-2)`. Changing the light direction is a re-paint, not a re-solve.
- **blueprint:**
  - a token swap (paper becomes deep blue, ink becomes pale) plus a grid-paper pattern on the paper layer
  - inverted bands are just profile layers with `fill: ink` and text `paper`
  - ruler ticks are `ladder` punctuation
  - running border text uses `<textPath>` on a track, with a visually hidden HTML copy if the text is meaningful
- **paper / shadow:** the texture tile plus a CSS `filter: drop-shadow` on the card host, applied once.

### Theming and modes
Tokens are CSS custom properties, so dark mode, blueprint and print are CSS swaps with no re-solve. `@media print` re-renders at print size with hairlines at physical-minimum weights.

### Accessibility
- Decoration is `aria-hidden`.
- Real text lives in slots and cartouches.
- Nav links anchored at stations are ordinary links in DOM order.
- Focus rings are drawn by CSS, and the punctuation highlight is an extra cue only.
- Contrast is checked for each slot against the fill beneath it.
- Reduced motion is honoured.

## Site integration

### Host
A framework-free custom element:
```html
<pp-frame frame="front-page">
  <header data-frame-slot="masthead"><h1>Parkington Programs Studio</h1></header>
  <nav data-frame-slot="nav">…</nav>
  <main data-frame-slot="main"><!-- RouterView --></main>
</pp-frame>
```
- The document is imported statically (`import doc from '@/frames/front-page.frame.json'`) so there is no fetch flash, and Vite hot module reload updates it when the Lab saves.
- At build time the Vite plugin generates `front-page.css` with grid areas, `clamp()` band thicknesses and widthClass media or container queries. **First paint therefore has the final layout before any JS runs**, and there is zero layout shift: the SVG fills in a frame later.
- The engine never changes slot sizes. It only reads them. Content height closes the frame through ResizeObserver.

### Two directions without feedback loops
- **Width → frame:** CSS-compiled `layout` params.
- **Content → frame:** measured height and slot rectangles feed vertical tracks, repeat counts, and gutter rules drawn exactly where the grid placed them.
- **Text → cartouche:** measured text sets the cartouche width.
- The drawing never writes back to layout. The Lab enforces that `layout` params use only widthClass steps or linear functions of container inline size (cqi).

### Routing
- `router.afterEach` calls `frame.signal('routeChange', {from, to})`.
- An optional per-route `mode` switches between declared slot sets, for example a narrower article column. A mode change is discrete and cross-fades.
- A same-document View Transition animates content only, with the frame excluded from the snapshot.

### Leaving Vue
Step by step:
- **M1:** `SiteChrome.vue` and `Frame.vue` are replaced by a thin wrapper that renders `<pp-frame>` around `<RouterView>`. The current `frameEngine.ts` and `frameSettings.ts` stay behind a flag until parity, then are deleted.
- **Long term:** the frame has no dependency on Vue. The owner can keep Vue for content (TipTap and Supabase admin are Vue-heavy) or later move public pages to Astro with Vue islands, without touching frames.
- I recommend deciding this after M3, once the frame is no longer a reason to stay on or leave Vue. It remains a pending owner decision.

### Lab hosting
`lab.html` is a separate Vite input that only the dev server serves (`apply:'serve'`). The production build excludes it, and a test asserts that no `frame-lab` module appears in `dist`.

## Roadmap

Each milestone ends with something visible on screen. Flat styles come first because they prove the frame works as a layout system. Curves come next, then thresholds, and animation last.

| # | Milestone | Visible deliverable |
|---|---|---|
| **M0** (1–2 wk) | Schema v1 (Zod), expression parser, evaluator skeleton, `track(line/rectLoop)`, `sweep(profile)`, `corner(block/mitre)`, flat theme, Node CLI proof renderer | Proof-sheet SVGs of the **mid-century moulding** with stud blocks at 6 sizes, from a hand-written JSON |
| **M1** | `<pp-frame>`, `frame-css` plugin, slots as grid areas, ResizeObserver height closing, keyed SVG patch, the hooks motion will need (stable ids, s-ranges, no `<use x y>`) | The real blog running inside the mid-century frame on phone and desktop, alongside the old Vue frame behind a flag |
| **M2** | Lab v0: board, lineage, inspector with φ steppers, proof sheet, save middleware, undo (patches/marks), Profile bench with the **probe** reading `websiteOutline.svg` | The owner edits stripes in the browser, presses ⌘S, and sees the site update; diffs are clean in git |
| **M3** | Punctuation: `repeat` with whole fit, `ladder`, `sequence`, `centre`; Track lane view; terminals (chevrons); corner treatments notched, stepped and rounded (superellipse); `inset`; `cartouche` hugging text | Blueprint (ruler ticks, inverted band, panel grid) and deco (stepped corners, spine sequence) frames from the same engine; a mid-century title plaque around live text |
| **M4** | Curve kernel: intrinsic line, arc, clothoid and log spiral; Cesàro turtle; Gauss–Legendre; phase-1 fitter; guarded offsets; weave ported from the spike with analytic strands; curvature comb overlay | **Victorian rails weaving** down a live page; G2 combs visible in the Lab |
| **M5** | Pins on canvas: `sprout`, `land` (clothoid connector), `fan`, `gnomon`, `mirror`; handles with drag inversion; detents; Explain breadcrumb; checks panel; Measure & construct | The medallion rebuilt relationally (ring, sweeps, fan, leaf at 1/φ) and the **golden flame** shown next to the drawn one with its displacement report |
| **M6** | Room: per-slot z, anchors, switches, hysteresis, Room strip, Fork variant, proof sheet with switch edges, `order` and `span` (arch to lintel) | Phone corners (`medallion-s`, `block`), the Beaux-Arts pilaster/arch frame collapsing to thin pilasters and a lintel |
| **M7** | Theme bench: tokens, ramps, light dial, finishes (engraved outlines with floors, blueprint swap, paper, shadow), layering and break-out; minimal card | One structure re-skinned in three finishes; the Japanese menu card with the sprig crossing the edge |
| **M8** | MotionDirector Tier A, chevron run and courier on route change, reduced motion, visibility pause, View Transition integration, Track lane motion keys | Chevrons step and arrows ride their tracks when you change tab |
| **M9** | Tier B/C: construction replay, ink pulse, ripple, unfurl; Spiro knot pen in the Motif bench; Illustrator import fit; optional planegcs bake; kurbo fit port | The first visit "draws itself" in attachment order |

The pending owner decisions are parameters, not blockers. Plait versus twist is `strands`. A bottom garland is just an extra track. The Vue question can wait until after M3.

## Risks

- **Scope:** seven styles plus a Lab is a lot for a solo student. *Mitigation:* the shared vocabulary means each style after mid-century reuses 80% of the code. Flat styles ship first. Each milestone is usable on its own, and the Lab grows only the panels the current milestone needs.
- **The Lab outgrows the site.** Editors become infinite projects. *Mitigation:*
  - one registry drives the UI, so there are no bespoke panels per node type
  - hand-editing JSON in VS Code with the generated schema is always a valid fallback
  - Lab v0 is deliberately ugly
- **Layout feedback loops and flicker.** *Mitigation:* the hard rule that layout params compile to CSS, so the drawing never writes layout; `scrollbar-gutter: stable`; hysteresis; canonical selection on load. **Trade-off:** some designs where decoration sizes depend on content are not allowed (for example a band thickening with the length of an article).
- **Numerical fragility:** Spiro has no convergence flag and can produce wild loops; clothoid Newton can fail; offsets can cusp. *Mitigation:* status and residual on every solve, the last-good fallback, guards as checks, and a deliberately small set of curve families.
- **Constraint-solver temptation.** Mutual relations will come up. *Mitigation:* refuse cycles at gesture time, then offer reverse or bake. **Trade-off:** some "both ways" relationships need a bake step and are not live.
- **Golden overreach:** forcing φ where the drawing is clothoid or uniform looks wrong. *Mitigation:* φ only by construction where it is meaningful, drift readouts, and honest fit reports.
- **Performance on long pages:** weave and fan outlines at every resize. *Mitigation:* height-only re-solves, quantised z, caches by variant key, a node budget, and the Lab meter. Not yet measured.
- **Safari compositing of SVG children is unconfirmed.** Travellers use HTML wrappers instead.
- **Accessibility drift:** decorative text on `textPath` or in cartouches could hide meaning. *Mitigation:* the rule that meaningful text lives in HTML, plus a contrast check per slot.
- **Format churn:** early schema changes break saved frames. *Mitigation:* integer migrations, fixtures in CI, `algo` pinning, and keeping unknown fields on load.
- **AI-written code quality:** a non-programmer owner cannot easily review solver code. *Mitigation:* closed-form unit tests (for example a golden turn's chord = 38.4346), snapshot proofs, and small pure modules.
- **Editor patent:** a value-against-room graph editor resembles Mapbox patent US10416866. It is probably irrelevant for a private tool, but the Lab's primary UI is bars and a stops table, which is worth noting before publishing the Lab publicly. This is not legal advice.
- **Traced-art probe:** wobbly traced edges may cluster badly. The probe always proposes and never applies silently.

## Novelty

- **Gestures are relations.** Snapping, fanning, sprouting and copying in the Lab write typed pins, not coordinates. The file reads like the owner's own sentences ("sprouts from the sweep at 1/φ, G2"), and every frame re-solves at any size because nothing is stored as an absolute position.
- **The frame is the layout system, without loops or layout shift.** Layout parameters compile to CSS grid and `clamp()`, drawing parameters run in TS, content height closes the frame by measurement, and gutter rules are drawn exactly where the grid placed them. Few ornament engines treat the border as the page's layout source, and this does so in a way that is safe in real browsers.
- **One vocabulary for very different styles.** A mid-century moulding, a Victorian garland, a blueprint ruler border, a deco spine, a Beaux-Arts order and a quiet card are all Track + Profile + Corner + Punctuation (+ Order/Span, Inset, Cartouche, Layer), re-skinned by a Theme with lighting computed from facet normals.
- **The unrolled Track lane.** Every track can be straightened into a lane where profile layers, punctuation rhythm (repeat, ladder, sequence) and motion keyframes are edited on the same arc-length axis. Animation along a track is therefore a natural extension of the same editor, not a separate tool.
- **Proofs and press checks.** Contact sheets are generated from the threshold rules (anchors plus both edges of every switch). Validators are named after print-shop checks (hairline floor, gap, cusp, G2, golden drift, contrast). This fits the engraved, printed sensibility and makes room behaviour visible all at once.
- **Measure & construct.** Sketches turn into exact constructions through honest fits with displacement ghosts. A golden flame comes from gnomon copies (tips on the spiral by construction), never by hunting for φ in a drawing.
- **The profile probe.** It reads a traced Illustrator border into a palette-snapped stripe profile with one drag, so the owner's existing artwork becomes engine data.
- **Motion as parameters of the solved geometry.** Travellers ride real arc-length tracks, are masked under weave crossings, and survive resizes, using browser-native composited animation with no third-party animation runtime.
