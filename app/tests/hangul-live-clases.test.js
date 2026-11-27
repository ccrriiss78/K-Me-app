// HANGUL LIVE 002 y 003 (D086, E0101). La autora: «quiero añadir algún mensaje más para el hangul, no
// puedo volver a ganar Kpopis si no hago más que repetir lo mismo… al menos 6, puede tener que ver con
// las emociones además de con el kpop»; «no quiero quitar las que había sino añadir todas las nuevas»;
// un botón «K» con las comillas del logo que se ilumine, y otro para volver a las clases anteriores;
// 20 Kpopis por clase.
// - HANGUL LIVE 001 no cambia. Detrás, 002 · Emociones (사랑, 행복, 미소) y 003 · Escenario y fandom
//   (무대, 최애, 컴백): palabras del catálogo del sello, comprobadas en el NIKL y aprobadas (D043).
// - Cada clase nueva da 20 Kpopis la primera vez, sin tesoro.
// - «Siguiente pregunta», «Siguiente clase» y «Terminar la clase», con la «K»; «Clase anterior» para
//   repasar.
// Las primeras pruebas no necesitan base de datos; las demás, sí (app/.env.local). Desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { RETOS, buscarReto, retoAnterior, retoSiguiente } from '../src/catalogos/hangul-live.js';
import { PALABRAS_HANGUL } from '../src/catalogos/hangul.js';

const NUEVAS = { 'hangul-live-002': ['사랑', '행복', '미소'], 'hangul-live-003': ['무대', '최애', '컴백'] };

test('Las clases: HANGUL LIVE 001 sin cambios y, detrás, 002 y 003, con 20 Kpopis y sin tesoro', () => {
  assert.deepEqual(RETOS.map((r) => r.id), ['hangul-live-001', 'hangul-live-002', 'hangul-live-003']);
  assert.deepEqual(buscarReto('hangul-live-001').recompensa, { kpopis: 20, tesoro: 'luz-hangul-001' });
  assert.deepEqual(buscarReto('hangul-live-001').expresiones.map((e) => e.hangul), ['안녕하세요', '고마워요', '파이팅']);
  for (const id of Object.keys(NUEVAS)) {
    const reto = buscarReto(id);
    assert.deepEqual(reto.recompensa, { kpopis: 20 }, `${id}: 20 Kpopis, sin tesoro`);
    assert.equal(reto.titulo, id.replace('hangul-live-', 'HANGUL LIVE '));
    assert.ok(reto.lema && reto.entrada, `${id}: le falta el lema o la entrada`);
  }
  assert.equal(retoAnterior('hangul-live-001'), null);
  assert.equal(retoAnterior('hangul-live-002').id, 'hangul-live-001');
  assert.equal(retoSiguiente('hangul-live-002').id, 'hangul-live-003');
  assert.equal(retoSiguiente('hangul-live-003'), null);
});

test('Las palabras nuevas salen del catálogo comprobado del sello (nada de hangul inventado), con su lectura y su fuente del NIKL', () => {
  for (const [id, palabras] of Object.entries(NUEVAS)) {
    const reto = buscarReto(id);
    assert.deepEqual(reto.expresiones.map((e) => e.hangul), palabras, id);
    for (const e of reto.expresiones) {
      const comprobada = PALABRAS_HANGUL.find((p) => p.hangul === e.hangul);
      assert.ok(comprobada, `${e.hangul}: no está en el catálogo comprobado`);
      assert.equal(comprobada.fuente.diccionario, 'B', `${e.hangul}: con entrada propia en el Diccionario Básico`);
      assert.equal(e.lectura, comprobada.lectura, `${e.hangul}: la misma lectura`);
      assert.equal(e.fuente.enlace, `https://krdict.korean.go.kr/spa/dicMarinerSearch/search?nation=spa&nationCode=6&ParaWordNo=&mainSearchWord=${encodeURIComponent(e.hangul)}`);
      assert.equal(e.pendienteDeRevision, false);
      for (const campo of ['traduccion', 'explicacion', 'significado', 'sirvePara']) assert.ok(e[campo], `${e.id}: falta ${campo}`);
    }
  }
});

test('En cada clase nueva, las 3 preguntas ofrecen sus 3 palabras y la respuesta cambia de sitio', () => {
  for (const id of Object.keys(NUEVAS)) {
    const reto = buscarReto(id);
    const ids = reto.expresiones.map((e) => e.id).sort();
    assert.deepEqual(reto.preguntas.map((p) => p.numero), [1, 2, 3]);
    for (const p of reto.preguntas) {
      assert.deepEqual([...p.opciones].sort(), ids, `${id} ${p.numero}`);
      assert.ok(p.opciones.includes(p.respuesta) && p.toca && p.bien && p.texto, `${id} ${p.numero}`);
    }
    assert.equal(new Set(reto.preguntas.map((p) => p.respuesta)).size, 3, id);
    assert.equal(new Set(reto.preguntas.map((p) => p.opciones.indexOf(p.respuesta))).size, 3, id);
  }
});

// --- Con la base de datos ---

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_hla`, alias: `fan_${sufijo}_hla` };
const B = { usuario: `test_${sufijo}_hlb`, alias: `fan_${sufijo}_hlb` };
const hayConfiguracion = () => ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'SESSION_SECRET']
  .every((k) => process.env[k] && !process.env[k].startsWith('CAMBIAR_POR'));

before(async () => {
  if (!hayConfiguracion()) return;
  const { crearApp } = await import('../src/app.js');
  ({ cerrarPool, consulta } = await import('../src/config/db.js'));
  const { crearCuenta } = await import('../src/services/authService.js');
  for (const c of [A, B]) c.id = (await crearCuenta({ ...c, password })).id;
  const { app } = crearApp();
  await new Promise((ok) => { servidor = app.listen(0, '127.0.0.1', ok); });
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  if (!servidor) return;
  try {
    const usuarios = [A.usuario, B.usuario];
    await consulta(`DELETE FROM sesiones WHERE sess->>'usuarioId' IN (SELECT id::text FROM usuarios WHERE usuario = ANY($1))`, [usuarios]);
    await consulta('DELETE FROM usuarios WHERE usuario = ANY($1)', [usuarios]);
  } finally {
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

const texto = (html) => html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
// El botón «K»: la K con sus comillas (adorno, oculto a los lectores de pantalla) y el enlace con su texto.
const botonK = (href, textoEnlace) => new RegExp(`<p class="boton-k"><span class="boton-k__k" aria-hidden="true"><span class="marca-k__comilla">«</span>K<span class="marca-k__comilla">»</span></span>\\s*<a href="${href}">${textoEnlace}</a></p>`);
const claseAnterior = (href, titulo) => new RegExp(`<a class="boton boton--enlace boton--secundario boton-atras" href="${href}">← Clase anterior: ${titulo}</a>`);

test('HANGUL LIVE 002 y 003 en la app', { skip: !hayConfiguracion() && 'falta app/.env.local' }, async (t) => {
  function navegador() {
    let cookie = '';
    async function pedir(ruta, datos) {
      const res = await fetch(base + ruta, { method: datos ? 'POST' : 'GET', redirect: 'manual', headers: { cookie, ...(datos ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) }, body: datos ? new URLSearchParams(datos).toString() : undefined });
      const c = res.headers.get('set-cookie'); if (c) cookie = c.split(';')[0];
      return { estado: res.status, destino: res.headers.get('location'), html: await res.text() };
    }
    const token = async () => /name="_csrf" value="([a-f0-9]+)"/.exec((await pedir(cookie ? '/mi-kme' : '/entrar')).html)[1];
    return { pedir, enviar: async (ruta, datos) => pedir(ruta, { _csrf: await token(), ...datos }) };
  }
  const entrar = async (c) => { const n = navegador(); assert.equal((await n.enviar('/entrar', { usuario: c.usuario, password })).estado, 302); return n; };
  const navA = await entrar(A), navB = await entrar(B);
  const saldo = async (id) => (await consulta('SELECT COALESCE(SUM(cantidad), 0)::int AS n FROM kpopis_movimientos WHERE id_usuario = $1', [id])).rows[0].n;
  const tesoros = async (id) => (await consulta('SELECT count(*)::int AS n FROM tesoros_usuario WHERE id_usuario = $1', [id])).rows[0].n;
  const responder = (nav, reto, n, respuesta) => nav.enviar(`/escenario/${reto}/preguntas/${n}`, { respuesta });
  // Completa una clase acertando las 3 en orden; devuelve la página de la última.
  async function completar(nav, idReto) {
    let r;
    for (const p of buscarReto(idReto).preguntas) r = await responder(nav, idReto, p.numero, p.respuesta);
    return r;
  }

  await t.test('1. «Mi escenario» presenta las tres clases en orden; las nuevas, con 20 Kpopis y sin tesoro', async () => {
    const html = (await navA.pedir('/escenario')).html;
    assert.deepEqual([...html.matchAll(/data-reto="([\w-]+)"/g)].map((m) => m[1]), RETOS.map((r) => r.id));
    for (const id of Object.keys(NUEVAS)) {
      const tarjeta = new RegExp(`data-reto="${id}"[\\s\\S]*?</li>`).exec(html)[0];
      assert.ok(texto(tarjeta).includes('Recompensa: 20 Kpopis.'), `${id}: la recompensa`);
      assert.doesNotMatch(tarjeta, /recompensa__tesoro/, `${id}: sin dibujo de tesoro`);
    }
  });

  await t.test('2. la clase 002 enseña sus 3 palabras con lectura, traducción y fuente, y deja volver a la 001; la 001 no tiene clase anterior', async () => {
    const html = (await navA.pedir('/escenario/hangul-live-002')).html;
    assert.equal(texto(html).includes('Las 3 palabras'), true);
    for (const e of buscarReto('hangul-live-002').expresiones) {
      assert.match(html, new RegExp(`lang="ko"[^>]*>${e.hangul}<`));
      for (const frase of [e.lectura, e.traduccion, e.explicacion]) assert.ok(texto(html).includes(frase), `${e.id}: falta «${frase}»`);
    }
    assert.doesNotMatch(html, /aviso--revision/, 'sin aviso de revisión: todas tienen entrada propia');
    assert.match(html, claseAnterior('/escenario/hangul-live-001', 'HANGUL LIVE 001'));
    assert.doesNotMatch((await navA.pedir('/escenario/hangul-live-001')).html, /Clase anterior/);
  });

  await t.test('3. si fallas, ves qué significa y qué tocaba; si aciertas, la «K» lleva a la siguiente pregunta', async () => {
    const mal = await responder(navA, 'hangul-live-002', 1, 'haengbok');
    assert.ok(texto(mal.html).includes('행복 (haengbok) = «felicidad»: sirve para hablar de la felicidad. Aquí toca hablar de amor. Prueba otra vez.'));
    const bien = await responder(navA, 'hangul-live-002', 1, 'sarang');
    assert.ok(texto(bien.html).includes('¡Bien! 사랑 (sarang) = «amor».'));
    assert.match(bien.html, botonK('/escenario/hangul-live-002/preguntas/2', 'Siguiente pregunta'));
    assert.equal(await saldo(A.id), 0);
  });

  await t.test('4. al acertar las 3, la primera vez: 20 Kpopis, sin tesoro; la «K» lleva a la 003 y se puede volver a la 001', async () => {
    const r = await completar(navA, 'hangul-live-002');
    const leido = texto(r.html);
    assert.ok(leido.includes('¡HANGUL LIVE 002 completado! Has ganado 20 Kpopis.'), 'el mensaje de la primera vez');
    assert.doesNotMatch(r.html, /final__tesoro|Mis tesoros/, 'sin tesoro');
    assert.match(r.html, botonK('/escenario/hangul-live-003', 'Siguiente clase: HANGUL LIVE 003'));
    assert.match(r.html, claseAnterior('/escenario/hangul-live-001', 'HANGUL LIVE 001'));
    assert.equal(await saldo(A.id), 20);
    assert.equal(await tesoros(A.id), 0);
    assert.ok(texto(((await navA.pedir('/mi-kme')).html)).includes('HANGUL LIVE 002 completado'), 'el movimiento, en Mis Kpopis');
  });

  // Repasar (D087, E0102; la autora: «y si en otra sesión repiten clase podría ganar 5 Kpopis, ¿no?»):
  // 5 Kpopis por repasar una clase ya completada, como mucho una vez al día por clase (hora de Madrid).
  await t.test('5. repasar la 002: +5 Kpopis la primera vez del día; otra vez el mismo día, nada; al día siguiente, otros 5', async () => {
    const r = await completar(navA, 'hangul-live-002');
    assert.ok(texto(r.html).includes('¡Completado otra vez! Por repasar hoy, has ganado 5 Kpopis.'));
    assert.match(r.html, /class="final__kpopis"[\s\S]*?\+5 Kpopis/);
    assert.equal(await saldo(A.id), 25);
    assert.ok(texto((await navA.pedir('/mi-kme')).html).includes('Repaso de HANGUL LIVE 002'), 'el movimiento, en Mis Kpopis');
    const otra = await completar(navA, 'hangul-live-002');
    assert.ok(texto(otra.html).includes('Los Kpopis por repasar esta clase ya los has ganado hoy: vuelve mañana.'));
    assert.equal(await saldo(A.id), 25, 'una vez al día');
    // El repaso de hoy, como si hubiera sido otro día: se puede volver a ganar.
    await consulta("UPDATE kpopis_movimientos SET clave = 'repaso:hangul-live-002:2000-01-01' WHERE id_usuario = $1 AND clave LIKE 'repaso:%'", [A.id]);
    await completar(navA, 'hangul-live-002');
    assert.equal(await saldo(A.id), 30);
  });

  await t.test('6. la 003 da sus propios 20 Kpopis, y su «K» termina la clase y vuelve a «Mi escenario»', async () => {
    const r = await completar(navA, 'hangul-live-003');
    assert.ok(texto(r.html).includes('¡HANGUL LIVE 003 completado! Has ganado 20 Kpopis.'));
    assert.match(r.html, botonK('/escenario', 'Terminar la clase'));
    assert.match(r.html, claseAnterior('/escenario/hangul-live-002', 'HANGUL LIVE 002'));
    assert.equal(await saldo(A.id), 50);
  });

  await t.test('7. al terminar la 001, la «K» lleva a la 002; su recompensa no cambia (20 Kpopis y Luz Hangul 001)', async () => {
    const r = await completar(navA, 'hangul-live-001');
    assert.ok(texto(r.html).includes('¡HANGUL LIVE 001 completado! Has ganado 20 Kpopis y Luz Hangul 001, que ya está en Mis tesoros.'));
    assert.match(r.html, botonK('/escenario/hangul-live-002', 'Siguiente clase: HANGUL LIVE 002'));
    assert.equal(await saldo(A.id), 70);
    assert.equal(await tesoros(A.id), 1);
  });

  await t.test('8. otra cuenta no ve tu progreso ni tus Kpopis: para ella, las clases están sin empezar', async () => {
    const html = (await navB.pedir('/escenario')).html;
    assert.equal((texto(html).match(/Sin empezar/g) ?? []).length, 3);
    assert.equal(await saldo(B.id), 0);
  });
});
