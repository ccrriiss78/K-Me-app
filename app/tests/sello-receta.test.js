// Cómo se lee y valida la receta de un sello a partir del formulario (D041). Sin base de datos.
// - Solo opciones del catálogo: colores de la paleta, una palabra comprobada, adornos, encuadres.
// - Nunca vacío: una palabra, un avatar o los dos.
// - Sin texto libre dentro del sello: solo el alias de la cuenta, que se muestra u oculta.
// - El avatar se COPIA en el sello al elegirlo: si después se edita o se borra el avatar original,
//   el sello no cambia ni se rompe («actual» conserva la copia que ya tenía).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerReceta, leerNombre } from '../src/services/selloService.js';

const formulario = (cambios = {}) => ({
  borde: 'negro', fondo: 'blanco', palabra: 'amistad', color_palabra: 'fucsia',
  avatar: '', encuadre: 'rostro', mostrar_alias: 'si', color_alias: 'negro',
  motivo1: 'corazon', color_motivo1: 'fucsia', motivo2: '', color_motivo2: 'negro', motivo3: '', color_motivo3: 'negro',
  ...cambios,
});
const codigoDe = (fn) => { try { fn(); } catch (e) { return e.codigo; } return 'sin error'; };
const avatarGuardado = { id: '7', composicion: { pelo: { pieza: 'coleta', color: 'tinta' } } };

test('una receta válida se guarda con ids del catálogo y distribución automática', () => {
  assert.deepEqual(leerReceta(formulario()), {
    borde: 'negro',
    fondo: 'blanco',
    palabra: { id: 'amistad', color: 'fucsia' },
    avatar: null,
    alias: { visible: true, color: 'negro' },
    motivos: [{ id: 'corazon', color: 'fucsia' }],
    distribucion: 'automatica',
  });
});

test('el alias se oculta si no llega la casilla, y solo se guarda si se muestra o no (nunca su texto)', () => {
  const receta = leerReceta(formulario({ mostrar_alias: undefined }));
  assert.deepEqual(receta.alias, { visible: false, color: 'negro' });
  assert.ok(!JSON.stringify(receta).includes('fan_'), 'la receta no copia el alias');
});

test('sin texto libre: cualquier campo de texto que llegue se ignora', () => {
  const receta = leerReceta(formulario({ nombre_personal: 'Cris', texto: 'hola', valor: '<b>x</b>', motivo4: 'corona', color_motivo4: 'negro' }));
  assert.deepEqual(Object.keys(receta).sort(), ['alias', 'avatar', 'borde', 'distribucion', 'fondo', 'motivos', 'palabra']);
  assert.ok(!JSON.stringify(receta).match(/Cris|hola|<b>|corona/));
});

test('un sello sin palabra ni avatar no se puede guardar', () => {
  assert.equal(codigoDe(() => leerReceta(formulario({ palabra: '' }))), 'SELLO_VACIO');
});

test('cualquier opción que no está en el catálogo se rechaza', () => {
  const malos = [
    { borde: 'morado' }, { fondo: '#ff0000' }, { palabra: 'no-existe' }, { color_palabra: '' }, { color_alias: 'oro' },
    { motivo1: 'calavera' }, { color_motivo1: 'plata' }, { motivo2: 'corona', color_motivo2: undefined },
  ];
  for (const cambio of malos) assert.equal(codigoDe(() => leerReceta(formulario(cambio))), 'OPCION_NO_VALIDA', JSON.stringify(cambio));
});

test('un avatar solo se puede elegir de los guardados por la propia cuenta', () => {
  assert.equal(codigoDe(() => leerReceta(formulario({ avatar: '7' }), { avatares: [] })), 'OPCION_NO_VALIDA');
  assert.equal(codigoDe(() => leerReceta(formulario({ avatar: '8' }), { avatares: [avatarGuardado] })), 'OPCION_NO_VALIDA');
  assert.equal(codigoDe(() => leerReceta(formulario({ avatar: '7', encuadre: 'perfil' }), { avatares: [avatarGuardado] })), 'OPCION_NO_VALIDA');
});

test('al elegir un avatar, el sello guarda una copia de su receta con el encuadre (rostro o cuerpo)', () => {
  for (const encuadre of ['rostro', 'cuerpo']) {
    const receta = leerReceta(formulario({ avatar: '7', encuadre, palabra: '' }), { avatares: [avatarGuardado] });
    assert.deepEqual(receta.avatar, { origen: '7', encuadre, copia: avatarGuardado.composicion });
    assert.notEqual(receta.avatar.copia, avatarGuardado.composicion, 'es una copia, no el mismo objeto');
    assert.equal(receta.palabra, null);
  }
});

test('«actual» conserva la copia del avatar aunque el original haya cambiado o ya no exista', () => {
  const anterior = { avatar: { origen: '7', encuadre: 'rostro', copia: { pelo: { pieza: 'coleta', color: 'tinta' } } } };
  const sinOriginal = leerReceta(formulario({ avatar: 'actual', encuadre: 'cuerpo' }), { avatares: [], anterior });
  assert.deepEqual(sinOriginal.avatar, { origen: '7', encuadre: 'cuerpo', copia: anterior.avatar.copia });
  const cambiado = { id: '7', composicion: { pelo: { pieza: 'melena', color: 'fucsia' } } };
  const conOriginalCambiado = leerReceta(formulario({ avatar: 'actual' }), { avatares: [cambiado], anterior });
  assert.deepEqual(conOriginalCambiado.avatar.copia, anterior.avatar.copia, 'no se actualiza sola');
  assert.equal(codigoDe(() => leerReceta(formulario({ avatar: 'actual' }), { avatares: [] })), 'OPCION_NO_VALIDA', 'sin sello anterior no hay copia que conservar');
});

test('el nombre del sello (para «Mis sellos», no sale en el sello) tiene de 1 a 40 caracteres', () => {
  assert.equal(leerNombre({ nombre: '  Mi sello  ' }), 'Mi sello');
  for (const malo of [undefined, '', '   ', 'x'.repeat(41)]) {
    assert.equal(codigoDe(() => leerNombre({ nombre: malo })), 'NOMBRE_NO_VALIDO', `«${malo}»`);
  }
});
