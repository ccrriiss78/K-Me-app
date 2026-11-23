// Pruebas del ajuste del login pedido por el profesor:
// - la contraseña tiene entre 12 y 128 caracteres, sin reglas de composición;
// - al entrar, una contraseña de más de 128 se rechaza ANTES de calcular ningún hash;
// - la sesión dura 24 h, o 7 días si se marca «Mantener sesión abierta»;
// - si el usuario o la contraseña no son correctos, el mensaje es «Los datos introducidos no son válidos.» (D017);
// - tras un error, el formulario de entrar sale vacío (D022).
// Se entra con el usuario (privado); el alias es el nombre público (D020).
// Necesitan una base de datos real configurada en app/.env.local (ver README).
// Ejecutar desde app/:  npm test
//
// Límite de entrada: 10 intentos por IP cada 15 minutos. Este archivo hace 7 POST /entrar
// y node --test lo ejecuta en su propio proceso, con su propio contador.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;
const MARGEN = 5 * 60 * 1000; // «unas 24 h»: se aceptan 5 minutos arriba o abajo
const MENSAJE_ERROR = /Los datos introducidos no son válidos\./; // el mismo para usuario y contraseña

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const usuario = `test_${sufijo}`; // privado: solo para entrar
const alias = `fan_${sufijo}`;    // público (no contiene el usuario)
// 19 caracteres: es válida con la regla antigua (mínimo 8) y con la nueva (mínimo 12).
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const usuariosCreados = [usuario]; // todo lo que se crea aquí se borra en after()

function hayConfiguracion() {
  return ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'SESSION_SECRET']
    .every((k) => process.env[k] && !process.env[k].startsWith('CAMBIAR_POR'));
}

// Contraseña de prueba de n caracteres. Solo letras: no hay reglas de composición.
const clave = (n) => 'a'.repeat(n);

// Simula un navegador: guarda la cookie de sesión y la reenvía.
// Además devuelve la cabecera Set-Cookie completa, para leer su fecha de caducidad.
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
    return { estado: res.status, destino: res.headers.get('location'), html: await res.text(), setCookie };
  }
  async function tokenCsrf() {
    const { html } = await pedir('/entrar');
    return /name="_csrf" value="([a-f0-9]+)"/.exec(html)[1];
  }
  return { pedir, tokenCsrf };
}

// Milisegundos que faltan para la fecha «Expires» de la cookie de sesión.
function caducidadCookie(setCookie) {
  assert.ok(setCookie, 'el servidor envía la cookie de sesión');
  const m = /;\s*Expires=([^;]+)/i.exec(setCookie);
  assert.ok(m, 'la cookie lleva fecha de caducidad');
  return Date.parse(m[1]) - Date.now();
}

// Milisegundos que faltan para que caduque la sesión guardada en PostgreSQL.
// La cookie vale "s:<id de sesión>.<firma>"; con ese id se busca la fila en la tabla sesiones.
// La resta se hace en la base de datos para no mezclar zonas horarias.
async function caducidadSesion(setCookie) {
  const par = setCookie.split(';')[0];
  const valor = decodeURIComponent(par.slice(par.indexOf('=') + 1));
  const sid = valor.slice(2, valor.lastIndexOf('.'));
  const { rows } = await consulta(
    'SELECT EXTRACT(EPOCH FROM (expire - LOCALTIMESTAMP)) * 1000 AS ms FROM sesiones WHERE sid = $1',
    [sid],
  );
  assert.equal(rows.length, 1, 'la sesión está guardada en el servidor');
  return Number(rows[0].ms);
}

function assertCerca(ms, esperado, que) {
  assert.ok(
    Math.abs(ms - esperado) <= MARGEN,
    `${que}: caduca en ${(ms / HORA).toFixed(2)} h; se esperaban unas ${esperado / HORA} h`,
  );
}

before(async () => {
  if (!hayConfiguracion()) return;
  const { crearApp } = await import('../src/app.js');
  ({ cerrarPool, consulta } = await import('../src/config/db.js'));
  const { app } = crearApp();
  await new Promise((ok) => { servidor = app.listen(0, '127.0.0.1', ok); });
  base = `http://127.0.0.1:${servidor.address().port}`;
  const { crearCuenta } = await import('../src/services/authService.js');
  await crearCuenta({ usuario, alias, password });
});

after(async () => {
  if (!servidor) return;
  try {
    // Primero las sesiones de esas cuentas (la sesión guarda el id de la cuenta) y después las cuentas.
    await consulta(
      `DELETE FROM sesiones WHERE sess->>'usuarioId' IN (SELECT id::text FROM usuarios WHERE usuario = ANY($1))`,
      [usuariosCreados],
    );
    await consulta('DELETE FROM usuarios WHERE usuario = ANY($1)', [usuariosCreados]);
  } finally {
    // Aunque la limpieza falle, se cierran el servidor y la conexión: si no, el proceso se queda colgado (T018).
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

test('ajuste del login: contraseña de 12 a 128 caracteres y duración de la sesión', { skip: !hayConfiguracion() && 'Sin app/.env.local: prueba bloqueada, no fallida.' }, async (t) => {
  const { crearCuenta } = await import('../src/services/authService.js');
  const argon2 = (await import('argon2')).default;

  // Crea una cuenta con una contraseña de n caracteres y apunta su usuario para borrarla al final.
  function crearConClave(n) {
    const u = `test_${sufijo}_${n}`;
    usuariosCreados.push(u);
    return crearCuenta({ usuario: u, alias: `fan_${sufijo}_${n}`, password: clave(n) });
  }

  await t.test('1. crear una cuenta con una contraseña de 11 caracteres da error', async () => {
    await assert.rejects(crearConClave(11), { message: 'La contraseña debe tener al menos 12 caracteres.' });
  });

  await t.test('2. crear una cuenta con una contraseña de 12 caracteres funciona', async () => {
    const u = await crearConClave(12);
    assert.equal(u.usuario, `test_${sufijo}_12`);
  });

  await t.test('3. crear una cuenta con una contraseña de 128 caracteres funciona', async () => {
    const u = await crearConClave(128);
    assert.equal(u.usuario, `test_${sufijo}_128`);
  });

  await t.test('4. crear una cuenta con una contraseña de 129 caracteres da error', async () => {
    await assert.rejects(crearConClave(129), { message: 'La contraseña no puede superar 128 caracteres.' });
  });

  await t.test('5. crear una cuenta con una contraseña de 10.000 caracteres da error', async () => {
    await assert.rejects(crearConClave(10000), { message: 'La contraseña no puede superar 128 caracteres.' });
  });

  await t.test('6. entrar con una contraseña de más de 128 caracteres da 401 sin calcular ningún hash', async (t6) => {
    // Espías sobre argon2: cuentan las llamadas a hash() y verify() sin cambiar lo que hacen.
    // El servidor corre en este mismo proceso, así que el espía ve sus llamadas.
    const espiaHash = t6.mock.method(argon2, 'hash');
    const espiaVerify = t6.mock.method(argon2, 'verify');
    const nav = navegador();
    const csrf = await nav.tokenCsrf();

    // Control: con 128 caracteres (longitud permitida) el servidor sí comprueba el hash.
    // Si esto fallara, el espía no estaría funcionando y el resto del test no probaría nada.
    const control = await nav.pedir('/entrar', { metodo: 'POST', datos: { _csrf: csrf, usuario, password: clave(128) } });
    assert.equal(control.estado, 401);
    assert.ok(espiaVerify.mock.callCount() >= 1, 'control: con 128 caracteres sí se comprueba el hash');
    espiaHash.mock.resetCalls();
    espiaVerify.mock.resetCalls();

    // Con 129 caracteres, tanto si el usuario existe como si no.
    for (const u of [usuario, `test_${sufijo}_noexiste`]) {
      const r = await nav.pedir('/entrar', { metodo: 'POST', datos: { _csrf: csrf, usuario: u, password: clave(129) } });
      assert.equal(r.estado, 401);
      assert.match(r.html, MENSAJE_ERROR);
    }
    assert.equal(espiaVerify.mock.callCount(), 0, 'no se ha comprobado ningún hash');
    assert.equal(espiaHash.mock.callCount(), 0, 'no se ha calculado ningún hash');
  });

  await t.test('7. entrar sin marcar «Mantener sesión abierta»: la cookie y la sesión caducan en unas 24 h', async () => {
    const nav = navegador();
    const r = await nav.pedir('/entrar', { metodo: 'POST', datos: { _csrf: await nav.tokenCsrf(), usuario, password } });
    assert.equal(r.estado, 302);
    assert.equal(r.destino, '/mi-kme');
    assertCerca(caducidadCookie(r.setCookie), DIA, 'cookie');
    assertCerca(await caducidadSesion(r.setCookie), DIA, 'sesión en el servidor');
  });

  await t.test('8. entrar marcando «Mantener sesión abierta»: la cookie y la sesión caducan en unos 7 días', async () => {
    const nav = navegador();
    const r = await nav.pedir('/entrar', {
      metodo: 'POST',
      datos: { _csrf: await nav.tokenCsrf(), usuario, password, mantener_sesion: '1' },
    });
    assert.equal(r.estado, 302);
    assert.equal(r.destino, '/mi-kme');
    assertCerca(caducidadCookie(r.setCookie), 7 * DIA, 'cookie');
    assertCerca(await caducidadSesion(r.setCookie), 7 * DIA, 'sesión en el servidor');
  });

  await t.test('9. entrar con un usuario que no existe da 401 y «Los datos introducidos no son válidos.»', async () => {
    const nav = navegador();
    // Contraseña de longitud válida (19 caracteres): así se prueba el usuario, no el límite de 128.
    const r = await nav.pedir('/entrar', {
      metodo: 'POST',
      datos: { _csrf: await nav.tokenCsrf(), usuario: `test_${sufijo}_noexiste`, password },
    });
    assert.equal(r.estado, 401);
    assert.match(r.html, MENSAJE_ERROR);
    assert.equal((await nav.pedir('/mi-kme')).estado, 302, 'sigue sin sesión');
  });

  await t.test('10. tras un intento fallido, la cabecera no saluda ni muestra «Salir», y el formulario sale vacío', async () => {
    const nav = navegador();
    const usuarioEscrito = `test_${sufijo}_noexiste`;
    const r = await nav.pedir('/entrar', {
      metodo: 'POST',
      datos: { _csrf: await nav.tokenCsrf(), usuario: usuarioEscrito, password },
    });
    assert.equal(r.estado, 401);
    assert.doesNotMatch(r.html, /Hola,/, 'la cabecera no saluda a nadie');
    assert.doesNotMatch(r.html, /action="\/salir"/, 'no aparece el botón «Salir»');
    // D022: el dispositivo puede ser compartido, así que lo escrito no se vuelve a mostrar
    // y el navegador no debe guardar ni sugerir el usuario.
    assert.doesNotMatch(r.html, new RegExp(usuarioEscrito), 'el usuario escrito no aparece en la página');
    assert.match(r.html, /<input[^>]*id="usuario"[^>]*autocomplete="off"/, 'el campo del usuario lleva autocomplete="off"');
  });
});
