// Pruebas del avatar dentro del sello (T034; D041, TECH_SPEC §4):
// - el editor del sello ofrece los avatares guardados de la cuenta, y solo esos;
// - al elegir uno, el sello guarda una COPIA de su receta, con su origen y el encuadre;
// - el dibujo del sello lleva el avatar de verdad (ya no el hueco «pendiente»), con el encuadre
//   elegido: en el editor, en «Mis sellos» y en la vista previa;
// - editar o borrar después el avatar original no cambia ni rompe el sello;
// - otra cuenta no puede poner tu avatar en su sello.
// Necesitan una base de datos real configurada en app/.env.local, con las migraciones 005 y 006.
// Ejecutar desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { ENCUADRES } from '../src/catalogos/sello.js';
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

// Simula un navegador: guarda la cookie de sesión y la reenvía. Sabe enviar formularios (el sello)
// y JSON (Avatar Studio, como hará su editor).
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
  const JSON_ACEPTA = { accept: 'application/json' };
  return {
    pedir,
    enviar: async (ruta, datos = {}) => pedir(ruta, { metodo: 'POST', datos: { _csrf: await tokenCsrf(), ...datos } }),
    api: async (ruta, json) => pedir(ruta, { metodo: 'POST', json: { _csrf: await tokenCsrf(), ...json }, cabeceras: JSON_ACEPTA }),
    vistaPrevia: (datos) => pedir(`/studio/sellos/vista-previa?${new URLSearchParams(datos)}`, { cabeceras: JSON_ACEPTA }),
  };
}

async function entrarComo(cuenta) {
  const nav = navegador();
  const r = await nav.enviar('/entrar', { usuario: cuenta.usuario, password });
  assert.equal(r.estado, 302, `entra ${cuenta.alias}`);
  return nav;
}

// Los campos del formulario del sello, con valores válidos; cada test cambia lo que necesita.
const formulario = (cambios = {}) => ({
  nombre: 'Sello con avatar',
  borde: 'negro',
  fondo: 'blanco',
  palabra: 'amor',
  color_palabra: 'fucsia',
  avatar: '',
  encuadre: 'rostro',
  mostrar_alias: 'si',
  color_alias: 'negro',
  motivo1: '',
  color_motivo1: 'negro',
  motivo2: '',
  color_motivo2: 'negro',
  motivo3: '',
  color_motivo3: 'negro',
  ...cambios,
});
const receta = (cambios = {}) => ({ ...structuredClone(recetaPorDefecto()), ...cambios });
const idDe = (destino) => Number(/^\/studio\/sellos\/(\d+)/.exec(destino ?? '')?.[1] ?? NaN);
const versionEn = (html) => /name="version" value="(\d+)"/.exec(html)?.[1];
const selloEnBd = async (id) => (await consulta('SELECT composicion FROM sellos WHERE id = $1', [id])).rows[0];
const avatarEnBd = async (id) => (await consulta('SELECT composicion FROM avatares WHERE id = $1', [id])).rows[0];
const sellosDe = async (idUsuario) => Number((await consulta('SELECT count(*) FROM sellos WHERE id_usuario = $1', [idUsuario])).rows[0].count);

// El avatar dibujado dentro del sello, y no el hueco de «avatar-pendiente».
const AVATAR_DIBUJADO = /<g data-parte="avatar">\s*<svg/;
const HUECO_PENDIENTE = /data-parte="avatar-pendiente"/;
// La ventana del dibujo del avatar que enseña cada encuadre (catalogos/sello.js).
const ventana = (id) => {
  const { recorte: r } = ENCUADRES.find((e) => e.id === id);
  return `viewBox="${r.x} ${r.y} ${r.ancho} ${r.alto}"`;
};
// Las piernas solo se dibujan con el encuadre «cuerpo»: el «rostro» lleva solo las capas de la cabeza.
const PIERNAS = /data-capa="piernas"/;

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

test('Avatar en el sello: el sello lleva una copia de un avatar guardado de la cuenta', { skip: !hayConfiguracion() && 'Sin app/.env.local: prueba bloqueada, no fallida.' }, async (t) => {
  let navA, navB, idAvatar, idSello;

  await t.test('1. con un avatar guardado, el editor del sello lo ofrece por su nombre y deja elegir el encuadre', async () => {
    navA = await entrarComo(A);
    navB = await entrarComo(B);
    const creado = await navA.api('/studio/avatares', { nombre: 'Avatar del sello', receta: receta({ rostro: 'ovalado' }) });
    assert.equal(creado.estado, 201, 'se guarda el avatar de partida');
    idAvatar = creado.cuerpo.id;
    const r = await navA.pedir('/studio/sellos/nuevo');
    assert.equal(r.estado, 200);
    assert.match(r.html, new RegExp(`<option value="${idAvatar}"[^>]*>Avatar del sello</option>`));
    assert.doesNotMatch(r.html, /Todavía no tienes avatares guardados/);
    assert.doesNotMatch(r.html, /<input[^>]*name="encuadre"[^>]*disabled/, 'los encuadres se pueden elegir');
  });

  await t.test('2. elegir un avatar propio guarda en el sello una copia de su receta, su origen y el encuadre', async () => {
    const r = await navA.enviar('/studio/sellos', formulario({ avatar: idAvatar, encuadre: 'rostro' }));
    assert.equal(r.estado, 302, 'se guarda el sello');
    idSello = idDe(r.destino);
    const { composicion: avatar } = await avatarEnBd(idAvatar);
    const { composicion: sello } = await selloEnBd(idSello);
    assert.deepEqual(sello.avatar, { origen: String(idAvatar), encuadre: 'rostro', copia: avatar });
  });

  await t.test('3. el dibujo del sello lleva el avatar, ya no el hueco pendiente, en el editor y en «Mis sellos»', async () => {
    const r = await navA.pedir(`/studio/sellos/${idSello}`);
    assert.equal(r.estado, 200);
    assert.match(r.html, AVATAR_DIBUJADO, 'en el editor');
    assert.doesNotMatch(r.html, HUECO_PENDIENTE);
    const lista = await navA.pedir('/studio/sellos');
    assert.match(lista.html, AVATAR_DIBUJADO, 'en la miniatura de «Mis sellos»');
    assert.doesNotMatch(lista.html, HUECO_PENDIENTE);
  });

  await t.test('4. la vista previa (JSON) dibuja el avatar con el encuadre elegido: rostro sin el cuerpo, cuerpo entero con él', async () => {
    const rostro = await navA.vistaPrevia(formulario({ avatar: idAvatar, encuadre: 'rostro' }));
    assert.equal(rostro.estado, 200);
    assert.match(rostro.cuerpo.svg, AVATAR_DIBUJADO);
    assert.ok(rostro.cuerpo.svg.includes(ventana('rostro')), 'ventana del rostro');
    assert.doesNotMatch(rostro.cuerpo.svg, PIERNAS, 'el rostro no dibuja el cuerpo');
    const cuerpo = await navA.vistaPrevia(formulario({ avatar: idAvatar, encuadre: 'cuerpo' }));
    assert.equal(cuerpo.estado, 200);
    assert.ok(cuerpo.cuerpo.svg.includes(ventana('cuerpo')), 'ventana del cuerpo entero');
    assert.match(cuerpo.cuerpo.svg, PIERNAS, 'el cuerpo entero sí lo dibuja');
  });

  await t.test('5. otra cuenta no ve tu avatar en su editor ni puede ponerlo en su sello (400)', async () => {
    const editor = await navB.pedir('/studio/sellos/nuevo');
    assert.equal(editor.estado, 200);
    assert.doesNotMatch(editor.html, /Avatar del sello/, 'no aparece en la lista de B');
    const r = await navB.enviar('/studio/sellos', formulario({ avatar: idAvatar }));
    assert.equal(r.estado, 400);
    assert.match(r.html, /Esa opción no existe\./);
    assert.equal(await sellosDe(B.id), 0, 'B no tiene sellos');
    const vista = await navB.vistaPrevia(formulario({ avatar: idAvatar }));
    assert.equal(vista.estado, 400);
    assert.deepEqual(vista.cuerpo, { error: 'Esa opción no existe.' });
  });

  await t.test('5b. sin avatares guardados, el editor del sello invita a crear uno en Avatar Studio (T038)', async () => {
    const r = await navB.pedir('/studio/sellos/nuevo');
    assert.equal(r.estado, 200);
    assert.match(r.html, /Todavía no tienes avatares guardados\./);
    assert.match(r.html, /<a[^>]*href="\/studio\/avatares\/nuevo"[^>]*>Crea uno en Avatar Studio<\/a>/);
    assert.doesNotMatch(r.html, /Cuando Avatar Studio los guarde en tu cuenta/, 'el texto antiguo ya no es cierto');
  });

  await t.test('6. editar después el avatar original no cambia el sello: lleva una copia', async () => {
    const antes = (await selloEnBd(idSello)).composicion.avatar;
    const r = await navA.api(`/studio/avatares/${idAvatar}`, { nombre: 'Avatar cambiado', receta: receta({ rostro: 'redondo', boca: 'sonrisa' }), version: 1 });
    assert.equal(r.estado, 200, 'se guarda el avatar cambiado');
    assert.deepEqual((await selloEnBd(idSello)).composicion.avatar, antes);
    const sello = await navA.pedir(`/studio/sellos/${idSello}`);
    assert.equal(sello.estado, 200);
    assert.match(sello.html, AVATAR_DIBUJADO);
  });

  await t.test('7. borrar el avatar original no rompe el sello: se sigue viendo y se guarda conservando su copia', async () => {
    const copia = (await selloEnBd(idSello)).composicion.avatar.copia;
    const borrado = await navA.api(`/studio/avatares/${idAvatar}/eliminar`, {});
    assert.equal(borrado.estado, 200, 'se borra el avatar');
    const r = await navA.pedir(`/studio/sellos/${idSello}`);
    assert.equal(r.estado, 200);
    assert.match(r.html, AVATAR_DIBUJADO, 'se sigue viendo');
    assert.match(r.html, /<option value="actual" selected>/, 'ofrece conservar el avatar que ya lleva');
    const guardado = await navA.enviar(`/studio/sellos/${idSello}`, formulario({ avatar: 'actual', encuadre: 'cuerpo', version: versionEn(r.html) }));
    assert.equal(guardado.estado, 302, 'se guarda');
    assert.deepEqual((await selloEnBd(idSello)).composicion.avatar, { origen: String(idAvatar), encuadre: 'cuerpo', copia });
  });
});
