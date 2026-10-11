import { loadSprite, elementSegments, sampleSegs, fmt } from './geom.mjs';
const [piece, idx, nb='20'] = process.argv.slice(2);
const P = loadSprite()[piece];
const segs = elementSegments(P.els[+idx]);
const s = sampleSegs(segs, 400).filter(q=>isFinite(q.k));
const L = s[s.length-1].s; const N=+nb;
console.log(`${piece}#${idx} length ${fmt(L,1)} segs ${segs.length}; joins at s=`, segs.map((_,j)=>fmt(s.find(q=>q.seg===j)?.s??0,1)).join(','));
for (let i=0;i<=N;i++){ const target=L*i/N; const q=s.reduce((a,b)=>Math.abs(b.s-target)<Math.abs(a.s-target)?b:a); console.log(`  s ${fmt(q.s,1).toString().padStart(6)} (${fmt(q.x,1)},${fmt(q.y,1)}) seg${q.seg} k ${fmt(q.k,4)}  rho ${fmt(1/Math.abs(q.k),1)}`); }
