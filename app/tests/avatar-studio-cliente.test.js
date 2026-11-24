// Guardado de Avatar Studio en el navegador (T037, contrato v1, D052): public/js/avatar-studio-guardado.js
// habla con las rutas JSON del servidor. Se prueba sin navegador, con un «fetch» de mentira que
// apunta lo que se envía y responde lo que diría el servidor.
// - Un avatar nuevo se crea (201) y desde entonces se guarda con su versión.
// - Si otro dispositivo lo guardó antes (409 con versión), no se sobrescribe: se ofrece guardar como copia.
// - Al llegar al límite de 20 (409 sin versión), se ofrecen la lista y el borrado de varios (D058).
// - Sesión caducada (401), página caducada (403), errores del servidor y sin conexión: un mensaje claro.
// No necesitan base de datos. Ejecutar desde app/:  npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearGuardado } from '../public/js/avatar-studio-guardado.js';

const RECETA = { version: 1, rostro: 'ovalado' };

// «fetch» de mentira: responde en orden las respuestas dadas y apunta cada petición.
function servidorFalso(...respuestas) {
  const peticiones = [];
  const fetch = async (url, opciones = {}) => {
    peticiones.push({ url, metodo: opciones.method ?? 'GET', cabeceras: opciones.headers ?? {}, cuerpo: opciones.body ? JSON.parse(opciones.body) : null });
    const r = respuestas.shift();
    if (r instanceof Error) throw r;
    return { status: r.estado, ok: r.estado >= 200 && r.estado < 300, json: async () => r.cuerpo };
  };
  return { fetch, peticiones };
}

test('un avatar nuevo se crea con el nombre, la receta y el token, y desde entonces tiene id, versión y dirección', async () => {
  const s = servidorFalso({ estado: 201, cuerpo: { id: '7', nombre: 'Mi avatar', version: 1 } });
  const g = crearGuardado({ fetch: s.fetch, csrf: 'abc' });
  const r = await g.guardar({ nombre: 'Mi avatar', receta: RECETA });
  assert.deepEqual(r, { tipo: 'creado', id: '7', version: 1, direccion: '/studio/avatares/7', mensaje: 'Avatar guardado en tu cuenta.' });
  assert.equal(s.peticiones[0].url, '/studio/avatares');
  assert.equal(s.peticiones[0].metodo, 'POST');
  assert.equal(s.peticiones[0].cabeceras.accept, 'application/json');
  assert.equal(s.peticiones[0].cabeceras['content-type'], 'application/json');
  assert.deepEqual(s.peticiones[0].cuerpo, { _csrf: 'abc', nombre: 'Mi avatar', receta: RECETA });
  assert.deepEqual(g.estado, { id: '7', version: 1 });
});

test('un avatar guardado se guarda en su dirección con la versión abierta, y la versión sube', async () => {
  const s = servidorFalso({ estado: 200, cuerpo: { id: '7', nombre: 'Otro', version: 3 } });
  const g = crearGuardado({ fetch: s.fetch, csrf: 'abc', id: '7', version: '2' });
  const r = await g.guardar({ nombre: 'Otro', receta: RECETA });
  assert.equal(r.tipo, 'guardado');
  assert.equal(r.mensaje, 'Cambios guardados.');
  assert.equal(s.peticiones[0].url, '/studio/avatares/7');
  assert.deepEqual(s.peticiones[0].cuerpo, { _csrf: 'abc', nombre: 'Otro', receta: RECETA, version: 2 });
  assert.deepEqual(g.estado, { id: '7', version: 3 });
});

test('si otro dispositivo lo guardó antes (409 con versión), no se sobrescribe y se ofrece guardar como copia', async () => {
  const s = servidorFalso(
    { estado: 409, cuerpo: { error: 'Este avatar ha cambiado desde que lo abriste.', version: 5 } },
    { estado: 201, cuerpo: { id: '9', nombre: 'Copia', version: 1 } },
  );
  const g = crearGuardado({ fetch: s.fetch, csrf: 'abc', id: '7', version: '2' });
  const r = await g.guardar({ nombre: 'Otro', receta: RECETA });
  assert.equal(r.tipo, 'conflicto');
  assert.match(r.mensaje, /Este avatar ha cambiado desde que lo abriste\./);
  assert.match(r.mensaje, /Tus cambios siguen aquí/);
  assert.deepEqual(g.estado, { id: '7', version: 2 }, 'no cambia hasta que se decida');
  const copia = await g.guardarComoCopia({ nombre: 'Copia', receta: RECETA });
  assert.equal(copia.tipo, 'creado');
  assert.equal(s.peticiones[1].url, '/studio/avatares', 'la copia es un avatar nuevo');
  assert.equal(s.peticiones[1].cuerpo.version, undefined);
  assert.deepEqual(g.estado, { id: '9', version: 1 });
});

test('al llegar al límite (409 sin versión) avisa con el mensaje del servidor', async () => {
  const s = servidorFalso({ estado: 409, cuerpo: { error: 'Ya tienes 20 avatares, el máximo. Borra uno para crear otro.' } });
  const g = crearGuardado({ fetch: s.fetch, csrf: 'abc' });
  const r = await g.guardar({ nombre: 'Mi avatar', receta: RECETA });
  assert.deepEqual(r, { tipo: 'limite', mensaje: 'Ya tienes 20 avatares, el máximo. Borra uno para crear otro.' });
  assert.deepEqual(g.estado, { id: '', version: null });
});

test('lista los avatares de la cuenta y borra varios con confirmación (para el límite, D058)', async () => {
  const s = servidorFalso(
    { estado: 200, cuerpo: { maximo: 20, avatares: [{ id: '1', nombre: 'Uno', version: 1 }, { id: '2', nombre: 'Dos', version: 4 }] } },
    { estado: 200, cuerpo: { borrados: 2 } },
  );
  const g = crearGuardado({ fetch: s.fetch, csrf: 'abc' });
  assert.deepEqual(await g.listar(), [{ id: '1', nombre: 'Uno' }, { id: '2', nombre: 'Dos' }]);
  assert.equal(s.peticiones[0].url, '/studio/avatares');
  assert.equal(s.peticiones[0].metodo, 'GET');
  assert.equal(s.peticiones[0].cabeceras.accept, 'application/json');
  const r = await g.borrar(['1', '2']);
  assert.deepEqual(r, { tipo: 'borrados', borrados: 2, mensaje: 'Se han borrado 2 avatares.' });
  assert.equal(s.peticiones[1].url, '/studio/avatares/borrar');
  assert.deepEqual(s.peticiones[1].cuerpo, { _csrf: 'abc', ids: ['1', '2'], confirmar: true });
});

test('sesión caducada (401), página caducada (403), error del servidor y sin conexión: un mensaje claro y nada cambia', async () => {
  const casos = [
    [{ estado: 401, cuerpo: { error: 'x' } }, 'sesion', /Tu sesión ha caducado/],
    [{ estado: 403, cuerpo: { error: 'x' } }, 'caducada', /La página ha caducado/],
    [{ estado: 400, cuerpo: { error: 'Ponle al avatar un nombre de 1 a 40 caracteres.' } }, 'error', /^Ponle al avatar un nombre de 1 a 40 caracteres\.$/],
    [{ estado: 413, cuerpo: { error: 'El avatar ocupa demasiado para guardarlo.' } }, 'error', /^El avatar ocupa demasiado para guardarlo\.$/],
    [new TypeError('Failed to fetch'), 'error', /No se ha podido guardar.*conexión/],
  ];
  for (const [respuesta, tipo, mensaje] of casos) {
    const s = servidorFalso(respuesta);
    const g = crearGuardado({ fetch: s.fetch, csrf: 'abc', id: '7', version: '2' });
    const r = await g.guardar({ nombre: 'x', receta: RECETA });
    assert.equal(r.tipo, tipo, String(respuesta.estado ?? respuesta));
    assert.match(r.mensaje, mensaje);
    assert.deepEqual(g.estado, { id: '7', version: 2 });
  }
});
