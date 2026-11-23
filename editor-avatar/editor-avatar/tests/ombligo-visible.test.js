import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { seleccionarPiezaKme } from '../js/kme-ropa.js';
test('El ombligo queda sugerido dentro del abdomen visible con cintura alta o baja y nunca sobre una prenda larga',async()=>{
  const url=new URL('../datos/kme.json',import.meta.url),d=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
  for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){p.capas[capa]=[p.capas[capa]].flat();for(const ruta of p.capas[capa]){const s=await readFile(new URL(ruta,url),'utf8');archivos.set(ruta,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}}
  const c=new Catalogo(d,archivos);
  for(const top of c.piezas('ropa.arriba').filter(p=>p.topCorto))for(const inferior of ['falda-integrada-medio','denim-star-abajo-medio']){
    const a=structuredClone(c.porDefecto);seleccionarPiezaKme(c,a,'ropa.arriba',top.id);seleccionarPiezaKme(c,a,'ropa.abajo',inferior);
    const svg=svgDelAvatar(c,a),marca=svg.match(/<circle data-parte="ombligo"[^>]*>/)?.[0];
    assert.ok(marca,top.id+'/'+inferior+': ombligo visible');
    const y=Number(marca.match(/cy="([^"]+)"/)[1]);assert.ok(y>=346&&y<(c.pieza('ropa.abajo',inferior).cinturaY||350));
  }
  const a=structuredClone(c.porDefecto);seleccionarPiezaKme(c,a,'ropa.arriba','school-remix-arriba-medio');
  assert.doesNotMatch(svgDelAvatar(c,a),/data-parte="ombligo"/);
});
