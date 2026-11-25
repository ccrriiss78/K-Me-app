// Pruebas del canje de Kpopis en Colección «K» (E0083):
// - catálogo de canje con dos piezas especiales (Top Destello y Chaqueta Denim Collage, 20 Kpopis),
//   cada una con su vista previa, que no gasta nada;
// - canjear resta el precio del saldo y la pieza pasa a ser de la cuenta (toda su familia);
// - nunca se cobra dos veces, ni se queda el saldo en negativo, ni con dos canjes a la vez;
// - el servidor rechaza guardar un avatar con una pieza de canje que no es tuya;
// - otra cuenta no tiene lo que tú canjeas.
// Necesitan app/.env.local y la migración 010. Ejecutar desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { CANJE } from '../src/catalogos/canje.js';
import { recetaPorDefecto, obtenerCatalogo } from '../src/services/avatarCatalogo.js';

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_cja`, alias: `fan_${sufijo}_cja` };
const B = { usuario: `test_${sufijo}_cjb`, alias: `fan_${sufijo}_cjb` };
const C = { usuario: `test_${sufijo}_cjc`, alias: `fan_${sufijo}_cjc` };
const TOP = 'collage-top-lentejuelas';
const CHAQUETA = 'collage-chaqueta-denim';

function hayConfiguracion() {
  return ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'SESSION_SECRET']
    .every((k) => process.env[k] && !process.env[k].startsWith('CAMBIAR_POR'));
}
function navegador() {
  let cookie = '';
  async function pedir(ruta, { metodo = 'GET', datos, json } = {}) {
    const tipo = json ? { 'content-type': 'application/json', accept: 'application/json' } : datos ? { 'content-type': 'application/x-www-form-urlencoded' } : {};
    const res = await fetch(base + ruta, { method: metodo, redirect: 'manual', headers: { cookie, ...tipo }, body: json ? JSON.stringify(json) : datos ? new URLSearchParams(datos).toString() : undefined });
    const c = res.headers.get('set-cookie'); if (c) cookie = c.split(';')[0];
    const html = await res.text();
    let cuerpo = null; try { cuerpo = JSON.parse(html); } catch { /* HTML */ }
    return { estado: res.status, destino: res.headers.get('location'), html, cuerpo };
  }
  const token = async () => /name="_csrf" value="([a-f0-9]+)"/.exec((await pedir(cookie ? '/mi-kme' : '/entrar')).html)[1];
  return {
    pedir,
    enviar: async (ruta, datos = {}) => pedir(ruta, { metodo: 'POST', datos: { _csrf: await token(), ...datos } }),
    api: async (ruta, json) => pedir(ruta, { metodo: 'POST', json: { _csrf: await token(), ...json } }),
  };
}
async function entrar(cuenta) { const n = navegador(); assert.equal((await n.enviar('/entrar', { usuario: cuenta.usuario, password })).estado, 302); return n; }
// Gana 20 Kpopis como cualquier fan: completando HANGUL LIVE 001.
async function ganar20(nav) {
  await nav.enviar('/escenario/hangul-live-001/preguntas/1', { respuesta: 'annyeonghaseyo' });
  await nav.enviar('/escenario/hangul-live-001/preguntas/2', { respuesta: 'gomawoyo' });
  await nav.enviar('/escenario/hangul-live-001/preguntas/3', { respuesta: 'paiting' });
}
const texto = (html) => html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, '').replace(/&#34;|&quot;/g, '"').replace(/\s+/g, ' ');
const saldo = async (id) => (await consulta('SELECT COALESCE(SUM(cantidad),0)::int AS n FROM kpopis_movimientos WHERE id_usuario = $1', [id])).rows[0].n;
const piezas = async (id) => (await consulta('SELECT id_familia FROM piezas_usuario WHERE id_usuario = $1 ORDER BY id_familia', [id])).rows.map((f) => f.id_familia);
const conTop = () => ({ ...recetaPorDefecto(), ropa: { ...recetaPorDefecto().ropa, arriba: 'collage-top-lentejuelas-delgado' } });

before(async () => {
  if (!hayConfiguracion()) return;
  const { crearApp } = await import('../src/app.js');
  ({ cerrarPool, consulta } = await import('../src/config/db.js'));
  const { crearCuenta } = await import('../src/services/authService.js');
  for (const c of [A, B, C]) c.id = (await crearCuenta({ ...c, password })).id;
  const { app } = crearApp();
  await new Promise((ok) => { servidor = app.listen(0, '127.0.0.1', ok); });
  base = `http://127.0.0.1:${servidor.address().port}`;
});
after(async () => {
  if (!servidor) return;
  try {
    const usuarios = [A.usuario, B.usuario, C.usuario];
    await consulta(`DELETE FROM sesiones WHERE sess->>'usuarioId' IN (SELECT id::text FROM usuarios WHERE usuario = ANY($1))`, [usuarios]);
    await consulta('DELETE FROM usuarios WHERE usuario = ANY($1)', [usuarios]);
  } finally { await new Promise((ok) => servidor.close(ok)); await cerrarPool(); }
});

test('El catálogo de canje: el Top Destello y la Chaqueta Denim Collage a 20 Kpopis, y Encore con sus precios propuestos; cada familia existe en el editor', () => {
  assert.deepEqual(CANJE.map((p) => [p.familia, p.precio]), [
    [TOP, 20], [CHAQUETA, 20],
    // Encore (E0086): precios propuestos por ChatGPT, pendientes de que la autora los confirme.
    ['collage-k-chaqueta-cristal', 25], ['collage-k-falda-saten', 20], ['collage-k-pendientes-cometa', 10],
    ['collage-k-brazalete-fanchant', 10], ['collage-k-bolso-encore-rizo', 30], ['collage-k-lazo-saten', 10],
  ]);
  const c = obtenerCatalogo();
  for (const p of CANJE) {
    // La ropa, una pieza por cuerpo; un accesorio, una sola pieza con sus variantes dentro.
    const piezas = c.piezas(p.ruta).filter((x) => (x.familia ?? x.id) === p.familia);
    assert.equal(piezas.length, p.ruta === 'accesorio' ? 1 : 3, p.familia);
  }
});

test('Canje en Colección «K»', { skip: !hayConfiguracion() && 'falta app/.env.local' }, async (t) => {
  const navA = await entrar(A), navB = await entrar(B), navC = await entrar(C);

  await t.test('sin sesión, el catálogo y canjear llevan a «Entrar»', async () => {
    const anonimo = navegador();
    assert.equal((await anonimo.pedir('/studio/coleccion-k')).destino, '/entrar');
    assert.equal((await anonimo.pedir('/studio/coleccion-k/canjear', { metodo: 'POST', datos: { familia: TOP } })).destino, '/entrar');
  });

  await t.test('el catálogo enseña cada pieza con su precio, su vista previa y «Canjear», y tu saldo', async () => {
    const r = await navA.pedir('/studio/coleccion-k');
    assert.equal(r.estado, 200);
    const leido = texto(r.html);
    for (const frase of ['Colección «K»', 'Top Destello', 'Chaqueta Denim Collage', '20 Kpopis', 'Tienes 0 Kpopis']) assert.ok(leido.includes(frase), frase);
    for (const familia of [TOP, CHAQUETA]) {
      assert.match(r.html, new RegExp(`<form method="post" action="/studio/coleccion-k/canjear"[^>]*>[\\s\\S]*?name="familia" value="${familia}"`));
      assert.match(r.html, new RegExp(`data-pieza="${familia}"[\\s\\S]*?<svg`), 'vista previa');
    }
  });

  await t.test('sin Kpopis suficientes no se canjea: 400 «No tienes Kpopis suficientes: te faltan 20.» y nada cambia', async () => {
    const r = await navA.enviar('/studio/coleccion-k/canjear', { familia: TOP });
    assert.equal(r.estado, 400);
    assert.ok(texto(r.html).includes('No tienes Kpopis suficientes: te faltan 20.'));
    assert.equal(await saldo(A.id), 0);
    assert.deepEqual(await piezas(A.id), []);
  });

  await t.test('sin la pieza, el servidor no deja guardar un avatar con ella (403)', async () => {
    const r = await navA.api('/studio/avatares', { nombre: 'Con top', receta: conTop() });
    assert.equal(r.estado, 403);
    assert.equal(r.cuerpo.error, 'Esa prenda todavía no es tuya: canjéala en Colección «K».');
  });

  await t.test('con 20 Kpopis, canjear el Top Destello resta 20, la pieza es tuya y ya se puede guardar', async () => {
    await ganar20(navA);
    assert.equal(await saldo(A.id), 20);
    const r = await navA.enviar('/studio/coleccion-k/canjear', { familia: TOP });
    assert.equal(r.estado, 200);
    assert.ok(texto(r.html).includes('¡Canjeado! Ya tienes Top Destello.'));
    assert.equal(await saldo(A.id), 0);
    assert.deepEqual(await piezas(A.id), [TOP]);
    assert.ok(texto(r.html).includes('Ya es tuya'));
    assert.equal((await navA.api('/studio/avatares', { nombre: 'Con top', receta: conTop() })).estado, 201);
    const mi = texto((await navA.pedir('/mi-kme')).html);
    assert.ok(mi.includes('−20 Kpopis · Canje: Top Destello'), 'el gasto en «Mis Kpopis»');
    assert.ok(mi.includes('+20 Kpopis · HANGUL LIVE 001 completado'));
  });

  await t.test('K-ME Studio pasa al editor el catálogo de canje y las piezas que aún no tienes', async () => {
    const pagA = (await navA.pedir('/studio/avatares/nuevo')).html;
    assert.match(pagA, /data-url-canje="\/studio\/coleccion-k"/);
    const bloqueadas = (html) => JSON.parse(/data-bloqueadas="([^"]+)"/.exec(html)[1].replace(/&#34;/g, '"'));
    assert.deepEqual(bloqueadas(pagA), CANJE.map((p) => p.familia).filter((f) => f !== TOP), 'A ya tiene el top: le faltan las demás');
    const pagB = (await navB.pedir('/studio/avatares/nuevo')).html;
    assert.deepEqual(bloqueadas(pagB), CANJE.map((p) => p.familia), 'B no tiene ninguna');
    // Un avatar nuevo empieza con el de presentación: especiales gratis, válido y sin piezas de canje.
    const presentacion = JSON.parse(/data-presentacion="([^"]+)"/.exec(pagB)[1].replace(/&#34;/g, '"'));
    assert.equal(presentacion.accesorio, 'collage-gorro-punto');
    assert.equal(presentacion.ropa.abajo, 'collage-falda-botas-piel-delgado');
    assert.equal((await navB.api('/studio/avatares', { nombre: 'Presentación', receta: presentacion })).estado, 201, 'una cuenta nueva puede guardarlo tal cual');
  });

  await t.test('canjear otra vez lo que ya tienes no cobra nada: 400 «Esa pieza ya es tuya.»', async () => {
    await consulta("INSERT INTO kpopis_movimientos (id_usuario, cantidad, clave) VALUES ($1, 40, 'prueba:saldo')", [A.id]);
    const r = await navA.enviar('/studio/coleccion-k/canjear', { familia: TOP });
    assert.equal(r.estado, 400);
    assert.ok(texto(r.html).includes('Esa pieza ya es tuya.'));
    assert.equal(await saldo(A.id), 40);
  });

  await t.test('dos canjes a la vez con 20 Kpopis: solo uno se cobra y el saldo nunca queda en negativo', async () => {
    await ganar20(navC);
    const [r1, r2] = await Promise.all([navC.enviar('/studio/coleccion-k/canjear', { familia: TOP }), navC.enviar('/studio/coleccion-k/canjear', { familia: CHAQUETA })]);
    assert.deepEqual([r1.estado, r2.estado].sort(), [200, 400]);
    assert.equal(await saldo(C.id), 0);
    assert.equal((await piezas(C.id)).length, 1);
  });

  await t.test('otra cuenta no tiene lo que tú canjeas: B no puede guardar el top', async () => {
    assert.deepEqual(await piezas(B.id), []);
    assert.equal((await navB.api('/studio/avatares', { nombre: 'Con top', receta: conTop() })).estado, 403);
  });

  await t.test('una pieza que no está en el catálogo da 404 y sin el token CSRF se rechaza (403)', async () => {
    const r = await navA.enviar('/studio/coleccion-k/canjear', { familia: 'collage-gorro-punto' });
    assert.equal(r.estado, 404);
    assert.ok(texto(r.html).includes('Esa pieza no está en el catálogo de canje.'));
    assert.equal((await navA.pedir('/studio/coleccion-k/canjear', { metodo: 'POST', datos: { familia: CHAQUETA } })).estado, 403);
    assert.equal(await saldo(A.id), 40);
  });
});
