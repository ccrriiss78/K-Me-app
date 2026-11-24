// Pruebas de Connect con el diseño de cada fan y el mensaje con iconos (Q7, Q11; E0072):
// - al publicar, el fan elige el diseño que acompaña a su emoción: su imagen de perfil (por
//   defecto), uno de SUS avatares o uno de SUS sellos;
// - la publicación guarda una COPIA: si después edita o borra ese avatar o sello, no cambia;
// - sin elegir: el avatar del perfil; si no hay, el sello del perfil; si no hay ninguno, la inicial;
// - en el muro, del avatar se ve la cara (la photocard es pequeña) y el sello, entero;
// - otra cuenta no puede usar tu avatar ni tu sello (404, no se publica nada);
// - mensaje opcional con iconos: de 1 a 5 de una lista cerrada (emociones, reacciones y universo
//   K-pop), en el orden elegido; sin texto libre.
// Necesitan una base de datos real configurada en app/.env.local, con la migración 008 aplicada.
// Ejecutar desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { recetaPorDefecto } from '../src/services/avatarCatalogo.js';
import { ICONOS_MENSAJE, GRUPOS_ICONOS, MAX_ICONOS_MENSAJE, EMOCIONES, REACCIONES } from '../src/catalogos/connect.js';

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_a`, alias: `fan_${sufijo}_a` }; // publica con sus diseños
const B = { usuario: `test_${sufijo}_b`, alias: `fan_${sufijo}_b` }; // otra cuenta
const C = { usuario: `test_${sufijo}_c`, alias: `fan_${sufijo}_c` }; // sin avatares ni sellos

function hayConfiguracion() {
  return ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'SESSION_SECRET']
    .every((k) => process.env[k] && !process.env[k].startsWith('CAMBIAR_POR'));
}

// Un formulario como lo envía el navegador: un campo repetido (los 5 «iconos») va varias veces.
function formulario(datos) {
  const f = new URLSearchParams();
  for (const [k, v] of Object.entries(datos)) for (const x of [].concat(v)) f.append(k, x);
  return f.toString();
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
      body: json !== undefined ? JSON.stringify(json) : datos ? formulario(datos) : undefined,
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
const sello = (nombre) => ({
  nombre, borde: 'negro', fondo: 'blanco', palabra: 'amor', color_palabra: 'fucsia',
  avatar: '', encuadre: 'rostro', mostrar_alias: 'si', color_alias: 'negro',
  motivo1: '', color_motivo1: 'negro', motivo2: '', color_motivo2: 'negro', motivo3: '', color_motivo3: 'negro',
});
const idDeSello = (destino) => /^\/studio\/sellos\/(\d+)/.exec(destino ?? '')?.[1];

// La última publicación de una cuenta, con su diseño guardado.
const ultimaPublicacion = async (idUsuario) => (await consulta(
  'SELECT id::text AS id, diseno FROM publicaciones WHERE id_usuario = $1 ORDER BY id DESC LIMIT 1', [idUsuario],
)).rows[0] ?? null;
const cuantasPublicaciones = async (idUsuario) => (await consulta(
  'SELECT count(*)::int AS n FROM publicaciones WHERE id_usuario = $1', [idUsuario],
)).rows[0].n;

// Una publicación del muro y su photocard.
const articulo = (html, id) => new RegExp(`<article id="publicacion-${id}"[\\s\\S]*?</article>`).exec(html)?.[0] ?? '';
const photocard = (html) => /<div class="photocard[\s\S]*?<\/div>/.exec(html)?.[0] ?? '';
const sinIds = (html) => html.replace(/avatar-svg-\d+/g, 'avatar-svg');
// Las piernas solo se dibujan con el cuerpo entero: en el muro va solo la cara.
const PIERNAS = /data-capa="piernas"/;
// El desplegable «Diseño» del formulario de publicar.
const desplegableDiseno = (html) => /<select[^>]*name="diseno"[\s\S]*?<\/select>/.exec(html)?.[0] ?? '';

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
    await consulta('DELETE FROM usuarios WHERE usuario = ANY($1)', [usuarios]); // borra también sus publicaciones
  } finally {
    // Aunque la limpieza falle, se cierran el servidor y la conexión: si no, el proceso se queda colgado.
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

// --- Catálogo de iconos del mensaje (sin base de datos) ---

test('Mensaje con iconos: la lista cerrada tiene emociones, reacciones y universo K-pop, con ids únicos y su dibujo', () => {
  assert.equal(MAX_ICONOS_MENSAJE, 5);
  assert.deepEqual(GRUPOS_ICONOS.map((g) => g.id), ['emociones', 'reacciones', 'kpop']);
  const ids = ICONOS_MENSAJE.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length, 'sin ids repetidos');
  for (const e of EMOCIONES) assert.ok(ids.includes(`cara-${e.id}`), `emoción ${e.id}`);
  for (const r of REACCIONES) assert.ok(ids.includes(`reaccion-${r.id}`), `reacción ${r.id}`);
  const kpop = ICONOS_MENSAJE.filter((i) => i.grupo === 'kpop');
  assert.ok(kpop.length >= 7, 'al menos 7 iconos del universo K-pop');
  for (const id of ['kpop-corazon-dedos', 'kpop-microfono', 'kpop-photocard', 'kpop-album', 'kpop-entrada', 'kpop-pancarta', 'kpop-camara']) {
    assert.ok(ids.includes(id), id);
  }
  for (const i of ICONOS_MENSAJE) {
    assert.ok(i.texto, `${i.id} tiene nombre`);
    assert.ok(GRUPOS_ICONOS.some((g) => g.id === i.grupo), `${i.id} está en un grupo`);
    const archivo = fileURLToPath(new URL(`../public${i.icono}`, import.meta.url));
    assert.ok(existsSync(archivo), `existe el dibujo de ${i.id} (${i.icono})`);
  }
});

test('Connect con diseño: cada publicación lleva una copia del diseño elegido, siempre de la propia cuenta', { skip: !hayConfiguracion() && 'Sin app/.env.local: prueba bloqueada, no fallida.' }, async (t) => {
  let navA, navB, navC, idAvatar, idSello;

  await t.test('1. sin avatares ni sellos, el formulario ofrece la imagen de perfil, invita a crear un avatar y la publicación lleva la inicial', async () => {
    navC = await entrarComo(C);
    const muro = await navC.pedir('/connect');
    const desplegable = desplegableDiseno(muro.html);
    assert.match(desplegable, /<option value="" selected>Mi imagen de perfil<\/option>/);
    assert.doesNotMatch(desplegable, /<optgroup/, 'sin diseños guardados, no hay grupos');
    assert.match(muro.html, /<a href="\/studio\/avatares\/nuevo">Crea uno en Avatar Studio<\/a>/);
    assert.doesNotMatch(muro.html, /cuando Avatar Studio esté listo/, 'el aviso provisional ya no sale');

    const r = await navC.enviar('/connect/publicaciones', { emocion: 'feliz', diseno: '' });
    assert.equal(r.estado, 302);
    const p = await ultimaPublicacion(C.id);
    assert.equal(p.diseno, null, 'sin imagen de perfil, sin diseño');
    const tarjeta = photocard(articulo((await navC.pedir('/connect')).html, p.id));
    assert.match(tarjeta, /class="photocard__inicial">F</);
  });

  await t.test('2. el formulario lista TUS avatares y sellos por su nombre, y no los de otra cuenta', async () => {
    navA = await entrarComo(A);
    navB = await entrarComo(B);
    const avatar = await navA.api('/studio/avatares', { nombre: 'Avatar de Connect', receta: receta({ boca: 'sonrisa' }) });
    assert.equal(avatar.estado, 201, 'se guarda el avatar de partida');
    idAvatar = avatar.cuerpo.id;
    const s = await navA.enviar('/studio/sellos', sello('Sello de Connect'));
    assert.equal(s.estado, 302, 'se guarda el sello de partida');
    idSello = idDeSello(s.destino);

    const desplegable = desplegableDiseno((await navA.pedir('/connect')).html);
    assert.match(desplegable, /<option value="" selected>Mi imagen de perfil<\/option>/);
    assert.match(desplegable, new RegExp(`<optgroup label="Mis avatares">\\s*<option value="avatar:${idAvatar}">Avatar de Connect</option>`));
    assert.match(desplegable, new RegExp(`<optgroup label="Mis sellos">\\s*<option value="sello:${idSello}">Sello de Connect</option>`));

    const deB = desplegableDiseno((await navB.pedir('/connect')).html);
    assert.doesNotMatch(deB, /Avatar de Connect|Sello de Connect/);
  });

  await t.test('3. sin elegir y con avatar en el perfil, la publicación copia ese avatar y el muro enseña su cara', async () => {
    await navA.enviar('/perfil/avatar', { avatar: idAvatar });
    await navA.enviar('/perfil/sello', { sello: idSello });
    const r = await navA.enviar('/connect/publicaciones', { emocion: 'feliz', diseno: '' });
    assert.equal(r.estado, 302);
    const p = await ultimaPublicacion(A.id);
    const guardado = (await consulta('SELECT composicion FROM avatares WHERE id = $1', [idAvatar])).rows[0].composicion;
    assert.deepEqual(p.diseno, { tipo: 'avatar', origen: idAvatar, copia: guardado });
    const tarjeta = photocard(articulo((await navA.pedir('/connect')).html, p.id));
    assert.match(tarjeta, /data-diseno="avatar"/);
    assert.match(tarjeta, /<svg/);
    assert.doesNotMatch(tarjeta, PIERNAS, 'solo la cara');
    assert.match(tarjeta, new RegExp(`aria-label="Avatar de ${A.alias}"`));
  });

  await t.test('4. sin elegir y con solo un sello en el perfil, la publicación copia el sello', async () => {
    await navA.enviar('/perfil/avatar', { avatar: '' });
    await navA.enviar('/connect/publicaciones', { emocion: 'calma', diseno: '' });
    const p = await ultimaPublicacion(A.id);
    assert.equal(p.diseno.tipo, 'sello');
    assert.equal(p.diseno.origen, idSello);
    const tarjeta = photocard(articulo((await navA.pedir('/connect')).html, p.id));
    assert.match(tarjeta, /data-diseno="sello"/);
    assert.match(tarjeta, /<svg class="sello/);
  });

  await t.test('5. eligiendo un avatar o un sello concretos, se copia ese', async () => {
    await navA.enviar('/connect/publicaciones', { emocion: 'orgullo', diseno: `avatar:${idAvatar}` });
    assert.equal((await ultimaPublicacion(A.id)).diseno.tipo, 'avatar');
    await navA.enviar('/connect/publicaciones', { emocion: 'orgullo', diseno: `sello:${idSello}` });
    const p = await ultimaPublicacion(A.id);
    assert.equal(p.diseno.tipo, 'sello');
    assert.equal(p.diseno.origen, idSello);
  });

  await t.test('6. editar o borrar después el avatar no cambia la publicación (es una copia)', async () => {
    await navA.enviar('/connect/publicaciones', { emocion: 'flechazo', diseno: `avatar:${idAvatar}` });
    const p = await ultimaPublicacion(A.id);
    const antes = sinIds(photocard(articulo((await navA.pedir('/connect')).html, p.id)));
    assert.match(antes, /data-diseno="avatar"/, 'la publicación lleva el avatar');

    const version = (await consulta('SELECT version FROM avatares WHERE id = $1', [idAvatar])).rows[0].version;
    const editado = await navA.api(`/studio/avatares/${idAvatar}`, { nombre: 'Avatar de Connect', receta: receta({ boca: 'enfado' }), version });
    assert.equal(editado.estado, 200, 'se edita el avatar');
    assert.equal(sinIds(photocard(articulo((await navA.pedir('/connect')).html, p.id))), antes, 'tras editarlo, igual');

    await consulta('DELETE FROM avatares WHERE id = $1', [idAvatar]);
    assert.equal(sinIds(photocard(articulo((await navA.pedir('/connect')).html, p.id))), antes, 'tras borrarlo, igual');
    const r = await navA.api('/studio/avatares', { nombre: 'Avatar de Connect', receta: receta({ boca: 'sonrisa' }) });
    idAvatar = r.cuerpo.id; // otro avatar para las pruebas siguientes
  });

  await t.test('7. otra cuenta no puede publicar con tu avatar ni con tu sello: 404 y no se publica nada', async () => {
    const antes = await cuantasPublicaciones(B.id);
    for (const diseno of [`avatar:${idAvatar}`, `sello:${idSello}`, 'avatar:abc', 'sello:0', 'otro:1', 'avatar:']) {
      const r = await navB.enviar('/connect/publicaciones', { emocion: 'feliz', diseno });
      assert.equal(r.estado, 404, diseno);
      assert.match(r.html, /Ese diseño no existe\. Elige otro\./, diseno);
    }
    assert.equal(await cuantasPublicaciones(B.id), antes);
  });

  await t.test('8. el mensaje con iconos se publica en el orden elegido y se ve con sus nombres', async () => {
    const iconos = ['kpop-corazon-dedos', 'reaccion-lightstick', 'cara-feliz'];
    const r = await navA.enviar('/connect/publicaciones', { emocion: 'emocion', diseno: '', iconos: [...iconos, '', ''] });
    assert.equal(r.estado, 302);
    const p = await ultimaPublicacion(A.id);
    const html = articulo((await navA.pedir('/connect')).html, p.id);
    const mensaje = /<ul class="mensaje-iconos"[\s\S]*?<\/ul>/.exec(html)?.[0] ?? '';
    const nombres = [...mensaje.matchAll(/<img src="([^"]+)" alt="([^"]+)"/g)].map((m) => m[2]);
    const esperados = iconos.map((id) => ICONOS_MENSAJE.find((i) => i.id === id).texto);
    assert.deepEqual(nombres, esperados);
  });

  await t.test('9. sin iconos no hay mensaje; un icono inventado o más de 5 dan error y no se publica', async () => {
    await navA.enviar('/connect/publicaciones', { emocion: 'calma', diseno: '', iconos: ['', '', '', '', ''] });
    const p = await ultimaPublicacion(A.id);
    assert.doesNotMatch(articulo((await navA.pedir('/connect')).html, p.id), /class="mensaje-iconos"/);

    const antes = await cuantasPublicaciones(A.id);
    for (const iconos of [['kpop-inventado'], Array(6).fill('cara-feliz')]) {
      const r = await navA.enviar('/connect/publicaciones', { emocion: 'calma', diseno: '', iconos });
      assert.equal(r.estado, 400, String(iconos));
      assert.match(r.html, /Elige hasta 5 iconos de la lista\./);
    }
    assert.equal(await cuantasPublicaciones(A.id), antes);
  });

  await t.test('10. sin JavaScript, el mensaje se compone con 5 desplegables de iconos; con JavaScript, con la paleta', async () => {
    const html = (await navA.pedir('/connect')).html;
    const desplegables = html.match(/<select[^>]*name="iconos"/g) ?? [];
    assert.equal(desplegables.length, 5);
    for (const i of ICONOS_MENSAJE) assert.ok(html.includes(`<option value="${i.id}" data-icono="${i.icono}">${i.texto}</option>`), i.id);
    assert.match(html, /<script src="\/js\/connect-publicar\.js" defer><\/script>/);
  });
});
