import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { seleccionarPiezaKme } from '../js/kme-ropa.js';
import { svgDelAvatar } from '../js/renderizador.js';
async function cargar(){
  const url=new URL('../datos/kme.json',import.meta.url),d=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
  for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){p.capas[capa]=[p.capas[capa]].flat();for(const ruta of p.capas[capa]){const s=await readFile(new URL(ruta,url),'utf8');archivos.set(ruta,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}}
  return new Catalogo(d,archivos);
}
test('Las 24 partes superiores nuevas dibujan cuello, hombros, brazos y torso con un único perfil visible, sin óvalos superpuestos',async()=>{
  const c=await cargar();let n=0;
  for(const p of c.piezas('ropa.arriba').filter(p=>p.coleccion==='lamina-kpop')){
    const a=structuredClone(c.porDefecto);seleccionarPiezaKme(c,a,'ropa.arriba',p.id);
    const svg=svgDelAvatar(c,a,{soloCapas:['torso','ropa_arriba']});
    assert.equal((svg.match(/data-perfil="superior-unico"/g)||[]).length,1,p.id);
    assert.doesNotMatch(svg,/<path[^>]*data-parte="brazo-/);
    assert.match(svg,/clip-path="url\(#prenda-/,'Mangas y detalles siguen el corte');n++;
  }assert.equal(n,24);
});
test('Las prendas largas llegan a la cintura elegida, alta o baja, y los tops conservan abdomen y ombligo al mezclar todos los inferiores',async()=>{
  const c=await cargar();let n=0;
  for(const p of c.piezas('ropa.arriba').filter(p=>p.coleccion==='lamina-kpop'))for(const q of c.piezas('ropa.abajo').filter(q=>!q.cuerpoCompatible||q.cuerpoCompatible===p.cuerpoCompatible)){
    const a=structuredClone(c.porDefecto);seleccionarPiezaKme(c,a,'ropa.arriba',p.id);seleccionarPiezaKme(c,a,'ropa.abajo',q.id);
    const svg=svgDelAvatar(c,a),d=svg.match(/<path data-parte="prenda-superior" d="([^"]+)"/)?.[1];assert.ok(d);
    const coords=d.match(/-?\d*\.?\d+/g).map(Number),maxY=Math.max(...coords.filter((_,i)=>i%2));
    if(p.topCorto){assert.ok(maxY<340);assert.match(svg,/data-parte="ombligo"/);}
    else {assert.equal(maxY,q.cinturaY||350,p.id+'/'+q.id);assert.doesNotMatch(svg,/data-parte="ombligo"/);}
    n++;
  }assert.equal(n,384); // 336 hasta el lote collage 01; cada falda nueva suma 8 tops × 3 cuerpos (lote 01, E0079; lote 05, E0082)
});
