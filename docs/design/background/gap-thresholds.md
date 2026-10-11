# Gap study: thresholds

> Background for [the frame engine design](../frame-engine.md).

## Summary

Map styling, cartographic generalisation, type design, icon systems and CSS have each worked out how the room available decides which design to show, and they agree on one model. (1) A single continuous size input is measured on a log scale: map zoom doubles per level; optical size is measured in points; Chaparral's optical-size ranges and Android's size classes grow by ratios. (2) Each property declares whether it may vary continuously (interpolate) or only in steps (step), and whether it is fixed. MapLibre's spec stores this per property: about 80 of its 146 layout and paint properties are interpolable, and the rest are step-only, cross-faded or constant. (3) A few designer-drawn masters or anchors are interpolated between, but only while their structure is compatible. SF Symbols builds 27 variants from 3 masters, and those masters must have the same number of paths and control points. When structure has to change, a discrete swap fires at a threshold instead. OpenType's 'rvrn' feature does this: a dollar sign loses a stroke at heavy weights, and the trigger values should sit midway between named instances. (4) Elements have visibility ranges with an inclusive minimum and exclusive maximum, a priority for resolving collisions, and optional parts that can drop out. Cartographers apply changes in a fixed order: content, then geometry, then symbol, then label. Töpfer's radical law and tippecanoe's drop rate show that element counts fall more slowly than size. (5) Flicker is handled with hysteresis margins or fades (Godot), by making sure the decoration can never change the box it measures (container queries query only ancestors; the ResizeObserver depth rule), and by `scrollbar-gutter: stable`. (6) Designers see every threshold at once. ScaleMaster is a chart with log-scale on the horizontal axis, one row per feature, and bars showing which design applies at each scale. Polypane's "Breakpoint Edges" shows panes just below and above each breakpoint. Mapbox Studio and Maputnik edit a value-versus-zoom curve as a table of stops. The ratios between adjacent design sizes in these systems range from 1.28 (SF Symbols) to 2.0 (map zoom), and φ (1.618) falls inside that range. For the frame, the "zoom" should be a room level measured per ornament slot, not the viewport width.

## Findings

### 1. MapLibre style-spec expressions: step, interpolate, match, case, coalesce, and the zoom restriction

<https://maplibre.org/maplibre-style-spec/expressions/>

**Facts.** step: ["step", input, output_0, stop_1, out_1, ...] returns the output of the last stop below the input, or output_0 when the input is below the first stop. Stop inputs must be numeric literals in strictly ascending order. interpolate supports ["linear"], ["exponential", base] (base above 1 makes the output rise towards the high end, near 1 is linear) and ["cubic-bezier", x1, y1, x2, y2] (x in 0..1 keeps it monotonic, y may overshoot). It outputs a number, a colour or an array; interpolate-hcl and interpolate-lab exist for colour. match: labels must be unique, with a fallback. case: the first true condition wins. coalesce: the first non-null value. Restriction: ["zoom"] may only be the input to a top-level (outer) step or interpolate, optionally wrapped in let.

**Use for the engine.** Use a small JSON subset of this grammar for room rules: step, interpolate (linear, exponential, cubic-bezier), match, case, coalesce and let/var. Keep the restriction that the room input may only drive a top-level step or interpolate. My inference, not stated by the spec: that restriction is what makes every rule a list of stops a tool can read, so the lab can always draw it as a graph or bar chart instead of opaque code.

### 2. MapLibre per-property typing: interpolable vs step-only vs cross-faded vs constant (v8.json)

<https://github.com/maplibre/maplibre-style-spec/blob/main/src/reference/v8.json>

**Facts.** Each property carries expression.interpolated (true or false), its allowed parameters (zoom, feature) and a property-type. The types are: data-driven ('interpolable and can be represented using a property expression'), cross-faded ('non-interpolable; rather, its values will be cross-faded to smoothly transition between integer zooms', used for line-dasharray, line-pattern and fill-pattern), data-constant, constant ('constant across all zoom levels') and color-ramp. My count from the file: of 146 layout and paint properties, 80 are interpolated:true and 65 are false. symbol-sort-key, text-optional, text-variable-anchor and symbol-placement are step-only. Seamless line and fill patterns need image widths that are a factor of two.

**Use for the engine.** Give every frame parameter a declared kind: continuous (stroke weights, swing amplitude, spacing, ring radius), discrete (leaf count, fan line count, plait vs twist, which motif variant), grow (discrete, with a transition band) or locked (φ constants, which may not take a room expression at all). The lab draws a curve editor for continuous parameters and bars for discrete ones. A validator refuses interpolate on a discrete parameter.

### 3. Mapbox: paint properties re-evaluated continuously, layout properties once per integer zoom

<https://docs.mapbox.com/style-spec/reference/other.md>

**Facts.** Quoted from the Mapbox spec's legacy 'functions' section: 'Paint properties are continuously re-evaluated whenever the zoom level changes, even fractionally.' 'Layout properties, however, are evaluated only once for each integer zoom level.' Stops are [zoom, value] pairs, and base is the exponential base (default 1, linear). Zoom and property functions are deprecated in favour of expressions.

**Use for the engine.** Use the same split. Structure (topology, element counts, which elements exist) is decided at discrete room levels and cached. Cheap appearance parameters (weights, offsets, amplitudes) vary continuously. Expensive geometry is then rebuilt only when the structure changes or the room crosses a quantisation step.

### 4. MapLibre layer visibility ranges and symbol collision and priority rules

<https://maplibre.org/maplibre-style-spec/layers/>

**Facts.** minzoom is inclusive ('At zoom levels less than the minzoom, the layer will be hidden'). maxzoom is exclusive ('equal to or greater than the maxzoom... hidden'). symbol-sort-key: 'Features with lower sort keys are drawn and placed first... will have priority during placement' (from v8.json). text-optional and icon-optional let one half of a label+icon pair survive when the other collides. text-variable-anchor tries anchor positions in order before giving up. text-padding and icon-padding (default 2 px, interpolable) enlarge collision boxes. text-overlap is never, always or cooperative. symbol-spacing defaults to 250 px along lines. Map options (https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions): fadeDuration, default 300 ms, fades label-collision changes. crossSourceCollisions defaults to true.

**Use for the engine.** Each ornament element gets minRoom (inclusive), maxRoom (exclusive), a priority, an optional flag and an ordered list of fallback placements or forms. When two elements compete for a corner, the lower priority yields first: optional leaves drop before the stem they hang on. Padding gives a minimum clearance in CSS px around motifs. A short fade (or the engraving-style grow-in) smooths collision-driven changes.

### 5. Mapbox Studio authoring of zoom-dependent values

<https://docs.mapbox.com/console-tools/studio/studio-interface/>

**Facts.** 'Style across zoom range': 'Values can be specified for any number of stops at any specified zoom level.' The rate-of-change options are linear (default), exponential (a custom base), cubic-bezier and step ('discrete, stepped results'). Other modes are 'Style with data conditions' and 'Style across data range'. A layer's 'Zoom extent' sets its min and max zoom. Mapbox patent US10416866B2 (https://patents.google.com/patent/US10416866, priority 2016, granted 2019, listed expiry 2037) describes this editor: a graph of property value against zoom with a rate-of-change control, value editors with an 'add stop' button, and one live map re-rendered at the selected zoom.

**Use for the engine.** The per-parameter editor should be a value-versus-room graph with draggable stops, a rate-of-change dropdown (linear, exponential base, cubic-bezier, step) and a live preview at the scrubbed room level. The patent exists and covers this editor style. This is not legal advice, but the owner should know about it before publishing a public tool.

### 6. Maputnik (open-source MapLibre editor): zoom-function UI

<https://github.com/maplibre/maputnik/blob/main/src/components/ZoomProperty.tsx>

**Facts.** From the source code (the wiki pages are nearly empty): every zoom-capable property has a button, 'Convert property into a zoom function' (FunctionButtons.tsx). It opens a 'Stops' table with columns Zoom (an input clamped to 0..22) and Output value, a delete button per row, a Base field, an 'Add stop' button and a 'Convert to expression' escape hatch to raw JSON. Stops are re-sorted by zoom on every edit.

**Use for the engine.** This is a simple, proven UX for a non-programmer. Any parameter can be promoted from a constant to room-dependent with one click, then edited as a small sorted table of stops, with raw JSON available only as an escape hatch. Keep that progression: constant, then stops table, then expression.

### 7. ScaleMaster (Brewer and Buttenfield): designing for the whole scale range at once

<https://cartogis.org/docs/proceedings/2006/brewer_buttenfield.pdf>

**Facts.** In a graduate exercise, maps for 1:10K to 1:5M were designed by sampling progressively smaller scales (for example 13K, 20K, 45K, 150K, 300K, 600K, 1M, 4M) and critiquing them as a group. Students then adjusted 'visibility ranges, eliminating subsets of features, and adjusting symbols'. 'The focus was not on designing for the anchor scale... the group was designing for the entire range.' The diagram: feature groups down the side, scale on a logarithmic axis (drawn on graph paper), horizontal bars for the range in which each representation is used, and letters at break points noting the change (for example, at about 1:150K main rivers are selected from the 1:100K data and lake outlines lightened). Bars that stop mean the feature is eliminated. Symbol change combined with selection 'can produce maps through almost the entire range of scales'. The journal version is in Cartography and Geographic Information Science 34(1), 2007, per search results (not opened).

**Use for the engine.** This is the main threshold view for the Frame Lab. Each slot gets a ScaleMaster strip with elements and discrete parameters as rows, the room level as a log x-axis, coloured bars for each variant's range, draggable break points and short notes at each break. The sampling-and-critique loop maps onto an auto-generated filmstrip at chosen room levels.

### 8. Typology of multi-scale operators (Roth, Brewer and Stryker 2011)

<https://cartographicperspectives.org/index.php/journal/article/download/7/18/76>

**Facts.** This builds on ScaleMaster with 24 operators in four groups. Content: add, eliminate, reclassify, reorder. Geometry: aggregate, collapse, merge, displace, exaggerate, simplify, smooth. Symbol: adjust colour, pattern, size, shape, transparency and iconicity, plus enhance, rotate, and typify (replace a set with a sparser representative arrangement). Label: add, eliminate, adjust appearance, adjust position. Multi-scale design usually proceeds content, then geometry, then symbol, then label, and iterates. At intermediate scales, legibility can sometimes be kept with content and symbol changes alone.

**Use for the engine.** Use this as the vocabulary for what a threshold may do: add or eliminate an element, typify (fewer loops, beads or leaves in the same pattern), collapse (a double-line ribbon becomes a single rule), simplify (fewer fan lines), exaggerate (thicken a hairline), enhance (add hatch). Evaluate per slot in the same order: which elements exist, then their topology and geometry, then weights, then collision resolution.

### 9. Töpfer's radical law (principle of selection)

<https://arxiv.org/pdf/1102.1561>

**Facts.** Jiang, Liu and Jia (arXiv, drafts 2011-2013) restate Töpfer and Pillewizer (1966): N_d = N_s · sqrt(M_s / M_d), where N is the number of objects and M the scale denominators. Halving the scale does not halve the count; the retained fraction follows the square root. They note its limits: it 'indicates how many objects should be selected, but it does not come up with which ones'. They propose ranking by a head/tail split instead.

**Use for the engine.** My analogy, not a source claim: when a rail or fan loses room by a factor k, the reduction can be split between element size and element count, not taken all from one. The radical law suggests count ∝ sqrt(k), so elements also shrink by about sqrt(k). Expose this as one dial (size-vs-count split α, with α=0.5 as the radical-law preset). Pair it with an explicit priority order that decides which elements go.

### 10. tippecanoe: concrete per-zoom LOD rules, and the 'texture' philosophy

<https://github.com/felt/tippecanoe>

**Facts.** Lines and polygons are Douglas-Peucker simplified to tile resolution at every zoom. For points, it 'keeps only 1/2.5 of the dots for each zoom level below the... base zoom'; the author writes that densities of many datasets 'fall off at about this same rate'. -r sets the rate. Gamma thins clusters closer than one pixel (gamma 2 gives the square root). Tiny polygons are probabilistically merged so total area is preserved. The stated intent is a scale-independent view that keeps 'the density and texture of the data' rather than dropping 'supposedly unimportant features'. The zoom table halves the scale denominator per level (z7 is about 1:2,500,000, z8 about 1:1,250,000).

**Use for the engine.** For engraved line families (hatch, lattice, beads, fans), keep the texture: hold the physical pitch in CSS px or device px roughly constant and change counts, rather than scaling pitch with the frame. Give lines below a device-pixel gap a rule: merge or drop by priority. This agrees with the priority-tier idea already in 04-engraving-print.md.

### 11. Responsive Logos (Joe Harrison, 2014) and responsive SVG icons

<https://responsivelogos.co.uk/>

**Facts.** 'An exploration into scalable logos for the modern web. Resize your browser (Or rotate your device) to see the reductions based on screen size.' Concept by Joe Harrison, 2014; a personal experiment. Its style.css (https://responsivelogos.co.uk/style.css) uses one SVG sprite per logo with 300 px frames (offsets 0, -300, -600, -900), switched by viewport min-width media queries at 15em, 28em, 45em and 60em, so four discrete variants tied to the viewport, not the logo's box. Kottke (https://kottke.org/tag/Joe%20Harrison) describes logos that 'lose detail and become more abstract' down to the Disney 'D' or the Nike swoosh. Smashing Magazine, 'Rethinking Responsive SVG' (https://www.smashingmagazine.com/2014/03/rethinking-responsive-svg/), puts all variants in one SVG as groups shown by media queries inside the SVG. Media queries in an SVG loaded via img did not work in the author's tests; object did.

**Use for the engine.** This is the discrete-variant baseline: a few hand-designed reductions, each keeping the most recognisable core. For the frame that core is the medallion's ring and S-sweep, then the stems, then fans and leaves. Unlike Harrison's version, select on the slot's own room, not the viewport, and generate rather than store the variants.

### 12. SF Symbols: 9 weights × 3 scales built from 3 masters, explicit overrides, compatibility rule

<https://developer.apple.com/documentation/technologyoverviews/custom-sf-symbols.md>

**Facts.** HIG (https://developer.apple.com/design/human-interface-guidelines/sf-symbols): nine weights matched to the San Francisco font, and three scales (small, medium default, large) 'defined relative to the cap height'. Custom symbols: a variable template has 3 sets of paths (Ultralight-S, Regular-S, Black-S), 'the minimum number of variants necessary for the system to generate the other 24' by vector interpolation. A static template has 27. Interpolation requires the three sources to be path-based with 'the same number of paths and the same number of control points'. 'If they're present, the system uses them instead of interpolation', so explicit variants override. Scale factors are S 0.783, M 1.0, L 1.29. Each variant can have its own margins, falling back to interpolated margins. SF Symbols 7 adds Draw On and Draw Off, which draw a symbol 'along a path through a set of guide points' (relevant later for the animation idea).

**Use for the engine.** Use the masters + interpolation + overrides model. The designer sets a few anchor parameter sets (for example small, medium and large room); the engine interpolates continuous parameters between anchors only while discrete parameters agree, which is the compatibility rule. The designer can pin a hand-tuned override at any room level, and the override wins over interpolation. Per-variant margins correspond to per-variant clearance and padding.

### 13. Icon systems redraw per size, with a constant screen stroke

<https://github.com/primer/design/blob/main/content/foundations/icons/design-guidelines.mdx>

**Facts.** GitHub Primer Octicons: 'Always design two versions of each icon: a 16px version and a 24px version.' 'Use a consistent stroke width of 1.5px for both.' 12px is drawn only for a specific need. Material Symbols (https://developers.google.com/fonts/docs/material_symbols) is a variable icon font with FILL 0..1, wght 100..700, GRAD and opsz 20..48 dp: 'Optical size offers a way to automatically adjust the stroke weight when you increase or decrease the symbol size.' The page is inconsistent about the default opsz.

**Use for the engine.** Line weights should be specified in screen units with floors (for example hairline ≥ 0.5-0.75 CSS px, per 04-engraving-print.md), not scaled with the ornament. Smaller rooms therefore get relatively heavier, simpler line work, as icon optical sizes do.

### 14. OpenType optical-size axis (opsz): selection rules

<https://learn.microsoft.com/en-us/typography/opentype/spec/dvaraxistag_opsz>

**Facts.** 'Used to vary design to suit different text sizes'; values are text size in points. 'Applications may choose to select an optical-size variant automatically based on the displayed text size.' Selection should follow size 'as seen by the reader', including viewing distance. 'Types of zoom that do not trigger re-layout of text should not change Optical size variant selection.' Outside the axis range, selection 'should be clamped to the appropriate minimum or maximum axis value, not reset to the default'. Software should provide a means to override automatic selection. Google Fonts Knowledge (https://github.com/google/fonts/blob/main/cc-by-sa/knowledge/glossary/terms/optical_size_axis/content.md) notes that browsers match opsz to CSS px, not points. Small optical sizes have less contrast, wider spacing and a taller x-height.

**Use for the engine.** Three rules carry over directly. Pinch-zoom must not change the frame variant: MDN confirms pinch-zoom leaves devicePixelRatio and CSS px unchanged, while browser zoom changes both and so triggers relayout. Clamp the room level at the ends of the designed range rather than falling back to a default. Allow a per-page manual override of the variant.

### 15. How type designers distribute optical masters (Chaparral Pro)

<https://blog.typekit.com/wp-content/uploads/2005/11/chaparralproreadme.pdf>

**Facts.** Adobe's Chaparral Pro release notes give the ranges Caption 6-8.3 pt, Regular 8.4-12.9, Subhead 13-25.9, Display 26+. At larger sizes, letter fit tightens, counters close, serifs become finer, contrast rises, weight lightens and the x-height diminishes; at smaller sizes the opposite. 'The difference in design between the Chaparral Pro Caption and Regular optical sizes, which may have a difference in size of only 4 points, is almost as much as the difference between the regular and display sizes, which have a difference of 10-60 points.' Ahrens and Mugikura, Size-specific adjustments to type designs (https://justanotherfoundry.com/size-specific-adjustments-to-type-designs): small sizes 'typically show an increased width and x-height, reduced stroke contrast and looser spacing'.

**Use for the engine.** Space thresholds on a log scale and put more of them, with bigger design changes, at the small end. Chaparral's range boundaries step by ×1.40, ×1.55 and ×2.0. For the frame, the phone-size corner needs the most design attention, and the desktop variants can share one master.

### 16. OpenType 'rvrn' and FeatureVariations: discrete swaps inside a continuous design space

<https://learn.microsoft.com/en-us/typography/opentype/spec/features_pt#tag-rvrn>

**Facts.** Interpolated variants of a glyph 'have exactly the same contours and points'. Making 'significant outline changes, such as reducing strokes in heavy-weight' variants by interpolation 'can be difficult... and might not produce desired results', so the glyph is substituted for a different one under condition sets on axis ranges. Example: a dollar sign with two full vertical strokes becomes one stroke at Bold, and bars only at top and bottom at Black. 'The axis values used to trigger a condition should normally be midway between values used for named instances.'

**Use for the engine.** This is the core hybrid rule. Within a topology class, interpolate. When the structure must change (fewer flame leaves, 3-strand plait to 2-ribbon twist, a medallion collapsing to a simple corner, a fan going from 6 to 4 lines), use a discrete switch on a room range. By default, place each switch at the log-midpoint between the two adjacent designed anchors.

### 17. CSS container queries, container units, clamp()

<https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries>

**Facts.** container-type: size (inline and block axes, applies layout, style and size containment), inline-size (inline axis only), normal (style and name queries only). Queryable size features are width, height, inline-size, block-size, aspect-ratio and orientation (https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_size_and_style_queries). Units cqw, cqh, cqi, cqb, cqmin and cqmax are 1% of the container's dimension; with no eligible container they fall back to small-viewport units. Style queries currently support custom properties only. The query container is selected 'from among the element's ancestor query containers' (W3C CSS Containment 3, Working Draft 18 Aug 2022, https://www.w3.org/TR/css-contain-3/). clamp(MIN, VAL, MAX) = max(MIN, min(VAL, MAX)) (https://developer.mozilla.org/en-US/docs/Web/CSS/clamp).

**Use for the engine.** Let CSS own the page layout and reserve the slots: gutters, masthead height and band thickness, set by container or media queries and clamp(). The engine only measures each slot and fills it. Keep the ancestor-only rule: an ornament never queries or resizes its own box. The engine can publish its chosen variant back as a custom property (for example --frame-corner: 'medallion-s') so CSS style queries can adapt nearby typography.

### 18. Feedback loops and layout jitter: ResizeObserver depth rule, scrollbar-gutter, devicePixelRatio

<https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver>

**Facts.** Resize events run before paint; if any fire, layout is re-evaluated. 'Infinite loops from cyclic dependencies are addressed by only processing elements deeper in the DOM during each iteration', and otherwise 'ResizeObserver loop completed with undelivered notifications' fires. This 'only prevents user-agent lockup, not the infinite loop itself', and users may see 'a flash of broken layout'. The suggested fixes are to defer to requestAnimationFrame or track an expected size. scrollbar-gutter: stable reserves the scrollbar's space to avoid 'unneeded layout changes' as scrollbars appear (Baseline 2024, https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter). devicePixelRatio changes with page zoom but not pinch-zoom; watch it with matchMedia('(resolution: Xdppx)') (https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio).

**Use for the engine.** Render the frame as an absolutely positioned, pointer-events:none layer that never feeds size back into layout. Set scrollbar-gutter: stable on the root so content growth cannot flip the width across a threshold. Treat devicePixelRatio as an input for hairline LOD only, re-read through matchMedia.

### 19. Godot visibility ranges: hysteresis margins, fade modes, hierarchical LOD

<https://docs.godotengine.org/en/stable/tutorials/3d/visibility_ranges.html>

**Facts.** Each instance has Begin and End distances plus Begin and End Margins, documented as 'the hysteresis or alpha fade transition distance'. Fade mode 'Disabled' 'uses hysteresis to switch between LOD levels instantly' and is fastest. 'Self' fades the node out over the margin; 'Dependencies' fades in its children (hierarchical LOD). Fade mode only matters when a margin is above 0. A 'Visibility Parent' hides child nodes while the parent's coarse representation is visible; a node cannot use its own child as its parent, which would be a dependency cycle.

**Use for the engine.** Each discrete switch gets a margin (a Schmitt trigger): switch up at t·φ^(+h) and down at t·φ^(−h). Choose instant or faded per parameter. The Visibility Parent idea fits the attachment graph: when the simplified corner variant is active, its whole subtree of fans and leaves is hidden as one unit, and dependents never decide their own visibility.

### 20. Android window size classes: few, opinionated, available-space-based classes

<https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes>

**Facts.** Width classes: Compact <600 dp, Medium 600-840, Expanded 840-1200, Large 1200-1600, Extra-large ≥1600. Height classes: <480, 480-900, ≥900. These are 'opinionated viewport breakpoints'. They 'are explicitly not determined by the size of the device screen' and are 'not intended for isTablet-type logic'. 'available width is usually more important than available height due to the ubiquity of vertical scrolling.' The class can change at runtime.

**Use for the engine.** Use two tiers. A few page-level width classes (CSS) decide which slots exist: no side gutters on phones means the rails move or vanish, and the garland might run along the bottom only. Per-slot room levels then decide variants inside each slot. Page height should mostly drive counts (rail length), not variant choice.

### 21. Polypane: previewing every breakpoint and its edges

<https://polypane.app/docs/breakpoints/>

**Facts.** It 'automatically detects width-based CSS media query breakpoints defined in your CSS' and can open a pane per breakpoint. 'Breakpoint Edges help you find edge cases by creating panes for the breakpoint and the size right below or above it.' The 'Simplified' option groups breakpoints 'into five different buckets and create[s] a pane of the average of each bucket'. The page does not mention container queries.

**Use for the engine.** The Frame Lab's filmstrip should be generated from the rules, not chosen by hand: one cell per designed anchor, one pair of cells at the two edges of each threshold (just below and just above, including the hysteresis band), and one cell per clamped extreme.

### 22. Rive N-Slicing: fixed corners, stretch/repeat/hidden edges (prior art for frames)

<https://rive.app/docs/editor/layouts/n-slicing.md>

**Facts.** An N-Slice starts with 4 axes and 9 segments; axes are in points or percentages, and more can be added. Segments alternate, 'starting with a fixed segment'. Scaling segments can be Stretch, Repeat or Hidden, but 'Tile modes can only be changed on image/raster based n-slices', so vector groups only stretch.

**Use for the engine.** This confirms the frame decomposition into fixed corners and repeating rails. It also shows the gap the engine fills: vector stretching distorts circles and spirals (see 01-curve-systems.md on affine invariance). The engine instead re-solves rails with whole-number repeats and swaps corner variants by room.

## Recommendation

ROOM-DEPENDENT ORNAMENT MODEL (my synthesis from the sources above; the numeric defaults are proposals, not sourced values)

1. The frame's "zoom" is a room level measured per slot, not the viewport width.
- Slots: corner, side rail, top/bottom band, crest, tailpiece. CSS owns page layout and reserves each slot using a few page width classes (for example compact <600, medium 600-1200, wide ≥1200 CSS px, following Android's classes), media or container queries, and clamp(). The engine measures each slot with ResizeObserver and fills it. It must never change the size it measures (the ancestor-only rule and the ResizeObserver depth rule). Set scrollbar-gutter: stable on the root.
- Per-slot inputs:
  - z = log_φ(s / sRef), where s is the slot's governing size in CSS px (corner: min(w, h); rail: gutter width; band: band height) and sRef is that size at drawing scale 1. One z step is ×1.618. In the sourced systems, adjacent design sizes differ by ×1.28 to ×2.0 (SF Symbols 1.28-1.29, Android 1.33-1.43, Chaparral 1.4-2.0, Primer 1.5, Responsive Logos 1.33-1.87, map zoom 2.0), so a φ ladder is ordinary, not exotic.
  - aspect = w/h.
  - length = run length; it drives repeat counts only, never which variant.
  - devPx = device px per design unit (CSS scale × devicePixelRatio); it drives the hairline floor and merging or dropping lines.
  - widthClass, from CSS.
- Pinch-zoom never changes the variant; browser zoom does, because it relayouts (the opsz rule). Clamp z at the ends of the designed range rather than reverting to a default.

2. Rule language: a JSON subset of MapLibre expressions.
- Operators: step, interpolate (linear, exponential base, cubic-bezier), match, case, coalesce, let/var, plus ['room','z'|'aspect'|'length'|'devPx'] and ['phi', k].
- Room inputs may only drive a top-level step or interpolate, so every rule stays a readable list of stops that the lab can draw.
- Every parameter declares a kind, as in MapLibre's property-type:
  - continuous: interpolate allowed (weights, swing, spacing, radii, fan spread).
  - discrete: step only (leaf count, fan line count, plait/twist, motif variant, collapse ribbon to rule).
  - grow: discrete, but new lines are born from zero width across the hysteresis band, which suits engraving better than an opacity fade (my judgment).
  - locked: φ constants, no room expression allowed.
- Sketch:
  - `type ParamKind = 'continuous' | 'discrete' | 'grow' | 'locked'`
  - `type ParamSpec = { id; kind; unit; min?; max?; value: Expr }`
  - `type ElementRule = { id; parent?; minZ? /*inclusive*/; maxZ? /*exclusive*/; priority; optional?; fallback?: ElementId[] }`
  - `type SlotSpec = { id; governs: 'min' | 'width' | 'height'; sRef; hysteresis: number /*z units, default 0.05 ≈ ±2.4% size*/; anchors: { z; params }[]; overrides?: { z; params }[] }`

3. Variants are masters, switches and overrides (the SF Symbols, rvrn and Cecconi LoD anchor patterns).
- The designer authors 2-4 anchor parameter sets per slot, for example z = -1, 0, +1 (S/M/L). Put more of them, and bigger changes, at the small end (Chaparral).
- Continuous parameters interpolate between adjacent anchors only while all discrete parameters agree, which is the compatibility rule.
- Where discrete values differ, the engine inserts a step at the log-midpoint between the anchors (rvrn's "midway" rule); the designer can drag it.
- A pinned override at any z beats interpolation (SF Symbols).
- The lab compiles anchors into expressions automatically. The designer edits anchors and bars, and raw JSON appears only through a "convert to expression" escape hatch (Maputnik).

4. Evaluation per slot runs in Roth et al.'s order: content, then geometry, then symbol, then collisions.
- (a) Which elements exist: minZ/maxZ, with the visibility-parent idea (a collapsed corner hides its whole subtree).
- (b) Topology and discrete parameters, with a Schmitt trigger: up at t·φ^h, down at t·φ^-h; on first load there is no history, so pick canonically at t.
- (c) Continuous parameters.
- (d) Weights with device-px floors (Primer and icon practice: constant screen stroke, so small rooms get relatively heavier, simpler line work).
- (e) Collisions resolved by priority, as with symbol-sort-key: optional parts drop first, fallback forms are tried in order as with variable anchors, and padding sets clearance in CSS px.
- Rails and bands: whole-number repeats. The existing framing/math/phi.ts fitRepeats rounds with no hysteresis and should go through the same trigger. Add an optional size-vs-count split α (α = 0.5 is the radical-law preset) and keep the pitch of line families constant in screen px (tippecanoe's texture idea; the tiers in 04).
- Mirror Mapbox's split between structure (layout) and appearance (paint): topology is recomputed only at discrete changes, continuous parameters on quantised z (for example 1/32 step), and results are cached by (slot, quantised z, variant key).

5. Lab UX for seeing every threshold at once.
- (i) A ScaleMaster strip per slot: rows are elements and discrete parameters, the x-axis is z (log) with ticks at φ steps, and markers show where real devices land (360, 768, 1280 and 1920 px widths mapped into each slot's z). Coloured bars show variant ranges, break points are draggable, and short notes label each break.
- (ii) A filmstrip generated from the rules: each anchor, both edges of each threshold including the hysteresis band (Polypane Breakpoint Edges), and the clamped extremes. Each cell carries validator badges: hairline below floor, gap below device px, collision, stretch, clamp.
- (iii) One large live canvas with a z scrubber, a "sweep" button that animates z from min to max to catch pops, and a toggle between live-resize behaviour (with hysteresis) and canonical behaviour.
- (iv) A curve editor per continuous parameter: value against z, a stops table, and a rate-of-change dropdown (Mapbox Studio / Maputnik).
- (v) The whole-page contact sheet at device sizes already proposed in 06.

6. Transitions now, animation later.
- Discrete changes during live resize are instant by default (Godot's 'Disabled'), or 'grow' for line families.
- MapLibre's 300 ms collision fade is a reasonable ceiling for any fade.
- The later tab-change animation (arrows running along a track) can reuse the same machinery, because parameters are already functions of an input. SF Symbols 7's Draw On along guide points is the nearest shipped precedent.

## Cautions

- I did not open the Mapbox Studio 'More powerful styling' blog post (it returned 403), the 2007 CaGIS ScaleMaster paper (its details come from search results), or the Polypane synced-panes page. The Maputnik UI facts come from its source code because the wiki pages are nearly empty.
- Mapbox holds patent US10416866B2 on a zoom-level function graph editor (priority 2016, listed expiry 2037 according to Google Patents). A value-versus-room graph editor in the Frame Lab resembles it. I am not giving legal advice. It is probably irrelevant for a private tool, but the owner should know about it before publishing the lab as a public product.
- The 'paint continuous, layout per integer zoom' quote comes from Mapbox's legacy functions docs. I did not confirm that MapLibre keeps exactly the same evaluation rule.
- The Responsive Logos level count (4 sprite frames at 15/28/45/60em) is my reading of the site's style.css. The styling below 15em ('center top') is ambiguous, and secondary articles mention 5-6 levels.
- These are my proposals, not sourced values: the φ-based room ladder, the default hysteresis (0.05 z, about ±2.4% size), the 1/32-step quantisation, the 'grow-from-zero-width' transition, and the radical-law size-vs-count split for ornaments. The sources only show that adjacent design sizes in real systems differ by ×1.28 to ×2.0.
- Hysteresis makes the output depend on resize history, which conflicts with the 'pure function of box size' principle in 05-web-runtime-systems.md. Keep the band small and always choose canonically on load, so that a reload is deterministic.
- Never interpolate a discrete quantity (a leaf count or fan line count as a real number). The compatibility rule (same structure on both sides) has to be enforced by the validator, not left to the designer. Otherwise topology 'pops' mid-interpolation.
- Too many thresholds become unmaintainable; 06 records the 'spaghetti graph' failure of parametric models. Aim for 2-4 anchors per slot and a handful of page width classes, which is what Android, SF Symbols and Chaparral all do.
- CSS cannot compute SVG path geometry. Container queries and cq units can drive only layout reservation and simple CSS-level parameters, so curve generation stays in TypeScript, re-run on ResizeObserver and cached. If it is re-solved on every resize frame without quantisation and caching, it will jank.
- Material Symbols' documentation is inconsistent about its default optical size (24 vs 48). The CSS-px-to-opsz browser mapping comes from Google Fonts Knowledge, not from the CSS spec, which I did not open.
- The W3C CSS Containment 3 document I read is a 2022 Working Draft. I did not check which current spec hosts container queries.
