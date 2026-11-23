// Pruebas automatizadas de la fase 1: cuenta, usuario duplicado, contraseña incorrecta,
// acceso privado sin sesión, entrada correcta, cierre de sesión y segundo "navegador".
// Cada cuenta tiene un usuario privado (para entrar) y un alias público (D020).
// Necesitan una base de datos real configurada en app/.env.local (ver README).
// Ejecutar desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

let servidor, base, usuario, alias, cerrarPool, consulta;
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');

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
  async function tokenCsrf() {
    const { html } = await pedir('/entrar');
    return /name="_csrf" value="([a-f0-9]+)"/.exec(html)[1];
  }
  return { pedir, tokenCsrf };
}

before(async () => {
  if (!hayConfiguracion()) return;
  const { crearApp } = await import('../src/app.js');
  ({ cerrarPool, consulta } = await import('../src/config/db.js'));
  const { app } = crearApp();
  await new Promise((ok) => { servidor = app.listen(0, '127.0.0.1', ok); });
  base = `http://127.0.0.1:${servidor.address().port}`;
  const hex = crypto.randomBytes(4).toString('hex');
  usuario = 'test_' + hex; // privado: solo para entrar
  alias = 'fan_' + hex;    // público: lo que ven los demás (no contiene el usuario)
});

after(async () => {
  if (!servidor) return;
  try {
    await consulta('DELETE FROM usuarios WHERE usuario = $1', [usuario]);
  } finally {
    // Aunque la limpieza falle, se cierran el servidor y la conexión: si no, el proceso se queda colgado (T018).
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

test('fase 1: cuentas e inicio de sesión', { skip: !hayConfiguracion() && 'Sin app/.env.local: prueba bloqueada, no fallida.' }, async (t) => {
  const { crearCuenta } = await import('../src/services/authService.js');

  await t.test('se crea una cuenta ficticia con usuario único', async () => {
    const u = await crearCuenta({ usuario, alias, password });
    assert.equal(u.usuario, usuario);
    assert.equal(u.alias, alias);
    const { rows } = await consulta('SELECT hash_password FROM usuarios WHERE id = $1', [u.id]);
    assert.ok(rows[0].hash_password.startsWith('$argon2id$'), 'la contraseña se guarda como hash Argon2id');
  });

  await t.test('un usuario duplicado (aunque cambie mayúsculas) se rechaza', async () => {
    await assert.rejects(
      crearCuenta({ usuario: usuario.toUpperCase(), alias: alias + '_2', password }),
      (e) => e.codigo === 'USUARIO_DUPLICADO',
    );
  });

  await t.test('la página privada sin sesión redirige a /entrar', async () => {
    const r = await navegador().pedir('/mi-kme');
    assert.equal(r.estado, 302);
    assert.equal(r.destino, '/entrar');
  });

  await t.test('una contraseña incorrecta no abre sesión', async () => {
    const nav = navegador();
    const r = await nav.pedir('/entrar', { metodo: 'POST', datos: { _csrf: await nav.tokenCsrf(), usuario, password: 'incorrecta-123' } });
    assert.equal(r.estado, 401);
    assert.match(r.html, /Los datos introducidos no son válidos\./);
    assert.equal((await nav.pedir('/mi-kme')).estado, 302);
  });

  await t.test('un formulario sin token CSRF se rechaza', async () => {
    const r = await navegador().pedir('/entrar', { metodo: 'POST', datos: { usuario, password } });
    assert.equal(r.estado, 403);
  });

  const nav1 = navegador();
  await t.test('con credenciales correctas se entra y se ve el alias', async () => {
    const r = await nav1.pedir('/entrar', { metodo: 'POST', datos: { _csrf: await nav1.tokenCsrf(), usuario, password } });
    assert.equal(r.estado, 302);
    assert.equal(r.destino, '/mi-kme');
    const privada = await nav1.pedir('/mi-kme');
    assert.equal(privada.estado, 200);
    assert.match(privada.html, new RegExp(`<strong>${alias}</strong>`));
    assert.doesNotMatch(privada.html, new RegExp(usuario), 'el usuario (privado) no aparece en la página');
  });

  await t.test('la misma cuenta puede entrar desde un segundo navegador sin cerrar el primero', async () => {
    const nav2 = navegador();
    const r = await nav2.pedir('/entrar', { metodo: 'POST', datos: { _csrf: await nav2.tokenCsrf(), usuario, password } });
    assert.equal(r.destino, '/mi-kme');
    assert.equal((await nav2.pedir('/mi-kme')).estado, 200);
    assert.equal((await nav1.pedir('/mi-kme')).estado, 200, 'el primer navegador sigue dentro');
    const { rows } = await consulta(`SELECT count(*)::int AS n FROM sesiones WHERE sess->>'usuarioId' IS NOT NULL AND sess->>'alias' = $1`, [alias]);
    assert.equal(rows[0].n, 2, 'hay dos sesiones de servidor para la cuenta');
  });

  await t.test('al cerrar sesión la página privada vuelve a estar bloqueada', async () => {
    const { html } = await nav1.pedir('/mi-kme');
    const token = /name="_csrf" value="([a-f0-9]+)"/.exec(html)[1];
    const r = await nav1.pedir('/salir', { metodo: 'POST', datos: { _csrf: token } });
    assert.equal(r.estado, 302);
    assert.equal(r.destino, '/entrar?salida=1');
    assert.equal((await nav1.pedir('/mi-kme')).estado, 302);
  });
});
