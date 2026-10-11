import { loadSprite, elementSegments, sampleSegs } from './geom.mjs';
const sp = loadSprite(); const P = sp[process.argv[2]];
P.els.forEach((el,i)=>{const segs=elementSegments(el); if(!segs.length){console.log(i,el.tag,JSON.stringify(el.attrs));return;}
 const s=sampleSegs(segs,50); const a=s[0],b=s[s.length-1];
 let xs=s.map(p=>p.x),ys=s.map(p=>p.y);
 console.log(i,el.tag,'nseg',segs.length,'start',a.x.toFixed(1),a.y.toFixed(1),'end',b.x.toFixed(1),b.y.toFixed(1),'len',b.s.toFixed(1),'bbox',Math.min(...xs).toFixed(0),Math.min(...ys).toFixed(0),Math.max(...xs).toFixed(0),Math.max(...ys).toFixed(0), el.attrs['stroke-width']||'');});
