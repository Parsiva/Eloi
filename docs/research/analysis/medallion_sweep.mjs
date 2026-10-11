import { loadSprite, elementSegments, sampleSegs, fmt, linreg, fitSpiral, fitCircle, spiralGivenCentre, spiralGivenCentreFixedB, B_GOLD, PHI } from './geom.mjs';
const P = loadSprite()['corner-medallion'];
const S = i => elementSegments(P.els[i]);
// model tests on a run [s0,s1] of path samples
function models(name, samp, s0, s1) {
  const q = samp.filter(p => p.s >= s0 && p.s <= s1 && isFinite(p.k));
  const ss = q.map(p => p.s - q[0].s), kk = q.map(p => Math.abs(p.k));
  const circleCV = (()=>{const m=kk.reduce((a,b)=>a+b)/kk.length; return Math.sqrt(kk.reduce((a,b)=>a+(b-m)**2,0)/kk.length)/m;})();
  const clo = linreg(ss, kk);
  const rho = kk.map(k=>1/k); const ces = linreg(ss, rho);
  // power law k = c*(s - s_inf)^p with s_inf = start (assumed inflection) -> log-log
  const ok = ss.map((s,i)=>[s,kk[i]]).filter(x=>x[0]>1e-6 && x[1]>1e-7);
  const pw = linreg(ok.map(x=>Math.log(x[0])), ok.map(x=>Math.log(x[1])));
  const ex = linreg(ss, kk.map(Math.log));
  const turn = q.reduce((a,p,i)=> i? a + (p.s-q[i-1].s)*Math.abs(p.k) : 0, 0)*180/Math.PI;
  console.log(`${name}: s ${fmt(s0,0)}..${fmt(s1,0)} len ${fmt(s1-s0,1)} turn ${fmt(turn,0)}deg  k ${fmt(Math.min(...kk),4)}..${fmt(Math.max(...kk),4)}  circleCV ${fmt(circleCV,2)}  clothoid(k~s) R2 ${fmt(clo.r2,3)}  logspiral(rho~s) R2 ${fmt(ces.r2,3)} b=${fmt(ces.slope,3)}  exp(k~e^cs) R2 ${fmt(ex.r2,3)}  power k~s^p p=${fmt(pw.slope,2)} R2 ${fmt(pw.r2,3)}`);
}
const s113 = sampleSegs(S(113), 600);
const s114 = sampleSegs(S(114), 600);
// find inflection & extremum positions
function events(samp, label){ const ev=[]; for(let i=1;i<samp.length;i++){ if(Math.sign(samp[i].k)!==Math.sign(samp[i-1].k)) ev.push(`infl s=${fmt(samp[i].s,1)} (${fmt(samp[i].x,1)},${fmt(samp[i].y,1)})`);} 
  for(let i=2;i<samp.length-2;i++){ const a=Math.abs(samp[i].k); if(a>Math.abs(samp[i-2].k)&&a>=Math.abs(samp[i+2].k)&&a>Math.abs(samp[i-1].k)&&a>=Math.abs(samp[i+1].k)) ev.push(`|k|max s=${fmt(samp[i].s,1)} k=${fmt(samp[i].k,4)} (${fmt(samp[i].x,1)},${fmt(samp[i].y,1)})`);} console.log(label, ev.join('; ')); }
events(s113,'113 events:'); events(s114,'114 events:');
// S-sweep: 113 inflection at ~134 to |k| max ~268; and 114 inflection ~146 to max ~273
const infl = (samp, lo, hi) => samp.filter(p=>p.s>lo&&p.s<hi).reduce((a,b)=>Math.abs(b.k)<Math.abs(a.k)?b:a);
const i113 = infl(s113, 100, 200), i114 = infl(s114, 100, 200);
console.log('inflection 113', fmt(i113.s,1), fmt(i113.x,1), fmt(i113.y,1), ' 114', fmt(i114.s,1), fmt(i114.x,1), fmt(i114.y,1));
models('113 upper limb (inflection->|k|max)', s113, i113.s, 268);
models('113 lower limb (inflection->back toward stem, reversed s)', s113.map(p=>({...p, s: i113.s - p.s})).reverse(), 0, i113.s-57);
models('113 medallion arc seg2-3 (s 290-560)', s113, 292, 560);
models('114 upper limb', s114, i114.s, 273);
models('114 lower limb (reversed)', s114.map(p=>({...p, s: i114.s - p.s})).reverse(), 0, i114.s-60);
// circle fit to 113 arc and compare with medallion ellipse
const arc = s113.filter(p=>p.s>=292&&p.s<=560).filter((_,i)=>i%5===0).map(p=>[p.x,p.y]);
const c = fitCircle(arc); console.log('113 arc circle fit: centre', fmt(c.cx,2), fmt(c.cy,2), 'r', fmt(c.r,2), 'rms', fmt(c.rms,3), 'max', fmt(c.maxAbs,3), ' medallion ellipse centre 129.82,130.63 rx 72.78 ry 70.06; r/rx', fmt(c.r/72.78,4), 'r/ry', fmt(c.r/70.06,4), 'r/mean', fmt(c.r/71.42,4));
// how far is arc from concentric ring
const ring = arc.map(p=>Math.hypot(p[0]-129.82,p[1]-130.63)); console.log(' distance of arc from ellipse centre: min',fmt(Math.min(...ring),2),'max',fmt(Math.max(...ring),2));
// whole S sweep: spiral fit of upper limb (geometric)
for (const [nm, samp, a, b] of [['113 upper limb', s113, i113.s, 290], ['114 upper limb', s114, i114.s, 292], ['113 lower limb', s113, 57, i113.s]]) {
  const pts = samp.filter(p=>p.s>=a&&p.s<=b).filter((_,i)=>i%4===0).map(p=>[p.x,p.y]);
  const sp = fitSpiral(pts, null, [[129.8,130.6],[150,150],[100,100],[200,250],[60,250]]); const ci = fitCircle(pts);
  console.log(`${nm}: geo log-spiral b ${fmt(sp.b,3)} rms ${fmt(sp.rms,3)} sweep ${fmt(sp.sweep*180/Math.PI,0)} pole (${fmt(sp.cx,1)},${fmt(sp.cy,1)}) | circle rms ${fmt(ci.rms,3)} r ${fmt(ci.r,1)}`);
  const g = fitSpiral(pts, B_GOLD, [[sp.cx,sp.cy],[129.8,130.6],[150,150]]); const g2 = fitSpiral(pts, -B_GOLD, [[sp.cx,sp.cy],[129.8,130.6],[150,150]]);
  console.log(`   golden-b forced: rms ${fmt(Math.min(g.rms,g2.rms),3)} max ${fmt(Math.max(...(g.rms<g2.rms?g:g2).res.map(Math.abs)),3)}`);
}
// sockets
const xs=[32.94,44.45,61.34,72.85]; const gaps=xs.slice(1).map((x,i)=>x-xs[i]); console.log('bottom stem x',xs,'gaps',gaps.map(g=>fmt(g,2)),'middle/outer',fmt(gaps[1]/gaps[0],4),'total',fmt(xs[3]-xs[0],2), 'phi',fmt(PHI,4));
