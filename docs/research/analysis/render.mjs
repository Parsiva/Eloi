import fs from 'node:fs';
import { loadSprite, elementSegments, sampleSegs } from './geom.mjs';
const sp = loadSprite();
const id = process.argv[2]; const scale = +(process.argv[3]||4);
const P = sp[id]; const [vx,vy,vw,vh] = P.viewBox;
const pad=10;
let body='';
const cols=['#c00','#06c','#080','#a0a','#c60','#088','#555'];
P.els.forEach((el,i)=>{
  const a=Object.entries(el.attrs).filter(([k])=>k!=='stroke-width').map(([k,v])=>`${k}="${v}"`).join(' ');
  const c=cols[i%cols.length];
  body+=`<${el.tag} ${a} fill="none" stroke="${c}" stroke-width="${0.6/ (scale/4)}"/>`;
  const segs=elementSegments(el); let lx,ly;
  if(segs.length){ const s=sampleSegs(segs,10); const m=s[Math.floor(s.length/2)]; lx=m.x; ly=m.y; } else { lx=+el.attrs.cx; ly=+el.attrs.cy; }
  body+=`<text x="${lx}" y="${ly}" font-size="${12/scale*2}" fill="${c}">${i}</text>`;
});
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${(vw+2*pad)*scale}" height="${(vh+2*pad)*scale}" viewBox="${vx-pad} ${vy-pad} ${vw+2*pad} ${vh+2*pad}"><rect x="${vx-pad}" y="${vy-pad}" width="${vw+2*pad}" height="${vh+2*pad}" fill="white"/>${body}</svg>`;
fs.writeFileSync(`out_${id}.svg`,svg);
console.log((vw+2*pad)*scale,(vh+2*pad)*scale);
