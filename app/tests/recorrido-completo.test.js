// RECORRIDO COMPLETO de la demo del 1/12 (D054), de principio a fin, como lo haría una fan:
// crear la cuenta con el formulario, entrar, guardar un avatar, hacer un sello con ese avatar,
// ponerlos en el perfil, publicar en Connect con su diseño y un mensaje con iconos, recibir una
// reacción de otra fan, completar HANGUL LIVE 001 y ver los Kpopis y el tesoro, salir y volver a
// entrar desde «otro navegador» con todo guardado en el servidor.
// No prueba cada regla (eso lo hacen los tests de cada parte): comprueba que las partes encajan.
// Es una red de seguridad antes de congelar el código (sábado 28): si algo se rompe, falla aquí.
// Necesita una base de datos real configurada en app/.env.local. Ejecutar desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { recetaPorDefecto } from '../src/services/avatarCatalogo.js';

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const FAN = { usuario: `test_${sufijo}_rc`, alias: `fan_${sufijo}_rc` };   // hace la demo entera
const OTRA = { usuario: `test_${sufijo}_ot`, alias: `fan_${sufijo}_ot` };  // reacciona a su publicación

function hayConfiguracion() {
  return ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'SESSION_SECRET']
    .every((k) => process.env[k] && !process.env[k].startsWith('CAMBIAR_POR'));
}

// Un formulario como lo envía el navegador: un campo repetido (los «iconos») va varias veces.
function formulario(datos) {
  const f = new URLSearchParams();
  for (const [k, v] of Object.entries(datos)) for (const x of [].concat(v)) f.append(k, x);
  return f.toString();
}

// Simula un navegador: guarda la cookie de sesión. Sabe enviar formularios y JSON.
function navegador() {
  let cookie = '';
  async function pedir(ruta, { metodo = 'GET', datos, json } = {}) {
    const tipo = json !== undefined ? { 'content-type': 'application/json', accept: 'application/json' }
      : datos ? { 'content-type': 'application/x-www-form-urlencoded' } : {};
    const res = await fetch(base + ruta, {
      method: metodo, redirect: 'manual', headers: { cookie, ...tipo },
      body: json !== undefined ? JSON.stringify(json) : datos ? formulario(datos) : undefined,
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const html = await res.text();
    let cuerpo = null;
    try { cuerpo = JSON.parse(html); } catch { /* no es JSON */ }
    return { estado: res.status, destino: res.headers.get('location'), html, cuerpo };
  }
  async function tokenCsrf() {
    let r = await pedir('/entrar');
    if (r.estado === 302) r = await pedir('/mi-kme');
    return /name="_csrf" value="([a-f0-9]+)"/.exec(r.html)[1];
  }
  return {
    pedir,
    enviar: async (ruta, datos = {}) => pedir(ruta, { metodo: 'POST', datos: { _csrf: await tokenCsrf(), ...datos } }),
    api: async (ruta, json) => pedir(ruta, { metodo: 'POST', json: { _csrf: await tokenCsrf(), ...json } }),
  };
}

async function entrar(cuenta) {
  const nav = navegador();
  const r = await nav.enviar('/entrar', { usuario: cuenta.usuario, password });
  assert.equal(r.estado, 302, `entra ${cuenta.alias}`);
  return nav;
}

// El texto que se lee, sin etiquetas.
const texto = (html) => html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
const cabecera = (html) => /<header class="cabecera"[\s\S]*?<\/header>/.exec(html)?.[0] ?? '';
const articulo = (html, id) => new RegExp(`<article id="publicacion-${id}"[\\s\\S]*?</article>`).exec(html)?.[0] ?? '';

before(async () => {
  if (!hayConfiguracion()) return;
  const { crearApp } = await import('../src/app.js');
  ({ cerrarPool, consulta } = await import('../src/config/db.js'));
  const { crearCuenta } = await import('../src/services/authService.js');
  OTRA.id = (await crearCuenta({ ...OTRA, password })).id; // la otra fan ya existe; la protagonista se registra en el test
  const { app } = crearApp();
  await new Promise((ok) => { servidor = app.listen(0, '127.0.0.1', ok); });
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  if (!servidor) return;
  try {
    const usuarios = [FAN.usuario, OTRA.usuario];
    await consulta(
      `DELETE FROM sesiones WHERE sess->>'usuarioId' IN (SELECT id::text FROM usuarios WHERE usuario = ANY($1))`,
      [usuarios],
    );
    await consulta('DELETE FROM usuarios WHERE usuario = ANY($1)', [usuarios]); // borra también todo lo suyo
  } finally {
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

test('Recorrido completo de la demo, de la cuenta a los Kpopis', { skip: !hayConfiguracion() && 'falta app/.env.local' }, async (t) => {
  let fan, idAvatar, idSello, idPublicacion;

  await t.test('1. crea su cuenta con el formulario y entra: Mi K-ME con su alias y 0 Kpopis', async () => {
    const nav = navegador();
    const registro = await nav.enviar('/registro', { ...FAN, password, password_repetida: password });
    assert.equal(registro.estado, 302);
    assert.match(registro.destino ?? '', /^\/entrar/);
    fan = await entrar(FAN);
    FAN.id = (await consulta('SELECT id FROM usuarios WHERE usuario = $1', [FAN.usuario])).rows[0].id;
    const mi = await fan.pedir('/mi-kme');
    assert.equal(mi.estado, 200);
    assert.ok(texto(mi.html).includes(FAN.alias));
    assert.ok(!mi.html.includes(FAN.usuario), 'el usuario privado no se ve nunca');
    assert.ok(texto(cabecera(mi.html)).includes('0 Kpopis'));
  });

  await t.test('2. guarda un avatar en Avatar Studio y sale en «Mis avatares»', async () => {
    const r = await fan.api('/studio/avatares', { nombre: 'Mi avatar de la demo', receta: { ...recetaPorDefecto(), boca: 'sonrisa' } });
    assert.equal(r.estado, 201);
    idAvatar = r.cuerpo.id;
    const lista = await fan.pedir('/studio/avatares');
    assert.ok(texto(lista.html).includes('Mi avatar de la demo'));
    assert.equal((await fan.pedir(`/studio/avatares/${idAvatar}`)).estado, 200, 'se vuelve a abrir en el editor');
  });

  await t.test('3. hace un sello con una palabra en hangul y ese avatar, que se puede imprimir', async () => {
    const r = await fan.enviar('/studio/sellos', {
      nombre: 'Sello de la demo', borde: 'fucsia', fondo: 'blanco', palabra: 'amor', color_palabra: 'negro',
      avatar: idAvatar, encuadre: 'rostro', mostrar_alias: 'si', color_alias: 'negro',
      motivo1: 'estrella', color_motivo1: 'fucsia', motivo2: '', color_motivo2: 'negro', motivo3: '', color_motivo3: 'negro',
    });
    assert.equal(r.estado, 302);
    idSello = /^\/studio\/sellos\/(\d+)/.exec(r.destino ?? '')?.[1];
    assert.ok(idSello, 'el sello se guarda');
    const editor = await fan.pedir(`/studio/sellos/${idSello}`);
    assert.match(editor.html, /<g data-parte="avatar">\s*<svg/, 'el sello lleva el avatar');
    assert.match(editor.html, />사랑</, 'y la palabra en hangul');
    assert.match(editor.html, /data-sello-impresion hidden/, 'con «Imprimir o descargar»');
    assert.ok(texto((await fan.pedir('/studio/sellos')).html).includes('Sello de la demo'));
  });

  await t.test('4. pone el avatar y el sello en su perfil: la cabecera lleva su cara y Mi K-ME, los dos', async () => {
    assert.equal((await fan.enviar('/perfil/avatar', { avatar: idAvatar })).estado, 302);
    assert.equal((await fan.enviar('/perfil/sello', { sello: idSello })).estado, 302);
    const mi = await fan.pedir('/mi-kme');
    assert.match(cabecera(mi.html), /data-perfil-cabecera="avatar"[^>]*>\s*<svg/);
    assert.match(mi.html, /data-perfil="avatar"[\s\S]*?<svg/);
    assert.match(mi.html, /data-perfil="sello"[\s\S]*?<svg[^>]*class="sello/);
  });

  await t.test('5. publica en Connect con su diseño y un mensaje con iconos; otra fan reacciona', async () => {
    const r = await fan.enviar('/connect/publicaciones', {
      emocion: 'feliz', diseno: '', iconos: ['kpop-corazon-dedos', 'reaccion-lightstick', 'kpop-microfono', '', ''],
    });
    assert.equal(r.estado, 302);
    idPublicacion = (await consulta(
      'SELECT id::text AS id FROM publicaciones WHERE id_usuario = $1 ORDER BY id DESC LIMIT 1', [FAN.id],
    )).rows[0].id;
    const otra = await entrar(OTRA);
    const muroOtra = articulo((await otra.pedir('/connect')).html, idPublicacion);
    assert.ok(muroOtra, 'la otra fan ve la publicación');
    assert.match(muroOtra, /data-diseno="avatar"/, 'con la cara de su avatar');
    assert.match(muroOtra, /<ul class="mensaje-iconos"[\s\S]*?alt="Corazón con los dedos"/, 'y su mensaje con iconos');
    assert.equal((await otra.enviar(`/connect/publicaciones/${idPublicacion}/reacciones`, { tipo: 'corazon' })).estado, 302);
    const muroFan = articulo((await fan.pedir('/connect')).html, idPublicacion);
    assert.match(muroFan, /value="corazon"[^>]*data-total="1"/, 'la fan ve la reacción');
  });

  await t.test('6. completa HANGUL LIVE 001 (fallando una vez) y gana 20 Kpopis y Luz Hangul 001', async () => {
    assert.equal((await fan.pedir('/escenario')).estado, 200);
    assert.ok(texto((await fan.enviar('/escenario/hangul-live-001/preguntas/1', { respuesta: 'paiting' })).html).includes('Prueba otra vez.'));
    await fan.enviar('/escenario/hangul-live-001/preguntas/1', { respuesta: 'annyeonghaseyo' });
    await fan.enviar('/escenario/hangul-live-001/preguntas/2', { respuesta: 'gomawoyo' });
    const final = await fan.enviar('/escenario/hangul-live-001/preguntas/3', { respuesta: 'paiting' });
    assert.ok(texto(final.html).includes('¡HANGUL LIVE 001 completado!'));
    assert.ok(texto(cabecera(final.html)).includes('20 Kpopis'));
  });

  await t.test('7. sale, y al volver a entrar desde otro navegador todo sigue guardado', async () => {
    assert.equal((await fan.enviar('/salir')).estado, 302);
    assert.equal((await fan.pedir('/mi-kme')).destino, '/entrar', 'después de salir, Mi K-ME pide entrar');
    const otroNavegador = await entrar(FAN);
    const mi = await otroNavegador.pedir('/mi-kme');
    assert.match(cabecera(mi.html), /data-perfil-cabecera="avatar"/, 'su imagen de perfil');
    assert.ok(texto(cabecera(mi.html)).includes('20 Kpopis'), 'sus Kpopis');
    assert.match(mi.html, /id="mis-tesoros"[\s\S]*?Luz Hangul 001/, 'su tesoro');
    assert.ok(texto((await otroNavegador.pedir('/studio/avatares')).html).includes('Mi avatar de la demo'), 'su avatar');
    assert.ok(texto((await otroNavegador.pedir('/studio/sellos')).html).includes('Sello de la demo'), 'su sello');
    assert.ok(articulo((await otroNavegador.pedir('/connect')).html, idPublicacion), 'su publicación');
  });
});
