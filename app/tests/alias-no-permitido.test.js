// Alias ofensivos (decisión de la autora del 22/11/2026, D042): el alias es público y el sello
// puede mostrarlo, así que al crear la cuenta se rechazan los alias con palabras no permitidas,
// también con variantes habituales (mayúsculas, guiones bajos, números en lugar de letras).
// Un filtro no detecta todos los insultos: es una primera protección, no una moderación completa.
// Va en un archivo propio porque registro.test.js ya agota el límite de 10 registros por hora.
// Ejecutar desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { aliasNoPermitido } from '../src/catalogos/palabras-no-permitidas.js';

test('detecta palabras no permitidas en el alias, también con variantes', () => {
  for (const malo of ['idiota', 'Idiota', 'IDIOTA_99', 'fan_idiota', 'el_tonto', '1d10ta', 'fanidiota', 'idiotafan', 'gilipollas_fan', 'Puta', 'sub_normal']) {
    assert.equal(aliasNoPermitido(malo), true, `«${malo}» debería rechazarse`);
  }
});

test('no rechaza alias corrientes que solo se parecen a una palabra no permitida', () => {
  for (const bueno of ['fan_luz', 'computo', 'disputa', 'tontin', 'Montse', 'luna_23', 'Cris_Kpop', 'apolo']) {
    assert.equal(aliasNoPermitido(bueno), false, `«${bueno}» no debería rechazarse`);
  }
});

// --- Registro con un alias no permitido (necesita la base de datos de app/.env.local) ---

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const usuario = `test_${sufijo}_ofensa`;

function hayConfiguracion() {
  return ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'SESSION_SECRET']
    .every((k) => process.env[k] && !process.env[k].startsWith('CAMBIAR_POR'));
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
    await consulta('DELETE FROM usuarios WHERE usuario = $1', [usuario]);
  } finally {
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

test('un alias no permitido da 400 y «Ese alias no está permitido. Elige otro.», conserva el usuario y no crea la cuenta', { skip: !hayConfiguracion() && 'Sin app/.env.local: prueba bloqueada, no fallida.' }, async () => {
  let cookie = '';
  const pedir = async (ruta, datos) => {
    const res = await fetch(base + ruta, {
      method: datos ? 'POST' : 'GET',
      redirect: 'manual',
      headers: { cookie, ...(datos ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) },
      body: datos ? new URLSearchParams(datos).toString() : undefined,
    });
    const c = res.headers.get('set-cookie');
    if (c) cookie = c.split(';')[0];
    return { estado: res.status, html: await res.text() };
  };
  const token = /name="_csrf" value="([a-f0-9]+)"/.exec((await pedir('/registro')).html)[1];
  const r = await pedir('/registro', { _csrf: token, usuario, alias: `fan_idiota_${sufijo.slice(0, 4)}`, password, password_repetida: password });
  assert.equal(r.estado, 400);
  assert.match(r.html, /Ese alias no está permitido\. Elige otro\./);
  assert.match(r.html, new RegExp(`<input[^>]*name="usuario"[^>]*value="${usuario}"`), 'conserva el usuario');
  const filas = await consulta('SELECT 1 FROM usuarios WHERE usuario = $1', [usuario]);
  assert.equal(filas.rowCount, 0, 'no se crea la cuenta');
});
