# Content snapshot

Copied from `sites/portfolio` on 2026-10-13 so the benches have real text and art. These are copies: the portfolio's own files are unchanged.

| Here | From `sites/portfolio/` |
|---|---|
| `projects.js` | `src/data/projects.js` (image paths point at files the portfolio doesn't have yet) |
| `marginalia.js` | `src/data/marginalia.js` (the seed entries; the live ones are in Supabase) |
| `articles/*.md` | `src/articles/` |
| `ornaments/hand-drawn.svg`, `.json` | `src/ornaments/` (the sprite and its manifest: pieces, hulls, sockets) |
| `ornaments/source/websiteVectorOutline.svg` | `src/ornaments/source/` (the traced Victorian drawing the sprite is cut from) |
| `ornaments/source/websiteOutline.svg` | `docs/references/hand-drawn/midcentury-frame-trace.svg` (the mid-century trace) |

`public/fonts/OldLondon.ttf`, `public/paper/paper-tile-light.webp` and `public/favicon.ico` come from the portfolio's `public/`.

To regenerate the sprite after re-exporting the drawing, run `npm run ornaments` in `sites/portfolio` and copy the two outputs here. The cutting script moves into the engine's tooling when the Specimens bench is built.
