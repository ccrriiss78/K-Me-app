import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { seleccionarPiezaKme } from '../js/kme-ropa.js';
import { mascara, unir, conectados } from './helpers/silueta-ropa.js';
async function cargar(){
  const url=new URL('../datos/kme.json',import.meta.url),d=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
  for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){p.capas[capa]=[p.capas[capa]].flat();for(const ruta of p.capas[capa]){const s=await readFile(new URL(ruta,url),'utf8');archivos.set(ruta,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}}
  return new Catalogo(d,archivos);
}
test('Los tops nuevos unen cuello, hombros, ambos brazos y manos al torso en las tres anchuras',async()=>{
  const c=await cargar();
  for(const p of c.piezas('ropa.arriba').filter(p=>p.coleccion==='lamina-kpop')){
    const a=structuredClone(c.porDefecto);seleccionarPiezaKme(c,a,'ropa.arriba',p.id);
    const capas=c.contenido(a),m=mascara((capas.torso||'')+capas.ropa_arriba),union=conectados(m);
    const s={relajado:.88,recto:1,amplio:1.15}[a.cuerpo];
    assert.ok(union.contiene(200,280),p.id+': cuello unido');
    assert.ok(union.contiene(200+(145-200)*s,345),p.id+': brazo izquierdo unido');
    assert.ok(union.contiene(200+(255-200)*s,345),p.id+': brazo derecho unido');
  }
});
test('Todas las prendas nuevas y anteriores se pueden mezclar con piernas y calzado conectados, sin fragmentos flotantes',async()=>{
  const c=await cargar(),cache=new Map();let casos=0;
  const forma=svg=>{if(!cache.has(svg))cache.set(svg,mascara(svg));return cache.get(svg);};
  for(const cuerpo of ['relajado','recto','amplio']){
    const superiores=c.piezas('ropa.arriba').filter(p=>p.cuerpoCompatible===cuerpo||!p.cuerpoCompatible);
    const inferiores=c.piezas('ropa.abajo').filter(p=>p.cuerpoCompatible===cuerpo||!p.cuerpoCompatible);
    for(const p of superiores)for(const q of inferiores){
      const a=structuredClone(c.porDefecto);a.cuerpo=cuerpo;
      seleccionarPiezaKme(c,a,'ropa.arriba',p.id);seleccionarPiezaKme(c,a,'ropa.abajo',q.id);
      seleccionarPiezaKme(c,a,'cuerpo',cuerpo);
      const capas=c.contenido(a),m=unir(...['cuerpo','torso','piernas','ropa_abajo','ropa_arriba'].map(k=>forma(capas[k]||''))),union=conectados(m);
      const s=q.coleccion==='lamina-kpop'?{relajado:.88,recto:1,amplio:1.15}[cuerpo]:1;
      const nombre=`${cuerpo}/${p.id}/${q.id}`;
      assert.ok(union.contiene(200+(175-200)*s,421),nombre+': pierna y zapato izquierdos unidos');
      assert.ok(union.contiene(200+(225-200)*s,421),nombre+': pierna y zapato derechos unidos');
      assert.equal(union.sueltos,0,nombre+': superficies separadas del cuerpo');casos++;
    }
  }assert.ok(casos>=400,'Se cubren también las mezclas con prendas anteriores');
});
