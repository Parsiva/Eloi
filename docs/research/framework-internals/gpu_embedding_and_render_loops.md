# GPU / Canvas Renderer Embedding and Render-Loop Coordination (for Eloi)

Researched 2026-10-11. Sources are mostly official docs fetched that day. Where a claim comes from background knowledge rather than a fetched page, it is marked **[unverified]** and also listed under Gaps. Version caveats: R3F docs are for v9 (React 19). PixiJS docs are for v8.x. luma.gl docs cover v9.x up to 9.4. three.js WebGPURenderer is still evolving, so check the release in use.

## 1. How does R3F's frameloop ("always" | "demand" | "never") and invalidate() work, and how does it integrate an external clock?

### Takeaway
R3F has a three-mode loop. `always` re-renders on every rAF. `demand` renders only when something marks the scene dirty, either a React prop change or `invalidate()`. `never` hands the clock to the host, which calls `advance(timestamp)`. This is close to the `{clock, scheduler}` host contract that Eloi already sketches, and it is the strongest precedent for that contract.

### Cited Findings
- The Canvas `frameloop` prop takes `always`, `demand` or `never`, and the default is `always`. It can be changed at runtime with `setFrameloop`. — [R3F Canvas API](https://r3f.docs.pmnd.rs/api/canvas)
- With `frameloop="demand"`, R3F "will render frames whenever it detects prop changes throughout the component tree". — [R3F Scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- `invalidate()` "will not render immediately, it merely requests a new frame". Calling it many times does not render many times, because it acts as a dirty flag. You need it when state is mutated outside React, for example camera controls calling `invalidate` on their `change` event (drei's controls do this automatically). — [R3F Scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- Fields on `useThree` state:
  - `invalidate()` is effective only when `frameloop === 'demand'`.
  - `advance(timestamp, runGlobalEffects?)` advances one tick and is effective only when `frameloop === 'never'`. This is the external-clock entry point.
  - `setFrameloop` and `setDpr` change those settings at runtime.
  - `size` is the canvas size in CSS pixels plus top and left. `viewport` is the size in three.js units. `clock` is a THREE.Clock.

  — [R3F Hooks](https://r3f.docs.pmnd.rs/api/hooks)
- `useFrame((state, delta, xrFrame) => …, priority?)` runs before each render and unsubscribes automatically on unmount. Callbacks run in ascending priority order. A positive priority takes over rendering: R3F stops its automatic render and the subscriber must call `gl.render(scene, camera)` itself. Negative priorities only change the order. — [R3F Hooks](https://r3f.docs.pmnd.rs/api/hooks)
- Canvas `dpr` accepts a number or a `[min, max]` clamp, and the default is `[1, 2]`. Resizing goes through react-use-measure, with default `{ scroll: true, debounce: { scroll: 50, resize: 0 } }`. `eventSource` defaults to the canvas's parent node. — [R3F Canvas API](https://r3f.docs.pmnd.rs/api/canvas)
- The `gl` prop takes options, a renderer instance, or a sync or async factory. R3F waits for an async factory before it renders. This is how WebGPU is used: `new WebGPURenderer(...)` followed by `await renderer.init()`. R3F disposes renderers that it created. If you pass in an instance, you must dispose it yourself. — [R3F Canvas API](https://r3f.docs.pmnd.rs/api/canvas)
- `createRoot(canvas)` renders into an existing `<canvas>` without the `<Canvas>` wrapper. Call `root.configure()` before `root.render()`. This root is not responsive: you must call `configure({ size })` yourself on resize. — [R3F Canvas API](https://r3f.docs.pmnd.rs/api/canvas)
- R3F uses a custom React reconciler (react-reconciler) that maps JSX to three.js objects. **[unverified; background knowledge, not fetched this session]**

### Inferences
- R3F splits responsibility three ways. React owns the tree, the root owns the canvas and renderer, and the frame loop can be owned by R3F (always), driven by dirty flags (demand), or driven by the host (never plus advance). Eloi can expose the same three modes per box.
- An ownership rule follows from the `gl` prop: whoever creates the GPU resource disposes it. An injected renderer or context is the caller's to dispose.
- `createRoot` is the "embed into a DOM box someone else sizes" mode. Its non-responsiveness shows that the host must push size explicitly. In Eloi's case the host is the box.

### Gaps
- I did not find documentation of what `runGlobalEffects` does in detail, or of the expected timestamp units for `advance`. Assume rAF-style milliseconds, but verify in the R3F source.

## 2. How do deck.gl and MapLibre interleave rendering in a shared WebGL context? What is the custom layer interface?

### Takeaway
MapLibre owns the canvas, the WebGL2 context, the drawing-buffer size and the render loop. Guests plug in as `type: "custom"` style layers with `onAdd`, `prerender`, `render` and `onRemove` hooks, follow strict GL-state conventions, and call `map.triggerRepaint()` to request frames. deck.gl's `MapboxOverlay` uses that hook to interleave, or it can stack its own canvas on top (overlaid mode).

### Cited Findings
- **CustomLayerInterface (MapLibre GL JS):**
  - A layer has an `id`, `type: "custom"` and a required `render`. `prerender`, `onAdd(map, gl)` and `onRemove(map, gl)` are optional. Create GL resources in `onAdd` and release them in `onRemove`.
  - `renderingMode` is `"2d"` (the default, no depth) or `"3d"`, which shares the depth buffer with other layers. A 2D layer that needs depth must use its own framebuffer in `prerender`.
  - `prerender` may assume nothing about GL state and must bind its own framebuffer. `render` may assume blending and depth are set up for compositing, and nothing else. The blend function is `ONE, ONE_MINUS_SRC_ALPHA`, so colors are premultiplied alpha.
  - Layers should handle `webglcontextlost` and `webglcontextrestored`.
  - The experimental `renderToTerrainTile` and `terrainTileRevision` drape output onto terrain.
  - `Map.triggerRepaint` requests a frame.

  — [MapLibre CustomLayerInterface](https://maplibre.org/maplibre-gl-js/docs/API/interfaces/CustomLayerInterface/)
- **deck.gl MapboxOverlay:**
  - It is an `IControl` that is added to the map.
  - `interleaved: false` (the default) adds "a dedicated deck.gl canvas … on top of the base map". `interleaved: true` puts deck layers into the map's layer stack, sharing one `WebGL2RenderingContext`.
  - In interleaved mode the base map owns the context and the drawing-buffer size, so `useDevicePixels` is ignored. Use MapLibre's `pixelRatio` instead.
  - The base map creates its context with `antialias: false`, so interleaved deck layers get no MSAA.
  - Layers are grouped and drawn in batches by `beforeId` (or `slot` for the Mapbox v3 Standard style).
  - Interleaving requires WebGL2.
  - `views`, `parent`, `canvas`, `device`, `viewState` and `controller` are unsupported or forced. Only one view syncs with the map, the camera is internal, and the map handles interaction.

  — [deck.gl MapboxOverlay](https://deck.gl/docs/api-reference/mapbox/mapbox-overlay)
- MapLibre GL JS roadmap: a WebGPU backend alongside WebGL2 is planned. The first three phases modernize WebGL2 (UBOs, immutable textures, layout qualifiers). Phase 4 adds WebGPU, with GLSL ported to WGSL. The project page still lists WebGPU as in progress. A board-candidate platform proposes migrating GL JS onto luma.gl for WebGL2 and WebGPU. — [MapLibre Graphics Modernization](https://maplibre.org/roadmap/maplibre-gl-js/graphics-modernization); [MapLibre GL JS project](https://maplibre.org/projects/gl-js/); [Birk Skyum](https://maplibre.org/about/birk-skyum)
- MapLibre Native has experimental WebGPU backends for Android and iOS, as of the February 2026 newsletter. — [MapLibre Newsletter Feb 2026](https://maplibre.org/news/2026-03-03-maplibre-newsletter-february-2026/)

### Inferences
- The interleaving contract has five parts:
  1. The host owns the context, size and loop.
  2. The guest gets lifecycle hooks with the raw context.
  3. Each hook has documented state assumptions: what is guaranteed and what must be restored.
  4. A pre-pass is available for offscreen work.
  5. The guest calls a repaint request rather than running its own rAF.

  This is a good template if the future Eloi map engine hosts guest layers, for example game markers.
- Overlaid mode (a separate stacked canvas) is the cheap and robust default. Interleaving is only worth it when guest content needs depth or z-order between host layers, such as drawing under labels.

### Gaps
- MapboxOverlay docs do not describe overlaid-mode sizing and DPR in detail.
- I found no dated WebGPU release for MapLibre GL JS. The v6 transition is mentioned without WebGPU details ([April 2026 newsletter](https://maplibre.org/news/2026-05-02-maplibre-newsletter-april-2026/)).

## 3. How does regl handle frame loops, context loss and resizing?

### Takeaway
regl is functional. `regl({frag, vert, uniforms, attributes, ...})` compiles a draw command whose dynamic inputs are `(context, props, batchId)` functions. Its loop is a thin rAF wrapper, `regl.frame(cb)`, which returns `{cancel}`. If you run your own loop, you must call `regl.poll()` yourself. That makes regl easy to slave to an external clock such as an Eloi scheduler.

### Cited Findings
- **Commands:**
  - `regl({...})` wraps all WebGL state for a draw call into a reusable function. `uniforms` and `attributes` can be static or functions of `(context, props, batchId)`. Shortcuts are `regl.prop('name')` and `regl.context('name')`.
  - A command can be invoked once with `cmd(props)`, batched with an array or count, or scoped with `cmd(props, () => {...})`, in which case its state becomes the default for nested commands.

  — [regl API.md](https://github.com/regl-project/regl/blob/main/API.md)
- **Frame loop:** `regl.frame(cb)` is a wrapper over requestAnimationFrame. The callback receives the default regl context variables, and the returned object has `cancel()`. If you manage frames manually, "it is essential to call `regl.poll()`", which also updates timer-query stats. `regl.clear({color, depth, stencil, framebuffer})` clears only the buffers you name. — [regl API.md (raw)](https://raw.githubusercontent.com/regl-project/regl/main/API.md)
- **Resizing:**
  - With no target, regl creates a fullscreen canvas that "will dynamically resize whenever the window changes shape".
  - `container` sets where regl inserts its canvas (default `document.body`). `canvas` uses an existing element.
  - `pixelRatio` defaults to `window.devicePixelRatio`.

  — [regl API.md](https://github.com/regl-project/regl/blob/main/API.md)
- **Context loss:** `regl.on('lost' | 'restore', cb)`. regl makes a best-effort recovery: buffers and textures are "reinitialized on a context restore with their contents", but "it is still up to the user to handle this situation". — [regl API.md (raw)](https://raw.githubusercontent.com/regl-project/regl/main/API.md)
- **Disposal:** `regl.destroy()` releases all resources. Individual resources have `.destroy()`. `regl._refresh()` is an escape hatch to call after you change raw WebGL state outside regl, for example when sharing a context with another library. — [regl API.md (raw)](https://raw.githubusercontent.com/regl-project/regl/main/API.md)
- The regl callback context includes `tick`, `time`, `viewportWidth/Height`, `drawingBufferWidth/Height` and `pixelRatio`. **[unverified: the fetched excerpt did not list these fields]**

### Inferences
- When isidex embeds Eloi, or Eloi hosts isidex: if isidex drives `regl.frame`, it can pass its tick/time to Eloi as the `clock`. If Eloi owns the clock, isidex should drop `regl.frame` and call `regl.poll()` plus its draw commands from Eloi's scheduler callback.
- regl's only auto-resize is fullscreen or window resize. When regl is given a `canvas` inside an Eloi box, Eloi should set canvas.width and height itself (with a ResizeObserver) and call `regl.poll()` so the viewport updates.
- `regl._refresh()` is required whenever another library touches the same GL context. This is the regl equivalent of MapLibre's GL-state rules.

### Gaps
- The excerpts did not confirm whether regl re-observes size changes when passed `canvas` or `container`. Older docs suggest it only listens to window `resize`.

## 4. Browser limits on concurrent WebGL contexts, and the cost of many canvases vs one canvas with scissored viewports

### Takeaway
Browsers cap live WebGL contexts per page, commonly 16. When the cap is exceeded the oldest context is silently lost. Separate contexts also cannot share GPU resources. The standard workaround is one full-page canvas cut into regions with `gl.scissor` and `gl.viewport`, each region tracking a DOM element (three.js "multiple scenes", drei `<View>`).

### Cited Findings
- Chrome warns "Too many active WebGL contexts. Oldest context will be lost". Firefox reports exceeding 16 live WebGL contexts for the principal and losing the least recently used one. — [fingerprintjs PR #484](https://github.com/fingerprintjs/fingerprintjs/pull/484)
- A WebKit commit says other browsers have a limit of 16 concurrent active WebGL contexts and that WebKit adopted recycling of older contexts. — [WebKit commit](https://webkit.googlesource.com/WebKit/+/70e10861eb2fbd9d0862fd8702874c25ae5d8bfd)
- In practice, mounting and unmounting components that each create a context hits this limit. The fix is to release contexts explicitly with `WEBGL_lose_context.loseContext()`. — [PlayCanvas forum](https://forum.playcanvas.com/t/too-many-active-webgl-contexts/13030); [VTK discourse](https://discourse.vtk.org/t/why-im-having-this-warning-too-many-active-webgl-contexts-oldest-context-will-be-lost/10670)
- **drei `<View>`:**
  - "Views use gl.scissor to cut the viewport into segments". Views are ordinary DOM elements (a div) that "follow their tracking elements, scroll along, resize".
  - The canvas should ideally be fullscreen and absolutely positioned behind or in front of the HTML.
  - `<View.Port/>` inside `<Canvas>` outputs the views.
  - `index` sets render order, since Views take over the render loop. `frames` sets how often `getBoundingClientRect` is re-measured (1 means measure once, for static views). `visible` toggles a view.
  - Set `eventSource` to a parent that contains both the canvas and the HTML.
  - Requires R3F `>=8.1` for a non-fullscreen canvas.

  — [drei View](https://drei.docs.pmnd.rs/portals/view)
- three.js "multiple scenes" manual pattern: a fixed canvas behind the page, a `getBoundingClientRect` per element, and `setScissorTest(true)`, `setScissor` and `setViewport` per region, skipping regions that are off screen. **[unverified: the manual URL returned 404 this session; the pattern is from background knowledge]**

### Inferences
- **Per-box canvas.** Each box gets its own context. Pros:
  - Simple lifecycle and natural DOM stacking and z-order.
  - Isolated GL state and isolated context loss.
  - Each runtime can pick WebGL or WebGPU.

  Cons:
  - Counts against the roughly 16-context cap.
  - Duplicated resources (shaders, textures, fonts).
  - One compositor layer per canvas.
  - Runtimes cannot share a single rAF render pass.

  For a handful of boxes (portfolio, game, isidex) this is fine.
- **Shared canvas.** Pros:
  - One context, shared resources.
  - Unlimited "views".

  Cons:
  - Every region pays the bounding-rect measurement each frame.
  - Scroll sync can lag a frame unless the canvas is fixed and positioned by transform.
  - DOM overlays must sit above the whole canvas.
  - All runtimes must agree on one API and one renderer (WebGL vs WebGPU, regl vs three) and on GL-state hygiene.

  This is a poor fit when boxes host different engines.
- WebGPU is different: one `GPUDevice` can configure many canvases, so per-box canvases do not multiply devices or block resource sharing. **[unverified: from WebGPU spec background knowledge, not fetched]**

### Gaps
- I found no official Chromium or Gecko doc stating the current numeric limits. The 16 figure comes from a WebKit commit, a Firefox message quoted in a PR, and forums. Mobile limits may be lower.
- WebGPU per-page device or canvas limits were not researched.

## 5. How do engines coordinate a single rAF across multiple consumers (shared tickers, PixiJS Ticker, GSAP ticker)?

### Takeaway
The common pattern is one ticker object that owns `requestAnimationFrame` and dispatches to a prioritized listener list. Each Application or engine either joins a shared ticker or runs a private one. Rendering itself is just one listener at a known priority.

### Cited Findings
- **PixiJS v8 Ticker:**
  - `add(fn, ctx, priority)`, `addOnce` and `remove`. `start()` and `stop()`, where `stop` cancels the rAF.
  - `autoStart` starts the ticker when a listener is added.
  - Priorities are `UPDATE_PRIORITY.HIGH` (50), `NORMAL` (0) and `LOW` (-50), and "Higher values run earlier".
  - Callbacks receive the ticker and use `ticker.deltaTime`.
  - `minFPS` clamps delta for slow frames. `maxFPS` caps the rate, and 0 means unlimited.

  — [PixiJS Ticker guide](https://pixijs.com/8.x/guides/components/ticker)
- **PixiJS v8 Application:**
  - `await app.init({...})` takes `preference: 'webgl' | 'webgpu'` (default webgl), `resizeTo` (a Window or HTMLElement), `autoDensity`, `resolution` (default 1), `autoStart` (default true) and `sharedTicker` (default false; true joins the global shared ticker, otherwise a private one is created), plus an optional `canvas`.
  - Functionality is split into plugins: TickerPlugin renders every frame, ResizePlugin resizes the renderer and canvas, and CullerPlugin is optional.

  — [PixiJS Application guide](https://pixijs.com/8.x/guides/components/application)
- R3F orders `useFrame` subscribers by priority, and a positive priority takes over the render call. — [R3F Hooks](https://r3f.docs.pmnd.rs/api/hooks)
- drei `<View index>` orders the render of each view within the one shared R3F loop. — [drei View](https://drei.docs.pmnd.rs/portals/view)
- regl's `frame()` is a thin rAF wrapper with `cancel()`. — [regl API.md (raw)](https://raw.githubusercontent.com/regl-project/regl/main/API.md)

### Inferences
- A good Eloi scheduler copies these, all together:
  1. One rAF owned by the page-level Eloi host, or delegated to a host engine's clock.
  2. Phases or priorities (input → update → layout-read → render → post).
  3. Per-subscriber `{time, delta, frame}`.
  4. Delta clamping (PixiJS `minFPS`).
  5. Auto-stop when no subscriber is active or dirty, so the page is idle.
- Separating measurement from rendering avoids layout thrash. drei's `frames` option shows that bounding-rect reads are a real per-frame cost. Read every box's geometry once per frame in one phase, then render.

### Gaps
- GSAP ticker internals (`gsap.ticker.add`, `lagSmoothing`, `fps`) were not fetched this session. Verify them at gsap.com/docs/v3/GSAP/gsap.ticker.
- I did not confirm how PixiJS v8 renders manually with `autoStart: false` (`app.renderer.render(app.stage)` per background knowledge) or its `destroy()` options.

## 6. WebGPU status in browsers as of 2026, and how libraries abstract WebGL2/WebGPU

### Takeaway
As of late 2025 and 2026, WebGPU is on by default in Chrome, Edge, Firefox (Windows; macOS on Apple Silicon) and Safari 26 (macOS, iOS, iPadOS, visionOS). Android Chrome needs Android 12+ with supported GPUs, Linux is partial, and Firefox Android is pending. Every major library ships a WebGPU-first renderer with a WebGL2 fallback behind one API, so a WebGL2 fallback is still required.

### Cited Findings
- web.dev (Nov 2025) says WebGPU is supported in all major browsers:
  - Chrome and Edge 113+ on Windows (D3D12), macOS and ChromeOS, with Linux in progress.
  - Android Chrome 121+ on Android 12+ with Qualcomm or ARM GPUs.
  - Firefox 141 on Windows, and Firefox 145 on macOS Tahoe (ARM64).
  - Safari in macOS, iOS, iPadOS and visionOS 26.

  — [web.dev](https://web.dev/blog/webgpu-supported-major-browsers)
- Khronos 2026 update: Chromium added Linux on Intel Gen12+ (2026-01) and Compatibility Mode for older Android with GLES 3.1 (2026-02). — [Khronos SIGGRAPH 2026 WebGL/WebGPU](https://www.khronos.org/developers/linkto/webgl-and-webgpu-sigg26)
- Firefox Android was not confirmed as shipping. One third-party claim targets late 2026 and is unverified. — [web.dev](https://web.dev/blog/webgpu-supported-major-browsers) (absence); third-party blogs conflict
- **three.js `WebGPURenderer`** (imported from `three/webgpu`):
  - It uses the WebGPU backend, falls back to a WebGL2 backend, and `forceWebGL: true` forces the WebGL2 path.
  - You must `await renderer.init()` if you render outside `setAnimationLoop`.
  - The forced-WebGL path is a separate backend, not `WebGLRenderer`, so blending and post-processing can differ.

  — [three.js manual: WebGPURenderer](https://threejs.org/manual/en/webgpurenderer.html) (via search snippet; direct fetch 404'd); [three.js forum](https://discourse.threejs.org/t/webgpurenderer-forcewebgl-true-vs-webglrenderer/87805)
- R3F uses `WebGPURenderer` through an async `gl` factory. — [R3F Canvas](https://r3f.docs.pmnd.rs/api/canvas)
- **PixiJS v8** chooses a backend with `preference: 'webgl' | 'webgpu'` behind one Renderer API. — [PixiJS Application](https://pixijs.com/8.x/guides/components/application)
- **luma.gl v9:**
  - `luma.createDevice({type})` returns a `WebGLDevice` or `WebGPUDevice`. `Device.attach(gl)` wraps an existing WebGL2 context, which is how a guest shares a host's context.
  - A `CanvasContext` provides `onResize`, which fires on device-pixel-content-box changes, and `onDevicePixelRatioChange`. A WebGL device can only render to its original canvas.
  - `device.lost` is a promise and `device.isLost` a flag. Recovery is hard, so the docs suggest a reload.
  - `destroy()` frees resources immediately on WebGPU but relies on GC on WebGL.
  - Newer versions add `createPresentationContext()` (experimental, 9.3) and render bundles (9.4).

  — [luma.gl Device](https://luma.gl/docs/api-reference/core/device)
- Babylon.js `WebGPUEngine` with async `initAsync()`, alongside the WebGL `Engine`. **[unverified; not fetched this session]**

### Inferences
- The industry pattern is an async device/renderer factory with feature detection (`navigator.gpu`) and a WebGL2 fallback, exposed as `await init()`. Eloi's `mount` should therefore allow async mount (a returned Promise) and an explicit "ready" state, as R3F's `root.ready` does.
- Device loss is a first-class event in both APIs: WebGL `webglcontextlost` and WebGPU `device.lost`. The box contract needs a `lost`/`restored` channel, or a "remount me" signal.
- For the custom city-map engine, luma.gl v9's Device abstraction (also used by deck.gl, and proposed for MapLibre) is a viable thin layer over WebGL2 and WebGPU if writing both backends by hand is undesirable.

### Gaps
- I did not verify Babylon.js WebGPU specifics or the current three.js release number. Check that before citing versions.

## 7. OffscreenCanvas + workers, ResizeObserver / devicePixelRatio handling

### Takeaway
For crisp canvases, observe the box with `ResizeObserver` using `box: 'device-pixel-content-box'` and set backing-store size from `devicePixelContentBoxSize`. Fall back to CSS size times `devicePixelRatio` where that is unsupported (Safari). OffscreenCanvas is Baseline and lets a worker own rendering, but then the main thread must forward size, DPR and input events.

### Cited Findings
- **ResizeObserver with `device-pixel-content-box`:**
  - Pattern: `observer.observe(canvas, {box: ['device-pixel-content-box']})`, read `entry.devicePixelContentBoxSize[0].inlineSize/blockSize`, and set `canvas.width/height`.
  - The callback runs after layout and before paint, so draw in the callback to avoid a stale frame.
  - Fractional CSS sizes times DPR cause blur or moiré, which is why this box exists.
  - Support badges list Chrome/Edge 84 and Firefox 108, and Safari as not supported.
  - Feature-detect by observing once and checking that the field exists.

  — [web.dev device-pixel-content-box](https://web.dev/articles/device-pixel-content-box)
- luma.gl's CanvasContext exposes `onResize` on device-pixel-content-box changes and `onDevicePixelRatioChange`. — [luma.gl Device](https://luma.gl/docs/api-reference/core/device)
- R3F clamps DPR (`[1, 2]` by default) and debounces scroll measurement at 50 ms. — [R3F Canvas](https://r3f.docs.pmnd.rs/api/canvas)
- PixiJS: `resizeTo` takes an element, and `autoDensity` sets the CSS size from `resolution`. — [PixiJS Application](https://pixijs.com/8.x/guides/components/application)
- **OffscreenCanvas:**
  - `canvas.transferControlToOffscreen()` returns an OffscreenCanvas. Send it with `worker.postMessage({canvas: off}, [off])`.
  - It throws `InvalidStateError` if `getContext` was already called or if control was already transferred, so the transfer happens once and before any context.
  - Baseline widely available since March 2023.

  — [MDN transferControlToOffscreen](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/transferControlToOffscreen)

### Inferences
- With a worker-owned canvas, the main thread keeps the ResizeObserver and DOM events and posts `{width, height, dpr}` messages. The worker sets `offscreen.width/height` and runs its own rAF (available in workers). The Eloi box contract should express size and DPR as data pushed to the runtime, not as something the runtime measures, so the same contract works in a worker.
- Clamp DPR per box, for example a maximum of 2 for large map boxes, because fill cost grows with DPR squared.

### Gaps
- MDN did not confirm that webgl2 and webgpu contexts are available on OffscreenCanvas in workers in every browser. Check the OffscreenCanvas `getContext` compatibility table.
- Whether `devicePixelContentBoxSize` has shipped in Safari by late 2026 is unconfirmed.

## 8. Lessons for Eloi: box contract for a GPU runtime, and shared-canvas vs per-box-canvas

### Takeaway
Use **per-box canvases by default**. Each box hosting a GPU runtime gets its own `<canvas>` (or an OffscreenCanvas transfer) that Eloi sizes. Run a **single page-level scheduler** with demand-driven frames that every box subscribes to, and that can be slaved to a host engine's clock. Reserve a shared-canvas "views" mode for many small boxes that run the *same* engine.

### Cited Findings (basis)
- **Modes.** Frame-loop modes, dirty-flag invalidation and an external-clock `advance` — [R3F Hooks](https://r3f.docs.pmnd.rs/api/hooks), [R3F perf](https://r3f.docs.pmnd.rs/advanced/scaling-performance).
- **Host owns context, size and loop.** Guest gets hooks, GL-state rules and `triggerRepaint` — [MapLibre CustomLayerInterface](https://maplibre.org/maplibre-gl-js/docs/API/interfaces/CustomLayerInterface/), [deck.gl MapboxOverlay](https://deck.gl/docs/api-reference/mapbox/mapbox-overlay).
- **Context caps and scissor views** — [WebKit commit](https://webkit.googlesource.com/WebKit/+/70e10861eb2fbd9d0862fd8702874c25ae5d8bfd), [drei View](https://drei.docs.pmnd.rs/portals/view).
- **Pixel-exact sizing** — [web.dev](https://web.dev/articles/device-pixel-content-box).
- **Device loss and disposal** — [luma.gl Device](https://luma.gl/docs/api-reference/core/device), [regl API](https://raw.githubusercontent.com/regl-project/regl/main/API.md).

### Inferences: what the box contract should contain
The contract below is a design suggestion derived from the cited mechanisms, not an existing API.

```ts
interface BoxHost {
  // geometry (pushed, never measured by the runtime -> worker-safe)
  size: { cssWidth; cssHeight; pixelWidth; pixelHeight; dpr };   // from device-pixel-content-box, fallback css*dpr, clamped by box policy
  onResize(cb): Unsub;            // fires before paint; runtime resizes backing store + redraws in same tick
  // visibility / power
  visible: boolean; onVisibility(cb);   // IntersectionObserver + document.visibilityState; pause when off-screen
  reducedMotion: boolean; static: boolean;
  // time
  clock: { now(): number; frame: number };   // Eloi's or a host engine's (isidex regl tick)
  scheduler: {
    request(phase?: 'update'|'render'): void;  // == invalidate(): idempotent dirty flag
    subscribe(fn: (t, dt, frame) => void, { phase, priority }): Unsub;
    mode: 'always'|'demand'|'never';           // never => host calls runtime.advance(t)
  };
  // lifecycle
  signal: AbortSignal;            // dispose = abort; runtime frees GPU resources, calls loseContext() if it created the context
  onContextLost / onContextRestored(cb);   // or a 'remount' request
}
interface BoxRuntime { mount(el, host): void | Promise<void>; advance?(t): void; dispose(): void; }
```

Key precedents to set:
1. **Size is pushed, not pulled.** Eloi owns the ResizeObserver and DPR policy, like the host-owned drawing buffer in MapLibre/deck interleaving.
2. **Demand rendering by default.** `request()` is a coalescing dirty flag, as R3F's `invalidate` is, and the scheduler stops rAF entirely when nothing is dirty. `always` is opt-in.
3. **Single rAF with phases and priorities** (PixiJS/R3F style). All DOM geometry reads happen in one read phase before any render phase.
4. **Clock inversion.** Any box can be the clock source, e.g. isidex's `regl.frame` tick drives Eloi via `advance`. Otherwise Eloi drives isidex, and isidex calls `regl.poll()` and draws inside Eloi's render phase.
5. **Ownership-based disposal.** Whoever creates a canvas or context destroys it (R3F rule). Disposal is idempotent and triggered by an AbortSignal. Contexts are explicitly lost on unmount to stay under the per-page cap.
6. **Device loss is part of the contract** (WebGL and WebGPU).
7. **Async mount** to allow `await renderer.init()` or WebGPU adapter requests.
8. **Overlays.** DOM and SVG overlays (frame ornaments, labels) sit in the same CSS grid cell above the canvas. The GPU runtime exposes a project/unproject function so overlays can align with GPU content. Interleaving inside one context is only for same-engine guests, via a MapLibre-style custom-layer hook in the future map engine.

### Recommendation: shared canvas vs per-box canvas
- **Per-box canvas (default).**
  - Eloi pages have few GPU boxes (1–3), and each runs a *different* engine (regl diagrams, a custom WebGL/WebGPU map, maybe three.js).
  - Isolated GL state, isolated context loss and independent WebGL/WebGPU choice outweigh the cost of duplicated resources.
  - Context counts stay far below the roughly 16 cap if Eloi releases contexts on unmount.
  - With WebGPU, a single device can serve multiple canvases **[unverified]**, which removes most of the downside.
- **Shared full-page canvas with scissored views (opt-in).** Use this only when many boxes (more than ~8, e.g. a gallery of thumbnails or diagram previews) host the *same* engine. Follow drei `<View>`:
  - a fixed canvas behind the grid
  - per-box bounding rects measured once per frame (or once, for static boxes)
  - a scissor and viewport per box
  - render order by index
  - an event source on a common parent
- **Avoid** multiple engines writing into one WebGL context unless they follow an explicit state contract (MapLibre's documented assumptions, regl's `_refresh()`).

### Gaps
- Not benchmarked: per-canvas compositing cost against a shared canvas on mobile.
- Not verified: WebGPU multi-canvas device sharing and Babylon specifics (both flagged above).
