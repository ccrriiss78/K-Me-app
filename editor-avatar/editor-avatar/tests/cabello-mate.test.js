import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplicarCabelloAcuarela } from '../js/kme-cabello-acuarela.js';
const muestra='<g><path d="M90 150 Q100 50 200 70 L260 160Z" class="f-pelo" fill="#282126"/><path d="M110 100 Q150 70 190 90" fill="none" stroke="#fff" opacity=".6"/></g>';
test('El cabello acuarelado usa grano de papel y pigmento irregular mate, sin degradados luminosos ni reflejos blancos pulidos',()=>{
  const svg=aplicarCabelloAcuarela(muestra,'acuarela','mate');
  assert.match(svg,/data-textura="grano-papel"/);
  assert.match(svg,/data-textura="pigmento-irregular"/);
  assert.doesNotMatch(svg,/radialGradient|linearGradient|<filter|<image/);
  assert.doesNotMatch(svg,/stroke="#fff" opacity=".6"/);
  assert.match(svg,/d="M90 150 Q100 50 200 70 L260 160Z" class="f-pelo"/);
  assert.equal(aplicarCabelloAcuarela(muestra,'tinta','mate'),muestra);
});
