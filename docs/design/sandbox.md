# Eloi sandbox: a test bench for the engine

**Status:** S0–S3 and the Skins and Motion benches built (2026-10-14); see §7 · **Date:** 2026-10-12

The sandbox is a dev-only website inside this repo for building and testing Eloi. It is the engine's **first host**. The rebuilt portfolio is the second, and the city game and isidex come after. It is a permanent lab, not a draft of the portfolio. Keeping it separate means the host contract gets tested the same way every real host will use it.

Grounding: [system.md](system.md) (the whole system), [frame-engine.md](frame-engine.md) (the frame layer) and [research/08](../research/08-framework-internals.md) (the box contract).

---

## 1. What changed and why

The earlier plan ([system.md §17](system.md)) started the engine as `engine/` inside the portfolio and moved it here once a second host adopted it. The refined idea is broader: **the frame gives you distinct boxes, and each box can hold its own content or runtime**. A plain HTML column, a regl diagram (isidex) and a WebGL/WebGPU map (the city game) are all just boxes. Proving that needs boxes the portfolio doesn't have, such as a GPU box, a box that fails, and a box that starts late. The sandbox supplies them without putting the live site at risk.

| Decision | Choice |
|---|---|
| Where the code lives | **This repo**: `engine/` and `sandbox/` sit beside `docs/` |
| The sandbox's long-term role | **A permanent test bench**. The real portfolio is a separate host. |
| First style | **Victorian chronicle**: straight rings plus drawn ornaments from the sprite. Curves come later (M5–M6). |
| First GPU box | **A small WebGL2 toy**. It exercises size, clock, visibility and dispose without depending on isidex. |

---

## 2. Layout

```
Eloi/
  engine/              the Eloi code (one package to start; folders follow system.md §17)
    layout/            frame spec → grid lines, boxes, rects (pure functions, no DOM)
    frame/             drawing the frame: rings, hatching, ornaments placed at sockets
    boxes/             the box contract: mount, lifecycle, size and visibility, error isolation
    host/              mount(), <frame-elevation>, scheduler, clock
  sandbox/             Vite + TypeScript, no UI framework
    benches/           one page per idea being proven (§3)
    devpanel/          overlays, width scrubber, per-box stats
    content/           a local snapshot of portfolio data and assets (§5)
  sites/portfolio/     the existing Vue site, kept as reference and the source of assets
  docs/
```

**Tooling:** Vite, TypeScript, `@preact/signals-core`, the Navigation API (with a thin History fallback), and Vitest for `engine/layout` and `engine/frame`. Playwright screenshots at fixed widths come later as the golden snapshots in system.md §13.

---

## 3. Benches

Each bench is a route in the sandbox that proves one thing. The dev panel is on every bench.

| Bench | Proves | Done when |
|---|---|---|
| **Grid** | A frame spec becomes a CSS grid with named boxes; width flows down and height flows up | Scrubbing 768 → 2560 never jumps or loops (narrower widths only need to not break); overlays show datums, bays and boxes; the room level of each box is shown live |
| **Boxes** | The box contract ([research/08](../research/08-framework-internals.md), "Proposed box contract") | One frame holds: a static HTML box (no JS), a DOM box with live data, a WebGL2 canvas box, a box that starts when scrolled into view, and a box that throws and shows its fallback while the others keep working, and two boxes that talk to each other through the frame. Disposing the frame leaves no listeners, observers or GL contexts. |
| **Skins** | Structure and style are separate | The same frame spec drawn as the Victorian chronicle and as mid-century moulding (from `websiteOutline.svg`) |
| **Motion** | Changing route animates the frame, not the content | Route changes diff boxes by stable id; shared boxes update in place; chevrons run along a straight track; reduced motion works |
| **Chronicle** | A real page | The newspaper layout from the [Victorian reference](../references/README.md) (masthead, dateline band, columns at about 1 : 3.5 : 1, an "Upcoming projects" band) filled with real portfolio content |
| **Specimens** | The ornament sprite | The portfolio's `/dev/ornaments` page ported: every piece, its hull and its sockets at several scales |

**Dev panel:** a width scrubber (the bench renders in a resizable iframe, so container and viewport widths both change), overlay toggles (datums, bays, boxes, sockets, hulls), and per-box stats (state, size, mounts, frames drawn, last solve in ms). Performance stays visible from day one (principle 10).

---

## 4. Build order

The sandbox steps come first. After them, the existing milestones (frame-engine.md §13) continue, each growing out of a bench rather than the live site.

| Step | Contains | Visible result |
|---|---|---|
| **S0 Scaffold** | Vite + TS sandbox, router, bench index, empty dev panel; assets and content snapshot copied in | `npm run dev` opens the bench index in the Victorian theme. **Done.** |
| **S1 Grid** | A hand-written frame spec (a TypeScript object; no compiler yet) → CSS grid; `frameEngine.ts` rings ported to draw over it | Grid bench with scrubber and overlays |
| **S2 Boxes** | Box contract v0: static, DOM and canvas boxes; lifecycle; per-box errors; one shared ResizeObserver and IntersectionObserver; a frame clock with on-demand frames | Boxes bench passes its "done when" |
| **S3 Chronicle** | Real content in the newspaper layout; drawn medallion corners and the crest placed from the sprite's sockets | Chronicle bench |
| **Then** | M0 compiler skeleton (the spec becomes a document the compiler reads), M2 Frame Lab v0, M4 thresholds, M8 motion | as in frame-engine.md §13 |

The portfolio is rebuilt on the engine once S3 is solid. That is when the Vue site is retired (frame-engine.md §12.5).

---

## 5. What comes from the portfolio

| Bring | From `sites/portfolio/` | Use |
|---|---|---|
| Fonts | `public/OldLondon.ttf` (blackletter masthead); Libre Baskerville, Source Sans Pro (named in theme) | Chronicle typography |
| Paper | `public/paper-tile-light.webp` (450 KB). Skip `paper-bg.webp` (3.5 MB) until it is compressed. | Page ground |
| Ornaments | `src/ornaments/hand-drawn.svg` + `.json` (pieces, hulls, sockets), `source/websiteVectorOutline.svg`, `scripts/cut-ornaments.mjs` | Drawn Victorian members; Specimens bench |
| Frame drawing | `src/frames/frameEngine.ts`, `frameSettings.ts` (rings, gaps, hatching, corner pieces) | Starting point for `engine/frame`; the measure-and-redraw wrapper in `Frame.vue` is what Eloi replaces |
| Theme | `src/styles/theme.css` tokens (`--ink`, `--paper`, `--gutter`, fonts) | The Victorian skin's first tokens |
| Content | `src/data/projects.js`, `src/data/marginalia.js`, `src/articles/*.md` | Real text in the boxes, as a static snapshot |

**Left behind:** Vue, vue-router, Supabase (auth, profiles, live marginalia), the admin pages, TipTap and Tailwind. The sandbox never talks to a backend. A "live data" box simulates latency and failure locally.

---

## 6. Open questions

Answered on 2026-10-13:

| # | Question | Answer |
|---|---|---|
| 1 | Phone layout for the chronicle | **Deferred.** Phones are not first-class users of the site. They will probably get a completely different rendering rather than a squeezed frame. Until then, benches are designed for tablet widths and up (768 → 2560), and below that only "nothing breaks" is checked. |
| 2 | The canvas box's size rule (fixed aspect, fill its row, or viewport height minus frame) | **Deferred.** The canvas box fills its grid cell for now. |
| 3 | Can boxes talk to each other? | **Yes.** Boxes can share values and send each other events. They do it through the frame they live in (frame-scoped signals and typed events), never through globals, so disposing a frame removes every link. The Boxes bench includes two boxes talking. |
| 4 | Map engine scope in the game | **Later**, when the game starts. |

---

## 7. What was built, and what it taught

Built 2026-10-14 on branch `sandbox-s0`. Every bench in §3 exists and was checked in the browser.

| Bench | Checked |
|---|---|
| Grid | Plans switch by class with hysteresis (760 px stays medium); m interpolates; no ResizeObserver loop warnings across 360–2560 |
| Boxes | Ledger → detail → rosette talk through a channel and events; a broken clock leaves the others live; the late box mounts on scroll; dispose takes every live count to zero and removes all engine DOM; remount restores everything |
| Chronicle | The Victorian frame with the owner's medallions, flames, crest, side leaves, lattice, beads, cartouche and tailpiece around real content |
| Specimens | Pieces with hulls and sockets; tiles fitted to whole counts |
| Skins | Victorian ↔ mid-century on one structure; all 7 openings keep their DOM nodes |
| Motion | Route changes are box diffs (main mounted once, sides mount and dispose); the marker travels to the active station; the back button works; reduced motion stops the conveyor |

**Engine decisions made while building** (worth folding into system.md):

1. **Openings are engine-owned grid items; host content moves into them.** Each split is its own CSS grid, so nested rows in one column never stretch another column (one flat grid can't do that with `auto` rows). Datum names are still written on every grid line.
2. **`when: 'visible'` means in the viewport; `ctx.visible` also needs the page shown.** Mounting is about the layout; animation is about someone watching.
3. **The first plan is built synchronously in `mount()`,** and the scheduler uses a timer while the page is hidden. Otherwise a frame opened in a background tab stays empty.
4. **Structure changes wait for the next frame; drawing doesn't.** Inside a ResizeObserver callback the frame measures and draws at once (no lag), but writes that change layout (plan, `--m`) are deferred, so the observer never loops.
5. **Sprite line weight is a hair, not a scale.** `--eloi-weight` multiplies the drawing's stroke widths so a medallion keeps ~0.9 px lines at any size (frame-engine.md §3.1).
6. **Knockouts are a mask, not a paper-coloured fill,** so the paper texture shows through where a motif hides the rules.
7. **Route updates run inside the view transition** (`setRoute(route, during)`), so the "before" snapshot is the old state.

**Not done yet:** the compiler (specs are TypeScript objects, so first paint still needs JavaScript); per-box scroll speeds; curve members (M5–M6); Playwright snapshots; the phone rendering (deferred, §6).
