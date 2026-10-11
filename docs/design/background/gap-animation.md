# Gap study: animation

> Background for [the frame engine design](../frame-engine.md).

## Summary

For this engine, animation should mean changing parameters of the solved frame over time, not adding a separate animation layer. The engine already computes dominant curves with native arc length (clothoids, log spirals, circles) and an attachment graph, and those two things decide most of the design.

The browser facts point to three runtime tiers. (A) A rigid motif travelling along a track, like the owner's medallion "arrows", is best done as Web Animations API transform keyframes sampled from the track by arc length. Transform is on Chromium's compositor list (I read the source); offset-distance/offset-path is not. Composited means the motion keeps running while Vue renders the new section. (B) Draw-in and "ink pulse" effects use stroke-dashoffset with pathLength=1. Because the engine draws lines as filled outlines, these need mask-reveal (Colloseus' calligraphy technique). This runs on the main thread but is cheap. (C) True shape changes (a weave ripple, leaf growth) re-solve a small subgraph each frame in requestAnimationFrame.

Built-in options each have problems. CSS offset-path is Baseline but path() takes px only, url() and shape() are newer, and none of them run on the compositor in Chromium. SMIL works but CSS cannot control it. GSAP is free but under a proprietary Webflow licence. Rive and Lottie bake geometry at authoring time, and Rive exports have needed a paid plan since 20 Oct 2025. Theatre.js has not had a public release since May 2024.

For site-section changes, same-document View Transitions now work in all three engines, but they snapshot as raster, so the frame must stay out of the snapshot. Pause motion when the document is hidden and honour prefers-reduced-motion. Keep every motion event-triggered and under 5 s, which avoids the WCAG 2.2.2 pause requirement. The motion layer should stay small. SVG and Canvas perform about the same, and both slow down when roughly 8,000 elements are redrawn.

## Findings

### 1. CSS Motion Path (offset-path / offset-distance / offset-rotate): support

<https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/properties/offset-path.json>

**Facts.** MDN calls offset-path Baseline Widely available since March 2022 and notes that some parts are supported unevenly. MDN BCD (raw JSON read 2026-10-10): offset-path Chrome 55, Firefox 72, Safari 15.4. path() Chrome 64, Firefox 72, Safari 16. url() Chrome 116, Firefox 122, Safari 17. Basic shapes and coord-box Chrome 116, Firefox 122, Safari 18. ray() Chrome 116, Firefox 122, Safari 16. Caniuse shows full support at 96.84% of global usage, and the spec is still a Working Draft. url() can reference an SVG path, circle, rect and similar shapes. In SVG the default coord-box is view-box. MDN's shape() page says path() is limited to px units.

**Use for the engine.** Don't use offset-path:path() for page-sized tracks. Its px-only coordinates break on every resize, and the engine would have to rewrite the string. offset-path:url(#track-id), pointing at the engine's own hidden track path, is the only CSS form that should follow re-solved geometry automatically. I have not tested that it updates live when 'd' changes, so verify it in the Lab. In any case, prefer the WAAPI-transform method (see the Chromium compositor finding).

### 2. CSS shape() function (responsive paths for clip-path and offset-path)

<https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/basic-shape/shape>

**Facts.** MDN marks shape() as Baseline 2026, newly available since February 2026. It is defined for border-shape, clip-path and offset-path. It accepts %, rem, em and calc(), where path() accepts px only, so shapes scale with the reference box. BCD: Chrome 135, Firefox 148, Safari 18.4. The BCD entry does not separate offset-path support from clip-path support.

**Use for the engine.** shape() could give a responsive CSS track with no JS for simple percentage-defined curves. But the engine's curves are solved (clothoid and log-spiral fits) and can't be expressed in percentages, and the support is new. Keep it as a fallback idea only, and check offset-path: shape() in each target browser before relying on it.

### 3. What Chromium can run on the compositor (read from current source)

<https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/core/animation/compositor_animations.cc>

**Facts.** In blink compositor_animations.cc on main (fetched 2026-10-10), the properties that can be composited are opacity, transform/translate/rotate/scale, filter and backdrop-filter. background-color, clip-path and box-shadow use paint-worklet paths, and custom properties are composited only when a paint worklet uses them. No offset-* property is listed, so offset-distance animations run on the main thread. SVG-specific rules from the same file: only the 'transform' property can be composited on SVG elements, not individual translate/rotate/scale. Elements that have SMIL animations are refused. Elements inside an SVG resource such as a mask, clipPath or pattern are refused. A transformable container with an extra transform is refused, and the code comment names '<use> x/y attributes' and <svg>/<symbol> viewBox transforms. Non-1 zoom and vector-effect also block compositing. The Chrome blog (last updated 2021-02-22) says hardware-accelerated SVG animations have been on by default since Chromium 89.

**Use for the engine.** This changes the current code. Ornaments are placed as <use href x= y= width= height=> in src/frames/frameEngine.ts:210 and framing/render/svg.ts:38, and Chromium won't composite a transform animation on those. Put any element that moves inside a <g> with only a transform, or in a small HTML-level wrapper. Composited (Tier A) motion should animate 'transform' only. Mask-based reveals and dash animations will always run on the main thread.

### 4. Safari/WebKit compositing of SVG child elements

<https://blogs.igalia.com/webkit/blog/2026/wip-69/>

**Facts.** Igalia's posts describe the Layer-Based SVG Engine (LBSE) as in WebKit but not the default (21 May 2024). A 29 June 2026 update covers making layer creation conditional and doesn't say LBSE is on by default anywhere. I found no source confirming that Safari composites transform animations on SVG child elements.

**Use for the engine.** For a guaranteed composited traveller in every engine, render the moving glyph in its own small absolutely positioned element (an HTML wrapper holding a tiny SVG) in page coordinates, and animate its CSS transform. The static frame stays in the big SVG.

### 5. SMIL <animateMotion>

<https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/animateMotion>

**Facts.** MDN calls it Baseline Widely available since January 2020. It supports path, an <mpath> reference, keyPoints/keyTimes, rotate=auto|auto-reverse, and calcMode defaults to 'paced' (constant speed). Chrome's 2015 'Intent to deprecate: SMIL' was suspended in August 2016 ('we've decided to suspend our intent to deprecate and take smaller steps toward other options'). Chromium refuses to composite elements that have SMIL animations (source above). Jake Archibald's 2013 article said SMIL 'performs poorly' in Chrome and Safari.

**Use for the engine.** Avoid SMIL for the site. CSS media queries can't control it, so reduced motion would need JS (SVGSVGElement.pauseAnimations), it blocks compositing, and its future has been uncertain since 2016. Its useful ideas are paced timing and keyPoints, and the engine gets both from its own arc-length tables.

### 6. Web Animations API (Element.animate)

<https://developer.mozilla.org/en-US/docs/Web/API/Element/animate>

**Facts.** MDN calls it Baseline Widely available since March 2020 (BCD: Chrome 36, Firefox 48, Safari 13.1). It returns a controllable Animation (play, pause, reverse, currentTime, finished promise). It accepts timeline, rangeStart and rangeEnd for scroll or view timelines. MDN advises respecting prefers-reduced-motion.

**Use for the engine.** Use this as the runtime for Tier A. Sample the solved track at uniform arc-length steps (for example 64 to 128 keyframes), and give each keyframe {transform: translate(x,y) rotate(θ), offset: s/L}. Put the speed profile in the effect easing. The motion is then composited, has constant speed along the curve, and can be cancelled or seeked. A resize can rebuild the keyframes and restore currentTime.

### 7. stroke-dasharray / stroke-dashoffset line drawing and pathLength

<https://jakearchibald.com/2013/animated-line-drawing-svg/>

**Facts.** Jake Archibald (2013) set the dash and gap to getTotalLength(), set the offset to the length, and transitioned stroke-dashoffset to 0. You need to force layout between setting the start and end values. MDN pathLength: the browser scales all distance calculations by pathLength divided by the computed length, so stroke-dasharray treats the path as running from 0 to pathLength. getPointAtLength is Baseline Widely available since January 2020. Polygon's PS4 and Xbox One reviews (Vox Media, 25 Nov 2013) used this technique on Illustrator-traced line art, after cleaning up Illustrator's SVG export by hand.

**Use for the engine.** Set pathLength="1" on every animatable stroked spine. Dash values are then fractions of arc length and stay valid when the engine re-solves the curve at a new page size, so no getTotalLength call is needed after a resize. One dash window, a dash d plus a gap with an offset driven by time, gives draw-in, draw-out and a travelling 'pulse'. Dash changes repaint on the main thread.

### 8. Mask-reveal for filled, variable-width outlines

<https://css-tricks.com/?p=271643>

**Facts.** In 'Animate Calligraphy with SVG' (Claus Colloseus, CSS-Tricks, 22 June 2018), a smooth path is stroked wide enough to cover the brush outline and used as a mask. The mask path's stroke-dashoffset is then animated. It has to be a mask, because clip-path ignores strokes. Where strokes overlap, the drawing is split into pieces that don't overlap, stacked in drawing order, each with its own mask, and tangents are matched at the joins. Sequencing can use CSS keyframes with holds or SMIL begin chains.

**Use for the engine.** The engine draws lines as filled outlines with width profiles, and the weave generator already produces RibbonPiece[] split at crossings with over/under and halo. That matches the precondition here. Each piece gets a mask from its own centreline, offset by the piece's start s on the strand. The reveal then flows across crossings and is hidden correctly where the strand passes under. In Chromium, mask content is never composited.

### 9. requestAnimationFrame with your own arc-length parameterisation

<https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame>

**Facts.** MDN: rAF callbacks generally run at the display refresh rate (60, 75, 120 or 144 Hz). Use the timestamp to compute progress, 'otherwise, the animation will run faster on high refresh-rate screens'. All callbacks in one frame get the same timestamp. rAF calls are paused in most browsers in background tabs and hidden iframes. Pomax's Bézier primer: t does not map linearly to distance, so build a lookup table of t to cumulative length and invert it to find the closest t for a given distance.

**Use for the engine.** Use one MotionDirector with a single rAF loop for Tiers B and C, and compute every motion from the timestamp. The engine's analytic curves are already in arc length (a clothoid is defined by s, and log spirals and circles have closed-form s). Only fitted cubics and composite paths need a lookup table, built once per solve and never per frame.

### 10. GSAP MotionPathPlugin and licence status

<https://gsap.com/licensing/>

**Facts.** Licence: the 'Standard No Charge GSAP License', effective 30 April 2025 and modified 30 May 2025. All plugins are free for commercial use. It is proprietary, owned by Webflow, and not MIT. Prohibited without consent: use in 'tools that allow users to build visual animations without code' that compete with Webflow. Webflow can amend or terminate the licence. npm gsap 3.15.0 was published 2026-04-13 under that licence. MotionPathPlugin.min.js is about 22 KB minified and gsap.min.js about 73 KB (measured from unpkg). Features: path from an SVG element, data or points; align, autoRotate, start and end (which can wrap); resolution defaults to 12 for even speed. The docs say alignment is computed once at the start and is not re-measured on resize. They suggest saving progress, killing the tween, rebuilding it and jumping back to that progress.

**Use for the engine.** It works, but it adds about 95 KB and a proprietary licence to do what the engine's arc-length sampler plus WAAPI already does. It also doesn't follow re-solved geometry. The Frame Lab is effectively a visual animation-building tool, which is close to the licence's prohibited-use wording if it were ever shared. Use the 'record progress, rebuild, seek' pattern, not the library.

### 11. Rive (state machines, Follow Path, web runtime)

<https://rive.app/blog/rive-s-new-9-mo-plan>

**Facts.** Runtime Sizes page (January 2026), brotli-compressed: canvas-lite 222 KB (707 KB uncompressed), canvas 567 KB, webgl2 648 KB, mostly WASM. Rendering is canvas or WebGL, not DOM SVG. Since 20 October 2025, new exports need a paid plan (Cadet: $9/month annually, $17 monthly). Runtimes remain MIT, there is no runtime fee, and existing exports keep working. Luau scripting launched 13 January 2026 with Node, Converter, Layout, Test and PathEffect protocols. The announcement doesn't say which runtimes run scripts. State machines connect timeline animations through states and transitions. Follow Path (covered in research file 05) attaches an object at a percentage distance and orients it to the tangent.

**Use for the engine.** Its concepts are worth copying: a Follow Path-style attachment {track, distance 0..1, orient, offset} and state-machine triggers. As a runtime it is the wrong source of truth, because the geometry is authored in the Rive editor rather than solved by the engine. It also costs at least 222 KB, rasterises to canvas, and needs a paid plan to export. At most, consider it for one self-contained micro-animation.

### 12. Lottie / dotLottie

<https://github.com/LottieFiles/dotlottie-web>

**Facts.** The Lottie Animation Community (Linux Foundation / JDF) published the Lottie v1.0 JSON specification on 17 September 2024. dotlottie-web (MIT, npm 0.81.0, 2026-10-06) is a Rust and WASM core on ThorVG with Canvas2D, WebGL2 and experimental WebGPU renderers. It has a Web Worker and OffscreenCanvas option, and state machines built into the file. Theming slots override colour, scalar, vector, gradient, text and image values at runtime, and the README doesn't mention SVG output. lottie-web (MIT, 5.13.0, 2025-05-21) offers svg, canvas and html renderers.

**Use for the engine.** It's designed for After Effects-style clips with geometry baked at a fixed composition size. Slots can retune values but can't re-solve a track to a new page size. It isn't suited to the frame. Use it only if the owner ever wants a fixed illustrated vignette.

### 13. Theatre.js (sequenced parameter animation with a studio)

<https://github.com/theatre-js/theatre>

**Facts.** The README says @theatre/core is Apache-2.0 and @theatre/studio is AGPL-3.0, and that 'your project's final bundle only includes @theatre/core'. It animates any JS variable through sheet objects with typed props, and the studio offers a keyframe and sequence editor. Status: the README says 'Theatre.js 1.0 is around the corner' and that development moved to a private repo. The last public commit, 2024-04-11, added that notice. The last npm release is 0.7.2 (2024-05-19).

**Use for the engine.** It is the closest existing model to what the Lab needs: typed parameters plus keyframed sequences, saved as JSON and played by a small core. It has had no public release for about 2.5 years. Build a small timeline into the Lab using the same model (sheet, object, typed props, keyframes, JSON), or use Theatre only inside the Lab and never ship the studio.

### 14. View Transitions API, same-document (site section and route changes)

<https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using>

**Facts.** BCD: document.startViewTransition Chrome 111, Firefox 144, Safari 18. The options and types parameter: Chrome 125, Firefox 147, Safari 18.2. view-transition-class: Chrome 125, Firefox 144, Safari 18.2. MDN: the old state is a static image and the new state is a live, interactive region. Each view-transition-name gets its own ::view-transition-group. Names must be unique, or the transition is skipped. If the document is hidden when startViewTransition is called, the transition is skipped entirely. Chrome docs: groups animate width, height and transform, and images are 100% width with auto height. 'During this time [the update callback], the page is frozen.' A reduced-motion preference 'doesn't mean the user wants no motion'.

**Use for the engine.** The site is a Vue Router SPA (Studio, Projects, Marginalia, Newsletter, About), so this is the 'tab change' hook. Keep the frame out of the raster snapshot. A scaled snapshot of hairline engraving would distort line weights when the page height changes. Name the frame layer, set ::view-transition-group(frame){animation:none}, and hide its old image so the live new frame shows. Start the Courier motion after updateCallbackDone, once the new page height is known and the frame has been re-solved.

### 15. Cross-document and element-scoped View Transitions

<https://developer.chrome.com/blog/element-scoped-view-transitions>

**Facts.** BCD: @view-transition (cross-document, multi-page sites) is Chrome 126 and Safari 18.2, and Firefox does not support it. Element.startViewTransition (element-scoped) is Chrome 147 only, per the Chrome blog of 27 March 2026. It runs a transition on one subtree, allows concurrent and nested transitions, 'keeping the rest of the page interactive', and the scope root gets contain: layout during the transition.

**Use for the engine.** If the site ever leaves the SPA, cross-document transitions cover Chrome and Safari, and Firefox just changes pages instantly. Element-scoped transitions on <main> are the cleanest way to transition only the content while the frame runs its own vector motion. Treat that as a progressive enhancement in Chrome only.

### 16. Page Visibility API (switching browser tabs)

<https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API>

**Facts.** MDN calls it Baseline Widely available since July 2015 (visibilitychange: Chrome 62, Firefox 56, Safari 14.1). visibilityState is 'visible' or 'hidden', where hidden means a background tab, a minimised window or the screen off. 'Most browsers stop sending requestAnimationFrame() callbacks to background tabs.' Timers are throttled, using budget-based throttling after 30 s in Firefox and 10 s in Chrome. View transitions are skipped while hidden.

**Use for the engine.** On hidden: pause the MotionDirector and finish any running motion instantly (commit its end state). On visible: optionally play one short 'return' motion, such as a Courier or a pulse, but rate-limit it, for example only after more than 60 s away (my suggestion). Never queue motions while hidden.

### 17. prefers-reduced-motion and WCAG

<https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html>

**Facts.** BCD prefers-reduced-motion: Chrome 74, Firefox 63, Safari 10.1. WCAG 2.2 SC 2.2.2 Pause, Stop, Hide (Level A) applies to moving content that starts automatically, lasts more than 5 s and is shown alongside other content. It must have a pause, stop or hide mechanism, and decorative motion is not exempt. SC 2.3.3 Animation from Interactions (Level AAA): motion triggered by interaction must be possible to disable, with techniques C39/SCR40 (prefers-reduced-motion). Colour and opacity changes are not motion animation.

**Use for the engine.** Design rule: every motion is triggered by an event and finishes in under 5 s, with no infinite ambient loops. With reduced motion, swap travel or growth for opacity-only versions, and offer a site 'still engraving' toggle stored per viewer. Read it with matchMedia plus a change listener so the setting updates live.

### 18. Cost of many SVG nodes vs Canvas vs WebGL

<https://mt.inf.tu-dresden.de/cnt/uploads/Horak-2018-Graph-Performance-Poster.pdf>

**Facts.** Horak, Kister and Dachselt, 'Comparing Rendering Performance of Common Web Technologies for Large Graphs' (IEEE VIS 2018 poster), measured FPS during interaction. SVG (D3) and Canvas performed almost the same. All three lost performance above 400 nodes, about 8,000 graphical elements. WebGL (PixiJS) without text held 50 FPS at about 8 million elements. Research file 04 already warns that animated feTurbulence/feDisplacementMap is CPU-heavy and has crashed Safari on iOS.

**Use for the engine.** The frame stays SVG and stays static. Only a small motion overlay changes per frame (one glyph, a few dash windows, one re-solved subgraph). Keep animated elements to tens, not thousands, and never animate filters. Consider Canvas or WebGL only if a future effect needs thousands of lines moving at once, such as a full-page guilloché moiré.

### 19. Supporting CSS: @property, linear() easing, the d property, scroll-driven timelines

<https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/types/easing-function.json>

**Facts.** @property is Baseline 2024 (July 2024), and typed custom properties interpolate. linear() easing: Chrome 113, Firefox 112, Safari 17.2. The CSS 'd' property, path(): Chrome 52, Firefox 97, Safari not supported. animation-timeline (scroll and view): Chrome 115, Safari 26, Firefox preview only (all BCD).

**Use for the engine.** Use @property (for example --u as a <number>) only where one CSS variable fans out to many dash windows. Use linear() to ship custom 'engine-like' easing curves designed in the Lab. Don't morph geometry with CSS 'd' because Safari lacks it, so change shapes with JS setAttribute('d'). Scroll-linked tracks are a later, optional idea.

### 20. Real examples of tasteful line-art and ornament motion

<https://web.archive.org/web/20151219225539/http://product.voxmedia.com/2013/11/25/5426880/polygon-feature-design-svg-animations-for-fun-and-profit>

**Facts.** (1) Polygon's PS4 and Xbox One reviews (2013). Illustrator-traced console line art drew itself in with dash animation, and the team chose JS timing over CSS transitions so animations could be chained (Vox Product Blog, archived). (2) Codrops 'SVG Drawing Animation' (30 Dec 2013): line art draws in and then fades into the finished illustration. (3) Codrops 'Animated SVG Frame Slideshow' (15 Nov 2017): an SVG frame morphs on each slide change (anime.js), the closest precedent to 'the frame reacts when you change section'. (4) Vivus: delayed, sync and oneByOne draw-in modes plus per-path scenario timing. (5) Colloseus's calligraphy writing-on (CSS-Tricks 2018). (6) Magic UI AnimatedBeam (MIT): a glow 'travels' along a connector, but the source moves a userSpaceOnUse linearGradient along x only and rebuilds the path with ResizeObserver.

**Use for the engine.** Take three lessons. Ordering is what makes draw-in elegant (oneByOne, scenarios), and the engine's attachment graph supplies that order. Frame motion on section change has a precedent and reads as deliberate. A glow made by sliding a gradient is not an arc-length travel and fails on vertical or curved tracks, which is why the engine's dash-window or WAAPI sampler is needed.

## Recommendation

ARCHITECTURE: "Motion is time-varying parameters on the same solved graph."
1) One source of truth. A Motion is data in the frame spec, edited in the Lab like any other relationship: {id, trigger (firstVisit | routeChange | visibilityReturn | bandChange), target (a parameter path in the attachment graph, e.g. courier.u, weave.left.phasePacket, flame.growthK, element.reveal), from/to, duration, easing (linear() string), order rule}. Motion state is always stored relative to tracks (normalised arc length u, or s anchored to a socket), never in pixels. A resize then just re-solves geometry and keeps u.
2) Build these hooks into M1 now, though motion ships later. Every curve exposes length, pointAt(s), tangentAt(s) and curvatureAt(s). Rendered pieces get stable IDs and their s-range on the parent track. RibbonPieces keep over/under z-order and halo. The attachment graph exports a topological order. Rendering has two layers: a static engraving SVG and a small motion overlay. Moving parts are a <g transform> or an HTML wrapper, never a <use x= y=>, because Chromium refuses to composite those.
3) A MotionDirector, the single runtime, picks the cheapest tier that is correct:
- Tier A, compositor (rigid travellers and cross-fades): sample the track at uniform s, then element.animate() transform keyframes with offset = s/L. Effect easing sets the speed profile. Only transform and opacity are animated, so the motion stays smooth while Vue mounts the new route.
- Tier B, paint (reveals and pulses): pathLength=1 on spines. Animate stroke-dashoffset dash windows. Filled outlines get mask-reveal per RibbonPiece with the offset shifted by the piece's start s, so motion flows across crossings and is hidden where the strand passes under.
- Tier C, geometry (true shape changes): one rAF loop driven by the timestamp. Re-evaluate only the subgraph downstream of the animated parameter, write only changed 'd' attributes, and keep a frame budget (for example 4 ms; my number, measure it in the Lab). If over budget, fall back to Tier B or A.
Lifecycle: pause and commit end states on visibilitychange→hidden. Use matchMedia('(prefers-reduced-motion: reduce)') with a change listener plus a per-viewer 'still engraving' toggle that swaps each motion for its opacity variant. Every motion is finite and under 5 s, with no ambient loops. On resize: if a motion is running, finish it instantly, re-solve, rebuild the WAAPI keyframes, or restore currentTime for long ones. Don't animate the resize itself. When the page crosses a design threshold (a different band: 2-ribbon vs 3-strand plait, medallion variant), cross-fade for about 250 ms and never morph across a topology change. Integer repeat refits (fitRepeats) are also discontinuous, so cross-fade those too.
Section change: run a same-document View Transition for the content only. Keep the frame out of the raster snapshot (::view-transition-group(frame){animation:none} with the old image hidden, or Chrome 147's element-scoped transition on <main>). After updateCallbackDone, re-solve the frame for the new page height, then fire the route-change motions. Skip motions while the document is hidden.
4) The Lab gets a timeline lane per Motion (a small Theatre.js-style model: typed params, keyframes, JSON). It has scrub and replay, a reduced-motion preview, a contact sheet at several page sizes playing the same motion, and an ms-per-frame meter for each tier.
VOCABULARY (rudimentary but elegant). Every motion is driven by geometry the engine already has.
- Construction Replay, first visit only. Dominant curves draw in first. Each dependent starts when its parent's pen passes the dependent's attach parameter t, so the order comes from the attachment graph and the relationships become visible. Total about 1.2 to 2 s. Reduced motion: a 300 ms fade.
- Courier, the owner's arrows, on section change. The dart glyph leaves its medallion socket, rides its ribbon strand down the side at constant arc-length speed (Tier A), is hidden under crossings by an overlay mask cut from the over-piece halos, and docks at the far corner. About 0.9 to 1.6 s, scaled to track length with a cap. Reduced motion: no travel, a soft opacity blink at the destination socket.
- Ink Pulse, an alternative to the Courier. A short dark segment travels inside the double-line ribbon through dash windows on each piece (Tier B), occluded correctly at crossings.
- Ripple: one phase packet travels down the weave, ψ(s,t) = A·g((s - v·t)/σ). Crossings slide and then settle, and the ends stay locked to the medallion sockets (Tier C).
- Unfurl: flame leaves appear in growth order, k = 0 to N, under the spiral similarity, each scaling from its base along the log-spiral spine. This shows off the golden construction.
- Rose-engine Turn: rotate one guilloché band by a multiple of 2π/lobes. The end state is identical, and a moiré blooms once along the way. It is a transform, so it is composited.
- Settle: a threshold cross-fade.
Durations can come from a phi token scale (0.38, 0.62, 1, 1.62 s), honestly framed as a token scale with no perceptual claim. Easing should feel like a printing or engraving machine: near-constant velocity with short ease-in and ease-out, not springs or bounces.

## Cautions

- Chromium does not composite offset-path/offset-distance animations (they are not on the compositable-property list in compositor_animations.cc), so CSS Motion Path runs on the main thread and can stutter during route renders. Use WAAPI transform keyframes for travellers.
- Chromium refuses composited transform animations on <use> elements with x/y and on symbol or viewBox containers. The current engine places ornaments that way (src/frames/frameEngine.ts:210, framing/render/svg.ts:38), so wrap moving parts in <g transform> or an HTML wrapper.
- Elements inside SVG masks or clipPaths are never composited, and stroke-dashoffset always repaints, so Tier B reveals run on the main thread. Keep them few and short.
- I could not confirm that Safari composites transform animations on SVG child elements (WebKit's LBSE is not the default as far as I found). The cross-engine composited option is a small HTML-level wrapper.
- offset-path: path() takes px only and won't follow a re-solved frame. I have not verified that url() follows live 'd' changes; test it in the Lab. shape() support is new (Baseline February 2026), and BCD doesn't separate offset-path support from clip-path.
- The CSS 'd' property is unsupported in Safari, so shape morphs need JS setAttribute.
- View Transition snapshots of the old state are raster images that stretch when the page height changes, which would distort hairline engraving. Keep the frame out of the snapshot. The page is frozen during the update callback, so start frame motion after it.
- Cross-document View Transitions are not supported in Firefox. Element-scoped transitions are Chrome 147 only.
- rAF stops in background tabs. Compute progress from timestamps, which matters on 120/144 Hz screens, and don't queue motions while hidden.
- WCAG 2.2.2 (Level A) applies to auto-starting motion over 5 s alongside content, decorative or not. Avoid ambient loops entirely, or add a pause control.
- The GSAP licence is proprietary to Webflow and can be amended or terminated. It prohibits, without consent, use in no-code visual animation tools that compete with Webflow, which is uncomfortably close to a shared Frame Lab.
- Rive exports have needed a paid plan since 20 Oct 2025, the smallest web runtime is about 222 KB brotli, it renders to canvas, and its geometry is authored in Rive, not solved by the engine. Lottie also bakes geometry at authoring time.
- Theatre.js has had no public release since 0.7.2 (19 May 2024), and its studio is AGPL-3.0.
- Integer repeat counts (weave periods, scallops) change in steps as the page resizes. Don't animate through them; cross-fade or snap.
- Duration numbers, the 4 ms budget and the 'return after more than 60 s' rule are my design suggestions, not sourced figures. Measure them in the Lab.
- The SVG vs Canvas data (Horak 2018) is older and measured whole-scene redraws. It supports keeping the animated set small; it does not give exact limits for 2026 browsers.
