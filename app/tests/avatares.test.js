// Pruebas de Avatar Studio en el servidor (contrato v1 con ChatGPT, 23/11/2026; TECH_SPEC §3):
// - páginas privadas (sin sesión → /entrar) y rutas JSON (sin sesión → 401 en JSON, no una redirección);
// - cada POST lleva el token CSRF (en JSON, en el cuerpo: "_csrf"); sin él, 403 en JSON;
// - el avatar se guarda como receta validada con el catálogo del editor, en la cuenta;
// - guardar comprueba la versión: lo guardado en otro dispositivo no se sobrescribe (409);
// - máximo 20 avatares (Q1), duplicar y borrar (Q2);
// - otra cuenta no puede ver, guardar, duplicar ni borrar tu avatar (404);
// - el editor del avatar se sirve desde su carpeta, solo js, css, datos, assets y vendor.
// Necesitan una base de datos real configurada en app/.env.local, con la migración 006 aplicada.
// Ejecutar desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { recetaPorDefecto } from '../src/services/avatarCatalogo.js';

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_a`, alias: `fan_${sufijo}_a` }; // dueña de los avatares
const B = { usuario: `test_${sufijo}_b`, alias: `fan_${sufijo}_b` }; // otra cuenta
const C = { usuario: `test_${sufijo}_c`, alias: `fan_${sufijo}_c` }; // para el límite de 20

function hayConfiguracion() {
  return ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'SESSION_SECRET']
    .every((k) => process.env[k] && !process.env[k].startsWith('CAMBIAR_POR'));
}

// Simula un navegador: guarda la cookie de sesión y la reenvía. Sabe enviar formularios y JSON.
function navegador() {
  let cookie = '';
  async function pedir(ruta, { metodo = 'GET', datos, json, cabeceras = {} } = {}) {
    const tipo = json !== undefined ? { 'content-type': 'application/json' } : datos ? { 'content-type': 'application/x-www-form-urlencoded' } : {};
    const res = await fetch(base + ruta, {
      method: metodo,
      redirect: 'manual',
      headers: { cookie, ...tipo, ...cabeceras },
      body: json !== undefined ? (typeof json === 'string' ? json : JSON.stringify(json)) : datos ? new URLSearchParams(datos).toString() : undefined,
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const texto = await res.text();
    let cuerpo = null;
    try { cuerpo = JSON.parse(texto); } catch { /* no es JSON */ }
    return { estado: res.status, destino: res.headers.get('location'), tipo: res.headers.get('content-type') ?? '', html: texto, cuerpo };
  }
  async function tokenCsrf() {
    let r = await pedir('/entrar');
    if (r.estado === 302) r = await pedir('/mi-kme');
    return /name="_csrf" value="([a-f0-9]+)"/.exec(r.html)[1];
  }
  const JSON_ACEPTA = { accept: 'application/json' };
  return {
    pedir,
    tokenCsrf,
    enviar: async (ruta, datos = {}) => pedir(ruta, { metodo: 'POST', datos: { _csrf: await tokenCsrf(), ...datos } }),
    api: async (ruta, json) => pedir(ruta, { metodo: 'POST', json: { _csrf: await tokenCsrf(), ...json }, cabeceras: JSON_ACEPTA }),
    leer: (ruta) => pedir(ruta, { cabeceras: JSON_ACEPTA }),
  };
}

async function entrarComo(cuenta) {
  const nav = navegador();
  const r = await nav.enviar('/entrar', { usuario: cuenta.usuario, password });
  assert.equal(r.estado, 302, `entra ${cuenta.alias}`);
  return nav;
}

const receta = (cambios = {}) => ({ ...structuredClone(recetaPorDefecto()), ...cambios });
const avatarEnBd = async (id) => (await consulta('SELECT id_usuario, nombre, composicion, version FROM avatares WHERE id = $1', [id])).rows[0];
const avataresDe = async (idUsuario) => Number((await consulta('SELECT count(*) FROM avatares WHERE id_usuario = $1', [idUsuario])).rows[0].count);

before(async () => {
  if (!hayConfiguracion()) return;
  const { crearApp } = await import('../src/app.js');
  ({ cerrarPool, consulta } = await import('../src/config/db.js'));
  const { crearCuenta } = await import('../src/services/authService.js');
  for (const cuenta of [A, B, C]) cuenta.id = (await crearCuenta({ ...cuenta, password })).id;
  const { app } = crearApp();
  await new Promise((ok) => { servidor = app.listen(0, '127.0.0.1', ok); });
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  if (!servidor) return;
  try {
    const usuarios = [A.usuario, B.usuario, C.usuario];
    await consulta(
      `DELETE FROM sesiones WHERE sess->>'usuarioId' IN (SELECT id::text FROM usuarios WHERE usuario = ANY($1))`,
      [usuarios],
    );
    await consulta('DELETE FROM usuarios WHERE usuario = ANY($1)', [usuarios]); // borra también sus avatares
  } finally {
    // Aunque la limpieza falle, se cierran el servidor y la conexión: si no, el proceso se queda colgado.
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

test('Avatar Studio: guardar y recuperar avatares en la cuenta', { skip: !hayConfiguracion() && 'Sin app/.env.local: prueba bloqueada, no fallida.' }, async (t) => {
  let navA, navB, idAvatar;

  await t.test('1. sin sesión: las páginas llevan a /entrar y las rutas JSON responden 401 en JSON', async () => {
    const nav = navegador();
    for (const ruta of ['/studio/avatares', '/studio/avatares/nuevo']) {
      const r = await nav.pedir(ruta);
      assert.equal(r.estado, 302, ruta);
      assert.equal(r.destino, '/entrar', ruta);
    }
    const lista = await nav.leer('/studio/avatares');
    assert.equal(lista.estado, 401);
    assert.deepEqual(lista.cuerpo, { error: 'Tu sesión ha caducado. Vuelve a entrar.' });
    const crear = await nav.pedir('/studio/avatares', { metodo: 'POST', json: { nombre: 'x', receta: receta() }, cabeceras: { accept: 'application/json' } });
    assert.equal(crear.estado, 401);
    assert.equal(crear.cuerpo?.error, 'Tu sesión ha caducado. Vuelve a entrar.');
  });

  await t.test('2. el editor se sirve desde su carpeta, pero solo js, css, datos, assets y vendor', async () => {
    const nav = navegador();
    const datos = await nav.pedir('/editor/datos/kme.json');
    assert.equal(datos.estado, 200);
    assert.ok(datos.cuerpo?.porDefecto, 'el catálogo del editor');
    const js = await nav.pedir('/editor/js/renderizador.js');
    assert.equal(js.estado, 200);
    assert.match(js.tipo, /javascript/);
    for (const prohibida of ['/editor/tests/avatar-sello-node.test.js', '/editor/propuestas-sello/ENTREGA_SELLO_A_CLAUDE.md', '/editor/KME_ABRIR_MUESTRA.html', '/editor/scripts/medir-encuadres.mjs', '/editor/js/../datos/kme.json/../../tests/sello-paneles.test.js']) {
      const r = await nav.pedir(prohibida);
      assert.equal(r.estado, 404, prohibida);
    }
  });

  await t.test('3. con sesión: el menú enlaza a Avatar Studio y «Mis avatares» vacío invita a crear uno', async () => {
    navA = await entrarComo(A);
    navB = await entrarComo(B);
    const mi = await navA.pedir('/mi-kme');
    assert.match(mi.html, /<a[^>]*href="\/studio\/avatares"/);
    const r = await navA.pedir('/studio/avatares');
    assert.equal(r.estado, 200);
    assert.match(r.html, /Todavía no tienes avatares/);
    assert.match(r.html, /<a[^>]*href="\/studio\/avatares\/nuevo"/);
    const lista = await navA.leer('/studio/avatares');
    assert.deepEqual(lista.cuerpo, { maximo: 20, avatares: [] });
  });

  await t.test('4. la página del editor lleva el contenedor del contrato y carga el script externo, sin datos del usuario privado', async () => {
    const r = await navA.pedir('/studio/avatares/nuevo');
    assert.equal(r.estado, 200);
    assert.match(r.html, /<div[^>]*id="avatar-studio"[^>]*data-id=""[^>]*data-version=""[^>]*data-csrf="[a-f0-9]+"[^>]*data-catalogo="\/editor\/datos\/kme.json"/);
    assert.match(r.html, /<script type="module" src="\/js\/avatar-studio.js"><\/script>/);
    assert.doesNotMatch(r.html, /<script>(?!<\/script>)/, 'sin scripts en línea');
    assert.ok(!r.html.includes(A.usuario));
  });

  await t.test('5. crear un avatar lo guarda en la cuenta, con la receta validada y la versión 1 (201)', async () => {
    const r = await navA.api('/studio/avatares', { nombre: 'Mi avatar de prueba', receta: receta({ rostro: 'ovalado', inventada: 'fuera' }) });
    assert.equal(r.estado, 201);
    assert.equal(r.cuerpo.nombre, 'Mi avatar de prueba');
    assert.equal(r.cuerpo.version, 1);
    assert.equal(typeof r.cuerpo.id, 'string');
    idAvatar = r.cuerpo.id;
    const fila = await avatarEnBd(idAvatar);
    assert.equal(String(fila.id_usuario), String(A.id));
    assert.equal(fila.composicion.rostro, 'ovalado');
    assert.equal(fila.composicion.inventada, undefined, 'lo desconocido no se guarda');
  });

  await t.test('6. al volver a pedirlo se recupera tal cual (lista y avatar)', async () => {
    const uno = await navA.leer(`/studio/avatares/${idAvatar}`);
    assert.equal(uno.estado, 200);
    assert.deepEqual(uno.cuerpo, { id: idAvatar, nombre: 'Mi avatar de prueba', receta: (await avatarEnBd(idAvatar)).composicion, version: 1 });
    const lista = await navA.leer('/studio/avatares');
    assert.equal(lista.cuerpo.avatares.length, 1);
    assert.equal(lista.cuerpo.avatares[0].id, idAvatar);
    const pagina = await navA.pedir(`/studio/avatares/${idAvatar}`);
    assert.match(pagina.html, new RegExp(`data-id="${idAvatar}"[^>]*data-version="1"`));
  });

  await t.test('7. guardar con la versión abierta sube la versión; con una antigua no sobrescribe (409) y dice la versión del servidor', async () => {
    const ok = await navA.api(`/studio/avatares/${idAvatar}`, { nombre: 'Avatar renombrado', receta: receta({ boca: 'sonrisa' }), version: 1 });
    assert.equal(ok.estado, 200);
    assert.deepEqual(ok.cuerpo, { id: idAvatar, nombre: 'Avatar renombrado', version: 2 });
    const viejo = await navA.api(`/studio/avatares/${idAvatar}`, { nombre: 'Otro', receta: receta({ boca: 'enfado' }), version: 1 });
    assert.equal(viejo.estado, 409);
    assert.deepEqual(viejo.cuerpo, { error: 'Este avatar ha cambiado desde que lo abriste.', version: 2 });
    const fila = await avatarEnBd(idAvatar);
    assert.equal(fila.version, 2, 'no se ha sobrescrito');
    assert.equal(fila.composicion.boca, 'sonrisa');
  });

  await t.test('8. lo que no es válido se rechaza con 400 y su mensaje, sin guardar nada', async () => {
    const antes = await avataresDe(A.id);
    const casos = [
      [{ nombre: 'x', receta: receta({ rostro: 'inventado' }) }, 'Esa opción no existe.'],
      [{ nombre: 'x', receta: receta({ piel: '#fff;}</style>' }) }, 'Esa opción no existe.'],
      [{ nombre: 'x', receta: 'no es un objeto' }, 'Esa opción no existe.'],
      [{ nombre: '', receta: receta() }, 'Ponle al avatar un nombre de 1 a 40 caracteres.'],
      [{ nombre: 'x'.repeat(41), receta: receta() }, 'Ponle al avatar un nombre de 1 a 40 caracteres.'],
    ];
    for (const [json, mensaje] of casos) {
      const r = await navA.api('/studio/avatares', json);
      assert.equal(r.estado, 400, JSON.stringify(json).slice(0, 80));
      assert.deepEqual(r.cuerpo, { error: mensaje });
    }
    const roto = await navA.pedir('/studio/avatares', { metodo: 'POST', json: '{"nombre": "x", "receta": ', cabeceras: { accept: 'application/json' } });
    assert.equal(roto.estado, 400, 'JSON mal formado');
    assert.equal(typeof roto.cuerpo?.error, 'string');
    assert.equal(await avataresDe(A.id), antes);
  });

  await t.test('9. una receta demasiado grande se rechaza con 413', async () => {
    const r = await navA.api('/studio/avatares', { nombre: 'x', receta: { ...receta(), relleno: 'x'.repeat(9000) } });
    assert.equal(r.estado, 413);
    assert.equal(typeof r.cuerpo?.error, 'string');
  });

  await t.test('10. sin el token CSRF no se guarda (403 en JSON)', async () => {
    const antes = await avataresDe(A.id);
    const r = await navA.pedir('/studio/avatares', { metodo: 'POST', json: { nombre: 'x', receta: receta() }, cabeceras: { accept: 'application/json' } });
    assert.equal(r.estado, 403);
    assert.equal(typeof r.cuerpo?.error, 'string');
    assert.equal(await avataresDe(A.id), antes);
  });

  await t.test('11. otra cuenta no puede ver, guardar, duplicar ni borrar el avatar (404) ni lo ve en su lista', async () => {
    const ver = await navB.leer(`/studio/avatares/${idAvatar}`);
    assert.equal(ver.estado, 404);
    assert.deepEqual(ver.cuerpo, { error: 'Ese avatar no existe.' });
    const pagina = await navB.pedir(`/studio/avatares/${idAvatar}`);
    assert.equal(pagina.estado, 404);
    const guardar = await navB.api(`/studio/avatares/${idAvatar}`, { nombre: 'robado', receta: receta(), version: 2 });
    assert.equal(guardar.estado, 404);
    assert.equal((await navB.api(`/studio/avatares/${idAvatar}/duplicar`, {})).estado, 404);
    assert.equal((await navB.api(`/studio/avatares/${idAvatar}/eliminar`, {})).estado, 404);
    const fila = await avatarEnBd(idAvatar);
    assert.equal(fila.nombre, 'Avatar renombrado', 'sin cambios');
    assert.equal(await avataresDe(B.id), 0);
    assert.deepEqual((await navB.leer('/studio/avatares')).cuerpo.avatares, []);
  });

  await t.test('12. duplicar crea «Copia de …» con la misma receta (201)', async () => {
    const r = await navA.api(`/studio/avatares/${idAvatar}/duplicar`, {});
    assert.equal(r.estado, 201);
    assert.equal(r.cuerpo.nombre, 'Copia de Avatar renombrado');
    assert.equal(r.cuerpo.version, 1);
    assert.deepEqual((await avatarEnBd(r.cuerpo.id)).composicion, (await avatarEnBd(idAvatar)).composicion);
  });

  await t.test('13. «Mis avatares» lista los avatares con su miniatura y el nombre escapado', async () => {
    const otro = await navA.api('/studio/avatares', { nombre: '<b>Hola</b>', receta: receta() });
    assert.equal(otro.estado, 201);
    const r = await navA.pedir('/studio/avatares');
    assert.match(r.html, new RegExp(`href="/studio/avatares/${idAvatar}"`));
    assert.ok(r.html.includes('&lt;b&gt;Hola&lt;/b&gt;') && !r.html.includes('<b>Hola</b>'), 'nombre escapado');
    assert.match(r.html, /<svg\b[^>]*viewBox/, 'miniatura dibujada en el servidor');
  });

  await t.test('14. con 20 avatares no se puede crear ni duplicar otro (409)', async () => {
    const navC = await entrarComo(C);
    const primero = await navC.api('/studio/avatares', { nombre: 'Primero', receta: receta() });
    assert.equal(primero.estado, 201);
    const { composicion } = await avatarEnBd(primero.cuerpo.id);
    for (let i = 1; i < 20; i++) {
      await consulta('INSERT INTO avatares (id_usuario, nombre, composicion) VALUES ($1, $2, $3)', [C.id, `Relleno ${i}`, composicion]);
    }
    const crear = await navC.api('/studio/avatares', { nombre: 'Uno más', receta: receta() });
    assert.equal(crear.estado, 409);
    assert.deepEqual(crear.cuerpo, { error: 'Ya tienes 20 avatares, el máximo. Borra uno para crear otro.' });
    assert.equal((await navC.api(`/studio/avatares/${primero.cuerpo.id}/duplicar`, {})).estado, 409);
    assert.equal(await avataresDe(C.id), 20);
  });

  await t.test('15. borrar el propio avatar es definitivo; sin JavaScript, el formulario vuelve a «Mis avatares»', async () => {
    const r = await navA.api(`/studio/avatares/${idAvatar}/eliminar`, {});
    assert.equal(r.estado, 200);
    assert.deepEqual(r.cuerpo, { eliminado: true });
    assert.equal(await avatarEnBd(idAvatar), undefined);
    assert.equal((await navA.leer(`/studio/avatares/${idAvatar}`)).estado, 404);
    const otro = (await navA.leer('/studio/avatares')).cuerpo.avatares[0];
    const form = await navA.enviar(`/studio/avatares/${otro.id}/eliminar`);
    assert.equal(form.estado, 302);
    assert.equal(form.destino, '/studio/avatares?eliminado=1');
  });
});
