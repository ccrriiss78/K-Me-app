import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { EditorVisual } from '../js/kme-editor-visual.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { documentoVisual } from './helpers/dom-visual.js';

// Antes de incorporar marcos, la vista muestra el SVG del avatar sin envoltorio.
const modulo=await import('../js/kme-marcos.js').catch(e=>{
  if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;
  return {marcosDisponibles:[],svgConMarco:svg=>svg};
});
async function catalogoMarcos(){
  const url=new URL('../datos/kme.json',import.meta.url),datos=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
  for(const lista of Object.values(datos.piezas))for(const p of lista)for(const capa in p.capas){
    p.capas[capa]=[p.capas[capa]].flat();
    for(const a of p.capas[capa]){const s=await readFile(new URL(a,url),'utf8');archivos.set(a,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}
  }
  return new Catalogo(datos,archivos);
}
test('Se pueden comparar dos portaphotocards completos y una opción sin marco sin cargar imágenes externas',()=>{
  assert.deepEqual(modulo.marcosDisponibles.map(m=>m.id),['sin-marco','transparente','charms']);
  const avatar='<svg viewBox="0 0 400 480"><path data-personaje="prueba"/></svg>';
  assert.equal(modulo.svgConMarco(avatar,'sin-marco'),avatar);
  for(const id of ['transparente','charms']){
    const svg=modulo.svgConMarco(avatar,id);
    assert.match(svg,new RegExp('data-marco="'+id+'"'));
    assert.match(svg,/data-parte="argolla"/);
    assert.match(svg,/data-parte="colgantes"/);
    assert.match(svg,/data-personaje="prueba"/);
    assert.doesNotMatch(svg,/<image|<script|<foreignObject|https?:\/\/(?!www.w3.org)/);
  }
  assert.notEqual(modulo.svgConMarco(avatar,'transparente'),modulo.svgConMarco(avatar,'charms'));
});
test('Los marcos dejan el avatar completo dentro de una ventana y sus definiciones no chocan entre miniaturas',()=>{
  const avatar='<svg viewBox="0 0 400 480"><path/></svg>';
  const a=modulo.svgConMarco(avatar,'charms'),b=modulo.svgConMarco(avatar,'charms');
  assert.match(a,/data-parte="ventana-avatar"[^>]*x="68" y="142" width="304" height="380"/);
  assert.match(a,/preserveAspectRatio="xMidYMid meet"/);
  const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.ok(ids(a).length>0,'El recorte protege la ventana del avatar');
  assert.equal(ids(a).filter(id=>ids(b).includes(id)).length,0);
});
test('El marco de vista previa es independiente del avatar y admite deshacer, restaurar y cambiar de base',async()=>{
  const e=new EditorVisual(await catalogoMarcos()),avatar=structuredClone(e.avatar);
  assert.equal(typeof e.elegirMarco,'function','Se puede elegir el marco desde el editor');
  e.elegirMarco('charms');assert.equal(e.marco,'charms');assert.deepEqual(e.avatar,avatar);
  e.elegirColor('ojos.color','#ff27c0');e.deshacer();assert.equal(e.marco,'charms');
  e.cambiarBase(1);assert.equal(e.marco,'sin-marco');e.elegirMarco('transparente');
  e.cambiarBase(0);assert.equal(e.marco,'charms');e.deshacer();assert.equal(e.marco,'sin-marco');
  e.elegirMarco('charms');e.restaurar();assert.equal(e.marco,'sin-marco');
  assert.throws(()=>e.elegirMarco('inexistente'));assert.equal(e.marco,'sin-marco');
});
test('Elegir la miniatura del marco actualiza la vista grande, marca la selección y mantiene el foco',async()=>{
  const doc=documentoVisual();montarEditorVisual(doc,await catalogoMarcos());
  const categoria=doc.buscar('Categoría: Marcos');assert.ok(categoria,'Categoría de marcos visible');categoria.click();
  const b=doc.buscar('Marco: Con charms');assert.ok(b);assert.match(b.innerHTML,/<svg/);b.focus();b.click();
  assert.match(doc.getElementById('avatar-grande').innerHTML,/data-marco="charms"/);
  assert.equal(doc.buscar('Marco: Con charms').getAttribute('aria-pressed'),'true');
  assert.equal(doc.activeElement,doc.buscar('Marco: Con charms'));
  doc.buscar('Marco: Sin marco').click();assert.doesNotMatch(doc.getElementById('avatar-grande').innerHTML,/data-marco=/);
});
