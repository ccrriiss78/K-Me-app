import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { EditorVisual } from '../js/kme-editor-visual.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { documentoVisual } from './helpers/dom-visual.js';
import { normalizarAvatar } from '../js/estado.js';
async function cargar(){
  const url=new URL('../datos/kme.json',import.meta.url),d=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
  for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){p.capas[capa]=[p.capas[capa]].flat();for(const ruta of p.capas[capa]){const s=await readFile(new URL(ruta,url),'utf8');archivos.set(ruta,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}}
  return new Catalogo(d,archivos);
}
test('Dos cortos y un semirrecogido con mechones sueltos se añaden sin retirar los ocho peinados disponibles',async()=>{
  const c=await cargar();for(const id of ['corto-despeinado','corto-dos-bloques','semirrecogido-grenas'])assert.ok(c.pieza('pelo.estilo',id),id);
  assert.equal(c.piezas('pelo.estilo').length,11);
});
test('Acuarela añade pigmento vectorial limitado al cabello y conserva sus contornos y la paleta elegida',async()=>{
  const c=await cargar();
  for(const p of c.piezas('pelo.estilo')){
    const a=structuredClone(c.porDefecto);a.pelo.estilo=p.id;a.pelo.acabado='acuarela';
    for(const color of [c.paleta('pelo')[0],c.paleta('pelo').at(-1)]){
      a.pelo.color=color;
      const svg=svgDelAvatar(c,a,{soloCapas:['pelo_atras','pelo_frente']});
      assert.match(svg,/data-acabado="acuarela-pelo"/);
      assert.match(svg,/<pattern/);assert.match(svg,new RegExp('\\.f-pelo\\{fill:'+color+'\\}'));
      for(const capa of ['pelo_atras','pelo_frente']){
        const original=c.contenido(a)[capa];
        for(const path of original.matchAll(/<path[^>]*class="f-pelo(?:-trasero)?"[^>]*>/g))assert.ok(svg.includes(path[0]),p.id+': se conserva el dibujo');
      }
      assert.doesNotMatch(svg,/<image|<script|<filter/);
      a.pelo.acabado='tinta';assert.doesNotMatch(svgDelAvatar(c,a),/data-acabado="acuarela-pelo"/);a.pelo.acabado='acuarela';
    }
  }
});
test('El selector Tinta/Acuarela conserva el peinado y color, permite deshacer y se normaliza para volver a dibujarlo',async()=>{
  const c=await cargar(),doc=documentoVisual(),vista=montarEditorVisual(doc,c);
  doc.buscar('Categoría: Cabello').click();
  const antes=structuredClone(vista.estado.avatar.pelo);
  const boton=doc.buscar('Acabado del cabello: Acuarela');assert.ok(boton,'Falta el selector de acabado');boton.click();
  assert.equal(vista.estado.avatar.pelo.estilo,antes.estilo);assert.equal(vista.estado.avatar.pelo.color,antes.color);
  assert.equal(vista.estado.avatar.pelo.acabado,'acuarela');
  assert.equal(normalizarAvatar(vista.estado.avatar,c.porDefecto).pelo.acabado,'acuarela');
  doc.getElementById('deshacer').click();assert.equal(vista.estado.avatar.pelo.acabado,'tinta');
  const e=new EditorVisual(c);assert.throws(()=>e.elegirAcabadoPelo('otro'));assert.equal(e.puedeDeshacer,false);
});
