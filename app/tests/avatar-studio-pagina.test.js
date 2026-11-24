// La página del editor de Avatar Studio dentro de la app (T037, contrato v1, D052, D057):
// - lleva el editor aprobado entero (vista, bases, deshacer, categorías, opciones, impresión y
//   «Mi ambiente») y, además, el nombre del avatar y «Guardar»;
// - usa el logo original de K-ME Studio (copiado sin cambios) y los estilos del editor limitados
//   al contenedor (/editor/css/kme-muestras-app.css);
// - se sirven sus scripts y todo lo que importan.
// Necesitan una base de datos real configurada en app/.env.local.
// Ejecutar desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { recetaPorDefecto } from '../src/services/avatarCatalogo.js';

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_a`, alias: `fan_${sufijo}_a` };

function hayConfiguracion() {
  return ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'SESSION_SECRET']
    .every((k) => process.env[k] && !process.env[k].startsWith('CAMBIAR_POR'));
}

function navegador() {
  let cookie = '';
  async function pedir(ruta, { metodo = 'GET', datos, json, cabeceras = {}, binario = false } = {}) {
    const tipo = json !== undefined ? { 'content-type': 'application/json' } : datos ? { 'content-type': 'application/x-www-form-urlencoded' } : {};
    const res = await fetch(base + ruta, {
      method: metodo,
      redirect: 'manual',
      headers: { cookie, ...tipo, ...cabeceras },
      body: json !== undefined ? JSON.stringify(json) : datos ? new URLSearchParams(datos).toString() : undefined,
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const cuerpo = binario ? Buffer.from(await res.arrayBuffer()) : await res.text();
    return { estado: res.status, tipo: res.headers.get('content-type') ?? '', html: binario ? '' : cuerpo, bytes: binario ? cuerpo : null, cuerpo: (() => { try { return JSON.parse(cuerpo); } catch { return null; } })() };
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

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const IDS_DEL_EDITOR = [
  'avatar-grande', 'numero-photocard', 'selector-bases', 'deshacer', 'restaurar', 'categorias', 'panel-editor', 'estado',
  'imprimir-avatar', 'imprimir-55x85', 'imprimir-54x86', 'estado-impresion',
  'mi-ambiente', 'abrir-ambiente', 'cerrar-ambiente', 'opciones-ambiente',
];

before(async () => {
  if (!hayConfiguracion()) return;
  const { crearApp } = await import('../src/app.js');
  ({ cerrarPool, consulta } = await import('../src/config/db.js'));
  const { crearCuenta } = await import('../src/services/authService.js');
  A.id = (await crearCuenta({ ...A, password })).id;
  const { app } = crearApp();
  await new Promise((ok) => { servidor = app.listen(0, '127.0.0.1', ok); });
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  if (!servidor) return;
  try {
    await consulta(`DELETE FROM sesiones WHERE sess->>'usuarioId' = $1`, [String(A.id)]);
    await consulta('DELETE FROM usuarios WHERE usuario = $1', [A.usuario]);
  } finally {
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

test('Avatar Studio en la app: el editor aprobado, el nombre y «Guardar»', { skip: !hayConfiguracion() && 'Sin app/.env.local: prueba bloqueada, no fallida.' }, async (t) => {
  let nav;

  await t.test('1. la página de un avatar nuevo lleva el editor aprobado entero, el nombre «Mi avatar» y «Guardar»', async () => {
    nav = navegador();
    assert.equal((await nav.enviar('/entrar', { usuario: A.usuario, password })).estado, 302);
    const r = await nav.pedir('/studio/avatares/nuevo');
    assert.equal(r.estado, 200);
    for (const id of IDS_DEL_EDITOR) assert.match(r.html, new RegExp(`id="${id}"`), `falta #${id}`);
    assert.match(r.html, /<div[^>]*class="avatar-studio"[^>]*id="avatar-studio"/, 'el contenedor limita los estilos');
    assert.match(r.html, /<label[^>]*for="nombre-avatar"[^>]*>Nombre del avatar<\/label>/);
    assert.match(r.html, /<input[^>]*id="nombre-avatar"[^>]*name="nombre"[^>]*value="Mi avatar"[^>]*maxlength="40"[^>]*required/);
    assert.match(r.html, /<button[^>]*type="submit"[^>]*>Guardar<\/button>/);
    assert.match(r.html, /id="estado-guardado"[^>]*role="status"/, 'los mensajes del guardado se anuncian');
    assert.match(r.html, /<img src="\/img\/K-ME-Studio.svg" alt="K-ME Studio"/);
    assert.match(r.html, /Sin <strong>fan<\/strong> no hay <strong>idol<\/strong>\./);
    assert.match(r.html, /<link rel="stylesheet" href="\/editor\/css\/kme-muestras-app.css">/);
  });

  await t.test('2. al abrir un avatar guardado, el nombre es el suyo', async () => {
    const creado = await nav.api('/studio/avatares', { nombre: 'Mi bias & yo', receta: recetaPorDefecto() });
    assert.equal(creado.estado, 201);
    const r = await nav.pedir(`/studio/avatares/${creado.cuerpo.id}`);
    assert.equal(r.estado, 200);
    assert.match(r.html, /<input[^>]*id="nombre-avatar"[^>]*value="Mi bias &amp; yo"/, 'escapado');
  });

  await t.test('3. se sirven el logo original sin cambios, los estilos del editor y los scripts con todo lo que importan', async () => {
    const logo = await nav.pedir('/img/K-ME-Studio.svg', { binario: true });
    assert.equal(logo.estado, 200);
    const original = await readFile(new URL('../../K-ME-logos-revisados-v1.1/K-ME-logos-revisados-v1.1/03-web/K-ME-Studio.svg', import.meta.url));
    assert.equal(sha256(logo.bytes), sha256(original), 'el logo es el original, byte a byte');

    const css = await nav.pedir('/editor/css/kme-muestras-app.css');
    assert.equal(css.estado, 200);
    assert.match(css.tipo, /text\/css/);

    for (const script of ['/js/avatar-studio.js', '/js/avatar-studio-guardado.js']) {
      const js = await nav.pedir(script);
      assert.equal(js.estado, 200, script);
      assert.match(js.tipo, /javascript/, script);
      for (const [, ruta] of js.html.matchAll(/^import [^;]*?from '([^']+)';/gm)) {
        const destino = new URL(ruta, base + script).pathname;
        assert.equal((await nav.pedir(destino)).estado, 200, `${script} importa ${destino}`);
      }
    }
    assert.match((await nav.pedir('/js/avatar-studio.js')).html, /from '\/editor\/js\/kme-vista-visual\.js'/, 'reutiliza el editor aprobado');
  });
});
