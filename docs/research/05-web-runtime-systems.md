# Runtime-generated graphics on the web

> Research angle `web-runtime-systems` — part of the [frame engine research](README.md).

## Summary

The web systems that generate decoration at runtime mostly share one architecture: a pure, deterministic function of (box size, named parameters, seed) produces geometry, the geometry is cached against exactly the inputs that change it, and a thin renderer turns it into SVG or canvas output. A ResizeObserver plus a size-diff check decides when to re-run that function. This is what the CSS Paint API spec requires of worklets, and it is how Wired Elements, Rough Notation and Excalidraw are built. Nobody has shipped the owner's specific requirement, a dominant curve that every other element hangs from. The closest working precedents are: Rive's Follow Path constraint, which attaches a part at a fraction of arc length and turns it to match the tangent; Tyler Hobbs' flow fields, where one field steers every line and a minimum spacing gives the "logical spread"; and shan-shui-inf's plan-then-draw pipeline, where a planner lays out the skeleton and the renderer then draws strokes along it. The "printed, not hand-drawn" quality comes from three things: building each line as a filled outline with a mathematical width profile (perfect-freehand, shan-shui's stroke(), Bezier.js graduated outlines) rather than a CSS stroke-width; computing parallel line groups as exact offsets; and keeping every random choice behind a fixed seed (or removing randomness entirely), so redrawing at a new size never reshuffles the art. Golden-ratio enforcement already exists on the web for typography (Modular Scale, Utopia): one ratio, numbered steps, and interpolation between two designed end sizes. The same token approach can drive leaf sizes, spiral growth and band spacing. The realistic designer workflow combines what these systems do: the designer draws skeleton curves and leaf archetypes in Illustrator, the engine imports them (Paper.js importSVG) and derives everything else, tunable values are declared in a parameter manifest that becomes sliders (as houdini.how's JSON manifests and Stripe.dev's "design instrument" did), and the designer generates several candidates, picks one and pins its seed (as the MIT Media Lab identity did). The CSS Paint API teaches the right contract but should not be the delivery mechanism. It outputs raster, Firefox has no support, Safari ships it disabled by default, and its polyfill and showcase site have been abandoned.

## Case studies

| # | Case study | Kind | Confidence | Verification |
|---|---|---|---|---|
| 1 | [CSS Houdini Paint API: the spec, houdini.how worklets, Temani Afif's polygon border and the Paint Flecks worklet used on CSS-Tricks](https://drafts.css-houdini.org/css-paint-api/) | technique | high | verified |
| 2 | [Rough.js (RoughGenerator) and Excalidraw's ShapeCache](https://github.com/rough-stuff/rough/wiki) | library | high | verified |
| 3 | [Rough Notation and Wired Elements (Preet Shihn): procedural SVG redrawn as page elements resize](https://github.com/rough-stuff/rough-notation) | library | high | verified |
| 4 | [Paper.js and Bezier.js: curve geometry kernels (arc-length queries, offsets, graduated outlines)](http://paperjs.org/reference/path/) | library | high | verified |
| 5 | [perfect-freehand (Steve Ruiz): centerline to variable-width outline polygon](https://github.com/steveruizok/perfect-freehand) | library | high | verified |
| 6 | [canvas-sketch and canvas-sketch-util/penplot (Matt DesLauriers)](https://github.com/mattdesl/canvas-sketch/blob/master/docs/physical-units.md) | tool | high | verified |
| 7 | [Tyler Hobbs, 'Flow Fields' essay: one dominant field that every line follows](https://www.tylerxhobbs.com/words/flow-fields) | technique | high | verified |
| 8 | [{Shan, Shui}* (Lingdong Huang): procedurally generated, infinitely scrolling SVG Chinese landscape scroll](https://github.com/LingDong-/shan-shui-inf) | website | high | verified |
| 9 | [Rive: Follow Path constraint and Layout fit, a designer-authored constraint runtime on the web](https://rive.app/docs/editor/constraints/follow-path-constraint) | tool | medium | verified |
| 10 | [Generative identity systems: MIT Media Lab 2011 (TheGreenEyl and E Roon Kang), the Pentagram 2014 grid system, and the Stripe.dev 'design instrument'](https://www.creativeapplications.net/project/mit-media-lab-identity-processing/) | website | medium | partly verified (see note) |
| 11 | [Penrose (CMU): ensure/encourage constraint styling with optimization](https://penrose.cs.cmu.edu/siggraph20) | paper | medium | verified |
| 12 | [Modular Scale and Utopia: ratio-based proportional systems enforced across a site and across viewport sizes](https://utopia.fyi/blog/clamp/) | technique | high | verified |

### 1. CSS Houdini Paint API: the spec, houdini.how worklets, Temani Afif's polygon border and the Paint Flecks worklet used on CSS-Tricks

<https://drafts.css-houdini.org/css-paint-api/> · technique · confidence: high · verified

**What it is.** A browser API: you register a JavaScript class with registerPaint(), and CSS uses it anywhere an image is accepted (background-image, border-image, mask-image) through paint(name). The examples here are real deployments: Paint Flecks (shown in the CSS-Tricks header and footer), Una Kravets' angled-corners and scalloped-border worklets, Surma's border-radius-reverse, and Temani Afif's polygon-border technique.

**How it works.** paint(ctx, size, props, args) receives a canvas-like PaintRenderingContext2D. MDN says it is a subset that excludes CanvasImageData, CanvasUserInterface, CanvasText and CanvasTextDrawingStyles, so there is no text and no pixel readback. size is the snapped concrete object size; if the browser snaps it, it scales proportionally. props contains only the properties listed in static inputProperties. inputArguments declares typed arguments such as <length>. The spec forces the function to be pure: the browser may discard class instances at any time, must alternate between at least two global scopes and may not reuse one more than 1000 times in a row, and gives each call a fresh context. The browser may also paint speculatively at sizes that are never shown, and may reuse a cached image wherever paintSize, the style map and the arguments match, even across different elements. The browser repaints when the box size or a listed property changes. web.dev describes worklets as running off the main thread. Afif's polygon border stores the polygon points in one custom property (--path). clip-path: polygon(var(--path)) and the worklet both read it. The worklet converts each percentage point against size.width and size.height, strokes the path at lineWidth = 2*border, and the clip-path removes the outer half. --border is registered with @property as a <length>, so it arrives as a computed number. Paint Flecks (unpkg houdini-paint-flecks; repo jakearchibald/houdini-paint-flecks; listed on houdini.how under George Francis) registers --fleck-seed, --fleck-cell-size, --fleck-density, --fleck-size-base and --fleck-colors with @property. It loads its worklet from a Blob URL and uses a seeded PRNG with fork(): it forks one stream per column of cells and one per cell, so a cell's flecks depend only on its grid position. Resizing the element adds or removes cells but never reshuffles the existing ones.

**Why it matters here.** Strong as a contract to imitate, weak as delivery for this project. The contract is a pure function of (size, typed params, seed), several elements can share one cached result, and the look is themed through custom properties. The engine should copy that interface. The output should be inline or generated SVG, because the owner needs crisp vector engraving, printability and cross-browser support.

**Ideas to borrow:**

- Define every ornament as `render(size, params, seed) => Geometry` with no hidden state. Then the same inputs always produce the same output, and results can be cached across elements, as the spec allows.
- Key the geometry cache on (ornament id, rounded size, params hash, seed). Two corner medallions of the same size can then share one computed path.
- Give each ornament a manifest: name, type, default, range and step for every parameter (houdini.how JSON format). Generate the designer's tuning panel from it automatically.
- Derive the seed for each cell, segment or repeat from its index along the border, as Paint Flecks does with fork() per column and per cell. Making the page longer adds new repeats at the end without changing the earlier ones.
- Share one geometry definition between the clipping or masking layer and the decorative stroke, like Afif's single --path. A frame's inner content clip and its engraved border then always agree.
- Expose theme values (ink color, line weight multiplier) as CSS custom properties that the engine reads at render time, so one stylesheet themes every ornament.

**Designer workflow.** Designers only edit CSS custom properties; the worklet is a black box. Every houdini.how entry ships a JSON manifest declaring each custom property's type, default, range and step (for example --extra-scallopRadius as a number from 0 to 20). The site turned these manifests into live sliders. It is easy to apply one look across every component through CSS. It is hard to draw anything that has to read as precise vector linework: the output is a bitmap, the API has no text drawing, and there is no access to the DOM or to other elements' geometry, so a frame cannot respond to content outside its own box.

**Evidence read.** Read the CSS Paint API editor's draft (instance disposal, two global scopes, the 1000-reuse limit, caching rules, PaintSize snapping). Read MDN 'Using the CSS Painting API' (inputProperties, inputArguments, the context subset), web.dev/articles/houdini-how (off-main-thread, polyfill, the angled-corners example) and CSS-Tricks 'Exploring the CSS Paint API: Polygon Border'. Downloaded the houdini.how worklet manifests (paint-flecks, extra-scalloped, angled-corners, border-radius-reverse, cornerbox) through the GitHub API, read the minified houdini-paint-flecks source on unpkg, and read the CodePen Radio episode 340 page, which says CSS-Tricks used the flecks in its header and footer. Checked caniuse css-paint-api.

### 2. Rough.js (RoughGenerator) and Excalidraw's ShapeCache

<https://github.com/rough-stuff/rough/wiki> · library · confidence: high · verified

**What it is.** Rough.js is a small library that draws shapes in a sketchy, hand-drawn style to canvas or SVG. Excalidraw, a whiteboard app, uses it to give every element on the canvas the same look.

**How it works.** RoughGenerator has the same API as the drawing classes but returns a Drawable (instructions only) instead of drawing. Drawables are serializable, and generator.toPaths(drawable) turns one into PathInfo objects {d, stroke, strokeWidth, fill, pattern} to render as SVG in order. Generation can run where there is no DOM, such as a server or web worker, by calling rough.generator(config, size). The style is a small set of options: roughness, bowing, curveFitting, curveStepCount, preserveVertices, hachureAngle, hachureGap, fillWeight, simplification and so on. A seed from 1 to 2^31 makes the output repeatable. Excalidraw (packages/element/src/shape.ts) keeps a static WeakMap<element, {shape, theme}> in ShapeCache. generateElementShape returns the cached Drawable unless the app is exporting, in which case it always regenerates. mutateElement calls ShapeCache.delete only when width, height, points or fileId change, so changing a color or moving an element does not regenerate geometry. A second WeakMap (elementWithCanvasCache) holds a rasterized canvas per element and rebuilds it when zoom, theme, crop or frame opacity changes. generateRoughOptions passes each element's stored seed into Rough.js and derives dependent values from one base value: hachureGap = strokeWidth*4 and fillWeight = strokeWidth/2. adjustRoughness lowers roughness for small elements (for example when the shorter side is under 20px or the longer side under 50px, unless the element is linear or rounded and large enough).

**Why it matters here.** Shows how a production app applies one procedural style to thousands of objects: shapes are generated separately from drawing, cached with deliberate invalidation, given a stored seed, and their parameters adapt to size. The owner's engine needs the same plumbing, with randomness set to zero or tightly bounded.

**Ideas to borrow:**

- Split the engine into a generator that returns a serializable Drawable (an op list or array of path data) and SVG and canvas renderers that consume it. The same Drawable can also be exported, or rendered at build time.
- Cache geometry in a WeakMap keyed on the ornament instance. Invalidate it only when something that changes geometry changes (size, skeleton points); theme and color changes should only re-render.
- Always regenerate fresh geometry when exporting a print or high-resolution version, as Excalidraw does, so a stale cache can never leak into final output.
- Derive secondary parameters from one master value (hatch gap = 4 × line weight, fill weight = line weight / 2). Changing the master then keeps the proportions intact.
- Add size-aware detail reduction: below set sizes, automatically simplify (fewer leaves, fewer parallel lines, thicker minimum weight), as adjustRoughness does for small elements.
- Store the seed on each ornament instance in the content data, not at runtime, so layouts are reproducible.

**Designer workflow.** End users choose from a few named presets (stroke style, roughness level, fill style) and never see the generator options. The seed is stored in each element's data, so a shape keeps its wobble across sessions and collaborators. The aesthetic is the opposite of engraving, but the system design is exactly what is needed.

**Evidence read.** Read the Rough.js wiki home page (options, seed) and its RoughGenerator page. Downloaded Excalidraw's packages/element/src/shape.ts, mutateElement.ts and renderElement.ts from GitHub master and read the ShapeCache class, generateRoughOptions, adjustRoughness, the invalidation conditions and elementWithCanvasCache.

### 3. Rough Notation and Wired Elements (Preet Shihn): procedural SVG redrawn as page elements resize

<https://github.com/rough-stuff/rough-notation> · library · confidence: high · verified

**What it is.** Rough Notation draws animated hand-drawn underlines, boxes and circles around any DOM element. Wired Elements is a set of Lit web components (cards, buttons and others) whose borders and fills are generated as SVG at runtime.

**How it works.** Rough Notation inserts an absolutely positioned SVG next to the target element (before it for highlights, after it otherwise), with pointer-events:none and overflow:visible. It listens to both window resize and a ResizeObserver on the target, throttles to one check every 400ms, and redraws only if haveRectsChanged() finds that the element's rects differ from the last ones drawn. Multiline annotations use getClientRects(), giving one rect per line box. Each annotation instance draws a random seed once (_seed) and reuses it on every redraw, so its shape does not change on resize. The draw-in animation uses stroke-dashoffset keyframes. Wired Elements' abstract WiredBase defines canvasSize() and draw(svg, size). wiredRender() returns early if the size equals lastSize; otherwise it empties the SVG, sets width and height, and calls draw. Each component keeps a seed set at construction. The host has opacity 0 until it gets the .wired-rendered class, which prevents an unstyled flash. Paths use stroke: currentColor and component-level custom properties for theming. WiredCard re-renders from its own ResizeObserver and computes its geometry (border rectangle, elevation lines, hachure fill) from the measured box.

**Why it matters here.** This is the component pattern that would let 'ornamental frame' be just a tag on any section of the blog. The frame measures its box, generates geometry from the skeleton, and redraws only when the size really changes.

**Ideas to borrow:**

- Write an abstract OrnamentElement base class with measure() -> size and draw(svg, size, seed). It skips drawing if the size is unchanged (to within a rounding tolerance), otherwise clears and redraws.
- Keep the ornament overlay non-interactive (pointer-events:none, aria-hidden) and positioned absolutely, so it never affects layout or accessibility.
- Hide the component until its first draw completes (opacity 0, then a rendered class), so a frame without ornament never flashes on screen.
- Watch the element with a ResizeObserver and debounce or throttle redraws. Rough Notation uses 400ms; an engraving engine could show a cheap simplified version while resizing and the full version once resizing stops.
- Use getClientRects() for ornaments that must follow wrapped inline text (rules under multi-line headlines).

**Designer workflow.** Developers write `<wired-card elevation=3>` or call annotate(el, {type:'box'}). The look comes automatically and stays the same everywhere. Customization is limited to a few attributes and CSS variables, which is what keeps the system consistent.

**Evidence read.** Downloaded and read rough-notation src/rough-notation.ts (attach, attachListeners, _resizeListener, haveRectsChanged, rects) and wired-elements src/wired-base.ts and src/wired-card.ts from GitHub.

### 4. Paper.js and Bezier.js: curve geometry kernels (arc-length queries, offsets, graduated outlines)

<http://paperjs.org/reference/path/> · library · confidence: high · verified

**What it is.** Paper.js is a vector scene graph and geometry library with canvas output and SVG import and export; paper-jsdom runs it headless in Node. Bezier.js (Pomax, https://pomax.github.io/bezierjs/) is a focused library for analyzing and offsetting individual Bézier curves.

**How it works.** Paper.js Path gives you length (approximate) and queries by arc-length offset: getPointAt(offset), getTangentAt, getNormalAt, getCurvatureAt (radius = 1/curvature), getLocationAt, getOffsetOf(point) and getOffsetsWithTangent(vector). smooth() takes type 'continuous' (continuous first and second derivatives across segments), 'catmull-rom' (factor 0 uniform, 0.5 centripetal, 1 chordal) or 'geometric'. simplify(tolerance=2.5) fits a minimal set of curves through the points, and flatten(0.25) converts curves to line segments. Boolean operations are unite, subtract, intersect and exclude, plus getIntersections and getCrossings. importSVG accepts an element, string or URL, and exportSVG has a precision option (default 5) and asString. Bezier.js: offset(d) returns a chain of Béziers approximating the true offset, because the offset of a Bézier is generally not a Bézier. It works by first calling reduce(), which splits the curve into 'simple' pieces whose endpoint normals differ by at most 60° and whose control points all sit on one side of the baseline. outline(d1, d2, d3, d4) produces a graduated outline whose width changes roughly linearly from start to end. curvature(t) returns {k, r}. length() uses Legendre-Gauss quadrature. project(point) finds the nearest point on the curve. arcs() approximates the curve with circular arcs, and intersects() finds intersections.

**Why it matters here.** These are the operations that 'everything relative to dominant functions' needs: place a leaf at 38.2% of a spine's length, align it to the tangent, push it out along the normal, measure the curvature there to size the leaf's curl, and generate N parallel offsets of a ribbon with controlled spacing.

**Ideas to borrow:**

- Address dependent elements as (spineId, t) where t is a fraction of arc length, never in x/y. Evaluate position with getPointAt(t·length), rotation with getTangentAt, and outward displacement with getNormalAt.
- Choose t values from golden-ratio sequences (t_k = 1 - φ^-k, or phyllotaxis steps of 0.381966…) so leaves sit at phi-related stations along a stem.
- Use getCurvatureAt to size and orient a leaf so its curl continues the stem's local radius. That makes the leaf look like part of the sweep rather than stuck on.
- Generate clustered parallel lines as offsets: offset(k·gap) for k = 1..N, or a graduated outline(d1, d2, d3, d4) so a band tapers. Before offsetting, clamp the gap against the minimum radius of curvature r so tight curls do not create cusps.
- Pick one smoothing rule (smooth({type:'continuous'})) for all imported skeletons so every spine has G2-continuous curvature, which looks machined rather than hand-drawn.
- Use boolean operations (subtract and intersect) to clip engraving hatching to leaf silhouettes and to knock out gaps where the woven ribbons cross over and under.

**Designer workflow.** Paper.js's importSVG makes the most realistic designer loop: the owner draws the dominant curves (spines) in Illustrator, gives the paths IDs, exports SVG, and the engine imports those paths as the skeleton. Everything else is computed from arc-length queries along them. Bezier.js can then generate offset families and variable-width outlines on top.

**Evidence read.** Read the Paper.js Path reference page (methods, smooth types, simplify and flatten defaults, booleans, importSVG and exportSVG options) and the Bezier.js documentation page (offset, outline, reduce, curvature, length, getLUT, project, arcs, intersects). Checked npm metadata: paper 0.12.18, bezier-js 6.1.4, and paper-jsdom's description as headless Node packaging.

### 5. perfect-freehand (Steve Ruiz): centerline to variable-width outline polygon

<https://github.com/steveruizok/perfect-freehand> · library · confidence: high · verified

**What it is.** A TypeScript library whose getStroke(points, options) returns the outline polygon of a pressure-sensitive stroke. It is used in tldraw, and a Figma plugin exists.

**How it works.** getStrokePoints() smooths and streamlines the input points into {point, pressure, vector, distance, runningLength}. getStrokeOutlinePoints() then offsets left and right of the centerline by a radius from size, thinning × pressure, with caps or tapers at each end. Options are size, thinning (negative values invert it), smoothing, streamline, simulatePressure, easing, start and end ({cap, taper, easing}), and last. Pressure can be supplied explicitly as a third coordinate with simulatePressure:false. The result is a polygon that you fill, converted to SVG path data with a midpoint-quadratic helper. The README notes that it works on any point list, not just hand input, and shows Feather icons run through getStroke.

**Why it matters here.** Engraved and banknote lines swell and taper by rule. That cannot be done with SVG stroke-width, which is constant along a path. Driving the pressure channel from a mathematical profile (for example curvature, or sin(πt) along a leaf) gives a 'burin' line that looks cut, not drawn.

**Ideas to borrow:**

- Render every engraved line as a filled outline polygon. Width w(s) = base × profile(s/L), where the profile is a named function (swell, taper-in, taper-out, golden swell peaking at t = 0.618).
- Feed the engine's sampled skeleton points with simulatePressure:false and pressure = profile(t). Setting smoothing and streamline to 0 keeps the shape exact.
- Put the start and end taper lengths in the theme tokens (for example taper = L/φ²), so every leaf tip and scroll end narrows in the same way.
- Convert outlines to SVG paths with a midpoint-quadratic join, and keep path-data precision consistent (for example 2 decimals at CSS-pixel scale).

**Designer workflow.** Designers adjust a few sliders (thinning, taper and easing) to set the stroke's character. Since the width comes from an explicit pressure channel, a designer or the engine can give width as a function of position along the line.

**Evidence read.** Downloaded and read the perfect-freehand README (getStroke, getStrokePoints, getStrokeOutlinePoints, the options table, 'Freehand Anything', the rendering helper). npm latest is 1.2.3.

### 6. canvas-sketch and canvas-sketch-util/penplot (Matt DesLauriers)

<https://github.com/mattdesl/canvas-sketch/blob/master/docs/physical-units.md> · tool · confidence: high · verified

**What it is.** A framework and CLI for generative artwork that runs in the browser with hot reload. It works in physical units and exports PNG and plotter-ready SVG.

**How it works.** Settings declare dimensions (an array or a paper preset such as 'A4' or 'postcard'), units ('in', 'cm', 'px'), pixelsPerInch, orientation and bleed. The render function gets width and height in those units, plus trimWidth, trimHeight and an exporting flag (used to hide guides such as the trim box from exports). The canvas is scaled to fit the browser window while drawing coordinates stay in real units, and pressing Cmd/Ctrl+S exports at the print resolution (3.5×2 in at 300 PPI gives 1050×600 px). penplot.createPath() offers a Canvas2D-style API (built on d3-path) that records path data. pathsToPolylines() discretizes curves using curveResolution. pathsToSVG(paths, {width, height, units, lineWidth, precision, optimize}) writes a physically sized SVG. Its optimize step sorts paths to shorten pen travel, removes duplicate and collinear points, and merges endpoints within mergeThreshold. renderPaths() returns [canvas, svg] layers so one sketch exports both.

**Why it matters here.** The owner wants output that looks printed and adapts to any page. Authoring ornaments in abstract design units (for example the medallion module = 1, ribbons in fractions of it) and converting to CSS pixels only at the render edge keeps proportions exact at every size. It also means the same engine can export a print-quality SVG of the masthead.

**Ideas to borrow:**

- Author ornament geometry in its own unit system (a 'module' or engraver's units) with a single scale applied at render time. Line weights can then scale proportionally or stay a fixed minimum, chosen per token.
- Add an 'exporting' or 'debug' render flag: when designing, overlay skeleton curves, golden rectangles, spiral guides and attachment stations; when exporting, strip them.
- Run an output optimization pass that removes collinear points and duplicates, merges touching endpoints, and fixes decimal precision, to keep SVG size down.
- Support named presets (masthead, sidebar, card, print-A4) the same way canvas-sketch supports paper presets.

**Designer workflow.** Designers iterate live in the browser and work in print units they already think in. Preview-only guides are drawn when not exporting. Some coding is needed, but the settings object is a small, readable spec.

**Evidence read.** Downloaded and read docs/physical-units.md from the canvas-sketch repo and docs/penplot.md from canvas-sketch-util (raw GitHub; the github.com HTML pages returned 503).

### 7. Tyler Hobbs, 'Flow Fields' essay: one dominant field that every line follows

<https://www.tylerxhobbs.com/words/flow-fields> · technique · confidence: high · verified

**What it is.** A technical essay by the generative artist behind Fidenza explaining flow fields: a grid of angles that steers every curve in the piece.

**How it works.** A 2D grid of angles covers the canvas plus a margin (the example extends 50% past each side, so curves can enter from outside and leave and come back). Cell spacing is around 0.5% of image width in his work (the pseudocode uses 1%). A curve starts at a point, looks up its cell, steps in that cell's direction (step length about 0.1–0.5% of width) for num_steps, and stops at bounds. Collision avoidance: at each step, check whether existing curves are within a minimum distance and stop the curve if so; Hobbs cites Jobard's paper on evenly spaced streamlines. Start points can come from a regular grid (stiff), uniform random (clumpy) or circle packing (even but loose). Continuous fields such as Perlin noise give curves that never cross; quantizing the angles (for example to multiples of π/10) gives faceted, 'sculpted' forms. Obstacles can bend the field around themselves like fluid around an object. All parameters are relative to image width, so the piece scales.

**Why it matters here.** This is the clearest working model of the owner's 'dominant functions stretch through the page and everything else is relative to them'. Defining the field analytically (from the page's dominant curves) instead of from noise makes every hatch line, ribbon strand and filler stroke follow the main sweep, and the separation distance gives the 'logical spread'.

**Ideas to borrow:**

- Build a page-level guidance field from the dominant curves, for example the tangent of the nearest spine blended by distance. Trace fill strokes and hatching through it so all minor lines visibly belong to the major ones.
- Use a separation rule (stop or refuse a streamline closer than d_sep to existing lines) to space clustered lines evenly. Make d_sep a golden-ratio token so the spacing within a cluster follows phi steps.
- Express all lengths (step, resolution, separation) as fractions of a reference length (page width or the ornament module) so the system stays proportional at any size.
- Extend the field past the visible box so ribbons can enter and leave the frame naturally at the page edges.
- Put obstacles into the field around text blocks and medallions so flowing lines bend around content instead of colliding with it.

**Designer workflow.** An artist tunes a few high-level parameters (field function, step, curve length, separation, start-point strategy) and judges the results. Hobbs warns that Perlin noise on its own is overused.

**Evidence read.** Read the full essay at tylerxhobbs.com/words/flow-fields (grid construction, margins, step sizes, collision rule, start-point strategies, continuous versus quantized fields, obstacles, the Jobard reference). I did not open Jobard's paper itself.

### 8. {Shan, Shui}* (Lingdong Huang): procedurally generated, infinitely scrolling SVG Chinese landscape scroll

<https://github.com/LingDong-/shan-shui-inf> · website · confidence: high · verified

**What it is.** A public web page that generates, in vector SVG and in the browser, a landscape scroll in the traditional style (mountains, trees, buildings, figures) that never ends horizontally. Everything is built from noise and math functions.

**How it works.** The seed comes from a ?seed= URL parameter (defaulting to the current timestamp) and feeds a PRNG that replaces Math.random globally, so a URL always reproduces the same scroll. Generation happens in two levels. First, mountplanner(xmin, xmax) produces a plan of tagged placements {tag:'mount'|'distmount'|'flatmount', x, y, h} from noise local maxima, and records occupied stretches in an occupancy array (planmtx, 5px buckets) so empty stretches get filler elements. Second, chunkloader turns each plan item into an SVG string ('canv'), generating chunks lazily in 512px-wide strips as the viewport moves and inserting them sorted by y for painter's ordering. chunkrender concatenates the chunks overlapping the viewport, and scrolling just changes the SVG viewBox. Brushwork comes from stroke(ptlist, {wid, fun, noi}), which offsets each point along the bisector normal by w = wid × fun(i/n) (default fun = sin(πt), so strokes taper at both ends), optionally modulated by noise, and fills the resulting polygon. A guard replaces any NaN in generated path strings.

**Why it matters here.** A real website whose main visual is runtime-generated SVG in a historical style, and which extends to an unbounded page length. It has the planner-then-renderer split and the width-profiled strokes the owner's engine needs. Its weak points (a global Math.random, string-built SVG) are also useful lessons.

**Ideas to borrow:**

- Separate a layout planner, which decides where the medallions, ribbon crossings, leaves and fillers go, from the stroke renderer. Planner output is a small, inspectable list that can be visualized and tested on its own.
- Track occupied space (an occupancy array or grid) during planning so filler ornament goes only into real gaps, not on top of other elements.
- Generate repeating borders for long pages in chunks keyed by position index, so a tall article generates only the visible ornament and the result is identical when you scroll back.
- Use width profiles (sin(πt) and similar) in the stroke function to get tapered, printed-looking line ends.
- Make the seed part of the URL or the content data so every published page is reproducible and can be debugged.

**Designer workflow.** There is no designer interface: the author encoded the style in code. Users share seeds. It shows that a traditional, hand-made medium can be reproduced convincingly only once its conventions (taper, layering, spacing) are written as explicit functions.

**Evidence read.** Read the README and downloaded index.html from the GitHub repo. Read the Prng seeding and parseArgs code, stroke(), mountplanner and planmtx logic, chunkloader (cwid 512), chunkrender and calcViewBox/update.

### 9. Rive: Follow Path constraint and Layout fit, a designer-authored constraint runtime on the web

<https://rive.app/docs/editor/constraints/follow-path-constraint> · tool · confidence: medium · verified

**What it is.** A design tool for interactive vector graphics with open-source runtimes (web canvas/WASM, React and others). Designers author constraints in the editor; the runtime evaluates them live.

**How it works.** Follow Path constraint, as set in the editor: Target (a path or shape), Distance (a percentage of the path, which may exceed 100%), Orient (rotation follows the path; manual rotation is locked), Offset (keeps the object's own offset from the path) and Strength (how strongly the constraint applies). Runtime (rive-cpp follow_path_constraint.cpp): it gathers every contour of the target shape into a ContourMeasureIter and sums totalLength. The distance is wrapped with positiveMod(d, 1); a whole-number nonzero value maps to 1, the end of the path. distance × totalLength is found within the right contour, and getPosTan returns the point and tangent. With Orient on, rotation = atan2(tangent). Strength linearly interpolates translation between the original and constrained transforms. Responsive layout: with Fit.Layout, the artboard resizes to its canvas using constraints authored in the editor. layoutScaleFactor scales the content. The docs say to call resizeDrawingSurfaceToCanvas() on window resize and on device-pixel-ratio changes.

**Why it matters here.** Its data model is exactly what the owner needs: a part (leaf, bead, jewel) is bound to a dominant path by an arc-length fraction, oriented by the tangent, with an offset and a blend strength. Copying this as the engine's attachment primitive keeps authoring visual instead of mathematical.

**Ideas to borrow:**

- Make the attachment primitive `{target: spineId, distance: 0..1 (wrapping allowed), orient: boolean, offset: along-normal distance, strength: 0..1}`, which matches what designers already know from Rive.
- Measure arc length across all contours of a compound skeleton, so one 'distance' parameter can travel continuously around a whole frame (four sides and corners) and an ornament repeat can wrap seamlessly.
- Treat 'distance > 1 wraps' as the rule for repeating borders: a bead at distance k/N for k = 0..N-1 tiles a closed border with no special corner case.
- Re-evaluate constraints when the container or device pixel ratio changes, not only on window resize.
- Give the designer a visual editor (even a minimal web page) where dragging a leaf along the spine updates its distance value and writes it back to the ornament definition.

**Designer workflow.** Designers draw a path, select an object, add the constraint and drag Distance, all visually with no code. This is the strongest example found of making 'element positioned relative to a curve' usable by someone who designs in Illustrator-like tools.

**Evidence read.** Read the Rive docs page for the Follow Path constraint and the runtime layout overview. Read rive-cpp's follow_path_constraint.cpp through the Skia googlesource mirror. Layout and Fit.Layout details come from the web-runtime layouts docs as summarized by search; I opened the general layout page, which was only an overview.

### 10. Generative identity systems: MIT Media Lab 2011 (TheGreenEyl and E Roon Kang), the Pentagram 2014 grid system, and the Stripe.dev 'design instrument'

<https://www.creativeapplications.net/project/mit-media-lab-identity-processing/> · website · confidence: medium · partly verified (see note)

**What it is.** Three brand identities whose consistency comes from shared rules plus code rather than fixed artwork: the 2011 Media Lab logo generator, Pentagram's 2014 glyph system built on the earlier seven-by-seven grid (pentagram.com/work/mit-media-lab/story), and Stripe's developer site, which generates line art and accent colors from content (awwwards.com/case-study-stripe-dot-dev.html).

**How it works.** MIT 2011: a Processing application places three shapes ('cones') on an invisible 4×4 grid under aesthetic rules: each must hit the grid boundaries and must intersect the others. It produced about 40,000 logos per color combination across 12 combinations. Each logo was exported as SVG, then converted to CMYK PDF by Illustrator scripting. Staff picked their logo from the pre-generated set in a web interface; nothing was rendered on the fly. Pentagram 2014: one underlying grid produces the ML monogram and a glyph for each of the 23 research groups, an 'interrelated system of glyphs' (the page gives no construction rules). Stripe.dev: 'simple math' generates clean line art from article content, the same math cycles accent colors, and a canvas footer redraws on scroll. Engineers built a 'design instrument' to explore the possibility space and produced several dozen pieces. Design and code fed each other in a loop (Next.js, canvas, Figma).

**Why it matters here.** Shows how a rule-based visual system stays consistent across many outputs while still varying. Also shows the realistic workflow for a designer who is not a programmer: generate many candidates, curate, pin the choice, and send the output back to Illustrator.

**Ideas to borrow:**

- Write rules as validity checks run against generated candidates (for example 'leaf tips must lie on the golden spiral within 0.5%', 'ribbons must cross at stations with t = 1/φ^k'). Discard candidates that fail.
- Build a 'design instrument' page: sliders from the parameter manifest, a seed scrubber, a grid of candidate renders, and a 'pin' button that writes the chosen seed and parameters into the ornament's JSON.
- Keep a round trip with Illustrator: export engine output as clean, layered, named SVG so the designer can inspect or annotate it in Illustrator, and treat that SVG as a design artifact.
- Precompute and ship static SVG for fixed placements (masthead, corner medallions at standard sizes), and generate at runtime only what must adapt (side ribbons, bands).

**Designer workflow.** In all three, designers set the rules and judge or select the output; code supplies the variety. In MIT's case, the generator's results went back into Illustrator for production, which keeps the designer's normal tool in the loop.

**Evidence read.** Read the CreativeApplications.net project page (Processing, 4×4 grid, rules, 12 color combinations, about 40,000 per combination, SVG to PDF through Illustrator scripting, a pick-only web interface), Pentagram's MIT Media Lab story page, and the Awwwards Stripe.dev case study. Sources disagree on the 2011 grid size (4×4 versus five-by-five versus seven-by-seven), so treat the grid detail as uncertain.

> **Verification note:** MIT 2011 (CAN) is supported: a Processing app moves 3 shapes on a 4x4-square grid under rules that they hit the boundaries and intersect, giving 40,000 logos x 12 color combinations, about 480,000 total. Pentagram's page confirms the ML monogram and a glyph system for 23 groups built on the previous anniversary logo's 'seven-by-seven grid'. The page gives no year; 2014 is correct from other knowledge. Note the 4x4 (CAN) vs 7x7 (Pentagram) grid descriptions conflict between sources. Stripe is overstated: the Awwwards case study says purely content-generated art 'lacked a human touch', so they built a design instrument (stripe.dev/art) to 'play' the possibility space and hand-produce several dozen pieces. 'The same simple math' cycles the accent colors. Neither the art nor the colors are generated from content.

### 11. Penrose (CMU): ensure/encourage constraint styling with optimization

<https://penrose.cs.cmu.edu/siggraph20> · paper · confidence: medium · verified

**What it is.** A research system (SIGGRAPH 2020, Ye et al.) with a web-based renderer. It turns abstract statements (Substance) into diagrams using a reusable visual Style program, solving layouts by numerical optimization.

**How it works.** Three programs: Domain (types and predicates), Substance (the specific objects and relations) and Style. Style uses forall/where selectors to map each kind of relationship to shapes and to constraints. Hard requirements use ensure: contains, disjoint, onCanvas, lessThan, equal and others, with padding. Soft preferences use encourage: near, notTooClose, sameCenter, above and others. Constraints become penalty terms (for example equal as an objective penalizes (x−y)^2, and lessThan penalizes max(0, x−y)^2) that are minimized by optimization with symbolic differentiation. The same Style file applies to many different Substance programs, and one Substance can be shown under different Styles. The paper's workflow generates many candidate diagrams so the user can pick from a gallery.

**Why it matters here.** A precise model for writing 'everything relative to dominant functions' as declarative rules instead of hand-placed coordinates, with a clear split between requirements (leaf tips ON the golden spiral) and preferences (leaves roughly evenly spaced, clear of text).

**Ideas to borrow:**

- Write ornament relationships declaratively in two classes: ensure (hard, checked and reported on failure) and encourage (soft, optimized). For example: ensure tipsOnSpiral(flame.leaves, flame.spiral, tol); encourage evenSpacing(flame.leaves).
- Solve the soft constraints at authoring or build time and bake the result as plain parameters, so pages do not run an optimizer.
- Write one Style per ornament family (acanthus corner, flame corner, ribbon band) and apply it to many content contexts (page sizes, sections), as Penrose reuses one Style across many Substances.
- Show a gallery of solved candidates, as the paper suggests, rather than trusting a single optimizer run.

**Designer workflow.** The style author writes rules once. Content authors then get consistent diagrams for free. Writing Style still takes code, but the hard-versus-soft split is easy to grasp.

**Evidence read.** Read the penrose.cs.cmu.edu/siggraph20 project page (ensure/encourage examples, forall/where, layering, candidate exploration) and the Style functions reference (constraint and objective list, penalty forms). I did not read the full paper PDF, so the optimizer's internals are unverified.

### 12. Modular Scale and Utopia: ratio-based proportional systems enforced across a site and across viewport sizes

<https://utopia.fyi/blog/clamp/> · technique · confidence: high · verified

**What it is.** Modular Scale (Tim Brown and Scott Kellum, modularscale.com) generates a sequence of sizes from a base and a ratio, with the golden section 1:1.618 as a preset. Utopia (utopia.fyi) defines a type scale at a small and a large viewport and interpolates between them with CSS clamp().

**How it works.** Modular Scale: values come from base × ratio, used as numbered steps through ms(n) in Sass or JS. Several bases sharing one ratio stay related; the site warns that mixing several bases and several ratios breaks the relationship. Utopia: designers choose a base size and ratio for the minimum viewport (example: 1.2 at 320px) and for the maximum (example: 1.333 at 1500px). Each step n is a linear interpolation: slope = (maxSize − minSize)/(maxWidth − minWidth), intercept = −minWidth × slope + minSize, emitted as --step-n: clamp(min, intercept + slope·100vw, max). Elements refer to a step number ('H2 is always step 4') rather than a pixel size.

**Why it matters here.** The owner wants phi enforced everywhere and the page to adapt to any size. A phi-step token scale (leaf sizes, band spacings, line weights, medallion radii) that interpolates between a phone layout and a desktop layout gives both, and the designer works with step numbers, not raw values.

**Ideas to borrow:**

- Define ornament tokens as phi steps: size(n) = module × φ^n. Leaves along a stem are sized size(0), size(−1), size(−2)…, and parallel-line gaps follow gap(n) = g × φ^(−n).
- Interpolate the module between two designed endpoints (a minimum and maximum container width), as Utopia does, so ornament density and weight scale smoothly with no breakpoints.
- Use one ratio (φ) and one base per family, following Modular Scale's warning that mixing bases and ratios destroys the relationships.
- Emit the tokens as CSS custom properties too, so the typography and the ornament engine share the same proportional system.

**Designer workflow.** Designers make two decisions (the small-screen scale and the large-screen scale) and then only refer to step numbers. This is the most designer-friendly golden-ratio enforcement found on the web.

**Evidence read.** Read utopia.fyi's 'Designing with fluid type scales' and its clamp() article (slope and intercept formula, --step-0 output, the text-zoom caveat), and the modularscale.com home page (base, ratio, golden-section preset, the multiple-base warning, ms(n)).

## Principles

- **Ornament rendering is a pure, deterministic function of (box size, named parameters, seed). No hidden state, no Math.random.**
  - Source: CSS Paint API spec (instances may be discarded; at least two global scopes; each call gets a fresh context), Wired Elements WiredBase.draw(svg, size), Excalidraw stored per-element seed
  - Apply: Type the core API as `generate(ornamentDef, size, params, seed): Drawable`. Pass an explicit PRNG object derived from the seed into every sub-generator, and ban global randomness with a lint rule.
- **Generate geometry separately from rendering, and cache geometry against exactly the inputs that change it.**
  - Source: Rough.js RoughGenerator/Drawable/toPaths; Excalidraw ShapeCache (WeakMap, deleted only on width, height or points changes) plus a separate raster cache keyed on zoom and theme; spec-level paint image caching
  - Apply: Use two cache layers: (1) skeleton and attachment solving keyed on (definition hash, rounded size); (2) the SVG path strings. A theme or color change only restyles the SVG. Always regenerate from scratch for print or export.
- **Seed per position, not per draw, so resizing adds repeats without reshuffling the existing ones.**
  - Source: Paint Flecks worklet (PRNG fork() per column and per cell); shan-shui-inf chunks keyed by x
  - Apply: For repeating borders and bands, seed each repeat with hash(ornamentSeed, repeatIndex), and index repeats from a fixed anchor (for example the top-left medallion) so a longer page only adds repeats at the far end.
- **Plan first, draw second: compute the dominant skeleton and placements as plain data before generating any strokes.**
  - Source: shan-shui-inf (mountplanner and planmtx, then chunkloader and stroke); Tyler Hobbs (field first, curves second); Penrose (Style constraints solved before rendering)
  - Apply: Pipeline: page box → dominant curves (spines, golden spirals) → attachment solve (leaves and beads at arc-length stations) → stroke expansion (outlines, offsets, hatching) → SVG. Provide a debug view of the plan stage alone.
- **Bind every dependent element to a dominant curve by normalized arc length, orientation from the tangent, and offset along the normal.**
  - Source: Rive Follow Path constraint (distance %, orient, offset, strength; runtime getPosTan over all contours); Paper.js getPointAt, getTangentAt, getNormalAt, getCurvatureAt
  - Apply: Use an attachment schema {spine, t, orient, normalOffset, scaleFrom: 'curvature'|'token'}. Choose t from phi sequences and scale leaf curl from the local radius of curvature, so leaves continue the sweep.
- **Line weight is geometry: build each engraved line as a filled outline with an explicit width profile, not as an SVG stroke-width.**
  - Source: perfect-freehand getStroke (pressure-driven outline, tapers); shan-shui-inf stroke() with width = wid × sin(πt); Bezier.js graduated outline(d1, d2, d3, d4)
  - Apply: Use a stroke expander `outline(path, profile, base)` with a library of named profiles (swell, taper, golden-swell). Feed explicit pressure (simulatePressure:false) and switch off smoothing so the geometry stays exact.
- **Clustered lines get their spread from a rule (exact offsets or a separation distance), not from eyeballing.**
  - Source: Bezier.js offset(d) and reduce() (splits curves until endpoint normals differ by at most 60°); Tyler Hobbs' minimum-distance rule citing Jobard's evenly spaced streamlines
  - Apply: Generate bands as offsets at phi-scaled gaps, or as streamlines traced through a field from the dominant curves with d_sep as a token. Clamp offset distance against the local radius of curvature to prevent cusps in tight scrolls.
- **Enforce proportions through one ratio and numbered steps, and interpolate between two designed endpoints for responsiveness.**
  - Source: Modular Scale (base × ratio, golden-section preset, the multiple-base warning); Utopia clamp() interpolation between minimum and maximum viewport scales
  - Apply: Ornament tokens are module × φ^n. The module interpolates linearly between a small-container and a large-container design. Designers refer to step numbers, never raw pixel values.
- **Separate hard rules from soft preferences, and check hard rules automatically.**
  - Source: Penrose ensure versus encourage; MIT Media Lab 2011 rules (must hit grid boundaries, must intersect)
  - Apply: Write golden-ratio requirements as assertions (tips on spiral within tolerance, crest proportions φ:1) that fail the build or flag the design tool. Optimize preferences (even spacing, clearance from text) at authoring time and bake the results.
- **The parameter manifest is the designer's interface.**
  - Source: houdini.how worklet manifests (type, default, range, step per custom property); Stripe.dev 'design instrument'; canvas-sketch settings and presets
  - Apply: Each ornament family ships a JSON manifest. A small authoring page generates sliders and a seed scrubber from it, renders candidates side by side, and writes the pinned choice back to the ornament definition file.
- **Adapt detail to size explicitly, rather than only scaling.**
  - Source: Excalidraw adjustRoughness (lowers roughness on small elements); Hobbs (all step and resolution values relative to image width)
  - Apply: Each ornament defines level-of-detail thresholds (for example drop the third leaf tier below a certain module size, merge parallel lines below a minimum printable gap, enforce a minimum line weight).
- **Keep the decorative layer out of layout, input and the accessibility tree.**
  - Source: Rough Notation (absolutely positioned SVG, pointer-events:none); Wired Elements overlay; paint worklets are CSS images and never in the accessibility tree
  - Apply: Render ornaments in absolutely positioned or background SVG with aria-hidden="true" and pointer-events:none, and hide them until the first render to avoid a flash. Respect prefers-reduced-motion for any draw-in animation.

## Cautions

- Do not build the engine on the CSS Paint API. caniuse (checked 2026-10) shows Chrome and Edge only: no Firefox support, and Safari has it disabled by default. The GoogleChromeLabs css-paint-polyfill repo has been archived and read-only since April 2026. The houdini.how GitHub repo was archived in 2023, and the houdini.how domain now redirects to an unrelated site. Worklets also output raster images (no vector printing, no text drawing, no pixel readback) and cannot see other elements, so a frame cannot respond to content outside its own box.
- Rough.js, Rough Notation and Wired Elements look the opposite of what the owner wants. Copy their architecture (generator, seed, resize redraw), not their randomness. A seed alone may not keep output stable either: an Excalidraw issue reported that Rough.js fills used a variable number of random calls, which shifted the outline's random stream. Give each sub-element its own forked PRNG stream.
- Offsetting a Bézier curve is always an approximation (Bezier.js reduce() splits curves until endpoint normals differ by at most 60°). Tight acanthus curls and golden spirals therefore produce many segments, and offsets larger than the local radius of curvature create cusps or self-intersections. Clamp offsets or merge lines there, and check path counts and SVG size.
- Paper.js path length is approximate, and the library moves slowly (npm latest 0.12.18). Fine for authoring-time or build-time geometry, but measure performance before running heavy boolean operations on every resize.
- Redrawing on resize can thrash. Rough Notation throttles to 400ms and redraws only when the rects really changed. A full engraving rebuild (thousands of outline polygons) on every ResizeObserver tick will stutter, so throttle, show a simplified version during the drag, and do the full render once the size settles.
- Large SVG documents get slow: shan-shui-inf builds giant SVG strings and swaps innerHTML. Combine strokes of the same style into one path per layer, reduce path-data precision, and avoid one DOM node per leaf vein.
- Global PRNG overrides (shan-shui-inf replaces Math.random) are fragile once several ornaments render in one page. Use explicit PRNG instances.
- Optimizer-based layout (Penrose) can be slow and gives different results on different runs. Use it at authoring or build time and bake the results; do not run an optimizer on every page view.
- Flow fields driven by Perlin noise read as 'generative art', not engraving, and Hobbs himself calls plain noise overused. Discontinuous fields make lines cross. For this project, build fields from the dominant analytic curves.
- Generative-identity critiques apply. Experimental Jetset insisted the Whitney identity 'could never be a machine' even though it ran on strict rules, and the MIT 2011 logos were generated in advance and curated, not rendered live. Keep the designer as the one who picks and pins outputs rather than letting the engine improvise on every page load.
- Sources disagree on details of the MIT 2011 identity (4×4 versus five-by-five versus seven-by-seven grid; 2010 versus 2011), and the Pentagram page gives no construction rules. Treat it as inspiration for the workflow, not a technical spec.
- Utopia warns that clamp()-based fluid sizing can interfere with users' browser text zoom. If ornament tokens are tied to the same clamp() values, test zoom behavior.
- No real newspaper or editorial site was found that renders Victorian-style ornamental frames procedurally at runtime. The searches surfaced only stock ornament files and nine-slice or border-image approaches. Nine-slice stretching cannot preserve golden-ratio relationships, so this engine would be novel and will need its own test pages and visual regression snapshots.
