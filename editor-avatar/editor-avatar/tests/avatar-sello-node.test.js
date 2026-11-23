import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { normalizarAvatar } from '../js/estado.js';
import { svgDelAvatar } from '../js/renderizador.js';
async function cargar(){
  const url=new URL('../datos/kme.json',import.meta.url),d=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
  for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){p.capas[capa]=[p.capas[capa]].flat();for(const ruta of p.capas[capa]){const s=await readFile(new URL(ruta,url),'utf8');archivos.set(ruta,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}}
  return new Catalogo(d,archivos);
}
test('El catálogo precargado y svgDelAvatar dibujan en Node sin document, window, Image ni canvas',async()=>{
  const c=await cargar();assert.equal(typeof document,'undefined');assert.equal(typeof window,'undefined');assert.equal(typeof Image,'undefined');
  const normal=normalizarAvatar({rostro:'ovalado',desconocido:'se ignora'},c.porDefecto);
  assert.equal(normal.rostro,'ovalado');assert.equal(normal.desconocido,undefined);
  for(const pelo of c.piezas('pelo.estilo')){
    normal.pelo.estilo=pelo.id;
    assert.match(svgDelAvatar(c,normal,{conFondo:false}),/^<svg\b/);
  }
});
test('El sello puede omitir el fondo y encuadrar solo las capas de cabeza sin incluir ropa ni calzado',async()=>{
  const c=await cargar();c.capas.unshift({id:'fondo'});c.datos.fijas.push({capa:'fondo',archivo:'fondo-prueba'});c.archivos.set('fondo-prueba','<rect data-fondo-prueba="si" width="400" height="480"/>');
  const a=normalizarAvatar({},c.porDefecto);
  assert.match(svgDelAvatar(c,a),/data-fondo-prueba/);
  assert.doesNotMatch(svgDelAvatar(c,a,{conFondo:false}),/data-fondo-prueba/);
  const head=svgDelAvatar(c,a,{conFondo:false,recorte:'25 -5 350 370',soloCapas:['pelo_atras','cabeza','maquillaje','ojos','maquillaje_detalles','cejas','boca','pelo_frente','accesorio']});
  assert.doesNotMatch(head,/data-parte="(?:camiseta|prenda-superior|prenda|calzado|piernas)"/);
  assert.match(head,/viewBox="25 -5 350 370"/);assert.match(head,/preserveAspectRatio="xMidYMid meet"/);
});
