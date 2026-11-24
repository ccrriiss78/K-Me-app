// Pruebas de la imagen de perfil (D044, D055; T035):
// - el fan elige como imagen de perfil uno de SUS avatares, uno de SUS sellos o los dos, con el
//   botón «Usar en mi perfil» de «Mis avatares» y «Mis sellos», y lo quita desde «Mi K-ME»;
// - se guarda como referencia (dos claves foráneas en «usuarios»): el perfil enseña siempre la
//   versión actual, y si se borra ese avatar o sello, el perfil se queda sin él, sin errores;
// - en la cabecera se ve la cara del avatar (o, si solo hay sello, el sello); en «Mi K-ME», los dos;
//   sin imagen de perfil, la cabecera queda como antes;
// - otra cuenta no puede usar tu avatar ni tu sello (404); sin sesión, a /entrar; sin CSRF, 403.
// Necesitan una base de datos real configurada en app/.env.local, con la migración 007 aplicada.
// Ejecutar desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { recetaPorDefecto } from '../src/services/avatarCatalogo.js';

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_a`, alias: `fan_${sufijo}_a` }; // dueña del avatar y del sello
const B = { usuario: `test_${sufijo}_b`, alias: `fan_${sufijo}_b` }; // otra cuenta

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
      body: json !== undefined ? JSON.stringify(json) : datos ? new URLSearchParams(datos).toString() : undefined,
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const texto = await res.text();
    let cuerpo = null;
    try { cuerpo = JSON.parse(texto); } catch { /* no es JSON */ }
    return { estado: res.status, destino: res.headers.get('location'), html: texto, cuerpo };
  }
  async function tokenCsrf() {
    let r = await pedir('/entrar');
    if (r.estado === 302) r = await pedir('/mi-kme');
    return /name="_csrf" value="([a-f0-9]+)"/.exec(r.html)[1];
  }
  return {
    pedir,
    enviar: async (ruta, datos = {}) => pedir(ruta, { metodo: 'POST', datos: { _csrf: await tokenCsrf(), ...datos } }),
    api: async (ruta, json) => pedir(ruta, { metodo: 'POST', json: { _csrf: await tokenCsrf(), ...json }, cabeceras: { accept: 'application/json' } }),
  };
}

async function entrarComo(cuenta) {
  const nav = navegador();
  const r = await nav.enviar('/entrar', { usuario: cuenta.usuario, password });
  assert.equal(r.estado, 302, `entra ${cuenta.alias}`);
  return nav;
}

const receta = (cambios = {}) => ({ ...structuredClone(recetaPorDefecto()), ...cambios });
// Un sello válido con solo una palabra (el formulario de Sello Studio).
const selloConPalabra = {
  nombre: 'Sello del perfil', borde: 'negro', fondo: 'blanco', palabra: 'amor', color_palabra: 'fucsia',
  avatar: '', encuadre: 'rostro', mostrar_alias: 'si', color_alias: 'negro',
  motivo1: '', color_motivo1: 'negro', motivo2: '', color_motivo2: 'negro', motivo3: '', color_motivo3: 'negro',
};
const idDeSello = (destino) => /^\/studio\/sellos\/(\d+)/.exec(destino ?? '')?.[1];
const perfilEnBd = async (idUsuario) => (await consulta(
  'SELECT id_avatar_perfil::text AS avatar, id_sello_perfil::text AS sello FROM usuarios WHERE id = $1', [idUsuario],
)).rows[0];

const cabecera = (html) => /<header class="cabecera">[\s\S]*?<\/header>/.exec(html)?.[0] ?? '';
const principal = (html) => /<main[\s\S]*?<\/main>/.exec(html)?.[0] ?? '';
// El dibujador numera los ids de cada avatar (avatar-svg-1, -2…): se quitan para comparar dibujos.
const sinIds = (html) => html.replace(/avatar-svg-\d+/g, 'avatar-svg');
// Las piernas solo se dibujan con el cuerpo entero: en la cabecera va solo la cara.
const PIERNAS = /data-capa="piernas"/;
const SIN_PERFIL = 'Todavía no has elegido tu imagen de perfil.';
// El formulario «Usar en mi perfil» de una tarjeta de «Mis avatares» o de «Mis sellos».
const botonUsar = (campo, id) => new RegExp(
  `<form[^>]*action="/perfil/${campo}"[^>]*>(?:(?!</form>)[\\s\\S])*name="${campo}" value="${id}"(?:(?!</form>)[\\s\\S])*Usar en mi perfil`,
);
const botonQuitar = (campo) => new RegExp(
  `<form[^>]*action="/perfil/${campo}"[^>]*>(?:(?!</form>)[\\s\\S])*name="${campo}" value=""(?:(?!</form>)[\\s\\S])*Quitar`,
);

before(async () => {
  if (!hayConfiguracion()) return;
  const { crearApp } = await import('../src/app.js');
  ({ cerrarPool, consulta } = await import('../src/config/db.js'));
  const { crearCuenta } = await import('../src/services/authService.js');
  for (const cuenta of [A, B]) cuenta.id = (await crearCuenta({ ...cuenta, password })).id;
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
    await consulta('DELETE FROM usuarios WHERE usuario = ANY($1)', [usuarios]); // borra también sus avatares y sellos
  } finally {
    // Aunque la limpieza falle, se cierran el servidor y la conexión: si no, el proceso se queda colgado.
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

test('Imagen de perfil: un avatar, un sello o los dos, siempre de la propia cuenta', { skip: !hayConfiguracion() && 'Sin app/.env.local: prueba bloqueada, no fallida.' }, async (t) => {
  let navA, navB, idAvatar, idSello;

  await t.test('1. sin sesión, elegir la imagen de perfil lleva a /entrar', async () => {
    const nav = navegador();
    for (const [ruta, datos] of [['/perfil/avatar', { avatar: '1' }], ['/perfil/sello', { sello: '1' }]]) {
      const r = await nav.enviar(ruta, datos);
      assert.equal(r.estado, 302, ruta);
      assert.equal(r.destino, '/entrar', ruta);
    }
  });

  await t.test('2. sin imagen de perfil, la cabecera enseña la inicial e invita a elegirla, «Mi K-ME» también, y cada avatar y sello ofrece «Usar en mi perfil»', async () => {
    navA = await entrarComo(A);
    navB = await entrarComo(B);
    const avatar = await navA.api('/studio/avatares', { nombre: 'Avatar del perfil', receta: receta({ rostro: 'ovalado' }) });
    assert.equal(avatar.estado, 201, 'se guarda el avatar de partida');
    idAvatar = avatar.cuerpo.id;
    const sello = await navA.enviar('/studio/sellos', selloConPalabra);
    assert.equal(sello.estado, 302, 'se guarda el sello de partida');
    idSello = idDeSello(sello.destino);

    const mi = await navA.pedir('/mi-kme');
    assert.equal(mi.estado, 200);
    // La zona de la foto de perfil está siempre (la autora, E0077): sin imagen, un círculo con la
    // inicial que invita a elegirla y lleva a «Tu imagen de perfil» en Mi K-ME.
    const arriba = cabecera(mi.html);
    assert.doesNotMatch(arriba, /data-perfil-cabecera="(avatar|sello)"/, 'la cabecera no lleva imagen');
    assert.match(arriba, /<a class="perfil-cabecera perfil-cabecera--vacia" href="\/mi-kme#titulo-perfil" data-perfil-cabecera="vacia" aria-label="Elige tu imagen de perfil" title="Elige tu imagen de perfil"><span aria-hidden="true">F<\/span><\/a>/);
    assert.match(arriba, new RegExp(`<span class="nav__alias">Hola, <strong>${A.alias}</strong></span>`), 'el saludo, aparte de la imagen');
    assert.ok(principal(mi.html).includes(SIN_PERFIL), 'Mi K-ME invita a elegirla');
    assert.match((await navA.pedir('/studio/avatares')).html, botonUsar('avatar', idAvatar), 'en «Mis avatares»');
    assert.match((await navA.pedir('/studio/sellos')).html, botonUsar('sello', idSello), 'en «Mis sellos»');
  });

  await t.test('3. elegir un avatar propio lo pone en el perfil: la cara en la cabecera y el avatar en «Mi K-ME», con «Quitar»', async () => {
    const r = await navA.enviar('/perfil/avatar', { avatar: idAvatar });
    assert.equal(r.estado, 302);
    assert.equal(r.destino, '/mi-kme');
    assert.deepEqual(await perfilEnBd(A.id), { avatar: idAvatar, sello: null });

    const mi = await navA.pedir('/mi-kme');
    const arriba = cabecera(mi.html);
    assert.match(arriba, /data-perfil-cabecera="avatar"[^>]*>\s*<svg/, 'la cabecera lleva el avatar');
    assert.match(arriba, /<a class="perfil-cabecera" href="\/mi-kme#titulo-perfil" data-perfil-cabecera="avatar" aria-label="Tu imagen de perfil, en Mi K-ME">/, 'como foto de perfil que lleva a Mi K-ME');
    assert.doesNotMatch(arriba, /perfil-cabecera--vacia/);
    assert.doesNotMatch(arriba, PIERNAS, 'en la cabecera, solo la cara');
    const centro = principal(mi.html);
    assert.match(centro, /data-perfil="avatar"[\s\S]*?<svg/, 'Mi K-ME lleva el avatar');
    assert.match(centro, botonQuitar('avatar'));
    assert.ok(!centro.includes(SIN_PERFIL));
    assert.match((await navA.pedir('/studio/avatares')).html, /En tu perfil/, '«Mis avatares» marca el elegido');
  });

  await t.test('4. elegir también un sello: «Mi K-ME» enseña los dos y la cabecera sigue con la cara del avatar', async () => {
    const r = await navA.enviar('/perfil/sello', { sello: idSello });
    assert.equal(r.estado, 302);
    assert.equal(r.destino, '/mi-kme');
    assert.deepEqual(await perfilEnBd(A.id), { avatar: idAvatar, sello: idSello });

    const mi = await navA.pedir('/mi-kme');
    const centro = principal(mi.html);
    assert.match(centro, /data-perfil="avatar"/);
    assert.match(centro, /data-perfil="sello"[\s\S]*?<svg[^>]*class="sello/, 'Mi K-ME lleva el sello');
    assert.match(centro, botonQuitar('sello'));
    assert.match(cabecera(mi.html), /data-perfil-cabecera="avatar"/);
    assert.match((await navA.pedir('/studio/sellos')).html, /En tu perfil/, '«Mis sellos» marca el elegido');
  });

  await t.test('5. quitar el avatar deja solo el sello: la cabecera enseña el sello', async () => {
    const r = await navA.enviar('/perfil/avatar', { avatar: '' });
    assert.equal(r.estado, 302);
    assert.deepEqual(await perfilEnBd(A.id), { avatar: null, sello: idSello });
    const mi = await navA.pedir('/mi-kme');
    assert.match(cabecera(mi.html), /data-perfil-cabecera="sello"[^>]*>\s*<svg[^>]*class="sello/);
    assert.doesNotMatch(principal(mi.html), /data-perfil="avatar"/);
  });

  await t.test('6. el perfil enseña siempre la versión actual: si editas el avatar, la cabecera cambia', async () => {
    await navA.enviar('/perfil/avatar', { avatar: idAvatar });
    const antes = sinIds(cabecera((await navA.pedir('/mi-kme')).html));
    const editado = await navA.api(`/studio/avatares/${idAvatar}`, { nombre: 'Avatar del perfil', receta: receta({ rostro: 'redondo', boca: 'sonrisa' }), version: 1 });
    assert.equal(editado.estado, 200, 'se guarda el avatar cambiado');
    const despues = sinIds(cabecera((await navA.pedir('/mi-kme')).html));
    assert.match(despues, /data-perfil-cabecera="avatar"/);
    assert.notEqual(despues, antes, 'la cabecera dibuja el avatar nuevo');
  });

  await t.test('7. otra cuenta no puede poner en su perfil tu avatar ni tu sello (404)', async () => {
    const avatar = await navB.enviar('/perfil/avatar', { avatar: idAvatar });
    assert.equal(avatar.estado, 404);
    assert.match(avatar.html, /Ese avatar no existe\./);
    const sello = await navB.enviar('/perfil/sello', { sello: idSello });
    assert.equal(sello.estado, 404);
    assert.match(sello.html, /Ese sello no existe\./);
    assert.deepEqual(await perfilEnBd(B.id), { avatar: null, sello: null }, 'B sigue sin imagen');
    assert.deepEqual(await perfilEnBd(A.id), { avatar: idAvatar, sello: idSello }, 'el perfil de A no cambia');
    assert.match(cabecera((await navB.pedir('/mi-kme')).html), /data-perfil-cabecera="vacia"/, 'B sigue con la inicial');
  });

  await t.test('8. un id que no es un número válido no existe (404)', async () => {
    for (const id of ['abc', '0', '-1', '1.5', '9'.repeat(30)]) {
      const avatar = await navA.enviar('/perfil/avatar', { avatar: id });
      assert.equal(avatar.estado, 404, `avatar ${id}`);
      assert.match(avatar.html, /Ese avatar no existe\./);
      const sello = await navA.enviar('/perfil/sello', { sello: id });
      assert.equal(sello.estado, 404, `sello ${id}`);
      assert.match(sello.html, /Ese sello no existe\./);
    }
    assert.deepEqual(await perfilEnBd(A.id), { avatar: idAvatar, sello: idSello }, 'nada cambia');
  });

  await t.test('9. sin el token CSRF no se cambia la imagen de perfil (403)', async () => {
    const r = await navA.pedir('/perfil/avatar', { metodo: 'POST', datos: { avatar: '' } });
    assert.equal(r.estado, 403);
    assert.deepEqual(await perfilEnBd(A.id), { avatar: idAvatar, sello: idSello });
  });

  await t.test('10. borrar el avatar del perfil lo quita del perfil sin errores; queda el sello', async () => {
    const borrado = await navA.api(`/studio/avatares/${idAvatar}/eliminar`, {});
    assert.equal(borrado.estado, 200, 'se borra el avatar');
    const mi = await navA.pedir('/mi-kme');
    assert.equal(mi.estado, 200);
    assert.match(cabecera(mi.html), /data-perfil-cabecera="sello"/);
    assert.deepEqual(await perfilEnBd(A.id), { avatar: null, sello: idSello });
  });

  await t.test('11. borrar el sello del perfil lo quita también: la cabecera vuelve a la inicial', async () => {
    const borrado = await navA.enviar(`/studio/sellos/${idSello}/eliminar`);
    assert.equal(borrado.estado, 302, 'se borra el sello');
    const mi = await navA.pedir('/mi-kme');
    assert.equal(mi.estado, 200);
    assert.match(cabecera(mi.html), /data-perfil-cabecera="vacia"/);
    assert.ok(principal(mi.html).includes(SIN_PERFIL), 'Mi K-ME vuelve a invitar a elegirla');
    assert.deepEqual(await perfilEnBd(A.id), { avatar: null, sello: null });
  });
});
