// Extra styles for the frame graph editor, added to the shared card and toolbar look. Three
// signal colours: amber for nodes, cyan for lines, pink for openings.
export const GRAPH_STYLES = `
.graph { position: fixed; inset: 0; width: 100%; height: 100%; font: 10.5px/1 ui-monospace, "SF Mono", Menlo, monospace; }
.graph * { vector-effect: non-scaling-stroke; }

.opening > rect { fill: rgb(224 56 159 / 0.07); stroke: #e0389f; stroke-width: 1; stroke-dasharray: 5 4; }
.opening.sel > rect { fill: rgb(224 56 159 / 0.16); stroke-width: 2; stroke-dasharray: none; }
.opening.rel > rect { stroke-width: 2; }
.tag { pointer-events: all; cursor: pointer; }
.tag rect { fill: #e0389f; stroke: none; }
.tag text { fill: #fff; }

.link { stroke: #e08a00; stroke-width: 1; stroke-dasharray: 2 4; opacity: .55; }
.link.on { stroke-width: 1.6; stroke-dasharray: 5 3; opacity: 1; }

.line { cursor: pointer; }
.line .hit { fill: none; stroke: transparent; stroke-width: 11; pointer-events: stroke; }
.line .show { fill: none; stroke: #12a8c0; stroke-width: 1; opacity: 0; }
.line.guide .show { opacity: .9; stroke-dasharray: 7 5; stroke-width: 1.2; }
.line:hover .show, .line.hover .show { opacity: 1; stroke-width: 2.5; stroke-dasharray: none; }
.line.rel .show { opacity: 1; stroke: #7fdcec; stroke-width: 2; stroke-dasharray: none; }
.line.sel .show { opacity: 1; stroke: #00c8e8; stroke-width: 3.5; stroke-dasharray: none; filter: drop-shadow(0 0 3px rgb(0 200 232 / 0.9)); }

.node { pointer-events: all; cursor: grab; }
.node circle, .node rect { fill: rgb(224 138 0 / 0.14); stroke: #e08a00; stroke-width: 1.4; }
.node .dot { fill: #e08a00; stroke: none; }
.node.corner rect { fill: #e08a00; }
.node text { fill: #7a4a00; paint-order: stroke; stroke: rgb(255 250 235 / 0.92); stroke-width: 3px; stroke-linejoin: round; font-weight: 700; }
.node:hover circle, .node.hover circle { fill: rgb(224 138 0 / 0.35); }
.node.rel circle, .node.rel rect { stroke-width: 2.6; }
.node.sel circle, .node.sel rect { stroke: #fff; stroke-width: 2; fill: rgb(224 138 0 / 0.45); filter: drop-shadow(0 0 0 #e08a00) drop-shadow(0 0 4px #e08a00); }

.card { width: 356px; }
input.expr { width: 76px; }
input.expr.wide, .controls > input[type="text"]:not(.expr) { flex: 1; width: 100%; min-width: 60px; }
input.bad { border-color: #ff7a66; background: rgb(255 80 60 / 0.18); }
.check { display: inline-flex; align-items: center; gap: 5px; color: #eef2f4; }
.check input { width: auto; }
.variants { display: grid; gap: 6px; margin: 6px 0; }
.variant { border: 1px solid rgb(255 255 255 / 0.14); border-radius: 7px; padding: 4px 8px 6px; }
.variant.used { border-color: #12c8e0; }
.variant-head { display: flex; justify-content: space-between; align-items: center; color: #9fb0ba; font-size: 11px; margin-bottom: 2px; }
.variant.used .variant-head span { color: #12c8e0; }
.variant .row { grid-template-columns: 56px 1fr; margin: 4px 0; }
.grid { display: grid; grid-template-columns: auto 1fr auto 1fr; gap: 4px 6px; align-items: center; }
.grid label { color: #9fb0ba; }
.grid input { width: 100%; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; margin: 4px 0; }
.chip { padding: 1px 7px; border-radius: 999px; font-size: 11px; }
.chip.node { border-color: #e08a00; }
.chip.line { border-color: #12a8c0; }
.chip.opening { border-color: #e0389f; }
.branch { margin: 3px 0 3px 14px; }
.branch.root { margin-left: 0; }
.what { max-width: 46ch; overflow: hidden; text-overflow: ellipsis; }
.toolbar .warn { border-color: #ff9a8a; color: #ffb4a8; }
.readout { margin-left: 0; }
`
