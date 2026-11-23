import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { seleccionarPiezaKme } from '../js/kme-ropa.js';
test('Elegir una parte inferior nueva conserva camiseta, sudadera o chaqueta anterior, en ambos órdenes y sin duplicar las piernas',async()=>{
  const url=new URL('../datos/kme.json',import.meta.url),d=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
  for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){p.capas[capa]=[p.capas[capa]].flat();for(const ruta of p.capas[capa]){const s=await readFile(new URL(ruta,url),'utf8');archivos.set(ruta,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}}
  const c=new Catalogo(d,archivos);
  for(const arriba of ['camiseta','sudadera','chaqueta'])for(const abajo of c.piezas('ropa.abajo').filter(p=>p.coleccion==='lamina-kpop'))for(const orden of [0,1]){
    const a=structuredClone(c.porDefecto),elecciones=[['ropa.arriba',arriba],['ropa.abajo',abajo.id]];if(orden)elecciones.reverse();
    for(const [ruta,id] of elecciones)seleccionarPiezaKme(c,a,ruta,id);
    assert.equal(a.ropa.arriba,arriba,arriba+'/'+abajo.id);
    const todo=Object.values(c.contenido(a)).join('');
    assert.equal((todo.match(/data-parte="piernas"/g)||[]).length,1);
    assert.equal((todo.match(/data-parte="calzado"/g)||[]).length,1);
  }
});
