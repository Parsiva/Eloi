// The editor's own look, kept inside its shadow roots. It is deliberately unlike any skin (dark
// glass, monospace, three signal colours), so it always reads as a tool over the page.
export const STYLES = `
:host { all: initial; }
* { box-sizing: border-box; }

/* ── X-ray ── */
.xray { position: absolute; inset: 0; font: 11px/1.2 ui-monospace, "SF Mono", Menlo, monospace; }
.xray[hidden] { display: none; }
.bay {
  position: absolute; pointer-events: auto; cursor: pointer;
  outline: 1px solid var(--c); outline-offset: -1px;
  background: color-mix(in srgb, var(--c) 9%, transparent);
}
.bay[data-kind="opening"] { --c: #e0389f; }
.bay[data-kind="band"] { --c: #e08a00; background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--c) 16%, transparent) 0 6px, transparent 6px 12px); }
.bay[data-kind="rows"], .bay[data-kind="cols"] { --c: #0a93a8; background: none; outline-style: dashed; }
.bay:hover { background-color: color-mix(in srgb, var(--c) 20%, transparent); }
.bay[data-selected] { outline: 2px solid #fff; box-shadow: 0 0 0 4px var(--c), 0 0 24px 4px color-mix(in srgb, var(--c) 60%, transparent); z-index: 1; }
.tag {
  position: absolute; left: 2px; top: 2px; max-width: calc(100% - 4px);
  padding: 2px 5px; border-radius: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  background: var(--c); color: #fff; pointer-events: none;
}
.bay[data-kind="rows"] > .tag, .bay[data-kind="cols"] > .tag { left: auto; right: 2px; top: auto; bottom: 2px; opacity: 0; }
.bay[data-kind="rows"]:hover > .tag, .bay[data-kind="cols"]:hover > .tag,
.bay[data-kind="rows"][data-selected] > .tag, .bay[data-kind="cols"][data-selected] > .tag { opacity: 1; }
.line { position: absolute; pointer-events: auto; z-index: 2; touch-action: none; }
.line[data-axis="cols"] { cursor: col-resize; }
.line[data-axis="rows"] { cursor: row-resize; }
.line::after { content: ""; position: absolute; background: #12c8e0; opacity: 0; transition: opacity .1s; }
.line[data-axis="cols"]::after { left: 4px; top: 0; bottom: 0; width: 2px; }
.line[data-axis="rows"]::after { top: 4px; left: 0; right: 0; height: 2px; }
.line:hover::after, .line[data-active]::after { opacity: 1; }

/* ── Card and toolbar ── */
.card, .toolbar {
  pointer-events: auto; position: fixed; color: #eef2f4;
  font: 12px/1.45 ui-monospace, "SF Mono", Menlo, monospace;
  background: rgb(18 22 26 / 0.94); border: 1px solid rgb(255 255 255 / 0.14); border-radius: 10px;
  box-shadow: 0 12px 40px rgb(0 0 0 / 0.45); backdrop-filter: blur(8px);
}
.card { width: 340px; max-height: calc(100vh - 80px); overflow: auto; padding: 0 12px 10px; }
.card[hidden] { display: none; }
header { display: flex; align-items: center; gap: 8px; margin: 0 -12px 8px; padding: 8px 8px 8px 12px; border-bottom: 1px solid rgb(255 255 255 / 0.12); cursor: grab; position: sticky; top: 0; background: rgb(18 22 26 / 0.98); z-index: 1; }
header:active { cursor: grabbing; }
.crumbs { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 2px; }
.crumb { border: 0; background: none; color: #8fd8e4; padding: 1px 3px; }
.crumb.here { color: #fff; font-weight: 700; cursor: default; }
.sep { color: #6b7780; }
h3 { margin: 12px 0 4px; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #9fb0ba; }
.row { display: grid; grid-template-columns: 96px 1fr; gap: 8px; align-items: center; margin: 6px 0; }
.row > label { color: #9fb0ba; }
.controls { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; min-width: 0; }
.grow { flex: 1; min-width: 0; display: flex; }
input, select, button {
  font: inherit; color: inherit; background: rgb(255 255 255 / 0.08);
  border: 1px solid rgb(255 255 255 / 0.18); border-radius: 5px; padding: 3px 6px; min-width: 0;
}
input[type="text"] { flex: 1; width: 100%; }
input[type="number"] { width: 64px; }
select { max-width: 100%; }
select option { color: #111; }
input:focus-visible, select:focus-visible, button:focus-visible { outline: 2px solid #12c8e0; outline-offset: 1px; }
button { cursor: pointer; }
button:hover:not(:disabled) { background: rgb(255 255 255 / 0.18); }
button:disabled { opacity: .35; cursor: default; }
button[aria-pressed="true"] { background: #12c8e0; border-color: #12c8e0; color: #06262b; font-weight: 700; }
.icon { padding: 1px 7px; font-size: 14px; line-height: 1.2; }
.segments { display: flex; flex-wrap: wrap; gap: 3px; }
.actions { display: flex; flex-wrap: wrap; gap: 4px; margin: 10px 0 4px; }
.unit { color: #9fb0ba; }
.dim { opacity: .75; }
.note, .readout, .foot, .problem { margin: 4px 0; color: #9fb0ba; font-size: 11px; }
.readout { margin-left: 104px; }
.foot { margin-top: 10px; padding-top: 8px; border-top: 1px solid rgb(255 255 255 / 0.12); }
.problem { color: #ffb4a8; background: rgb(255 80 60 / 0.14); border: 1px solid rgb(255 120 100 / 0.4); border-radius: 5px; padding: 5px 7px; }

.toolbar { left: 50%; bottom: 14px; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 999px; white-space: nowrap; }
.toolbar strong { letter-spacing: .08em; }
.stat { color: #9fb0ba; }
.status { min-width: 62px; text-align: right; color: #7fdc9a; }
.status.saving { color: #e8c96a; }
.status.failed { color: #ff9a8a; font-weight: 700; }
`
