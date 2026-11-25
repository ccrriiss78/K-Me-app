// Varios accesorios a la vez en la app (D071, E0084):
// - la receta gana «accesoriosExtra» (los demás accesorios puestos, además de «accesorio»); el
//   servidor la valida con la misma regla que el editor (kme-receta.js, accesoriosExtraValidos);
// - un avatar guardado antes, sin ese campo, se sigue aceptando y se dibuja igual;
// - en el recorte del rostro (cabecera, muro de Connect, sello) no sale el lightstick de la mano,
//   pero sí los accesorios de la cabeza;
// - se guarda en la cuenta y se recupera tal cual.
// Las primeras pruebas no necesitan base de datos; la última, sí (app/.env.local).
// Ejecutar desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { leerReceta } from '../src/services/avatarService.js';
import { recetaPorDefecto, dibujarAvatar } from '../src/services/avatarCatalogo.js';

const GORRO = 'collage-gorro-punto', LUZ = 'collage-lightstick-estudio';
const con = (accesorio, accesoriosExtra) => ({ ...recetaPorDefecto(), cuerpo: 'recto', accesorio, accesoriosExtra });
const errorDe = (fn) => { try { fn(); return null; } catch (e) { return [e.codigo, e.campo]; } };

test('El servidor acepta varios accesorios a la vez (hasta los cinco) y los guarda tal cual', () => {
  assert.deepEqual(leerReceta(con('gafas', [GORRO, 'auriculares'])).accesoriosExtra, [GORRO, 'auriculares']);
  assert.deepEqual(leerReceta(con('pin', [GORRO, 'auriculares', 'gafas', LUZ])).accesoriosExtra, [GORRO, 'auriculares', 'gafas', LUZ]);
});

test('Un avatar guardado antes, sin «accesoriosExtra», se acepta con la lista vacía y se dibuja igual', () => {
  const antiguo = { ...recetaPorDefecto(), accesorio: 'gafas' };
  delete antiguo.accesoriosExtra;
  const normal = leerReceta(antiguo);
  assert.deepEqual(normal.accesoriosExtra, []);
  assert.equal(dibujarAvatar(normal).replace(/avatar-svg-\d+/g, ''), dibujarAvatar({ ...antiguo, accesoriosExtra: [] }).replace(/avatar-svg-\d+/g, ''));
});

test('Una lista de accesorios mal formada se rechaza (OPCION_NO_VALIDA en accesoriosExtra)', () => {
  for (const [accesorio, extra, motivo] of [
    ['gafas', 'pin', 'no es una lista'],
    ['gafas', ['pin', 'pin'], 'repetido'],
    ['gafas', ['gafas'], 'repite el principal'],
    ['gafas', ['ninguno'], '«ninguno» no es un accesorio'],
    ['gafas', ['corona-inventada'], 'no está en el catálogo'],
    ['gafas', [{ id: 'pin' }], 'no es un id'],
    ['ninguno', ['pin'], 'sin principal no hay extras'],
  ]) assert.deepEqual(errorDe(() => leerReceta(con(accesorio, extra))), ['OPCION_NO_VALIDA', 'accesoriosExtra'], motivo);
});

test('En el recorte del rostro salen los accesorios de la cabeza, pero no el lightstick, esté donde esté en la receta', () => {
  for (const receta of [con(LUZ, [GORRO, 'gafas']), con('gafas', [LUZ, GORRO])]) {
    const cara = dibujarAvatar(receta, { encuadre: 'rostro' });
    assert.doesNotMatch(cara, /data-parte="agarre-collage"/);
    assert.match(cara, /Gorro de punto/);
    assert.match(cara, /Gafas redondas/);
    assert.match(dibujarAvatar(receta, { encuadre: 'cuerpo' }), /data-parte="agarre-collage"/, 'con el cuerpo entero, sí');
  }
});

// Con base de datos: se guarda en la cuenta y se recupera.
let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_acc`, alias: `fan_${sufijo}_acc` };
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
  // Pide JSON salvo con formulario o con «html: true» (para sacar el _csrf de una página).
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
  await t.test('un avatar con gorro, auriculares y gafas se guarda en la cuenta y se recupera tal cual; uno mal formado, 400', async () => {
    const nav = navegador();
    assert.equal((await nav.enviar('/entrar', { usuario: A.usuario, password })).estado, 302);
    const r = await nav.api('/studio/avatares', { nombre: 'Tres accesorios', receta: con('gafas', [GORRO, 'auriculares']) });
    assert.equal(r.estado, 201);
    const fila = (await consulta('SELECT composicion FROM avatares WHERE id = $1 AND id_usuario = $2', [r.cuerpo.id, A.id])).rows[0];
    assert.deepEqual([fila.composicion.accesorio, fila.composicion.accesoriosExtra], ['gafas', [GORRO, 'auriculares']]);
    assert.deepEqual((await nav.pedir(`/studio/avatares/${r.cuerpo.id}`)).cuerpo.receta.accesoriosExtra, [GORRO, 'auriculares']);
    const mal = await nav.api('/studio/avatares', { nombre: 'Repetido', receta: con('gafas', ['pin', 'pin']) });
    assert.equal(mal.estado, 400);
    assert.equal(mal.cuerpo?.error, 'Esa opción no existe.');
  });
});
