import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
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
const catalogo = new Catalogo(datos, archivos);

function preparar() {
  const doc = documentoVisual();
  doc.scrollingElement = {scrollTop: 0, scrollLeft: 0};
  const panel = doc.getElementById('panel-editor');
  panel.scrollTop = 0;
  const sustituir = panel.replaceChildren.bind(panel);
  // Al vaciar un panel desplazado, el navegador puede limitar el scroll a cero.
  // Se simula esa consecuencia de maquetación sin cambiar el DOM de los tests anteriores.
  panel.replaceChildren = (...nodos) => {
    sustituir(...nodos);
    panel.scrollTop = 0;
    doc.scrollingElement.scrollTop = 0;
  };
  const vista = montarEditorVisual(doc, catalogo);
  return {doc, panel, vista};
}

test('Elegir repetidamente el grosor de cejas conserva la posición del panel y el foco en el botón elegido', () => {
  const {doc, panel, vista} = preparar();
  panel.scrollTop = 790;
  for (const [nombre, valor] of [['Grueso','grueso'],['Fino','fino'],['Medio','medio']]) {
    doc.buscar('Grosor de cejas: ' + nombre).focus();
    doc.buscar('Grosor de cejas: ' + nombre).click();
    assert.equal(vista.estado.avatar.grosorCejas, valor);
    assert.equal(panel.scrollTop, 790, 'El panel no debe saltar al reconstruir sus opciones');
    assert.equal(doc.activeElement, doc.buscar('Grosor de cejas: ' + nombre));
  }
});

test('Deshacer conserva el desplazamiento del panel y el de la página en pantallas estrechas', () => {
  const {doc, panel} = preparar();
  panel.scrollTop = 640; doc.scrollingElement.scrollTop = 280;
  doc.buscar('Grosor de cejas: Grueso').click();
  assert.equal(panel.scrollTop, 640);
  assert.equal(doc.scrollingElement.scrollTop, 280);
  doc.getElementById('deshacer').click();
  assert.equal(panel.scrollTop, 640);
  assert.equal(doc.scrollingElement.scrollTop, 280);
});

test('Cambiar de categoría muestra sus opciones desde arriba y después conserva los cambios de esa categoría', () => {
  const {doc, panel} = preparar();
  panel.scrollTop = 790;
  doc.buscar('Categoría: Maquillaje').click();
  assert.equal(panel.scrollTop, 0);
  panel.scrollTop = 120;
  doc.buscar('Maquillaje: Labios').click();
  assert.equal(panel.scrollTop, 120);
});
