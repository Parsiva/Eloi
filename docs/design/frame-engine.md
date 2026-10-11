# Frame Engine Design: "Elevations"

**Status:** design proposal, before implementation; nothing here is built yet · **Date:** 2026-10-10
**Readers:** the owner (designer) first, future implementers second.
**Part of a larger system.** This document specifies the frame layer of Eloi, the engine described in [system.md](system.md). Where the two differ (stages, compiler, package layout and build order), system.md takes precedence. Milestone IDs here are unchanged; system.md groups them into phases.
**Sources:** `docs/research/README.md` and `01`–`07`, four gap studies (animation, thresholds, editor architecture, curve maths), a curve catalog, five competing proposals and two judges' reviews. Both judges picked the Architect's proposal ("Elevations"). This document builds on that proposal and adds the strongest parts of the other four: the Frame Press Lab, Neatline's ranks and generalisation, Fount's assemblies and hinting, and Burin's stations and phase locks.

Where something is a guess or a design choice rather than a measured fact, it is labelled *(assumption)* or *(to measure)*.

> **At a glance**
>
> - **The frame is the layout.** Its lines compile to a CSS grid, and real responsive HTML flows into its openings. Width drives the frame; measured content heights close it. A width never depends on a height.
> - **One vocabulary, every style:**
>   - tracks, stations and profiles (cross-sections swept along tracks, like mouldings)
>   - joints (mitre, block, medallion, step, round, notch)
>   - punctuation along tracks (repeat, graduated, sequence, single, nav-anchored)
>   - assemblies (fixed ends with stretching middles: orders, clasps, cartouches)
>   - nested frames
>
>   A separate **skin** (palette roles, lighting, finish) makes the same structure Victorian, mid-century, blueprint, deco or card.
> - **Dominant curves first.** Every part has a rank, and everything is pinned to something of equal or higher rank. The right curve for each job is chosen from measured evidence (section 2). Golden ratios are built in by construction and locked, with visible drift when you unlock them.
> - **Room-aware.** Width classes pick the plan. Each part has designed variants for less room, switched at log-midpoints with hysteresis, and previewed in a scale strip and a contact sheet.
> - **Motion = parameters over time.** Chevrons and darts travel their tracks on section change, composited, short, with a reduced-motion form.
> - **The Frame Lab** is a browser studio running the same engine. Gestures write relations (sprout, fan, copy, mirror, repeat), never coordinates. Illustrator stays a sketchbook.
> - **Roadmap:**
>   - M0–M3: mid-century frame as the live site layout
>   - M3b: drawn-motif Victorian in parallel
>   - then thresholds, the curve kernel, the constructed Victorian, more styles, and motion (M8)
>
>   Maps are out of scope.

---

## 1. Vision and principles

You design frames first and everything else follows from them. This engine makes that literal: **the frame is the layout of the website.** Its lines become the CSS grid that real, responsive HTML flows into. Its corners, bands and orders decide where the masthead, columns and panels go. It then closes around whatever content each page actually has.

In your own words, the goals are:

- *"The website should be headed with dominant functions that stretch through the page, and then there are things that are relative to those functions."*
- *"Having the right curve for the job is important."* The finish should look natural and printed, not like a hand-drawn approximation.
- The golden ratio should hold where it matters, by construction.
- The design has thresholds: different amounts of room need different designs.
- Later, simple motion: the arrows in the corners run along their tracks when you change section.
- One system serves many frame styles, from Victorian banknote to mid-century moulding, blueprint, Beaux-Arts, deco and a quiet modern card.

**Principles**

1. **Widths go down, heights come up.** Width drives the frame's proportions and the grid. The browser lays out the content. Measured heights flow back and close the frame. A width never depends on a height, and the validator enforces this.
2. **Dominant first.** Every part has a rank from 1 to 4. Rank 1 parts (the sheet edge, the medallion sweep, the garland spine, an arch) are placed first, and everything else is pinned to something of equal or higher rank.
3. **Relationships, not coordinates.** Every gesture in the Lab writes one typed relation, such as "this leaf sprouts from that sweep at the golden section, G2". Nothing is stored as an absolute position, so every frame can be re-solved at any size.
4. **Re-solve, never stretch.** Circles stay circles. Repeats come in whole numbers. Parts swap to a designed variant when room runs out instead of being squashed.
5. **Structure is separate from skin.** The same elevation can be painted as engraving, flat mid-century colour, blueprint, deco or card.
6. **Phi by construction, never by detection.** Golden values come from locked rules such as spiral-similarity copies and rung ladders. When you depart from golden, the engine shows you by how much.
7. **A concept enters the engine only when two real styles need it.** This rule protects the scope (see section 3.10).
8. **The website keeps working.** Text stays real text. Decoration is hidden from assistive technology. Motion is short, event-triggered and respects reduced motion. Nothing in the frame can cause layout shift.

---

## 2. The right curve for the job

Every curve is defined by its own arc length *s*, its tangent angle θ(s) and its curvature κ(s). Arc length therefore comes free, so stations, beads, ticks and motion all use *s*, or *u = s/L*. A smooth (G2) join is just a check that position, θ and κ match at both ends. What separates "printed" work from "hand-assembled" work is mainly whether curvature jumps (`03-golden-growth.md` #5, Hübner; `01-curve-systems.md`).

| Job | Curve family | Why (evidence) | Your controls |
|---|---|---|---|
| Medallion S-sweeps, stems | **Clothoid** (Euler spiral) chained: stem line → clothoid → ring arc → clothoid. A later option is the log-aesthetic "character" dial. | Measured limb is a clothoid (R² 0.98). A golden spiral forced onto it costs 1.31u RMS and looks wrong (`07` Q2a). | sweep turn (30–120°, drawn ≈54°), character p (1.0–1.8), ring step k, exit anchor |
| Medallion ring, bands, loops | **Exact circle** (SVG `A`), with concentric offsets for bands and rotation copies for loops | Ring fits a circle at r 85.76, RMS 0.54. The drawn ellipse (72.78 × 70.06) was meant as a circle. Loops step about 28° (`07` Q2a/Q4). | ring step φ^k, loop count (whole number), anchor stations |
| Weaving ribbons down the sides | **Sinusoidal strands** on a G2 spine, with constant-width ribbon offsets. Over/under comes from crossing parity. | `02-ornament-generation.md` #7 (parity, never stored), `04-engraving-print.md` #5 (all strands share the spine's *s*). Bounds are derived in the curve-math study. | strands 2/3, crossing angle, period, ribbon width, halo, end easing |
| Ribbon or track turning a page corner | **Clothoid easement**: line → clothoid → arc → clothoid → line | The current spike's line+arc turtle is only G1. The curvature jump shows, and anything travelling the track twitches, because rotation rate = speed × κ. | corner radius (φ step), easement ξ (0–1) |
| Flame corner: curve through the leaf tips | **Log spiral** as a construction spine. Leaves are spiral-similarity copies (gnomon), so the tips land on it exactly. | Free fit b 0.488, RMS 0.21. Golden b (0.306) forced: RMS 0.39, max 0.69u (`07` Q1a). Gnomon theorem (`03` #1). | growth "φ per Θ" (Θ ∈ 54/90/108/144°), leaf count, angular step, size law |
| Leaf blades, curls | **Midrib spine** (log spiral or log-aesthetic) plus an analytic width profile | Drawn leaf sides are single cubics with a curvature peak in the middle, so they must be regenerated, not snapped (`07` Q1b). | curl b, max width, width peak (golden 0.382), tip sharpness |
| Scroll terminals, volutes | **Log spiral** entered by a clothoid, ending in a G2 eye circle | Drawn volute b 0.14–0.16. φ per 180° (b 0.153) falls inside that range (`07` Q2b, `03` #4). | growth Θ, turns, eye style, listel count |
| Crest lobes | **Clothoid–arc–clothoid** half, mirrored. Nested hearts are similarity copies. | Exact mirror symmetry. The inner heart is a 1/√2 copy (0.7025), not 1/φ (`07` Q3). | width:height, cusp depth, nest ratio {1/√2, 1/φ} |
| Line fans and clustered lines | **Blend between two guides** that share an anchor, with a spacing law | Fans end exactly on circle anchors with near-even spacing. φ spacing would collapse the inner lines (`07` Q2c). | count, spacing law (uniform / geometric r), anchor, taper |
| Parallel lines, hatch | **True offsets of the analytic spine** at a constant on-screen pitch | Printed line work is line families (`04`). Constant pitch keeps the texture (thresholds study). | count, pitch (CSS px), weight law |
| Beads, scallops, lattice, zigzag | **Rigid motifs at whole-number stations**. Zigzag and lattice are drawn in band coordinates. | Scallops repeat at exactly 9.00; the hand-placed last ones drift (`07` Q4). | motif, pitch, fit mode |
| Mouldings, chevrons, blocks, notches | **Lines and arcs** as offset bands, with corner treatments | Exact geometry. Round corners only need radius > profile depth. | profile, corner style, chevron angle |
| Arches | **Circular, segmental, three-centred**, then a **lintel** at small room | Offsets of circular arcs stay exact, so archivolt mouldings stay exact. Elliptical offsets are not ellipses. | arch type, rise rule, voussoir count |
| Modern card corners | **Superellipse** (n > 2) or clothoid-smoothed corner. Plain border-radius below about 8–12 px. | κ = 0 at the vertices, so the corner joins straight sides with G2. | corner size, smoothing / n |
| Deco steps, sunbursts | **Polylines and arcs** with step laws, and nested ray counts in powers of 2 | Exact, crisp. Halving a nested count keeps the surviving rays in place. | steps, step law, ray count, hierarchy |
| Ruler ticks | **Graduated stations** (major / minor levels) | Drop the finest level first when room shrinks (thresholds study). | subdivisions, base pitch, length ratio |
| Motion tracks | **The same G2 pieces**, sampled by arc length into transform keyframes | Composited motion. G2 tracks give a continuous rotation rate. | track, from/to, duration, easing |

**Two working rules from the catalog**

- **Copy, don't re-solve.** Leaves, loops and lobes are fitted once and stamped with transforms (similarity, mirror, rotation). That gives exact repetition and tiny SVG.
- **One fitter.** Every curve reaches SVG through one Bézier fitter, with tolerance set in device pixels (about 0.1 px). Exact circles stay `A` commands. Arm length is chord/(3cos²(Δθ/4)), never L/3. Measured counts: 2–3 cubics per clothoid limb or ring, 6–8 per golden turn, 10–13 for a 2.5-turn volute.

*Uncertain, to test in the Lab:* the lower-limb character (R² 0.93), the guilloché "touch" formula, the squircle-to-circle size calibration, CSS `corner-shape` support, and whether `offset-path:url()` follows live geometry. Cubic counts are order-of-magnitude.

---

## 3. Core concepts

The vocabulary is borrowed from architecture, because a frame here is an **elevation**: a drawing of a wall or facade made of named lines, bays, members and openings.

### 3.1 The skeleton: datums, bays, openings

```
 x-sheet-l   x-left-l       x-main-l              x-main-r      x-right-r  x-sheet-r
   |  pav.l   |   title (opening: masthead)          |   pav.r   |            y-sheet-t
   +----------+--------------------------------------+-----------+            y-mast-t
   |##########|                                      |###########|
   |# medall.#|        <h1> lives here               |# medall. #|
   +--+-------+--+--+----------------------+--+-----+-------+---+            y-mast-b
   |r |  aside   |g |      main            |g |     aside     | r|  rows: auto (content)
   |a | (opening)|u | (opening)            |u |   (opening)   | a|
   |i |          |t |                      |t |               | i|
   |l |          |  |                      |  |               | l|
   +--+----------+--+----------------------+--+---------------+--+            y-body-b
```

| Term | Meaning |
|---|---|
| **Module m** | The base length unit, in CSS px, set by width (for example 5 px on a phone up to 10 px on desktop). Member sizes are written in m. `rung(m, k)` = m·φ^k. |
| **Hair** | A separate unit for line weight, with a device-pixel floor. Line weights do not grow with m, so small rooms get relatively heavier, simpler line work (the optical-size rule). |
| **Datum** | A named straight line. x-datums come from the width solve; y-datums come from measured content. Datums double as **CSS grid line names**. |
| **Plan** | A tree of row and column splits for one page type (front page, article, project index, card), chosen by route and width class. |
| **Bay** | A rectangle between four datums. A bay is an opening, a band reserved for a member, a repeat of bays, or a nested elevation. |
| **Opening (slot)** | A bay that real HTML flows into. It becomes a CSS grid area filled by an element with `data-slot="main"`. Fit modes: `flow` (height from content), `fixed` (height from frame) and `hug` (sized to its own text, as in a cartouche). |

### 3.2 Members: what gets drawn

| Concept | What it is | Example (Victorian / mid-century) |
|---|---|---|
| **Track** | Any path a member runs along: a bay edge, a closed bay ring, an offset, or a solved curve (arch, clothoid chain, spiral, garland spine). Every track answers `length`, `pointAt(s)`, `tangentAt(s)` and `curvatureAt(s)`. | garland spine / the moulding's ring |
| **Station** | An address on a track: `u`, `s` from an end, an angle, `golden(k)` (u = φ^-k), a socket, a datum crossing, or a **DOM anchor** such as a nav link. Stations are the shared currency for placement, layout, repeat fitting, navigation and motion. | clasp at `golden(2)` / chevron home |
| **Profile** | A cross-section from outside to inside, made of **strata**: rule, gap, fill, pinstripes, hatch, beads, ticks, text, zigzag, lattice, garland. Each stratum has a depth, a colour **role**, a **relief** (flat, bevel-out, bevel-in, round, cove) and a **priority** (what drops first). A stratum can `carry` punctuation, which makes it a lane. | double rule + garland / 12 colour stripes |
| **Moulding** | A profile swept along a track. | the border |
| **Corner treatment (joint)** | What happens where mouldings meet: `mitre`, `butt`, `block` (rosette or stud), `motif` (a medallion or flame with sockets), `step` (deco), `round` (circle or squircle), `notch`, `cartouche`, plus `tee` and `cross` where rules meet bands. A **join table** keyed by (profile A, profile B, style) picks it. | medallion / stud block |
| **Terminal** | A motif at a track end: chevron cluster, scroll end, finial, taper, or a socket hand-off (the line continues into drawn ornament). | stems hand off / arrows leave the block |
| **Punctuation** | Things placed along a track. `repeat` = whole-number fitted (beads, chevrons). `graduated` = major/minor hierarchy (ruler ticks). `sequence` = an ordered list of different motifs (deco spine). `single` = one piece at a station (crest, nameplate). `anchored` = stations taken from DOM elements (nav links). | beads, crest / chevrons, nav stations |
| **Assembly** | A stretchable sequence, modelled on how fonts build stretchy brackets: **fixed** end pieces, **extenders** that fill length, an optional **middle**. Pre-drawn size variants are tried first. One mechanism covers orders, rails with a clasp, ribbon banners and cartouches around live text. | rail = garland + side-leaf + garland / plaque = cap + body + cap |
| **Order** | An assembly standing vertically: fixed base, stretching shaft (flutes fitted in whole numbers), fixed capital. | (Beaux-Arts pilaster; deco spine) |
| **Span** | A member across the head of a bay (arch, lintel, pediment). Its form is chosen by a rise budget and its radius follows the bay width. | (Beaux-Arts arch) |
| **Cartouche** | An opening with a shaped outline and a moulding around it. It holds live text and hugs it. | title cartouche / title plaque |
| **Motif** | A self-contained ornament with **sockets** (where strokes leave it, so tracks can continue them) and a **hull** (for knockouts and text wrap). | medallion, flame / stud, chevron |
| **Nested elevation** | An opening that hosts another frame, inheriting module and skin. | — / inset frame with notched brackets |

**Motif maturity.** A motif can grow up over time without the frame around it changing. This lets your hand-drawn pieces work from day one.

| Level | What it is | Today |
|---|---|---|
| `drawn` | Imported, fixed geometry with hull and sockets | every piece in `src/ornaments/hand-drawn.json` |
| `fitted` | Drawn paths fitted to exact families, with residuals reported | — |
| `constructed` | Built from relations (spines, copies, fans); fully parametric | flame and medallion, from M6 |

### 3.3 Rank, dominant curves and pins

**Rank** (1–4) sits on every member and motif node:

- **1** = dominant: sheet ring, medallion ring and sweep, garland spine, arch, flame tip spiral.
- **2** = carried directly by a dominant: ribbons, offsets, leaf copies.
- **3** = ornament on those: fans, loops, leaves on sweeps, clasps.
- **4** = texture: hatch, pinstripes, beads.

Rank sets the default draw order and priority, decides what generalisation removes first, and sets the construction-replay order. The validator warns when a lower-rank node drives a higher-rank one ("inverted hierarchy"). For example, a fan steering the medallion ring is flagged.

**Pins** are how relations are written. Each node has **one primary pin**, stored on the child and created by one Lab gesture. The structure is therefore a tree with a few cross-references, not a tangle.

| Pin | Meaning | Gesture |
|---|---|---|
| `at` | ride a track at a station | drag onto a track; it snaps to stations and detents |
| `sprout` | grow out of a parent at a station, inheriting point, tangent and (for G2) curvature | **S**, then drag the base onto the parent |
| `land` | a curve's end lands on a socket or track (G1 clothoid connector) | drag the end onto a socket |
| `offset` | parallel copy at distance d, guarded against cusps | Alt-drag a duplicate |
| `fan` | lines between two guides converging on an anchor, with a spacing law | **F**, pick guides, scroll the count |
| `gnomon` / `copyAlong` | copies by spiral similarity, or at stations along a track | **C** |
| `mirror` | reflection about an axis | **M** |
| `repeat` / `graduated` / `sequence` / `single` | punctuation on a lane | drop a motif onto a lane |
| `sweep` | a profile along a track | drop a profile onto a track |
| `span` / `order` | across or along a bay | drag between capitals or slots |
| `inset` | a nested frame inside an opening | drag a rectangle in a slot |
| `hug` | a cartouche sized by measured text | **H** |
| `check` | a condition that is checked, not solved | "Keep this true" |

These formalise the four operations `07` found in your drawing (copy-along, scale-about, mirror, attach-to-curve; 62% of stroke ends attach to other strokes) and add the operations the other styles need.

### 3.4 Line families

A **line family** is several lines generated from one or two guides by a spacing law (`uniform`, `geometric(r)`, `pitchPx` for constant screen texture), each with a **weight function** w(u) (swell, taper) and a hairline floor. Families never cross unless a `braid` flag is set; a validator checks the order. Where lines converge below a device-pixel gap, they taper or merge by priority (Jobard–Lefer; `04` #7).

### 3.5 Golden rules

Golden values are **locked parameters** (`lock: "phi"`): no handle can move them and no room rule can drive them.

- **Ladders.** Lengths sit on `rung(m, k)` (lock `rung`, snapping to half-steps).
- **Stations.** `golden(1)` = 0.618 and `golden(2)` = 0.382 are first-class snap targets.
- **Copies.** `gnomon` with golden b puts tips on a golden spiral exactly.

Section 5.4 lists the escape hatches.

### 3.6 Layering

There are five layers:

- **ground**: paper, colour plates
- **frame**: static SVG
- **content**: real HTML
- **breaker**: motifs that cross the frame and overlap content, such as the sprig
- **motion**: a tiny overlay

A **knockout** paints a paper halo from a hull, so lines behind it stop cleanly. This is how ribbons pass under one another and how the side leaf clasps the garland.

### 3.7 Room

- **Width class**, from CSS: `compact` < 600, `medium` 600–1200, `wide` ≥ 1200 CSS px. It decides which bays exist.
- **Room level**, per member: z = log_φ(size / sRef). One z step is ×1.618, which sits inside the ×1.28–2.0 range used by SF Symbols, Android, Chaparral and map zoom.

Details are in section 8.

### 3.8 Phase locks

These are closure rules that a pure pipeline expresses inside one node: "a weave crossing always lands under the clasp", "voussoir count is odd", "finials mirror about the centre". The weave fits whole periods separately on each side of the clasp, so the crossing under the clasp is exact at every page height.

### 3.9 Motion

A **motion** is a parameter of the solved frame changing over time, such as a station u or a repeat phase. It is stored relative to tracks, never in pixels (section 9).

### 3.10 The "two styles" check

Every concept above is needed by at least two of your inspiration styles:

| Concept | Victorian | Mid-century | Blueprint | Beaux-Arts | Poster | Deco | Card |
|---|---|---|---|---|---|---|---|
| profile / moulding | ● | ● | ● | ● | ● | ● | ● (zero-depth edge) |
| block / motif joint | ● medallion | ● stud | | ● | ● rococo | ● | |
| repeat punctuation | ● beads | ● chevrons | ● ticks | ● flutes | | ● rays | |
| sequence / single | ● crest | | ● vignette | ● keystone | | ● spine | |
| assembly | ● rail+clasp | ● plaque | | ● order | ● banner | ● nameplate | |
| cartouche (live text) | ● | ● | ● ovals | ● | ● | ● | |
| nested elevation | | ● inset | ● panels | ● bays | | ● | |
| breaker / knockout | ● weave | | | | | | ● sprig |
| solved curves | ● | | | ● arch | ● | ● circles | ● squircle |

Only **breaker** and **knockout** are borderline at two styles. They stay because the weave depends on them.

---

## 4. Frame-first layout

### 4.1 The contract

```
 width W ──► module m, member depths, column ratios, corner pavilions ──► CSS grid (x)
                                                                           │
                         browser lays out real HTML in the openings  ◄─────┘
                                                                           │
 measured opening heights ──► y-datums, track lengths, repeat counts, hug sizes ──► SVG
```

- **Width → frame.** Only width inputs (W, width class, device px, route) may feed x-typed expressions. The validator types every expression by axis, so an x expression that mentions a y-datum or a measurement is rejected at load. Layout loops are therefore impossible by construction, not avoided by discipline.
- **Content → frame.** The frame SVG is `position:absolute; inset:0; pointer-events:none`. It never changes the box it measures. Heights only change track lengths, repeat counts and assembly extenders. **Variant choice never depends on content height.**
- **One declared exception.** A span's rise budget may read the **viewport** height (`viewport.h`), never content height. It is typed as its own input, so it cannot form a loop. It is the only height input to any variant.
- `scrollbar-gutter: stable` on the root, so a scrollbar appearing cannot flip a width threshold.

### 4.2 How slots reach the page: CSS first, px only where needed

Layout parameters have kind `layout` and must **compile to CSS**. They may only be `byClass` steps or `lerp` on width, which become `clamp()` with `cqi`/`vw`. A build-time Vite plugin (`frame/css`) writes `frames/<id>.css` with:

- `grid-template-columns` / `grid-template-rows` with **datum line names**,
- `grid-template-areas` and a `grid-area` for each `[data-slot]`,
- custom properties: `--m`, `--hair`, `--frame-class`, member depths,
- one block per width class, in media or container queries.

First paint therefore already has the final layout before any JavaScript runs.

**Exception: tracks sized by a solved member.** A corner pavilion sized by the medallion (`size: "joint:tl"`) cannot be expressed in CSS. For these, the CLI pre-computes the value at each class's anchor widths and writes a `clamp()` approximation into the fallback. The runtime then replaces it with exact px within one frame. The contact sheet flags any shift above 0.01 CLS.

Example plan, which is the frame designing the page:

```jsonc
"plans": {
  "front": { "routes": ["studio", "projects", "marginalia"], "when": "class >= medium",
    "sheet": { "split": "rows", "parts": [
      { "id": "border.t", "size": "member:border" },
      { "id": "mast", "size": "max(rung(m, 5), joint:tl.h - member:border)", "region":
        { "split": "cols", "parts": [
          { "id": "pav.l", "size": "joint:tl" },                         // pavilion = medallion width
          { "id": "title", "size": "1fr", "region": { "opening": "masthead", "fit": "hug" } },
          { "id": "pav.r", "size": "joint:tr" } ] } },
      { "id": "body", "size": "auto", "region": { "split": "cols", "parts": [
          { "id": "rail.l", "size": "member:border" },
          { "id": "left",  "size": "1fr",      "region": { "opening": "aside-left" } },
          { "id": "g1",    "size": "2m",       "region": { "band": "colRule" } },   // gutter drawn as a rule
          { "id": "main",  "size": "phi^2 fr", "region": { "opening": "main", "minH": "w / phi" } },
          { "id": "g2",    "size": "2m",       "region": { "band": "colRule" } },
          { "id": "right", "size": "1fr",      "region": { "opening": "aside-right" } },
          { "id": "rail.r", "size": "member:border" } ] } },
      { "id": "foot", "size": "auto", "region": { "opening": "footer" } },
      { "id": "border.b", "size": "member:border" } ] } },
  "single":   { "when": "class == compact", "sheet": { "...": "one column; rails become a double rule" } },
  "projects": { "routes": ["projects"], "sheet": { "...": "{ repeat: 'project', columns: {byClass:{compact:1,medium:2,wide:3}}, gutter: 'colRule' }" } }
}
```

What the browser receives (wide class, illustrative numbers):

```css
frame-elevation[frame="studio"] {
  display: grid;
  grid-template-columns: [x-sheet-l] 70px [x-left-l] 1fr [x-left-r x-g1-l] calc(2*var(--m)) [x-g1-r x-main-l]
                         2.618fr [x-main-r x-g2-l] calc(2*var(--m)) [x-g2-r x-right-l] 1fr [x-right-r] 70px [x-sheet-r];
  grid-template-rows: [y-sheet-t] 70px [y-mast-t] 231px [y-mast-b y-body-t] auto [y-body-b y-foot-t] auto [y-foot-b] 70px [y-sheet-b];
  --m: clamp(5px, 0.46vw + 3.3px, 10px); --hair: 0.6px; --frame-class: wide;
}
[data-slot="main"] { grid-area: y-body-t / x-main-l / y-body-b / x-main-r; min-width: 0; }
```

### 4.3 Kinds of slot

- **Metric slots** (masthead, nav band, cartouche boxes) are sized by the frame, and content flows into them.
- **Content slots** (main, panels, bays) are sized by content, and the frame closes around them. Gutter rules are drawn where the grid actually placed the tracks, read back with `getComputedStyle(...).gridTemplateColumns`.
- **Repeat bays.** One ruled panel per DOM child (for example, one per project card). The panel grid follows the CMS data.
- **Anchored stations.** Nav links become stations on a moulding stratum (chevrons between them, hover lights the stratum).
- **Non-rectangular slots** (under an arch, beside an intruding medallion) get a `clip-path` or a `shape-outside` polygon computed from hulls, so text wraps around the ornament.

**Your site's CSS stays in charge inside slots.** Openings are ordinary grid areas with `min-width: 0`. An opening may declare `fit: "flow"` (no fixed px rows) as an escape hatch for difficult content such as the TipTap editor, sticky elements or embedded media.

### 4.4 Scaling rules: every part declares one

| Rule | Behaviour | Typical parts |
|---|---|---|
| `fixed` | scales only with m (uniformly) | medallion, capital, base, stud block, crest |
| `stretch` | lengthens; allowed only on straight runs and stripes | moulding strata, pilaster shaft, rules |
| `repeat` | whole counts at a target pitch, with parity, mirror and hysteresis | beads, chevrons, finials, flutes, ticks, weave periods |
| `resolve` | geometry re-solved from inputs | arch from span, garland spine, clothoid chains |
| `hug` | sized by its own content | cartouche body, ribbon banner |

**Justified repeats** (adapted from typesetting): each repeat has a natural pitch with stretch and shrink limits (for example +15% / −10%). The engine picks the whole count with the smallest relative stretch, applies hysteresis, and never stretches the motifs themselves, only the gaps. When no count fits inside the limits, it reports a badge rather than distorting anything.

---

## 5. Styles and themes (skins)

### 5.1 What a skin is

Structure never names a colour; it names **roles** (`teal.deep`, `ink`, `paper`, `mustard`). A skin file maps roles to tokens and sets:

- **tokens**: the palette, emitted as CSS custom properties (`fill="var(--f-teal-deep)"`). Swapping palette or dark mode is a CSS change with no re-solve.
- **ramps**: 3–5 shades per hue, used for lit facets.
- **light**: azimuth, elevation, ambient, and quantisation to the ramp.
- **finish**: `ink`, `flat`, `blueprint`, `deco`, `card`, plus texture and shadow.
- variants for dark, print and forced colours.

### 5.2 Lighting and bevels

Each stratum's **relief** gives its facets normals. Facet shade = Lambert(n · L) + ambient, **quantised to the role's ramp**, so every facet stays inside the palette, as in screen-printed work. A stud block is a stack of nested frustums with four lit facets each; turning the light dial re-tones every block consistently.

*(Observation from the architect's proposal, to verify with the sampler: the trace already shows 3–4 shades per hue, for example #1d4657 / #2c5763 / #45808c, which is what quantised lit bevels look like.)*

### 5.3 One structure, re-skinned

| Stratum / relief | `flat` (mid-century) | `ink` (engraving) | `blueprint` |
|---|---|---|---|
| fill | flat colour | paper (or tint via hatch) | boundary hairlines |
| bevel-out | light top / dark bottom, ramp-quantised | 1–3 hatch lines on the shade side, constant screen pitch | section outline |
| rule | thin fill | filled outline with swell | pale line on blue |
| garland | flat ribbons (*not designed for this skin*) | engraved ribbons with halos | outlined ribbons |

Re-skinning is a convenience, not a promise. Each skin declares how it renders each stratum kind. When a combination is not designed for that skin, the Lab shows an honest **"not designed for this skin"** badge, for example a 12-stripe moulding drawn as engraving.

### 5.4 Golden in the skin and structure: policy and escape hatches

- Each frame has a `phiPolicy` of `lock | snap | report`. The default is `snap`.
- Unlocking a golden value writes `{"lock": "free", "was": "phi", "note": "why"}` to the file, so the departure shows in the git diff.
- A drift badge shows the cost, for example "ring 1.20 vs φ^0.5 = 1.272 (−5.7%)".
- Golden is **verified on the emitted cubics**: the fitted b of the output path is checked to within 0.5%.
- Phi is **not** forced on fan spacing (uniform, per `07`), volute tightness, the crest (1/√2) or measured mid-century depths.
- Every ratio readout carries the look-elsewhere note: any ratio is within 12% of some half-power of φ.

---

## 6. The document format

### 6.1 Files

```
frames/
  frame.schema.json            generated from Zod (dev only) → VS Code autocomplete
  victorian.frame.json         an elevation: params, profiles, joints, motifs, plans, members, motions
  midcentury.frame.json
  skins/  engraving.skin.json  mcm.skin.json  blueprint.skin.json  card.skin.json
  books/                       (later) shared parts, split out only once two frames reuse them
```

From M0 to M3, each frame is **one file plus a skin**. Pattern books are introduced only when a second frame needs to share parts. This keeps the early number of file kinds at two.

**Writer rules**

- fixed section order: header, params, profiles, joints, motifs, plans, members, motions
- maps sorted by id, `[x, y]` on one line
- numbers rounded (4 decimals for lengths, 6 for ratios), trailing newline
- an integer `formatVersion` with ordered migrations and one CI fixture per old version
- unknown fields kept on load
- `algo: "v1"` pins per node, so improved maths never silently moves committed art
- session state (zoom, selection, preview size) is never written

### 6.2 Values: one small language

| Form | Example | Meaning |
|---|---|---|
| number / unit | `6`, `"0.6px"`, `"24deg"`, `"2m"` | literal |
| expression | `"stemGap * phi"`, `"rung(m, 3)"`, `"min(w/2, 0.38*viewport.h)"` | arithmetic, refs, `phi`, `rung`, `phiPer(Θ)`, `golden(k)`, `sqrt ln min max clamp lerp`, trig |
| step on room | `{ "step": "z", "else": "block", "from": [[-1, "simple"], [0, "full"]] }` | below −1 → block; from −1 → simple; from 0 → full |
| interpolate | `{ "lerp": "width", "stops": [[360, 5], [768, 7], [1440, 10]] }` | linear between stops |
| by class | `{ "byClass": { "compact": "3m", "medium": "5m", "wide": "7m" } }` | width-class step |

Room inputs are `z` (the node's own room), `z:<slot>`, `width`, `length` (counts only), `devPx` and `class`. A room form may only appear **at the top of a value**, so the Lab can always draw it as bars or a stops table.

The expression parser is hand-written and produces an AST. There is no `eval` (strict CSP stays possible) and no ternaries. Conditional structure always uses `step` or `byClass`.

### 6.3 Worked example A: Victorian corner medallion, garland, side-leaf clasp, flame corner

`//` comments here are explanations; saved files use `note` fields.

```jsonc
{
  "$schema": "./frame.schema.json",
  "format": "parkington-frame", "formatVersion": 1, "id": "victorian",
  "skin": "engraving", "phiPolicy": "snap",
  "module": { "lerp": "width", "stops": [[360, 5], [768, 7], [1440, 10]] },

  "params": {
    "hair":    { "value": "0.6px", "floorDevPx": 1 },
    "flame.b": { "value": "phiPer(90deg)", "lock": "phi",
                 "note": "ln(phi)/(pi/2) = 0.30635. Drawn ~0.49. phiPer(54deg) = 0.5106 keeps the drawn look (RMS 0.21)." },
    "strands": { "kind": "discrete", "value": { "step": "z:rail", "else": 2, "from": [[0.5, 3]] },
                 "note": "pending decision: 2-ribbon twist; 3-strand plait on wide rails" }
  },

  "motifs": {
    "medallion": {
      "maturity": "constructed", "sRef": "34m",
      "params": {
        "Rmed":    { "value": "7.2m", "lock": "rung" },
        "ringK":   { "value": 0.5, "lock": "phi", "was": "1.20 (drawn)", "note": "ring = Rmed*phi^0.5 = 1.272 Rmed (+5u)" },
        "stemGap": { "value": "1.15m", "note": "drawn 11.51u" },
        "midGap":  { "value": "stemGap * phi", "lock": "phi", "note": "drawn 16.89u (1.467x); golden adds +1.7u" }
      },
      "nodes": {
        "core":   { "type": "circle", "rank": 1, "pin": { "local": [0, 0] }, "r": "Rmed" },
        "ring":   { "type": "arc",    "rank": 1, "pin": { "concentric": "core" }, "r": "Rmed * phi^ringK",
                    "from": "200deg", "sweep": "170deg" },
        "sweepA": { "type": "chain",  "rank": 1,                       // the corner's dominant function
                    "pin": { "sprout": "ring", "at": "end", "continuity": "G2" },
                    "pieces": [ { "id": "limb", "clothoid": { "len": "free", "kEnd": 0 } },
                                { "id": "stem", "line": { "len": "free" } } ],
                    "close": { "land": "socket:stems", "heading": "90deg", "solveFor": ["limb.len", "stem.len"] },
                    "algo": "v1" },
        "sweepB": { "type": "offset", "rank": 2, "pin": { "offset": "sweepA", "d": "stemGap" }, "guard": "d < Rmin" },
        "leaf":   { "type": "instance", "rank": 3, "motif": "acanthusLeaf",
                    "pin": { "sprout": "sweepA", "at": "golden(1)", "side": "outer", "continuity": "G2" },
                    "scale": "rung(Rmed, -2)", "priority": 30, "optional": true },
        "fanA":   { "type": "fan", "rank": 3,
                    "pin": { "between": ["sweepA", "sweepB"], "converge": { "on": "core", "at": "180deg" } },
                    "count": 7, "spread": "uniform", "taper": 0.3, "pen": "hair" },
        "loops":  { "type": "copyAlong", "rank": 3, "proto": "loop0",
                    "pin": { "along": "core", "from": "-40deg" }, "step": "28deg", "count": "fit" },
        "dart":   { "type": "instance", "rank": 3, "motif": "dart",
                    "pin": { "at": "sweepA", "u": 0.92 }, "orient": "tangent", "movable": true }
      },
      "sockets": {
        "stems":    { "on": "sweepA", "u": 1, "heading": "90deg",
                      "spread": ["0", "stemGap", "stemGap + midGap", "2*stemGap + midGap"],
                      "note": "four lines = two double-line ribbons" },
        "stemsTop": { "mirrorOf": "stems", "axis": "diagonal" }
      },
      "room": { "governs": "min", "hysteresis": 0.05, "anchors": [
        { "z": 0 },
        { "z": -1, "set": { "fanA.count": 4 }, "hide": ["leaf"] },      // typify
        { "z": -2, "swap": "medallionBlock" } ] }                         // structural swap at the log-midpoint
    },

    "flame": {
      "maturity": "constructed", "sRef": "21m",
      "params": {
        "n":       { "kind": "grow", "value": 6 },
        "step":    { "value": "24deg" },
        "sizeLaw": { "value": "similar", "note": "similar = golden gnomon; linear = as drawn (1 → 0.27)" }
      },
      "nodes": {
        "tips":   { "type": "logSpiral", "rank": 1, "pin": { "local": [0, 0] },
                    "b": "flame.b", "rEnd": "4.5m", "sweep": "step * (n - 1)" },
        "blade":  { "type": "leaf", "length": "3.7m",
                    "midrib": { "logSpiral": { "b": "flame.b", "turn": "48deg" } },
                    "width":  { "max": 0.3, "peak": "1/phi^2", "tip": 2 } },
        "leaves": { "type": "gnomon", "rank": 2, "proto": "blade",
                    "pin": { "about": "tips" }, "count": "n", "step": "step", "tilt": "12deg", "scale": "sizeLaw" },
        "veins":  { "type": "fan", "rank": 3, "pin": { "from": "veinRoot", "to": "leaves[*].notch" }, "minZ": -0.5 },
        "onSpiral": { "type": "check", "rule": "distance(leaves[*].tip, tips) < 0.05u" }
      },
      "sockets": { "stems": { "point": ["0", "-15m"], "heading": "-90deg", "spread": "medallion.stems.spread" } },
      "room": { "governs": "min", "anchors": [
        { "z": 0 }, { "z": -1, "set": { "n": 4 } }, { "z": -2, "swap": "flameSimple" } ] }
    },

    "sideLeaf": { "maturity": "drawn", "source": "src/ornaments/hand-drawn.json#side-leaf",
                  "symmetry": "mirror-y", "sockets": "auto", "hull": "auto" }
  },

  "profiles": {
    "side": { "strata": [
      { "id": "outer", "kind": "rule", "d": "0.3m", "weight": "hair * phi^2", "pri": 1 },
      { "id": "g1",    "kind": "gap",  "d": "1.6m" },
      { "id": "garland", "kind": "garland", "d": "6m", "rank": 1, "pri": 2,
        "begin": "joint.start:stems", "end": "joint.end:stems",          // continues the medallion stems, lands in the flame
        "assembly": [
          { "extender": "weave" },
          { "middle": "sideLeaf", "at": "golden(2)", "lock": "crossing",  // a crossing always lands under the clasp
            "knockout": "1.5 * hair", "optional": true, "minZ": -1 },
          { "extender": "weave" } ],
        "weave": { "strands": "strands", "crossing": "34deg", "ribbon": "1.15m", "haloGap": "0.25m",
                   "period": { "target": "rung(6m, 1)", "fit": "whole-halves" }, "ease": "0.5 period",
                   "checks": ["A + h < Rmin(spine)", "h < period^2 / (4*pi^2*A)"] },
        "reduce": [ { "below": -1, "to": { "kind": "rule", "count": 2, "gap": "1.15m" } } ] },
      { "id": "g2",    "kind": "gap",  "d": "1m" },
      { "id": "inner", "kind": "rule", "d": "0.2m", "weight": "hair", "pri": 1 } ] }
  },

  "joints": {
    "medallionCorner": { "kind": "motif", "motif": "medallion", "seat": "pavilion",
                         "receives": { "side": "stems", "top": "stemsTop" } },
    "flameCorner":     { "kind": "motif", "motif": "flame", "seat": "band", "receives": { "side": "stems" } }
  },

  "members": {
    "border": { "type": "moulding", "rank": 1, "pin": { "sweep": "ring:bay:sheet" },
                "profile": { "left": "side", "right": "side", "top": "head", "bottom": "foot" },
                "joints": { "tl": "medallionCorner", "tr": { "use": "medallionCorner", "mirror": "x" },
                            "bl": "flameCorner",     "br": { "use": "flameCorner",     "mirror": "x" } } }
  },

  "motions": [
    { "id": "courier", "on": "routeChange", "target": "border.tl.dart.u",
      "path": ["tl:sweepA", "border.left@garland.strand0", "bl:stems"], "to": "end",
      "duration": "clamp(0.9s, L / 900px * 1s, 1.6s)", "easing": "press", "tier": "A", "reduced": "blink-at-dock" }
  ]
}
```

**How it reads:**

- The ring is a circle, so the sweep sprouts from it with G2 continuity.
- The sweep's clothoid limb and stem line close onto the stem socket. Two free lengths are solved; status and residual are reported.
- The four stem lines start the left garland, so the ribbons literally continue the medallion's sweep.
- The garland is an assembly: weave, side-leaf clasp at 0.382, weave. Each side of the clasp fits whole half-periods, so a crossing always sits under the leaf.
- The ribbons land in the flame's stem socket.
- The flame's leaves are spiral-similarity copies, so their tips lie on the golden spiral exactly (checked by `onSpiral`).
- When the page grows taller, only the extenders and their counts change. The medallion and flame are cached and placed by transform.

### 6.4 Worked example B: mid-century moulding, corner blocks, travelling chevrons

```jsonc
{
  "format": "parkington-frame", "formatVersion": 1, "id": "midcentury", "skin": "mcm",
  "module": { "lerp": "width", "stops": [[360, 5], [1440, 10]] },

  "profiles": {
    "side": {
      "depth": { "byClass": { "compact": "3m", "medium": "5m", "wide": "7m" } },
      "units": "proportional",                       // strata keep the trace's proportions and scale to depth
      "note": "measured from websiteOutline.svg, left side, outside → inside (~68u)",
      "strata": [
        { "id": "c1",  "kind": "fill", "d": 7,   "role": "cream",     "pri": 3 },
        { "id": "sl",  "kind": "fill", "d": 3,   "role": "slate",     "pri": 4 },
        { "id": "t1",  "kind": "fill", "d": 6,   "role": "teal.deep", "pri": 1, "relief": "bevel-out", "carries": "chevrons" },
        { "id": "c2",  "kind": "fill", "d": 5,   "role": "cream",     "pri": 2 },
        { "id": "pin", "kind": "pinstripes", "d": 21, "count": 3, "line": 0.6, "role": "teal.deep", "pri": 6,
          "note": "depth by subtraction from 68; re-measure with the sampler" },
        { "id": "mu",  "kind": "fill", "d": 6.5, "role": "mustard",   "pri": 1, "relief": "round", "carries": "finials" },
        { "id": "c3",  "kind": "fill", "d": 3.5, "role": "cream",     "pri": 2 },
        { "id": "t2",  "kind": "fill", "d": 3,   "role": "teal.deep", "pri": 3 },
        { "id": "c4",  "kind": "fill", "d": 3.5, "role": "cream",     "pri": 4 },
        { "id": "br",  "kind": "fill", "d": 3,   "role": "olive",     "pri": 5 },
        { "id": "sg",  "kind": "fill", "d": 2,   "role": "sage",      "pri": 5 },
        { "id": "t3",  "kind": "fill", "d": 4.5, "role": "teal.dark", "pri": 1 } ],
      "typify": { "minStratumDevPx": 2, "merge": "into-neighbour-of-same-role" }
    },
    "thinPair": { "strata": [ { "kind": "fill", "d": "0.3m", "role": "teal.deep" },
                              { "kind": "gap", "d": "0.4m" },
                              { "kind": "fill", "d": "0.2m", "role": "mustard" } ] }
  },

  "joints": {
    "studBlock": { "kind": "block", "size": "profile.depth",          // square as deep as the band: no mitre
      "body": { "type": "stud", "rings": [
        { "inset": 0,    "rise": 0.10, "role": "teal.deep" },
        { "inset": 0.16, "rise": 0.10, "role": "mustard" },
        { "inset": 0.32, "rise": 0.08, "role": "cream" },
        { "inset": 0.44, "apex": true,  "role": "teal.deep" } ] },
      "emits": [ { "terminal": "arrowCluster", "along": "both", "stratum": "t1" } ],
      "room": { "governs": "min", "anchors": [
        { "z": 0 }, { "z": -1, "set": { "rings": 2 } }, { "z": -2, "swap": "butt" } ] } },
    "notch": { "kind": "notch", "size": "2.5m" }
  },
  "joinTable": [ { "a": "side", "b": "*", "style": "block", "joint": "studBlock" } ],

  "motifs": {
    "chevron":      { "maturity": "constructed", "nodes": { "v": { "type": "polyline",
                      "pts": [[-0.5, -0.5], [0, 0], [-0.5, 0.5]], "width": 0.28, "join": "miter" } },
                      "sockets": { "tip": { "at": [0, 0] } }, "fit": "lane" },
    "arrowCluster": { "nodes": { "c": { "type": "repeatLocal", "motif": "chevron", "count": 3, "pitch": 0.45 } } },
    "finial":       { "maturity": "drawn", "source": "motifs/arrow-finial.svg", "fit": "lane" }
  },

  "members": {
    "frame":   { "type": "moulding", "rank": 1, "pin": { "sweep": "ring:bay:sheet" },
                 "profile": { "*": "side" }, "joints": { "*": "studBlock" } },
    "chev.l":  { "type": "repeat", "rank": 2, "motif": "chevron", "pin": { "at": "frame.left@t1" },
                 "between": ["joint.tl", "joint.bl"], "clear": "1m", "orient": "track",
                 "pitch": { "natural": "rung(m, 3)", "stretch": 0.15, "shrink": 0.1, "parity": "odd" },
                 "mirror": { "as": "chev.r", "axis": "x-sheet-mid" }, "minZ": -1 },
    "finials": { "type": "repeat", "rank": 3, "motif": "finial", "pin": { "at": "frame.left|right@mu" },
                 "pitch": { "natural": "rung(m, 3) * phi" }, "mirror": "atCentre", "minZ": -1, "priority": 20 },
    "nav":     { "type": "anchored", "rank": 2, "pin": { "at": "frame.top@t1" },
                 "from": "[data-slot=nav] a", "motif": "chevron", "place": "between",
                 "hover": { "highlight": "stratum", "role": "mustard" } },
    "title":   { "type": "cartouche", "pin": { "hug": "slot:masthead" },
                 "assembly": [ { "fixed": "plaque.capL" }, { "extender": "plaque.mid" }, { "fixed": "plaque.capR" } ],
                 "hug": { "min": "20m", "max": "0.62 * bay.w", "pad": ["1m", "2.5m"] }, "profile": "thinPair" },
    "inset":   { "type": "moulding", "pin": { "inset": "bay:main", "by": "-1.5m" },
                 "profile": "thinPair", "joints": { "*": "notch" } }
  },

  "motions": [
    { "id": "conveyor", "on": "routeChange", "target": "chev.l.phase", "from": 0, "to": 1, "unit": "pitch",
      "duration": "0.62s", "easing": "press", "tier": "A", "reduced": "none",
      "note": "every chevron advances one pitch; end state = start state" },
    { "id": "courier", "on": "routeChange", "target": "joint.tl.arrowCluster.u",
      "path": ["frame.top@t1"], "to": "station:nav.active", "duration": "0.9s", "tier": "A", "reduced": "blink-at-dock" }
  ]
}
```

`frames/skins/mcm.skin.json`:

```jsonc
{ "finish": "flat",
  "tokens": { "mustard": "#cfaa6d", "teal.deep": "#2c5763", "cream": "#f2e5c7", "olive": "#9d8a62",
              "slate": "#5f7771", "sage": "#a7a891", "sand": "#ddcfaa" },
  "ramps":  { "teal.deep": ["#1d4657", "#2c5763", "#45808c"], "mustard": ["#b8945a", "#cfaa6d", "#e4bc77"] },
  "roles":  { "teal.dark": "teal.deep:-1", "paper": "sand", "ink": "teal.deep" },
  "light":  { "azimuth": "-135deg", "elevation": "45deg", "ambient": 0.55, "quantize": "ramp" },
  "dark":   { "roles": { "paper": "teal.deep:-1", "cream": "#1f3a40" } } }
```

The ramp shades other than the base tokens are carried over from the architect's reading of the trace and should be confirmed with the sampler.

### 6.5 Brief sketch C: an architectural-order frame (Beaux-Arts)

```jsonc
"members": {
  "pier.l": { "type": "order", "rank": 1, "pin": { "along": "bay:pier.l#axis" },
              "assembly": [ { "fixed": "attic.base", "h": "2.5m" },
                            { "extender": "shaft", "profile": "pilaster.fluted",
                              "flutes": { "fit": "whole", "pitch": "1.2m", "parity": "odd" } },
                            { "fixed": "ionic.cap", "h": "3m" } ],
              "variants": { "byClass": { "compact": "rule.double", "medium": "pilaster.thin", "wide": "pilaster" } },
              "mirror": { "as": "pier.r" } },
  "arch":   { "type": "span", "rank": 1, "pin": { "span": ["pier.l.capital.top", "pier.r.capital.top"] },
              "rise": "min(w / 2, 0.38 * viewport.h)",                 // viewport height only, typed input
              "form": { "step": "z", "else": "lintel", "from": [[-1, "segmental"], [-0.3, "threeCentred"], [0.5, "semicircle"]] },
              "profile": "archivolt", "keystone": { "motif": "keystone", "at": 0.5 } },
  "frieze": { "type": "repeat", "motif": "scroll", "pin": { "at": "entablature@frieze" }, "pitch": { "natural": "rung(m, 3)" } }
}
```

The content columns are openings between the piers, set like windows. The shafts stretch with content height while the bases and capitals stay fixed. The arch radius follows the span. On a phone the piers become thin pilasters, then a double rule, and the arch becomes a lintel.

### 6.6 Brief sketch D: minimal card (Japanese menu)

```jsonc
"members": {
  "card":   { "type": "moulding", "pin": { "sweep": "ring:bay:card" }, "profile": "hairEdge",
              "joints": { "*": { "kind": "round", "r": "rung(m, 2)", "shape": "squircle", "circularBelow": "10px" } },
              "emit": "css-preferred", "finish": { "shadow": "soft", "texture": "paper" } },
  "plate.pink": { "type": "plate", "layer": "ground", "role": "pink",
                  "rect": { "l": "x-card-l - 3m", "t": "y-card-t + 8m", "w": "bay.card.w / phi", "h": "rung(m, 4)" } },
  "plate.sage": { "type": "plate", "layer": "ground", "role": "sage", "blend": "multiply",
                  "rect": { "r": "x-card-r + 2m", "b": "y-card-b - 6m", "w": "bay.card.w / phi^2", "h": "rung(m, 5)" } },
  "sprig":  { "type": "single", "layer": "breaker", "motif": "sprig", "pin": { "at": "card.ring", "corner": "tr", "u": 0.08 },
              "wrap": "shape-outside",
              "variants": { "step": "z", "else": "tucked", "from": [[0, "breaking"]] } }
}
```

The card compiles to CSS where it can (border-radius, or `corner-shape` where supported, with an SVG clip fallback, plus `box-shadow`). The sprig crosses the frame on wide screens and tucks inside on phones.

---

## 7. Engine architecture

### 7.1 Packages

These are folders in this repo under `frame/`, with ESLint import boundaries. They replace the `framing/` spike.

```
frame/
  core/        (ships) pure TS: no DOM, no framework, no Zod, no global solver
    doc/       types, tolerant loader, migrations, expression parser → AST, axis typing
    graph/     DAG build, topo sort, cycle report, version-stamped memo, epsilon equality
    room/      width classes, z per member, anchors → compiled steps, hysteresis
    layout/    plan distributor (widths), grid emission, vertical closing from measurements
    curves/    intrinsic pieces, Gauss-Legendre, Cesàro turtle, offsets, strands, outlines,
               arc-length tables, phase-1 fitter, Spiro wrapper + Hobby fallback (later)
    members/   moulding sweep, joints + join table, assemblies, punctuation fitting, cartouche, motifs
    hinting/   device-px floors, snapping, merge/drop by priority
    scene/     layered items {id, role, relief, d, transform, sRange, movable}
  skin/        (ships) roles → paint, lighting + ramp quantisation, finish compilers
  render-svg/  (ships) Scene → SVG; keyed DOM patch; string output for Node and print
  dom/         (ships) <frame-elevation> custom element
  motion/      (ships, lazy) MotionDirector tiers A/B/C
  css/         (build) Vite plugin: layout params → frames/<id>.css
  schema/      (dev) Zod → frame.schema.json, validators, asserts
  lab/         (dev) Frame Lab
  cli/         (dev/CI) render at sizes → SVG/PNG contact sheets, snapshot tests
```

**Shipped runtime dependencies:** none at first. `spiro` (Apache-2.0/MIT) is added at M6, only if a frame uses knot-drawn sweeps. Small permissive algorithms are ported rather than installed: hobby.js (ISC), Levien's `integ_spiro`/`fit_euler`, Bertolazzi–Frego `buildClothoid` (BSD-2), and later kurbo `fit.rs`. Do not port from GPL libspiro.

### 7.2 Core interfaces

```ts
interface Curve {
  length: number
  pointAt(s: number): Vec
  tangentAt(s: number): number          // angle θ
  curvatureAt(s: number): number        // κ
  endState(): { x: number; y: number; theta: number; kappa: number }
  fittable(): Fittable                  // { sample(t) → {p, d}; cuspIn?(t0, t1) }
}

type Station = { u: Expr } | { s: Expr; from?: 'start' | 'end' | string } | { angle: Expr }
             | { golden: number } | { socket: string } | { datum: string } | { dom: string }

interface NodeType<A, G> {               // the registry that also generates every Lab panel
  kind: string                           // 'chain' | 'fan' | 'gnomon' | 'weave' | 'moulding' | 'repeat' | ...
  args: ArgSpec<A>                       // inspector rows, units, φ steppers, param kinds, axis types
  inputs(a: A): NodeId[]                 // DAG edges
  evaluate(a: A, inp: Resolved, ctx: Ctx): Solved<G>   // pure; returns {value, status, residual}
  handles?(g: G, a: A): Handle[]         // each handle names ≤ 2 params it may change
  drag?(h: Handle, p: Vec, initial: G, a: A): Partial<A>
  checks?(g: G, a: A, ctx: Ctx): Issue[]
  marks(g: G, a: A): Mark[]              // stable ids, s-ranges, movable flag
  stations?(g: G): Station[]             // snap targets and detents
  motionTargets?: string[]               // 'u' | 'phase' | 'reveal'
}

function solve(doc: Elevation, ctx: Ctx): Scene   // pure and deterministic
```

### 7.3 Pipeline from page box to SVG

```
inputs: host width W, dpr, viewport.h, route, reduced-motion, [measured opening rects], time
 1 ROOM      width class; m and hair; per-member z (quantised to 1/32)
 2 PLAN      choose the plan by route + class
 3 H-SOLVE   distributor → x-datums (snapped to 1/dpr), member depths (typify), pavilions
 4 EMIT      grid template, custom props, slot areas (only if changed)            [DOM write]
   ── the browser lays out the real content ──
 5 MEASURE   opening rects, one batched read                                       [DOM read]
 6 V-SOLVE   y-datums, track lengths, repeat counts (hysteresis), hug sizes
 7 MEMBERS   per member: exists → topology → geometry → weights → collisions; motifs placed
 8 HINT      device-px floors, snapping, merge/drop by priority
 9 SKIN      roles → paints, lighting, finish
10 RENDER    keyed SVG patch: only changed d / transform / fill                    [DOM write]
```

The host's ResizeObserver handles width and runs steps 1–4. Each opening's observer handles height and runs steps 5–10, coalesced into one requestAnimationFrame.

The architect proposal states that openings are deeper in the DOM, so their notifications arrive in the same frame before paint. That is **unverified in Safari and Firefox**, so test it at M1. If it fails, the result is a one-frame lag of the decorative layer only, never a layout shift, because the frame is absolutely positioned.

### 7.4 Relationship solving

- **Widths:** a closed-form distributor (fixed sizes, then fr shares, then clamps).
- **Attachments:** directed propagation over the DAG. Cycles are refused at the gesture in the Lab and are a named load error at runtime.
- **Shape closure:** local Newton or Levenberg–Marquardt inside one node, with at most 3 declared free parameters, warm starts, iteration caps and NaN/bend guards. It returns `{ok | approx | failed, residual}` and falls back to the last good value, then to a simpler curve (Spiro → Hobby → arc). Failures appear as red badges in the Lab.
- **Never a global constraint solver at runtime.** A true mutual relation (for example two tangent circles in the crest) is solved in the Lab only (optional planegcs, LGPL, never shipped), baked into parameters, and kept as a `check` so drift is flagged.

### 7.5 Determinism

- No `Math.random`; a seeded PRNG only if jitter is ever wanted.
- Fixed iteration counts; coordinates rounded to 2 decimals.
- `algo` pins per node.
- Snapshot tests run in one engine (Node CLI + headless Chromium) with tolerance compares, because JS Math precision differs between browsers.
- Hysteresis is the only stateful part; a fresh load is always canonical.
- **Closed-form unit tests:**
  - one golden turn ending at r = 45 has chord 45(1 − φ⁻⁴) = 38.4346
  - a three-centred arch (60° construction: each side arc turns 60°) with half-span a = 1 and rise h = 0.6 gives r 0.4536, R 1.5464
  - a clothoid limb with κ_end 0.0139 over 135u turns 53.8°

### 7.6 Caching

| Layer | Key | Recomputed when |
|---|---|---|
| Motif local geometry | (motif, variant, quantised params) | almost never; placed by transform. Static drawn motifs → `<symbol>` + `<use>` |
| Resolved members (garland, rails, arches) | (track length to 0.25 px, m, variant, counts) | a length or count changes |
| Plan solve | (W to 1/dpr, class, route) | the width changes |
| Scene | stable ids | only changed attributes are written |

A height-only change never re-runs motifs or the plan.

### 7.7 Performance budget *(estimates, to measure at M1 and M3b)*

| Work | Budget |
|---|---|
| Width solve + grid emission | < 1 ms |
| Full re-solve of the Victorian frame on a width change | < 8 ms (medallion and flame cached) |
| Height-only change | < 3 ms |
| Cold first solve, Victorian, mid-range phone | < 30 ms |
| SVG nodes | Victorian ~1,500–3,000; mid-century a few hundred; well under the ~8,000-element point where SVG and Canvas both slow down |
| Animated elements | tens, never filters |
| Runtime size (core + skin + render + dom) | ≤ 35–55 KB gzip; motion lazy-loaded |

Each pen layer is merged into one compound path per motif. Very tall pages can split rails into ~2,000 px SVG tiles.

### 7.8 Migrating the spike and the current engine

| From | To |
|---|---|
| `framing/math/phi.ts` (`rung`, `fitRepeats`) | `core/members` punctuation, with hysteresis and justified stretch |
| `framing/math/turtle.ts` (line + arc, G1) | Cesàro turtle: line, arc, clothoid, spiral, LAC (G2) |
| `framing/generators/weave.ts` | analytic Strand (exact normals instead of ±0.5u finite differences), fitted output, guards, end easing, stable piece ids with s-ranges |
| `framing/generators/guilloche.ts` | one fitted lobe stamped by rotation, plus a phase-function library |
| `framing/render/svg.ts:38`, `src/frames/frameEngine.ts:210` (`<use href x y>`) | `<g transform>` or HTML wrappers for anything movable (Chromium will not composite `<use x y>`) |
| `frameEngine.ts` rings, gaps, hatch | profile strata, via a one-off migration script |
| `frameSettings.ts` "Backward-compat fallback fields" | real migrations |
| `hand-drawn.json` hulls and sockets | `drawn` motifs |

---

## 8. Room-dependent designs (thresholds)

### 8.1 Model: two tiers

1. **Width classes** (CSS-owned) choose the **plan**, meaning which bays exist. On compact: one column, rails collapse to a double rule, and the garland may run only along the bottom (a pending decision).
2. **Member room levels** choose each member's **variant**. Each member declares what governs its room:

| Member | Governed by |
|---|---|
| corner | min(w, h) of its seat |
| rail | band depth |
| span | bay width |
| order | pier width |
| repeat | run length (counts only) |

Rules borrowed from optical sizing:

- Pinch-zoom never changes a variant; browser zoom does, because it relays out the page.
- z is **clamped** at the ends of the designed range, never reset to a default.
- `devPx` drives hairline floors only.

### 8.2 Rules

- **Parameter kinds:**
  - `continuous` interpolates (weights, swing, spacing, radii)
  - `discrete` only steps (leaf count, strand count, variant)
  - `grow` is discrete, but new lines are born from zero width across the hysteresis band, which suits engraving better than fading
  - `locked` takes no room rule
  - `layout` must compile to CSS

  The validator refuses interpolation on a discrete parameter.
- **Anchors:** 2–4 designed parameter sets per member, with more of them at the small end (the phone corner deserves the most design attention).
- **Compatibility:** continuous parameters interpolate between anchors only while all discrete parameters agree.
- **Switches:** where discrete values differ, the engine inserts a step at the **log-midpoint** between anchors. You can drag it. A pinned override at any z beats interpolation.
- **Hysteresis:** a Schmitt trigger that switches up at t·φ^h and down at t·φ^−h, with h = 0.05 (about ±2.4%). On first load there is no history, so the choice is canonical and a reload is deterministic.
- **Evaluation order per member** (cartographic order): which elements exist (visibility parents: a collapsed corner hides its whole subtree), then topology, then geometry, then weights with floors, then collisions (by priority; optional parts drop first; fallbacks tried in order).
- **Line families keep their texture:** constant screen pitch, changing counts. An optional size-vs-count dial α (0.5 = radical-law preset) splits a loss of room between fewer elements and smaller ones.
- **Generalisation operators**, by name: eliminate, typify, collapse, simplify, exaggerate, merge, swap.

### 8.3 Reduction ladders (starter presets)

| Member | Largest → smallest |
|---|---|
| Profile (any) | typify by priority: strata under `minStratumDevPx` drop and give their depth to a same-role neighbour. Mid-century goes 12 → 8 → 5 → 3 stripes, keeping order and rhythm |
| Victorian corner | full medallion → fewer fan lines, no leaf → `medallionBlock` → mitre |
| Mid-century corner | 4-ring stud → 2-ring → butt |
| Garland | 3-strand plait → 2-ribbon twist → double rule; clasp optional below z −1 |
| Flame | 6 leaves → 4 → simple scroll |
| Order | column → fluted pilaster → thin pilaster → double rule |
| Span | semicircle → three-centred → segmental → lintel |
| Punctuation | counts refit with hysteresis; ticks drop the finest level when its pitch < 4 device px; a sequence keeps its first and last items |
| Cartouche | shaped + moulding → plain superellipse → ruled label (text always stays) |
| Breaker | sprig breaks the frame → tucked inside |

### 8.4 Authoring and preview (in the Lab)

- **Scale strip** (ScaleMaster), one per member: rows are elements and discrete parameters; the x-axis is z on a log scale with ticks at φ steps, plus markers where 360/768/1280/1920 px land. Coloured bars show variant ranges, break points can be dragged, and each break can carry a note.
- **Fork variant here (⇧V):** scrub until the checks go red, fork the current variant there, edit it, and the switch appears at the log-midpoint automatically.
- **Generated filmstrip:** one cell per anchor, **a pair of cells at both edges of every switch** (including the hysteresis band), and the clamped extremes. Every cell carries badges.
- **Sweep:** animates width from 320 to 2560 to catch pops. A **live / canonical** toggle shows hysteresis behaviour.
- **Stops table:** any value can be promoted from a constant to a stops table to an expression. Raw expressions sit behind "view source" only.
- The chosen variant is published back as `data-variant` and `--frame-variant-corner: medallion-s`, so CSS style queries can adapt nearby typography.

At runtime, topology changes **cross-fade for about 250 ms**. A topology change or repeat refit is never morphed.

---

## 9. Interaction and animation

### 9.1 Model

Motion means **parameters of the solved frame changing over time**: a traveller's station u, a repeat's phase, a reveal fraction. A motion record lives in the frame file and holds:

- `on` (firstVisit | routeChange | visibilityReturn | hover | focus | variantChange)
- `target`, `path`, `from`/`to` (u, phase in pitches, a station such as `nav.active`)
- `duration`, `easing` (a CSS `linear()` string designed in the Lab)
- `order` (`graph` = the dependency order)
- `tier`
- a mandatory `reduced` form

State is stored relative to tracks, never in px, so a resize re-solves and keeps u.

**Hooks built in from M1, although motion ships at M8:**

- every track answers length, point, tangent and curvature at s
- every mark has a stable id and its s-range
- ribbon pieces keep their over/under order and halos
- the graph exports a topological order
- anything `movable` renders as `<g transform>` or a small HTML wrapper

### 9.2 MotionDirector: three tiers

| Tier | What | How |
|---|---|---|
| **A, compositor** | rigid travellers (chevrons, darts, conveyor) | sample the track at uniform s (64–128 keyframes) → `element.animate()` with `transform: translate() rotate()` at `offset = s/L`. Only transform and opacity, so it stays smooth while Vue mounts the next route. An HTML wrapper holding a tiny SVG gives compositing in every engine, including Safari (unconfirmed for SVG children). |
| **B, paint** | draw-in, ink pulse | `pathLength="1"` dash windows on spines; mask reveal per ribbon piece, shifted by the piece's start s, so reveals flow across crossings and hide where a strand passes under |
| **C, geometry** | true shape change (ripple, unfurl) | one rAF loop driven by the timestamp; re-solve only the downstream subgraph; ~4 ms budget *(to measure)*; falls back to B or A |

**Not used:** CSS `offset-path` (not composited in Chromium; `path()` is px-only), SMIL, GSAP (proprietary licence close to prohibiting a tool like the Lab), Rive and Lottie (geometry baked at authoring time).

**Why G2 matters for motion.** A traveller oriented to the tangent rotates at speed × κ. A G1 line-plus-arc join makes the arrow twitch at the tangent point; a clothoid easement does not. The Lab flags G1 joins on motion tracks.

### 9.3 First motions, in build order

1. **Conveyor** (mid-century): on route change, every chevron advances one pitch in 0.62 s. The end state equals the start state, so it is seamless and cheap.
2. **Courier, as working navigation:** each nav link is an anchored station on a moulding stratum. On route change, the arrow cluster leaves its corner block and runs to the newly active section's station. In the Victorian frame, the dart leaves the medallion along the sweep, rides garland strand 0 down the side, is masked under crossings by the over-pieces' halos, and docks in the flame socket. It takes 0.9–1.6 s, scaled by track length.
3. **Hover and focus along a track:** the stratum segment under a nav item changes role colour (150 ms; colour change is not motion under WCAG), optionally with a Tier B glint sliding to it. **The native focus ring is always kept**; the ornament only reinforces it.
4. **Settle:** about a 250 ms cross-fade at threshold switches.
5. **Later:** construction replay on first visit (rank 1 draws first; each dependent starts when its parent's pen passes its attach station), flame unfurl in growth order, rose-engine turn of a guilloché band, weave ripple.

### 9.4 Lifecycle and accessibility

- **Route change:** a same-document View Transition for **content only**. The frame is excluded from the raster snapshot (`::view-transition-group(frame){animation:none}`, old image hidden) so hairlines never stretch. After `updateCallbackDone`, the frame re-solves for the new height and then the `routeChange` motions fire.
- **Limits:** every motion is event-triggered and under 5 s, with no ambient loops. That stays clear of WCAG 2.2.2.
- **Reduced motion:** `prefers-reduced-motion` (live, via a matchMedia listener) and a per-viewer **"still engraving"** toggle both swap each motion for its `reduced` form (blink at dock, fade, jump to end, skip).
- **Hidden tab:** on `visibilitychange` → hidden, pause and commit end states, and never queue motions.
- **Resize during a motion:** finish it instantly, re-solve, rebuild keyframes.

---

## 10. The Frame Lab

### 10.1 What it is

A dev-only page, `lab.html`, served by the Vite dev server. It runs **the same `frame/core` and renderer the site ships**, so what you see is what renders. A Vite plugin with `apply: 'serve'` validates and writes `frames/**/*.json` as real files that git sees. Nothing lives only in localStorage. The blog, open in another tab, hot-reloads from the same file. A test asserts that no Lab module reaches `dist`.

**Panels are generated from the node-type registry** (args, handles, checks, stations). Adding a node type adds its inspector, snapping and checks automatically. This is what keeps the Lab from growing bigger than the engine.

### 10.2 Screen layout

```
┌ toolbar: V select · S sprout · F fan · C copy/gnomon · M mirror · R repeat · L ladder · T probe · X measure&construct · H hug ┐
│  frame ▾  skin ▾  [compact|medium|wide]  route ▾   width ◀────●────▶ (log, device marks)   Save ⌘S   Undo/Redo         │
├ LINEAGE (left) ─────────┬ BOARD (centre) ─────────────────────────────────────┬ INSPECTOR (right) ─────────────────────┤
│ sheet                   │ live frame around REAL site content (a route,       │ Pin card: "sprouts from sweepA at      │
│  ├ border ★1            │  or lorem of N paragraphs; per-opening height        │   1/φ, G2, outer side"  [edit chips]   │
│  │  ├ tl medallion ★1   │  sliders)                                            │ Shape card: values, φ-ladder steppers, │
│  │  │  ├ sweepA ★1      │ overlays: Ink | Datums | Bays | Tracks+stations |    │   lock state (phi / rung / free+drift) │
│  │  │  │  └ leaf ③ ↗    │  Combs | Hulls | Press check | Underlay              │ Room card: stops table / bars          │
│  │  ├ left@garland ★1   │ pin chips at stations; handles; detents at 1/φ, ½    │ Skin card: roles                       │
│  ├ title (cartouche)    │                                                      │ Checks for the selection               │
├─────────────────────────┴──────────────────────────────────────────────────────┴────────────────────────────────────────┤
│ DOCK: Contact sheet │ Scale strip │ Track lane (unrolled) │ Press check │ Motion │ History                               │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
Benches (top tabs): Elevation · Section (profile) · Joints · Motif · Skins
```

### 10.3 The benches

- **Elevation** (main board): plan tools to split bays, set sizes from a ratio palette (1:1, 1:φ, 1:φ², 1:√2, free), mark openings and name slots, reserve bands, make repeat bays. **Dragging a datum edits the ratio it comes from, never a pixel position.**
- **Section** (profile editor): a large vertical cross-section drawn like an architect's moulding section. Drag boundaries between strata; click a stratum to set its kind, role, relief, priority and `carries`. A live swatch shows a straight run, a corner and a curved run, all lit by the light dial. A **priority column** with a "simulate room" slider shows typify live.
- **Profile probe (T):** drag a line across a reference underlay. The probe samples about 30 parallel scanlines and takes the median to cancel trace wobble. It clusters colours to the nearest palette token, snaps depths to 0.5 units, and **proposes** stripes, which you accept, merge or delete one by one.
- **Joints:** a 2×2 board of the four corners plus tee and cross; the join table; stud ring editor with live lighting.
- **Motif bench:** construction overlay (spines, poles, stations, curvature combs, G2 badges), handles from node types, and Spiro knot pen (corner / g2 / left / right) from M6.
- **Skins:** tokens, roles, ramps, light dial, finishes, dark and print variants, and a live **contrast check** of text roles against each opening's ground.

### 10.4 Editing relationships directly

- **Gestures write pins.** Example: select the leaf, press **S**, drag its base toward `sweepA`. Within 12 px it snaps on, rotates to the tangent and bends its first piece to match curvature (a **G2** badge appears). Drop it on the 1/φ detent. The chip reads `sprouts · sweepA · 1/φ · G2 · outer`. **Tab** flips the side. History gains one entry.
- **Gestures offer only valid relations.** Select two things and the menu shows only the relations that make sense.
- **Prose readback.** Every pin is shown as a sentence with editable chips, for example *"Fan A: 7 hair lines between sweep A and sweep B, evenly spaced, converging on the core circle at 180°."*
- **Handles move 1–2 named parameters only.** Dragging solves for those and holds everything else (edit/stay). Locked values show a padlock; dragging past a detent shows what breaking the lock would cost.
- **Explain (Alt-click):** a breadcrumb back to the page box, such as `leaf ← sweepA@1/φ ← ring ← tl medallion ← border ← sheet`. Hovering a rank-1 curve tints everything that moves with it.
- **Lineage outline:** a tree with cross-reference chips (↗), not a node-wire graph. A read-only graph view exists for checking rank inversions.
- **Cycles are refused at the gesture**, with an explanation and an offer to **reverse** the pin or **bake** it.
- **Detach or delete a parent → bake:** dependents can be converted to absolute geometry, so nothing silently breaks.

### 10.5 Validation overlays (press checks)

Each check is a badge on the canvas and on every contact-sheet cell:

- **curves:** κ jump at G2 joins, offsets `|d| < Rmin`, outlines `w·κ < 1`, weave `A + h < Rmin` and `h < λ²/(4π²A)`
- **print:** hairline below floor, gap below 1 device px, flat-fill seams
- **layout:** collisions, repeat stretch > limits, a clipped motif, ornament over a content opening unless it is a `breaker`
- **golden:** golden drift and pitch readout (for example "ρ/s slope 0.3063 = φ per 90°")
- **rank:** inverted hierarchy
- **runtime:** solve status and residual, contrast < 4.5, layout shift > 0.01 CLS, motion > 5 s

### 10.6 Contact sheet, presets, undo, versioning

- **Contact sheet:** the whole page at 360×780, 768×1024, 1280×800, 1920×1080 and a very tall article, plus every switch edge, in one or several skins. Rendered by the CLI as SVG or PNG; also usable without the Lab.
- **Unrolled Track lane:** any track straightened into one arc-length axis, where strata, punctuation rhythm and (from M8) motion keyframes are edited together.
- **Presets:** "New frame from…" Moulding, Engraving, Blueprint, Order, Deco, Card. Each is a working document to bend, never a blank page.
- **Undo:** immer patches. Pointerdown sets a mark, pointerup squashes the drag into one step, Escape bails. Session state is never undone. Acceptance test (Figma's rule): undo a lot, copy, redo to the present, and the document is unchanged.
- **Versioning:** git is the long-term history. Readable property-level diffs. A **"compare with HEAD"** overlay shows the last committed frame in red under the current one.

### 10.7 Where Illustrator fits

Illustrator is the **sketchbook only**; nothing round-trips back.

- **Underlay:** place a sketch or PNG and **register** it with 2–4 control points (like georeferencing a scan), or calibrate by clicking two points and typing their real distance. References are used for sampling and comparison, never imported as geometry.
- **Measure & construct (X):** select underlay paths. The Lab fits families (circle, clothoid, log spiral, superellipse) and detects copies, mirrors and ends on circles. It reports residuals, for example *"flame tips: free log spiral b 0.49 RMS 0.21u; golden RMS 0.39, max 0.69u; leaves are similarity copies, scales linear"*, and shows displacement ghosts with a before/after toggle. It creates nodes only when you click Apply.

---

## 11. Rendering and finishes

### 11.1 Layer stack inside `<frame-elevation>`

| Layer | Contents | Notes |
|---|---|---|
| ground | CSS background: paper token, optional pre-baked texture tile, blueprint grid as a CSS gradient | never live `feTurbulence` (costly; has crashed iOS Safari) |
| frame | one absolutely positioned SVG, `viewBox` = box in CSS px at 1:1, `aria-hidden`, `pointer-events:none`, `view-transition-name: frame` | groups: fills, under, halos, over, punctuation |
| content | real HTML in grid areas, including cartouche text | |
| breaker | motifs crossing the frame, such as the sprig | `pointer-events:none`, `shape-outside` spacers |
| motion | a few HTML wrappers holding tiny SVGs | committed back to static after moving |

### 11.2 Finishes

- **Ink (engraving):**
  - Every line is a **filled outline** p ± w(s)·n with a swell or taper, filled nonzero. Never a CSS stroke.
  - Hairline floor 0.5–0.75 CSS px.
  - Knockouts are paper halos.
  - Relief is shown by **hatch density** (real line families at constant screen pitch, not pattern fills, which cannot follow curves).
  - Optional static "ink gain" in print and large displays only; never animated.
- **Flat (mid-century, deco):**
  - **Painter's underlap:** each stratum is painted from its outer edge to the profile's inner edge, outside in, so adjacent fills overlap and never show anti-alias seams.
  - Datums snapped to device px; `geometricPrecision` on curves.
  - Ramp-quantised lit facets.
- **Blueprint:** a token inversion (ground is Prussian blue, ink is paper), section outlines, weights about 15% heavier on dark *(assumption)*. Straight running text is real HTML in the band; curved text uses `<textPath>` with a visually hidden DOM copy when meaningful.
- **Card:** CSS first (`border-radius` / `corner-shape` where supported, else an SVG clip; `box-shadow` or `filter: drop-shadow` applied once). The SVG draws only hairlines and plates.

### 11.3 The hinting stage (where "printed" comes from)

At the current device px:

- line weights in screen units with floors
- stripes, ticks and straight edges snapped to 1/dpr
- lines whose gap falls below 1 device px merged, or dropped by priority, with the space absorbed by a named neighbour
- dpr re-read via matchMedia

Small rooms therefore get relatively heavier, simpler line work.

The printed look comes from exact repetition, continuous curvature, filled width-profiled lines and constant pitch, **not** from texture.

### 11.4 Modes

- **Dark:** each skin has a dark variant (a "night edition" engraving; blueprint is already dark).
- **Forced colours:** fills and textures are dropped; one `CanvasText` rule is kept along the sheet ring, so slots stay delineated.
- **Print:** re-solve at page size on `beforeprint`, use the print skin (pure black ink, no texture), vector output.
- **Export:** the CLI exports any frame at any size as SVG, or PDF through the browser.

---

## 12. Site integration and leaving Vue

### 12.1 The host element

```html
<frame-elevation frame="victorian" route="studio">
  <header data-slot="masthead"><h1>Parkington Programs Studio</h1></header>
  <nav data-slot="nav">…real links…</nav>
  <main data-slot="main"><!-- RouterView --></main>
  <aside data-slot="aside-left">…</aside>
  <footer data-slot="footer">…</footer>
</frame-elevation>
```

- It uses light DOM, so your CSS and Tailwind keep working inside slots.
- The frame document is imported statically (no fetch flash) and hot-reloads from Lab saves.
- Events: `frame:variant`, `frame:solved`, `frame:error`.
- Methods: `frame.play('courier')`, `frame.signal('routeChange', {from, to})`.

### 12.2 Step by step

1. **M1, behind a flag:** add `frame/dom` and the `frame/css` Vite plugin. In `vite.config`, set `compilerOptions.isCustomElement: tag => tag === 'frame-elevation'` for `@vitejs/plugin-vue`.
2. In `src/components/layout/SiteChrome.vue`, wrap `<RouterView>` in `<frame-elevation>` **outside** the router view, so the frame persists across routes. Mark children with `data-slot`.
3. Choose plans per route through `meta.plan` or the elevation's `routes` lists: front page newspaper plan, Projects with repeat bays, article single column with a marginalia aside, About as a card.
4. `router.afterEach` → `frame.route = name`. Navigations are wrapped in `document.startViewTransition` with the frame excluded. After the DOM update, call `frame.signal('routeChange')`.
5. Turn existing `Frame.vue` usages (columns, panels, nav strip) into nested elevations inside slots; they inherit `--m` and the skin.
6. When the mid-century and Victorian frames reproduce today's look, delete `src/frames/frameEngine.ts`, `frameSettings.ts` and `Frame.vue`.
7. **The rest of the site then leaves Vue too** (decided; see section 12.5). The framing layer has already left Vue at step 1. Supabase, auth, TipTap and the admin views are slot content that is ported page by page.

### 12.3 Accessibility

- All frame SVG is `aria-hidden="true"` and `focusable="false"`.
- Slots are the page's own landmarks.
- Cartouche titles are real headings.
- Running border text is decorative or duplicated in the DOM.
- Track highlights add to native focus rings and never replace them.
- Text-on-ground contrast is checked in the Lab.
- Reduced motion and "still engraving" are honoured, and the forced-colours fallback is in place.

### 12.4 Performance and robustness

- Build-time CSS gives the final layout before JS.
- `scrollbar-gutter: stable`.
- Re-measure hug cartouches on `document.fonts.ready`.
- Images in slots should carry dimensions; the contact sheet catches the ones that don't, through the CLS badge.
- The frame scrolls natively as static SVG; there are no scroll handlers.
- A sticky member (`attach: "viewport"`) renders in its slot's own small SVG inside a `position: sticky` slot.
- Test the real routes at M1, including the TipTap editor, long words, embedded media and overflow, not lorem.

### 12.5 Leaving Vue entirely (decided)

The current app is small: 43 Vue files, about 5,400 lines, plus about 1,400 lines of TS/JS. About a quarter of it is the admin forms and the marginalia wizard. Nothing in it needs Vue specifically.

| Vue job today | TypeScript replacement |
|---|---|
| `vue-router` | A small History-API router (about 150 lines): route table, `popstate`, link interception. It calls `frame.route = name` and wraps navigations in View Transitions. |
| Reactivity (`ref`, `computed`) | Signals (`@preact/signals-core`, MIT, about 2 KB). The engine's Lab uses the same model. |
| Templates and components | Plain DOM builders, or `lit-html` (BSD-3, about 3 KB) for repeated markup; custom elements for reusable widgets. Pages render into the frame's `data-slot` openings. |
| TipTap via `@tiptap/vue-3` | `@tiptap/core`, which is framework-agnostic (`new Editor({ element, extensions })`). The extensions you use stay the same. |
| Supabase composable | Unchanged logic as a plain module exposing signals (`user`, `profile`). |
| Vite plugin for Vue | Removed. Vite stays as the dev server and bundler. |

**Order.** Build the TypeScript shell (router, signals, `<frame-elevation>` as the page root) at M1 instead of mounting the frame inside `SiteChrome.vue`. Then port pages from simplest to hardest:

1. About and Newsletter
2. Project index and detail
3. Marginalia index and entry
4. Login and account
5. Admin lists and forms
6. The marginalia wizard and editor

Vue and the new shell can coexist during the move: unported routes temporarily mount their old Vue component inside a slot. Vue is deleted when the last route is ported. **Estimate:** 3–5 weeks part-time alongside M1–M4 *(assumption)*.

### 12.6 Keeping the map engine possible
See section 16.

---

## 13. Roadmap

> **Build order:** [system.md §18](system.md) groups these milestones into phases and moves motion (M8) earlier, before the curve kernel. Motion on straight tracks doesn't need the kernel. The GPU backend is a recorded future idea ([future-ideas.md](future-ideas.md)).

Estimates are rough, part-time, solo with AI help. **Scope freeze:** M0–M3 are rectilinear only, with no curve kernel until the frame is running on the live site. Maps are **not built** in this roadmap, but the core is kept shareable so a future map engine can plug in (section 16).

| # | Milestone | Visible deliverable | Done when |
|---|---|---|---|
| **M0** (~1 wk) | Skeleton on paper | `npm run frame:render midcentury --sizes 360,768,1440` writes SVGs of the plan's datums and bays plus the 12-stripe moulding with mitre corners | Doc types, expression parser with axis typing, distributor, profile sweep and CLI exist; snapshot tests pass in CI |
| **M1** (1–2 wk) | The frame becomes the layout | The real blog laid out by the frame (masthead, columns, rules closing around live content) on one route behind a flag | Works from 360 to 1920 on real routes including TipTap; reload shows no layout jump; ResizeObserver ordering checked in Chrome, Safari and Firefox; movables use `<g transform>` |
| **M2** (~2 wk) | Lab v0 | Edit a ratio and a stripe in the browser, save, watch the blog tab update | You change stripes, a ratio and a role **without opening JSON**; git diff is readable; undo works per drag; rank-inversion validator on |
| **M3** (2–3 wk) | Mid-century complete | The site in the mid-century frame built from `websiteOutline.svg`: lit stud blocks, chevrons, finials, title plaque, notched inset, nav stations with hover | Probe rebuilds the profile from the trace in under an hour; chevrons refit in whole numbers as content grows; a long title grows the plaque; Track lane edits chevron rhythm |
| **M3b** (~1 wk, parallel) | Early Victorian win | The Victorian frame on the site with **drawn** medallions and flame from `hand-drawn.json`, the spike's weave down the sides from the stem sockets, the side-leaf clasp | Ribbons start at the sockets at every page height; performance measured on a low-end phone (element count, solve ms) |
| **M4** (1–2 wk) | Thresholds | Sweep 320 → 2560 and the frame simplifies gracefully (12 → 8 → 5 stripes, block → butt, garland → double rule) | Every switch has edge cells in the filmstrip with green badges; Fork variant and log-midpoint switches work; reload is canonical |
| **M5** (~3 wk) | Curve kernel + Beaux-Arts | An architectural frame: stretching shafts, fixed capitals, an arch whose radius follows the width and becomes a lintel on a phone | Closed-form unit tests pass (38.4346 chord; arch r 0.4536 / R 1.5464); G2 combs visible; orders are assemblies |
| **M6** (3–4 wk) | Constructed Victorian | Medallion and flame rebuilt from relations; side-by-side drawn vs golden flame with per-tip displacement | **The METAFONT test:** you build the flame relation set by gesture without opening JSON; golden verified on emitted cubics; analytic weave with guards; Spiro wrapped with fallback |
| **M7** (2–3 wk) | More styles and skins | Blueprint (ticks, inverted band, panel grid on Projects), deco (steps, sunburst, spine sequence), card About page; one structure in five skins | Contact sheet shows all skins with honest "not designed for this skin" badges where needed |
| **M8** (~2 wk) | Motion v1 | Changing tab sends the chevrons along the moulding to the active nav station; the Victorian dart rides the garland with occlusion at crossings | Composited in a Chrome performance trace during route render; reduced motion shows the blink; all motions < 5 s |
| **M9** (ongoing) | Polish and decisions | Print skin, exports, construction replay, kurbo fitter port, LAC character dial, Tier C ripple and unfurl, retire the old Vue frame | The old frame code is deleted; the Vue decision is made |

Pending owner decisions (twist or plait, bottom garland, Vue) are **data switches** and block no milestone.

---

## 14. Risks and mitigations

| Risk | Mitigation |
|---|---|
| **Scope vs one designer with AI.** Every proposal was a 9–10 milestone system. | Scope freeze for M0–M3; the "two real styles" rule (3.10); every milestone ships something visible; flat styles first; JSON + CLI usable without the Lab. |
| **Lab creep.** The editor can absorb all the time. | Registry-generated panels; Lab v0 deliberately plain; each panel arrives only with the feature it edits. |
| **Owning layout means owning layout bugs** (TipTap, sticky, overflow, long words, media). | Openings are ordinary grid areas with `min-width:0`; site CSS rules inside slots; `fit: "flow"` escape hatch; test real routes at M1. |
| **Layout feedback and flicker** (fonts, images, scrollbars, hug cartouches, viewport-height arches). | Static axis typing; `viewport.h` the only typed exception; CSS-first emission; `scrollbar-gutter: stable`; re-measure on `fonts.ready`; hysteresis; CLS badge. |
| **Unreadable expressions** (the METAFONT trap). | One small value language; room rules as stops and bars; prose readback; gestures write pins; raw JSON only behind "view source"; the M6 METAFONT test. |
| **Over-abstraction before taste.** | Two concrete styles before generalising; one file plus skin until reuse is real. |
| **Re-skinning is not free.** | Per-skin render rules; honest badges; re-skin is a convenience. |
| **Golden changes the art** (self-similar leaves make the smallest leaves larger than the drawn linear shrink). | `sizeLaw` dial; side-by-side views with numbers; drawn motifs remain usable indefinitely. |
| **Curve numerics** (Spiro has no convergence flag; closures can fail; drags can jump between solutions). | Status + residual on every solve; iteration caps; last-good fallback; handles edit ≤ 2 parameters, not raw knots; badges. |
| **Interpolating across structurally different anchors.** | Compatibility validator; switches at log-midpoints; pinned overrides; sweep testing. |
| **Hysteresis vs determinism.** | Small band (±2.4%); canonical choice on load. |
| **Victorian density and performance.** | Cached motifs; one compound path per pen layer; symbol reuse; rail tiling; measure at M3b, not M6. |
| **Browser gaps:** Safari SVG-child compositing unconfirmed; CSS `d` missing in Safari; `corner-shape` Chromium-only; cross-document View Transitions missing in Firefox; ResizeObserver ordering unverified. | HTML-wrapper travellers; `setAttribute('d')`; SVG fallbacks; frame excluded from snapshots; test early. |
| **Determinism across engines.** | Rounding; tolerance snapshots in one engine; `algo` pins; migrations with fixtures. |
| **AI-written solver code is hard for you to review.** | Small pure modules; closed-form unit tests; snapshot proofs. |
| **Accessibility drift.** | Real text in HTML; contrast badges; mandatory `reduced` field on every motion; native focus rings kept; forced-colours fallback. |
| **Licences.** | No GSAP; no libspiro port (GPL); planegcs Lab-only (LGPL). Mapbox patent US10416866B2 resembles a value-vs-zoom graph editor; probably irrelevant for a private tool, worth checking before publishing the Lab (not legal advice). |
| **Traced sources wobble** (`websiteOutline.svg`). | Median-scanline probe; tokens and depths only; never import traced geometry. |

---

## 15. Decisions you need to make

Each has a recommended default, so work can start before you decide.

| # | Question | Recommended default |
|---|---|---|
| 1 | 2-ribbon twist or 3-strand plait? | **Twist** as the base, plait as the wide-rail variant (`strands` steps to 3 at z ≥ 0.5). Compare both in the Lab at M3b. |
| 2 | Garland only down the sides, or also along the bottom? | **Sides only**, with a tailpiece and double rule along the bottom. A bottom garland is one extra assembly; try it at M3b. On compact, consider bottom-only. |
| 3 | Should the rest of the site leave Vue? | **Decided (owner, 2026-10-10): yes, the whole site moves to TypeScript.** See section 12.5 for the plan. |
| 4 | Which style ships first? | **Mid-century** (M3), with the drawn-motif Victorian (M3b) in parallel. |
| 5 | Flame spiral growth? | **φ per 90°** (the classic golden spiral you asked for), with **φ per 54°** one click away, because it keeps the drawn character (RMS 0.21). Judge side by side. |
| 6 | Flame leaf sizes: self-similar (golden) or linear (as drawn)? | **Self-similar**, with the drawn version kept for comparison; decide by eye at M6. |
| 7 | Medallion ring ratio: drawn 1.20 or golden φ^0.5 = 1.272 (+5u)? Stem gap ratio: drawn 1.467 or φ (+1.7u)? | **Golden, with drift readouts.** Both are one unlock away. |
| 8 | Crest inner heart: drawn 1/√2 or 1/φ? | **1/√2** (what you drew; 1/φ is 12% off). |
| 9 | How strict should golden snapping be? | `phiPolicy: "snap"`, locks only on the flame spiral and named golden rules. |
| 10 | Width-class breakpoints and module range? | Compact < 600, medium 600–1200, wide ≥ 1200; m from 5 px (360) to 10 px (1440). Tune in the Lab. |
| 11 | First motion? | **Conveyor and courier-to-active-nav** on route change (M8). No ambient loops; "still engraving" toggle on. |
| 12 | Lab interface built in Vue or plain TS? | **Plain TypeScript**, matching your move away from Vue. Panels are generated from the node-type registry anyway, so a framework adds little. Vue would also work, since the Lab is dev-only. The canvas is the engine's own renderer either way. |
| 13 | Should the Lab ever be published as a tool for others? | **No, keep it private** for now (avoids the patent and GSAP-style licence questions entirely). |
| 14 | Mapping engine? | **Not built now, but designed for (owner, 2026-10-10).** The frame engine's core is kept shareable so a future map engine can plug into it (section 16). |
---

## 16. Map engine readiness

A mapping engine is not built now, but it is a large part of the owner's work, so the frame engine keeps the door open. Most of what a cartographic renderer needs already exists in this design. The rule: **shared foundations live in `frame/core` with no frame-specific assumptions**, and a future `map/` package consumes them.

| Shared foundation | Frame use | Map use |
|---|---|---|
| `curves` (arc length, offsets, line families, filled outlines) | ribbons, hatch, mouldings | coastline waterlining, contour hatching, cased roads, river tapers |
| `geometry` (polygon offset and booleans, hulls); planned as Clipper2-style operations | knockouts, hulls, text wrap | buffers, waterline rings, clipping to the neatline |
| `room` (z = log scale, step/interpolate values, hysteresis, generalisation operators, priority) | thresholds | zoom levels: the same semantics as map zoom styling |
| Expression language (`step`, `lerp`, `byClass`) | frame values | data-driven styles; keep its semantics close to MapLibre style expressions (BSD-3) so map styles can borrow them |
| `skin` (palette roles, ramps, lighting, finishes) | frame styles | choropleth ramps, hillshade-like relief tints, one look across frame and map |
| Station / label placement with collisions by priority | cartouches, punctuation | map labels (later) |
| `render-svg` behind a Scene interface | frames | small and medium maps; a Canvas or WebGL renderer can implement the same Scene interface for large datasets |

**Boundaries to respect from M0:**

- `core` never assumes a rectangle page or CSS pixels. Coordinates go through a transform, so a map projection (e.g. `d3-geo`, ISC) can supply them.
- The Scene format is renderer-neutral: layered items with roles and stable ids.
- `geometry` and `curves` take plain arrays, not frame types.

**How maps will meet frames:** a map is the content of an opening, and its neatline is a frame member. The frame's nested-elevation, inset (legend, compass panels), cartouche (title) and skin machinery apply unchanged.
