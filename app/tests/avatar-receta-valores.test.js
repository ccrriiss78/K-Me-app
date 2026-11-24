// Validación de la receta del avatar con la lista exacta del editor (T037, contrato v1, D052):
// las opciones que no son piezas ni colores (grosores, acabado y mechones del pelo, fondo y dos
// campos antiguos de maquillaje) solo aceptan los valores de kme-receta.js (valoresPermitidos),
// la única fuente de verdad. Antes se aceptaba cualquier id con formato seguro.
// No necesitan base de datos. Ejecutar desde app/:  npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerReceta } from '../src/services/avatarService.js';
import { obtenerCatalogo, recetaPorDefecto } from '../src/services/avatarCatalogo.js';
import { valoresPermitidos } from '../../editor-avatar/editor-avatar/js/kme-receta.js';

const OPCIONES = ['grosorCejas', 'maquillaje.grosorLabios', 'pelo.acabado', 'pelo.mechones', 'fondo', 'maquillaje.sombra', 'maquillaje.labial'];
const con = (ruta, valor) => {
  const r = structuredClone(recetaPorDefecto());
  const partes = ruta.split('.');
  partes.slice(0, -1).reduce((o, p) => o[p], r)[partes.at(-1)] = valor;
  return r;
};
const codigoDe = (fn) => { try { fn(); return null; } catch (e) { return e.codigo; } };

test('cada valor que ofrece el editor en las 7 opciones se acepta', () => {
  const valores = valoresPermitidos(obtenerCatalogo());
  for (const ruta of OPCIONES) {
    assert.ok(valores[ruta]?.length, `hay lista para ${ruta}`);
    for (const valor of valores[ruta]) {
      assert.equal(codigoDe(() => leerReceta(con(ruta, valor))), null, `${ruta} = ${valor}`);
    }
  }
});

test('un valor inventado en cualquiera de las 7 opciones se rechaza (OPCION_NO_VALIDA)', () => {
  const inventados = {
    grosorCejas: 'extra-fino',
    'maquillaje.grosorLabios': 'enorme',
    'pelo.acabado': 'neon',
    'pelo.mechones': 'muchos',
    fondo: 'playa',
    'maquillaje.sombra': 'violeta',
    'maquillaje.labial': '#e83475',
  };
  for (const [ruta, valor] of Object.entries(inventados)) {
    assert.equal(codigoDe(() => leerReceta(con(ruta, valor))), 'OPCION_NO_VALIDA', `${ruta} = ${valor}`);
  }
});
