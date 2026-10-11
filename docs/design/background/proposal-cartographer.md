# Proposal (cartographer lens): Neatline: a cartographic frame engine and the Neatline Studio (Frame Lab)

> One of five competing proposals. Background for [the frame engine design](../frame-engine.md), which builds on the architect proposal with grafts from the others.

## Thesis

Treat every page as a printed map sheet. Historic sheets were already frame-first designs: a neatline, a collar of graduated ticks, cartouches with real lettering, inset maps and corner pieces, all laid out before the map was drawn. Neatline separates a frame into three layers, the way a web map does. The **plan** holds the solved geometry: tracks, regions and stations computed from relationships, the way a map holds roads and rivers. The **symbology** holds style layers that draw those features: swept profiles, punctuation along tracks, corner treatments, motifs and labels. The **theme** holds palette, lighting and finish, and swapping it re-skins the frame with no geometry recompute. Each slot (corner, rail, band) gets its own "zoom", a room level z = log_φ(slot size / reference size). A declarative style with step/interpolate expressions on z decides what is drawn, and generalisation operators (eliminate, typify, collapse, merge, swap) plus a priority order decide what gives way when room runs out. The frame is also the layout system. A width-only pass writes a CSS grid that real HTML flows into, and a second pass measures that content and closes the frame around it, with no feedback loop. One engine can then produce the owner's banknote garland, a mid-century moulding, a blueprint dashboard, a Beaux-Arts bay, an art deco spine or a quiet card, and the Frame Lab works like a map studio where the designer edits relationships, cross-sections and room rules directly.

## Core concepts

### The metaphor, and where it stops

| Map studio concept | Neatline concept | What it means for a frame |
|---|---|---|
| Map sheet, neatline, collar | **Sheet**, **neat** track, **collar** bands | The host element, its outer frame line, and the bands between frame and content |
| Source data (vector tiles) | **Plan**: features solved from relationships | Geometry of tracks, regions and stations, computed from the room each time |
| Feature geometry types: line, polygon, point | **Track**, **Region**, **Station** | Curve with arc length; area (content slot, panel, band); point with a local frame on a track |
| Road classification (motorway → track) | **Rank** 1-4 | Rank 1 = dominant functions that stretch through the page. Rank sets default weight, draw order, priority and what generalisation removes first |
| Style layers (line, fill, symbol, text) | **Symbology layers**: `profile`, `fill`, `punctuation`, `corner`, `motif`, `label`, `ribbon` | How each feature is drawn |
| Road casing (stacked lines of different widths) | **Profile** | Cross-section recipe swept along a track: lines, gaps, flat stripes, hatch, bead rows, tick rows, text lanes |
| Symbol placement along a line (`symbol-spacing`, `line-center`) | **Punctuation** modes `repeat`, `graduated`, `sequence`, `single`, `ends` | Beads, ruler ticks, the deco spine sequence, the crest or nameplate, chevron terminals |
| Bridge/tunnel casings | **Over/under with halo** | Weave crossings, ribbons passing behind clasps, knockouts |
| Text halo | **Knockout** | Paper-coloured clearance around an element that sits over lines |
| Hillshade (sun azimuth/altitude on surface normals) | **Bevel lighting** | Facet colour = facet normal against a light direction, classified into palette ramp steps |
| Zoom level | **Room level z** per slot | z = log_φ(s / sRef); one z step = ×1.618 |
| Basemap style swap (light, dark, satellite) | **Theme** | Palette tokens, ramps, light, finish (ink, flat, blueprint inversion, paper, shadow) |
| Generalisation (Roth, Brewer, Stryker operators) | **Generalise** stage | add/eliminate, typify (fewer repeats), collapse (double ribbon → rule), simplify (fewer fan lines), exaggerate (thicken hairline), merge (pinstripes → one stripe), swap (medallion → block) |
| Label collision and `symbol-sort-key` | **Priority + optional + fallback** | Inside one slot, lower-priority optional parts drop first, and fallbacks are tried in order. HTML content always wins |
| Inset map | **Inset frame** | A nested frame with its own corner treatment inside a region |
| Georeferencing a scan | **Registering a sketch** | Pin an Illustrator sketch under the live frame with 2-4 control points so you can trace and fit against it |
| Print layout composer | **Sheet layout** | Regions become CSS grid areas that real HTML flows into |

**Where the metaphor stops.**
- A map's data is given. Here the "data" is designed, so the plan is a relationship graph (a DAG), not imported features.
- Map zoom is one camera value. Here every slot has its own room level, and nothing pans.
- Maps do not lay out text columns. The two-pass layout contract is not cartography.
- Do not build a global label placer. Collisions are resolved per slot with a short priority list, because a frame has tens of competing pieces, not tens of thousands.

### Structural vocabulary shared by all styles

- **Track**: an arc-length-parameterised curve with point, tangent, normal and curvature at s. It is built from: `rect` (an offset of the sheet with named **joints**), `alignment` (road-design style: tangent / clothoid / arc / log-spiral segments, G2 by construction), `arc`, `logSpiral`, `spiro` (designer knots), `offset`, `arch`, `lane` (the centreline of one stripe of a profile), `weave` strands.
- **Region**: a polygon area. Kinds: `content` (a CSS grid area for HTML), `panel` (a ruled cell of a grid), `band` (between two tracks, such as the moulding or masthead), `cartouche` (a shape fitted around measured live text), `bay` (an architectural opening).
- **Station**: a point plus local frame on a track at u = s/L, at a crossing, at a joint, or at a motif's exported **socket**. Stations are what things attach to.
- **Profile**: an ordered cross-section of stripes in shared "parts" or px, each with a token colour, priority, optional `lane` name and a generalisation rule.
- **Joint and corner treatment**: what happens where tracks meet. The treatments are `mitre`, `block` (rosette or stud block), `motif` (medallion, flame, rococo flourish), `stepped` (deco ziggurat), `round` (superellipse, G2), `notch` (cut-corner bracket) and `none` (crossing rules).
- **Terminal**: the end treatment of a track or lane: chevron, scroll end, arrowhead, taper.
- **Punctuation**: symbols placed along a track by a rule:
  - `repeat`: whole-number fitted count, hysteresis
  - `graduated`: a major, mid and minor hierarchy, like ruler ticks
  - `sequence`: an ordered list of different motifs, as on the deco spine
  - `single`: one centred piece, such as the crest, jewel or nameplate
  - `ends`
- **Subdivision**: a panel grid, bays, columns. Gutters are features that can carry a profile (a rule, or a beaded rule).
- **Order**: an architectural stack of fixed base, stretching or fitted shaft, fixed capital, then entablature. An **arch** track spans whatever width the order leaves.
- **Motif**: a reusable parametric sub-plan (medallion, flame corner, side leaf, crest, stud block, sprig) with its own params, features, layers, exported sockets and room variants. Motifs are the "symbols" of the sprite, but they are solved, not stamped.
- **Layering**: paint order, knockouts or halos, `overlap: "break"` for elements that cross the frame (the sprig), and an above-content layer.
- **Rank**, **priority**, **optional**, **minZ/maxZ**: the generalisation controls.
- **Motion**: a time-varying parameter of the plan (a courier's u, a repeat phase, a reveal fraction). It is never pixels.

## Document model

### Files

```
frames/
  gazette.frame.json        # Victorian engraving frame (plan + symbology + room rules + motions)
  mcm.frame.json            # mid-century moulding
  blueprint.frame.json
motifs/
  medallion.motif.json  flame.motif.json  side-leaf.motif.json  stud-block.motif.json ...
themes/
  engraving-ink.theme.json  mcm-teal.theme.json  cyanotype.theme.json  washi.theme.json
profiles/                   # shared cross-sections (can also live inline in a frame)
schema/neatline.schema.json # generated from Zod, gives VS Code autocomplete
```

**Shape of a document.** It has a fixed section order: `format, id, extends, theme, symmetry, room, params, profiles, symbols, plan, layers, motions`.
- `plan` is a flat map keyed by readable ids. Each relationship lives on the child (`at`, `of`, `on`).
- Values are a literal, a `@param` reference, a unit string (`"0.75px"`, `"24deg"`, `"30vw"`) or an expression.
- Expressions are a small JSON subset of MapLibre expressions: `step`, `interpolate` (linear, exponential, cubic-bezier), `match`, `case`, `coalesce`, `let/var`, arithmetic, `["phi", k]` (φ^k), `["phi", k, x]` (x·φ^k), `["room", slot?, "z"|"length"|"aspect"|"devPx"]`, `["class"]` (page width class) and `["route"]` (data-driven by page).
- Room inputs may only drive a top-level `step` or `interpolate`, so every rule can be drawn as a stops table or a ScaleMaster bar.
- Lengths with no unit are **slot units**: a slot's geometry is authored at its reference size `sRef` and scaled by k = s/sRef. Line weights are usually `px` (screen units with floors), because geometry scales but ink weight should not (the optical-size rule).

### Worked example 1: Victorian corner medallion, its ribbons, the side leaf and the flame corner

```jsonc
// frames/gazette.frame.json (excerpt)
{
  "format": "neatline", "formatVersion": 1, "id": "gazette",
  "theme": "engraving-ink",
  "symmetry": "D2",                      // author top-left and left side; the rest are mirrors
  "room": {
    "classes": { "compact": [0, 600], "medium": [600, 1200], "wide": [1200, null] },
    "slots": {
      "corner": { "governs": "min",   "sRef": 300, "hysteresis": 0.05, "clamp": [-3, 1] },
      "rail":   { "governs": "width", "sRef": 72,  "hysteresis": 0.05, "clamp": [-2, 1] }
    }
  },
  "params": {
    "railW":  { "kind": "continuous", "unit": "px",
                "value": ["step", ["class"], 0, "medium", 52, "wide", 72] },
    "cornerS": { "kind": "continuous", "unit": "px",
                "value": ["min", ["*", "@railW", ["phi", 3]], "28vw"] }
  },
  "plan": {
    "neat":   { "kind": "track", "rank": 1, "rect": { "of": "sheet", "inset": "6px" }, "joints": "corner" },
    "rail.L": { "kind": "region", "band": { "of": "neat", "side": "left", "depth": "@railW" } },

    "tl": { "kind": "motif", "use": "medallion", "slot": "corner", "rank": 1,
            "at": { "joint": "neat.tl" }, "size": "@cornerS" },
    "bl": { "kind": "motif", "use": "flame", "slot": "corner", "rank": 2,
            "at": { "joint": "neat.bl" }, "size": ["phi", -0.5, "@cornerS"] },

    // The dominant function down the side continues the medallion's own sweep (G2 hand-off).
    "garland.L.spine": { "kind": "track", "rank": 1, "in": "rail.L",
      "alignment": {
        "from": { "socket": "tl.stem.mid", "match": "G2" },
        "to":   { "socket": "bl.stem",     "match": "G1" },
        "segments": [ { "clothoid": "solve" }, { "tangent": "solve" }, { "clothoid": "solve" } ]
      } },

    "garland.L": { "kind": "weave", "rank": 2, "spine": "garland.L.spine",
      // generalisation ladder: 3-strand plait > 2-ribbon twist > single double rule
      "strands": ["step", ["room", "rail", "z"], 1, -1, 2, 0.5, 3],
      "crossingAngle": "38deg",            // the engine derives amplitude A = tan(19deg)·λ/2π
      "ribbon": 4.2,                        // half-width checked against λ²/(4π²A)
      "period": { "fit": "whole", "target": ["phi", 1, "@railW"] },
      "ends": { "lock": "sockets", "ease": "clothoid" } },

    "clasp.L": { "kind": "motif", "use": "side-leaf", "slot": "rail", "rank": 3,
      "at": { "on": "garland.L", "crossing": "nearest", "u": 0.5 },
      "orient": "tangent", "attach": "G1", "knockout": "1.2px",
      "priority": 40, "optional": true, "minZ": -1 }
  },
  "layers": [
    { "id": "neat",    "type": "profile", "on": "neat", "profile": "gazette.triple-rule", "joints": "none" },
    { "id": "garland", "type": "ribbon",  "on": "garland.L",
      "edges": { "weight": ["interpolate", ["exponential", 1.618], ["room", "rail", "z"], -2, "0.9px", 1, "0.75px"] },
      "crossings": "over-under", "halo": "paper" },
    { "id": "corners", "type": "motif", "features": ["tl", "bl", "clasp.L"] }
  ],
  "motions": [
    { "id": "courier", "trigger": "routeChange", "target": "tl.dart.track",
      "path": ["tl.sweep.A", "garland.L.strand0", "bl.stem"], "from": 0, "to": 1,
      "duration": ["clamp", ["*", "@pathLength", "1.1ms"], "0.9s", "1.6s"],
      "easing": "engrave", "reduced": "blinkAtEnd" }
  ]
}
```

```jsonc
// motifs/medallion.motif.json (excerpt)
{
  "kind": "motif", "id": "medallion", "box": [360, 300],
  "params": {
    "R":     { "value": 60 },
    "ringK": { "kind": "continuous", "value": ["phi", 0.5], "law": "golden",
               "free": { "range": [1.1, 1.4], "badge": true } },     // drawn at 1.20
    "fan":   { "kind": "discrete", "value": ["step", ["room", "z"], 3, -1, 5, 0, 7] }
  },
  "features": {
    "pole":    { "kind": "station", "xy": [130, 131] },
    "ring":    { "kind": "track", "rank": 1,
                 "arc": { "centre": "pole", "r": ["*", "@R", "@ringK"], "from": "200deg", "sweep": "170deg" } },
    "sweep.A": { "kind": "track", "rank": 1, "alignment": {
                   "from": { "on": "ring", "u": 1, "match": "G2" },
                   "segments": [ { "clothoid": { "length": 135, "kappaEnd": 0 } },
                                 { "clothoid": { "length": 76, "headingEnd": "90deg" } } ] } },
    "sweep.B": { "kind": "track", "rank": 2, "offset": { "of": "sweep.A", "d": -11.5, "guard": "Rmin" } },
    "sweepLeaf": { "kind": "motif", "use": "acanthus-leaf", "rank": 3,
                   "at": { "on": "sweep.A", "u": 0.32 }, "attach": "G2", "side": "outer",
                   "scale": ["phi", -2], "rotate": "tangent+12deg", "priority": 30, "optional": true },
    "fanA":    { "kind": "family", "rank": 3, "between": ["ring", "sweep.A"], "count": "@fan",
                 "spacing": { "law": "uniform" }, "converge": { "on": "ring", "u": 0.15 } },
    "dart":    { "kind": "motif", "use": "dart", "at": { "on": "sweep.A", "u": 0.92 }, "orient": "tangent" }
  },
  "sockets": {
    "stem.outer": { "on": "sweep.A", "u": 1 },
    "stem.mid":   { "between": ["sweep.A", "sweep.B"], "u": 1 },
    "stem.inner": { "on": "sweep.B", "u": 1 }
  },
  "variants": [ { "when": ["<", ["room", "z"], -2], "swap": "medallion-block" } ]
}
```

```jsonc
// motifs/flame.motif.json (excerpt): golden by construction
{
  "kind": "motif", "id": "flame", "box": [120, 210],
  "params": {
    "b":      { "value": "@goldenB", "law": "golden",            // ln(φ)/(π/2) = 0.30635, locked
                "free": { "range": [0.2, 0.6], "badge": "drawn at 0.49" } },
    "leaves": { "kind": "discrete", "value": ["step", ["room", "z"], 3, -1, 4, 0, 6] },
    "dTheta": { "value": "24deg" }
  },
  "features": {
    "pole": { "kind": "station", "xy": [89, 1027] },
    "tips": { "kind": "track", "rank": 1,
              "logSpiral": { "pole": "pole", "b": "@b", "r0": 45, "theta0": "-60deg",
                             "sweep": ["*", "@dTheta", ["-", "@leaves", 1]], "eye": "G2circle" } },
    "leaf": { "kind": "motif", "use": "golden-leaf" },   // each side is a log-spiral arc with b = @b
    "leaves": { "kind": "copies", "rank": 2, "of": "leaf", "count": "@leaves",
                "rule": { "spiralSimilarity": { "pole": "pole", "b": "@b", "dTheta": "@dTheta" } },
                "tipOn": "tips" },
    "veins": { "kind": "family", "rank": 3, "from": { "station": "veinRoot" },
               "to": { "each": "leaves.notch" }, "minZ": -0.5 }
  },
  "sockets": { "stem": { "on": "tips", "u": 0 } }
}
```

### Worked example 2: mid-century moulding with corner blocks and travelling chevrons

```jsonc
// frames/mcm.frame.json (excerpt)
{
  "format": "neatline", "formatVersion": 1, "id": "mcm", "theme": "mcm-teal", "symmetry": "D2",
  "room": { "slots": { "side":  { "governs": "width", "sRef": 68 },
                       "block": { "governs": "min",   "sRef": 68 } } },
  "profiles": {
    "mcm.side": {
      "depth": ["step", ["class"], "28px", "medium", "48px", "wide", "68px"],
      "units": "parts",                   // measured from websiteOutline.svg, left side
      "floor": "1px", "dropBelow": "1.25px",
      "stripes": [
        { "fill": "cream",    "w": 7,   "p": 1 },
        { "fill": "slate",    "w": 3,   "p": 4 },
        { "fill": "deepTeal", "w": 6,   "p": 1, "lane": "chevrons" },
        { "fill": "cream",    "w": 5,   "p": 2 },
        { "pin": { "count": ["step", ["room", "side", "z"], 1, -0.6, 2, 0, 3],
                   "w": 0.6, "gap": 0.8, "fill": "deepTeal" }, "p": 6, "generalise": "merge" },
        { "fill": "mustard",  "w": 6.5, "p": 1, "lane": "finials" },
        { "fill": "cream",    "w": 3.5, "p": 3 },
        { "fill": ["shade", "deepTeal", 1], "w": 3, "p": 3 },
        { "fill": "cream",    "w": 3.5, "p": 3 },
        { "fill": "brown",    "w": 3,   "p": 5 },
        { "fill": "sage",     "w": 2,   "p": 7 },
        { "fill": ["shade", "deepTeal", -1], "w": 4.5, "p": 2 }
      ]
    },
    "mcm.thin": { "units": "px", "stripes": [ { "fill": "mustard", "w": 2 }, { "gap": 3 }, { "fill": "deepTeal", "w": 1 } ] }
  },
  "symbols": {
    "studBlock": { "kind": "bevelStack", "facets": "pyramid", "base": "deepTeal",
                   "rings": ["step", ["room", "block", "z"], 2, -1, 3, 0, 4],
                   "ratio": ["phi", -0.5] },                    // each nested square = φ^-½ of the last
    "chevron": { "kind": "path", "box": "lane", "d": "M0,-1 L1,0 L0,1 L0.38,0Z", "fill": "mustard" },
    "finial":  { "kind": "path", "box": "lane", "d": "...", "fill": "deepTeal" }
  },
  "plan": {
    "neat":     { "kind": "track", "rank": 1, "rect": { "of": "sheet", "inset": 0 }, "joints": "corner" },
    "moulding": { "kind": "region", "band": { "of": "neat", "sides": "all", "depth": "profile:mcm.side" } },
    "inset1":   { "kind": "track", "rank": 2,
                  "rect": { "of": "moulding.inner", "inset": ["phi", -3, "@mouldingDepth"] }, "joints": "corner" },
    "title":    { "kind": "region", "type": "cartouche", "in": "moulding.top", "align": "center",
                  "fit": "content", "html": "[data-nl=title]", "shape": "chamferedRect" },
    "main":     { "kind": "region", "type": "content", "in": "inset1.inner" }
  },
  "layers": [
    { "id": "moulding", "type": "profile", "on": "neat", "profile": "mcm.side",
      "joints": { "block": "studBlock" } },
    { "id": "chevrons", "type": "punctuation", "on": "neat#lane:chevrons", "rank": 2,
      "mode": "repeat", "symbol": "chevron", "pitch": ["phi", 1, "@laneW"], "fit": "whole",
      "between": "joints", "orient": "tangent", "terminal": { "start": "arrowhead" },
      "gap": { "around": "title", "pad": "6px" } },              // chevrons stop short of the cartouche
    { "id": "finials", "type": "punctuation", "on": "neat#lane:finials", "sides": ["left", "right"],
      "mode": "repeat", "symbol": "finial", "pitch": ["*", "@laneW", 6], "minZ": -1, "priority": 20 },
    { "id": "inset", "type": "profile", "on": "inset1", "profile": "mcm.thin", "joints": { "notch": "bracket" } }
  ],
  "motions": [
    { "id": "march", "trigger": "routeChange", "target": "chevrons.phase", "by": 1, "unit": "pitch",
      "duration": "0.62s", "easing": "engrave", "reduced": "none" }
  ]
}
```

```jsonc
// themes/mcm-teal.theme.json
{
  "palette": { "mustard": "#cfaa6d", "deepTeal": "#2c5763", "cream": "#f2e5c7", "brown": "#9d8a62",
               "slate": "#5f7771", "sage": "#a7a891", "sand": "#ddcfaa" },
  "ramps":   { "deepTeal": ["#1d4657", "deepTeal", "slate", "sage"], "mustard": ["brown", "mustard", "sand", "cream"] },
  "light":   { "azimuth": 315, "altitude": 45, "classes": 4 },   // hillshade for bevels, classified to ramp steps
  "finish":  { "kind": "flat", "paper": "cream", "texture": null, "shadow": null }
}
```

### Architectural order (brief)

```jsonc
"plan": {
  "bay": { "kind": "region", "grid": { "columns": [
            { "id": "pilL", "w": "order:pilaster" }, { "id": "main", "fr": 1 }, { "id": "pilR", "w": "order:pilaster" } ] } },
  "pilL.order": { "kind": "order", "in": "bay.pilL", "parts": [
      { "base": "attic-base", "h": "fixed" },
      { "shaft": "fluted", "h": "stretch", "flutes": { "fit": "whole", "pitch": 8 } },
      { "capital": ["step", ["room", "z"], "plain-cap", 0, "ionic-cap"], "h": "fixed" } ],
    "form": ["step", ["class"], "pilaster-thin", "medium", "pilaster", "wide", "column"] },
  "entablature": { "kind": "region", "band": { "above": "pilL.order.capital", "depth": ["phi", -2, "@bayW"] } },
  "arch": { "kind": "track", "rank": 1, "arch": {
      "spring": ["pilL.order.capital.top", "pilR.order.capital.top"],
      "form": ["step", ["room", "bay", "z"], "lintel", -1, "segmental", 0.5, "semicircular"] } },
  "lunette": { "kind": "region", "type": "content", "under": "arch", "clip": "arch" }
}
```

### Minimal card (brief)

```jsonc
"plan": {
  "card":   { "kind": "track", "rect": { "of": "sheet", "inset": "clamp(12px, 4vw, 40px)" },
              "joints": { "round": { "form": "superellipse", "n": 4, "r": "14px" } } },
  "blockA": { "kind": "region", "rect": { "of": "card", "anchor": "tl",
              "w": ["phi", -1, "@cardW"], "h": ["phi", -2, "@cardH"], "offset": ["-8px", "-8px"] } },
  "sprig":  { "kind": "motif", "use": "sprig", "at": { "joint": "card.tr" }, "overlap": "break",
              "layer": "aboveContent", "optional": true, "minZ": -1 },
  "body":   { "kind": "region", "type": "content", "in": "card.inner", "pad": ["phi", 1, "1rem"] }
},
"layers": [
  { "type": "fill", "on": "blockA", "fill": "pink", "blend": "multiply" },
  { "type": "fill", "on": "card", "fill": "paper", "texture": "washi", "shadow": "soft" },
  { "type": "profile", "on": "card", "profile": "hairline" }
]
```

### Persistence rules
- A deterministic writer: fixed key order, ids sorted, `[x, y]` tuples on one line, numbers rounded (3-4 decimals for units, 6 for ratios).
- An integer `formatVersion` with ordered migrations, and one fixture file per old version tested in CI.
- Unknown fields are kept on load. A `node.algo` field pins the algorithm version so committed art never shifts silently.
- Session state (selection, preview size, z scrub) is never written into the file.

## Relationships

### How relationships are expressed
Every relationship is stored on the child, as a small closed vocabulary rather than free code:
- **attach**: `at: {on, u | s | crossing | joint | socket}` plus `attach: G0|G1|G2`, `side`, `offset`, `orient: tangent|fixed|normal`, and `rotate: "tangent+12deg"`. This covers "the leaf integrated into the sweep of the medallion's line".
- **continue**: an `alignment` that starts from a socket with `match: G2`. This is how a medallion's sweep becomes the garland spine: the child inherits (x, y, θ, κ) at the hand-off.
- **offset / family**: `offset {of, d, guard}`; `family {between:[a,b] | from, count, spacing:{law: uniform | geometric(r) | golden}, converge}` for clustered lines with a logical spread.
- **copies**: `copyAlong`, `spiralSimilarity {pole, b, dTheta}`, `mirror`, `symmetry: D2|D1`, `repeatFit {pitch, fit: whole|half}`.
- **weave**: strands derived from a spine, with crossing parity giving over/under.
- **ratio**: any numeric can be `["phi", k, x]`, carry `law: golden` and lock.
- **layout**: regions `in`, `band {of, side, depth}`, `grid {columns, rows}`, `above/under`, `fit: content`.
- **assert**: `minGap`, `noCrossing`, `offset < Rmin`, `goldenPitch within 0.5%`, `tiles >= 1`, `hairline >= floor`, `inside region`, `clear of content`.

**Rank** marks the dominant functions (rank 1: the neatline, medallion ring and sweeps, garland spine, masthead rule). Everything of lower rank is placed relative to something of higher rank, and the validator warns when a rank-1 feature depends on a rank-3 one, which would be an inverted hierarchy.

### How relationships are solved
- The plan is a **directed acyclic graph**. Edges come from `of/on/at/from/to/in` and `@param` references. It is sorted topologically at load, and a cycle is a load error that names the loop.
- Evaluation is lazy and memoised with version stamps (the Preact "signal boosting" algorithm, hand-written in about 150 lines or via @preact/signals-core). Geometry outputs use epsilon equality, so an unchanged spine stops propagation.
- Small solves are owned by the node that needs them and bounded: a clothoid G1 fit between two posed sockets (Bertolazzi-Frego Newton, at most about 5 iterations), an alignment closing onto its end socket (Newton over 1-3 segment lengths), weave amplitude from crossing angle, whole-number repeat fits with hysteresis. Each returns `{value, status, residual}` and falls back to the last good value.
- There is no global constraint solver at runtime. Genuine mutual constraints (for example two circles tangent to each other and to a rule) are solved in the Lab, the numbers are baked into params, and an `assert` keeps checking them.

### How relationships are validated
The QA panel works like topology checks in GIS: each assert and each built-in guard becomes a badge on the feature and in the filmstrip.
- **Curvature guards**: `|d| < Rmin` for offsets, `w·κ < 1` for width outlines, the weave bounds `A < Rmin(spine)` and `h < λ²/(4π²A)`.
- **Continuity**: κ jump at every G2 join, shown with a curvature comb.
- **Golden readouts**: slope of ρ/s on spirals, measured ratio against the declared law.
- **Print floor**: hairline below the device-pixel floor, gap below one device pixel.
- **Layout**: an ornament overlapping a content region, unless it is `overlap: break`.
- **Repeats**: count below 1, and fit stretch beyond ±12%.

### How relationships are edited (in the Lab)
- **Select** a feature and the Relations panel shows "attached to sweep.A at u = 0.32, G2, outer side". Upstream parents are listed above and dependents below. Clicking a parent jumps to it.
- **Drag a station** along its parent and only u changes. Drag it onto another track: the track highlights (like snapping to a road in a map editor), and dropping re-parents it. Undo restores the old parent.
- **Handles** are declared per node type. Each handle names the 1-2 params it may change, and a drag solves `argmin |handle(params) - mouse|²` over those params only, holding everything else (Cassowary edit/stay semantics).
- **Snap targets**: stations, φ-ladder rungs (Shift steps by half-rungs), anchor angles and crossings. Locked params show a padlock, and their handles are absent.
- **Deleting a parent** offers "bake to absolute geometry" or "re-attach to...", so dependents are never silently orphaned.
- **Promote to relationship**: right-click a free value and choose "derive from..." to pick another feature's measure (for example, the leaf scale follows the medallion radius). The Lab writes the expression for you.

## Curves

### The right curve for the job
Every curve family is defined intrinsically, by θ(s) and κ(s) over its own arc length. Arc length is then native, G2 joins are a simple comparison of (x, y, θ, κ), and a moving courier can sample any track by s.

| Family | Where it is used | Why it fits |
|---|---|---|
| **Line** | Neatlines, profile stripes on straight runs, ruler ticks, mid-century moulding, deco steps, pilaster shafts | Exact. Most styles are mostly lines, which is why the first milestone can look finished without curves |
| **Circular arc** (SVG `A`, exact) | Medallion ring, bead dots, semicircular and segmental arches, oval cartouche ends, flame eye circle | Constant curvature; arches whose radius follows the span |
| **Clothoid / Euler spiral** (16-point Gauss-Legendre per sub-piece turning ≤ π/2) | Medallion S-sweeps (measured: κ linear in s, R² 0.98), garland spine transitions, easing a straight rail into a corner, ribbon ends locking onto sockets, rococo flourish limbs | Curvature ramps linearly. This is the highway and railway transition curve. Road alignment design (tangent, spiral, curve, spiral, tangent) is the authoring model for tracks, and an urban-planning student will recognise it |
| **Log spiral**, golden b = ln φ/(π/2) = 0.30635 (closed form) | Flame tip curve, leaf sides, scroll volutes ending in a G2 eye circle, sunburst-adjacent curls | Self-similar. Copying one leaf by a spiral similarity lands its tips on the spiral by construction |
| **Spiro** (npm `spiro`, wrapped with a residual check and a Hobby fallback) | Knot-drawn dominant sweeps where the designer wants on-curve knots rather than segment lengths | G2 splines from a few points; the check is needed because the library returns no convergence status |
| **Log-aesthetic curve** (later) | A "curve character" dial between clothoid (α = -1) and golden spiral (α = 1) | One family covers both |
| **Superellipse**, n ≈ 2.5-5 (Knuth's 8-knot construction) | Minimal-card rounded corners, jewel and cartouche outlines, oval cartouches in the blueprint header | κ = 0 at the vertices joins straight sides with G2, unlike CSS border-radius |
| **Sinusoidal strand offset** on any spine | Weave strands (2-ribbon twist or 3-strand plait), guilloché bands | Crossing angle, period and ribbon width are the designer's controls; amplitude is derived |
| **Offsets and families** | Double-line ribbons, line fans, nested rules, the inner lines of a profile on a curved track | Offset arc length is closed form (L + d·Δθ); guarded against cusps |
| **Rotated copies about a spiral pole** | Nested lines around a scroll eye | They never cross and space geometrically, which a parallel offset cannot do |
| **Polyline steps** | Art deco ziggurat corners, stepped nested rectangles | Steps are counted, φ-ratioed or uniform |
| **Hobby** | Live drag preview and fallback only | Approximately G2, fast |

### Output
- Everything is fitted to cubic Béziers at a tolerance in device px (about 0.1 px). Phase 1 uses equal-turn subdivision with arc-correct arms (chord / (3cos²(Δθ/4))), never the L/3 arms that are 50-9000 times worse. Phase 2 is a port of kurbo's area-and-moment fitter.
- Circles stay as SVG `A`.
- Log spirals are fitted for one sector and stamped by spiral similarity, so the self-similarity is exact.
- Engraved lines are filled variable-width outlines (p ± w(s)·n, filled nonzero), not CSS strokes.

### Style-dependent defaults
- **Victorian**: clothoid, arc and log spiral throughout.
- **Rococo poster**: clothoid flourishes.
- **Mid-century, blueprint, deco**: lines and steps, with arcs only in cartouches.
- **Beaux-Arts**: arcs (semicircular, segmental or three-centred basket arches) and lines.
- **Minimal**: superellipse.

The Lab's "curve type" dropdown on a segment always shows the curvature comb, so the designer can see why a clothoid reads better than an arc for a sweep.

## Golden ratio

### Principle
Phi is imposed by construction, never discovered in a drawing. Any ratio lies within 12% of some half-power of φ, so "detecting" phi proves nothing. Golden relationships are declared, generated exactly, and reported when overridden.

### Where it is enforced
1. **The room ladder.** z = log_φ(s / sRef), so every threshold sits on a φ grid by default and a z step means ×1.618. That ratio is inside the ×1.28-2.0 range that type, icon and map systems use.
2. **Layout proportions.** Column ratios such as `fr: ["phi", 1]` give main:aside = φ:1. Band depths, margins and inset distances are rungs on one ladder (`["phi", k, base]`), and a deco nested-rectangle stack steps by φ^-1 or φ^-½. Bay width to arch rise can use φ.
3. **Curves.**
   - The flame tip spiral: b is locked to 0.30635 and leaves are copies under one spiral similarity, so tips land on the golden spiral exactly. Leaf sizes then shrink geometrically (about 0.875 per 25° step) instead of linearly as drawn.
   - Leaf sides are generated as golden log-spiral arcs. The measured drawn sides sit at b = 0.21, 0.38 and 0.59, either side of 0.306.
   - Golden alternatives with other angular periods (φ per 54°, 108° or 144°, Sharp's table) appear in the dropdown for tighter curls.
4. **Motif internals.** Medallion ring = R·φ^½ (drawn at 1.20, so the change is +5u). Stem spacing middle/outer = φ (drawn at 1.467, +1.7u). The crest inner heart can be φ^-1 or the drawn 1/√2, chosen with a dial, not imposed. Stud-block squares nest at φ^-½.
5. **Profiles.** Stripe widths can optionally be quantised to rungs. The Lab's "rung snap" on the mid-century profile reports how far each measured stripe moves before you accept it.
6. **Time.** Motion durations come from a φ token scale (0.38, 0.62, 1.0 and 1.62 s). It is a token scale, not a perceptual claim.

### How it is enforced
- Params marked `law: "golden"` are **locked**: they have no handle, cannot take a room expression (kind `locked`), and show a padlock in the Lab.
- Generated copies carry exact ratios because they come from a transform, not from fitted coordinates.
- Snapping steps along rungs (Shift = half-rung).
- Validators show the live measured value against the law (for example "ρ/s slope 0.3063 ✓").

### Escape hatches
- Every golden param can be switched to `free` with a declared range. It then shows an amber "deviation" badge with the measured difference ("b = 0.49, tips move 1.6u RMS from golden"), so freedom is visible, not silent.
- The spacing law is a dial (uniform, geometric(r), golden), because the drawn fans are near-uniform and φ spacing would collapse the inner lines.
- **Fit-then-snap on imports**: the Lab fits a registered sketch, reports residuals, previews the golden version as an overlay, and only snaps when you accept it.
- `sqrt2`, `uniform` and custom laws exist, because the crest's 1/√2 copy and repeats such as the 9.00 scallop pitch are honest relationships too.

## Thresholds

### Model: two tiers of "zoom"
1. **Page width classes** in CSS: compact under 600 px, medium 600-1200, wide 1200 and up. These decide which slots exist. For example, a phone has no side gutters, so side rails collapse to the bottom band or vanish, and the garland may run along the bottom only. Height mostly drives counts, not variants.
2. **Per-slot room level**: z = log_φ(s / sRef), where s is the slot's governing size (corner: min(w, h); rail: gutter width; band: band height). Extra inputs:
   - `length` drives repeat counts only, never which variant is drawn
   - `aspect`
   - `devPx`, which drives the hairline floor and the merging or dropping of lines
   - `route`

z is clamped at the ends of the designed range rather than falling back to a default. Pinch-zoom never changes a variant, but browser zoom does, because it relayouts (the OpenType optical-size rule).

### Rules
- Every param declares a kind. **continuous** params interpolate (weights, swing, spacing, radii). **discrete** params use `step` only (leaf count, fan count, strands, motif variant, collapse). **grow** params are discrete, but new lines are born from zero width across the hysteresis band, which suits engraving better than a fade. **locked** params are φ constants.
- Elements have `minZ` (inclusive), `maxZ` (exclusive), `priority`, `optional` and an ordered `fallback` list.
- A collapsed parent hides its whole subtree (the Godot visibility-parent idea), so dependents never decide their own visibility.

### Anchors, not spaghetti
- The designer authors 2-4 **anchor** parameter sets per slot (for example z = -2, -1, 0, +1), with more of them and bigger changes at the small end, because the phone corner deserves the most design attention.
- Continuous params interpolate between adjacent anchors **only while all discrete params agree** (the SF Symbols compatibility rule, enforced by the validator).
- Where discrete values differ, the Lab inserts a `step` at the log-midpoint between the two anchors (the OpenType `rvrn` rule), and the designer can drag it.
- A **pinned override** at any z beats interpolation.

### Evaluation order per slot (Roth, Brewer and Stryker)
1. **Content**: which elements exist (min/maxZ, visibility parents).
2. **Topology and discrete params**, through a Schmitt trigger: switch up at t·φ^h and down at t·φ^-h, with h = 0.05 by default (about ±2.4%). On first load there is no history, so the choice is canonical and a reload is deterministic.
3. **Continuous params.**
4. **Weights**, with device-px floors. Weights stay constant in screen px, so small rooms get relatively heavier, simpler line work.
5. **Collisions**, by priority and padding: optional parts drop first, then fallbacks are tried in order. HTML content always wins.

Repeats and line families keep their **texture**: pitch stays near-constant in px and counts change, with an optional size-versus-count split α (α = 0.5 follows Töpfer's radical law). Integer repeat refits go through the same hysteresis.

### Generalisation ladders per style (the designer's starting presets)
- **Victorian**: 3-strand plait → 2-ribbon twist → plain double rule; full medallion (fans of 7) → fans of 5 → fans of 3 without the sweep leaf → `medallion-block`; flame of 6 leaves → 4 → 3 → a single scroll; crest with mantling → crest → jewel only.
- **Mid-century**: 12 stripes → pinstripes merged and sage/brown dropped → 5-stripe core; stud block 4 rings → 3 → 2; finials drop below z = -1; chevrons keep their texture (count falls, pitch holds).
- **Blueprint**: ticks graduated 3 levels → 2 → majors only; panel grid 3×2 → 2×3 → 1×n stack.
- **Beaux-Arts**: columns → pilasters → thin pilaster rules; semicircular arch → segmental → flat lintel; capitals ionic → plain.
- **Deco**: 4-step ziggurat corner → 2 steps → a square; the spine sequence drops its lowest-priority members but keeps its anchor motif; the sunburst's ray count is typified.
- **Minimal**: the sprig drops below z = -1; the two colour blocks merge into one.

### Authoring and preview
- **Promoting a param**: any param's "f(z)" button promotes it from a constant to a stops table to an expression (the Maputnik progression).
- **ScaleMaster strip** per slot: rows are elements and discrete params, the x-axis is z on a log scale with ticks at φ steps, and real device widths (360, 768, 1280, 1920) are mapped into the slot's z as markers. Coloured bars show variant ranges, break points are draggable, and each break can carry a short note.
- **Filmstrip** generated from the rules, not chosen by hand: one cell per anchor, one cell just below and one just above each threshold (including the hysteresis band), and one per clamped extreme. Each cell carries QA badges.
- **Sweep**: a button that animates z from min to max to catch pops.
- **Live/canonical toggle**: shows the hysteresis behaviour during a live resize against the canonical on-load choice.
- **Publishing back to CSS**: the engine writes the chosen variant to CSS as a custom property (`--nl-corner: "medallion-s"`), so container style queries can adapt nearby typography.

## Animation

### Model: motion is a time-varying parameter of the solved plan
A motion is data in the frame document:
`{id, trigger: firstVisit | routeChange | visibilityReturn | variantChange | hover | focus, target: param path, from/to | by, unit: u | pitch | fraction, duration, easing, order, reduced}`.

State is always stored relative to tracks (normalised u, or a pitch phase), never in pixels. A resize re-solves geometry and keeps u.

### Hooks built into the first milestones, though motion ships later
- Every track exposes length, pointAt(s), tangentAt(s) and curvatureAt(s).
- Rendered pieces have stable ids and know their s-range on the parent track.
- Ribbon pieces keep over/under order and halo.
- The plan exports a topological order.
- The renderer has a static SVG and a separate small motion overlay.
- Moving parts are a `<g transform>` or a small HTML wrapper, never `<use x y>`, because Chromium will not composite those.

### Runtime: one MotionDirector, three tiers
- **Tier A, compositor**: rigid travellers and phase shifts. Sample the track at uniform arc length (64-128 keyframes) and call `element.animate()` with transform keyframes at offset = s/L. The motion keeps running smoothly while the router renders the new page.
  - For a guaranteed composited traveller in Safari, use an HTML wrapper holding a tiny SVG.
  - For a straight band, the "march" motion translates the whole chevron group by exactly one pitch, so the end state equals the start state. It is clipped to the lane; test whether the clip blocks compositing.
- **Tier B, paint**: draw-in and ink pulse. Use `pathLength="1"` on spines with stroke-dashoffset windows. Filled outlines use a mask-reveal per ribbon piece, offset by the piece's start s, so a pulse is hidden correctly where the strand passes under.
- **Tier C, geometry**: true shape changes such as a weave ripple or a flame unfurl. One rAF loop driven by the timestamp re-evaluates only the subgraph downstream of the animated param and writes only the changed `d` attributes. It has a frame budget (about 4 ms, to be measured) and falls back to Tier B or A when over it.

### Vocabulary (rudimentary and in keeping with print)
- **Courier**: the owner's medallion arrows. The dart leaves its socket, rides sweep.A, then garland strand 0 down the side at constant arc-length speed, passes under crossings (a mask cut from the over-piece halos), and docks at the flame. It takes 0.9-1.6 s, scaled by path length.
- **March**: the mid-century chevrons advance one pitch along their lane. It takes 0.62 s and the end state is identical.
- **Construction replay**: first visit only. Rank-1 features draw in first, and each dependent starts when its parent's pen passes its attach u, so the relationships become visible. It takes 1.2-2 s.
- **Unfurl**: flame leaves appear in growth order under the spiral similarity.
- **Ink pulse**, **ripple** and a **rose-engine turn** of a guilloché band are later extras.
- **Settle**: a 250 ms cross-fade when a threshold swaps topology. Never morph across a topology change or an integer refit.
- **Hover/focus along a track**: the nav items live in a band region, and the focused item's track segment thickens (a continuous weight) or a small marker slides to it (Tier A). This also gives a visible focus indicator.

### Rules
- Every motion is event-triggered and under 5 s, with no ambient loops (WCAG 2.2.2).
- `prefers-reduced-motion` (read live with matchMedia) and a per-viewer "still engraving" toggle swap each motion for its `reduced` form (opacity blink, skip, or jump to end).
- On `visibilitychange` to hidden, pause and commit end states, and never queue motions.
- During a resize, finish any running motion instantly, re-solve, and rebuild the keyframes.

### Route changes
Use a same-document View Transition for the **content only**. The frame layer is named and excluded (`::view-transition-group(frame){animation:none}` with the old image hidden), because a raster snapshot of hairlines would stretch. After `updateCallbackDone`, re-solve for the new content height (the enclose pass), then fire the routeChange motions.

### Lab
A small Theatre.js-style timeline lane per motion (typed params, keyframes, JSON), with scrub and replay, a reduced-motion preview, the same motion played across the filmstrip sizes, and a per-tier ms-per-frame meter. No GSAP, Rive or Lottie: they add licence or plan issues, and none of them follows re-solved geometry.

## Frame Lab

### Neatline Studio: a map studio for frames (dev-only `lab.html`)

**Layout** (desktop, one screen):

```
┌ Toolbar: frame ▾ | theme ▾ | width class chips | route ▾ | Save (writes file) | Undo/Redo ┐
├ LEFT: Layers ────────┬ CENTRE: Sheet canvas ──────────────────────┬ RIGHT: Inspector ──────┤
│ Plan (features by    │ live frame around REAL site content         │ Properties (f(z) btn)  │
│  rank, eye/lock)     │ (iframe of the blog route, ?lab=1)          │ Relations (up/down)    │
│ Symbology layers     │ overlays: tracks, stations, regions,        │ Law & lock (φ)         │
│  (drag = paint order)│ collision boxes, curvature combs, golden    │ QA badges              │
│ Motifs, Profiles,    │ readouts, registered sketch underlay        │                        │
│ Theme tokens         │ handles on selected feature                 │                        │
├──────────────────────┴─────────────────────────────────────────────┴────────────────────────┤
│ BOTTOM dock (tabs): Room bar + ScaleMaster | Filmstrip | Profile editor | QA | Timeline | Graph │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Panels and editors
- **Sheet canvas**: the real blog route rendered in an iframe that runs the same frame-core and receives document patches over Vite HMR. You design around your actual articles. The viewport size is draggable, and overlays toggle with keys: T tracks, S stations, R regions, C combs, G golden readouts, K collision boxes, U underlay.
- **Room bar**: one z scrubber per slot with device markers, plus a Sweep button and a live/canonical toggle. Expanding a slot shows its **ScaleMaster strip**: elements as rows, variant bars, draggable breaks and notes.
- **Filmstrip**: generated cells at anchors and threshold edges, plus the device sizes, each with QA badges. Click a cell to jump the canvas there.
- **Profile editor** (Streetmix for mouldings): a cross-section diagram where stripes are blocks you drag wider or narrower and reorder. "+" adds a fill, line, pinstripe set, hatch, bead row, tick row (graduated) or text lane. Each stripe has a token swatch, priority and generalise rule. A live preview sweeps the profile along a straight test track, a corner and a curved test track. **Sample cross-section**: drag a line across a registered reference image, and the Lab reads the colour runs, snaps them to the nearest palette tokens and proposes stripes with widths.
- **Motif workshop**: edits a motif's sub-plan on its own canvas, showing poles, spiral guides, sockets and the hull. Tools:
  - **Register sketch**: place an Illustrator SVG or PNG and align it with 2-4 control points, like georeferencing.
  - **Fit**: select an underlay path, pick a family (or Auto), and see the residual report and a golden preview. Accept snaps it.
  - **Socket**: mark stroke exits that tracks can continue from. Existing hand-drawn.json sockets import directly.
- **Inspector**: properties with units and ranges. "f(z)" promotes a value to a stops table (Zoom, Value, rate dropdown: linear, exponential, cubic-bezier, step) with "convert to expression" as an escape hatch. The **Relations** section shows parents and dependents with jump links and re-attach and bake actions. The law selector covers golden (locked), free with range, sqrt2, uniform and geometric(r).
- **Theme editor**: palette tokens, ramps, hillshade azimuth and altitude with a live bevel preview, and finish toggles. "Apply this theme to every frame" shows a contact sheet of all styles, which tests the re-skin promise.
- **QA**: a list of asserts and guards with jump-to-feature; clicking one frames the failing area.
- **Graph** (read-only first): the dependency DAG coloured by rank, to spot an inverted hierarchy or spaghetti.
- **Timeline** (later milestone): motion lanes, scrub, reduced-motion preview.

### Interaction rules
- A drag is one undo step: mark on pointerdown, patches during the drag, squash on pointerup, Escape bails.
- Session state (selection, z scrub, preview size) is never undone or saved.
- Save writes `frames/*.frame.json` through a dev-only Vite middleware that validates with Zod before writing. Git is the long-term history.
- Templates: "New frame from…" Moulding, Engraving, Blueprint, Order, Deco, Card. Each is a working document to bend, never a blank page.

### A designer's session: building the mid-century frame from websiteOutline.svg
- **0:00** New frame from the Moulding template. The canvas shows the blog home page inside a plain two-stripe moulding.
- **0:02** Register sketch: drop websiteOutline.svg and click its top-left and bottom-right outer corners onto the neatline. It sits at 35% opacity under the live frame.
- **0:04** Profile editor: Sample cross-section. Drag across the left side of the sketch. The Lab proposes 12 stripes (7, 3, 6, 5, pinstripes, 6.5, 3.5, 3, 3.5, 3, 2, 4.5) snapped to the 7 tokens, and flags that two teals are shades of deepTeal and offers a ramp.
- **0:08** Mark the 6-wide teal stripe as lane `chevrons` and the mustard stripe as lane `finials`.
- **0:10** Joints: choose **block** and stud block. Rings 4, ratio φ^-½ (locked). Drag the hillshade azimuth until the bevels match the sketch.
- **0:15** Add punctuation on lane:chevrons: repeat, pitch φ × lane width, fit whole, arrowhead terminal at the block. Ask for a gap around the title cartouche.
- **0:18** Add the title cartouche region in the top band, `fit: content`. Type the real site title in the page, and the cartouche closes around the measured text.
- **0:21** Room bar: scrub the side slot down to the phone marker. The moulding is too heavy. Promote depth to f(z) with stops 28 / 48 / 68 px, set pinstripes to merge below z = -0.6, set sage and brown priority to low, and finials to minZ -1. The ScaleMaster strip shows the bars.
- **0:27** Filmstrip: one cell shows "hairline < 0.75 px at 360" on the pinstripe merge. Set the floor to 1 px and the badge clears. Another shows "chevron fit stretch 14%" near a threshold. Widen the hysteresis.
- **0:32** Add inset frame `inset1` with notched bracket joints, inset φ^-3 × depth.
- **0:36** Theme menu: switch to cyanotype to check the structure survives a re-skin, then switch back.
- **0:38** Save. The blog tab updates from the same file. Commit.

### A designer's session: the Victorian left side
- **Open** gazette and select the `tl` medallion. Turn on combs: sweep.A shows a clean linear curvature ramp.
- **Leaf**: drag the sweep leaf's station from u 0.32 to 0.36. It slides along the sweep and stays G2.
- **Garland**: select garland.L. On the rail's ScaleMaster, drag the 3→2 strands break to z = 0.4, and set the crossing angle with a handle on a crossing.
- **Flame**: open the flame motif with the drawing registered underneath. Fit tips → "golden b moves tips 0.39 RMS (free pole)". Accept. Leaves regenerate by spiral similarity.
- **Courier**: Timeline → add motion "courier", path sweep.A → strand0 → bl.stem. Play it at three filmstrip sizes, then check the reduced-motion preview.

## Engine architecture

### Packages (in-repo workspace, plain TypeScript, no framework)

```
packages/
  neatline-core/     # shipped. No DOM, no Zod, no solver.
    expr/            # hand-written JSON-expression parser/evaluator, typed param kinds, no eval
    geom/            # vec, intrinsic curves (line, arc, clothoid, logSpiral, LAC later), GL quadrature,
                     # alignments (Cesàro turtle), offsets/families, weave, superellipse, fitter → cubics,
                     # arc-length tables, spiro wrapper + hobby fallback
    plan/            # feature graph: load → DAG → lazy memo eval (version stamps), node-owned solves
    room/            # slot measures → z, hysteresis triggers, anchors → expressions, quantisation
    generalise/      # content → topology → continuous → weights → collisions (priority/fallback)
    symbolise/       # profiles swept along tracks, punctuation modes, joints/corners, motifs, bevel/hillshade
    layout/          # pass 1: width-only plan → CSS grid template + custom properties
    scene/           # output model: layers of pieces with stable ids + s-ranges
    render-svg/      # Scene → SVG string or keyed DOM patch
  neatline-dom/      # shipped. Custom element <nl-sheet>, ResizeObserver, probes, MotionDirector
  neatline-schema/   # Lab/CI/Node: Zod types → JSON Schema, migrations, deterministic writer
  neatline-cli/      # Node: render a frame at a bracket of sizes → SVG snapshots, CSS fallbacks
  neatline-lab/      # dev only: lab.html + Vite plugin (apply:'serve') for file writes
```

### Pipeline (per host element)
1. **Measure**: the host's inline size, width class and devicePixelRatio (re-read via matchMedia).
2. **Survey (pass 1, width only)**: evaluate the parts of the plan that depend only on width: rail and band depths, column ratios, corner sizes, arch rise, order part widths. Emit `grid-template-columns/rows/areas` and `--nl-*` custom properties on the host. This runs only when the width class or quantised z changes.
3. **Browser layout**: real HTML flows into named grid areas.
4. **Enclose (pass 2)**: invisible probe elements (one per region, placed in the same grid area) are measured. The engine solves the height-dependent parts: rail lengths, panel rules, gutter rules, cartouche shapes around measured text, and repeat counts. **Pass 2 never writes layout-affecting styles**, so ResizeObserver cannot loop.
5. **Generalise**, in Roth order per slot.
6. **Symbolise**: profiles, punctuation, joints, motifs and labels become scene pieces.
7. **Render**: keyed patch of the static SVG layers, plus the motion overlay and HTML label layer.

### Incrementality and caching
- Version-stamped lazy memo per node. Epsilon equality on geometry stops propagation. Nodes of inactive variants never run.
- **Structure versus appearance**: topology is recomputed only at discrete changes. Continuous params are evaluated on z quantised to 1/32 steps.
- Motif internals are cached by (motif, variant key, quantised z, scale bucket) and are independent of page height.
- Rails and lanes recompute when their length changes. Only repeat counts and spacings change, and the cached symbol geometry is reused.
- The SVG is patched by stable piece id, so only changed `d` attributes are written.
- Budgets (proposals, measured in the Lab): survey under 2 ms, enclose under 6 ms, a full cold solve of a Victorian frame under 30 ms. Resize work is scheduled on rAF and coalesced.

### Determinism
- No Math.random; a seeded PRNG only if jitter is ever wanted.
- Fixed iteration caps. Numbers rounded at output (2-3 decimals).
- On load, threshold choices are canonical (no hysteresis history).
- Node `algo` versions pin algorithms.
- Snapshot tests run in Node with a tolerance comparison, because JS Math precision varies between engines.

### Solver policy
- The DAG by default.
- Local Newton or secant solves inside nodes (clothoid G1, alignment closure, weave amplitude), each with a status, a residual and a last-good fallback.
- Drag inversion over the 1-2 bound params happens in the Lab only.
- Optional, Lab only: planegcs for a rare genuine cycle, and offline energy optimisation for spacing balance. Both are baked into params, never shipped.

### Dependency budget (shipped)
`spiro` (optional) and possibly `@preact/signals-core` (about 2 KB). Everything else is a port of a small permissively licensed algorithm (hobby.js, Levien's integ_spiro and fit_euler, Bertolazzi-Frego buildClothoid, later kurbo fit.rs).

### Reuse from the existing code
- **From the `framing/` spike**: `phi.ts` (rung, fitRepeats, gaining hysteresis) and `vec.ts` move into geom. `weave.ts` becomes an analytic strand that goes through the fitter with exact normals instead of finite differences. `turtle.ts` becomes the Cesàro turtle (adds clothoid and log-spiral segments, G2).
- **From `frameEngine.ts`**: its rings, gaps and hatch become the `profile` layer.
- **From `hand-drawn.json`**: its hulls and sockets become fixed motifs that can be used while the parametric versions are rebuilt.

## Rendering

### Layer stack inside `<nl-sheet>`
Every decorative layer has `aria-hidden="true"` and `pointer-events:none`, and is absolutely positioned so it cannot affect layout.

1. **paper**: the background colour from the theme. The texture is a small pre-rendered tile (PNG or WebP, or a static SVG pattern), not a live full-page feTurbulence, which is costly and has crashed iOS Safari.
2. **fills**: flat-colour regions, profile stripes and bevel facets. Fills use `fill="var(--nl-teal)"` and similar, so **a theme swap is CSS-only, with no recompute**.
3. **ink**: engraved line work as filled variable-width outlines (nonzero fill), circles as `A`, cubics fitted at about 0.1 device px. Hairline floor 0.5-0.75 CSS px, with weights in screen px.
4. **knockouts/halos**: paper-coloured casings for over/under crossings and around motifs sitting over lines. These are drawn geometry, not masks, so they stay cheap.
5. **content** (the real HTML grid). Cartouche text and labels are real HTML positioned in regions, selectable, translatable and readable by screen readers.
6. **above-content**: elements that break the frame (the sprig), with `overlap: break`.
7. **motion overlay**: a few `<g transform>` groups or HTML wrappers for couriers. Masks are used only during Tier B reveals.

### Finishes (theme `finish.kind`)
- **Engraved ink**: monochrome ink on paper with variable line width.
  - Optional static ink gain (a one-time slight dilate or blur-threshold filter on the ink layer), switched off on compact screens.
  - Never animated filters.
  - Hatch is real line families with constant px pitch (texture-preserving), not pattern fills, wherever it is visible.
- **Flat colour (mid-century, deco)**: crisp fills, `shape-rendering: geometricPrecision`. Bevels come from hillshade: shade = dot(facet normal, light vector for azimuth and altitude), classified into theme ramp steps, so every facet stays inside the palette.
- **Blueprint inversion**: the theme maps ink↔paper. Regions marked `invert: true` (the dark band holding light panels) swap tokens for their subtree. A subtle paper-age tile sits under everything.
- **Minimal**: a paper tile, a superellipse card path, and a soft shadow as CSS `filter: drop-shadow` on the card group or host (GPU-friendly), not an SVG filter chain.
- **Text on tracks** (the blueprint's running border text, ribbon-banner lettering): straight bands use real HTML text in the band region. Curved text uses SVG `<textPath>` on the track in the aria-hidden layer, with the same words as visually-hidden HTML so meaning is not duplicated or lost.

### Print
`@media print` keeps the vector SVG (hairlines print beautifully), drops the paper texture, forces themes to their ink variant, and lays out regions for A4 or Letter as a fixed width class.

### Export
The Node CLI renders any frame at any size to standalone SVG (and PNG through headless Chrome) for snapshots, social images and contact sheets. Illustrator can open these exports for annotation, though nothing round-trips back.

## Site integration

### Host: a custom element, framework-agnostic

```html
<nl-sheet frame="gazette" theme="engraving-ink" route="studio">
  <header data-nl="title">Parkington Programs Studio</header>
  <nav data-nl="nav">…</nav>
  <main data-nl="main"><!-- router outlet --></main>
  <aside data-nl="aside">…</aside>
</nl-sheet>
```

- `<nl-sheet>` uses **light DOM**, not shadow slots, so the site's Tailwind and CSS keep working. It sets `display:grid` with the template from the survey pass and assigns children to regions by `data-nl` → `grid-area`.
- It injects its decorative layers and region probes, and observes itself with ResizeObserver.
- It sets `scrollbar-gutter: stable` on the root so a scrollbar appearing cannot flip a threshold.
- **Content regions are just grid areas.** Page CSS can also use `--nl-*` custom properties (rail width, measure, gutter) and container queries on regions. Content can wrap around a corner motif that intrudes with `shape-outside: polygon()` computed from the motif's hull.
- **No layout shift before JS**: the CLI pre-computes the survey pass for each width class and emits a small `frames/gazette.css` with the grid templates and band depths in media queries. The page lays out correctly before the engine boots, and the engine then only draws ornament.

### Leaving Vue for framing
- **Now**: replace `src/components/layout/Frame.vue` and `SiteChrome.vue` with `<nl-sheet>` placed **outside** `<router-view>`, so the frame persists across routes. Configure Vue's `isCustomElement` for `nl-*`.
- **Route data**: route `meta.frame` / `meta.sheetLayout` sets attributes, and `router.afterEach` plus the View Transition `updateCallbackDone` triggers the enclose pass and then the routeChange motions.
- Vue keeps what it is good at here: Supabase auth, the TipTap editor (which uses @tiptap/vue-3), admin views and content components.
- **Recommendation for the pending decision**: do not rewrite the whole site now. The frame engine is already out of Vue. If the site later leaves Vue, the natural path is a multi-page build (Vite MPA or Astro) where article pages are static HTML inside `<nl-sheet>` and the editor and admin stay as islands. Cross-document View Transitions work in Chrome and Safari; Firefox just changes page instantly. Decide this after milestone 4, once the frame has proven itself.
- **Hand-written frames** (`frameSettings.ts` presets): migrate them into `.frame.json` documents with the CLI, keeping the old Vue component until each page is switched.

### Functional and modern behaviour
- **Dynamic content**: any content change resizes a probe, then the enclose pass runs and the frame closes around the new height. Infinite or long lists only change rail lengths and repeat counts.
- **Interaction**: nav items in a band can light their segment of the track on hover and focus, using continuous weight params or a sliding marker. This is decorative reinforcement of the real `:focus-visible` outline, not a replacement.
- **Accessibility**:
  - decorative layers are aria-hidden
  - all lettering is real text
  - motions respect reduced motion and the viewer's "still engraving" toggle, are event-only and under 5 s
  - contrast is checked in the theme editor for text-bearing regions (cartouches, the inverted blueprint band)
- **Performance**:
  - survey runs only on width-class or z-quantum changes; enclose runs on measured changes, coalesced in rAF
  - motif geometry is cached
  - the SVG is patched by key
  - static nodes are kept in the low thousands at most; the animated set stays in the tens
- **Lab hosting**: `lab.html` is a Vite multi-page input served only in dev. The Vite plugin with `apply: 'serve'` adds the write-file middleware. Nothing from the Lab or Zod ships.

## Roadmap

Every milestone ends with something visible on the real blog or in the Lab.

**M0. Stripes and blocks** (about 1-2 weeks). The early win is that no curves are needed.
- `neatline-core` with: rect tracks, the profile layer, block joints with a hillshade bevel stack, repeat punctuation with whole-number fit, a theme as CSS tokens, `render-svg`, and the `<nl-sheet>` host with ResizeObserver.
- **Visible**: the mid-century moulding (12 stripes, stud blocks, static chevrons and finials) framing a test page at any size. Switching the theme to cyanotype re-skins it live.
- Node CLI snapshots at 360, 768, 1280 and 1920.

**M1. The frame is the layout.**
- Regions and the two-pass contract: survey → CSS grid → probes → enclose. Cartouches fitted around real text. Graduated tick punctuation. Panel grids with gutter rules. Inverted regions. CSS fallback file from the CLI.
- **Visible**: a blueprint-style dashboard page with ruled panels and ruler ticks, and the blog home inside `<nl-sheet>` behind a feature flag, with content changes closing the frame.

**M2. Lab v0.**
- `lab.html`, the file-backed save middleware with Zod validation, layers panel, inspector, the real-route iframe preview over HMR, undo/redo with drag squashing, and the profile editor with sample-cross-section from a registered image.
- **Visible**: rebuild the mid-century frame from websiteOutline.svg in the Lab in under an hour, following the session walk-through.

**M3. Thresholds.**
- Slots, z, step/interpolate expressions, the stops table, hysteresis, `minZ`/priority/optional, merge and drop for profile stripes, the ScaleMaster strip, the generated filmstrip with QA badges, and the Sweep button.
- **Visible**: the moulding generalises gracefully down to a phone, and every threshold can be seen at once in the strip.

**M4. Curve kernel and the garland.**
- Intrinsic line, arc, clothoid and log spiral; alignment tracks (Cesàro turtle, G2); offsets with guards; the phase-1 fitter; the weave as analytic strands with crossing angle, whole-period fit and socket-locked ends. Construction overlay and curvature combs in the Lab.
- **Visible**: two-ribbon and three-strand garlands running down the sides of the gazette frame. The existing hand-drawn medallion and flame are used as fixed motifs through their sockets, and the strands continue from the medallion stems.

**M5. Parametric motifs and golden construction.**
- Motif sub-plans, spiral-similarity copies, golden-leaf sides, families/fans, the medallion rebuilt (ring, clothoid sweeps, sweep leaf at G2, fans), the flame rebuilt golden. The motif workshop with register, fit and residual report, and the golden-law badges.
- **Visible**: a side-by-side of the hand-drawn and golden flame and medallion, with tip-displacement numbers, and the gazette frame running on the parametric motifs with medallion → block variants by room.

**M6. More styles from the same vocabulary.**
- Orders and arches (lintel, segmental and semicircular by z), stepped deco joints, `sequence` punctuation for the deco spine, the sunburst rays motif, superellipse rounded joints, `overlap: break` with knockouts, curved text on tracks.
- **Visible**: Beaux-Arts bay, deco diptych and minimal card templates, each a working page.

**M7. Motion.**
- MotionDirector with Tier A (WAAPI along tracks), march and courier, routeChange and View Transitions with the frame excluded, reduced-motion swaps and the viewer toggle, then Tier B construction replay. A timeline lane in the Lab.
- **Visible**: changing tab sends the medallion darts down the garland, and the mid-century chevrons march one pitch.

**M8. Polish and options.**
- Port the kurbo fitter, add the LAC curve-character dial, Spiro knot editing for sweeps, Tier C ripple and unfurl, rank-aware generalisation presets, print stylesheet, and the decision on the rest of the site leaving Vue.

**Defer or skip unless a real need appears**: a global constraint solver, global label placement, Canvas or WebGL rendering, and a mapping engine (a separate project later, which could reuse `neatline-core/expr` and `room`).

## Risks

- **Scope**: seven styles is a lot. Mitigation: one vocabulary, styles arrive as templates in M6, and M0-M3 use only straight-line styles so the system is proven before the hard curves.
- **The metaphor can over-engineer.** A full MapLibre-style collision engine or expression language would be too much for a solo student. Keep the expression subset small (step, interpolate, match, case, arithmetic, phi, room, class, route), keep collisions per slot with a priority list, and drop map ideas (camera, tiles, global placement) that do not earn their place.
- **Too many thresholds.** The "spaghetti graph" failure applies. The 2-4 anchors per slot rule, the compatibility validator and the ScaleMaster view keep it legible. Most parameters should stay constants.
- **Layout feedback loops.** If anything in the enclose pass writes a layout style, ResizeObserver loops and the layout flashes. The contract (pass 2 is draw-only, height reservations come from width class only) must be enforced by code structure, not by discipline.
- **Content versus ornament conflicts on real pages** (a long title against the crest, narrow screens). HTML always wins, and ornaments must have fallbacks. Some pages may need a route-level variant override.
- **Curve robustness**: Spiro returns no convergence status, offsets cusp, clothoid closures can fail. Mitigation: guards, residual checks, a last-good fallback while dragging, and QA badges.
- **Hand-drawn charm versus generated perfection.** Parametric rebuilds may lose character (for example, the drawn flame's linear leaf shrink). Keep the hand-drawn motifs usable as fixed motifs indefinitely, and present golden versions as an opt-in with numbers.
- **Browser differences**:
  - Safari may not composite SVG child transforms (use HTML wrappers for travellers).
  - The CSS `d` property is missing in Safari (use setAttribute).
  - View Transition raster snapshots would stretch hairlines (exclude the frame).
  - Clip-path on a marching group may block compositing (test it).
- **Performance on low-end phones** with heavy engraving: cap line-family counts by devPx, simplify on compact screens, and cache motifs.
- **Accessibility regressions**: decorative motion and contrast on inverted or flat-colour regions. Use the theme contrast checks, reduced motion and real text throughout.
- **Maintenance load**: two programs (core and Lab) plus a schema. The deterministic writer, migrations, fixtures and the shared evaluator limit drift. The Lab must never hold state that is not in the JSON.
- **Legal and licence notes**:
  - A Mapbox patent covers a value-versus-zoom graph editor; this is likely irrelevant for a private Lab but matters if the Lab is published.
  - GSAP's licence is unsuitable for a visual animation tool.
  - libspiro is GPL, so port from the permissively licensed sources instead.
- **Vue entanglement**: TipTap and auth are Vue-bound, so a full exit is a separate project. Do not let it block the frame engine.
- **Unverified items to test early in the Lab**: whether `offset-path:url()` follows live `d` changes, compositing of clipped groups, and the budget numbers (proposals, not measurements).

## Novelty

- **A page frame designed the way a map sheet is styled.** The plan (solved features) is separate from the symbology (style layers) and the theme (re-skin), so one structural vocabulary produces a banknote garland, a mid-century moulding, a blueprint dashboard, a Beaux-Arts bay, a deco spine and a minimal card. Existing frame tools (9-slice, N-slicing, border-image) stretch or tile pictures. None of them re-solves curves or generalises by room.
- **Per-slot room zoom on a φ ladder with cartographic generalisation.** Ornament gets the treatment map features get: visibility ranges, typify, collapse, merge and swap, priority and fallback, hysteresis, and texture-preserving density. Each corner, rail and band has its own z, so a phone corner and a desktop rail are designed separately inside one document.
- **The frame is the layout.** A width-only survey pass writes a real CSS grid, and a draw-only enclose pass closes the frame around measured HTML. Ornament defines where content lives without any layout feedback loop, and cartouches fit real, live text.
- **Road-alignment design for ornament.** Tracks are composed like highway alignments (tangent, clothoid, arc, spiral), so the dominant functions are G2 by construction. A medallion's sweep literally continues into the garland that runs down the page. This links the owner's urban-planning training to the curve mathematics the drawing analysis found.
- **Cartographic rendering ideas repurposed**: road casings become mouldings and ribbon profiles, bridge and tunnel casings become weave over/under, text halos become engraving knockouts, hillshade becomes bevel lighting classified into palette ramps, and georeferencing becomes registering an Illustrator sketch to fit against.
- **Golden geometry honestly enforced.** Phi is locked by construction (spiral similarity, rung ladders, golden-law params), and any deviation is visible as a badge with numbers. It is never "found" in drawings.
- **A Frame Lab that edits relationships, not paths.** It has a Streetmix-like cross-section editor for mouldings, ScaleMaster strips and auto-generated threshold filmstrips, a relations inspector with re-attach and bake, and a live preview around the real blog content. Illustrator is kept for sketching.
- **Motion as moving parameters of the same solved graph.** Couriers ride tracks by arc length, chevrons march by whole pitches, and construction replays in dependency order. It is composited where possible, reduced-motion aware, and stays correct under resize because state is stored in u, not pixels.
