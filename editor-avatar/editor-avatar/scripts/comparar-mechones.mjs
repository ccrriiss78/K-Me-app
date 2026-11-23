// Comparación de los SVG que se dibujan de verdad en el editor.
import { readFile, writeFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';
const raiz=new URL('../',import.meta.url),url=new URL('datos/kme.json',raiz);
const datos=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
for(const lista of Object.values(datos.piezas))for(const p of lista)for(const capa in p.capas){
  p.capas[capa]=[p.capas[capa]].flat();for(const ruta of p.capas[capa]){const s=await readFile(new URL(ruta,url),'utf8');archivos.set(ruta,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}
}
const c=new Catalogo(datos,archivos);
const cuadros=[['frontales','1 · Mechones frontales'],['varios','2 · Varios tonos'],['capas','3 · Color entre capas']].map(([estilo,nombre],i)=>{
  const a=structuredClone(c.porDefecto);
  Object.assign(a.pelo,{estilo:'cortinas-textura',color:'#674336',acabado:'pinceladas',mechones:estilo,mechon1:'#e83475',mechon2:estilo==='frontales'?'#e83475':'#9673b7',mechon3:'#00c6e8'});
  const dibujo=svgDelAvatar(c,a,{id:'ejemplo-mechon-'+i,soloCapas:['pelo_atras','cabeza','cejas','ojos','boca','pelo_frente'],recorte:'35 10 330 360',ancho:360,alto:400});
  return `<g transform="translate(${35+i*390} 115)"><text x="180" y="0" text-anchor="middle" font-size="22">${nombre}</text>${dibujo.replace('<svg ','<svg y="15" ')}</g>`;
});
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1240 590"><rect width="1240" height="590" fill="#fffaf7"/><g font-family="Arial,sans-serif" fill="#282126"><text x="40" y="48" font-size="30" font-weight="700">K-ME · Mechones con pinceladas B</text><text x="40" y="79" font-size="18">Vista real del editor · color base y mechones independientes</text>${cuadros.join('')}<text x="40" y="560" font-size="16">Elige peinado, colocación y color en Cabello. También puedes quitar los mechones.</text></g></svg>`;
await writeFile(new URL('KME_MECHONES_REALES.svg',raiz),svg);
await writeFile(new URL('KME_MECHONES_REALES.html',raiz),`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>K-ME · Mechones reales</title><style>body{margin:0;background:#fffaf7;color:#282126;font:18px Arial}main{max-width:1240px;margin:auto}svg{display:block;width:100%;height:auto}a{display:block;padding:24px;color:#282126}</style><main>${svg}<a href="KME_ABRIR_MUESTRA.html">Abrir el editor · Cabello → Mechones</a></main></html>`);
console.log('Preparados: KME_MECHONES_REALES.html y .svg');
