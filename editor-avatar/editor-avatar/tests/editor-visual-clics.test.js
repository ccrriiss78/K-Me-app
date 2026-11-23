import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { documentoVisual } from './helpers/dom-visual.js';

test('Pulsar miniaturas y muestras actualiza el único avatar grande y marca la elección sin otro botón',async()=>{
  const url=new URL('../datos/kme.json',import.meta.url),d=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
  for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){p.capas[capa]=[p.capas[capa]].flat();for(const a of p.capas[capa]){const s=await readFile(new URL(a,url),'utf8');archivos.set(a,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}}
  const c=new Catalogo(d,archivos),doc=documentoVisual();let modulo;
  try{modulo=await import('../js/kme-vista-visual.js');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
  modulo?.montarEditorVisual(doc,c);
  const forma=doc.buscar('Forma: Almendrados');assert.ok(forma,'Debe ofrecer una miniatura de forma');
  forma.click();assert.equal(doc.buscar('Forma: Almendrados').getAttribute('aria-pressed'),'true');
  const grande=doc.getElementById('avatar-grande');assert.ok(grande.innerHTML.includes('kme')||grande.innerHTML.includes('almendrados'));
  doc.buscar('Expresión: Abiertos').click();const antes=grande.innerHTML;
  doc.buscar('Color del iris: Magenta pop').click();
  assert.notEqual(grande.innerHTML,antes);assert.match(grande.innerHTML,/\.f-ojos\{fill:#ff27c0\}/);
  assert.equal(doc.buscar('Color del iris: Magenta pop').getAttribute('aria-pressed'),'true');
  assert.ok(doc.buscar('Forma: Almendrados').innerHTML.includes('<svg'),'Miniatura gráfica real');
  doc.getElementById('deshacer').click();assert.doesNotMatch(grande.innerHTML,/\.f-ojos\{fill:#ff27c0\}/);
  doc.buscar('Categoría: Cara').click();assert.ok(doc.buscar('Tono de piel: Cacao'));
  doc.buscar('Tono de piel: Cacao').click();assert.match(grande.innerHTML,/\.f-piel\{fill:#7a4a33\}/);
});
