// Revisión auxiliar de geometría SVG: ráster sin navegador ni dependencias.
// Solo ropa/cuerpo; las curvas, rellenos y recortes proceden del renderizador.
import { readFile, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { seleccionarPiezaKme } from '../js/kme-ropa.js';
import { mascara } from '../tests/helpers/silueta-ropa.js';
const url=new URL('../datos/kme.json',import.meta.url),d=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){p.capas[capa]=[p.capas[capa]].flat();for(const ruta of p.capas[capa]){const s=await readFile(new URL(ruta,url),'utf8');archivos.set(ruta,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}}
const tops=process.argv.includes('--tops');
const c=new Catalogo(d,archivos),modelos=tops?['top-orbita','top-halter','top-deportivo','top-cruzado','top-holgado']:['cargo-beat','denim-layer','school-remix','racing-pop','pocket-pop','ribbon-punk','denim-star','stage-noir'];
const W=modelos.length*180,H=540,pixeles=Buffer.alloc(W*H*4,255);
const attr=(s,k)=>s.match(new RegExp('\\b'+k+'="([^"]*)"'))?.[1];
function color(hex){if(!hex||hex==='none')return null;hex=hex.replace('#','');if(hex.length===3)hex=hex.split('').map(x=>x+x).join('');return [0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));}
function segmentos(path){
  const t=path.match(/[MLCQHVZ]|-?\d*\.?\d+/g)||[];let i=0,p=[0,0],inicio,lineas=[],pol;
  const n=()=>Number(t[i++]);
  while(i<t.length){const op=t[i++];if(op==='M'){p=[n(),n()];inicio=p;pol=[p];lineas.push(pol);}
    else if(op==='L'){p=[n(),n()];pol.push(p);}else if(op==='H'){p=[n(),p[1]];pol.push(p);}else if(op==='V'){p=[p[0],n()];pol.push(p);}
    else if(op==='Z'){pol.push(inicio);p=inicio;}else if(op==='C'||op==='Q'){
      const s=p,a=[n(),n()],b=[n(),n()],e=op==='C'?[n(),n()]:b;
      for(let k=1;k<=32;k++){const v=k/32,u=1-v;pol.push(op==='C'?[u**3*s[0]+3*u*u*v*a[0]+3*u*v*v*b[0]+v**3*e[0],u**3*s[1]+3*u*u*v*a[1]+3*u*v*v*b[1]+v**3*e[1]]:[u*u*s[0]+2*u*v*a[0]+v*v*b[0],u*u*s[1]+2*u*v*a[1]+v*v*b[1]]);}p=e;
    }else throw new Error('Revisión no admite '+op);
  }return lineas;
}
function dibujar(svg,col,fila){
  const css=Object.fromEntries([...svg.matchAll(/\.(f-[\w-]+)\{fill:(#[0-9a-f]+)\}/gi)].map(m=>[m[1],m[2]]));
  const clips=new Map([...svg.matchAll(/<clipPath\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/clipPath>/g)].map(m=>[m[1],mascara(m[2])]));
  const pila=[{stroke:'none',width:1,fill:'#000',opacity:1,clips:[]}];let defs=0;
  const poner=(x,y,rgb,alpha,recortes)=>{
    x=Math.round(x);y=Math.round(y);if(x<110||x>=290||y<260||y>=440)return;
    if(recortes.some(m=>!m[y*400+x]))return;
    const p=((fila*180+y-260)*W+col*180+x-110)*4;
    for(let k=0;k<3;k++)pixeles[p+k]=Math.round(rgb[k]*alpha+pixeles[p+k]*(1-alpha));
  };
  for(let tag of svg.match(/<\/?(?:g|path|defs|circle|rect)\b[^>]*>/g)||[]){
    if(tag.startsWith('<defs')){defs++;continue;}if(tag.startsWith('</defs')){defs--;continue;}if(defs)continue;
    if(tag.startsWith('</g')){pila.pop();continue;}
    const padre=pila.at(-1),local={...padre,stroke:attr(tag,'stroke')||padre.stroke,width:Number(attr(tag,'stroke-width')||padre.width),fill:attr(tag,'fill')||padre.fill,opacity:padre.opacity*Number(attr(tag,'opacity')??1),clips:[...padre.clips]};
    const clip=attr(tag,'clip-path')?.match(/#([^)]*)/);if(clip&&clips.has(clip[1]))local.clips.push(clips.get(clip[1]));
    if(tag.startsWith('<g')){pila.push(local);continue;}
    if(tag.startsWith('<rect')){
      const x=Number(attr(tag,'x')||0),y=Number(attr(tag,'y')||0),w=Number(attr(tag,'width')),h=Number(attr(tag,'height'));
      tag=`<path d="M${x} ${y}H${x+w}V${y+h}H${x}Z" fill="${local.fill}"/>`;
    }else if(tag.startsWith('<circle')){
      const x=Number(attr(tag,'cx')),y=Number(attr(tag,'cy')),r=Number(attr(tag,'r'));let path='';
      for(let k=0;k<=32;k++)path+=(k?'L':'M')+(x+Math.cos(k*Math.PI/16)*r)+' '+(y+Math.sin(k*Math.PI/16)*r);tag=tag.replace(/\/>/,` d="${path}Z"/>`);
    }
    const path=attr(tag,'d');if(!path)continue;
    local.fill=css[attr(tag,'class')]||local.fill;
    const relleno=color(local.fill),trazo=color(local.stroke);
    if(relleno){const m=mascara(`<path d="${path}"/>`);for(let y=260;y<440;y++)for(let x=110;x<290;x++)if(m[y*400+x])poner(x,y,relleno,local.opacity,local.clips);}
    if(trazo)for(const puntos of segmentos(path))for(let j=1;j<puntos.length;j++){
      const a=puntos[j-1],b=puntos[j],pasos=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2)),r=local.width/2;
      for(let k=0;k<=pasos;k++)for(let dx=-Math.ceil(r);dx<=r;dx++)for(let dy=-Math.ceil(r);dy<=r;dy++)if(dx*dx+dy*dy<=r*r)poner(a[0]+(b[0]-a[0])*k/pasos+dx,a[1]+(b[1]-a[1])*k/pasos+dy,trazo,local.opacity,local.clips);
    }
  }
}
for(const [fila,talla] of ['delgado','medio','grueso'].entries())for(const [col,id] of modelos.entries()){
  const a=structuredClone(c.porDefecto);seleccionarPiezaKme(c,a,'ropa.arriba',id+'-arriba-'+talla);seleccionarPiezaKme(c,a,'ropa.abajo',(tops?'pocket-pop':id)+'-abajo-'+talla);
  a.ropa.colorArriba=id==='denim-star'||id==='racing-pop'?'#e83475':'#fffaf7';a.ropa.colorAbajo=id==='ribbon-punk'?'#e83475':'#6e737b';
  dibujar(svgDelAvatar(c,a,{soloCapas:['torso','ropa_arriba','piernas','ropa_abajo']}),col,fila);
}
function crc32(b){let c=0xffffffff;for(const v of b){c^=v;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(tipo,b){const t=Buffer.from(tipo),n=Buffer.alloc(4),crc=Buffer.alloc(4);n.writeUInt32BE(b.length);crc.writeUInt32BE(crc32(Buffer.concat([t,b])));return Buffer.concat([n,t,b,crc]);}
const header=Buffer.alloc(13);header.writeUInt32BE(W);header.writeUInt32BE(H,4);header[8]=8;header[9]=6;
const raw=Buffer.alloc((W*4+1)*H);for(let y=0;y<H;y++)pixeles.copy(raw,y*(W*4+1)+1,y*W*4,(y+1)*W*4);
const salida=fileURLToPath(new URL(tops?'../KME_REVISION_TOPS.png':'../KME_REVISION_SILUETAS.png',import.meta.url));await writeFile(salida,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
console.log(salida);
