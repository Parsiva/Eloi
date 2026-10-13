# Compiler-first UI frameworks and signal reactivity: internals, with lessons for Eloi

Scope: Svelte 5 (runes and compiler output), SolidJS 1.x and 2.0, Vue Vapor (3.6), Preact Signals, the TC39 Signals proposal, and React's VDOM and scheduler for contrast. Research date: 2026-10-11.

Version status as of Oct 2026, with outdated items flagged:
- **Svelte 5:** stable 5.x line. Some helper names differ between minor versions: compiled examples show `$.template(...)` in 5.20 and `$.from_html(...)` in 5.57.
- **Solid:** 1.x is stable. 2.0 went beta (`v2.0.0-beta.0`, May 2026) and then to Release Candidate. The `@solidjs/signals` core package was still labeled beta (2.0.0-beta.2x). Anything below described as "Solid 1.x internals" may change in 2.0.
- **Vue 3.6:** release candidate (rc.1 through at least rc.7 by Sep 2026). I could not verify a stable 3.6 release; a Chinese blog claims it shipped.
- **TC39 Signals:** Stage 1. The README itself says it "can be thought of as 'Stage 0'". Only a polyfill exists, with no native implementation.
- **React:** the scheduler description is based on the current `main` branch source.

---

## 1. What does the Svelte 5 compiler emit, and how do runes/signals drive DOM updates? Runtime size?

### Takeaway
Svelte 5 compiles a component into three parts:
- a module-level static HTML template that is cloned per instance;
- a component function that runs once, walks to the dynamic nodes, and keeps references to them;
- one or more `template_effect`s that read signals (`$.get`) and patch exactly those nodes (`$.set_text`, attribute setters).

Runes (`$state`, `$derived`, `$effect`) are compiler symbols that lower to runtime signal calls. The dependency graph is built at runtime, not by the compiler. Effects are flushed in microtask-scheduled `Batch` objects. There is no requestAnimationFrame.

### Cited Findings
- Runes (`$state`, `$derived`, `$effect`, ...) are compiler symbols that use function syntax. They replace Svelte 3/4's `let`/`=`/`export`/`$:` reactivity. They also work in `.svelte.js`/`.svelte.ts` modules, not just components. — [Svelte blog: Introducing runes](https://svelte.dev/blog/runes)
- Signals are an internal implementation detail of Svelte 5, not a user API. For SSR compilation the signals are dropped entirely. — [Svelte blog: runes](https://svelte.dev/blog/runes)
- Key shift: Svelte 3/4 had compile-time dependency analysis, which could break on refactors because the compiler only saw dependencies written lexically in `$:`. In Svelte 5, `$derived`/`$effect` discover dependencies when they are evaluated, which is runtime tracking. — [Svelte blog: runes](https://svelte.dev/blog/runes)
- Compiled output pattern:
  - `$.from_html(...)` (`$.template(...)` in older 5.x) creates a module-level static fragment, and `root()` clones it per instance.
  - Each dynamic binding becomes code inside `$.template_effect(() => { ... })` that calls e.g. ``$.set_text(text, `Hello ${$.get(name) ?? ''}`)``.
  - Only that text node is touched when `name` changes; the component is not re-rendered.
  - Sources: [arc.dev: Why Svelte is fast](https://arc.dev/employer-blog/?p=5374), [Svelte playground output](https://svelte.dev/playground/761a0a6cc2834afb842942e1d23875b1), [joyofcode Svelte 5 course](https://joyofcode.xyz/learn-svelte)
- `$effect` timing:
  - It runs after mount, and then "in a microtask after state changes".
  - Re-runs happen after DOM updates are applied, and `$effect.pre` runs before them.
  - Re-runs are batched: changing two inputs in the same tick causes one run.
  - Source: [Svelte docs: $effect](https://svelte.dev/docs/svelte/$effect)
- `$effect` dependencies:
  - Only synchronous reads in the body (including through function calls) are tracked. Reads after `await` or inside `setTimeout` are not.
  - Dependencies are recomputed on each run.
  - A returned teardown runs before each re-run and on destroy (unmount or parent effect re-run).
  - `$effect.root` creates an untracked scope with manual disposal, and lets effects exist outside component init.
  - `$effect.tracking()` reports whether code is running in a tracking context.
  - Source: [Svelte docs: $effect](https://svelte.dev/docs/svelte/$effect)
- Scheduler (`packages/svelte/src/internal/client/reactivity/batch.js`), batching and flags:
  - State writes join a `Batch` with `current`/`previous` value maps and a `#scheduled` effect array. Batches form a linked list.
  - `Batch.ensure()` creates the current batch and, outside `flushSync`, queues a microtask to `flush()`.
  - Effects carry flags `DIRTY` / `MAYBE_DIRTY` / `CLEAN`.
  - Source: [svelte batch.js](https://raw.githubusercontent.com/sveltejs/svelte/main/packages/svelte/src/internal/client/reactivity/batch.js)
- Scheduler, how a flush runs (same source):
  - `#resolve()` walks each scheduled effect up to its `ROOT_EFFECT`/`BRANCH_EFFECT` ancestors and marks the path.
  - `#traverse()` skips clean branches and `INERT` effects, runs dirty block effects inline, and collects render effects and user effects.
  - On commit it flushes `render_effects` first, then `effects`.
  - An infinite-loop guard triggers past 1000 flush iterations.
  - `flushSync(fn)` forces synchronous flushing.
  - The file has no `requestAnimationFrame`.
- Newer 5.x adds async machinery to the batch system: pending async work counters, `settled()`, `fork(fn)` / `commit()` / `discard()` for speculative batches whose values are held out of `source.v`, and `eager(fn)`. This is complexity Eloi does not need. — [svelte batch.js](https://raw.githubusercontent.com/sveltejs/svelte/main/packages/svelte/src/internal/client/reactivity/batch.js)

### Inferences
- In Svelte 5 the compiler does only the *structural* work: template hoisting, node addressing, and which expression feeds which DOM setter. Reactivity (what depends on what) is fully runtime. This split is close to what Eloi's "compile what doesn't depend on the live page" implies.
- Svelte's Batch/fork/async growth shows how scheduler scope creeps once async data and transitions are in scope.

### Gaps
- No authoritative current figure was found for Svelte 5's client runtime size (min+gz) or per-component overhead. Svelte's own blog makes no size claim. Measure it with a build rather than trusting secondhand figures.
- The exact node-walking helpers (e.g. `$.child`, `$.sibling`, `$.first_child`) were not verified against current source in this session, only through playground snippets.

---

## 2. How does Solid's reactive graph (signals, memos, effects, owner tree, batching) work, and how does it handle disposal?

### Takeaway
Solid 1.x is an S.js-descended synchronous graph:
- Signals hold `observers` arrays with slot indices, and computations hold `sources` with slot indices, so unsubscribing is an O(1) swap-remove.
- A write marks direct observers `STALE` and transitive ones `PENDING`, then queues them into `Updates` (memos) and `Effects`. Queues drain at the end of the outermost `runUpdates`/`batch`.
- An owner tree (`owned`, `cleanups`) handles disposal: disposing a node unlinks it from its sources, disposes its children, and runs its cleanups.

Solid 2.0 (RC) moves to microtask-batched updates with explicit `flush()`, puts async into the graph, and splits effects into compute/apply phases.

### Cited Findings
- Core model:
  - A signal is a getter/setter pair where the read registers the current reactive context as a subscriber.
  - Effects run once on creation and then re-run when a signal they read changes.
  - A memo caches a derived value and is itself a signal.
  - Dependencies are rebuilt on every execution, so a signal no longer read loses its subscriber.
  - Source: [Ryan Carniato: A Hands-on Introduction to Fine-Grained Reactivity](https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf)
- Cleanup must unlink in both directions: the computation removes itself from each signal's subscriber list, then clears its own dependency list. `onCleanup` runs before each re-execution and on final release. DOM rendering is nested effects, so a change re-runs only the nearest affected effect. — [Carniato, dev.to (article and author comments)](https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf)
- Solid aims to be glitch-free (an inconsistent state is never observable) using "a hybrid push/pull approach". Updates run synchronously. — [Carniato, dev.to](https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf)
- Data structures in Solid 1.x `signal.ts` (header: "Inspired by S.js"):
  - `Owner { owned, cleanups, owner, context }`.
  - `Computation extends Owner { fn, state, sources, sourceSlots, value, updatedAt, pure, user }`.
  - `SignalState { value, observers, observerSlots, comparator }`.
  - `state` is 0 (clean), `STALE=1` or `PENDING=2`.
  - Source: [solid signal.ts](https://raw.githubusercontent.com/solidjs/solid/main/packages/solid/src/reactive/signal.ts)
- Propagation:
  - `writeSignal` skips the update if the `comparator` says the value is equal.
  - Otherwise it pushes pure observers (memos) to `Updates` and impure ones to `Effects`, marks them `STALE`, and `markDownstream` marks transitive observers `PENDING`.
  - When a node runs, `runTop` walks up the owner chain and updates stale ancestors top-down. `lookUpstream` resolves `PENDING` nodes by checking their sources. This is the "pull" half that gives glitch-freedom.
  - Source: [solid signal.ts](https://raw.githubusercontent.com/solidjs/solid/main/packages/solid/src/reactive/signal.ts)
- Batching: `runUpdates(fn)` creates the `Updates`/`Effects` arrays if no batch is active, runs `fn`, then `completeUpdates`, which runs memos first and then effects. `batch = runUpdates(fn, false)`. — [solid signal.ts](https://raw.githubusercontent.com/solidjs/solid/main/packages/solid/src/reactive/signal.ts)
- Ordering: render effects (`createRenderEffect`) run before user effects (`createEffect`), which `runUserEffects` collects and runs last. — [solid signal.ts](https://raw.githubusercontent.com/solidjs/solid/main/packages/solid/src/reactive/signal.ts)
- Disposal:
  - `cleanNode` swap-removes the node from its sources' observer lists, disposes `owned` children, runs `cleanups`, and resets state.
  - `createRoot(fn)` creates a root Owner (unowned if `fn` takes no args) and returns `dispose`, which calls `cleanNode` on the root.
  - Source: [solid signal.ts](https://raw.githubusercontent.com/solidjs/solid/main/packages/solid/src/reactive/signal.ts)
- Optional scheduling: `enableScheduling(requestCallback)` plus `startTransition` route transition work through a scheduler, using a `tValue` double-buffer that is committed when no promises are pending. This is opt-in. — [solid signal.ts](https://raw.githubusercontent.com/solidjs/solid/main/packages/solid/src/reactive/signal.ts)
- Solid 2.0, beta (May 2026):
  - Updates are microtask-batched ("fully deterministic"), and reads reflect writes after `flush()`.
  - `createEffect` is split into compute and apply phases.
  - Computations can return Promises that the graph suspends and resumes.
  - `onMount` becomes `onSettled`, `Index` becomes `<For keyed={false}>`, and `use:` directives become `ref` factories.
  - Source: [InfoQ: SolidJS 2.0 Beta](https://www.infoq.com/news/2026/05/solidjs-2-async/)
- Solid 2.0, Release Candidate: the RC notes say the design removes the need for `createResource`, `batch` and transitions in many cases. — [newreleases: solid v2.0.0-rc.0](https://newreleases.io/project/github/solidjs/solid/release/v2.0.0-rc.0)

### Inferences
- The owner tree is the key idea for Eloi's "box hosts its own runtime" model. Each box gets a root owner, and disposing the box disposes every effect, listener and child created under it. This works without a component system.
- Separating "compute" (pure, reads signals) from "apply" (side effects, e.g. DOM or GL writes) in Solid 2.0 matches Eloi's need to batch layout reads and writes and avoid layout thrash.

### Gaps
- I did not verify current Solid 1.x / 2.0 runtime size figures (solid-js runtime plus dom-expressions) in this session.
- I did not fetch details of Solid's compiler (babel-plugin-jsx-dom-expressions: `template()` cloning, `insert`, `effect` wrappers, event delegation). It is known to follow the same template-clone-plus-per-binding-effect pattern as Svelte 5 and Vapor, but that is unverified here.

---

## 3. How does push-pull propagation work (Preact Signals, TC39), including glitch-freedom and lazy evaluation?

### Takeaway
Push-pull works in two phases:
1. **Push:** a write synchronously pushes only a dirty notification down the graph. Nothing is recomputed. Computeds mark themselves outdated, and effects enqueue themselves.
2. **Pull:** when an effect runs, or anyone reads a computed, the value is pulled. Each computed checks its sources' versions in the order it used them and recomputes only if one changed. If the recomputed value is equal, its own version does not bump, so downstream work is cut off.

This gives glitch-freedom, because no one sees a half-updated graph, and laziness, because unobserved computeds never run. TC39 standardizes only the graph (State, Computed, Watcher) and deliberately leaves `effect` and scheduling to frameworks.

### Cited Findings
- Preact Signals dependency tracking: a computed or effect sets itself as the global evaluation context before running. A `.value` read links source and target. Tracking is dynamic, so it reflects the last run only. — [Preact blog: Signal Boosting](https://preactjs.com/blog/signal-boosting/)
- Preact Signals dependency data structure:
  - Sets were replaced with **doubly linked lists of Nodes**. Each Node is one source-target edge, with `source`, `target`, `prevSource`/`nextSource`, `prevTarget`/`nextTarget`.
  - This gives O(1) insert and remove, and keeps dependency order.
  - On re-run, existing nodes are flagged "unused", reused if read again, and purged at the end. Rerunning allocates nothing in the steady state.
  - Source: [Preact: Signal Boosting](https://preactjs.com/blog/signal-boosting/)
- Preact Signals push phase:
  - Notifications pass to direct dependents. Computeds mark themselves outdated, and effects schedule themselves.
  - An already-notified node does not re-forward the notification (stampede control).
  - Writing an equal value does not notify.
  - Scheduled effects are chained through a `.nextBatchedEffect` field, an intrusive singly linked queue, so scheduling allocates nothing.
  - Source: [Preact: Signal Boosting](https://preactjs.com/blog/signal-boosting/)
- Preact Signals pull phase, versioning: each signal has a version, and a **global version counter** increments on any write. A computed decides whether to recompute in this order:
  1. If the global version is unchanged since its last run, it returns the cache.
  2. If it is subscribed and has not been notified, it returns the cache.
  3. It walks its sources in order and compares the stored versions. If none changed, it returns the cache.
  4. Otherwise it recomputes. If the result is equal, its version does not increment, so dependents skip too.
  - Source: [Preact: Signal Boosting](https://preactjs.com/blog/signal-boosting/)
- Preact Signals and GC: a computed subscribes to its sources only while something (e.g. an effect) is listening to it. An unobserved computed is therefore not kept alive by its source and needs no manual dispose. — [Preact: Signal Boosting](https://preactjs.com/blog/signal-boosting/)
- `@preact/signals-core` API: `signal`, `computed`, `effect`, `batch`, `untracked`, plus `.peek()`.
  - `effect()` returns a dispose function, and the callback may return a cleanup that runs before the next run or on dispose.
  - `batch` defers effects until the outermost batch completes. Batches nest, and reading a computed inside a batch gives the current value, updating only what is needed.
  - `signal`/`computed` accept `name`, `watched`, `unwatched` options. `name` feeds `@preact/signals-debug`.
  - Source: [preactjs/signals core README](https://raw.githubusercontent.com/preactjs/signals/main/packages/core/README.md)
- TC39 Signals API: the proposal is Stage 1, with a polyfill in `proposal-signals/signal-polyfill` that the authors call unstable. It offers:
  - `Signal.State` (`get`/`set`);
  - `Signal.Computed` (lazy and memoized: "only evaluated when their value is explicitly requested");
  - `Signal.subtle.Watcher(notify)` with `watch`/`unwatch`/`getPending`;
  - `Signal.subtle.untrack`.
  - Source: [tc39/proposal-signals](https://github.com/tc39/proposal-signals)
- TC39 Signals design choices:
  - It describes itself as a "push-pull" construction.
  - There is deliberately no built-in `effect`: scheduling ties to framework rendering.
  - `notify` is synchronous, and "no signals may be read or written during the notify". Frameworks defer work, e.g. via `queueMicrotask`, and then pull `getPending()`.
  - Source: [tc39/proposal-signals](https://github.com/tc39/proposal-signals)
- Vue 3.6 rewrote `@vue/reactivity` on **alien-signals**, a push-pull library, citing performance and memory gains. This applies to all 3.6 apps. — [Vue v3.6.0-rc.1 release notes](https://newreleases.io/project/github/vuejs/core/release/v3.6.0-rc.1)
- A reported ~14% memory reduction for Vue 3.6 vs 3.5 is unverified. — [speakerdeck (JP)](https://speakerdeck.com/hiranuma/alien-signals-noshi-jian-topahuomansuzui-shi-hua?slide=24)

### Inferences
- `@preact/signals-core` is a good fit for Eloi as-is. It gives push-pull with version short-circuiting, intrusive linked lists (zero steady-state allocation), auto-unsubscribing lazy computeds, synchronous effects after outermost `batch`, and `watched`/`unwatched` hooks. The hooks are useful for starting or stopping a ResizeObserver or rAF loop only while someone listens.
- TC39's Watcher model, "notify synchronously, flush later", is the right shape for Eloi's frame scheduler. Preact signals-core has no Watcher, but Eloi can get the same shape from one `effect` per box that only marks the box dirty and requests a frame.

### Gaps
- I did not verify a current min+gz size for `@preact/signals-core` (commonly cited at ~1.5–2 kB). Bundlephobia did not render. Measure it in Eloi's build.
- The current signals-core major version was not confirmed in this session.

---

## 4. How do these frameworks schedule work relative to rAF/microtasks, and how do they avoid work when idle?

### Takeaway
None of the signal frameworks use requestAnimationFrame for reactive propagation:
- Preact signals-core and Solid 1.x run effects synchronously at the end of the outermost batch.
- Svelte 5, Solid 2.0 and Vue flush in a microtask.
- React's scheduler uses a MessageChannel time-sliced loop, not rAF.

Idle cost is zero in all of them because work exists only when a write enqueues something. There is no polling or diffing loop. Frame-aligned work (animation) is left to the app.

### Cited Findings
- Svelte 5: effects re-run "in a microtask after state changes". The batch flushes from a queued microtask, `flushSync` forces a synchronous flush, and there is no `requestAnimationFrame` in the scheduler. — [Svelte $effect docs](https://svelte.dev/docs/svelte/$effect); [svelte batch.js](https://raw.githubusercontent.com/sveltejs/svelte/main/packages/svelte/src/internal/client/reactivity/batch.js)
- Solid 1.x is synchronous: queues drain at the end of the outermost `runUpdates`/`batch`. A requestCallback scheduler is used only for opt-in transitions. — [solid signal.ts](https://raw.githubusercontent.com/solidjs/solid/main/packages/solid/src/reactive/signal.ts)
- Solid 2.0 is microtask-batched, with explicit `flush()`. — [InfoQ](https://www.infoq.com/news/2026/05/solidjs-2-async/)
- Preact signals: effects run when the outermost `batch` completes, or immediately on a write outside a batch. — [preact signals core README](https://raw.githubusercontent.com/preactjs/signals/main/packages/core/README.md)
- TC39: the sync `notify` cannot touch signals. Frameworks schedule a flush, and the proposal's example uses a microtask while warning that the example scheduling is too simplistic to copy. — [tc39/proposal-signals](https://github.com/tc39/proposal-signals)
- React scheduler, task queues:
  - It keeps a min-heap `taskQueue` sorted by `expirationTime` (startTime plus priority timeout) and a `timerQueue` for delayed tasks.
  - There are five priorities, from Immediate (timeout -1) to Idle (timeout `maxSigned31BitInt = 1073741823`).
  - Source: [React Scheduler.js](https://raw.githubusercontent.com/facebook/react/main/packages/scheduler/src/forks/Scheduler.js)
- React scheduler, yielding:
  - `shouldYieldToHost` yields after `frameInterval` (`frameYieldMs`) or when paint is requested.
  - The host loop uses `setImmediate`, then `MessageChannel` ("We prefer MessageChannel because of the 4ms setTimeout clamping"), then `setTimeout`.
  - It never uses `requestAnimationFrame`.
  - Source: [React Scheduler.js](https://raw.githubusercontent.com/facebook/react/main/packages/scheduler/src/forks/Scheduler.js)
- Contrast: React re-runs component functions to produce a new virtual tree and reconciles (diffs) it against the previous fiber tree. Time slicing exists because that diff can be large. Signal frameworks skip both, because the compiler or runtime already knows which node each value feeds. This is an inference from the mechanisms above. React's reconciler internals were not fetched in this session; see Gaps.

### Inferences
- For Eloi, keep reactive propagation synchronous or microtask-based (cheap, deterministic). Add **one** rAF-driven "frame" flush that only runs while something is dirty or animating, for layout measurement and the "moment" stage. This makes "idle when nothing changes" structural: no rAF is requested unless an effect marked something dirty or a motion is active.
- Avoid time slicing and priorities (React's scheduler). Eloi's per-frame work is small and bounded, so this is pure complexity.

### Gaps
- The `frameYieldMs` value (historically 5 ms) was not visible in the fetched file. The fiber reconciler and lanes were not researched here.

---

## 5. Where does build-time compilation stop and runtime begin? What is "compile what you can" taken to its limit?

### Takeaway
All three compiler-first systems (Svelte 5, Solid's JSX compiler, Vue Vapor) converge on the same split:
- **Build time:** the static DOM structure (as a cloneable HTML string), paths to dynamic nodes, and which expression maps to which DOM setter.
- **Runtime:** dependency tracking, propagation, scheduling, list reconciliation and cleanup.

Svelte 3/4 pushed dependency analysis into the compiler too, and Svelte 5 backed away from it because lexical analysis broke under refactoring. Taken to its limit, "compile what you can" means emitting zero runtime for static content. Svelte SSR does this: it drops signals entirely.

### Cited Findings
- Svelte 5: static markup is hoisted as a template string cloned per instance, and per-binding effects patch specific nodes. — [arc.dev](https://arc.dev/employer-blog/?p=5374); [Svelte playground](https://svelte.dev/playground/761a0a6cc2834afb842942e1d23875b1)
- Svelte 3/4 compile-time dependency tracking was replaced by runtime tracking in Svelte 5 because refactoring could hide dependencies from the compiler. — [Svelte blog: runes](https://svelte.dev/blog/runes)
- Svelte SSR output omits signals entirely. — [Svelte blog: runes](https://svelte.dev/blog/runes)
- Vue Vapor compiled output (third-party illustration, version unspecified): `delegate(n1, 'click', ...)` and `renderEffect(() => setText(n0, 'Count: ', count.value))`, returning node refs. This is the same template-plus-per-binding-effect pattern. — [juejin article](https://juejin.cn/post/7389064690125766708) via [search summary]; see also [Vue Mastery: future of Vapor](https://vuemastery.com/blog/the-future-of-vue-vapor-mode)
- Vue Vapor modes and interop:
  - Opt-in per SFC (`<script setup vapor>`, `<template vapor>`). Composition API only, no Options API.
  - `createVaporApp` excludes the VDOM runtime ("drastically reduced" baseline size, no figure given).
  - `vaporInteropPlugin` allows mixing Vapor and VDOM components but pulls in the VDOM runtime.
  - Source: [Vue v3.6.0-rc.1 notes](https://newreleases.io/project/github/vuejs/core/release/v3.6.0-rc.1)
- Vue Vapor limits and claims:
  - Unsupported: `getCurrentInstance()` (returns null), `v-memo`, `globalProperties`, and others.
  - Events are delegated to `document`, so an ancestor's `stopPropagation()` can block them.
  - Claimed performance parity with Solid and Svelte 5 on js-framework-benchmark. This is vendor-reported.
  - Source: [Vue v3.6.0-rc.1 notes](https://newreleases.io/project/github/vuejs/core/release/v3.6.0-rc.1)

### Inferences
- Eloi's stage tags map onto this split cleanly:
  - **design:** pure compile output, i.e. a CSS grid and static HTML/CSS strings with zero runtime.
  - **load:** one-shot runtime init, without signals.
  - **layout** and **moment:** signals and effects.
  - The compiler can drop reactivity for any value proven to be design- or load-stage, which is the same trick as Svelte SSR dropping signals.
- Don't make the compiler infer dependencies (the Svelte 3/4 lesson). Let the compiler decide *where* values go (which CSS var, attribute or uniform), and let runtime signals decide *when*.
- Prefer CSS custom properties as the DOM sink for layout and motion values. One `style.setProperty` per changed parameter lets the browser's style engine do the "rendering", so Eloi needs no template diffing at all.

### Gaps
- No official Vapor compiler output or baseline size number was found. Use the Vue SFC playground with vapor mode to verify.

---

## 6. Tradeoffs: debugging, interop with non-framework code (WebGL engine), mounting into elements owned by others

### Takeaway
Fine-grained signals interoperate well with imperative engines:
- an effect is just a function that calls the engine;
- `peek`/`untracked` avoid accidental subscriptions;
- owner/root disposal gives a clean unmount boundary.

The pain points are:
- debugging an implicit dependency graph (who depends on what, why something ran);
- dependency tracking silently stopping across `await`/callbacks;
- framework-wide behaviors (document-level event delegation, global schedulers) that leak outside a mount point.

### Cited Findings
- Tracking is synchronous only: reads after `await` or in `setTimeout` are untracked in Svelte 5. — [Svelte $effect docs](https://svelte.dev/docs/svelte/$effect)
- Solid and Preact have the same dynamic-context design. — [Preact: Signal Boosting](https://preactjs.com/blog/signal-boosting/); [Carniato](https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf)
- A user hit a stale memo read inside a Solid batch that the author did not address in the thread. Batches can expose stale reads. — [Carniato, dev.to comments](https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf)
- Preact signals offers `name` options plus `@preact/signals-debug` for logging. It also has `watched`/`unwatched` callbacks that fire when a signal gains or loses its first or last subscriber. — [preact signals core README](https://raw.githubusercontent.com/preactjs/signals/main/packages/core/README.md)
- Svelte provides `$effect.root` for effects created outside component init with manual disposal. `$effect.tracking()` and `createSubscriber` help bridge external event sources only when they are observed. — [Svelte $effect docs](https://svelte.dev/docs/svelte/$effect)
- Vue Vapor delegates events to `document`, so `stopPropagation` from an ancestor (e.g. a host engine's canvas handlers) can break handlers. Vapor and VDOM interop pulls in both runtimes. — [Vue v3.6.0-rc.1 notes](https://newreleases.io/project/github/vuejs/core/release/v3.6.0-rc.1)
- Solid `createRoot` returns a `dispose` that tears down the whole subtree (unlinks sources, disposes children, runs cleanups). This is the right primitive for mounting into, and unmounting from, a host-owned element. — [solid signal.ts](https://raw.githubusercontent.com/solidjs/solid/main/packages/solid/src/reactive/signal.ts)
- TC39 signals aim for cross-framework interop, but are Stage 1 with a polyfill only. — [tc39/proposal-signals](https://github.com/tc39/proposal-signals)

### Inferences
- For the city game (WebGL/WebGPU) and isidex (regl): expose Eloi box parameters as signals, and let the engine own its own rAF loop. The engine reads `.peek()` each frame, which is cheap and untracked, or subscribes with one effect that sets a `needsRedraw` flag. Never let signal effects issue GL calls directly mid-batch.
- Event handling should attach to the box element, never `document`, so Eloi can live inside host-owned DOM.

### Gaps
- No sources were gathered on devtools quality comparisons, such as Svelte's inspector or Solid devtools maturity in 2026.

---

## Lessons for Eloi (synthesis — inferences drawn from the findings above)

**Borrow**
1. **Template-clone and node-addressing compile output** (Svelte 5, Solid, Vapor). The compiler emits static HTML/CSS for the frame and grid, plus a table of `(node | cssVar, setter, signal)` bindings. Runtime per binding is one effect, or better, one entry in a box-level effect.
2. **@preact/signals-core as the graph.**
   - It already has push-pull, version short-circuiting, equality cutoff, lazy auto-unsubscribing computeds, zero-alloc linked lists, `batch`, `untracked`/`peek`, and `watched`/`unwatched`.
   - Don't reimplement it. Don't adopt TC39 polyfill APIs yet (Stage 1).
3. **Owner/root per box** (Solid `createRoot`, Svelte `$effect.root`).
   - Each box mount creates a root that collects effects and cleanups.
   - `dispose()` tears everything down.
   - Preact signals-core has no owner tree, so Eloi needs a ~30-line one: a stack of `cleanup[]` arrays, with `effect` wrapped to register its disposer in the current owner.
4. **Two-phase compute/apply** (Solid 2.0 effect split, Svelte render vs user effects).
   - Signals and computeds resolve the layout, then a single rAF "apply" pass writes CSS variables and DOM, and notifies engines.
   - Within that pass, reads come before writes, which avoids layout thrash.
5. **"Notify marks dirty, flush pulls later"** (TC39 Watcher). Effects should only mark boxes dirty and request one rAF. Nothing runs, and no rAF is scheduled, when nothing is dirty and no motion is active. This makes idle structural, not a check.
6. **Stage-based dead-reactivity elimination**, like Svelte SSR dropping signals. Values tagged design/load compile to constants or one-shot init and never allocate signals. Only layout and moment values become signals.
7. **Motion as parameter signals**: an animation is a moment-stage producer that writes a signal each frame while active, and it stops requesting frames when it settles. Use `watched`/`unwatched` to start and stop observers (ResizeObserver, media queries) only while used.

**Avoid**
1. **Compile-time dependency inference** (Svelte 3/4 `$:`). It is fragile, and Svelte abandoned it. The compiler decides placement, and the runtime decides dependencies.
2. **Virtual DOM, reconciliation, time-slicing and priority scheduling** (React). Eloi's DOM is mostly static grid and CSS variables. Note the inverse lesson: React needs a scheduler only because diffing is unbounded.
3. **Async-in-the-graph, forks, transitions and Suspense** (Svelte 5 batch forks, Solid 2.0 async). This is the clearest scope-creep trap. Keep async (fonts, images, data) at the load stage, resolved before or outside the graph, and then written into signals.
4. **Document-level event delegation** (Vapor). It breaks when Eloi is embedded in someone else's element or alongside a canvas engine.
5. **A component model or templating DSL beyond what the frame needs.** Svelte, Solid and Vue are general UI frameworks. Eloi's unit is the box, and box content is delegated to whatever runtime the box hosts.
6. **Relying on tracking across `await`/callbacks.** Document that only synchronous reads subscribe, as all these systems do, and use `peek` in engine loops.
7. **Dropping Vue but adopting Vue 3.6/Vapor** is moot here. Vapor is still RC (as of Sep 2026) and brings Vue's SFC compiler. Its relevant idea, alien-signals push-pull, is already covered by preact signals-core.
