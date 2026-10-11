# Eloi

Eloi is a computational drawing engine for frames. You describe a drawing as functions and relationships: dominant curves first, then everything else relative to them. A compiler bakes everything that doesn't depend on the live page, and a small runtime does only what is left. Each change goes to the cheapest place the browser offers: CSS, the compositor, paint, script, and later the GPU.

The frame is also the layout. Its lines compile to a CSS grid, and real responsive HTML flows into its openings. Motion animates the rule rather than the points: chevrons run along tracks, per-box scroll speeds apply, and transitions are driven by data.

One engine serves several hosts and styles:

| Host | Style |
|---|---|
| Portfolio site | Victorian engraving |
| City guessing game | mid-century flat-colour mouldings |
| isidex | framing around the app (later) |

**Status:** design only. Nothing is built yet. Code will start as `engine/` inside the portfolio and move here when a second host adopts it.

## Read

1. **[docs/design/system.md](docs/design/system.md)**: the whole system (stages, compiler, scene, scheduler, executors, motion, host contract, packages, phases, decisions). Start here.
2. [docs/design/frame-engine.md](docs/design/frame-engine.md): the frame layer in detail ("Elevations"): vocabulary, document format, Frame Lab, thresholds, milestones.
3. [docs/design/future-ideas.md](docs/design/future-ideas.md): parked ideas (GPU engine, map engine), each with its trigger.
4. [docs/research/](docs/research/README.md): 71 case studies and measurements of the hand-drawn ornament.
5. [docs/design/background/](docs/design/README.md): gap studies, the curve catalog, five competing proposals and the judges' reviews.

## Sites

- **[sites/portfolio/](sites/portfolio/)**: the portfolio blog (Parkington Programs Studio) as it stood on 2026-10-11. It is Vue 3 + Vite + Supabase with the old SVG frame engine (`src/frames/`) and the hand-drawn ornament sprite (`src/ornaments/`). It is the first host Eloi will replace from the inside out. To run it: `cd sites/portfolio && npm ci && npm run dev`. Content needs a `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; it is not committed. Its git history stays in [Parsiva/ParkingtonPrograms](https://github.com/Parsiva/ParkingtonPrograms).

## Source art

The hand-drawn ornament and the sprite cut from it are in [sites/portfolio/src/ornaments/](sites/portfolio/src/ornaments/). The cutter is `sites/portfolio/scripts/cut-ornaments.mjs` (`npm run ornaments`). The analysis scripts in `docs/research/analysis/` read the sprite from there.
