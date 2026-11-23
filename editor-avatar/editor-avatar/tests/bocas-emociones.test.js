import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { EditorVisual } from '../js/kme-editor-visual.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { normalizarAvatar } from '../js/estado.js';
import { documentoVisual } from './helpers/dom-visual.js';

const url=new URL('../datos/kme.json',import.meta.url);
const datos=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
for(const lista of Object.values(datos.piezas))for(const p of lista)for(const capa in p.capas){
  p.capas[capa]=[p.capas[capa]].flat();
  for(const ruta of p.capas[capa]){const s=await readFile(new URL(ruta,url),'utf8');archivos.set(ruta,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}
}
const c=new Catalogo(datos,archivos);
const nuevas=['tristeza','desanimo','puchero','preocupacion','incomodidad','enfado','serenidad','timidez'];

test('Boca y mejillas ofrece ocho gestos emocionales nuevos, conserva los tres anteriores y permite deshacer sin cambiar ojos',()=>{
  for(const id of ['sonrisa','risa','asombro',...nuevas])assert.ok(c.pieza('boca',id),'Falta '+id);
  const doc=documentoVisual(),vista=montarEditorVisual(doc,c);doc.buscar('Categoría: Boca y mejillas').click();
  const ojos=structuredClone(vista.estado.avatar.ojos);
  for(const id of nuevas){
    const p=c.pieza('boca',id),antes=vista.estado.avatar.boca;
    const opcion=doc.buscar('Boca: '+p.nombre);assert.ok(opcion,'Falta miniatura '+p.nombre);opcion.click();
    assert.equal(vista.estado.avatar.boca,id);assert.deepEqual(vista.estado.avatar.ojos,ojos);
    assert.equal(normalizarAvatar(vista.estado.avatar,c.porDefecto).boca,id);
    vista.estado.deshacer();assert.equal(vista.estado.avatar.boca,antes);
  }
});

test('Cada boca nueva tiene un contorno distinto y el pigmento de labios sigue exactamente su curva con los tres grosores y colores independientes',()=>{
  const formas=new Set();
  for(const id of nuevas){
    assert.ok(c.pieza('boca',id),'Falta '+id);
    const e=new EditorVisual(c);e.elegirPieza('boca',id);e.elegirPieza('maquillaje.labios','pigmento');
    const boca=c.contenido(e.avatar).boca,d=boca.match(/<path d="([^"]+)" data-contorno-boca=/)?.[1];
    assert.ok(d,'Falta contorno '+id);formas.add(d);
    for(const grosor of ['fino','medio','grueso']){
      e.elegirGrosorLabios(grosor);e.elegirColor('maquillaje.colorLabios','#9673b7');
      const svg=svgDelAvatar(c,e.avatar);
      assert.deepEqual([...svg.matchAll(/data-boca="([^"]+)"/g)].map(m=>m[1]),[id]);
      assert.ok(svg.includes(`d="${d}" data-trazo="pigmento"`),'Pigmento desalineado '+id);
      assert.match(svg,new RegExp(`data-grosor="${grosor}"`));
      assert.match(svg,/\.t-m-labios\{stroke:#9673b7\}/);
    }
    e.elegirPieza('maquillaje.labios','nada');assert.doesNotMatch(svgDelAvatar(c,e.avatar),/data-maquillaje="labios"/);
  }
  assert.equal(formas.size,nuevas.length);
});
