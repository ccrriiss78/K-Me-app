// Pruebas del registro por formulario (T016):
// - sin correo (D018); al terminar se va a /entrar, sin abrir sesión (D019);
// - cada cuenta tiene un usuario privado, para entrar, y un alias público, distinto del usuario (D020);
// - todos los errores de datos dan 400 y el mismo mensaje, salvo el alias público ya en uso (D021);
// - tras un error, el formulario sale vacío (D022), salvo si el error es del alias: entonces se
//   conserva el usuario, el alias y las contraseñas salen vacíos y el cursor va al alias (D036);
// - los campos van por parejas, para que en el ordenador el formulario quepa a dos columnas (D036);
// - límite de 10 intentos de registro por IP cada hora, contando también los fallidos (D019).
// Necesitan una base de datos real configurada en app/.env.local (ver README).
// Ejecutar desde app/:  npm test
//
// Límites: este archivo hace exactamente 10 POST /registro antes de probar el intento 11,
// y 4 POST /entrar (el límite de entrada es de 10 cada 15 minutos).
// node --test lo ejecuta en su propio proceso, con sus propios contadores.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const MENSAJE_GENERAL = /No se ha podido crear la cuenta\. Revisa los datos y vuelve a intentarlo\./;

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
// 19 caracteres: cumple la regla de 12 a 128.
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const usuariosIntentados = []; // todo usuario que se intenta registrar se borra en after(), por si acaso
let intentosRegistro = 0;      // POST /registro hechos en este archivo

function hayConfiguracion() {
  return ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'SESSION_SECRET']
    .every((k) => process.env[k] && !process.env[k].startsWith('CAMBIAR_POR'));
}

// Simula un navegador: guarda la cookie de sesión y la reenvía.
function navegador() {
  let cookie = '';
  async function pedir(ruta, { metodo = 'GET', datos } = {}) {
    const res = await fetch(base + ruta, {
      method: metodo,
      redirect: 'manual',
      headers: { cookie, ...(datos ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) },
      body: datos ? new URLSearchParams(datos).toString() : undefined,
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    return { estado: res.status, destino: res.headers.get('location'), html: await res.text() };
  }
  // Token CSRF sacado de una página que sí existe hoy (/entrar): sirve para cualquier formulario de la sesión.
  async function tokenCsrf() {
    const { html } = await pedir('/entrar');
    return /name="_csrf" value="([a-f0-9]+)"/.exec(html)[1];
  }
  return { pedir, tokenCsrf };
}

// Datos de una cuenta nueva con su número n: usuario test_… (privado) y alias fan_… (público).
function cuenta(n) {
  const usuario = `test_${sufijo}_${n}`;
  usuariosIntentados.push(usuario);
  return { usuario, alias: `fan_${sufijo}_${n}`, password, password_repetida: password };
}

// Envía el formulario de registro y cuenta el intento (para no pasarse del límite sin querer).
async function registrar(nav, datos, { conCsrf = true } = {}) {
  intentosRegistro++;
  const cuerpo = conCsrf ? { _csrf: await nav.tokenCsrf(), ...datos } : datos;
  return nav.pedir('/registro', { metodo: 'POST', datos: cuerpo });
}

// Intenta entrar con un usuario y una contraseña; devuelve la respuesta.
async function entrar(nav, usuario, clave) {
  return nav.pedir('/entrar', { metodo: 'POST', datos: { _csrf: await nav.tokenCsrf(), usuario, password: clave } });
}

// D022: lo escrito no vuelve a aparecer en la página tras un error (se busca sin distinguir mayúsculas).
function assertSinLoEscrito(html, ...valores) {
  for (const v of valores) assert.doesNotMatch(html, new RegExp(v, 'i'), `«${v}» no debe aparecer en la página`);
}

// D021: la respuesta no dice que un usuario exista.
function assertSinPistas(html) {
  assert.doesNotMatch(html, /existe|en uso|ocupad/i, 'el mensaje no dice si el usuario existe');
}

// La etiqueta <input …> del campo con ese id, para mirar sus atributos.
function etiquetaCampo(html, id) {
  const etiqueta = new RegExp(`<input[^>]*\\bid="${id}"[^>]*>`).exec(html)?.[0];
  assert.ok(etiqueta, `hay un campo con id «${id}»`);
  return etiqueta;
}
const valorDe = (etiqueta) => /\bvalue="([^"]*)"/.exec(etiqueta)?.[1] ?? '';

// D036: tras un error del alias se conserva el usuario escrito; el alias y las contraseñas salen
// vacíos, el cursor va al alias y el alias queda marcado como erróneo y unido al mensaje de error.
function assertConservaUsuarioYEnfocaAlias(html, usuario) {
  const campoUsuario = etiquetaCampo(html, 'usuario');
  const campoAlias = etiquetaCampo(html, 'alias');
  assert.equal(valorDe(campoUsuario), usuario, 'el usuario escrito se conserva');
  assert.equal(valorDe(campoAlias), '', 'el alias sale en blanco');
  for (const id of ['password', 'password_repetida']) {
    assert.equal(valorDe(etiquetaCampo(html, id)), '', `el campo «${id}» sale vacío`);
  }
  assert.doesNotMatch(html, new RegExp(password), 'la contraseña no vuelve en la página');
  assert.match(campoAlias, /\bautofocus\b/, 'el cursor va al alias');
  assert.doesNotMatch(campoUsuario, /\bautofocus\b/, 'el cursor ya no va al usuario');
  assert.match(campoAlias, /aria-invalid="true"/, 'el alias queda marcado como erróneo');
  assert.match(html, /<p[^>]*\bid="error-registro"[^>]*role="alert"/, 'el mensaje de error tiene id="error-registro"');
  assert.match(campoAlias, /aria-describedby="[^"]*\berror-registro\b/, 'el alias está unido al mensaje de error');
}

before(async () => {
  if (!hayConfiguracion()) return;
  const { crearApp } = await import('../src/app.js');
  ({ cerrarPool, consulta } = await import('../src/config/db.js'));
  const { app } = crearApp();
  await new Promise((ok) => { servidor = app.listen(0, '127.0.0.1', ok); });
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  if (!servidor) return;
  try {
    await consulta(
      `DELETE FROM sesiones WHERE sess->>'usuarioId' IN (SELECT id::text FROM usuarios WHERE usuario = ANY($1))`,
      [usuariosIntentados],
    );
    await consulta('DELETE FROM usuarios WHERE usuario = ANY($1)', [usuariosIntentados]);
  } finally {
    // Aunque la limpieza falle, se cierran el servidor y la conexión: si no, el proceso se queda colgado.
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

test('registro por formulario: usuario privado, alias público y errores sin pistas', { skip: !hayConfiguracion() && 'Sin app/.env.local: prueba bloqueada, no fallida.' }, async (t) => {
  const primera = cuenta(1); // la cuenta que sí se crea y se usa en los tests siguientes

  await t.test('1. /registro muestra el formulario con su token CSRF y las reglas de cada campo', async () => {
    const r = await navegador().pedir('/registro');
    assert.equal(r.estado, 200);
    assert.match(r.html, /<form[^>]*method="post"[^>]*action="\/registro"/);
    assert.match(r.html, /name="_csrf" value="[a-f0-9]+"/);
    for (const campo of ['usuario', 'alias', 'password', 'password_repetida']) {
      assert.match(r.html, new RegExp(`<input[^>]*name="${campo}"`), `hay un campo «${campo}»`);
    }
    assert.match(r.html, /<label[^>]*for="usuario"[^>]*>\s*Usuario/, 'el campo para entrar se llama «Usuario»');
    assert.match(r.html, /<input[^>]*id="usuario"[^>]*autocomplete="off"/, 'el usuario lleva autocomplete="off"');
    assert.match(r.html, /3 a 30 caracteres/, 'se ven las reglas del usuario y del alias');
    assert.match(r.html, /12 a 128 caracteres/, 'se ve la regla de la contraseña');
    assert.match(r.html, /Repite la misma contraseña/, 'se ve la regla de repetir la contraseña');
  });

  await t.test('1b. los campos van por parejas (usuario y alias; contraseña y repetición) para verse a dos columnas en el ordenador', async () => {
    const { html } = await navegador().pedir('/registro');
    // Dentro de una misma fila: entre los dos campos no empieza otra fila.
    const mismaFila = (a, b) => new RegExp(
      `class="formulario__fila"(?:(?!class="formulario__fila")[\\s\\S])*id="${a}"(?:(?!class="formulario__fila")[\\s\\S])*id="${b}"`);
    assert.match(html, mismaFila('usuario', 'alias'), 'usuario y alias van en la misma fila');
    assert.match(html, mismaFila('password', 'password_repetida'), 'las dos contraseñas van en la misma fila');
    assert.match(html, /id="alias"[\s\S]*class="formulario__fila"[\s\S]*id="password"/, 'las contraseñas van en otra fila');
  });

  await t.test('2. un registro correcto lleva a /entrar con «Cuenta creada. Ya puedes entrar.» y no abre sesión', async () => {
    const nav = navegador();
    const r = await registrar(nav, primera);
    assert.equal(r.estado, 302);
    assert.match(r.destino ?? '', /^\/entrar/);
    const entrada = await nav.pedir(r.destino);
    assert.match(entrada.html, /Cuenta creada\. Ya puedes entrar\./);
    assert.equal((await nav.pedir('/mi-kme')).estado, 302, 'registrarse no abre sesión');
  });

  await t.test('3. con la cuenta recién creada se entra con el usuario; «Mi K-ME» muestra el alias y no el usuario', async () => {
    const nav = navegador();
    const r = await entrar(nav, primera.usuario, password);
    assert.equal(r.estado, 302);
    assert.equal(r.destino, '/mi-kme');
    const privada = await nav.pedir('/mi-kme');
    assert.equal(privada.estado, 200);
    assert.match(privada.html, new RegExp(primera.alias));
    assert.doesNotMatch(privada.html, new RegExp(primera.usuario), 'el usuario (privado) no aparece');
    const otra = await nav.pedir('/registro');
    assert.equal(otra.estado, 302, 'con sesión abierta, /registro lleva a «Mi K-ME»');
    assert.equal(otra.destino, '/mi-kme');
  });

  await t.test('4. un usuario que ya existe (aunque cambien las mayúsculas) da 400 y el mensaje general, sin decir que existe', async () => {
    const datos = { ...cuenta(4), usuario: primera.usuario.toUpperCase() };
    const r = await registrar(navegador(), datos);
    assert.equal(r.estado, 400);
    assert.match(r.html, MENSAJE_GENERAL);
    assertSinPistas(r.html);
    assertSinLoEscrito(r.html, datos.usuario, datos.alias);
    assert.match(etiquetaCampo(r.html, 'usuario'), /\bautofocus\b/, 'con el mensaje general, el cursor vuelve al usuario');
  });

  await t.test('5. un alias que ya usa otro fan da 400 y «Ese alias ya lo usa otro fan.», conserva el usuario, vacía el alias y lleva el cursor al alias; no se crea la cuenta', async () => {
    const datos = { ...cuenta(5), alias: primera.alias.toUpperCase() };
    const nav = navegador();
    const r = await registrar(nav, datos);
    assert.equal(r.estado, 400);
    assert.match(r.html, /Ese alias ya lo usa otro fan\./);
    assertSinLoEscrito(r.html, datos.alias);
    assertConservaUsuarioYEnfocaAlias(r.html, datos.usuario);
    assert.equal((await entrar(nav, datos.usuario, password)).estado, 401, 'esa cuenta no existe');
  });

  await t.test('6. un alias igual que el usuario (aunque cambien las mayúsculas) da 400 y «El alias tiene que ser distinto de tu usuario.», conserva el usuario y lleva el cursor al alias vacío', async () => {
    const datos = cuenta(6);
    datos.alias = datos.usuario.toUpperCase();
    const r = await registrar(navegador(), datos);
    assert.equal(r.estado, 400);
    assert.match(r.html, /El alias tiene que ser distinto de tu usuario\./);
    assertConservaUsuarioYEnfocaAlias(r.html, datos.usuario);
  });

  await t.test('7. un usuario o un alias con formato no válido dan 400 y el mensaje general', async () => {
    const usuarioCorto = { ...cuenta(7), usuario: 'ab' };
    const r1 = await registrar(navegador(), usuarioCorto);
    assert.equal(r1.estado, 400);
    assert.match(r1.html, MENSAJE_GENERAL);

    const aliasConEspacio = { ...cuenta(71), alias: 'fan con espacio' };
    const r2 = await registrar(navegador(), aliasConEspacio);
    assert.equal(r2.estado, 400);
    assert.match(r2.html, MENSAJE_GENERAL);
    assertSinLoEscrito(r2.html, aliasConEspacio.usuario, aliasConEspacio.alias);
  });

  await t.test('8. una contraseña de 11 o de 129 caracteres da 400 y el mensaje general', async () => {
    for (const [n, largo] of [[8, 11], [81, 129]]) {
      const clave = 'a'.repeat(largo);
      const r = await registrar(navegador(), { ...cuenta(n), password: clave, password_repetida: clave });
      assert.equal(r.estado, 400, `contraseña de ${largo} caracteres`);
      assert.match(r.html, MENSAJE_GENERAL);
    }
  });

  await t.test('9. si las dos contraseñas no coinciden da 400 y el mensaje general, y el formulario sale vacío', async () => {
    const datos = { ...cuenta(9), password_repetida: password + 'x' };
    const r = await registrar(navegador(), datos);
    assert.equal(r.estado, 400);
    assert.match(r.html, MENSAJE_GENERAL);
    assertSinLoEscrito(r.html, datos.usuario, datos.alias);
  });

  await t.test('10. sin token CSRF da 403 y no se crea la cuenta', async () => {
    const datos = cuenta(10);
    const nav = navegador();
    const r = await registrar(nav, datos, { conCsrf: false });
    assert.equal(r.estado, 403);
    assert.equal((await entrar(nav, datos.usuario, password)).estado, 401, 'esa cuenta no existe');
  });

  await t.test('11. el intento de registro número 11 en una hora da 429 y no crea la cuenta', async () => {
    assert.equal(intentosRegistro, 10, 'los tests anteriores han hecho 10 intentos de registro');
    const datos = cuenta(11);
    const nav = navegador();
    const r = await registrar(nav, datos);
    assert.equal(r.estado, 429);
    assert.match(r.html, /Demasiados registros desde este equipo\. Espera una hora y vuelve a probar\./);
    assert.equal((await entrar(nav, datos.usuario, password)).estado, 401, 'esa cuenta no existe');
  });
});
