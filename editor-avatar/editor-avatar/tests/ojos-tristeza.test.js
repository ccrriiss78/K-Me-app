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
const catalogo = new Catalogo(datos, archivos);
const propuestas = [
  ['a', 'Tristeza suave'], ['b', 'Mirada caída'], ['c', 'Desánimo'],
  ['d', 'Pena contenida'], ['e', 'A punto de llorar'], ['f', 'Llanto silencioso'],
];
const idOjos = letra => `kme-tristeza-${letra}-${letra === 'f' ? 'cerrados-sin-brillo' : 'estrella'}`;

test('Las seis propuestas A–F están disponibles como SVG distintos, con lágrimas solo en E y F y los 45 ojos previos conservados', () => {
  const anteriores = catalogo.piezas('ojos.estilo').filter(p => p.subcoleccion !== 'tristeza');
  assert.equal(anteriores.length, 45);
  const dibujos = new Set();
  for (const [letra] of propuestas) {
    const pieza = catalogo.pieza('ojos.estilo', idOjos(letra));
    assert.ok(pieza, 'Falta la propuesta de tristeza ' + letra);
    const dibujo = archivos.get(pieza.capas.ojos[0]); dibujos.add(dibujo);
    assert.match(dibujo, /data-coleccion="tristeza"/);
    assert.doesNotMatch(dibujo, /<(?:image|script|filter|foreignObject)\b|(?:href|src)=|url\(/i);
    assert.equal((dibujo.match(/data-parte="pupila-logo"/g) || []).length, letra === 'f' ? 0 : 2);
    assert.equal(dibujo.includes('data-parte="lagrima"'), ['e','f'].includes(letra));
  }
  assert.equal(dibujos.size, 6);
});

test('Elegir tristeza adapta las cejas sin cambiar boca, iris ni maquillaje y Deshacer recupera el conjunto anterior', () => {
  const e = new EditorVisual(catalogo);
  e.elegirPieza('cejas', 'rectas');e.elegirGrosorCejas('grueso');
  e.elegirPieza('maquillaje.gemas', 'cristal');
  for (const [letra] of propuestas) {
    const antes = structuredClone(e.avatar);
    e.elegirPieza('ojos.estilo', idOjos(letra));
    assert.equal(e.avatar.cejas, 'tristes');
    assert.equal(e.avatar.grosorCejas, 'grueso');
    assert.equal(e.avatar.boca, antes.boca);
    assert.equal(e.avatar.ojos.color, antes.ojos.color);
    assert.deepEqual(e.avatar.maquillaje, antes.maquillaje);
    e.deshacer();assert.deepEqual(e.avatar, antes);
  }
});

test('Todas las miradas admiten la paleta de iris y el delineado copia exactamente su párpado sin añadir iris al ojo cerrado', () => {
  const e = new EditorVisual(catalogo);
  e.elegirPieza('maquillaje.delineado', 'pop');
  for (const [letra] of propuestas) for (const color of catalogo.paleta('ojos')) {
    e.elegirPieza('ojos.estilo', idOjos(letra));e.elegirColor('ojos.color', color);
    const svg = svgDelAvatar(catalogo, e.avatar);
    assert.ok(svg.includes('.f-ojos{fill:' + color + '}'));
    assert.match(svg, /data-maquillaje="delineado"/);
    assert.doesNotMatch(svg, /undefined|NaN/);
    const pieza = catalogo.pieza('ojos.estilo', idOjos(letra));
    for (const [,d] of archivos.get(pieza.capas.ojos[0]).matchAll(/data-parte="linea-ojo" d="([^"]+)"/g)) {
      assert.ok(svg.split('d="' + d + '"').length >= 3, 'El delineado debe reutilizar el párpado');
    }
    if (letra === 'f') assert.doesNotMatch(svg, /data-parte="pupila-logo"|data-brillo="estrella"/);
  }
});

test('La vista ofrece las seis miniaturas con cejas de tristeza y permite volver a formas y gestos normales', () => {
  const doc = documentoVisual(), vista = montarEditorVisual(doc, catalogo);
  for (const [letra,nombre] of propuestas) {
    const b = doc.buscar('Tristeza: ' + nombre);
    assert.ok(b, 'Falta la miniatura ' + nombre);
    assert.match(b.innerHTML, /<title>Cejas de tristeza<\/title>/);
    b.click();assert.equal(vista.estado.avatar.ojos.estilo, idOjos(letra));
    assert.equal(doc.buscar('Tristeza: ' + nombre).getAttribute('aria-pressed'), 'true');
    doc.buscar('Forma: Almendrados').click();
    assert.equal(vista.estado.avatar.ojos.estilo, 'kme-almendrados-abiertos-estrella');
  }
  doc.buscar('Tristeza: Llanto silencioso').click();
  doc.buscar('Expresión: Guiño derecho').click();
  assert.equal(vista.estado.avatar.ojos.estilo, 'kme-redondos-guino-derecho-estrella');
});

test('Las cejas siguen siendo editables después de seleccionar tristeza y cada base conserva su mirada', () => {
  const e = new EditorVisual(catalogo);
  e.elegirPieza('ojos.estilo', idOjos('d'));
  e.elegirPieza('cejas', 'suaves');
  assert.equal(e.avatar.cejas, 'suaves');
  assert.equal(e.avatar.ojos.estilo, idOjos('d'));
  const svg = svgDelAvatar(catalogo, e.avatar);
  assert.match(svg, /<title>Cejas suaves<\/title>/);assert.doesNotMatch(svg, /<title>Cejas de tristeza<\/title>/);
  e.cambiarBase(1);assert.notEqual(e.avatar.ojos.estilo, idOjos('d'));
  e.cambiarBase(0);assert.equal(e.avatar.ojos.estilo, idOjos('d'));
});
