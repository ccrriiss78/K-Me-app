// Borrar varios o todos (D058, 24/11/2026): en «Mis avatares» y en «Mis sellos» se eligen con
// casillas los que se quieren borrar, o se borran todos. Siempre se pide confirmación con el número
// y los nombres, y borrar es definitivo (Q2). Solo se borra lo de la propia cuenta.
// El editor de Avatar Studio usa la versión JSON cuando se llega al límite de 20, para borrar sin
// salir de la página y sin perder el avatar que se está diseñando.
// Necesitan una base de datos real configurada en app/.env.local.
// Ejecutar desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { recetaPorDefecto } from '../src/services/avatarCatalogo.js';

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_a`, alias: `fan_${sufijo}_a` }; // dueña de lo que se borra
const B = { usuario: `test_${sufijo}_b`, alias: `fan_${sufijo}_b` }; // otra cuenta

function hayConfiguracion() {
  return ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'SESSION_SECRET']
    .every((k) => process.env[k] && !process.env[k].startsWith('CAMBIAR_POR'));
}

// Simula un navegador. «enviar» acepta un objeto o una lista de pares (para repetir «ids», como
// hacen las casillas de un formulario).
function navegador() {
  let cookie = '';
  async function pedir(ruta, { metodo = 'GET', datos, json, cabeceras = {} } = {}) {
    const tipo = json !== undefined ? { 'content-type': 'application/json' } : datos ? { 'content-type': 'application/x-www-form-urlencoded' } : {};
    const res = await fetch(base + ruta, {
      method: metodo,
      redirect: 'manual',
      headers: { cookie, ...tipo, ...cabeceras },
      body: json !== undefined ? JSON.stringify(json) : datos ? new URLSearchParams(datos).toString() : undefined,
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
  async function enviar(ruta, datos = {}) {
    const pares = Array.isArray(datos) ? datos : Object.entries(datos);
    return pedir(ruta, { metodo: 'POST', datos: [['_csrf', await tokenCsrf()], ...pares] });
  }
  return {
    pedir,
    enviar,
    api: async (ruta, json) => pedir(ruta, { metodo: 'POST', json: { _csrf: await tokenCsrf(), ...json }, cabeceras: { accept: 'application/json' } }),
  };
}

async function entrarComo(cuenta) {
  const nav = navegador();
  const r = await nav.enviar('/entrar', { usuario: cuenta.usuario, password });
  assert.equal(r.estado, 302, `entra ${cuenta.alias}`);
  return nav;
}

const receta = () => structuredClone(recetaPorDefecto());
const formularioSello = (nombre) => ({
  nombre, borde: 'negro', fondo: 'blanco', palabra: 'amor', color_palabra: 'fucsia', avatar: '', encuadre: 'rostro',
  mostrar_alias: 'si', color_alias: 'negro', motivo1: '', color_motivo1: 'negro', motivo2: '', color_motivo2: 'negro', motivo3: '', color_motivo3: 'negro',
});
async function crearAvatar(nav, nombre) {
  const r = await nav.api('/studio/avatares', { nombre, receta: receta() });
  assert.equal(r.estado, 201, `se crea ${nombre}`);
  return r.cuerpo.id;
}
async function crearSello(nav, nombre) {
  const r = await nav.enviar('/studio/sellos', formularioSello(nombre));
  assert.equal(r.estado, 302, `se crea ${nombre}`);
  return /^\/studio\/sellos\/(\d+)/.exec(r.destino)[1];
}
// Consultas fijas por tabla (los nombres de tabla no se pueden pasar como parámetro).
const SQL = {
  avatares: { cuantos: 'SELECT count(*) FROM avatares WHERE id_usuario = $1', existe: 'SELECT 1 FROM avatares WHERE id = $1' },
  sellos: { cuantos: 'SELECT count(*) FROM sellos WHERE id_usuario = $1', existe: 'SELECT 1 FROM sellos WHERE id = $1' },
};
const cuantos = async (tabla, idUsuario) => Number((await consulta(SQL[tabla].cuantos, [idUsuario])).rows[0].count);
const existe = async (tabla, id) => (await consulta(SQL[tabla].existe, [id])).rowCount === 1;
const ids = (lista) => lista.map((id) => ['ids', id]);
const casilla = (id) => new RegExp(`<input[^>]*type="checkbox"[^>]*name="ids"[^>]*value="${id}"[^>]*form="borrar-varios"`);
const idsOcultos = (html) => [...html.matchAll(/<input type="hidden" name="ids" value="(\d+)">/g)].map((m) => m[1]);

before(async () => {
  if (!hayConfiguracion()) return;
  const { crearApp } = await import('../src/app.js');
  ({ cerrarPool, consulta } = await import('../src/config/db.js'));
  const { crearCuenta } = await import('../src/services/authService.js');
  for (const cuenta of [A, B]) cuenta.id = (await crearCuenta({ ...cuenta, password })).id;
  const { app } = crearApp();
  await new Promise((ok) => { servidor = app.listen(0, '127.0.0.1', ok); });
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  if (!servidor) return;
  try {
    const usuarios = [A.usuario, B.usuario];
    await consulta(
      `DELETE FROM sesiones WHERE sess->>'usuarioId' IN (SELECT id::text FROM usuarios WHERE usuario = ANY($1))`,
      [usuarios],
    );
    await consulta('DELETE FROM usuarios WHERE usuario = ANY($1)', [usuarios]); // borra también sus avatares y sellos
  } finally {
    // Aunque la limpieza falle, se cierran el servidor y la conexión: si no, el proceso se queda colgado.
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

test('Borrar varios o todos los avatares y sellos, con confirmación y solo los propios', { skip: !hayConfiguracion() && 'Sin app/.env.local: prueba bloqueada, no fallida.' }, async (t) => {
  let navA, navB, a1, a2, a3, avatarB, s1, s2, s3, selloB;

  await t.test('1. sin sesión, borrar varios lleva a /entrar', async () => {
    const nav = navegador();
    for (const ruta of ['/studio/avatares/borrar', '/studio/sellos/borrar']) {
      const r = await nav.enviar(ruta, [['ids', '1'], ['confirmar', 'si']]);
      assert.equal(r.estado, 302, ruta);
      assert.equal(r.destino, '/entrar', ruta);
    }
  });

  await t.test('2. «Mis avatares» y «Mis sellos» ofrecen una casilla en cada uno, «Borrar los seleccionados» y «Borrar todos»', async () => {
    navA = await entrarComo(A);
    navB = await entrarComo(B);
    [a1, a2, a3] = [await crearAvatar(navA, 'Avatar uno'), await crearAvatar(navA, 'Avatar dos'), await crearAvatar(navA, 'Avatar tres')];
    avatarB = await crearAvatar(navB, 'Avatar de B');
    [s1, s2, s3] = [await crearSello(navA, 'Sello uno'), await crearSello(navA, 'Sello dos'), await crearSello(navA, 'Sello tres')];
    selloB = await crearSello(navB, 'Sello de B');

    for (const [ruta, lista] of [['/studio/avatares', [a1, a2, a3]], ['/studio/sellos', [s1, s2, s3]]]) {
      const r = await navA.pedir(ruta);
      assert.equal(r.estado, 200);
      assert.match(r.html, new RegExp(`<form[^>]*id="borrar-varios"[^>]*action="${ruta}/borrar"`), ruta);
      for (const id of lista) assert.match(r.html, casilla(id), `${ruta}: casilla de ${id}`);
      assert.match(r.html, /<button[^>]*>Borrar los seleccionados<\/button>/, ruta);
      assert.match(r.html, /<button[^>]*name="todos" value="si"[^>]*>Borrar todos<\/button>/, ruta);
    }
  });

  await t.test('3. «Borrar los seleccionados» pide confirmación con el número y los nombres, y todavía no borra nada', async () => {
    const r = await navA.enviar('/studio/avatares/borrar', ids([a1, a2]));
    assert.equal(r.estado, 200);
    assert.match(r.html, /Se borrarán para siempre <strong>2 avatares<\/strong>/);
    assert.match(r.html, /Avatar uno/);
    assert.match(r.html, /Avatar dos/);
    assert.doesNotMatch(r.html, /Avatar tres/, 'solo los elegidos');
    assert.match(r.html, /<button[^>]*>Sí, borrar 2 avatares<\/button>/);
    assert.deepEqual(idsOcultos(r.html).sort(), [a1, a2].sort());
    assert.equal(await cuantos('avatares', A.id), 3, 'todavía no se ha borrado ninguno');
  });

  await t.test('4. al confirmar, borra solo los elegidos y la lista lo dice', async () => {
    const r = await navA.enviar('/studio/avatares/borrar', [...ids([a1, a2]), ['confirmar', 'si']]);
    assert.equal(r.estado, 302);
    assert.equal(r.destino, '/studio/avatares?borrados=2');
    assert.equal(await existe('avatares', a1), false);
    assert.equal(await existe('avatares', a2), false);
    assert.equal(await existe('avatares', a3), true, 'el no elegido sigue');
    const lista = await navA.pedir(r.destino);
    assert.match(lista.html, /Se han borrado 2 avatares\./);
  });

  await t.test('5. sin elegir ninguno no se borra nada (400) y se explica', async () => {
    const r = await navA.enviar('/studio/avatares/borrar', [['confirmar', 'si']]);
    assert.equal(r.estado, 400);
    assert.match(r.html, /Elige al menos un avatar para borrar\./);
    assert.equal(await cuantos('avatares', A.id), 1);
  });

  await t.test('6. otra cuenta no puede borrar tus avatares ni tus sellos, ni ver sus nombres', async () => {
    const previo = await navB.enviar('/studio/avatares/borrar', ids([a3]));
    assert.equal(previo.estado, 400);
    assert.doesNotMatch(previo.html, /Avatar tres/, 'no ve el nombre');
    const avatar = await navB.enviar('/studio/avatares/borrar', [...ids([a3]), ['confirmar', 'si']]);
    assert.equal(avatar.estado, 400);
    assert.match(avatar.html, /Elige al menos un avatar para borrar\./);
    const sello = await navB.enviar('/studio/sellos/borrar', [...ids([s1]), ['confirmar', 'si']]);
    assert.equal(sello.estado, 400);
    assert.match(sello.html, /Elige al menos un sello para borrar\./);
    const json = await navB.api('/studio/avatares/borrar', { ids: [a3], confirmar: true });
    assert.equal(json.estado, 400);
    assert.equal(await existe('avatares', a3), true);
    assert.equal(await existe('sellos', s1), true);
    assert.equal(await cuantos('avatares', B.id), 1, 'B conserva los suyos');
  });

  await t.test('7. «Borrar todos» enseña todos para confirmar y, al confirmar, deja la lista vacía', async () => {
    await crearAvatar(navA, 'Avatar cuatro');
    const previo = await navA.enviar('/studio/avatares/borrar', [['todos', 'si']]);
    assert.equal(previo.estado, 200);
    assert.match(previo.html, /Se borrarán para siempre <strong>2 avatares<\/strong>/);
    assert.match(previo.html, /Avatar tres/);
    assert.match(previo.html, /Avatar cuatro/);
    assert.equal(await cuantos('avatares', A.id), 2, 'todavía no se ha borrado ninguno');
    const r = await navA.enviar('/studio/avatares/borrar', [...ids(idsOcultos(previo.html)), ['confirmar', 'si']]);
    assert.equal(r.destino, '/studio/avatares?borrados=2');
    assert.equal(await cuantos('avatares', A.id), 0);
    assert.equal(await existe('avatares', avatarB), true, 'los de otra cuenta siguen');
  });

  await t.test('8. con un solo elemento, el texto va en singular', async () => {
    const id = await crearAvatar(navA, 'Avatar solo');
    const previo = await navA.enviar('/studio/avatares/borrar', ids([id]));
    assert.match(previo.html, /Se borrarán para siempre <strong>1 avatar<\/strong>/);
    assert.match(previo.html, /<button[^>]*>Sí, borrar 1 avatar<\/button>/);
    const r = await navA.enviar('/studio/avatares/borrar', [...ids([id]), ['confirmar', 'si']]);
    assert.equal(r.destino, '/studio/avatares?borrados=1');
    assert.match((await navA.pedir(r.destino)).html, /Se ha borrado 1 avatar\./);
  });

  await t.test('9. en JSON (para el editor), borra con la confirmación y responde cuántos; sin ella, 400', async () => {
    const x = await crearAvatar(navA, 'Avatar x');
    const y = await crearAvatar(navA, 'Avatar y');
    const sin = await navA.api('/studio/avatares/borrar', { ids: [x, y] });
    assert.equal(sin.estado, 400);
    assert.deepEqual(sin.cuerpo, { error: 'Falta la confirmación.' });
    assert.equal(await cuantos('avatares', A.id), 2);
    const r = await navA.api('/studio/avatares/borrar', { ids: [x, y], confirmar: true });
    assert.equal(r.estado, 200);
    assert.deepEqual(r.cuerpo, { borrados: 2 });
    assert.equal(await cuantos('avatares', A.id), 0);
  });

  await t.test('10. sin el token CSRF no se borra nada (403)', async () => {
    const r = await navA.pedir('/studio/sellos/borrar', { metodo: 'POST', datos: [...ids([s1]), ['confirmar', 'si']] });
    assert.equal(r.estado, 403);
    assert.equal(await existe('sellos', s1), true);
  });

  await t.test('11. en «Mis sellos», lo mismo: confirmar los elegidos, borrar solo esos y, luego, todos', async () => {
    const previo = await navA.enviar('/studio/sellos/borrar', ids([s1, s2]));
    assert.equal(previo.estado, 200);
    assert.match(previo.html, /Se borrarán para siempre <strong>2 sellos<\/strong>/);
    assert.match(previo.html, /<button[^>]*>Sí, borrar 2 sellos<\/button>/);
    const r = await navA.enviar('/studio/sellos/borrar', [...ids([s1, s2]), ['confirmar', 'si']]);
    assert.equal(r.destino, '/studio/sellos?borrados=2');
    assert.match((await navA.pedir(r.destino)).html, /Se han borrado 2 sellos\./);
    assert.equal(await existe('sellos', s3), true);
    const todos = await navA.enviar('/studio/sellos/borrar', [['todos', 'si']]);
    assert.match(todos.html, /Se borrarán para siempre <strong>1 sello<\/strong>/);
    await navA.enviar('/studio/sellos/borrar', [...ids(idsOcultos(todos.html)), ['confirmar', 'si']]);
    assert.equal(await cuantos('sellos', A.id), 0);
    assert.equal(await existe('sellos', selloB), true, 'los de otra cuenta siguen');
  });
});
