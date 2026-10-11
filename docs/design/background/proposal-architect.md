# Proposal (architect lens): Elevations: a frame-first layout engine and Frame Lab (the Architect's proposal)

> One of five competing proposals. Background for [the frame engine design](../frame-engine.md), which builds on the architect proposal with grafts from the others.

## Thesis

Treat a frame as an elevation rather than a border. Like a facade or an interior wall drawing, it is made of datums (named lines), bays, members (mouldings swept along tracks, corner blocks, orders, arches, punctuation) and openings, and the openings are the slots the site's real HTML lives in. The engine owns the page skeleton through one contract that cannot loop: widths go down, heights come up. Viewport width flows through the frame's proportions into a generated CSS grid. The browser lays out the content. The measured content heights flow back to close the frame around it. Every part of every style uses one vocabulary (track, profile, joint, punctuation, order, span, cartouche, motif, layer), and each part declares how it scales: fixed, stretch, repeat-fit, re-solve or hug. Each part also has room-dependent variants. A separate skin decides how that structure is painted: engraved ink, lit flat colour, blueprint, deco or paper card. Each curve is chosen by what its curvature has to do, and it is solved rather than drawn, so golden and similarity relationships hold by construction. The Frame Lab is an architect's drawing board for this: elevation, section, motif bench, scale strip and contact sheet. It writes one JSON file that a small runtime with no framework renders on the site.

## Core concepts

### The one rule: widths go down, heights come up
- The frame decides every horizontal size (column ratios, band depths, gutters, corner sizes, arch spans) from the host width and room levels alone.
- Content decides vertical extent. The frame reads it back and closes around it.
- No width may ever depend on a measured height. The validator rejects any width expression that mentions a y-datum or a measurement, so the "content resizes frame resizes content" loop is impossible by construction.
- This mirrors how CSS block layout works, so the frame and the browser agree.

### Skeleton (the layout)
| Term | Meaning |
|---|---|
| **Module (m)** | The base unit of a frame, in CSS px, set by room (e.g. 5px on a phone to 10px on desktop). It works like the classical module (half a column diameter). Member sizes are written in m, and golden rungs are `rung(m,k) = m*phi^k`. |
| **Hair** | A separate unit for line weight, in CSS px, with a device-pixel floor. Line weights do not scale with m; small rooms get relatively heavier, simpler line work, as icon optical sizes do. |
| **Datum** | A named straight line: `x-main-l`, `y-mast-b`. x-datums come from the width solve; y-datums come from measuring content. Datums double as CSS grid line names. |
| **Plan** | A layout tree for one page type (front page, article, index, card), chosen by route and width class. Each node splits into rows or columns. |
| **Bay** | A rectangle between four datums. Each bay is an opening, a band reserved for a member, a repeat of bays, or a nested (inset) elevation. |
| **Opening (slot)** | A bay that real HTML flows into. It is exposed as a CSS grid area and filled by an element with `data-slot="main"`. Fit modes: `flow` (height from content), `fixed` (height from frame), `hug` (a leaf sized to its own text, e.g. a cartouche title). `minH` may be a width expression, e.g. a golden panel `w/phi`. |

### Members (what is drawn)
| Term | Meaning |
|---|---|
| **Track** | Any path a member runs along: a bay edge, a bay ring (closed, with corners), an offset of another track, or a solved curve (arch, clothoid chain, log spiral, garland spine). Every track exposes `length`, `pointAt(s)`, `tangentAt(s)` and `curvatureAt(s)`. |
| **Station** | A position on a track: `u` (0..1), `s` (from an end), an angle, a socket, a datum crossing, or a DOM anchor (e.g. a nav link). |
| **Profile** | The cross-section of a moulding, from outside to inside. It is an ordered list of **strata**: rule, gap, fill, pinstripes, hatch, beads, ticks, text, zigzag, lattice, garland. Each stratum has a depth, a colour role, a **relief** (flat, bevel-out, bevel-in, round, cove) and a **priority** that decides what drops first when room shrinks. |
| **Moulding** | A profile swept along a track. |
| **Joint** | What happens where a moulding turns or meets another: mitre, butt, block (rosette/stud), motif (a drawn or constructed medallion or flame), step (deco), round (circle or squircle), notch, cartouche, plus tee and cross where column rules meet bands. |
| **Order** | A vertical member: base, shaft and capital. The shaft stretches or repeat-fits its flutes, while the base and capital keep their size. A pilaster, a column and the deco spine are all orders. |
| **Span** | A member across the head of a bay: lintel, segmental arch, semicircle, elliptical or three-centred arch, pediment. Its form is chosen by a rise budget, and its radius follows the bay width. |
| **Punctuation** | Things placed along a track. `repeat` places whole-number fitted counts (beads, chevrons). `graduated` places a major/minor hierarchy (ruler ticks). `sequence` places an ordered list of different motifs (the deco spine). `single` places one centred or stationed piece (crest, nameplate, side leaf). `anchored` places stations taken from DOM elements (nav items). |
| **Terminal** | A motif at a track end: chevron cluster, scroll end, finial, taper. |
| **Cartouche** | An opening with a shaped outline (superellipse, ribbon banner with scrolled ends, notched label) and a moulding around it. It holds live text. |
| **Motif** | A self-contained ornament with **sockets** (where strokes leave it, so tracks continue them) and a **hull** (used for knockouts and text wrap). A motif is either `drawn` (imported, fixed geometry, like today's hand-drawn.json pieces) or `constructed` (an attachment graph of solved curves). |

### Composition
- **Layers**: ground (paper, colour plates), frame, content (the HTML), breaker (motifs that cross the frame and overlap content, like the plant sprig) and motion (a small overlay of moving parts).
- **Knockout**: a member paints a paper halo from its hull, so lines behind it stop cleanly. This is how ribbons pass under one another and how the side leaf clasps the garland.
- **Nested elevation**: an opening that hosts another frame, e.g. an inset with notched corner brackets. It inherits the module and skin of the frame around it through CSS custom properties.

### Style
| Term | Meaning |
|---|---|
| **Pattern book** | A reusable library of profiles, joints, motifs, orders and spans for one family (victorian, mcm, beaux-arts, deco, blueprint, card), in local units. Elevations place pattern-book parts onto datums. |
| **Skin** | Maps colour roles to palette tokens and sets a finish (ink, flat, blueprint, card), a lighting direction and a texture. Each skin has rules for how it renders each stratum kind and relief, so one structure can be re-skinned. |
| **Relief and lighting** | A stratum's relief gives each facet a normal. The skin lights that normal against a light direction and quantises the result to a palette ramp, so the top side of a bevel is light, the bottom is dark, and the mitre seam shows the change. The same relief becomes hatch density in the engraving skin and a section outline in blueprint. |

### Behaviour
- **Scaling rule** (declared for every part):
  - `fixed`: scales only with m.
  - `stretch`: allowed only on straight runs and stripes.
  - `repeat`: whole counts, a target pitch, parity, and hysteresis.
  - `resolve`: the geometry is re-solved (arches, garlands, clothoid chains).
  - `hug`: a leaf sized by its own text.
- **Room level z**: measured per member as `z = log_phi(size / sRef)`, so one step is x1.618. Variants switch on z ranges, with hysteresis.
- **Reduction ladder**: the ordered simplifications of a member. A column becomes a pilaster, then a rule. An arch becomes segmental, then a lintel. A medallion becomes a simple medallion, then a block, then a mitre. A plait becomes a twist, then a double rule.
- **Motion**: a time-varying parameter on the solved frame, such as the station u of a chevron. It is never a separate animation drawing.

## Document model

### Files (all plain JSON, committed to git, written by the Lab with a deterministic writer)
```
frames/
  frame.schema.json                 generated from Zod types (dev only; gives VS Code autocomplete)
  books/  common  victorian  mcm  beaux-arts  deco  blueprint  card   (*.book.json)
  skins/  engraving  mcm  blueprint  deco  card                       (*.skin.json)
  elevations/studio.frame.json      the site's frame: plans per page type, members, motions
```
A **book** holds parts in their own local units and never refers to the page. An **elevation** puts book parts onto the datums of a plan. Parts refer to colour roles (`teal.deep`, `ink`, `paper`), never to colours, and that is what makes re-skinning possible. The writer:
- keeps a fixed section order (header, params, profiles, joints, motifs, plans, members, motions);
- sorts maps by id;
- rounds numbers (4 decimals for lengths, 6 for ratios);
- writes `[x, y]` tuples on one line.

The format has an integer `formatVersion` with an ordered migration list. Nodes can pin an `algo` version, so committed art never shifts when the maths improves.

### Core types (abridged)
```ts
type Expr = number | string          // "phi^2 * m", "bay.main.w / phi", "rung(m, 3)", "28deg"
type RoomExpr = Expr
  | ["step", RoomInput, Expr, ...Array<number | Expr>]           // MapLibre-style, room input only at top level
  | ["interpolate", ["linear"] | ["exponential", number], RoomInput, ...Array<number | Expr>]
type RoomInput = ["room", "width" | "z" | "length" | "devPx" | "class"]

interface Elevation {
  format: "parkington-frame"; formatVersion: 1; id: string
  uses: string[]                                   // books
  skin: string | { light: string; dark?: string; print?: string }
  module: RoomExpr                                 // m in CSS px
  params?: Record<string, Param>
  plans: Record<string, Plan>
  members: Record<string, Member>
  motions?: Motion[]
}
interface Param { value?: Expr; expr?: string; unit?: string; kind?: "continuous" | "discrete" | "grow" | "locked"
                  ladder?: "phi" | "phi/2" | "sqrt2"; free?: boolean; range?: [number, number] }
interface Plan { routes?: string[]; when?: string; sheet: Region }
type Region =
  | { split: "rows" | "cols"; parts: Part[] }
  | { opening: string; fit?: "flow" | "fixed" | "hug"; minH?: Expr; ground?: string }
  | { band: string }                               // reserved for a member; size comes from that member's depth
  | { repeat: string; columns: RoomExpr; gutter: Part; minH?: Expr }   // one bay per DOM child with data-slot=<name>
  | { inset: string }                              // a nested elevation id
interface Part { id: string; size: Expr; min?: Expr; max?: Expr; region?: Region }
                 // size: "1fr", "phi^2 fr", "7m", "auto", "joint:tl", "member:border"
interface Profile { depth?: RoomExpr; strata: Stratum[] }
interface Stratum { id: string; kind: StratumKind; d: Expr; role?: string; relief?: Relief; pri?: number
                    weight?: Expr; carries?: string; reduce?: Array<{ below: number; to: Partial<Stratum> | "drop" }> }
interface Motif { kind: "drawn" | "constructed"; source?: string; params?: Record<string, Param>
                  nodes?: Record<string, Node>; sockets: Record<string, Socket>; hull?: "auto" | number[][]; room?: RoomRule }
interface Node { type: string; inputs?: Record<string, string>; args?: Record<string, unknown>; algo?: string; meta?: unknown }
interface RoomRule { governs: "min" | "width" | "height" | "length"; sRef: Expr; hysteresis?: number
                     anchors: Array<{ z: number; params?: Record<string, Expr>; swap?: string }>; minZ?: number }
```
Expressions are parsed into an AST by a small hand-written parser that supports arithmetic, references, `phi`, `rung`, `sqrt`, `ln`, trig, `min`, `max`, `clamp` and `lerp`. There is no `eval`, so the site keeps a strict content security policy.

---
### Worked example A: Victorian corner medallion, its ribbons, the side leaf and the flame corner

`books/victorian.book.json` (excerpt; `//` comments are explanatory only):
```jsonc
{
  "format": "parkington-book", "formatVersion": 1, "id": "victorian",
  "params": {
    "golden.b": { "expr": "ln(phi) / (pi/2)", "kind": "locked" },          // 0.30635, pitch 17.03deg
    "hair":     { "value": 0.6, "unit": "px", "floorDevPx": 1 },
    "rule":     { "expr": "hair * phi^2" }
  },

  "profiles": {
    "border.side": {                      // outside -> inside, depths in m
      "strata": [
        { "id": "outer",   "kind": "rule", "d": 0.3, "weight": "rule", "pri": 1 },
        { "id": "g1",      "kind": "gap",  "d": "phi" },
        { "id": "garland", "kind": "garland", "d": 6, "pri": 2,
          "garland": {
            "strands": 2,                         // pending owner decision: 2-ribbon twist vs 3-strand plait
            "crossing": "34deg",                  // the designer sets angle, period, ribbon width; amplitude is derived
            "ribbon": 1.15, "haloGap": 0.25,
            "period": { "target": "rung(6, 1)", "fit": "whole", "half": true, "hysteresis": 0.05 },
            "begin": "joint.start:ribbons.down",  // continues the medallion's stems
            "end":   "joint.end:ribbons.up"       // lands in the flame corner's sockets
          },
          "reduce": [ { "below": -1.0, "to": { "kind": "rule", "count": 2, "gap": 1.15 } } ] },
        { "id": "g2",    "kind": "gap",  "d": 1 },
        { "id": "inner", "kind": "rule", "d": 0.2, "weight": "hair", "pri": 1 }
      ]
    }
  },

  "motifs": {
    "medallion": {
      "kind": "constructed",
      "params": {
        "R":        { "value": 8.6, "unit": "m", "ladder": "phi/2", "free": true },  // ring radius
        "coreRatio":{ "value": 1.2, "free": true },          // measured 1.20; sqrt(phi)=1.272 is one rung away
        "stemGap":  { "value": 1.15, "unit": "m" },
        "midGap":   { "expr": "stemGap * phi" }              // drawn 1.467x; golden by construction
      },
      "nodes": {
        "core":  { "type": "circle", "args": { "c": [0, 0], "r": "R / coreRatio" } },
        "ring":  { "type": "arc",    "args": { "c": [0, 0], "r": "R", "from": "200deg", "sweep": "170deg" } },
        "sweepA": {                                             // the dominant S-sweep: G2 by construction
          "type": "chain",
          "start": { "on": "ring", "at": "end", "continuity": "G2" },
          "pieces": [
            { "clothoid": { "kEnd": 0 } },                      // ease out of the ring to the inflection
            { "clothoid": { "length": "L2", "kEnd": "-1 / (0.6 * R)" } },
            { "clothoid": { "length": "L3", "kEnd": 0 } },
            { "line":     { "length": "rest" } }
          ],
          "close": { "to": "socket:stem.a", "heading": "90deg", "solveFor": ["L2", "L3"] }
        },
        "sweepB":   { "type": "offset", "inputs": { "of": "sweepA" }, "args": { "d": "stemGap" } },  // guard: d < Rmin
        "tendrils": { "type": "family", "inputs": { "a": "sweepA", "b": "sweepB" },
                      "args": { "count": 7, "spacing": { "law": "uniform" },
                                "converge": { "on": "core", "angle": "180deg" } } },               // all end on one anchor
        "loops":    { "type": "copyAlong", "inputs": { "proto": "loop.master", "track": "core" },
                      "args": { "from": "-40deg", "step": "28deg", "count": 10, "rotate": "normal" } },
        "arrow":    { "type": "place", "inputs": { "track": "sweepA" },          // the "arrow" the owner wants to animate
                      "args": { "at": { "u": 0.12 }, "motif": "dart", "orient": "tangent", "movable": true } }
      },
      "sockets": {
        "stem.a": { "at": ["-R*1.15", "R*1.75"], "heading": "90deg", "weight": "hair" },
        "stem.b": { "rel": "stem.a", "dx": "stemGap" },
        "stem.c": { "rel": "stem.b", "dx": "midGap" },
        "stem.d": { "rel": "stem.c", "dx": "stemGap" },
        "ribbons.down":  { "pair": [["stem.a", "stem.b"], ["stem.c", "stem.d"]] },
        "ribbons.right": { "mirrorOf": "ribbons.down", "axis": "diagonal" }    // the 45deg mirror found in the drawing
      },
      "room": { "governs": "min", "sRef": "34m", "hysteresis": 0.05, "anchors": [
        { "z": 0 },
        { "z": -1, "params": { "tendrils.count": 4, "loops.count": 6 } },     // typify: fewer lines, same pattern
        { "z": -2, "swap": "common/block.square" }                            // structural swap at the log-midpoint
      ] }
    },

    "flame": {
      "kind": "constructed",
      "params": {
        "rEnd": { "value": 4.5, "unit": "m" },
        "n":    { "value": 6, "kind": "discrete" },
        "step": { "value": "25deg" }
      },
      "nodes": {
        "tipSpine": { "type": "logSpiral",
                      "args": { "pole": [0, 0], "b": "golden.b", "rEnd": "rEnd", "sweep": "step * (n - 1)",
                                "eye": "none" } },
        "blade": { "type": "leafBlade", "args": {
                     "length": 3.7,
                     "back":  { "logSpiral": { "b": "golden.b", "turn": "67deg" } },
                     "front": { "sCurve": [ { "logSpiral": { "b": "golden.b",  "turn": "45deg" } },
                                            { "logSpiral": { "b": "-golden.b", "turn": "49deg" } } ] },
                     "width": { "law": "swell", "max": "hair * 2.2", "taper": "both" } } },
        "leaves": { "type": "copyAlong", "inputs": { "proto": "blade", "track": "tipSpine" },
                    "args": { "stations": { "law": "equalAngle", "count": "n" }, "attach": "tip",
                              "scale": "spiralSimilarity",            // each leaf = previous x e^(b*step), rotated by step:
                              "rotate": "tangent + 12deg" } },        // tips lie on the golden spiral (gnomon)
        "veins":  { "type": "fan", "args": { "from": "pole.vein", "to": "leaves[*].notch", "weight": "hair" } }
      },
      "sockets": {
        "ribbons.up":    { "pair": [["s1", "s2"], ["s3", "s4"]], "heading": "-90deg" },
        "ribbons.right": { "pair": [["s5", "s6"], ["s7", "s8"]], "heading": "0deg" }
      },
      "room": { "governs": "min", "sRef": "21m", "anchors": [
        { "z": 0, "params": { "n": 6 } }, { "z": -1, "params": { "n": 4 } }, { "z": -2, "swap": "sideLeaf.small" } ] }
    },

    "sideLeaf": { "kind": "drawn", "source": "src/ornaments/hand-drawn.json#side-leaf",
                  "sockets": "auto", "hull": "auto" }      // drawn now; can be rebuilt as constructed later
  },

  "joints": {
    "medallionCorner": { "kind": "motif", "motif": "medallion", "seat": "pavilion",   // larger than the band: reserves a corner bay
                         "receives": { "top": "ribbons.right", "side": "ribbons.down" } },
    "flameCorner":     { "kind": "motif", "motif": "flame", "seat": "band",
                         "receives": { "side": "ribbons.up", "bottom": "ribbons.right" } }
  }
}
```

`elevations/studio.frame.json` (excerpt). The medallion's size shapes the masthead. This is the frame designing the page:
```jsonc
{
  "format": "parkington-frame", "formatVersion": 1, "id": "studio",
  "uses": ["books/common", "books/victorian"],
  "skin": { "light": "engraving", "print": "engraving.print" },
  "module": ["interpolate", ["linear"], ["room", "width"], 360, 5, 768, 7, 1440, 10],

  "plans": {
    "front": { "routes": ["studio", "projects", "marginalia"], "when": "class >= medium",
      "sheet": { "split": "rows", "parts": [
        { "id": "border.t", "size": "member:border" },
        { "id": "mast", "size": "max(rung(m, 5), joint:tl.h - member:border)", "region":
          { "split": "cols", "parts": [
            { "id": "pav.l", "size": "joint:tl" },                       // corner pavilion = medallion width
            { "id": "title", "size": "1fr", "region": { "opening": "masthead" } },
            { "id": "pav.r", "size": "joint:tr" } ] } },
        { "id": "body", "size": "auto", "region": { "split": "cols", "parts": [
            { "id": "rail.l", "size": "member:border" },
            { "id": "left",  "size": "1fr",        "region": { "opening": "aside-left" } },
            { "id": "g1",    "size": "2m",         "region": { "band": "colRule" } },  // gutter drawn as a rule
            { "id": "main",  "size": "phi^2 fr",   "region": { "opening": "main", "minH": "w / phi" } },
            { "id": "g2",    "size": "2m",         "region": { "band": "colRule" } },
            { "id": "right", "size": "1fr",        "region": { "opening": "aside-right" } },
            { "id": "rail.r", "size": "member:border" } ] } },
        { "id": "foot", "size": "auto", "region": { "opening": "footer" } },
        { "id": "border.b", "size": "member:border" } ] } },
    "single": { "when": "class == compact", "sheet": { "...": "one column; rails shrink to a double rule" } }
  },

  "members": {
    "border": { "type": "moulding", "track": { "ring": "bay:sheet" },
      "profile": { "left": "victorian/border.side", "right": "victorian/border.side",
                   "top": "victorian/border.top", "bottom": "victorian/border.bottom" },
      "joints": { "tl": "victorian/medallionCorner", "tr": { "use": "victorian/medallionCorner", "mirror": "x" },
                  "bl": "victorian/flameCorner",     "br": { "use": "victorian/flameCorner",     "mirror": "x" } } },

    "clasp.l": { "type": "single", "track": "border.left@garland",       // the garland stratum's spine
                 "at": { "u": "1 / phi^2" }, "motif": "victorian/sideLeaf", "orient": "track",
                 "dock": { "socket": "socket", "to": "track" }, "knockout": "1.5 * hair",
                 "mirror": { "as": "clasp.r", "axis": "x-sheet-mid" },
                 "room": { "governs": "length", "sRef": "60m", "minZ": -1 } },

    "colRule": { "type": "moulding", "track": { "edge": "bay:g1", "axis": "centre" },
                 "profile": "common/rule.double", "joints": { "start": "common/tee", "end": "common/tee" } }
  },

  "motions": [
    { "id": "courier", "trigger": "routeChange", "target": "border.tl.arrow.u",   // the dart rides its ribbon
      "path": ["joint.tl:sweepA", "border.left@garland.strand0", "joint.bl:ribbons.up"],
      "from": 0, "to": 1, "duration": "clamp(0.9s, L / 900px * 1s, 1.6s)", "easing": "engine",
      "tier": "A", "reduced": "blinkAtDock" }
  ]
}
```
What the engine derives from this: the stems leave the medallion G2-continuous with the ring. The garland's amplitude is `tan(17deg) * period / (2 pi)`, and its period is refitted to whole half-repeats per side. The ribbons land in the flame's sockets. The leaf sits at 0.382 of the rail and knocks out the ribbons behind it. The flame's tips lie on a golden spiral because each leaf is a spiral-similarity copy.

---
### Worked example B: mid-century moulding with corner blocks and travelling chevrons

`books/mcm.book.json` (excerpt):
```jsonc
{
  "format": "parkington-book", "formatVersion": 1, "id": "mcm",
  "profiles": {
    "side": {
      "depth": ["step", ["room", "class"], "3m", "medium", "5m", "wide", "7m"],   // the whole band depth
      "units": "proportional",                       // strata keep the trace's proportions and scale to the depth
      "strata": [                                    // measured from websiteOutline.svg, left side, outside -> inside
        { "id": "c1",  "kind": "fill", "d": 7,   "role": "cream",     "pri": 3 },
        { "id": "sl",  "kind": "fill", "d": 3,   "role": "slate",     "pri": 4 },
        { "id": "t1",  "kind": "fill", "d": 6,   "role": "teal.deep", "pri": 1, "relief": "bevel-out",
          "carries": "chevrons" },
        { "id": "c2",  "kind": "fill", "d": 5,   "role": "cream",     "pri": 2 },
        { "id": "pin", "kind": "pinstripes", "d": 21, "count": 3, "line": 0.12, "role": "teal.deep", "pri": 6,
          "note": "depth by subtraction from the 68-unit total; re-measure with the sampler" },
        { "id": "mu",  "kind": "fill", "d": 6.5, "role": "mustard",   "pri": 1, "relief": "round" },
        { "id": "c3",  "kind": "fill", "d": 3.5, "role": "cream",     "pri": 2 },
        { "id": "t2",  "kind": "fill", "d": 3,   "role": "teal.deep", "pri": 3 },
        { "id": "c4",  "kind": "fill", "d": 3.5, "role": "cream",     "pri": 4 },
        { "id": "br",  "kind": "fill", "d": 3,   "role": "brown",     "pri": 5 },
        { "id": "sg",  "kind": "fill", "d": 2,   "role": "sage",      "pri": 5 },
        { "id": "t3",  "kind": "fill", "d": 4.5, "role": "teal.dark", "pri": 1 }
      ],
      "typify": { "minStratumDevPx": 2, "merge": "absorbIntoNeighbourOfSameRole" }   // drop by priority, keep order
    }
  },
  "joints": {
    "block": {
      "kind": "block", "size": "profile.depth",              // a square as deep as the band, no mitre
      "body": { "type": "stud", "rings": [                   // nested squares, each a lit frustum
          { "inset": 0,    "rise": 0.10, "role": "teal.deep" },
          { "inset": 0.16, "rise": 0.10, "role": "mustard" },
          { "inset": 0.32, "rise": 0.08, "role": "cream" },
          { "inset": 0.44, "apex": true,  "role": "teal.deep" } ] },
      "emits": [ { "terminal": "arrowCluster", "along": "both", "stratum": "t1" } ],
      "room": { "governs": "min", "sRef": "5m", "anchors": [
        { "z": 0 }, { "z": -1, "params": { "rings": 2 } }, { "z": -2, "swap": "common/butt" } ] }
    },
    "notch": { "kind": "notch", "size": "2.5m", "bracket": { "leg": "4m", "weight": "0.6m" } }
  },
  "motifs": {
    "chevron":      { "kind": "constructed", "nodes": { "v": { "type": "polyline",
                      "args": { "pts": [[-0.5, -0.5], [0, 0], [-0.5, 0.5]], "width": 0.28, "join": "miter" } } },
                      "sockets": { "on": { "at": [0, 0] } } },
    "arrowCluster": { "kind": "constructed", "nodes": { "c": { "type": "repeatLocal",
                      "args": { "motif": "chevron", "count": 3, "pitch": 0.45, "scale": "1/phi^0.5" } } } }
  }
}
```
Elevation members:
```jsonc
"members": {
  "frame": { "type": "moulding", "track": { "ring": "bay:sheet" },
             "profile": { "left": "mcm/side", "right": "mcm/side", "top": "mcm/head", "bottom": "mcm/foot" },
             "joints": { "*": "mcm/block" } },

  "chev.l": { "type": "repeat", "track": "frame.left@t1",       // centreline of stratum t1, between the blocks
              "motif": "mcm/chevron", "orient": "track",
              "pitch": { "target": "rung(m, 3)", "fit": "whole", "parity": "odd", "hysteresis": 0.05 },
              "between": ["joint.tl", "joint.bl"], "clear": "1m",
              "mirror": { "as": "chev.r", "axis": "x-sheet-mid" },
              "room": { "governs": "width", "sRef": "5m", "minZ": -1 } },

  "nav.stations": { "type": "anchored", "track": "frame.top@t1",  // nav links become stations on the top band
                    "from": "[data-slot=nav] a", "motif": "mcm/chevron", "place": "between",
                    "hover": { "highlight": "stratum", "role": "mustard" } },

  "title": { "type": "cartouche", "bay": "bay:mast", "at": { "u": 0.5 },
             "shape": { "superellipse": { "n": 4 } }, "text": "slot:masthead",
             "hug": { "min": "20m", "max": "0.62 * bay.w", "pad": ["1m", "2.5m"] },
             "profile": "mcm/thinPair" },

  "inset": { "type": "moulding", "track": { "ring": "bay:main", "inset": "-1.5m" },
             "profile": "mcm/thinPair", "joints": { "*": "mcm/notch" } }
},
"motions": [
  { "id": "conveyor", "trigger": "routeChange", "target": "chev.l.phase", "from": 0, "to": 1,  // every chevron advances one pitch
    "duration": "0.62s", "easing": "engine", "tier": "A", "reduced": "none",
    "note": "the end state equals the start state, so it is seamless" },
  { "id": "courier", "trigger": "routeChange", "target": "joint.tl.arrowCluster.u",
    "path": ["frame.top@t1"], "to": "station:nav.active", "duration": "0.9s", "tier": "A", "reduced": "blinkAtDock" }
]
```
`skins/mcm.skin.json`:
```jsonc
{ "finish": "flat",
  "tokens": { "mustard": "#cfaa6d", "teal.deep": "#2c5763", "cream": "#f2e5c7", "brown": "#9d8a62",
              "slate": "#5f7771", "sage": "#a7a891", "sand": "#ddcfaa" },
  "ramps":  { "teal.deep": ["#1d4657", "#2c5763", "#45808c"], "mustard": ["#b8945a", "#cfaa6d", "#e4bc77"] },
  "roles":  { "teal.dark": "teal.deep:-1", "paper": "sand", "ink": "teal.deep" },
  "light":  { "azimuth": "-135deg", "elevation": "45deg", "ambient": 0.55, "quantize": "ramp" },
  "texture": { "paper": "none" } }
```
(The trace itself has 3 or 4 shades per hue, e.g. #1d4657, #2c5763 and #45808c. That is what lit bevels quantised to a ramp look like.)

---
### Example C: an architectural-order frame (brief)
```jsonc
"members": {
  "pier.l": { "type": "order", "track": "bay:pier.l#axis",
              "base": { "motif": "ba/attic.base", "h": "2.5m" },
              "shaft": { "profile": "ba/pilaster", "scaling": "stretch",
                         "flutes": { "fit": "whole", "pitch": "1.2m", "parity": "odd" } },
              "capital": { "motif": "ba/ionic.cap", "h": "3m", "scaling": "fixed" },
              "reduce": [ { "belowClass": "medium", "to": "ba/pilaster.thin" },
                          { "belowClass": "compact", "to": "common/rule.double" } ],
              "mirror": { "as": "pier.r" } },
  "arch": { "type": "span", "bay": "bay:nave", "springAt": "pier.l.capital.top",
            "form": { "rise": "min(w / 2, 0.38 * viewport.h)",       // semicircle until the rise budget runs out,
                      "choose": ["semicircle", "threeCentred", "segmental", "lintel"] },  // then flatter forms
            "profile": "ba/archivolt", "keystone": "ba/keystone",
            "spandrel": { "fill": "ba/scrollPanel", "fit": "resolve" } },
  "entablature": { "type": "moulding", "track": { "edge": "bay:frieze#top" }, "profile": "ba/entablature",
                   "punctuation": [ { "type": "repeat", "stratum": "frieze", "motif": "ba/scroll",
                                      "pitch": { "target": "rung(m,3)" } } ] }
}
```
In the plan, the content columns are `opening` bays between the piers, like windows. Below the medium class the piers become thin pilasters, and the arch becomes a lintel once the room drops below z = -1.

### Example D: minimal card (brief)
```jsonc
"members": {
  "card":  { "type": "moulding", "track": { "ring": "bay:card" }, "profile": "card/edge",   // zero-depth edge
             "joints": { "*": { "kind": "round", "r": "rung(m, 2)", "shape": "squircle" } },
             "finish": { "shadow": "soft", "texture": "paper" }, "emit": "css-preferred" },   // compiles to CSS where it can
  "plate.pink": { "type": "plate", "layer": "ground", "role": "pink",
                  "rect": { "l": "x-card-l - 3m", "t": "y-card-t + 8m", "w": "bay.card.w / phi", "h": "rung(m, 4)" } },
  "rule.a": { "type": "moulding", "track": { "edge": "bay:menu#top", "inset": "2m" }, "profile": "common/hair" },
  "sprig": { "type": "single", "track": "card.ring", "at": { "corner": "tr", "u": 0.08 },
             "motif": "card/sprig", "layer": "breaker", "wrap": "shape-outside" }   // text wraps around its hull
}
```

### What the runtime emits for the front plan (wide class)
```css
/* written by the engine onto the host element */
grid-template-columns: [x-sheet-l] 70px [x-left-l] 214.6px [x-left-r x-g1-l] 20px [x-g1-r x-main-l] 561.8px
                       [x-main-r x-g2-l] 20px [x-g2-r x-right-l] 214.6px [x-right-r] 70px [x-sheet-r];
grid-template-rows:    [y-sheet-t] 70px [y-mast-t] 231px [y-mast-b y-body-t] auto [y-body-b y-foot-t] auto [y-foot-b] 70px [y-sheet-b];
--m: 10px; --hair: 0.6px; --frame-class: wide;
/* each slot */
[data-slot="main"] { grid-area: y-body-t / x-main-l / y-body-b / x-main-r; min-height: 347px; /* w/phi */ }
```

## Relationships

There are three kinds of relationship. Each has exactly one solving mechanism, and none of them needs a general constraint solver in the shipped runtime.

**1. Layout relations: datums and bays (the plan)**
- *Expressed as* part sizes in a split tree: `"phi^2 fr"`, `"7m"`, `"joint:tl"`, `"member:border"`, `"auto"`, with min/max.
- *Solved by* a deterministic distributor in one top-down pass, much like flexbox:
  1. Subtract fixed members (bands, pavilions, gutters).
  2. Share the rest by fr ratios.
  3. Clamp to min/max, redistributing any excess.
  4. Snap datums to device pixels (1/dpr) so flat stripes never get anti-aliasing seams.
- Heights: `auto` rows come from the browser's layout of real content. `minH` may use widths (`w/phi`). The validator enforces the "no width from height" rule statically: expressions are typed by axis, and an x-typed expression may not reference y-datums or measurements.
- Golden proportions here are simply ratio choices (`1 : phi^2 : 1`, a `w/phi` golden panel). They are exact by construction.

**2. Attachment relations: the owner's "dominant functions with things relative to them"**
- *Expressed as* `inputs` on a node (its parent track or motif) plus a station (`u`, `s`, angle, socket, datum crossing, DOM anchor) plus a local transform and a continuity grade (G0, G1, G2).
- Examples:
  - The garland begins at the medallion's `ribbons.down` socket.
  - The side leaf hangs at u = 1/phi^2 on the garland spine.
  - The chevrons sit on stratum t1's centreline between two blocks.
  - The tendril fan converges on the core circle at 180 degrees.
  - Flame leaves are spiral-similarity copies along the tip spine.
  - Nav stations come from the positions of `[data-slot=nav] a`.
- These are the four operations the drawing analysis found the owner already uses in Illustrator, now formalised: copy-along, scale-about, mirror and attach-to-curve.
- *Solved by* directed propagation over a DAG:
  - The graph is topologically sorted once at load.
  - A cycle is a load error that names the loop.
  - Each node is a version-stamped memo, the Preact "signal boosting" algorithm in about 150 hand-written lines. It recomputes only when an input version changed.
  - Epsilon equality on geometry stops propagation when a resize leaves a spine unchanged.
- Cross-member attachments (a member using another member's socket or stratum) are ordinary edges, so the medallion, the garland and the leaf form one graph per frame.

**3. Shape relations inside a node (closure)**
- Example: a clothoid chain that must land on `socket:stem.a` with heading 90 degrees.
- *Solved by* the node itself:
  - Newton or Levenberg-Marquardt over at most 3 declared `solveFor` parameters, warm-started from the last good solution.
  - Iteration caps, NaN and bend guards.
  - A status result `{ok | approx | failed, residual}`.
  - Fallback to the last good value. In the Lab, failures show as red badges.
- G1 connectors use Bertolazzi-Frego's one-clothoid fit. Knot-drawn sweeps use the Spiro wrapper, with Hobby as the fallback.

**Asserts (checked, not enforced)**
- Every book and elevation may declare asserts: `minGap`, `noCrossing`, `offset < Rmin`, `ribbon < lambda^2/(4 pi^2 A)`, `goldenPitch within 2%`, `repeatStretch <= 8%`, `contrast(text, ground) >= 4.5`, `hairline >= floor`, `G2 at joins`.
- The runtime evaluates cheap asserts in dev only. The Lab evaluates all of them and shows them as badges on the canvas and the contact sheet.

**Global simultaneous constraints**
These are needed only for genuine mutual cycles, such as mutual tangency of circles inside a crest.
- They live only in the Lab. There, an optional planegcs (WASM, LGPL) bench reports degrees of freedom, conflicts and redundancy.
- The results are baked into parameters, and the relation stays behind as an assert, so drift is flagged.
- Energy-style "encourage even spacing" goals also run offline in the Lab and are baked.

**Editing relationships in the Lab**
- **Handles.** Every node type declares its handles. Each handle names the 1 or 2 parameters it may change. Dragging solves argmin |handle(params) - pointer|^2 over those parameters only: the dragged parameters change and everything else stays, following Cassowary's edit/stay and SolveSpace's dragged-parameters policy. Snap targets are stations on parent tracks, golden rungs, datums and anchor angles. Shift releases the snap.
- **Relation inspector.** Selecting any element shows a sentence such as "hangs from *garland spine* at u = 0.382 (1/phi^2), G1, knocks out 1.5 hair". Every value is editable. To re-parent an element, drag its attachment pin onto another track.
- **"Why is this here?"** Clicking any line highlights its ancestor chain back to the dominant curve, and dims everything that does not depend on it.
- **Detach or bake.** Deleting or detaching a parent offers "bake to absolute geometry", like tldraw's binding isolate, so nothing silently breaks.
- **Graph view.** A read-only, collapsible outline of the attachment tree per motif. It is deliberately not a node-wire editor, to avoid the spaghetti-graph failure the research documents.

## Curves

The principle is to choose a curve by what its curvature has to do. All families share one intrinsic interface: length L, theta(s), kappa(s), point, tangent, normal, and end state (x, y, theta, kappa). G2 at a join is then a plain comparison, and stations are always arc length.

| Curvature behaviour wanted | Family | Where it is used |
|---|---|---|
| Zero | **Line** (SVG L) | Rules, flat mouldings, ticks, deco steps, sunburst rays, lintels, gutters |
| Constant | **Circular arc** (SVG A, exact) | Medallion ring and core, semicircular arch, beads, deco circles, oval cartouche ends (as ellipses), plain rounded corners |
| Changing linearly with length (a ramp) | **Clothoid / Euler spiral** | Medallion S-sweeps (the drawing measured R^2 0.98), easements from a straight rail into a curve (G2 corners on the garland path, arch springing), lead-ins of ribbon-banner scroll ends |
| Smooth through designer knots | **Euler-spline (Spiro, npm `spiro`, Apache/MIT)** | Knot-drawn dominant sweeps in the motif bench. Wrapped with residual checks; Hobby (a port of ISC hobby.js) is used only as a drag preview and fallback |
| Proportional to distance from a pole (growth) | **Log spiral**: b = ln(phi)/(pi/2) when golden, free b for volutes | Flame tip spine, leaf blade sides, volute curls (b and turns as separate dials, ending in a G2 eye circle of radius b*s_eye), sprig tendrils |
| Flat at the extremes, turning in the corners | **Superellipse**: n, aspect; Knuth's 8-knot construction | Cartouches, jewel, card squircle corners (G2 to straight sides when n > 2), deco nameplates, blueprint ovals (n = 2) |
| Periodic about a spine | **Sinusoid on a spine** (analytic offset with exact derivatives); triangle wave; rose-engine (hypotrochoid) | Garland strands (designer sets crossing angle, period and ribbon; amplitude is derived), zigzag band, guilloche medallion centres |
| Two-centre and three-centre arches | **Arc chains** (G1), optionally eased with clothoids to G2 | Segmental and basket-handle arches for wide bays, Tudor variants |
| "Curve character" | **Log-aesthetic curve** with an alpha dial (clothoid alpha = -1, golden spiral alpha = 1) | A later dial in the motif bench, not needed early |
| Fixed hand-drawn | **Imported cubics** | Drawn motifs (current hand-drawn.json pieces), the sprig, until they are rebuilt as constructed motifs |

**Kernel details** (taken from the curve research)
- Clothoid and LAC points are evaluated by composite 16-point Gauss-Legendre on pieces turning at most pi/2: about 1e-9 of length for one piece, about 1e-13 for two. Fresnel completing-the-square is not used, because it is fragile near kappa1 = 0.
- Log spirals use closed forms.
- Derived curves (offsets, strands, width edges) implement `Fittable` and go through one fitter.
  - Phase 1: equal-turn split, arms = chord/(3cos^2(dtheta/4)), and a sampled error check at 0.1 device px.
  - Phase 2: a port of kurbo fit.rs.
  - Arms = L/3 is never used.
- Guards:
  - `|d| < R_min` for offsets.
  - `w*kappa < 1` for width outlines.
  - `A < R_min(spine)` and `h < lambda^2/(4 pi^2 A)` for strands.
- Nested lines around a spiral eye are rotated copies about the pole. They are not offsets, because offsets of log spirals are not log spirals.
- Arc length is native for the analytic families. Tables (32 to 64 Gauss-Legendre nodes per piece) are built once per solve, only for imports, superellipses and strands. Motion reads the same tables.

**Style-specific notes**
- Deco and mid-century styles use almost no curve solving: lines, circles, steps and lit facets. That is why they can ship first.
- Beaux-Arts needs arcs, arc chains and clothoid easements.
- Only the Victorian style needs the full kernel: clothoid chains, log spirals, Spiro, strands and width outlines.

## Golden ratio

**Position.** phi is a tool for coherence, not a magic number. The research is clear on two points. People cannot tell 1.6 from 1.7, and what reads as "printed" is exact repetition under one transform plus continuous curvature. The drawing analysis also found that the owner's exact relations are copies, mirrors, a 1/sqrt(2) crest scale and snapping to circles, not phi. So the engine **imposes phi by construction where it is chosen, never hunts for it in drawings**, and treats it as one of several ladders (phi, sqrt(phi) half-steps, sqrt(2)).

**Where it is enforced by construction**
1. **Module ladder.** Lengths are written as `rung(m, k)` with integer or half k. The Lab's numeric fields and drag handles snap to rungs by default; Shift releases the snap.
2. **Plan ratios.** Split ratios come from a ratio palette (`1:1`, `1:phi`, `1:phi^2`, `1:sqrt2`, `2:3`, free). The front page `1 : phi^2 : 1` and golden panels (`minH: w/phi`) are exact because the distributor computes them, not because someone measured them.
3. **Similarity growth.** `copyAlong` with `scale: spiralSimilarity` and `b: golden.b` places each leaf as the previous one times e^(b*step), rotated by step about the pole. By d'Arcy Thompson's gnomon theorem, the flame's tips, bases and notches then **lie on the golden spiral exactly**, with no fitting. Leaf sizes shrink geometrically (about 0.875 per 25-degree step), where the drawing shrank them linearly. The Lab shows this difference side by side, because the drawing analysis says it is the most visible change.
4. **Curves.** `logSpiral` with `b: golden.b` (locked: 0.30635, pitch 17.03 degrees, phi^4 growth per turn). Leaf blade sides are built as golden log-spiral arcs, not snapped cubics. Phi-derived alternatives from Sharp's table (phi per 54, 108 or 144 degrees) are presets for a tighter or looser curl.
5. **Derived spacings.** Rules such as `midGap = stemGap * phi` for the medallion stems, and garland periods on the ladder (`rung(6,1)`).
6. **Repeats.** Whole-number fitting keeps the period within a stretch tolerance of the golden target pitch.
7. **Time.** Motion durations come from a phi token scale (0.38, 0.62, 1, 1.62 s), offered as a token scale with no perceptual claim.

**Where it is deliberately not forced**
- Mid-century profile depths, which are measured, free, and checked against the ladder.
- The crest, which uses the measured 1/sqrt(2) inner heart.
- Nested line fans, where the data supports uniform spacing or a geometric r of about 1.1 to 1.15. Phi spacing would collapse the inner lines.
- Curl tightness: volute b is a free dial, because golden curls are far more open than the drawn one.

**Escape hatches, all visible in the Lab**
- `kind: "locked"`: no drag, no room expression, no override. Used for golden.b.
- `ladder` + snap: the default for lengths. A drift readout shows the distance to the nearest rung.
- `free: true`: no snapping. A badge shows "phi^1.26, 11% from phi^1.5" so the owner sees it but nothing pretends.
- `asserts`: check rather than force, e.g. `goldenPitch within 2%` on an imported Illustrator spiral. The Lab's fit, report and snap loop says what snapping would move ("tips move 0.4 to 2.4 u"), and the owner decides.
- **Pinned overrides at a room level**, which beat interpolation (the SF Symbols model).
- **Bake**: freeze any constructed part to absolute geometry for a one-off.
- Per frame, `phiPolicy: lock | snap | report` sets how strict the Lab is by default. The look-elsewhere caveat (every number is within 12% of some half-power of phi) is printed next to any ratio readout, so drift numbers are never mistaken for discoveries.

## Thresholds

**Model: two tiers of room, one rule language**

1. **Page width classes** choose the *plan*, meaning which bays exist: compact under 600 px, medium 600 to 1200, wide 1200 and up, following Android's size classes. Examples:
   - Compact: one column, the side rails collapse, and the garland may run along the bottom only.
   - Medium: two columns.
   - Wide: the full front page.

   The engine also publishes the class as `data-frame-class` and `--frame-class`, so the site's own CSS and container style queries can adapt the typography.
2. **Member room levels** choose each member's *variant*. Each member declares what governs its room:
   - corner: the min of its seat;
   - rail: its band depth;
   - span: its bay width;
   - order: its pier width;
   - repeat: its run length, which drives counts only.

   The room level is `z = log_phi(size / sRef)`, so one step is x1.618, inside the x1.28 to x2.0 range real systems use. z is clamped at the ends of the designed range (the opsz rule). Pinch-zoom never changes a variant; browser zoom does, because it relays out the page.

**Parameter kinds** (MapLibre's property typing)
- `continuous`: interpolates between anchors (weights, swing, spacing, radii).
- `discrete`: steps only (leaf count, strand count, motif variant, stratum present or absent).
- `grow`: discrete, but new lines are born from zero width across the hysteresis band. This suits engraving better than an opacity fade.
- `locked`: no room expression is allowed.

The validator refuses `interpolate` on a discrete parameter.

**Masters, switches and overrides**
- The designer sets 2 to 4 **anchors** per member (e.g. z = 0, -1, -2), with more detail at the small end, as Chaparral's optical sizes do.
- Continuous parameters interpolate only while all discrete parameters agree (the compatibility rule).
- Where discrete values differ, the engine inserts a switch at the log-midpoint between anchors (OpenType rvrn's "midway" rule), and the designer can drag it.
- Each switch has a hysteresis band: up at t*phi^h, down at t*phi^-h, with h = 0.05 by default. On load there is no history, so the variant is chosen canonically at t and a reload is deterministic.
- Pinned overrides win over interpolation.
- Raw expressions are reachable only through a "convert to expression" escape hatch (Maputnik's pattern).

**Reduction vocabulary.** These are the cartographic operators of Roth, Brewer and Stryker, applied to architecture. They are evaluated per member in a fixed order: which elements exist, then topology, then geometry, then weights, then collisions.
| Member | Reduction ladder (largest to smallest) |
|---|---|
| Profile (any style) | **Typify by priority**: strata whose rendered depth falls below `minStratumDevPx` drop in priority order, and their depth goes to a neighbour of the same role. The 12-stripe mid-century profile becomes 8, then 5, then 3 stripes, keeping its order and colour rhythm. Pinstripe counts follow the radical law (count proportional to sqrt of room) |
| Corner joint | Medallion, then a simplified medallion (fewer tendrils and loops), then a stud block, then a plain block, then a mitre. For mid-century: 4-ring stud, then 2-ring, then butt |
| Garland stratum | 3-strand plait, then 2-ribbon twist, then a double rule. A collapse operator turns each ribbon into a single rule |
| Order | Column with base and capital, then a fluted pilaster, then a plain pilaster, then a double rule |
| Span | Semicircle, then three-centred, then segmental, then a lintel, chosen by the rise budget and by z |
| Flame and crest | 6 leaves, then 4, then the side-leaf glyph, then nothing (optional parts drop first) |
| Punctuation | Repeat counts refit by length with hysteresis. Graduated ticks drop minor levels first. A sequence keeps its first and last items and drops the middle by priority |
| Cartouche | Shaped cartouche with moulding, then a plain superellipse, then a ruled label (the text always stays) |
| Breakers | The sprig drops below a z threshold, or turns `wrap` off |

**Collisions.** Members carry a priority and `optional` flags. Each motif's hull plus padding (in CSS px) is tested against its neighbours. The lower-priority element yields: it tries fallback placements in order, then drops. The visibility-parent rule applies: when a corner collapses, its whole subtree (fans, leaves, arrows) goes with it as one unit.

**Height.** Page and content height drive counts (rail length, repeat counts, garland periods) and never the variant, apart from the arch rise budget, which uses the viewport height rather than the content height.

**Authoring and preview (in the Frame Lab)**
- **Scale strip (ScaleMaster).** One per member. Rows are elements and discrete parameters. The x axis is z on a log scale with ticks at phi steps, and markers show where 360, 768, 1280 and 1920 px land for that member. Coloured bars show variant ranges, break points can be dragged, and notes sit at each break.
- **Generated filmstrip.** One cell per anchor, a pair of cells at the edges of every switch (just below and just above, including the hysteresis band, like Polypane's Breakpoint Edges), and the clamped extremes. Each cell carries badges.
- **Stops table and curve editor** for each continuous parameter: value against z, with linear, exponential, cubic-bezier or step.
- **Live z scrubber and "sweep" button.** The sweep animates the width from 320 to 2560 to catch pops. A toggle switches between live-resize behaviour (with hysteresis) and canonical behaviour.

## Animation

**Model.** Motion is a time-varying parameter on the same solved graph. It is data in the elevation (`motions[]`), edited in the Lab like any other relationship, and always stored relative to tracks (u or s), never in pixels. A resize re-solves the geometry and keeps u.

```jsonc
{ "id": "courier", "trigger": "routeChange",            // firstVisit | routeChange | visibilityReturn | hover | focus
  "target": "border.tl.arrow.u", "path": ["joint.tl:sweepA", "border.left@garland.strand0"],
  "from": 0, "to": 1, "duration": "clamp(0.9s, L/900px*1s, 1.6s)", "easing": "engine",   // linear() string from the Lab
  "order": "graph",                                    // follows the attachment graph's topological order
  "tier": "A", "reduced": "blinkAtDock" }
```

**Hooks built into M1, although motion ships late**
- Every track exposes `length`, `pointAt(s)`, `tangentAt(s)` and `curvatureAt(s)`.
- Rendered items get stable ids and their s-range on the parent track.
- Ribbon pieces keep their over/under order and halo.
- The graph exports a topological order.
- The renderer has a static layer and a motion overlay. Anything marked `movable: true` renders inside a `<g transform>` or a small HTML wrapper, never `<use x= y=>`, because Chromium refuses to composite those.

**One MotionDirector with three tiers** (from the animation research)
- **A, compositor**: rigid travellers such as chevrons, darts and the conveyor. The track is sampled at uniform s, and `element.animate()` runs transform keyframes with `offset = s/L` and the speed profile as easing. Only transform and opacity animate, so the motion stays smooth while Vue mounts the next route. CSS offset-path is not used: it is not composited in Chromium, and `path()` takes px only.
- **B, paint**: draw-in and ink pulses. Spines get `pathLength="1"` and animate dash windows. Filled ribbon outlines use one mask reveal per RibbonPiece, offset by the piece's start s, so the reveal flows across crossings and stays hidden where the strand passes under.
- **C, geometry**: true shape changes such as a weave ripple or leaf growth. One requestAnimationFrame loop driven by the timestamp re-evaluates only the subgraph downstream of the animated parameter and writes only the changed `d` attributes. If it goes over the frame budget, it falls back to tier B or A.

**First motions**, in build order
1. **Conveyor** (mid-century, M8a): on route change, every chevron on a band advances one pitch in 0.62 s. The end state equals the start state, so it is seamless. Tier A on one wrapper group per run.
2. **Courier** (mid-century, then Victorian): an arrow cluster leaves its corner block, runs along the top band and docks at the station of the newly active nav item. In the Victorian frame, the dart leaves the medallion along sweepA, rides strand 0 of the garland down the side and docks in the flame socket. It is hidden at crossings by an overlay mask cut from the over-pieces' halos.
3. **Track highlight on hover and focus** (not motion): the stratum segment under a nav item changes role colour over 150 ms. Colour change is not motion under WCAG.
4. Later: **construction replay** on first visit, where dominant curves draw first and dependents start when the parent's pen passes their attach station. **Unfurl**, where flame leaves grow in similarity order. **Rose-engine turn** on the guilloche. A **settle** cross-fade of about 250 ms at threshold switches.

**Lifecycle and rules**
- **Route change**: run a same-document View Transition for the content only. The frame layer is named and excluded from the raster snapshot (`::view-transition-group(frame){animation:none}`, with the old image hidden), so hairlines never stretch. After `updateCallbackDone`, re-solve for the new page height, then fire the `routeChange` motions.
- **Duration**: every motion is event-triggered and under 5 s, with no ambient loops, which stays outside WCAG 2.2.2.
- **Reduced motion**: `prefers-reduced-motion` swaps each motion for its declared opacity-only variant, and live changes are honoured through a matchMedia listener. The site also offers a "still engraving" toggle that each viewer can set.
- **Hidden tab**: on `visibilitychange` to hidden, pause and commit end states, and never queue motions. An optional single "return" motion plays after more than 60 s away.
- **Resize during a motion**: finish it instantly and re-solve. Never animate across a topology change or a repeat-count refit; cross-fade instead.

**Lab support**: one timeline lane per motion, with scrub and replay, a reduced-motion preview, the same motion played across the contact sheet at several sizes, and an ms-per-frame meter per tier. Theatre.js is used only as a design reference (sheet, object, typed properties, keyframes, JSON), not as a dependency. GSAP, Rive and Lottie are not used, for the licence and geometry-baking reasons in the research.

## Frame Lab

**What it is.** A dev-only page (`lab.html`) served by the Vite dev server. It uses the exact same `frame/core` evaluator and SVG renderer as the site. A Vite plugin with `apply: 'serve'` validates and writes `frames/**/*.json` to disk, so saves are real files git can see. The blog, open in another tab, hot-reloads from the same JSON. The Lab chrome can be written in Vue, because the owner knows it and it never ships; the canvas is the engine's own renderer.

### Screens
**1. Elevation (the main board)**
- The frame at a chosen viewport, with a **width scrubber on a log axis** marked with device widths, a height control, and a "sweep" button.
- **Construction overlay toggles**: datums in blue with names, bays tinted by type (opening, band, pavilion, gutter), tracks with their arrow of travel, stations, sockets, poles and curvature combs.
- **Content stand-ins** in each opening. The choices are lorem with N paragraphs, a real route of the site rendered inside the Lab with the site's CSS, or a fixed-height block. Each opening has its own height slider, to test how the frame closes around content and how repeat counts refit.
- **Plan tools**: click a bay to split it into rows or columns, set its size (fr, m, ratio palette, golden presets), mark it as an opening and name the slot, reserve a band for a member, or make it a repeat of DOM children. Dragging a datum edits the ratio it comes from, never a pixel position.
- **Skin switcher** in the toolbar: re-skin the same elevation (engraving, mcm, blueprint, deco, card), or show two skins side by side.

**2. Section (profile editor)**
- The heart of the moulding styles. On the left is a large **vertical cross-section of the profile**, drawn like an architect's moulding section: stripes stacked from outside to inside, with relief shown as a section line (bevel, round, cove).
- Drag the boundaries between strata to change depths. Click a stratum to set its kind, role, relief and priority, or what it carries (chevrons, beads, ticks, text, garland).
- On the right is a **live swatch**: a straight run, a corner joint (mitre, block or motif) and a 3x zoom, all lit by the skin's light dial.
- A **priority column** with a "simulate room" slider shows typify dropping strata live.
- **Profile sampler**: drag a line across the reference underlay. The Lab samples colours along it, clusters them into stripes, snaps each colour to the nearest palette token and each depth to 0.5 units, and proposes a profile that the owner accepts, merges or deletes stripe by stripe. This turns the traced websiteOutline.svg into a clean profile without importing its wobbly geometry.

**3. Joints**
- A 2x2 board of the four corners plus tee and cross joints. Pick a joint kind and link the corners as mirrors.
- For blocks: edit the stud rings (inset, rise, role) and watch the facets relight as the **light dial** (azimuth and elevation) turns.
- For motif joints: set the seat (band or pavilion) and connect the joint's sockets to the strata it receives.

**4. Motif bench (constructed ornament)**
- Canvas with the construction overlay: spines, poles, stations, combs, G2 badges at joins.
- An outline tree of nodes on the left, the relation inspector on the right.
- **Handles** come from the node types: knots on a Spiro sweep, the pole and rEnd of a spiral, station pins on tracks, counts as +/- steppers. Drags snap to rungs and stations, and Shift frees them.
- **Import and fit**: drop an Illustrator SVG sketch onto the bench. The Lab fits each chosen path to a family (circle, clothoid, log spiral, superellipse, copy, mirror, attach), reports residuals and what snapping would move, and creates nodes only on request. Illustrator stays a sketchbook.
- **Validators panel**: offset against radius, w*kappa, ribbon against lambda^2/(4 pi^2 A), fit error, golden pitch readout, minimum printable gap at the current device px.

**5. Scale strip**: the ScaleMaster chart per member, with a generated filmstrip and stops tables (see Thresholds).

**6. Contact sheet**: the whole page at 360x780, 768x1024, 1280x800, 1920x1080 and a very tall article, plus each switch edge, in one or several skins. Badges outline any failing cell in red: seam, hairline below floor, repeat stretch over 8%, collision, clipped motif, contrast under 4.5, solve failure, layout shift.

**7. Skins**: token editor, role mapping, ramps per hue, light dial, finish options (ink gain, paper texture tile, shadow), and dark and print variants. A live **contrast checker** tests text roles on each opening's ground.

**8. Motion**: timeline lanes, triggers, scrub, reduced-motion preview, and a per-tier ms meter.

**Underlay (on every canvas)**: place any reference image or SVG under the board. Calibrate it by clicking two points and typing their real distance, which sets m or the profile scale. Set opacity and lock it. References are for sampling and comparison only, never imported as geometry.

**Editing and history**
- Every edit is a named command producing immer patches.
- A drag sets a mark on pointerdown, squashes into one undo step on pointerup, and bails on Escape.
- Session state (zoom, selection, preview size) is kept separate and is never undone.
- The history panel lists the commands by name ("Set stratum t1 depth 6 to 6.5").
- Git is the long-term history. A "compare with HEAD" overlay shows the last committed frame in red under the current one.

### A designer's first hour: building the mid-century frame
- **0:00** New elevation from the "sheet with masthead" template. Pick books `common` and `mcm` and skin `mcm`.
- **0:02** Drop `websiteOutline.svg` on the underlay. Click the outer and inner edges of the left side and type 68, which calibrates the profile scale. Set opacity to 40%.
- **0:04** Section screen. Drag the sampler across the left side at mid-height. Twelve stripes are proposed, snapped to the 7 tokens. Delete two tracing-noise slivers and merge the pinstripe cluster into one `pinstripes` stratum with count 3. Set relief: t1 bevel-out, mustard round. Set priorities: mustard and t1 are 1, pinstripes 6.
- **0:12** Turn the light dial to the upper left. The top band reads light and the bottom band dark, as on the trace.
- **0:15** Joints screen. Set all four corners to `block`, size = band depth. Add 4 stud rings, picking roles by clicking colours on the underlay. Watch the facets light up.
- **0:22** Select stratum t1 and choose "Carries > repeat > chevron". Target pitch rung(m,3), odd parity. Add `arrowCluster` terminals leaving each block.
- **0:28** Elevation screen.
  - Split the sheet into masthead, body and footer.
  - Set the masthead as a cartouche opening bound to `slot:masthead` (hug, superellipse n=4).
  - Split the body into a main opening and an aside with golden ratio 1:phi.
  - Add an inset moulding inside main with notched corners.
- **0:35** Load the real Studio route into the stand-ins. Drag the main opening's height slider and watch the side chevrons refit and the blocks follow the bottom.
- **0:40** Scale strip for `mcm/side`. Sweep the width. Below medium, the pinstripes go first, then the slate. Below compact, the block switches to butt at the midpoint (drag the switch slightly later), and the chevrons take minZ -1.
- **0:48** Contact sheet: the 1.5-dpr cell flags a seam between two flat stripes. Turn on datum snapping, the default, and the badge clears. Contrast check: the cream ground with teal text passes.
- **0:52** Motion lane: conveyor on routeChange, 0.62 s. Preview reduced motion: no travel.
- **0:55** Save. The JSON is written to `frames/elevations/studio.frame.json`, and the blog tab shows the site in the new frame. Commit.

**The Victorian frame in the same Lab** follows a similar path. Sketch the S-sweep in Illustrator and import it to the motif bench. Fit says "clothoid, R^2 0.98", so accept a Spiro chain anchored on the ring. Drag the stems' landing to the sockets. Build the flame from the "spiral copy" template with golden b locked, comparing with the underlay; the panel reports "tips move 0.4 to 2.4 u against the drawing". Set the garland stratum with crossing angle and period dials. Pin the side leaf at u = 1/phi^2.

## Engine architecture

### Packages
All of these are folders in this repo under `frame/`, with tsconfig path aliases and ESLint import boundaries. They replace the `framing/` spike and absorb its pure helpers.
```
frame/
  core/        (ships) pure TS, no DOM, no framework, no Zod
    doc/       types, normalize-on-load (keeps unknown fields), migrations, expression parser -> AST
    graph/     DAG build + topo sort + cycle report; version-stamped memo nodes; epsilon equality
    room/      room inputs, width classes, z, anchors -> compiled step/interpolate, hysteresis state
    layout/    plan distributor (widths), grid emission, vertical closing from measurements
    curves/    intrinsic pieces, Gauss-Legendre, log spiral, clothoid builders, Spiro wrapper, Hobby,
               superellipse, offsets, strands, width outlines, arc-length tables, phase-1 fitter
    members/   moulding sweep, joints, orders, spans, punctuation fitting, cartouche, motif instancing
    scene/     Scene graph: layers -> items {id, role, relief, d|shape, transform, sRange, movable}
  skin/        (ships) role -> paint, lighting + ramp quantisation, finish compilers (ink, flat, blueprint, card)
  render-svg/  (ships) Scene -> SVG; keyed diff for DOM; string output for Node/print
  dom/         (ships) <frame-elevation> custom element: observers, CSS emission, slots, a11y, route hooks
  motion/      (ships, lazy-loaded) MotionDirector tiers A/B/C
  schema/      (dev) Zod types -> frame.schema.json, validators, asserts
  lab/         (dev) Frame Lab
  cli/         (dev/CI) render an elevation at a bracket of sizes -> SVG + PNG snapshots
```
Runtime dependency: `spiro` (optional, only if a frame uses knot sweeps). Everything else is ported or hand-written: hobby.js (ISC), Bertolazzi-Frego buildClothoid, Levien's integ_spiro, and later kurbo fit.rs.

### Pipeline (one evaluation)
```
inputs: host width W, dpr, viewport h, route, reduced-motion, [measured bay rects], time
 1  ROOM      width class; module m and hair from RoomExprs; per-member z after step 3 (quantised to 1/32)
 2  PLAN      choose the plan by route + class (cross-fade on change)
 3  H-SOLVE   distributor -> x-datums (snapped to 1/dpr px), member depths (profile typify), pavilion sizes
 4  EMIT      grid-template-columns/rows with datum line names, CSS vars, slot grid-areas, minH   [DOM write]
    -- browser lays out the real content --
 5  MEASURE   read bay rects of openings (one batched read)                                       [DOM read]
 6  V-SOLVE   y-datums; track lengths; repeat counts (hysteresis); hug sizes from text measurement
 7  MEMBERS   variants per member (exist -> topology -> geometry -> weights -> collisions); motifs instanced
 8  SCENE     layered items with stable ids and s-ranges
 9  SKIN      paints, lighting, finishes
10  RENDER    keyed SVG diff (update only changed d/transform/fill)                               [DOM write]
```
**Loop-proofing**
- Steps 1 to 4 read only width inputs, a rule the validator enforces.
- The frame SVG is `position:absolute; inset:0; pointer-events:none` and never affects layout.
- `scrollbar-gutter: stable` on the root stops a scrollbar appearing and flipping widths across a threshold.
- The host's ResizeObserver handles width and runs steps 1 to 4. Each opening's ResizeObserver handles height and runs steps 5 to 10. Openings are deeper in the DOM than the host, so their notifications arrive in the same frame, before paint (the ResizeObserver depth rule). The page never shows a frame drawn for the old content.

### Solver policy
- **Widths**: a closed-form distributor (fixed sizes, then fr shares, then clamps).
- **Attachments**: directed propagation over the DAG.
- **Shape closure**: local Newton or LM inside a node, with at most 3 free parameters, warm starts, caps and a status result.
- **Never** a global constraint solver at runtime. The Lab-only extras (planegcs bench, offline spacing optimisation) bake their results into parameters.

### Caching
| Layer | Cache key | Recomputed when |
|---|---|---|
| Motif local geometry | (motif, variant, quantised params) | Almost never: it is independent of page size and placed by transform. Fixed motifs become one `<symbol>` with `<use>` per corner |
| Resolved members (garland, arches, rails) | (track length rounded to 0.25 px, m, variant, count) | When a track length or count changes |
| Plan solve | (W rounded to 1/dpr, class, route) | When the width changes |
| Scene diff | Stable ids | Only changed attributes are written |

Room levels are quantised to 1/32 z, so continuous parameters do not churn on every pixel of a drag-resize.

### Determinism
- No `Math.random`; a seeded PRNG only if jitter is ever wanted.
- Fixed iteration counts.
- SVG coordinates rounded to 2 decimals in CSS px.
- Node-level `algo` pins.
- Snapshot tests run in one engine (Node CLI plus headless Chromium) with tolerance compares, because Math precision differs across browsers.
- Hysteresis is the one stateful element. On load, choices are canonical.

### Performance budgets
These are estimates to measure in M1 and M5, not sourced figures.

| Work | Budget |
|---|---|
| Width solve plus grid emission | Under 1 ms |
| Full re-solve of a Victorian frame on a width change | Under 8 ms. Medallion and flame are cached; only the garland, rails and repeats re-solve |
| Height-only change | Under 3 ms |
| DOM nodes, Victorian | About 1,500 to 3,000 after symbol reuse, kept well under the roughly 8,000-element point where SVG and Canvas both degrade |
| DOM nodes, mid-century | A few hundred |
| Rendering and scroll | The frame is static SVG that scrolls natively; no scroll handlers |

If a very tall article makes the garland large, rail runs can be split into 2,000-px SVG tiles. A Web Worker is not needed for the site. The Lab can render contact sheet cells in a worker through the string renderer.

## Rendering

**Output.** SVG for everything in the frame, plus CSS for the parts CSS does natively. The frame is one absolutely positioned SVG per host, with layers as `<g>` groups: ground, frame and breaker. A separate small motion overlay holds HTML wrappers around tiny SVGs, so travellers are composited in every engine. The content layer is real HTML in grid areas, above ground and frame and below breakers. Breakers have `pointer-events:none` and can use `shape-outside` spacers so text wraps around them. Canvas and WebGL are not needed. They are kept as an option only for a future effect with thousands of moving lines, such as a full-page guilloche moire.

**Finishes** (compiled by the skin from roles and relief)
- **Ink (Victorian engraving)**
  - Monochrome ink on paper. Every line is a **filled outline** with a width law w(s) (swell and taper), never a stroke, so lines can taper to nothing like engraving.
  - A hairline floor in device px. Lines below a device-pixel gap merge or drop by priority.
  - Knockouts are paper halos from hulls, which give the over/under weave and the leaf clasp.
  - Relief renders as **hatch density**: bevel-out shade sides get 1 to 3 generated hatch lines at constant screen pitch, not SVG patterns, so pitch is exact.
  - Guilloche fills come from the rose-engine generator.
  - An optional static "ink gain" filter (a small dilate) is applied in print and large display only, and is never animated.
- **Flat (mid-century)**
  - Fills only, no strokes.
  - **Onion painting** to avoid anti-alias seams: each stratum is painted as the full region from its outer edge to the profile's inner edge, back to front, so adjacent stripes overlap instead of abutting. Datums are snapped to device pixels.
  - Mitred joints are trapezoids per stratum per side.
  - Relief is lit: facet normal against the light direction, Lambert with ambient, **quantised to the role's ramp**, so the result stays inside the palette as screen-printed work does.
  - Stud blocks are nested frustums with four lit facets each.
  - `shape-rendering: geometricPrecision`.
- **Blueprint**
  - The skin inverts: ground becomes a Prussian-blue token, and ink becomes paper at partial alpha.
  - Relief renders as section outlines.
  - Graduated ticks have a major and minor weight hierarchy.
  - The grid-paper ground is a CSS repeating gradient, not SVG.
  - Text along straight bands is real HTML placed in the band bay. Text along curved tracks uses `<textPath>` on the track's path with `aria-hidden`, and the meaningful text is duplicated in the DOM.
- **Deco**
  - Stepped joints are generated offset rectangles.
  - Sunbursts are radial rays with an angular law and counts set by room.
  - Lines vary in weight by stratum.
  - Spine sequences use mixed motifs.
- **Card**
  - Emits CSS where possible: `border-radius` on the opening, or `corner-shape: squircle` where supported (Chromium only as far as I know; verify) with an SVG clip-path fallback, plus `box-shadow`.
  - Overlapping colour plates are absolutely positioned elements on datums.
  - Paper texture is a pre-baked tile PNG exported from the Lab (feTurbulence rendered once), never a live filter.

**The printed look** comes from exact repetition, continuous curvature, filled width-profiled lines and constant screen pitch for line families, not from texture. Texture and ink gain are optional and static. Animated feTurbulence or displacement maps are banned, given the research on performance and Safari on iOS crashes.

**Modes**
- **Dark mode**: each skin has a dark variant (a "night edition" engraving with paper and ink inverted; blueprint is already dark), chosen by `prefers-color-scheme`.
- **Forced colours**: under `forced-colors: active`, the frame renders in `CanvasText` lines only and drops fills.
- **Print**: `@media print` uses the skin's print variant (pure black ink, no texture). The frame re-solves at the print page size via `beforeprint`, and output is vector.
- **Exports**: the Lab exports any elevation at any size as SVG (and PDF through the browser) for posters and assets.

## Site integration

**The host is a custom element, not a Vue component.** `frame/dom` defines `<frame-elevation>` in light DOM, so the site's CSS reaches the slot content. It:
- loads an elevation (imported JSON, bundled by Vite);
- observes its own width and its openings' heights;
- writes the grid template, CSS variables and slot `grid-area`s;
- renders the frame SVG;
- runs the MotionDirector.

Vue sees it as a plain element (`compilerOptions.isCustomElement: tag => tag === 'frame-elevation'` in `@vitejs/plugin-vue`).

**Change to SiteChrome.vue** (illustrative):
```html
<frame-elevation frame="studio" :route="route.name">
  <header data-slot="masthead"><SiteTitle/></header>
  <nav data-slot="nav"><MainNav/></nav>
  <main data-slot="main"><RouterView/></main>
  <aside data-slot="aside-left">...</aside>
  <footer data-slot="footer">...</footer>
</frame-elevation>
```
- Plans are chosen by route: the front page uses the 3-column newspaper plan, Projects uses `repeat` bays (one ruled panel per project card), an article uses a single column with a marginalia aside, and About uses the card.
- Routes declare `meta.plan` or the elevation's `routes` lists them.
- `RouterView` content changes height asynchronously (Supabase loads, images). The openings' observers close the frame without any Vue involvement.
- Existing `Frame.vue` usages (columns, panels, nav strip) become nested elevations: a thin `<frame-elevation frame="mcm/panel">` inside a slot. They inherit `--m` and the skin from the host around them.
- `frameEngine.ts` and `frameSettings.ts` are retired once their configs are migrated by a one-off script. Their rings and gaps map directly to profile strata.

**Accessibility**
- The SVG has `aria-hidden="true"` and `focusable="false"`.
- Slots are the page's own landmarks (header, nav, main, aside, footer), so the semantics belong to the page.
- Cartouche titles are real headings in hug openings.
- Running border text is decorative or duplicated in the DOM.
- Track highlights add to native focus rings and never replace them.
- Text and ground contrast is checked in the Lab.
- Reduced motion and the "still engraving" toggle are honoured.

**First paint without layout shift**
- A build step (Vite plugin) evaluates each elevation's widths at the class boundaries and emits a static CSS fallback: a grid template per width class using `clamp()`/`fr` approximations.
- Content lays out in nearly the right place before JS runs. The runtime then replaces it with exact px tracks within one frame, so the shift is a few px at most. The Lab's contact sheet flags any shift above 0.01 CLS.
- Fonts: the host re-measures hug cartouches on `document.fonts.ready` and `loadingdone`.

**Sticky and route behaviour**
- A member may set `attach: "viewport"`, e.g. a sticky nav band. It then renders in its slot's own small SVG inside a `position: sticky` slot, not in the sheet SVG.
- Route changes use a same-document View Transition on the content only, with the frame excluded from the snapshot. The frame then re-solves and plays its `routeChange` motions.

**Leaving Vue: phased and reversible**
1. **Now to M5**: the frame leaves Vue completely, while pages, routing, Supabase and TipTap stay in Vue. The engine does not care what renders the slot content.
2. **After M5**: decide the rest. Option A keeps Vue, which is cheapest; TipTap's `@tiptap/vue-3` and the admin forms are the main ties. Option B is a multi-page site (e.g. Astro) with cross-document View Transitions (Chrome and Safari; Firefox changes pages instantly) and the same custom element on every page. Option C is plain TS with a tiny router.
3. The custom element is the stable seam, so this decision can wait until the frame work shows what the pages really need.

## Roadmap

Each milestone ends with something visible. The weeks are rough, part-time estimates for a solo student working with AI. The order deliberately starts with the rectilinear styles, which need no curve solving, and builds toward the Victorian kernel.

**M0: skeleton on paper (about 1 week)**
- `frame/core/doc`: types, expression parser, migrations scaffold. `frame/core/layout`: the distributor. `render-svg` string output. `cli`.
- **Visible**: `npm run frame:render studio --sizes 360,768,1440` writes SVGs of a plan's datums and bays, plus a plain double-rule moulding with mitre joints.

**M1: the frame becomes the layout (1 to 2 weeks)**
- The `<frame-elevation>` custom element, CSS grid emission, slot placement, width and height observers, `scrollbar-gutter`, the build-time fallback CSS.
- Mounted in SiteChrome behind a flag.
- Motion hooks built in now: track arc-length API, stable ids, `<g transform>` for movables.
- **Visible**: the real site, laid out by the frame. Its three columns and masthead come from the elevation, and the rules close around live content as you resize.

**M2: Lab v0 (2 weeks)**
- `lab.html`, the Vite save plugin, the elevation board with datum overlay and plan tools, content stand-ins, the width scrubber, undo/redo, skins v0 (tokens and roles).
- **Visible**: edit a ratio in the Lab, save, and watch the blog tab update.

**M3: mid-century complete (2 to 3 weeks)**
- Profiles with strata, relief and lighting.
- The Section screen with the **profile sampler** and underlay calibration.
- Block and notch joints, repeat punctuation (chevrons), terminals, cartouche with hug text, anchored nav stations with hover highlight, nested inset frames.
- **Visible**: the site in the mid-century frame built from websiteOutline.svg, with lit stud blocks and chevrons that refit as content grows.

**M3b: early Victorian win (1 week, can run in parallel)**
- Drawn motifs from `hand-drawn.json` as joint motifs and singles, using the existing sockets and hulls.
- The spike's weave, ported as a `garland` stratum.
- **Visible**: the Victorian frame on the site with the drawn medallions, a generated garland down the sides and the side-leaf clasp.

**M4: thresholds (1 to 2 weeks)**
- Width-class plans, member room levels, anchors and switches with hysteresis, profile typify, reduction ladders, collision priorities.
- The Lab's Scale strip, generated filmstrip and contact sheet with badges.
- **Visible**: sweep the width from 320 to 2560 and see the frame simplify gracefully, with every switch visible in the Lab.

**M5: curve kernel and Beaux-Arts (3 weeks)**
- Intrinsic pieces, Gauss-Legendre, arcs, arc chains, clothoids, the Cesàro-turtle chain with closure, offsets, the phase-1 fitter.
- Orders and spans with the rise budget.
- **Visible**: an architectural frame with pilasters whose shafts stretch while their capitals stay fixed, an arch whose radius follows the width and turns into a lintel on a phone, and content set like windows between the piers.

**M6: constructed Victorian (3 to 4 weeks)**
- The motif bench with handles, construction overlay, validators and the relation inspector.
- Log spiral with golden copyAlong (the flame), the medallion clothoid chain to the sockets (Spiro wrapper, Hobby fallback), families and fans, the analytic garland strand with guards, width outlines.
- Illustrator import, fit and snap.
- **Visible**: the drawn medallion and flame replaced by constructed ones. A side-by-side "drawn vs golden" view, with the flame tips on an exact golden spiral.

**M7: more styles (2 to 3 weeks)**
- Blueprint skin, graduated ticks, running text, panel grids (`repeat` bays on Projects).
- Deco step joints, sunburst, sequence spine.
- Card: CSS-native output, squircle, breaker sprig with `shape-outside`.
- **Visible**: one structure re-skinned five ways on the contact sheet, plus a card-styled About page.

**M8: motion (2 weeks)**
- MotionDirector tiers A and B, View Transitions integration, reduced motion, visibility handling, Lab timeline lanes.
- **M8a**: the chevron conveyor and courier on route change.
- **M8b**: the Victorian dart courier along the garland with occlusion at crossings.
- **Visible**: changing tabs sends the arrows running along their tracks.

**M9: polish (ongoing)**
- Print skin and exports, the kurbo fit.rs port, `node.algo` pins, retirement of the old Vue Frame, performance passes, the decision on the rest of the site.

The pending owner decisions (twist or plait, garland on the sides only or also the bottom, the rest of the site leaving Vue) are all **data choices** in this model. Each can be tried in the Lab in minutes, so none of them blocks the roadmap.

## Risks

- **Over-abstraction before taste.** A vocabulary meant to cover every style can produce elegant types and ugly frames. *Mitigation*: build two concrete styles (mid-century, then Victorian with drawn motifs) before generalising. Every new concept must be needed by at least two styles or be cut. The vocabulary in this proposal is a target, not M0 scope.
- **Re-skinning is not free.** Some structures read badly in some skins: a 12-stripe profile as engraving, a garland as flat colour. *Mitigation*: per-skin stratum render rules and an honest "not designed for this skin" badge. Re-skinning is a convenience, not a promise.
- **Layout feedback and jitter.** Scrollbars, late fonts, images without dimensions and hug cartouches can all cause flicker. *Mitigation*: the statically validated width-down rule, `scrollbar-gutter: stable`, font-ready re-measurement, hysteresis on all discrete switches, and a CLS check on the contact sheet. Residual risk: content that reflows when the frame's fallback CSS is replaced by exact px tracks at first paint.
- **Owning layout means owning layout bugs.** Sticky elements, overflow, very long words, embedded media and the TipTap editor's content all live inside the grid the engine generates. *Mitigation*: openings are ordinary grid areas with `min-width: 0` and normal CSS, and site CSS stays in charge inside them. Keep an escape hatch where an opening falls back to normal flow (`fit: "flow"`, no fixed px rows).
- **Curve solver instability.** Spiro returns no convergence status, chains can fail to close, and drags can jump between solutions. *Mitigation*: residual checks, last-good fallback, Hobby preview, at most 3 free parameters per closure, and `solveFor` limited and visible in the Lab.
- **Victorian density and performance.** Thousands of filled outlines plus knockouts on very tall pages. *Mitigation*: symbol reuse, cached motif geometry, tiling long rails, and measuring early (M3b), with an engraving reduction ladder ready.
- **Scope and time.** This is a large system for one student. *Mitigation*: every milestone ships something visible to the live site, and the order (rectilinear styles first) gives real wins before the hard maths.
- **Schema churn.** The format will change often early on. *Mitigation*: integer migrations with fixture tests, normalise-on-load that keeps unknown fields, and the Lab as the main writer.
- **Hysteresis versus purity.** Output depends on resize history. *Mitigation*: small bands and a canonical choice on load, so reloads are deterministic.
- **Browser gaps.** No compositing of SVG child transforms in Safari (unconfirmed), `corner-shape` limited to Chromium, cross-document View Transitions missing in Firefox, CSS `d` missing in Safari. *Mitigation*: HTML wrappers for travellers, SVG fallbacks, and JS `setAttribute` for shape changes.
- **Accessibility drift.** Real text drawn into SVG strata, decorative duplicates, motion. *Mitigation*: text strata on straight tracks are HTML openings, curved text has DOM duplicates, contrast badges, and the reduced-motion and still toggles.
- **Golden-ratio expectations.** The owner may expect phi to make things beautiful by itself. *Mitigation*: the policy of construction plus drift readouts, the look-elsewhere caveat in the UI, and side-by-side "drawn vs golden" comparisons so the owner judges by eye.
- **Lab maintenance cost.** The Lab could grow bigger than the engine. *Mitigation*: it reuses the runtime renderer, its panels are generated from node-type declarations (handles, parameter manifests), and features are added only when a milestone needs them.
- **Legal and licensing.**
  - Mapbox's patent on zoom-function graph editors (US10416866B2) resembles the Scale strip's curve editor, which matters only if the Lab is ever published as a product (not legal advice).
  - planegcs is LGPL and stays Lab-only.
  - GSAP's licence is close to prohibiting exactly this kind of tool, so it is avoided.
- **Traced references wobble.** Image-traced edges would leak noise into the geometry. *Mitigation*: references are used only for sampling and calibration (profile sampler, underlay), never imported as geometry.

## Novelty

- **The frame is the layout system, not decoration around it.** No shipped web tool I know of works this way: the ornament is an architectural elevation whose datums become CSS grid line names, whose bays become the page's slots, and whose members close around measured content. Designing frame-first, then the page, is the owner's own method, and here it becomes executable. The "widths down, heights up" contract makes it safe: it is checked statically, so loops are impossible rather than merely avoided.
- **An architect's vocabulary that a planning student already thinks in.** Orders (stretch shafts, fixed capitals), spans chosen by rise budget, pavilions reserved by corner motifs, gutters as rules with tee joints, bays repeated per CMS item. These are scaling semantics, not just names. "Columns become pilasters, the arch becomes a lintel" is a real reduction ladder.
- **Profiles as lit sections.** One stratum model, with relief and priority, covers a Victorian ink border, a 12-stripe mid-century moulding, a blueprint ruler and a deco stepped edge. The skin lights the relief: quantised to a palette ramp for flat colour, turned into hatch density for engraving, drawn as a section outline for blueprint. That is how one structure can honestly be re-skinned.
- **Cartographic generalisation applied to ornament.** Profiles typify by priority, line families keep their screen texture as counts change (tippecanoe), counts follow the radical law, and every threshold is visible at once in a ScaleMaster strip with a generated edge filmstrip. Responsive design has had breakpoints; this gives ornament optical sizes.
- **Golden geometry by construction, not by assertion.** Spiral-similarity copying puts the flame's tips on an exact golden spiral (gnomon). Clothoid chains are G2 into rings by construction. Ratios come from a ladder with visible drift and an explicit policy (lock, snap or report), so phi is honest and checkable.
- **The page's content becomes part of the frame.** Nav links become stations on a moulding (chevrons between them, hover lighting the stratum), cartouches hug live headings, the projects list sets how many ruled panels exist, and breakers wrap text around their hulls with `shape-outside`. The ornament reacts to the site's real structure, which is what makes it a functional, modern website rather than a poster.
- **Motion is a parameter of the same solved geometry.** The owner's arrows run along the very tracks they were attached to, at constant arc-length speed. They are composited, survive resizes, and pass correctly under weave crossings, because motion is just u changing over time.
- **A Lab built around the designer's real inputs.** The section editor reads like a moulding drawing, the profile sampler turns a traced mood image into a clean token profile, and Illustrator sketches are fitted to the right curve family with residuals before anything snaps. Illustrator stays a sketchbook while the browser enforces the relationships Illustrator cannot.
