# Computational ornament generation

> Research angle `ornament-generation` — part of the [frame engine research](README.md).

## Summary

The ornament-generation literature keeps arriving at the same architecture as the user's "dominant functions" idea. First a skeleton of controlling curves is laid down: Jones's parent stem, Day's "vertebrate" scroll spine, Wong et al.'s rhythmic controlling lines (which they call analogy), FLOWPAK's direction guides. Every secondary element is then attached in the local frame of a parent curve at a parameter t, meets it tangentially (Jones, Prop. 12), and is scaled and rotated by a rule instead of being placed freehand. Every system that regenerates for a new size or shape separates a cheap layout proxy (Wong's proxies, FLOWPAK's spine plus left/right width profile, the skeletal-stroke backbone) from the expensive final rendering. That separation is what makes "adapt to any page size" workable. Curves that read as natural have continuously varying curvature (Ruskin and Dresser; Xu and Mould's magnetic curves). The logarithmic spiral is the special case curvature = 1/(b·s), and the golden spiral is b = 2·ln(φ)/π ≈ 0.306. So if one leaf is copied by repeatedly applying a single spiral similarity about the scroll's pole, the leaf tips land on that golden spiral by construction, with no after-the-fact fitting (this is my derivation, not a source claim). Balance and even spacing are enforced by measuring empty space directly: largest empty circle on a medial-axis transform, evenly spaced streamlines with d_gap/d_stop, and iterative grow/shift refinement. Work also runs in hierarchical phases: frame, then scrolls, then leaves, then fillers. Interlace is a solved combinatorial problem: put a crossing at each edge midpoint of a graph (Mercat), alternate over/under along each strand, and choose crossing counts as the page resizes so the number of loops stays as designed (for a rectangular plait, loops = gcd of the edge bounce counts). The main warnings: purely local greedy growth looks jumbled (Wong's own failed willow pattern), physics-style curve generators are hard to steer, the good optimizers are slow (FLOWPAK takes about an hour for 50 elements) and must run offline, and I found no turnkey JS/TS ornament engine. The nearest architectural precedent is Adobe's Deco, whose models are JavaScript "scriptals" and which shipped inside Flash and Photoshop.

## Case studies

| # | Case study | Kind | Confidence | Verification |
|---|---|---|---|---|
| 1 | [Computer-Generated Floral Ornament (Wong, Zongker & Salesin, SIGGRAPH 1998) - 'adaptive clip art'](https://grail.cs.washington.edu/projects/ornament/ornament-lowres.pdf) | paper | high | verified |
| 2 | [FLOWPAK: Flow-based Ornamental Element Packing (Saputra, Kaplan, Asente, Měch, Graphics Interface 2017)](https://graphicsinterface.org/wp-content/uploads/gi2017-2.pdf) | paper | high | verified |
| 3 | [Magnetic Curves: Curvature-Controlled Aesthetic Curves Using Magnetic Fields (Xu & Mould, CAe 2009)](https://gigl.scs.carleton.ca/papers/artn-cae.pdf) | paper | high | verified |
| 4 | [The Deco Framework for Interactive Procedural Modeling (Měch & Miller, JCGT 2012) - shipped as Flash Pro CS4-CS6 Deco tools and in Photoshop CS6](http://jcgt.org/published/0001/01/04/paper.pdf) | tool | high | verified |
| 5 | [Skeletal Strokes (Hsu, Lee & Wiseman, UIST 1993) plus Asente's folding-avoidance and automatic corner-tile patents (Adobe)](https://static.aminer.org/pdf/PDF/000/593/480/drawing_and_animation_using_skeletal_strokes.pdf) | technique | high | verified |
| 6 | [Islamic Star Patterns from Polygons in Contact (Kaplan, GI 2005) and Taprats rendering styles (Kaplan, Bridges 2000 / VisMath)](https://cs.uwaterloo.ca/~csk/publications/Papers/kaplan_2005.pdf) | paper | high | verified |
| 7 | [Celtic knot / interlace construction: Mercat's medial-graph method, Gross & Tucker's Celtic framework, Wackrill's gcd rule, Kaplan & Cohen's rendering](https://blog.kleinproject.org/art-and-mathematics-knots-and-links/) | technique | medium | partly verified (see note) |
| 8 | [DecoBrush: Drawing Structured Decorative Patterns by Example (Lu, Barnes, Wan, Asente, Měch, Finkelstein, SIGGRAPH 2014)](https://gfx.cs.princeton.edu/pubs/Lu_2014_DDS/Lu_2014_DDS.pdf) | paper | high | verified |
| 9 | [Owen Jones, The Grammar of Ornament (1856): General Principles (37 propositions) and chapter analyses](https://archive.org/stream/grammarofornamen00joneuoft/grammarofornamen00joneuoft_djvu.txt) | book | high | verified |
| 10 | [Lewis F. Day (The Anatomy of Pattern 1887; Nature in Ornament 1892) and Christopher Dresser (Principles of Decorative Design 1873) on skeletons, growth lines, curves and proportion](https://archive.org/stream/cu31924031236114/cu31924031236114_djvu.txt) | book | medium | verified |
| 11 | [Designer-control research: Gieseke et al. 'Organized Order in Ornamentation' (CAe 2017) and 'A Survey of Control Mechanisms for Creative Pattern Generation' (CGF 2021); PATEX (Guerrero et al. 2016)](https://www.cs.purdue.edu/cgvlab/www/publications/Gieseke21CGF/) | paper | low | verified |

### 1. Computer-Generated Floral Ornament (Wong, Zongker & Salesin, SIGGRAPH 1998) - 'adaptive clip art'

<https://grail.cs.washington.edu/projects/ornament/ornament-lowres.pdf> · paper · confidence: high · verified

**What it is.** The founding paper on algorithmic floral ornament. An ornament is stored as 'adaptive clip art': a set of element types plus procedural growth rules, independent of any boundary. It can be regenerated to fill any panel shape and size, and the geometry is rendered afterwards in any style (they used skeletal strokes).

**How it works.** Data model: each element has a type, user fields and one or more PROXIES (circle, arc, cubic Bézier, line segment). Proxies are simple shapes used only for finding empty space and testing intersections. A separate render procedure draws the detailed final art. Rules are C++-like procedures (preprocessed from a rule file by Perl). Each takes a parent element, creates static or dynamic children positioned relative to the parent's geometry, may query the environment, and returns SUCCESS or FAILURE. Rules apply serially, not in parallel as in L-systems: each iteration picks one element and grows it. The authors rejected open L-systems because ornament joins parts in ways no plant would, and because they wanted direct control over appearance. Main loop: user-placed seed points go into an element tree. Proxies and the region boundary are rendered into a low-res buffer, and a Manhattan-metric medial axis transform (MAT) of the buffer supplies candidate circle centres. Circles are inflated until they hit something. Circles stopped by the boundary are discarded; circles stopped by an element are kept. The largest kept circle C is the goal. Elements near C are tried in order of distance, and their rules in rule-file order. On success the new elements are rendered and the MAT is updated incrementally. On failure, C's centre goes on an 'exclude list' until something nearby changes. C's centre and radius are exposed to rules, so growth aims at empty space and scales to it. Hierarchy comes from 'state' preconditions, so the program runs in phases: vines, then flowers and secondary vines, then leaves, then small gap fillers. Worked example: a flower rule places a child flower at most 10 units toward C. The stem runs centre to centre. If the stem is longer than 8 units, a leaf is added at the stem midpoint, perpendicular to it, built from two Bézier proxies whose tangents start at ±45° from the leaf axis. The 'bamboo spirals' pattern uses equal-angle (logarithmic) spirals. Each child spiral has the opposite orientation to its parent and is scaled to the empty circle, which gives scaled repetition and an apparent hierarchy. The pattern's period follows the changing width of the space, and it simplifies in narrow regions. Section 2 lists principles: repetition (translation, reflection, glide, off-centre radiation, analogy, recurrence of a ratio, scaled repetition), balance (equal visual mass, 'question and answer' between lines, uniform density from horror vacui, hierarchical balance), and conformation to constraints (fitting the meander period to the panel, deforming elements to fit, tangential junction, placement at signal points of max concavity/convexity, a dedicated element for every corner, growth following the region skeleton, recursive subdivide-then-fill). It also discusses 'intention': growth that visibly heads toward pre-placed flowers, and symmetric structures formed cooperatively.

**Why it matters here.** Closest direct precedent for 'secondary elements grow from and conform to primary curves, regenerated per page size'. The proxy/render split and the parent-relative child placement map one-to-one onto a TS engine. Its stated failures tell us exactly what the dominant-function idea must add: global structure decided before local growth.

**Ideas to borrow:**

- Element = {type, parent ref, attach param t, proxies[] for layout and collision, render() for the final engraved look}. Never let render geometry drive layout.
- Rules as plain TS functions (parent, goal, env) => Child[] | null, applied serially, with seeded randomness so a given page size always reproduces the same ornament.
- Phase gating ('state preconditions'): run rule sets in order, e.g. FRAME, then DOMINANT_SCROLLS, then LEAVES, then FILLERS, then HATCHING. A rule fails automatically outside its phase.
- Largest-empty-circle driver: rasterise proxies plus boundary into a low-res occupancy grid, compute a distance transform or MAT, take local maxima as candidate centres, keep circles adjacent to existing ornament, and hand the goal circle (centre, radius) to rules so children scale to the space. Add an exclude list to avoid infinite retries.
- Spiral rule: alternate handedness parent to child and scale each child spiral to the available empty circle. This gives hierarchical scaled repetition, which suits acanthus scroll clusters in the medallions.
- Leaf construction relative to the stem's local frame: base at stem parameter t, axis = stem tangent rotated by a departure angle, and outline Béziers whose start tangents are fixed offsets from that axis. The leaf is fully defined in parent coordinates.
- Fit periods to the boundary: choose an integer number of meander or scroll periods for the current side length, then stretch continuously, as with meanders fitted between panel edges.
- Debug overlay modelled on their Figure 8: draw proxies, candidate circles, the excluded circles and the chosen goal circle, so the designer can see why the engine grew something where it did.

**Designer workflow.** In their system the designer writes code-like rule files and picks seed points. That is too technical for a non-programmer, and the authors themselves call for 'an artist in the loop' and interactive high-level tools. Easy: reshaping or resizing the region regenerates automatically. Hard: getting elegant global composition. Their Morris willow attempt covered the space well but came out jumbled next to the original, because growth always proceeds from the nearest element.

**Evidence read.** Opened the PDF (grail.cs.washington.edu lowres copy) and read the extracted full text: Sections 1-6, the pseudocode, Appendix A rule examples (dot rule and flower-stem-leaf rule) and the figure captions.

### 2. FLOWPAK: Flow-based Ornamental Element Packing (Saputra, Kaplan, Asente, Měch, Graphics Interface 2017)

<https://graphicsinterface.org/wp-content/uploads/gi2017-2.pdf> · paper · confidence: high · verified

**What it is.** A system that fills container regions with a small library of designer-drawn ornamental elements. Each element is bent along a streamline of a vector field built from designer-drawn direction guides, then refined for even negative space.

**How it works.** Input is a single colour-coded vector diagram: black closed curves are containers, red curves with arrows are direction guides, green shapes are fixed elements copied verbatim. Each element in the library is annotated with a straight 'spine'. Elements are 'full' (on both sides of the spine) or 'half' (on one side). Shape descriptor ('LR function'): sample the spine at n=100 points and record how far the art extends left and right, normalised to [0,1]. Swapping L and R is a reflection across the spine; reversing them is a reflection along it. Pipeline: (1) build a vector field from guide tangents with N-RoSy field design (Palacios and Zhang); (2) trace evenly spaced streamlines with an adapted Jobard-Lefer algorithm, using parameters d_gap (spacing), s_min/s_max (length), d_stop = 0.8·d_gap, seeds on boundary and guides first, and new seeds d_gap to either side of each accepted streamline; (3) build a generalised Voronoi 'blob' around each streamline; (4) for each blob choose the element and one of four reflections minimising the least-squares LR difference, then map the element onto the streamline as a skeletal stroke and scale its width to fill the blob; (5) iterative refinement, 15 iterations, smallest elements first: shift streamline endpoints toward the midpoint of free space, re-route with Dijkstra on a field-aligned graph, refit Béziers (Schneider), grow blobs into empty space, allow ±10° rotation, accept a change only if the new area is at least 0.9× the old. Step limits are 0.005×design size. Half elements end up along boundary-following guides and so reinforce the outline. Extensions: designer-drawn 'fixed spines' force elements at chosen places; negative-space offset shapes can be synthesised. Implemented in C++ with Clipper, outputting SVG. Refining 50 elements takes about an hour.

**Why it matters here.** Shows how a dominant field (from a few designer curves) can orient, bend and space many secondary elements. Also gives a concrete recipe for 'clustered lines with a logical spread' via evenly spaced streamlines.

**Ideas to borrow:**

- A colour- or layer-coded Illustrator convention as the engine's input format (boundary, guide, fixed element, fixed spine). The designer keeps drawing in Illustrator and semantics come from layer names or stroke colours.
- Every library element gets a spine (and optional anchor regions). The engine only ever bends art along spines, which works for leaves, tendrils and ribbons alike.
- An LR-profile descriptor (100 left/right half-width samples along the spine) to pick the best leaf variant and reflection for a slot between dominant curves.
- Jobard-Lefer evenly spaced streamline tracing with d_gap and d_stop = 0.8·d_gap for clustered parallel engraved lines. Make d_gap a function of position (e.g. a geometric progression away from the dominant curve) to get a 'logical spread' rather than uniform spacing.
- Guides drawn on the boundary produce half elements that hug the frame, a natural rule for border leaves.
- A bounded, gradual refinement loop (small step limit, area-tolerance acceptance, smallest-first ordering) to even out negative space after initial placement.

**Designer workflow.** Designers draw containers, guides and elements in a vector editor and run a batch program. The paper reports an artist was pleased with the bird result, and that the artist asked for different element types and densities per region. Easy: drawing guides and elements. Hard: no interactivity (refinement is slow), and tight U-turns in streamlines fold elements, so they are avoided.

**Evidence read.** Opened the GI 2017 PDF and read the extracted full text (Sections 1-6, Algorithms 1-2, parameter values, limitations).

### 3. Magnetic Curves: Curvature-Controlled Aesthetic Curves Using Magnetic Fields (Xu & Mould, CAe 2009)

<https://gigl.scs.carleton.ca/papers/artn-cae.pdf> · paper · confidence: high · verified

**What it is.** A particle-tracing method that draws curves with continuously varying curvature by simulating a charged particle in a planar magnetic field and varying its charge over time. Used for ornamental scroll fields, a Klimt-like tree, hair, window-frame ornament and stylised flames.

**How it works.** The Lorentz force F = q·v×B with B along z keeps motion in the plane, integrated by forward Euler. At constant speed the turning radius is inversely proportional to q·B, so the charge sets the curvature. The main charge profile is q(t) = (T − t)^−α: T sets curve length and α sets how quickly the curl tightens (examples use T from 50 to 650 and α from 0.65 to 0.8). Flipping the sign of q reverses turning, giving an inflection (S-curve) without the visible kink that an arbitrary jump in charge causes. A square-wave charge gives piecewise circular arcs, which the authors found less interesting. Branching: spawn child particles at equal intervals along a parent path, with charge signs chosen so branches curl to either side. Space filling: an occupancy grid stores particle IDs (a child may enter its parent's cells). On a collision the particle restarts with the next smaller (T, α) pair from a descending list, and the position is abandoned if even the smallest fails. Symmetric window frames are built as one half and mirrored. Flames: reverse the charge at T/2, then respawn a new particle whenever the x-velocity reaches 0; those points become the flame tips. A Perlin-noise B field adds irregularity. Stated limitation: the exact course of a curve is hard to control, and it took about two minutes of parameter search per curve to fit the window frames.

**Why it matters here.** Gives the curvature-first way to define both dominant and secondary curves, and a ready-made model for the user's flame corner (flame tips as events on a curvature program). My derivation, not the paper's: with α = 1 the curvature is proportional to 1/(remaining arc length), which is exactly a logarithmic spiral. Choosing the constant so the growth rate is b = 2·ln(φ)/π ≈ 0.306 makes it a true golden spiral. The golden spiral is therefore one point in this curve family.

**Ideas to borrow:**

- Define scroll curves by a curvature-versus-arc-length program κ(s) (a Cesàro or 'natural' equation) and integrate it. Then 'golden' is a parameter: κ(s) = 1/(b·(L − s)) with b = 2·ln(φ)/π gives a golden log spiral ending at the pole; other exponents give the softer magnetic or log-aesthetic family.
- Inflections by sign flip of curvature, not by joining two arcs: an S-scroll is one curvature program with a zero crossing, so curvature stays continuous.
- Branching: children spawn at evenly spaced arc lengths on the parent (or at φ-scaled spacing), start with the parent's tangent (a tangential junction for free), and get opposite curl sign.
- Fallback ladder: on collision, retry the same child with the next smaller (length, tightness) preset before giving up. This is a simple, deterministic way to keep scale hierarchy.
- Flame corner recipe: a primary curvature program with a reversal, and flame or leaf tips defined as events (e.g. tangent becoming horizontal) rather than hand-placed points.
- Mirror-half construction for bilateral symmetry (build one side, reflect).

**Designer workflow.** The authors themselves say designers lack intuition for charges and fields. Forward simulation is easy to run and hard to aim. For this project, the curvature program should be fitted to a curve the designer draws in Illustrator (an inverse problem), or the method should be confined to secondary curls whose endpoints don't matter.

**Evidence read.** Opened the Carleton-hosted PDF and read the extracted full text (Sections 1-6, equations, parameter ranges, discussion of limitations). The log-spiral/golden equivalence is my own derivation from the curvature formula, not stated in the paper.

### 4. The Deco Framework for Interactive Procedural Modeling (Měch & Miller, JCGT 2012) - shipped as Flash Pro CS4-CS6 Deco tools and in Photoshop CS6

<http://jcgt.org/published/0001/01/04/paper.pdf> · tool · confidence: high · verified

**What it is.** Adobe's production procedural-ornament engine behind Flash's Deco tools (Vine Fill, Grid Fill, Symmetry Brush, flower/tree/lightning brushes) and Photoshop CS6. Models are written as JavaScript objects in text files called 'scriptals'.

**How it works.** A scriptal defines module objects (parts of the structure) with methods produce(engine), environment<Name>(engine, env) and render(). The engine keeps a module list and repeatedly runs produce, environment and render passes. Environments are dynamically loaded C++ libraries exposed to JS, e.g. Collision: a module renders its geometry into the environment, and if it collides it is removed. Topology is a global graph of labelled, ordered connections between modules (more general than L-system bracket strings) with add/get/replace/move and optional delayed updates. Symmetry is a module holding a list of transform matrices (line, point, rotational, even wallpaper tilings, computing only the subset needed for the window). Child modules are automatically added to their parent's symmetry set. On collision the module is removed from all symmetric instances at once, so the symmetry is never visibly broken. Frame2/Frame3 are local frames (3×3 or 4×4 matrices) with advance/rotate operations, so children are specified in the parent's frame. RenderAPI has Circle, Line, Arc, Bezier(frame1, frame2) and similar, plus generalised cylinders: a Bézier axis between two frames, a cross-section contour, and profile curves that vary width along the axis. Parameter menus are auto-generated from variables whose single-letter prefix declares the type; changing a value calls variableUpdated. Incremental rendering re-emits geometry only for modules that changed.

**Why it matters here.** The strongest evidence that a JavaScript-scripted ornament engine with local growth rules, parent-relative frames, symmetry groups and collision environments is practical and usable by artists. Its object model transfers almost directly to TypeScript.

**Ideas to borrow:**

- Module interface in TS: produce(ctx) / query(env) / render(out), with an engine loop of passes and a 'don't call again' flag so settled modules stop costing time.
- Labelled topology graph (parent-of, attached-to, crosses, mirror-of) as the single source of truth for 'everything is relative to a dominant function'.
- Symmetry as a first-class node: a list of transforms applied at render time. Collision or rejection removes the whole symmetric orbit, keeping balance exact.
- Local Frame2 objects (position plus tangent/normal) as the only way children are placed: child = parentFrame.at(t).advance(d).rotate(θ).
- Width-profile sweeps (generalised-cylinder style): a ribbon or stem is an axis curve plus a profile function, giving the swelling and tapering line of engraving.
- Typed-prefix parameter declarations that auto-build a slider panel for the designer, plus a callback when a value changes.

**Designer workflow.** Most Flash users used the tools as shipped with sliders. Some downloaded new scriptals, and a few authored them. A three-tier model (use / tweak / author) is realistic: the user would author a handful of rules once with help, then mostly tweak.

**Evidence read.** Opened the JCGT PDF and read the extracted text: introduction, framework sections 4-6 (scriptals, Topology, Symmetry, environments, rendering, menus), the listing examples and the appendix on Frame/RenderAPI/generalised cylinders.

### 5. Skeletal Strokes (Hsu, Lee & Wiseman, UIST 1993) plus Asente's folding-avoidance and automatic corner-tile patents (Adobe)

<https://static.aminer.org/pdf/PDF/000/593/480/drawing_and_animation_using_skeletal_strokes.pdf> · technique · confidence: high · verified

**What it is.** The deformation model behind 'art along a path' (the ancestor of Illustrator's Art and Pattern brushes). Arbitrary vector art (the 'flesh') is defined around a straight reference backbone and bent, stretched and sheared onto any path. Asente's patents fix folding at tight curves and generate corner tiles from side tiles.

**How it works.** Definition: the flesh is drawn around a reference backbone (the x-axis) and a reference thickness (the lateral scale). Application: the backbone is aligned to the path and each point is mapped by its arc-length position and its lateral offset along a perpendicular 'rib'. Two modes: 'sausage', where the shear angle is constant in global coordinates, and 'ribbon', where the shear is relative to the path tangent, which looks like a flat-nib pen. Anchoring: selected features are attached to an anchor origin and drawn in a local frame scaled only by stroke width, so they keep their aspect ratio while the rest of the flesh stretches. Higher-order and recursive strokes (strokes built from strokes) allow hierarchical pictures. Folding avoidance (US 8,674,995): where curvature radius is smaller than half the stroke width, adjacent ribs cross. The method connects rib endpoints into an envelope, finds the retrograde region where the envelope doubles back, and moves the inner ends of crossing ribs to the envelope's self-intersection, extending them straight through their path point. Ribs no longer need to be perpendicular or equal length. Corner tiles (US 8,941,661): build a corner tile from the side tile by diagonal slicing, by rib-based mapping with folding avoidance (ribs shortened inside the turn, lengthened outside), or by two half-tiles meeting at the corner. Candidates are previewed so the user can choose.

**Why it matters here.** This is how leaves, beads, lattice and zigzag bands, and the two weaving ribbons can be drawn once in Illustrator and then follow any dominant curve at any page size. Anchoring is the mechanism that lets a leaf keep its exact (e.g. golden) proportions while the stem between leaves stretches.

**Ideas to borrow:**

- Element definition format: SVG group plus a backbone line plus a thickness reference, both drawn in Illustrator on a named sublayer.
- Anchored sub-parts (leaf blades, bead centres, medallion jewels) that never stretch non-uniformly, and stretchable connective parts (stems, band runs) that absorb length changes.
- 'Ribbon' shear mode, where the cross-section follows the tangent, for engraved, pen-cut looking ribbons. 'Sausage' mode for parts that must stay upright.
- Rib-envelope folding avoidance whenever a band or leaf passes a tight turn of a dominant curve (corner flourishes).
- Generate frame corner tiles from side tiles automatically (sliced, rib-mapped, or two half-tiles), but always let the designer pick or override with a hand-drawn corner, as the corner deserves a dedicated element anyway.
- Recursive strokes: a band whose flesh itself contains strokes, e.g. a ribbon carrying a bead row that follows the ribbon's own centreline.

**Designer workflow.** This is the most designer-friendly mechanism found, because it is already how Illustrator Art and Pattern brushes work, so the user knows the mental model. Hard parts: tight curvature folds the art, and corners need special tiles; both have known fixes above.

**Evidence read.** Opened the aminer-hosted PDF and read the extracted text of 'Skeletal Strokes' (definition, sausage/ribbon styles, anchoring). Opened Google Patents pages for US8674995 (folding avoidance) and US8941661 (automatic corner generation) and read the summaries of their technical content.

### 6. Islamic Star Patterns from Polygons in Contact (Kaplan, GI 2005) and Taprats rendering styles (Kaplan, Bridges 2000 / VisMath)

<https://cs.uwaterloo.ca/~csk/publications/Papers/kaplan_2005.pdf> · paper · confidence: high · verified

**What it is.** An algorithmic reconstruction of Hankin's method. Given any polygon tiling, rays leave each edge midpoint at a 'contact angle' and grow until they meet, producing Islamic star patterns. Includes 'Islamic parquet deformations' where the contact angle varies smoothly across space, and Taprats-style rendering (outline, emboss, interlace, checkerboard).

**How it works.** Each tile edge midpoint is a contact point emitting two rays at contact angle θ to the edge (an X). Per tile shape, a motif is inferred by pairing the 2n incoming rays. All pairings would be factorially expensive, so the pairing is greedy: compute candidate pair costs (lengths to the intersection, or the direct length for collinear opposing rays), sort, and accept pairs whose rays are unused, minimising total line length ('economy and inevitability'). Options: a second inference pass inside large regular polygons to fill empty centres; split contact points by a distance δ ('two-point patterns'); move contact positions to where the rosette-transformed tiling crosses the original, to make rosettes even. Parquet deformation: θ is a function of a ray's x-position (e.g. 22.5° to 67.5° and back), which gives a smoothly evolving design that is still recognisably Islamic. A tiling is stored as two translation vectors plus prototiles with their transforms. Rendering styles (VisMath version): plain, outline (thickened edges), emboss (raised centreline lit by a chosen light direction), interlace (crossing segments show over/under), checkerboard (two-colour the faces by walking the graph), and layered. When every vertex has degree 2 or 4, over/under can strictly alternate along each strand.

**Why it matters here.** A clean precedent for one global field parameter driving a whole family of shapes coherently, here the contact angle over the plane. That is the same idea as letting leaf angle, hatch spacing or band density be functions of position along a dominant curve. It also shows the lattice-band math and the conditions under which interlace alternation is guaranteed.

**Ideas to borrow:**

- Parameter fields: any construction parameter (leaf departure angle, leaf length ratio, hatch spacing, band crossing angle) may be a smooth function of arc length along a dominant curve, giving 'spatial animation' instead of mechanical repetition.
- For lattice bands: tiling plus contact angle (Hankin). Changing band width or page size only re-tiles; the motif logic stays the same.
- A greedy minimum-total-length pairing as the default way to connect loose ends into continuous strands.
- An emboss/engrave shading parameter from a single global light direction, so all bands shade consistently like one engraved plate.
- Check the degree-2/4 condition before enabling interlace rendering, and use a graph walk to assign alternating over/under or two-colourings.

**Designer workflow.** In Kaplan's Java designer the user picks a tiling and drags the contact angle and δ with immediate feedback, which is very approachable. Parquet deformations were batch-only at the time because of cost. Authoring new tilings needed a separate tool.

**Evidence read.** Opened kaplan_2005.pdf and read the full extracted text. Opened the VisMath HTML version of the Bridges 2000 paper (node4 'Rendering') for the rendering styles. The Starpatterns project page notes Taprats is no longer developed and points to Baillargeon's 'Alhambra' (not opened).

### 7. Celtic knot / interlace construction: Mercat's medial-graph method, Gross & Tucker's Celtic framework, Wackrill's gcd rule, Kaplan & Cohen's rendering

<https://blog.kleinproject.org/art-and-mathematics-knots-and-links/> · technique · confidence: medium · partly verified (see note)

**What it is.** The standard algorithmic route from any planar graph or grid to a Celtic interlace with guaranteed alternating over/under, plus 'breaks' (barriers) that change the knot's structure.

**How it works.** Mercat (Artigue and Mercat, Klein Project article): (1) start from a planar graph; (2) put a crossing at the midpoint of every edge, inclined about 30-60° to the edge; (3) link strand ends by following 'walls' (the edges, which cannot be crossed) through 'doors' (the crossings); (4) decide over/under. Gross and Tucker (Discrete and Computational Geometry 2010) give a closed-form grid rule: on a 2m×2n grid, put a construction dot at every lattice point with x+y odd; at each dot the overcrossing runs SW-NE if x is odd and NW-SE if x is even. Join segment ends diagonally or along the border. 'Installing a barrier' replaces a crossing with a horizontal or vertical bounce; the result is still alternating, and every alternating link can be built this way. Mirroring swaps all over/unders. Wackrill (Bridges 2006): in a rectangular plait the number of closed loops equals the gcd of the bounce counts along the long and short edges. Removing a crossing (a break) either merges two loops or may split one, which her paper shows how to predict. Kaplan and Cohen (EGSR 2003): from secondary descriptions only, threads are circular linked lists with alternating z-offsets for over/under, smoothed with cubic Hermite (vs B-spline) curves, with breakpoints to vary connections. knotR (an R package): stores path geometry separately from over/under data, keeps crossings far from Bézier nodes, and aims for near-right-angle crossings.

**Why it matters here.** The user's two medallion ribbons that weave down the sides of the page are a 2-strand plait or braid along a dominant side curve. These sources say how to place crossings, guarantee alternation, and keep the topology (one continuous ribbon versus separate loops) stable as the page height changes.

**Ideas to borrow:**

- Model each weaving band as a graph laid on the dominant curve (rungs at chosen parameters t_k). Crossings sit at edge midpoints; strands are traced by the wall/door rule.
- Over/under = parity of crossing index along each strand (Gross-Tucker style closed form). Never store it per crossing by hand, so resizing cannot break alternation.
- When the page height changes, choose crossing counts as integers so the gcd rule keeps the intended number of loops (e.g. gcd = 1 for one continuous ribbon). Then stretch spacing continuously between integer changes.
- Breaks/barriers as explicit designer markers (e.g. at the corner medallion where the ribbon is anchored), with the engine recomputing loop structure and warning if the strand count changes.
- Render each strand as a width-profile band. Draw the under-strand with a cut gap, or draw the over-strand with a background-coloured halo, at each crossing. Keep crossings away from curve control nodes and near 90°.
- Store band geometry and over/under as separate layers of data, as knotR does.

**Designer workflow.** Bain and Mercat style construction is famously teachable by hand, and the grid-plus-barriers model maps onto a simple editor: drag rung counts, click to toggle a break. The hard parts are anticipating how a break changes the number of strands, and smoothing curves so bands look engraved rather than polyline.

**Evidence read.** Opened and read: the Klein Project article on Mercat's method; the full extracted text of Gross and Tucker's 'A Celtic Framework for Knots and Links' (Columbia PDF); the Bridges 2006 Wackrill abstract page. Could not open Kaplan and Cohen's PDF (expired certificate on matt-kaplan.com; diglib returned 403), so those details come from search-result descriptions of secondary sources. Cromwell's 1993 Math Intelligencer article and Andy Sloss's method were not opened. knotR details come from search-result excerpts of its CRAN documentation.

> **Verification note:** The Klein Project article by Mercat and Artigue supports the steps. It says to draw a cross at each edge midpoint, inclined 30-60 deg to the edge, then follow walls (edges) through doors (crossings) and decide over/under. Gross and Tucker exist, 'A Celtic Framework for Knots and Links', DCG 46:86-99, published 2011 (online 2010). The paper supports the 2m x 2n grid with construction dots at points where x+y is odd, and the barriers. Kaplan and Cohen, 'Computer Generated Celtic Design', EGWR 2003, exists. 'Wackrill' could not be found in any source. The gcd rule itself is real (strands in a p x q panel = gcd(p,q)) but is documented by Fisher and Mellor, 'On the Topology of Celtic Knot Designs', Bridges 2004, and by entrelacs.net. The 'Wackrill' attribution looks wrong or unverifiable.

### 8. DecoBrush: Drawing Structured Decorative Patterns by Example (Lu, Barnes, Wan, Asente, Měch, Finkelstein, SIGGRAPH 2014)

<https://gfx.cs.princeton.edu/pubs/Lu_2014_DDS/Lu_2014_DDS.pdf> · paper · confidence: high · verified

**What it is.** An example-based 'decorative brush': the designer supplies a library of 8-12 exemplar flourish strokes in one consistent style and sketches a path, and the system synthesises a new flourish in that style following the path.

**How it works.** Offline: exemplars are rasterised (optionally as a signed distance field). For each, the user marks the start and end of the main branch; a smooth spine is found by Dijkstra on the pixel grid following edge-tangent flow, then a quartic fit, and the stroke gets a uv parameterisation (30-100 samples of spine, left and right outline). Runtime: (1) piecewise matching of the query path to exemplar segments by dynamic programming over features (turning angle, width, distance to ends), heavily penalising stroke ends matched to exemplar middles, since curls at stroke ends carry the style; (2) as-rigid-as-possible deformation of the matched segments onto the query spine; (3) graph-cut seams where segments overlap; (4) hierarchical patch-based texture synthesis to repair distortion and add structural variation; (5) vectorise (they used Illustrator).

**Why it matters here.** A 'by example' alternative to rule writing, aimed at designers. The style lives in the drawn library, and the dominant curve is the sketched path. Its pipeline is raster-based, though, which conflicts with crisp, mathematically exact engraved lines.

**Ideas to borrow:**

- A style library of 8-12 consistent exemplar strokes drawn by the designer, each with an explicit spine and treated ends.
- Dynamic-programming segment assignment along a dominant curve: choose which pre-drawn flourish segments cover which stretch, with costs that protect terminal curls from being cut.
- ARAP rather than plain bending when mapping exemplar segments, to keep leaf and curl shapes from shearing.
- Treat stroke terminals (curls, buds) as protected style features, consistent with skeletal-stroke anchoring.

**Designer workflow.** Very approachable: choose a library and draw a path, with refinement by brush/eraser strokes. Downsides for this project: raster synthesis, then vectorisation, means outlines are approximations, not the exact φ-governed geometry the user wants.

**Evidence read.** Opened the Princeton PDF and read the extracted introduction, related work, exemplar processing and synthesis sections (4-5).

### 9. Owen Jones, The Grammar of Ornament (1856): General Principles (37 propositions) and chapter analyses

<https://archive.org/stream/grammarofornamen00joneuoft/grammarofornamen00joneuoft_djvu.txt> · book · confidence: high · verified

**What it is.** The Victorian rulebook of ornament. The propositions at the front state the structural laws the user is reaching for, and the chapter texts restate them as principles observed in Greek, Moresque, Chinese and other ornament.

**How it works.** Relevant propositions (wording from readingdesign.org transcription): 6, beauty of form comes from lines growing out of one another in gradual undulations, with no excrescences; 7, general forms first, then subdivision by general lines, then filling the interstices, which may again be subdivided 'for closer inspection'; 8, all ornament should be based on a geometrical construction; 9, every assemblage should be arranged on definite proportions, 'those proportions will be the most beautiful which it will be most difficult for the eye to detect', e.g. 5:8 better than 4:8, 3:7 than 3:6; 10, harmony of form is the proper balancing and contrast of the straight, the inclined and the curved; 11, all lines should flow out of a parent stem, every ornament traceable to its branch and root; 12, all junctions of curved with curved or curved with straight should be tangential; 13, use conventionalised, not literal, natural forms. Greek chapter (Ch. IV) names the trio: radiation from the parent stem, proportionate distribution of the areas, and tangential curvature of the lines. It also notes that in Byzantine, Arabian/Moresque and Early English styles the flowers flow off on either side from a continuous line. Moresque chapter: ornament flows off from a parent stem; division and subdivision of general lines; lines in equilibrium of straight, inclined and curved; Alhambra patterns arise from intersections of equidistant lines round fixed centres. Chinese chapter: floral patterns obey radiation from the parent stem and tangential curvature.

**Why it matters here.** Supplies the 'grammar' the engine should enforce as hard constraints and lint rules: hierarchy (parent stem), tangency, top-down subdivision, geometric basis, and subtle proportion. Prop. 9's 5:8 is a Fibonacci approximation of φ.

**Ideas to borrow:**

- Hard constraint: every element has a path of parent links back to a root dominant curve (Prop. 11). The engine refuses orphan geometry.
- Hard constraint: every junction is tangential (Prop. 12). Children start with the parent's tangent; ideally match curvature too.
- Pipeline order mirrors Prop. 7: general forms (page frame, dominant curves), then general lines (scroll spines), then interstices (leaves, fillers), then fine enrichment (hatching) that only appears at close inspection or high zoom.
- Proportion system from Prop. 9: one recurring ratio set (φ and its Fibonacci approximants 5:8, 8:13), applied to panel areas and element lengths, never 1:2 halves.
- 'Radiation from the parent stem': leaves on a scroll emanate from it in a regular angular or arc-length progression rather than being scattered.
- Balance check from Prop. 10: track proportions of straight (frame rules), inclined (lattice, zigzag) and curved (scrolls) line length per region.

**Designer workflow.** These are rules a designer already intuits. Encoding them as automatic checks with visual flags (non-tangent junction, orphan element, constant-curvature run, ratio off target) lets the user draw freely while the engine enforces the grammar.

**Evidence read.** Opened readingdesign.org's transcription of propositions 1-14. Opened the archive.org djvu full text of the 1868 edition and read summaries of the General Principles, Ch. IV Greek, the end of the Moresque chapter and the Chinese chapter (characters 0-100k and 200k-300k).

### 10. Lewis F. Day (The Anatomy of Pattern 1887; Nature in Ornament 1892) and Christopher Dresser (Principles of Decorative Design 1873) on skeletons, growth lines, curves and proportion

<https://archive.org/stream/cu31924031236114/cu31924031236114_djvu.txt> · book · confidence: medium · verified

**What it is.** Victorian design-teaching texts that describe ornament as foliage clothing a structural skeleton, and that rank curves and proportions.

**How it works.** Day, Anatomy of Pattern: ornament is built on lines inevitable to its consistency, which serve as 'the skeleton or framework upon which you build up your pattern'. Hiding the scaffolding does not remove the construction. 'Pattern is a vertebrate thing; in a scroll the spinal cord is very decidedly pronounced'. The best way to disguise the skeleton is to clothe it, as nature does. 'The spiral itself is only a series of segments of circles' (compass practice). 'You cannot draw a bold, flowing scroll without considerable allowance in the way of length'. Designs must be shaped to a rectangular plan of fixed dimensions. Day, Nature in Ornament (https://archive.org/stream/cu31924031243763/cu31924031243763_djvu.txt): a stem has no business to grow two ways at once; 'a formal arrangement of lines involves an equally formal kind of foliation'; medieval leaves were designed into set spaces (square, diamond, circle, vesica). Day also values the natural line over the mechanical, and warns that distributing detail according to a diagram is not designing. He notes that the thickening of the leaf-stalk where it joins the stem is rarely used. Dresser (https://www.gutenberg.org/cache/epub/39749/pg39749.txt): the arc is the least beautiful curve, the ellipse (two centres) is better, the egg curve (three centres) better still. As the number of centres needed grows, the curve's origin becomes harder to detect. Proportion must be subtle; a surface should never be divided into halves; 3:8, 5:8 and 5:13 are good (Fibonacci approximants of φ and φ²; he does not name the golden section in the portion read).

**Why it matters here.** Direct historical justification for the user's architecture: dominant 'vertebrate' curves with relative foliage. Also for curvature-varying curves and φ-like proportions. Day's warnings define the 'mechanical' failure mode to avoid.

**Ideas to borrow:**

- Name the engine's core object a Skeleton/Spine. Foliage is always 'clothing' attached to it, and the skeleton can be shown or hidden as a debug layer.
- Consistency rule (Day): the formality of the foliage follows the formality of its dominant curve. Golden-spiral scrolls get strictly self-similar leaves, while freer curves allow more variation.
- No two-way growth: each scroll has a growth direction (base to tip), and leaf scale and orientation are monotone along it.
- Curvature quality metric (Dresser/Ruskin): penalise long constant-curvature runs. If spirals are built from compass arcs (Day), make that an explicit, chosen style and keep radii in φ progression.
- Length budget (Day): a scroll period needs a minimum length, so at small page sizes reduce the number of scroll periods rather than compressing them.
- Leaf-stalk swell at the junction with the stem, as a width-profile detail that strengthens the tangential junction visually.

**Designer workflow.** These books were written to teach designers to plan the skeleton first, then clothe it. That is the workflow the engine should impose: the designer draws or chooses dominant curves, then assigns foliage libraries to them.

**Evidence read.** Opened archive.org djvu full text of The Anatomy of Pattern (1887; summary of chapters I-VI) and Nature in Ornament (1892; characters 0-200k summarised), and the Project Gutenberg text of Dresser's Principles of Decorative Design (first 100k characters, Chapter I). Quotes are from these public-domain texts as returned by the fetch tool.

### 11. Designer-control research: Gieseke et al. 'Organized Order in Ornamentation' (CAe 2017) and 'A Survey of Control Mechanisms for Creative Pattern Generation' (CGF 2021); PATEX (Guerrero et al. 2016)

<https://www.cs.purdue.edu/cgvlab/www/publications/Gieseke21CGF/> · paper · confidence: low · verified

**What it is.** Work on how artists can steer ornament and pattern generators. A 2017 system of combinable placement functions, a 2021 survey classifying control mechanisms, and PATEX, which proposes alternative regularity interpretations as edit suggestions.

**How it works.** From abstracts only. Gieseke 2017 fills space automatically with modular, combinable element placement functions under global constraints (balanced distribution, symmetry). Drawn strokes define connections and hierarchy, user-drawn guides define vector fields that ornament follows as streamlines, path planning routes ornament around obstacles and aligns it to their borders, and individual accent elements are placed by hand. The 2021 survey organises techniques by design feature (repetition, frames, curves, directionality, visual accents) and by input mode (exemplars, parameterisation, handling, filling, guiding, placing). PATEX detects multiple valid readings of a pattern's regularity (symmetry, spacing, alignment) and offers them as suggested edits, using a linear approximation to keep the search tractable.

**Why it matters here.** Supports a mixed-initiative design: the engine fills and balances, the designer guides and places accents, and relationships are preserved during edits.

**Ideas to borrow:**

- Separate 'guiding' inputs (dominant curves, fields) from 'placing' inputs (accent elements like the crest, jewel pendant and cartouche) and from 'filling' (automatic leaves and fillers).
- Placement functions as composable TS functions (e.g. along(curve, spacing) ∘ mirror(axis) ∘ scaleBy(φ)), so a layout is a readable expression rather than a hand-placed list.
- When the designer moves one element, offer relationship-preserving variants (keep the mirror, keep φ spacing) instead of silently breaking constraints.

**Designer workflow.** Explicitly artist-centred. Key lesson: give high-level guiding and filling controls and low-level accent placement, not parameter soup.

**Evidence read.** Did not open the full papers: the Purdue survey PDF exceeded the fetch size limit and the EG digital library returned 403 or refused the connection. The 2017 and 2021 details come from abstracts in search results, plus the Purdue publication page (bibliographic data only). Opened the PATEX project page (abstract).

## Principles

- **Parent stem: every element descends from a dominant curve; no orphan geometry.**
  - Source: Owen Jones Prop. 11 and Greek/Moresque chapters; Wong et al. element tree; Deco Topology graph
  - Apply: Represent the scene as a graph: root dominant curves (page frame curves, side ribbon spines, medallion scroll spines), then children attached by (parentId, t, side, departureAngle, scale). Rendering walks the graph; an element without a parent path is a build error.
- **Tangential junction: children leave parents along the parent's tangent, ideally with matched curvature.**
  - Source: Owen Jones Prop. 12; Wong et al. Sec. 2.1.3; Xu & Mould branching (children spawned on the parent path)
  - Apply: Construct each child curve starting from the parent's local frame at t, with initial heading = parent tangent plus a departure angle that is eased in, so curvature starts near the parent's. Lint: flag any junction whose tangent angle error exceeds about 1°.
- **Continuously varying curvature; avoid circular-arc runs.**
  - Source: Ruskin as quoted by Xu & Mould; Dresser on curves with more centres; Xu & Mould magnetic curves
  - Apply: Define scroll and leaf curves by curvature programs κ(s): log spiral κ = 1/(b(L−s)), golden when b = 2·ln(φ)/π ≈ 0.306; magnetic or log-aesthetic exponents for softer curls. Fit these to designer-drawn Illustrator paths, then output Béziers. Lint long near-constant-curvature runs.
- **Scaled repetition by a single similarity: self-similar leaves put their tips on a golden spiral automatically.**
  - Source: Wong et al. scaled repetition and equal-angle spiral pattern; Jones 'radiation from the parent stem'; derivation in this report
  - Apply: For the flame corner and acanthus scrolls, draw ONE leaf. Generate the rest by repeatedly applying a spiral similarity about the scroll's pole (rotate Δθ, scale φ^(−Δθ/(π/2))). Tip points then lie exactly on a golden log spiral, and each leaf's curl is a scaled copy of the golden master curl. The engine can draw that spiral as a check overlay.
- **Top-down hierarchy: general forms, then general lines, then interstices, then enrichment.**
  - Source: Jones Prop. 7; Wong et al. phase gating and hierarchical subdivision; Day's skeleton first, then clothing
  - Apply: Fixed engine phases with per-phase rule sets: FRAME, then DOMINANT, then PRIMARY_SCROLLS, then LEAVES, then FILLERS, then HATCH/ENGRAVE. Later phases may read but never move earlier-phase geometry.
- **Balance by measured negative space (uniform density).**
  - Source: Wong et al. horror vacui and largest-empty-circle heuristic; FLOWPAK balance principle and refinement; Jones 'proportionate distribution of the areas'
  - Apply: After each phase, compute a distance field of occupied proxies inside each panel. Use local maxima (empty circles) to drive filler growth, and report a density-variance score per panel so the designer sees imbalance numerically.
- **Even or logically graded spacing for clustered lines.**
  - Source: FLOWPAK's adaptation of Jobard-Lefer streamlines (d_gap, d_stop = 0.8·d_gap)
  - Apply: Clustered parallel lines are offset curves or streamlines of the dominant curve's field. Their separation follows a declared rule (constant, or geometric with ratio 1/φ moving away from the dominant line), with d_stop preventing collisions where curves converge.
- **Analogy: the same rhythmic controlling line places different elements.**
  - Source: Wong et al. Sec. 2.1.1 (analogy, recurrence of a ratio)
  - Apply: Reuse one dominant curve family (and one ratio) across medallion, flame, crest and side bands. Elements differ but share parameterisation, so the page reads as one system.
- **Fit to boundaries with integer periods, then stretch.**
  - Source: Wong et al. meander-period fitting; Day on scroll length; Wackrill gcd rule for plaits
  - Apply: For every band and weave along a side, choose integer counts (scroll periods, crossings, beads) for the current length within allowed min/max period lengths, preferring counts that preserve topology (gcd = 1 for a single continuous ribbon). Distribute the remainder by continuous stretching of stretchable (non-anchored) parts.
- **Corners get a dedicated element.**
  - Source: Wong et al. Sec. 2.1.3; Asente automatic corner tiles
  - Apply: The four corners are fixed anchors (medallions, flame) that dominant curves emanate from. Side bands terminate into them via generated or hand-drawn corner tiles; never let a band simply turn a sharp corner.
- **Strict alternation for interlace.**
  - Source: Mercat (Klein Project); Gross & Tucker grid rule; Kaplan Taprats interlace (degree 2 or 4 vertices)
  - Apply: Over/under is computed from crossing parity along each strand, never stored by hand. Validate that every crossing joins exactly two strands, and re-derive after any resize or break toggle.
- **Subtle, recurring proportion; never halves.**
  - Source: Jones Prop. 9 (5:8 over 4:8; proportions hardest to detect are most beautiful); Dresser (3:8, 5:8, 5:13; never divide into halves)
  - Apply: A global ratio palette (φ, φ², with Fibonacci approximants) used for panel splits, crest proportions and leaf length decay. Lint 1:2 splits of decorated areas.
- **Formality consistency and single growth direction.**
  - Source: Day, Nature in Ornament ('formal arrangement of lines involves an equally formal kind of foliation'; stems don't grow two ways)
  - Apply: Each dominant curve has a declared formality level that sets allowed variation (0 = exact self-similar copies). Leaf scale, angle and spacing are monotone from base to tip.
- **Uniformity amidst variety (controlled, seeded variation).**
  - Source: FLOWPAK citing Hutcheson; Wong et al. organic variation; Day on natural vs. mechanical line
  - Apply: Allow small, seeded, bounded deviations (leaf width ±3%, rotation ±2°) in low-formality zones only, so output looks engraved by a hand following rules rather than computed. Keep it deterministic per page size.
- **Symmetry is enforced structurally, not checked after the fact.**
  - Source: Deco Symmetry module (collision removes whole orbit); Xu & Mould mirror-half construction
  - Apply: Mirror and rotation groups are graph nodes. Children of a symmetric parent are generated once and instanced through the transform list; rejecting one instance rejects all.

## Cautions

- Local greedy growth does not produce elegant global composition. Wong et al. concede their largest-empty-circle driver makes 'willow' patterns jumbled and that balance and symmetry need global planning. Dominant curves must be designed (or optimised) first, with growth used only for subordinate fill.
- Physics- or rule-driven curves are hard to aim. Xu & Mould report about 2 minutes of trial and error per curve, and say exact course control is the method's limitation. Use them in inverse mode (fit to designer-drawn curves) or only for secondary curls.
- Good optimisers are slow: FLOWPAK takes about an hour for 50 elements, and DecoBrush relies on raster texture synthesis. Do heavy layout offline at a set of breakpoint sizes and ship baked parameters. At runtime only re-map (skeletal-stroke style) onto resized dominant curves.
- DecoBrush and similar example-based systems synthesise in raster and then vectorise. That conflicts with exact φ-governed vector geometry and crisp engraved strokes.
- Skeletal-stroke mapping folds art at curvature radii below half the art width, and corners leave gaps. Plan for rib-envelope folding avoidance and dedicated corner tiles. FLOWPAK simply avoided U-turns.
- Interlace topology is discrete. Changing crossing counts on resize can change how many separate loops exist (gcd rule), and breaks can merge or split loops. Treat counts as discrete choices with explicit topology checks, not as a continuous stretch.
- Golden-ratio myths: none of the historical sources read demand φ exactly. Jones prefers 5:8 and says the best proportions are hardest to detect; Dresser cites 3:8, 5:8, 5:13 without naming the golden section; Wong credits the recurrence of 'almost any ratio' with unifying a design. φ is a good organising choice, but its value is consistency, not magic. Do not let φ override optical judgement.
- Mechanical perfection can read as dead. Day warns that distributing detail according to a diagram is not design, and prizes the natural line over the mechanical. Real engravings follow rules but have controlled variation and line-weight modulation, so build in bounded, seeded variation and width profiles.
- Compass-arc spirals vs true log spirals: Day describes practical spirals as segments of circles, and the common 'golden spiral' drawing is quarter-circle arcs in golden rectangles. These have curvature jumps. Decide explicitly which construction the engine uses; mixing them causes visible kinks.
- No turnkey JS/TS ornament engine was found. Deco used JavaScript but lived inside Flash and Photoshop. Taprats is Java and no longer developed. Kaplan & Cohen's Celtic system and Wong's system were C/C++ research code. Searches turned up no web reimplementation of Wong's floral method or Hankin's method, so expect to build the core yourself.
- Wong et al. explicitly scoped out bands, half-open borders and strict symmetries. The user's page frame (borders plus bands) needs path-based techniques (skeletal strokes or pattern brushes, interlace graphs) in addition to region-filling growth.
- Unverified items: Kaplan & Cohen's Celtic rendering details are from secondary descriptions (their PDF could not be opened), the Gieseke survey and 2017 paper were read only as abstracts, and Cromwell and Sloss were not opened. Check these before relying on specifics.
