import { loadSprite, elementSegments, fmt, B_GOLD, fitSpiral, spiralGivenCentre } from './geom.mjs';
import { analyseCurve, fmtRun } from './curv.mjs';
const P = loadSprite()['corner-flame'];
const bs = [], bsGeo = [];
for (const i of [9,10,11,12,13,14]) {
  const segs = elementSegments(P.els[i]).filter(s=>s.type==='C');
  // sides: first cubic(s) until farthest point; just analyse each cubic separately (each leaf = 2 cubics, leaf 12 = 3)
  console.log(`leaf ${i}: ${segs.length} cubics`);
  segs.forEach((sg, j) => {
    const runs = analyseCurve([sg]);
    runs.forEach(r => { console.log(`  side ${j}: ` + fmtRun(r)); if (r.turn > 20 && r.cesaroR2 > 0) bs.push(r.cesaroSlope_b); if (r.geo) bsGeo.push(Math.abs(r.geo.b)); });
  });
}
const st = a => { const m = a.reduce((x,y)=>x+y)/a.length; const sd = Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/a.length); const s=[...a].sort((x,y)=>x-y); return `n ${a.length} mean ${fmt(m)} median ${fmt(s[Math.floor(s.length/2)])} sd ${fmt(sd)} min ${fmt(s[0])} max ${fmt(s[s.length-1])}`; };
console.log('Cesaro b (runs turning >20deg):', st(bs));
console.log('geometric spiral |b| (runs turning >25deg):', st(bsGeo), 'golden', fmt(B_GOLD,4));
// Serrated outline 15 per cubic
console.log('\noutline 15 cubics:');
elementSegments(P.els[15]).forEach((sg,j)=> analyseCurve([sg]).forEach(r=>console.log(`  c${j}: `+fmtRun(r))));
// Big flame paths 0, 3
for (const i of [3,0,1,2,18]) { console.log(`\npath ${i}:`); analyseCurve(elementSegments(P.els[i])).forEach(r=>console.log('  '+fmtRun(r))); }
// leaf angular spacing about best free spiral centre of tips
const tips = [9,10,11,12,13,14].map(i=>elementSegments(P.els[i])[0].p[0]);
const fs = fitSpiral(tips);
const sc = spiralGivenCentre(tips, fs.cx, fs.cy);
console.log('\ntip angles about fitted pole (deg):', sc.th.map(t=>fmt(t*180/Math.PI,1)), 'steps', sc.th.slice(1).map((t,i)=>fmt((t-sc.th[i])*180/Math.PI,1)));
const rr = tips.map(p=>Math.hypot(p[0]-fs.cx,p[1]-fs.cy)); console.log('tip radii', rr.map(v=>fmt(v,2)), 'successive ratio', rr.slice(1).map((v,i)=>fmt(rr[i]/v)));
