# Future ideas

Ideas the design deliberately leaves room for but does not build yet. Each one has a **trigger**: the condition under which to pick it up. See [system.md](system.md) for how they fit the whole system.

---

## 1. GPU engine (WebGPU, with a WebGL 2 fallback)

**Trigger:** a host needs mass motion, such as:

- thousands of nodes moving at once
- weaves flowing across a whole page
- a shared GPU layer with isidex, which already draws with regl (WebGL)

**What it is:** a renderer backend for the engine (`engine/render/webgpu`, `engine/render/webgl`). It comes with a code generator that compiles the engine's expression language into GPU shader code: WGSL for WebGPU, GLSL for WebGL. It is not a general 3D engine. The rest of the engine stays the same: the GPU backend draws the same scene other renderers draw.

### How functions become pixels without thinking in triangles

1. **A formula per point** (vertex shader). Each node's constants are uploaded to the GPU once. Each frame sends only a few numbers (time, scroll, progress), and the GPU evaluates `position = f(node, time)` for every node in parallel. The renderer benchmark built during design (200,000 nodes, with JavaScript sending only the time) works this way.
2. **A formula per pixel** (fragment shader with distance functions). The GPU draws a rectangle, and for each pixel it asks how far that pixel is from the curve, then inks it accordingly. Curves stay crisp at any zoom, straight from the math. This suits guilloché, rosettes and hairlines. Cost grows with pixels × curves, so each curve gets its own small bounding box.
3. **A formula as computation** (WebGPU compute shaders). The math itself runs on the GPU (simulations, relationships, layout forces), and then it is drawn.

### Difficulty

Estimates assume part-time work with AI help.

| Piece | Difficulty | Rough time |
|---|---|---|
| Setup and plumbing (device, buffers, pipelines, resizing) | easy–moderate | ~1 week |
| Function-driven nodes (the benchmark on WebGPU) | easy | days |
| Compute passes (forces, relationships, data transitions) | moderate | 1–3 weeks |
| Expression language → shader code generator | moderate | 1–2 weeks |
| **Beautiful lines:** crisp hairlines, variable width, joins, line families | **hard (the real risk)** | 1–2 months |
| Text on the GPU | hard | avoid: keep text in HTML |
| Robustness: fallbacks, lost device, browser differences, tests | moderate, ongoing | — |

**Total for a focused engine: roughly 2–4 months part-time.** A general engine (like three.js) is years of team work and is not the goal.

### Why the hard parts are hard

- **GPUs draw triangles, not nice lines.** Thin and thick lines, swelling widths and clean joins must be built from triangles or computed per pixel. This is research-level territory, and the engraved aesthetic depends on it.
- **Precision.** GPUs use 32-bit numbers and JavaScript uses 64-bit. The benchmark hit this: `node × golden angle` grows too large for a GPU float, so the angle is reduced (mod 2π) on the CPU first. Ranges must be reduced before upload.
- **Blind debugging.** A mistake often shows a blank screen with no error. Visual snapshot tests are essential.
- **Two backends for a while.** WebGPU ships in Chrome, Safari 26 and Firefox, but not yet on every Firefox platform (checked 2026-10-10), so a WebGL 2 fallback is needed.
- **Parallel thinking.** GPU threads run independently, so "child follows parent" becomes ordered passes, the way games animate skeletons.

### Libraries to lean on (checked 2026-10-10)

- **TypeGPU** (Software Mansion, MIT): typed WebGPU in TypeScript, with shaders written as TypeScript functions. It is the closest existing match to "our functions, compiled for the GPU".
- **three.js TSL:** write shader math once in JavaScript; it compiles to WGSL and GLSL. Use it as a reference for dual compilation; the engine does not need three.js.
- **use.gpu** (usegpu.live): a reactive WebGPU component library, a conceptual cousin of the engine's relationship graph. Worth studying.
- **Vello** (Raph Levien, Linebender): GPU-compute 2D vector rendering. It proves vector graphics can live on the GPU. Treat it as prior art, not a dependency.

### Spike plan (when triggered)

1. Port the renderer benchmark to WebGPU (days).
2. Add a compute pass that animates a data transition.
3. Compile one real expression from a frame document into WGSL.
4. Draw one engraved line family on the GPU. This tests the biggest risk early.

### What the current design already prepares

- **A data-oriented scene** with stable ids: numeric arrays upload directly to GPU buffers.
- **A pure, small expression language:** every construct must have a shader translation.
- **Stages:** moment-stage work is exactly the work that moves to the GPU.
- **Routing:** "Tier D" is reserved for the GPU (see [system.md §8](system.md)).
- **One renderer interface:** a new backend draws the same scene.

---

## 2. Map engine

**Trigger:** the city game. The game is where the map engine gets built, as the runtime in the game's main box. Much of the owner's work is maps.

**What it is:** a separate engine built on the same core. Waterlining and contour hatching come from line families. Zoom styling comes from room levels. Buffers come from geometry, data-driven styling from expressions, and palettes from skins. A map is the content of a frame opening, and its neatline is a frame member. Details: [frame-engine.md §16](frame-engine.md).

---

## 3. Smaller parked ideas

These come from the frame design. Each waits for its milestone or for a real need.

- **Guilloché fills** (rose-engine rosettes) for medallion centres and bands
- **Construction replay:** on first visit, the frame draws itself in dependency order (dominant curves first)
- **Print skin and SVG/PDF export** of any frame at any size
- **Log-aesthetic "character" dial** for curves
- **Per-pixel analytic hairlines** on the GPU (see §1)
