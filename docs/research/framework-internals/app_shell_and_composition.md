# App Shell and Composition Patterns (micro-frontends, View Transitions, Navigation API, framework-less shells) — notes for Eloi

Research date: 2026-10-11. Sources are mostly primary docs (single-spa.js.org, MDN, developer.chrome.com, web.dev, caniuse, module-federation.io, martinfowler.com, web-fragments.dev, lit.dev, enhance.dev). Where a claim comes from general knowledge and could not be verified with a source in this session, it is in a Gaps section, not stated as fact.

## 1. What is single-spa's lifecycle contract, and how do parcels differ from applications?

### Takeaway
single-spa's contract is small: a registered unit exports async `bootstrap` (once), `mount`, `unmount` (required) plus optional `unload`. The shell passes a fixed props bag (`name`, `singleSpa`, `mountParcel`, `customProps`) and decides *when* to mount via an activity function of the URL. Parcels use the same lifecycle plus an optional `update(props)`, but are mounted imperatively by code, not by the route. That parcel model is the closest analogue to an Eloi box.

### Cited Findings
**Application lifecycle**
- Required lifecycles are `bootstrap`, `mount`, `unmount`; `unload` is optional. "Each lifecycle function must either return a `Promise` or be an `async function`." Exporting an array of functions runs them in sequence, each awaiting the previous one. — [single-spa: Building applications](http://single-spa.js.org/docs/building-applications/)
- Load happens the first time the activity function returns truthy. Docs advise minimal top-level work, with real setup deferred to `bootstrap`. — [single-spa: Building applications](http://single-spa.js.org/docs/building-applications/)
- `bootstrap` runs once before the first mount. `mount` runs when the app is unmounted and its activity function returns truthy. After that, sub-route changes are the app's own job, not new mount calls. — [single-spa: Building applications](http://single-spa.js.org/docs/building-applications/)
- `unmount` runs when the activity function turns falsy. It must clean up DOM, event listeners, globals, and subscriptions. — [single-spa: Building applications](http://single-spa.js.org/docs/building-applications/)
- `unload` runs only when `unloadApplication` is called. Status then returns to NOT_LOADED and the app is re-bootstrapped next time (useful for hot reload). — [single-spa: Building applications](http://single-spa.js.org/docs/building-applications/)
- If `start()` has not been called, apps load but are not bootstrapped, mounted, or unmounted. This separates "fetch code" from "run code". — [single-spa: Building applications](http://single-spa.js.org/docs/building-applications/)
- Props passed to every lifecycle:
  - `name`
  - `singleSpa` (the instance)
  - `mountParcel` (for child parcels)
  - `customProps`: an object, or a function of `(name, window.location)`

  — [single-spa: Building applications](http://single-spa.js.org/docs/building-applications/)
- Per-app `timeouts` export for bootstrap, mount, unmount, and unload, each with `millis`, `dieOnTimeout`, and `warningMillis`. — [single-spa: Building applications](http://single-spa.js.org/docs/building-applications/)

**Error isolation**
- An app that throws during load, bootstrap, mount, or unmount goes to status `SKIP_BECAUSE_BROKEN`. It is "siloed" and skipped while other apps continue. A failed network load gives `LOAD_ERROR`. — [single-spa API docs](https://single-spa.js.org/docs/api/)
- `addErrorHandler(fn)` receives errors from lifecycle and activity functions, tagged with `appOrParcelName`. With no handler, errors are rethrown to window. — [single-spa API docs (zh)](https://zh-hans.single-spa.js.org/docs/api/)
- Caveat: a GitHub discussion reports `addErrorHandler` not catching a failure in `LOADING_SOURCE_CODE` with the layout engine. This is an unconfirmed edge case. — [single-spa discussion #921 mirror](https://git.tdem.in/single-spa/single-spa/discussions/921)
- Activity functions are pure `location -> boolean`. `checkActivityFunctions(mockLocation)` returns which apps should be mounted. — [single-spa API docs](https://single-spa.js.org/docs/api/)

**Parcels**
- Parcels are "mounted by a manual function call rather than the activity function". They can be any size, from a whole app to a component, in any framework. — [single-spa: Parcels overview](http://single-spa.js.org/docs/parcels-overview/)
- Parcel lifecycle:
  - `bootstrap` (optional)
  - `mount` (required)
  - `unmount` (required)
  - `update` (optional), called via `parcel.update(props)`; callers should check that it exists first

  — [single-spa: Parcels overview](http://single-spa.js.org/docs/parcels-overview/)
- `mountParcel` (passed to an app) ties the parcel's life to its parent app, so it auto-unmounts with it. `mountRootParcel` (global) can only be unmounted manually. The docs recommend `mountParcel`. — [single-spa: Parcels overview](http://single-spa.js.org/docs/parcels-overview/)
- Parcel object exposes `update(props)`, `unmount()`, and `mountPromise`. — [single-spa: Parcels overview](http://single-spa.js.org/docs/parcels-overview/)
- The docs say that within one framework you should prefer native components. Parcels are for cross-framework UI sharing. — [single-spa: Parcels overview](http://single-spa.js.org/docs/parcels-overview/)

### Inferences
- Eloi's `mount(el, frame, opts) -> handle{set, signal, play, on, dispose}` already maps to the parcel model:
  - `mount` ≈ mount
  - `set` ≈ update(props)
  - `dispose` ≈ unmount + unload
- What Eloi should borrow from single-spa:
  1. Async lifecycles, so heavy runtimes (WebGPU device acquisition, regl init) can await.
  2. Parent-owned child lifetimes (the `mountParcel` pattern), so disposing a frame disposes every box runtime.
  3. Per-box error status that isolates a crashed runtime instead of killing the page.
  4. Optional timeouts and warnings for slow mounts.
- What to skip: a global registry, activity functions as the sole mount trigger, and SystemJS-style loading. In Eloi the frame, not the URL, decides which boxes exist.
- Splitting load (code fetched) from bootstrap (one-time init) from mount (attach to DOM) matters for heavy runtimes. A map engine can preload its code and shaders while the box is offscreen, then mount instantly.

### Gaps
- `parcel.getStatus()` and `loadPromise` were not confirmed on the fetched page. I believe they exist from the API docs, but did not verify them.
- I did not verify whether single-spa 6.x changed the parcel API.

## 2. Module Federation, import maps, iframes, Web Fragments: how hosts load and isolate guests

### Takeaway
Each approach trades isolation against cost:
- **Module Federation:** solves duplicated dependencies at the bundler level, at the cost of build coupling and version negotiation.
- **Import maps:** a native, zero-runtime way to share one copy of a dependency by URL.
- **Iframes:** total isolation, but awkward for layout, routing, and focus.
- **Web Fragments:** a hidden-iframe JS realm plus shadow-DOM rendering in the main document, so a fragment's runtime is fully discarded on destroy.

For one developer with one shell, import maps (or just a single Vite build with dynamic `import()`) cover nearly everything.

### Cited Findings
**Module Federation**
- Module Federation 2.0 adds a manifest, a Federation Runtime, a runtime plugin system, dynamic type hints, and DevTools on top of webpack 5's export, load, and share core. The guide lists Rspack and webpack. The roadmap includes router, sandbox, and SSR. — [module-federation.io guide](https://module-federation.io/guide/start/index.html)
- Shared dependency options:
  - `singleton`: one version per share scope. On mismatch the higher version loads and the lower side is warned.
  - `requiredVersion`: a lower provided version gives a warning.
  - `eager`: bundles into the entry. The docs recommend lazy loading instead.
  - `shareScope`: names the share scope.

  — [module-federation.io shared config](https://module-federation.io/configure/shared.html)

**Import maps**
- `<script type="importmap">` is Baseline Widely available (cross-browser since March 2023). — [MDN importmap](https://developer.mozilla.org/docs/Web/HTML/Element/script/type/importmap)
- The import map `integrity` field (SRI for modules, including lazily imported ones) shipped in Chrome 127 and Safari 18. — [jspm: JS integrity with import maps](https://jspm.org/js-integrity-with-import-maps)
- Multiple import maps on one page were fixed in the HTML spec, Chromium, and WebKit (Shopify, May 2025). — [Shopify Engineering: Resilient Import Maps](https://www.shopify.com/technology/3029792-lance-loveday-feature-interview-submit-your-questions)
- Firefox's "Support multiple import maps" bug is marked resolved for Firefox 150 (scheduled mid-2026). Verify on MDN before relying on it. — [Mozilla bug 1916277](https://bugzilla.mozilla.org/show_bug.cgi?id=1916277)
- The older warning "Multiple import maps are not yet supported" is outdated.

**Iframes and other integration styles (Fowler)**
- Runtime integration via iframes gives strong style and global isolation, but makes integration, routing, deep-linking, and responsiveness harder. — [Cam Jackson, Micro Frontends (martinfowler.com)](https://martinfowler.com/articles/micro-frontends.html)
- Runtime integration via JS (each bundle exposes an entry function the container calls) is the article's "default choice". Web Components (each micro frontend defines a custom element) is the native variant. — [martinfowler.com](https://martinfowler.com/articles/micro-frontends.html)
- Build-time integration (micro frontends as npm packages) is "strongly" discouraged because it causes lockstep releases. — [martinfowler.com](https://martinfowler.com/articles/micro-frontends.html)

**Web Fragments**
- "Reframing" evaluates a fragment's JS inside a hidden same-origin iframe, a "clean JavaScript context". Destroying the fragment destroys that context, freeing its module registry, timers, and listeners. — [Web Fragments: Reframing](https://web-fragments.dev/documentation/reframing/)
- DOM APIs in that realm are patched so the fragment's DOM operations land in the main document, scoped to the fragment's shadow root. The iframe's `location` is synced with the host. — [Web Fragments: Reframing](https://web-fragments.dev/documentation/reframing/)
- Marketing claims: independent deployability and "no fate-sharing". The site states no tradeoffs. — [web-fragments.dev](https://web-fragments.dev/)

### Inferences
- Eloi's "nothing left after dispose" guarantee is what Web Fragments buys with a whole JS realm. Eloi can get most of it by contract instead:
  - each runtime returns a dispose
  - the shell passes an `AbortSignal` to every runtime and aborts it on dispose, so listeners, `fetch`, and `requestAnimationFrame` loops registered with it die together
  - DOM is limited to the box element
- Real realm isolation (an iframe) should be an opt-in box kind for untrusted or legacy content, not the default.
- WebGL and WebGPU contexts are a special case. Browsers cap live WebGL contexts per page, so dispose must call `loseContext()` / `device.destroy()`. This is from general knowledge; see Gaps.
- Shared dependency duplication (Fowler's main downside) mostly disappears for a single developer. Build each project with the same Vite/TS toolchain and either bundle Eloi into each, or externalize `eloi`, `lit-html`, and `@preact/signals-core` via one import map. Module Federation's version negotiation is not worth it at this scale.

### Gaps
- No primary source confirmed Module Federation's Vite support status or the `createBridgeComponent` app-level lifecycle bridge. The fetched pages did not cover them.
- Web Fragments' performance cost per fragment (an extra iframe realm) is not documented on the pages fetched.
- Exact WebGL context limits per browser were not researched here.

## 3. What problems do micro-frontends create, and which matter for a single-developer multi-project setup?

### Takeaway
Fowler/Jackson list five costs:
- payload size from duplicated dependencies
- global CSS conflicts
- coupling via shared state and communication
- environment drift between standalone and integrated runs
- operational and governance overhead

For one developer, only style leaks, global or leaked runtime state, and duplicated heavy dependencies really matter. Team autonomy, independent deploys, and governance mostly don't.

### Cited Findings
- CSS is global and cascading, so teams' `h2` rules collide. Mitigations include BEM, SASS nesting, CSS Modules or CSS-in-JS, and shadow DOM. "The approach that you pick does not matter all that much" as long as it is predictable. — [martinfowler.com](https://martinfowler.com/articles/micro-frontends.html)
- Shared component libraries should contain "only UI logic, and no business or domain logic". Extract components only after their APIs are proven. — [martinfowler.com](https://martinfowler.com/articles/micro-frontends.html)
- Cross-app communication should be kept to a minimum. Options:
  - custom events: indirect, so the contract is hard to enforce
  - callbacks and data passed down from the container: an explicit contract
  - URL as a shared contract
  - each micro frontend keeping its own store, avoiding shared state

  — [martinfowler.com](https://martinfowler.com/articles/micro-frontends.html)
- Auth is a container concern. The container injects a token into each micro frontend. — [martinfowler.com](https://martinfowler.com/articles/micro-frontends.html)
- Duplicated dependencies increase payload. Externalizing them "re-introduce[s] some build-time coupling". The article says to measure real-world performance. — [martinfowler.com](https://martinfowler.com/articles/micro-frontends.html)
- Operational cost: "you are opting to create many small things rather than one large thing." — [martinfowler.com](https://martinfowler.com/articles/micro-frontends.html)

### Inferences
- **Matters for Eloi:**
  - Style isolation. Each box runtime must not leak CSS out or receive unintended CSS in. Use shadow roots, `@scope`, or prefixed/layered CSS.
  - Global leaks such as window listeners, rAF loops, `ResizeObserver`s, and GPU contexts. The no-globals and dispose guarantees address these.
  - One copy of signals. `@lit-labs/signals` warns that `signal-polyfill` must exist only once per app ([lit.dev signals](https://lit.dev/docs/data/signals/)). The same holds for `@preact/signals-core`: two copies mean two separate reactive graphs.
  - Explicit, typed in and out channels, which Fowler prefers over implicit custom events.
- **Doesn't matter much:** independent deploy pipelines, multiple framework versions, shared-library governance, and BFF-per-fragment.

### Gaps
- No quantitative data on how much CSS isolation strategies (shadow DOM vs `@scope`) cost at runtime.

## 4. How does the View Transitions API work (same- and cross-document), what is supported in 2026, and how can it animate box changes?

### Takeaway
- **Same-document transitions** (`document.startViewTransition`) are Baseline Newly available since Firefox 144 (October 2025).
- **Cross-document transitions** (`@view-transition { navigation: auto }`) work in Chrome/Edge 126+ and Safari 18.2+. Firefox has only partial support (144+) and the feature is an Interop 2026 focus area.
- **Element-scoped transitions** (`Element.startViewTransition`) are the most important development for Eloi. They shipped in Chrome 147 (March 2026), allow concurrent and nested transitions per subtree, and are currently Chromium-only.

### Cited Findings
**Same-document API**
- `document.startViewTransition()` returns a `ViewTransition`. The API snapshots old and new states, animates between them, blocks interaction with old content, and cleans up. — [MDN View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- Pseudo-element tree:
  - `::view-transition`
  - `::view-transition-group()`
  - `::view-transition-image-pair()`
  - `::view-transition-old()`
  - `::view-transition-new()`

  — [MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- Naming and styling hooks:
  - `view-transition-name` gives an element its own snapshot (with `match-element` for lists)
  - `view-transition-class` adds a styling hook
  - transition types via `ViewTransitionTypeSet` and `:active-view-transition-type()`

  — [MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)

**Cross-document**
- `@view-transition` opts both documents in. `pageswap` fires on the old document before unload, with access to the transition and navigation info. `pagereveal` fires on first render of the new document. `<link rel="expect">` blocks rendering until key content is parsed. — [MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- Same-document transitions became Baseline Newly available when Firefox 144 shipped `document.startViewTransition(updateCallback)` and `view-transition-name`. — [web.dev, Oct 16 2025](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available)
- caniuse for cross-document view transitions:
  - Chrome 126+
  - Edge 126+
  - Safari 18.2+
  - Firefox: disabled by default in 143, "partial support" 144–160
  - global usage: 86.77% full, 88.81% including partial

  — [caniuse](https://caniuse.com/cross-document-view-transitions)
- Cross-document view transitions, `rel="expect"`, and `blocking="render"` are an Interop 2026 focus area. — [Mozilla Hacks: Launching Interop 2026](https://hacks.mozilla.org/2026/02/launching-interop-2026/)

**Element-scoped transitions (Chrome 147)**
- `el.startViewTransition({ callback })` makes `el` the scope. Only its subtree is searched for named elements. Only the scope's rendering pauses. The `::view-transition` tree attaches to the element, not `:root`. Content outside stays interactive and correctly layered (for example popovers and fixed elements). — [Chrome docs: element-scoped view transitions](https://developer.chrome.com/docs/css-ui/view-transitions/element-scoped-view-transitions)
- Shipped in Chrome 147 (blog dated March 27, 2026). It was available for testing from Chrome 140, and defaults changed after CSSWG feedback. — [Chrome blog](https://developer.chrome.com/blog/element-scoped-view-transitions)
- Concurrency and isolation:
  - Transitions with non-overlapping scopes run concurrently.
  - The same `view-transition-name` can be reused in different scopes.
  - Calling it again on the same element skips the running transition.

  — [Chrome docs](https://developer.chrome.com/docs/css-ui/view-transitions/element-scoped-view-transitions)
- `view-transition-scope: none | <names> | all` keeps names inside a subtree and stops outer transitions from capturing its internals. Active scopes get `view-transition-scope: all` automatically. The docs recommend putting it on reusable component wrappers. — [Chrome docs](https://developer.chrome.com/docs/css-ui/view-transitions/element-scoped-view-transitions)
- During a scoped transition the UA applies these to the scope root:
  - `contain: layout`
  - `view-transition-name: root` (self-participating)
  - `view-transition-group: contain`

  Opt out with `view-transition-name: none`. — [Chrome docs](https://developer.chrome.com/docs/css-ui/view-transitions/element-scoped-view-transitions)
- Limitations:
  - An element can take part in only one active transition at a time. Conflicting new transitions are skipped.
  - Nested groups overlay classic scrollbars (crbug 475236700).

  — [Chrome docs](https://developer.chrome.com/docs/css-ui/view-transitions/element-scoped-view-transitions)

### Inferences
- **Frame-level changes** (the grid template changes, boxes resize or move) suit a document-level transition. Give each box wrapper a stable `view-transition-name` derived from its box id (for example `eloi-box-<id>`). The grid change then animates as boxes morphing position and size. Transition types (e.g. `frame-change` vs `content-swap`) let CSS pick different animations.
- **Content changes inside one box** (a route changes only the "main" box) suit `box.startViewTransition()` where supported. A WebGL map box in another region keeps rendering and stays interactive. Fallback: `document.startViewTransition` with names on the changed box only, or no transition.
- Put `view-transition-scope: all` on each box root by default. This enforces Eloi's "scoped" guarantee for animation names too: a hosted runtime's internal names cannot collide with the frame's.
- Canvas boxes (regl, WebGL, WebGPU) are snapshotted as images during a transition. Live rendering shows only in `::view-transition-new` once the update callback resolves. Heavy runtimes should not be in the snapshotted set unless intended. This follows from the snapshot model; see Gaps.
- `play(motion)` on the host handle could wrap `startViewTransition` with types. Using `finished` and `updateCallbackDone` lets the shell sequence unmount and mount around the animation.
- Cross-document transitions matter only if Eloi pages are separate HTML documents (an MPA, or Enhance-style). For the portfolio SPA, same-document transitions are enough.

### Gaps
- No confirmed Firefox or Safari status for element-scoped view transitions (the Chrome docs do not cover other browsers).
- MDN's compatibility table did not load, so exact per-feature versions beyond caniuse were not verified (e.g. `view-transition-class` and types in Safari and Firefox).
- How canvas, WebGL, and WebGPU content behaves in snapshots (live vs frozen during the animation) was not verified from a primary source.

## 5. What does the Navigation API offer over the History API?

### Takeaway
The Navigation API, Baseline Newly available since January 2026 (Firefox 147, Safari 26.2; Chrome/Edge since 102), replaces "pushState + popstate + click hijacking" with one `navigate` event. That event fires for links, forms, back/forward, and programmatic navigation. You intercept it with an async handler that gets an `AbortSignal`, built-in scroll and focus handling, and success or error events. A small Eloi router can be about 50 lines on top of it.

### Cited Findings
- Navigation API reached Baseline Newly available in January 2026 with Firefox 147 and Safari 26.2. Chrome and Edge support it since 102. — [web.dev: New to the web platform in January 2026](https://web.dev/blog/web-platform-01-2026); [InfoQ, May 2026](https://infoq.com/news/2026/05/navigation-api-browser)
- History API problems:
  - only `popstate` plus `pushState`/`replaceState`
  - SPAs must hook link clicks by hand, missing forms and dynamically added links
  - confusing frame edge cases
  - no way to list or identify entries

  — [Chrome docs: Navigation API](https://developer.chrome.com/docs/web-platform/navigation-api)
- `NavigateEvent` fields:
  - `canIntercept` (false for cross-origin and cross-document traversals)
  - `destination.url`
  - `hashChange`
  - `downloadRequest`
  - `formData`
  - `navigationType`: push, replace, reload, or traverse
  - `signal`: an AbortSignal that fires when the navigation is superseded

  — [Chrome docs](https://developer.chrome.com/docs/web-platform/navigation-api)
- `intercept({ handler, focusReset, scroll })`:
  - The handler's promise decides success or failure.
  - Scroll restoration and focus reset are automatic by default.
  - Opt out with `scroll: "manual"` (and call `event.scroll()` early) or `focusReset: "manual"`.

  — [Chrome docs](https://developer.chrome.com/docs/web-platform/navigation-api)
- `preventDefault()` cancels non-traversal navigations, but not back/forward, so users cannot be trapped. — [Chrome docs](https://developer.chrome.com/docs/web-platform/navigation-api)
- Other surfaces:
  - `navigation.transition` tracks an in-flight navigation
  - `navigatesuccess` and `navigateerror` (which also receives handler exceptions)
  - `navigation.entries()` and `currentEntry` (with `key` and `getState()`)
  - a per-entry `dispose` event
  - `updateCurrentEntry()`
  - `navigate()`, `reload()`, `back()`, `forward()`, and `traverseTo(key)`, which all return `{ committed, finished }`

  — [Chrome docs](https://developer.chrome.com/docs/web-platform/navigation-api)
- The `navigate` event does not fire on initial page load. The API is scoped to a single frame. — [Chrome docs](https://developer.chrome.com/docs/web-platform/navigation-api)
- `intercept()` also accepts a `precommitHandler`, which receives a `NavigationPrecommitController` and can cancel or redirect before the URL commits. WebKit tracked implementing it in June 2025. — [MDN NavigateEvent.intercept](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/intercept); [MDN NavigationPrecommitController.addHandler](https://developer.mozilla.org/docs/Web/API/NavigationPrecommitController/addHandler); [WebKit bug 293952](https://bugs.webkit.org/show_bug.cgi?id=293952)

### Inferences
- The user's plan says "History-API router". In late 2026 the Navigation API is the better primitive for a new shell. It gives:
  - one intercept point, including back/forward and forms
  - an `AbortSignal` that lines up with Eloi's dispose signal, so an aborted navigation cancels box loads
  - built-in scroll and focus a11y
  - committed/finished promises that line up with `ViewTransition.finished`
- Keep a tiny History API fallback only if supporting browsers older than January 2026 releases matters. Since Baseline is "Newly" (not "Widely") available, older Safari and Firefox users exist through roughly mid-2028.
- Pattern: inside the `intercept` handler, call `document.startViewTransition(() => applyRoute(url))`. Or, with scroll set to manual, call `event.scroll()` after the transition.

### Gaps
- The Chrome version and cross-browser status of `precommitHandler` were not confirmed.

## 6. What does a minimal framework-less app architecture look like in practice?

### Takeaway
Two families exist:
- **Server-first HTML** (Enhance, HTMX-style): pages are server-rendered files, with custom elements or attributes progressively enhanced.
- **Thin client shell** (lit-html + signals + a small router): templates are tagged literals, state is signals, and the router maps URLs to view functions.

Both keep the runtime to a few small libraries and use web platform primitives (custom elements, shadow DOM, Navigation/View Transitions) instead of a framework runtime.

### Cited Findings
- Enhance is "an HTML-first full-stack web framework" for multi-page apps:
  - file-based routes (`app/pages/index.html` → `/`, `about.html` → `/about`)
  - reusable elements in `app/elements/` as "HTML custom element pure functions", server-expanded wherever the tag appears
  - start with `.html` elements and move to `.mjs` only when dynamic

  — [enhance.dev docs](https://enhance.dev/docs/)
- `@lit-labs/signals` integrates Lit with the TC39 Signals proposal via `signal-polyfill`:
  - `SignalWatcher` mixin, the `watch()` directive, and an auto-watching `html` tag
  - experimental, with planned `@computed` and `@effect` and no signal-aware `repeat()` yet
  - the polyfill must exist only once per app
  - Lit recommends it over `@lit-labs/preact-signals`

  — [lit.dev: Signals](https://lit.dev/docs/data/signals/)
- Fowler's runtime-via-JS pattern (each unit exposes a render or mount function the container calls) is the default lightweight composition model. — [martinfowler.com](https://martinfowler.com/articles/micro-frontends.html)

### Inferences
- A practical portfolio structure under Eloi:
  - `shell.ts`: router built on the Navigation API, frame selection, Supabase client
  - `frames/*.ts`: frame definitions compiled to CSS grid
  - `boxes/*.ts`: each exports `mount(el, ctx) -> {update?, dispose}` using lit-html `render()` and `@preact/signals-core` `effect()`
  - `content/`: Supabase queries
- Dynamic `import()` per box kind gives code splitting with no federation layer.
- Signals choice: the user picked `@preact/signals-core` (stable). `@lit-labs/signals` follows TC39 but is experimental. Pick one and keep it a single copy; consider exposing it through Eloi so hosted apps don't bring a second graph.
- Enhance's lesson for Eloi is mostly philosophical: plain HTML first, upgrade to JS only when a box needs behavior. An Eloi box kind of "static HTML" with zero JS lifecycle would honor that.

### Gaps
- Bundle sizes were not verified in this session. My general recollection, unverified: lit-html is about 3 KB min+gz, `@preact/signals-core` about 1.5–2 KB, and htmx 2.x in the low tens of KB. Treat these as approximate and check bundlephobia or the package pages.
- HTMX docs and the Enhance Element (client-side) / Enhance Styles scoping docs were not fetched.
- Router library examples (e.g. `@lit-labs/router`, Navigo, `URLPattern`-based routers) were not researched. Note that `URLPattern` availability across browsers was not checked.

---

## Lessons for Eloi (synthesis)

This section is design inference, built on the cited findings above.

### A. Minimal box/runtime lifecycle contract
Model boxes on single-spa parcels, minus the registry:

```ts
interface BoxRuntime<I = unknown, O = unknown> {
  // optional, once per runtime kind: fetch code, compile shaders, warm caches
  load?(): Promise<void>;
  // required: render into `el`; everything you register uses ctx.signal
  mount(el: HTMLElement, ctx: BoxContext<I, O>): void | Promise<void>;
  // optional: inputs changed (parcel.update analogue)
  update?(input: Partial<I>): void;
  // optional: shell-driven activity changes
  // (offscreen / hidden / reduced motion) -> pause rAF, GPU work
  suspend?(): void;
  resume?(): void;
  // required: tear down; must leave zero DOM/listeners/GPU contexts
  unmount(): void | Promise<void>;
}

interface BoxContext<I, O> {
  signal: AbortSignal;  // aborted on dispose: listeners, fetch, rAF loops
  input: ReadonlySignal<I>;  // or plain props + update()
  emit<K extends keyof O>(event: K, payload: O[K]): void;  // explicit out-channel
  size: ReadonlySignal<{ w: number; h: number }>;  // shell-owned ResizeObserver
  box: { id: string; frame: string };
}
```

- Async `mount` and `unmount`, as in single-spa, because WebGPU/regl setup is async.
- The shell owns `ResizeObserver`, `IntersectionObserver`, and visibility tracking. It calls `suspend`/`resume`, which implements "no work while idle" once instead of per runtime.
- The shell owns lifetimes (the `mountParcel` pattern): disposing the frame handle disposes all boxes in reverse order.
- Error isolation: wrap each lifecycle call. A throw marks the box `broken`, renders a fallback in that box only, and reports via `on('error')`. This is the `SKIP_BECAUSE_BROKEN` idea. Optional mount timeouts with warnings.
- In and out channels stay typed and explicit: the shell passes data down and the box emits upward. Fowler recommends this over global custom events.
- Shared state: no global store. If two boxes must share, the shell creates a signal and passes it to both explicitly.
- Styles: each box root gets a shadow root or `@scope`, plus `view-transition-scope: all`.
- Static-HTML boxes need no lifecycle at all (the Enhance lesson).

### B. Routing vs frame changes
- **The router owns the URL. Frames are a function of route state.** `route -> { frame, boxInputs }`. A frame change is a diff:
  - boxes present in both frames are kept and get `update()`
  - removed boxes are unmounted
  - new boxes are mounted
  - stable box ids are what make this diff and view-transition naming work
- Use the Navigation API (Baseline since January 2026) with a History fallback:
  - `navigate` → `intercept({ handler })`
  - inside the handler, `document.startViewTransition({ update: () => applyFrameDiff(), types: [...] })`
  - pass `event.signal` into box loads, so a superseded navigation aborts them
- A box that hosts a whole app (the city game) may own its own sub-routing. Like single-spa, after mount, sub-route changes are the app's job. Eloi should let a box claim a URL prefix (`ctx.route` signal plus `ctx.navigate()`) rather than let runtimes call `history.pushState` directly, which keeps the "no globals" promise.
- Transitions:
  - Whole-frame changes: a document-level view transition with `view-transition-name: eloi-box-<id>` on box wrappers and types like `frame-change`.
  - Single-box content swaps: `boxEl.startViewTransition()` on Chrome 147+, falling back to a document transition that names only that box, or none.
  - Always skip on `prefers-reduced-motion`.
  - Treat cross-document transitions (Safari 18.2+, Chrome 126+, Firefox partial) as progressive enhancement only.

### C. Micro-frontend complexity to avoid (single developer)
- **Avoid Module Federation** and runtime version negotiation. Use one toolchain, dynamic `import()`, and at most one import map for shared `eloi`, `lit-html`, and signals.
- **Avoid a global app registry and activity functions as the only trigger.** Frames decide box presence. URLs map to frames.
- **Avoid realm or iframe isolation by default.** Offer an `iframe` box kind for third-party or legacy embeds only. Web Fragments-style reframing is overkill.
- **Avoid a shared global store or event bus.** Use explicit shell-mediated signals instead.
- **Avoid per-box independent deploys and BFFs.** Supabase plus one shell is enough.
- **Keep:** the async lifecycle, parent-owned lifetimes, per-box error isolation, AbortSignal-based cleanup, scoped styles and transition names, and shell-owned resize, visibility, and idle handling. These are the parts of micro-frontend practice that directly enforce Eloi's four guarantees.
