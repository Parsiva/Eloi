# Eloi

Eloi generates a bespoke frame for each screen. A frame is a graph: decorations are nodes placed by relationships, starting from the four screen corners; lines leave and meet nodes under rules (expressions such as `amp * sin(tau * n * t)`); content inhabits the openings the frame leaves and the page does not scroll. Read `docs/design/frame-graph.md` first. The engine is source-only TypeScript; the sandbox is a dev-only Vite site.

Do not treat this as a layout framework. The frame comes first and is never sized by content. An earlier box-layout engine (`engine/src/frame.ts`, `layout/`, `draw/`, the sandbox benches, `/layout.html`) is still present but is not the direction.

## Layout

- `engine/`: `@eloi/engine`. `src/graph/` is the frame graph (expressions, solver, node glyphs, `mountGraph`); the rest is the older box-layout engine. Vitest tests
- `editor/`: `@eloi/editor`, the dev-only editors (x-ray overlay, popup cards; `graph.ts` for frame graphs) and the Vite plugin that saves frame files
- `sandbox/`: `@eloi/sandbox`. `site.html` is the site in its frame (`frames/parkington.json`); `index.html` is the older test benches
- `docs/`: design docs (start at `docs/design/system.md`), research, references
- `sites/portfolio/`: the old Vue site, reference only (and the source of assets). Do not edit it.

There is no compiler yet.

## Commands

Node 22+ required. Run from the repo root.

- `npm install`
- `npm run dev`: sandbox at http://localhost:5180; `/site.html` is the page with the editor
- `npm run view`: the same page clean at http://localhost:5181, live-updated from `sandbox/frames/*.json`
- `npm test`: engine and editor tests (Vitest)
- `npm run typecheck`
- `npm run build`
- `npm run check`: typecheck, test and build together

## Code style

- TypeScript, no semicolons, 2-space indent
- Plain, concise comments
- Keep changes minimal and match the surrounding code
- Docs: plain prose, no emojis

## Notes

- Do not edit `sites/portfolio/`; copy what you need into `sandbox/` instead.
- Design decisions live in `docs/design/system.md` §20.
- Frame files are JSON and are rewritten by the editor's formatter (`editor/src/format.ts`); change them through it or by hand in the same style.
