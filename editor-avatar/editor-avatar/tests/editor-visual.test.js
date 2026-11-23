import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';

async function cargar(){
  const url=new URL('../datos/kme.json',import.meta.url),d=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
  for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){p.capas[capa]=[p.capas[capa]].flat();for(const a of p.capas[capa]){const s=await readFile(new URL(a,url),'utf8');archivos.set(a,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}}
  return new Catalogo(d,archivos);
}
async function editor(){
  const c=await cargar();let modulo;try{modulo=await import('../js/kme-editor-visual.js');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
  // Comportamiento anterior: selección completa de ojos, sin controles separados.
  if(!modulo)return {catalogo:c,avatar:structuredClone(c.porDefecto),elegirForma(){},elegirExpresion(){},elegirColor(){},elegirPieza(){},cambiarBase(){},deshacer(){},restaurar(){}};
  return new modulo.EditorVisual(c);
}
test('Elegir una miniatura de forma cambia el SVG al instante y conserva gesto y color',async()=>{
  const e=await editor(),antes=svgDelAvatar(e.catalogo,e.avatar);
  const color=e.avatar.ojos.color;e.elegirForma('almendrados');
  assert.equal(e.avatar.ojos.estilo,'kme-almendrados-guino-derecho-estrella');
  assert.equal(e.avatar.ojos.color,color);
  assert.notEqual(svgDelAvatar(e.catalogo,e.avatar),antes);
});
test('Forma, expresión y color se combinan de manera independiente y el brillo queda fijo',async()=>{
  const e=await editor();e.elegirForma('alargados');e.elegirExpresion('cerrados');
  assert.equal(e.avatar.ojos.estilo,'kme-alargados-cerrados-sin-brillo');
  e.elegirColor('ojos.color','#ff27c0');e.elegirExpresion('abiertos');
  assert.equal(e.avatar.ojos.estilo,'kme-alargados-abiertos-estrella');assert.equal(e.avatar.ojos.color,'#ff27c0');
  assert.match(svgDelAvatar(e.catalogo,e.avatar),/\.f-ojos\{fill:#ff27c0\}/);
});
test('Cambiar de base conserva sus ediciones, deshacer revierte solo la base activa y restaurar recupera su inicio',async()=>{
  const e=await editor();e.elegirForma('almendrados');e.cambiarBase(1);e.elegirColor('ojos.color','#b878ff');
  e.cambiarBase(0);assert.equal(e.avatar.ojos.estilo,'kme-almendrados-guino-derecho-estrella');
  e.deshacer();assert.equal(e.avatar.ojos.estilo,'kme-redondos-guino-derecho-estrella');
  e.cambiarBase(1);assert.equal(e.avatar.ojos.color,'#b878ff');e.restaurar();assert.equal(e.avatar.ojos.color,'#775d43');
});
test('Las miniaturas de cuerpo y ropa siguen coordinando tamaños y la piel se aplica a las extremidades',async()=>{
  const e=await editor();e.elegirPieza('cuerpo','amplio');
  assert.equal(e.avatar.ropa.arriba,'camiseta-integrada-grueso');assert.equal(e.avatar.ropa.abajo,'falda-integrada-grueso');
  e.elegirColor('piel','#49332d');const svg=svgDelAvatar(e.catalogo,e.avatar);
  assert.match(svg,/\.f-piel\{fill:#49332d\}/);
  assert.match(svg,/data-parte="brazo-izquierdo"/);assert.match(svg,/data-parte="piernas"/);
});
test('El editor visual rechaza colores y formas fuera del catálogo sin modificar el avatar',async()=>{
  const e=await editor(),antes=JSON.stringify(e.avatar);
  assert.throws(()=>e.elegirForma('inventada'));assert.throws(()=>e.elegirColor('ojos.color','#123456'));
  assert.equal(JSON.stringify(e.avatar),antes);
});
