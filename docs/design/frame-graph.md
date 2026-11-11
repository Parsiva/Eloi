# The frame graph

> Decided 2026-11-10 (system.md §20, decision 16). This replaces the box layout as the way a site's frame is described. Code: `engine/src/graph/`. Editor: `editor/src/graph.ts`. First frame: `sandbox/frames/parkington.json`, shown at `/site.html`.

## Why

The first engine described a page as rows and columns of boxes and painted decoration on their edges. That is how layout frameworks work, and it puts the frame second: boxes take their size from content, the page scrolls, and the "frame" is whatever is left around the boxes.

Eloi is the other way round. The frame is the thing being designed. It is generated for one screen, from rules, and the content lives in the space it leaves. Its job is to carry leading lines through the page, so the unit of design is the line and the decoration it runs between, not the box.

## The model

A frame is a graph that exists before any screen does.

- **Corners.** Four nodes are given on every screen: `tl`, `tr`, `bl`, `br`. They are the only fixed points. With the screen size, they are the whole input.
- **Nodes** are the decorations. Each is placed by a relationship to something already placed: a step from another node, a point between two nodes, level with one node and in line with another, or riding a line. A node has a body (a radius) that lines attach to and wind around, and it is drawn as generated layers (circles, petals, rays, spirals), never as stored artwork.
- **Lines** leave one node and are received by another. An end says how: straight in, at a fixed port on the body, or winding around the body until the line can leave on a tangent. Each end also has an ease: the distance over which the node lets the line's rule take hold, or takes it back in.
- **Rules** say how a line moves aside from its spine as it travels: `amp * sin(tau * n * t)`. A rule is a list of variants with conditions, and the first that holds is used, so a line can do something different when its run is too short. `n` is a whole number of cycles fitted to the length, so a wave always meets its far node on the spine.
- **Leading lines and followers.** A line may run along another line instead of between nodes. A guide (not drawn) with two strands along it, one sine and one a quarter turn on, is a twist. Strands that share a weave pass over and under each other.
- **Openings** are the spaces left for content. Their edges are measured from nodes, so they move with the frame. Content longer than its opening scrolls inside it; the page never scrolls.
- **Thresholds.** Anything can carry `when`. Something whose condition fails is absent on that screen, and so is everything measured from it. Parameters can also switch on the screen (`W > 66 ? 14 : 0`).

Mirroring comes from the corners. Each corner has an inward frame, and a node inherits the frame of what it descends from, so the same numbers under `tl` and `tr` give mirror images.

## Units and expressions

Lengths are in modules (`m`). One module is `module` pixels, computed from the screen (`clamp(min(w, h) / 62, 8.5, 15)`), so the whole frame scales together.

Every number may be an expression: arithmetic, comparisons, `a ? b : c`, and functions (`sin cos abs min max clamp mix smooth tri saw ramp swell` and others; `engine/src/graph/expr.ts`). It can read:

| Name | Meaning |
|---|---|
| `w`, `h` | the screen in pixels |
| `W`, `H`, `m` | the screen in modules; one module in pixels |
| parameters | the document's own named values, in order |
| `t`, `s`, `len`, `n` | on a line: fraction along, distance along, length, cycles fitted |
| `easeIn`, `easeOut` | on a line: the eases of its two nodes; `ramp()` uses them |
| a line's `vars` | its own values, such as `phase` |

## Solving

`solve(doc, w, h)` is pure. It resolves things on demand and remembers them, so document order does not matter and a cycle is reported instead of looping. Curves are dense polylines; a rule moves each point sideways along the normal, with a mitre at sharp corners. Broken things are listed in `issues` and left out; the rest still draws.

`mountGraph(host, doc)` draws the result as one SVG the size of the host, positions the host's `[data-slot]` children in their openings, and solves again when the host is resized.

## The editor

On the editing server the page has an x-ray (press X): nodes in amber with a dotted link to what each is measured from, guides as dashed cyan, openings in pink. Click anything for a card. Nodes can be dragged when their placement is plain numbers. The toolbar opens the parameters, the rules, and a list of the whole frame by how many relationships separate each thing from the corners. Every change is applied at once, saved to the frame's JSON file, and followed by the clean view.

## Not done yet

- Curved spines other than arcs around nodes and rounded corners (no spirals or free curves between nodes).
- Varying line weight along a line, and filled shapes between lines.
- Repeating a node along a line (beads, studs) from one definition.
- Defining a group of nodes and lines once and placing it at several corners; today the mirror images are written out.
- Weaving between lines on different spines.
- Motion: rules do not yet read time.
- The Parkington frame is a placeholder that exercises the model. It is not the finished design.
