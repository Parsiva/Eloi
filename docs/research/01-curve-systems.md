# Curve systems from type and curve design

> Research angle `curve-systems` — part of the [frame engine research](README.md).

## Summary

Type-design and curve-design tools have tried for 45 years to describe shapes by relationships instead of fixed vectors, and they agree on one architecture. A skeleton ("spine") curve comes first. Points are declared relative to other points or curves (midway, intersection, at a fraction along). A pen or width profile then expands the skeleton into outlines, and the result is converted to cubic Béziers at a set error tolerance for output. On which curves read as "natural" or "perfect", the research is clear. The eye notices where curvature peaks and how it changes. The best primitives keep curvature monotone between designer-placed points and continuous across them (G2): the Euler spiral/clothoid, and its generalisation, the log-aesthetic curve family. That family includes the logarithmic spiral, and the golden spiral is just a log spiral whose radius of curvature grows at a fixed rate with arc length. So "make the flame's leaf-tip curve golden" becomes an exact, checkable property, not a quarter-circle approximation. Clustered parallel lines can be harder than they look. Offsets of Béziers are not Béziers, and they form cusps wherever the offset distance reaches the radius of curvature, so families of lines should be produced by solving or interpolating from analytic spines. On usability, METAFONT, Prototypo and Nupuram all show that writing shapes as programs and exposing many sliders loses designers. What works is few on-curve points with a small set of point types (Spiro), named parametric parts with bounded sliders (Glyphs smart components, Prototypo's "advised" ranges), live previews with construction overlays, and letting the designer start from a drawing that the engine fits to a primitive. For this engine: analytic dominant curves anchored to the page box, positions on them by arc length, motifs attached with G2 continuity, width/hatch envelopes, Bézier fitting for SVG, and validators (curvature comb, golden-pitch readout, offset-vs-radius check) so the golden-ratio rules are measured, not eyeballed.

## Case studies

| # | Case study | Kind | Confidence | Verification |
|---|---|---|---|---|
| 1 | [METAFONT / MetaPost (Knuth, Hobby): declarative equations + pens along paths](https://tug.org/docs/metapost/mpman.pdf) | tool | high | verified |
| 2 | [Hobby's spline ('mock curvature') with a JS reference implementation](https://www.jakelow.com/blog/hobby-curves) | technique | high | verified |
| 3 | [Raph Levien, 'From Spiral to Spline' (PhD 2009) and Spiro / libspiro](https://levien.com/phd/thesis.pdf) | paper | high | verified |
| 4 | [Log-aesthetic curves (Harada, Miura, Yoshida) and the golden spiral as a special case](https://arxiv.org/abs/2105.09762) | paper | medium | verified |
| 5 | [Prototypo (Byte Foundry): browser-based parametric font engine](https://github.com/byte-foundry/prototypo.js) | library | high | partly verified (see note) |
| 6 | [OpenType variable fonts and Glyphs 'smart components'](https://learn.microsoft.com/en-us/typography/opentype/spec/otvaroverview) | technique | high | verified |
| 7 | [kurbo (Rust) and Levien and Uguray's Euler-spiral stroke expansion: fitting and offsetting](https://docs.rs/kurbo/latest/kurbo/) | library | high | verified |
| 8 | [paper.js, bezier.js and Pomax's 'A Primer on Bézier Curves' (JS curve toolkits)](https://pomax.github.io/bezierinfo/) | library | high | verified |
| 9 | [Nupuram (Santhosh Thottingal, 2025): a modern METAPOST type-design workflow](https://arxiv.org/abs/2502.07386) | paper | high | verified |

### 1. METAFONT / MetaPost (Knuth, Hobby): declarative equations + pens along paths

<https://tug.org/docs/metapost/mpman.pdf> · tool · confidence: high · verified

**What it is.** Knuth's language for parametric letterform design (METAFONT, 1979/1984) and Hobby's vector-output descendant MetaPost. Shapes are programs: points are unknowns tied together by linear equations, curves are drawn through them with Hobby's spline, and pens are swept along paths to make strokes.

**How it works.** Data model: pair variables z1..zn, with x/y parts as unknowns. '=' declares a linear equation and does not assign. The solver accepts equations in any order and reports 'redundant' or 'inconsistent' equations. Relational operators: mediation 'z4=1/3[z3,z6]' (a point a fraction of the way between two others) and 'whatever' (an anonymous unknown), so 'z20=whatever[z1,z3]=whatever[z2,z4]' declares an intersection without computing it. Nonlinear relations are not allowed: you cannot multiply two unknowns. Path syntax: z0..z1{up}..z2 gives a direction at a knot; '...' means 'choose an inflection-free path if possible'; 'tension' (default 1, minimum 3/4) tightens a segment; '{curl c}' sets end behaviour (0 means curvature approaches zero at the end, 1 is roughly a circular arc); '--' is a straight line. Query operators turn paths into references for other geometry: 'point t of p', 'direction t of p', 'directiontime v of p', 'intersectiontimes', 'arclength', 'arctime a of p', 'subpath'. Pens (pencircle, pensquare, makepen of a convex polygon) are swept along paths, and 'envelope' gives the outline. Size handling: every glyph is re-solved from font-wide parameters (slant, width, pen size, serif length, a curve 'constant'). Shapes are never scaled optically. Per Knuth, changing width or slant changes the path while the pens stay the same.

**Why it matters here.** This is the original version of the user's 'dominant functions + everything relative to them'. In Knuth's 1984 Stanford course, the final homework was a set of 8 border characters (NW, NM, NE, ME, SE, SM, SW, MW). Heights and widths were constrained so the middle (M) pieces could repeat as extension modules, making frames of any size from four corners. Knuth called METAFONT a super tool for borders. That is the user's frame problem: corner medallions plus side ribbons that adapt to any page size.

**Ideas to borrow:**

- Points are not assigned coordinates. Each is a declaration: at(pageBox.topLeft + margin), mid(a,b), frac(a,b,t), intersect(lineA,lineB), onCurve(spine, u), atDirection(spine, angle). Solve them with a small linear solver that, like MetaPost, reports 'redundant' and 'inconsistent' constraints to the designer.
- Path-query API on every dominant curve: pointAt(u), tangentAt(u), normalAt(u), curvatureAt(u), arcLength, uAtArcLength(s), uAtDirection(theta), intersections(other). Ornaments refer to these and never to raw coordinates.
- Per-knot path annotations in the same vocabulary: {dir}, tension, curl, and a 'no-inflection' join. Designers learn these easily, and they map to Hobby's solver.
- Border decomposition from Knuth's class: corner modules (NW, NE, SE, SW) with fixed internal geometry, plus side modules whose length is solved from the page size. The side module either repeats a motif an integer number of times (pick the count n, then stretch the period slightly so it fits exactly) or re-solves its spine to the new length.
- 'Teardrop subroutine' pattern: a few expert-written motif generators (leaf, scroll terminal, bead) take 2 or 3 points plus named parameters. Designers use them without knowing the geometry inside, as Hobby's teardrop let Knuth's users do.
- Knuth and Southall's 'O': to keep an inner curve from crossing the outer one, draw both from the same family and pull the inner one a fraction of the way toward the outer. Use this for nested ribbon edges and engraved line clusters instead of independent curves.

**Designer workflow.** Knuth (Lessons Learned from Metafont, 1985) reports the main lesson was that the problem is very hard. He found it best to let parts of a design depend on each other (one point midway between two others) rather than give explicit coordinates. He says the computer should be treated as a new medium, and the user should accept its help. He also found edges need hand 'second-order' corrections that a pen alone does not give. He recommended designers collaborate with programmers, the way they once worked with punch-cutters. Richard Southall, a professional type designer at Stanford 1983–86, spent two years on a METAFONT typeface that was never finished. His 1986 paper describes a gap between how type designers and the TeX community think. Thottingal (2025) quotes Knuth: asking an artist to become enough of a mathematician to write a font with 60 parameters is too much. Easy: consistency and global changes. Hard: everything is code, slow trial and error, too many parameters.

**Evidence read.** Read the MetaPost manual (tug.org/docs/metapost/mpman.pdf) sections 4.1–4.3 (Béziers, direction/tension/curl, path syntax), 5 (linear equations, mediation, 'whatever', redundant and inconsistent equations) and 9 (directiontime, arctime, envelope, makepen). Read Knuth, 'A Course on METAFONT Programming', TUGboat 5(2) 1984 (tug.org/TUGboat/tb05-2/tb10knut.pdf), including the border homework. Read Knuth, 'Lessons Learned from Metafont', Visible Language 19(1) 1985 (full PDF text via journals.uc.edu). Southall's report I saw only via search snippets and finding-aid summaries, not the full text.

### 2. Hobby's spline ('mock curvature') with a JS reference implementation

<https://www.jakelow.com/blog/hobby-curves> · technique · confidence: high · verified

**What it is.** John Hobby's 1986 interpolating spline, used in METAFONT and MetaPost (and TikZ). The designer places only on-curve knots. The algorithm picks tangent directions and handle lengths so the joined cubic Béziers look round and relaxed. Jake Low's article includes an ISC-licensed, heavily commented hobby.js.

**How it works.** For knots P0..Pn: compute chord lengths d_i and turning angles gamma_i. Unknown angles alpha_i (handle direction relative to the chord) come from a tridiagonal linear system, solved in O(n) with the Thomas algorithm. The system makes 'mock curvature' (a first-order linearisation of the true curvature at the end of a segment) equal on both sides of each knot. Curl omega sets the end rows. Then beta_i = -gamma_{i+1} - alpha_{i+1}. Handle lengths = rho(alpha, beta)·d/3, using a 'velocity function'; hobby.js uses Jackowski's formula 28: rho = 2/(1 + c·cos(beta) + (1-c)·cos(alpha)) with c = 2/3. Per Levien's thesis §4.7, it is effectively a cheap approximation of the Euler-spiral spline. It is close for small turning angles, has sharp curvature peaks at large ones, and is only approximately round (error falls as O(n^6)) and approximately G2. Its big advantage is that a unique solution always exists.

**Why it matters here.** This is the simplest proven way for a designer to draw a dominant sweep by placing a few knots, e.g. the medallion stem or ribbon centreline. It outputs ordinary cubic Béziers that SVG renders directly and is fast enough to re-solve on every resize or drag.

**Ideas to borrow:**

- Port hobby.js (about 200 lines, ISC) to TypeScript as the default 'interpolating spine' primitive, with per-knot tension and per-end curl, which designers can set from Illustrator anchor data.
- Let designers mix fixed directions ({dir}) at chosen knots, e.g. force the ribbon horizontal at the top centre. The solver fills in the rest.
- Re-solve the spline from knots expressed in page-relative coordinates whenever the viewport changes, instead of scaling a fixed SVG path.
- Detect nearly collinear knot runs and turning angles near ±180°, the cases where Hobby flips orientation, and warn or nudge in the editor.

**Designer workflow.** Knuth (1985) says Hobby's method replaced the 'horrid shapes' METAFONT79 drew from 8 or 9 points with pleasing curves from the same data. It made the system 'simpler to use and more responsive'. Jake Low and Jackowski report that designers like that it needs only knots. Frustrations: moving one knot changes the whole curve, small moves can make it snap into a different shape, it cannot make sharp corners or intentional curvature variation, and it is unstable with nearly collinear points.

**Evidence read.** Read Jake Low's article and downloaded hobby.js (jakelow.com/blog/hobby-curves/hobby.js), including the tridiagonal setup, the Thomas solver and the rho function. Read Jackowski, 'Typographers, programmers and mathematicians, or the case of an aesthetically pleasing interpolation', TUGboat 34(2) 2013 (tug.org/TUGboat/tb34-2/tb107jackowski.pdf), §6.4 on instability. Read Levien's thesis §4.7. Did not open Hobby's original 1986 paper.

### 3. Raph Levien, 'From Spiral to Spline' (PhD 2009) and Spiro / libspiro

<https://levien.com/phd/thesis.pdf> · paper · confidence: high · verified

**What it is.** A Berkeley thesis on which interpolating spline is ideal, plus the Spiro toolkit. Spiro is built into FontForge and Inkscape, used by the XTrackCAD model-railway planner, and is available as libspiro. Levien drew the font Inconsolata entirely with these splines.

**How it works.** Main result: any spline that is extensional (adding a point on the curve does not change it) and two-parameter per segment is cut from one fixed 'generating curve', rotated, scaled and translated between the knots. Choosing a spline therefore means choosing a curve. The Euler spiral (curvature linear in arc length) is the recommended generator. It gives G2 continuity, is exactly round (co-circular points give a circle, unlike polynomial splines or the minimum-energy elastica), and has good locality: a perturbation's ripple shrinks by 1/(2+√3), about 0.268, per knot. A G4 variant (polynomial spirals, 4 parameters) adds 'one-way constraints' for straight-to-curve transitions, at the cost of worse locality. Fairness criteria: the eye is sensitive to curvature extrema (Attneave, 1950s), so extrema should sit at designer-placed points with monotone curvature between them. Higher continuity is not the same as fairness: a G3 circle spline looks less fair than a G2 Euler spline. Survey: in a log-aesthetic family with curvature as a power of arc length, respondents preferred exponent ≈1.78 over the Euler spiral (1) and the energy minimum (≈0.9). A Newton solver handles global constraints, and ch.9 covers conversion to optimised cubic Béziers at a set error threshold. libspiro point types: corner 'v', G4 'o', G2 'c', left '[' and right ']' (connecting curve to straight line), plus anchor and handle.

**Why it matters here.** This is the theory behind 'natural, printed, not hand-drawn'. A curve looks engineered when its curvature profile is simple and monotone, and splines that guarantee this exist and can be converted to SVG Béziers. Ch.6 traces the Euler spiral to Talbot's 1890 railway transition spiral, the same clothoid the user meets in road and rail alignment, which is a useful mental model for them.

**Ideas to borrow:**

- Use an 'Euler-spiral spline' (G2) as the high-quality spine type next to Hobby. Use Hobby for live dragging and Euler for final render, or Euler throughout if fast enough.
- Give designers Spiro's small vocabulary of on-curve point types and nothing else: corner, smooth (G2), extra-smooth (G4), line-to-curve ('[') and curve-to-line (']'). This maps cleanly to tracing an Illustrator drawing.
- Rule for designers: put knots at curvature extrema (tips, tightest turn of a scroll). The engine keeps curvature monotone in between.
- Variation by interpolating knot positions and re-solving the spline (Levien ch.10), never by interpolating Bézier control points, which can break even G1 and cause kinks.
- Output stage: subdivide or fit analytic segments into the fewest cubics within a tolerance (Levien ch.9), so the SVG stays small and exact.
- Show a curvature plot or comb overlay in the editor, as Levien does for every figure. It is the instrument for judging 'printed' smoothness.

**Designer workflow.** Levien reports needing about half as many control points as the IKARUS spline, and says G2 points were enough for most of the Cecco capitals. His 2018 follow-up post ('A new spline') lists Spiro's real-world frustrations: the solver often failed to converge and produced wild patterns that felt like a rough research prototype; it resisted the dramatic curvature changes artists sometimes want; and the one-way constraints were easy to set backwards. These are why Spiro never became mainstream.

**Evidence read.** Downloaded the thesis PDF and read its abstract, introduction, ch.2 (fairness survey, continuity, roundness, locality, monotone curvature/Attneave), §4.7 (Hobby), §4.8–4.8.1 (generating curves, log-aesthetic splines), §7.4 (generalised constraints table) and ch.10 (font design, interpolation kinks). Read the libspiro README (github.com/fontforge/libspiro) for point types. Read levien.com/spiro for integrations. Read raphlinus.github.io/curves/2018/12/21/new-spline.html for Spiro's problems.

### 4. Log-aesthetic curves (Harada, Miura, Yoshida) and the golden spiral as a special case

<https://arxiv.org/abs/2105.09762> · paper · confidence: medium · verified

**What it is.** A family of 'aesthetic curves' from Japanese industrial-design research. Harada et al. found that curves designers judge beautiful have straight-line logarithmic curvature graphs: log of radius-of-curvature change against log radius. Miura formalised this as the log-aesthetic curve (LAC) with slope alpha. Nagy, Yoshida and Hoffmann (2021) extend it to G1/G2 Hermite interpolation with inflections.

**How it works.** The fundamental equation is a straight-line LCG with slope alpha. Special cases: alpha = -1 is the clothoid/Euler spiral (curvature linear in arc length), alpha = 0 is Nielsen's spiral, alpha = 1 is the logarithmic (equiangular) spiral, and alpha = 2 is the circle involute. The 2021 paper's C++ listing solves lambda and alpha by bisection from endpoints, tangents and the first tangent's length. It notes earlier LAC methods could only make monotone-curvature segments (no inflection or extremum) and that some alpha values have limited drawable regions. The logarithmic spiral r = a·e^(k·theta) has a constant pitch angle (tan alpha = k), is self-similar (scaling equals rotation), and has curvature cos(pitch)/r. Its arc length from the pole is r/sin(pitch), so its radius of curvature is exactly k times arc length. The golden spiral is the log spiral with growth φ per quarter turn: k = ln φ/(π/2) ≈ 0.3063, pitch ≈ 17.03°. The common construction from quarter-circles in nested golden rectangles is only an approximation with curvature jumps; in a cited study 79% preferred the true spiral, mainly for its continuous curvature.

**Why it matters here.** This turns 'make it golden' into an engineering requirement. Make a leaf curl golden by drawing it as a log-spiral (LAC alpha = 1) segment with k = 0.3063. Make the flame's leaf tips lie on a golden spiral by computing them as stations on that spiral. The same primitive with alpha = -1 gives clothoid transitions between straight ribbon runs and scrolls, so one parametric family covers stems, scrolls and transitions.

**Ideas to borrow:**

- A single 'aesthetic segment' primitive LAC(alpha, k, s0, s1). Presets: golden spiral (alpha = 1, k = 0.3063), clothoid (alpha = -1), plus free alpha. Designers pick from a dropdown rather than typing equations.
- Golden validator: sample a curve, compute radius of curvature against arc length from the pole, fit the slope, and show 'pitch 17.0° (golden)' or the deviation. Run it on traced Illustrator paths to show how close a hand-drawn flame already is.
- Leaf-tip placement: stations along a golden spiral at equal angle steps, or at arc lengths in φ ratio (each tip φ times farther along than the last), so tip spacing grows self-similarly.
- Self-similar motif sizing: if leaf i sits at radius r_i on a log spiral, scale leaf i by r_i/r_0. Self-similarity then holds for the leaves as well as the spine.
- Fit-from-points: Miura et al. describe generating a LAC from a 2D point sequence. Use that to import a traced curve and snap it to the nearest LAC or golden spiral, reporting the residual.

**Designer workflow.** The literature presents LACs as an interactive industrial-design tool. The designer sets endpoints and tangents plus one slope parameter and the system solves the rest. Hard parts: only a limited region of endpoint/tangent configurations is reachable for some alpha, curves with inflections need the extended or 'triplet' forms, and pure LACs cannot express arbitrary curvature variation.

**Evidence read.** Downloaded and read the arXiv PDF of Nagy, Yoshida and Hoffmann 2021 (introduction, LCG definition, the alpha = 2 and alpha = -1 cases, code listing). Read Levien's thesis §4.8.1 on LAC splines. Read Wikipedia 'Golden spiral' and 'Logarithmic spiral' for k, pitch, curvature, arc length and the approximation/preference note. Did not open Yoshida and Saito 2006 itself; its alpha = 1 log-spiral case came from secondary sources plus my own derivation, consistent with Levien's mention of the equiangular spiral.

### 5. Prototypo (Byte Foundry): browser-based parametric font engine

<https://github.com/byte-foundry/prototypo.js> · library · confidence: high · partly verified (see note)

**What it is.** A web app and JS engine (prototypo.js, built on paper.js and opentype.js, MPL-2.0 for JS) that let users reshape whole typefaces with sliders. Typefaces were authored as '.ptf' CoffeeScript sources (john-fell.ptf, venus.ptf, spectral.ptf). The company reportedly closed around 2020; the code is open.

**How it works.** Glyph data model (from john-fell.ptf 'o'): contours marked skeleton:true with nodes. Each node has x/y given as expressions over global parameters (thickness, xHeight, width, contrast, overshoot, spacing) and over other nodes' computed values (e.g. contours[0].nodes[2].expandedTo[0].x), plus dirOut, type 'smooth' and an expand object {width, angle, distr}. A build step ('operationalyzer') parses every expression with esprima into {_operation, _parameters, _dependencies}, so the engine knows the dependency graph and recomputes only what a slider affects. Expansion (naive.js): each skeleton node gets two outline nodes at origin ± width·distr along 'angle'. Handles: aim each handle at the intersection of the two tangent rays, scaled by curviness (2/3) × tension. Parallel tangents use a midpoint fallback. Note this is not curvature-continuous. A source comment admits directions were not in the dependency graph, an ordering bug. Controls are declared as {name, min, max, step, init, minAdvised, maxAdvised}.

**Why it matters here.** This is the closest web/JS precedent for the engine: expressions over parameters and other nodes' computed positions, a dependency graph, skeleton-plus-expand, live slider re-render in the browser. It also shows exactly where it fell short.

**Ideas to borrow:**

- Declarative node expressions compiled to a dependency DAG. Topologically sort and recompute only dependents on a parameter or viewport change. Include every input (directions too) in the graph, avoiding Prototypo's TODO bug.
- Skeleton node with expand {width, angle, distr}: the stroke's centreline is the dominant curve, and width, nib angle and left/right distribution are separate parameters (distr 0.5 centred, 0 or 1 one-sided). Ribbons and leaf blades map to this directly.
- Parameter declarations with hard range plus 'advised' range (minAdvised/maxAdvised). The UI shades the safe band so designers can explore without breaking the design.
- Hybrid model, Prototypo's own conclusion: skeletons for structural strokes, hand-drawn outlines for expressive details. In this project: spines and ribbons parametric, a few signature flourishes as attached Illustrator outlines that only transform with their station.
- Do not copy the ray-intersection × 2/3 handle rule as the main curve generator. Use Hobby or Euler splines for G2 quality.

**Designer workflow.** In the 2016 TypeDrawers interview, the founders said the main challenge was getting type designers to create parametric typefaces. They also said making creation easier nearly always means limiting creative possibilities, and that the pure outline approach did not scale, which led them to skeletons for stems and outlines for serifs. Designers in the thread objected that sliders distance the designer from the letter, that presets get ugly when pushed (Miles Newlyn), and that parametric tools build in bias. End users found sliders easy, but authoring a .ptf meant writing CoffeeScript expressions, the METAFONT barrier again.

**Evidence read.** Listed the byte-foundry GitHub repos via API. Read the prototypo.js README and the src/naive.js expansion and contour code. Read john-fell.ptf src/glyphs/lowercases/o.coffee, src/controls.coffee and operationalyzer.js. Read the TypeDrawers interview thread (typedrawers.com/discussion/comment/18810). The 2020 shutdown came only from a search-result snippet (Notion page), not verified.

> **Verification note:** The license is wrong: prototypo.js is GPL-3.0 (LICENSE file, package.json 'GPLv3'). MPL-2.0 covers .js/.jsx/.json files in the separate app repo byte-foundry/prototypo. The engine builds on the paper.js API and opentype.js through Byte Foundry's plumin.js dependency. The .ptf typefaces are separate CoffeeScript repos (byte-foundry/john-fell.ptf CC0, venus.ptf CC0, spectral.ptf OFL). The 'o' glyph data model is confirmed in john-fell.ptf src/glyphs/lowercases/o.coffee: skeleton:true, closed contours, nodes with x/y expressions over thickness, xHeight, width, contrast, overshoot and spacing, references like contours[0].nodes[2].expandedTo[0].x, dirOut, and expand {width, angle, distr}. The service was sunset on 1 July 2020, per Yannick Mathey's project page.

### 6. OpenType variable fonts and Glyphs 'smart components'

<https://learn.microsoft.com/en-us/typography/opentype/spec/otvaroverview> · technique · confidence: high · verified

**What it is.** The industry's working answer to parametric design. Instead of programs, designers draw a few point-compatible 'masters' at the corners of a design space and the system interpolates. Glyphs smart components apply this to reusable parts with named property sliders.

**How it works.** OpenType variations: axes have user min/default/max values mapped to normalised -1/0/+1 (piecewise-linear, optionally remapped by 'avar'). One default outline is stored plus per-point delta sets. Each delta has a rectilinear region with a peak. Per-axis scalars are triangular (0 to 1) and multiplied across axes, so only deltas whose region contains the instance apply. Masters must be point-compatible: same contours and same number of points per contour. Glyphs smart components: a part glyph (_part.*) has extra layers such as 'NarrowShoulder' and 'LowCrotch', each assigned values on named properties with a Bottom and Top limit. Placed instances get sliders that interpolate between layers. Anchors ('connect'/'_connect') snap parts together, and Width and Height properties can follow the bounding box. Glyphs' compatibility guide requires the same number and order of paths, nodes, handles, anchors and components in every master, and lists failure modes: kinks, 'node travellers' and 'shapeshifters'.

**Why it matters here.** This is the most designer-proven workflow, and it fits a designer who works in Illustrator: draw extremes, name them, get sliders. It is useful for motif families (a leaf at 'tight curl' and 'open curl', a crest at narrow and wide). But it is linear interpolation of control points, so it cannot by itself guarantee golden spirals or G2, and it does not track a dominant curve.

**Ideas to borrow:**

- 'Smart motif': the designer supplies 2–4 Illustrator drawings of the same motif with matching anchor counts (e.g. leaf-short, leaf-long). The engine interpolates by named properties (length, curl, width) with Bottom/Top limits, and the placed motif adapts to its station on a spine.
- Anchor-based snapping: motifs carry named anchors (base, tip, attach) that attach to stations on dominant curves, like Glyphs' connect/_connect.
- Use normalised axes (-1..0..1) with an optional piecewise-linear remap (avar-like) so slider response feels even to the designer.
- Interpolate parameters (angles, arc-length positions, LAC alpha/k, widths) rather than Bézier control points, so every instance stays G2 and golden where required. Use point interpolation only for free-form hand-drawn flourishes.
- Build a compatibility checker (same node count and order, anchor set) for imported Illustrator variants, modelled on Glyphs' red-triangle and Kink Finder diagnostics.

**Designer workflow.** Easy: designers draw in a familiar editor and see results instantly with sliders. Hard: keeping masters compatible (start points, path order, missing nodes), kinks when smooth-point triplets differ in angle or proportion between masters, nonlinear behaviour needing extra masters or intermediate regions, and structural changes needing glyph substitution.

**Evidence read.** Read the Microsoft OpenType Font Variations overview (normalisation, avar, regions, peak and per-axis scalar product, point-compatibility requirement). Read glyphsapp.com/learn/smart-components, multiple-masters part 1, and part 2 (keeping outlines compatible).

### 7. kurbo (Rust) and Levien and Uguray's Euler-spiral stroke expansion: fitting and offsetting

<https://docs.rs/kurbo/latest/kurbo/> · library · confidence: high · verified

**What it is.** kurbo is the Linebender project's 2D curve library (Apache-2.0), with arc length, nearest point, curvature, offsets, stroke expansion, simplification and general curve fitting. The 2024 paper 'GPU-friendly Stroke Expansion' (Levien and Uguray) and Levien's 2022 'parallel curves' post explain the parallel-curve maths behind it.

**How it works.** The ParamCurveFit trait means anything that can return position and derivative at t can be fitted to cubic Béziers. The fit pins endpoints and end tangents and solves the remaining two degrees of freedom by matching signed area and x-moment (a quartic), then subdivides until a distance metric is within tolerance. The docs say this is meant for offset curves with unknown cusps and for converting from piecewise Euler spirals or NURBS. Offsets: the exact parallel curve of a cubic is a 10th-order algebraic curve, so every practical method approximates. Cusps appear where curvature equals 1/offset distance, and the stroke then also needs evolute segments. The 2024 paper uses Euler spirals as an intermediate representation because their parallel curves have simple closed-form curvature and clean cusp behaviour. Error bounds are Fréchet distance, typically 0.25 device pixel.

**Why it matters here.** The user's 'clustered lines with a logical spread' and weaving ribbons are parallel-curve families. kurbo shows the correct pipeline: keep analytic spines, compute parallels with an error bound, handle cusps explicitly, and fit to Béziers only at output. The fitting trait is how golden spirals and clothoids, which SVG cannot express, become exact-looking SVG paths.

**Ideas to borrow:**

- A TS 'Fittable' interface (sample(t) returns {point, derivative}) for every analytic primitive. One fitter turns any of them into SVG cubics at a page-scale tolerance (e.g. 0.1–0.25 px at the current zoom).
- Hatch or line-cluster generator: offsets d_k = d_0·r^k (e.g. r = φ for golden spread) or linear spacing. Before rendering, assert max |d_k| < min radius of curvature on the spine, or trim and split at cusps, so engraved line families never form loops.
- Optionally compile kurbo to WASM for offset and fit, or port its algorithms, rather than using naive offsets.
- Use Euler-spiral segments as the internal representation of spines, so parallels and curvature combs are cheap and exact.

**Designer workflow.** This is infrastructure the designer never touches. It matters because it removes a class of artefacts (bulging offsets, loops at tight curls) that make generated ornament look 'computer-drawn'.

**Evidence read.** Read docs.rs/kurbo crate overview. Read kurbo source doc comments in kurbo/src/fit.rs (ParamCurveFit purpose, Euler spiral/NURBS mention) and offset.rs. Downloaded arXiv 2405.00127 and read the abstract, introduction and §2 framing. Read raphlinus.github.io/curves/2022/09/09/parallel-beziers.html. Checked the license via the GitHub API.

### 8. paper.js, bezier.js and Pomax's 'A Primer on Bézier Curves' (JS curve toolkits)

<https://pomax.github.io/bezierinfo/> · library · confidence: high · verified

**What it is.** The main JavaScript curve libraries plus the standard reference on Bézier maths. paper.js (MIT-style; Prototypo was built on it) offers path objects with offset-based queries and smoothing. bezier.js (MIT) offers per-curve maths. The Primer documents the algorithms and their limits.

**How it works.** paper.js: path.getPointAt, getTangentAt, getNormalAt and getCurvatureAt take an offset in length units from 0 to path.length. smooth() modes: 'continuous' (C2 across segments), 'catmull-rom' (factor 0 uniform, 0.5 centripetal with no self-intersections, 1 chordal), 'geometric' (tension 0–1) and the legacy 'asymmetric'. bezier.js: length() by Legendre-Gauss quadrature, getLUT, project (nearest point), curvature(t), offset(d), reduce() into 'simple' sub-curves, outline(d1,d2,d3,d4) for graduated (tapered) outlines, arcs(), intersects(), inflections(). Primer facts: Bézier arc length has no closed form; equal t steps are not equal distances (use a LUT); offsets of Béziers are not Béziers, so curves are split into 'safe' pieces first; circles cannot be exact, with handle k = 4/3·tan(theta/4), about 0.55228 for a quarter circle; a G1 join needs collinear handles.

**Why it matters here.** These are the practical TS building blocks for prototyping before writing a custom solver: arc-length stations, normals for attaching motifs, curvature for validation, tapered outlines for ribbons and leaf blades.

**Ideas to borrow:**

- Arc-length parametrisation as the only public coordinate on a spine (u = s/L). Implement with a cached LUT (bezier.js/Primer style) and invalidate on re-solve.
- Tapered ribbon or leaf blade from a spine via a graduated outline: start and end half-widths per side (bezier.js outline), generalised to a width function w(s) such as Knuth's taper parameters (lambda, rho, alpha).
- Use centripetal Catmull-Rom (factor 0.5) only as a quick, no-self-intersection preview spline. Final curves use Hobby or Euler.
- Use the 4/3·tan(theta/4) rule when emitting circular arcs (beads, medallion rings) as cubics, or emit SVG arc commands directly for exact circles.
- Run paper.js's getCurvatureAt along spines to draw curvature combs in a debug overlay.

**Designer workflow.** Programmer-facing. Usable for a TS engine today, but none of them gives designers constraints. They are geometry kernels. bezier.js scale and offset are only reliable on 'simple' segments, and the Primer warns approximate offsets can visibly jump when the curve moves.

**Evidence read.** Read the paper.js Path reference (smooth options, offset-based getters). Read pomax.github.io/bezierjs API page. Read the Primer table of contents and the sections on arc length, fixed-distance tracing, Catmull-Rom, poly-Bézier continuity, curve offsetting, graduated offsetting, and circular arcs with cubic Béziers. Checked licenses via the GitHub API.

### 9. Nupuram (Santhosh Thottingal, 2025): a modern METAPOST type-design workflow

<https://arxiv.org/abs/2502.07386> · paper · confidence: high · verified

**What it is.** A 2025 account of designing two variable and colour Malayalam font families with METAPOST plus MetaType1 macros, with an SVG/UFO pipeline, live preview and web proofing tools.

**How it works.** Glyphs are MetaPost programs with Hobby paths. Strokes come from MetaType1's pen_stroke 'expanding stroke' macro, using per-node nib widths and angles. Thick/thin configuration and axes (wght, slnt, SOFT) are parameters, and outputs go to SVG and then font files. The paper found plain pencircle strokes give an SVG centreline, not a closed outline. METAFONT's envelope method approximates pencircle by a 24-sided polygon, which gives many unwanted nodes that change unpredictably when parameters change. pen_stroke fixed this. Serifs and other non-pen shapes were drawn as explicit outlines (a hybrid). Development used an IDE with live SVG preview and overlaid guidelines, coordinates and points, plus a web proofing page and fontbakery tests.

**Why it matters here.** This is a recent first-hand report of what it is like to work this way, by someone with the programming skills the user lacks. It confirms which parts help (consistency, re-tuning metrics at any stage, cheap variants) and which hurt (language barrier, envelope artefacts, precision versus visual harmony).

**Ideas to borrow:**

- Closed-outline stroke expansion with controlled node count (pen_stroke style) rather than polygon-pen envelopes. Output nodes should be few, stable, and keep their count across parameter changes.
- Developer/designer preview mode: overlay spines, knots, stations, construction lines and numeric readouts on the live SVG (Thottingal's IDE setup), toggleable in production.
- A small playground page where the designer edits one motif's parameters and sees it in isolation (cf. his mpost.thottingal.in).
- Allow 'optical override' parameters per motif (a ±% nudge off an exact φ or 0.5 placement), recorded explicitly so the system stays declarative.

**Designer workflow.** He found it productive and consistent: modular shape code, global re-tuning at any stage, about 6 months of spare time for a superfamily. But he says METAPOST is hard to learn and short of worked examples, mathematical precision does not guarantee beauty (the programmer's exact 0.5 versus visually harmonious proportions), easy variants tempt you to make too many subfamilies, and the approach suits designers who can program.

**Evidence read.** Downloaded the arXiv PDF and read the introduction, §2.4–2.5 (envelope problem, MetaType), §5.4 (debugging and proofing), §9 Lessons and §10 Conclusion.

## Principles

- **Separate the skeleton (dominant curve, spine, ductus) from its envelope (pen, width, hatch). Every visible stroke is a centreline plus a width or nib function.**
  - Source: Knuth's pens-on-paths (Lessons Learned 1985; MetaPost manual §9), Prototypo skeleton plus expand {width, angle, distr}, MetaType1 pen_stroke in Nupuram
  - Apply: The engine stores ribbons, stems, leaf midribs and scroll lines as spines. Ribbons get width w(s) and nib angle; leaves get a blade profile; engraved line clusters are generated families. The same spine drives the outline, hatching and attached motifs, so they cannot drift apart.
- **Declare relationships, not coordinates: points are midway, at a fraction of the way, at intersections, or at an arc-length station on a named curve.**
  - Source: Knuth's 'second chief lesson' (1985); MetaPost mediation and 'whatever'; Prototypo node expressions with dependency graph
  - Apply: Write a small constraint/expression layer compiled to a DAG over page-box anchors, φ-derived lengths and curve queries (pointAt, tangentAt, curvatureAt, uAtDirection, intersections). Re-evaluate on resize, and flag redundant or inconsistent declarations like MetaPost does.
- **Use arc length, not Bézier parameter t, as the coordinate along every dominant curve.**
  - Source: Pomax's Primer (equal t is not equal distance; arc length needs quadrature); MetaPost arctime/arclength; paper.js offset-based getters
  - Apply: Stations are u = s/L or absolute s. Spacing laws (equal, φ-geometric, Fibonacci counts) are written in s. Cache arc-length LUTs per solved spine.
- **Choose curve primitives by curvature profile: curvature monotone between designer-placed points, extrema at the points, G2 (continuous curvature) at joins. Do not chase higher continuity for its own sake.**
  - Source: Levien thesis ch.2 (Attneave, monotone curvature, G2 vs G3/G4 fairness and locality); log-aesthetic curve research
  - Apply: Default spines are Euler-spiral or LAC splines (Hobby for fast preview). Tell designers to put knots at tips and tightest turns. Show a curvature comb so a 'printed' sweep is visibly one clean ramp, not wobbles.
- **Treat 'golden' as a measurable curve property: a golden spiral is the log spiral whose radius of curvature equals 0.3063 × arc length from the pole (pitch ≈ 17.03°, growth φ per quarter turn). Do not use quarter-circle approximations.**
  - Source: Wikipedia Golden spiral and Logarithmic spiral; log-aesthetic curve alpha = 1 case; Levien §4.8.1
  - Apply: Provide a golden-spiral/LAC primitive. Make the flame's tip curve one, place leaf tips as stations on it, and draw each leaf's curl as a log-spiral segment scaled by its radius. Add a validator that fits the radius-of-curvature-to-arc-length slope on any curve (including traced Illustrator paths) and reports the pitch.
- **Attach subordinate motifs to dominant curves with tangent and curvature continuity, so a leaf grows out of the sweep rather than sitting on it.**
  - Source: Spiro/Levien one-way constraints (curve side inherits tangent and curvature from the adjoining segment, §7.4); Glyphs smart-component anchors
  - Apply: A motif's spine starts at station s on its parent, inherits tangent θ(s) and curvature κ(s) there (G2 join), then follows its own LAC/clothoid law. Solve in dependency order: parent first, then children.
- **Generate clustered or parallel lines as solved families with a spacing law and a validity check, not as naive offsets or independent curves.**
  - Source: kurbo/Levien parallel-curve work (offsets of cubics are degree-10; cusps when curvature = 1/d); Knuth and Southall pulling the inner superellipse toward the outer
  - Apply: Families are either true offsets of an analytic spine with d_k following a law (linear or φ-geometric), checked so |d_k| < min radius, or interpolations between two bounding spines (line k = lerp at fraction f_k). Either way spacing is 'logical' and lines never cross.
- **Vary designs by interpolating parameters and re-solving, not by interpolating Bézier control points.**
  - Source: Levien ch.10 (Bézier interpolation breaks G1, 'kinks'); Glyphs compatibility guide (kinks, node travellers); OpenType variations are linear per region
  - Apply: Responsive variation (page width, density) changes spine knots, LAC parameters, station spacing and widths, then re-solves. Point-interpolation of Illustrator variants is limited to free-form flourishes with a compatibility checker.
- **Keep analytic geometry internal and convert to cubic Béziers only at output, within a stated error tolerance.**
  - Source: Levien thesis ch.9; kurbo ParamCurveFit; stroke-expansion paper's 0.25-px Fréchet tolerance
  - Apply: Every primitive implements sample(t) returning point and derivative. One fitter emits minimal SVG path data at the current device scale. Exact circles use SVG arc commands or the 4/3·tan(θ/4) rule.
- **Prefer re-solving at the target size over non-uniform scaling, because roundness and affine invariance conflict.**
  - Source: Levien §2.7 (round splines are not affine-invariant; an affinely transformed circle is an ellipse)
  - Apply: Never stretch a solved ornament with a non-uniform SVG transform to fit the page. Re-solve from page-relative constraints so spirals stay golden and circles stay circles at every aspect ratio.
- **Decompose the frame into constrained corner modules plus side modules that stretch or repeat.**
  - Source: Knuth's 1984 METAFONT class border assignment (NW, NM, NE, ME, SE, SM, SW, MW, with matched heights and widths so middle modules repeat)
  - Apply: Corner medallions are solved in a local box sized from the page (e.g. a φ fraction of the short side). Side ribbons are spines from corner exit to corner exit. Repeated motifs take an integer count n = round(L/period) and a period stretched so they fit exactly.
- **Give designers few, named, bounded controls and a tiny vocabulary of point types. Never require them to write equations.**
  - Source: Spiro point types; Glyphs smart-component properties with Bottom/Top; Prototypo minAdvised/maxAdvised; Knuth: 60 parameters is too much; Prototypo founders: ease limits possibilities
  - Apply: Each motif exposes 3–6 sliders (curl, length, width, count, spread) with hard and 'advised' ranges, and knots carry types corner, smooth, line-to-curve, curve-to-line. Equations live in expert-written motif generators (Knuth's 'teardrop subroutine' pattern).
- **Let the designer start from a drawing: import Illustrator paths as reference and fit them to engine primitives, rather than authoring from blank code.**
  - Source: Levien traced Baskerville Italic with Spiro; Miura et al. LAC-from-points; kurbo fitting; Thottingal's preview overlays
  - Apply: Import SVG from Illustrator, place knots at detected curvature extrema, fit a Hobby/Euler spine or golden LAC, show the residual and the 'golden pitch' readout, then let the designer accept, tweak sliders, or keep the hand-drawn piece as a hybrid outline.

## Cautions

- The METAFONT approach largely failed with professional type designers. Southall's two-year METAFONT typeface was abandoned unfinished. Knuth said asking an artist to master 60 parameters is too much. Thottingal (2025) still calls METAPOST hard to learn and suited to designers who can program. Assume the user will not write constraint code: the engine needs a visual or slider front-end and expert-written motif generators.
- Hofstadter's 1982 critique (I read only the abstract) argues no finite set of parameters captures the 'spirit' of a form. In practice, presets break when pushed (Miles Newlyn's Prototypo test), and the founders admitted making creation easier limits creative possibilities. Expect to keep some hand-drawn outline flourishes (Prototypo's and Nupuram's hybrid conclusion).
- Mathematical precision does not guarantee beauty. Thottingal found exact 0.5 placements often lose to optical judgement. Knuth found a little randomness made letters seem 'warmer'. Make the golden ratio a strong default with a measurable deviation readout and an explicit optical-override parameter, not an inviolable rule.
- Golden-ratio myths: nautilus shells and galaxies are generally not golden spirals (per the Wikipedia article). Golden-ratio ornament is a design choice, not a law of nature, so do not justify it as 'natural' to collaborators.
- A golden log spiral has a fixed, fairly open pitch (≈17°). Forcing both the tip curve and every leaf curl to be exactly golden may look monotonous or too loose for tight scroll terminals. Expose the LAC slope and pitch as parameters with golden as the preset.
- Hobby splines are only approximately G2 and round. They are non-local (moving one knot moves everything), can snap to a different shape after tiny moves, and are numerically unstable near straight-angle turns and nearly collinear knots (Jackowski 2013 shows orientation flips from 2^-16 nudges). Avoid such knot layouts or warn about them.
- Spiro/Euler-spiral solvers can fail to converge and produce wild loops. G4 has worse locality than G2. Spiro's one-way constraints confused users. Levien abandoned Spiro's model for a Hobby-like approach in 2018. Budget for robust solving (good initial guesses, fallback to Hobby).
- Euler spirals, log spirals and LACs are not SVG primitives. They need numerical integration (Fresnel-type integrals) and fitting to Béziers. Some LAC configurations have limited drawable regions, and inflections need extended LAC forms. This is real numerical code, not a weekend task.
- Offsets of Béziers are not Béziers (degree-10 curves). Naive offsets bulge, and any offset farther than the local radius of curvature forms cusps and loops. bezier.js scale/offset is only reliable on 'simple' segments, and approximate offsets can jump visibly as curves move. Engraved line clusters around tight curls need cusp handling or spacing limits.
- Interpolating Bézier control points between variants (variable-font style, Glyphs masters) is linear and can create kinks, node travellers and shapeshifters. It needs point-compatible sources with matching node order. It cannot keep golden or G2 properties during interpolation.
- Prototypo's handle rule (aim at the tangent-ray intersection × 2/3 × tension) is not curvature-continuous and breaks when tangents are parallel. Its source also shows a dependency-ordering bug where directions were missing from the graph. Don't copy its curve maths; copy its data model.
- Polygon-pen envelopes (METAFONT's 24-gon pencircle) produce messy, parameter-unstable node sets in vector output (Thottingal). Stroke expansion must give clean, closed outlines with stable node counts.
- Roundness and affine invariance conflict (Levien §2.7). Any non-uniform CSS/SVG scaling of a finished ornament destroys circles and spirals. Responsiveness must come from re-solving, which costs CPU on every resize, so throttle it and cache arc-length LUTs.
- Sources partly unverified: Southall's report and Hofstadter's essay were seen via abstracts and summaries only. Prototypo's 2020 shutdown came from a search snippet. Yoshida and Saito 2006 was not opened directly (its alpha cases are confirmed via the 2021 paper and Levien's thesis).
