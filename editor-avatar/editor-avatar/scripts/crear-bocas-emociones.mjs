// Amplía las expresiones sin sustituir las bocas anteriores ni su maquillaje.
import { readFile, writeFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';

const raiz=new URL('../',import.meta.url);
const propuestas=[
  ['tristeza','Tristeza suave','M188 253 Q200 240 212 253','none'],
  ['desanimo','Desánimo','M191 249 Q198 247 204 250 Q208 252 211 251','none'],
  ['puchero','Puchero','M193 250 Q200 242 207 250 Q205 255 200 255 Q195 255 193 250Z','#282126'],
  ['preocupacion','Preocupación','M188 251 Q191 247 195 249 Q200 244 205 249 Q209 247 212 251','none'],
  ['incomodidad','Incomodidad','M189 249 Q192 246 196 250 Q199 253 202 249 Q205 246 209 250 Q211 252 213 249','none'],
  ['enfado','Enfado contenido','M189 252 Q198 247 211 246','none'],
  ['serenidad','Serenidad','M193 248 Q200 250 207 248','none'],
  ['timidez','Sonrisa tímida','M190 247 Q200 255 211 244','none'],
];
const url=new URL('datos/kme.json',raiz),datos=JSON.parse(await readFile(url,'utf8'));
let labios=await readFile(new URL('assets/kme/maquillaje/escenario-labios.svg',raiz),'utf8');
for(const [id,nombre,d,fill] of propuestas){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480"><title>${nombre}</title>\n<g stroke="#282126" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d}" data-contorno-boca="${id}" fill="${fill}"/></g>\n</svg>\n`;
  await writeFile(new URL(`assets/kme/boca/${id}.svg`,raiz),svg);
  if(!datos.piezas.boca.some(p=>p.id===id))datos.piezas.boca.push({id,nombre,capas:{boca:`../assets/kme/boca/${id}.svg`}});
  if(!labios.includes(`data-boca="${id}"`)){
    const grupo=`<g data-boca="${id}" display="none">\n`+[
      ['velo','4.5','.16',''],['pigmento','3.8','.4',''],['grano','4.2','.16',' stroke-dasharray="1.2 2.1 .6 1.4"'],
    ].map(([trazo,ancho,opacidad,extra])=>`<path d="${d}" data-trazo="${trazo}" stroke-width="${ancho}" opacity="${opacidad}"${extra}/>`).join('\n')+'\n</g>\n';
    labios=labios.replace('</g></svg>',grupo+'</g></svg>');
  }
}
await writeFile(url,JSON.stringify(datos,null,2)+'\n');
await writeFile(new URL('assets/kme/maquillaje/escenario-labios.svg',raiz),labios);

// Comparación hecha con las piezas reales del editor, sin ilustración alternativa.
const archivos=new Map();
for(const lista of Object.values(datos.piezas))for(const p of lista)for(const capa in p.capas){
  p.capas[capa]=[p.capas[capa]].flat();
  for(const ruta of p.capas[capa]){const s=await readFile(new URL(ruta,url),'utf8');archivos.set(ruta,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}
}
const c=new Catalogo(datos,archivos);
const tarjetas=datos.piezas.boca.map(p=>{
  const a=structuredClone(c.porDefecto);a.boca=p.id;a.accesorio='ninguno';
  const vista=labial=>{const b=structuredClone(a);b.maquillaje.labios=labial?'pigmento':'nada';return svgDelAvatar(c,b,{soloCapas:['cabeza','cejas','ojos','boca','maquillaje','maquillaje_detalles'],recorte:'85 150 230 135',conFondo:false});};
  return `<article><h2>${p.nombre}</h2><div>${vista(false)}${vista(true)}</div><p>Sin color · Con pigmento suave</p></article>`;
}).join('\n');
const html=`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>K-ME · Bocas y emociones</title><style>body{font-family:system-ui;color:#282126;background:#fffaf7;margin:24px}h1{font-size:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:16px}article{border:1px solid #ddd;border-radius:18px;padding:16px;background:white}h2{font-size:17px;margin:0 0 10px}article div{display:flex}svg{width:50%;height:auto}p{font-size:13px;margin:10px 0 0}</style><h1>Bocas y emociones · Piezas reales del editor</h1><p>Los mismos ojos permiten comparar el gesto de cada boca. En el editor puedes combinarlas libremente.</p><main>${tarjetas}</main></html>`;
await writeFile(new URL('KME_BOCAS_EMOCIONES.html',raiz),html);
console.log('Ocho bocas añadidas, pigmento adaptado y comparación preparada.');
