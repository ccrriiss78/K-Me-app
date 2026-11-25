// Varios accesorios a la vez (D071; la autora aprobó «todos combinables» al ver la prueba del gorro con
// auriculares y gafas, E0083):
// - la receta conserva «accesorio» (los avatares guardados no cambian) y gana «accesoriosExtra», la
//   lista de los demás accesorios puestos ([] por defecto);
// - cada accesorio tiene su «ranura» y el catálogo fija su orden de capas: gorro, auriculares, gafas,
//   pin y mano (lightstick). El dibujo sigue ese orden, se elijan como se elijan;
// - dos accesorios de la misma ranura no se llevan a la vez: el nuevo sustituye al anterior;
// - en el editor, cada accesorio se pone y se quita pulsándolo; «Sin accesorio» los quita todos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { EditorVisual } from '../js/kme-editor-visual.js';
import { normalizarAvatar } from '../js/estado.js';
import { accesoriosExtraValidos } from '../js/kme-receta.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { documentoVisual } from './helpers/dom-visual.js';

const url = new URL('../datos/kme.json', import.meta.url);
async function cargar(cambiar = () => {}) {
  const d = JSON.parse(await readFile(url, 'utf8')), archivos = new Map();
  cambiar(d);
  for (const lista of Object.values(d.piezas)) for (const p of lista) for (const capa in p.capas) {
    p.capas[capa] = [p.capas[capa]].flat();
    for (const a of p.capas[capa]) { const s = await readFile(new URL(a, url), 'utf8'); archivos.set(a, s.slice(s.indexOf('>') + 1, s.lastIndexOf('</svg>'))); }
  }
  return new Catalogo(d, archivos);
}
const GORRO = 'collage-gorro-punto', LUZ = 'collage-lightstick-estudio';
const TITULO = { [GORRO]: '<title>Gorro de punto', auriculares: '<title>Auriculares de estrella', gafas: '<title>Gafas redondas', pin: '<title>Pin de estrella' };
// Una gorra de prueba, solo en estos tests, para comprobar la regla de la misma ranura.
const conGorra = (d) => d.piezas.accesorio.push({ id: 'gorra-prueba', nombre: 'Gorra de prueba', ranura: 'gorro', capas: {} });
const avatarCon = (c, accesorio, accesoriosExtra) => ({ ...structuredClone(c.porDefecto), accesorio, accesoriosExtra });

test('Catálogo: cada accesorio tiene su ranura, en el orden gorro, orejas, auriculares, gafas, pin, bolso, muñeca y mano; la receta gana «accesoriosExtra» vacío', async () => {
  const c = await cargar();
  // Encore (E0086) añade orejas, bolso y muñeca; su lazo va en la ranura del pin.
  assert.deepEqual(c.datos.ranurasAccesorio, ['gorro', 'orejas', 'auriculares', 'gafas', 'pin', 'bolso', 'muneca', 'mano']);
  const ranura = Object.fromEntries(c.piezas('accesorio').map((p) => [p.id, p.ranura]));
  assert.deepEqual(ranura, {
    ninguno: undefined, gafas: 'gafas', auriculares: 'auriculares', pin: 'pin', [LUZ]: 'mano', [GORRO]: 'gorro',
    'collage-k-pendientes-cometa': 'orejas', 'collage-k-brazalete-fanchant': 'muneca', 'collage-k-bolso-encore-rizo': 'bolso', 'collage-k-lazo-saten': 'pin',
  });
  assert.equal(c.porDefecto.accesorio, 'auriculares', 'el valor anterior no cambia');
  assert.deepEqual(c.porDefecto.accesoriosExtra, []);
});

test('Dibujo: los accesorios puestos salen en el orden de sus ranuras, se elijan en el orden que se elijan', async () => {
  const c = await cargar();
  for (const [accesorio, extra] of [['gafas', [GORRO, 'pin', 'auriculares']], [GORRO, ['gafas', 'auriculares', 'pin']], ['pin', ['auriculares', 'gafas', GORRO]]]) {
    const capa = c.contenido(avatarCon(c, accesorio, extra)).accesorio;
    const posiciones = [GORRO, 'auriculares', 'gafas', 'pin'].map((id) => capa.indexOf(TITULO[id]));
    assert.ok(posiciones.every((p) => p >= 0), `${accesorio} + ${extra}: salen los cuatro`);
    assert.deepEqual([...posiciones].sort((a, b) => a - b), posiciones, `${accesorio} + ${extra}: gorro, auriculares, gafas y pin, de atrás hacia delante`);
  }
  const conLuz = c.contenido({ ...avatarCon(c, LUZ, [GORRO]), cuerpo: 'recto' }).accesorio;
  assert.ok(conLuz.indexOf(TITULO[GORRO]) < conLuz.indexOf('data-parte="agarre-collage"'), 'el lightstick, el último');
});

test('Un avatar guardado antes, sin «accesoriosExtra», se abre y se dibuja exactamente igual', async () => {
  const c = await cargar();
  const antiguo = structuredClone(c.porDefecto);
  delete antiguo.accesoriosExtra;
  antiguo.accesorio = 'gafas';
  const normal = normalizarAvatar(antiguo, c.porDefecto);
  assert.deepEqual(normal.accesoriosExtra, []);
  assert.equal(c.contenido(normal).accesorio, c.archivos.get('../assets/kme/accesorio/gafas.svg'), 'solo las gafas, como antes');
  // Y uno nuevo conserva su lista al normalizarse (no se pierde por ser un array).
  assert.deepEqual(normalizarAvatar(avatarCon(c, 'gafas', [GORRO, 'pin']), c.porDefecto).accesoriosExtra, [GORRO, 'pin']);
});

test('Editor: pulsar un accesorio lo pone sin quitar los demás; pulsarlo otra vez lo quita; «Sin accesorio» los quita todos; «Deshacer» vuelve atrás', async () => {
  const c = await cargar(), e = new EditorVisual(c);
  e.cargarAvatar(avatarCon(c, 'auriculares', []));
  const puestos = () => [e.avatar.accesorio, ...e.avatar.accesoriosExtra].filter((id) => id !== 'ninguno').sort();
  e.alternarAccesorio(GORRO);
  e.alternarAccesorio('gafas');
  assert.deepEqual(puestos(), ['auriculares', GORRO, 'gafas'].sort());
  assert.equal(e.avatar.accesorio, 'gafas', '«accesorio» es el último elegido');
  e.alternarAccesorio('auriculares');
  assert.deepEqual(puestos(), [GORRO, 'gafas'].sort());
  e.alternarAccesorio('gafas');
  assert.equal(e.avatar.accesorio, GORRO, 'al quitar el principal, otro puesto pasa a serlo');
  assert.deepEqual(e.avatar.accesoriosExtra, []);
  e.alternarAccesorio('pin');
  e.alternarAccesorio('ninguno');
  assert.equal(e.avatar.accesorio, 'ninguno');
  assert.deepEqual(e.avatar.accesoriosExtra, []);
  e.deshacer();
  assert.deepEqual(puestos(), [GORRO, 'pin'].sort());
  assert.throws(() => e.alternarAccesorio('corona-inventada'), /no válid/i);
  assert.ok(accesoriosExtraValidos(c, e.avatar), 'el editor siempre deja una receta válida');
});

test('Editor: un accesorio de la misma ranura sustituye al que había (dos gorros no)', async () => {
  const c = await cargar(conGorra), e = new EditorVisual(c);
  e.cargarAvatar(avatarCon(c, 'gafas', [GORRO]));
  e.alternarAccesorio('gorra-prueba');
  assert.deepEqual([e.avatar.accesorio, ...e.avatar.accesoriosExtra].sort(), ['gafas', 'gorra-prueba']);
});

test('Receta: accesoriosExtraValidos acepta las combinaciones del editor y rechaza listas mal formadas', async () => {
  const c = await cargar(conGorra);
  const valida = (accesorio, extra) => accesoriosExtraValidos(c, avatarCon(c, accesorio, extra));
  assert.equal(valida('auriculares', []), true);
  assert.equal(valida('ninguno', []), true);
  assert.equal(valida('gafas', [GORRO, 'auriculares', 'pin', LUZ]), true, 'los cinco a la vez');
  for (const [accesorio, extra, motivo] of [
    ['gafas', 'pin', 'no es una lista'],
    ['gafas', ['pin', 'pin'], 'repetido'],
    ['gafas', ['gafas'], 'repite el principal'],
    ['gafas', ['ninguno'], '«ninguno» no es un accesorio'],
    ['gafas', ['corona-inventada'], 'no está en el catálogo'],
    ['gafas', [7], 'no es un id'],
    ['ninguno', ['pin'], 'sin principal no hay extras'],
    [GORRO, ['gorra-prueba'], 'dos de la misma ranura'],
  ]) assert.equal(valida(accesorio, extra), false, motivo);
});

test('Vista: los accesorios se ponen y se quitan pulsándolos, cada miniatura enseña solo el suyo, y el color del gorro sale si está puesto', async () => {
  const c = await cargar(), doc = documentoVisual(), vista = montarEditorVisual(doc, c);
  vista.estado.cargarAvatar(avatarCon(c, 'auriculares', []));
  doc.buscar('Categoría: Accesorios').click();
  assert.ok(doc.getElementById('panel-editor').children.some((n) => /varios a la vez/i.test(n.textContent || '') || (n.children || []).some((m) => /varios a la vez/i.test(m.textContent || ''))), 'explica que se pueden llevar varios');
  doc.buscar('Accesorio: Gafas redondas').click();
  assert.equal(doc.buscar('Accesorio: Gafas redondas').getAttribute('aria-pressed'), 'true');
  assert.equal(doc.buscar('Accesorio: Auriculares de estrella').getAttribute('aria-pressed'), 'true', 'los auriculares siguen puestos');
  assert.equal(doc.buscar('Accesorio: Sin accesorio').getAttribute('aria-pressed'), 'false');
  assert.doesNotMatch(doc.buscar('Accesorio: Gafas redondas').innerHTML, /Auriculares de estrella/, 'la miniatura de las gafas, sin los auriculares');
  doc.buscar('Categoría: Colección «K»').click();
  doc.buscar('Accesorio: Gorro de punto').click();
  assert.equal(doc.buscar('Accesorio: Gorro de punto').getAttribute('aria-pressed'), 'true');
  doc.buscar('Categoría: Accesorios').click();
  doc.buscar('Accesorio: Pin de estrella').click();
  assert.notEqual(vista.estado.avatar.accesorio, GORRO, 'el gorro ya no es el último elegido');
  doc.buscar('Categoría: Colección «K»').click();
  assert.ok(doc.buscar('Color del gorro: ' + c.datos.nombresColor['#e83475']), 'el color del gorro, aunque no sea el último elegido');
  doc.buscar('Accesorio: Gorro de punto').click();
  assert.equal(doc.buscar('Accesorio: Gorro de punto').getAttribute('aria-pressed'), 'false', 'pulsado otra vez, se quita');
  assert.equal(doc.buscar('Color del gorro: ' + c.datos.nombresColor['#e83475']), undefined);
  doc.buscar('Categoría: Accesorios').click();
  doc.buscar('Accesorio: Sin accesorio').click();
  for (const nombre of ['Gafas redondas', 'Auriculares de estrella', 'Pin de estrella']) assert.equal(doc.buscar('Accesorio: ' + nombre).getAttribute('aria-pressed'), 'false', nombre);
});
