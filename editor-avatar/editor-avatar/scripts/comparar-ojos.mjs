import { readFile,writeFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { escaparHTML } from '../js/utilidades.js';
import { opcionesOjosVisibles } from '../js/kme-opciones-ojos.js';
const raiz=new URL('../',import.meta.url),url=new URL('datos/kme.json',raiz);
const d=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){
  p.capas[capa]=[p.capas[capa]].flat();
  for(const ruta of p.capas[capa]){const s=await readFile(new URL(ruta,url),'utf8');archivos.set(ruta,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}
}
const c=new Catalogo(d,archivos);let i=0;
const ojosVisibles=opcionesOjosVisibles(c);
function tarjeta(p){
  const a=structuredClone(c.porDefecto);a.rostro='redondo';a.ojos.estilo=p.id;a.ojos.color='#775d43';a.boca='sonrisa';a.maquillaje.mejillas='acuarela';
  return '<article>'+svgDelAvatar(c,a,{id:'ojos-comparacion-'+(++i),recorte:'70 74 260 214',soloCapas:['cabeza','maquillaje','ojos','boca']})+'<h3>'+escaparHTML(p.nombre.replace('Nuevo · ',''))+'</h3></article>';
}
let secciones='';
for(const familia of ['redondos','almendrados','alargados'])secciones+='<section><h2>'+familia+'</h2><div class="grid">'+ojosVisibles.filter(p=>p.coleccion==='kme-sugeridos'&&p.id.startsWith('kme-'+familia+'-')).map(tarjeta).join('')+'</div></section>';
const anteriores=c.piezas('ojos.estilo').filter(p=>p.coleccion!=='kme-sugeridos').map(tarjeta).join('');
const opciones=d.paletas.ojos.map(color=>'<option value="'+color+'"'+(color==='#775d43'?' selected':'')+'>'+escaparHTML(d.nombresColor[color])+'</option>').join('');
const html=`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>K-ME · Nuevas miradas para comparar</title>
<style>*{box-sizing:border-box}body{font:16px system-ui;color:#282126;background:#faf7f5;margin:0;padding:24px}main{max-width:1400px;margin:auto}h1{font-size:clamp(1.5rem,4vw,2.3rem);letter-spacing:-.04em}h2{text-transform:capitalize;margin-top:32px}p{max-width:800px;line-height:1.6}a{color:#873052}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}article{background:#fff;border:1px solid #eadfe2;border-radius:18px;overflow:hidden}article>svg{display:block;width:100%;background:#fffaf7}h3{font-size:.8rem;line-height:1.5;padding:12px;margin:0;font-weight:600}label{display:flex;align-items:center;gap:12px;flex-wrap:wrap}select{font:inherit;min-height:44px;padding:8px;border:1px solid #b995a3;border-radius:8px}summary{cursor:pointer;padding:16px 0;color:#873052}select:focus-visible,summary:focus-visible,a:focus-visible{outline:3px solid #a21951;outline-offset:3px}@media(max-width:480px){body{padding:16px}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}</style>
<main><a href="KME_ABRIR_MUESTRA.html">Volver al editor</a><h1>Una línea, un iris y tu mirada.</h1>
<p>Propuesta para revisar contigo. El ojo se sugiere con una línea suave, sin borde cerrado ni blanco opaco. La forma del iris cambia en cada familia. La pupila conserva el punto del logo K-ME, con brillo fijo de estrella.</p>
<label>Color del iris <select id="color">${opciones}</select></label>
<p>12 opciones nuevas con brillo fijo. Los ojos anteriores siguen disponibles para comparar. En el editor, las nuevas opciones empiezan por «Nuevo».</p>
${secciones}<details><summary>Comparar con los 12 ojos anteriores</summary><div class="grid">${anteriores}</div></details></main>
<script>document.querySelector('#color').onchange=function(){for(const s of document.querySelectorAll('article svg style'))s.textContent=s.textContent.replace(/(\\.f-ojos\\{fill:)[^}]+/g,'$1'+this.value);};</script></html>`;
await writeFile(new URL('KME_COMPARAR_OJOS.html',raiz),html,'utf8');
console.log('Comparación lista: 12 opciones nuevas con estrella y 12 anteriores.');
