import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as modulo from '../js/kme-impresion.js';
import { documentoVisual } from './helpers/dom-visual.js';

test('El editor ofrece impresión libre y dos tamaños directos, sin descarga SVG, PNG ni selector intermedio',async()=>{
  const html=await readFile(new URL('../kme-muestras.html',import.meta.url),'utf8');
  for(const id of ['imprimir-avatar','imprimir-55x85','imprimir-54x86'])assert.match(html,new RegExp('id="'+id+'"'));
  assert.doesNotMatch(html,/id="(?:descargar|descargar-png|descargar-tarjeta-pdf|descargar-a4-pdf|tamano-photocard)"|SVG editable/);
});
test('Cada botón solicita su salida correspondiente y utiliza el avatar editado actual',async()=>{
  const doc=documentoVisual(),base=doc.getElementById,nodos={};
  for(const id of ['imprimir-avatar','imprimir-55x85','imprimir-54x86','estado-impresion'])nodos[id]=doc.createElement('button');
  doc.getElementById=id=>nodos[id]||base(id);
  const llamadas=[],vista={estado:{avatar:{nombre:'actual'}}};
  modulo.montarImpresion(doc,{},vista,{imprimir:(...a)=>llamadas.push(['libre',...a]),descargar:(...a)=>llamadas.push(['tarjeta',...a])});
  nodos['imprimir-avatar'].click();nodos['imprimir-55x85'].click();await new Promise(r=>setTimeout(r,0));
  vista.estado.avatar={nombre:'cambiado'};nodos['imprimir-54x86'].click();await new Promise(r=>setTimeout(r,0));
  assert.equal(llamadas.length,3);
  assert.deepEqual(llamadas.map(x=>x[0]),['libre','tarjeta','tarjeta']);
  assert.equal(llamadas[1][3],'55x85');assert.equal(llamadas[2][3],'54x86');
  assert.deepEqual(llamadas[2][2],{nombre:'cambiado'});
});
test('La impresión libre abre el diálogo del navegador sin fijar una medida de tarjeta',()=>{
  assert.equal(typeof modulo.abrirImpresionAvatar,'function');
  let html='',imprimir=0,focus=0;const eventos={};
  const ventana={document:{open(){},write:s=>html+=s,close(){}},addEventListener:(n,fn)=>eventos[n]=fn,focus(){focus++;},print(){imprimir++;},close(){}};
  modulo.abrirImpresionAvatar('<svg viewBox="0 0 400 480"><path data-avatar="actual"/></svg>',()=>ventana);
  assert.match(html,/data-avatar="actual"/);assert.match(html,/@page\s*\{[^}]*size:\s*auto/);
  assert.doesNotMatch(html,/55mm|85mm|54mm|86mm/);assert.equal(imprimir,0);
  eventos.load();assert.equal(imprimir,1);assert.equal(focus,1);
});
test('La tarjeta elimina lienzos anidados que empequeñecen el personaje y conserva la proporción completa',()=>{
  const svg=modulo.svgPhotocard('<svg viewBox="0 0 400 480"><path data-avatar="completo"/></svg>','55x85');
  assert.equal((svg.match(/<svg\b/g)||[]).length,2,'Solo tarjeta y avatar, sin un tercer lienzo vacío');
  assert.match(svg,/viewBox="60 0 280 450"/);
  assert.match(svg,/data-avatar="completo"/);assert.doesNotMatch(svg,/slice|scale\(/);
});
