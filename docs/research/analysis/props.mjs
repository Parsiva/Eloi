import { loadSprite, elementSegments, sampleSegs, fmt, PHI } from './geom.mjs';
const sp = loadSprite();
export function bboxOf(piece, ids){ let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(const i of ids){ const segs=elementSegments(sp[piece].els[i]); if(!segs.length) continue; for(const q of sampleSegs(segs,200)){x0=Math.min(x0,q.x);y0=Math.min(y0,q.y);x1=Math.max(x1,q.x);y1=Math.max(y1,q.y);} } return {x0,y0,x1,y1,w:x1-x0,h:y1-y0}; }
export function phiNear(r){ const k=Math.log(r)/Math.log(PHI); const kr=Math.round(k*2)/2; return `phi^${fmt(k,2)} (nearest half-power phi^${kr}=${fmt(PHI**kr,3)}, err ${fmt((r/PHI**kr-1)*100,1)}%)`; }
const show=(lab,r)=>console.log(`  ${lab}: ${fmt(r,4)}  = ${phiNear(r)}`);
if (import.meta.url.endsWith('props.mjs')) {
  const all = n => sp[n].els.map((_,i)=>i);
  // CREST
  console.log('CREST');
  const C = bboxOf('crest', all('crest')); console.log(' bbox', [C.x0,C.y0,C.x1,C.y1].map(v=>fmt(v,2)), 'w', fmt(C.w,2), 'h', fmt(C.h,2));
  // mirror symmetry check about x=854.91
  let maxd=0; const L=[0,1,2,3,4,5,6,7,8,9,10], R=[11,12,13,14,15,16,17,18,19,20,21];
  L.forEach((i,k)=>{ const a=elementSegments(sp.crest.els[i]), b=elementSegments(sp.crest.els[R[k]]); a.forEach((sg,j)=>sg.p.forEach((p,m)=>{ const q=b[j].p[m]; maxd=Math.max(maxd, Math.hypot(2*854.91-p[0]-q[0], p[1]-q[1])); })); });
  console.log(' mirror symmetry max ctrl-pt deviation about x=854.91:', fmt(maxd,3));
  const up = bboxOf('crest',[1,12]), upIn = bboxOf('crest',[10,21]), low = bboxOf('crest',[0,11]), wingL = bboxOf('crest',[2,5,9]);
  console.log(' outer upper heart (1,12)', [up.x0,up.y0,up.x1,up.y1].map(v=>fmt(v,2)), 'w',fmt(up.w,2),'h',fmt(up.h,2));
  console.log(' inner upper heart (10,21)', [upIn.x0,upIn.y0,upIn.x1,upIn.y1].map(v=>fmt(v,2)), 'w',fmt(upIn.w,2),'h',fmt(upIn.h,2));
  console.log(' lower heart (0,11)', [low.x0,low.y0,low.x1,low.y1].map(v=>fmt(v,2)), 'w',fmt(low.w,2),'h',fmt(low.h,2));
  console.log(' left wing (2,5,9)', [wingL.x0,wingL.y0,wingL.x1,wingL.y1].map(v=>fmt(v,2)), 'w',fmt(wingL.w,2),'h',fmt(wingL.h,2));
  // axis features (y): top tip 0.07; inner tip 6.36; heart junction (cusp) 21.48; lower heart bottom 43.63; wing tips y 44.57; overall bottom
  const ys = { topTip: 0.07, innerTip: 6.36, cusp: 21.48, upperHeartBottom: up.y1, lowerHeartBottom: low.y1, wingTipY: 44.57, wingRootY: 17.99, bottom: C.y1 };
  console.log(' axis y:', JSON.stringify(Object.fromEntries(Object.entries(ys).map(([k,v])=>[k,fmt(v,2)]))));
  const H = C.y1 - 0.07; console.log(' axis features as fraction of crest height', fmt(H,2), ':', Object.entries(ys).map(([k,v])=>`${k} ${fmt((v-0.07)/H,3)}`).join(', '));
  show('crest width / height', C.w/C.h);
  show('overall width / outer upper heart width', C.w/up.w);
  show('outer upper heart w / inner upper heart w', up.w/upIn.w);
  show('outer upper heart h / inner upper heart h', up.h/upIn.h);
  show('outer upper heart w / lower heart w', up.w/low.w);
  show('outer upper heart h / lower heart h', up.h/low.h);
  show('cusp depth: (cusp - top) / (bottom of lower heart - cusp)', (21.48-0.07)/(low.y1-21.48));
  show('upper heart w/h', up.w/up.h); show('lower heart w/h', low.w/low.h);
  show('wing span (811.13..898.69) / upper heart w', (898.69-811.13)/up.w);
  // wing feathers 6..9 lengths
  const wl=[3,4,6,7,8,9,5,2].map(i=>{const s=sampleSegs(elementSegments(sp.crest.els[i]),200); return [i, s[s.length-1].s];}); console.log(' left-wing path lengths', wl.map(([i,l])=>`#${i}:${fmt(l,1)}`).join(' '));
  // tips of wing hooks 7,8,9 (end points) and 3,4,6
  for (const i of [7,8,9,3,4,6]) { const s=elementSegments(sp.crest.els[i]); const e=s[s.length-1].p[3]; console.log(`  hook #${i} end (${fmt(e[0],2)},${fmt(e[1],2)}) dist from cusp-axis ${fmt(854.91-e[0],2)}`); }

  // SIDE LEAF
  console.log('\nSIDE LEAF');
  const S = bboxOf('side-leaf', all('side-leaf')); console.log(' bbox', [S.x0,S.y0,S.x1,S.y1].map(v=>fmt(v,2)), 'w', fmt(S.w,2), 'h', fmt(S.h,2));
  show('height / width', S.h/S.w);
  const yc = 631.7; console.log(' axis of mirror symmetry y =', yc, ' half-height top', fmt(yc-S.y0,2), 'bottom', fmt(S.y1-yc,2));
  // leaf tip points (leftmost points of paths 5,6 tips) and lobe features
  const feat = {};
  for (const i of [0,3,4,5,6,8,13,2,1]) { const s = sampleSegs(elementSegments(sp['side-leaf'].els[i]),300); const left = s.reduce((a,b)=>b.x<a.x?b:a); const top = s.reduce((a,b)=>b.y<a.y?b:a); feat[i]={left:[left.x,left.y], top:[top.x,top.y]}; console.log(`  #${i} leftmost (${fmt(left.x,2)},${fmt(left.y,2)}) topmost (${fmt(top.x,2)},${fmt(top.y,2)})  -> dist above axis of leftmost ${fmt(yc-left.y,2)}`); }
}
