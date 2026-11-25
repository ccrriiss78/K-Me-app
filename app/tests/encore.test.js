// Colección Encore en la app (D075, E0086): seis familias especiales de canje.
// - Cada familia se canjea entera (los tres cuerpos, o el bolso con su portaphotocard y Rizo), con
//   los precios propuestos, pendientes de que la autora los confirme.
// - El catálogo de canje enseña la vista previa de cada una, también de la falda y de los accesorios.
// - El servidor acepta las seis juntas, rechaza el lazo con el pin (van en la misma ranura) y exige
//   que cada accesorio de canje sea tuyo, también si va en «accesoriosExtra».
// - En el recorte del rostro (cabecera, Connect, sello) salen los pendientes y el lazo; el bolso y
//   el brazalete, no.
// - Las seis piezas juntas caben en el filtro de la vista previa del sello (7 imágenes), y también la
//   combinación más cargada del catálogo (12): el filtro admite 16 (D076).
// Las primeras pruebas no necesitan base de datos; las demás, sí (app/.env.local). Desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { leerReceta } from '../src/services/avatarService.js';
import { recetaPorDefecto, dibujarAvatar, obtenerCatalogo } from '../src/services/avatarCatalogo.js';
import { CANJE } from '../src/catalogos/canje.js';

const PE = 'collage-k-pendientes-cometa', BR = 'collage-k-brazalete-fanchant', BO = 'collage-k-bolso-encore-rizo', LA = 'collage-k-lazo-saten';
const ENCORE = ['collage-k-chaqueta-cristal', 'collage-k-falda-saten', PE, BR, BO, LA];
// Cada pieza se reconoce en el dibujo por los ids de sus texturas.
const MARCA = { 'collage-k-chaqueta-cristal': /collage-k-cristal-/, 'collage-k-falda-saten': /collage-k-saten-/, [PE]: /collage-k-earrings-/, [BR]: /collage-k-cuff-/, [BO]: /collage-k-bag-/, [LA]: /collage-k-hairbow-/ };
function encore(cuerpo = 'recto') {
  const v = { relajado: 'delgado', recto: 'medio', amplio: 'grueso' }[cuerpo];
  const r = recetaPorDefecto();
  return { ...r, cuerpo, ropa: { ...r.ropa, arriba: `collage-k-chaqueta-cristal-${v}`, abajo: `collage-k-falda-saten-${v}` }, accesorio: LA, accesoriosExtra: [PE, BR, BO] };
}
const codigoDe = (fn) => { try { fn(); return null; } catch (e) { return [e.codigo, e.campo]; } };
const imagenes = (svg) => (svg.match(/<image\b/g) ?? []).length;

test('Las seis familias de Encore están en el catálogo de canje y en el editor; la ropa con sus tres cuerpos', () => {
  for (const familia of ENCORE) assert.ok(CANJE.some((p) => p.familia === familia), familia);
  const c = obtenerCatalogo();
  for (const familia of ENCORE.slice(0, 2)) assert.deepEqual(c.piezas(familia.includes('falda') ? 'ropa.abajo' : 'ropa.arriba').filter((p) => p.familia === familia).map((p) => p.cuerpoCompatible), ['relajado', 'recto', 'amplio']);
  for (const id of ENCORE.slice(2)) assert.ok(c.pieza('accesorio', id), id);
});

test('El servidor acepta las seis piezas juntas, con los tres cuerpos, y rechaza el lazo con el pin (la misma ranura)', () => {
  for (const cuerpo of ['relajado', 'recto', 'amplio']) assert.equal(codigoDe(() => leerReceta(encore(cuerpo))), null, cuerpo);
  assert.deepEqual(codigoDe(() => leerReceta({ ...encore(), accesorio: 'pin', accesoriosExtra: [LA] })), ['OPCION_NO_VALIDA', 'accesoriosExtra']);
});

test('Con el cuerpo entero se ven las seis; en el recorte del rostro, los pendientes y el lazo, sin el bolso ni el brazalete', () => {
  const receta = leerReceta(encore());
  const cuerpo = dibujarAvatar(receta, { encuadre: 'cuerpo' });
  for (const familia of ENCORE) assert.match(cuerpo, MARCA[familia], familia);
  const cara = dibujarAvatar(receta, { encuadre: 'rostro' });
  assert.match(cara, MARCA[PE]);
  assert.match(cara, MARCA[LA]);
  assert.doesNotMatch(cara, MARCA[BO]);
  assert.doesNotMatch(cara, MARCA[BR]);
});

test('Las seis piezas juntas caben en el filtro de la vista previa del sello: 7 imágenes', async () => {
  const filtro = await readFile(new URL('../public/js/svg-seguro.js', import.meta.url), 'utf8');
  const maximo = Number(/const MAX_IMAGENES = (\d+);/.exec(filtro)[1]);
  for (const cuerpo of ['relajado', 'recto', 'amplio']) {
    const n = imagenes(dibujarAvatar(leerReceta(encore(cuerpo)), { encuadre: 'cuerpo' }));
    assert.equal(n, 7, cuerpo);
    assert.ok(n <= maximo, `${n} de ${maximo}`);
  }
});

// Con base de datos.
let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_enc`, alias: `fan_${sufijo}_enc` };
const hayConfiguracion = () => ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'SESSION_SECRET']
  .every((k) => process.env[k] && !process.env[k].startsWith('CAMBIAR_POR'));

before(async () => {
  if (!hayConfiguracion()) return;
  const { crearApp } = await import('../src/app.js');
  ({ cerrarPool, consulta } = await import('../src/config/db.js'));
  const { crearCuenta } = await import('../src/services/authService.js');
  A.id = (await crearCuenta({ ...A, password })).id;
  const { app } = crearApp();
  await new Promise((ok) => { servidor = app.listen(0, '127.0.0.1', ok); });
  base = `http://127.0.0.1:${servidor.address().port}`;
});
after(async () => {
  if (!servidor) return;
  try {
    await consulta(`DELETE FROM sesiones WHERE sess->>'usuarioId' IN (SELECT id::text FROM usuarios WHERE usuario = $1)`, [A.usuario]);
    await consulta('DELETE FROM usuarios WHERE usuario = $1', [A.usuario]);
  } finally { await new Promise((ok) => servidor.close(ok)); await cerrarPool(); }
});

function navegador() {
  let cookie = '';
  async function pedir(ruta, { metodo = 'GET', datos, json, html = false } = {}) {
    const cabeceras = { cookie, accept: html || datos ? 'text/html' : 'application/json' };
    if (json) cabeceras['content-type'] = 'application/json';
    if (datos) cabeceras['content-type'] = 'application/x-www-form-urlencoded';
    const res = await fetch(base + ruta, { method: metodo, redirect: 'manual', headers: cabeceras, body: json ? JSON.stringify(json) : datos ? new URLSearchParams(datos).toString() : undefined });
    const c = res.headers.get('set-cookie'); if (c) cookie = c.split(';')[0];
    const texto = await res.text();
    let cuerpo = null; try { cuerpo = JSON.parse(texto); } catch { /* HTML */ }
    return { estado: res.status, html: texto, cuerpo };
  }
  const token = async () => /name="_csrf" value="([a-f0-9]+)"/.exec((await pedir(cookie ? '/mi-kme' : '/entrar', { html: true })).html)[1];
  return {
    pedir,
    enviar: async (ruta, datos) => pedir(ruta, { metodo: 'POST', datos: { _csrf: await token(), ...datos } }),
    api: async (ruta, json) => pedir(ruta, { metodo: 'POST', json: { _csrf: await token(), ...json } }),
  };
}

test('Con base de datos', { skip: !hayConfiguracion() && 'falta app/.env.local' }, async (t) => {
  const nav = navegador();
  assert.equal((await nav.enviar('/entrar', { usuario: A.usuario, password })).estado, 302);

  await t.test('el catálogo de canje enseña cada pieza de Encore con su precio y su vista previa, con la pieza puesta', async () => {
    const r = await nav.pedir('/studio/coleccion-k', { html: true });
    assert.equal(r.estado, 200);
    for (const familia of ENCORE) {
      const bloque = new RegExp(`data-pieza="${familia}"[\\s\\S]*?</li>`).exec(r.html)?.[0] ?? '';
      assert.match(bloque, /<svg/, `${familia}: vista previa`);
      assert.match(bloque, MARCA[familia], `${familia}: la pieza está en la vista previa`);
      const precio = CANJE.find((p) => p.familia === familia).precio;
      assert.match(bloque, new RegExp(`${precio} Kpopis`), `${familia}: precio`);
    }
  });

  await t.test('sin canjearlos, guardar un avatar con los pendientes (aunque vayan en accesoriosExtra) da 403', async () => {
    const r = await nav.api('/studio/avatares', { nombre: 'Sin canjear', receta: { ...recetaPorDefecto(), accesorio: 'gafas', accesoriosExtra: [PE] } });
    assert.equal(r.estado, 403);
    assert.equal(r.cuerpo?.error, 'Esa prenda todavía no es tuya: canjéala en Colección «K».');
  });

  await t.test('con los 20 Kpopis de HANGUL se canjean los pendientes y el lazo (10 + 10), y el avatar se guarda y se recupera con los dos', async () => {
    await nav.enviar('/escenario/hangul-live-001/preguntas/1', { respuesta: 'annyeonghaseyo' });
    await nav.enviar('/escenario/hangul-live-001/preguntas/2', { respuesta: 'gomawoyo' });
    await nav.enviar('/escenario/hangul-live-001/preguntas/3', { respuesta: 'paiting' });
    for (const familia of [PE, LA]) assert.equal((await nav.enviar('/studio/coleccion-k/canjear', { familia })).estado, 200, familia);
    const saldo = (await consulta('SELECT COALESCE(SUM(cantidad),0)::int AS n FROM kpopis_movimientos WHERE id_usuario = $1', [A.id])).rows[0].n;
    assert.equal(saldo, 0);
    const receta = { ...recetaPorDefecto(), accesorio: LA, accesoriosExtra: [PE, 'gafas'] };
    const r = await nav.api('/studio/avatares', { nombre: 'Encore', receta });
    assert.equal(r.estado, 201);
    const leida = (await nav.pedir(`/studio/avatares/${r.cuerpo.id}`)).cuerpo.receta;
    assert.deepEqual([leida.accesorio, leida.accesoriosExtra], [LA, [PE, 'gafas']]);
    // El bolso no es tuyo: 403.
    assert.equal((await nav.api('/studio/avatares', { nombre: 'Con bolso', receta: { ...receta, accesoriosExtra: [PE, BO] } })).estado, 403);
  });
});

// D076 (la autora, E0087): el filtro admite 16 imágenes por dibujo, y ninguna combinación del catálogo
// puede pasar de ahí. Si un lote nuevo lo supera, este test falla antes de que se rompa la vista previa.
test('El filtro de la vista previa del sello admite 16 imágenes, y la combinación más cargada del catálogo cabe', async () => {
  const filtro = await readFile(new URL('../public/js/svg-seguro.js', import.meta.url), 'utf8');
  const maximo = Number(/const MAX_IMAGENES = (\d+);/.exec(filtro)[1]);
  assert.equal(maximo, 16);
  const c = obtenerCatalogo();
  // Lo máximo de cada parte: la pieza más cargada de cada parte del avatar y, en los accesorios,
  // la más cargada de cada ranura (se llevan a la vez).
  const max = (piezas) => Math.max(0, ...piezas.map((p) => Math.max(0, ...Object.values(p.capas).flat().map((a) => imagenes(c.archivos.get(a) ?? '')))));
  const porRanura = {};
  for (const p of c.piezas('accesorio').filter((x) => x.ranura)) porRanura[p.ranura] = Math.max(porRanura[p.ranura] ?? 0, max([p]));
  const peor = c.rutas().filter((r) => r !== 'accesorio').reduce((suma, r) => suma + max(c.piezas(r)), 0) + Object.values(porRanura).reduce((a, b) => a + b, 0);
  assert.equal(peor, 12, 'hoy: top o falda de dos texturas, y gorro, pendientes, lazo, bolso, brazalete y lightstick');
  assert.ok(peor <= maximo, `${peor} imágenes de ${maximo}`);
});
