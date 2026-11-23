// Lámina local para revisar las combinaciones que realmente permite el editor.
import { readFile,writeFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { seleccionarPiezaKme } from '../js/kme-ropa.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { escaparHTML } from '../js/utilidades.js';
const raiz=new URL('../',import.meta.url),url=new URL('datos/kme.json',raiz);
const d=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){
  p.capas[capa]=[p.capas[capa]].flat();
  for(const ruta of p.capas[capa]){const s=await readFile(new URL(ruta,url),'utf8');archivos.set(ruta,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}
}
const c=new Catalogo(d,archivos),conjuntos=new Map();let elecciones=0;
for(const arriba of c.piezas('ropa.arriba'))for(const abajo of c.piezas('ropa.abajo'))for(const cuerpo of c.piezas('cuerpo'))for(const orden of [0,1]){
  const a=structuredClone(c.porDefecto),pasos=[['ropa.arriba',arriba.id],['ropa.abajo',abajo.id]];
  if(orden)pasos.reverse();for(const [ruta,id] of pasos)seleccionarPiezaKme(c,a,ruta,id);
  seleccionarPiezaKme(c,a,'cuerpo',cuerpo.id);elecciones++;
  conjuntos.set([a.cuerpo,a.ropa.arriba,a.ropa.abajo].join('/'),a);
}
let contenido='',i=0;
for(const a of conjuntos.values()){
  const nombre=[c.pieza('cuerpo',a.cuerpo).nombre,c.pieza('ropa.arriba',a.ropa.arriba).nombre,c.pieza('ropa.abajo',a.ropa.abajo).nombre].map(escaparHTML).join(' / ');
  contenido+='<article><h2>'+nombre+'</h2><div class="variaciones">';
  for(const [piel,superior,inferior] of [['#fff5ef','#fffaf7','#6e737b'],['#a96f4c','#e83475','#282126'],['#7a4a33','#282126','#e83475']]){
    const b=structuredClone(a);b.piel=piel;b.ropa.colorArriba=superior;b.ropa.colorAbajo=inferior;
    contenido+=svgDelAvatar(c,b,{id:'revision-'+(++i),recorte:'90 264 220 190',soloCapas:['cuerpo','piernas','ropa_abajo','ropa_arriba'],ancho:220,alto:190});
  }
  contenido+='</div></article>';
}
const html=`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>K-ME · Revisión de uniones</title>
<style>*{box-sizing:border-box}body{font:15px system-ui;color:#282126;background:#faf7f5;margin:24px}main{max-width:1600px;margin:auto}h1{font-size:1.7rem}p{line-height:1.5;max-width:900px}a{color:#8b2251}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr));gap:16px}article{background:#fff;border:1px solid #ded1d6;border-radius:16px;overflow:hidden;padding:12px}h2{font-size:.85rem;min-height:38px;margin:0 0 12px}.variaciones{display:flex;background:#f6edf1}.variaciones>svg{width:33.333%;height:auto;display:block}#resultado{font-weight:600}button{font:inherit;padding:12px;border:1px solid #8b2251;border-radius:8px;background:#fff;color:#8b2251;cursor:pointer}button:focus-visible{outline:3px solid #8b2251}</style>
<main><a href="KME_ABRIR_MUESTRA.html">Volver al editor</a><h1>Ropa y cuerpo: revisión de cintura</h1>
<p>${elecciones} secuencias de elección producen ${conjuntos.size} conjuntos diferentes. Aquí se muestran todos, cada uno con tres combinaciones de piel y ropa. Las opciones repetidas se agrupan. Cada conjunto conserva la forma de sus prendas al cambiar de tamaño.</p>
<p>La comprobación de contornos cubre la franja de cintura. Esta lámina sirve para revisar además el aspecto de mangas, caderas y piernas.</p>
<button id="comprobar">Comprobar huecos al dibujar en este navegador</button><p id="resultado" role="status">Pendiente de comprobación en navegador.</p><div class="grid">${contenido}</div></main>
<script>
document.querySelector('#comprobar').onclick=async function(){
this.disabled=true;const salida=document.querySelector('#resultado');salida.textContent='Dibujando todos los conjuntos…';let revisados=0,fallos=[];
try{for(const svg of document.querySelectorAll('.variaciones>svg')){
const texto=new XMLSerializer().serializeToString(svg),imagen=new Image();
await new Promise((ok,error)=>{imagen.onload=ok;imagen.onerror=error;imagen.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(texto);});
const canvas=document.createElement('canvas');canvas.width=220;canvas.height=190;const ctx=canvas.getContext('2d');ctx.drawImage(imagen,0,0);
const datos=ctx.getImageData(0,0,220,190).data;let huecos=0;
for(let y=357;y<=367;y++)for(let x=173;x<=227;x++)if(datos[((y-264)*220+x-90)*4+3]<240)huecos++;
if(huecos)fallos.push(svg.id+': '+huecos+' píxeles');revisados++;
}salida.textContent=fallos.length?'Revisados '+revisados+' dibujos. Revisar: '+fallos.join('; '):'Revisados '+revisados+' dibujos: sin huecos transparentes en la franja de cintura.';
}catch(error){salida.textContent='No se pudo terminar la comprobación en este navegador.';console.error(error);}this.disabled=false;
};
</script></html>`;
await writeFile(new URL('KME_REVISAR_UNIONES.html',raiz),html,'utf8');
console.log(`${elecciones} elecciones; ${conjuntos.size} conjuntos; ${i} dibujos de revisión.`);
