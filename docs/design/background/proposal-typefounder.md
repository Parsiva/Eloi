# Proposal (typefounder lens): Fount: a frame engine organised like a type family, with the Frame Lab as its type-design tool

> One of five competing proposals. Background for [the frame engine design](../frame-engine.md), which builds on the architect proposal with grafts from the others.

## Thesis

Treat a website frame the way a typefounder treats a typeface. The parts of a frame (medallion, corner block, flame, crest, side band, pilaster, card corner) are parametric glyphs, here called **sorts**. They are designed once inside a **designspace** whose main axis is the room each part has on screen, the frame equivalent of optical size. A **setter** then fits those sorts to the live page, the way a compositor justifies a line of type. Three proven type technologies supply most of the hard behaviour:
- **Variable-font masters with feature-variation substitution** handle thresholds.
- **The OpenType MATH table's stretchy glyph assembly** (fixed end pieces plus extenders, like the parts of a stretchy brace) handles architectural orders, side rails with clasps, and cartouches that grow around live text.
- **Knuth–Plass box-and-glue justification** handles beads, ruler ticks, chevrons and deco sequences along a track, so they come out in whole numbers with no visible stretching.

Every style the owner has shown is built from one vocabulary of tracks, profiles, sorts, assemblies, settings, joins and slots. A separate theme layer (palette tokens, lighting, finish) re-skins it, so engraving, mid-century moulding, blueprint, Beaux-Arts, deco and a minimal card are families of one system rather than separate engines. The frame is also the layout: each family publishes a type area (named CSS grid areas plus metric custom properties) that real HTML flows into. Width drives the frame's metrics and content height only drives track lengths, which rules out layout feedback loops by construction. The METAFONT lesson is respected throughout: relationships are created by drawing and gestures in the Lab, read back as plain sentences, and stored as small typed JSON records. The owner never writes equations.

## Core concepts

## The vocabulary (type term → frame term)

Each term below means one thing in the engine. The type analogy is noted only where it adds a real mechanism.

| Frame term | Type origin | What it is in Fount |
|---|---|---|
| **Family** | a typeface family / designspace | One frame style: axes, metrics, sorts, profiles, layout, features. Stored as `frames/families/<id>/family.json` plus one file per sort and per profile (like UFO's one-glyph-per-file, which gives clean git diffs). |
| **Metrics** | vertical metrics, UPM | Named lengths the whole family shares: `em`, `rail`, `band`, `corner`, `clear`, `measure`. By default each is a rung on a φ ladder above `em`, so all parts agree in proportion (see golden_ratio). |
| **Track** | the baseline (type on a path) | A dominant curve or edge: a page edge, rail centreline, ring, sweep, arch, spine. Every track has native arc length `s` and can report `point(s)`, `tangent(s)`, `curvature(s)`. |
| **Station** | a position on the line | A place on a track, given as `u` (0..1) or `s` (arc length) or as named sections (`mid`, `phi:upper` = 0.382, `phi:lower` = 0.618). Children attach at stations. |
| **Profile** | METAFONT pen / stroke stack | A cross-section swept along a track: an ordered list of lines, gaps, filled stripes, hatch, bead lanes, tick lanes and text lanes. Each line or stripe can be a **lane**, a named sub-track of its own, so motifs can sit on one particular stripe. |
| **Sort** | a glyph | A fixed-character piece: a skeleton of tracks, declared relations, pens, parts, **anchors** (where it mounts) and **sockets** (where tracks leave it). Sorts are only ever scaled uniformly, never stretched. |
| **Static / fitted / parametric sort** | scanned metal type → outlines → variable glyph | Three maturity levels. Static sorts are the existing `hand-drawn.json` pieces with hulls and sockets, usable on day one. Fitted sorts have their curves fitted to exact families with residuals reported. Parametric sorts have skeleton, relations and masters. A sort can be upgraded later without changing the family. |
| **Assembly** | OpenType MATH `GlyphAssembly` (stretchy braces) | A stretchable sequence: `fixed` end pieces, `extender`s that fill length, and an optional `middle`. Covers base/shaft/capital, rail/clasp/rail, and cap/ribbon/cap cartouches. Like MATH, it first tries pre-drawn **size variants** and assembles only when none fits. |
| **Setting** | justification (TeX boxes, glue, `\hfil`) | Motifs set along a track or lane: **repeat** (beads, finials), **hierarchy** (ruler ticks at levels), **sequence** (deco spine: a "word" of different sorts), **centred** (crest, nameplate: a box between two infinite glues). Counts are whole numbers, chosen by a badness score. |
| **Join** | ligature | What happens where two profiles meet: `mitre` (default), `block` (a square sort replaces the mitre, as in carpentry rosette blocks), `medallion`, `stepped` (deco), `round`/`superellipse` (modern), `notch` (inset brackets). A small join table, keyed by (profile A, profile B, corner style), picks the sort. |
| **Terminal** | contextual alternate (`calt`) | How a setting or band ends: a chevron, a scroll end, or nothing. It is chosen by what is next to it, for example a band that ends against a cartouche gets a scroll end. |
| **Axes** | variation axes | `room` is automatic and measured per slot, the counterpart of `opsz`. `dens` (line count), `wght` (ink) and `rich` (amount of ornament) are set by the theme or route. `grad` changes apparent weight with **no metric change**, so it never causes reflow; dark mode uses it. |
| **Master / instance** | masters / named instances | Parameter sets at axis locations (for example S/M/L room). Instances are interpolated between them. |
| **Rule** | `rvrn` / FeatureVariations | A discrete swap inside an axis range, used where structure changes: 6 leaves become 4, a plait becomes a twist, a medallion becomes a block, an arch becomes a lintel. Rules have hysteresis. |
| **Stylistic set** | `ss01`–`ss20` | Named alternates a page or route can switch on, for example `ss02` gives a compass-rose medallion on the Projects route. |
| **Type area** | Satzspiegel (the page's type area) | The family's layout: page width classes, named grid areas, metric slots and content slots. Published to CSS. |
| **Palette** | COLR/CPAL palettes | Colour tokens referenced by index or name. A theme swaps the whole palette. |
| **Light** | (not from type) | A light direction plus tone ramps. The colour of each facet is chosen from its normal relative to the light. |
| **Finish** | the rendering pipeline | `engraved`, `flat`, `blueprint`, `card`. A finish decides how the same profile and lighting are drawn: as fills, as hairlines, or as hatch density. |
| **Hinting** | TrueType hinting | Device-pixel rules: hairline floors, snapping stripes to whole pixels, merging lines that fall below 1 px, dropping low-priority stripes. This is what makes thin work look printed at every size. |
| **Motion** | variable-font animation | Values that change over time on the same solved frame: a station `u` moving along a track, an axis value, a dash window. |

## Where the metaphor helps and where I drop it
- **It helps** with: masters and substitution for thresholds; MATH assembly for stretchy architecture; justification for ornament along tracks; ligatures for corners; CPAL for re-skinning; hinting for the printed finish; `grad` for dark mode; one file per glyph for git.
- **I drop METAFONT's equation solving and its "write a program" interface.** Relations form a directed graph that is built by gestures and read back as prose.
- **I drop point interpolation.** Fount interpolates *parameters*, not outlines, so compatibility only requires that discrete parameters agree. A leaf count steps; a swing amplitude interpolates.
- **Type is one-dimensional flow; a frame is a closed 2D loop around content whose height feeds back.** That part is new, and the layout rules in site_integration handle it.
- **Kerning is not needed.** The join table and the setting's glue cover what kerning would do.

## Coverage: the seven inspiration styles in one vocabulary
| Style | Tracks | Profiles | Joins / sorts | Settings | Assemblies / other |
|---|---|---|---|---|---|
| Victorian engraving | rails, medallion ring, clothoid sweeps, flame spiral | `garland` (weave of 2 double-line ribbons), double rules, bead lane | medallion corners (top), flame corners (bottom) | beads, lattice, zigzag, centred crest/jewel/tailpiece | rail = garland ext + side-leaf middle + garland ext; cartouche |
| Mid-century moulding | rectangle edges, stripe lanes | `moulding` (12 stripes) | `block` join → stud-block sort | chevron terminals, finial repeats on the mustard lane | plaque cartouches top and bottom; inset frames with `notch` joins |
| Blueprint dashboard | edges, panel grid lines | rule + tick lane + text lane | mitre, oval cartouches | ruler hierarchy, running text (textPath) | inverted header band holding panels; panel grid = content slots |
| Beaux-Arts | pilaster axes, arch, entablature | pilaster fluting, entablature bands | capital and base sorts | frieze scrolls (repeat), title cartouche (centred) | order = base + shaft ext + capital; arch track span = width |
| Pictorial poster | thin rect | single rule | rococo corner sorts | — | ribbon banner = scroll cap + ribbon ext + scroll cap |
| Art deco | stepped rect | multi-weight rules with stepped offsets | `stepped` join, circle and square corner sorts | spine **sequence**, sunburst ray family | nameplate; nested frames |
| Minimal card | superellipse rect | none, or a hairline | `superellipse` join | — | colour-block layers, breakout sprig, CSS shadow and texture |

## Document model

## Files (one family per folder, one sort per file, as in UFO)
```
frames/
  schema/            family.schema.json, sort.schema.json …  (generated from Zod; VS Code autocompletes)
  families/
    engraving/       family.json  sorts/medallion.sort.json  sorts/flame.sort.json
                     sorts/side-leaf.sort.json  profiles/garland.profile.json …
    moderne/         family.json  sorts/stud-block.sort.json  sorts/chevron.sort.json
                     profiles/moulding.profile.json  frames/inset.frame.json …
  themes/            ink-on-paper.theme.json  moderne.theme.json  blueprint.theme.json
```

**Rules for every file:**
- Plain JSON, written by a deterministic writer: fixed key order, sorted ids, `[x, y]` pairs on one line, numbers rounded to 3 decimals (6 for ratios). The examples below carry `//` comments for explanation only; real files use `"note"` fields.
- Expressions are strings in a small arithmetic language (`+ - * / ^`, `phi`, `sqrt`, `min`, `max`, `clamp`, `lerp`, parameter and metric names, `rung(k)`), parsed into an AST by a hand-written parser. There is no `eval`.
- Every node can pin `"algo": "v1"`, so a future maths improvement never silently changes art that is already committed.
- `formatVersion` comes with ordered migrations. Unknown fields are kept on load.

**Coordinates and units:**
- Sorts use their own drawing units (`du`, taken from the Illustrator source). `"units": {"du": N, "maps": "corner"}` means N du = the family metric `corner`, in CSS px.
- Profiles use profile units that map to their `depth` metric.
- Placement on the page only ever uses similarity transforms.

---
## Example 1: the Victorian corner (medallion, ribbons, side leaf, flame)

### `families/engraving/family.json` (excerpt)
```jsonc
{
  "format": "fount-family", "formatVersion": 1, "id": "engraving",
  "axes": {
    "room": { "auto": "slot", "min": -2, "max": 1.5, "note": "z = log_phi(slot size / ref size)" },
    "rich": { "min": 0, "max": 1, "default": 1 },
    "dens": { "min": 0, "max": 1, "default": 0.6 },
    "grad": { "min": -1, "max": 1, "default": 0, "noReflow": true }
  },
  "metrics": {                                  // every metric is a rung above em unless unlocked
    "em":     { "byWidth": { "360": 6, "1440": 11 }, "curve": "exp", "unit": "px" },
    "rail":   { "rung": 4 },                    // em*phi^4  ≈ 6.85em  (side gutter)
    "band":   { "rung": 3 },                    // em*phi^3  ≈ 4.24em  (top/bottom bands)
    "corner": { "rung": 5.5 },                  // corner sorts' box
    "clear":  { "rung": 1 },                    // breathing room between frame and content
    "measure":{ "value": "68ch", "lock": "free" }
  },
  "frame": {
    "corners": {
      "tl": { "sort": "medallion" },            "tr": { "sort": "medallion", "mirror": "x" },
      "bl": { "sort": "flame" },                "br": { "sort": "flame", "mirror": "x" }
    },
    "sides": {
      "left": {
        "track": { "from": "tl.socket.stem", "to": "bl.socket.rail", "continuity": "G2" },
        "assembly": {                           // MATH-style: extender, middle, extender
          "parts": [
            { "extender": "garland" },
            { "middle": "side-leaf", "at": "phi:upper", "clearance": "em*0.5" },
            { "extender": "garland" }
          ],
          "variants": [ { "when": { "length": "< corner*phi^2" }, "drop": "middle" } ]
        }
      },
      "right": { "mirrorOf": "left" },
      "top": {
        "track": { "from": "tl.socket.east", "to": "tr.socket.east" },
        "profile": "rules.double",
        "setting": [
          { "lane": "inner", "centred": "crest" },
          { "lane": "outer", "repeat": "bead", "pitch": { "natural": "em*0.62", "stretch": 0.15, "shrink": 0.1 },
            "skip": "crest.hull + em*0.5" }
        ]
      },
      "bottom": { "track": { "from": "bl.socket.base", "to": "br.socket.base" },
                  "assembly": { "parts": [ { "extender": "garland" }, { "middle": "tailpiece", "at": "mid" }, { "extender": "garland" } ] } }
    }
  },
  "layout": { "$ref": "#/layouts/newspaper" },
  "features": { "ss03": { "garland.strands": 3, "note": "3-strand plait instead of the 2-ribbon twist" } }
}
```

### `sorts/medallion.sort.json` (excerpt)
```jsonc
{
  "format": "fount-sort", "formatVersion": 1, "id": "medallion",
  "units": { "du": 356, "maps": "corner" },
  "params": {
    "R":       { "value": 71.4, "note": "core circle (drawing: ellipse 72.8 x 70.1, intended circle)" },
    "ringK":   { "value": 0.5, "lock": "rung", "note": "ring radius = R*phi^ringK; drawn 1.20, phi^0.5 = 1.27" },
    "ringR":   { "expr": "R * phi^ringK" },
    "ribGap":  { "value": 11.51 },
    "midGap":  { "expr": "ribGap * phi", "lock": "phi", "note": "drawn 16.89 (ratio 1.467); golden 18.62" },
    "fanN":    { "kind": "discrete" },
    "loopN":   { "kind": "discrete" },
    "loopStep":{ "value": 28, "unit": "deg" }
  },
  "skeleton": {
    "c":    { "point": [129.8, 130.6] },
    "core": { "circle": { "centre": "c", "r": "R" } },
    "ring": { "circle": { "centre": "c", "r": "ringR" } },
    "sweep": {                                       // the DOMINANT function of the corner
      "chain": {                                     // Cesàro turtle: G2 by construction
        "from": { "on": "ring", "angle": -20, "tangent": true },
        "pieces": [
          { "arc":      { "r": "ringR", "turn": 170 } },
          { "clothoid": { "len": "free", "kEnd": 0 } },     // curvature eases to 0: the inflection
          { "clothoid": { "len": "free", "kEnd": "free" } },
          { "line":     { "len": "free" } }
        ],
        "to": { "socket": "stem", "heading": 90 },          // 3 free values close 3 equations (x, y, heading)
        "solve": { "method": "newton", "maxIter": 8, "fallback": "lastGood" },
        "algo": "v1"
      }
    },
    "sweep2": { "offset": { "of": "sweep", "d": "-ribGap", "guard": "d < Rmin" } }
  },
  "sockets": {                                         // where tracks leave the sort
    "stem": { "at": "sweep.end",  "heading": 90, "carries": ["sweep", "sweep2", "sweep3", "sweep4"],
              "spacing": ["ribGap", "midGap", "ribGap"], "note": "the two double-line ribbons" },
    "east": { "at": [356, 31.9], "heading": 0 }
  },
  "anchors": { "_mount": { "at": [0, 0], "note": "sits on the frame's corner point" } },
  "parts": {
    "fanA":  { "family": { "between": ["guideA1", "guideA2"], "count": "fanN",
               "spacing": { "law": "uniform" }, "converge": { "on": "core", "angle": 180 } }, "pen": "hair" },
    "fanB":  { "family": { "between": ["guideB1", "guideB2"], "count": "fanN",
               "spacing": { "law": "geometric", "r": 1.12 }, "converge": { "on": "core", "angle": 50 } }, "pen": "hair" },
    "loops": { "copyAlong": { "proto": "loop0", "track": "ring", "by": "angle", "from": 200,
               "step": "loopStep", "count": "loopN", "attach": { "end": "core" } }, "pen": "hair" },
    "curl":  { "logSpiral": { "pole": [241.9, 111.3], "b": 0.15, "turns": 2.5, "eye": "G2",
               "note": "a volute, not golden: the drawn b is 0.14-0.16" }, "pen": "main", "minRoom": -0.5 }
  },
  "pens": {
    "main": { "width": { "along": "swell", "min": 0.6, "max": 1.1 }, "floorPx": 0.75 },
    "hair": { "width": 0.5, "floorPx": 0.5, "mergeBelowPx": 0.9 }
  },
  "masters": {
    "S": { "at": { "room": -1 },             "fanN": 4, "loopN": 6 },
    "M": { "at": { "room": 0 },              "fanN": 6, "loopN": 9 },
    "L": { "at": { "room": 1, "rich": 1 },   "fanN": 7, "loopN": 11, "swell": 1.15 }
  },
  "rules": [ { "when": { "room": "< -1.6" }, "swap": "medallion.block", "hysteresis": 0.05 } ]
}
```

### `profiles/garland.profile.json`: the ribbons that carry the sweep down the side
```jsonc
{
  "format": "fount-profile", "formatVersion": 1, "id": "garland",
  "kind": "weave",
  "receives": "socket.carries",                     // starts with the medallion's 4 stem lines, G2
  "strands": { "kind": "discrete", "value": 2 },    // ss03 → 3 (plait)
  "ribbon":  { "lines": [ { "pen": "main" }, { "gap": "ribGap" }, { "pen": "hair" } ] },
  "crossing":{ "angle": "2*atan(1/phi)", "lock": "phi", "note": "amplitude is derived from this angle and the period" },
  "period":  { "natural": "2*pi*swing*phi", "fit": "whole-halves", "phaseLock": "both-ends" },
  "halo":    { "gap": 0.8, "fill": "paper" },
  "guards":  [ "A < Rmin(track)", "h < period^2 / (4*pi^2*A)" ],
  "rules":   [ { "when": { "room": "< -1.2" }, "collapse": "double-rule", "note": "a weave too narrow to read becomes two rules" } ]
}
```

### `sorts/side-leaf.sort.json`: a smart component with its own axis
```jsonc
{
  "id": "side-leaf", "units": { "du": 244, "maps": "rail*phi^1.5" },
  "role": "middle",                                 // the clasp in the rail assembly
  "axes": { "spread": { "min": 0, "max": 1, "default": 0.6 } },   // instance property, as in Glyphs smart components
  "symmetry": { "mirror": "y", "about": "socket.in" },
  "skeleton": {
    "spine": { "line": { "from": "socket.in", "heading": 0, "len": 62 } },
    "lobes": { "copyAlong": { "proto": "lobe0", "track": "spine", "stations": [0.098, 0.221, 0.434, 0.582],
               "rotate": "lerp(10, 34, spread)", "attach": "G1" } }
  },
  "sockets": { "in": { "at": [74.8, 121.9], "heading": 180, "note": "the garland passes through here; the leaf sits over it" } },
  "knockout": { "hull": true, "pad": 0.8 }
}
```

### `sorts/flame.sort.json`: golden by construction
```jsonc
{
  "id": "flame", "units": { "du": 119, "maps": "corner*phi^-0.5" },
  "params": {
    "b":     { "value": "golden", "lock": "phi", "note": "ln(phi)/(pi/2) = 0.30635; the drawing measured 0.49" },
    "dphi":  { "value": 25, "unit": "deg", "range": [18, 32] },
    "tilt":  { "value": 12, "unit": "deg" },
    "leaves":{ "kind": "grow" }                     // discrete, but a new leaf grows in from zero scale
  },
  "skeleton": {
    "pole":      { "point": [20.0, 62.3] },
    "tipSpiral": { "logSpiral": { "pole": "pole", "b": "b", "through": "leaf0.tip",
                   "sweep": "dphi*(leaves-1)", "eye": "G2" } },
    "stem":      { "chain": { "from": { "socket": "rail" },
                   "pieces": [ { "line": { "len": "free" } }, { "clothoid": { "len": "free", "kEnd": "match" } } ],
                   "to": { "on": "tipSpiral", "at": "start", "continuity": "G2" } } }
  },
  "parts": {
    "leaf0":  { "leaf": { "len": 37.3,
                "back":  { "lac": { "alpha": 1, "b": "b", "turn": 67 } },             // a log-spiral arc side
                "front": { "lac": { "alpha": 1, "b": "b", "turn": 94, "inflectAt": 0.4 } } },
                "pen": "main" },
    "leafRun":{ "gnomon": { "proto": "leaf0", "pole": "pole", "step": "dphi", "count": "leaves",
                "extraRotate": "tilt",
                "note": "copy k = rotate(k*dphi) then scale(e^(b*k*dphi)) about the pole; tips land on tipSpiral exactly" } },
    "veins":  { "fan": { "from": "veinRoot", "to": "leafRun[*].notch", "pen": "hair" } }
  },
  "sockets": { "rail": { "at": [52.9, 0], "heading": -90 }, "base": { "at": [119, 190], "heading": 0 } },
  "masters": { "S": { "at": { "room": -1 }, "leaves": 4 }, "M": { "at": { "room": 0 }, "leaves": 6 },
               "L": { "at": { "room": 1 }, "leaves": 7 } },
  "rules":   [ { "when": { "room": "< -1.7" }, "swap": "flame.simple" } ]
}
```
How this reads: the frame's left track starts at the medallion's `stem` socket, with the medallion's own sweep end state (point, heading, curvature 0), so the garland continues the sweep G2. The garland fits whole half-periods between the socket and the side leaf (at the upper golden section of the rail), and again between the leaf and the flame's `rail` socket. When the page grows taller, only the extender lengths and their whole-number counts change. The medallion and flame are cached and never re-solved.

---
## Example 2: mid-century moulding with corner blocks and travelling chevrons

### `profiles/moulding.profile.json`
```jsonc
{
  "format": "fount-profile", "formatVersion": 1, "id": "moulding",
  "kind": "stripes",
  "depth": { "metric": "rail", "units": 68, "note": "measured on the left side of websiteOutline.svg (traced; edges wobble)" },
  "from": "outside",
  "stripes": [
    { "fill": "cream",    "d": 7,   "pri": 2 },
    { "fill": "slate",    "d": 3,   "pri": 3 },
    { "fill": "teal",     "d": 6,   "pri": 1, "lane": "outerTeal" },
    { "fill": "cream",    "d": 5,   "pri": 2 },
    { "group": "pins", "d": "rest", "pri": 4,
      "repeat": { "of": [ { "fill": "teal", "d": 0.8 }, { "fill": "cream", "d": 1.2 } ], "count": "whole" },
      "note": "pinstripe depth = 68 minus the other stripes (about 21u); measure the stripe count in the Lab" },
    { "fill": "mustard",  "d": 6.5, "pri": 1, "lane": "track" },
    { "fill": "cream",    "d": 3.5, "pri": 3 },
    { "fill": "teal",     "d": 3,   "pri": 3 },
    { "fill": "cream",    "d": 3.5, "pri": 3 },
    { "fill": "brown",    "d": 3,   "pri": 2 },
    { "fill": "sage",     "d": 2,   "pri": 5 },
    { "fill": "tealDeep", "d": 4.5, "pri": 1 }
  ],
  "hinting": { "snap": "devicePx", "minPx": 1, "drop": "byPriority", "absorb": "outerNeighbour" },
  "rules": [
    { "when": { "room": "< -0.5" }, "set": { "pins.count": "max(2, pins.count/2)" } },
    { "when": { "room": "< -1.2" }, "drop": ["pins", "sage"], "note": "12 stripes become 9" }
  ]
}
```

### `sorts/stud-block.sort.json`: the corner block (a "ligature" where two mouldings meet)
```jsonc
{
  "id": "stud-block", "role": "join",
  "size": { "expr": "rail", "lock": "metric", "note": "square = moulding depth, so the bands butt into it exactly" },
  "params": { "rings": { "kind": "discrete", "value": 3 }, "step": { "expr": "phi^-1", "lock": "rung" } },
  "parts": {
    "nest": { "nested": { "shape": "square", "count": "rings", "scale": "step", "about": "centre" } },
    "studs": { "frustum": { "outer": "nest[i]", "inner": "nest[i] * 0.72", "facets": 4 },
               "shade": "byNormal" }                // facet colour comes from the theme's light rule
  },
  "masters": { "S": { "at": { "room": -1 }, "rings": 2 }, "M": { "at": { "room": 0 }, "rings": 3 } }
}
```

### `families/moderne/family.json` (excerpt)
```jsonc
{
  "id": "moderne",
  "metrics": { "em": { "value": "1rem" }, "rail": { "rung": 4 }, "band": { "rung": 4.5 }, "clear": { "rung": 1 } },
  "frame": {
    "shape": "rect",
    "profile": { "*": "moulding", "top": "moulding.wide" },
    "corners": { "*": { "join": "block", "sort": "stud-block" } },
    "sides": {
      "*": {
        "setting": {
          "lane": "track",                                  // centreline of the mustard stripe
          "start":  { "sort": "chevron", "repeat": 3, "pitch": "em*0.62", "point": "away-from-corner" },
          "end":    { "sort": "chevron", "repeat": 3, "pitch": "em*0.62", "point": "away-from-corner" },
          "fill":   { "sort": "finial", "pitch": { "natural": "em*phi^3", "stretch": 0.2, "shrink": 0.12 },
                      "count": "whole", "align": "centre", "hysteresis": 0.3 },
          "minGap": "em"
        }
      }
    },
    "cartouches": {
      "top":    { "assembly": [ { "fixed": "plaque.capL" }, { "extender": "plaque.mid", "fitTo": "[data-fount-cartouche=title]" }, { "fixed": "plaque.capR" } ] },
      "bottom": { "assembly": [ { "fixed": "plaque.capL" }, { "extender": "plaque.mid", "fitTo": "[data-fount-cartouche=colophon]" }, { "fixed": "plaque.capR" } ] }
    },
    "insets": [ { "slot": "main", "frame": "inset", "offset": "clear" } ]
  },
  "motions": {
    "courier": {
      "trigger": "routeChange",
      "who": "sides.*.setting.start",                     // the 3-chevron groups
      "along": "lane:track", "to": "next-join",           // ride the mustard lane to the next block
      "speed": "constant", "duration": { "perPx": "0.9ms", "min": "0.6s", "max": "1.6s" },
      "easing": "press", "tier": "A",
      "reduced": "fade-at-destination"
    }
  }
}
```
### `frames/inset.frame.json`: nested inset with notched corner brackets
```jsonc
{ "id": "inset", "profile": { "kind": "lines", "lines": [ { "fill": "teal", "d": 1.5 }, { "gap": 2 }, { "fill": "mustard", "d": 1 } ] },
  "corners": { "*": { "join": "notch", "size": "em*phi" } } }
```
### `themes/moderne.theme.json`
```jsonc
{ "palette": { "mustard": "#cfaa6d", "teal": "#2c5763", "cream": "#f2e5c7", "brown": "#9d8a62",
               "slate": "#5f7771", "sage": "#a7a891", "sand": "#ddcfaa",
               "tealDeep": { "derive": "shade(teal, 0.25)" }, "paper": "cream" },
  "light":   { "dir": 315, "levels": 4,
               "ramps": { "default": ["cream", "sand", "brown", "teal"] } },
  "finish":  "flat",
  "dark":    { "palette": { "paper": "tealDeep", "cream": "#1f3a40" }, "axes": { "grad": -0.4 } } }
```
Re-skin test: apply `blueprint.theme.json` (`"finish": "blueprint"`) to the same `moderne` family. The flat stripes are then drawn as hairline boundaries in Prussian blue on aged paper, the light rule maps to hatch density instead of colour, and the structure is untouched.

---
## Example 3 (brief): an architectural order with an arch
```jsonc
"sides": {
  "left": { "assembly": {
      "sizeVariants": [ "pilaster.short" ],                 // tried first, as in MATH
      "parts": [ { "fixed": "base" },
                 { "extender": "shaft", "setting": { "across": "flutes", "count": "whole", "pitch": "em*0.5" } },
                 { "fixed": "capital" } ] },
    "rules": [ { "when": { "room": "< -0.8" }, "swap": "pilaster.strip" } ] },
  "right": { "mirrorOf": "left" }
},
"top": { "arch": { "springs": ["left.capital.top", "right.capital.top"],
                   "form": { "step": { "by": "span/height", "stops": [ [0, "semicircle"], [2.2, "threeCentred"], [3.5, "segmental"] ] } },
                   "rise": { "expr": "span/2", "segmental": "span/phi^3" },
                   "rules": [ { "when": { "widthClass": "compact" }, "swap": "lintel" } ] },
         "entablature": { "profile": "entablature", "setting": { "lane": "frieze", "repeat": "scroll", "count": "whole" } } },
"layout": { "bays": { "between": ["left", "right"], "ratio": ["1", "phi", "1"], "gutter": "rule:hair",
                      "areas": ["aside", "main", "related"], "compact": ["main"] } }
```
## Example 4 (brief): the minimal card
```jsonc
{ "id": "menu-card",
  "frame": { "shape": { "rect": { "join": { "superellipse": { "n": 4, "r": "em*phi" } } } }, "profile": "none",
             "surface": { "fill": "paper", "texture": "paper-grain", "shadow": "soft" } },
  "layers": [ { "block": "pink", "rect": "slot:hero.expand(clear).top(40%)", "z": -1, "blend": "multiply" },
              { "block": "sage", "rect": "slot:aside.expand(clear*phi^-1)", "z": -2 } ],
  "breakouts": [ { "sort": "sprig", "anchor": "tr", "overhang": "phi^-1", "avoid": "content",
                   "fallback": ["tl", "br"], "minRoom": -0.5 } ],
  "rules": [ { "hairline": "rule:hair", "between": ["hero", "menu"] } ] }
```

## Relationships

## How a relationship is expressed
A relationship is a **typed record stored on the child**: "this thing hangs from that thing, like so". Every node lists its inputs by id. That makes the dependency graph explicit, serialisable and checkable for cycles on load, which is the Observable `define(name, inputs, fn)` model. The vocabulary is closed and small. It formalises the four exact operations found in the drawing (copy-along, scale-about, mirror, attach-to-curve), plus what the other styles need:

| Relation | Meaning | Example |
|---|---|---|
| `point` / `on(track, station)` | a point fixed, or riding a track at `u` / `s` / angle | fan convergence at `core` 180° |
| `chain` (Cesàro turtle) | pieces appended with G1/G2 continuity, with optional closure onto a target | medallion sweep: arc → clothoid → clothoid → line → `stem` socket |
| `offset(of, d)` | parallel curve with a cusp guard (`|d| < Rmin`) | second ribbon line |
| `family(between, count, spacing law, converge)` | a fan or blend of lines between two guides; spacing `uniform` or `geometric(r)` | medallion fans A–D |
| `copyAlong(proto, track, by, step, count)` | stamped copies at stations | ring loops every 28° |
| `gnomon(proto, pole, step, count)` | repeated spiral similarity; tips lie on a log spiral by construction | flame leaves |
| `mirror(axis)` / `symmetry` | reflections | right-hand corners, crest, side leaf |
| `socket → track` | a track starts from a sort's exit state (point, heading, curvature) | garland leaves the medallion |
| `assembly` / `setting` / `join` | stretch and fit along tracks | rail clasp, finials, block corners |
| `rung(k)` / `ratio` | a length on the metric ladder | `ringR = R·φ^0.5` |
| `fit: whole / whole-halves` | integer repeats along a length, with hysteresis | weave periods, beads, flutes |
| `bind(selector)` | geometry driven by a live DOM measurement | cartouche around the `<h1>` |
| `assert` | a checked condition, never solved | `minGap ≥ 0.75px`, `noCrossing`, `golden within 2%` |

## How relationships are solved
1. **Directed propagation is the default.** The graph is sorted topologically once at load. A cycle is a load error that names the loop. Following Cassowary's own authors, acyclic networks are solved by local propagation, which is an order of magnitude faster than a simultaneous solver. SolveSpace's group model (solve stage by stage, holding earlier stages fixed) is the same idea.
2. **Each node owns a bounded local solve where it needs one.** Examples: chain closure over 1–3 `free` values (Newton, warm-started, capped iterations); G1 clothoid connectors (Bertolazzi–Frego); Spiro knot splines wrapped with a residual check. Every solve returns `{value, status, residual}` and falls back to the last good value, then to a simpler curve.
3. **No global solver ships.** In the Lab, two optional offline tools can bake their results into parameters: planegcs for a genuine mutual constraint such as two tangent circles, and energy minimisation for "encourage even spacing". The relation then stays behind as an `assert`, so any drift is flagged.
4. **Evaluation is incremental.** Each node has a version-stamped memo (the Preact "signal boosting" algorithm, about 150 hand-written lines, or `@preact/signals-core` at about 2 KB). Epsilon equality on geometry stops propagation when an output did not actually change. Nodes behind inactive rules never run.

## How relationships are validated
- **Continuity:** every join reports Δθ and Δκ, and the Lab shows a curvature comb and a G0/G1/G2 badge.
- **Validity guards** are derived from the geometry: offsets need `|d| < Rmin` on the concave side; weaves need `A < Rmin` and ribbon half-width `h < λ²/(4π²A)`; width outlines need `w·κ < 1`.
- **Hinting checks at the current device px:** hairline floors, gaps under 1 device px, stripes that were dropped.
- **Locks:** a φ-locked relation is reported if any override breaks it, and it shows a deviation readout.
- **Compatibility:** the validator refuses an `interpolate` on a discrete parameter.

## How relationships are edited (no METAFONT)
- **Gesture first.** Select two things on the canvas and a relation menu offers only the relations that make sense, for example "attach at station", "make tangent (G2)", "copy along", "mirror", "same length", "put on golden rung". Choosing one writes the record.
- **Badges on the canvas** (small CAD-style glyphs) mark each relation. Hovering a badge highlights its parent and child.
- **Prose readback.** The inspector renders each record as a sentence, for example: *"Fan A: 6 hair lines between guide A1 and guide A2, evenly spaced, converging on the core circle at 180°."* The owner reads and edits relations as sentences with editable tokens. JSON is a "view source" escape hatch.
- **Handles map to 1–2 parameters each.** Each node type declares `getHandles()` and `onHandleDrag() → patch`, as tldraw does. A drag inverts only those parameters (the dragged values change, the rest stay put, following Cassowary edit/stay semantics) and snaps to stations, golden rungs and anchor angles. Locked parameters show a padlock and cannot be dragged.
- **Detaching bakes.** Deleting or detaching a parent offers "bake to absolute geometry" (tldraw's isolate) rather than breaking the child.
- **One undo step per drag.** Undo works on immer patches: a mark at pointerdown, squash at pointerup, bail on Escape.

## Curves

The rule is **one curve family per job**. Each family is defined intrinsically (tangent angle θ(s) and curvature κ(s) over its own arc length), so G2 at a join is just a comparison of (x, y, θ, κ), and arc length comes free for stations and motion.

| Job | Family | Why | Notes |
|---|---|---|---|
| Straight rails, bands, panel rules, mid-century stripes, deco steps | **line** | exact | Snapped to device px in `flat` and `blueprint` finishes. |
| Medallion rings, bead circles, oval cartouches (as 4-arc ovals), semicircular arches, compass work | **circular arc** | the designer's compass | Emitted as the SVG `A` command (exact). Inside fitted outlines, arms = (4/3)·tan(Δθ/4)·R with Δθ ≤ 60–90°. |
| Medallion S-sweeps, ribbon easements, stems, any "sweep" | **clothoid / Euler spiral**, and **Spiro** (Euler spline) through knots | the drawing analysis measured the limbs as clothoids (R² 0.98) | Evaluated by 16-point Gauss–Legendre on pieces turning ≤ π/2. Fresnel integrals are not used near κ₁ ≈ 0. Spiro (npm `spiro`, Apache/MIT) is wrapped with NaN, bend and residual checks, falls back to Hobby, and is given a small `delta` (≈0.25 rad), never the default L/3 handles. |
| A garland turning a page corner; line meeting arc | **clothoid transition** (railway easement) | removes the curvature jump that the current turtle's line+arc joins produce | Upgrades `framing/math/turtle.ts` into a Cesàro turtle with line, arc, clothoid, logSpiral and LAC pieces. |
| Flame tip curve, scroll eyes, curls, nautilus-like growth | **logarithmic spiral**: golden b = 0.30635, or a free b for volutes | self-similarity; the gnomon operator puts tips on it by construction | Closed-form arc length; stops before the pole with a G2 eye circle of radius b·s. Nested lines around an eye are rotated copies about the pole, not offsets. |
| Leaf sides, flourishes, rococo C and S scrolls | **log-aesthetic curve (LAC)** with an α "character" dial | covers clothoid (α = −1) through log spiral (α = 1) | Leaf sides are LAC α = 1 at golden b. The measured cubics have a mid-segment curvature peak, which is why they look drawn rather than engraved. |
| Cartouches, jewel, plaques, modern card corners | **superellipse** (exponent n; superness 2^(−1/n)) | n > 2 gives κ = 0 at the vertices, so straight runs join G2 | Built from Knuth's 8-knot construction, or sampled and fitted. n = 4 gives an iOS-like squircle for the card. |
| Wide arches | **three-centred (basket-handle) arch**, then **segmental** | the traditional answer when span/height grows | Chosen by a rule on aspect; all made of circular arcs. |
| Ribbons weaving down the sides | **sinusoidal offset strand** along a spine | analytic, with exact derivatives | Amplitude is derived from the crossing angle (A = tan(θ/2)·λ/2π); guarded as described in relationships. |
| Sunburst rays, line fans, guilloché | **ray families** and **rose-engine waveforms** | spacing law is the design | Angular spacing `uniform`, `geometric(r)` or `hierarchy`. |
| Engraved swelling lines, ribbons, leaf blades | **variable-width outline** p ± w(s)·n | SVG has no variable stroke | Filled nonzero, w·κ < 1; caps are an arc or a taper. |
| Live-drag preview, fallback | **Hobby** (port of hobby.js, ISC) | fast, roughly G2 | Never in final output. |

**Output.** One fitter turns every family into SVG cubics at a tolerance given in **device px**: about 0.1 px for the static layer, coarser for motion. Phase 1 uses equal-turn subdivision with arc-corrected arms and a sampled error check, which measured 2–3 cubics per clothoid limb and 6–8 per golden-spiral turn. Phase 2 ports kurbo's area/moment fit. Exact arcs stay `A` commands. Coordinates are rounded to 2 decimals in CSS px.

## Golden ratio

## Where φ is enforced by construction
1. **Family metric ladder** (like modular-scale type). Every family metric is `em·φ^k` with k on half-steps (√φ). The Lab's metric editor is a vertical ladder, and dragging a metric snaps rung to rung. Rail, band, corner, clearance, card radius and bay ratios therefore stay in golden proportion at every page size, because they are relations, not numbers.
2. **The gnomon operator.** Leaves, curls and scallops are copies made by one spiral similarity, rotate Δφ then scale e^(bΔφ) about a pole. With b locked to ln(φ)/(π/2) = 0.30635, the tips lie *exactly* on a golden spiral and the sizes shrink geometrically. That is "each leaf perfectly curved to uphold the golden ratio" made literal, with no fitting after the fact. The drawn flame shrinks linearly (1 → 0.27), so the Lab shows the change honestly: with golden b the tips move about 0.4–2.4u and the smallest leaves become larger.
3. **Golden leaf sides.** Leaf edges are LAC/log-spiral arcs at golden b instead of cubics with a mid-curve curvature peak. This is what makes them read as printed.
4. **Golden-section stations.** `phi:upper` (u = 0.382) and `phi:lower` (u = 0.618) are first-class snap targets for clasps, crest offsets, cartouche placement and the courier's resting point.
5. **Golden proportions in derived relations:** weave crossing angle 2·atan(1/φ); medallion ring `R·φ^0.5`; stem gap ratio `φ` (drawn 1.467); segmental arch rise `span/φ³`; bay ratio `1 : φ : 1`; card aspect; crest proportions optionally on rungs.
6. **Motion durations** come from a φ token scale (0.38, 0.62, 1, 1.62 s). This is a token convention, not a perceptual claim.

## How φ is protected
- **Locks have three states:** `phi` (frozen: no handle, no room expression, no override), `rung` (snaps to half-steps, so any φ^k/2 is allowed), and `free`. A free value shows its nearest rung and its deviation as a percentage in amber.
- Locked values cannot be driven by the room axis, which follows the "locked" parameter kind from the thresholds research. A medallion can shrink, but its ring-to-core ratio stays golden.
- **Validators report** golden pitch (the slope of ρ against s on spirals), copy-scale ratios and section positions to a 2% tolerance. Below about 2%, people cannot tell the difference, and above it a match is likely chance.

## Escape hatches
- **Per family:** `"ladder": "phi" | "sqrt2" | "4:3" | "free"`. The deco family might use √2 steps; the crest's inner heart is a 1/√2 copy in the drawing and stays `"ratio": "1/sqrt2"` unless the owner chooses φ. The engine encourages φ but does not impose it on everything.
- **Per parameter:** unlock to `free` with a visible badge. Per spiral: `b: "golden" | number | "volute"`. The medallion curl stays a tight volute (b ≈ 0.15); forcing golden would halve its turns.
- **Spacing laws are dials, not φ.** Measured fans are near-uniform, and φ spacing would collapse the inner lines.
- **Fit, then snap, with a report.** On import from Illustrator the Lab fits families, reports the free fit (for example "flame tips: log spiral b = 0.49, RMS 0.21u"), and offers "snap to golden: tips move max 0.69u". Nothing snaps silently.
- **The engine never searches drawings for φ.** Any ratio is within 12% of some half-power of φ (the look-elsewhere effect), so φ is imposed by construction or not at all.

## Thresholds

## Model: frames as optically sized type
**Room is an automatic axis, measured per slot**, the way `opsz` follows the rendered size of text.
- For each slot (corner, side rail, top band, cartouche, crest, bay), `z = log_φ(s / sRef)`. Here `s` is the slot's governing size in CSS px: `min(w, h)` for a corner, gutter width for a rail, band height for a band. One z step is ×1.618, a normal ratio between design sizes (real systems use ×1.28 to ×2).
- `length` drives counts only, never which variant is chosen. `devPx` drives hinting only.
- Following the `opsz` rules: pinch-zoom never changes the variant (browser zoom does, because it relayouts), and z is clamped at the ends of the designed range rather than falling back to a default.

## Two tiers
1. **Page width classes**, owned by CSS: `compact` < 600, `medium` 600–1200, `wide` ≥ 1200. These decide **which slots exist** and the grid template. For example, on compact there are no side gutters, so rails become a thin `rail·φ^−2` and the garland collapses to double rules or runs along the bottom only.
2. **Per-slot room levels** decide the **variant inside each slot**: masters, interpolation and rules.

## Rules (the variable-font model)
- **Every parameter has a kind:**
  - `continuous` (interpolates);
  - `discrete` (steps);
  - `grow` (discrete, but new members are born from zero scale or width across the hysteresis band, which suits engraving better than an opacity fade);
  - `locked` (φ constants; no room input).
- **Masters.** The designer authors 2–4 masters per sort or profile, with more and bigger changes at the small end (as optical masters do: the phone corner needs the most design attention). Continuous parameters interpolate across masters with the OpenType/fontTools variation model, which handles sparse masters on several axes.
- **Discrete steps.** Where discrete parameters differ between neighbouring masters, the engine inserts a step at the **log-midpoint** between them (the `rvrn` "midway" rule). The designer can drag it.
- **Rules** (`when: {room: "< -1.6"}`) **swap** a sort or **collapse** a profile when the topology must change. A pinned override at any z beats interpolation (as SF Symbols explicit variants do).
- **Hysteresis.** Each switch is a Schmitt trigger: up at t·φ^h, down at t·φ^−h, with h = 0.05 by default (about ±2.4%). On first load there is no history, so the choice is canonical and a reload is deterministic.
- **Evaluation order per slot** follows the multi-scale cartography order: (a) which elements exist (min/max room, visibility parents: a collapsed corner hides its whole subtree), (b) topology and discrete parameters, (c) continuous parameters, (d) pens with device-px floors, (e) collisions by priority (optional parts drop first; fallback anchors are tried in order).
- **Line families keep their texture.** Hatch, lattice, beads and ticks keep pitch roughly constant in screen px and change their counts, rather than scaling the pitch down.

## Worked swaps the owner asked for
| Slot | Large | Medium | Small | Smallest |
|---|---|---|---|---|
| Victorian corner | medallion L (7-line fans, 11 loops, curl) | M (6, 9) | S (4, 6, no curl) | `medallion.block`: ring + stem only |
| Victorian rail | 3-strand plait (`ss03`) or 2-ribbon twist + side leaf | twist, no leaf when length < corner·φ² | — | double rule |
| Mid-century band | 12 stripes, 3-chevron groups, finials | pins halved | 9 stripes (no pins, no sage), 1 chevron | 5 stripes, block rings 2 → 1 |
| Blueprint ruler | major/minor/micro ticks | micro dropped when pitch < 4 px | minor at every 2nd | majors + labels only |
| Beaux-Arts | fluted pilasters, semicircular arch | three-centred arch when span/height > 2.2 | `pilaster.strip` | lintel (compact class) |
| Deco spine | full sequence | sequence with optional members dropped by priority | — | — |

## Authoring
Any parameter can be promoted from a constant, to masters, to a stops table, to a raw expression, as in Maputnik. The owner normally edits masters and bar ranges, never expressions.

## Preview
In the Lab:
- **ScaleMaster strip per slot:** one row per element and per discrete parameter, z on a log axis with ticks at φ steps, coloured bars per variant, draggable break points, and markers for where 360, 768, 1280 and 1920 px widths land.
- **Generated filmstrip:** each master, both edges of every threshold including the hysteresis band (Polypane "breakpoint edges"), and the clamped extremes. Each cell carries validator badges.
- **Waterfall proof:** the whole frame at φ-stepped room levels side by side.
- **Sweep button** that animates z from min to max to catch pops.

## Animation

## Model
**Motion is parameters changing over time on the solved frame, not a separate animation layer.** A motion record names a trigger, a target parameter path (`courier.u`, `garland.left.phase`, `flame.leaves.grow`, `axes.grad`, `part.reveal`), from/to values, duration, easing (a CSS `linear()` string designed in the Lab) and a reduced-motion substitute. State is always held as track-relative `u` or `s`, never in pixels. A resize therefore just re-solves and keeps `u`.

## Runtime: one MotionDirector with three tiers
- **Tier A, compositor** (rigid travellers, cross-fades). Sample the track at uniform arc length (64–128 keyframes) and call `element.animate()` with `transform: translate() rotate()` keyframes at `offset = s/L`. The motion stays smooth while the router mounts the new page. Travellers are rendered as a `<g transform>` or a small absolutely positioned HTML wrapper holding a tiny SVG, **never** `<use x= y=>`: Chromium refuses to composite those, and the current code places ornaments that way.
- **Tier B, paint** (draw-in, ink pulse). Spines carry `pathLength="1"` so dash windows are fractions of arc length that survive a re-solve. Filled engraved outlines are revealed through per-piece masks, with offsets shifted by each piece's start `s` on its strand, so a reveal flows across weave crossings and is hidden where the strand passes under.
- **Tier C, geometry** (weave ripple, leaf unfurl). A single rAF loop driven by the timestamp re-evaluates only the subgraph downstream of the animated parameter, within a frame budget (target 4 ms, to be measured). Over budget, it falls back to Tier B or A.

## First motions, in order of value
1. **Courier** (the owner's "arrow things", on route change). Mid-century: the 3-chevron group leaves its stud block and rides the mustard lane to the next block. Victorian: the medallion's dart rides a ribbon strand down the side and docks at the flame. It runs at constant arc-length speed, takes 0.6–1.6 s scaled to track length, uses a "printing press" easing (near-constant velocity, short ease in and out, no bounce), and is masked under weave crossings by the over-pieces' halos. Reduced motion: a soft opacity blink at the destination socket.
2. **Focus and hover along a track** (functional, not decorative). Hovering or focusing a nav item sends a short ink pulse (Tier B) along its band lane to its cartouche, and raises that cartouche's `grad` slightly with no reflow. A normal CSS `:focus-visible` outline is always kept as well.
3. **Construction replay** (first visit only, 1.2–2 s). Dominant tracks draw first; each dependent starts when its parent's pen passes its attachment station. The order comes from the attachment graph, so the relationships are what the viewer sees.
4. **Unfurl** (flame leaves grow in gnomon order) and **Rose-engine turn** (a guilloché band rotates by 2π/lobes, so it ends identical). Later.
5. **Settle**: a cross-fade of at most 250 ms when a threshold or whole-number count changes. A topology change is never morphed.

## Lifecycle and accessibility
- Every motion is event-triggered and finishes in under 5 s, with no ambient loops, which stays clear of WCAG 2.2.2.
- `prefers-reduced-motion` is read with matchMedia plus a change listener, and the site also offers a "still engraving" toggle per viewer. Either swaps every motion for its opacity variant.
- On `visibilitychange → hidden`, running motions commit their end state. Nothing is queued while the page is hidden.
- On resize: finish the motion instantly, re-solve, and rebuild the keyframes.
- Route changes use a same-document View Transition **for the content only**. The frame layer is kept out of the raster snapshot (`::view-transition-group(frame){animation:none}`, old image hidden), because a scaled snapshot of hairlines distorts line weights. Couriers start after `updateCallbackDone`, once the frame has been re-solved for the new page height.
- No GSAP (proprietary Webflow licence), no Rive or Lottie (geometry baked at authoring time), no SMIL.

## Hooks that must exist from the first milestone, though motion ships late
- Every track exposes `length`, `pointAt`, `tangentAt` and `curvatureAt`.
- Rendered pieces have stable ids and their `s`-range on the parent track.
- Weave pieces keep over/under order and halos.
- The graph exports a topological order.
- Rendering is split into a static layer and an overlay layer.

## Frame Lab

## What it is
A browser type-design tool for frames. It is served only by the Vite dev server (`lab.html`). A dev-only plugin writes real files to `frames/**` through validation, so git is the history and nothing lives only in localStorage. It runs the **same `fount-core` evaluator** as the site, so what the owner sees is what ships. Illustrator remains the sketchbook; the Lab is where relationships live.

## Screens (named after their type-tool equivalents)
1. **Family overview** (like a font overview). A grid of every sort, profile, join and assembly in the family. Each cell shows three room masters side by side, with a validity dot (green, amber, red). Buttons: new sort, new profile, import from Illustrator, duplicate family, switch theme.
2. **Sort editor** (like glyph edit view).
   - Large canvas with a construction overlay that can be toggled: tracks, poles, stations, curvature combs, G2 badges, golden-section ticks, sockets and anchors.
   - Left: the layers and parts tree. Right: an inspector with relation sentences, parameters (with lock state and nearest rung) and pens.
   - Top: master tabs (S / M / L) with an **interpolation slider** that previews instances, plus "add master here" and "pin override here".
   - Bottom: a validator tray listing guard failures and continuity jumps, each linked to its node.
3. **Profile editor** (an architect's moulding section).
   - The cross-section is drawn as a vertical strip of stripes. Boundaries are dragged; palette chips are dropped onto stripes; priority and lane name are set per stripe.
   - To the right, a live sweep of the profile along a test track that has a straight run, a corner join and a curve, so join behaviour is visible while editing.
   - Below, a hinting preview at 1×, 2× and 3× DPR across five room levels shows which stripes merge or drop.
   - **Section sampler:** drag a line across an imported image or SVG (for example the left edge of `websiteOutline.svg`). The Lab proposes stripes snapped to the nearest palette tokens with their depths, which turns a traced, wobbly piece into an exact profile in minutes.
4. **Setter** (like a text proof).
   - The whole frame around **real site content**: pick a route, or paste text. The viewport can be resized by handles, and there is a "content height" slider.
   - A slot overlay shows grid areas and type-area lines. Setting bars under each track show glue badness, whole-number counts and their hysteresis state.
   - Cartouches bind to editable sample titles, so a long title can be typed and the assembly watched as it grows.
5. **Designspace** (like a designspace or Superpolator view).
   - A 2D plot (room × rich, or any two axes) with masters as dots, the current instance as a draggable crosshair, and shaded regions where rules apply.
   - Beside it, the **ScaleMaster strip** for each slot (variant bars against a log room axis, with device markers), the **generated filmstrip** (masters and both edges of every threshold), and a **sweep** button.
6. **Waterfall and contact sheet** (like a print proof). The frame at φ-stepped room levels and at real device sizes (360×780, 768×1024, 1280×800, 1920×1080, plus a very tall article page), exportable as a PNG or PDF proof via the CLI.
7. **Theme panel.** Palette tokens, light direction dial with ramp preview on a stud-block and a bevelled band, finish selector, dark-mode overrides and `grad`. "Apply to family" re-skins live, so any family can be checked in any theme.
8. **Motion lane.** One lane per motion record: scrub, replay, reduced-motion preview, the same motion played across the contact sheet sizes, and a ms-per-frame meter per tier.

## Interactions that replace programming
- **Relation by gesture:** select two items, and a context menu offers only relations that make sense. Badges appear on the canvas; sentences appear in the inspector.
- **Handles** move only their own 1–2 parameters, snap to stations, rungs and anchor angles, and cannot move locked values. Shift gives 15° steps.
- **Promote a value:** constant → masters → stops table → expression (the last behind "view source").
- **Import and fit:** paste SVG from Illustrator, ideally with named layers (`skeleton`, `leaf-proto`, `guides`). The Lab fits each path to the best family (line, arc, clothoid, log spiral, LAC, superellipse) and proposes relations it detects: copies, mirrors, ends on circles, convergence points. It shows residuals, and the owner accepts each one. A "snap to golden" button reports how far tips move.
- **Undo** is one step per gesture. Session state (zoom, selection, preview size) is never written to files.
- **Static sorts first:** existing `hand-drawn.json` pieces can be dropped in as static sorts with their hulls and sockets, then upgraded to fitted, then parametric, without changing the family.

## A designer's session, minute by minute (mid-century frame from the traced piece)
- **0:00** `npm run lab`. Open the `moderne` family overview (empty). Import `websiteOutline.svg` as a reference underlay.
- **0:03** New profile. Drag the section sampler across the left side. The Lab proposes 12 stripes snapped to the 7 palette tokens. Rename lanes; mark the mustard stripe as lane `track`.
- **0:08** Adjust the pinstripe group to a whole-number repeat. Set priorities (sage 5, pins 4). In the hinting preview, stripes merge cleanly at small room levels.
- **0:13** Corner join → `block`. Open `stud-block`: rings 3, step φ^−1 (locked). Turn the light dial to top-left and the facets re-tone from the ramp.
- **0:19** Setter: drop `chevron` at the start and end of every side (repeat 3) and `finial` as the fill. Drag the viewport height: the finial count changes in whole steps, and the badness bar stays green.
- **0:24** Type area: drag grid areas (masthead, nav, main, colophon). Bind the top plaque to `[data-fount-cartouche=title]` and type a longer title; the plaque's extender grows.
- **0:29** Insets: add an `inset` frame on `main` with `notch` corners at `em·φ`.
- **0:33** Designspace: add master S at room −1 (rings 2, one chevron, pins halved). Drag the auto-inserted break to where the phone marker sits. Filmstrip edges look clean.
- **0:38** Theme: apply `blueprint` to check the structure re-skins (stripes become hairlines), then switch back.
- **0:41** Motion lane: add `courier` on route change. Scrub, then preview reduced motion.
- **0:45** Save. `frames/families/moderne/**` is written, the blog tab hot-reloads, and `git diff` shows readable property-level changes.

**Victorian variant of the same loop:** paste the flame from Illustrator. The fit report reads: "tips: log spiral b = 0.49 RMS 0.21u; leaves are similarity copies (RMS 0.003u), scales linear". Accept **gnomon** with b locked golden (tips move ≤ 2.4u, small leaves grow). Accept the leaf-side LAC refit. Drag the leaf count master from 6 to 4 for S. Then the garland's ribbons are connected by selecting the medallion's `stem` socket and the flame's `rail` socket and choosing "track between (G2)".

## Engine architecture

## Packages (one repo, three entry points)
```
packages/
  fount-core/        shipped runtime, no framework, no solver, no Zod
    geom/            intrinsic pieces (line, arc, clothoid, logSpiral, lac, superellipse), Cesàro turtle,
                     Gauss–Legendre evaluator, arc-length tables, offsets/strands/width outlines, fitter
    expr/            hand-written arithmetic parser → AST (phi, rung, sqrt, min, max, clamp, lerp)
    doc/             types, tolerant loader, migrations, algo pins
    eval/            DAG builder + topological sort, version-stamped memo, local solves with status
    space/           axes, masters, variation model, rules with hysteresis, kinds (continuous/discrete/grow/locked)
    setter/          tracks + stations, assemblies (MATH-style), settings (glue/badness), joins, terminals
    layout/          type area → CSS custom properties + grid-template-areas; slot measurement; bind()
    theme/           palettes, light rule → facet tones, finishes, hinting (device-px floors, snapping, drop/merge)
    render/          SVG emitter: static layer (keyed DOM diff) + overlay layer
    motion/          MotionDirector (tiers A/B/C), lifecycle, reduced motion
    host/            <fount-frame> custom element
  fount-lab/         dev-only editor (Zod schema, handles, history, import/fit, optional planegcs)
  fount-cli/         Node: validate, render proofs/contact sheets, snapshot tests, emit metrics CSS
```

## Pipeline per frame
1. **Inputs:** container inline size, width class, `devicePixelRatio`, user axes (theme, route, stylistic sets), measured slot rects (content slots and bound text), page height.
2. **Metrics**, from width only: `em` and the ladder are published as CSS custom properties and the grid template.
3. **Room per slot** → instance (masters, rules, hysteresis), with z quantised to 1/32.
4. **Sorts** evaluated in local units, **cached by (sort id, instance key, theme-independent)**. A medallion is solved once per instance and only *placed* afterwards.
5. **Setter:** tracks between sockets, assemblies, settings (whole counts with hysteresis), joins, terminals. This is the only stage that depends on page height.
6. **Placement** (similarity transforms only) → **profiles swept** along tracks → **hinting** at the current `devPx`.
7. **Render:** a keyed diff of the static SVG, so only changed paths get new `d` attributes. This replaces the current `innerHTML` rewrite of the whole SVG. The overlay is handled separately.

## Solver policy
Directed propagation everywhere. Local, bounded node solves (chain closure, G1 clothoid connectors, Spiro) with warm starts, iteration caps, NaN checks, `{value, status, residual}` and a last-good fallback. No global solver in the runtime.

## Caching and invalidation
- The memo stops propagation when outputs are epsilon-equal.
- Content-height changes invalidate only setter stages 5–7, never sorts.
- Width changes invalidate metrics, then room, then only the slots whose quantised z changed.
- Theme changes re-colour only (stage 6 and render); geometry is untouched.

## Determinism
- No `Math.random`; seeded PRNG if jitter is ever used.
- Fixed iteration counts. Rounding on output and in files.
- Snapshot tests run in one engine (Node, in CI) with a tolerance compare, because JS Math precision differs across browsers.
- Algorithms are pinned per node (`algo: "v1"`).
- Hysteresis applies only to live resizes; a load is canonical.

## Performance targets (to be measured, not promised)
| Operation | Target |
|---|---|
| First solve of a full engraving frame on a mid-range phone | < 30 ms |
| Height-only resize (setter + sweep) | < 3 ms |
| Width resize within one instance | < 6 ms, coalesced to one rAF |
| Static SVG size | < 3,000 elements per page |

- To stay under the element budget, each sort emits **one compound `<path>` per pen layer**: all hairlines of a medallion become a single path.
- Filters are never animated. Fewer than 50 animated elements at a time.
- A sort costing more than 2 ms gets prebuilt instances from the CLI for common room levels (like pre-instanced fonts), with a runtime fallback.

## Size budget
`fount-core` should be about 35–55 KB min+gzip including the curve kernel. Optional `spiro` adds about 10 KB. Lab dependencies (Zod, immer, planegcs) never ship.

## Rendering

## Layers
| Layer | Contents | Notes |
|---|---|---|
| 0. Ground | CSS background on the frame host: paper colour token, optional tiled paper-grain image generated once by the CLI, blueprint aged-paper tint | Never an animated `feTurbulence`. |
| 1. Static frame SVG | One `<svg>` per page, absolutely positioned, `viewBox` in CSS px (no non-uniform stretching, no `preserveAspectRatio` tricks), `aria-hidden="true"`, `pointer-events: none`, `view-transition-name: frame` | |
| 2. Content | Real HTML in grid areas, including all cartouche text, nav and headings | |
| 3. Overlay | Travellers, pulses, hover glows and **breakout** elements such as the card's sprig, which crosses the frame and content edge | `aria-hidden`; only `transform`/`opacity` animated on wrappers. |

## Finishes (the same geometry, drawn differently)
- **`engraved`.** Every line is a **filled outline** with a width profile (p ± w(s)·n), filled nonzero. Pens have device-px floors (hairline ≥ 0.5–0.75 CSS px); lines below one device-px gap merge or drop by priority. Weave crossings are painted under-pieces first, then over-pieces with a paper halo. Tone from the light rule becomes **hatch density and weight**. That is how an engraver shades a moulding, so a Beaux-Arts cornice in engraving finish is shaded by line spacing. Optional ink gain: a static, CLI-pre-baked micro-dilation for desktop only. It is off by default and never live.
- **`flat`** (mid-century, deco). Fills only, no strokes.
  - Stripes are snapped to integer device pixels.
  - Each stripe is painted as a full band from the outside in, so every stripe overlaps the next and adjacent fills show no anti-aliasing seams.
  - `shape-rendering: crispEdges` on rectilinear parts, `geometricPrecision` on curves.
  - Bevel facets are chosen from 3–4 discrete ramp tones, not gradients: tone = ramp[quantise(dot(facetNormal, light))].
- **`blueprint`.** The palette is inverted (paper is blue in the inverted band, line colour is paper). Filled stripes render as **boundary hairlines**. Ruler ticks are snapped to whole device px with a nice-number pitch (1/2/5 × 10ⁿ). Running border text uses SVG `<textPath>` on a lane, as real selectable text, or `aria-hidden` when it only repeats content.
- **`card`.** The surface, rounded superellipse corners (a CSS `clip-path: path()` emitted by the engine, or `shape()` where supported), soft shadow and texture are **CSS on the HTML card**, which is cheaper and sharper than SVG filters. The SVG draws only the hairlines and colour blocks; breakouts go to the overlay.

## The printed look
"Printed" comes from exact families, exact repetition (gnomon, copyAlong, whole-count settings), curvature continuity and **hinting**, not from texture. Hinting is the type analogy taken literally:
- weights expressed in screen units with floors;
- stripe and tick snapping;
- merging lines that crowd below a device pixel;
- watching `devicePixelRatio` through matchMedia.

Small rooms therefore get relatively heavier, simpler line work, as small optical sizes do.

## Print and export
`@media print` re-solves the frame at the paper size in CSS px with `devPx` set high, so hairlines are allowed down to 0.25 px. Engraving suits print. The CLI exports any family at any size as SVG or PDF for posters.

## Site integration

## Host: a framework-free custom element
```html
<fount-frame family="engraving" theme="ink-on-paper" features="ss03">
  <header data-fount-area="masthead">
    <h1 data-fount-cartouche="title">Parkington Programs Studio</h1>
  </header>
  <nav data-fount-area="nav">…</nav>
  <main data-fount-area="main" data-fount-content>…router view…</main>
  <footer data-fount-area="colophon"><p data-fount-cartouche="colophon">…</p></footer>
</fount-frame>
```
The element:
- uses **light DOM**, so site CSS and Tailwind still apply;
- sets `display: grid` and a constructed stylesheet with `grid-template-areas` for the current width class;
- publishes metrics as custom properties (`--f-em`, `--f-rail`, `--f-band`, `--f-clear`, `--f-measure`, plus `--f-variant-corner: medallion-s` for CSS style queries);
- inserts the static SVG as its first child and the overlay as its last.

API:
```ts
frame.axes = { rich: 0.6 }
frame.features = ['ss02']
frame.play('courier')
frame.addEventListener('fount:variant', …)
frame.addEventListener('fount:solved', …)
```

## Frame-first layout in both directions, with no loop
- **Width → frame.** Metrics depend only on the container's inline size and width class, which yields the grid template and the custom properties. The frame defines the type area: gutters, bands, column and bay ratios (for example `1fr φfr 1fr`), measure, insets.
- **Content → frame.** The SVG is absolutely positioned and never affects layout, so a ResizeObserver on the host and on bound elements is a one-way read. Height and bound rects only change **track lengths, setting counts and assembly extenders**, never metrics, so the frame cannot change the box it measures. `scrollbar-gutter: stable` on the root stops a scrollbar from flipping the width across a threshold.
- **Two kinds of slot.**
  - *Metric slots* (masthead, nav band, cartouche boxes) are sized by the frame, and content flows into them.
  - *Content slots* (main, panels, bays) are sized by content, and the frame closes around them. Panel and bay rules are drawn exactly on the resolved grid lines, read from `getComputedStyle(el).gridTemplateColumns/Rows`, which return resolved px tracks. Gutter rules always sit on real gutters.
- **Cartouches hold real text.** The plaque or ribbon assembly measures the bound element's text box and grows its extender, with a minimum and a maximum. When the maximum is hit, CSS wraps the text and the frame adds height.
- **No layout jump on first paint.** The CLI emits `fount-metrics.css` per family, giving each width class's metrics as `clamp()` expressions, so content lays out correctly before JS runs. The SVG then fades in within about 100 ms. A pre-rendered SVG for the most common size can be inlined for the home page.

## Functional and dynamic behaviour
- **Routing.** `router.afterEach` → `frame.route = name`. That switches stylistic sets and axes per route, and triggers couriers after the View Transition's `updateCallbackDone`.
- **Hover and focus** along tracks: a nav link's `data-fount-lane` lets the overlay pulse its lane. Focus states never rely on decoration alone.
- **Changing content** (Supabase-loaded articles, the Tiptap admin) is handled automatically: ResizeObserver, then the setter re-fits.
- **Accessibility:** all decoration is `aria-hidden`; text is real; reduced motion and the "still engraving" toggle are respected; contrast checks run on palette tokens in the Lab.

## Leaving Vue
The engine has **zero Vue dependencies**. Step 1: `Frame.vue` becomes a roughly 20-line wrapper that renders `<fount-frame>` (Vue treats it as a custom element through `compilerOptions.isCustomElement`). The current `frameEngine.ts`/`frameSettings.ts` are retired once the `moderne` and `engraving` families reproduce today's frames. My recommendation is to **keep Vue for the app** (router, Supabase auth, Tiptap admin), because rewriting it does nothing for framing; the framing layer has left Vue either way. If the owner later moves to a multi-page or static setup (for example Astro or plain HTML), `<fount-frame>` works unchanged; cross-document View Transitions then cover Chrome and Safari, and Firefox just navigates. **This is the owner's decision; the engine does not force it.**

## The Lab in the repo
`lab.html` is a Vite input only in dev. A plugin with `apply: 'serve'` adds middleware that validates and writes `frames/**/*.json`, and the blog tab hot-reloads from the same files. (Vite 7 config: check whether the repo's version expects `rollupOptions` or `rolldownOptions` for extra inputs.)

## Roadmap

Each milestone ends with something the owner can look at. Early milestones use flat colour and straight tracks, because they exercise the layout, profile and theme system that every style needs, and they produce a convincing result quickly. Curves come once the frame already works on the real site.

| # | Milestone | Visible deliverable | Contents |
|---|---|---|---|
| **M0** | Proof sheet | A PNG/SVG contact sheet of the mid-century moulding swept around rectangles at 6 sizes, with plain mitre corners | `doc` types, `expr` parser, line tracks, stripe profiles, flat finish, hinting (snap and drop), CLI renderer, snapshot test. Measure the pinstripes. |
| **M1** | Framed site | The real blog wearing `<fount-frame family="moderne">` on one route, resizing correctly, with stud-block corners, palette tokens and grid areas that the content flows into | `layout` (type area → CSS vars and grid), ResizeObserver host, keyed SVG diff, joins (`mitre`, `block`), light rule → facet tones, `fount-metrics.css`. The Victorian page keeps working by loading **static sorts** from `hand-drawn.json` (hulls and sockets) on straight double-rule tracks. |
| **M2** | Lab v0 | The owner edits stripes, palettes and metrics in the browser and sees the site update; saves land in git | `lab.html`, save middleware, Zod schema → JSON Schema, profile editor with section sampler, theme panel, waterfall and contact sheet, immer undo. |
| **M3** | Setter | Chevron terminals and finials set in whole numbers on the mustard lane; a blueprint ruler border with tick hierarchy; a title plaque that grows around the live `<h1>`; an inset frame with notched corners | Stations, settings (repeat, hierarchy, sequence, centred) with badness and hysteresis, terminals, MATH-style assemblies, `bind()`, nested frames. |
| **M4** | Curve kernel and garland | The Victorian woven garland running down the sides from the static medallion sockets, turning corners with G2 clothoid easements, with the side leaf as the rail's middle piece | Intrinsic pieces, Gauss–Legendre evaluator, Cesàro turtle, phase-1 fitter, offsets, the analytic weave strand with guards (promoted from `framing/generators/weave.ts`), filled-outline pens, `engraved` finish. |
| **M5** | Parametric sorts | The flame rebuilt with the golden gnomon and LAC leaves, next to the original with a deviation report; the medallion sweep as a closed clothoid chain | Sort editor, handles with drag inversion, relation gestures with badges and prose, Illustrator import and fit with residuals, snap-to-golden, Spiro wrapper with Hobby fallback, φ ladder and locks. |
| **M6** | Designspace | The frame at phone, tablet and desktop showing different designed variants (medallion S → block, twist → double rule, 12 → 9 stripes) with no flicker while resizing | Axes, masters, variation model, rules with hysteresis, ScaleMaster strip, generated filmstrip, sweep, `grad` in dark mode, stylistic sets per route. |
| **M7** | Architecture and modern | A Beaux-Arts frame (pilasters, three-centred to semicircular arch, bays as content columns) and the minimal card with a breakout sprig | Arch tracks, size variants then assembly, bays → grid, superellipse joins, layers and knockouts, overlay breakouts, `card` finish. |
| **M8** | Motion | Chevrons and darts running along their tracks on tab change; construction replay on first visit; reduced-motion variants | MotionDirector Tiers A and B, View Transition integration, visibility lifecycle, motion lane in the Lab. |
| **M9** | Polish | Deco family (stepped joins, spine sequence, sunburst), print stylesheet, performance pass | kurbo fit port, LAC Hermite, Tier C (ripple, unfurl), prebuilt instances, Bertolazzi–Frego connectors. |

**Early wins:** M0 and M1 should each take one to two weekends with AI help. Every milestone after that is useful even if the project stops there. The pending owner decisions (twist or plait, garland on the bottom or not, Vue or not) are all reversible switches in this model (`ss03`, a `bottom.assembly` entry, the host wrapper), so they do not block any milestone.

## Risks

- **Metaphor overload.** Masters, rules, assemblies, settings, joins and features add up to a lot of concepts for a solo designer. Mitigation: the Lab exposes them one at a time (profile and theme in M2, setting in M3, masters in M6). Most frames need only profile + joins + settings. Masters are optional, since one master equals no interpolation.
- **The METAFONT trap.** If relation-building in the Lab is weak, the owner ends up writing JSON expressions. Mitigation: gestures, prose readback, a closed vocabulary, handles that map to 1–2 parameters. Judge success by the M5 test: the owner builds the flame relation set without opening JSON.
- **Scope of the Lab.** An editor can absorb all available time. Mitigation: JSON plus the CLI proof sheet are usable from M0, and each Lab screen arrives only with the feature it edits.
- **Curve solver failures.** Spiro gives no convergence status and can loop; clothoid closures can fail to converge; drag inversion can jump between solutions. Mitigation: status and residual on every solve, the last-good fallback chain, iteration caps, and Hobby preview while dragging.
- **Interpolation surprises.** Interpolating parameters across masters whose structure differs can create odd in-between shapes (a fan spread made for 6 lines applied to 4). Mitigation: validator compatibility checks, discrete steps at log-midpoints, pinned overrides, sweep testing.
- **Threshold flicker and history-dependence.** Hysteresis makes output depend on resize history. Mitigation: a small band (±2.4%), canonical choice on load, cross-fades of at most 250 ms.
- **Layout loops.** These would only appear if someone made a metric depend on height. Mitigation: the schema forbids height inputs in `metrics`, and lint plus the runtime warn.
- **Performance on low-end phones** with engraving-density fans. Mitigation: one compound path per pen layer, caching per instance, z quantisation, prebuilt instances, hinting drops at small room levels, measured budgets in the Lab.
- **Browser differences.** Safari compositing of SVG children is unconfirmed (hence HTML wrappers for travellers); the CSS `d` property is missing in Safari; `shape()` is new; floating-point results differ, so tests need tolerances.
- **Golden overreach.** Forcing φ where the design wants √2 or a volute damages the art. Mitigation: three lock states, a ladder choice per family, honest deviation readouts, no φ hunting in drawings.
- **Traced sources are imprecise.** `websiteOutline.svg` is image-traced and its edges wobble; the pinstripe depth is inferred (about 21u). Mitigation: the section sampler plus snapping to palette tokens and the owner's own judgement; treat measurements as a starting point.
- **Text in cartouches.** Long titles, translations and user-generated headlines can overflow. Mitigation: min and max extender lengths, CSS wrapping fallback, the Lab's long-title proof.
- **Licences and IP.** Mapbox holds a patent (US10416866B2) on a value-versus-zoom graph editor, which resembles the room curve editor. Probably irrelevant for a private tool; check before publishing the Lab publicly. Avoid GSAP (Webflow licence wording on visual animation tools), libspiro (GPL), and planegcs in the runtime (LGPL; Lab-only).
- **Accessibility regressions.** Decorative motion, and focus states that rely on ornament. Mitigation: under 5 s and event-only motion, reduced-motion variants, CSS focus outlines always kept, all decoration `aria-hidden`.

## Novelty

- **A frame as a variable font.** The room each part has is an automatic, per-slot optical-size axis. Designed masters, with substitution rules where structure changes, replace breakpoint spaghetti. A medallion has optical sizes the way a typeface does, so the phone corner is *designed*, not shrunk.
- **Stretchy architecture from the OpenType MATH table.** Pilasters (base, shaft, capital), rails with clasps, and ribbon cartouches around live headlines all use one proven mechanism: try pre-drawn size variants, then assemble from fixed parts and extenders. I know of no web frame system that treats an architectural order as a stretchy delimiter.
- **Justified ornament.** Beads, finials, chevrons, ruler ticks, deco spine sequences and frieze scrolls are *typeset* along tracks with TeX-style boxes, glue and badness, in whole numbers with hysteresis. They never stretch visibly, and the count changes by deliberate choice, not by rounding.
- **Corners as ligatures.** A join table turns "two profiles meet" into a mitre, a carpentry stud-block, a medallion, a stepped deco corner or a notch. This is the same idea as a type ligature, and it gives every style correct corners from one rule.
- **Golden by construction, not by measurement.** A φ metric ladder for the whole family, a gnomon operator that puts leaf tips exactly on a golden spiral, and log-aesthetic leaf sides. φ is protected by locks, with honest escape hatches and deviation reports instead of numerology.
- **Re-skinnable structure.** CPAL-style palettes plus a lighting rule (facet normal against light direction) that one finish turns into flat bevel tones and another into engraver's hatch density. The same moulding can be mid-century paint or Victorian engraving.
- **Hinting for ornament.** Device-pixel floors, stripe snapping and priority-based merging, borrowed from TrueType practice, make hairlines and colour stripes look printed at every size. A `grad` axis compensates for dark mode without reflow.
- **The frame is the layout.** Each family publishes a type area (grid areas plus metric properties) that real HTML flows into. Width drives metrics and content height only drives track lengths, so there are no feedback loops.
- **Motion as a parameter.** Arrows riding their tracks are a station `u` animated by arc length on the solved geometry, composited and resize-safe. Construction replay follows the attachment graph, so the frame's own logic is what the viewer sees animate.
- **A type-design tool for frames.** Masters, an interpolation space, waterfall proofs, a moulding-section editor with a sampler that reads stripes off a traced image, and relations built by gesture and read back as sentences. These address the reason METAFONT failed with designers, while keeping its central idea that shapes are relationships.
