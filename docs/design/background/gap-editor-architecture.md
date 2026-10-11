# Gap study: editor-architecture

> Background for [the frame engine design](../frame-engine.md).

## Summary

The browser editors that hold up (tldraw, Excalidraw, Figma, Theatre.js, Rive, Graphite, Cuttle) share one pattern. Each has a plain-data document of named records, a small deterministic runtime that turns that document into graphics, and a heavier editor that only produces and changes the document. Theatre.js shows the split most clearly: only @theatre/core ships in the final bundle, while the AGPL studio exports JSON and is gated behind import.meta.env.DEV.

For the owner's "dominant functions with things relative to them," the right core is a directed dependency graph, not a constraint solver. The Cassowary authors say acyclic systems are solved efficiently by local propagation, which is an order of magnitude faster, and recommend cooperating subsolvers. SolveSpace solves groups in sequence and keeps earlier groups fixed. The browser-ready CAD solvers also lack the curves this project needs. planegcs (FreeCAD's solver as WASM, 484 KB, LGPL) offers lines, arcs, conics and B-splines. SolveSpace offers lines, circles, arcs and cubics. Neither has clothoids or log spirals. So solving belongs in three bounded places, all in the Lab or inside one node: drag inversion for handles, small local fits, and an optional bake step.

Incremental recompute is solved: version-stamped, lazy, memoised graphs (Preact Signals, MobX, Solid, tldraw's own signals, the Observable runtime). Persistence lessons are consistent across tools:
- Versioned forward migrations with up/down steps (tldraw).
- Normalise on load and keep unknown fields (Excalidraw restore.ts).
- Keep legacy algorithms addressable so saved art never shifts (Excalidraw ROUNDNESS.LEGACY).
- Accept one major version and ignore unknown minor additions (Rive .riv).
- Write deterministic text for git (Godot TSCN; JCS-style ordering).

Undo should be patch-based (immer patches), grouped into one step per drag with marks and squash, and kept separate from session state (tldraw).

## Findings

### 1. Preact Signals: @preact/signals-core and the 'Signal Boosting' implementation article

<https://preactjs.com/blog/signal-boosting/>

**Facts.** Core package @preact/signals-core (README at github.com/preactjs/signals packages/core) exports signal, computed, effect, batch, untracked and peek. Its examples are plain JS with no framework. The README says 'Updates flow through computed, but only if someone subscribes to it.' The article describes the algorithm: computeds are evaluated lazily, when read. Each signal has a version number, and there is a global version. A computed returns its cache if the global version is unchanged. Otherwise it re-checks its dependencies in stored order by version and recomputes only if one changed. Its own version increments only if its output actually changed. Dependencies sit in doubly linked lists, with O(1) insert and remove and node reuse across runs. A computed subscribes upstream only while something listens, so unused computeds can be garbage collected. Bundlephobia reports v1.14.4 at 5.5 KB minified, 2.0 KB gzip, with 0 dependencies.

**Use for the engine.** Copy this version-stamp algorithm for the runtime evaluator: global version, per-node version, ordered re-check of inputs, and no propagation when an output is unchanged. Alternatively, wrap each frame node in a signals-core computed. At about 2 KB it is acceptable inside the shipped runtime.

### 2. MobX computed values

<https://mobx.js.org/computeds.html>

**Facts.** Computeds 'evaluate lazily, caching their output and only recomputing if one of the underlying observables has changed.' 'If they are not observed by anything, they suspend entirely.' keepAlive prevents suspension but risks leaks. Computeds should have no side effects. The equals option (default Object.is; also compareStructural, compareShallow) stops observers re-running when the output is equal. In the OrderLine example, the autorun does not re-run because the computed 'will detect its output hasn't been affected.'

**Use for the engine.** Use structural or epsilon equality on geometric outputs. Example: if a resize leaves a spine's resolved points within 1e-6, its dependents do not re-run. Node compute functions must be pure.

### 3. SolidJS createMemo

<https://docs.solidjs.com/concepts/derived-values/memos>

**Facts.** Memos retain 'the results of a computation until its dependencies change' and are 'optimized to execute only once for each change in their dependencies.' A recomputed value that is strictly equal (===) does not trigger downstream updates. The page's examples use only signals, memos and effects with no JSX, but it does not explicitly say Solid's reactivity works standalone.

**Use for the engine.** This confirms the same memo semantics. It gives no reason to add Solid; the runtime needs only the algorithm.

### 4. TC39 Signals proposal

<https://github.com/tc39/proposal-signals>

**Facts.** The README header says Stage 1. The status text mentions the April 2024 agenda and says the proposal 'can currently be thought of as "Stage 0".' API: Signal.State (get/set), Signal.Computed (get), and Signal.subtle (untrack, Watcher). The design is lazy, memoised, glitch-free and push-then-pull. A polyfill exists (proposal-signals/signal-polyfill), and the authors advise against relying on its stability. Design input came from maintainers of Angular, MobX, Preact, Solid, Svelte, Vue and others.

**Use for the engine.** Shows broad agreement on the semantics. Do not depend on it: it is not standardised.

### 5. alien-signals and the Vue 3.6 reactivity refactor

<https://github.com/stackblitz/alien-signals>

**Facts.** Described as 'The lightest signal library', using a push-pull algorithm. Its README lists influences: Vue 3 propagation, Preact's doubly linked lists, Svelte effect scheduling and Reactively's graph colouring. 'The core algorithm has been ported to v3.6' of Vue. The core avoids Array/Set/Map and recursion for performance. API: signal, computed, effect, effectScope, trigger, createReactiveSystem. npm on 2026-10-10: vue latest is 3.5.43, the rc tag is 3.6.0-rc.11, and alien-signals is 3.2.1. Bundlephobia reports @vue/reactivity 3.5.43 at 21.8 KB minified, 8.1 KB gzip.

**Use for the engine.** If the owner wants to stay close to Vue, standalone @vue/reactivity works but is about 4x the size of signals-core. Since the frame engine is leaving Vue, prefer signals-core or a hand-written evaluator. Vue 3.6 is still a release candidate.

### 6. tldraw signals (@tldraw/state)

<https://tldraw.dev/sdk-features/signals>

**Facts.** Atoms take a debug name, an initial value and options: isEqual, historyLength (diffs kept for incremental updates) and computeDiff. Computeds are lazy ('they don't calculate until you call .get()') and cached. transact batches changes so effects run once; transaction adds rollback. react() and reactor() can schedule effects, for example with requestAnimationFrame. getDiffSince returns RESET_VALUE when the history is insufficient.

**Use for the engine.** Two ideas to borrow: transaction-with-rollback for Lab drags, and rAF-scheduled effects for rendering. Incremental diffs are unnecessary at this scale.

### 7. Observable runtime (define with explicit inputs)

<https://github.com/observablehq/runtime>

**Facts.** variable.define(name, inputs, definition). A variable is 'only computed if any transitive output of the variable has an observer.' 'Circular inputs are not allowed; the variable will throw a ReferenceError upon evaluation.' If two variables share a name, both are overridden to throw. module.derive(specifiers, source) makes a copy with some variables replaced. License: ISC. Also covered in docs/research/06 #14.

**Use for the engine.** This is the model for the document: every node lists its inputs by id. That makes dependencies serialisable, visible in the Lab and checkable for cycles at load time. derive maps to the frame variants.

### 8. Theatre.js @theatre/dataverse

<https://github.com/theatre-js/theatre/tree/main/packages/dataverse>

**Facts.** 'The reactive dataflow library' Theatre is built on, 'optimised for interactivity and animation.' Atoms hold state. Pointers are type-safe, referentially stable references to properties of atoms. Prisms derive values, recalculate when read while stale, and stay active only while subscribed. Tickers batch updates and align them to requestAnimationFrame.

**Use for the engine.** Use pointer-style paths (for example 'medallion.arrows.station') as the stable address that handles, inspector rows and animation tracks bind to.

### 9. Cassowary paper (Badros, Borning, Stuckey, ACM TOCHI 8(4) 2001, pp. 267-306)

<https://constraints.cs.washington.edu/solvers/cassowary-tochi.pdf>

**Facts.** I read the PDF text. Cassowary is an incremental solver for linear equalities and inequalities with constraint hierarchies (required vs preferred strengths). Dragging works by adding an edit constraint that is strongly preferred but not required, while weak stay constraints keep other points 'where they were unless there is some reason for them to move.' Efficient techniques exist if the network is acyclic. Most UI systems use one-way constraints or local propagation for acyclic multi-way constraints. Cycles need simultaneous solving. Cassowary is 'an order of magnitude' slower than local propagation (DeltaBlue) on re-solve, and the authors recommend 'a hybrid solver architecture' of cooperating subsolvers. 'Interaction times remain satisfactory for diagrams with 1000 constraints.' The authors also built CSVG, which extends SVG with constraints. The UW project page lists Apple's 2011 layout engine and Grid Style Sheets as users.

**Use for the engine.** This is the primary-source answer to when a solver is needed. Use directed propagation for everything that has a direction. Use a simultaneous solver only for genuine cycles, as a separate subsolver. During drags, apply edit (strong) and stay (weak) semantics.

### 10. kiwi.js / @lume/kiwi (Cassowary in TypeScript)

<https://github.com/lume/kiwi>

**Facts.** The original IjzerenHein/kiwi.js was archived on 2021-12-02 ('THIS REPOSITORY IS NO LONGER MAINTAINED') and points to lume/kiwi. @lume/kiwi is BSD-3-Clause, version 0.4.4, last npm change 2024-09-17. API: Solver, Variable, Expression, Constraint, Operator, Strength, addEditVariable, suggestValue, updateVariables. The project's own benchmark claims 10x faster creation and 2.3x faster solving than Cassowary.js, with no hardware details. Cassowary handles only linear constraints, so distances, tangency and curvature are out of reach.

**Use for the engine.** Use it only if linear layout inequalities appear, such as 'medallion stays at least N px from the text column' or 'rail width at least X'. It cannot express any curve relationship. Likely unnecessary, because CSS and arithmetic nodes cover these cases.

### 11. planegcs (FreeCAD Sketcher solver compiled to WASM)

<https://github.com/Salusoft89/planegcs>

**Facts.** npm @salusoft89/planegcs 1.3.0, last changed 2026-10-05. The LICENSE file is LGPL 2.1; package.json says LGPL-2.0-or-later. I inspected the tarball: planegcs.wasm is 484,003 bytes uncompressed. Primitives: point, line, circle, arc, ellipse, arc_of_ellipse, parabola, hyperbola (plus their arcs) and bspline. There is no clothoid or log-spiral primitive. constraints.ts defines 83 constraint types, including tangent_*, point_on_*, arc_length, equal_*, p2p_symmetric_*, proportional and point_on_bspline. Solvers: DogLeg (default), LevenbergMarquardt and BFGS, with SQP used when temporary constraints exist. The wrapper exposes dof(), get_conflicting(), get_redundant() and get_partially_redundant(). Wasm memory must be freed explicitly, and Vite needs a locateFile URL. The README notes that some constraints misbehave when set non-driving.

**Use for the engine.** Lab-only and optional, for a design that truly needs mutual simultaneous constraints (for example tangent circles). It is useful for its DOF, conflict and redundancy diagnostics. Bake the results into parameters. Never ship it, and do not expect it to model the clothoid and log-spiral spines.

### 12. SolveSpace solver library (slvs)

<https://github.com/solvespace/solvespace/blob/master/exposed/DOC.txt>

**Facts.** A sketch is made of parameters, entities and constraints. Entities and constraints are assigned to groups. 'A group is a set of entities and constraints that is solved simultaneously.' Constraints may reference entities in earlier groups, but 'only the entities within that group will be modified by the solver.' The initial guess 'determines which solution gets chosen' when several exist. There are three outcomes: OK; provably inconsistent, with failed[] listing the clashing constraints; or no solution found, with the unsatisfied constraints listed. slvs.h adds the dragged[] parameters, which the solver changes 'as little as possible'. Finding failed constraints costs 'about n times as long as just solving'. Entities are points, normals, distance, workplane, line segment, cubic, circle and arc of circle; there are no spirals. The library page says GPLv3. The npm package 'slvs' is an experimental WASM build: dist-tags latest 3.1.0-dev.14, stable 3.2.0, dev 3.3.0-dev.161, license 'GNU GPL V3'. A 2023 replicad issue says 'The API will probably change'.

**Use for the engine.** Its group model matches the frame-engine design: a DAG of stages, each a small local solve, with upstream geometry fixed. Copy the 'dragged params change least' policy and the diagnostics vocabulary. Do not adopt the library: it is GPL, experimental in WASM and has no spirals.

### 13. Penrose optimisation model

<https://penrose.cs.cmu.edu/docs/ref/constraints>

**Facts.** 'Under the hood, all constraint functions are implemented as energy functions.' A constraint's energy is greater than 0 if and only if it is violated. 'Penrose looks for a local minimum of the energy function by using numerical optimization.' API (docs/ref/api): compile(trio) -> PenroseState, optimize(state), step(state, {until}), isOptimized, toSVG. The trio has a 'variation' field that the page does not explain. Also covered in docs/research/05 #11.

**Use for the engine.** Use energy minimisation only offline in the Lab, for 'encourage' goals such as even spacing or balanced density, and bake the result. A local minimum depends on the start point, so it is not a runtime tool.

### 14. Clothoids library (Bertolazzi and Frego)

<https://github.com/ebertolazzi/Clothoids>

**Facts.** C++11 with a MATLAB mex interface. It implements 'G1 and G2 fitting with clothoids, spline of clothoids, circle arc and biarc.' Paper: Bertolazzi and Frego, 'G1 fitting with clothoids', Math. Methods Appl. Sci. 2015, doi:10.1002/mma.3114. It is not a JS library.

**Use for the engine.** This is the kind of local, node-owned solve the engine needs. Example: a clothoid S-sweep from the medallion ring (heading and curvature given) to the stem (heading 90 degrees). The node solves it internally with Newton plus guard rails, and no global solver is involved. It would need a TS port or reimplementation from the paper.

### 15. tldraw persistence and migrations

<https://tldraw.dev/sdk-features/persistence>

**Facts.** Snapshots are {document, session}. The document holds shapes, pages and bindings; the session holds camera, selection and UI. loadSnapshot replaces the document. 'When you load a snapshot from an older version, the store migrates it automatically.' createShapePropsMigrationIds gives ids that 'must start at 1 and increment', and each step has up() and down(). createMigrationSequence({sequenceId, sequence}) runs migrations at record, store or storage scope. 'Multiplayer sync uses the down migrations when a peer is running an older schema version.' The page does not say what happens with a newer-than-known snapshot.

**Use for the engine.** Use an ordered migration list with integer ids, up() required and down() optional (single user). Split document and session: preview size, selection and zoom live in session state and are never written to the frame file.

### 16. tldraw store

<https://tldraw.dev/sdk-features/store>

**Facts.** 'A record is a JSON object with an id and a typeName', with type-prefixed ids such as shape:, page: and binding:. The store 'validates all records against a schema' and checks the full record on every write. Scopes: document (persisted), session (local) and presence (synced, not persisted). Store.listen receives diffs: added, updated as [before, after], and removed.

**Use for the engine.** Validate on every Lab write, not only on save, so a bad expression is caught at once. Use diffs to drive incremental recompute and the dirty indicator in the Lab.

### 17. tldraw history (undo/redo)

<https://tldraw.dev/sdk-features/history>

**Facts.** The undo and redo stacks hold diffs and marks. 'Changes accumulate until you create a mark,' and are then flushed as one entry. markHistoryStoppingPoint is placed at the start of interactions. bail() and bailToMark() reverse changes 'without adding them to the redo stack', for example when a drag is cancelled. squashToMark merges everything since a mark into one step. editor.run history modes: record, record-preserveRedoStack and ignore. Remote changes are never recorded.

**Use for the engine.** For a handle drag: mark on pointerdown, then live patches, then squash on pointerup (one undo step) or bail on Escape. Preview-only changes, such as scrubbing the contact-sheet size, use history:'ignore'.

### 18. tldraw handles

<https://tldraw.dev/sdk-features/handles>

**Facts.** ShapeUtil.getHandles(shape) returns handles in the shape's local coordinates. Fields: id, type (vertex, virtual, create, clone), index, x, y, optional snapType ('point' or 'align'), snapReferenceHandleId and label. onHandleDrag(shape, {handle, initial, isPrecise, isCreatingShape}) returns a partial shape, for example {props:{tailX, tailY}}. Lifecycle hooks: onHandleDragStart, onHandleDragEnd and onHandleDragCancel. Shift snaps to 15 degrees. getHandleSnapGeometry supplies snap outlines and points.

**Use for the engine.** Each node type declares getHandles(resolvedNode) and onHandleDrag(...) -> parameter patch. Use the 'initial' snapshot to keep drags stable. Snap targets include stations on parent curves, golden ladder rungs and medallion anchor angles.

### 19. tldraw bindings

<https://tldraw.dev/sdk-features/bindings>

**Facts.** A binding record holds fromId, toId and props. BindingUtil callbacks are onAfterChangeToShape/FromShape, onBeforeDeleteFromShape/ToShape, onBeforeDelete/onAfterDelete, and onBeforeIsolateFromShape/ToShape. The isolate callbacks let a binding 'bake in' its current state when the shapes are separated, so an arrow keeps its last endpoint. The editor keeps a per-shape binding index that updates incrementally.

**Use for the engine.** Attachments (child at station s on a parent) are the frame engine's bindings. When the owner deletes or detaches a parent, offer 'bake': convert the dependent to absolute geometry instead of breaking it.

### 20. Excalidraw file format and restore.ts (normalise-on-load migrations)

<https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/data/restore.ts>

**Facts.** File: {type:'excalidraw', version, source, elements, appState, files} (docs.excalidraw.com json-schema). Element fields in packages/element/src/types.ts: seed ('so that the roughjs shape doesn't differ across renders'), version (incremented on each change), versionNonce, and index (a fractional index). restoreElementWithProperties fills defaults. It keeps unknown fields: 'spread the original element properties to not lose unknown ones for forward-compatibility'. It migrates legacy props (strokeSharpness to roundness, boundElementIds to boundElements) and deletes them. For old elements 'that would now use adaptive radius algo, use legacy algo instead' (ROUNDNESS.LEGACY). Binding schema v1 is detected and migrated to v2.

**Use for the engine.** Three habits to copy. (1) Load tolerantly and keep unknown fields. (2) Make the algorithm version part of the data: node.algo:'v1'. When the clothoid fit or tile-fitting maths improves, committed frames keep their exact look until the owner opts in. (3) Stable seeds if any jitter is ever used.

### 21. Figma multiplayer document model and undo rule

<https://www.figma.com/blog/how-figmas-multiplayer-technology-works/>

**Facts.** 'Every Figma document is a tree of objects, similar to the HTML DOM', best pictured as 'Map<ObjectID, Map<Property, Value>>'. A conflict happens only when two clients change the same property on the same object. The parent link is stored as a property on the child, together with a fractional-index position, as one atomic property. Figma rejected OT as 'unnecessarily complex' and uses CRDT-inspired, server-authoritative merging. Undo rule: if you undo a lot, copy something, and redo back to the present, 'the document should not change.'

**Use for the engine.** Use a flat node map keyed by id, with properties as the unit of change and relationships stored on the child. This also gives clean, property-sized git diffs. The undo rule is a good acceptance test for the Lab's history.

### 22. Immer patches

<https://immerjs.github.io/immer/patches>

**Facts.** Enable with enablePatches(). produceWithPatches returns [nextState, patches, inversePatches]. applyPatches replays them. Each patch has op (replace, add, remove), path (an array, unlike RFC 6902 strings) and value. The docs list it as a 'basis for undo/redo'. 'Immer does not guarantee the generated set of patches will be optimal.'

**Use for the engine.** Lab history entries are {label, patches, inversePatches}. Patches on a JSON document are also readable in a history panel. Coalesce many pointermove patches into one squashed entry.

### 23. Command pattern for undo (Nystrom, Game Programming Patterns)

<https://gameprogrammingpatterns.com/command.html>

**Facts.** An undo() method 'reverses the game state changed by the corresponding execute() method'. The command must remember the previous state itself. Keep 'a list of commands and a reference to the current one'. A new command after undoing discards the commands after current. Redo advances the pointer and re-executes. Persistent data structures are the alternative: undo switches back to the old object, which is 'much cheaper than cloning the entire object'.

**Use for the engine.** Named commands (setParam, attach, bake, addVariant, importMotif) give human-readable history labels. Immutable document plus patches is the persistent-structure variant, which fits a JSON document best.

### 24. Theatre.js core/studio split

<https://github.com/theatre-js/theatre>

**Facts.** README: @theatre/core is Apache-2.0 and @theatre/studio is AGPL-3.0. 'Your project's final bundle only includes @theatre/core'. Projects manual: the tweaks and animations are 'the project's state'. While the Studio is open, state lives in localStorage and is exported as a JSON file, then loaded with getProject('My Project', {state: projectState}). The 0.5 docs (theatrejs.com/docs/0.5/getting-started/with-three-js) say to remove studio.initialize/extend for deploy, or gate them with if (import.meta.env.DEV) and rely on tree-shaking. Core API: sequence.play({iterationCount, range, rate, direction, rafDriver}) returns a Promise that resolves true on completion and false if interrupted. types.number range is 'just a visual guide, not a validation rule'. Status: 'Theatre.js 1.0 is around the corner', and 'We have temporarily moved development to a private repo'. Last npm publish of core and studio: 0.7.2 on 2024-05-19.

**Use for the engine.** Mirror the split exactly: frame-core plus the JSON document ships; frame-lab never does. Unlike Theatre, save to real files rather than localStorage. Theatre's play() API is a good shape for the later tab-change animations. Use Theatre as a reference, not a dependency, because public development is stalled.

### 25. Rive .riv format versioning, runtimes and N-slicing

<https://rive.app/docs/runtimes/advanced-topic/format>

**Facts.** The file starts with the 'RIVE' fingerprint, then major and minor versions (varuint), a file ID and a table of contents of property keys with 2-bit backing types. A runtime that does not know a key can read past it. 'Runtimes are compatible with only a single major Rive export format version'. Minor versions are compatible, and 'Unsupported features are treated as no-ops.' Objects are a flat ordered list; parents are referenced by index. Official runtimes are open source under MIT (rive.app/docs/runtimes/getting-started). N-Slicing (rive.app/docs/editor/layouts/n-slicing) generalises 9-slice: axes split artwork into segments that alternate between fixed and scaling, and scaling segments can stretch or repeat (repeat only for raster).

**Use for the engine.** Versioning rule for the runtime: refuse an unknown major, and treat unknown minor additions as optional and ignorable. The editor stays private while the runtime is small and separate. Fixed and scaling segments are the minimal vocabulary for frame edges; the engine goes further with whole-tile refits along spines.

### 26. Graphite editor architecture

<https://graphite.art/volunteer/guide/codebase-overview/>

**Facts.** The frontend (TypeScript and Svelte) is meant to be 'as lightweight and minimal as possible'. The editor core is Rust compiled to WebAssembly and is where 'business logic occurs'. A thin wrapper exposes its message system to TS. 'At its heart is the message system', with backend-to-frontend messages queued to a dispatcher. Graphene is the node-graph engine that 'manages and renders the documents'; 'Graphene programs are compiled while being edited live by the user.' docs/research/06 #10 covers canvas and graph as two views of one document, and hand-override nodes.

**Use for the engine.** Keep the Lab UI a thin shell over the same evaluator the site uses, and route all edits through one command or message channel. The graph view and the canvas are two views of one document.

### 27. Cuttle parameters

<https://cuttle.xyz/learn/getting-started-with-parameters>

**Facts.** Parameters define a value 'in one place' and are referenced throughout. Parameters can reference other parameters and use math expressions. Expressions can be multi-line JavaScript that returns any value, including arrays, objects or functions. Project parameters are global. Component parameters are local, and each instance can override them. docs/research/06 #8 covers extract-to-parameter and forkable modifiers.

**Use for the engine.** Use two parameter scopes: frame-wide (ink weight, golden steps) and per-motif-master, with per-instance overrides (four mirrored corner medallions). Unlike Cuttle, keep the expression language arithmetic-only so documents stay safe and readable.

### 28. Zod 4 to JSON Schema

<https://zod.dev/json-schema>

**Facts.** z.toJSONSchema() targets draft-2020-12 by default, with draft-07, draft-04 and openapi-3.0 also available. z.fromJSONSchema() is 'experimental'. .meta() and registries emit interlinked schemas with $ref. Unrepresentable types (date, map, set, transform, bigint and others) throw by default. Bundlephobia reports zod 4.6.5 at 385 KB minified, 88.6 KB gzip for the full package entry.

**Use for the engine.** Write the document types once in Zod (Lab, CI and Node tools). Generate frame.schema.json so a $schema line gives VS Code autocomplete and validation while the owner hand-edits. Keep Zod out of the shipped runtime.

### 29. RFC 8785 JSON Canonicalization Scheme

<https://www.rfc-editor.org/rfc/rfc8785>

**Facts.** Recursively sorts object keys by UTF-16 code units, serialises numbers per ECMAScript (NaN and Infinity are errors), and forbids whitespace ('Whitespace between JSON tokens MUST NOT be emitted'). Its purpose is hashing and signing. It is Informational, not standards track.

**Use for the engine.** Use JCS for content hashes (cache keys, snapshot ids). For the committed file, use the same ordering and number rules but pretty-print, because JCS's single line gives useless git diffs.

### 30. Godot TSCN text scene format

<https://docs.godotengine.org/en/stable/engine_details/file_formats/tscn.html>

**Facts.** TSCN files are 'mostly human-readable and easy for version control systems to manage'. The header declares the format version (format=3 for Godot 4, 2 for Godot 3). Fixed section order: descriptor, external resources, internal resources, nodes, connections. String ids reference resources. uid and unique_id let files and nodes be tracked through moves and renames.

**Use for the engine.** A precedent for a deliberately VCS-friendly editor format. Use a fixed section order (header, params, motifs, nodes, variants, animations), string ids and an explicit format version.

### 31. Fractional indexing (rocicorp)

<https://github.com/rocicorp/fractional-indexing>

**Facts.** generateKeyBetween(a, b) returns a base-62 string key that sorts between two keys, so items can be inserted without renumbering. It is based on David Greenspan's 'Implementing Fractional Indexing' and used for ordered sequences in realtime editing. Excalidraw's element.index uses it.

**Use for the engine.** Probably unnecessary for a single-user file. Use explicit layer numbers or arrays for paint order. Adopt fractional keys only if inserts start causing large renumbering diffs.

### 32. math.js expression security

<https://mathjs.org/docs/expressions/security.html>

**Facts.** 'Mathjs versions 4 and newer does not use JavaScript's eval under the hood'. The parser 'actively prevents access to JavaScripts internal eval and new Function'. The docs still warn 'there are unknown security vulnerabilities' are possible and suggest Web Workers for untrusted input.

**Use for the engine.** Relationship expressions in the document should use a tiny hand-written parser to an AST: arithmetic, param refs, phi, sqrt, ln, trig, min, max, clamp, lerp and rung. No eval or new Function, so a strict CSP stays possible. math.js is unnecessary weight for this.

### 33. Vite plugin API and multi-page builds

<https://vite.dev/guide/api-plugin>

**Facts.** configureServer is mostly used for 'adding custom middlewares'. apply: 'serve' or 'build' (or a function) restricts a plugin to dev or build. Client to server: import.meta.hot.send. Server: server.ws.on and server.ws.send, with event names to be prefixed. Build guide: multi-page apps list several .html files as inputs. The current docs use build.rolldownOptions; this repo is on Vite 7 (package.json ^7.0.6), so check which key it expects. build.lib produces a distributable library.

**Use for the engine.** Run the Lab as lab.html served only in dev, plus a plugin with apply:'serve' whose middleware validates and writes frames/*.frame.json to disk. Saves are real files that git sees, and the blog tab picks them up through the dev server. build.lib can later package frame-core on its own.

### 34. Floating-point determinism of JS Math

<https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math>

**Facts.** 'Many Math functions have a precision that's implementation-dependent. This means that different browsers can give a different result. Even the same JavaScript engine on a different OS or architecture can give different results!'

**Use for the engine.** Deterministic output means rounding on serialisation (SVG coordinates and the document), snapshot tests in one engine (Node in CI) with a tolerance compare, and never using raw float equality to decide whether art changed.

### 35. prefers-reduced-motion

<https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion>

**Facts.** Detects a user setting 'to minimize the amount of non-essential motion'. Values are no-preference and reduce. Animations 'can trigger discomfort for those with vestibular motion disorders'.

**Use for the engine.** Every animation entry in the document declares its reduced-motion behaviour (skip or jump to end). The runtime reads matchMedia once and on change.

### 36. Existing repo code (local evidence)

<src\frames\frameSettings.ts>

**Facts.** CornerOrnament already carries '// Backward-compat fallback fields' (strokeWidth, dash). That is an informal migration living in the type. src/ornaments/hand-drawn.json pretty-prints every [x, y] pair over 4 lines, which makes diffs noisy. The uncommitted framing/ spike already has pure helpers that map onto node types: rung(base, step), fitRepeats(length, period, step), weave(...) with over/under pieces, and rosette(...).

**Use for the engine.** Replace fallback fields with explicit migrations. Write numeric tuples on one line. Promote the spike's pure functions to frame-core operators (repeatFit, goldenRung, weave, rosette) behind typed node definitions.

## Recommendation

ONE DOCUMENT, TWO PROGRAMS: frame-core runs the frame on the site; frame-lab edits it and never ships (the Theatre.js core/studio split).

1. SHARED DOCUMENT: frames/<name>.frame.json, committed to git, the single source of truth.
- Header: {"$schema":"./frame.schema.json", "format":"parkington-frame", "formatVersion":1}. The JSON Schema is generated from Zod types (z.toJSONSchema, draft 2020-12), so hand edits in VS Code are validated.
- params: named design values {value | expr, unit, range, frozen?, scope: frame | motif}. Golden constants are frozen expressions (phi, flame.b = ln(phi)/(pi/2)), so no drag can break them. Ratio choices are explicit dials (spacing law uniform | geometric(r); spiral b golden | free), as the 07 analysis requires.
- nodes: a flat map keyed by stable, readable ids. This is Figma's Map<ObjectID, Map<Property, Value>> with the relationship stored on the child. Each node is {type, inputs:{role: nodeId}, args:{literal | param ref | expr}, algo?:"v1", meta?:{Lab-only notes, lock, colour}}. Example: "flame.leaves": {type:"copyAlong", inputs:{proto:"leaf.master", spine:"flame.tipSpiral"}, args:{stations:{law:"equalAngle", step:"flame.step", count:6}, scale:"radiusOnSpine", rotate:"tangent + 12deg"}}.
- A closed, typed relation vocabulary, not free JavaScript:
  - anchors: pageBox, inset, corner, rail
  - curves: line, arc, clothoid, logSpiral, eulerSpline, importedPath
  - attach: child at station s on parent, side and offset, continuity G0/G1/G2
  - copies: copyAlong, similarity/gnomon about a pole, mirror, repeatFit with whole tiles
  - families: offsets of one spine, or interpolation between two guides, with a spacing law
  - weave: over/under derived from crossing parity
  - assert: minGap, noCrossing, offset < radius, goldenPitch within tolerance, tiles >= 1
  These formalise the copy, scale, mirror and attach operations the 07 analysis found in the drawing.
- Expressions: a tiny arithmetic language parsed to an AST by a hand-written parser. No eval or new Function, so the site keeps a strict CSP.
- Thresholds: variants:[{id, when: predicate on derived room measures (rail.width, page.width, aspect), overrides:{param: value}, swap:{nodeId: altNode}}], first match wins. Add a hysteresis margin so a resize near a boundary does not flicker. Inside a variant, scale continuously between two designed endpoints (the Utopia pattern, docs/research/05). Example ladder: 3-strand plait, then 2-ribbon twist, then a plain double rule.
- animations: [{id, trigger:"route-change" | "load", target:"medallion.arrows.station", from, to, duration, easing, reducedMotion:"skip" | "end"}]. The arrows are attachments at station s on a ribbon spine, so 'running down the track' means animating s. The weave node exposes isOver(strand, s), so a moving arrow passes under crossings correctly.
- Deterministic writer:
  - fixed key order per schema, and the node map sorted by id
  - numbers rounded (about 3-4 decimals for drawing units, 6 for ratios)
  - [x, y] tuples kept on one line, 2-space indent, trailing newline
  - JCS (RFC 8785) only for hashes and cache keys; it strips whitespace, so it does not suit git diffs
- Versioning:
  - integer formatVersion with an ordered migration list (tldraw style: ids from 1; up() required, down() optional), and one fixture file per old version tested in CI
  - load tolerantly and keep unknown fields (Excalidraw restore.ts)
  - the runtime refuses a newer major and ignores optional unknowns (the Rive rule)
  - when an algorithm's output changes, keep the old one addressable through node.algo (Excalidraw keeps ROUNDNESS.LEGACY for old elements), so committed art never shifts silently
  - replace frameSettings.ts's 'Backward-compat fallback fields' with real migrations

2. RUNTIME (frame-core, shipped): pure TypeScript, no Vue, no solver, no Zod.
- evaluate(doc, ctx {width, height, route, time, reducedMotion}) -> Scene, then an SVG emitter (filled outlines for variable width, per docs/research/04-05).
- Explicit DAG: inputs and param refs give the edges. Sort topologically once at load; a cycle is an error that names the loop (Observable throws on circular inputs).
- Incremental and lazy: a version-stamped memo per node, using the Preact 'Signal Boosting' algorithm. Either hand-write about 150 lines, or wrap each node in a @preact/signals-core computed (about 2 KB gzip). Use epsilon or structural equality on geometry so unchanged outputs stop propagation. Nodes of inactive variants never run.
- Curve kernel:
  - arc-length lookup tables, plus tangent and curvature queries
  - analytic clothoid, log-spiral and Euler-spline evaluation
  - safe offset families
  - cubic Bézier fitting at a tolerance for SVG output
  - local, node-owned solves only (for example G2 clothoid Hermite fits, Bertolazzi-Frego style): warm-started, with iteration caps, a NaN check and a fallback to the last good value
  - no Math.random; seeded PRNG only
- Drivers: ResizeObserver feeds ctx. A route change fires triggers. A requestAnimationFrame loop runs only while an animation plays, and it re-evaluates only that animation's dependents. Moving parts render as their own SVG groups with stable ids.

3. FRAME LAB (frame-lab, dev only)
- Serving: lab.html is served only by the Vite dev server. A plugin with apply:'serve' adds a configureServer middleware that validates and then writes frames/*.frame.json (real files git sees; no localStorage-only state). The blog in another tab reloads from the same JSON. The Lab uses the same frame-core evaluator.
- Panels:
  - named-parameter inspector with ranges, golden-ladder steps and frozen locks
  - canvas with a construction overlay (spines, poles, stations, curvature combs)
  - contact sheet of viewport sizes, with variant boundaries marked
  - validators/asserts panel (golden pitch, minimum printable gap, crossings, offset vs radius)
  - read-only dependency-graph view
  - Illustrator import that fits a curve family, reports residuals and snaps only on request (docs/research/06-07)
- Handles: declared per node type, like tldraw's getHandles/onHandleDrag. Each handle names the 1-2 params it may change. A drag solves argmin |handle(params) - mouse|^2 over those params only (edit), holding the rest (stay). This follows Cassowary edit/stay and SolveSpace's dragged params. Snap targets: stations, rungs and anchor angles. Reject NaN or high-error steps (the Recursive Drawing guard rails).
- Undo and history:
  - the document is immutable; commands produce immer patches and inverse patches
  - pointerdown sets a mark; pointerup squashes the drag into one step; Escape bails (tldraw)
  - session state (selection, zoom, preview size) is kept apart and never undone
  - git commits are the long-term history
  - deleting a parent offers 'bake to absolute geometry' (tldraw isolate)
- Solver policy:
  - use the DAG by default
  - use a global simultaneous solve only for a genuine cycle the owner wants (for example mutual tangency): run planegcs in the Lab for DOF and conflict/redundancy reports, bake the numbers into params, and keep the relation as an assert so drift is flagged
  - add kiwi/Cassowary only if linear layout inequalities appear
  - run Penrose-style optimisation (spacing, balance) offline, then bake

4. BUILD ORDER
1. Schema v1, the evaluator and the SVG emitter, plus a Node CLI that renders a document at a bracket of sizes for snapshot tests. Snapshots run in one engine with tolerance, because Math precision differs between browsers.
2. Lab v0: parameter panel, live preview, contact sheet, file save, undo.
3. Handles and validators.
4. Variants and thresholds.
5. Illustrator fit/import, plus optional planegcs.
6. Animations, then a small timeline UI.

## Cautions

- Do not build a general constraint solver as the core. The browser-ready CAD solvers (planegcs, SolveSpace) have no clothoid or log-spiral primitives. Cassowary/kiwi handle only linear constraints. Numerical drag solvers can jump to a different solution (Apparatus, in docs/research/06). The SolveSpace docs say the initial guess decides which solution is chosen.
- Licences and maturity: planegcs is LGPL-2.1 (its package.json says LGPL-2.0-or-later) with a 484 KB wasm. SolveSpace is GPLv3, and its npm 'slvs' WASM build is experimental (the latest dist-tag points to an old 3.1.0-dev.14). kiwi.js was archived in 2021, and @lume/kiwi was last published in 2024-09. Theatre.js moved development to a private repo and last published 0.7.2 on npm in 2024-05. Use it as a design reference, not a dependency.
- Standards in flux: TC39 Signals is Stage 1 at most (its README also says to treat it as 'Stage 0'). Vue 3.6's alien-signals reactivity is still a release candidate (3.6.0-rc.11; stable is 3.5.43 as of 2026-10-10).
- Bundle weight: the full Zod 4.6.5 entry is about 88.6 KB gzip according to bundlephobia. Keep validation in the Lab, CI and Node tools, not in the shipped runtime. Bundlephobia rate-limited me before I could get sizes for alien-signals, immer or @lume/kiwi, so I give no figures for them.
- Determinism: JS Math precision is implementation-dependent across browsers and operating systems (MDN). Round serialised numbers, compare SVG snapshots with a tolerance in one engine, and never use float equality to decide that the art changed.
- Committed art can shift silently when the engine's maths improves. Pin the algorithm per node (node.algo), as Excalidraw does with ROUNDNESS.LEGACY, and require a migration plus a fixture test for every schema change.
- Keep the document hand-readable and the relation vocabulary small and closed. The research record warns about unreadable generated equations (Sketch-n-Sketch), spaghetti graphs (Davis: 97.5% of 2,002 Grasshopper models had no modules) and too many sliders (Prototypo/METAFONT). The owner is a designer, not a full-time programmer.
- Never use eval or new Function for relationship expressions. Even math.js, which avoids eval, warns of possible unknown vulnerabilities. A hand-written arithmetic parser keeps a strict CSP.
- Theatre-style localStorage state can be lost. The Lab must write real files through a dev-only middleware, and must not hold hidden state that is missing from the JSON.
- Several details come from documentation summaries rather than full source reads: the tldraw behaviour for snapshots newer than the schema (unstated), Penrose's 'variation' semantics (unexplained on the API page), Theatre's exact tree-shaking guarantee (the docs rely on the bundler; a dynamic import of studio is safer), and whether Vite 7 in this repo uses rollupOptions or rolldownOptions for multi-page inputs. Verify these when implementing.
- The FreeCAD wiki (for Sketcher DOF and redundancy wording) was blocked by bot protection. The planegcs diagnostics claims come from its TypeScript wrapper source (get_conflicting, get_redundant, dof), not from FreeCAD documentation.
