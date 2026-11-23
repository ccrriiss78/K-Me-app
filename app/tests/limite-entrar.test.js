// Pruebas del límite de intentos al entrar (prueba 6 del README; T013, E0050):
// - como máximo 10 intentos cada 15 minutos por dirección IP (middleware/limiteIntentos.js);
// - del intento 1 al 10, una contraseña incorrecta da 401 y «Los datos introducidos no son válidos.»;
// - el intento 11 da 429 y «Demasiados intentos. Espera unos minutos antes de volver a probar.»;
// - con el límite alcanzado, ni la contraseña correcta deja entrar.
// Va en un archivo propio: node --test ejecuta cada archivo en su proceso, con su propio contador
// de intentos, así que estos 12 intentos no afectan a los demás tests.
// Necesitan una base de datos real configurada en app/.env.local (ver README).
// Ejecutar desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const MENSAJE_FALLO = /Los datos introducidos no son válidos\./;
const MENSAJE_LIMITE = /Demasiados intentos\. Espera unos minutos antes de volver a probar\./;

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const usuario = `test_${sufijo}`;
const alias = `fan_${sufijo}`;
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex'); // 19 caracteres
const incorrecta = 'Incorrecta-' + crypto.randomBytes(6).toString('hex');

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
    return { estado: res.status, destino: res.headers.get('location'), cabeceras: res.headers, html: await res.text() };
  }
  // Pedir /entrar (GET) no cuenta como intento: el límite solo se aplica al enviar el formulario.
  async function tokenCsrf() {
    const { html } = await pedir('/entrar');
    return /name="_csrf" value="([a-f0-9]+)"/.exec(html)[1];
  }
  async function entrar(clave) {
    return pedir('/entrar', { metodo: 'POST', datos: { _csrf: await tokenCsrf(), usuario, password: clave } });
  }
  return { pedir, entrar };
}

before(async () => {
  if (!hayConfiguracion()) return;
  const { crearApp } = await import('../src/app.js');
  ({ cerrarPool, consulta } = await import('../src/config/db.js'));
  const { crearCuenta } = await import('../src/services/authService.js');
  await crearCuenta({ usuario, alias, password });
  const { app } = crearApp();
  await new Promise((ok) => { servidor = app.listen(0, '127.0.0.1', ok); });
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  if (!servidor) return;
  try {
    await consulta(
      `DELETE FROM sesiones WHERE sess->>'usuarioId' IN (SELECT id::text FROM usuarios WHERE usuario = $1)`,
      [usuario],
    );
    await consulta('DELETE FROM usuarios WHERE usuario = $1', [usuario]);
  } finally {
    // Aunque la limpieza falle, se cierran el servidor y la conexión: si no, el proceso se queda colgado.
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

test('límite de intentos al entrar: 10 cada 15 minutos', { skip: !hayConfiguracion() && 'Sin app/.env.local: prueba bloqueada, no fallida.' }, async (t) => {
  const nav = navegador();

  await t.test('1. los intentos 1 a 10 con la contraseña incorrecta dan 401 y «Los datos introducidos no son válidos.»; la regla anunciada es de 10 intentos en 900 s (15 minutos)', async () => {
    for (let n = 1; n <= 10; n++) {
      const r = await nav.entrar(incorrecta);
      assert.equal(r.estado, 401, `intento ${n}`);
      assert.match(r.html, MENSAJE_FALLO, `intento ${n}`);
      if (n === 1) {
        const regla = r.cabeceras.get('ratelimit-policy') ?? '';
        assert.match(regla, /\bq=10\b/, 'como máximo 10 intentos');
        assert.match(regla, /\bw=900\b/, 'en una ventana de 900 s (15 minutos)');
      }
    }
  });

  await t.test('2. el intento 11 da 429 y «Demasiados intentos. Espera unos minutos antes de volver a probar.»', async () => {
    const r = await nav.entrar(incorrecta);
    assert.equal(r.estado, 429);
    assert.match(r.html, MENSAJE_LIMITE);
  });

  await t.test('3. con el límite alcanzado, la contraseña correcta tampoco deja entrar: 429 y sin sesión', async () => {
    const r = await nav.entrar(password);
    assert.equal(r.estado, 429);
    assert.match(r.html, MENSAJE_LIMITE);
    const privada = await nav.pedir('/mi-kme');
    assert.equal(privada.estado, 302, 'sin sesión, /mi-kme lleva a /entrar');
    assert.equal(privada.destino, '/entrar');
  });
});
