// Cotas conservadoras de los SVG: solo archivos locales y matemáticas, sin navegador ni red.
// Incluye puntos de control de curvas (puede dar más aire que el contorno visible), trazos y clips.
import { readFile, writeFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { seleccionarPiezaKme } from '../js/kme-ropa.js';
const numero=/-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
const identidad=[1,0,0,1,0,0];
const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
function matriz(s=''){
  let m=identidad;
  for(const t of s.matchAll(/(translate|scale|rotate|matrix)\(([^)]+)\)/g)){
    const n=t[2].match(numero).map(Number);let q;
    if(t[1]==='translate')q=[1,0,0,1,n[0],n[1]||0];
    if(t[1]==='scale')q=[n[0],0,0,n[1]??n[0],0,0];
    if(t[1]==='matrix')q=n;
    if(t[1]==='rotate'){const a=n[0]*Math.PI/180;q=[Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0];if(n.length===3)q=mul(mul([1,0,0,1,n[1],n[2]],q),[1,0,0,1,-n[1],-n[2]]);}
    m=mul(m,q);
  }return m;
}
const transformar=(p,m)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
const caja=p=>p.length?{x:Math.min(...p.map(p=>p[0])),y:Math.min(...p.map(p=>p[1])),derecha:Math.max(...p.map(p=>p[0])),abajo:Math.max(...p.map(p=>p[1]))}:null;
const unir=cs=>{cs=cs.filter(Boolean);return cs.length?{x:Math.min(...cs.map(c=>c.x)),y:Math.min(...cs.map(c=>c.y)),derecha:Math.max(...cs.map(c=>c.derecha)),abajo:Math.max(...cs.map(c=>c.abajo))}:null;};
const inter=(a,b)=>{if(!a||!b)return null;const r={x:Math.max(a.x,b.x),y:Math.max(a.y,b.y),derecha:Math.min(a.derecha,b.derecha),abajo:Math.min(a.abajo,b.abajo)};return r.x<=r.derecha&&r.y<=r.abajo?r:null;};
const esquinas=c=>[[c.x,c.y],[c.derecha,c.y],[c.derecha,c.abajo],[c.x,c.abajo]];
function puntosPath(d){
  const ts=d.match(/[MLCQZHVmlcqzhv]|-?\d*\.?\d+(?:e[-+]?\d+)?/g)||[],ps=[];let i=0,x=0,y=0,inicio=[0,0],cmd;
  while(i<ts.length){
    if(/^[a-z]$/i.test(ts[i]))cmd=ts[i++];
    const op=cmd.toUpperCase(),rel=cmd!==op,bx=rel?x:0,by=rel?y:0;
    if(op==='Z'){[x,y]=inicio;ps.push(inicio);cmd=null;continue;}
    if(op==='H'){x=Number(ts[i++])+bx;ps.push([x,y]);continue;}
    if(op==='V'){y=Number(ts[i++])+by;ps.push([x,y]);continue;}
    const n=op==='C'?3:op==='Q'?2:1;
    for(let k=0;k<n;k++){x=Number(ts[i++])+bx;y=Number(ts[i++])+by;ps.push([x,y]);}
    if(op==='M'){inicio=[x,y];cmd=rel?'l':'L';}
  }return ps;
}
function cotas(svg,usarClips=true){
  const clips=new Map();
  if(usarClips)for(const m of svg.matchAll(/<clipPath\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/clipPath>/g))clips.set(m[1],cotas(m[2],false));
  const pila=[{m:identidad,stroke:'none',width:1,fill:'#000',clips:[]}],cajas=[];let defs=0;
  const attr=(s,k)=>s.match(new RegExp('(?:^|\\s)'+k+'="([^"]*)"'))?.[1];
  for(const tag of svg.match(/<\/?(?:g|defs|path|ellipse|circle|rect)\b[^>]*>/g)||[]){
    if(tag.startsWith('<defs')){defs++;continue;}if(tag.startsWith('</defs')){defs--;continue;}if(defs)continue;
    if(tag.startsWith('</g')){pila.pop();continue;}
    const p=pila.at(-1),a={m:mul(p.m,matriz(attr(tag,'transform'))),stroke:attr(tag,'stroke')??p.stroke,width:Number(attr(tag,'stroke-width')??p.width),fill:attr(tag,'fill')??p.fill,clips:[...p.clips]};
    const clip=attr(tag,'clip-path')?.match(/#([^)]*)/)?.[1];
    if(clip&&clips.get(clip))a.clips.push(caja(esquinas(clips.get(clip)).map(p=>transformar(p,a.m))));
    if(tag.startsWith('<g')){pila.push(a);continue;}
    if(a.fill==='none'&&a.stroke==='none')continue;
    let ps;
    if(tag.startsWith('<path'))ps=puntosPath(attr(tag,'d')||'');
    else {const x=Number(attr(tag,'x')??attr(tag,'cx')??0),y=Number(attr(tag,'y')??attr(tag,'cy')??0);
      if(tag.startsWith('<rect'))ps=[[x,y],[x+Number(attr(tag,'width')),y+Number(attr(tag,'height'))]];
      else {const rx=Number(attr(tag,'rx')??attr(tag,'r')??0),ry=Number(attr(tag,'ry')??attr(tag,'r')??0);ps=[[x-rx,y-ry],[x+rx,y+ry]];}
      ps=esquinas(caja(ps));
    }
    let c=caja(ps.map(p=>transformar(p,a.m)));if(!c)continue;
    if(a.stroke!=='none'){const margen=a.width/2*Math.max(Math.abs(a.m[0])+Math.abs(a.m[2]),Math.abs(a.m[1])+Math.abs(a.m[3]));c={x:c.x-margen,y:c.y-margen,derecha:c.derecha+margen,abajo:c.abajo+margen};}
    for(const clip of a.clips)c=inter(c,clip);if(c)cajas.push(c);
  }return unir(cajas);
}
const url=new URL('../datos/kme.json',import.meta.url),d=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){p.capas[capa]=[p.capas[capa]].flat();for(const ruta of p.capas[capa]){const s=await readFile(new URL(ruta,url),'utf8');archivos.set(ruta,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}}
const c=new Catalogo(d,archivos),cabeza=['pelo_atras','cabeza','maquillaje','ojos','maquillaje_detalles','cejas','boca','pelo_frente','accesorio'],casos=[];
function caso(nombre,a,grupo){const svg=svgDelAvatar(c,a,{conFondo:false,soloCapas:grupo==='rostro'?cabeza:null});casos.push({nombre,grupo,...cotas(svg)});}
for(const ruta of ['rostro','pelo.estilo','accesorio','ropa.arriba','ropa.abajo','cuerpo'])for(const p of c.piezas(ruta)){
  const a=structuredClone(c.porDefecto);seleccionarPiezaKme(c,a,ruta,p.id);caso(ruta+'/'+p.id,a,['rostro','pelo.estilo','accesorio'].includes(ruta)?'rostro':'cuerpo');
}
for(const p of c.piezas('pelo.estilo'))for(const acabado of ['tinta','acuarela','pinceladas'])for(const mechones of ['sin','frontales','varios','capas']){
  const a=structuredClone(c.porDefecto);a.pelo.estilo=p.id;a.pelo.acabado=acabado;a.pelo.mechones=mechones;caso(p.id+'/'+acabado+'/'+mechones,a,'rostro');
}
const extremos={rostro:unir(casos.filter(c=>c.grupo==='rostro')),cuerpo:unir(casos)};
// Mantiene el eje horizontal del personaje en x=200, añade al menos 8 unidades
// y redondea hacia fuera a múltiplos de cinco. Se permite y negativo para dar aire al pelo.
const recortes=Object.fromEntries(Object.entries(extremos).map(([grupo,b])=>{
  const x=Math.floor(Math.min(b.x-8,400-b.derecha-8)/5)*5,y=Math.floor((b.y-8)/5)*5;
  return [grupo,{x,y,ancho:400-2*x,alto:Math.ceil((b.abajo+8-y)/5)*5}];
}));
const resultado={metodo:'Cotas conservadoras: puntos de control, trazos y clips; margen adicional de 8 unidades; no inspección visual.',casos:casos.length,extremos,recortes,capasRostro:cabeza,registros:casos};
await writeFile(new URL('../propuestas-sello/MEDIDAS_ENCUADRES.json',import.meta.url),JSON.stringify(resultado,null,2)+'\n');
console.log(JSON.stringify({casos:resultado.casos,extremos,recortes},null,2));
