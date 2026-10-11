import { loadSprite, elementSegments, sampleSegs, fmt, linreg, PHI } from './geom.mjs';
export function polyOf(segs, n=300){ return sampleSegs(segs,n).map(q=>[q.x,q.y]); }
function intersectLine(p, d, poly){ // returns list of t where p + t d hits polyline
  const ts=[]; for(let i=0;i+1<poly.length;i++){ const a=poly[i], b=poly[i+1]; const ex=b[0]-a[0], ey=b[1]-a[1];
    const den = d[0]*(-ey) - d[1]*(-ex); if (Math.abs(den)<1e-12) continue;
    const rx=a[0]-p[0], ry=a[1]-p[1]; const t=(rx*(-ey)-ry*(-ex))/den; const u=(d[0]*ry-d[1]*rx)/den; if(u>=0&&u<=1) ts.push(t);} return ts; }
export function transversal(polys, refIdx, frac){
  const ref=polys[refIdx]; // arc-length param
  const cum=[0]; for(let i=1;i<ref.length;i++) cum.push(cum[i-1]+Math.hypot(ref[i][0]-ref[i-1][0],ref[i][1]-ref[i-1][1]));
  const target=cum[cum.length-1]*frac; let j=cum.findIndex(c=>c>=target); j=Math.max(1,Math.min(j,ref.length-2));
  const p=ref[j]; const tx=ref[j+1][0]-ref[j-1][0], ty=ref[j+1][1]-ref[j-1][1]; const L=Math.hypot(tx,ty); const n=[-ty/L,tx/L];
  const ds=polys.map(poly=>{ const ts=intersectLine(p,n,poly); if(!ts.length) return null; return ts.reduce((a,b)=>Math.abs(b)<Math.abs(a)?b:a); });
  return { p, n, ds };
}
export function gapReport(name, ds){
  const v = ds.map((d,i)=>[i,d]).filter(x=>x[1]!=null).sort((a,b)=>a[1]-b[1]);
  const gaps=[]; for(let i=1;i<v.length;i++) gaps.push(v[i][1]-v[i-1][1]);
  const ratios=gaps.slice(1).map((g,i)=>g/gaps[i]);
  const mean=gaps.reduce((a,b)=>a+b,0)/gaps.length; const cv=Math.sqrt(gaps.reduce((a,b)=>a+(b-mean)**2,0)/gaps.length)/mean;
  // geometric fit: ln gap vs index
  const lg = linreg(gaps.map((_,i)=>i), gaps.map(Math.log));
  const lin = linreg(gaps.map((_,i)=>i), gaps);
  return `${name}: order ${v.map(x=>x[0]).join(',')}  gaps ${gaps.map(g=>fmt(g,2)).join(' ')}  ratios ${ratios.map(r=>fmt(r,2)).join(' ')}  meanGap ${fmt(mean,2)} CV ${fmt(cv,2)}  geomRatio ${fmt(Math.exp(lg.slope),3)} (R2 ${fmt(lg.r2,2)})  linearSlope ${fmt(lin.slope,3)} (R2 ${fmt(lin.r2,2)})`;
}
