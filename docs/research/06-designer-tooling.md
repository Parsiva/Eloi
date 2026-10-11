# Designer tooling for parametric design

> Research angle `designer-tooling` — part of the [frame engine research](README.md).

## Summary

Across the tools that worked for designers who are not full-time programmers, the common move is that the designer keeps drawing and the tool turns the drawing into structure. Grasshopper references a hand-drawn Rhino curve as a live driver. Illustrator pattern brushes and Glyphs corner, segment and cap components hold tiles in named slots. Glyphs smart components interpolate between "extreme" drawings that share the same point structure. In Cuttle, Apparatus, Sketch-n-Sketch and Bret Victor's prototype, canvas gestures edit a program. For this engine that points to five features. (1) Illustrator stays the surface for drawing motifs (leaf, flame tongue, crest parts) and rough "dominant" curves, which go on named construction layers. (2) The engine fits those curves to exact families (golden or log spiral, clothoid, kappa-curve), reports how far the drawing deviates, and only then snaps the curve to phi. It never infers this silently. (3) Every ornament is placed in arc-length and normal coordinates along a spine, using Inkscape's Pattern Along Path formula, with whole-number tile counts and Illustrator-style "stretch between guides" so leaf tips are never distorted. (4) A browser workbench offers a short, named parameter panel with JSON presets, on-canvas handles bound to chosen parameters with phi-locked constants frozen, editors that draw the spacing law for clustered lines, and a contact sheet showing the frame at many page sizes. (5) Recursion stops when parts get too small to render, not at a fixed depth, so fine engraved detail holds at every size. The pitfalls are well documented: unstructured "spaghetti" graphs, and parametric models that must be rebuilt when their topology changes (Davis found 97.5% of 2,002 Grasshopper models had no modules). Apparatus's drag solver jumps between solutions, Sketch-n-Sketch generates code nobody can read, Spiro curves blow up when points move too far, and round-tripping SVG through Illustrator is unreliable.

## Case studies

| # | Case study | Kind | Confidence | Verification |
|---|---|---|---|---|
| 1 | [Grasshopper for Rhino (curve parameters, Perp Frames, Graph Mapper, referenced Rhino curves)](https://www.grasshopper3d.com/) | tool | medium | verified |
| 2 | [Daniel Davis, 'Modelled on Software Engineering: Flexible Parametric Models in the Practice of Architecture' (PhD thesis, RMIT 2013)](https://www.danieldavis.com/thesis-ch6/) | paper | high | verified |
| 3 | [Inkscape Live Path Effects: Pattern Along Path, Power Stroke, and the original-d/d storage model](https://gitlab.com/inkscape/inkscape/-/raw/master/src/live_effects/lpe-patternalongpath.cpp) | tool | high | verified |
| 4 | [Adobe Illustrator pattern brushes and art brushes](https://www.adobe.com/learn/illustrator/web/illustrator-create-pattern-brush) | tool | medium | partly verified (see note) |
| 5 | [Glyphs app smart components, corner and cap components, segment components and brushes](https://handbook.glyphsapp.com/components/smart/) | tool | high | verified |
| 6 | [Sketch-n-Sketch (UIST 2016 'Semi-Automated SVG Programming via Direct Manipulation'; UIST 2019 'Output-Directed Programming for SVG')](https://arxiv.org/pdf/1608.02829) | paper | high | verified |
| 7 | [Apparatus and Recursive Drawing (Toby Schachman)](https://dynamicland.org/2015/Apparatus_at_Future_Programming_Workshop/) | tool | high | verified |
| 8 | [Cuttle (cuttle.xyz)](https://cuttle.xyz/blog/cuttle-a-new-cad-tool-for-rapid-prototyping) | tool | medium | verified |
| 9 | [Bret Victor, 'Drawing Dynamic Visualizations' (talk plus additional notes)](https://worrydream.com/DrawingDynamicVisualizationsTalkAddendum/) | technique | high | verified |
| 10 | [Graphite (graphite.art, formerly graphite.rs)](https://graphite.art/features/) | tool | medium | verified |
| 11 | [kappa-curves (shipped as Adobe Illustrator's Curvature tool) and the epsilon-kappa extension](https://people.engr.tamu.edu/schaefer/research/kcurves.pdf) | paper | high | verified |
| 12 | [Fitting fair curves to hand-drawn strokes: Spiro/Euler-spiral splines (Levien), clothoid sketch fitting (Baran et al.), log-aesthetic curves](https://homes.cs.washington.edu/~jovan/papers/baran-2010-scs.pdf) | paper | medium | verified |
| 13 | [Slider panels: Tweakpane, lil-gui, Leva](https://tweakpane.github.io/docs/misc/) | library | high | verified |
| 14 | [Observable runtime and Inputs (reactive notebooks)](https://github.com/observablehq/runtime) | library | medium | verified |
| 15 | [Figma variables, modes and constraints](https://help.figma.com/hc/en-us/articles/14506821864087-Overview-of-variables-collections-and-modes) | tool | high | verified |
| 16 | [Houdini Wedge TOP (parameter sweeps for review)](https://www.sidefx.com/docs/houdini/nodes/top/wedge.html) | tool | high | verified |

### 1. Grasshopper for Rhino (curve parameters, Perp Frames, Graph Mapper, referenced Rhino curves)

<https://www.grasshopper3d.com/> · tool · confidence: medium · verified

**What it is.** A node-based graphical algorithm editor built into Rhino. McNeel says it needs no programming or scripting knowledge, and it is widely taught in architecture and urban design.

**How it works.** A definition is a dataflow graph of components joined by wires. Number Sliders feed component inputs, and the whole graph recomputes and previews live in the Rhino viewport. A curve is evaluated by a parameter t inside its domain. Reparameterize changes the domain to 0..1 but does not make spacing even along the length, so t=0.5 is not the midpoint by length (David Rutten, via bimcorner and forum results). Divide Curve and Divide Length give equal spacing. For uneven spacing, Evaluate Curve takes a list of t values, often shaped by Graph Mapper. Graph Mapper maps 0..1 to 0..1 through a graph the user edits (linear, bezier, parabola and others), then Remap Numbers scales the result to a target domain. Perp Frames and Horizontal Frames place planes along the curve so geometry can be oriented to it (tangent and normal), and Curve Array distributes copies. Set One Curve links a component input to a curve drawn in Rhino: editing that curve re-solves the graph. Internalise freezes a copy, and deleting and redrawing the curve breaks the link.

**Why it matters here.** This is the closest established model of 'a hand-drawn dominant curve drives the positions, orientations and spacing of everything else', and the user already knows this culture from urban planning.

**Ideas to borrow:**

- Construction-curve inputs: the engine reads named curves from the designer's Illustrator SVG (e.g. layer 'spine-left-ribbon') as live drivers, the same way Set One Curve references a Rhino curve. Re-exporting from Illustrator re-solves the frame.
- Parameterize every spine by arc length (s in [0,1] by length), never by raw Bezier t. Expose evaluate(s), with point, tangent and normal frame, as the core API that ornaments are placed with.
- A 'Graph Mapper' widget: the spacing of N clustered lines or leaves is spacing_i = map(i/(N-1)), where map is a designer-edited 0..1 curve or a named law (linear, geometric with ratio 1/phi, sine). It is drawn as a small graph next to the slider.
- Perp frames: every placed motif receives a local frame (origin, tangent, normal) and is drawn in that frame, so it turns with the sweep of the line.
- Explicit 'internalise / freeze' for construction curves, so a frame can be shipped without its source file.

**Designer workflow.** Designers draw guide curves by hand in Rhino and the graph builds everything else relative to them. That is exactly the 'dominant function' idea. Sliders make exploring variations easy. The hard parts: telling parameter t apart from arc length, data trees, missing references when a file is reopened without its Rhino geometry (McNeel forum thread), and large graphs becoming illegible (see the Davis thesis).

**Evidence read.** Opened: grasshopper3d.com homepage (description); TU Delft Digipedia 'Curve Frames and Arrays' tutorial (Divide Curve, Perp and Horizontal Frames, Curve Closest Point, Remap Numbers, Graph Mapper); bimcorner article on parametric curves (t, domain, Reparameterize, non-uniform parameterization); McNeel Discourse thread on Set One Curve and Internalise. Graph Mapper bezier remap pitfall and Rutten's Reparameterize quote came from search-result summaries of grasshopper3d.com and discourse.mcneel.com threads that I did not open individually.

### 2. Daniel Davis, 'Modelled on Software Engineering: Flexible Parametric Models in the Practice of Architecture' (PhD thesis, RMIT 2013)

<https://www.danieldavis.com/thesis-ch6/> · paper · confidence: high · verified

**What it is.** An empirical study of why parametric (mostly Grasshopper) models in architecture become brittle and unreadable, and which software-engineering practices help.

**How it works.** Chapter 1: practitioners report that when a design's topology changes, the model 'generally needs to be remade' (Gerber), or has to be disassembled entirely (Mark Burry). Chapter 6 analysed 2,002 Grasshopper models: 97.5% had no modules, 48% had no groups, text, named branches or clusters, and 81% had no uniquely named parameters. In a think-aloud test, every participant could explain a structured model's overall function, and none could explain the same model in unstructured form. A larger structured model was easier to understand than a small unstructured one. In the Dermoid pavilion case study, the work was split into six stages with defined inputs and outputs. That allowed concurrent work, swapping software, and making late changes. A newcomer reused most of the modules. Grasshopper clusters show only one level of abstraction at a time, and edits to a cluster do not propagate to reused instances.

**Why it matters here.** The user is an urban-planning student who will build a parametric ornament system. This is the best evidence of what goes wrong and how to prevent it.

**Ideas to borrow:**

- Make named modules the unit of design: Spine, Medallion, Ribbon, Flame, Crest, Band. Each has typed inputs, typed outputs and one job, and a module cannot be referenced without a name.
- Make topology an explicit integer or discrete parameter (number of leaves, number of ribbon crossings, number of bead tiles) with designed behaviour at each value, so a topology change is a parameter change rather than a rebuild.
- Generate a dependency diagram of modules from code automatically, so structure stays visible without hand-maintaining a node graph.
- Shared module definitions update every instance (unlike Grasshopper clusters), and each instance keeps its own overrides (the master/instance model from Apparatus).

**Designer workflow.** Structure was almost always added later, by refactoring, rather than planned up front. Naming parameters and grouping nodes are cheap habits that architects rarely practise.

**Evidence read.** Opened danieldavis.com/thesis-ch6 (structured programming: statistics, experiment, Dermoid case study) and danieldavis.com/thesis-ch1 (brittleness quotes). I did not read the full PDF.

### 3. Inkscape Live Path Effects: Pattern Along Path, Power Stroke, and the original-d/d storage model

<https://gitlab.com/inkscape/inkscape/-/raw/master/src/live_effects/lpe-patternalongpath.cpp> · tool · confidence: high · verified

**What it is.** Non-destructive path effects that can be stacked. Pattern Along Path bends a pattern path along a skeleton path. Power Stroke turns a centreline into a variable-width outline driven by width knots placed along the path.

**How it works.** Pattern Along Path, from the source code: the skeleton is converted to arc-length parametrization (arc_length_parametrization(path, 2, 0.1)) and its normal is n = rot90(derivative(uskeleton)). Each pattern point (x, y) maps to output = uskeleton(x + offset) + y * n(x + offset). Copy modes are Single, Single stretched, Repeated and Repeated stretched. In 'Repeated, stretched' the code computes a whole-number copy count, floor((L - tangential offset + spacing)/(patternWidth + spacing)), at least 1, then a uniform scale so the copies exactly fill L. Closed skeletons are handled separately. Other parameters: width (prop_scale), 'width in units of length', spacing (negative allowed down to -90%), normal offset, tangential offset, offsets in units of pattern size, pattern is vertical, and fuse nearby ends. Power Stroke stores offset_points as (time along path, width) pairs, with an option to keep them sorted. The interpolators are CubicBezierSmooth, Linear, CubicBezierFit, CubicBezierJohan (with a 0..1 smoothness beta), Spiro, and Centripetal Catmull-Rom, which is the default. The joins are bevel, round, extrapolated arc, miter and spiro. A plain 'Extrapolated' join is commented out in the source as not working well. Storage: Inkscape keeps the source path in inkscape:original-d and the effect parameters in inkscape:path-effect elements in defs, and writes the computed result to the standard d attribute, so any SVG viewer renders it correctly.

**Why it matters here.** This is a production implementation of placing ornament in spine coordinates, which is exactly the user's ribbons weaving down the page sides and bead/zigzag bands following a curve. Power Stroke is the swelling-and-tapering engraved line.

**Ideas to borrow:**

- Core placement transform: motif(x, y) -> spine(s0 + x) + y * normal(s0 + x), with the spine reparameterized by arc length. Every band, ribbon and leaf string in the engine uses this.
- Tile fitting: n = max(1, floor((L + gap)/(w + gap))), then scale = L/(n*w + (n-1)*gap). Bands always end on whole tiles at any page size. Expose the modes single, single-stretched, repeated and repeated-stretched.
- Offsets in 'units of pattern size' as an option, so spacing ratios (for example gap = w/phi^2) survive scaling.
- Engraved strokes as a centreline plus a width profile [(s_i, w_i)] with a selectable interpolator. Default to Centripetal Catmull-Rom and keep a smoothness slider.
- Two-layer storage: keep the editable source (spine and parameters) in a JSON sidecar or data-* attributes and emit plain SVG d for rendering, as with original-d/d.

**Designer workflow.** Designers edit the skeleton or the pattern and the result updates live. Width knots are dragged directly on the canvas, and Ctrl-click adds a knot. LWN reports that the maths breaks down with very sharp corners combined with very large widths, and that filling a Power Stroke shape needs an extra Clone Original effect.

**Evidence read.** Read the actual source (lpe-patternalongpath.cpp and lpe-powerstroke.cpp from gitlab.com/inkscape/inkscape master), the Inkscape 1.3 manual LPE page, the Inkscape wiki pages on PowerStroke, LPE stacking and Creating Live Path Effects, and LWN article 495808. The original-d/d fallback description comes from search results (Full Circle Magazine, LGM 2012 slides) plus LWN.

### 4. Adobe Illustrator pattern brushes and art brushes

<https://www.adobe.com/learn/illustrator/web/illustrator-create-pattern-brush> · tool · confidence: medium · partly verified (see note)

**What it is.** The brush system the user already works in. A pattern brush repeats designer-drawn tiles along any path. An art brush stretches one drawing along a path.

**How it works.** A pattern brush has up to five tile slots: outer corner, side, inner corner, start and end. The fit options are Stretch to Fit, Add Space to Fit, and Approximate Path, which changes the path itself so tiles are neither distorted nor spaced out. Corners can be auto-generated from the side tile: Auto-Centered (the side tile is stretched around the corner), Auto-Between (one copy of the side tile on each side, folded into the corner), Auto-Sliced (a diagonal mitre, like a picture frame), and Auto-Overlap. Tutorials state that corner tiles should be square and all tiles should share the side tile's height. Art brush scale modes are Scale Proportionately, Stretch to Fit Stroke Length, and Stretch Between Guides, where only the art between two guides stretches and the head and tail stay undistorted. Brushes remain live appearance until they are expanded.

**Why it matters here.** The user's lattice, bead and zigzag bands and the frame corners map directly onto side, corner, start and end slots. The leaves and flame tongues need 'stretch between guides' so tips never distort when a stem lengthens.

**Ideas to borrow:**

- A 'frame brush' asset format: the designer supplies an SVG with layers named side, corner-outer, corner-inner, start and end, plus guide lines. The engine applies it to any frame path at any size.
- Stretch-between-guides for motifs: two guide x-positions split a motif into head, stretchable body and tail, and only the body maps onto the variable stretch of spine length.
- Auto-corner fallbacks (centered, between, sliced/mitre, overlap) for when the designer has not drawn a corner tile yet.
- An 'approximate path' mode: the engine nudges the spine length (for example the corner radius) so a whole number of tiles fits without stretching. This suits strict phi spacing.

**Designer workflow.** This workflow suits designers well: draw a tile, drop it into a slot, apply it to a rectangle. Pain points are mismatched tile heights, corner tiles that only work at sharp corners, and output that stays an appearance (Expand Appearance is needed). Brushes do not transfer to Inkscape or Affinity.

**Evidence read.** Opened adobe.com/learn 'Create a pattern brush' (tile slots, fit options, auto-generated corners) and logosbynick.com's tutorial (fit option definitions, Expand Appearance, no brush support in Inkscape). Corner names and art-brush guides come from search-result summaries of a Peachpit book excerpt and tutorials. helpx.adobe.com returned 403, so I could not read Adobe's official help page.

> **Verification note:** The page exists. It is a video tutorial covering side, corner, start and end tiles and the three fit options, and it mentions auto-generated corners only in general terms ('auto in between'). The four auto-corner names (Auto-Centered, Auto-Between, Auto-Sliced, Auto-Overlap) and their descriptions are correct, but they come from other sources such as Peachpit. One correction: Adobe's own help describes Approximate Path as fitting tiles to the closest approximate path without changing the tiles, placing them slightly inside or outside the path to keep tiling even. It does not edit the path object. 'Changes the path itself' is a third-party paraphrase. Adobe's helpx brush page returned 403 when fetched, so the Adobe wording above comes from memory, not a live read.

### 5. Glyphs app smart components, corner and cap components, segment components and brushes

<https://handbook.glyphsapp.com/components/smart/> · tool · confidence: high · verified

**What it is.** A professional type-design editor in which designers build parametric reusable parts by drawing, not coding. The parts include smart components with their own axes, corner components (serifs, ink traps) attached to path nodes, and segment components or brushes bent along path segments.

**How it works.** Smart components: each property (for example Width, Height or Roundness) has a minimum and maximum. The designer draws 'smart layers' at the extremes, and these must be compatible with the master layer (the same outline structure). Values in between are interpolated and values outside are extrapolated. Missing combinations of extremes are inferred. Properties named Width and Height drive the bounding box. 'Smart handles' work by placing an anchor named exactly like a property on every layer, which gives an on-canvas handle that drives that property. Corner components are an open path in a _corner glyph, injected at a corner node: the 'origin' anchor sits at the host corner, the 'left' and 'right' anchors act as pivots, and alignment modes decide which incoming or outgoing segment the shape slants to. Scaling distorts the shape unless the designer adds an Intermediate layer (for example at 150%), which is then interpolated. Segment components (_segment) and brushes (_brush) are stretched and bent onto a receiving segment, curved or straight, and stay linked until decomposed.

**Why it matters here.** This is the most designer-realistic answer to 'each leaf perfectly curved to uphold phi at every size'. The designer draws a leaf at its tightest and most open curl (or smallest and largest), and the engine interpolates it to the parameter that the golden spiral assigns to each position.

**Ideas to borrow:**

- Motif masters: each motif SVG has 2 to 4 compatible variants on named layers (leaf@min and leaf@max). The engine checks compatibility (same node count and order, with a clear error) and interpolates by a 0..1 axis value computed from the spine, for example leaf_i scale = phi^-i.
- Smart handles from named anchors: a point named 'handle:curl' in the Illustrator file becomes an on-canvas handle bound to the curl axis.
- Corner attachment: a corner motif carries an origin point and alignment rules (align to incoming, outgoing or bisector) and pivots to match the angle of the host corner.
- Intermediate masters at size extremes (medallion@small, medallion@large) instead of uniform scaling, so engraved stroke weights and gaps stay correct at every size.
- A 'decompose' escape hatch that is explicit and logged, never silent.

**Designer workflow.** Designers draw two or three versions of a part and get a slider. This is very approachable. The costs: the layers must stay point-compatible, extrapolation degrades complex shapes, forum reports describe problems with four or more axes, and any one-off tweak means decomposing the part, which breaks the link.

**Evidence read.** Opened the Glyphs Handbook Smart Components page, the glyphsapp.com tutorial on corner components, and the Glyphs 3 announcement (segment components and brushes). Forum limitations (axis mapping, four or more axes) came from search snippets only.

### 6. Sketch-n-Sketch (UIST 2016 'Semi-Automated SVG Programming via Direct Manipulation'; UIST 2019 'Output-Directed Programming for SVG')

<https://arxiv.org/pdf/1608.02829> · paper · confidence: high · verified

**What it is.** A research SVG editor where the source of truth is a functional program. Dragging the output changes constants in the program, and Draw, Relate and Group tools write code for the user.

**How it works.** Live synchronization records traces at run time that tie each output attribute to an expression over the program's constants. On a drag it solves one value-trace equation per changed attribute by changing exactly one constant, and uses heuristics when several constants could change. Annotations steer this: n! freezes a constant, and n? hints that the solver should prefer to remove that constant. Relate: Dig Hole lifts the relevant constants into a shared scope, the user (or Make Equal) fills the relationship, and Clean Up tidies the code. Group rewrites each child's bounding box as percentages of the group box. Abstract turns a group into a function over its non-frozen named constants. Duplicate followed by Merge turns copies into one function whose parameters are the constants that differ. Scaling semantics are library functions: stretchyPolygon (points as percentages of the box), stickyPolygon (offsets from the nearest corner) and stretchySnipPolygon (stretch up to a limit, then stick). The 2019 version exposes intermediate values (points, offsets, lists) as draggable widgets, lets the user draw inside a function's context, and provides Repeat Over Existing List (its example is leaf attachment points) and indexed merge with synthesis.

**Why it matters here.** This is the reference design for bidirectional editing ('edit the output and the program updates'), and its scaling semantics map directly to how ornament elements should respond when the page resizes.

**Ideas to borrow:**

- Per-element scaling semantics as a declared property: 'stretchy' (proportional to the parent box), 'sticky' (fixed offset from the nearest corner, which suits corner medallions) and 'stretchy-until-then-sticky' (for example a ribbon gap that grows to a maximum).
- Freeze annotations: constants derived from phi (spiral growth b = ln(phi)/(pi/2), leaf ratios) are marked frozen, so on-canvas drags can only change free parameters such as the spine anchor positions and never break golden relationships.
- Prefer hints: per-parameter priority for which value a drag changes (for example change the spiral start radius before the spine length).
- Hierarchical boxes as percentages of the parent, so a whole medallion group rescales consistently.
- Repeat over an existing point list: placing leaves on points computed along a spine is a first-class operation.

**Designer workflow.** Users draw roughly and then declare relationships. Reported failures: 18 Make Equals produced 'mathematically correct but unintelligible' equations; Make Equal can offer many options that are hard to tell apart; constraints cannot be broken afterwards; only 4 of 15 benchmark tasks were done without text edits; the path tool was disabled; it 'becomes sluggish on larger examples'; and widget clutter means most widgets are hidden until hover.

**Evidence read.** Read the full UIST 2016 paper text (downloaded the arXiv PDF, extracted with pdftotext) and the 2019 paper via ar5iv (intermediate widgets, focusing, repetition tools, limitations).

### 7. Apparatus and Recursive Drawing (Toby Schachman)

<https://dynamicland.org/2015/Apparatus_at_Future_Programming_Workshop/> · tool · confidence: high · verified

**What it is.** Research prototypes that combine graphics editing and programming. Apparatus is a direct-manipulation editor joined to spreadsheet-like dataflow for interactive diagrams. Recursive Drawing is a 2012 spatial programming prototype in which shapes can contain other shapes, including themselves.

**How it works.** Apparatus: shape attributes (x, y, scale, rotation, anchor points) can be JavaScript expressions that reference any other attribute, like spreadsheet cells, with no hidden state and no separate edit and run modes. spread(start, end, step) gives one attribute several values: separate spreads combine as a cross product, and reusing the same spread pairs values element by element. Components follow call-by-copying: instances inherit later changes to the master, including structural ones, while keeping their own overrides. Dragging: by default a drag changes x and y, but a 'control' circle lets the author choose which variables a drag changes, and the solver numerically minimizes the distance between the mouse and the dragged point. The Strange Loop abstract summarizes it: algebra drives geometry, and dragging runs geometry back into the algebra. Recursive Drawing (read from the source): solveConstraint.coffee builds an objective (the squared distance between the transformed original mouse point and the current mouse point) and runs numeric.uncmin over translate, scale-rotate or scale arguments. It rejects a solution, keeping the old transform, if the result is NaN, the error is above 1e-6, or the area falls below 0.001. makeRenderer expands the recursion tree only while each instance's scale stays between minSize and maxSize, with expansionLimit 300 and leafLimit 1e6.

**Why it matters here.** These give concrete, small, proven algorithms for on-canvas handles that solve for chosen parameters, and for recursion limited by rendered size. Both are needed for golden spiral leaf series and for nested medallion detail.

**Ideas to borrow:**

- Controller binding: each on-canvas handle declares which 1 to 2 parameters it may change. The drag solves argmin |handle(params) - mouse|^2 over only those, warm-started from the current values.
- Solver guard rails (from Recursive Drawing): reject NaN or high-error results, or degenerate geometry, and keep the last good state, so a drag can never put the frame into a broken state.
- Size-terminated recursion: generate spiral leaves or nested scroll detail while the instance's rendered size is at least a minimum engraving size (for example 2 to 3 times the hairline width), with a hard expansion cap. Detail adapts to page size automatically.
- Spreads: express clustered parallel lines as a spread over an index, and cross-product two spreads for lattices.
- Master/instance with structural inheritance and preserved overrides for the four corner medallions (mirrored instances of one master).

**Designer workflow.** Shapes are built by gesture, and code appears only as small expressions. Documented problems: the numerical solver can 'snap' to a different solution (a bike-gear example jumped), reviewers wanted faster response and fewer separate representations, and Schachman later 'walked back' experimental ideas for Cuttle.

**Evidence read.** Opened dynamicland.org notes on Apparatus at the Future Programming Workshop, the Strange Loop 2015 abstract, aprt.us docs (spreads, expressions), the GitHub README, and a 2016 mailing-list summary (via search) about controllers. For Recursive Drawing, fetched recursivedrawing.com and read src/solveConstraint.coffee, src/makeRenderer.coffee and src/config.coffee from github.com/electronicwhisper/recursive-drawing.

### 8. Cuttle (cuttle.xyz)

<https://cuttle.xyz/blog/cuttle-a-new-cad-tool-for-rapid-prototyping> · tool · confidence: medium · verified

**What it is.** A browser CAD and vector editor for laser and CNC cutting from Apparatus's creator. It combines a vector editor with a programming environment: parameters, reusable components, live modifiers and JavaScript scripting.

**How it works.** Canvas gestures edit a program that is interpreted to make graphics, rather than editing 'literals'. Shapes are reused inside other shapes the way functions call functions. A modifier is a chain step: it receives the special variable input (geometry from the shape or the previous modifier) and must return geometry. Built-in modifiers such as Rotational Repeat and Outline Stroke are plain JavaScript that the user can open with the pencil icon and fork with 'Create variation'. Repeat modifiers (mirror, linear, rotational, tile) have a 'Customize Each Repetition' option that exposes a rep index to shapes and modifiers placed before the repeat, so modifier order matters. random() is seeded and deterministic, so re-evaluation does not flicker. Code components return geometry without taking input, and unstyled output defaults to a black hairline. Project parameters are extracted from any value through a menu and can drive modifier options through expressions. Creator guidelines: few parameters, most-used first, names that say what changes, realistic defaults, advanced settings in folders, and templates must not break with short ('AJ') or long ('Penelope') input.

**Why it matters here.** This is a working, commercial version of 'designer-first, code when needed' in the browser with SVG output, close to what the user wants to build.

**Ideas to borrow:**

- Engine operations as readable, forkable TypeScript modifiers (input geometry in, geometry out), with the built-ins written in the same API the designer could copy.
- Extract-to-parameter: any hard-coded number in a motif can be promoted to a named, ranged parameter without restructuring.
- Seeded randomness only, for example the slight engraving jitter, so renders are stable across resizes and reloads.
- Index-aware repeats (rep) so each copy in a cluster can vary in a controlled way, for example width_i = w0 * phi^-rep.
- Template robustness tests at input extremes, applied to page sizes (narrowest phone, ultrawide).

**Designer workflow.** Users draw first and parameterize later by extracting values. When a built-in is not enough, they read and fork its code, which gives a gradual on-ramp into programming. Text Along Path uses a percentage offset along the path.

**Evidence read.** Opened the cuttle.xyz Learn index, the 2019 announcement blog post (.md), the 'Getting started with scripting' (.md), 'Customized repetitions' (.md), Code components and Creator template guidelines pages, and the Text Along Path blog post. I could not open the 'Getting started with parameters' page (it rendered only a title).

### 9. Bret Victor, 'Drawing Dynamic Visualizations' (talk plus additional notes)

<https://worrydream.com/DrawingDynamicVisualizationsTalkAddendum/> · technique · confidence: high · verified

**What it is.** A prototype in which the artist draws on a canvas as in Illustrator, every drawing step is recorded as a procedure, and the procedure can be parameterized by data. It argues for direct manipulation of procedural pictures.

**How it works.** Drawing actions are designed to state intent precisely and unambiguously. There is no guessing auto-snap: snapping happens only when a drag starts from a specific point on an object, and when snap targets overlap the user presses Tab to cycle through them. Intersections and 'glomp', snapping to an arbitrary parameterizable position along an object, let geometry express computation. Fixed values such as '50%' are replaced by expressions. Sub-pictures act like subroutines: they import data through variables and export measurements, and they export geometry through 'magnets'. Loops iterate over data columns and conditionals apply to selected steps. Victor says the tool generalizes through explicit parameterization rather than inference, because inference is less reliable for components that must behave deterministically.

**Why it matters here.** It defines the interaction grammar for relating elements to dominant curves: glomp onto a curve at parameter s, magnets as named attachment points, and explicit rather than inferred relationships.

**Ideas to borrow:**

- 'Glomp' as a first-class relation: attach(motif.anchor, spine, s), where s is a parameter that can be expressed (for example s = 1/phi^2).
- Magnets: each motif exports named attachment points (stem-base, tip, curl-centre) that other elements can snap to.
- Intentional snapping: snap only from explicitly grabbed anchors, use Tab to cycle candidates, and never auto-snap silently.
- Prefer explicit parameterization to inference. When the engine fits a golden spiral to a drawing, it proposes and the designer confirms.

**Designer workflow.** The artist must still think procedurally, but does so by drawing. Self-reported limits: no export to standalone JavaScript, an arbitrary recursion depth cap, only flat data handled well, awkward scoping between loop iterations, and iteration over geometry left unsolved.

**Evidence read.** Opened the worrydream.com 'Additional notes' (addendum) page. The main talk page rendered only a video link. Context also came from the Sketch-n-Sketch paper's related-work section.

### 10. Graphite (graphite.art, formerly graphite.rs)

<https://graphite.art/features/> · tool · confidence: medium · verified

**What it is.** An open-source, browser-based 2D vector and raster editor in alpha, built on a procedural node-graph engine (Graphene) with a Rust back end.

**How it works.** Canvas tools edit nodes behind the scenes. The Layers panel and node graph are described as equivalent, interchangeable views of the same document. Node parameters can be constants, exposed to the graph, or (planned) keyframed. A Path node allows non-destructive manual vector edits at any stage of the pipeline, even after a procedural shape has defined the path (Q3 2024 report). The vector data model is attribute-based, with a points table referenced by index. The node catalogue has Repeat, Repeat Array, Repeat Radial, Repeat on Points and Copy to Points. Vector modifiers include Morph (interpolates geometry, appearance and transform across several layers, linearly unless a path is supplied), Cut Path (0..1 progression along a path), Sample Polyline (evenly spaced points), Decimate (Ramer-Douglas-Peucker), Relax Points (Lloyd) and Auto-Tangents. Many node descriptions still read 'coming soon'. Random nodes have seed parameters. The roadmap lists a geometric constraint solver for LTS.

**Why it matters here.** It shows how to give one document two synchronized faces (direct canvas editing and a procedural graph) and how to allow hand edits on top of procedural output, which is exactly the tension in this project.

**Ideas to borrow:**

- Two views of one model: the designer works on the canvas and in a parameter panel, while the engine keeps the dependency graph, which is viewable but never required.
- Hand-override nodes: a manual tweak is recorded as a step in the pipeline after the procedural generator, so regenerating keeps the tweak. Store it in spine coordinates (s, n) so it survives resizing.
- Morph along a progression: interpolate between 2 to N designer-drawn leaf layers by a 0..1 progression value computed from position on the golden spiral.
- Seeds on every random operation.

**Designer workflow.** Designers can stay in the layer and tool view and open the graph only when needed. It is alpha, documentation is thin, and there is no documented node that distributes copies evenly along a curve.

**Evidence read.** Opened graphite.art features page, 'Features and limitations', the node catalogue index, the 'Vector: Modifier' and 'Repeat' catalogue pages, and the Q3 2024 progress report. Third-party wiki claims (mintlify) were not relied on.

### 11. kappa-curves (shipped as Adobe Illustrator's Curvature tool) and the epsilon-kappa extension

<https://people.engr.tamu.edu/schaefer/research/kcurves.pdf> · paper · confidence: high · verified

**What it is.** An interpolating curve scheme in which every control point is a local curvature maximum. It ships as the Curvature tool in Illustrator and Photoshop, which the user already has.

**How it works.** Each interior control point gets one quadratic Bezier, and a quadratic has exactly one curvature maximum. A simple iterative optimization places each quadratic's maximum at its control point and makes the pieces meet with G2 continuity, except at inflections, where they are G1. Because curvature peaks occur only at control points, loops and cusps cannot appear unless the artist intends them. The epsilon-kappa paper (Miura et al., Visual Computer 2021) notes that kappa-curves give no control over how sharp each peak is, because quadratics have too few degrees of freedom, and adds per-point peak control by degree elevation or generalized trigonometric bases.

**Why it matters here.** For the flame and leaves, the leaf tips are curvature maxima. A designer can place one point per tip with a tool they already know, which yields exactly the tip points the engine needs to fit or check a golden spiral, plus a fair curve through them.

**Ideas to borrow:**

- Authoring convention: 'put a Curvature-tool point on every leaf tip / curl apex'. The engine reads those anchors as the sample points for fitting the dominant spiral.
- Use the curvature-maxima-at-control-points rule as a lint: flag any engine-generated or designer curve whose curvature peaks fall away from its declared points (accidental bumps).
- Plan for per-point sharpness control (epsilon-kappa-style) if the leaves need distinct curl tightness at each tip.

**Designer workflow.** Designers click points where the curve should turn most sharply. The tool is described as highly valued by professional designers. Its limit is that the designer cannot set how tight each turn is.

**Evidence read.** Downloaded and read the abstract and introduction of the SIGGRAPH 2017 kappa-curves PDF (Yan, Schiller, Wilensky, Carr, Schaefer) and the epsilon-kappa abstract and introduction from the Tsukuba repository PDF, which states the Illustrator/Photoshop shipping. The Adobe Research page had metadata only.

### 12. Fitting fair curves to hand-drawn strokes: Spiro/Euler-spiral splines (Levien), clothoid sketch fitting (Baran et al.), log-aesthetic curves

<https://homes.cs.washington.edu/~jovan/papers/baran-2010-scs.pdf> · paper · confidence: medium · verified

**What it is.** Research and tools for turning a designer's rough stroke or a few on-curve points into mathematically 'fair' curves from known families: lines, arcs, clothoids, and log-aesthetic curves including the logarithmic (golden) spiral.

**How it works.** Baran, Lehtinen and Popovic (Eurographics 2010) fit a large overcomplete set of primitives (lines, arcs, clothoids) to every subsegment of the stroke. They build a graph whose nodes are those candidates and whose edges are transitions with the allowed continuity, take the shortest path as the segmentation, and refine with nonlinear constrained optimization. The result has good curvature profiles with few primitives while staying close to the sketch. Levien's thesis ('From Spiral to Spline', Berkeley 2009) argues that an ideal interpolating spline should be extensional, meaning inserting a point on the curve does not change it, and that every segment is then cut from one generator curve. The Euler spiral is a strong all-rounder, and the log-aesthetic curve may be better in some uses. Spiro uses only on-curve points with types G4, G2, corner, and left/right constraint (line-to-curve), and converts to Beziers. FontForge's Spiro documentation recommends placing points at major features, closing the contour, then refining. It warns that moving a point too far can produce erratic spirals or make the outline vanish. Log-aesthetic curves have a log-curvature-graph slope alpha: alpha=-1 is the Euler spiral, alpha=0 the Nielsen spiral, alpha=1 the logarithmic spiral, alpha=2 the circle involute. Yoshida-Saito and Nagy et al. give interactive constructions from endpoints and tangents.

**Why it matters here.** These give a principled 'fit a parametric model to a hand-drawn curve' pipeline for the user's medallion sweeps and flame curves: fit the drawing, identify the family, then snap its parameters to phi.

**Ideas to borrow:**

- Fit-then-snap: fit the designer's construction stroke with candidate families {line, arc, clothoid, log spiral}, choose the segmentation by shortest path (Baran). For log-spiral segments, report the fitted growth per quarter turn, snap it to phi (b = ln(phi)/(pi/2) = 0.3063), and show the maximum deviation in px before accepting.
- Use the log-aesthetic family with alpha=1 for golden sweeps and nearby alpha values for scroll stems, so all curves share monotone curvature and look engraved rather than wobbly.
- Spiro-style point types (smooth, corner, line-to-curve) as the vocabulary for the engine's own curve authoring, with guards that keep the last good solution when a point moves too far.
- Extensionality as a design rule: adding a subdivision point to a spine must not change its shape, so spines can be refined without disturbing placed ornaments.

**Designer workflow.** Designers sketch or place a few points and get smooth, monotone-curvature results. Failure modes: the solver blows up on extreme inputs, and some point and tangent combinations have no solution.

**Evidence read.** Read the abstract and introduction of Baran et al. (PDF), the abstract of Levien's thesis (EECS-2009-162 page), FontForge's editspiro page, and the arXiv abstract of Nagy-Yoshida-Hoffmann 2105.09762. The LAC family list (alpha values) comes from search-result summaries of Gobithaasan 2014; the Wiley page itself returned 403.

### 13. Slider panels: Tweakpane, lil-gui, Leva

<https://tweakpane.github.io/docs/misc/> · library · confidence: high · verified

**What it is.** Small JavaScript GUI libraries that bind controls to object properties for live tuning of creative code.

**How it works.** Tweakpane: bindings for number, string, boolean, color and point (2D picker) plus read-only monitors. Folders and tabs. Change events carry the value and a last flag for the final change in a drag. exportState() and importState() save and restore a whole pane or folder as presets. refresh() is needed because external changes are not detected. lil-gui: add(obj, prop) picks the control from the type (min and max make a slider), plus addColor and addFolder, onChange versus onFinishChange (for slow handlers), save() and load() as JSON (save throws on duplicate names), and listen() for per-frame syncing. Leva (React): the widget is inferred from the value's shape ({value,min,max} gives a range, [a,b] with min/max an interval, {x,y} a vector2 with a joystick), the step is auto-derived from the magnitude, and a bezier plugin returns a curve with evaluate(t), which is an in-panel distribution editor.

**Why it matters here.** This is the cheapest realistic first version of a designer control surface for the engine, before any custom canvas tooling exists.

**Ideas to borrow:**

- A workbench panel generated from the engine's parameter schema (name, range, step, unit, folder, 'locked to phi' badge) rather than hand-wired.
- Presets as JSON files (exportState/save) committed next to the motif SVGs, with names such as 'front-page', 'article', 'mobile'.
- Use the last/onFinishChange events to trigger expensive regeneration (fitting, high-resolution hatching) and cheap previews during the drag.
- A bezier or 'graph mapper' control for spacing laws, evaluated as map(t) inside the engine.

**Designer workflow.** These are quick to wire and familiar from generative art. With many controls the panels become unwieldy, and they offer no direct manipulation on the artwork itself.

**Evidence read.** Opened Tweakpane docs index and Misc page (events, import/export, tips), the lil-gui homepage, and read Leva's docs/getting-started/inputs.md and plugins.md from GitHub raw.

### 14. Observable runtime and Inputs (reactive notebooks)

<https://github.com/observablehq/runtime> · library · confidence: medium · verified

**What it is.** The reactive dataflow runtime behind Observable notebooks and Framework, and its standard input widgets.

**How it works.** A variable is defined as define(name, inputs, fn). It re-runs when any named input changes, like a spreadsheet cell. Variables without observers are computed only if a transitive output is observed (lazy, as needed). A definition can return a promise or a generator, and generators are pulled once per animation frame. module.derive(specifiers, source) makes a copy of a module with some variables replaced, which is how notebooks 'import with' overrides. viewof x = Inputs.range([min,max]) (or view() in Framework) turns an input's current value into a reactive variable, so dependent code re-runs on interaction.

**Why it matters here.** It is a proven, small model for the engine's internals: dominant functions as upstream variables, ornaments as derived variables, and lazy recompute when only one spine changes.

**Ideas to borrow:**

- The engine as a named reactive graph: page size and the spines are roots, and medallions, ribbons and bands are derived. Recompute only what depends on a changed value.
- derive-style variants: 'top-left medallion = master with mirror=true', or the article-page frame derived from the front-page frame with two parameters overridden.
- Lazy evaluation: off-screen or hidden layers are not computed.

**Designer workflow.** Designers and analysts tweak inputs and see dependent cells update without managing state. The dependency order comes from names, not from manual wiring.

**Evidence read.** Read the observablehq/runtime README (define, lazy computation, generators, derive) and the observablehq/inputs README (viewof and view, Inputs.range) from GitHub raw. The observablehq.com documentation pages returned HTTP 429.

### 15. Figma variables, modes and constraints

<https://help.figma.com/hc/en-us/articles/14506821864087-Overview-of-variables-collections-and-modes> · tool · confidence: high · verified

**What it is.** Figma's design-token system and its rules for resizing layers, the mainstream designer tools for 'values that change by context' and 'how things respond to frame size'.

**How it works.** Variable types are color, number, string, boolean, timing and easing. Variables are grouped into collections of up to 5,000, and each mode (for example light/dark or device size) stores one value per variable. A variable can alias another of the same type. Number variables bind to dimensions, padding and gap, corner radius, stroke weight, opacity and more. Expressions (basic maths, strings, booleans) exist only in prototyping actions, not as formulas inside variable values. Constraints set how a layer behaves when its parent frame resizes: Left, Right, Left and right, Center, or Scale (keeps size and position as a percentage), with the same options vertically. Constraints are not available inside auto-layout frames or directly on groups.

**Why it matters here.** It shows which vocabulary designers already have (modes per breakpoint, per-edge constraint pinning) and what is missing that this engine must add: real formulas over parameters.

**Ideas to borrow:**

- Modes for page contexts: each parameter can hold per-mode values (phone, tablet, desktop, print) while phi relations stay formulas, not tokens.
- A per-element constraint vocabulary (pin left, right, both, centre, scale) for frame elements, extended with 'pin to spine at s'.
- Aliasing: secondary parameters reference primary ones by name (rule-weight-fine -> rule-weight / phi^2).

**Designer workflow.** Designers are comfortable with tokens and modes and switch a frame's mode to preview contexts. They cannot express derived relationships such as gap = width / phi^2.

**Evidence read.** Opened Figma Help 'Guide to variables', 'Overview of variables, collections, and modes', and 'Apply constraints to define how layers resize'.

### 16. Houdini Wedge TOP (parameter sweeps for review)

<https://www.sidefx.com/docs/houdini/nodes/top/wedge.html> · tool · confidence: high · verified

**What it is.** A node that generates many variants of a procedural setup by varying attributes, so artists can render and compare them side by side.

**How it works.** Wedge types: Range (evenly spaced, or random samples between start and end), Value (an expression per item using @wedgeindex and wedgecount), Value List (cycled), and Bracket (values around a centre, with an odd count keeping the centre). Values are applied by Pull (@attribute expressions) or Push (temporary overrides of a target parameter at render time). Selecting a work item can temporarily apply its values for preview and restore them afterwards. Wedges can be nested over several attributes.

**Why it matters here.** This answers 'live preview at many sizes'. The most important sweep for this engine is page width and height, along with spiral parameters.

**Ideas to borrow:**

- A size contact sheet: render the frame at a bracket of viewport sizes (for example 360x780, 768x1024, 1280x800, 1920x1080, a very tall article page) side by side, live, with the failing ones (tile stretch above a threshold, leaves clipped, recursion cut off) outlined in red.
- Bracket sweeps around the current value of any parameter (value / phi, value, value * phi) to compare golden steps.
- Click-to-preview: clicking a variant temporarily applies its values, and the previous values are restored unless the designer commits.

**Designer workflow.** Artists sweep a parameter or a pair of parameters, look at a contact sheet, and pick the best. Previewing one variant does not destroy the current settings.

**Evidence read.** Opened the SideFX Houdini docs page for the Wedge TOP node.

## Principles

- **Keep Illustrator as the drawing surface and capture each drawing as structure through naming conventions, not by asking the designer to code.**
  - Source: Grasshopper Set One Curve (referenced curves); Glyphs smart layers and named anchors; Illustrator pattern brush tile slots
  - Apply: Define an SVG authoring contract: layers named spine-*, motif-<name>@min/@max, tile-side/corner-outer/start/end, guide-stretch-a/b, and anchors named anchor:tip, anchor:stem, handle:<param>. The engine imports them, validates them, and reports precise errors (for example 'leaf@max has 14 nodes, leaf@min has 13').
- **Every ornament lives in the coordinate system of a dominant curve: arc length s along the spine and offset n along its normal.**
  - Source: Inkscape Pattern Along Path source (compose(uskeleton, x) + y * compose(n, x)); Grasshopper Perp Frames; Bret Victor's 'glomp'
  - Apply: Spine.evaluate(s) returns {point, tangent, normal, curvature} on an arc-length-reparameterized curve. Motifs are authored in local (x, y) and mapped by spine(s0 + x) + y * normal(s0 + x). Hand overrides are stored as (delta s, delta n), so they survive any page resize.
- **Bands and ribbons always end on whole tiles. Either stretch uniformly, add space, or adjust the path, and choose this explicitly per band.**
  - Source: Inkscape PAP 'Repeated, stretched' copy count and scale; Illustrator Stretch to Fit / Add Space to Fit / Approximate Path
  - Apply: n = max(1, floor((L + g)/(w + g))) and scale = L/(n*w + (n-1)*g). Expose fit modes stretch, space and approximate-path, where approximate-path lets the engine adjust a corner radius or inset so a phi-spaced tile fits without distortion. Show the current stretch factor in the workbench and flag values above about 8%.
- **Protect the parts that carry the character of a motif (tips, curls, heads) from distortion, and stretch only a designated body.**
  - Source: Illustrator art brush 'Stretch Between Guides'; Glyphs corner components distorting unless an Intermediate layer exists
  - Apply: Motif SVGs carry two guide positions. The engine maps head and tail rigidly and stretches only the middle section along the spine. For large scale changes it interpolates designer-drawn size masters instead of scaling uniformly.
- **Let designers define variation by drawing the extremes and let the engine interpolate, instead of writing equations for leaf shape.**
  - Source: Glyphs Smart Components (min/max layers, compatibility, interpolation, smart handles); Graphite Morph node
  - Apply: Each leaf type has compatible @min and @max drawings (tight versus open curl, small versus large). Each instance receives an axis value from the dominant function (for example the i-th leaf on the golden spiral gets t_i = 1 - phi^-i), and the engine interpolates point by point. Extrapolation is disabled by default.
- **Golden-ratio enforcement should fit, then report, then snap. Never infer silently, and always show the deviation.**
  - Source: Bret Victor (explicit parameterization over inference); Baran et al. clothoid fitting; log-aesthetic family (alpha=1 is the logarithmic spiral); kappa-curves (control points at curvature maxima)
  - Apply: The designer marks leaf tips with Curvature-tool points. The engine fits r = a*e^(b*theta) to the tips, reports the fitted growth per quarter turn and the RMS and maximum error, then offers 'snap to phi' (b = ln(phi)/(pi/2)) with an overlay comparing the drawing with the snapped curve. Accepting writes a frozen constant.
- **On-canvas handles solve for a small, declared set of free parameters, and constants derived from phi are frozen.**
  - Source: Apparatus controllers and numeric minimization; Sketch-n-Sketch freeze (!) and prefer (?) annotations; Recursive Drawing's uncmin with error and area guards
  - Apply: handle('flame-tip', params: ['spiral.a', 'spiral.theta0']) runs a 1 to 2 parameter minimization warm-started from the current values. Frozen parameters (growth = phi, leaf ratio = 1/phi) are never touched. On NaN, high error or degenerate geometry, keep the last good state. Prefer analytic inverses where they exist (for example the projection of a point onto a spine).
- **Declare how each element responds to page size: stretchy, sticky, or stretchy-until-limit.**
  - Source: Sketch-n-Sketch stretchyPolygon / stickyPolygon / stretchySnipPolygon; Figma constraints (Left, Right, Left and right, Center, Scale)
  - Apply: Corner medallions are sticky to their corner with phi-scaled size steps, side ribbons stretch along the edge, the crest is centred with scale clamped, and gaps grow up to a maximum and then stay fixed. Store this as a field on every module, not as ad-hoc code.
- **Spacing of clustered lines is a visible, editable law, not a list of hand-placed offsets.**
  - Source: Grasshopper Graph Mapper with Evaluate Curve; Leva bezier plugin evaluate(t); Cuttle and Apparatus index-aware repeats (rep, spread)
  - Apply: cluster(n, law) where law is geometric(1/phi), linear, or a designer-edited curve. offset_i = totalWidth * law(i/(n-1)). The law is drawn as a mini graph in the panel, and line weights follow a second law (for example w_i = w0 * phi^-i).
- **Stop detail based on rendered size, not recursion depth, so the engraved look holds at every viewport.**
  - Source: Recursive Drawing makeRenderer (minSize, maxSize, expansionLimit, leafLimit)
  - Apply: Spiral leaf series, nested scroll curls and hatch fills keep generating while an instance's on-screen size is at least k times the hairline width (for example k = 3), with a hard cap. On small screens the flame has fewer leaves rather than illegible ones.
- **Structure is the difference between a system you can change and one you rebuild. Name everything, use modules with explicit inputs and outputs, and make topology a parameter.**
  - Source: Davis thesis (97.5% unstructured models; structured versus unstructured legibility experiment; Dermoid six stages; models 'remade' after topology changes)
  - Apply: The engine's API is a handful of named modules (Spine, Medallion, Ribbon, Flame, Crest, Band). Leaf count, crossing count and tile count are integer parameters with designed behaviour. Generate a module dependency diagram automatically for the docs.
- **The workbench is a reactive, lazy dependency graph with presets and variants.**
  - Source: Observable runtime (define with inputs, lazy evaluation, module.derive); Tweakpane exportState/importState and lil-gui save/load
  - Apply: Page size, then spines, then modules, then SVG, with recompute limited to dependents of a changed parameter. Variants are derived from a master with overrides (mirrored corners, article page versus front page). Presets are JSON files in the repo, loaded and saved from the panel.
- **Review across sizes and parameter brackets at once, not one size at a time.**
  - Source: Houdini Wedge TOP (Range, Bracket, click-to-preview with restore); Cuttle template guideline to test short and long inputs
  - Apply: The workbench shows a live contact sheet of 5 to 8 viewport sizes plus extremes. Optionally it brackets one parameter (value / phi, value, value * phi). Automated checks outline failures: stretch above threshold, overlap, clipped motif, detail culled.
- **Hand edits are first-class pipeline steps, recorded relative to the procedural result, and always reversible.**
  - Source: Graphite Path node (non-destructive manual edits after procedural generation); Inkscape original-d plus computed d; Glyphs explicit decompose
  - Apply: An override layer stores per-instance deltas in spine coordinates and per-node offsets on motif interpolations. 'Decompose' (freezing a generated instance into raw paths) is explicit, logged, and kept out of the default path.
- **Engraved line quality comes from a centreline plus a width profile, not from outlines drawn by hand.**
  - Source: Inkscape Power Stroke (offset_points as (t, width), interpolator choice, join types)
  - Apply: Every engine stroke is {centerline, widths: [(s, w)], interpolator: centripetal-catmull-rom | cubic-smooth, caps: zero-width}. Swelling and tapering laws can themselves be phi-based, and the outline is computed and emitted as a filled path.

## Cautions

- Illustrator is not a reliable round-trip target for SVG. An Adobe community expert says SVG is not suitable for round-tripping. Layer names become IDs with escaping (underscore becomes _x5F_), and data-name attributes appeared and disappeared between Illustrator 28.4, 28.5, 28.6 and 29. Treat Illustrator export as a one-way input, use dash-separated ASCII layer names, pin and record the Illustrator version, and keep engine metadata in a sidecar JSON keyed by ID rather than in attributes you expect Illustrator to preserve.
- Raw Bezier parameter t is not arc length. Placing leaves or tiles by t produces uneven, 'hand-drawn' spacing, and Reparameterize to 0..1 does not fix it (Grasshopper community explanations). Reparameterize every spine by arc length, as Inkscape PAP does.
- Numerical drag solvers can jump between solutions (the Apparatus bike-gear example) or diverge. Limit each handle to 1 or 2 free parameters, warm-start, reject bad solutions (Recursive Drawing's NaN, error and area guards), and keep the last good state.
- Automated relationship-building can produce unreadable code. In Sketch-n-Sketch, 18 Make Equals gave unintelligible equations, constraints could not be broken afterwards, and larger examples became sluggish. Prefer a small vocabulary of named relations (attach at s, follow the spacing law, mirror, phi-step) over general constraint solving.
- Parametric models are brittle under changes the author did not anticipate, especially topology (Davis ch. 1). Decide early which counts are parameters (leaves, crossings, tiles) and design behaviour at each count. Otherwise changing the medallion's leaf count means rebuilding.
- Node-graph freedom tends toward spaghetti: 97.5% of 2,002 sampled Grasshopper models had no modules and 81% had no uniquely named parameters (Davis ch. 6). A general visual node editor for the user would probably repeat this. Named modules plus a generated dependency diagram are safer.
- Interpolating designer-drawn masters (Glyphs smart components) requires compatible paths with the same node count and order. Keeping that compatibility in Illustrator is real work, and extrapolation beyond the drawn extremes gives poor results for complex shapes. Validate compatibility on import and disable extrapolation by default.
- Curve schemes can be unstable at the extremes. FontForge warns that moving Spiro points too far yields erratic spirals or a vanishing outline. Power Stroke's plain extrapolated join is disabled in the source as not working well, and its maths breaks with sharp corners and large widths. kappa-curves cannot set peak sharpness. Guard every solver and keep fallbacks.
- Golden-ratio caution: the 'golden spiral' often drawn as quarter-circle arcs in Fibonacci squares only approximates a true logarithmic spiral and has curvature jumps. The claim that the nautilus follows the golden rectangle is 'demonstrably false' (Gailiunas, Bridges 2015), and Markowsky (1992) argues that most aesthetic claims about phi are unsupported. Use phi as the project's chosen consistency rule and implement the true log spiral (b = ln(phi)/(pi/2)). Do not promise that phi alone makes the result look natural. Consistent curvature families and stroke-weight laws do as much of that work.
- Graphite is alpha, many node descriptions are 'coming soon', and no documented node distributes copies evenly along a curve. It is a source of ideas, not a dependency. Apparatus, Recursive Drawing, Sketch-n-Sketch and Bret Victor's tool were research prototypes, and Schachman himself walked back experimental features when building Cuttle.
- Figma variables cannot hold formulas (expressions exist only in prototyping), and constraints do not work inside auto layout or on groups. Designers' existing token habits do not cover derived relationships, so the engine has to provide formulas and explain them in the UI.
- Slider panels do not scale to dozens of controls (Cuttle's guideline is to avoid many parameters and put advanced ones in folders). Tweakpane does not detect external changes without refresh(), and lil-gui save() throws on duplicate names. Generate panels from a curated schema and keep the top-level list short.
- Illustrator brush behaviour (corner tiles must be square and tile heights must match, auto-corners apply only at sharp corners, and output stays a live appearance until expanded) was documented here from Adobe's Learn page and tutorials, because helpx.adobe.com returned 403. Verify the details in Illustrator before copying semantics exactly.
