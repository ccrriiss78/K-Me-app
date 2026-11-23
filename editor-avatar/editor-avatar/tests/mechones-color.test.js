import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { EditorVisual } from '../js/kme-editor-visual.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { normalizarAvatar } from '../js/estado.js';
import { documentoVisual } from './helpers/dom-visual.js';
async function cargar(){
  const url=new URL('../datos/kme.json',import.meta.url),d=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
  for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){p.capas[capa]=[p.capas[capa]].flat();for(const ruta of p.capas[capa]){const s=await readFile(new URL(ruta,url),'utf8');archivos.set(ruta,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}}
  return new Catalogo(d,archivos);
}
test('Cabello ofrece los tres estilos del mockup; activarlos aplica B y sus colores no cambian el color base',async()=>{
  const c=await cargar(),doc=documentoVisual(),vista=montarEditorVisual(doc,c);
  doc.buscar('Categoría: Cabello').click();const antes=structuredClone(vista.estado.avatar.pelo);
  const opcion=doc.buscar('Mechones: Varios tonos');assert.ok(opcion,'Falta la opción del mockup');opcion.click();
  assert.equal(vista.estado.avatar.pelo.mechones,'varios');assert.equal(vista.estado.avatar.pelo.acabado,'pinceladas');
  vista.estado.elegirColor('pelo.mechon1','#e83475');vista.estado.elegirColor('pelo.mechon2','#9673b7');vista.estado.elegirColor('pelo.mechon3','#00c6e8');
  assert.equal(vista.estado.avatar.pelo.color,antes.color);
  assert.ok(doc.buscar('Mechones: Frontales'));assert.ok(doc.buscar('Mechones: Entre capas'));assert.ok(doc.buscar('Mechones: Sin mechones'));
  assert.ok(doc.buscar('Acabado del cabello: Pinceladas B'));assert.ok(doc.buscar('Acabado del cabello: Acuarela'));
  vista.estado.elegirMechones('sin');assert.doesNotMatch(svgDelAvatar(c,vista.estado.avatar),/data-mechon="/);
  vista.estado.deshacer();assert.equal(vista.estado.avatar.pelo.mechones,'varios');
});
test('Los mechones de todos los peinados se recortan por el cabello y exportan los tres colores sin alterar la cara',async()=>{
  const c=await cargar();
  for(const p of c.piezas('pelo.estilo'))for(const estilo of ['frontales','varios','capas']){
    const e=new EditorVisual(c);e.elegirPieza('pelo.estilo',p.id);
    assert.equal(typeof e.elegirMechones,'function','Falta la selección de mechones');e.elegirMechones(estilo);
    for(const [i,color] of [[1,'#e83475'],[2,'#9673b7'],[3,'#00c6e8']])e.elegirColor('pelo.mechon'+i,color);
    const svg=svgDelAvatar(c,e.avatar);
    assert.match(svg,/data-mechon="1"/);assert.match(svg,/data-mechon="2"/);
    if(estilo!=='frontales')assert.match(svg,/data-mechon="3"/);
    assert.match(svg,/clip-path="url\(#mechon-/);assert.ok(svg.includes(c.contenido(e.avatar).cabeza));
    assert.match(svg,/#e83475/);assert.match(svg,/#9673b7/);if(estilo!=='frontales')assert.match(svg,/#00c6e8/);
  }
});
test('B usa pinceladas curvas y difuminados longitudinales sin luz circular; Tinta y Acuarela anteriores siguen disponibles',async()=>{
  const c=await cargar(),e=new EditorVisual(c);
  assert.doesNotThrow(()=>e.elegirAcabadoPelo('pinceladas'),'B debe poder seleccionarse');
  const svg=svgDelAvatar(c,e.avatar);
  assert.match(svg,/data-acabado="pinceladas-b"/);assert.match(svg,/data-pincelada="/);assert.match(svg,/<linearGradient/);
  assert.doesNotMatch(svg,/radialGradient|<image|<filter/);
  e.elegirAcabadoPelo('acuarela');assert.match(svgDelAvatar(c,e.avatar),/data-acabado="acuarela-pelo"/);
  e.elegirAcabadoPelo('tinta');assert.doesNotMatch(svgDelAvatar(c,e.avatar),/data-acabado="pinceladas-b"/);
});
test('Mechones y sus colores se normalizan, se conservan al cambiar peinado y rechazan valores ajenos sin crear historial',async()=>{
  const c=await cargar(),e=new EditorVisual(c);assert.equal(typeof e.elegirMechones,'function');
  assert.throws(()=>e.elegirMechones('inventado'));assert.throws(()=>e.elegirColor('pelo.mechon1','red'));assert.equal(e.puedeDeshacer,false);
  e.elegirMechones('capas');e.elegirColor('pelo.mechon2','#9673b7');e.elegirPieza('pelo.estilo','corto-despeinado');
  const a=normalizarAvatar(e.avatar,c.porDefecto);
  assert.equal(a.pelo.mechones,'capas');assert.equal(a.pelo.mechon2,'#9673b7');assert.equal(a.pelo.acabado,'pinceladas');
});
test('Los degradados y recortes no comparten IDs entre las miniaturas y el avatar exportado',async()=>{
  const c=await cargar(),e=new EditorVisual(c);assert.equal(typeof e.elegirMechones,'function');e.elegirMechones('varios');
  const a=svgDelAvatar(c,e.avatar),b=svgDelAvatar(c,e.avatar),ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids(a)).size,ids(a).length);assert.equal(ids(a).filter(id=>ids(b).includes(id)).length,0);
});
