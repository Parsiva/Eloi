# Proposal (engraver-animator lens): Burin: a track-and-station frame engine in which the border is the layout, the engraving and the motion

> One of five competing proposals. Background for [the frame engine design](../frame-engine.md), which builds on the architect proposal with grafts from the others.

## Thesis

A frame is a small set of dominant TRACKS: curves and edges measured by arc length, each with named STATIONS (addresses along it) and JUNCTIONS (where it meets other tracks). Everything else is defined relative to those tracks. Mouldings and ribbons are PROFILES swept along an interval of a track. Medallions, chevrons, crests and cartouches are RIDERS attached at a station. Hatch, fans and pinstripes are line FAMILIES generated from tracks by a spacing law, and each has a weight function along its length. Content slots are REGIONS bounded by tracks, and they become real CSS grid areas holding live HTML. Because every relationship is written in stations, one vocabulary covers all seven styles, from Victorian banknote to Japanese menu card, plus layout, room-dependent variants and motion. An animation is just a station, phase or reveal value that changes over time, so "the arrows run along their track when you change section" falls out of the data model and does not need a separate animation system. The engine is a pure, deterministic TypeScript function from (document, box, room, theme, time) to SVG layers plus slot rectangles. It runs inside a framework-agnostic `<frame-host>` element. The Frame Lab is a dev-only browser editor for the same JSON document, and the website never ships it.

## Core concepts

The working image is an engraver's plate: every cut follows a track. The vocabulary has 14 nouns. Every style uses the same ones.

**1. Box and bands.** The host element's content box (CSS px) is the plate. The page-width class (compact under 600, medium 600 to 1200, wide 1200 and up) comes from CSS. Bands are the thicknesses the frame reserves on each side. They are always reserved as real grid tracks, so content never sits under the frame by accident.

**2. Track.** A dominant curve or edge that has an intrinsic arc-length parameter. Kinds:
- `line`, `arc`, `circle`, `clothoid`, `logSpiral`, `lac` (log-aesthetic curve), `spiro` (knot-drawn G2 spline)
- `cesaro`: a G2 chain of the kinds above, built like a turtle
- `connector`: a G1 or G2 clothoid between two posed stations
- `box`: a closed rectangle perimeter, with square, rounded, squircle, notched or stepped corners
- `arch`: solved from a span
- `offset`, `strand` (a weave strand), `imported` (a fitted Illustrator path)

Every track answers `length`, `point(s)`, `tangent(s)`, `normal(s)`, `curvature(s)` and `endState()`, and keeps a lookup table from arc length to its parameter.

**3. Station.** An address on a track: `{u}` (fraction of the length), `{s, from}` (arc length in u or px from the start, the end or a junction), `{angle}` (on circles), `{golden:'major'|'minor'}` (u = 1/phi or 1 - 1/phi), `{meet: track}` (an intersection), `{socket: 'rider#name'}`, or `{mid:[a,b]}`. Stations are the shared currency of the whole system. Layout dividers, rider placement, repeat fitting, nav highlights and motion targets are all stations. An **Interval** is a pair of stations.

**4. Junction.** A named point where tracks meet (the box corners tl, tr, br, bl; where an arch meets a pilaster; where a connector lands). It owns a **corner treatment**: `mitre`, `block` (carpentry rosette block), `drawn` (a medallion assembly whose sockets receive the lanes), `stepped` (deco ziggurat with k steps snapped to lane boundaries), `rounded`/`squircle`, `notched` (inverted quarter circle or square bite), or `cartouche`.

**5. Profile and lane.** A cross-section recipe: an ordered stack of lanes measured inward or outward from the track's normal. A lane is one of:
- `fill` (flat colour), `rule` (a line with a weight function), `gap`
- `hatch` (a family), `pinstripes`, `beads`/`ticks`/`text` (punctuation hosts), `lattice`, `zigzag`, `weave` (an embedded ribbon pattern)

Lanes have widths in u, px, `rest`, or `rung(base,k)`, plus a `keep` priority that decides collapse order when room shrinks. A lane marked `rides:true` is itself a sub-track, at the lane's centre offset, that riders can travel along.

**6. Sweep.** A profile applied along an interval of a track. Where the interval ends there is either a junction (handled by the corner treatment) or a **terminal**.

**7. Terminal.** How a sweep or rider row ends: `butt`, `chevron`, `scroll` (golden or volute curl with an eye circle), `taper` (weight to zero), or `socket` (lands on a rider's socket, so the line continues into the drawn ornament).

**8. Rider.** One instance of a motif attached to a track. It has a station, a side (in or out), a normal offset (or a lane), an orientation (`tangent`, `upright`, or tangent plus an angle), a scale, a mirror, a layer, minRoom/maxRoom, a priority and an optional flag. Riders that hold **assemblies** (sub-frames with their own local tracks, for example a medallion or a flame) export **sockets**: posed points (position, heading, curvature, weight) that other tracks start from.

**9. Motif.** A drawable thing with an origin, a hull (for knockouts and collision), sockets and an optional text slot. Motifs are `svg` (imported and cleaned, as today's `hand-drawn.json` pieces), `parametric` (built from tracks, such as a golden leaf whose sides are log-spiral arcs), or a built-in generator (`bevelSquares`, `rosette`/guilloché, `sunburst`, `superellipse`).

**10. Punctuation.** A rule that places many riders over an interval:
- `repeat`: whole-number fit, with stretch-gap or stretch-motif, parity, mirror at the centre, and phase
- `graduated`: ruler hierarchy, where level k has period p/n_k and minor levels drop when their pitch falls under a px floor
- `sequence`: an ordered list of different motifs, as on the deco spine, with an overflow policy
- `single`: one centred piece, such as a crest, nameplate or tailpiece

**11. Family.** Generated line work:
- `offsets` of one spine
- `blend` between two guide tracks (Illustrator blend)
- `fan` converging on a station
- `rotated` (copies of a log spiral about its pole)
- `hatch`

Each family has a spacing law (`uniform`, `geometric(r)`, `ratio`, or `pitchPx` to keep a constant on-screen texture) and a **weight function** w(u) = base × stops(u), with tapers and a hairline floor in device px. Line weight is never a CSS stroke width on engraved work; it is a filled outline.

**12. Region and slot.** The faces left after tracks and bands cut up the box. Regions split along x or y by **dividers**. A divider is itself a track, so a gutter can carry a profile, as on the blueprint panel grid. Leaf regions are **slots**: named rectangles, or rectangles with a shaped top under an arch, that real HTML flows into. An **inset frame** is another frame document placed inside a region, such as the notched corner brackets in the mid-century piece.

**13. Order and arch.** An architectural order is a composite rider along a vertical track: `base` (fixed height), `shaft` (stretches, or repeats drums or flutes), `capital` (fixed). An arch is a track solved from its span. Its form is semicircle, segmental (with a rise rule), three-centred, elliptical, Gothic two-centred, or lintel. Voussoirs are a `repeat` with an odd count and a keystone at u = 0.5.

**14. Cartouche.** A rider whose motif has a body shape (oval, superellipse, ribbon banner with scroll terminals, deco nameplate) and a **text slot**. The text slot is a real HTML element (h1, a, span) that the engine measures and positions. The body can size itself from the text (content drives frame).

**Cross-cutting terms**
- **Layer:** `paper`, `back` (behind content), `content` (HTML), `front` (above content, pointer-events none), `motion` (a small overlay). Elements can **knock out** what is beneath (paper halo) or **break** the frame (`breaks:true` plus a bleed allowance).
- **Law:** how a value is decided: `golden`, `ratio(r)`, `free`, or `measured`. A **lock** freezes a law-derived value against drags.
- **Room (z):** the per-slot size level, log base phi. **Variant** and **anchor** are the threshold mechanism.
- **Cue:** a motion. It is a trigger plus a parameter path that changes over time.
- **Theme:** palette tokens, light direction, finish, weight scale. Structure only ever names roles such as `ink`, `paper` and `teal.deep`, never hex values.

## Document model

One document is `frames/<id>.frame.json`. It is committed, pretty-printed with a deterministic key order, `[x,y]` tuples kept on one line, and validated by a JSON Schema generated from Zod types; Zod lives only in the Lab and CI. Section order is fixed: header, params, profiles, motifs, assemblies, tracks, junctions, sweeps, riders, punctuation, families, regions, cartouches, cues, notes. Themes are separate files (`themes/*.theme.json`), so any structure can be re-skinned.

**Expressions** are short strings parsed by a hand-written parser into an AST, with no `eval`, so the site keeps a strict CSP. They allow arithmetic, `^`, param refs, `phi`, `pi`, `rung(base,k)`, `sqrt`, `ln`, `min`, `max`, `clamp` and `lerp`, plus units: `12u` (design unit = px × `scale`), `0.75px` (screen-fixed, used for hairlines), `%w`/`%h` (fraction of the host). Room-dependent values are always a readable stops table, either `{byRoom, interp, stops}` or `{byRoom, step}`. A room input may only drive the top-level table, so the Lab can always draw it.

```ts
// frame/doc/types.ts (runtime types; Zod mirrors them in the Lab)
type Expr = string | number
type RoomRule<T> = { byRoom: SlotId; interp?: 'linear' | ['exp', number]; stops?: [number, T][]; step?: [number, T][] }
type Param = { kind: 'continuous' | 'discrete' | 'grow' | 'locked'; law?: 'golden' | 'free' | 'measured' | `ratio(${number})`;
               unit?: string; value: Expr | RoomRule<Expr>; range?: [number, number]; note?: string }
type Station = { u: Expr } | { s: Expr; from?: 'start' | 'end' | JunctionRef } | { angle: Expr }
             | { golden: 'major' | 'minor' } | { meet: TrackRef } | { socket: string } | { mid: [Station, Station] }
type Rider = { motif?: MotifRef; assembly?: AssemblyRef; on?: TrackRef; at: Station | { junction: JunctionRef };
               each?: 'junction' | 'side'; lane?: LaneRef; side?: 'in' | 'out'; offset?: Expr;
               orient?: 'tangent' | 'upright' | Expr; scale?: Expr; mirror?: 'x' | 'y' | 'auto';
               layer?: LayerId; minZ?: number; maxZ?: number; priority?: number; optional?: boolean; breaks?: boolean }
type WeightFn = { base: Expr; along?: [number, number][]; taper?: [Expr, Expr]; floorPx?: number }
type Cue = { on: 'routeChange' | 'firstVisit' | 'visibilityReturn' | 'hover' | 'focus' | 'variantChange';
             target: ParamPath; from?: Expr; to: Expr | { station: string }; dur: Expr; ease: string;
             order?: 'graph' | 'together' | 'stagger(Expr)'; tier?: 'auto' | 'A' | 'B' | 'C';
             reduced: 'fade' | 'blink' | 'end' | 'skip' }
```

---
### Worked example 1: Victorian corner medallion, its two weaving ribbons, the side-leaf clasp and the flame corner
Comments after `//` are annotations for this proposal. The saved file uses `note` fields instead.

```jsonc
{
  "$schema": "./frame.schema.json", "format": "burin-frame", "formatVersion": 1,
  "id": "victorian", "theme": "themes/engraving-ink.theme.json",

  "params": {
    "scale":    { "kind": "continuous", "unit": "px/u",
                  "value": { "byRoom": "page", "interp": "linear", "stops": [[-2, 0.42], [0, 0.78], [1, 1.0]] } },
    "ring.r":   { "kind": "continuous", "unit": "u", "value": 71.4, "law": "measured" },
    "ring.R":   { "kind": "locked", "law": "golden", "value": "ring.r * phi^0.5",  // drawn 1.20, golden 1.272 (+5u)
                  "note": "outer ring radius" },
    "stem.gap": { "kind": "continuous", "unit": "u", "value": 11.5 },       // between the two lines of one ribbon
    "stem.mid": { "kind": "locked", "law": "golden", "value": "stem.gap * phi" },  // drawn 16.9, golden 18.6
    "flame.b":  { "kind": "locked", "law": "golden", "value": "ln(phi) / (pi/2)" },  // 0.30635
    "flame.n":  { "kind": "grow", "value": { "byRoom": "corner.bl", "step": [[-9, 3], [-1, 4], [0, 6]] } },
    "garland":  { "kind": "discrete",
                  "value": { "byRoom": "rail.left", "step": [[-9, "rule"], [-1, "twist2"], [0.5, "plait3"]] } }
  },

  "profiles": {
    "ribbon.double": { "lanes": [
      { "kind": "rule", "w": "0.75px", "weight": { "base": "0.75px", "floorPx": 0.6 } },
      { "kind": "gap",  "w": "stem.gap - 1.5px" },
      { "kind": "rule", "w": "1px",    "weight": { "base": "1px", "along": [[0, 1.35], [0.12, 1], [0.88, 1], [1, 1.35]] } }
    ]},                                              // swells where it leaves the medallion and enters the flame
    "frame.rules": { "lanes": [
      { "kind": "rule", "w": "2px" }, { "kind": "gap", "w": "12.7u" }, { "kind": "rule", "w": "1px" } ] }
  },

  "assemblies": {
    "medallion": {                                     // local coords: origin at the junction, +x along top, +y down side
      "tracks": {
        "ring":  { "kind": "circle", "center": [130, 131], "r": "ring.R" },
        "sweep": { "kind": "cesaro",                    // S-sweep: G2 by construction
                   "start": { "on": "ring", "at": { "angle": 200 }, "heading": "tangent", "curvature": "match" },
                   "pieces": [ { "clothoid": { "len": 135, "k1": "solve" } },
                               { "clothoid": { "len": 76,  "k1": "solve" } } ],
                   "end": { "point": ["stems.x0", 300], "heading": 90, "curvature": 0 } }   // lands straight: G2 into the side spine
      },
      "families": {
        "tendrils": { "kind": "fan", "converge": { "on": "ring", "at": { "angle": 180 } },
                      "guides": ["sweep", { "offset": "sweep", "d": "17u" }], "count": 7,
                      "spacing": "uniform", "weight": { "base": "0.5px", "taper": [0, "30%"] } },
        "feather":  { "kind": "blend", "guides": ["feather.in", "feather.out"], "count": 10,
                      "spacing": "geometric(1.14)" }              // the measured outward growth, not phi
      },
      "punctuation": {
        "ringLoops": { "kind": "repeat", "motif": "ring-loop", "on": "ring",
                       "span": { "from": { "angle": 95 }, "to": { "angle": 355 } },
                       "pitch": { "angle": 28 }, "fit": "stretch-gap", "orient": "normal" }
      },
      "riders": { "core": { "motif": "hand-drawn/corner-medallion#core", "at": { "point": [0, 0] } } },  // hybrid: imported inner engraving
      "sockets": {                                     // four stem lines = two double-line ribbons
        "ribbons": { "on": "sweep", "at": { "u": 1 }, "spread": ["0", "stem.gap", "stem.gap + stem.mid", "2*stem.gap + stem.mid"] }
      },
      "variants": { "byRoom": "corner", "step": [[-9, "block"], [-1, "simple"], [0, "full"]],
                    "simple": { "hide": ["families.*", "riders.core"] },   // ring + sweep + loops only
                    "block":  { "replaceWith": "assemblies.rosetteBlock" } }
    },

    "flame": {
      "tracks": {
        "tips": { "kind": "logSpiral", "pole": [94, -72], "b": "flame.b",
                  "from": { "angle": -40 }, "sweep": "120deg", "rOuter": "45u" }
      },
      "riders": {
        "leaves": { "kind": "copyAlong", "motif": "leaf.golden", "on": "tips",
                    "stations": { "law": "equalAngle", "count": "flame.n" },
                    "scale": { "law": "spiralSimilarity" },     // scale = r_i / r_0: tips lie on the spiral by construction
                    "orient": "tangent + 12deg", "attach": "tip" }   // the leaf's tip socket sits on the station
      },
      "families": {
        "veins": { "kind": "fan", "converge": { "point": [-25, 52] },
                   "to": { "riders": "leaves", "socket": "base" }, "weight": { "base": "0.6px", "taper": ["20%", 0] } }
      },
      "sockets": { "ribbons": { "point": ["stems.x0", -150], "heading": -90, "spread": "medallion.sockets.ribbons.spread" } }
    }
  },

  "motifs": {
    "leaf.golden": { "kind": "parametric", "length": "37u",
                     "sides": [ { "law": "logSpiral", "b": "flame.b", "turn": "48deg" },
                                { "law": "clothoid", "turn": "67deg", "curvature": "bell" } ],
                     "sockets": { "tip": "end", "base": "start" } },
    "side-leaf":   { "kind": "svg", "src": "hand-drawn/side-leaf", "mirror": "y",
                     "sockets": { "stem": [74.8, 631.7] }, "knockout": "1.5u" }
  },

  "tracks": {
    "edge":    { "kind": "box", "of": "host", "inset": "6u", "corners": "square", "junctions": ["tl", "tr", "br", "bl"] },
    "spine.L": { "kind": "line", "from": { "socket": "med.tl#ribbons" }, "to": { "socket": "flame.bl#ribbons" },
                 "note": "the dominant vertical function of the left side" }
  },

  "sweeps": {
    "rules":     { "on": "edge", "profile": "frame.rules", "side": "in", "corners": "mitre" },
    "garland.L": {
      "on": "spine.L",
      "pattern": { "kind": "weave", "strands": "garland == 'plait3' ? 3 : 2", "ribbon": "ribbon.double",
                   "crossAngle": "38deg", "period": "64u", "fit": "wholePeriods",
                   "segments": [ { "to": { "socket": "clasp.L#stem" } }, { "from": { "socket": "clasp.L#stem" } } ],
                   "lock": { "at": "clasp.L", "event": "crossing" },        // a crossing always lands under the clasp
                   "ends": ["socket:med.tl#ribbons", "socket:flame.bl#ribbons"] },
      "when": { "garland": "rule" }, "else": { "profile": "ribbon.double" }   // threshold collapse to straight rules
    }
  },

  "riders": {
    "med.tl":   { "assembly": "medallion", "at": { "junction": "edge.tl" } },
    "med.tr":   { "assembly": "medallion", "at": { "junction": "edge.tr" }, "mirror": "x" },
    "flame.bl": { "assembly": "flame",     "at": { "junction": "edge.bl" } },
    "clasp.L":  { "motif": "side-leaf", "on": "spine.L", "at": { "golden": "major" },   // or {u:0.5}
                  "orient": "upright", "layer": "front", "minZ": -1, "priority": 2, "optional": true }
  },

  "cues": {
    "courier": { "on": "routeChange", "target": "riders.arrow.tl.at.u",
                 "from": 0, "to": { "station": "nav.active" },
                 "dur": "min(1.6s, 0.6s + track.len / 1800px * 1s)", "ease": "press", "tier": "A", "reduced": "blink" },
    "replay":  { "on": "firstVisit", "target": "*.reveal", "from": 0, "to": 1, "order": "graph", "dur": "1.6s",
                 "ease": "press", "tier": "B", "reduced": "fade" }
  }
}
```
How the pieces relate: the medallion's S-sweep ends at the four stem sockets. Those sockets start `spine.L`. The garland's ribbons are strands swept along `spine.L`, fitted in whole periods separately above and below the clasp, with the phase locked so that a crossing sits under the leaf. The flame's ribbons socket closes the loop at the bottom. Stretching the page lengthens `spine.L`. Every dependent then re-fits and nothing is ever scaled non-uniformly.

---
### Worked example 2: mid-century moulding, corner blocks and travelling chevrons
```jsonc
{
  "format": "burin-frame", "formatVersion": 1, "id": "midcentury", "theme": "themes/midcentury.theme.json",
  "params": {
    "depth": { "kind": "continuous", "unit": "u",
               "value": { "byRoom": "rail", "interp": "linear", "stops": [[-2, 20], [-1, 38], [0, 68]] } },
    "block": { "kind": "locked", "value": "depth" },                    // corner block = moulding depth, always square
    "finial.pitch": { "kind": "continuous", "value": "rung(17u, 1)" }  // 27.5u
  },
  "profiles": {
    "moulding": { "depth": "depth", "from": "outside", "collapse": "byKeep",   // under room: lowest keep dissolves first
      "lanes": [
        { "id": "fillet.out", "w": 7,   "paint": "cream",     "keep": 3 },
        { "w": 3,             "paint": "slate",     "keep": 1 },
        { "id": "chev",       "w": 6,   "paint": "teal.deep", "keep": 5, "rides": true },
        { "w": 5,             "paint": "cream",     "keep": 2 },
        { "id": "pins",       "w": "rest", "paint": "sand", "keep": 0,          // 21u at depth 68
          "fill": { "kind": "pinstripes", "pitch": "max(1.6u, 3px)", "weight": "max(0.5u, 1px)", "paint": "teal.deep" } },
        { "id": "finials",    "w": 6.5, "paint": "mustard",   "keep": 5, "rides": true },
        { "w": 3.5,           "paint": "cream",     "keep": 2 },
        { "w": 3,             "paint": "teal.deep", "keep": 2 },
        { "w": 3.5,           "paint": "cream",     "keep": 1 },
        { "w": 3,             "paint": "olive",     "keep": 1 },
        { "w": 2,             "paint": "sage",      "keep": 0 },
        { "id": "lip",        "w": 4.5, "paint": "teal.deep", "keep": 4 } ] }
  },
  "motifs": {
    "stud":    { "kind": "bevelSquares", "steps": [1, "phi^-1", "phi^-2", "phi^-3"],
                 "paints": ["teal.deep", "mustard", "cream", "slate"], "facets": "pyramid", "light": "theme.light" },
    "chevron": { "kind": "svg", "src": "motifs/chevron.svg", "origin": "tip", "fitLane": true },
    "finial":  { "kind": "svg", "src": "motifs/arrow-finial.svg", "origin": "center", "fitLane": true }
  },
  "tracks":    { "edge": { "kind": "box", "of": "host", "corners": "square" } },
  "sweeps":    { "moulding": { "on": "edge", "profile": "moulding", "side": "in" } },
  "junctions": { "edge.*": { "treatment": { "byRoom": "corner", "step": [[-9, "mitre"], [-1.5, "block"]] },
                             "block": { "size": "block", "fill": "stud" } } },
  "riders": {
    "chev": { "motif": "chevron", "on": "edge", "lane": "chev", "each": "junction",
              "at": { "s": "block/2 + 3u", "from": "junction", "dir": "both" },   // two per block, pointing away along each side
              "orient": "tangent", "layer": "front" }
  },
  "punctuation": {
    "finials": { "kind": "repeat", "motif": "finial", "on": "edge", "lane": "finials", "each": "side",
                 "span": "betweenJunctions(inset = block)", "pitch": "finial.pitch",
                 "fit": "stretch-gap", "align": "center", "mirror": "atCenter", "phase": 0, "minZ": -1 },
    "title":   { "kind": "single", "cartouche": "title", "on": "edge.top", "at": { "u": 0.5 }, "lane": "all", "knockout": true }
  },
  "cartouches": {
    "title": { "body": { "kind": "superellipse", "n": 4, "aspect": "fromText" }, "profile": "moulding.mini",
               "padding": ["0.5em", "1.4em"],
               "text": { "slot": "site-title", "fit": "widthFromText", "max": "42%w", "minFont": "1rem" } }
  },
  "regions": {
    "inner": { "bounds": "inside(moulding)", "split": { "axis": "y", "parts": [
      { "id": "masthead", "h": "content" },
      { "id": "body", "h": "content", "inset": { "frame": "insets/notched-bracket", "gap": "10u" },
        "split": { "axis": "x", "gutter": { "w": "24px", "profile": "rule.teal" }, "parts": [
          { "id": "main",  "w": "phi fr" },
          { "id": "aside", "w": "1fr", "minW": "220px", "reflow": { "below": "medium", "to": "after:main" } } ] } },
      { "id": "foot", "h": "content" } ] } }
  },
  "cues": {
    "procession": { "on": "routeChange", "target": "punctuation.finials.phase", "from": 0, "to": 1, "unit": "pitch",
                    "dur": "0.62s", "ease": "press", "tier": "A", "reduced": "skip" },     // ends identical to how it started
    "courier":    { "on": "routeChange", "target": "riders.chev[tl.east].at.s",
                    "to": { "station": "nav.active" }, "dur": "1s", "ease": "press", "tier": "A", "reduced": "blink" }
  }
}
```

---
### Brief example 3: architectural order frame (Beaux-Arts interior)
```jsonc
"orders": { "pilaster": {
  "base":    { "motif": "attic-base", "h": "16u" },
  "shaft":   { "profile": "pilaster.fluted", "flutes": { "count": { "byRoom": "bay", "step": [[-9, 0], [-1, 3], [0, 5]] } } },
  "capital": { "motif": "ionic-cap", "h": "16u * phi" } } },
"tracks": {
  "pil.L": { "kind": "line", "from": "edge@bl + (band, 0)", "to": "entab@bottom" },
  "arch":  { "kind": "arch", "span": ["pil.L@top", "pil.R@top"],
             "form": { "byRoom": "nave", "step": [[-9, "lintel"], [-0.5, "segmental(rise = span / phi^3)"], [0.5, "semicircle"]] } } },
"riders":      { "pil": { "order": "pilaster", "on": "pil.L", "each": "side", "mirror": "auto",
                          "variant": { "byRoom": "rail", "step": [[-9, "rule.double"], [-1, "pilaster.thin"], [0, "pilaster"]] } } },
"sweeps":      { "archivolt": { "on": "arch", "profile": "archivolt" }, "entablature": { "on": "edge.top", "profile": "entablature" } },
"punctuation": { "voussoirs": { "kind": "repeat", "on": "arch", "count": "odd", "keystone": { "at": { "u": 0.5 }, "motif": "keystone" }, "pitch": "18u" },
                 "balusters": { "kind": "repeat", "on": "balustrade", "motif": "baluster", "pitch": "14u", "fit": "stretch-gap" } },
"regions":     { "nave": { "bounds": "between(pil.L, pil.R) under(arch)",
                           "split": { "axis": "x", "parts": ["bay.1", "bay.2", "bay.3"],
                                      "dividers": { "order": "pilaster.thin", "minZ": -1 } } } }
```
The base and capital stay fixed while the shaft stretches with content height. The arch radius follows the span. For the bay under the arch, the engine emits a `clip-path` and a top inset equal to the arch rise at each slot edge.

### Brief example 4: minimal modern card (Japanese menu)
```jsonc
"tracks":  { "card": { "kind": "box", "of": "host", "inset": "clamp(12px, 4vw, 40px)", "corners": { "kind": "squircle", "r": "18u", "n": 4 } } },
"sweeps":  { "hairline": { "on": "card", "offset": "-10u", "profile": { "lanes": [ { "kind": "rule", "w": "0.75px", "paint": "ink.soft" } ] } } },
"regions": { "card": { "bounds": "inside(card)", "pad": "rung(16px, 1)" },
             "blocks": [ { "id": "blush", "rect": ["6%", "10%", "48%", "38%"], "paint": "blush", "z": -1 },
                         { "id": "sage",  "rect": ["38%", "30%", "92%", "70%"], "paint": "sage", "z": -2, "blend": "multiply" } ] },
"riders":  { "sprig": { "motif": "sprig", "on": "card", "at": { "s": "-24u", "from": "card.tr" }, "breaks": true, "bleed": "64u",
                        "variant": { "byRoom": "page", "step": [[-9, "tucked"], [0, "breaking"]] }, "layer": "front" } },
"finish":  { "paper": "washi", "shadow": "soft-1" }
```
On a phone there is no bleed room, so the sprig switches to `tucked`: it stays inside the card, scaled to the corner.

## Relationships

**How relationships are expressed: six kinds, no free code**
1. **Attachment (rider to track).** A child is posed by (track, station, side, offset, orientation, scale). That is the whole relationship, and it covers 62% of the drawing's stroke ends, which land on other strokes. When the track moves, the child follows.
2. **Derived tracks.** `offset(track, d)`, `connector(stationA, stationB, law)`, `strand(spine, wave)`, `blend(trackA, trackB, t)`, and socket-started tracks. A derived track inherits its parent's arc length in closed form: an offset has length L + d·Δθ.
3. **Station expressions.** Stations defined from other stations: `golden:'major'`, `mid`, `meet`, `socket`, `s from junction`. Example: the cartouche sits at u = 0.5 of the top edge, and the nav station for "Projects" is the second of five equal divisions of the cartouche-free part of the top edge.
4. **Laws.** Spacing laws on families and punctuation (`uniform`, `geometric(r)`, `pitchPx`, `fitWhole`), scale laws on copies (`spiralSimilarity`, `linear` as drawn, `rung`), and weight functions. A law is a named, swappable choice, never a hard-coded constant.
5. **Parameter expressions.** `stem.mid = stem.gap * phi`, `block = depth`. A parameter has a kind (continuous, discrete, grow or locked) and an optional law tag.
6. **Locks and phase locks.** Closure relations a pure pipeline cannot express by itself: "a weave crossing lands under the clasp", "finials are mirrored about the centre", "voussoir count is odd". Each is implemented inside one node as a local fit, such as integer period fitting per segment.

**How they are solved**
- The document compiles to an explicit DAG. Every node lists its inputs by id, in the style of the Observable runtime. The engine sorts the DAG once at load. A cycle is a load error that names the loop, for example `spine.L → garland.L → clasp.L → spine.L`. Evaluation is lazy and memoised with version stamps, using Preact's "signal boosting" algorithm in about 150 hand-written lines. Equality on geometry uses an epsilon, so unchanged outputs stop propagating.
- Solving is **local and bounded**. There is no global constraint solver. Solving happens in three places:
  - inside nodes: the clothoid G1 connector (Bertolazzi-Frego Newton, at most 5 iterations), Cesàro-chain end closure (Newton or LM over 1 to 3 free piece parameters), whole-number repeat fitting, weave phase locks
  - in Lab handle drags, where an edit is an inverse solve on the 1 or 2 parameters the handle owns
  - optionally offline in the Lab: planegcs for a real mutual-tangency cycle, or energy-based spacing. Results are baked into parameters, and the relation stays as an assert.
- Every local solve returns `{value, status, residual}`. It has an iteration cap, a NaN check and a fallback: last good value, then Hobby, then an arc. This follows the Cassowary authors' advice: local propagation for anything with a direction, and cooperating subsolvers only where needed.

**How they are validated**
- Asserts live in the document: `minGap`, `noCrossing`, `offset < Rmin`, `w·κ < 1`, `A < Rmin(spine)`, `h < λ²/(4π²A)`, `tiles >= 1`, `goldenPitch within 2%`, `text fits cartouche`, and `contrast(text slot, paint behind) >= 4.5`.
- Validators run on every Lab write, not just on save. They also run in a Node CLI over a bracket of sizes in CI, so a document that breaks at 360 px fails the build.
- Lab badges point at the offending station on the canvas: a red tick on the track, not a log line.

**How they are edited**
- Each node type declares handles in the style of tldraw's `getHandles`/`onHandleDrag`. A handle names the 1 or 2 parameters it may change. Dragging solves argmin |handle(params) − pointer|² over those parameters only (edit), holding everything else (stay), and never touches locked values. Examples: dragging the clasp moves its station u; dragging a ring loop changes the loop pitch angle; dragging the flame's outermost tip changes rOuter and the pole angle, but not b.
- Snap targets are stations: junctions, u = 1/φ, rungs, existing riders' sockets, lane centres and anchor angles.
- Pointerdown sets an undo mark, moves send immer patches, pointerup squashes them into one step, and Escape bails.
- Deleting a parent offers **bake**: convert dependents to absolute geometry rather than breaking them.
- The Inspector shows every relationship as a sentence with chips, for example "**clasp.L** rides **spine.L** at **golden major** · upright · front layer", and each chip is a dropdown.

## Curves

**Rule: use the curve whose curvature behaviour the eye expects for that job, define every curve by angle and curvature over its own arc length, and send all of them through one fitter to output SVG.**

| Job | Family | Why / notes |
|---|---|---|
| Straight edges, mouldings, rules, deco steps, ticks | line | Exact. Emitted as `H`/`V`/`L`. Flat lanes snap to device pixels. |
| Medallion ring, roundels, deco circles, semicircular arches | circle/arc | SVG `A`, which is exact. Inside fitted outlines, arms are (4/3)tan(Δθ/4)R per ≤ 60° piece, never L/3. |
| Medallion S-sweeps (measured as clothoid, R² 0.98), garland lead-ins | clothoid in a `cesaro` chain, or a `spiro` knot spline | Curvature linear in s gives the "drawn by a confident hand" sweep and G2 into straight stems. Evaluated by composite 16-point Gauss-Legendre, with no Fresnel cancellation near κ₁ = 0. |
| Joining two posed stations (socket to spine, leaf to stem) | `connector` clothoid G1 (Bertolazzi-Frego), or 3-clothoid G2 when curvature must match at both ends | A single clothoid cannot always meet G2 data, so the G2 case uses three. |
| Line-to-arc transitions (rounded deco corners, arch springing) | clothoid easement | Removes the curvature jump that reads as a "kink" on large radii. |
| Flame tip curve, scroll terminals, volutes | logSpiral (golden b = 0.30635, or a volute b dial) ending in a G2 eye circle of radius b·s | Self-similar, so copies stamped by spiral similarity land on it by construction. Nested lines around an eye are rotated copies about the pole, not offsets. |
| Leaf sides, flame tongues, acanthus lobes | LAC (α dial: −1 clothoid, 1 log spiral) or a clothoid side with a bell-curvature preset | The drawn leaf back has bell curvature (peak mid-side), which a single LAC can't produce, so offer a 2-piece side. |
| Cartouches, jewel, modern card corners, nameplates | superellipse (n ≥ 2.5; Knuth 8-knot) / squircle | Curvature is 0 at the vertices, so the curve joins straight runs G2. This is why a squircle card looks "designed" rather than border-radius. |
| Basket-handle and segmental arches | three-centred arch (tangent arcs) or segmental arc with a rise rule; Gothic = two arcs | Classical constructions. Rise options include span/φ³. |
| Weave ribbons | `strand` = spine + A·cos(2πs/λ + ψ)·n, analytic | The designer sets crossing angle, period and ribbon width, and A is derived from them. Guards: A < Rmin(spine) and half-width < λ²/(4π²A). |
| Fans, feathers, hatch | `blend` between two guide tracks or `fan` to a station; `offsets` only where d < Rmin | Never offset Béziers; always offset the analytic spine. |
| Guilloché rosette, sunburst | epitrochoid/rose bands (from the existing spike); rays from a pole at equal or golden angles | Rays are lines, so they are cheap. Rosettes can rotate by 2π/lobes as a motion (rose-engine turn). |
| Imported Illustrator motifs | `imported`, simplified by the fitter; optionally "fit to family" with a residual report | The fit-then-snap loop, never a silent snap. |
| Live-drag preview, Spiro fallback | Hobby | Only approximately G2. Never final output. |

**Shared kernel.** Two interfaces carry everything. `Intrinsic` provides L, θ(s), κ(s), point(s), endState(). `Fittable` provides sample(t) → point and derivative, plus cusp detection. Output goes through one fitter. Phase 1 uses equal-turn subdivision, arms = chord/(3cos²(Δθ/4)) and a sampled error check, at a tolerance of about 0.1 device px at the current scale; that is roughly 2 to 3 cubics per clothoid limb and 6 to 8 per golden turn. Phase 2 is a port of kurbo's fit.rs. The Lab shows the curvature comb, κ-jumps at joins, d·κ and w·κ margins, and a "golden readout" (fitted b from the slope of ρ against s) on any selected curve.

## Golden ratio

**Principle: phi is a law you choose and the engine then enforces exactly. It is never a number found in a drawing.** The drawing analysis showed that every ratio lies within 12% of some half-power of phi. Phi is therefore imposed by construction, every place it is imposed is labelled, and the cost of imposing it is shown.

**Where it is enforced by construction**
1. **Flame / scrolls (the owner's main ask).** The tip track is a log spiral with b locked to ln(φ)/(π/2), so it grows ×φ per quarter turn. Leaves are copies of one master under a single spiral similarity: scale e^{bΔφ}, rotation Δφ about the pole. Tips therefore lie on the golden spiral exactly, not approximately. The master leaf's sides are golden log-spiral or LAC arcs, so each leaf is "perfectly curved". A dial chooses the leaf scale law: `spiralSimilarity` (self-similar, golden) or `linear` (as drawn). The Lab states the visual consequence: the small leaves get noticeably larger.
2. **Medallion.** Ring radius R = r·φ^½ (drawn ratio 1.20, golden 1.272, ring grows about 5u). Ribbon spacing gives middle gap = φ × line gap (adds 1.7u). The fan spacing law stays `uniform` by default, because the drawing does not support phi there.
3. **Crest.** The inner heart is a similarity copy with scale chosen from {1/√2 as drawn, 1/φ}. Overall proportions come from `rung(width, -k)`.
4. **Layout.** Golden splits: `phi fr : 1fr` columns, masthead height = rung(base, k), station u = 1/φ for asymmetric placements (clasp, nameplate), and arch rise = span/φ³ as one option.
5. **Profiles.** An optional "ladder" mode sets lane widths to rung(unit, k). The Lab shows it as a snapping grid in the profile editor. Measured profiles, such as the mid-century 68u, can stay `measured`.
6. **Room ladder and motion tokens.** Threshold levels step by ×φ (z = log_φ(size/sRef)). Duration tokens are 0.38 s / 0.62 s / 1 s / 1.62 s. These are explicitly token scales with no perceptual claim.

**How it is enforced mechanically**
- Golden values are `kind:"locked", law:"golden"` parameters, written as expressions (`ln(phi)/(pi/2)`), not decimals.
- Handles never write locked parameters. A drag that would need one is redirected to the nearest free parameter, for example moving the pole instead of changing b.
- Room expressions are refused on locked parameters.
- Validators check the result after fitting to cubics: the fitted b of the emitted path is within 0.5% of golden. Golden is therefore verified in the output, not just in the input.

**Escape hatches, all visible**
- Every law chip can be switched to `free`, `ratio(r)` or `measured`. Switching writes `{"law":"free","was":"golden","note":"why"}` to the file, so a departure from golden shows up in the git diff.
- The **residual readout** shows the cost of switching either way, for example "golden moves the tips 0.39 RMS / 0.69 max u". This is the fit-then-snap loop from the research.
- Alternative phi-derived spirals (φ per 54°, 108° or 144°, from Sharp's table) let a tighter curl stay "phi-derived". A `volute` preset (b about 0.15, matching the drawn right-hand curl) is available and is labelled "not golden".
- In flat-colour styles (mid-century, deco, minimal), phi only appears where the designer puts it, as a ladder or a split. The engine never forces it.

## Thresholds

**Model: two tiers of "room"**
1. **Page width class (CSS-owned):** compact under 600, medium 600 to 1200, wide 1200 and up, in CSS px. The class decides which slots and bands exist. Examples: on compact, side bands shrink to 10 to 16 px, and the aside column re-flows after main. It is set with media or container queries on the host, so CSS owns layout reservation.
2. **Per-slot room level z (engine-owned):** z = log_φ(size / sRef), where size is the slot's governing dimension:
   - corner: min(w, h) of the band corner square
   - rail: band thickness
   - band: band height
   - bay: bay width

   One z step is ×1.618. Inputs are `z`, `aspect`, `length` (drives counts only, never variant choice), `devPx` (drives hairline floors and line merging) and the width class. Pinch-zoom never changes a variant, but browser zoom does, because it re-lays out the page. z is clamped at the ends of the designed range.

**Rules**
- Each parameter declares its kind:
  - `continuous`: interpolates between stops
  - `discrete`: step only (leaf count, strand count, corner treatment, motif variant)
  - `grow`: discrete, but new lines are born from zero width over the hysteresis band
  - `locked`
- **Anchors.** The designer authors 2 to 4 anchor parameter sets per slot, at z = −1 / 0 / +1 (S, M, L), with more of them and bigger changes at the small end. Continuous parameters interpolate between adjacent anchors only while all discrete parameters agree; the validator enforces this compatibility rule. Where discrete values differ, the engine inserts a step at the log-midpoint, which the designer can drag. A pinned override at any z wins.
- **Evaluation order per slot** (Roth et al.): which elements exist (minZ inclusive, maxZ exclusive; an inactive assembly hides its whole subtree), then topology, then continuous geometry, then weights with px floors, then collisions by priority (optional riders drop first, fallback forms are tried in order, padding sets clearance).
- **Hysteresis:** switch up at t·φ^h and down at t·φ^−h, with h = 0.05 by default. On first load there is no history, so the variant is picked canonically, which keeps reloads deterministic.
- **Counts:** whole-number repeats go through the same trigger, so they don't jitter. Line families keep a constant on-screen pitch (`pitchPx`) and change count rather than pitch, which preserves the texture. An optional size-versus-count dial α (0.5 is Töpfer's radical-law preset) splits a loss of room between smaller motifs and fewer motifs.
- **Profiles** collapse by lane `keep` priority: the lowest-priority lanes dissolve first and the remaining widths renormalise to the depth. On the mid-century moulding the pinstripes go first, then sage, then single fillets; teal lip, mustard and chevron lanes are the last survivors.

**Per-style ladders** (examples the Lab ships as starters)
- Victorian:
  - corner: full medallion → simple (ring + sweep + loops) → rosette block
  - rail: 3-strand plait → 2-ribbon twist → double rule; side-leaf clasp optional below z −1
  - flame: 6 → 4 → 3 leaves (grow)
  - on compact, the ribbons run only along the top and bottom bands (pending owner decision)
- Mid-century: block corners become mitres below z −1.5; the profile collapses from 12 lanes to 6 to 3; finials drop, while chevrons survive as terminals.
- Blueprint: graduated ticks lose a level whenever its pitch falls below 4 device px; the header vignette between ovals becomes a title only.
- Beaux-Arts: columns → thin pilasters → double rules; arch: semicircle → segmental → lintel; flutes 5 → 3 → 0.
- Deco: the spine sequence drops items by priority, steps go 4 → 2 → 1, and the sunburst ray count halves.
- Minimal: the sprig goes from breaking the frame to tucked inside it; the colour blocks re-flow to stacked.

**Authoring**
- Any parameter is promoted to room-dependent with one click (Maputnik style), which opens a stops table and a value-versus-z curve.
- For each slot, a **ScaleMaster strip**: rows are elements and discrete parameters; the x axis is z on a log scale, with ticks at phi steps and markers where 360/768/1280/1920 px pages land; bars show variant ranges; break points are draggable and carry notes.

**Preview**
- A generated filmstrip: one cell per anchor, cells just below and above each threshold (including the hysteresis band), and the clamped extremes. Each cell carries validator badges: hairline under floor, gap under 1 device px, collision, clamp.
- A **sweep** button animates z from min to max to catch pops.
- A live/canonical toggle shows hysteresis behaviour.
- Topology changes cross-fade for about 250 ms at runtime, and the Lab plays that too.

## Animation

**Model: motion is time-varying parameters on the same solved graph**
Every parameter has a stable path (`riders.chev[tl.east].at.s`, `punctuation.finials.phase`, `families.tendrils.reveal`, `assemblies.flame.leaves.grow`). A **Cue** is data in the frame file: trigger, target path, from/to (in track terms: u, s, phase in pitches, reveal 0..1), duration, easing (`linear()` strings designed in the Lab; the default "press" easing is near-constant velocity with short ease-in and ease-out, like a printing machine and not a spring), order rule (`graph` uses the dependency DAG's topological order, `stagger(...)`, `together`), tier and a mandatory reduced-motion behaviour. Motion state is never stored in pixels. A resize finishes running motion instantly, re-solves, and keeps the u/phase values.

The data model has to allow this from M0, even though motion ships late:
- every track answers point/tangent/curvature at s
- rendered pieces get stable ids plus their s-range on the parent track
- weave pieces keep over/under order and halos
- moving parts render as `<g transform>` or HTML wrappers, never as `<use x= y=>`, which Chromium refuses to composite

**MotionDirector** is one runtime that picks the cheapest correct tier:
- **Tier A, compositor (rigid travellers).** Sample the track at uniform s (64 to 128 keyframes) and run `element.animate([{transform: translate() rotate(), offset: s/L}...])` on a small absolutely positioned HTML wrapper holding the glyph's SVG. That wrapper is the cross-engine way to get compositing, including Safari. The motion keeps running while the router renders the new page. Occlusion under weave crossings uses an overlay mask cut from the over-piece halos. On a straight interval, a whole row of riders can move as one clipped group with a single transform.
- **Tier B, paint (reveals and pulses).** `pathLength=1` on spines. Dash windows for rules. Mask-reveal per RibbonPiece for filled outlines, with the offset shifted by the piece's start s, so a draw-in flows correctly across crossings.
- **Tier C, geometry (true shape change: weave ripple, leaf unfurl).** One rAF loop driven by timestamps. It re-evaluates only the subgraph downstream of the animated parameter and writes only the changed `d` attributes. It has a 4 ms budget, to be measured in the Lab, and falls back to B or A when over it.

**Lifecycle**
- When the document is hidden, the director pauses, commits end states, and does not queue anything.
- `prefers-reduced-motion` is read live through matchMedia, and the site also has a per-viewer "still engraving" toggle. Each cue swaps to its `reduced` form (fade, blink at destination, or jump to end).
- Every motion is event-triggered and under 5 s, with no ambient loops, which satisfies WCAG 2.2.2.
- Threshold topology changes cross-fade and never morph. Repeat-count refits also cross-fade.
- Route changes use a same-document View Transition for the **content only**. The frame layer is kept out of the raster snapshot (`::view-transition-group(frame){animation:none}`, old image hidden), so hairlines are never stretched. After `updateCallbackDone` the frame re-solves for the new page height and then fires the `routeChange` cues.

**First motions to support, in order**
1. **Section marker (functional, M8).** The frame is the navigation indicator. Each nav item maps to a station on the top track or lane. The active section is a rider whose station animates to the new item's station on route change: a chevron or arrow travelling along the moulding lane, or the medallion's arrow riding the ribbon. This is the owner's "arrows run along their track" made into a working UI element (Tier A).
2. **Procession (M8).** On route change, a repeat row (finials, beads, ring loops) advances its phase by exactly one pitch. The end state is identical to the start, so it is safe, cheap and composited on straight runs.
3. **Track highlight on hover and focus (M8).** Hovering or focusing a nav link slides a dash-window glint along the lane to that link's station (Tier B, about 300 ms). The native focus ring always stays visible, and the glint is supplementary.
4. **Settle (M6).** A 250 ms threshold cross-fade.
5. **Construction replay (M9, first visit only).** Dominant tracks draw in first. Each dependent starts when its parent's pen passes the dependent's attach station, with order from the DAG, about 1.6 s in total. This makes the relationships visible.
6. **Ink pulse, courier along the weave with occlusion, rose-engine turn of a guilloché band, flame unfurl in growth order, weave ripple (Tier C)** come later.

No GSAP, Rive, Lottie or Theatre at runtime: the engine already has exact arc-length tables, and those tools either bake geometry or bring licence risk. The Lab copies Theatre's model (typed parameters plus keyframes in JSON) without depending on it.

## Frame Lab

**Shape.** `lab.html` is served only by the Vite dev server. A Vite plugin with `apply:'serve'` validates the document and writes `frames/*.frame.json` and `themes/*.theme.json` to disk as real files git sees, with no hidden localStorage state. The blog, open in another tab, hot-reloads from the same JSON. The Lab uses the same `frame-core` solver the site ships, so what the owner sees is exactly what renders. The Lab UI can be written in anything; plain TS plus lit-html or Preact keeps it small. It never ships to the site.

**Screen layout (one window)**
- **Top bar:** frame picker, theme picker, page-size presets (360 / 390 / 768 / 1024 / 1280 / 1440 / 1920 and custom), width-class readout, z readout per slot, an "underlay" toggle, undo/redo, save state.
- **Left: Outline.** A tree grouped as Tracks / Junctions / Sweeps / Riders / Punctuation / Families / Regions / Cartouches / Cues. Every row has an eye (hide), a lock, a colour swatch and, on hover, a relationship sentence such as "rides spine.L at golden major".
- **Centre: Canvas.** The live frame at the chosen size, with real or placeholder content in the slots. Content can be lorem, or a live route of the blog in an iframe slot (later).
  - **Construction overlay:** tracks in blue with station ticks (u = 0, 0.25, 1/φ, 0.5, ...), junction diamonds, lane centrelines dotted, normals, curvature combs on the selection, socket arrows, slot rectangles tinted with their names, and hulls and knockouts outlined.
  - Handles appear on the selection. Hovering a handle names the parameter it owns.
- **Right: Inspector.** The parameters of the selected node as sentence rows with chips:
  - law chips (golden / ratio / free / measured, with the lock state)
  - unit chips (u / px / % / rung)
  - a room chip, which turns any value into a stops table with a small curve
  - residual readouts on fitted items ("golden b: fitted 0.3061, Δ 0.07%")
- **Bottom dock (tabs):**
  1. **Profile editor.** The cross-section drawn as a vertical stack of lanes at 8× zoom, beside three live previews: a straight run, a corner with the current treatment, and a curved run around a sample arc. Lane boundaries can be dragged, and widths snap to integers, the rung ladder or the underlay. Lane kinds are picked from a palette. Keep priorities are set by drag-to-reorder in a "collapse order" list, with a depth slider that shows the collapse live.
  2. **ScaleMaster.** One strip per slot (see thresholds).
  3. **Contact sheet.** The generated filmstrip of sizes and threshold edges, with validator badges. Clicking a cell sets the canvas to that size.
  4. **Timeline.** One lane per Cue, with scrub, replay, trigger buttons ("simulate route change to /projects"), a reduced-motion preview, and an ms-per-frame meter per tier.
  5. **Validators.** A list of assert failures. Each one zooms to the offending station.
  6. **Graph.** A read-only dependency graph. Selecting a node highlights its upstream (blue) and downstream (orange) on the canvas.
- **Motif workshop** (a separate tab): import an SVG from Illustrator, which runs the existing cut/clean pipeline. Then set the origin, sockets (click a stroke end, and the heading is read from the path tangent), hull (auto-convex, editable) and an optional text slot rectangle. **Fit to family** fits a selected path to circle, clothoid, log spiral or LAC, shows the residual, and offers to replace it with the parametric version.
- **Theme panel:** palette tokens as swatches with contrast checks against `paper`; a light-direction dial that live-updates bevel facets; finish options (engraved / flat / blueprint inversion / paper texture / shadow); a weight-scale slider.

**Tools (keyboard letters)**
- **R Ride:** drag a motif from the library onto any track or `rides` lane. It snaps to stations, and Alt-drag changes side and offset.
- **S Sweep:** click a track, drag from station to station to choose an interval, then pick a profile.
- **J Junction:** click a corner to cycle treatments, with previews in a popover.
- **F Family:** pick a convergence station, then one or two guide tracks, then set count and spacing law; the spacing law is drawn as a mini graph of gaps.
- **P Punctuate:** select an interval or lane, then choose repeat / graduated / sequence / single.
- **D Divide:** click a region and drag a divider. Ratios snap to 1:1, φ:1, 2:1 and "content". Then set the divider's profile.
- **C Cartouche:** place a cartouche and bind it to a named text slot.
- **T Track:** draw a dominant curve by on-curve knots (Spiro point types corner / g2 / left / right), previewed with Hobby while dragging, or choose a constructor (connector, arch, logSpiral from pole + b).

**Profile probe (underlay to profile).** Place a traced reference (for example `websiteOutline.svg`) as a dim underlay. Drag a probe line across a band. The engine samples colours along roughly 30 parallel scanlines, takes the median to cancel trace wobble, clusters colours into palette tokens, and proposes lanes with widths. The owner accepts, renames and adjusts them. This turns Illustrator into a sketch source without trusting its geometry.

**A designer's first session (about 45 minutes, building the mid-century frame)**
- 0:00 New frame from the "Moulding" starter (box track, mitre corners, a 3-lane placeholder profile, a main slot). The canvas shows it at 1280 × 900.
- 0:02 Toggle the underlay and pick `websiteOutline.svg`. It is drawn at 30% opacity, scaled to the box.
- 0:04 Profile probe across the left band. The proposal is 12 lanes at about 68u with the 7 palette clusters. Accept, rename tokens (mustard, teal.deep, cream, ...), and nudge two boundaries that the trace blurred.
- 0:09 Junction tool on any corner: choose **block**, set size = depth (a lock icon appears). In the stud popover, 4 nested squares, ladder steps φ⁻¹, pyramid facets. Rotate the light dial to 315° and watch the facets re-tone.
- 0:14 Ride a chevron onto the teal `chev` lane next to the top-left block. Choose `each: junction, dir: both`, and eight chevrons appear, mirrored.
- 0:17 Punctuate the mustard lane with the finial motif: repeat, pitch 27.5u, stretch-gap, mirror at centre. The sides re-fit live as the window is resized.
- 0:21 Place a cartouche at u = 0.5 on the top edge, bound to the `site-title` slot. Type the title, and the superellipse body widens to fit the text.
- 0:25 Divide the interior: masthead / body / foot, then body into main : aside at φ:1 with a 24 px teal rule gutter. Add the notched-bracket inset frame to the body.
- 0:30 Contact sheet. The 360 px cell shows red badges: the pinstripe gap is under 1 device px, and the chevrons collide with the title. Open ScaleMaster for `rail`: drag the block → mitre break to z −1.5, and set chevrons `minZ: −1`. The profile collapse plays as the z scrubber is dragged.
- 0:38 Timeline: add a cue on routeChange → `finials.phase` 0 → 1 pitch, 0.62 s, "press". Add a second cue: the top-left chevron courier to `nav.active`. Simulate navigating to /projects, scrub, then check the reduced-motion preview.
- 0:44 Save. `frames/midcentury.frame.json` is written and the blog tab hot-reloads. `git diff` shows readable changes.

Undo is patch-based (immer), one step per drag, and session state (size, zoom, selection) is never undone or saved. Acceptance test from Figma's undo rule: undo a lot, copy, redo to the present, and the document is unchanged.

## Engine architecture

**Layout on disk** (a single repo, TS path aliases, nothing published):
```
frame/
  geom/     curve kernel: Intrinsic/Fittable, line, arc, clothoid (GL16), logSpiral, lac, superellipse,
            cesaro turtle, connector (Bertolazzi-Frego), spiro wrapper (+hobby fallback), offset, strand,
            arc-length tables, fitter (phase 1 → kurbo port), outline (p ± w(s)n), rounding
  doc/      types, expression parser → AST, station resolver, migrations[], deterministic writer
  solve/    DAG compiler + version-stamped memo evaluator; stage functions (below)
  paint/    theme application: tokens, bevel lighting, finish rules, hairline floors
  emit/     scene → SVG layer strings or DOM patches (stable ids), slot rects, CSS vars
  host/     <frame-host> custom element: ResizeObserver, slot measurement, grid emission, route hooks
  motion/   MotionDirector (tiers A/B/C), cue scheduler, reduced-motion & visibility handling
  cli/      node: render doc at sizes → SVG files + validator report (CI snapshot tests)
lab/        dev-only editor (never imported by the site)
frames/*.frame.json, themes/*.theme.json, motifs/*.svg|json
```
The existing pieces are promoted, not discarded:
- the spike's `phi.ts`, `weave.ts`, `guilloche.ts` and `turtle.ts` become `geom` and generator nodes; the turtle becomes the Cesàro turtle, and weave gets analytic strands
- `hand-drawn.json`'s hulls and sockets become the `svg` motif format
- today's `FrameConfig` rings map one-to-one onto profile lanes through a migration script

**Pipeline.** The signature is `solve(doc, ctx) → Scene`, where ctx = {box, widthClass, regionsMeasured, dpr, theme, time?, history?}.
1. **Room:** per-slot z (with hysteresis history in live mode), then active variants and the parameter values for this z.
2. **Bands and regions, pass 1 (width down):** profile depths decide band thicknesses; the region tree resolves column widths from the box width (fr, φ splits, minW, reflow rules); emit grid columns.
3. *(CSS lays out the content; the host measures row heights.)*
4. **Regions, pass 2 (height up):** measured row heights set the y positions of horizontal dividers and the box height.
5. **Tracks:** box and edges, then sockets of junction assemblies, then spines, connectors and arches, in topological order. Local solves happen here.
6. **Sweeps:** profiles along intervals, corner treatments at junctions, terminals.
7. **Riders and punctuation:** station resolution, whole-number fitting with phase locks, collisions by priority.
8. **Families:** offsets, blends and fans with spacing laws and weight functions; validity guards.
9. **Outline and fit:** variable-width outlines, then cubic fitting at device-px tolerance, then rounding to 2 decimals.
10. **Paint:** theme tokens, facet lighting (facet colour = mix(base, light or shade, n·l)), finish.
11. **Emit:** layers (paper, back, front, motion) plus slot rects plus CSS variables (`--frame-variant-corner: block`, `--slot-main-x`, ...) plus a track table for the MotionDirector.

**Two-direction layout without loops.** "Widths flow down, heights flow up":
- The engine writes column widths and band thicknesses only. Rows holding content are `auto`, so CSS decides their heights.
- The frame layer is absolutely positioned, `pointer-events:none`, and never changes the size it measures.
- Variant choice depends on widths and band sizes, never on content height. Height only drives lengths and counts.
- `scrollbar-gutter: stable` on the root stops content growth from flipping a width threshold.
- So one measurement pass converges. ResizeObserver callbacks are coalesced into one rAF solve per frame.

**Caching**
- Each DAG node is memoised by its input versions. Geometry uses epsilon equality, so a resize that changes only the height re-runs only the vertical tracks and their dependents.
- Structure (variant key plus integer counts) is separated from paint (continuous values, quantised at z steps of 1/32 and box size steps of 1 px).
- Results are cached in an LRU keyed by (node, inputs hash); hashes use JCS-canonical JSON.
- Imported motifs are parsed once per session. Parametric motifs are cached by their parameters.

**Determinism**
- No `Math.random`; a seeded PRNG only where jitter is wanted (none by default).
- Every iterative solve has fixed iteration caps and starts from the same warm start on canonical evaluation.
- SVG coordinates are rounded. CI snapshot tests run in Node and compare with a tolerance, because Math precision is implementation-dependent.
- `node.algo: "v1"` pins algorithm versions so committed art never shifts silently. Migrations are versioned with fixture files.

**Performance budgets** (to verify in the Lab meter)
- Resize re-solve ≤ 8 ms for the Victorian frame on a mid-range laptop. Full cold solve ≤ 40 ms.
- Static frame ≤ about 2,500 SVG elements. Repeats and families are merged into one `path` per (lane, paint), and imported motifs use `<symbol>`/`<use>` only when static.
- Motion overlay ≤ 30 animated elements. Filters are never animated.
- Runtime bundle (geom + doc + solve + paint + emit + host + motion) target ≤ 35 KB gzip. Zod, the Lab and planegcs stay out. Frame JSON and motifs are lazy-loaded per frame.
- A Web Worker solve is possible later because `solve` is pure. It is not needed at first.

## Rendering

**SVG is the default output. The geometry is solved at the actual CSS-px size**, so `viewBox` equals the box at 1:1. Nothing is stretched non-uniformly, and weights are real px with floors (hairline ≥ 0.6 device px; lines below the floor merge or drop by priority).

**Layers**
1. **Paper:** the page background. Texture is a pre-rendered 256 px noise or fibre tile as a CSS `background-image` with `multiply`, never live feTurbulence.
2. **Back SVG:** behind content. Moulding lanes, panel grids, colour blocks, knockout halos.
3. **Content:** HTML in grid slots.
4. **Front SVG:** above content, with `pointer-events:none`. Riders that overlap content edges, the clasp, frame-breaking elements.
5. **Motion overlay:** small HTML wrappers each holding a tiny SVG glyph, used only while moving. Afterwards the glyph is committed back into the static layer.

All decorative layers have `aria-hidden="true"` and `role="presentation"`.

**Finishes** (chosen by the theme from the same scene)
- **Engraved ink:** every line is a filled outline p ± w(s)·n with nonzero fill, so lines swell and taper as engraving does. Crossings use paper halos (already in the weave spike), so the under-strand visibly stops. Ink colour is a token (warm black, sepia, banknote green); there is no stroke-width.
  - Optional "ink gain": a static, non-animated, tiny `feMorphology`/blur-threshold filter, on wide screens only, off by default. It is measured before use.
  - Line families keep a constant on-screen pitch, which preserves the engraved texture.
- **Flat colour (mid-century, deco):**
  - Lanes paint as a **painter's stack**: each lane is a filled band from its outer edge to the inner edge of the whole profile, painted outside-in, so each lane lies under the next. Adjacent fills therefore never show anti-aliasing seams.
  - Edges on straight runs snap to 1/dpr.
  - Bevel facets of corner studs are four trapezoids whose colour comes from the facet normal against the theme's light vector (`mix(base, highlight|shade, clamp(n·l))`). Changing the light re-skins every block consistently.
- **Blueprint/cyanotype:** a theme inversion: paper = the deep blue token, ink = pale paper, plus a faint grid lane. Weights go up about 15% because light-on-dark reads thinner. Running border text uses `<textPath>` on the band's lane track, and a real, selectable copy of that text is in the DOM for accessibility.
- **Minimal:** a squircle card. The shadow is a CSS `box-shadow` on a DOM element shaped like the card (or `filter: drop-shadow` on the card SVG only), which is cheaper than SVG filters. Colour blocks use `mix-blend-mode: multiply`, and the sprig sits on the front layer outside the card's clip.

**Canvas or WebGL** only for future effects with thousands of moving lines, such as a full-page guilloché moiré. In that case a static raster is cached per (size, dpr) and regenerated after resize settles.

**Print.** On `beforeprint`, solve again at the printed page size and emit vector SVG. The "printed" look is then literally printed. `@media print` drops texture and shadows.

**Forced colours / high contrast.** Under `forced-colors: active`, hide fills and textures and keep a single `CanvasText` rule along the box track, so slots stay delineated.

## Site integration

**The engine is framework-agnostic.** The website hosts it through one custom element:
```html
<frame-host frame="midcentury" theme="midcentury" nav="#site-nav">
  <h1 data-frame-slot="site-title">Parkington Programs Studio</h1>
  <nav data-frame-slot="masthead" id="site-nav">…real links…</nav>
  <main data-frame-slot="main">…route content…</main>
  <aside data-frame-slot="aside">…</aside>
  <footer data-frame-slot="foot">…</footer>
</frame-host>
```
- **Light DOM, no shadow root**, so styles, SEO and Vue all keep working. The host is `display:grid`. The engine writes `grid-template-columns` and `grid-template-areas` as CSS custom properties. Each `data-frame-slot` child gets its `grid-area`, and content rows are `auto`. The frame SVG layers are inserted as absolutely positioned siblings covering the host.
- **Non-rectangular slots** (under an arch, beside a medallion that intrudes) get a `clip-path` or `shape-outside` polygon from the engine. Later, text can wrap around a medallion's hull using an injected float with `shape-outside`.
- **Cartouche text** stays a real heading or link. The engine measures it (`inline-size`), sizes the cartouche body to fit, and positions the element over the body.
- **Nav stations.** The host reads the nav links (`nav` attribute) and assigns each link a station on the configured track, which drives the section marker and hover/focus glints.
- **Events:** `frame:variant` (the active variants, also exposed as CSS custom properties for style queries), `frame:solved`, `frame:error`.

**With the current Vue site (M2)**
- Mark `frame-host` as a custom element in the Vite Vue plugin (`compilerOptions.isCustomElement`).
- App.vue becomes a thin shell: `<frame-host>` with Vue-rendered slot children. The current `src/frames/frameEngine.ts` frame is replaced route by route behind a flag, starting with Studio home.
- Vue Router: wrap navigations in `document.startViewTransition` with the frame named and excluded from the snapshot. In `afterEach`, after the DOM updates, call `host.cue('routeChange', {to})`. The host re-measures and re-solves, then plays the cues.
- Supabase, Tiptap and the auth pages are untouched, because they are just slot content.

**Leaving Vue (the owner's pending decision; the engine doesn't care)**
- **Option A: keep Vue for content.** This is lowest risk, and the frame engine owns the visual shell. Recommended until M8.
- **Option B: static pages plus islands.** Plain Vite multi-page, or Astro: Markdown articles become static HTML inside `<frame-host>`, and the Supabase features (newsletter, account, editor) become small islands, in Vue or plain TS.
  - Cross-document View Transitions work in Chrome and Safari. Firefox changes pages instantly, and the `routeChange` cue fires on `pageshow` instead, gated so it plays only when the referrer is same-site.
  - Pages are faster and simpler, and the frame becomes the site's one design system.
- Either way, the frame files, themes and Lab are unchanged. That is the point of making the host a custom element.

**Dev loop.** The site imports `frames/*.frame.json` through Vite, so a Lab save hot-reloads the blog tab. `npm run frames:check` runs the Node CLI (render at a size bracket plus validators) and is wired into CI and pre-commit.

## Roadmap

Each milestone ends with something the owner can see in the browser. Early milestones favour the flat, high-payoff styles; curve-heavy engraving comes once the kernel is proven. Durations assume a solo student working with AI help, part time.

- **M0. Curve kernel + CLI (1 to 2 weeks).** Line, arc, clothoid (GL16), log spiral, the Cesàro turtle with G2 checks, the phase-1 fitter, stations and arc-length tables, SVG emit. Unit tests against closed forms, for example one golden turn ending at r = 45 has chord 38.4346. **Visible:** `npm run frames:demo` writes a contact-sheet SVG of tracks with station ticks and curvature combs.
- **M1. Box, profiles, junctions, flat finish (2 weeks).** Box track, profile sweep with the painter's stack, mitre / block / rounded / notched corners, bevel studs with light, theme tokens. A migration script turns today's `FrameConfig` into a frame doc. **Visible:** the mid-century moulding with stud blocks resizing live in a plain HTML page, plus the current site frame reproduced by the new engine (parity).
- **M2. frame-host + slots + two-direction layout (2 weeks).** Grid emission, ResizeObserver measurement, region splits (φ:1 columns, gutters as rule profiles, reflow on compact), inset frames. Mounted in the Vue site behind a flag on one route. **Visible:** real blog content inside the mid-century frame from phone to desktop.
- **M3. Punctuation + cartouches + card (2 weeks).** Repeat fitting with mirror and phase, graduated ticks, sequences, single pieces, cartouche with live text sizing, squircle card with colour blocks and a frame-breaking rider. **Visible:** blueprint ruler borders and panel grid, the title cartouche, the minimal menu card.
- **M4. Frame Lab v0 (3 weeks).** Canvas with construction overlay, outline, inspector with law chips, profile editor and profile probe from an underlay, motif import (sockets, hull), save through the Vite middleware, patch undo, validators panel, contact sheet. **Visible:** the owner rebuilds the mid-century frame from `websiteOutline.svg` in the browser and commits the JSON.
- **M5. Riders on curves + Victorian structure (3 weeks).** Assemblies with sockets (imported medallion core), clothoid connector, side spine, analytic weave strands (spike ported) with per-segment whole-period fit and the clasp phase lock, flame assembly with a locked golden spiral and spiral-similarity leaves. Handles with edit/stay. **Visible:** the Victorian frame re-solving to any page height, with ribbons that always cross under the clasp.
- **M6. Thresholds (2 weeks).** Room z per slot, parameter kinds, anchors, hysteresis, collapse by keep, settle cross-fade; ScaleMaster strips and the generated filmstrip in the Lab. **Visible:** phone variants (block corners, double-rule garland, 3-leaf flame) with no pops in a z sweep.
- **M7. Engraved finish + families (2 to 3 weeks).** Variable-width outlines, weight functions, fans and blends with spacing laws, hairline floors, rotated-spiral nested curls, golden readouts. **Visible:** printed-quality medallion line work generated from tracks, side by side with the hand drawing.
- **M8. Motion v1 (2 weeks).** MotionDirector Tier A and B, section marker courier, procession, hover/focus glint, reduced motion, visibility handling, View Transition integration, Lab timeline v0. **Visible:** changing tabs sends the chevron or arrow along its track to the new section.
- **M9. Orders, arches, deco + motion v2 (3 weeks).** Order riders, arch track forms, voussoirs and balustrades, stepped junctions, sunburst, the deco spine sequence; construction replay, ink pulse, flame unfurl, Tier C ripple. **Visible:** the Beaux-Arts and deco frames, and a first-visit draw-in.
- **Later:** kurbo fit port, LAC Hermite, planegcs in the Lab for cyclic constraints, text wrapping around ornament hulls, an optional move to static pages plus islands, and the separate mapping engine (out of scope here; it could reuse `geom`).

## Risks

- **Scope.** Seven styles is a lot for a solo builder. Mitigation: one vocabulary, styles as data, and the flat styles first (M1 to M3). Victorian, the hardest, comes at M5 to M7, once the kernel and Lab exist. If time runs short, ship mid-century plus minimal plus blueprint, and keep Victorian on the imported-motif hybrid.
- **Solver creep.** It is tempting to add a global constraint solver. Mitigation: a DAG plus local node solves is the rule. Genuine cycles go to the Lab only and are baked. The validator rejects cycles at load.
- **Spiro and clothoid numerics.** Non-convergence, wild loops and silent failure (spiro-js returns no status). Mitigation: every solve returns a status and residual, falls back to the last good value or Hobby, and the Lab shows a badge.
- **Two-direction layout loops and jitter.** Mitigation: the widths-down / heights-up rule, a frame layer that never feeds back size, `scrollbar-gutter: stable`, hysteresis, and rAF coalescing. Residual risk: fonts loading late change cartouche widths. Re-solve on `document.fonts.ready`.
- **Hysteresis versus determinism.** Live resize history can differ from a fresh load. This is accepted and kept small; on load the choice is always canonical.
- **SVG seams and AA artifacts in flat styles.** Mitigation: the painter's stack and pixel snapping. Test on Safari, which handles sub-pixel AA differently.
- **Performance of large imported motifs** (the medallion has 117 elements, plus fans). Mitigation: merged paths, `<symbol>` reuse for static parts, the element budget, and a Lab meter. Tier C animation is budgeted with fallbacks.
- **Safari compositing.** Not confirmed for SVG children. Mitigation: HTML wrapper travellers.
- **Accessibility regressions.** Motion, contrast of text on painted bands, decorative noise for screen readers. Mitigation: mandatory `reduced` field on every cue, under 5 s with no loops, aria-hidden layers, a contrast assert per text slot, and a forced-colours fallback.
- **Owner learning curve.** The document is readable but large. Mitigation: the Lab is the primary surface, with relationship sentences, starters per style, and the profile probe. Hand-editing JSON is an escape hatch, with a schema for autocomplete. The closed relation vocabulary prevents the "spaghetti graph" failure.
- **Golden-ratio over-claiming.** Mitigation: law chips, residual readouts, and the look-elsewhere note in the Lab's help. Phi is only where it is labelled.
- **Illustrator round-trip fidelity.** Mitigation: Illustrator is for sketching only. Imports go through cleaning and fit-to-family with residuals, and nothing is exported back.
- **Leaving Vue mid-project.** Mitigation: the custom-element host makes the decision independent. Recommendation: defer it until after M8.
- **Legal and licensing.** Avoid GSAP (proprietary licence) and porting from GPL libspiro. Mapbox's patent on zoom-curve editors is probably irrelevant for a private tool; revisit if the Lab is ever published.
- **My numbers are proposals:** hysteresis 0.05 z, the 4 ms and 8 ms budgets, element budgets and duration tokens. Measure them in the Lab before treating them as rules.

## Novelty

- **One currency for layout, ornament, thresholds and motion: the station.** Existing tools split these: CSS for layout, 9-slice for frames, keyframes for motion. Here a nav item, a clasp, a crossing lock, a slot divider and an animation target are all addresses on the same tracks. That is why "arrows run along their track when you change section" is a parameter change, not a feature.
- **The frame is the layout system, not decoration.** Regions bounded by tracks become CSS grid areas that hold real responsive HTML. The flow rule "widths down, heights up" lets the frame close around changing content without layout loops.
- **The frame is functional UI.** The section marker is a rider travelling along the moulding to the active nav station. Hover and focus glints slide along the lane to their link. Cartouches hold real headings and size themselves to the text.
- **Engraving as generated line families with weight functions.** Line work is solved from analytic tracks (clothoid sweeps, golden-spiral flame, analytic weave strands), so it re-solves at any size with the printed swell and taper. Nothing is stretched as a picture of an engraving would be.
- **Relationships the owner actually draws, made exact.** Copy-along, spiral similarity, mirror and attach-to-curve (the four operations the drawing analysis found), plus phase locks such as "a ribbon crossing always lands under the side-leaf clasp", become one-line rules.
- **Golden ratio by construction, with honesty.** Golden is a lockable law with a residual readout and a git-visible escape hatch. It is verified on the emitted cubics, not asserted in prose.
- **A single cross-section vocabulary from banknote to Bauhaus.** The mid-century 12-stripe moulding, a blueprint ruler band, a Beaux-Arts entablature and a Victorian double rule are all profiles. Corner blocks, ziggurat steps and medallions are all junction treatments. A theme re-skins any of them, including facet lighting from a light vector.
- **The profile probe** turns a wobbly Illustrator trace into an exact, tokenised profile by median sampling. This makes Illustrator a sketchbook without ever trusting its geometry.
- **Cartographic thresholds for ornament.** Per-slot room on a φ ladder, masters plus compatible interpolation plus discrete swaps, collapse by priority, constant-texture line pitch, and a ScaleMaster strip with an edge-case filmstrip. These ideas are borrowed from map styling and type design, and I know of no frame tool that has them.
- **Motion that comes from the construction.** Construction replay ordered by the dependency graph and processions whose end state equals the start: the motion shows how the frame is built, and is not an extra effect added on top.
