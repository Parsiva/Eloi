# Judges' reviews

> Two judges with different perspectives scored all five proposals 1–10 per criterion. Background for [the frame engine design](../frame-engine.md).

## designer-advocate — winner: Elevations (architect)

| Proposal | Vision | Designability | Technical | Thresholds & animation | Feasibility | Novelty | Total |
|---|---|---|---|---|---|---|---|
| Neatline (cartographer) | 9 | 7 | 9 | 9 | 7 | 8 | **49** |
| Fount (typefounder) | 8 | 8 | 8 | 9 | 6 | 9 | **48** |
| Burin (engraver-animator) | 9 | 7 | 8 | 9 | 7 | 8 | **48** |
| The Frame Press (toolmaker) | 8 | 10 | 8 | 8 | 8 | 8 | **50** |
| Elevations (architect) | 10 | 8 | 9 | 8 | 8 | 8 | **51** |

### Verdict

The winner is Elevations (the architect's proposal). The updated brief says framing is the key and the frame is the layout of real responsive pages, and Elevations answers that most directly. Datums become CSS grid line names, bays become slots, and corner pavilions sized by the medallion shape the masthead. It also has route- and width-class plans, repeat bays per CMS item, and nested elevations. The loop-free rule, widths go down and heights come up, is enforced by typing each expression by axis rather than by discipline. Its 'profiles as lit sections' model, where the skin renders relief as ramp-quantised colour, hatch density or section outline, is the most credible way for one structure to serve both engraving and mid-century. Its architectural vocabulary (orders, spans with rise budgets, reduction ladders) suits an urban-planning student. The roadmap gets the frame onto the live site at M1 and a full mid-century frame by M3.

Its weak spots are that dominant curves are second-class at page level and that relationship editing is less fluid than in the best Lab proposal. Graft the Frame Press Lab onto it wholesale: gestures write typed pins, Lineage plus Explain, Fork variant here, the unrolled Track lane, registry-generated panels, and layout params compiled to CSS. Add Neatline's rank system so dominant functions are explicit and checked. Add Fount's MATH-style assemblies and justified punctuation for orders, clasps and cartouches. Add Burin's stations and phase locks so the travelling arrows become working navigation.

The Frame Press scored a close second (50) and is the better Lab design, but its layout model is too thin to carry the page on its own. Neatline (49) is the most rigorous on thresholds but asks a designer to think in map-expression arrays. Fount (48) has the most novel mechanisms but the heaviest set of metaphors, and its frame shape is fixed to corners and sides. Burin (48) has the best motion story but delays the Lab to M4.

Build order: M0 to M1 is the Elevations skeleton as the live site layout, M2 to M3 is the Lab with Frame Press interaction and the Section editor, then mid-century, and only after that the curve kernel and the constructed Victorian work.

### Grafts

- From Frame Press: make the Lab gesture-first. Each drag, snap or fan gesture writes exactly one typed relation, never coordinates. Adopt its pin vocabulary (sprout, land, fan, gnomon, mirror, repeat, hug) as the attachment layer of Elevations members and motifs.
- From Frame Press: the Lineage outline (a tree with cross-reference chips, no node-wire graph), Alt-click Explain breadcrumbs, hover-to-tint dependents, and refusing cycles at gesture time with reverse/bake options.
- From Frame Press: Fork variant here (Shift+V) plus automatic log-midpoint switches. Put this inside the Elevations Scale strip.
- From Frame Press: the unrolled Track lane, where profile strata, punctuation rhythm and motion keyframes are edited on one arc-length axis.
- From Frame Press: a node-type registry (args, inputs, evaluate, handles, drag, checks, marks, stations, motionTargets) that generates every Lab panel, plus the rule that layout params compile to build-time CSS (classes plus clamp/cqi) for zero layout shift.
- From Neatline: a rank (1 to 4) on every member and motif node, with a validator that warns when a lower-rank node drives a higher-rank one. This gives 'dominant functions' a first-class place on top of the Elevations datum skeleton.
- From Neatline: track authoring in road-alignment style (tangent, clothoid, arc, clothoid, tangent) for garland spines and sweeps, and the register-sketch tool with 2 to 4 control points.
- From Neatline: the names and fixed order of the generalisation operators, the collapsed-parent-hides-subtree rule, and publishing the chosen variant as a CSS custom property for container style queries.
- From Fount: MATH-style assemblies (size variants first, then fixed parts, extenders and an optional middle) as the shared mechanism for orders, rails with a clasp, ribbon banners and hug cartouches.
- From Fount: justification with glue and badness for repeat punctuation, so counts stay whole and stretch is never visible. Also the join table keyed by (profile A, profile B, corner style).
- From Fount: prose readback of every relation, three lock states (phi / rung / free with drift %), an explicit hinting stage, and sort maturity (static, then fitted, then parametric) so hand-drawn.json pieces work from day one.
- From Burin: stations as the shared currency for nav items and motion, including the section-marker courier that travels to the active nav station. This makes the arrow motion functional navigation.
- From Burin: phase locks (a weave crossing always lands under the side-leaf clasp, with a whole-period fit per segment), rides:true lanes on strata, weight functions w(u) on filled outlines, and painter's-stack rendering for flat stripes.
- From Burin: golden verified on the emitted cubics, with was/note written to the file whenever a golden law is relaxed, plus the forced-colours fallback and the median-of-scanlines profile probe.

### Critical risks

- Scope against one designer with AI help. Every proposal describes a 9 to 10 milestone system. Freeze the M0 to M3 scope: rectilinear frame-as-layout, mid-century profile and blocks, Lab v0 with the section editor. No curve kernel until the frame is running on the live site.
- Lab creep. The Lab can easily grow bigger than the engine. The registry-generated panels and the 'every concept needed by two styles' rule have to be enforced, or the owner never gets a usable tool.
- Owning the page layout. Once the engine emits the grid, TipTap content, sticky nav, overflow, long words and embedded media all become frame bugs. Openings need a real fit:flow escape hatch and site CSS sovereignty inside slots.
- Layout feedback and flicker. Hug cartouches, late font loading, images without dimensions, scrollbars and the viewport-height arch budget can all cause jitter or CLS. Enforce the axis typing in the validator and the CLI, re-measure on fonts.ready, use scrollbar-gutter: stable, and check CLS on the contact sheet.
- Readability of expressions. MapLibre-array and string expressions must never be the owner's main surface. If any common task needs hand-editing JSON, the 'edit relationships without code' promise fails (the METAFONT trap).
- Re-skinning is not free. A 12-stripe moulding drawn as engraving, or a garland drawn as flat colour, may look wrong. Show an honest 'not designed for this skin' badge rather than promising universal re-skins.
- Golden by construction changes the art. Spiral-similarity leaves make the small flame leaves noticeably larger than the drawn linear shrink. The owner must judge side by side and keep the drawn motifs available indefinitely.
- Curve numerics. Spiro returns no convergence status, clothoid closures can fail, and drag inversion can jump between solutions. Every solve needs a status, a residual and a last-good fallback, visible as Lab badges.
- Interpolation across masters or anchors with different structure can produce odd in-between shapes. The compatibility validator and sweep testing are essential.
- Performance and browser gaps on dense Victorian pages: thousands of filled outlines and knockouts. Safari compositing of SVG children, the missing CSS d property and the ResizeObserver depth-ordering assumption are all unverified and should be measured early (M3b).
- Pending owner decisions (twist or plait, bottom garland, whether to leave Vue) must stay data switches. Do not let the Vue-exit question block the frame engine.

### Strengths and weaknesses per proposal

**Neatline (cartographer)**

- + A rank from 1 to 4 on every feature, with a validator that warns when a rank-1 feature depends on a rank-3 one. This is the most literal encoding of the owner's 'dominant functions, everything relative to them'.
- + Tracks authored the way roads are (tangent, clothoid, arc, then clothoid and tangent, G2 by construction). It ties the drawing analysis to the owner's urban-planning training.
- + Plan, symbology and theme kept separate, with fills set as var(--token), so a theme swap is CSS only and needs no recompute.
- + Named generalisation operators (eliminate, typify, collapse, merge, swap, exaggerate) with a fixed evaluation order per slot, and texture-preserving density with an optional radical-law split.
- + Survey pass (width only) writes the CSS grid, then an enclose pass reads invisible probe elements and only draws. The CLI precomputes a CSS file per width class, so there is no layout shift before JS runs.
- + Register a sketch with 2 to 4 control points, like georeferencing a scan. A Sample cross-section tool reads colour runs and snaps them to palette tokens.
- + A filmstrip generated from the rules (anchors plus both edges of every threshold), a Sweep button and a live/canonical toggle.
- − Room rules are MapLibre JSON arrays such as ["step",["room","rail","z"],1,-1,2,0.5,3]. A designer cannot read these, so the Lab has to hide them completely.
- − Separating plan from layers means one visual thing (a garland) is edited in two places, the plan node and the ribbon layer. That is extra cognitive load in the Lab.
- − The metaphor list is long. The owner has to learn rank, slot, z, symbology, generalisation and collisions before drawing anything.
- − Subdivisions and orders are thinner than layering and generalisation. The architectural example is a sketch, not a worked layout contract.
- − The Lab arrives at M2 and relationship editing (handles, re-pinning) only at M5. Until then the owner edits JSON.

**Fount (typefounder)**

- + Assemblies modelled on the OpenType MATH table: try pre-drawn size variants first, then build from fixed ends, extenders and an optional middle. One mechanism covers pilaster orders, a rail with a side-leaf clasp, ribbon banners and cartouches that grow around live text.
- + Punctuation set with Knuth-Plass style boxes, glue and badness. Beads, finials, ticks and deco sequences come out in whole numbers with no visible stretch, and the count changes by choice rather than by rounding.
- + Corners as ligatures: a join table keyed by (profile A, profile B, corner style) picks mitre, stud block, medallion, step or notch.
- + A 'hinting' layer (device-px floors, snapping stripes to pixels, merging lines by priority) as the explicit source of the printed look. A grad axis compensates dark mode without reflow.
- + Three lock states (phi / rung / free). Free values show the nearest rung and their percentage drift.
- + Relations are read back as prose sentences with editable tokens. Gestures offer only the relations that make sense for the current selection.
- + Sorts mature in three steps (static hand-drawn, then fitted, then parametric) without changing the family. Existing hand-drawn.json works on day one.
- + The schema forbids height inputs in metrics, which rules out layout loops.
- − Metaphors pile up: family, sort, metrics, axes (room, rich, dens, grad), masters, rules, stylistic sets, assemblies, settings, joins and finishes. That is too much vocabulary for a solo designer.
- − The frame shape is hard-wired to corners and sides (tl/tr/bl/br, left/right/top/bottom). Free dominant tracks, curved spines and frames that are not rectangles feel bolted on.
- − Frame-as-layout is the thinnest of the five: a 'type area' with grid areas and metric custom properties, but no worked plan or subdivision model beyond bays.
- − The arch form steps on span/height. If that height is content height, the variant depends on content, which contradicts its own loop rule.
- − Interpolating masters across structurally different instances risks odd in-between shapes. The proposal acknowledges this but it is still a real cost.

**Burin (engraver-animator)**

- + The station as the one currency for layout dividers, rider placement, repeat fitting, nav highlights and motion targets. This is why 'arrows run along their track on tab change' falls straight out of the data model.
- + A section marker that works as UI: each nav link maps to a station, and the active-section rider travels there on route change. Motion here is functional navigation, not just decoration.
- + Phase locks such as 'a weave crossing always lands under the clasp', with a separate whole-period fit above and below the clasp.
- + Profile lanes with rides:true become sub-tracks for chevrons and finials. Weight functions w(u) give engraving-style swell and taper, drawn as filled outlines.
- + Painter's-stack rendering for flat stripes (each lane fills to the inner edge, painted outside-in), so there are no anti-aliasing seams.
- + Golden is verified on the emitted cubics, not only on the inputs. Switching away from golden writes a was/note into the file, so the change shows in the git diff.
- + A profile probe that takes the median of about 30 scanlines to cancel the wobble in the trace. Also a forced-colours fallback.
- − The roadmap starts with the curve kernel (M0) and the Lab arrives only at M4. The owner lives in JSON for months, which is the worst order for a designer.
- − The expression language is said to be closed, yet the worked example uses a JS ternary ("garland == 'plait3' ? 3 : 2"). The document model is not fully self-consistent.
- − 14 nouns plus a large flat document. The Lab tool letters (R, S, J, F, P, D, C, T) are good, but nothing comparable to Lineage or Explain helps the owner understand dependencies.
- − Regions use a split tree with dividers as tracks. That is sound, but less explicit than the Architect's datums: grid line names and the axis-typed loop guarantee are missing.

**The Frame Press (toolmaker)**

- + Each gesture writes exactly one typed pin, never coordinates. For example, dragging a leaf onto the sweep at the 1/phi detent writes sprout(sweep.outer, golden(1), G2). The file then reads like the owner's own sentences.
- + A Lineage outline (a tree with cross-reference chips) instead of a node-wire graph. Alt-click Explain shows the breadcrumb back to the page box, and hovering a dominant curve tints everything that moves with it.
- + Cycles are refused at gesture time, with an explanation and an offer to reverse the pin or bake it. Errors never surface at render.
- + Fork variant here (Shift+V): scrub until the checks go red, fork the variant there, and the switch appears automatically at the log-midpoint. This is the most designerly threshold workflow proposed.
- + The unrolled Track lane: any track straightened into one arc-length axis where profile layers, punctuation rhythm and motion keyframes are edited together.
- + A hard rule that layout params compile to CSS (widthClass steps or linear in cqi) and drawing params run in TS. First paint has the final layout before JS, and the drawing never writes layout.
- + A node-type registry (args, inputs, evaluate, handles, drag, checks, marks, stations, motionTargets) that generates every Lab panel, which limits how big the Lab can grow.
- + Press checks and proof sheets, plus Measure & construct with displacement ghosts and a before/after toggle.
- − One primary pin per node keeps things simple, but relations that are genuinely two-parent (a garland locked to sockets at both ends plus a clasp phase) need secondary references, which are less visible.
- − The layout model is under-specified. Slots are named grid areas from a build-time plugin, but there is no plan or subdivision tree like the Architect's datums and bays, and no route-dependent plans.
- − The layout-param restriction rules out decoration that depends on content (acknowledged). Cartouche hugging and height closing still have to stay draw-only.
- − The theme, lighting and per-style finish rules are less developed than in Elevations or Neatline. Re-skinning engraving to flat colour has no relief-to-hatch story.

**Elevations (architect)**

- + The frame as an architectural elevation. Datums become CSS grid line names, bays become slots, and the medallion's size reserves corner pavilions that shape the masthead, so the frame literally designs the page. This answers the updated brief more directly than any other proposal.
- + 'Widths go down, heights come up' is enforced statically by typing each expression by axis. An x-typed expression cannot reference y-datums or measurements, so loops are impossible by construction, not by discipline.
- + A plan tree per route and width class, including repeat bays (one ruled panel per DOM child or CMS item) and nested elevations that inherit --m and the skin. Old Frame.vue usages migrate into these.
- + Profiles as lit sections: each stratum has a relief and a priority. The skin turns relief into ramp-quantised flat colour (mid-century), hatch density (engraving) or section outlines (blueprint). This is the only honest mechanism for re-skinning across very different finishes.
- + A module m in px for geometry and a separate hair unit with a device-pixel floor for line weight. That is the optical-size rule, made explicit.
- + Reduction ladders per member type: column, pilaster, rule; semicircle, three-centred, segmental, lintel by rise budget; plait, twist, double rule; medallion, block, mitre.
- + Nav links as anchored stations on a moulding stratum, cartouches hugging live headings, and breakers with shape-outside text wrap. The frame reacts to the site's real structure.
- + A Section (moulding) editor with a profile sampler and underlay calibration (click two points, type the real distance). References are never imported as geometry.
- + The roadmap puts the frame-as-layout on the live site at M1 and a mid-century frame by M3. An early Victorian win (M3b) uses drawn motifs from hand-drawn.json and the ported weave.
- − 'Dominant functions' live mainly inside motifs and members. The page skeleton is a rectilinear split tree, so curved dominant tracks (a garland spine that is the page's main line) are second-class next to Neatline's rank or Burin's stations.
- − Relationship editing is less gesture-driven than the Frame Press. There are handles and a relation inspector, but no Lineage, Fork variant or unrolled lane.
- − Owning the page grid means owning layout bugs: TipTap content, sticky elements, overflow and embedded media. The fit:flow escape hatch has to be real.
- − The arch rise budget uses viewport height. That is acceptable, but it is the one height input to a variant and needs careful typing.
- − The claim about ResizeObserver depth ordering (openings delivered in the same frame as the host) is plausible but should be verified in Safari and Firefox before relying on it for zero-flash closing.

## engineer — winner: Architect: Elevations

| Proposal | Vision | Designability | Technical | Thresholds & animation | Feasibility | Novelty | Total |
|---|---|---|---|---|---|---|---|
| Architect: Elevations (frame-first layout engine) | 10 | 8 | 9 | 8 | 8 | 8 | **51** |
| Toolmaker: The Frame Press (gesture-first) | 8 | 9 | 8 | 8 | 7 | 8 | **48** |
| Typefounder: Fount (frame as a variable-font family) | 8 | 7 | 8 | 9 | 6 | 9 | **47** |
| Cartographer: Neatline (map-styling frame engine) | 8 | 7 | 8 | 9 | 7 | 7 | **46** |
| Engraver-animator: Burin (track and station engine) | 8 | 7 | 7 | 9 | 6 | 8 | **45** |

### Verdict

Build on Elevations (Architect). The other four are good ornament engines that also offer a layout. Elevations is the only one designed around the owner's updated brief: the frame IS the layout system. Datums become CSS grid line names, bays become slots, and a corner pavilion sized by the medallion shapes the masthead. Its 'widths down, heights up' contract is enforced by typing expressions by axis, not by convention. Its pipeline separates DOM reads from DOM writes, and its roadmap puts frame-as-layout on the live site at M1, with an early Victorian win (M3b) built from the existing hand-drawn.json sockets and the spike weave before any curve kernel exists.

It is not the most elegant primitive set, so graft hard:
- Fount's MATH-style Assembly as the one stretch mechanism for orders, clasped rails and cartouches.
- Fount's devPx hinting stage for the printed finish.
- Frame Press's NodeType registry, gesture-to-pin model and CSS-native layout emission. The registry is what keeps a solo developer's Lab maintainable; the CSS emission minimises the px-grid first-paint swap.
- Burin's stations as the shared currency, so nav items, the section marker and the arrow couriers fall out of the data model, plus its weave phase locks and median-scanline profile probe.
- Neatline's rank and inverted-hierarchy validator, plus its top-level-only room expressions.

On the shared ground (DAG with node-local bounded solves, no runtime global solver, intrinsic curve kernel with Gauss-Legendre and a device-px-tolerance fitter, MotionDirector tiers A/B/C, View Transitions that exclude the frame), all five agree and are technically sound.

The biggest danger is not the maths. It is vocabulary and Lab scope outrunning a solo builder. Enforce a 'two real styles must need it' rule for every concept, ship mid-century then drawn-motif Victorian before generalising, and keep JSON plus the CLI contact sheet usable without the Lab.

### Grafts

- From Fount (typefounder): replace the ad-hoc order, rail-with-clasp and cartouche definitions with one MATH-style Assembly primitive (fixed end pieces + extender(s) + optional middle, with pre-drawn size variants tried first). An order becomes base + shaft extender + capital, a rail becomes garland + side-leaf middle + garland, and a ribbon cartouche becomes cap + extender fitted to text + cap.
- From Fount: an explicit 'hinting' stage at the current devPx (snap stripes and ticks, floor hairlines, merge lines with gaps under 1 device px, drop by priority with the space absorbed by a named neighbour). Also the static/fitted/parametric maturity path for motifs, so hand-drawn.json pieces work immediately and upgrade without format changes.
- From Frame Press (toolmaker): the NodeType registry (args, inputs, evaluate, handles, drag, checks, marks, stations, motionTargets) as the single source that generates Lab panels. Also one primary pin per node with a Lineage outline instead of a graph, and cycles refused at gesture time with reverse/bake offered.
- From Frame Press: emit layout as native CSS wherever possible (fr ratios, phi fr, clamp()/cqi band depths) and fall back to engine-computed px only for tracks derived from solved members (pavilions sized by motifs). This shrinks the first-paint swap that Elevations accepts.
- From Frame Press: the unrolled Track lane view, where profile layers, punctuation rhythm and motion keyframes are edited on one arc-length axis. Also 'Fork variant here' on a failing z, and the Alt-click Explain breadcrumb.
- From Burin (engraver-animator): treat stations as the shared currency, with nav items as stations on a lane and the active-section marker as a rider animated to the new nav station. Also weave phase locks ('a crossing lands under the clasp'), whole-period fits per segment, and the median-of-30-scanlines profile probe.
- From Neatline (cartographer): rank 1-4 on members, with a validator that flags inverted hierarchy, which directly encodes the 'dominant functions' requirement. Also the rule that a room input may only drive a top-level step or interpolate, and the named generalisation operators evaluated in Roth order with visibility parents.
- From Neatline: register a sketch with 2-4 control points, and compute shape-outside polygons from motif hulls so text wraps around intruding ornament.
- From all: replace the existing frameEngine.ts '<use href x y>' placement (verified at src/frames/frameEngine.ts:210) with <g transform> or HTML wrappers for anything movable. Replace the whole-SVG rewrite with a keyed diff.

### Critical risks

- Owning the page grid means owning real-page layout bugs: the TipTap editor, sticky nav, long words and embedded media, overflow, and images without dimensions. Every opening must remain an ordinary grid area with min-width:0, and there must be a fit:flow escape hatch. Test the actual Vue routes at M1, not lorem.
- First paint and layout shift: JS-computed px tracks replace the build-time fallback. Keep the CSS-native subset as large as possible and gate CLS in the contact sheet. Re-measure hug cartouches on document.fonts.ready.
- Over-abstraction before taste. Five proposals' worth of vocabulary (assemblies, strata, joints, orders, spans, punctuation modes, room anchors, skins) can produce elegant types and ugly frames. Rule: a concept enters the engine only when two real styles need it. M0-M3 should be limited to datums/bays, a mitre/block profile, repeat punctuation and one skin.
- Threshold machinery complexity: per-member z, anchors, compatibility-constrained interpolation, log-midpoint switches and hysteresis all interact. Hysteresis makes output depend on resize history, so canonical-on-load must be tested. Ship the discrete step switch first and add interpolation later.
- Curve numerics: Spiro returns no convergence status, clothoid chain closure can fail or jump between solutions during drags, and offsets cusp. Every local solve needs status, residual, an iteration cap and a last-good fallback, plus closed-form unit tests, before anything depends on it.
- Lab scope creep: the editor can absorb all available time. The schema plus a CLI contact sheet must be usable on its own from M0, and Lab panels should be generated from node-type declarations rather than hand-built.
- Victorian engraving performance on tall pages: thousands of filled variable-width outlines plus paper-halo knockouts. Merge to one compound path per pen layer, cache motifs by variant, tile long rails, and measure on a low-end phone at M3b, not at M6.
- Browser gaps: Safari compositing of SVG child transforms is unconfirmed (use HTML-wrapper travellers), the CSS d property is missing in Safari, corner-shape is Chromium-only, and View Transition snapshots would stretch hairlines (exclude the frame layer).
- Determinism: JS Math precision differs across engines, so snapshot tests need tolerances. Pin algo versions per node so committed art does not shift when the maths improves.
- Golden-ratio expectations: phi must be imposed by construction (gnomon copies, locked b, rung ladders) with visible drift readouts, never hunted for in drawings. Golden leaf scaling visibly changes the flame (geometric vs linear shrink), so show it side by side and let the owner choose.

### Strengths and weaknesses per proposal

**Architect: Elevations (frame-first layout engine)**

- + The frame really is the layout. Datums become named CSS grid lines, bays become slots and openings, and there is a plan per route and width class. A corner pavilion sized by the medallion shapes the masthead, so the frame designs the page instead of decorating it.
- + 'Widths go down, heights come up' is enforced statically: expressions are typed by axis, so an x expression that references a y datum or a measurement fails validation. This is the only proposal that makes layout loops impossible by construction rather than by discipline. It is backed by the ResizeObserver depth-ordering argument, so the frame is closed before paint.
- + A clean 10-step pipeline with explicit DOM read and write phases. Width solve and grid emission are separate from the measure, vertical solve and render steps.
- + Profiles are stacks of strata, each with relief and priority. The skin lights the relief: ramp-quantised colour in the flat finish, hatch density in engraving, section outlines in blueprint. This is the most honest re-skin mechanism offered. It also uses onion painting and datum snapping to 1/dpr to remove anti-aliasing seams.
- + Orders (stretching shaft, fixed base and capital) and spans whose form is chosen by a rise budget, with reduction ladders such as column to pilaster to rule, or arch to segmental to lintel.
- + Two kinds of slot: 'repeat' bays (one ruled panel per DOM child, e.g. project cards) and 'anchored' stations taken from nav links. The ornament reacts to the site's real structure.
- + The roadmap puts the frame-as-layout on the live site at M1. M3b is an early Victorian win that reuses the hand-drawn.json sockets and the spike weave, so the payoff comes before the curve kernel exists.
- + The risks section is the most honest of the five: 'owning layout means owning layout bugs' (TipTap, sticky, overflow), with a fit:flow escape hatch and a CLS check on the contact sheet.
- − The JS distributor writes exact px grid tracks. Even with a build-time clamp()/fr fallback, this creates a first-paint swap and puts JS on the layout critical path. Most of these splits (fr ratios, phi fr) are plain CSS grid and do not need px.
- − Two units (module m and hair) plus books and elevations plus skins mean three file kinds and two unit systems. That is a lot for the owner to keep straight early on.
- − The arch rise budget reads the viewport height, a quiet exception to the axis rule that needs explicit typing.
- − Thresholds and the Lab are solid but mostly borrowed from shared research (ScaleMaster, filmstrip). Animation is adequate, but less integral than Burin's station model.
- − The Lab chrome is written in Vue for convenience. That is harmless, but it keeps a second UI stack alive.

**Toolmaker: The Frame Press (gesture-first)**

- + Each gesture writes one typed pin, stored on the child, with one primary pin per node. The structure is a tree with cross-reference chips, shown as a Lineage outline rather than a wire graph. This is the best defence against spaghetti.
- + A NodeType registry (args, inputs, evaluate, handles, drag, checks, marks, stations, motionTargets) drives the inspector, snapping and checks with no special cases. For a solo developer this is the single most important way to keep the Lab's maintenance cost bounded.
- + Layout params must compile to CSS (widthClass steps or linear in cqi). The build emits grid areas and clamp() bands, so first paint has the final layout before JS runs.
- + Cycles are refused at gesture time, with 'reverse pin' or 'bake' offered, never discovered at render.
- + The unrolled Track lane: profile layers, punctuation rhythm and motion keyframes are edited on one arc-length axis.
- + Measure & construct with displacement ghosts, 'Fork variant here' (Shift+V) at a failing z, and Alt-click Explain breadcrumbs back to the page box. Press checks are named in print-shop terms.
- − The CSS-compilable restriction on layout params cuts against frame-first design. A masthead or pavilion sized from a solved medallion cannot drive layout unless it is linear in cqi, and the proposal accepts that trade-off.
- − Subdivisions and regions are thinner than in Elevations. Slots are mostly predeclared CSS grid areas rather than derived from frame geometry.
- − A Lab-first design risks becoming an endless editor. The mitigation ('Lab v0 deliberately ugly') is a promise, not a mechanism.
- − Expression strings mix arithmetic with MapLibre arrays (room steps as JSON arrays), so there are two syntaxes.

**Typefounder: Fount (frame as a variable-font family)**

- + OpenType MATH-style assemblies (fixed end pieces, extenders, an optional middle, and pre-drawn size variants tried first). One mechanism covers pilaster base, shaft and capital, rail plus clasp plus rail, and ribbon cartouches that grow around live headings. This is the best single structural primitive in the whole set.
- + Hinting for ornament: device-px snapping, minPx floors, drop by priority with the space absorbed by the outer neighbour, and lines merged below 1 device px. This is the concrete mechanism behind the 'printed' look.
- + Metrics are a phi ladder over em, and the schema forbids height inputs in metrics, so layout loops are prevented at the schema level.
- + Width changes invalidate only the slots whose quantised z changed. Height changes invalidate only setter stages 5-7, never sorts.
- + A sort maturity path (static to fitted to parametric) means the hand-drawn pieces work on day one and can be upgraded without changing the family.
- + A grad axis for dark-mode weight compensation with no reflow. Stylistic sets as per-route switches.
- + Box, glue and badness for punctuation gives a principled whole-count choice with stretch and shrink limits.
- − The concept count is the highest of the five: families, sorts, masters, rules, axes (room, rich, dens, grad), stylistic sets, assemblies, settings, joins and terminals. This is exactly the over-engineering risk the brief warns about.
- − Interpolating across masters on several axes uses the fontTools variation model, which is heavy machinery for a frame. Sparse-master surprises are a real risk.
- − Knuth-Plass badness is overkill when the job is fitting a whole count of equal motifs.
- − The type area is less precisely specified than Elevations' datum and bay plan. Panel and bay rules are read back from getComputedStyle rather than owned.
- − One folder per family with one file per sort means many files. That is good for git diffs but adds friction for a designer.

**Cartographer: Neatline (map-styling frame engine)**

- + A clean survey and enclose contract. Pass 1 is width-only and writes the grid and custom properties. Pass 2 is draw-only and never writes layout, with probe elements per region. The CLI precomputes the survey CSS per width class, so layout is correct with no JS.
- + Rank 1-4 on every feature, plus a validator that flags inverted hierarchy (a rank-1 feature depending on a rank-3 one). This directly encodes the owner's 'dominant functions, then things relative to them'.
- + Named generalisation operators (eliminate, typify, collapse, simplify, exaggerate, merge, swap), evaluated in Roth order per slot, with visibility parents.
- + Each room input may drive only a top-level step or interpolate, so every rule can be drawn as a stops table or a bar.
- + Register a sketch with 2-4 control points (georeferencing), and shape-outside polygons computed from motif hulls.
- + M0 is stripes and blocks with no curves: the fastest credible visible win.
- − Plan and symbology layers are split, so one visual element is defined in two places. That makes authoring heavier and weakens the relationship-on-the-child principle.
- − MapLibre-style nested-array expressions are hostile to hand editing for a designer.
- − The map metaphor adds vocabulary (symbology, z-zoom, georeference) that does not map one-to-one onto how the owner designs.
- − Architectural orders and arches appear only briefly, and regions and grid derivation are less developed than in Elevations.

**Engraver-animator: Burin (track and station engine)**

- + Stations are the one currency for layout dividers, rider placement, repeat fits, nav items, hover glints and motion targets. The section marker is a rider travelling to the active nav station, which makes the owner's 'arrows run along the track' a working UI element.
- + Weave phase locks, e.g. 'a crossing always lands under the clasp', with whole-period fits per segment either side of the clasp.
- + The profile probe takes the median over about 30 parallel scanlines to cancel trace wobble, then clusters to palette tokens. This is the most robust way to read the wobbly websiteOutline.svg.
- + A painter's stack (each lane filled from its outer edge to the profile's inner edge) avoids anti-aliasing seams. The keep priority controls the order in which lanes collapse.
- + solve(doc, ctx) is a pure function, so a later move to a Web Worker is trivial.
- + A forced-colors fallback, plus fonts.ready re-measurement for cartouches.
- − Too many top-level sections (about 15: tracks, junctions, sweeps, riders, punctuation, families, regions, cartouches...). The rider, punctuation and family boundaries overlap.
- − An internal inconsistency: the garland strand count uses a ternary expression (garland == 'plait3' ? 3 : 2) that the stated expression grammar does not support. Region bounds such as 'between(pil.L, pil.R) under(arch)' are an unspecified mini-language.
- − The roadmap starts with the curve kernel (M0) before anything appears on the site, and the Lab arrives late (M4). That is backwards for the frame-first brief and for motivating a solo builder.
- − Regions and two-direction layout are sound, but the frame-as-layout story is less developed than in Elevations.
