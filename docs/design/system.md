# Eloi: system design

**Status:** high-level design, proposed; nothing here is built yet · **Date:** 2026-10-10

**Read this first.** This document explains how the whole system fits together and how its ideas actually work.

| Document | Covers |
|---|---|
| [frame-engine.md](frame-engine.md) ("Elevations") | the frame layer in detail: vocabulary, document format, Studio, thresholds |
| [future-ideas.md](future-ideas.md) | parked ideas, including the GPU engine and the map engine |
| [../research/](../research/README.md) | the evidence |

Where this document and frame-engine.md differ, this one takes precedence: on stages, the compiler, package layout and build order.

> **In one paragraph.** Eloi is a computational drawing engine. You describe drawings as functions and relationships: dominant curves first, everything else relative to them. A compiler bakes everything that doesn't depend on the live page. A small runtime does only what's left, sending each change to the cheapest place the browser offers. The same engine frames and animates very different projects (a Victorian portfolio, a mid-century city game, isidex later) and stays out of their way.

---

## 1. What the system is for

It is the owner's design ideology turned into software: a reusable computational drawing paradigm and a foundation for increasingly complex projects. Its main job is to convey the owner's vision, not to serve one website. Performance comes first, because the projects it frames are about something other than their frames.

| Host | Style | What the engine does there | When |
|---|---|---|---|
| Portfolio site | Victorian engraving | the frame is the page layout; motion on section change; per-box scroll speeds | first |
| City guessing game | mid-century modern | frames the game screens and reacts to game state | second (game is preliminary) |
| Isidex | to be designed | framing around its WebGL diagram canvas | later |
| Maps | — | a separate engine on the same core | future idea |

---

## 2. Principles

1. **Describe, don't draw.** Everything visible is a function of named inputs, defined by relationships rather than coordinates.
2. **Dominant first.** Rank-1 curves define the drawing; everything else is pinned to something of equal or higher rank.
3. **Every value has a "when".** Each value belongs to the design, load, layout or moment stage, and its stage decides where and how often it is computed.
4. **Compile what can be compiled.** Anything that doesn't depend on the live page is baked at build time. The runtime handles only what's left.
5. **Animate the rule, not the points.** Motion changes the parameters of relationships, so every in-between frame is a valid drawing.
6. **Data, not elements.** The scene is arrays with stable ids; the DOM is one of several outputs.
7. **The cheapest place wins.** Each change runs in the cheapest executor that can do it: CSS, the compositor, a few path updates, or (later) the GPU.
8. **A guest, not the owner.** The engine is idle when nothing changes, stays within a budget when something does, and leaves no global side effects.
9. **One source, many targets.** One document compiles to CSS, SVG and a runtime plan today, and to GPU code later.
10. **Measured, not assumed.** Budgets and golden snapshots are checked automatically from the first milestone.

---

## 3. The system at a glance

```
BUILD TIME (your machine)
  Studio (Frame Lab) ──edits──► Documents ──────► Compiler ─────────► Shipped files
  runs the same core live       relations,        check, stage,       CSS, static SVG,
                                curves, skins,    bake, plan,         runtime plan
                                motions           route, emit         (GPU code later)
──────────────────────────────────────────────────────────────────────────────────────
RUN TIME (the browser)
  Shipped files ──► first paint from HTML + CSS + static SVG (no JavaScript needed)
        │
        ▼
  Runtime core:  inputs ──► scheduler ──► evaluator ──► scene ──► diff
  (width, content heights, route, scroll, time, view progress, host data)
        │  each change routed to the cheapest executor (section 8)
        ▼
  CSS animations · compositor · SVG path updates · Canvas 2D · (GPU later)
        │
        ▼
  Hosts: portfolio site · city game · isidex
```

---

## 4. The language: documents, expressions, inputs

### 4.1 Documents

The document format is specified in [frame-engine.md §6](frame-engine.md): params, profiles, joints, motifs, plans, members and motions, with ranks and pins. The system adds three things:

- **inputs** (4.3)
- **stage caps and live budgets** (section 5)
- **motions as first-class timelines** (section 10)

Documents are JSON files in git, written by the Studio and readable in a diff.

### 4.2 Expressions: one small, pure language

Every value in a document is an expression: numbers with units, references, `phi`, `rung`, `golden(k)`, `lerp`, `step`, `byClass`, arithmetic, trigonometry, `clamp`, `smoothstep` and easing curves (frame-engine.md §6.2).

| Property | Meaning |
|---|---|
| **Pure** | no side effects; the same inputs always give the same value |
| **Total** | always returns; no unbounded loops or recursion |
| **Typed** | length, angle, ratio, colour, vector or boolean, with units checked |
| **Axis-typed** | layout values are x or y, so a width can never depend on a height |
| **Stage-inferred** | each value's stage is computed from its inputs (section 5) |

**Why it stays this small.** One parser produces one syntax tree, and four consumers use it:

- the Studio interprets it live
- the compiler evaluates it ahead of time
- the runtime interprets what's left
- later, a code generator translates it into GPU shader code

Every construct must therefore have a GPU translation. String manipulation, dynamic property names, I/O and unseeded randomness are not allowed.

### 4.3 Inputs

| Input | Stage | Used for |
|---|---|---|
| document params, motif geometry, skin tokens | design | curves, golden rules, palettes |
| `dpr`, `reducedMotion`, `fonts.ready`, device class | load | hairline floors, motion forms |
| `width`, `class`, `route`, `content.<slot>.h`, `viewport.h` | layout | grid columns, track lengths, repeat counts, variants |
| `scroll`, `scroll.<container>`, `view.<id>` (an element's 0–1 progress through the viewport), `time`, `motion.<id>.t` | moment | per-box speeds, arrows on tracks, unfurls |
| `data.<key>` from the host app | **layout** for discrete changes (a new round); **moment** for continuous streams (a running timer) | game state, selections |
| `pointer` | moment | rarely: hover highlights |

---

## 5. Stages: every value has a "when"

This is the backbone of performance.

| Stage | Recomputed | Typical work | Runs in | Cost |
|---|---|---|---|---|
| **design** | at build, and on Studio save | curve solves, motif construction, profiles, skins | the compiler | zero at runtime |
| **load** | once per page load | hairline floors, choosing motion forms and plans | runtime, once | microseconds |
| **layout** | when width, content, route or discrete data change | grid, track lengths, whole-count repeat fitting, stretching, variant choice, curve-chain closure | runtime (or a worker) | a few ms, occasionally |
| **moment** | every frame while an input is moving | transforms, stations along tracks, closed-form curve parameters, opacity, colour | CSS or the compositor first; the runtime only if needed | must be near zero |

**Rules**

- **Stages are inferred, not tagged.** A value's stage is the latest stage among its inputs, worked out like a type. You can assert a cap (`"maxStage": "layout"`) or declare a live budget (`"live": { "budget": "0.5ms" }`).
- **Expensive node kinds may not run at the moment stage.** That covers chain closure, fitting, offset families and assemblies. If a design asks for one (for example, a sweep that re-solves as you scroll), the compiler turns it into a **bake table** (6.4) or refuses with an explanation.
- **The Studio shows the cost while you design.** Each node gets a stage badge, and each motion shows its executor (section 8).

**Example.** "Chevron count fits the rail" depends on the rail's length, which depends on content height. That makes it **layout** stage: recomputed when content grows, never per frame. "Chevrons advance one pitch on route change" depends on motion time. That makes it **moment** stage, which the compositor runs.

---

## 6. The compiler

### 6.1 Steps

1. **Load and check:** schema, types, units, axis typing, cycles, rank inversions, stage inference.
2. **Bake:** evaluate every design-stage node. This is partial evaluation: the same interpreter the Studio runs, executed ahead of time. Its outputs are motif geometry, profiles, skins, tokens and curve tables.
3. **Pre-solve anchors:** run the layout-stage nodes at each width class's anchor width and each route plan, to produce first-paint output.
4. **Plan the remainder:** what's left (layout and moment nodes) becomes a **runtime plan**. That is a list of operations in dependency order, with their inputs, referencing the node-type implementations they need.
5. **Route motions:** assign each motion to the cheapest executor that can run it (section 8), emitting CSS or precomputed keyframes where possible.
6. **Emit artifacts** for each host and target.
7. **Report:** bytes, element counts, cost estimates per stage, executors used, budget pass/fail, golden snapshots.

This is the same idea as a game engine "cooking" assets, a font compiler turning a parametric design into fixed outlines, or Svelte compiling components into plain DOM code. Rich and slow on your machine, small and fast in the browser.

### 6.2 Artifacts

Example for the mid-century frame:

```
dist/frames/midcentury/
  frame.css      grid templates, tokens, scroll- and time-driven animations, fallbacks
  frame.svg      static geometry, written to adapt to width natively (6.3); inlined into the HTML
  plan.js        the runtime plan + imports of only the node types it uses (6.5)
  motions.js     timelines already routed to executors, keyframes precomputed where possible
  report.json    sizes, counts, stage costs, budget results
```

### 6.3 First paint without JavaScript

Static output is written to adapt to width natively wherever it can:

| Part | Native form |
|---|---|
| straight mouldings | CSS borders and gradients, or SVG strips with percentage lengths |
| repeats | SVG `<pattern>` fills or CSS repeating gradients at the designed pitch |
| corners, crests, motifs | fixed symbols positioned by CSS |
| layout | CSS grid with `clamp()` and container units |

The parts that genuinely need solving (curved tracks, whole-count fitting, assemblies) are prerendered at the anchor width, then corrected by the runtime within a frame. The frame is absolutely positioned decoration, so a correction is only a repaint, never a layout shift.

### 6.4 Bake tables: solve slowly at layout time, play cheaply at moment time

Sometimes something slow must respond to a moment input over a bounded range, such as a sweep whose shape follows scroll progress through a section. In that case the runtime does this:

1. At layout time, it solves the shape at a small grid of input values (16–32 samples).
2. It stores the solved **parameters**, not the points.
3. At moment time, it interpolates those parameters and evaluates the closed-form curve.

Every frame is still a valid curve, and the per-frame cost is tiny. Closure error between samples is checked against a tolerance when the table is built. This is the lookup-table trick game engines use.

### 6.5 Pay only for what you use

The runtime plan imports only the node types the document uses, and the bundler drops the rest.

- A static frame ships **zero** runtime JavaScript.
- An animated mid-century frame ships the core, the moulding and repeat node types, and the motion executors it actually uses.

---

## 7. The runtime

### 7.1 The scene is data-oriented

- **Layers** (ground, frame, breaker and motion; frame-engine.md §3.6) hold their items in parallel arrays: stable id, kind, geometry reference, transform, style role, stage, dirty flag, parent and track s-range.
- **Stable ids come from the document path** (for example `border.left.garland.strand0.piece3`). The same item keeps its id across resizes, routes and data changes. Diffing, motion and transitions all depend on this.
- **Geometry lives in shared numeric buffers.** Baked geometry comes from the compiler; live geometry is rewritten in place. Every renderer reads the same buffers.

### 7.2 Evaluation: a coarse graph over bulk arrays

- **Document-level nodes** (tens to hundreds) form a reactive graph made of **signals**:
  - inputs are signals
  - nodes are computed values
  - renderer writes are effects, batched once per frame

  The same signal model runs the TypeScript site shell and the Studio, so there is one reactivity model everywhere.
- **Families** (line families, repeats, punctuation, and later thousands of nodes) are each **one** graph node that owns an array. Per-item work is a tight loop over numbers, not thousands of reactive objects. This is what lets counts scale.
- **Only the subgraph downstream of a changed input re-runs** (version stamps).

### 7.3 The scheduler: a well-behaved guest

- **One frame loop for everything**, and it runs only while there is dirty work or an active timeline. Otherwise it sleeps.
- **Every frame does three steps:** read (batched DOM reads), evaluate, write (batched DOM writes). The browser never lays out twice in one frame.
- **Priorities:** input response first, then the host app, then layout-stage work, then decoration.
  - Decoration has a per-frame budget (target ≤ 1–2 ms on a mid-range phone, to be measured).
  - Over budget, it degrades (lower room level, cheaper executor, skipped decorative frames) instead of janking.
- **Yielding** uses `scheduler.postTask` where it exists (Chrome, Firefox) and a simple fallback where it doesn't (Safari).

### 7.4 Workers

- **Heavy solves.** Layout-stage work such as long curve chains and big line families can run in a Web Worker. The last good geometry stays on screen until the result arrives.
- **Off-thread drawing.** Canvas and GPU renderers can draw off the main thread with OffscreenCanvas, which all major browsers support.
- **Shared memory** between threads requires cross-origin isolation headers. That is a deployment decision, deferred until needed.

### 7.5 The host contract

```ts
interface MountOptions {
  clock?: Clock                     // follow the host's loop (e.g. isidex's regl frame) instead of our own
  scheduler?: Scheduler             // run our work inside the host's priorities
  styleScope?: 'layer' | 'shadow'   // CSS cascade layer (default) or shadow DOM
  static?: boolean                  // draw only the compiled output; zero runtime
  reducedMotion?: 'auto' | boolean
}

interface FrameHandle {
  set(input: string, value: unknown): void       // e.g. set('data.round', 3)
  signal(event: string, payload?: unknown): void  // e.g. signal('routeChange', { to: 'projects' })
  play(motion: string): Promise<void>
  on(event: 'solved' | 'variant' | 'error', cb: (e: unknown) => void): () => void
  dispose(): void
}

function mount(el: HTMLElement, frame: CompiledFrame, opts?: MountOptions): FrameHandle
```

**Guarantees:**

- no globals
- nothing left behind after `dispose()`
- no work while idle
- styles stay inside their scope
- every motion has a reduced form

---

## 8. Routing changes: the cheapest executor wins

| Kind of change | Examples | Executor | Main-thread cost per frame |
|---|---|---|---|
| **Never** | the moulding, ticks, a medallion at rest | baked static SVG or CSS, painted once | zero |
| **Moves as a whole** | chevrons, arrows on tracks, per-box scroll speeds | CSS scroll- or time-driven animations, or **Tier A** compositor (precomputed transform keyframes) | about zero |
| **Draws in or highlights** | ink draw-in, a glint along a track | **Tier B** paint (dash or mask reveals) | small |
| **Changes shape** | a leaf unfurling, a weave flowing, a sweep bending | **Tier C** runtime: evaluate rule parameters, rewrite a few paths | small, within budget |
| **Changes shape at scale** | thousands of nodes moving | **Tier D** GPU ([future idea](future-ideas.md)) | near zero on the CPU |

The compiler picks the cheapest executor that can run each motion:

- transform or opacity only → CSS or Tier A
- reveals → Tier B
- geometry changes → Tier C
- counts beyond a threshold → Tier D when it exists, otherwise a lower room level

The Studio shows each motion's executor and warns when a design forces a costlier tier. Tiers A–C match frame-engine.md §9.2.

---

## 9. Curves

- **Curves are defined by how they bend** (curvature along their length) or by closed forms: line, circle, clothoid, golden and other log spirals, log-aesthetic curves, superellipses, and sinusoids on a spine (weaves). Chains join with matching curvature (G2).
- **Every curve can answer** its length and the point, tangent and curvature at any distance. Stations, repeats and motion all work in distance along the curve.
- **Béziers are output only.** One fitter converts curves to SVG path segments at about 0.1 device-pixel tolerance; circles stay arcs. GPU targets can skip Béziers entirely.
- **Closed-form curves evaluate in microseconds**, so they can animate at the moment stage. Curves that need solving (chain closure) stay at the layout stage or go into bake tables (6.4).

Details: [frame-engine.md §2](frame-engine.md) and the [curve catalog](background/curve-catalog.md).

---

## 10. Motion

### 10.1 Motion is parameters over time

An animation drives an input such as `motion.courier.t`, and expressions read it. Because the graph propagates changes, anything pinned to a moving thing moves with it. Linking elements is just more relationships.

### 10.2 Timelines and links

The syntax below is illustrative and follows frame-engine.md §9.

```jsonc
"motions": {
  "unfurl":  { "on": "firstVisit", "duration": "1.4s", "easing": "press",
               "drives": { "flame.curl": "lerp(0.2, flame.b, t)" } },          // rule animation → Tier C
  "courier": { "on": "routeChange", "track": "tl:sweepA → border.left@garland",
               "duration": "clamp(0.9s, L / 900px * 1s, 1.6s)",
               "drives": { "dart.u": "ease(t)" } },                            // rigid on a track → Tier A
  "drift":   { "on": "scroll", "source": "view(#projects)",
               "drives": { "layer.ornament.scrollRate": 0.85 } }               // → CSS scroll-driven
},
"sequence": [ { "after": "courier", "play": "conveyor" },
              { "play": "unfurl", "stagger": "rank" } ]                          // dominant curves first
```

### 10.3 Executors

The CSS timeline and Tiers A–D are described in section 8. These are not used:

- **CSS `offset-path`:** Chromium does not run it on the compositor, and its `path()` form accepts only px.
- **SMIL:** CSS cannot control it, and it blocks compositing.
- **GSAP:** its licence is restrictive.

### 10.4 Scroll: per-box speeds

- **Declaring a speed.** A layer or box declares `scrollRate` (1 = normal, 0.85 = slower, 0 = fixed to the viewport, above 1 = faster) or a scroll-linked expression.
- **Linear in scroll → pure CSS.** Transform or opacity motion that is linear in scroll compiles to CSS scroll-driven animations (`animation-timeline: scroll()` or `view()`), which the browser runs with **no JavaScript as you scroll**.
  - Support: Chrome 115+ and Safari 26+. Firefox has them only in preview builds.
  - Fallback: one passive scroll listener that writes only transforms, inside the frame loop.
- **Non-linear or linked → precomputed keyframes.** These are sampled across the input range at the layout stage and attached to a ScrollTimeline or ViewTimeline through the Web Animations API (same support as above).
- **Rules:**
  - body text stays at rate 1 by default
  - the engine never takes over scroll speed or direction
  - reduced motion sets every rate to 1

### 10.5 Data-driven transitions: the page transforming itself

1. The host sets data (`frame.set('data.round', 4)`), or the route changes.
2. The layout-stage subgraph re-solves, producing a new scene.
3. Items are matched by stable id.
4. Matched items tween their **parameters** (station, phase, radius, colour role), not their points.
   - Counts grow or shrink by giving new lines width from zero.
   - New items grow from their parent's station; removed items shrink into it.
   - Topology changes cross-fade.
5. When the transition finishes, the new scene is static again, and the engine goes idle.

This is the same scene → diff → tween loop isidex's surface already uses.

### 10.6 Accessibility

- Every motion has a mandatory reduced form.
- Time-based motion is event-triggered and lasts under 5 seconds, which stays clear of WCAG 2.2.2.
- Scroll motion is user-driven.
- A "still engraving" toggle is available.
- No flashing.
- Decorative layers are `aria-hidden`, and native focus rings are always kept.

---

## 11. Layout and room

These are specified in frame-engine.md §4 and §8.

**The frame is the layout.**

- Datums become CSS grid lines, and openings become slots for real HTML.
- Width flows down and measured content heights flow up, so a width never depends on a height.
- The first layout comes from compiled CSS.

**Room.**

- Width classes choose the plan.
- Each member's room level, z = log_φ(size / sRef), chooses its variant.
- Variants switch with hysteresis, and designed reduction ladders say what simplifies first.

The same room mechanism serves as **level of detail** for dense scenes (fewer, simpler items when small) and later for maps.

---

## 12. Renderers

| Renderer | Good at | Limits | Status |
|---|---|---|---|
| DOM / CSS | layout, text, tokens, simple borders, card corners, scroll and time animations | complex geometry | core |
| SVG | crisp static frames; a few dozen live paths | hundreds to low thousands of elements changing per frame | core |
| Canvas 2D | tens of thousands of simple shapes redrawn per frame | no DOM; redraws whole layers; simple text | when a host needs it |
| WebGL 2 | hundreds of thousands of formula-driven points and ribbons | hairlines and text need special techniques | future ([GPU idea](future-ideas.md)) |
| WebGPU | computation: simulations, relationships, per-pixel analytic curves | not on every Firefox platform yet | future |

All renderers draw from the same scene interface. A layer can declare a preferred renderer, or the compiler chooses one by item counts.

---

## 13. Performance plan

### 13.1 Budgets

These are targets, measured from Phase 1.

| Metric | Target |
|---|---|
| First paint of the frame | from HTML + CSS + static SVG alone, with no JavaScript |
| Runtime JavaScript, static frame | 0 KB |
| Runtime JavaScript, typical animated frame | ≤ ~40 KB gzip (core + SVG + DOM + the executors used) *(assumption)* |
| Layout re-solve on resize | ≤ 2 ms mid-century, ≤ 8 ms Victorian, on a mid-range phone |
| Moment work per frame | ≤ 1–2 ms on the main thread; ideally zero (CSS or compositor) |
| SVG elements written per frame | ≤ ~100 |
| Layout shift caused by the frame | 0 |
| CPU while idle | 0 (the loop is asleep) |

### 13.2 Measurement

- **Automated checks** on every change: bundle size, solve times, element counts, layout shift, golden snapshots.
- **Hardware:** checks run on a throttled mid-range phone profile, with real-device spot checks each phase.
- **Benchmark:** the renderer benchmark built during design becomes `cli bench`.
- **Studio cost meter:** per-frame cost while you design.

### 13.3 Browser support and fallbacks

| Feature | Support (checked 2026-10-10) | Fallback |
|---|---|---|
| CSS scroll-driven animations / ScrollTimeline | Chrome 115+, Safari 26+; Firefox preview only | passive scroll listener writing transforms |
| `scheduler.postTask` | Chrome, Firefox 142+; not Safari | yield with MessageChannel or setTimeout |
| `requestIdleCallback` | Chrome, Firefox; Safari behind a flag | same as above |
| OffscreenCanvas | Chrome, Firefox, Safari 16.4+ | draw on the main thread |
| WebGL 2 | all (Safari 15+) | Canvas 2D at a lower room level |
| WebGPU | Chrome, Safari 26; Firefox partial | WebGL 2 |
| Same-document View Transitions | all three engines | instant swap |

---

## 14. The Studio (Frame Lab)

The Studio is specified in frame-engine.md §10.

- It runs **the same core** in live mode. Gestures write relationships, never coordinates.
- It shows **stage badges**, the **executor** of every motion and a **per-frame cost meter**, so performance is visible while you design.
- Motion is edited on the **unrolled track lane**, alongside profile strata and punctuation rhythm.
- **Hosts preview live:** the portfolio and the game open in side panes and hot-reload from Studio saves.
- **Compile preview** shows what will ship: the artifacts, their sizes and the budget report.
- It is plain TypeScript, dev-only and never shipped.

---

## 15. Walkthrough: a page's life

1. **Build.** The compiler bakes the Victorian frame and emits CSS, static SVG and a runtime plan. The budget report passes.
2. **Request.** The HTML arrives with the frame CSS and static SVG inline. The browser paints the layout and the frame immediately, before any JavaScript runs.
3. **Start.** The small runtime loads, reads `dpr` and reduced motion (load stage), and measures content heights. It corrects the few solved parts (a repaint only), then sleeps.
4. **Resize.** The layout-stage subgraph re-solves in a few ms. Variants switch with hysteresis, and only the changed attributes are written. Then it sleeps.
5. **Scroll.** Per-box speeds and view-linked motion run as CSS scroll-driven animations with no JavaScript. Firefox uses the fallback loop.
6. **Route change.**
   1. Content swaps in a view transition, with the frame excluded from the snapshot.
   2. The frame re-solves for the new content height.
   3. The courier arrow runs its track on the compositor and the conveyor advances.
   4. The engine sleeps.
7. **Game state (city game).** The host sets `data.round`. The scene re-solves, matched items tween their parameters, and the engine sleeps.
8. **Idle.** Nothing runs.

---

## 16. How each project uses it

- **Portfolio (Victorian).**
  - A TypeScript site shell: router, signals, and `mount()` at the root.
  - The frame is the layout, and its CSS and static SVG are inlined in the HTML.
  - Motion runs on section change, and scroll speeds are tuned per box.
  - Supabase content fills the slots.
- **City guessing game (mid-century).**
  - The game owns the gameplay UI; the engine frames its screens.
  - Game state flows in through `set('data.…')` and drives transitions (rounds, scores).
  - Mass effects can arrive later with the GPU backend.
- **Isidex.**
  - The engine supplies the DOM/SVG frame around isidex's regl canvas, and shares skins, curves and room levels.
  - It follows isidex's clock through `MountOptions.clock`.
  - A shared GPU layer is a future decision.
- **Maps.** A separate engine on the same core ([future-ideas.md §2](future-ideas.md)).

---

## 17. Packages, repositories and the site shell

```
engine/
  lang/        documents, schema, expression parser, types, stage inference
  compiler/    bake, anchor pre-solve, runtime plan, motion routing, emitters, reports
  core/        scene, evaluator (signals + bulk arrays), scheduler, inputs, diff
  curves/      curve families, fitting, offsets, outlines, line families
  layout/      frame-as-layout planner, room and variants
  motion/      timelines, links, executors (CSS, compositor, paint, runtime)
  render/      dom, svg, canvas   (webgl, webgpu: future)
  host/        mount(), <frame-elevation>, host contract, static mode
  studio/      Frame Lab (dev only)
  cli/         build, render at sizes, contact sheets, benchmarks
```

This replaces the folder layout in frame-engine.md §7.1. Lint rules enforce the boundaries: `core` never imports a renderer or the Studio, and the Studio never ships.

- **Repository.** Design docs live in Parsiva/Eloi. Code starts as `engine/` inside the portfolio repo and moves into Eloi, published as packages, when the city game adopts it. Two real users come before generalising.
- **Site shell.** The portfolio becomes a TypeScript site (frame-engine.md §12.5). The build inlines the frame's CSS and static SVG into the HTML.

---

## 18. Build order

The milestones (M0–M9) are defined in frame-engine.md §13. Here they are grouped into phases, with motion moved earlier because it is central to the vision.

| Phase | Contains | Visible result | Why here |
|---|---|---|---|
| **1 Foundation** | M0, the language and compiler skeleton, automated budget checks, `cli bench` | `npm run frame:build` emits CSS and static SVG for the mid-century moulding at three widths, with a budget report | the compiler and the budgets shape everything after |
| **2 Live shell** | M1, M2, and the TypeScript site shell (the Vue shell is retired and pages are ported over time) | the portfolio running in TypeScript with the frame as its layout; Studio v0 edits stripes and ratios | the engine meets a real host early |
| **3 Two styles** | M3, M3b, M4 | mid-century complete; the drawn-motif Victorian on the portfolio; thresholds | proves the structure is style-agnostic |
| **4 Motion** | M8, moved up: timelines, compositor tracks, scroll-driven per-box speeds, route transitions, the data channel | chevrons and arrows run on route change; boxes scroll at designed speeds | central to the vision; straight tracks don't need the curve kernel |
| **5 Curves** | M5, M6 | the clothoid/golden kernel; the constructed Victorian; the dart rides the garland; rule animation (unfurl) | needs the kernel |
| **6 Second host** | the city game adopts the engine; the engine moves to its own repo; M7 styles | the game's screens framed and reacting to game state | two real users before generalising |
| **Future** | the GPU backend, isidex integration, the map engine | — | when a host needs them ([future-ideas.md](future-ideas.md)) |

**Estimate** *(assumption)*: Phases 1–5 take about the frame-engine estimate (4–5 months part-time) plus about a month for the compiler and site-shell work. Phase 6 depends on the game.

---

## 19. Risks

| Risk | How the design handles it |
|---|---|
| **A platform before a product** | every phase ships into a real host; extraction only with two users; GPU deferred |
| **Compiler complexity** | partial evaluation is just the same interpreter run early; start with an interpreted plan and add code generation only if profiling demands it |
| **Stage mistakes** | inference, the validator, Studio badges, automated budgets |
| **Browser gaps** | the fallback table (13.3); test all three engines each phase |
| **JS vs GPU precision** (future) | reduce ranges on the CPU (for example, angles mod 2π, as the benchmark needed); tolerance tests |
| **Motion overuse or motion sickness** | reduced forms are mandatory; text at scroll rate 1; time-based motion under 5 s |
| **Studio scope creep** | panels generated from the node-type registry; each panel arrives with its feature |
| **Review burden** (AI-written maths) | small pure modules, closed-form tests, golden snapshots |

---

## 20. Decisions

Each decision has a default, so work can start before you decide.

| # | Question | Default |
|---|---|---|
| 1 | Engine name and package scope | **decided: Eloi** (repo Parsiva/Eloi); package scope still open, decide before publishing packages (Phase 6) |
| 2 | Motion before curves (Phase 4 before 5)? | **yes** |
| 3 | Move the engine to its own repo when the city game adopts it? | **yes** |
| 4 | Portfolio prerendering | **inline the frame CSS and SVG in the app shell first**; full static generation of pages with content later, if wanted |
| 5 | How hosts pass data | **`set()` backed by signals**; an event bus only if a host needs one |
| 6 | Default style scope | **CSS cascade layers**; shadow DOM as an option |

Still pending from the frame design: two-ribbon twist or plait, a bottom garland, the flame's growth rate and leaf sizing (frame-engine.md §15).
