import { loadSprite, elementSegments, sampleSegs, fmt } from './geom.mjs';
const sp = loadSprite();
for (const piece of ['corner-medallion','corner-flame']) {
  const els = sp[piece].els; const polys = els.map(el=>{const s=elementSegments(el); return s.length? sampleSegs(s,150).map(q=>[q.x,q.y]):null;});
  let onEllipse=[], onCurve=0, total=0, shared=0;
  const ends = []; els.forEach((el,i)=>{ const s=elementSegments(el); if(!s.length) return; const a=s[0].p[0], b=s[s.length-1].p[s[s.length-1].p.length-1]; if (Math.hypot(a[0]-b[0],a[1]-b[1])<0.01) ends.push([i,'closed',a]); else { ends.push([i,'start',a]); ends.push([i,'end',b]); } });
  for (const [i,kind,p] of ends) { if (kind==='closed') continue; total++;
    if (piece==='corner-medallion') { const e=((p[0]-129.82)/72.78)**2+((p[1]-130.63)/70.06)**2; const d=(Math.sqrt(e)-1)*71.4; if (Math.abs(d)<0.3) onEllipse.push(`#${i}.${kind}(${fmt(p[0],1)},${fmt(p[1],1)})`); }
    // lies on another element (within 0.15) ?
    let hit=false; polys.forEach((pl,j)=>{ if(j===i||!pl) return; for(let k=0;k+1<pl.length;k++){ const A=pl[k],B=pl[k+1]; const ex=B[0]-A[0],ey=B[1]-A[1]; const t=Math.max(0,Math.min(1,((p[0]-A[0])*ex+(p[1]-A[1])*ey)/(ex*ex+ey*ey||1))); if(Math.hypot(A[0]+t*ex-p[0],A[1]+t*ey-p[1])<0.15){hit=true;return;} } }); if(hit) onCurve++; }
  console.log(piece, ': open stroke ends', total, '; ends lying on another stroke (<0.15u):', onCurve, `(${fmt(onCurve/total*100,0)}%)`);
  if (onEllipse.length) console.log('  ends on medallion ellipse (|dev|<0.3u):', onEllipse.join(' '));
}
