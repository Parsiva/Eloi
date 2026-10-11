import { loadSprite, elementSegments, sampleSegs, fitCircle, fitSpiral, spiralGivenCentre, spiralGivenCentreFixedB, B_GOLD, PHI, linreg, fmt } from './geom.mjs';
const P = loadSprite()['corner-flame'];
const E = i => elementSegments(P.els[i]);
const pt = p => `(${p[0].toFixed(2)},${p[1].toFixed(2)})`;
// --- leaf tips & bases
const leaves = [9,10,11,12,13,14];
const tips = [], bases = [];
for (const i of leaves) {
  const segs = E(i);
  tips.push(segs[0].p[0]);
  // base = point of leaf farthest from tip
  const s = sampleSegs(segs, 200);
  let best = null; for (const q of s) { const d = Math.hypot(q.x - segs[0].p[0][0], q.y - segs[0].p[0][1]); if (!best || d > best.d) best = { d, x: q.x, y: q.y }; }
  bases.push([best.x, best.y]);
}
console.log('leaf tips', tips.map(pt).join(' '));
console.log('leaf bases', bases.map(pt).join(' '));
const leafLen = tips.map((t, i) => Math.hypot(t[0] - bases[i][0], t[1] - bases[i][1]));
console.log('leaf tip-base lengths', leafLen.map(v=>fmt(v,2)), 'ratios', leafLen.slice(1).map((v,i)=>fmt(leafLen[i]/v)), 'diffs', leafLen.slice(1).map((v,i)=>fmt(leafLen[i]-v,2)));
// outline 15 vertices
const ol = E(15).map(s => s.p[3]); ol.unshift(E(15)[0].p[0]);
console.log('outline 15 vertices', ol.map(pt).join(' '));
// vein ends
const O = E(19)[0].p[0];
const veins = [24,19,20,21,22,23].map(i => E(i)[0].p[3]);
console.log('vein origin', pt(O), 'vein ends', veins.map(pt).join(' '));
const vAng = veins.map(v => Math.atan2(v[1]-O[1], v[0]-O[0])*180/Math.PI);
console.log('vein end directions from origin (deg, screen y-down)', vAng.map(v=>fmt(v,2)), 'steps', vAng.slice(1).map((v,i)=>fmt(v-vAng[i],2)));
const vLen = veins.map(v=>Math.hypot(v[0]-O[0],v[1]-O[1]));
console.log('vein chord lengths', vLen.map(v=>fmt(v,2)));
// tips from origin
const tAng = tips.map(v => Math.atan2(v[1]-O[1], v[0]-O[0])*180/Math.PI); const tR = tips.map(v=>Math.hypot(v[0]-O[0],v[1]-O[1]));
console.log('tips polar about vein origin: ang', tAng.map(v=>fmt(v,2)), 'r', tR.map(v=>fmt(v,2)), 'r ratios', tR.slice(1).map((v,i)=>fmt(tR[i]/v)));

function report(name, pts) {
  const c = fitCircle(pts);
  console.log(`\n== ${name} (${pts.length} pts)`);
  console.log(' circle: centre', pt([c.cx,c.cy]), 'r', fmt(c.r,2), 'rms', fmt(c.rms,3), 'max', fmt(c.maxAbs,3));
  const s = fitSpiral(pts);
  console.log(' free spiral: centre', pt([s.cx,s.cy]), 'b', fmt(s.b,4), 'growth/quarter', fmt(s.growthQuarter,4), 'sweep deg', fmt(s.sweep*180/Math.PI,1), 'rms', fmt(s.rms,3), 'max', fmt(Math.max(...s.res.map(Math.abs)),3));
  const g = fitSpiral(pts, B_GOLD); const g2 = fitSpiral(pts, -B_GOLD);
  const gg = g.rms < g2.rms ? g : g2;
  console.log(' golden-b spiral (|b|=0.30635, free centre): centre', pt([gg.cx,gg.cy]), 'b', fmt(gg.b,4),'sweep deg', fmt(gg.sweep*180/Math.PI,1), 'rms', fmt(gg.rms,3), 'max', fmt(Math.max(...gg.res.map(Math.abs)),3));
  // profile of rms vs fixed b
  const prof = [];
  for (const b of [0.05,0.1,0.15,0.2,0.25,0.30635,0.35,0.4,0.5,0.6,0.8,1.0]) {
    const r1 = fitSpiral(pts, b), r2 = fitSpiral(pts, -b); prof.push(`${b}:${fmt(Math.min(r1.rms,r2.rms),3)}`);
  }
  console.log(' rms profile vs |b|:', prof.join(' '));
  // spiral centred at vein origin
  const so = spiralGivenCentre(pts, O[0], O[1]);
  console.log(' spiral with pole fixed at vein origin: b', fmt(so.b,4), 'growth/quarter', fmt(Math.exp(Math.abs(so.b)*Math.PI/2),4), 'sweep', fmt(so.sweep*180/Math.PI,1), 'rms', fmt(so.rms,3));
  return { c, s, gg };
}
report('leaf tips (6)', tips);
report('leaf tips + outline start (88.40,991.00)? no: tips + notches separately', tips);
const notches = [veins[1],veins[2],veins[3],veins[4],veins[5]];
report('outline notches = vein ends 19..23 (5)', notches);
report('leaf bases (6)', bases);
// left tongues: local minima (top points) of paths 0..3
console.log('\n-- left tongue tips (local y-minima)');
const ttips = [];
for (const i of [3,2,1,0]) {
  const s = sampleSegs(E(i), 300);
  for (let k = 3; k < s.length-3; k++) if (s[k].y < s[k-3].y && s[k].y <= s[k+3].y && s[k].y < s[k-1].y && s[k].y <= s[k+1].y) { ttips.push([s[k].x,s[k].y]); console.log(' path', i, pt([s[k].x,s[k].y])); }
}
report('left tongue tips', ttips);
