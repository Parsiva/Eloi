import { loadSprite, elementSegments, fmt, B_GOLD, PHI, multiStart, linreg, fitSpiral, spiralGivenCentre } from './geom.mjs';
const P = loadSprite()['corner-flame'];
const tips = [9,10,11,12,13,14].map(i=>elementSegments(P.els[i])[0].p[0]);
const scales = [1, 0.897, 0.7395, 0.594, 0.4229, 0.2661]; const rots=[0,20.99,40.87,63.29,78.34,90.02];
// Rule model: tip_k = C + a*e^{b*(t0 + k*D)} * (cos, sin)(t0 + k*D)   (equal angular steps, geometric radii)
function ruleFit(b){
  const f = ([cx,cy,la,t0,D]) => { let s=0; tips.forEach((p,k)=>{ const t=t0+k*D, r=Math.exp(la+b*t); s+=(cx+r*Math.cos(t)-p[0])**2+(cy+r*Math.sin(t)-p[1])**2; }); return s; };
  const starts=[]; for (const c of [[88.8,1026.7],[93.8,1032.8],[83,1013]]) for (const D of [0.35,0.42,0.5]) for (const t0 of [-1.4,-1.2]) { const r0=Math.hypot(tips[0][0]-c[0],tips[0][1]-c[1]); starts.push([c[0],c[1],Math.log(r0)-b*t0,t0,D]); }
  const best = multiStart(f, starts, [2,2,0.1,0.05,0.02]);
  const [cx,cy,la,t0,D]=best.x; const res = tips.map((p,k)=>{const t=t0+k*D, r=Math.exp(la+b*t); return Math.hypot(cx+r*Math.cos(t)-p[0], cy+r*Math.sin(t)-p[1]);});
  return { b, cx, cy, D: D*180/Math.PI, stepRatio: Math.exp(-b*D), rms: Math.sqrt(best.f/tips.length), res };
}
for (const b of [-B_GOLD, -0.4, -0.49, -0.6]) { const r = ruleFit(b); console.log(`rule (equal angle steps, b=${fmt(b,4)}): pole (${fmt(r.cx,2)},${fmt(r.cy,2)}) step ${fmt(r.D,2)}deg radius ratio/step ${fmt(1/r.stepRatio,4)} rms ${fmt(r.rms,3)} per-tip displacement ${r.res.map(v=>fmt(v,2)).join(' ')}`); }
// free b as well
{ let best=null; for (let b=-0.9;b<=-0.1;b+=0.02){ const r=ruleFit(b); if(!best||r.rms<best.rms) best=r; } console.log(`rule best b ${fmt(best.b,3)} rms ${fmt(best.rms,3)} step ${fmt(best.D,2)}deg ratio ${fmt(1/best.stepRatio,4)}`); }
// leaf scale vs distance to pole (self-similarity test)
for (const [nm,c] of [['free pole',fitSpiral(tips)],['golden pole',fitSpiral(tips,-B_GOLD)]]) {
  const r = tips.map(p=>Math.hypot(p[0]-c.cx,p[1]-c.cy)); console.log(`${nm} (${fmt(c.cx,2)},${fmt(c.cy,2)}): leaf scale / tip radius:`, scales.map((s,i)=>fmt(s/r[i]*100,3)).join(' '), ' (constant => leaves self-similar along spiral)');
  const sc = spiralGivenCentre(tips,c.cx,c.cy); console.log('   tip polar angle steps', sc.th.slice(1).map((t,i)=>fmt((t-sc.th[i])*180/Math.PI,1)).join(' '), ' leaf rotation steps', rots.slice(1).map((v,i)=>fmt(v-rots[i],1)).join(' '));
}
const lg = linreg(scales.map((_,i)=>i), scales.map(Math.log)), ln = linreg(scales.map((_,i)=>i), scales);
console.log('leaf scale sequence: geometric fit ratio', fmt(Math.exp(-lg.slope),4), 'R2', fmt(lg.r2,4), ' arithmetic fit step', fmt(ln.slope,4), 'R2', fmt(ln.r2,4));
const geoPred = scales.map((_,i)=>Math.exp(lg.icpt+lg.slope*i)); console.log('  geometric-fit residuals (x leaf-9 length 37.27u):', scales.map((s,i)=>fmt((s-geoPred[i])*37.27,2)).join(' '));
const gold = scales.map((_,i)=>Math.pow(PHI,-i/2)); console.log('  phi^(-k/2) sequence', gold.map(v=>fmt(v,3)).join(' '), ' phi^(-k*0.55)...: first/last actual', fmt(1/scales[5],3), '= phi^', fmt(Math.log(1/scales[5])/Math.log(PHI),3));
