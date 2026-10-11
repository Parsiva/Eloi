import { loadSprite, elementSegments, sampleSegs, fmt } from './geom.mjs';
// similarity (scale+rotation+translation, optional reflection) fit of point set B onto A (corresponding points)
export function simFit(A, B, allowReflect = false) {
  const n = A.length; const ma = [0,0], mb = [0,0];
  A.forEach(p=>{ma[0]+=p[0]/n;ma[1]+=p[1]/n}); B.forEach(p=>{mb[0]+=p[0]/n;mb[1]+=p[1]/n});
  const fit = (refl) => {
    let sxx=0,sxy=0,nb=0;
    for (let i=0;i<n;i++){ const ax=A[i][0]-ma[0], ay=A[i][1]-ma[1]; let bx=B[i][0]-mb[0], by=(B[i][1]-mb[1])*(refl?-1:1);
      sxx += ax*bx+ay*by; sxy += ay*bx-ax*by; nb += bx*bx+by*by; }
    const s = Math.hypot(sxx,sxy)/nb, th = Math.atan2(sxy,sxx);
    let sse=0; for (let i=0;i<n;i++){ let bx=B[i][0]-mb[0], by=(B[i][1]-mb[1])*(refl?-1:1); const x=s*(Math.cos(th)*bx-Math.sin(th)*by)+ma[0], y=s*(Math.sin(th)*bx+Math.cos(th)*by)+ma[1]; sse+=(x-A[i][0])**2+(y-A[i][1])**2; }
    return { scale: s, rotDeg: th*180/Math.PI, rms: Math.sqrt(sse/n), refl };
  };
  const r0 = fit(false); if (!allowReflect) return r0; const r1 = fit(true); return r1.rms < r0.rms ? r1 : r0;
}
export function ctrlPts(segs){ const out=[segs[0].p[0]]; for(const s of segs){ if(s.type==='C') out.push(s.p[1],s.p[2],s.p[3]); else out.push(s.p[1]); } return out; }
if (import.meta.url.endsWith('procrustes.mjs')) {
  const P = loadSprite()['corner-flame'];
  const leaf = i => elementSegments(P.els[i]).filter(s=>s.type==='C');
  const ref = ctrlPts(leaf(9));
  const scales=[];
  for (const i of [9,10,11,12,13,14]) { const B = ctrlPts(leaf(i)); const r = simFit(B, ref); scales.push(r.scale); console.log('leaf',i,'vs leaf 9: scale',fmt(r.scale,4),'rot',fmt(r.rotDeg,2),'deg, ctrl-pt rms',fmt(r.rms,3)); }
  console.log('successive scale ratios', scales.slice(1).map((v,i)=>fmt(scales[i]/v,4)), 'scale diffs', scales.slice(1).map((v,i)=>fmt(scales[i]-v,4)));
}
