import { loadSprite, elementSegments, sampleSegs, fmt, PHI } from './geom.mjs';
import { simFit, ctrlPts } from './procrustes.mjs';
const sp = loadSprite();
const cp = (piece,i) => ctrlPts(elementSegments(sp[piece].els[i]));
function cmp(piece, a, b, refl=false){ const A=cp(piece,a), B=cp(piece,b); if(A.length!==B.length) return `#${b}->#${a}: different structure (${B.length} vs ${A.length} ctrl pts)`; const r=simFit(A,B,refl); return `#${b}->#${a}: scale ${fmt(r.scale,4)} rot ${fmt(r.rotDeg,2)} refl ${r.refl} rms ${fmt(r.rms,3)}`; }
console.log('CREST'); for (const [a,b] of [[1,10],[1,0],[10,0],[7,8],[8,9],[7,9],[3,4],[4,6],[3,6]]) console.log(' ', cmp('crest',b,a,true));
console.log('MEDALLION');
for (const [a,b] of [[1,2],[2,3],[3,4],[1,3],[62,63],[63,64],[64,65],[1,62],[2,63],[0,61],[5,61]]) console.log(' ', cmp('corner-medallion',a,b,true));
// small arcs around ring 40..52 : similarity to #43 and placement
for (const i of [40,41,42,43,44,45,46,47,48,49,50,51,52]) console.log('  ring loop', cmp('corner-medallion',43,i,true));
for (const i of [99,100,101,102]) console.log('  stem loop', cmp('corner-medallion',99,i,true));
// ring loop angular positions about ellipse centre
const C=[129.82,130.63]; const angs=[];
for (const i of [40,41,42,43,44,45,46,47,48,49,50,51,52]) { const s=sampleSegs(elementSegments(sp['corner-medallion'].els[i]),50); const m=s.reduce((a,q)=>[a[0]+q.x/s.length,a[1]+q.y/s.length],[0,0]); const ang=Math.atan2(m[1]-C[1],m[0]-C[0])*180/Math.PI; angs.push(ang); console.log(`  loop #${i} centroid (${fmt(m[0],1)},${fmt(m[1],1)}) angle ${fmt(ang,1)} r ${fmt(Math.hypot(m[0]-C[0],m[1]-C[1]),1)}`); }
console.log('  angular steps', angs.slice(1).map((a,i)=>fmt(((a-angs[i]+540)%360)-180,1)).join(' '));
// curls 1-4 and 62-65 lengths
const len = (piece,i)=>{const s=sampleSegs(elementSegments(sp[piece].els[i]),200); return s[s.length-1].s;};
const l1=[1,2,3,4].map(i=>len('corner-medallion',i)); console.log('curls 1-4 lengths', l1.map(v=>fmt(v,2)), 'ratios', l1.slice(1).map((v,i)=>fmt(l1[i]/v,3)));
const l2=[62,63,64,65].map(i=>len('corner-medallion',i)); console.log('curls 62-65 lengths', l2.map(v=>fmt(v,2)), 'ratios', l2.slice(1).map((v,i)=>fmt(l2[i]/v,3)));
// scallops 12..26 widths
const sc=[]; for(let i=12;i<=26;i++){ const s=elementSegments(sp['corner-medallion'].els[i]); sc.push([s[0].p[0][0], s[s.length-1].p[3][0]]); }
console.log('scallop start x', sc.map(v=>fmt(v[0],2)).join(' '), '\n  pitch', sc.slice(1).map((v,i)=>fmt(sc[i][0]-v[0],2)).join(' '));
// hatching lines 70-73 lengths, 80-85
const hl=[70,71,72,73].map(i=>len('corner-medallion',i)); console.log('hatch 70-73 lengths', hl.map(v=>fmt(v,2)), 'ratios', hl.slice(1).map((v,i)=>fmt(hl[i]/v,3)));
const hy=[208.29,199.59,193.27,187.33]; console.log('hatch 70-73 y positions', hy, 'gaps', hy.slice(1).map((v,i)=>fmt(hy[i]-v,2)), 'gap ratios', [8.70,6.32,5.94].slice(1).map((v,i)=>fmt([8.70,6.32,5.94][i]/v,3)));
// SIDE LEAF similarity checks
console.log('SIDE LEAF'); for (const [a,b] of [[0,15],[3,18],[5,6],[9,10],[5,13],[6,13]]) console.log(' ', cmp('side-leaf',a,b,true));
