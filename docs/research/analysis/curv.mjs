import { sampleSegs, linreg, fitSpiral, fmt, B_GOLD } from './geom.mjs';
// Analyse a curve (segment list): find inflections; for each convex run, test models:
//  circle: k const; clothoid: k linear in s; log spiral: rho=1/|k| linear in s (slope = b, Cesaro).
//  Also free-centre geometric log-spiral fit on the run's points (b and rms).
export function analyseCurve(segs, { n = 300, minRun = 6, trim = 0.03, geo = true } = {}) {
  const s = sampleSegs(segs, n).filter(q => isFinite(q.k));
  const runs = []; let cur = [s[0]];
  for (let i = 1; i < s.length; i++) {
    if (Math.sign(s[i].k) !== Math.sign(cur[cur.length - 1].k) && Math.abs(s[i].k) > 1e-6) { runs.push(cur); cur = []; }
    cur.push(s[i]);
  }
  runs.push(cur);
  const out = [];
  for (const r of runs) {
    const L = r[r.length - 1].s - r[0].s; if (L < minRun) continue;
    // trim ends a little (curvature of joined cubics can spike near joins/endpoints)
    const a = r[0].s + trim * L, b = r[r.length - 1].s - trim * L;
    const q = r.filter(p => p.s >= a && p.s <= b);
    const ss = q.map(p => p.s), kk = q.map(p => Math.abs(p.k)), rho = kk.map(k => 1 / k);
    const turn = Math.abs(q.reduce((acc, p, i) => i ? acc + (p.s - q[i - 1].s) * p.k : 0, 0)) * 180 / Math.PI;
    const circ = { kMean: kk.reduce((x, y) => x + y) / kk.length };
    circ.cv = Math.sqrt(kk.reduce((x, y) => x + (y - circ.kMean) ** 2, 0) / kk.length) / circ.kMean;
    const clo = linreg(ss, kk);
    const ces = linreg(ss, rho);
    const lk = linreg(ss, kk.map(Math.log)); // exponential curvature (k ~ e^{cs}) for comparison
    let g = null;
    if (geo && turn > 25) { const stp = Math.max(1, Math.floor(q.length / 40)); const pts = q.filter((_, i) => i % stp === 0).map(p => [p.x, p.y]); const starts = [0.2,0.4,0.5,0.6,0.8].map(f => { const p = q[Math.floor(f*(q.length-1))]; const j = q.indexOf(p); const p2 = q[Math.min(j+1,q.length-1)], p0 = q[Math.max(j-1,0)]; let tx = p2.x-p0.x, ty = p2.y-p0.y; const L = Math.hypot(tx,ty); tx/=L; ty/=L; return [p.x - ty/p.k, p.y + tx/p.k]; }); g = fitSpiral(pts, null, starts); }
    out.push({ len: L, turn, kMin: Math.min(...kk), kMax: Math.max(...kk), kRatio: Math.max(...kk) / Math.min(...kk), circCV: circ.cv, clothoidR2: clo.r2, cesaroSlope_b: ces.slope, cesaroR2: ces.r2, expR2: lk.r2,
      geo: g && { b: g.b, rms: g.rms, sweep: g.sweep * 180 / Math.PI, cx: g.cx, cy: g.cy } , start:[q[0].x,q[0].y], end:[q[q.length-1].x,q[q.length-1].y]});
  }
  return out;
}
export function fmtRun(r) {
  return `len ${fmt(r.len,1)} turn ${fmt(r.turn,0)}deg  k ${fmt(r.kMin,4)}..${fmt(r.kMax,4)} (x${fmt(r.kRatio,1)})  circleCV ${fmt(r.circCV,2)}  clothoidR2 ${fmt(r.clothoidR2,3)}  Cesaro rho~s: b=${fmt(r.cesaroSlope_b,3)} R2 ${fmt(r.cesaroR2,3)}` + (r.geo ? `  | geoSpiral b=${fmt(Math.abs(r.geo.b),3)} rms ${fmt(r.geo.rms,3)} sweep ${fmt(r.geo.sweep,0)}` : '') + `  [${r.start.map(v=>v.toFixed(1))}]->[${r.end.map(v=>v.toFixed(1))}]`;
}
