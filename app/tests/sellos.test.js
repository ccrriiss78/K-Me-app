// Pruebas de Sello Studio (TECH_SPEC §2 y §4; decisiones de la autora del 22/11/2026, D041):
// - todo es privado (sesión) y cada formulario POST lleva el token CSRF;
// - un sello lleva una palabra en hangul comprobada, el avatar de la cuenta o las dos cosas, nunca
//   vacío; el alias público se muestra u oculta; no hay nombre personal ni otro texto libre;
// - se guarda como receta (composición) con ids del catálogo; el servidor rechaza lo que no está;
// - el significado y la lectura de la palabra salen como ayuda fuera del sello;
// - avisos si un color se distingue poco del fondo, sin impedir guardar;
// - guardar comprueba la versión: lo guardado en otro dispositivo no se sobrescribe en silencio;
// - máximo 20 sellos por cuenta (Q1); duplicar y borrar (definitivo, Q2);
// - otra cuenta no puede ver, guardar, duplicar ni borrar tu sello (404).
// Necesitan una base de datos real configurada en app/.env.local, con la migración 005 aplicada.
// Ejecutar desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { COLORES, MOTIVOS, ENCUADRES, MAX_SELLOS } from '../src/catalogos/sello.js';
import { PALABRAS_HANGUL } from '../src/catalogos/hangul.js';

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_a`, alias: `fan_${sufijo}_a` }; // dueña de los sellos
const B = { usuario: `test_${sufijo}_b`, alias: `fan_${sufijo}_b` }; // otra cuenta
const C = { usuario: `test_${sufijo}_c`, alias: `fan_${sufijo}_c` }; // para el límite de 20

function hayConfiguracion() {
  return ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'SESSION_SECRET']
    .every((k) => process.env[k] && !process.env[k].startsWith('CAMBIAR_POR'));
}

// Simula un navegador: guarda la cookie de sesión y la reenvía.
function navegador() {
  let cookie = '';
  async function pedir(ruta, { metodo = 'GET', datos, cabeceras = {} } = {}) {
    const res = await fetch(base + ruta, {
      method: metodo,
      redirect: 'manual',
      headers: { cookie, ...(datos ? { 'content-type': 'application/x-www-form-urlencoded' } : {}), ...cabeceras },
      body: datos ? new URLSearchParams(datos).toString() : undefined,
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    return { estado: res.status, destino: res.headers.get('location'), tipo: res.headers.get('content-type') ?? '', html: await res.text() };
  }
  async function tokenCsrf() {
    let r = await pedir('/entrar');
    if (r.estado === 302) r = await pedir('/mi-kme');
    return /name="_csrf" value="([a-f0-9]+)"/.exec(r.html)[1];
  }
  async function enviar(ruta, datos = {}) {
    return pedir(ruta, { metodo: 'POST', datos: { _csrf: await tokenCsrf(), ...datos } });
  }
  return { pedir, tokenCsrf, enviar };
}

async function entrarComo(cuenta) {
  const nav = navegador();
  const r = await nav.enviar('/entrar', { usuario: cuenta.usuario, password });
  assert.equal(r.estado, 302, `entra ${cuenta.alias}`);
  return nav;
}

// Los campos del formulario del editor, con valores válidos; cada test cambia lo que necesita.
// Para ocultar el alias, la casilla «mostrar_alias» no se envía (como hace el navegador).
const formulario = (cambios = {}) => {
  const datos = {
    nombre: 'Mi sello de prueba',
    borde: 'negro',
    fondo: 'blanco',
    palabra: 'amor',
    color_palabra: 'fucsia',
    avatar: '',
    encuadre: 'rostro',
    mostrar_alias: 'si',
    color_alias: 'negro',
    motivo1: 'corazon',
    color_motivo1: 'fucsia',
    motivo2: '',
    color_motivo2: 'negro',
    motivo3: '',
    color_motivo3: 'negro',
    ...cambios,
  };
  for (const [k, v] of Object.entries(datos)) if (v === undefined) delete datos[k];
  return datos;
};
const idDe = (destino) => Number(/^\/studio\/sellos\/(\d+)/.exec(destino ?? '')?.[1] ?? NaN);
const selloEnBd = async (id) => (await consulta('SELECT id_usuario, nombre, composicion, version FROM sellos WHERE id = $1', [id])).rows[0];
const sellosDe = async (idUsuario) => Number((await consulta('SELECT count(*) FROM sellos WHERE id_usuario = $1', [idUsuario])).rows[0].count);
const versionEn = (html) => /name="version" value="(\d+)"/.exec(html)?.[1];
const dibujoEn = (html) => /<svg[^>]*class="sello[^"]*"[\s\S]*?<\/svg>/.exec(html)?.[0] ?? '';

before(async () => {
  if (!hayConfiguracion()) return;
  const { crearApp } = await import('../src/app.js');
  ({ cerrarPool, consulta } = await import('../src/config/db.js'));
  const { crearCuenta } = await import('../src/services/authService.js');
  for (const cuenta of [A, B, C]) cuenta.id = (await crearCuenta({ ...cuenta, password })).id;
  const { app } = crearApp();
  await new Promise((ok) => { servidor = app.listen(0, '127.0.0.1', ok); });
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  if (!servidor) return;
  try {
    const usuarios = [A.usuario, B.usuario, C.usuario];
    await consulta(
      `DELETE FROM sesiones WHERE sess->>'usuarioId' IN (SELECT id::text FROM usuarios WHERE usuario = ANY($1))`,
      [usuarios],
    );
    await consulta('DELETE FROM usuarios WHERE usuario = ANY($1)', [usuarios]); // borra también sus sellos
  } finally {
    // Aunque la limpieza falle, se cierran el servidor y la conexión: si no, el proceso se queda colgado.
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

test('Sello Studio: crear, guardar, duplicar y borrar sellos', { skip: !hayConfiguracion() && 'Sin app/.env.local: prueba bloqueada, no fallida.' }, async (t) => {
  let navA, navB, idSello;

  await t.test('1. sin sesión, Sello Studio lleva a /entrar y no se puede crear un sello', async () => {
    const nav = navegador();
    for (const ruta of ['/studio/sellos', '/studio/sellos/nuevo', '/studio/sellos/vista-previa']) {
      const r = await nav.pedir(ruta);
      assert.equal(r.estado, 302, ruta);
      assert.equal(r.destino, '/entrar', ruta);
    }
    const p = await nav.enviar('/studio/sellos', formulario());
    assert.equal(p.estado, 302);
    assert.equal(p.destino, '/entrar');
  });

  await t.test('2. con sesión, el menú enlaza a Sello Studio y «Mis sellos» vacío invita a crear uno', async () => {
    navA = await entrarComo(A);
    navB = await entrarComo(B);
    const mi = await navA.pedir('/mi-kme');
    assert.match(mi.html, /<a[^>]*href="\/studio\/sellos"/, 'enlace en el menú');
    const r = await navA.pedir('/studio/sellos');
    assert.equal(r.estado, 200);
    assert.match(r.html, /Todavía no tienes sellos/);
    assert.match(r.html, /<a[^>]*href="\/studio\/sellos\/nuevo"/);
  });

  await t.test('3. el editor ofrece las palabras comprobadas (con lectura y significado fuera del sello), los adornos, los colores y los dos encuadres; sin nombre personal', async () => {
    const r = await navA.pedir('/studio/sellos/nuevo');
    assert.equal(r.estado, 200);
    assert.match(r.html, /<form[^>]*method="post"[^>]*action="\/studio\/sellos"/);
    for (const p of PALABRAS_HANGUL) {
      assert.match(r.html, new RegExp(`<option[^>]*value="${p.id}"[^>]*>${p.hangul} · ${p.lectura} · `), `palabra «${p.id}»`);
    }
    for (const m of MOTIVOS) assert.match(r.html, new RegExp(`<option[^>]*value="${m.id}"`), `adorno «${m.id}»`);
    assert.equal(COLORES.length, 35, 'los 3 del logo, 9 vivos (D046) y los 23 de la ropa del editor');
    for (const c of COLORES) assert.match(r.html, new RegExp(`<input[^>]*name="borde"[^>]*value="${c.id}"`), `color «${c.id}»`);
    for (const e of ENCUADRES) assert.match(r.html, new RegExp(`<input[^>]*name="encuadre"[^>]*value="${e.id}"`), `encuadre «${e.id}»`);
    assert.match(r.html, /<input[^>]*type="checkbox"[^>]*name="mostrar_alias"[^>]*value="si"/);
    assert.match(r.html, /Todavía no tienes avatares guardados/, 'explica que aún no hay avatares para elegir');
    assert.doesNotMatch(r.html, /name="nombre_personal"/, 'no hay campo de nombre personal');
    const dibujo = dibujoEn(r.html);
    assert.ok(dibujo, 'vista previa del sello');
    assert.ok(dibujo.includes(A.alias), 'el alias aparece en la vista previa');
    assert.ok(!r.html.includes(A.usuario), 'el usuario privado nunca aparece');
  });

  await t.test('4. crear un sello válido lo guarda como receta con ids del catálogo, versión 1 y de su dueña', async () => {
    const r = await navA.enviar('/studio/sellos', formulario({ motivo2: 'corona', color_motivo2: 'azul-cielo' }));
    assert.equal(r.estado, 302);
    idSello = idDe(r.destino);
    assert.ok(idSello > 0, `lleva al sello creado: ${r.destino}`);
    const fila = await selloEnBd(idSello);
    assert.equal(String(fila.id_usuario), String(A.id)); // pg devuelve los BIGINT como texto
    assert.equal(fila.nombre, 'Mi sello de prueba');
    assert.equal(fila.version, 1);
    assert.deepEqual(fila.composicion, {
      borde: 'negro',
      fondo: 'blanco',
      palabra: { id: 'amor', color: 'fucsia' },
      avatar: null,
      alias: { visible: true, color: 'negro' },
      motivos: [{ id: 'corazon', color: 'fucsia' }, { id: 'corona', color: 'azul-cielo' }],
      distribucion: 'automatica',
    });
  });

  await t.test('5. al volver a abrirlo se recupera su diseño, con la palabra, su lectura y su significado como ayuda', async () => {
    const r = await navA.pedir(`/studio/sellos/${idSello}`);
    assert.equal(r.estado, 200);
    assert.ok(dibujoEn(r.html).includes('사랑'), 'el hangul en el sello');
    assert.match(r.html, /sarang/, 'la lectura, fuera del sello');
    assert.ok(!dibujoEn(r.html).includes('sarang'), 'la lectura no va dentro del sello');
    assert.match(r.html, /<option[^>]*value="amor"[^>]*selected/, 'palabra elegida');
    assert.match(r.html, /<input[^>]*name="fondo"[^>]*value="blanco"[^>]*checked/, 'fondo elegido');
    assert.match(r.html, /<input[^>]*name="color_motivo2"[^>]*value="azul-cielo"[^>]*checked/, 'color del segundo adorno');
    assert.match(r.html, /<input[^>]*name="mostrar_alias"[^>]*checked/, 'alias visible');
    assert.equal(versionEn(r.html), '1');
  });

  await t.test('6. con el alias oculto, el sello no lo muestra y al abrirlo la casilla sale sin marcar', async () => {
    const r = await navA.enviar('/studio/sellos', formulario({ mostrar_alias: undefined, nombre: 'Sin alias' }));
    assert.equal(r.estado, 302);
    const fila = await selloEnBd(idDe(r.destino));
    assert.deepEqual(fila.composicion.alias, { visible: false, color: 'negro' });
    const abierto = await navA.pedir(r.destino);
    assert.ok(!dibujoEn(abierto.html).includes(A.alias), 'el alias no está en el sello');
    assert.doesNotMatch(abierto.html, /<input[^>]*name="mostrar_alias"[^>]*checked/);
  });

  await t.test('7. «Mis sellos» lista los sellos, con su nombre escapado y su miniatura', async () => {
    const otro = await navA.enviar('/studio/sellos', formulario({ nombre: '<b>Hola</b>' }));
    assert.equal(otro.estado, 302);
    const r = await navA.pedir('/studio/sellos');
    assert.match(r.html, new RegExp(`href="/studio/sellos/${idSello}"`));
    assert.ok(r.html.includes('&lt;b&gt;Hola&lt;/b&gt;'), 'el nombre se pinta escapado');
    assert.ok(!r.html.includes('<b>Hola</b>'), 'nunca como código');
    assert.match(r.html, /<svg[^>]*class="sello/, 'miniatura');
  });

  await t.test('8. un sello sin palabra ni avatar no se guarda (400) y el editor conserva lo elegido', async () => {
    const antes = await sellosDe(A.id);
    const r = await navA.enviar('/studio/sellos', formulario({ palabra: '', fondo: 'lavanda' }));
    assert.equal(r.estado, 400);
    assert.match(r.html, /El sello necesita una palabra o un avatar\./);
    assert.match(r.html, /<input[^>]*name="fondo"[^>]*value="lavanda"[^>]*checked/, 'conserva el fondo elegido');
    assert.equal(await sellosDe(A.id), antes);
  });

  await t.test('9. sin avatares guardados, elegir un avatar se rechaza (400): nunca se usa uno de muestra', async () => {
    const antes = await sellosDe(A.id);
    for (const avatar of ['1', 'actual', 'muestra']) {
      const r = await navA.enviar('/studio/sellos', formulario({ avatar, palabra: '' }));
      assert.equal(r.estado, 400, avatar);
      assert.match(r.html, /Esa opción no existe\./);
    }
    assert.equal(await sellosDe(A.id), antes);
  });

  await t.test('10. una opción que no está en el catálogo se rechaza (400) y no se guarda nada', async () => {
    const antes = await sellosDe(A.id);
    const malos = [
      { borde: 'morado-inventado' }, { fondo: '#ff0000' }, { palabra: 'no-existe' }, { motivo1: 'calavera' },
      { color_motivo1: 'oro' }, { color_palabra: '' }, { color_alias: 'plata' },
    ];
    for (const cambio of malos) {
      const r = await navA.enviar('/studio/sellos', formulario(cambio));
      assert.equal(r.estado, 400, JSON.stringify(cambio));
      assert.match(r.html, /Esa opción no existe\./, JSON.stringify(cambio));
    }
    assert.equal(await sellosDe(A.id), antes);
  });

  await t.test('11. el texto libre que llegue se ignora: nunca entra en el sello', async () => {
    const r = await navA.enviar('/studio/sellos', formulario({ nombre_personal: 'Cris', texto: 'Hola mundo' }));
    assert.equal(r.estado, 302);
    const fila = await selloEnBd(idDe(r.destino));
    assert.ok(!JSON.stringify(fila.composicion).match(/Cris|Hola mundo/));
    const abierto = await navA.pedir(r.destino);
    assert.ok(!dibujoEn(abierto.html).match(/Cris|Hola mundo/));
  });

  await t.test('12. el nombre del sello es obligatorio y de 1 a 40 caracteres (400)', async () => {
    for (const malo of ['', '   ', 'x'.repeat(41)]) {
      const r = await navA.enviar('/studio/sellos', formulario({ nombre: malo }));
      assert.equal(r.estado, 400, `«${malo}»`);
      assert.match(r.html, /Ponle al sello un nombre de 1 a 40 caracteres\./);
    }
  });

  await t.test('13. «Ver cómo queda» enseña el sello con lo elegido sin guardarlo', async () => {
    const antes = await sellosDe(A.id);
    const r = await navA.enviar('/studio/sellos', formulario({ accion: 'vista', palabra: 'luz' }));
    assert.equal(r.estado, 200);
    assert.ok(dibujoEn(r.html).includes('빛'));
    assert.match(r.html, /<option[^>]*value="luz"[^>]*selected/);
    assert.equal(await sellosDe(A.id), antes);
  });

  await t.test('14. avisa si un color se distingue poco del fondo, pero deja guardar', async () => {
    const datos = formulario({ color_palabra: 'blanco-calido', accion: 'vista' });
    const vista = await navA.enviar('/studio/sellos', datos);
    assert.match(vista.html, /La palabra se distingue poco del fondo\./);
    const guardado = await navA.enviar('/studio/sellos', { ...datos, accion: 'guardar' });
    assert.equal(guardado.estado, 302);
  });

  await t.test('15. guardar con la versión abierta sube la versión; con una antigua no sobrescribe (409) y ofrece guardar como copia', async () => {
    const ok = await navA.enviar(`/studio/sellos/${idSello}`, formulario({ version: '1', fondo: 'rosa-pastel', nombre: 'Sello rosa' }));
    assert.equal(ok.estado, 302);
    assert.equal(idDe(ok.destino), idSello);
    let fila = await selloEnBd(idSello);
    assert.equal(fila.version, 2);
    assert.equal(fila.composicion.fondo, 'rosa-pastel');
    assert.equal(fila.nombre, 'Sello rosa');

    const viejo = await navA.enviar(`/studio/sellos/${idSello}`, formulario({ version: '1', fondo: 'menta' }));
    assert.equal(viejo.estado, 409);
    assert.match(viejo.html, /Este sello ha cambiado en otro dispositivo/);
    assert.match(viejo.html, /<button[^>]*formaction="\/studio\/sellos"[^>]*>[^<]*Guardar como copia/);
    assert.match(viejo.html, /<input[^>]*name="fondo"[^>]*value="menta"[^>]*checked/, 'conserva los cambios sin guardar');
    fila = await selloEnBd(idSello);
    assert.equal(fila.version, 2, 'no se ha sobrescrito');
    assert.equal(fila.composicion.fondo, 'rosa-pastel');
  });

  await t.test('16. duplicar crea «Copia de …» con la misma receta', async () => {
    const r = await navA.enviar(`/studio/sellos/${idSello}/duplicar`);
    assert.equal(r.estado, 302);
    const idCopia = idDe(r.destino);
    assert.ok(idCopia > 0 && idCopia !== idSello);
    const [original, copia] = [await selloEnBd(idSello), await selloEnBd(idCopia)];
    assert.equal(copia.nombre, 'Copia de Sello rosa');
    assert.deepEqual(copia.composicion, original.composicion);
    assert.equal(copia.version, 1);
  });

  await t.test('17. otra cuenta no puede ver, guardar, duplicar ni borrar el sello (404) ni lo ve en su lista', async () => {
    const ver = await navB.pedir(`/studio/sellos/${idSello}`);
    assert.equal(ver.estado, 404);
    assert.match(ver.html, /Ese sello no existe\./);
    const guardar = await navB.enviar(`/studio/sellos/${idSello}`, formulario({ version: '2', fondo: 'menta' }));
    assert.equal(guardar.estado, 404);
    const duplicar = await navB.enviar(`/studio/sellos/${idSello}/duplicar`);
    assert.equal(duplicar.estado, 404);
    const borrar = await navB.enviar(`/studio/sellos/${idSello}/eliminar`);
    assert.equal(borrar.estado, 404);
    const fila = await selloEnBd(idSello);
    assert.ok(fila, 'sigue existiendo');
    assert.equal(fila.composicion.fondo, 'rosa-pastel', 'sin cambios');
    assert.equal(await sellosDe(B.id), 0, 'B no tiene copias');
    const lista = await navB.pedir('/studio/sellos');
    assert.ok(!lista.html.includes(`/studio/sellos/${idSello}"`), 'no aparece en la lista de B');
  });

  await t.test('18. con 20 sellos no se puede crear ni duplicar otro (409)', async () => {
    const navC = await entrarComo(C);
    const primero = await navC.enviar('/studio/sellos', formulario());
    assert.equal(primero.estado, 302);
    const idPrimero = idDe(primero.destino);
    const { composicion } = await selloEnBd(idPrimero);
    for (let i = 1; i < MAX_SELLOS; i++) {
      await consulta('INSERT INTO sellos (id_usuario, nombre, composicion) VALUES ($1, $2, $3)', [C.id, `Relleno ${i}`, composicion]);
    }
    assert.equal(await sellosDe(C.id), MAX_SELLOS);
    const crear = await navC.enviar('/studio/sellos', formulario());
    assert.equal(crear.estado, 409);
    assert.match(crear.html, /Ya tienes 20 sellos, el máximo\. Borra uno para crear otro\./);
    const duplicar = await navC.enviar(`/studio/sellos/${idPrimero}/duplicar`);
    assert.equal(duplicar.estado, 409);
    assert.equal(await sellosDe(C.id), MAX_SELLOS);
  });

  await t.test('19. la vista previa (para el JavaScript del editor) dibuja el sello con lo elegido, sin guardar nada', async () => {
    const antes = await sellosDe(A.id);
    const r = await navA.pedir('/studio/sellos/vista-previa?' + new URLSearchParams(formulario({ palabra: 'luz' })));
    assert.equal(r.estado, 200);
    assert.match(r.html, /<svg[^>]*class="sello"/);
    assert.ok(r.html.includes('빛'));
    for (const malo of [{ borde: 'inventado' }, { palabra: '' }]) {
      const mala = await navA.pedir('/studio/sellos/vista-previa?' + new URLSearchParams(formulario(malo)));
      assert.equal(mala.estado, 400, JSON.stringify(malo));
    }
    assert.equal(await sellosDe(A.id), antes);
  });

  await t.test('19b. si el script del editor pide JSON, la vista previa responde { svg, avisos, ayuda }, y { error } con 400', async () => {
    const json = { cabeceras: { accept: 'application/json' } };
    const previa = (cambios) => navA.pedir('/studio/sellos/vista-previa?' + new URLSearchParams(formulario(cambios)), json);
    const r = await previa({ palabra: 'luz', color_palabra: 'blanco-calido' });
    assert.equal(r.estado, 200);
    assert.match(r.tipo, /application\/json/);
    const cuerpo = JSON.parse(r.html);
    assert.match(cuerpo.svg, /^<svg[^>]*class="sello[^"]*"/);
    assert.ok(cuerpo.svg.includes('빛'));
    assert.deepEqual(cuerpo.avisos, ['La palabra se distingue poco del fondo.']);
    assert.deepEqual(cuerpo.ayuda, { hangul: '빛', lectura: 'bit', significado: 'luz' });
    for (const [cambio, mensaje] of [[{ palabra: '' }, 'El sello necesita una palabra o un avatar.'], [{ borde: 'inventado' }, 'Esa opción no existe.']]) {
      const mala = await previa(cambio);
      assert.equal(mala.estado, 400, JSON.stringify(cambio));
      assert.deepEqual(JSON.parse(mala.html), { error: mensaje });
    }
  });

  await t.test('20. sin el token CSRF no se crea el sello (403)', async () => {
    const antes = await sellosDe(A.id);
    const r = await navA.pedir('/studio/sellos', { metodo: 'POST', datos: formulario() });
    assert.equal(r.estado, 403);
    assert.equal(await sellosDe(A.id), antes);
  });

  await t.test('21. borrar el propio sello es definitivo', async () => {
    const r = await navA.enviar(`/studio/sellos/${idSello}/eliminar`);
    assert.equal(r.estado, 302);
    assert.equal(r.destino, '/studio/sellos?eliminado=1');
    assert.equal(await selloEnBd(idSello), undefined);
    const otra = await navA.pedir(`/studio/sellos/${idSello}`);
    assert.equal(otra.estado, 404);
  });
});
