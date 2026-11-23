// Pruebas de Connect mínimo (TECH_SPEC §5.1, D038):
// - el muro y sus acciones son privados (sesión) y cada formulario POST lleva el token CSRF;
// - una publicación es una emoción del catálogo, sin texto libre, y se ve con el alias, nunca con el usuario;
// - cada pulsación suma una reacción, hasta MAX_REACCIONES_POR_TIPO por persona, publicación y tipo;
// - las reacciones se quitan aparte («Quitar la última» o «Quitar todas las mías»), nunca las de otra cuenta;
// - otra cuenta no puede borrar tu publicación (404, para no revelar nada).
// Necesitan una base de datos real configurada en app/.env.local, con la migración 004 aplicada.
// Ejecutar desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { EMOCIONES, REACCIONES, MAX_REACCIONES_POR_TIPO } from '../src/catalogos/connect.js';

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_a`, alias: `fan_${sufijo}_a` }; // autora de la publicación
const B = { usuario: `test_${sufijo}_b`, alias: `fan_${sufijo}_b` }; // otra cuenta

function hayConfiguracion() {
  return ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'SESSION_SECRET']
    .every((k) => process.env[k] && !process.env[k].startsWith('CAMBIAR_POR'));
}

// Simula un navegador: guarda la cookie de sesión y la reenvía.
function navegador() {
  let cookie = '';
  async function pedir(ruta, { metodo = 'GET', datos, cabeceras = {} } = {}) {
    const res = await fetch(base + ruta, {
      method: metodo,
      redirect: 'manual',
      headers: { cookie, ...(datos ? { 'content-type': 'application/x-www-form-urlencoded' } : {}), ...cabeceras },
      body: datos ? new URLSearchParams(datos).toString() : undefined,
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    return { estado: res.status, destino: res.headers.get('location'), tipo: res.headers.get('content-type') ?? '', html: await res.text() };
  }
  // El token vale para toda la sesión. Sin sesión se saca de /entrar; con sesión, /entrar lleva a
  // «Mi K-ME», que también lo tiene (en el botón «Salir»).
  async function tokenCsrf() {
    let r = await pedir('/entrar');
    if (r.estado === 302) r = await pedir('/mi-kme');
    return /name="_csrf" value="([a-f0-9]+)"/.exec(r.html)[1];
  }
  // Envía un formulario con su token CSRF.
  async function enviar(ruta, datos = {}, cabeceras = {}) {
    return pedir(ruta, { metodo: 'POST', datos: { _csrf: await tokenCsrf(), ...datos }, cabeceras });
  }
  return { pedir, tokenCsrf, enviar };
}

async function entrarComo(cuenta) {
  const nav = navegador();
  const r = await nav.enviar('/entrar', { usuario: cuenta.usuario, password });
  assert.equal(r.estado, 302, `entra ${cuenta.alias}`);
  return nav;
}

// Trozos del muro que miran los tests.
const bloque = (html, id) => new RegExp(`<article[^>]*id="publicacion-${id}"[\\s\\S]*?</article>`).exec(html)?.[0] ?? null;
const boton = (trozo, tipo) => new RegExp(`<button[^>]*value="${tipo}"[^>]*>`).exec(trozo)?.[0] ?? '';
const dato = (etiqueta, nombre) => Number(new RegExp(`data-${nombre}="(\\d+)"`).exec(etiqueta)?.[1] ?? NaN);
const cuentas = async (nav, id, tipo) => {
  const etiqueta = boton(bloque((await nav.pedir('/connect')).html, id), tipo);
  return { total: dato(etiqueta, 'total'), mias: dato(etiqueta, 'mias'), desactivado: /\bdisabled\b/.test(etiqueta) };
};
const publicacionesDe = async (idUsuario) =>
  Number((await consulta('SELECT count(*) FROM publicaciones WHERE id_usuario = $1', [idUsuario])).rows[0].count);

before(async () => {
  if (!hayConfiguracion()) return;
  const { crearApp } = await import('../src/app.js');
  ({ cerrarPool, consulta } = await import('../src/config/db.js'));
  const { crearCuenta } = await import('../src/services/authService.js');
  A.id = (await crearCuenta({ ...A, password })).id;
  B.id = (await crearCuenta({ ...B, password })).id;
  const { app } = crearApp();
  await new Promise((ok) => { servidor = app.listen(0, '127.0.0.1', ok); });
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  if (!servidor) return;
  try {
    const usuarios = [A.usuario, B.usuario];
    await consulta(
      `DELETE FROM sesiones WHERE sess->>'usuarioId' IN (SELECT id::text FROM usuarios WHERE usuario = ANY($1))`,
      [usuarios],
    );
    await consulta('DELETE FROM usuarios WHERE usuario = ANY($1)', [usuarios]); // borra también sus publicaciones y reacciones
  } finally {
    // Aunque la limpieza falle, se cierran el servidor y la conexión: si no, el proceso se queda colgado.
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

test('Connect mínimo: muro, publicaciones y reacciones', { skip: !hayConfiguracion() && 'Sin app/.env.local: prueba bloqueada, no fallida.' }, async (t) => {
  let navA, navB, idPub;

  await t.test('1. sin sesión, el muro lleva a /entrar y no se puede publicar', async () => {
    const nav = navegador();
    const r = await nav.pedir('/connect');
    assert.equal(r.estado, 302);
    assert.equal(r.destino, '/entrar');
    const p = await nav.enviar('/connect/publicaciones', { emocion: EMOCIONES[0].id });
    assert.equal(p.estado, 302);
    assert.equal(p.destino, '/entrar');
  });

  await t.test('2. con sesión, el muro ofrece todas las emociones del catálogo y la cabecera enlaza a Connect', async () => {
    navA = await entrarComo(A);
    navB = await entrarComo(B);
    const { estado, html } = await navA.pedir('/connect');
    assert.equal(estado, 200);
    assert.match(html, /<form[^>]*method="post"[^>]*action="\/connect\/publicaciones"/);
    for (const e of EMOCIONES) {
      assert.match(html, new RegExp(`<input[^>]*name="emocion"[^>]*value="${e.id}"`), `emoción «${e.id}»`);
      assert.ok(html.includes(e.texto), `se lee «${e.texto}»`);
    }
    assert.match(/<header class="cabecera"[\s\S]*?<\/header>/.exec(html)[0], /href="\/connect"/, 'enlace a Connect en la cabecera');
  });

  await t.test('3. publicar con una emoción del catálogo la añade al muro con el alias, nunca con el usuario, y avisa «¡Publicado en el muro!»', async () => {
    const r = await navA.enviar('/connect/publicaciones', { emocion: 'feliz' });
    assert.equal(r.estado, 302);
    assert.equal(r.destino, '/connect?publicada=1');
    idPub = (await consulta('SELECT id FROM publicaciones WHERE id_usuario = $1 ORDER BY id DESC LIMIT 1', [A.id])).rows[0]?.id;
    assert.ok(idPub, 'la publicación está guardada');
    const { html } = await navA.pedir(r.destino);
    assert.match(html, /¡Publicado en el muro!/);
    const trozo = bloque(html, idPub);
    assert.ok(trozo, 'la publicación está en el muro');
    assert.ok(trozo.includes(A.alias), 'con el alias');
    assert.ok(trozo.includes('Feliz'), 'con el texto de la emoción');
    assert.ok(!html.includes(A.usuario), 'el usuario (privado) no aparece');
  });

  await t.test('4. una emoción que no está en la lista da 400 y «Elige una emoción de la lista.», y no se crea nada', async () => {
    const antes = await publicacionesDe(A.id);
    const r = await navA.enviar('/connect/publicaciones', { emocion: 'inventada' });
    assert.equal(r.estado, 400);
    assert.match(r.html, /Elige una emoción de la lista\./);
    assert.equal(await publicacionesDe(A.id), antes);
  });

  await t.test('5. publicar sin token CSRF da 403 y no se crea nada', async () => {
    const antes = await publicacionesDe(A.id);
    const r = await navA.pedir('/connect/publicaciones', { metodo: 'POST', datos: { emocion: 'feliz' } });
    assert.equal(r.estado, 403);
    assert.equal(await publicacionesDe(A.id), antes);
  });

  await t.test('6. la otra cuenta ve la publicación en el muro, pero no el botón de borrarla; la autora sí', async () => {
    const deB = bloque((await navB.pedir('/connect')).html, idPub);
    assert.ok(deB, 'B ve la publicación de A');
    assert.ok(!deB.includes(`/connect/publicaciones/${idPub}/eliminar`), 'B no tiene el botón de borrar');
    const deA = bloque((await navA.pedir('/connect')).html, idPub);
    assert.ok(deA.includes(`/connect/publicaciones/${idPub}/eliminar`), 'A sí lo tiene');
  });

  await t.test('7. cada pulsación suma una reacción: dos corazones de B cuentan 2 en total y 2 suyos', async () => {
    for (let n = 0; n < 2; n++) {
      const r = await navB.enviar(`/connect/publicaciones/${idPub}/reacciones`, { tipo: 'corazon' });
      assert.equal(r.estado, 302);
      assert.equal(r.destino, `/connect#publicacion-${idPub}`, 'vuelve a la misma publicación');
    }
    assert.deepEqual(await cuentas(navB, idPub, 'corazon'), { total: 2, mias: 2, desactivado: false });
  });

  await t.test('8. las reacciones de cada cuenta se cuentan aparte: A ve 2 en total y 0 suyas, sin botones para quitar', async () => {
    assert.deepEqual(await cuentas(navA, idPub, 'corazon'), { total: 2, mias: 0, desactivado: false });
    assert.ok(!bloque((await navA.pedir('/connect')).html, idPub).includes('/reacciones/quitar'), 'A no tiene nada que quitar');
  });

  await t.test(`9. una cuenta puede dar hasta ${MAX_REACCIONES_POR_TIPO} del mismo tipo: la siguiente no se suma y el botón queda desactivado`, async () => {
    for (let n = 0; n <= MAX_REACCIONES_POR_TIPO; n++) {
      await navB.enviar(`/connect/publicaciones/${idPub}/reacciones`, { tipo: 'aplauso' });
    }
    assert.deepEqual(await cuentas(navB, idPub, 'aplauso'), { total: MAX_REACCIONES_POR_TIPO, mias: MAX_REACCIONES_POR_TIPO, desactivado: true });
  });

  await t.test('10. «Quitar la última» quita solo tu última reacción', async () => {
    await navB.enviar(`/connect/publicaciones/${idPub}/reacciones`, { tipo: 'lightstick' });
    const r = await navB.enviar(`/connect/publicaciones/${idPub}/reacciones/quitar`, { que: 'ultima' });
    assert.equal(r.estado, 302);
    assert.equal(r.destino, `/connect#publicacion-${idPub}`);
    assert.equal((await cuentas(navB, idPub, 'lightstick')).total, 0, 'se quita el lightstick, que era la última');
    assert.equal((await cuentas(navB, idPub, 'corazon')).total, 2, 'los corazones siguen');
    assert.equal((await cuentas(navB, idPub, 'aplauso')).total, MAX_REACCIONES_POR_TIPO, 'los aplausos siguen');
  });

  await t.test('11. «Quitar todas las mías» quita todas las tuyas y deja las de la otra cuenta', async () => {
    await navA.enviar(`/connect/publicaciones/${idPub}/reacciones`, { tipo: 'corazon' });
    const r = await navB.enviar(`/connect/publicaciones/${idPub}/reacciones/quitar`, { que: 'todas' });
    assert.equal(r.estado, 302);
    assert.deepEqual(await cuentas(navB, idPub, 'corazon'), { total: 1, mias: 0, desactivado: false });
    assert.equal((await cuentas(navB, idPub, 'aplauso')).total, 0);
    assert.equal((await cuentas(navA, idPub, 'corazon')).mias, 1, 'el corazón de A sigue');
  });

  await t.test('12. una reacción que no está en la lista da 400 y «Esa reacción no existe.»; quitar con una opción desconocida, también 400', async () => {
    const r = await navB.enviar(`/connect/publicaciones/${idPub}/reacciones`, { tipo: 'inventada' });
    assert.equal(r.estado, 400);
    assert.match(r.html, /Esa reacción no existe\./);
    const n = Number((await consulta('SELECT count(*) FROM reacciones WHERE id_publicacion = $1 AND tipo = $2', [idPub, 'inventada'])).rows[0].count);
    assert.equal(n, 0);
    const q = await navB.enviar(`/connect/publicaciones/${idPub}/reacciones/quitar`, { que: 'muchas' });
    assert.equal(q.estado, 400);
  });

  await t.test('13. reaccionar o quitar en una publicación que no existe da 404 y «Esa publicación no existe.»', async () => {
    const r = await navB.enviar('/connect/publicaciones/999999999/reacciones', { tipo: 'corazon' });
    assert.equal(r.estado, 404);
    assert.match(r.html, /Esa publicación no existe\./);
    const q = await navB.enviar('/connect/publicaciones/999999999/reacciones/quitar', { que: 'todas' });
    assert.equal(q.estado, 404);
  });

  await t.test('14. otra cuenta no puede borrar tu publicación: 404 y la publicación sigue', async () => {
    const r = await navB.enviar(`/connect/publicaciones/${idPub}/eliminar`);
    assert.equal(r.estado, 404);
    assert.match(r.html, /Esa publicación no existe\./);
    const sigue = (await consulta('SELECT 1 FROM publicaciones WHERE id = $1', [idPub])).rowCount;
    assert.equal(sigue, 1, 'la publicación de A sigue guardada');
  });

  await t.test('15. borrar tu publicación la quita del muro, con sus reacciones, y avisa «Publicación borrada.»', async () => {
    const r = await navA.enviar(`/connect/publicaciones/${idPub}/eliminar`);
    assert.equal(r.estado, 302);
    assert.equal(r.destino, '/connect?eliminada=1');
    const { html } = await navA.pedir(r.destino);
    assert.match(html, /Publicación borrada\./);
    assert.equal(bloque(html, idPub), null, 'ya no está en el muro');
    const quedan = (await consulta('SELECT 1 FROM reacciones WHERE id_publicacion = $1', [idPub])).rowCount;
    assert.equal(quedan, 0, 'sus reacciones se borran con ella');
  });

  await t.test('16. un id que no es un número da 404', async () => {
    const r = await navA.enviar('/connect/publicaciones/abc/eliminar');
    assert.equal(r.estado, 404);
  });

  await t.test('17. «Mi K-ME» enlaza al muro de Connect', async () => {
    const { html } = await navA.pedir('/mi-kme');
    assert.match(html, /<main[\s\S]*href="\/connect"/);
  });

  // ----- Reaccionar sin recargar el muro (el script de Connect pide JSON; sin script, todo igual) -----
  const JSON_ = { accept: 'application/json' };
  let idPub2;

  await t.test('19. pidiendo JSON, reaccionar responde 200 con el estado de las reacciones de esa publicación, sin redirigir', async () => {
    await navA.enviar('/connect/publicaciones', { emocion: 'gratitud' });
    idPub2 = (await consulta('SELECT id FROM publicaciones WHERE id_usuario = $1 ORDER BY id DESC LIMIT 1', [A.id])).rows[0].id;
    const r = await navB.enviar(`/connect/publicaciones/${idPub2}/reacciones`, { tipo: 'corazon' }, JSON_);
    assert.equal(r.estado, 200);
    assert.match(r.tipo, /application\/json/);
    const estado = JSON.parse(r.html);
    const corazon = estado.reacciones.find((x) => x.id === 'corazon');
    assert.deepEqual(
      { total: corazon.total, mias: corazon.mias, completa: corazon.completa },
      { total: 1, mias: 1, completa: false },
    );
    assert.match(corazon.etiqueta, /Corazón: 1 en total, 1 tuya\./);
    assert.equal(estado.totalMias, 1);
    assert.equal(estado.reacciones.length, REACCIONES.length, 'vienen todas las reacciones del catálogo');
  });

  await t.test('20. pidiendo JSON, «Quitar la última» responde el estado nuevo, solo con las reacciones de quien lo pide', async () => {
    await navA.enviar(`/connect/publicaciones/${idPub2}/reacciones`, { tipo: 'corazon' });
    const r = await navB.enviar(`/connect/publicaciones/${idPub2}/reacciones/quitar`, { que: 'ultima' }, JSON_);
    assert.equal(r.estado, 200);
    const estado = JSON.parse(r.html);
    const corazon = estado.reacciones.find((x) => x.id === 'corazon');
    assert.deepEqual({ total: corazon.total, mias: corazon.mias }, { total: 1, mias: 0 }, 'queda el corazón de A');
    assert.equal(estado.totalMias, 0);
  });

  await t.test('21. pidiendo JSON, los errores también llegan en JSON: reacción que no existe, 400; publicación que no existe, 404', async () => {
    const r = await navB.enviar(`/connect/publicaciones/${idPub2}/reacciones`, { tipo: 'inventada' }, JSON_);
    assert.equal(r.estado, 400);
    assert.deepEqual(JSON.parse(r.html), { error: 'Esa reacción no existe.' });
    const n = await navB.enviar('/connect/publicaciones/999999999/reacciones', { tipo: 'corazon' }, JSON_);
    assert.equal(n.estado, 404);
    assert.deepEqual(JSON.parse(n.html), { error: 'Esa publicación no existe.' });
  });

  await t.test('22. el muro carga el script de Connect, la plantilla de «Tus reacciones» y el aviso para lectores de pantalla', async () => {
    const { html } = await navA.pedir('/connect');
    assert.match(html, /<script src="\/js\/connect\.js" defer><\/script>/);
    assert.match(html, /<template id="plantilla-mis-reacciones">[\s\S]*?\/reacciones\/quitar|<template id="plantilla-mis-reacciones">[\s\S]*?name="que" value="ultima"/);
    assert.match(html, /<p[^>]*id="connect-aviso"[^>]*aria-live="polite"/);
  });

  await t.test('23. el script de Connect se sirve como JavaScript desde la propia app', async () => {
    const r = await navA.pedir('/js/connect.js');
    assert.equal(r.estado, 200);
    assert.match(r.tipo, /javascript/);
  });

  await t.test(`18. el catálogo tiene al menos 12 emociones y 8 reacciones, sin ids repetidos`, async () => {
    assert.ok(EMOCIONES.length >= 12);
    assert.ok(REACCIONES.length >= 8);
    assert.equal(new Set(EMOCIONES.map((e) => e.id)).size, EMOCIONES.length);
    assert.equal(new Set(REACCIONES.map((r) => r.id)).size, REACCIONES.length);
  });
});
