// Receta del avatar (Avatar Studio, contrato v1, 23/11/2026). Sin base de datos: usa el catálogo real
// del editor (editor-avatar/editor-avatar/datos/kme.json), de solo lectura.
// - El servidor nunca guarda lo que llega tal cual: completa y valida cada campo con el catálogo.
// - No se pierde ninguna opción del editor (precaución de ChatGPT): toda pieza y todo color de sus
//   paletas son válidos en su campo.
// - Se rechaza lo que no es del editor: piezas inventadas, colores fuera del catálogo o con código.
// - El avatar se dibuja en el servidor con el dibujador del editor, sin fondo y con ids únicos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerReceta, leerNombreAvatar, MAX_BYTES_RECETA } from '../src/services/avatarService.js';
import { obtenerCatalogo, recetaPorDefecto, dibujarAvatar } from '../src/services/avatarCatalogo.js';

const codigoDe = (fn) => { try { fn(); } catch (e) { return e.codigo; } return 'sin error'; };
const copia = (o) => structuredClone(o);
const conCampo = (ruta, valor) => {
  const r = copia(recetaPorDefecto());
  const partes = ruta.split('.');
  let o = r;
  for (const p of partes.slice(0, -1)) o = o[p];
  o[partes.at(-1)] = valor;
  return r;
};
const valorDe = (receta, ruta) => ruta.split('.').reduce((o, p) => o?.[p], receta);

test('la receta por defecto del editor es válida y se guarda igual', () => {
  const def = recetaPorDefecto();
  assert.deepEqual(leerReceta(copia(def)), def);
});

test('descarta las claves desconocidas y completa las que faltan con los valores por defecto', () => {
  const r = leerReceta({ rostro: 'ovalado', inventada: 'x', pelo: { color: '#282126', raro: 1 } });
  assert.equal(r.rostro, 'ovalado');
  assert.equal(r.inventada, undefined);
  assert.equal(r.pelo.raro, undefined);
  assert.equal(r.pelo.color, '#282126');
  assert.equal(r.boca, recetaPorDefecto().boca, 'lo que falta sale del valor por defecto');
});

test('acepta todas las piezas del catálogo en su campo: no se pierde ninguna opción del editor', () => {
  const { piezas } = obtenerCatalogo().datos;
  let probadas = 0;
  for (const [campo, lista] of Object.entries(piezas)) {
    for (const pieza of lista) {
      assert.equal(valorDe(leerReceta(conCampo(campo, pieza.id)), campo), pieza.id, `${campo} = ${pieza.id}`);
      probadas++;
    }
  }
  assert.ok(probadas > 150, `solo ${probadas} piezas`);
});

test('acepta todos los colores de cada paleta del editor en su campo', () => {
  const { paletas } = obtenerCatalogo().datos;
  const campos = { piel: 'piel', 'ojos.color': 'ojos', 'pelo.color': 'pelo', 'ropa.colorArriba': 'arriba', 'ropa.colorAbajo': 'abajo' };
  for (const [campo, paleta] of Object.entries(campos)) {
    for (const color of paletas[paleta]) {
      assert.equal(valorDe(leerReceta(conCampo(campo, color)), campo), color, `${campo} = ${color}`);
    }
  }
});

test('rechaza una pieza que no existe en el catálogo', () => {
  for (const [campo, valor] of [['rostro', 'inventado'], ['ropa.arriba', 'chaqueta-de-oro'], ['ojos.estilo', '../../secreto'], ['accesorio', 'corona']]) {
    assert.equal(codigoDe(() => leerReceta(conCampo(campo, valor))), 'OPCION_NO_VALIDA', `${campo} = ${valor}`);
  }
});

test('rechaza colores que no son del editor o que llevan código', () => {
  for (const color of ['red', '#12345', '#fff;}</style><script>', 'url(x)', '#010203', '']) {
    assert.equal(codigoDe(() => leerReceta(conCampo('piel', color))), 'OPCION_NO_VALIDA', `piel = ${color}`);
  }
});

test('rechaza valores de otro tipo o con código en cualquier campo', () => {
  const malos = [['rostro', 7], ['pelo.estilo', { x: 1 }], ['version', 'uno'], ['grosorCejas', '<b>'], ['fondo', 'a"b'], ['pelo.acabado', 'x'.repeat(80)]];
  for (const [campo, valor] of malos) {
    assert.equal(codigoDe(() => leerReceta(conCampo(campo, valor))), 'OPCION_NO_VALIDA', `${campo} = ${JSON.stringify(valor)}`);
  }
});

test('la receta tiene que ser un objeto', () => {
  for (const malo of [null, undefined, [], 'texto', 5]) {
    assert.equal(codigoDe(() => leerReceta(malo)), 'OPCION_NO_VALIDA', JSON.stringify(malo));
  }
});

test(`una receta de más de ${MAX_BYTES_RECETA} bytes se rechaza antes de mirarla`, () => {
  assert.equal(MAX_BYTES_RECETA, 8192);
  const grande = { ...recetaPorDefecto(), relleno: 'x'.repeat(MAX_BYTES_RECETA) };
  assert.equal(codigoDe(() => leerReceta(grande)), 'RECETA_DEMASIADO_GRANDE');
});

test('el nombre del avatar tiene de 1 a 40 caracteres', () => {
  assert.equal(leerNombreAvatar('  Mi avatar  '), 'Mi avatar');
  for (const malo of [undefined, '', '   ', 'x'.repeat(41), 7]) {
    assert.equal(codigoDe(() => leerNombreAvatar(malo)), 'NOMBRE_NO_VALIDO', JSON.stringify(malo));
  }
});

test('el avatar se dibuja en el servidor con el dibujador del editor, sin fondo y con ids únicos', () => {
  const a = dibujarAvatar(recetaPorDefecto());
  const b = dibujarAvatar(recetaPorDefecto());
  assert.match(a, /^<svg\b/);
  const id = (svg) => /<svg[^>]*\bid="([^"]+)"/.exec(svg)?.[1];
  assert.ok(id(a) && id(b) && id(a) !== id(b), 'cada dibujo lleva su propio id');
  const rostro = dibujarAvatar(recetaPorDefecto(), { encuadre: 'rostro' });
  assert.doesNotMatch(rostro, /data-parte="(?:camiseta|prenda-superior|prenda|calzado|piernas)"/, 'el rostro no lleva ropa');
});
