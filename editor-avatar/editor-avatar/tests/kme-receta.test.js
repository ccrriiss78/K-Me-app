// La receta del avatar en la app (T037, contrato v1, D052):
// - kme-receta.js da la lista EXACTA de valores de las opciones que no son piezas ni colores; es la
//   única fuente de verdad del editor y del servidor de la app;
// - el editor puede abrir un avatar guardado (cargarAvatar) sin perder ninguna opción.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { EditorVisual } from '../js/kme-editor-visual.js';
import { valoresPermitidos, acabadosPeloKme } from '../js/kme-receta.js';
import { grosoresKme } from '../js/kme-grosores.js';
import { estilosMechonesKme } from '../js/kme-cabello-pinceladas.js';

async function cargar() {
  const url = new URL('../datos/kme.json', import.meta.url), d = JSON.parse(await readFile(url, 'utf8')), archivos = new Map();
  for (const lista of Object.values(d.piezas)) for (const p of lista) for (const capa in p.capas) {
    p.capas[capa] = [p.capas[capa]].flat();
    for (const a of p.capas[capa]) { const s = await readFile(new URL(a, url), 'utf8'); archivos.set(a, s.slice(s.indexOf('>') + 1, s.lastIndexOf('</svg>'))); }
  }
  return new Catalogo(d, archivos);
}
const HEX = /^#[0-9a-f]{6}$/i;
const leer = (o, ruta) => ruta.split('.').reduce((x, p) => x?.[p], o);
// Las opciones de la receta que no son piezas, colores ni la versión.
function otrasOpciones(catalogo) {
  const rutas = [];
  const recorrer = (o, prefijo) => {
    for (const [k, v] of Object.entries(o)) {
      const ruta = prefijo ? `${prefijo}.${k}` : k;
      if (v && typeof v === 'object') { recorrer(v, ruta); continue; }
      if (catalogo.datos.piezas[ruta] || (typeof v === 'string' && HEX.test(v)) || ruta === 'version') continue;
      rutas.push(ruta);
    }
  };
  recorrer(catalogo.datos.porDefecto, '');
  return rutas;
}

test('valoresPermitidos da una lista para cada opción de la receta que no es pieza, color ni versión', async () => {
  const catalogo = await cargar();
  const valores = valoresPermitidos(catalogo);
  const rutas = otrasOpciones(catalogo);
  assert.ok(rutas.length >= 7, 'grosores, acabado, mechones, fondo y los dos campos antiguos de maquillaje');
  for (const ruta of rutas) {
    assert.ok(Array.isArray(valores[ruta]) && valores[ruta].length, `falta la lista de ${ruta}`);
  }
});

test('Las listas son exactamente lo que ofrece el editor: grosores, acabados, mechones y fondo', async () => {
  const catalogo = await cargar();
  const valores = valoresPermitidos(catalogo);
  assert.deepEqual(valores.grosorCejas, grosoresKme);
  assert.deepEqual(valores['maquillaje.grosorLabios'], grosoresKme);
  assert.deepEqual(valores['pelo.mechones'], estilosMechonesKme.map(([id]) => id));
  assert.deepEqual(valores['pelo.acabado'], acabadosPeloKme);
  assert.deepEqual([...acabadosPeloKme].sort(), ['acuarela', 'pinceladas', 'tinta']);
  assert.ok(valores.fondo.includes('ninguno'));
  // Campos del editor anterior: el editor visual no los cambia nunca.
  assert.deepEqual(valores['maquillaje.sombra'], [null]);
  assert.deepEqual(valores['maquillaje.labial'], [null]);
});

test('El editor acepta cada acabado de la lista y rechaza los demás (una sola lista)', async () => {
  const editor = new EditorVisual(await cargar());
  for (const acabado of acabadosPeloKme) {
    editor.elegirAcabadoPelo(acabado);
    assert.equal(editor.avatar.pelo.acabado, acabado);
  }
  assert.throws(() => editor.elegirAcabadoPelo('neon'));
});

test('Las bases y el avatar por defecto cumplen las listas', async () => {
  const catalogo = await cargar();
  const valores = valoresPermitidos(catalogo);
  const avatares = [catalogo.datos.porDefecto, ...catalogo.datos.bases.map((b) => b.avatar)];
  for (const [i, avatar] of avatares.entries()) {
    for (const ruta of otrasOpciones(catalogo)) {
      assert.ok(valores[ruta]?.includes(leer(avatar, ruta)), `avatar ${i}: ${ruta} = ${leer(avatar, ruta)}`);
    }
  }
});

test('cargarAvatar abre un avatar guardado en la base actual, sin historial y completando lo que falte', async () => {
  const catalogo = await cargar();
  const editor = new EditorVisual(catalogo);
  const otraBase = structuredClone(editor.avatares[1]);
  const guardado = structuredClone(catalogo.datos.porDefecto);
  guardado.rostro = 'ovalado';
  guardado.pelo.acabado = 'acuarela';
  delete guardado.fondo; // una receta antigua sin este campo
  editor.cargarAvatar(guardado);
  assert.equal(editor.avatar.rostro, 'ovalado');
  assert.equal(editor.avatar.pelo.acabado, 'acuarela');
  assert.equal(editor.avatar.fondo, 'ninguno', 'completa con el valor por defecto');
  assert.equal(editor.puedeDeshacer, false, 'empieza sin historial');
  assert.deepEqual(editor.avatares[1], otraBase, 'las otras bases no cambian');
  assert.notEqual(editor.avatar, guardado, 'trabaja sobre una copia');

  editor.elegirAcabadoPelo('tinta');
  editor.deshacer();
  assert.equal(editor.avatar.pelo.acabado, 'acuarela', 'deshacer vuelve al avatar guardado');
});
