// Tipo de mensaje en Connect (D084, E0099). La autora: «no se entiende muy bien que sea un mensaje…
// si es un reto, si es mensaje etc antes del mensaje».
// - Al añadir un mensaje con iconos se elige qué es, de una lista cerrada: Mensaje, Reto, Pregunta,
//   Ánimo o Recomendación. Si no se elige, «Mensaje».
// - En el muro, el tipo sale delante de los iconos y da nombre a la lista para los lectores de pantalla.
// - Sin iconos no hay mensaje, ni tipo (aunque llegue uno).
// - Un tipo que no está en la lista: 400 con el aviso, y no se publica.
// - Las publicaciones de antes, sin tipo guardado, se ven como «Mensaje».
// Las primeras pruebas no necesitan base de datos; las demás, sí (app/.env.local). Desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { TIPOS_MENSAJE, TIPO_MENSAJE_POR_DEFECTO } from '../src/catalogos/connect.js';
import { leerTipoMensaje } from '../src/services/connectService.js';

const codigoDe = (fn) => { try { fn(); return null; } catch (e) { return e.codigo; } };

test('Tipos de mensaje: lista cerrada (Mensaje, Reto, Pregunta, Ánimo y Recomendación), con «Mensaje» por defecto', () => {
  assert.deepEqual(TIPOS_MENSAJE.map((t) => [t.id, t.texto]), [
    ['mensaje', 'Mensaje'], ['reto', 'Reto'], ['pregunta', 'Pregunta'], ['animo', 'Ánimo'], ['recomendacion', 'Recomendación'],
  ]);
  assert.equal(TIPO_MENSAJE_POR_DEFECTO, 'mensaje');
});

test('El servidor lee el tipo: con iconos, el elegido o «mensaje»; sin iconos, ninguno; uno inventado, error', () => {
  assert.equal(leerTipoMensaje('reto', ['kpop-microfono']), 'reto');
  assert.equal(leerTipoMensaje(undefined, ['kpop-microfono']), 'mensaje');
  assert.equal(leerTipoMensaje('', ['kpop-microfono']), 'mensaje');
  assert.equal(leerTipoMensaje('reto', []), null, 'sin iconos no hay tipo');
  for (const malo of ['concurso', 'RETO', ['reto', 'pregunta'], { a: 1 }]) {
    assert.equal(codigoDe(() => leerTipoMensaje(malo, ['kpop-microfono'])), 'TIPO_MENSAJE_NO_VALIDO', JSON.stringify(malo));
  }
});

// --- Con la base de datos ---

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_tm`, alias: `fan_${sufijo}_tm` };
const hayConfiguracion = () => ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'SESSION_SECRET']
  .every((k) => process.env[k] && !process.env[k].startsWith('CAMBIAR_POR'));

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
    await consulta('DELETE FROM usuarios WHERE usuario = $1', [A.usuario]); // borra también sus publicaciones
  } finally {
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

// Un formulario como lo envía el navegador: un campo repetido (los 5 «iconos») va varias veces.
function formulario(datos) {
  const f = new URLSearchParams();
  for (const [k, v] of Object.entries(datos)) for (const x of [].concat(v)) f.append(k, x);
  return f.toString();
}

test('Tipo de mensaje en Connect', { skip: !hayConfiguracion() && 'falta app/.env.local' }, async (t) => {
  let cookie = '';
  async function pedir(ruta, datos) {
    const res = await fetch(base + ruta, { method: datos ? 'POST' : 'GET', redirect: 'manual', headers: { cookie, ...(datos ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) }, body: datos ? formulario(datos) : undefined });
    const c = res.headers.get('set-cookie'); if (c) cookie = c.split(';')[0];
    return { estado: res.status, html: await res.text() };
  }
  const token = async () => /name="_csrf" value="([a-f0-9]+)"/.exec((await pedir(cookie ? '/connect' : '/entrar')).html)[1];
  const enviar = async (ruta, datos) => pedir(ruta, { _csrf: await token(), ...datos });
  assert.equal((await enviar('/entrar', { usuario: A.usuario, password })).estado, 302);
  const ultima = async () => (await consulta('SELECT id::text AS id, tipo_mensaje, iconos FROM publicaciones WHERE id_usuario = $1 ORDER BY id DESC LIMIT 1', [A.id])).rows[0];
  const cuantas = async () => (await consulta('SELECT count(*)::int AS n FROM publicaciones WHERE id_usuario = $1', [A.id])).rows[0].n;
  const articulo = (html, id) => new RegExp(`<article id="publicacion-${id}"[\\s\\S]*?</article>`).exec(html)?.[0] ?? '';
  // El tipo y la lista de iconos que nombra, tal como salen en el muro.
  const mensajeDe = (html) => /<div class="mensaje-publicado">\s*<span class="mensaje-publicado__tipo" id="([\w-]+)">([^<]+)<\/span>\s*<ul class="mensaje-iconos" aria-labelledby="([\w-]+)">/.exec(html);

  await t.test('1. en «Añadir un mensaje con iconos», se elige qué es: los cinco tipos, con «Mensaje» marcado', async () => {
    const html = (await pedir('/connect')).html;
    const detalles = /<details class="mensaje">[\s\S]*?<\/details>/.exec(html)?.[0] ?? '';
    assert.match(detalles, /<legend[^>]*>¿Qué es\?<\/legend>/);
    const opciones = [...detalles.matchAll(/<input type="radio" name="tipo_mensaje" value="([\w-]+)"( checked)?>\s*<span>([^<]+)<\/span>/g)];
    assert.deepEqual(opciones.map((m) => [m[1], m[3]]), TIPOS_MENSAJE.map((x) => [x.id, x.texto]));
    assert.deepEqual(opciones.filter((m) => m[2]).map((m) => m[1]), ['mensaje'], 'solo «Mensaje», marcado');
  });

  await t.test('2. un reto con iconos se guarda como reto, y en el muro sale «Reto» delante de los iconos, dando nombre a la lista', async () => {
    const r = await enviar('/connect/publicaciones', { emocion: 'energia', diseno: '', tipo_mensaje: 'reto', iconos: ['kpop-microfono', 'kpop-camara', '', '', ''] });
    assert.equal(r.estado, 302);
    const p = await ultima();
    assert.equal(p.tipo_mensaje, 'reto');
    const m = mensajeDe(articulo((await pedir('/connect')).html, p.id));
    assert.ok(m, 'el tipo va delante de los iconos');
    assert.equal(m[2], 'Reto');
    assert.equal(m[3], m[1], 'la lista de iconos se llama como el tipo');
  });

  await t.test('3. sin elegir tipo y con iconos, «Mensaje»; sin iconos no hay mensaje ni tipo, aunque llegue uno', async () => {
    await enviar('/connect/publicaciones', { emocion: 'feliz', diseno: '', iconos: ['cara-feliz', '', '', '', ''] });
    let p = await ultima();
    assert.equal(p.tipo_mensaje, 'mensaje');
    assert.equal(mensajeDe(articulo((await pedir('/connect')).html, p.id))?.[2], 'Mensaje');

    await enviar('/connect/publicaciones', { emocion: 'calma', diseno: '', tipo_mensaje: 'pregunta', iconos: ['', '', '', '', ''] });
    p = await ultima();
    assert.equal(p.tipo_mensaje, null);
    assert.doesNotMatch(articulo((await pedir('/connect')).html, p.id), /mensaje-publicado|mensaje-iconos/);
  });

  await t.test('4. un tipo que no está en la lista: 400 con el aviso, y no se publica', async () => {
    const antes = await cuantas();
    const r = await enviar('/connect/publicaciones', { emocion: 'calma', diseno: '', tipo_mensaje: 'concurso', iconos: ['kpop-album', '', '', '', ''] });
    assert.equal(r.estado, 400);
    assert.match(r.html, /Elige qué es tu mensaje de la lista\./);
    assert.equal(await cuantas(), antes);
  });

  await t.test('5. una publicación de antes, con iconos y sin tipo guardado, se ve como «Mensaje»', async () => {
    const { rows } = await consulta("INSERT INTO publicaciones (id_usuario, emocion, iconos) VALUES ($1, 'feliz', ARRAY['kpop-album']) RETURNING id::text AS id", [A.id]);
    assert.equal(mensajeDe(articulo((await pedir('/connect')).html, rows[0].id))?.[2], 'Mensaje');
  });
});
