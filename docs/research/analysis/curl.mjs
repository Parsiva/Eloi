import { loadSprite, elementSegments, sampleSegs, fmt, fitSpiral, spiralGivenCentre, spiralGivenCentreFixedB, B_GOLD, PHI, linreg } from './geom.mjs';
const sp = loadSprite();
export function curlAnalysis(label, segs, startGuess) {
  const samp = sampleSegs(segs, 300);
  const pts = samp.filter((_, i) => i % 6 === 0).map(p => [p.x, p.y]);
  const starts = [startGuess, [startGuess[0]+3,startGuess[1]], [startGuess[0]-3,startGuess[1]], [startGuess[0],startGuess[1]+3], [startGuess[0],startGuess[1]-3]];
  const f = fitSpiral(pts, null, starts);
  const g1 = fitSpiral(pts, B_GOLD, starts), g2 = fitSpiral(pts, -B_GOLD, starts); const g = g1.rms < g2.rms ? g1 : g2;
  const L = samp[samp.length-1].s;
  console.log(`${label}: ${pts.length} pts, length ${fmt(L,1)}; free log-spiral pole (${fmt(f.cx,2)},${fmt(f.cy,2)}) b ${fmt(f.b,4)} growth/quarter ${fmt(Math.exp(Math.abs(f.b)*Math.PI/2),3)} per-turn ${fmt(Math.exp(Math.abs(f.b)*2*Math.PI),2)} sweep ${fmt(f.sweep*180/Math.PI,0)}deg rms ${fmt(f.rms,3)} max ${fmt(Math.max(...f.res.map(Math.abs)),3)}`);
  console.log(`   golden b forced: pole (${fmt(g.cx,2)},${fmt(g.cy,2)}) rms ${fmt(g.rms,3)} max ${fmt(Math.max(...g.res.map(Math.abs)),3)}; golden per-turn ratio would be ${fmt(Math.exp(B_GOLD*2*Math.PI),2)}`);
  // local b along the curve: sliding window of ~180deg about the free pole
  const sc = spiralGivenCentre(pts, f.cx, f.cy);
  const lr = pts.map(p => Math.log(Math.hypot(p[0]-f.cx, p[1]-f.cy)));
  const loc = [];
  for (let i = 0; i < pts.length; i++) { const idx = []; for (let j = 0; j < pts.length; j++) if (Math.abs(sc.th[j]-sc.th[i]) <= Math.PI/2) idx.push(j); if (idx.length>4 && i%4===0) { const r = linreg(idx.map(j=>sc.th[j]), idx.map(j=>lr[j])); loc.push(`${fmt(sc.th[i]*180/Math.PI,0)}:${fmt(Math.abs(r.slope),2)}`); } }
  console.log('   local b (window +-90deg) at angle:', loc.join(' '));
  // ray crossings: radii where curve crosses rays from pole, successive-turn ratios
  const ray = []; for (let a = 0; a < 360; a += 45) { const th = a*Math.PI/180; const rs = [];
    for (let i=1;i<samp.length;i++){ const A=Math.atan2(samp[i-1].y-f.cy,samp[i-1].x-f.cx), B=Math.atan2(samp[i].y-f.cy,samp[i].x-f.cx); let dA=((A-th+3*Math.PI)%(2*Math.PI))-Math.PI, dB=((B-th+3*Math.PI)%(2*Math.PI))-Math.PI; if (dA*dB<=0 && Math.abs(dA-dB)<1) rs.push(Math.hypot(samp[i].x-f.cx,samp[i].y-f.cy)); }
    rs.sort((x,y)=>x-y); if (rs.length>1) ray.push(`${a}deg r=[${rs.map(r=>fmt(r,1)).join(',')}] ratio=[${rs.slice(1).map((r,i)=>fmt(r/rs[i],2)).join(',')}]`); }
  console.log('   ray crossings:\n     ' + ray.join('\n     '));
  return f;
}
if (import.meta.url.endsWith('curl.mjs')) {
  const M = sp['corner-medallion'];
  const s103 = elementSegments(M.els[103]);
  console.log('103 seg ends', s103.map(s=>s.p[3].map(v=>fmt(v,1)).join(',')).join(' | '));
  curlAnalysis('103 inner curl segs 4..10', s103.slice(4), [243, 111]);
  curlAnalysis('103 curl segs 3..10 (incl. outer loop)', s103.slice(3), [243, 111]);
  const s0 = elementSegments(M.els[0]);
  console.log('path0 seg ends', s0.map(s=>s.p[3].map(v=>fmt(v,1)).join(',')).join(' | '));
  curlAnalysis('path 0 right-end scroll (last 3 segs)', s0.slice(-3), [262, 62]);
  curlAnalysis('path 0 left-end loop (first 4 segs)', s0.slice(0, 4), [55, 38]);
  const s61 = elementSegments(M.els[61]);
  curlAnalysis('path 61 start loop (first 4 segs)', s61.slice(0,4), [38,55]);
  for (const i of [6,7,8]) { const s = elementSegments(M.els[i]); console.log(`path ${i} seg ends`, s.map(x=>x.p[3].map(v=>fmt(v,1)).join(',')).join(' | ')); }
}
