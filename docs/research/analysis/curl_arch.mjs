import { loadSprite, elementSegments, sampleSegs, fmt, linreg, multiStart, spiralGivenCentre } from './geom.mjs';
const M = loadSprite()['corner-medallion'];
function arch(pts, cx, cy){ const sc = spiralGivenCentre(pts,cx,cy); const r = pts.map(p=>Math.hypot(p[0]-cx,p[1]-cy)); const L = linreg(sc.th, r); const res = r.map((v,i)=>v-(L.icpt+L.slope*sc.th[i])); return { c: L.slope, a: L.icpt, rms: Math.sqrt(res.reduce((x,y)=>x+y*y,0)/res.length), max: Math.max(...res.map(Math.abs)), sweep: sc.sweep }; }
for (const [lab, segs, g] of [['103 inner curl segs 4..10', elementSegments(M.els[103]).slice(4), [243,111]], ['103 segs 5..10 (innermost 1.5 turns)', elementSegments(M.els[103]).slice(5), [243,111]], ['path0 scroll last 3', elementSegments(M.els[0]).slice(-3), [262,62]]]) {
  const pts = sampleSegs(segs, 300).filter((_,i)=>i%6===0).map(p=>[p.x,p.y]);
  const starts=[g,[g[0]+3,g[1]],[g[0]-3,g[1]],[g[0],g[1]+3],[g[0],g[1]-3]];
  const best = multiStart(c=>{const r=arch(pts,c[0],c[1]); return isFinite(r.rms)?r.rms:1e9;}, starts, [1,1]);
  const r = arch(pts, best.x[0], best.x[1]);
  console.log(`${lab}: Archimedean r=a+c*theta pole (${fmt(best.x[0],2)},${fmt(best.x[1],2)}) c ${fmt(r.c,3)} units/rad (pitch per turn ${fmt(Math.abs(r.c)*2*Math.PI,2)}) a ${fmt(r.a,2)} sweep ${fmt(r.sweep*180/Math.PI,0)} rms ${fmt(r.rms,3)} max ${fmt(r.max,3)}`);
  // log fit on same subset for comparison
  const { fitSpiral } = await import('./geom.mjs'); const f = fitSpiral(pts, null, starts);
  console.log(`   log-spiral on same: b ${fmt(f.b,3)} rms ${fmt(f.rms,3)} max ${fmt(Math.max(...f.res.map(Math.abs)),3)}`);
}
