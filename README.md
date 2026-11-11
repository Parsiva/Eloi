# Eloi

Eloi is a computational drawing engine for frames. You describe a drawing as functions and relationships: dominant curves first, then everything else relative to them. A compiler bakes everything that doesn't depend on the live page, and a small runtime does only what is left. Each change goes to the cheapest place the browser offers: CSS, the compositor, paint, script, and later the GPU.

The frame is also the layout. Its lines compile to a CSS grid, and real responsive HTML flows into its openings. Motion animates the rule rather than the points: chevrons run along tracks, per-box scroll speeds apply, and transitions are driven by data.

One engine serves several hosts and styles:

| Host | Style |
|---|---|
| Portfolio site | Victorian engraving |
| City guessing game | mid-century flat-colour mouldings |
| isidex | framing around the app (later) |

**Status:** the direction changed on 2026-11-10. A frame is now a graph: decorations are nodes placed by their relationships, starting from the four corners of the screen; lines leave one node and are received by another, shaped by rules; content lives in the openings the frame leaves, and the page does not scroll. This is built in `engine/src/graph/` with a first placeholder frame and an editor ([docs/design/frame-graph.md](docs/design/frame-graph.md)). The earlier box-layout engine and its six sandbox benches are still in the repo. There is no compiler yet. The current Vue portfolio is in `sites/portfolio/` as reference and the source of assets.

## Read

1. **[docs/design/frame-graph.md](docs/design/frame-graph.md)**: the frame graph, the current model. Start here.
1. [docs/design/system.md](docs/design/system.md): the whole system as first planned (stages, compiler, scene, scheduler, executors, motion, host contract, packages, phases, decisions).
2. [docs/design/frame-engine.md](docs/design/frame-engine.md): the frame layer in detail ("Elevations"): vocabulary, document format, Frame Lab, thresholds, milestones.
3. [docs/design/sandbox.md](docs/design/sandbox.md): the sandbox, where the engine is built first.
4. [docs/design/future-ideas.md](docs/design/future-ideas.md): parked ideas (GPU engine, map engine), each with its trigger.
5. [docs/research/](docs/research/README.md): 71 case studies and measurements of the hand-drawn ornament.
6. [docs/design/background/](docs/design/README.md): gap studies, the curve catalog, five competing proposals and the judges' reviews.
7. [docs/references/](docs/references/README.md): the AI-generated reference images, the scan of the pencil sketch and the mid-century frame trace. They are inspiration, not specs.

## Run the sandbox

Needs Node 22+ (the dev machine uses Homebrew: `brew install node`).

```sh
npm install
npm run dev        # the sandbox at http://localhost:5180
npm test           # engine tests (Vitest)
npm run typecheck
npm run build
```

## Edit a frame live

```sh
npm run dev        # the editing server: open http://localhost:5180/site.html
npm run view       # the clean view of the same page: http://localhost:5181
```

The site page is one screen: the frame is generated for the window from `sandbox/frames/parkington.json` and redrawn when the window changes size, and the content scrolls inside its openings.

On the editing server the page has the editor (`editor/`) attached. Press **X** for the x-ray: nodes are amber, with a dotted link to what each is measured from; leading lines are dashed cyan; openings are pink. Click anything for a floating card with its placement, rule and look, and drag a node to move it. The toolbar opens the frame's parameters, its rules, and a list of everything in it. Every change is applied at once, saved to the JSON file, and appears on the clean view without a reload. Undo is ⌘Z. To show the view on another device, run `npm run view -- --host`. The editor is loaded only by the dev server and is not in a production build.

The earlier box-layout version of the page, with its own editor, is at `/layout.html`.

The sandbox (`sandbox/`) is a dev-only test-bench site with one page per idea being proven; press ` to toggle its dev panel. The engine (`engine/`) is source-only TypeScript that the sandbox imports directly. Plan and status: [docs/design/sandbox.md](docs/design/sandbox.md).

## Sites

- **[sites/portfolio/](sites/portfolio/)**: the portfolio blog (Parkington Programs Studio) as it stood on 2026-10-11. It is Vue 3 + Vite + Supabase with the old SVG frame engine (`src/frames/`) and the hand-drawn ornament sprite (`src/ornaments/`). It is reference and the source of assets for the [sandbox](docs/design/sandbox.md); it will be rebuilt on the engine as Eloi's second host. To run it: `cd sites/portfolio && npm ci && npm run dev`. Content needs a `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; it is not committed. Its git history stays in [Parsiva/ParkingtonPrograms](https://github.com/Parsiva/ParkingtonPrograms).

## Source art

The hand-drawn ornament and the sprite cut from it are in [sites/portfolio/src/ornaments/](sites/portfolio/src/ornaments/). The cutter is `sites/portfolio/scripts/cut-ornaments.mjs` (`npm run ornaments`). The analysis scripts in `docs/research/analysis/` read the sprite from there.
