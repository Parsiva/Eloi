// Geometry helpers: SVG sprite parsing, Bezier sampling, curvature, fits.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PHI = (1 + Math.sqrt(5)) / 2;
export const B_GOLD = Math.log(PHI) / (Math.PI / 2); // 0.30635

export const ROOT = fileURLToPath(new URL('../../../src/ornaments', import.meta.url));

export function loadSprite() {
  const svg = fs.readFileSync(`${ROOT}/hand-drawn.svg`, 'utf8');
  const out = {};
  const re = /<symbol id="hd-([^"]+)" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/g;
  let m;
  while ((m = re.exec(svg))) {
    const [, id, vb, body] = m;
    const els = [];
    const er = /<(path|line|circle|ellipse|polyline|polygon)\b([^>]*?)\/?>/g;
    let e;
    while ((e = er.exec(body))) {
      const attrs = {};
      e[2].replace(/([\w-]+)="([^"]*)"/g, (_, k, v) => (attrs[k] = v));
      els.push({ tag: e[1], attrs, index: els.length });
    }
    out[id] = { id, viewBox: vb.split(/\s+/).map(Number), els };
  }
  return out;
}

function tokenize(d) {
  const toks = [];
  const re = /([MmCcSsLlHhVvZzQqTtAa])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;
  let m;
  while ((m = re.exec(d))) toks.push(m[1] ? m[1] : parseFloat(m[2]));
  return toks;
}

// Returns list of subpaths; each subpath = list of segments {type:'C'|'L', p:[[x,y]...]} absolute
export function parsePath(d) {
  const t = tokenize(d);
  let i = 0, cmd = null;
  let cx = 0, cy = 0, sx = 0, sy = 0, lastC2 = null;
  const subs = [];
  let cur = null;
  const num = () => t[i++];
  while (i < t.length) {
    if (typeof t[i] === 'string') cmd = t[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    if (C === 'M') {
      let x = num(), y = num();
      if (rel) { x += cx; y += cy; }
      cx = sx = x; cy = sy = y;
      cur = []; subs.push(cur); lastC2 = null;
      cmd = rel ? 'l' : 'L';
    } else if (C === 'C') {
      const p = [];
      for (let k = 0; k < 3; k++) { let x = num(), y = num(); if (rel) { x += cx; y += cy; } p.push([x, y]); }
      cur.push({ type: 'C', p: [[cx, cy], ...p] });
      lastC2 = p[1]; [cx, cy] = p[2];
    } else if (C === 'S') {
      const c1 = lastC2 ? [2 * cx - lastC2[0], 2 * cy - lastC2[1]] : [cx, cy];
      const p = [];
      for (let k = 0; k < 2; k++) { let x = num(), y = num(); if (rel) { x += cx; y += cy; } p.push([x, y]); }
      cur.push({ type: 'C', p: [[cx, cy], c1, ...p] });
      lastC2 = p[0]; [cx, cy] = p[1];
    } else if (C === 'L') {
      let x = num(), y = num(); if (rel) { x += cx; y += cy; }
      cur.push({ type: 'L', p: [[cx, cy], [x, y]] }); cx = x; cy = y; lastC2 = null;
    } else if (C === 'H') {
      let x = num(); if (rel) x += cx;
      cur.push({ type: 'L', p: [[cx, cy], [x, cy]] }); cx = x; lastC2 = null;
    } else if (C === 'V') {
      let y = num(); if (rel) y += cy;
      cur.push({ type: 'L', p: [[cx, cy], [cx, y]] }); cy = y; lastC2 = null;
    } else if (C === 'Z') {
      if (cx !== sx || cy !== sy) cur.push({ type: 'L', p: [[cx, cy], [sx, sy]] });
      cx = sx; cy = sy; lastC2 = null;
    } else throw new Error('unsupported ' + cmd);
  }
  return subs;
}

export function elementSegments(el) {
  const a = el.attrs;
  if (el.tag === 'path') return parsePath(a.d).flat();
  if (el.tag === 'line') return [{ type: 'L', p: [[+a.x1, +a.y1], [+a.x2, +a.y2]] }];
  if (el.tag === 'polyline' || el.tag === 'polygon') {
    const n = a.points.trim().split(/[\s,]+/).map(Number);
    const pts = []; for (let k = 0; k < n.length; k += 2) pts.push([n[k], n[k + 1]]);
    const segs = [];
    for (let k = 0; k + 1 < pts.length; k++) segs.push({ type: 'L', p: [pts[k], pts[k + 1]] });
    return segs;
  }
  return []; // ellipses/circles handled separately
}

export function bez(p, t) {
  const u = 1 - t;
  return [
    u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
    u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1],
  ];
}
export function bezD1(p, t) {
  const u = 1 - t;
  return [0, 1].map(k => 3 * u * u * (p[1][k] - p[0][k]) + 6 * u * t * (p[2][k] - p[1][k]) + 3 * t * t * (p[3][k] - p[2][k]));
}
export function bezD2(p, t) {
  const u = 1 - t;
  return [0, 1].map(k => 6 * u * (p[2][k] - 2 * p[1][k] + p[0][k]) + 6 * t * (p[3][k] - 2 * p[2][k] + p[1][k]));
}

// Dense sampling of a segment list: returns [{x,y,s,k,seg,t}] with signed curvature k (1/units, y-down coords:
// positive k = turning clockwise on screen).
export function sampleSegs(segs, n = 400) {
  const out = [];
  let s = 0, prev = null;
  segs.forEach((sg, si) => {
    for (let j = 0; j <= n; j++) {
      if (si > 0 && j === 0) continue;
      const t = j / n;
      let x, y, k;
      if (sg.type === 'C') {
        [x, y] = bez(sg.p, t);
        const d1 = bezD1(sg.p, t), d2 = bezD2(sg.p, t);
        const sp = Math.hypot(d1[0], d1[1]);
        k = sp < 1e-9 ? NaN : (d1[0] * d2[1] - d1[1] * d2[0]) / (sp * sp * sp);
      } else {
        x = sg.p[0][0] + t * (sg.p[1][0] - sg.p[0][0]);
        y = sg.p[0][1] + t * (sg.p[1][1] - sg.p[0][1]);
        k = 0;
      }
      if (prev) s += Math.hypot(x - prev[0], y - prev[1]);
      out.push({ x, y, s, k, seg: si, t });
      prev = [x, y];
    }
  });
  return out;
}

export function linreg(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxx += (xs[i] - mx) ** 2; sxy += (xs[i] - mx) * (ys[i] - my); syy += (ys[i] - my) ** 2; }
  const slope = sxy / sxx, icpt = my - slope * mx;
  let sse = 0;
  for (let i = 0; i < n; i++) sse += (ys[i] - (icpt + slope * xs[i])) ** 2;
  return { slope, icpt, r2: syy > 0 ? 1 - sse / syy : 1, rms: Math.sqrt(sse / n) };
}

export function nelderMead(f, x0, step = 1, iters = 4000, tol = 1e-12) {
  const n = x0.length;
  let simplex = [x0.slice()];
  for (let i = 0; i < n; i++) { const x = x0.slice(); x[i] += Array.isArray(step) ? step[i] : step; simplex.push(x); }
  let vals = simplex.map(f);
  for (let it = 0; it < iters; it++) {
    const idx = vals.map((v, i) => i).sort((a, b) => vals[a] - vals[b]);
    simplex = idx.map(i => simplex[i]); vals = idx.map(i => vals[i]);
    if (Math.abs(vals[n] - vals[0]) < tol) break;
    const c = Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c[j] += simplex[i][j] / n;
    const xr = c.map((v, j) => v + (v - simplex[n][j])); const fr = f(xr);
    if (fr < vals[0]) {
      const xe = c.map((v, j) => v + 2 * (v - simplex[n][j])); const fe = f(xe);
      if (fe < fr) { simplex[n] = xe; vals[n] = fe; } else { simplex[n] = xr; vals[n] = fr; }
    } else if (fr < vals[n - 1]) { simplex[n] = xr; vals[n] = fr; }
    else {
      const xc = c.map((v, j) => v + 0.5 * (simplex[n][j] - v)); const fc = f(xc);
      if (fc < vals[n]) { simplex[n] = xc; vals[n] = fc; }
      else {
        for (let i = 1; i <= n; i++) { simplex[i] = simplex[i].map((v, j) => simplex[0][j] + 0.5 * (v - simplex[0][j])); vals[i] = f(simplex[i]); }
      }
    }
  }
  return { x: simplex[0], f: vals[0] };
}

// multi-start NM
export function multiStart(f, starts, step) {
  let best = null;
  for (const s of starts) {
    let r = nelderMead(f, s, step);
    r = nelderMead(f, r.x, step.map ? step.map(v => v / 10) : step / 10);
    if (!best || r.f < best.f) best = r;
  }
  return best;
}

// Circle fit (geometric) to points
export function fitCircle(pts) {
  const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length, my = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const f = ([cx, cy]) => { const rs = pts.map(p => Math.hypot(p[0] - cx, p[1] - cy)); const r = rs.reduce((a, b) => a + b) / rs.length; return rs.reduce((a, v) => a + (v - r) ** 2, 0); };
  const starts = []; for (const dx of [-200, -50, 0, 50, 200]) for (const dy of [-200, -50, 0, 50, 200]) starts.push([mx + dx, my + dy]);
  const best = multiStart(f, starts, [10, 10]);
  const [cx, cy] = best.x; const rs = pts.map(p => Math.hypot(p[0] - cx, p[1] - cy)); const r = rs.reduce((a, b) => a + b) / rs.length;
  const res = rs.map(v => v - r);
  return { cx, cy, r, rms: Math.sqrt(res.reduce((a, v) => a + v * v, 0) / res.length), maxAbs: Math.max(...res.map(Math.abs)), res };
}

// Log-spiral through ordered points with given centre: unwrap angles in order, regress ln r on theta.
export function spiralGivenCentre(pts, cx, cy) {
  let th = pts.map(p => Math.atan2(p[1] - cy, p[0] - cx));
  for (let i = 1; i < th.length; i++) { while (th[i] - th[i - 1] > Math.PI) th[i] -= 2 * Math.PI; while (th[i] - th[i - 1] < -Math.PI) th[i] += 2 * Math.PI; }
  const lr = pts.map(p => Math.log(Math.hypot(p[0] - cx, p[1] - cy)));
  const L = linreg(th, lr);
  const b = L.slope;
  // approximate normal distance residual: dr * sin(psi), sin(psi) = 1/sqrt(1+b^2)
  const res = pts.map((p, i) => { const r = Math.exp(lr[i]); const rf = Math.exp(L.icpt + b * th[i]); return (r - rf) / Math.sqrt(1 + b * b); });
  return { b, lna: L.icpt, th, res, rms: Math.sqrt(res.reduce((a, v) => a + v * v, 0) / res.length), sweep: th[th.length - 1] - th[0] };
}
// Same but with b fixed: best ln a by mean
export function spiralGivenCentreFixedB(pts, cx, cy, b) {
  const s0 = spiralGivenCentre(pts, cx, cy); const th = s0.th;
  const lr = pts.map(p => Math.log(Math.hypot(p[0] - cx, p[1] - cy)));
  const lna = lr.reduce((a, v, i) => a + v - b * th[i], 0) / lr.length;
  const res = pts.map((p, i) => (Math.exp(lr[i]) - Math.exp(lna + b * th[i])) / Math.sqrt(1 + b * b));
  return { b, lna, th, res, rms: Math.sqrt(res.reduce((a, v) => a + v * v, 0) / res.length), sweep: th[th.length - 1] - th[0] };
}

export function fitSpiral(pts, fixedB = null, startsIn = null) {
  const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length, my = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const fn = fixedB == null ? ((c) => spiralGivenCentre(pts, c[0], c[1])) : ((c) => spiralGivenCentreFixedB(pts, c[0], c[1], fixedB));
  const f = (c) => { const r = fn(c); return isFinite(r.rms) ? r.rms : 1e9; };
  const starts = startsIn || (() => { const s = []; for (const dx of [-150, -60, -20, 0, 20, 60, 150]) for (const dy of [-150, -60, -20, 0, 20, 60, 150]) s.push([mx + dx, my + dy]); return s; })();
  const best = multiStart(f, starts, [5, 5]);
  const r = fn(best.x);
  return { cx: best.x[0], cy: best.x[1], ...r, a: Math.exp(r.lna), growthQuarter: Math.exp(r.b * Math.PI / 2) };
}

export const fmt = (v, d = 3) => (typeof v === 'number' ? +v.toFixed(d) : v);
