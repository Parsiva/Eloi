# Digital engraving and security printing

> Research angle `engraving-print` — part of the [frame engine research](README.md).

## Summary

Professional engraved and security-printed line work does not look "printed" because of texture. It looks printed because every line belongs to a family generated from a few guide curves, and line weight is a continuous function, not a fixed stroke width. Ostromoukhov's Digital Facial Engraving shows the core model. A designer draws four border curves in Illustrator, the engine re-parametrizes them by arc length, builds a Coons-patch grid, and turns iso-parametric lines into engraved lines by thresholding a sawtooth "universal copperplate". Lines therefore swell and taper to nothing on their own, and layers merge by min/max rules to make cross-hatching. DigiDürer gives a second model that maps closely to "dominant functions": each line is a propagated front (equipotential) of an initial curve, with spacing set by a speed field. It also names the three properties that make classical line work read well: lines never cross, run roughly parallel and stay smooth. Real rose-engine guilloché supplies the answer for "logical spread". One waveform is repeated N times, and only a fixed step and a deterministic phase sequence change between cuts: constant, half-pitch for barleycorn, a linear ramp, a zigzag, or even Fibonacci for the "sinewave" moiré. Guilloche software makes the same idea explicit with envelopes: a sinusoid is mapped between an inner and an outer envelope curve. Commercial security tools (Agfa Arziro as an Illustrator plug-in, Jura Corvina Engraver) confirm the workflow is hybrid. Designers draw guide paths and freehand key strokes, and generators fill in the line families. In the browser, the realistic split is crisp vector geometry, with variable width baked into filled outline polygons because SVG has no variable-width stroke. A separate, static "ink" layer can add ink gain (blur plus threshold, or dilate) and very low-amplitude displacement. WebGL threshold shading is the option for very dense fills. Animated or large-area feTurbulence/feDisplacementMap is a known performance and crash risk, and noise quickly reads as grunge rather than engraving.

## Case studies

| # | Case study | Kind | Confidence | Verification |
|---|---|---|---|---|
| 1 | [Digital Facial Engraving (Victor Ostromoukhov, SIGGRAPH 99)](https://lspwww.epfl.ch/publications/microstructureimaging/dfe.pdf) | paper | high | verified |
| 2 | [Artistic Halftoning – Between Technology and Art (Ostromoukhov, SPIE 2000; covers Artistic Screening SIGGRAPH 95 and Multicolor/Artistic Dithering SIGGRAPH 99)](https://perso.liris.cnrs.fr/victor.ostromoukhov/publications/pdf/SPIE2000_TechArt.pdf) | paper | high | verified |
| 3 | [DigiDürer – a digital engraving system (Pnueli & Bruckstein, The Visual Computer 1994)](https://freddy.cs.technion.ac.il/wp-content/uploads/2018/01/digDurer-a-digital-engraving-system.pdf) | paper | high | verified |
| 4 | [Rose engine & straightline engine guilloché (G. Phil Poirier, SNAG Technical Article Part 2, 2016)](https://snagmetalsmith.org/wp-content/uploads/2016/04/GuillochePart2SNAG.pdf) | technique | high | verified |
| 5 | [Envelope-based guilloche rosettes and borders (Stephen M. Cameron, 'Playing Around With Guilloche Patterns' slides + Processing code) with the Variable Guilloche patent US8289579B2](http://smcameron.github.io/guilloche-experiments/guilloche-talk17.html) | technique | high | verified |
| 6 | [Commercial security-design software: Agfa Arziro Design (Illustrator plug-in) and Jura Corvina / Corvina Engraver (Lupo specimen banknote)](https://jura.hu/high-security-prepress/) | tool | medium | verified |
| 7 | [Evenly-spaced streamlines (Jobard & Lefer 1997) and anvaka/streamlines (JavaScript implementation)](https://github.com/anvaka/streamlines) | library | high | verified |
| 8 | [Computer-Generated Pen-and-Ink Illustration (Winkenbach & Salesin, SIGGRAPH 94)](https://www.cin.ufpe.br/~sbm/p91-winkenbach.pdf) | paper | high | verified |
| 9 | [Real-Time Halftoning: A Primitive for Non-Photorealistic Shading (Freudenberg, Masuch, Strothotte, EGWR 2002)](https://www.eecs.umich.edu/courses/eecs598-5/papers/freudenberg-rth-2002.pdf) | paper | high | verified |
| 10 | [Browser print-simulation toolkit: SVG ink-gain/letterpress filters, variable-width outlines, and their performance limits](https://www.carmenansio.com/articles/svg-filters-on-type/) | technique | medium | partly verified (see note) |
| 11 | [Illustrator-native guilloche construction (Envato Tuts+ 'Create a Security Seal in Illustrator Using Guilloche Patterns')](https://design.tutsplus.com/tutorials/create-a-security-seal-in-illustrator-using-guilloche-patterns--vector-4828) | technique | high | verified |

### 1. Digital Facial Engraving (Victor Ostromoukhov, SIGGRAPH 99)

<https://lspwww.epfl.ch/publications/microstructureimaging/dfe.pdf> · paper · confidence: high · verified

**What it is.** A system that imitates copperplate engraving. Engraving layers are built over an image and merged with masks, and the paper is the base reference for digital engraving in security and stamp printing.

**How it works.** (1) Basic engraving layer: uniformly spaced waves on a unit square in (u,v) space, each with a sawtooth cross-section modelled on the triangular furrow a burin cuts. This is a 'universal copperplate' threshold structure. Comparing the input tone to it gives a line whose width is proportional to darkness, so engraving equals ordered dithering with a designed threshold matrix. (2) Warping: each layer is mapped into the image by a Coons patch P(u,v)=(1-v)U1(u)+vU2(u)+(1-u)L(v)+uR(v), where L(v)=V1(v)-(1-v)V1(0)-vV1(1) and R(v) is defined the same way. The four border curves are straight lines or Bézier segments 'easily created... using Adobe Illustrator'. Each border curve is re-parametrized for uniform arc length, so curves with different segment counts and lengths interpolate smoothly. (3) Merging: each layer gets a range scale S and range shift D (T' = T*S + D), painted as masks. Merge modes are copy, smaller (MIN, which produces cross-etching), bigger (MAX, continuous lines in darks), multiply and add. Abrupt mask edges give clean junctions between layers; soft edges give gradual overlap. (4) Equilibration: the threshold matrix is corrected locally and iteratively with a dot-gain and human-visual-system model, so uniform input always gives uniform perceived tone. It is computed at 16 levels and interpolated. When an accent layer of strokes parallel to a feature was added, equilibration automatically thinned the surrounding lines. (5) An 'engraving style' is a reusable set of layers plus masks that carries over to new images. Deliberate irregular perturbation, mezzotint layers, and abrupt changes of direction or frequency are used as expressive contrast tools.

**Why it matters here.** This is the closest published model of what the user describes. A few designer-drawn 'dominant' curves define a patch, and every engraved line is an iso-curve of that patch, so all lines are positioned relative to the guide curves. Line weight comes from a function, so lines swell and taper with mechanical consistency instead of hand-drawn variation.

**Ideas to borrow:**

- Patch primitive: four named Illustrator paths (top, bottom, left, right) become a Coons patch. Line families are iso-u or iso-v curves at a chosen pitch, so the medallion's leaf hatching follows the sweep of the stem.
- Re-parametrize every imported guide curve by arc length with a lookup table before use, so u=0.5 always means halfway along the curve whatever its Bézier segment count.
- Width as a threshold: width(u,v) = pitch * clamp(tone(u,v)) for each line. Lines taper to zero wherever tone reaches zero, so tapering comes from the tone field and not from line caps.
- Merge modes as engine operations: MIN for cross-hatching that breaks up in highlights, MAX for lines that stay continuous in darks, and copy with a mask for clean hand-offs between line families.
- Accent strokes with equilibration: adding a contour-hugging accent line thins its neighbours so the local tone stays constant.
- Reusable 'style' objects (pitch, angle, merge mode, width curve) that a designer applies to any new patch.

**Evidence read.** Downloaded the full PDF and read all sections: Rationale, 2.1 Building layers with the Coons patch (eq. 1), 2.2 Superimposition with the Table 1 merge modes, 2.3 Equilibration, 3 B/W engraving, 3.3 Enhancements, 3.4 Engraving style, 4 Color, 5 Future work.

### 2. Artistic Halftoning – Between Technology and Art (Ostromoukhov, SPIE 2000; covers Artistic Screening SIGGRAPH 95 and Multicolor/Artistic Dithering SIGGRAPH 99)

<https://perso.liris.cnrs.fr/victor.ostromoukhov/publications/pdf/SPIE2000_TechArt.pdf> · paper · confidence: high · verified

**What it is.** An overview of halftoning methods whose screen elements are designed shapes (ornaments, letters, microtext), with applications to banknote and anti-counterfeiting design.

**How it works.** A graphic designer draws dot contours in Adobe Illustrator at a few fixed intensity levels. All contours are cubic Béziers, and straight parts are also stored as Bézier control polygons, so every contour has a compatible structure. Shape blending then interpolates the contours for all 256 levels, and each level is rasterized in advance with non-zero winding. The definition space and the rendition space are separate, and the mapping between them can be non-linear. Examples are a conformal map w = k(1+z+e^z) that bends a rectangular grid of motifs along electromagnetic field lines, and w = tg(z), which produces a non-repeating microletter screen on an imaginary banknote that resists scanning without moiré. Multi-color dithering lays inks side by side without overlap. Partially random dither matrices keep motifs readable across a wider tone range.

**Why it matters here.** It shows a designer-friendly split. The designer draws a few keyframe shapes, the engine interpolates the in-between shapes and warps a regular arrangement of them along curved fields. Conformal (angle-preserving) maps keep each motif's proportions while the field bends, which is what leaves strung along a sweeping curve need.

**Ideas to borrow:**

- Keyframed motifs: the designer draws a leaf at 2-3 'growth' states with the same anchor count and order, and the engine blends between them by parameter (size, position along the spine).
- Enforce compatible Bézier topology on import (same number of segments and the same start point) and flag violations to the designer, because interpolation fails otherwise.
- Separate definition space from rendition space. Ornament rows are authored straight in a unit strip, then mapped onto a dominant curve with an angle-preserving warp so leaves are not sheared.
- Microtext or motif screens as a fill style for bands such as the bead or lattice bands.

**Evidence read.** Downloaded the PDF and read the abstract, §1, §2 Artistic screening (contour interpolation, conformal mappings, banknote microletters), §3 Multi-color dithering, §3.5 partially random matrices, and the start of §4.

### 3. DigiDürer – a digital engraving system (Pnueli & Bruckstein, The Visual Computer 1994)

<https://freddy.cs.technion.ac.il/wp-content/uploads/2018/01/digDurer-a-digital-engraving-system.pdf> · paper · confidence: high · verified

**What it is.** An engraving and halftoning system in which every line is a level contour of a potential field grown outward from an initial curve.

**How it works.** The authors note that lines in classic engravings are (1) non-intersecting, (2) approximately parallel and (3) smooth except at edges, which are the properties of equipotential lines. To keep tone correct, the local density of lines measured normal to the lines must be proportional to the grey level. They solve the Eikonal equation |∇H| = g(x,y), using an initial line L(s,0) as the boundary condition, and draw contours of H every ΔH, with ΔH proportional to line width w. In practice this is front propagation: each point of the current line moves a distance dt along its normal so that dH = g·dt, and the result is the next line. Known problems are fronts that fail to cover the whole picture (so propagation also runs in the reverse direction) and topological problems such as shocks and cusps. For each decision (for example the choice of initial curve) the system takes input from a built-in algorithm, the user, or externally supplied 'side information'.

**Why it matters here.** This is the formal version of 'dominant functions with lines relative to them'. The dominant curve is the initial front, and every sibling line is a propagated copy of it, spaced by a speed field. A speed field can encode any logical spread, including a phi progression, and the result stays parallel and never crosses.

**Ideas to borrow:**

- Offset-family generator: given a dominant curve and a spacing function d_k (constant, geometric by φ, Fibonacci, eased), produce lines as offsets or fronts at cumulative distances, with optional variation along the curve (g(s)).
- Make 'non-intersecting, approximately parallel, smooth' a validator that rejects or trims any generated family that breaks it.
- Detect shocks and cusps where fronts collide (high curvature on the concave side) and end lines there with a taper, the way engravers stop lines.
- Three-source parameter design: every engine decision gets a computed default, a designer override in Illustrator, and a data-driven option.

**Evidence read.** Downloaded the PDF and read the abstract, §1, §2 and §3.1–3.2 (the Eikonal formulation, the equipotential-contour algorithm, the list of classic line properties and the topological problems).

### 4. Rose engine & straightline engine guilloché (G. Phil Poirier, SNAG Technical Article Part 2, 2016)

<https://snagmetalsmith.org/wp-content/uploads/2016/04/GuillochePart2SNAG.pdf> · technique · confidence: high · verified

**What it is.** A practitioner's technical account of how mechanical guilloché machines produce their patterns: rosettes, phasing, cutter geometry and rules for developing patterns.

**How it works.** A rosette cam with N lobes rocks the headstock against a fixed touch while the cutter stays still. Cuts run from the outside toward the centre with a fixed radial step. Hundreds of patterns come from one rosette by changing only the phase between cuts. Zero phase gives a concentric pattern. A half-pitch shift gives barleycorn (a 24-lobe rosette turned 1/48 of a circle, 7.5°). A constant 1° per cut gives a pinwheel. ±1° for 5 cuts and then the reverse gives lightning or zigzag. Worm adjustments 'resemble the Fibonacci sequence, 1,2,3,5,8,13,8,5,3,2,1' to give the radiating sinewave or moiré pattern. Straightline engines work the same way: a half-pitch crossing-slide offset gives barleycorn, and a small increment per cut gives a diagonal. The touch radius relative to the lobe radius sets the waveform: exactly ½ gives a sine, less gives concave scallops, more gives convex scallops. Moving the touch to the other side mirrors the pattern. Amplitude stays constant while the radius shrinks, so the centre turns 'muddy' and guillochers cut plain circles there. The cutter has a 150–160° included angle, and depth controls width, so lines within a family have constant width.

**Why it matters here.** This is the historical, mechanical proof that 'clustered lines with logical spread' means one base waveform, N copies, a fixed step and a deterministic phase sequence. It also shows that Fibonacci-governed spacing is a real guilloché technique, not just a decorative idea, which ties directly to the user's golden-ratio goal.

**Ideas to borrow:**

- LineFamily = {baseWave(t), count N, stepFn(k), phaseFn(k), widthFn}. phaseFn presets: constant, alternating half-pitch (barleycorn), linear ramp (pinwheel), zigzag(n) (lightning), Fibonacci up and down (sinewave), and φ-geometric.
- Waveform 'touch' parameter: one scalar morphs a lobe between concave scallop, sine and convex scallop, which gives designers one intuitive slider.
- Mirror toggle (touch on the opposite side) for symmetric side ribbons.
- Scale amplitude with local radius or curvature, and automatically switch to plain curves where spacing would collapse ('anti-mud' rule).
- Constant line width within a family (fixed cutter depth); vary width between families to create hierarchy.

**Evidence read.** Downloaded the PDF and extracted the text. Read Part II (machines, cutting tool), Part III (pattern development for rose and straightline engines, including the Fibonacci phase sequence) and the touch/rosette relationship section.

### 5. Envelope-based guilloche rosettes and borders (Stephen M. Cameron, 'Playing Around With Guilloche Patterns' slides + Processing code) with the Variable Guilloche patent US8289579B2

<http://smcameron.github.io/guilloche-experiments/guilloche-talk17.html> · technique · confidence: high · verified

**What it is.** An open-source (MIT, Processing) step-by-step build of guilloche rosettes and frames, plus a patent that lists the polar curve families used in security guilloche.

**How it works.** Spirograph wheels along a path give one family. True rosettes instead map a sinusoid between envelopes: r(t) = inner(t) + (outer(t) − inner(t))·(s(t)+0.5), where s is a sinusoid scaled to [−0.5, 0.5]. Two sinusoids π/2 out of phase give the interlace, and N curves offset by 2π/N give a full rosette. Envelopes can be undulating circles r = R·cos(t·C·M) + r_min, or polygons (a 7-point star). One rosette's outer envelope can serve as the next rosette's inner envelope, which nests the rosettes. Known failure: a rectangular envelope parametrized by arc length while the drawing arm sweeps at a constant angle gives distorted patterns, because the arm-envelope intersection does not move at constant speed. The fix is to parametrize the envelopes by angle. Arbitrary paths are evaluated by accumulating segment lengths to find the position at t/period. The patent describes guilloches as spirograph-like curves interlacing between inner and outer envelopes, built from nested sums and products of sinusoids in polar form r = f(θ). It lists cardioid, rose, limaçon, lemniscate, several spirals including exponential/logarithmic, conchoid and conic families.

**Why it matters here.** The envelopes are the user's dominant functions, and the interlaced lines are parametric fills between them. A border band down the side of the page is two envelope curves offset from the frame spine. The parametrization failure is exactly the bug the engine has to prevent when bands turn corners.

**Ideas to borrow:**

- Band primitive: Band(innerEnvelope, outerEnvelope, waveCount, strands, phaseOffsets, waveform), using r = inner + (outer − inner)·(0.5 + s(t)).
- All envelopes in a band share one parameter (a common spine's arc length, or angle for rosettes). Assert this at construction.
- Snap waveCount to an integer per frame side, or per closed loop, so patterns close cleanly at corners and seams; the designer sets an approximate wave length, not an exact count.
- Nesting: rosette k's outer envelope is rosette k+1's inner envelope, so layered medallion rings stay registered.
- Use a logarithmic spiral r = a·e^{bθ} as an envelope or spine for the flame corner. The patent includes it in its standard guilloche curve families.

**Evidence read.** Fetched the text of slides talk0–talk24 (rectangular paths, arc-length path evaluation, envelope mapping formula, 16-curve rosette, star envelope, nesting, the rectangle distortion bug and its angle-parametrization fix). Read the Google Patents page for US8289579B2 (first 100k characters; some equations garbled in the source). Could not read the Wolfram 'Guilloché Patterns' demonstration code, only its description.

### 6. Commercial security-design software: Agfa Arziro Design (Illustrator plug-in) and Jura Corvina / Corvina Engraver (Lupo specimen banknote)

<https://jura.hu/high-security-prepress/> · tool · confidence: medium · verified

**What it is.** Production tools used by banknote, stamp and brand-protection designers to generate guilloche, line rasters, reliefs and digital intaglio engraving.

**How it works.** Arziro Design runs as an Adobe Illustrator plug-in (Mac and PC). Its listed modules are Special Rasters (Line Raster, Select Raster, Trafo Raster, Dither Raster), Special Reliefs (Quick Background, Numismatics), Crystal Patterns, Path Definition, Line/Object Generator, a Guilloche Library and Guilloche Generator, and a Blend module. Users pick predefined parameters or define their own, and the output is ordinary Illustrator vectors. Jura's Corvina Plus has about 400 tools. Corvina Engraver offers three workflows: Classic (freehand drawing), Digital (automated calculations) and Master (both combined), with tablet optimisation and editable, resolution-independent vector art. For the Lupo specimen note, the wolf portrait was 'digitally engraved in vector format, drawn freehand on a graphics tablet'. For intaglio, the design was extended with 3D data (line depths and profiles) and laser-engraved directly. Colour and plates were simulated and proofed before print.

**Why it matters here.** Professional systems are hybrids. Generators live inside the designer's existing vector tool and operate on paths the designer marks, while the key figurative strokes are still drawn by hand. This is the realistic model for the user too: Illustrator stays the authoring surface, and the engine adds structure.

**Ideas to borrow:**

- 'Path Definition' step: the designer tags Illustrator paths with roles (spine, envelope, patch-edge, leaf-key) through layer or ID naming, and the engine generates everything else.
- Classic / Digital / Master modes for each element: fully hand-drawn, fully computed, or a hand-drawn key stroke with computed sibling lines.
- A per-line profile attribute (depth/width curve) stored separately from the centreline, as in intaglio 3D data.
- An on-screen QC or proof view at 1:1 and at the smallest supported viewport, to catch lines thinner than the minimum before publishing.

**Evidence read.** Read jura.hu/high-security-prepress (Corvina Plus, Corvina Engraver workflows, DLE), the Keesing Lupo banknote project article (design process, freehand vector engraving, 3D intaglio data), the newproimage.com Arziro Design module list and the PrintAction Arziro 4.0 article. agfa.com product pages were blocked by a CAPTCHA, and no internal algorithm documentation is public.

### 7. Evenly-spaced streamlines (Jobard & Lefer 1997) and anvaka/streamlines (JavaScript implementation)

<https://github.com/anvaka/streamlines> · library · confidence: high · verified

**What it is.** A single-pass algorithm, with an MIT-licensed JS implementation, that fills a region with non-overlapping curves that follow a vector field at a controlled separation. The paper describes its sparse output as a 'hand-drawing style'.

**How it works.** A streamline is integrated from a seed (RK4 in anvaka). Candidate seeds for new lines are placed at distance dsep from the samples of existing lines. Integration stops when a line comes within dtest of another line (dtest = 0.5·dsep recommended) or hits a boundary or singularity. A uniform grid with cell size dsep stores sample points for fast distance tests. Tapering is built in: thicknessCoef = 1 if d ≥ dsep, else (d − dtest)/(dsep − dtest), where d is the distance to the nearest line, so lines thin as they converge and density looks even. Starting new lines next to existing ones gives better sparse illustrations than random seeding. In the paper this ran in seconds where Turk's iterative method took minutes. anvaka's API: vectorField(p), boundingBox, seed (or a list), dSep, dTest, timeStep, forwardOnly, onPointAdded, onStreamlineAdded(points). It is asynchronous and interruptible, with no rendering dependency.

**Why it matters here.** Filling irregular shapes (a leaf blade, the flame body, the cartouche ground) with hatching that follows a dominant flow, never crosses, keeps an exact spacing and tapers where it converges, which is how engraved hatching behaves.

**Ideas to borrow:**

- Seed the first streamline on the dominant curve and grow neighbours at dsep, so the whole fill is anchored to it.
- Make dsep a field instead of a constant (for example, grow by φ away from the spine, or follow tone) to get a 'logical spread' in irregular regions.
- Use the taper formula directly as the widthFn multiplier, so line ends look burin-cut instead of capped.
- Use a spatial hash grid with cell size dsep for every distance-constraint check in the engine.

**Evidence read.** Downloaded the TU Wien-hosted paper PDF and read §2.1–2.2 (dsep, dtest, grid, seeding), §3 Hand-drawing style (tapering formula, timings) and §4. Read the anvaka/streamlines GitHub README.

### 8. Computer-Generated Pen-and-Ink Illustration (Winkenbach & Salesin, SIGGRAPH 94)

<https://www.cin.ufpe.br/~sbm/p91-winkenbach.pdf> · paper · confidence: high · verified

**What it is.** The base NPR paper that defines a stroke data model and 'prioritized stroke textures' for building tone from line work, with resolution-dependent output.

**How it works.** A stroke is a path P(u) (its overall 'sweep'), a nib N(p) giving the cross-section footprint as a function of pressure, and a character function C(u) = (Cw(u) waviness, Cp(u) pressure). The rendered stroke is the convolution S = (P(u) + Cw(u)) * N(Cp(u)). In code, an InkPen is a Nib, a WavinessFunction and a PressureFunction. Tone over area A with nib width w needs total stroke length vA/w, and crossing two hatch directions deposits 2x − x² ink, assuming uncorrelated overlap. Prioritized stroke textures draw the highest-priority strokes first and add lower-priority strokes only while the tone is still too light. The same texture and tone can therefore be produced at different scales or resolutions, and detail can be faded out ('indication'). Stated principles include building tones from lines of roughly equal weight and spacing, using thick outlines for shadow, and letting outlines change thickness.

**Why it matters here.** Separating the sweep (the dominant function) from the character (waviness and pressure) is the step that turns hand-drawn into printed. Set waviness to zero, make pressure a deterministic function, and the same skeleton reads as engraved. Prioritized strokes also solve how the frame adapts to any page size.

**Ideas to borrow:**

- Stroke model {sweep: Curve, nib: round|lozenge(burin), widthFn(u), wavinessFn(u)=0 by default}. Any non-zero waviness has to be an explicit, deterministic design choice.
- Responsive density: each line family has priority tiers. As the frame grows, priority-2 lines are inserted midway between priority-1 lines (keeping physical pitch) instead of scaling line widths up.
- Tone accounting: when the engine adds cross-hatching, it uses 2x − x² to reduce each layer's width and hold the target darkness.
- Indication: fade fill detail toward the page interior so the ornament reads strongest at the frame edge.

**Evidence read.** Downloaded the PDF (the 1994 paper p91) and read the abstract, §2 principles of tone and outline, Fig. 3 (resolution-dependent rendering), and Appendix A.3.1–A.3.2 (stroke = path + nib + character function, InkPen, tone formulas).

### 9. Real-Time Halftoning: A Primitive for Non-Photorealistic Shading (Freudenberg, Masuch, Strothotte, EGWR 2002)

<https://www.eecs.umich.edu/courses/eecs598-5/papers/freudenberg-rth-2002.pdf> · paper · confidence: high · verified

**What it is.** A GPU method that renders engraving with tone-dependent line width, and prioritized stroke textures, in real time by thresholding a halftone-screen texture per pixel.

**How it works.** The halftone screen is a texture in surface (u,v) space and target intensity col is compared per pixel. A binary threshold aliases and pops, so they use a smooth threshold: tmp = (1 − tex − col)·C, out = 1 − tmp, clamped to 0..1, with C ≈ 4, which antialiases the stroke edges. For one set of parallel engraving lines, a 1D grey-ramp texture is enough. Line width then tracks lighting automatically, which is the GPU version of Ostromoukhov's copperplate. Several prioritized stroke layers are packed into one greyscale stroke map: the darkest layer covers the full range and lighter layers are compressed toward white. Darker tones therefore reveal more layers. An indication map lightens or darkens regions, and per-stroke normal maps make a single stroke change width with light direction. It ran at more than 20 fps at 1600×1200 on a GeForce2Go.

**Why it matters here.** Shows that line-field engraving can be evaluated analytically per pixel. Dense fills (backgrounds, the lattice ground, large flame bodies) can be drawn by a shader at constant cost instead of thousands of SVG paths, still anchored to dominant curves through their (u,v) parametrization.

**Ideas to borrow:**

- WebGL fill renderer: v = signed distance (or patch v-coordinate) from the dominant curve; line = smooth threshold of fract(v/pitch) against width(tone). Antialias with smoothstep and fwidth computed on the unwrapped coordinate.
- Pack several priority tiers of hatching into one texture so density changes with tone or viewport without new geometry.
- Indication map as a low-resolution designer-painted mask (exportable from Illustrator or Photoshop) that shifts tone per region.

**Evidence read.** Downloaded the PDF and read the abstract, §3.1–3.2 (binary and smooth threshold formulas), §4.1 Engraving (1D ramp), §4.2 Stroke textures, §5 effects and §6 performance.

### 10. Browser print-simulation toolkit: SVG ink-gain/letterpress filters, variable-width outlines, and their performance limits

<https://www.carmenansio.com/articles/svg-filters-on-type/> · technique · confidence: medium · partly verified (see note)

**What it is.** Documented SVG filter recipes that imitate physical printing (ink gain, ink bleed, worn letterpress). Also covers how to get variable-width lines in SVG, which has no native support, and field reports on filter cost.

**How it works.** Ink gain: feMorphology dilate (radius about 2) on SourceAlpha, flooded and merged under the source. Erode gives thinning. Ink bleed (Andy Jakubowski): blur, then feComponentTransfer with feFuncA type=discrete tableValues='0 1 1 1', so ink spreads but edges stay crisp. Worn letterpress: feTurbulence fractalNoise baseFrequency 0.035, numOctaves 3, feeding feDisplacementMap scale 6. Low scale wobbles and high scale shreds. Expand the filter region and set color-interpolation-filters='sRGB'. Cost: turbulence, displacement and lighting are the most expensive primitives. In the GSAP forum an animated feTurbulence/feDisplacementMap effect stuttered on iOS and sometimes reloaded or crashed Safari tabs, and the GSAP team said filters are 'notoriously VERY demanding on the CPU'. Variable width: the W3C 'stroke-profile-widths/positions' proposal is a draft last edited in 2014 with no browser implementation, so width variation has to be baked into filled outlines. perfect-freehand (MIT) shows the pattern: getStroke(points with pressure, {size, thinning, start/end taper with easing}) returns an outline polygon, which is rendered as a filled path.

**Why it matters here.** This is the 'printed' finishing layer and the main performance constraint for a responsive SVG frame.

**Ideas to borrow:**

- Outline builder: centreline plus widthFn(u) gives a left/right offset polyline, smoothed and closed into one filled path, with taper easing at the ends. Self-crossings are removed with polygon clipping.
- Static ink layer: a blur followed by a discrete alpha threshold over the whole ornament group adds slight rounding and ink pooling at acute junctions, which is how intaglio lines merge. It is applied once and never animated.
- If any paper or noise texture is used, keep it very low amplitude (displacement scale ≤ 1–2 px) or pre-render it to an image. The geometry itself stays exact.
- Recompute outlines on debounced resize and cache them per breakpoint, instead of filtering live.

**Evidence read.** Read the Carmen Ansio article (filter recipes and performance notes), Andy Jakubowski's ink bleed tutorial, the GSAP forum thread on feTurbulence mobile performance, the W3C SVG WG 'Variable width stroke' proposal page, and the perfect-freehand README (via jsDelivr).

> **Verification note:** The article confirms ink gain (feMorphology dilate radius=2 on SourceAlpha, merged under SourceGraphic), thinning by erode (radius 1), and worn letterpress (feTurbulence fractalNoise, baseFrequency 0.035, numOctaves 3, into feDisplacementMap scale 6). On cost it gives qualitative guidance: 'Filters are not free', with turbulence, displacement and lighting the expensive ones. It does NOT contain the Andy Jakubowski ink-bleed recipe (blur + feComponentTransfer feFuncA discrete '0 1 1 1'), and I could not find any source for that attribution. Its 'ink bleed' demo uses feTurbulence. The article also does not cover variable-width lines in SVG, so those parts need other sources.

### 11. Illustrator-native guilloche construction (Envato Tuts+ 'Create a Security Seal in Illustrator Using Guilloche Patterns')

<https://design.tutsplus.com/tutorials/create-a-security-seal-in-illustrator-using-guilloche-patterns--vector-4828> · technique · confidence: high · verified

**What it is.** A step-by-step designer workflow that builds a security seal from guilloche-like structures using only stock Illustrator features.

**How it works.** Rosettes come from rotate-and-repeat: an oval with a 0.25 pt stroke is rotated 2° and copied repeatedly with Cmd+D to 360°. The 'oyster' pattern is made by blending a 36-point round-cornered star with a 50%-scaled copy using the Blend tool at 30 specified steps, then Expand Appearance. Radial lines are 36 lines at 10°, plus a copy rotated 5°. Wave fills are a stack of duplicated horizontal lines with Effect > Distort > Zig Zag, clipped into letterforms. Text runs on circular paths. The author says Excentro (Mac) is complete but costs about $500, and that online generators export only low-resolution JPGs.

**Why it matters here.** Shows the operations the designer already thinks in. Blend-between-two-key-shapes is interpolation between envelopes, and rotate-copy is phase stepping. The engine can expose its primitives in these terms so authoring stays realistic.

**Ideas to borrow:**

- Name the engine primitives after Illustrator idioms: Blend(keyA, keyB, steps, spacingFn) and Repeat(shape, count, rotate/scale step), so designers can predict the result.
- Allow designers to prototype a family in Illustrator with Blend, then export the two key paths plus the step count and spacing preset for the engine to regenerate at any size.
- Provide spacing presets that Illustrator's Blend cannot do (φ-geometric, Fibonacci, eased), which justifies the engine's existence.

**Evidence read.** Read the full Tuts+ tutorial (steps 1–10 and the comments on tools).

## Principles

- **Line weight is a continuous field, never a per-path constant. Engraved lines swell, thin and taper to zero because width = threshold(tone) along the line.**
  - Source: Ostromoukhov, Digital Facial Engraving (universal copperplate); Freudenberg et al. 2002 (1D ramp threshold); Jobard & Lefer taper formula
  - Apply: Every generated line carries widthFn(u) = basePitch × emphasis(u) × convergenceTaper(u), and the renderer emits a filled outline. Line ends come from the width reaching zero, not from stroke-linecap.
- **Lines in one family must be non-intersecting, approximately parallel and smooth. These three properties are what make machine line work pleasing.**
  - Source: Pnueli & Bruckstein, DigiDürer §3.2
  - Apply: Generate siblings only as offsets, propagated fronts or iso-parametric curves of a dominant curve, never drawn independently. Run a validator after generation, and trim lines at cusps or shocks with a taper.
- **'Logical spread' means one base curve plus a deterministic step and phase sequence.**
  - Source: Poirier SNAG article (rose engine phasing: constant, half-pitch barleycorn, linear pinwheel, zigzag lightning, Fibonacci sinewave)
  - Apply: LineFamily {base, count, stepFn, phaseFn, widthFn} with named presets including 'phi' (step_k = s0·φ^k) and 'fibonacci'. The designer picks a preset and the engine computes positions.
- **Designers draw a few guide curves and the engine computes everything relative to them.**
  - Source: Ostromoukhov (Coons-patch borders drawn in Illustrator); Arziro 'Path Definition' and Line/Object Generator; Jura Corvina 'Master' workflow
  - Apply: Import named Illustrator paths as roles (spine, envelope-inner/outer, patch edges, leaf-key). Only these are hand-drawn; hatching, ribbons, bands and leaf clusters are generated from them.
- **All guide curves must share a consistent parametrization, normally arc length (or angle for rosettes), before anything is placed on them.**
  - Source: Ostromoukhov (arc-length re-parametrization of border curves); Cameron guilloche slides (rectangle-envelope distortion bug and its fix)
  - Apply: Normalize every curve to an arc-length lookup table on import. Bands with two envelopes share the spine's parameter, and wave counts per closed loop or side are snapped to integers so corners and seams close.
- **Adding lines must not change perceived tone: equilibrate.**
  - Source: Ostromoukhov equilibration (accent layer thins neighbours); Winkenbach & Salesin tone formulas (vA/w, cross-hatch 2x − x²)
  - Apply: Track ink coverage per region. When cross-hatching or accent strokes are added, scale down the widths of the other layers so regional darkness stays at the design value.
- **Adapt to size by adding or removing whole lines by priority, not by scaling line widths.**
  - Source: Winkenbach & Salesin prioritized stroke textures and resolution-dependent rendering; Freudenberg stroke-map tiers
  - Apply: Keep physical line pitch and minimum width in CSS px roughly constant across viewports. When the frame grows, insert priority-2 lines at mid-phase; when it shrinks, drop them.
- **Mechanical precision means zero random waviness in the geometry; any irregularity is deliberate, deterministic and low-frequency.**
  - Source: Winkenbach & Salesin (waviness is a separate character function); Ostromoukhov (perturbation used deliberately for 'tension')
  - Apply: Default wavinessFn = 0. Keep print imperfection in a separate, optional, static ink layer, never inside the curve math, so golden-ratio constraints remain exact.
- **Avoid 'center mud': spacing and amplitude must respond to local scale and curvature.**
  - Source: Poirier (centre of a rose engine pattern goes muddy, so plain circles are cut there); Jobard & Lefer (stop lines at dtest); DigiDürer (front shocks)
  - Apply: Scale wave amplitude with local radius. Where computed spacing drops below the minimum pitch, end lines with a taper or switch to a plain curve, for example at the tight end of the golden spiral in the flame corner.
- **Bend ornaments along curves with angle-preserving (similarity or conformal) maps so motifs keep their proportions.**
  - Source: Ostromoukhov SPIE 2000 (conformal mappings of screen grids); logarithmic spiral listed among guilloche curve families in US8289579B2
  - Apply: Place leaves on a dominant curve with per-instance similarity transforms (translate, rotate to the tangent, uniform scale), not free warps. On a logarithmic or golden spiral, equal angular steps give exactly φ-scaled copies of the same leaf.
- **Keep geometry and print simulation in separate layers, and keep print simulation static.**
  - Source: Carmen Ansio and Jakubowski filter recipes; GSAP forum performance reports
  - Apply: Apply one static ink-gain filter (blur plus discrete alpha threshold, or a small dilate) to the ornament group, with a bounded filter region. Never animate turbulence or displacement over large areas.

## Cautions

- Ostromoukhov, DigiDürer and Freudenberg are raster threshold methods that output bitmaps or pixels. Getting the same look as SVG vectors means generating centreline-plus-width outlines directly (or contouring the threshold field with marching squares), and that has to be built.
- SVG has no variable-width stroke. The W3C stroke-profile proposal is a 2014 draft with no implementation, so every swelling line becomes a filled polygon. Thousands of such paths cost DOM, layout and memory. Use SVG for primary ornament lines and Canvas or WebGL (analytic line fields) for dense hatching or backgrounds, or pre-render static parts.
- feTurbulence/feDisplacementMap/lighting filters are CPU-heavy. Animated or large-area use has caused stutter and Safari tab reloads or crashes on iOS. Use them statically, in small bounded regions, or bake them into an image.
- Noise and displacement quickly read as 'grunge' or 'distressed', which is the opposite of crisp banknote engraving. The mechanically printed look comes from exact geometry, consistent pitch and tone-driven width, not from texture.
- Screen resolution is far below print. Engraving pitches and hairlines that work at 1000+ dpi alias or vanish at 1x DPR. Enforce a minimum width (about 0.5–0.75 CSS px) and minimum pitch, use smooth-threshold or analytic antialiasing, and test at DPR 1 and 2.
- Fine parallel line fields create moiré against the pixel grid and during resize or zoom. Security printing uses moiré on purpose, but on a website it is a bug. Avoid pitches near 1–3 device pixels and check while scaling.
- Offsets and propagated fronts of Bézier curves develop cusps and self-intersections on the concave side of tight curves (DigiDürer's 'topological problems'), and the offset of a Bézier is not itself a Bézier. The engine needs trimming, cusp detection and taper-out rules.
- Golden-ratio constraints can conflict with closure. Guilloche bands and rosettes need integer wave or lobe counts to close around a frame or loop. Decide which wins (snap φ-derived wave length to the nearest integer count, or let φ govern only open curves such as the flame spiral and leaf-tip spines).
- Professional banknote work is not fully procedural. The Lupo wolf was drawn freehand on a tablet, and Corvina Engraver keeps a 'Classic' freehand mode. Expect a hybrid where hand-drawn key strokes such as the acanthus leaf outline stay authored, and the engine only constrains and fills.
- Details of commercial tools (Arziro, Corvina, Excentro) come from vendor and marketing pages. Their algorithms are not documented publicly, so treat them as workflow evidence, not implementation references.
- Ostromoukhov's equilibration was calibrated to printer dot gain. Screens have no dot gain, so do not copy those thickening corrections. Calibrate perceived tone on screen instead.
- Streamline and flow-field fills seeded randomly look generative or organic, not engraved. Seed deterministically from the dominant curve and keep dsep as a designed function.
