// Pruebas de «Mi escenario»: HANGUL LIVE 001, los Kpopis y «Mis tesoros» (D062–D064, T042; E0073).
// - La miniclase enseña primero 3 expresiones (hangul, lectura, traducción y su fuente) y después
//   hace 3 preguntas, con las opciones solo en hangul y lectura.
// - Tras cada respuesta, acierte o falle, la traducción y para qué sirve. Si falla, prueba otra vez:
//   cada pregunta se repite hasta acertar (regla a, aprobada por la autora en E0073).
// - Se completa al acertar las 3. La primera vez da 20 Kpopis y «Luz Hangul 001»; repetirla no da
//   nada más: nunca se cobra dos veces, ni con dos respuestas a la vez.
// - El progreso, el saldo y los tesoros son de cada cuenta: otra cuenta no los ve.
// - Solo el servidor decide si se acierta y cuánto se gana.
// Necesitan una base de datos real configurada en app/.env.local, con la migración 009 aplicada.
// Ejecutar desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { RETOS, buscarReto } from '../src/catalogos/hangul-live.js';
import { KPOPI, TESOROS, textoKpopis, buscarTesoro } from '../src/catalogos/recompensas.js';

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_a`, alias: `fan_${sufijo}_a` }; // hace la miniclase entera
const B = { usuario: `test_${sufijo}_b`, alias: `fan_${sufijo}_b` }; // otra cuenta
const C = { usuario: `test_${sufijo}_c`, alias: `fan_${sufijo}_c` }; // dos respuestas a la vez

const RUTA = '/escenario/hangul-live-001';
const pregunta = (n) => `${RUTA}/preguntas/${n}`;
const publico = (ruta) => fileURLToPath(new URL(`../public${ruta}`, import.meta.url));
// La fecha como la enseña la app (día/mes/año, hora de Madrid).
const hoy = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Madrid' }).format(new Date());

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
    let r = await pedir('/entrar');
    if (r.estado === 302) r = await pedir('/mi-kme');
    return /name="_csrf" value="([a-f0-9]+)"/.exec(r.html)[1];
  }
  return {
    pedir,
    enviar: async (ruta, datos = {}) => pedir(ruta, { metodo: 'POST', datos: { _csrf: await tokenCsrf(), ...datos } }),
  };
}

async function entrarComo(cuenta) {
  const nav = navegador();
  const r = await nav.enviar('/entrar', { usuario: cuenta.usuario, password });
  assert.equal(r.estado, 302, `entra ${cuenta.alias}`);
  return nav;
}

const responder = (nav, n, respuesta, extra = {}) => nav.enviar(pregunta(n), { respuesta, ...extra });

// El texto que se lee en la página, sin etiquetas, con los espacios juntos.
const texto = (html) => html
  .replace(/<(script|style)[\s\S]*?<\/\1>/g, '')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&#34;|&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ');
const seccion = (html, id) => new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`).exec(html)?.[0] ?? '';
const cabecera = (html) => /<header class="cabecera"[\s\S]*?<\/header>/.exec(html)?.[0] ?? '';
const formularioPregunta = (html) => /<form[^>]*class="pregunta"[\s\S]*?<\/form>/.exec(html)?.[0] ?? '';

// Lo que hay guardado en la base de datos para una cuenta.
const saldo = async (id) => (await consulta(
  'SELECT COALESCE(SUM(cantidad), 0)::int AS n FROM kpopis_movimientos WHERE id_usuario = $1', [id],
)).rows[0].n;
const cuantosMovimientos = async (id) => (await consulta(
  'SELECT count(*)::int AS n FROM kpopis_movimientos WHERE id_usuario = $1', [id],
)).rows[0].n;
const tesoros = async (id) => (await consulta(
  'SELECT id_tesoro FROM tesoros_usuario WHERE id_usuario = $1 ORDER BY id_tesoro', [id],
)).rows.map((f) => f.id_tesoro);
const aciertos = async (id) => (await consulta(
  "SELECT aciertos FROM retos_progreso WHERE id_usuario = $1 AND id_reto = 'hangul-live-001'", [id],
)).rows[0]?.aciertos ?? [];

const COMPLETADO = '¡HANGUL LIVE 001 completado! Has ganado 20 Kpopis y Luz Hangul 001, que ya está en Mis tesoros.';

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
    await consulta('DELETE FROM usuarios WHERE usuario = ANY($1)', [usuarios]); // borra también su progreso, Kpopis y tesoros
  } finally {
    // Aunque la limpieza falle, se cierran el servidor y la conexión: si no, el proceso se queda colgado.
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

// --- Catálogos (sin base de datos) ---

test('HANGUL LIVE 001 enseña solo las 3 expresiones aprobadas, con lectura, traducción, para qué sirve y su fuente del NIKL (D062)', () => {
  assert.equal(RETOS.length, 1, 'de momento, un solo reto');
  const reto = buscarReto('hangul-live-001');
  assert.equal(reto.titulo, 'HANGUL LIVE 001');
  assert.equal(reto.lema, 'Tu voz. Nuestra luz');
  assert.deepEqual(reto.expresiones.map((e) => e.hangul), ['안녕하세요', '고마워요', '파이팅']);
  assert.deepEqual(reto.expresiones.map((e) => e.lectura), ['annyeonghaseyo', 'gomawoyo', 'paiting']);
  assert.deepEqual(reto.expresiones.map((e) => e.fuente.entrada), ['안녕하다', '고맙다', '파이팅']);
  for (const e of reto.expresiones) {
    assert.ok(e.fuente.enlace.startsWith('https://krdict.korean.go.kr/'), `${e.id}: la fuente no es del NIKL`);
    for (const campo of ['traduccion', 'explicacion', 'significado', 'sirvePara']) assert.ok(e[campo], `${e.id}: falta ${campo}`);
  }
  // Las dos formas educadas, sin entrada propia, van marcadas para que las revise alguien que hable coreano.
  assert.deepEqual(reto.expresiones.map((e) => e.pendienteDeRevision), [true, true, false]);
  assert.equal(buscarReto('hangul-live-999'), null);
});

test('Las 3 preguntas ofrecen las 3 expresiones en distinto orden, y la respuesta cambia de sitio en cada una', () => {
  const reto = buscarReto('hangul-live-001');
  const ids = reto.expresiones.map((e) => e.id).sort();
  assert.deepEqual(reto.preguntas.map((p) => p.numero), [1, 2, 3]);
  for (const p of reto.preguntas) {
    assert.deepEqual([...p.opciones].sort(), ids, `pregunta ${p.numero}: no ofrece las 3 expresiones`);
    assert.ok(p.opciones.includes(p.respuesta), `pregunta ${p.numero}: la respuesta no es una opción`);
    assert.ok(p.toca && p.bien && p.texto, `pregunta ${p.numero}: le falta texto`);
  }
  assert.equal(new Set(reto.preguntas.map((p) => p.respuesta)).size, 3, 'cada pregunta tiene una respuesta distinta');
  assert.equal(new Set(reto.preguntas.map((p) => p.opciones.indexOf(p.respuesta))).size, 3, 'la respuesta cambia de sitio');
});

test('La recompensa es 20 Kpopis y Luz Hangul 001, con su dibujo; el Kpopi tiene icono propio y singular y plural (D063, D064)', () => {
  assert.deepEqual(buscarReto('hangul-live-001').recompensa, { kpopis: 20, tesoro: 'luz-hangul-001' });
  assert.equal(TESOROS.length, 1);
  const luz = buscarTesoro('luz-hangul-001');
  assert.equal(luz.nombre, 'Luz Hangul 001');
  assert.ok(existsSync(publico(luz.imagen)), 'falta el dibujo de Luz Hangul 001');
  assert.ok(existsSync(publico(KPOPI.icono)), 'falta el icono del Kpopi');
  assert.equal(textoKpopis(1), '1 Kpopi');
  assert.equal(textoKpopis(0), '0 Kpopis');
  assert.equal(textoKpopis(20), '20 Kpopis');
  assert.equal(buscarTesoro('no-existe'), null);
});

// --- Con la base de datos ---

test('Mi escenario: HANGUL LIVE 001, Kpopis y Mis tesoros', { skip: !hayConfiguracion() && 'falta app/.env.local' }, async (t) => {
  const navA = await entrarComo(A);
  const navB = await entrarComo(B);
  const navC = await entrarComo(C);

  await t.test('sin sesión, Mi escenario y la miniclase llevan a «Entrar» y responder no cuenta', async () => {
    const anonimo = navegador();
    for (const ruta of ['/escenario', RUTA, pregunta(1)]) {
      const r = await anonimo.pedir(ruta);
      assert.equal(r.estado, 302, ruta);
      assert.equal(r.destino, '/entrar', ruta);
    }
    const r = await anonimo.pedir(pregunta(1), { metodo: 'POST', datos: { respuesta: 'annyeonghaseyo' } });
    assert.equal(r.estado, 302);
    assert.equal(r.destino, '/entrar');
  });

  await t.test('el menú lleva a «Mi escenario», que presenta solo HANGUL LIVE 001, sin empezar y con su recompensa; la cabecera enseña 0 Kpopis', async () => {
    const r = await navB.pedir('/escenario');
    assert.equal(r.estado, 200);
    assert.match(r.html, /<a href="\/escenario" aria-current="page">Mi escenario<\/a>/);
    assert.equal((r.html.match(/data-reto="/g) ?? []).length, 1, 'un solo reto: nada de pantallas que aparentan funcionar');
    const leido = texto(r.html);
    for (const frase of ['HANGUL LIVE 001', 'Tu voz. Nuestra luz', 'Sin empezar', '20 Kpopis', 'Luz Hangul 001']) {
      assert.ok(leido.includes(frase), `falta «${frase}»`);
    }
    assert.match(r.html, new RegExp(`href="${RUTA}"`));
    // El saldo, en la cabecera, con el icono del Kpopi y un enlace a «Mis Kpopis».
    const cab = cabecera(r.html);
    assert.match(cab, /class="saldo-kpopis"[^>]*href="\/mi-kme#mis-kpopis"|href="\/mi-kme#mis-kpopis"[^>]*class="saldo-kpopis"/);
    assert.match(cab, /src="\/img\/kpopi\.svg"/);
    assert.ok(texto(cab).includes('0 Kpopis'), 'la cabecera no dice «0 Kpopis»');
    // En las demás páginas, «Mi escenario» está en el menú, sin marcar.
    const mi = await navB.pedir('/mi-kme');
    assert.match(mi.html, /<a href="\/escenario">Mi escenario<\/a>/);
  });

  await t.test('la miniclase enseña primero las 3 expresiones con lectura, traducción y fuente, avisa de la revisión pendiente y lleva a la primera pregunta', async () => {
    const r = await navA.pedir(RUTA);
    assert.equal(r.estado, 200);
    const reto = buscarReto('hangul-live-001');
    const leido = texto(r.html);
    for (const frase of ['HANGUL LIVE 001', 'Tu voz. Nuestra luz', reto.entrada, reto.aviso]) {
      assert.ok(leido.includes(frase), `falta «${frase}»`);
    }
    for (const e of reto.expresiones) {
      assert.match(r.html, new RegExp(`lang="ko"[^>]*>${e.hangul}<`), `${e.hangul} sin lang="ko"`);
      for (const frase of [e.lectura, e.traduccion, e.explicacion, e.fuente.entrada]) {
        assert.ok(leido.includes(frase), `${e.id}: falta «${frase}»`);
      }
      assert.ok(r.html.includes(`href="${e.fuente.enlace.replaceAll('&', '&amp;')}"`), `${e.id}: falta el enlace al diccionario`);
    }
    assert.match(r.html, new RegExp(`<a[^>]*href="${pregunta(1)}"[^>]*>Empezar las preguntas</a>`));
  });

  await t.test('cada pregunta ofrece las 3 expresiones en hangul con su lectura, sin regalar la traducción', async () => {
    const r = await navA.pedir(pregunta(1));
    assert.equal(r.estado, 200);
    const leido = texto(r.html);
    assert.ok(leido.includes('Pregunta 1 de 3'));
    assert.ok(leido.includes('En la fila del concierto quieres saludar a alguien que no conoces. ¿Qué le dices?'));
    const form = formularioPregunta(r.html);
    assert.match(form, new RegExp(`action="${pregunta(1)}"`));
    assert.match(form, /name="_csrf"/);
    for (const [hangul, lectura] of [['파이팅', 'paiting'], ['안녕하세요', 'annyeonghaseyo'], ['고마워요', 'gomawoyo']]) {
      assert.match(form, new RegExp(`<input type="radio" name="respuesta" value="${lectura}"`), `falta la opción ${lectura}`);
      assert.match(form, new RegExp(`lang="ko"[^>]*>${hangul}<`));
      assert.ok(texto(form).includes(lectura));
    }
    assert.doesNotMatch(texto(form), /hola|gracias|ánimo/i, 'las opciones no llevan la traducción');
  });

  await t.test('si fallas, ves qué significa lo que elegiste, para qué sirve y qué tocaba, y vuelves a probar; no cuenta ni da Kpopis', async () => {
    const r = await responder(navA, 1, 'paiting');
    assert.equal(r.estado, 200);
    assert.ok(texto(r.html).includes('파이팅 (paiting) = «¡ánimo!»: sirve para dar ánimos. Aquí toca saludar. Prueba otra vez.'));
    assert.match(formularioPregunta(r.html), /name="respuesta"/, 'la pregunta sigue ahí para volver a probar');
    assert.deepEqual(await aciertos(A.id), []);
    assert.equal(await saldo(A.id), 0);
  });

  await t.test('si aciertas, ves la traducción y por qué, y el enlace a la siguiente pregunta; el acierto se guarda en tu cuenta', async () => {
    const r = await responder(navA, 1, 'annyeonghaseyo');
    assert.equal(r.estado, 200);
    const leido = texto(r.html);
    // La traducción va entre comillas, como en las tarjetas de la miniclase (la autora, E0073).
    assert.ok(leido.includes('¡Bien! 안녕하세요 (annyeonghaseyo) = «hola». Es el saludo educado, perfecto para alguien que no conoces.'));
    assert.match(r.html, new RegExp(`<a[^>]*href="${pregunta(2)}"[^>]*>Siguiente pregunta</a>`));
    assert.equal(formularioPregunta(r.html), '', 'acertada, ya no se vuelve a preguntar');
    assert.deepEqual(await aciertos(A.id), [1]);
    assert.equal(await saldo(A.id), 0);
    // La miniclase y Mi escenario enseñan el progreso.
    const miniclase = await navA.pedir(RUTA);
    assert.match(miniclase.html, new RegExp(`<a[^>]*href="${pregunta(2)}"[^>]*>Seguir con las preguntas</a>`));
    assert.ok(texto((await navA.pedir('/escenario')).html).includes('En curso: 1 de 3'));
  });

  await t.test('acertar dos veces la misma pregunta no cuenta doble; saltarse una no completa la miniclase', async () => {
    await responder(navA, 1, 'annyeonghaseyo');
    assert.deepEqual(await aciertos(A.id), [1]);
    const r = await responder(navA, 3, 'paiting');
    assert.equal(r.estado, 200);
    assert.ok(texto(r.html).includes('¡Bien! 파이팅 (paiting) = «¡ánimo!». Así le das fuerza a tu idol.'));
    assert.ok(!texto(r.html).includes('completado'), 'falta la pregunta 2: no está completada');
    // La siguiente es la que falta, la 2.
    assert.match(r.html, new RegExp(`<a[^>]*href="${pregunta(2)}"[^>]*>Siguiente pregunta</a>`));
    assert.deepEqual(await aciertos(A.id), [1, 3]);
    assert.equal(await saldo(A.id), 0);
  });

  await t.test('al acertar las 3, aunque fallaras antes, se completa: la primera vez da 20 Kpopis y Luz Hangul 001, que salen en la cabecera y en Mi K-ME', async () => {
    const fallo = await responder(navA, 2, 'paiting');
    assert.ok(texto(fallo.html).includes('파이팅 (paiting) = «¡ánimo!»: sirve para dar ánimos. Aquí toca dar las gracias. Prueba otra vez.'));
    const r = await responder(navA, 2, 'gomawoyo');
    assert.equal(r.estado, 200);
    const leido = texto(r.html);
    assert.ok(leido.includes('¡Bien! 고마워요 (gomawoyo) = «gracias». Así agradeces el regalo con educación.'));
    assert.ok(leido.includes(COMPLETADO), 'falta el mensaje de la primera vez');
    assert.match(r.html, /src="\/img\/tesoros\/luz-hangul-001\.svg"/);
    assert.match(r.html, /href="\/mi-kme#mis-tesoros"/);
    // La cabecera de esa misma página ya cuenta lo ganado.
    assert.ok(texto(cabecera(r.html)).includes('20 Kpopis'), 'la cabecera no se ha puesto al día');
    assert.equal(await saldo(A.id), 20);
    assert.equal(await cuantosMovimientos(A.id), 1);
    assert.deepEqual(await tesoros(A.id), ['luz-hangul-001']);
    assert.deepEqual(await aciertos(A.id), [], 'la ronda se cierra para poder repetirla');

    const mi = await navA.pedir('/mi-kme');
    const misTesoros = texto(seccion(mi.html, 'mis-tesoros'));
    // «Conseguido el» y la fecha en que se ganó, juntos (E0097, a petición de la autora).
    for (const frase of ['Mis tesoros', 'Luz Hangul 001', 'HANGUL LIVE 001', `Conseguido el ${hoy}`]) {
      assert.ok(misTesoros.includes(frase), `Mis tesoros: falta «${frase}»`);
    }
    assert.match(seccion(mi.html, 'mis-tesoros'), /src="\/img\/tesoros\/luz-hangul-001\.svg"/);
    // «Conseguido» (D082, E0096): en la tarjeta del tesoro que es tuyo, en texto, no en una imagen.
    assert.match(seccion(mi.html, 'mis-tesoros'), /data-tesoro="luz-hangul-001"[\s\S]*?class="tesoro__estado"[^>]*>[^<]*Conseguido/, 'Mis tesoros: falta «Conseguido» en su tarjeta');
    // La luz de Luz Hangul 001 (E0097): una capa de adorno sobre el SVG original, vacía y oculta a los lectores de pantalla.
    assert.match(seccion(mi.html, 'mis-tesoros'), /src="\/img\/tesoros\/luz-hangul-001\.svg"[^>]*>\s*<span class="tesoro__luz" aria-hidden="true"><\/span>/, 'Mis tesoros: falta la capa de luz junto al dibujo');
    const misKpopis = texto(seccion(mi.html, 'mis-kpopis'));
    for (const frase of ['Mis Kpopis', '20 Kpopis', '+20 Kpopis', 'HANGUL LIVE 001 completado', hoy]) {
      assert.ok(misKpopis.includes(frase), `Mis Kpopis: falta «${frase}»`);
    }
    const escenario = texto((await navA.pedir('/escenario')).html);
    assert.ok(escenario.includes(`Completado el ${hoy}`));
    assert.ok(escenario.includes('Repetir'));
  });

  await t.test('repetirla no vuelve a dar la recompensa: «¡Completado otra vez!» con la fecha en que se ganó', async () => {
    await responder(navA, 1, 'annyeonghaseyo');
    await responder(navA, 2, 'gomawoyo');
    const r = await responder(navA, 3, 'paiting');
    assert.equal(r.estado, 200);
    const leido = texto(r.html);
    assert.ok(leido.includes(`¡Completado otra vez! La recompensa ya la ganaste el ${hoy}: es tuya para siempre.`));
    assert.ok(!leido.includes('Has ganado'), 'no se vuelve a ganar');
    assert.equal(await saldo(A.id), 20);
    assert.equal(await cuantosMovimientos(A.id), 1);
    assert.deepEqual(await tesoros(A.id), ['luz-hangul-001']);
  });

  await t.test('dos respuestas a la vez que completan la miniclase no cobran la recompensa dos veces', async () => {
    await responder(navC, 1, 'annyeonghaseyo');
    await responder(navC, 2, 'gomawoyo');
    const respuestas = await Promise.all([responder(navC, 3, 'paiting'), responder(navC, 3, 'paiting')]);
    assert.equal(respuestas.filter((r) => texto(r.html).includes(COMPLETADO)).length, 1, 'solo una gana la recompensa');
    assert.equal(await saldo(C.id), 20);
    assert.equal(await cuantosMovimientos(C.id), 1);
    assert.deepEqual(await tesoros(C.id), ['luz-hangul-001']);
    // Y aunque algo intentara apuntar la misma recompensa otra vez, la base de datos lo impide.
    await assert.rejects(
      consulta("INSERT INTO kpopis_movimientos (id_usuario, cantidad, clave) VALUES ($1, 20, 'reto:hangul-live-001')", [C.id]),
      (err) => err.code === '23505',
    );
  });

  await t.test('otra cuenta no ve tu progreso, tus Kpopis ni tus tesoros', async () => {
    const escenario = await navB.pedir('/escenario');
    const leido = texto(escenario.html);
    assert.ok(leido.includes('Sin empezar'));
    assert.ok(!leido.includes('Completado'));
    assert.ok(texto(cabecera(escenario.html)).includes('0 Kpopis'));
    const mi = await navB.pedir('/mi-kme');
    assert.ok(texto(seccion(mi.html, 'mis-tesoros')).includes('Todavía no tienes tesoros.'));
    assert.ok(!mi.html.includes('luz-hangul-001.svg'));
    assert.ok(!texto(seccion(mi.html, 'mis-tesoros')).includes('Conseguido'), '«Conseguido» solo si el tesoro es tuyo');
    assert.ok(texto(seccion(mi.html, 'mis-kpopis')).includes('Todavía no tienes movimientos.'));
    // Lo que responde B no toca el progreso de A.
    await responder(navB, 1, 'annyeonghaseyo');
    assert.deepEqual(await aciertos(B.id), [1]);
    assert.deepEqual(await aciertos(A.id), []);
    assert.equal(await saldo(B.id), 0);
  });

  await t.test('solo el servidor decide: los campos que envíe el navegador (kpopis, acierto, completado) no cuentan', async () => {
    const r = await responder(navB, 2, 'paiting', { kpopis: '999', acierto: 'si', completado: 'si', numero: '1' });
    assert.equal(r.estado, 200);
    assert.ok(texto(r.html).includes('Prueba otra vez.'));
    assert.deepEqual(await aciertos(B.id), [1]);
    assert.equal(await saldo(B.id), 0);
    assert.deepEqual(await tesoros(B.id), []);
  });

  await t.test('una respuesta que no es de la lista: 400 «Elige una de las respuestas.»; un reto o una pregunta que no existen: 404', async () => {
    for (const respuesta of ['hola', '', '안녕하세요']) {
      const r = await responder(navB, 1, respuesta);
      assert.equal(r.estado, 400, `respuesta «${respuesta}»`);
      assert.ok(texto(r.html).includes('Elige una de las respuestas.'));
      assert.match(formularioPregunta(r.html), /name="respuesta"/);
    }
    const sinCampo = await navB.enviar(pregunta(1), {});
    assert.equal(sinCampo.estado, 400);
    const reto = await navB.pedir('/escenario/hangul-live-999');
    assert.equal(reto.estado, 404);
    assert.ok(texto(reto.html).includes('Ese reto no existe.'));
    for (const n of ['0', '4', 'abc', '1.5']) {
      const r = await navB.pedir(pregunta(n));
      assert.equal(r.estado, 404, `pregunta ${n}`);
      assert.ok(texto(r.html).includes('Esa pregunta no existe.'));
    }
    const enviada = await responder(navB, 4, 'paiting');
    assert.equal(enviada.estado, 404);
    assert.equal(await saldo(B.id), 0);
  });

  await t.test('sin el token CSRF, responder se rechaza (403) y no cuenta', async () => {
    const r = await navB.pedir(pregunta(2), { metodo: 'POST', datos: { respuesta: 'gomawoyo' } });
    assert.equal(r.estado, 403);
    assert.deepEqual(await aciertos(B.id), [1]);
  });
});
