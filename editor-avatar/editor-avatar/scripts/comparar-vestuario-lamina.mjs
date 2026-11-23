// Lámina de revisión hecha con las mismas piezas y el mismo renderizador del editor.
import { readFile, writeFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { seleccionarPiezaKme } from '../js/kme-ropa.js';
const raiz=new URL('../',import.meta.url),url=new URL('datos/kme.json',raiz);
const d=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){
  p.capas[capa]=[p.capas[capa]].flat();
  for(const ruta of p.capas[capa]){const s=await readFile(new URL(ruta,url),'utf8');archivos.set(ruta,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}
}
const c=new Catalogo(d,archivos);
const modelos=['cargo-beat','denim-layer','school-remix','racing-pop','pocket-pop','ribbon-punk','denim-star','stage-noir'];
const pelos=['cortinas-textura','coleta-ondas','doble-mono-lazos','trenza-lateral','media-melena-ondas','corto-despeinado','corto-dos-bloques','semirrecogido-grenas'];
const colores=['#fffaf7','#6e737b','#fffaf7','#e83475','#282126','#e83475','#e83475','#282126'];
const dibujos=modelos.map((id,i)=>{
  const a=structuredClone(c.porDefecto);
  seleccionarPiezaKme(c,a,'ropa.arriba',id+'-arriba-medio');seleccionarPiezaKme(c,a,'ropa.abajo',id+'-abajo-medio');
  a.pelo.estilo=i<4?pelos[0]:pelos[i-3];a.ropa.colorArriba=colores[i];
  a.ropa.colorAbajo=i===5?'#e83475':'#6e737b';a.accesorio='ninguno';
  const x=24+(i%4)*288,y=115+Math.floor(i/4)*390;
  const dibujo=svgDelAvatar(c,a,{id:'look-'+i,recorte:'55 35 290 410',ancho:270,alto:340});
  return `<g transform="translate(${x} ${y})"><text x="135" y="0" text-anchor="middle" font-size="18" font-weight="700">${i+1} · ${c.pieza('ropa.arriba',id+'-arriba-medio').nombre.replace(' · medio','')}</text>${dibujo.replace('<svg ','<svg y="14" ' )}</g>`;
});
const muestrasPelo=pelos.map((id,i)=>{
  const a=structuredClone(c.porDefecto);a.pelo.estilo=id;a.accesorio='ninguno';
  const dibujar=(acabado,indice)=>{a.pelo.acabado=acabado;return svgDelAvatar(c,a,{id:'pelo-'+i+'-'+indice,soloCapas:['pelo_atras','cabeza','cejas','ojos','boca','pelo_frente'],recorte:'35 10 330 360',ancho:135,alto:160}).replace('<svg ',`<svg x="${indice*138}" `);};
  return `<g transform="translate(${28+(i%4)*290} ${960+Math.floor(i/4)*225})">${dibujar('tinta',0)}${dibujar('acuarela',1)}<text x="135" y="185" text-anchor="middle" font-size="15">${c.pieza('pelo.estilo',id).nombre}</text><text x="135" y="207" text-anchor="middle" font-size="12">Tinta · Acuarela</text></g>`;
});
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1430"><rect width="1200" height="1430" fill="#fffaf7"/><g fill="#282126" font-family="Arial,sans-serif"><text x="34" y="45" font-size="30" font-weight="700">K-ME · Vestuario y cabello</text><text x="34" y="77" font-size="17">Adaptación sobre el avatar actual · ocho conjuntos combinables</text><path d="M34 88 H1166" stroke="#e83475" stroke-width="3"/>${dibujos.join('')}<text x="34" y="925" font-size="24" font-weight="700">Ocho peinados adicionales · dos acabados</text>${muestrasPelo.join('')}</g></svg>`;
await writeFile(new URL('KME_VESTUARIO_LAMINA.svg',raiz),svg);
await writeFile(new URL('KME_VESTUARIO_LAMINA.html',raiz),`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>K-ME · Vestuario y cabello</title><style>body{margin:0;background:#fffaf7}main{max-width:1200px;margin:auto}svg{display:block;width:100%;height:auto}a{display:block;padding:20px;color:#282126;font:18px Arial}</style><main>${svg}<a href="KME_ABRIR_MUESTRA.html">Probar las prendas y los peinados en el editor</a></main></html>`);
console.log('Preparados: KME_VESTUARIO_LAMINA.svg y KME_VESTUARIO_LAMINA.html');
