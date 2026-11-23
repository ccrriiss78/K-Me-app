import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { documentoVisual } from './helpers/dom-visual.js';
test('Elegir pantalón con sudadera conserva la sudadera y marca ambas miniaturas',async()=>{
  const url=new URL('../datos/kme.json',import.meta.url),d=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
  for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){p.capas[capa]=[p.capas[capa]].flat();for(const a of p.capas[capa]){const s=await readFile(new URL(a,url),'utf8');archivos.set(a,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}}
  const c=new Catalogo(d,archivos),doc=documentoVisual(),vista=montarEditorVisual(doc,c);
  doc.buscar('Categoría: Ropa').click();doc.buscar('Parte superior: Sudadera').click();
  const label='Parte inferior: '+c.pieza('ropa.abajo','cargo-integrada-delgado').nombre;
  doc.buscar(label).click();
  assert.equal(vista.estado.avatar.ropa.arriba,'sudadera');
  assert.equal(doc.buscar('Parte superior: Sudadera').getAttribute('aria-pressed'),'true');
  assert.equal(doc.buscar(label).getAttribute('aria-pressed'),'true');
  assert.match(doc.getElementById('avatar-grande').innerHTML,/sudadera-revisada/);
});
