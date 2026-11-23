import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { EditorVisual } from '../js/kme-editor-visual.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { documentoVisual } from './helpers/dom-visual.js';

const url = new URL('../datos/kme.json', import.meta.url);
const datos = JSON.parse(await readFile(url, 'utf8')), archivos = new Map();
for (const lista of Object.values(datos.piezas)) for (const p of lista) for (const capa in p.capas) {
  p.capas[capa] = [p.capas[capa]].flat();
  for (const ruta of p.capas[capa]) {
    const s = await readFile(new URL(ruta, url), 'utf8');
    archivos.set(ruta, s.slice(s.indexOf('>') + 1, s.lastIndexOf('</svg>')));
  }
}
const c = new Catalogo(datos, archivos);
test('Fino, medio y grueso cambian el ancho de cada ceja sin modificar su forma ni sus archivos originales', () => {
  const e = new EditorVisual(c);
  for (const ceja of c.piezas('cejas')) {
    e.elegirPieza('cejas', ceja.id);
    const original = archivos.get(ceja.capas.cejas[0]);
    const trazos = [...original.matchAll(/<path[^>]*\bd="([^"]+)"[^>]*>/g)].map(m => m[1]);
    let previo = 0;
    for (const grosor of ['fino', 'medio', 'grueso']) {
      e.elegirGrosorCejas(grosor);
      const svg = svgDelAvatar(c, e.avatar, {soloCapas: ['cejas']});
      const ancho = Number(svg.match(/<path[^>]*stroke-width="([\d.]+)"/)[1]);
      assert.ok(ancho > previo); previo = ancho;
      for (const d of trazos) assert.ok(svg.includes('d="' + d + '"'));
      if (grosor === 'medio') assert.ok(svg.includes(original));
    }
  }
});
test('Los botones de grosor de cejas repintan, marcan la selección y permiten deshacer sin cambiar el iris', () => {
  const doc = documentoVisual(), vista = montarEditorVisual(doc, c);
  const iris = vista.estado.avatar.ojos.color;
  assert.ok(doc.buscar('Grosor de cejas: Grueso'));
  doc.buscar('Grosor de cejas: Grueso').click();
  assert.equal(vista.estado.avatar.grosorCejas, 'grueso');
  assert.equal(doc.buscar('Grosor de cejas: Grueso').getAttribute('aria-pressed'), 'true');
  doc.getElementById('deshacer').click();
  assert.equal(vista.estado.avatar.grosorCejas, 'medio');
  assert.equal(vista.estado.avatar.ojos.color, iris);
});
test('El grosor de cejas se conserva por base y rechaza valores ajenos sin modificar el avatar', () => {
  const e = new EditorVisual(c);
  e.elegirGrosorCejas('fino');e.cambiarBase(1);
  assert.equal(e.avatar.grosorCejas, 'medio');e.cambiarBase(0);
  assert.equal(e.avatar.grosorCejas, 'fino');
  const antes = JSON.stringify(e.avatar);
  assert.throws(() => e.elegirGrosorCejas('inventado'));
  assert.equal(JSON.stringify(e.avatar), antes);
});
