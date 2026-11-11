# Eloi

Eloi is a computational drawing engine for frames: drawings are functions and relationships, and the frame doubles as the page layout. The engine is source-only TypeScript; the sandbox is a dev-only Vite test-bench site that proves it, one bench per idea.

## Layout

- `engine/`: `@eloi/engine`, the engine source (layout, frame drawing, boxes, scheduler) with Vitest tests
- `editor/`: `@eloi/editor`, the dev-only frame editor (x-ray overlay, popup cards) and the Vite plugin that saves frame files
- `sandbox/`: `@eloi/sandbox`, the Vite test-bench site that imports the engine directly
- `docs/`: design docs (start at `docs/design/system.md`), research, references
- `sites/portfolio/`: the old Vue site, reference only (and the source of assets). Do not edit it.

There is no compiler and no curve code yet.

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
