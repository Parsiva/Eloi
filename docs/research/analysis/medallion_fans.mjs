import { loadSprite, elementSegments, fmt } from './geom.mjs';
import { polyOf, transversal, gapReport } from './fans.mjs';
const P = loadSprite()['corner-medallion'];
const fam = { 'A tendrils 28-34 (ends converge at 57.0,130.6)': [28,29,30,31,32,33,34], 'B 55-60 (converge at 173.6,186.6)': [55,56,57,58,59,60], 'C feather 86-96 (start x~246)': [86,87,88,89,90,91,92,93,94,95,96], 'C2 feather 87-96 (without outer 86)':[87,88,89,90,91,92,93,94,95,96], 'D curl fan 106-110 (+105)': [105,106,107,108,109,110] };
for (const [name, ids] of Object.entries(fam)) {
  const polys = ids.map(i=>polyOf(elementSegments(P.els[i])));
  console.log('\n== '+name);
  const mid = Math.floor(ids.length/2);
  for (const f of [0.1,0.25,0.4,0.5,0.6,0.75,0.9]) { const T = transversal(polys, mid, f); console.log(`  @ref#${ids[mid]} frac ${f} (${fmt(T.p[0],1)},${fmt(T.p[1],1)}): `+gapReport('', T.ds)); }
  // endpoints spacing
  for (const end of ['start','end']) {
    const pts = ids.map(i=>{ const s=elementSegments(P.els[i]); return end==='start'? s[0].p[0] : s[s.length-1].p[s[s.length-1].p.length-1]; });
    const d = pts.slice(1).map((p,i)=>Math.hypot(p[0]-pts[i][0],p[1]-pts[i][1]));
    console.log(`  ${end} points: ${pts.map(p=>`(${fmt(p[0],2)},${fmt(p[1],2)})`).join(' ')}\n    successive distances ${d.map(v=>fmt(v,2)).join(' ')}  ratios ${d.slice(1).map((v,i)=>fmt(v/d[i],2)).join(' ')}`);
  }
}
