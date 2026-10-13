# Islands Architecture, Resumability, and Web Components: Internals for Eloi

Research date: 2026-10-11. All browser-support statements were checked against sources dated as noted. Items marked "(unverified)" are from background knowledge and were not confirmed against a source in this pass.

## 1. What "islands" are, and how Astro marks up, serializes, and hydrates them

### Takeaway
An island is a server-rendered HTML region wrapped in a host element. The host carries everything needed to wake it later: module URL, serialized props, slot HTML, and trigger strategy. A tiny inline loader then upgrades each island on its own schedule, independently of the others. Astro's `<astro-island>` is itself a custom element, which is almost exactly the `<frame-elevation>` + `mount()` shape Eloi plans.

### Cited Findings
**Origin of the pattern**
- Jason Miller (Aug 11, 2020) describes the approach as rendering HTML pages on the server and injecting placeholders or slots around highly dynamic regions. Each slot holds that widget's server HTML, which is upgraded in place rather than replaced. He credits Katie Sylor-Miller with the "Component Islands" name. — [Jason Miller, Islands Architecture](https://jasonformat.com/islands-architecture/)
- How it differs from progressive hydration: progressive hydration still typically starts from top-level root components, while islands need no top-down render. "Each part of the page is an isolated unit," so a perf issue in one does not affect the others. Static HTML is "a meaningful and immediately renderable representation" of the content, not just an SEO add-on. — [Jason Miller](https://jasonformat.com/islands-architecture/)

**Astro defaults and directives**
- Astro renders components to HTML/CSS with zero client JS by default. Only a `client:*` directive makes a component interactive. Each island hydrates separately, so a high-priority island does not wait for a heavier one. Islands can mix React/Preact/Svelte/Vue/Solid on one page. — [Astro: Islands](https://docs.astro.build/en/concepts/islands/)
- Directive semantics. Source: [Astro directives reference](https://docs.astro.build/en/reference/directives-reference/)
  - `client:load` hydrates immediately on page load.
  - `client:idle` waits for `requestIdleCallback` and falls back to the `load` event. It takes a `{timeout}` option (since astro 4.15.0), passed to rIC.
  - `client:visible` uses `IntersectionObserver` and takes a `{rootMargin}` option (since 4.1.0).
  - `client:media="(max-width: 50em)"` hydrates when the media query matches.
  - `client:only="react"` skips SSR entirely and renders client-side on load. It takes optional `slot="fallback"` content.
- Directives only work on framework components imported directly into `.astro` files, not on dynamic tags. Directives never appear in the output HTML. — [Astro directives reference](https://docs.astro.build/en/reference/directives-reference/)

**`<astro-island>` internals (read from the `astro-island.ts` source)** — [astro-island.ts](https://raw.githubusercontent.com/withastro/astro/main/packages/astro/src/runtime/server/astro-island.ts)
- Attributes:
  - `component-url` (the module, imported with retry)
  - `component-export` (dotted paths allowed; `__proto__`/`constructor`/`prototype` rejected)
  - `renderer-url` (the framework hydrator)
  - `props` (JSON)
  - `client` (directive name)
  - `opts` (directive options JSON)
  - `before-hydration-url`
  - `await-children`
  - `ssr` (present until hydrated)
- Prop serialization: each value is a `[typeCode, value]` tuple, revived top-down (deliberately, because `JSON.parse` revivers run bottom-up). The codes are:
  - 0 Object, 1 Array, 2 RegExp, 3 Date, 4 Map, 5 Set
  - 6 BigInt, 7 URL, 8 Uint8Array, 9 Uint16Array, 10 Uint32Array
  - 11 ±Infinity
  - Unknown codes become `undefined`.
- Changing the `props` attribute re-runs `hydrate()` via `attributeChangedCallback`.
- Directive loading: `start()` waits for `Astro[client]` to exist, otherwise it listens for a window event `astro:<directive>`. In practice each directive's strategy is a small script registered on a global.
- Nesting is ordered top-down. A child checks `closest('astro-island[ssr]')` and, if its parent has not hydrated yet, waits for the parent's `astro:hydrate` event.
- `await-children`: while the document is still loading, a `MutationObserver` waits for a trailing `<!--astro:end-->` comment, with `DOMContentLoaded` as fallback. This handles streaming.
- Slots: `<astro-slot name>` elements are collected (only those whose nearest island is this one) and passed to the hydrator as `innerHTML` strings. `<template data-astro-template>` carries slots the component did not render on the server.
- After hydration the element removes `ssr` and dispatches `astro:hydrate`. Errors fire a cancelable `astro:hydration-error`. On disconnect it waits for `astro:after-swap` and dispatches `astro:unmount` if still detached.

**Server islands (`server:defer`)** — [Astro: Server islands](https://docs.astro.build/en/guides/server-islands/)
- At build time each deferred component is replaced by a small script plus its `slot="fallback"` content, and gets its own route. The docs' example path is `/_server-islands/Avatar`.
- The script fetches the island's HTML and swaps it in. Islands load independently.
- Props travel encrypted in a GET query string, switching to POST if the URL exceeds 2048 bytes. POST breaks HTTP caching.
- The key is generated per build. Use `astro create-key` / `ASTRO_KEY` for multi-region or CDN deploys.
- Inside the island, `Astro.url` is the island endpoint, not the page. Read the `Referer` header to get the page URL.

**Persistence across navigation** — [Astro: View transitions](https://docs.astro.build/en/guides/view-transitions/)
- `transition:persist` keeps an element or island alive across client-side navigations (for example a playing `<video>`). Iframes still reload and CSS animations still restart.
- Elements are matched by type and DOM location, or explicitly by `transition:name`.
- `transition:persist-props` also keeps the old props.
- Events: `astro:after-swap` fires before paint; `astro:page-load` fires after.
- Bundled module scripts run once; inline scripts re-run only with `data-astro-rerun`.

**Sharing state between islands**
- Framework context providers do not work across islands. Astro recommends Nano Stores ("less than 1 KB", zero dependencies, works across frameworks). — [Astro: Sharing state](https://docs.astro.build/en/recipes/sharing-state-islands/)

### Inferences
- Islands are isolated by construction: each has its own framework root. Communication therefore has to go through something outside every root: a module-level store, DOM events, or URL state. Nano Stores is just a tiny observable living at module scope.
- The type-code tuple format is a compact way to carry more than JSON (Map, Date, typed arrays) across the server/client boundary without a heavy library like devalue.
- Hydrating top-down through nested islands matters only if islands can nest. Eloi's frame boxes are flat siblings, so it can skip this.

### Gaps
- I did not verify the exact current byte size of Astro's inline island loader and directive scripts.
- The exact server-island wire format beyond the documented GET/POST and encryption behavior was not checked.

## 2. Qwik resumability: serialization, lazy handlers, cost

### Takeaway
Qwik serializes into the HTML everything that hydration would normally rebuild: listener locations, component boundaries, and store subscriptions. A single global loader (qwikloader) then downloads a handler chunk only when its event actually fires. The price is a compiler that splits every closure into a lazy chunk, strict serializability rules, and noticeably larger HTML. That is far more machinery than Eloi needs.

### Cited Findings
- Qwik "pauses execution on the server, and resumes execution on the client" instead of replaying component code to rebuild listeners, tree, and state. — [Qwik: Resumable](https://qwik.dev/docs/concepts/resumable/)
- Listeners become attributes such as `<button on:click="./chunk.js#handler_symbol">`, i.e. a chunk URL plus a symbol name. — [Qwik: Resumable](https://qwik.dev/docs/concepts/resumable/)
- qwikloader is a single global listener that works with no application code present. When an event fires it reads the attribute, downloads the chunk, and runs the symbol. — [Qwik: Resumable](https://qwik.dev/docs/concepts/resumable/)
- What gets serialized: component boundaries and store-to-component subscriptions, so Qwik can re-render only the components that need it. Supported types include circular refs, DOM refs, Promises, Date, URL, Map, and Set. Closures are supported only when wrapped as QRLs. Class instances (prototypes/`instanceof`) and Streams are not supported. — [Qwik: Resumable](https://qwik.dev/docs/concepts/resumable/)
- Qwik 2 changes (blog dated Feb 9, 2024):
  - Comment-node vnodes are removed.
  - Vnode data moves into a `<script type="qwik/vnode">` at the end of the document, with nodes located by depth-first index.
  - Non-human-readable data moves to the end of the stream.
  - No breaking changes are promised.
  — [Qwik 2 coming soon](https://qwik.dev/blog/qwik-2-coming-soon)
- Critique: a Qwik 1 vs 2 comparison reports a larger HTML payload and more HTTP requests for an empty app in v2, attributed to state and vnode serialization. The same author still found perceived speed excellent. — [DEV: Qwik 1 vs 2](https://dev.to/falselight/qwik-1-vs-2-quick-comparison-2f39)
- Apps with complex data structures can hit serialization failures. Workarounds include flattening nested data and breaking cycles. — [LogRocket: Qwik adoption guide](https://blog.logrocket.com/qwik-adoption-guide)
- Runtime size claims vary between secondary sources (about 1.6 KB starting JS vs a "~4 KB" global runtime). Neither measures qwikloader directly. — [pkgpulse](https://www.pkgpulse.com/guides/qwik-vs-react-2026); [jacar.es](https://jacar.es/en/qwik-betting-on-resumability-instead-of-hydration/)
- For heavily client-side apps (realtime tools, editors) the code ends up loading anyway, which limits the payoff. — [jacar.es](https://jacar.es/en/qwik-betting-on-resumability-instead-of-hydration/)

### Inferences
- Resumability pays off for pages with many small interactive handlers over mostly static content. A box running a GPU render loop needs its full runtime as soon as it becomes visible, so resumability gives almost nothing there.
- The cheap idea worth copying is the global delegated listener plus declarative attribute: one document-level listener that reads `data-*` on the target and lazy-`import()`s a module. That is a few dozen lines of code and needs no compiler.

### Gaps
- I could not confirm whether Qwik 2 has a stable release as of Oct 2026, its final package name, or an authoritative qwikloader byte size.

## 3. Deno Fresh islands

### Takeaway
Fresh decides what is an island by file convention: anything in `islands/` is SSR'd and hydrated with Preact, and everything else ships no JS. Props must be serializable, with JSX and Preact Signals allowed, which lets signals act as cross-island shared state.

### Cited Findings
- Islands live in `islands/` or `routes/(_islands)`, with PascalCase or kebab-case names. They render on the server and hydrate on the client. — [Fresh: Islands](https://usefresh.dev/docs/concepts/islands)
- Allowed prop types:
  - primitives, Uint8Array, URL, Date, RegExp, Map, Set
  - plain objects and arrays
  - JSX elements, passed as a prop or as children
  - Preact Signals, if the inner value is serializable
- Circular references are supported. "Passing functions to an island is not supported." Islands can nest. — [Fresh: Islands](https://usefresh.dev/docs/concepts/islands)
- Docs moved from fresh.deno.dev to usefresh.dev (301 redirect). The version selector shows 2.3.3 and 1.7.3. — [Fresh: Islands](https://usefresh.dev/docs/concepts/islands)

### Inferences
- Passing the same signal object to two islands works as a shared store, because serialization preserves identity (circular-reference support implies a reference table). This is the same pattern as Astro + Nano Stores.

### Gaps
- The Fresh islands page does not document its hydration boundary markers (HTML comments vs elements). Not verified.

## 4. Lit and native custom elements: lifecycle, slots, reactive updates, size

### Takeaway
Native custom elements provide the lifecycle hooks (`constructor`, `connectedCallback`, `disconnectedCallback`, `attributeChangedCallback`) and `<slot>` projection through shadow DOM. Lit (~5 KB) adds batched microtask re-rendering and lit-html's template-part updates. Lit's reactive-controller protocol is small enough to copy into Eloi as its box-runtime interface, without depending on Lit.

### Cited Findings
**Lit size and templating**
- Lit is "around 5 KB (minified and compressed)". Its templates are `html` tagged template literals. It updates only the dynamic parts instead of diffing a virtual tree. — [lit.dev docs](https://lit.dev/docs/)
- The tag receives arrays of static strings and dynamic values, and Lit builds an internal representation so only changed parts re-render. The templating can be used standalone, outside components. — [Lit templates overview](https://lit.dev/docs/templates/overview/)

**Lit lifecycle** — [Lit lifecycle](https://lit.dev/docs/components/lifecycle/)
- `connectedCallback` starts the first update. `disconnectedCallback` pauses the update cycle and is where external listeners (for example on `window`) should be removed.
- Elements can be reconnected when moved or cached, so external listeners must be re-established in `connectedCallback`.
- Updates are batched and run at microtask timing, before paint.
- Order: `shouldUpdate` → `willUpdate` → `update` (reflects attributes, calls `render`) → `firstUpdated` (once) → `updated` → `updateComplete` promise.

**Reactive controllers** — [Lit reactive controllers](https://lit.dev/docs/composition/controllers/)
- Host API: `addController`, `removeController`, `requestUpdate`, `updateComplete`.
- Controller hooks:
  - `hostConnected`: set up listeners and observers.
  - `hostUpdate`: read DOM before it changes.
  - `hostUpdated`: read DOM after it changes.
  - `hostDisconnected`: clean up.
- Controllers are not mixins: several instances can attach to one host. Any object implementing the host API can host them.
- Examples: a ClockController with an internal timer, and a ResizeController using ResizeObserver.

**Shadow DOM basics** — [MDN: Using shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)
- `mode: "closed"` makes `host.shadowRoot` return `null`, but it is not a security boundary: extensions can evade it.
- Page styles do not reach into shadow DOM, and shadow styles do not leak out.
- `adoptedStyleSheets` with a constructed `CSSStyleSheet` lets "a single stylesheet... be shared among many DOM trees", parsed once.
- Inheritance follows the flattened tree. `lang`/`dir` inherit from the host when the parent is a shadow root.
- Slotting does not change `parentNode`.

### Inferences
- `connectedCallback`/`disconnectedCallback` are the right place to start and stop a box runtime. Because moves fire disconnect followed by connect (Lit docs), any GPU teardown should be deferred, for example to a microtask or to the next frame after checking `isConnected`. Otherwise reparenting a box would destroy and rebuild a WebGL context.
- (unverified) `Element.prototype.moveBefore()` (state-preserving move, shipped in Chromium around v133) avoids the disconnect/connect churn. Check current cross-browser support before relying on it.
- Lit's value to Eloi is the controller protocol and the lifecycle discipline, not the template engine. Box content is HTML, regl, or GPU, not reactive templated UI.

### Gaps
- I did not fetch a standalone lit-html size figure or the `render(template, container)` API page.

## 5. Style isolation: Shadow DOM vs cascade layers vs @scope; Declarative Shadow DOM for no-JS first paint

### Takeaway
- **Shadow DOM** gives true bidirectional isolation and `<slot>` composition, and with Declarative Shadow DOM it works with zero JS. The costs: styles must be repeated or linked per root, global and theme CSS cannot reach in (only inherited properties and custom properties do), and ARIA ID references across the boundary are only now getting fixed.
- **`@scope`** is now Baseline: Firefox 146 joined in Dec 2025. It gives lightweight, light-DOM subtree scoping with proximity and "donut" holes. That fits frame chrome that must not bleed into box content.
- **`@layer`** orders precedence (framework base < user content); it does not isolate.

For Eloi, the likely combination is light DOM + `@layer` for ordering + `@scope (frame) to (.opening)` donut scoping. Shadow DOM stays opt-in per box for third-party or hostile content.

### Cited Findings
**Declarative Shadow DOM** — [web.dev: Declarative Shadow DOM](https://web.dev/articles/declarative-shadow-dom)
- Syntax: `<template shadowrootmode="open">` inside the host. The parser attaches the root, and streaming content parses straight into it.
- Baseline Newly available since Aug 5, 2024. Support: Chrome/Edge 111, Firefox 123, Safari 16.4.
- Feature detect with `HTMLTemplateElement.prototype.hasOwnProperty('shadowRootMode')`.
- Hydration pattern: in the constructor, check `ElementInternals.shadowRoot` and only `attachShadow()` if it is null. Calling `attachShadow()` on an existing DSD root does not throw; it empties and returns the root.
- `innerHTML` does not parse DSD. Use `setHTMLUnsafe()` / `parseHTMLUnsafe()`.
- Styles in DSD come from `<style>` or `<link>`. Constructable/adopted sheets are not available declaratively. A `<link>` shared across roots is loaded and parsed once.
- Each root belongs to one element, so markup repeats per instance. web.dev says compression makes this cheap.
- Template attributes `shadowrootdelegatesfocus` and `shadowrootclonable` are available. — [MDN: Using shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)

**@scope** — [MDN: @scope](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope)
- Syntax: `@scope (root) to (limit) { … }`. The upper bound is inclusive and the lower bound exclusive (the "donut").
- Inside an inline `<style>`, `@scope { … }` with no prelude scopes to the style element's parent.
- `:scope` targets the root and adds class-level specificity. Bare selectors behave as `:where(:scope) …` and add zero specificity.
- New cascade step, "scoping proximity": the fewest hops to the scope root wins. It beats source order but loses to importance, layers, and specificity. MDN warns `&` handling varies by engine and version.
- Browser status: Firefox 146 (Dec 2025) made `@scope` "Baseline Newly available". — [web.dev: New to the web platform in December 2025](https://web.dev/blog/web-platform-12-2025?hl=en)
  - Caveat: a search summary of that page listed "Chrome 147" for @scope, which conflicts with Chromium's much earlier shipment (unverified, believed Chrome 118, 2023). Treat the Chrome version number in that table as suspect. The Baseline statement itself is reliable.

**Scoped custom element registries**
- Chrome/Edge 146 shipped by default (blog dated Mar 9, 2026), and Safari 26 supports them.
- `new CustomElementRegistry()` is now constructible. A registry can be scoped to a document, shadow root (`attachShadow({customElementRegistry})`), or element. There is a declarative form, `shadowrootcustomelementregistry`, on `<template>`.
- Firefox status conflicts: one listing says not supported, another says Technology Preview/Nightly.
- Source: [Chrome: scoped registries](https://developer.chrome.com/blog/scoped-registries); [binvisions](https://binvisions.com/articles/scoped-custom-element-registries/)

**Accessibility across shadow boundaries**
- Problem: ID references (`aria-labelledby`, `label for`, `popovertarget`, `commandfor`) cannot cross into a shadow root. The ARIAMixin element-reference properties are only a partial fix. — [Nolan Lawson, 2022](https://nolanlawson.com/2022/11/28/shadow-dom-and-accessibility-the-trouble-with-aria/)
- The fix is "Reference Target". A Chromium Intent to Ship (June 2026) followed an origin trial, with positive WebKit/Gecko engagement and prototypes in both engines. Shipping status in stable browsers was not confirmed. Lawson's older cross-root ARIA syntax is superseded. — [blink-dev: Intent to Ship: Reference Target](https://groups.google.com/a/chromium.org/g/blink-dev/c/eBx3sXIfJnw)

### Inferences
**Comparing the three tools for a box's styles**

| | Shadow DOM | `@scope` | `@layer` |
|---|---|---|---|
| Isolation | Bidirectional | One-directional: frame styles stop at `.opening` limits | None; ordering only, so it protects against framework CSS overriding the user's |
| Theming | Only through custom properties and `::part` | Global theme CSS still applies | Global theme CSS still applies |
| Fragment links, ARIA IDs | Breaks them | Unaffected | Unaffected |
| Find-in-page, global queries | Complicates them | Unaffected | Unaffected |
| Specificity | Isolated | Adds proximity, which can surprise | Lets framework rules stay low-priority regardless of specificity |

- For layout: CSS grid placement of a shadow host works normally. Grid applies to the host, and slotted children participate in the host's shadow layout, not the outer grid. A box whose own children must be grid items of the frame therefore cannot sit behind a shadow root without `display: contents` tricks (unverified detail; test it).
- DSD gives Eloi a no-JS first paint even with shadow encapsulation. However, the frame markup would have to be repeated per instance, and theme CSS must be `<link>`ed into each root.

### Gaps
- Exact current support of Reference Target in stable Chrome, Safari, and Firefox as of Oct 2026 is unknown.
- I did not verify Firefox's stable status for scoped registries.
- I did not read MDN's `@layer` page in this pass. The layer semantics above are standard (unverified against a source here).

## 6. Boxes whose content is a canvas with its own render loop

### Takeaway
None of these frameworks has special canvas support. A canvas island is just an island whose "hydration" is creating a GPU context and starting rAF. The relevant mechanisms are visibility-gated start (`client:visible` / IntersectionObserver), cleanup on disconnect, resize observation (Lit's ResizeController pattern), and persistence across navigation (`transition:persist`).

### Cited Findings
- `client:visible` uses IntersectionObserver with an optional `rootMargin` to start early. This maps directly to "don't spin up the GPU map until the box is near the viewport." — [Astro directives](https://docs.astro.build/en/reference/directives-reference/)
- `transition:persist` keeps a stateful element (for example a playing video) alive across navigations. Iframes still reload. — [Astro view transitions](https://docs.astro.build/en/guides/view-transitions/)
- Lit's ResizeController observes element size and calls `requestUpdate`. `hostConnected`/`hostDisconnected` are the documented setup and teardown points. — [Lit controllers](https://lit.dev/docs/composition/controllers/)
- Disconnection pauses Lit's update cycle, and external listeners should be removed there. — [Lit lifecycle](https://lit.dev/docs/components/lifecycle/)

### Inferences
- A render-loop box needs a lifecycle that is a superset of the island one:
  - `mount(el)`: create the context, but don't draw yet.
  - `resume()` / `pause()`: driven by IntersectionObserver and `visibilitychange`, so offscreen boxes stop their rAF.
  - `resize(w, h, dpr)`: driven by ResizeObserver (`devicePixelContentBoxSize` where available, unverified support).
  - `destroy()`: release the context. Browsers cap live WebGL contexts per page (unverified number, commonly about 16). That is a real constraint if many boxes each hold their own context.
- Consider one shared rAF scheduler at the frame level that ticks only active boxes, instead of N independent loops.
- First paint for a canvas box should be a static SVG/PNG poster in the HTML. That gives zero layout shift because the box size comes from the frame grid, not the canvas.

### Gaps
- No primary source in this pass for per-page WebGL context limits, WebGPU device-sharing patterns across multiple canvases, or `moveBefore()` preserving canvas/WebGL state.

## 7. Pitfalls: hydration mismatch, layout shift, inter-island communication, accessibility

### Takeaway
- Hydration mismatch exists only because frameworks re-render server HTML on the client. Eloi avoids it by never re-rendering the server HTML: boxes are either static or mounted runtimes that own their subtree.
- Layout shift is avoided when the container's size does not depend on JS (Astro's server islands rely on fallback content for the same reason).
- Communication should go through a tiny shared store or DOM events, never a framework context.
- Accessibility breaks mainly at shadow boundaries.

### Cited Findings
- Server-island fallback content exists to prevent layout shift while content loads. — [Astro islands](https://docs.astro.build/en/concepts/islands/); [Astro server islands](https://docs.astro.build/en/guides/server-islands/)
- Context providers don't work across islands, and a store under 1 KB (Nano Stores) is the recommended channel. — [Astro sharing state](https://docs.astro.build/en/recipes/sharing-state-islands/)
- Fresh forbids passing functions as island props, so only data crosses the boundary. — [Fresh islands](https://usefresh.dev/docs/concepts/islands)
- Qwik's serialization fails on class instances. The data that crosses the boundary must be designed for serialization. — [Qwik resumable](https://qwik.dev/docs/concepts/resumable/)
- Hydration errors in Astro surface as a cancelable `astro:hydration-error` event per island, so one island failing does not kill the page. — [astro-island.ts](https://raw.githubusercontent.com/withastro/astro/main/packages/astro/src/runtime/server/astro-island.ts)
- ID-based ARIA references cannot cross shadow roots until Reference Target ships. — [blink-dev](https://groups.google.com/a/chromium.org/g/blink-dev/c/eBx3sXIfJnw); [Nolan Lawson](https://nolanlawson.com/2022/11/28/shadow-dom-and-accessibility-the-trouble-with-aria/)

### Inferences
- Error isolation per box is worth copying. Wrap each box `mount()` in try/catch, dispatch an `eloi:box-error` event, and leave the static fallback in place.
- Canvas boxes need an accessible text alternative: `role="img"` + `aria-label`, or a sibling description. A GPU map also needs keyboard focus and controls; that does not come for free.

### Gaps
- None beyond those already listed above.

## 8. Lessons for Eloi (mapping each idea to the frame/box model)

### Takeaway
Eloi's frame *is* an islands layout in which the grid defines the islands. Copy five small mechanisms:
1. a host custom element that reads declarative attributes;
2. per-box trigger strategies;
3. a tiny typed-JSON prop channel;
4. a controller-style lifecycle for box runtimes;
5. a shared store/event bus for cross-box communication.

Explicitly do not copy resumability, compilers, multi-framework renderers, nested-island ordering, or server islands.

### Cited Findings (mechanisms being mapped)
- Astro's host element pattern: an attribute-driven custom element with `component-url`, `props`, `client`, `opts`, and `ssr`, removing `ssr` and firing an event when done. — [astro-island.ts](https://raw.githubusercontent.com/withastro/astro/main/packages/astro/src/runtime/server/astro-island.ts)
- Trigger strategies load/idle/visible/media, with timeout and rootMargin options. — [Astro directives](https://docs.astro.build/en/reference/directives-reference/)
- Controller protocol: `hostConnected`/`hostDisconnected`/`hostUpdate`/`hostUpdated`, plus `addController` and `requestUpdate`. — [Lit controllers](https://lit.dev/docs/composition/controllers/)
- Delegated global listener with lazy chunk import. — [Qwik resumable](https://qwik.dev/docs/concepts/resumable/)
- DSD constructor check pattern via `ElementInternals.shadowRoot`. — [web.dev DSD](https://web.dev/articles/declarative-shadow-dom)
- `@scope` donut scoping is now Baseline. — [MDN @scope](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope); [web.dev Dec 2025](https://web.dev/blog/web-platform-12-2025?hl=en)

### Inferences (proposed mapping; design suggestions, not sourced facts)
| Existing idea | Eloi equivalent |
|---|---|
| `<astro-island>` host + attributes | `<frame-elevation>` holds the grid. Each opening is a light-DOM element (e.g. `<div class="opening" data-box="map" data-runtime="/boxes/map.js" data-when="visible" data-props='…'>`) carrying static fallback HTML/SVG as children. A single shell script scans for `[data-runtime]`. |
| `client:load/idle/visible/media` | `data-when="load|idle|visible|media:(…)"`, with `rootMargin` on visible. Each is about 10 lines (rIC with `setTimeout` fallback, IntersectionObserver, `matchMedia`). Add `interaction` (first pointer/focus) as the Qwik-lite option. |
| Astro `[type, value]` props | Plain JSON is enough for a portfolio. If Map/typed arrays are needed (map tiles, diagram data), copy Astro's type-code tuple reviver (~30 lines). Large data should be fetched by URL, not inlined. |
| `mount(el, frame, opts)` handle | Model the handle on Lit controllers: `{ connected(), disconnected(), resize(rect, dpr), pause(), resume(), destroy(), update(props) }`. The frame acts as the "host": it owns one IntersectionObserver, one ResizeObserver, and one rAF scheduler, and fans out to boxes. |
| Hydration / `ssr` attribute | No hydration. The runtime *replaces or overlays* the fallback inside its box (for example, canvas absolutely positioned over the poster image, poster removed after the first frame). Set `data-state="static|loading|live|error"` on the box for CSS hooks. Since box size comes from the frame grid, mounting causes no layout shift. |
| `astro:hydrate` / `hydration-error` events | Per-box `eloi:box-live` / `eloi:box-error` CustomEvents. Errors leave the fallback in place. |
| Nano Stores / signals across islands | A ~20-line `createStore()` (get/set/subscribe), or DOM CustomEvents bubbling to `<frame-elevation>`. For the city game and isidex, boxes coordinate through the store (e.g. map selection → diagram highlight) and never through shared framework context. |
| Lit `disconnectedCallback` re-connect warning | Debounce teardown: on disconnect, queue `destroy` and cancel it if `isConnected` becomes true again before the next frame. Never lose a GPU context to a DOM move. |
| `transition:persist` | Out of scope for v1 (no client router). If added later, keep the map box element alive across navigations rather than re-mounting. |
| Shadow DOM / DSD | Default to light DOM. Frame chrome CSS goes in `@layer eloi.frame` with `@scope (frame-elevation) to (.opening)`, so frame styles never leak into box content and user CSS (unlayered) always wins. Offer `data-isolate="shadow"` per box for embedding foreign content, rendered as DSD for no-JS paint. Note the costs: no shared adopted sheets declaratively, broken ARIA ID refs, and theme only via custom properties. |
| Scoped registries | Only relevant if boxes host third-party custom elements with name clashes. Note them, but skip for now. |
| Qwik resumability | Skip. Box runtimes are heavy and visible-triggered, so per-handler lazy loading buys nothing. The only borrowable piece is the one-global-listener + `import()` pattern for small interactive bits in static boxes. |
| Server islands | Skip (static portfolio). The fallback-slot idea is already covered by static box content. |

**Scope-creep guardrails derived from the research.** The total shell should stay well under Lit's ~5 KB:
- no templating engine (boxes bring their own);
- no virtual DOM;
- no multi-renderer registry;
- no nesting order;
- no prop encryption.

### Gaps
- No benchmark data was gathered comparing light DOM + `@scope` against shadow DOM style recalculation cost for many boxes.
- WebGL/WebGPU context-sharing strategies across multiple boxes (one device, many canvases) need separate research.
