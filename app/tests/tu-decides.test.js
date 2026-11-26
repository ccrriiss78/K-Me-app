// «K-ME · TÚ DECIDES» (D080, E0093): en «Mi K-ME», la primera pantalla tras entrar, los fans votan qué
// propuesta futura quieren primero: K-ME EXCHANGE, MY STAGE o FAN EVENTS.
// - Un voto por cuenta (clave primaria), que se cambia: nunca se suman votos de la misma cuenta.
// - El voto lo decide la sesión: un campo del formulario no puede votar por otra cuenta.
// - Solo las tres propuestas del catálogo; lo demás, 400 «Esa propuesta no existe.».
// - Después de votar se ven los porcentajes de todos los votos, sin nombres.
// - Cada tarjeta lleva su icono (T052, dibujos de ChatGPT, E0094): decorativo (alt vacío), seguro y ligero.
// Las primeras pruebas no necesitan base de datos; las demás, sí (app/.env.local). Desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { PROPUESTAS, porcentajes } from '../src/catalogos/tu-decides.js';

test('Las tres propuestas futuras del catálogo, con su título y su texto', () => {
  assert.deepEqual(PROPUESTAS.map((p) => [p.id, p.titulo]), [['exchange', 'K-ME EXCHANGE'], ['my-stage', 'MY STAGE'], ['fan-events', 'FAN EVENTS']]);
  assert.equal(PROPUESTAS[0].texto, 'Intercambia prendas y accesorios de tu colección con otros fans.');
  assert.equal(PROPUESTAS[1].texto, 'Crea pequeñas actuaciones musicales con tu avatar y compártelas dentro de K-ME.');
  assert.equal(PROPUESTAS[2].texto, 'Participa en eventos colectivos, aporta energía al escenario y consigue recuerdos exclusivos.');
});

test('Los porcentajes salen de los votos reales y siempre suman 100 (o 0 si no hay votos)', () => {
  assert.deepEqual(porcentajes({ exchange: 2, 'my-stage': 1 }), { exchange: 67, 'my-stage': 33, 'fan-events': 0 });
  assert.deepEqual(porcentajes({ exchange: 1, 'my-stage': 1, 'fan-events': 1 }), { exchange: 34, 'my-stage': 33, 'fan-events': 33 });
  assert.deepEqual(porcentajes({}), { exchange: 0, 'my-stage': 0, 'fan-events': 0 });
  assert.deepEqual(porcentajes({ 'fan-events': 5 }), { exchange: 0, 'my-stage': 0, 'fan-events': 100 });
});

// Los iconos: solo dibujo vectorial simple, con el negro, el blanco y el fucsia del logo.
const ETIQUETAS_ICONO = new Set(['svg', 'g', 'path', 'circle', 'rect', 'ellipse', 'line', 'polygon']);
const COLORES_ICONO = new Set(['#000', '#fff', '#e83475', 'none']);
const archivoIcono = (p) => new URL(`../public${p.icono}`, import.meta.url);

test('Cada propuesta tiene su icono en public/img/tu-decides/, con el nombre previsto', () => {
  for (const p of PROPUESTAS) {
    assert.equal(p.icono, `/img/tu-decides/tu-decides-${p.id}.svg`, p.id);
    assert.ok(existsSync(archivoIcono(p)), `${p.id}: falta el archivo`);
  }
});

test('Los iconos son seguros y ligeros: 48 × 48 sin tamaño fijo, 4 KB como mucho, sin texto, imágenes, scripts, enlaces ni estilos, y solo con los colores del logo', () => {
  for (const p of PROPUESTAS) {
    assert.ok(p.icono && existsSync(archivoIcono(p)), `${p.id}: sin icono`);
    assert.ok(statSync(archivoIcono(p)).size <= 4096, `${p.id}: pesa más de 4 KB`);
    const svg = readFileSync(archivoIcono(p), 'utf8');
    const raiz = /^<svg\b[^>]*>/.exec(svg)?.[0] ?? '';
    assert.match(raiz, /viewBox="0 0 48 48"/, `${p.id}: viewBox`);
    assert.doesNotMatch(raiz, /\s(width|height)=/, `${p.id}: sin ancho ni alto fijos`);
    for (const [, etiqueta] of svg.matchAll(/<([a-zA-Z][\w:-]*)/g)) assert.ok(ETIQUETAS_ICONO.has(etiqueta), `${p.id}: <${etiqueta}> no permitido`);
    assert.doesNotMatch(svg, /href|\son\w+=|style|url\(|<!|<\?|&/i, `${p.id}: enlaces, eventos, estilos, comentarios o entidades`);
    assert.ok(svg.split(/<[^>]*>/).every((t) => !t.trim()), `${p.id}: lleva texto`);
    for (const [, color] of svg.matchAll(/(?:fill|stroke)="([^"]*)"/g)) assert.ok(COLORES_ICONO.has(color.toLowerCase()), `${p.id}: color ${color} fuera de la paleta`);
  }
});

// Con base de datos.
let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_tda`, alias: `fan_${sufijo}_tda` };
const B = { usuario: `test_${sufijo}_tdb`, alias: `fan_${sufijo}_tdb` };
const C = { usuario: `test_${sufijo}_tdc`, alias: `fan_${sufijo}_tdc` };
const hayConfiguracion = () => ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'SESSION_SECRET']
  .every((k) => process.env[k] && !process.env[k].startsWith('CAMBIAR_POR'));

before(async () => {
  if (!hayConfiguracion()) return;
  const { crearApp } = await import('../src/app.js');
  ({ cerrarPool, consulta } = await import('../src/config/db.js'));
  const { crearCuenta } = await import('../src/services/authService.js');
  for (const c of [A, B, C]) c.id = (await crearCuenta({ ...c, password })).id;
  const { app } = crearApp();
  await new Promise((ok) => { servidor = app.listen(0, '127.0.0.1', ok); });
  base = `http://127.0.0.1:${servidor.address().port}`;
});
after(async () => {
  if (!servidor) return;
  try {
    const usuarios = [A.usuario, B.usuario, C.usuario];
    await consulta(`DELETE FROM sesiones WHERE sess->>'usuarioId' IN (SELECT id::text FROM usuarios WHERE usuario = ANY($1))`, [usuarios]);
    await consulta('DELETE FROM usuarios WHERE usuario = ANY($1)', [usuarios]);
  } finally { await new Promise((ok) => servidor.close(ok)); await cerrarPool(); }
});

function navegador() {
  let cookie = '';
  async function pedir(ruta, { metodo = 'GET', datos } = {}) {
    const res = await fetch(base + ruta, { method: metodo, redirect: 'manual', headers: { cookie, ...(datos ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) }, body: datos ? new URLSearchParams(datos).toString() : undefined });
    const c = res.headers.get('set-cookie'); if (c) cookie = c.split(';')[0];
    return { estado: res.status, destino: res.headers.get('location'), html: await res.text() };
  }
  const token = async () => /name="_csrf" value="([a-f0-9]+)"/.exec((await pedir(cookie ? '/mi-kme' : '/entrar')).html)[1];
  return { pedir, enviar: async (ruta, datos) => pedir(ruta, { metodo: 'POST', datos: { _csrf: await token(), ...datos } }) };
}
async function entrar(cuenta) { const n = navegador(); assert.equal((await n.enviar('/entrar', { usuario: cuenta.usuario, password })).estado, 302); return n; }
const bloque = (html) => /<section[^>]*id="tu-decides"[\s\S]*?<\/section>\s*<!-- fin tu-decides -->/.exec(html)?.[0] ?? '';
const texto = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&#34;|&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ');
const elegida = (html) => /<input[^>]*name="propuesta"[^>]*value="([\w-]+)"[^>]*checked|<input[^>]*checked[^>]*name="propuesta"[^>]*value="([\w-]+)"/.exec(bloque(html))?.slice(1).find(Boolean) ?? null;
const votoDe = async (id) => (await consulta('SELECT propuesta FROM votos_tu_decides WHERE id_usuario = $1', [id])).rows.map((f) => f.propuesta);
async function recuento() {
  const filas = (await consulta('SELECT propuesta, COUNT(*)::int AS n FROM votos_tu_decides GROUP BY propuesta')).rows;
  return Object.fromEntries(filas.map((f) => [f.propuesta, f.n]));
}

test('K-ME · TÚ DECIDES', { skip: !hayConfiguracion() && 'falta app/.env.local' }, async (t) => {
  const navA = await entrar(A), navB = await entrar(B), navC = await entrar(C);

  await t.test('1. sin voto: el bloque sale en «Mi K-ME», con las tres propuestas futuras, el botón y sin resultados ni elegida', async () => {
    const r = await navA.pedir('/mi-kme');
    assert.equal(r.estado, 200);
    const b = bloque(r.html), leido = texto(b);
    assert.ok(b, 'el bloque está en «Mi K-ME»');
    for (const frase of ['K-ME · TÚ DECIDES', '¿Qué viene después?', 'No solo formas parte de K-ME. También puedes decidir en qué se convierte', 'K-ME EXCHANGE', 'MY STAGE', 'FAN EVENTS', '¡Esta es mi favorita!']) assert.ok(leido.includes(frase), frase);
    assert.equal((leido.match(/Propuesta futura/g) ?? []).length, 3, 'las tres, marcadas como futuras');
    assert.match(b, /<form method="post" action="\/tu-decides"[\s\S]*name="_csrf"/);
    assert.equal(elegida(r.html), null);
    assert.doesNotMatch(b, /data-porcentaje/, 'sin resultados antes de votar');
    // En la portada de «Mi K-ME» (P031, E0095): primero la identidad (la imagen de perfil, con el alias y
    // la fecha de alta) y, al lado en el ordenador o debajo en el móvil, la votación; después, Mis tesoros.
    const portada = /<div class="mi-kme__portada">([\s\S]*?)<!-- fin portada -->/.exec(r.html)?.[1] ?? '';
    assert.ok(portada.includes('id="titulo-perfil"') && portada.includes('id="tu-decides"'), 'la identidad y la votación, juntas en la portada');
    assert.ok(portada.indexOf('id="titulo-perfil"') < portada.indexOf('id="tu-decides"'), 'primero la identidad');
    assert.match(/<section class="perfil"[\s\S]*?<\/section>/.exec(portada)?.[0] ?? '', /<dt>Alias<\/dt>[\s\S]*<dt>Cuenta creada<\/dt>/, 'el alias y la fecha de alta, en la tarjeta de identidad');
    assert.ok(r.html.indexOf('<!-- fin portada -->') < r.html.indexOf('id="mis-tesoros"'), 'después, Mis tesoros');
    // Cada tarjeta, con su icono decorativo (alt vacío: el nombre ya lo dice el título), y el servidor lo sirve.
    for (const p of PROPUESTAS) {
      assert.match(b, new RegExp(`<img class="tu-decides__icono" src="/img/tu-decides/tu-decides-${p.id}\\.svg" alt=""`), `${p.id}: icono`);
      const icono = await fetch(base + `/img/tu-decides/tu-decides-${p.id}.svg`);
      assert.equal(icono.status, 200, `${p.id}: el servidor sirve el icono`);
      assert.match(icono.headers.get('content-type'), /^image\/svg\+xml/);
    }
  });

  await t.test('2. primera votación: se guarda, vuelve a «Mi K-ME» con la confirmación, la elegida y los porcentajes', async () => {
    const r = await navA.enviar('/tu-decides', { propuesta: 'my-stage' });
    assert.equal(r.estado, 302);
    assert.equal(r.destino, '/mi-kme?voto=guardado#tu-decides');
    assert.deepEqual(await votoDe(A.id), ['my-stage']);
    const pagina = (await navA.pedir('/mi-kme?voto=guardado')).html;
    assert.match(texto(bloque(pagina)), /¡Voto guardado!/);
    assert.equal(elegida(pagina), 'my-stage');
    assert.match(bloque(pagina), /data-porcentaje/, 'después de votar, los resultados');
  });

  await t.test('3. cambiar de opinión sustituye el voto: sigue habiendo uno solo de esa cuenta', async () => {
    assert.equal((await navA.enviar('/tu-decides', { propuesta: 'exchange' })).estado, 302);
    assert.deepEqual(await votoDe(A.id), ['exchange']);
    assert.equal(elegida((await navA.pedir('/mi-kme')).html), 'exchange');
  });

  await t.test('4. el voto persiste al salir y volver a entrar (sin el aviso de confirmación)', async () => {
    await navA.enviar('/salir', {});
    const otra = await entrar(A);
    const pagina = (await otra.pedir('/mi-kme')).html;
    assert.equal(elegida(pagina), 'exchange');
    assert.doesNotMatch(texto(bloque(pagina)), /¡Voto guardado!/);
  });

  await t.test('5. una cuenta no puede votar por otra: el voto es siempre de la sesión', async () => {
    assert.equal((await navB.enviar('/tu-decides', { propuesta: 'fan-events', id_usuario: String(A.id), usuario: A.usuario })).estado, 302);
    assert.deepEqual(await votoDe(A.id), ['exchange'], 'el de A no cambia');
    assert.deepEqual(await votoDe(B.id), ['fan-events'], 'el voto es de B');
    assert.equal(elegida((await navC.pedir('/mi-kme')).html), null, 'C sigue sin voto');
  });

  await t.test('6. una propuesta que no existe, o ninguna, se rechaza con 400 y no cambia nada', async () => {
    for (const propuesta of ['intercambios', '', 'exchange; DROP TABLE usuarios', 'EXCHANGE']) {
      const r = await navC.enviar('/tu-decides', { propuesta });
      assert.equal(r.estado, 400, propuesta);
      assert.match(texto(r.html), /Esa propuesta no existe\./);
    }
    assert.deepEqual(await votoDe(C.id), []);
  });

  await t.test('7. los porcentajes son los de todos los votos reales, sin nombres de nadie', async () => {
    assert.equal((await navC.enviar('/tu-decides', { propuesta: 'fan-events' })).estado, 302);
    const esperados = porcentajes(await recuento());
    const b = bloque((await navC.pedir('/mi-kme')).html);
    for (const p of PROPUESTAS) {
      assert.match(b, new RegExp(`data-porcentaje="${p.id}"[^>]*>[\\s\\S]*?${esperados[p.id]} %`), `${p.id}: ${esperados[p.id]} %`);
    }
    for (const otro of [A.alias, B.alias]) assert.ok(!b.includes(otro), 'no se ve quién vota');
  });

  await t.test('8. sin sesión, votar lleva a «Entrar»; sin el token CSRF, 403', async () => {
    const anonimo = navegador();
    assert.equal((await anonimo.pedir('/tu-decides', { metodo: 'POST', datos: { propuesta: 'exchange' } })).destino, '/entrar');
    assert.equal((await navC.pedir('/tu-decides', { metodo: 'POST', datos: { propuesta: 'exchange' } })).estado, 403);
    assert.deepEqual(await votoDe(C.id), ['fan-events']);
  });
});
