import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { EditorVisual } from '../js/kme-editor-visual.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { documentoVisual } from './helpers/dom-visual.js';

const url = new URL('../datos/kme.json', import.meta.url);
const datos = JSON.parse(await readFile(url, 'utf8')), archivos = new Map();
for (const lista of Object.values(datos.piezas)) for (const pieza of lista) for (const capa in pieza.capas) {
  pieza.capas[capa] = [pieza.capas[capa]].flat();
  for (const ruta of pieza.capas[capa]) {
    const texto = await readFile(new URL(ruta, url), 'utf8');
    archivos.set(ruta, texto.slice(texto.indexOf('>') + 1, texto.lastIndexOf('</svg>')));
  }
}
const catalogo = new Catalogo(datos, archivos);

test('Se añaden tres formas del mockup con cuatro gestos cada una y se conservan los 33 ojos anteriores', () => {
  const piezas = catalogo.piezas('ojos.estilo');
  assert.equal(piezas.filter(p => p.coleccion !== 'kme-mockup').length, 33);
  for (const familia of ['dulces', 'felinos', 'escenario']) for (const gesto of ['abiertos', 'cerrados', 'guino-izquierdo', 'guino-derecho']) {
    const brillo = gesto === 'cerrados' ? 'sin-brillo' : 'estrella';
    const pieza = catalogo.pieza('ojos.estilo', `kme-${familia}-${gesto}-${brillo}`);
    assert.ok(pieza, 'Falta el ojo nuevo: ' + familia + ' ' + gesto);
    const dibujo = archivos.get(pieza.capas.ojos[0]);
    assert.match(dibujo, /data-coleccion="mockup"/);
    assert.doesNotMatch(dibujo, /<(?:image|script|filter)\b|url\(/);
    const abiertos = gesto === 'cerrados' ? 0 : gesto === 'abiertos' ? 2 : 1;
    assert.equal((dibujo.match(/data-parte="pupila-logo"/g) || []).length, abiertos);
  }
});

test('Los ojos del mockup permiten cambiar forma, gesto, iris y delineado sin afectar al maquillaje ni perder la forma nueva', () => {
  const e = new EditorVisual(catalogo);
  e.elegirPieza('maquillaje.delineado', 'pop');
  for (const familia of ['dulces', 'felinos', 'escenario']) {
    e.elegirForma(familia); e.elegirExpresion('abiertos');
    assert.equal(e.ojos.familia, familia);
    for (const color of catalogo.paleta('ojos')) {
      e.elegirColor('ojos.color', color);
      const svg = svgDelAvatar(catalogo, e.avatar);
      assert.ok(svg.includes('.f-ojos{fill:' + color + '}'));
      assert.match(svg, /data-maquillaje="delineado"/);
    }
    e.elegirExpresion('guino-izquierdo');
    assert.equal(e.avatar.ojos.estilo, `kme-${familia}-guino-izquierdo-estrella`);
    e.deshacer(); assert.equal(e.avatar.ojos.estilo, `kme-${familia}-abiertos-estrella`);
  }
});

test('La sección de prueba muestra miniaturas nuevas y permite volver a los ojos actuales desde clics reales', () => {
  const doc = documentoVisual(), vista = montarEditorVisual(doc, catalogo);
  assert.ok(doc.buscar('Probar ojos del mockup: Dulces'));
  doc.buscar('Probar ojos del mockup: Dulces').click();
  assert.equal(vista.estado.ojos.familia, 'dulces');
  doc.buscar('Expresión: Cerrados').click();
  assert.equal(vista.estado.avatar.ojos.estilo, 'kme-dulces-cerrados-sin-brillo');
  doc.buscar('Forma: Redondos').click();
  assert.equal(vista.estado.avatar.ojos.estilo, 'kme-redondos-cerrados-sin-brillo');
});
