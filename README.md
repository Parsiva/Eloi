# Eloi

Eloi is a computational drawing engine for frames. You describe a drawing as functions and relationships: dominant curves first, then everything else relative to them. A compiler bakes everything that doesn't depend on the live page, and a small runtime does only what is left. Each change goes to the cheapest place the browser offers: CSS, the compositor, paint, script, and later the GPU.

The frame is also the layout. Its lines compile to a CSS grid, and real responsive HTML flows into its openings. Motion animates the rule rather than the points: chevrons run along tracks, per-box scroll speeds apply, and transitions are driven by data.

One engine serves several hosts and styles:

| Host | Style |
|---|---|
| Portfolio site | Victorian engraving |
| City guessing game | mid-century flat-colour mouldings |
| isidex | framing around the app (later) |

**Status:** S0 of the [sandbox plan](docs/design/sandbox.md) is done (the sandbox runs; the engine is still empty). Code lives here as `engine/`, built and tested in `sandbox/`, a dev-only test-bench site ([plan](docs/design/sandbox.md)). The current Vue portfolio is in `sites/portfolio/` as reference and the source of assets.

## Read

1. **[docs/design/system.md](docs/design/system.md)**: the whole system (stages, compiler, scene, scheduler, executors, motion, host contract, packages, phases, decisions). Start here.
2. [docs/design/frame-engine.md](docs/design/frame-engine.md): the frame layer in detail ("Elevations"): vocabulary, document format, Frame Lab, thresholds, milestones.
3. [docs/design/sandbox.md](docs/design/sandbox.md): the sandbox, where the engine is built first.
4. [docs/design/future-ideas.md](docs/design/future-ideas.md): parked ideas (GPU engine, map engine), each with its trigger.
5. [docs/research/](docs/research/README.md): 71 case studies and measurements of the hand-drawn ornament.
6. [docs/design/background/](docs/design/README.md): gap studies, the curve catalog, five competing proposals and the judges' reviews.
7. [docs/references/](docs/references/README.md): the AI-generated reference images, the scan of the pencil sketch and the mid-century frame trace. They are inspiration, not specs.

## Run the sandbox

```sh
npm install
npm run dev        # the sandbox at http://localhost:5180
npm test           # engine tests (Vitest)
npm run typecheck
```

The sandbox (`sandbox/`) is a dev-only test-bench site with one page per idea being proven; press ` to toggle its dev panel. The engine (`engine/`) is source-only TypeScript that the sandbox imports directly. Plan and status: [docs/design/sandbox.md](docs/design/sandbox.md).

## Sites

- **[sites/portfolio/](sites/portfolio/)**: the portfolio blog (Parkington Programs Studio) as it stood on 2026-10-11. It is Vue 3 + Vite + Supabase with the old SVG frame engine (`src/frames/`) and the hand-drawn ornament sprite (`src/ornaments/`). It is reference and the source of assets for the [sandbox](docs/design/sandbox.md); it will be rebuilt on the engine as Eloi's second host. To run it: `cd sites/portfolio && npm ci && npm run dev`. Content needs a `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; it is not committed. Its git history stays in [Parsiva/ParkingtonPrograms](https://github.com/Parsiva/ParkingtonPrograms).

## Source art

The hand-drawn ornament and the sprite cut from it are in [sites/portfolio/src/ornaments/](sites/portfolio/src/ornaments/). The cutter is `sites/portfolio/scripts/cut-ornaments.mjs` (`npm run ornaments`). The analysis scripts in `docs/research/analysis/` read the sprite from there.
