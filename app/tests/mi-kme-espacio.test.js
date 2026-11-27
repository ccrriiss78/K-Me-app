// «Mi K-ME» como «Mi espacio» (opción C de ChatGPT, elegida por la autora: D085, E0100). «Quiero dar
// prioridad a lo propio: mi avatar, mi sello, mis tesoros y mis Kpopis. TÚ DECIDES… debe quedar después».
// - Primero lo propio, en el orden en que se lee (también con teclado y lector de pantalla): la imagen
//   de perfil (con el alias y la fecha de alta), Mis tesoros, Mis Kpopis y, si hay avatar y sello, el
//   sello en su propio apartado. Después, «TÚ DECIDES».
// - Los cuatro casos, sin recuadros vacíos: sin imagen (la invitación), solo avatar, los dos (el avatar
//   en la imagen de perfil y el sello aparte) y solo sello (el sello ocupa la imagen de perfil).
// - La cabecera: el logo más visible, 80 px de alto en el ordenador y 64 en el móvil, y la imagen de
//   perfil con su misma altura.
// Necesitan una base de datos real configurada en app/.env.local. Desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { recetaPorDefecto } from '../src/services/avatarCatalogo.js';

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_esp`, alias: `fan_${sufijo}_esp` };
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
    await consulta('DELETE FROM usuarios WHERE usuario = $1', [A.usuario]); // borra también sus avatares y sellos
  } finally {
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

test('Cabecera: el logo, a 80 px de alto en el ordenador y a 64 en el móvil, y la imagen de perfil con su misma altura', async () => {
  if (!hayConfiguracion()) return;
  const css = await (await fetch(base + '/css/identidad.css')).text();
  const movil = /@media \(max-width: 600px\) \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
  const fuera = css.replace(movil, '');
  assert.match(fuera, /\.marca img \{ height: 80px; \}/, 'ordenador: 80 px');
  assert.match(movil, /\.marca img \{ height: 64px; \}/, 'móvil: 64 px');
  assert.match(fuera, /\.perfil-cabecera\[data-perfil-cabecera="avatar"\], \.perfil-cabecera--vacia \{\s*width: 56px; height: 80px;/, 'la imagen de perfil, tan alta como el logo');
  assert.match(movil, /\.perfil-cabecera\[data-perfil-cabecera="avatar"\], \.perfil-cabecera--vacia \{ width: 45px; height: 64px;/);
  assert.match(fuera, /\.perfil-cabecera\[data-perfil-cabecera="sello"\] svg \{ width: 56px; height: 80px; \}/, 'el sello, entero y a la misma altura');
  assert.match(movil, /\.perfil-cabecera\[data-perfil-cabecera="sello"\] svg \{ width: 45px; height: 64px; \}/);
});

test('«Mi K-ME» como «Mi espacio»: primero lo propio y después «TÚ DECIDES», en los cuatro casos del perfil', { skip: !hayConfiguracion() && 'falta app/.env.local' }, async (t) => {
  let cookie = '';
  async function pedir(ruta, { datos, json } = {}) {
    const tipo = json ? { 'content-type': 'application/json', accept: 'application/json' } : datos ? { 'content-type': 'application/x-www-form-urlencoded' } : {};
    const res = await fetch(base + ruta, { method: datos || json ? 'POST' : 'GET', redirect: 'manual', headers: { cookie, ...tipo }, body: json ? JSON.stringify(json) : datos ? new URLSearchParams(datos).toString() : undefined });
    const c = res.headers.get('set-cookie'); if (c) cookie = c.split(';')[0];
    return { estado: res.status, destino: res.headers.get('location'), html: await res.text() };
  }
  const token = async () => /name="_csrf" value="([a-f0-9]+)"/.exec((await pedir(cookie ? '/mi-kme' : '/entrar')).html)[1];
  const enviar = async (ruta, datos) => pedir(ruta, { datos: { _csrf: await token(), ...datos } });
  assert.equal((await enviar('/entrar', { usuario: A.usuario, password })).estado, 302);
  const avatar = await pedir('/studio/avatares', { json: { _csrf: await token(), nombre: 'Avatar del espacio', receta: recetaPorDefecto() } });
  assert.equal(avatar.estado, 201);
  const idAvatar = JSON.parse(avatar.html).id;
  const sello = await enviar('/studio/sellos', {
    nombre: 'Sello del espacio', borde: 'negro', fondo: 'blanco', palabra: 'amor', color_palabra: 'fucsia',
    avatar: '', encuadre: 'rostro', mostrar_alias: 'si', color_alias: 'negro',
    motivo1: '', color_motivo1: 'negro', motivo2: '', color_motivo2: 'negro', motivo3: '', color_motivo3: 'negro',
  });
  const idSello = /^\/studio\/sellos\/(\d+)/.exec(sello.destino ?? '')?.[1];
  assert.ok(idSello, 'se guarda el sello');

  // Lo propio: la parte de la página entre el principio de «Mi espacio» y su final.
  const espacio = (html) => /<div class="mi-kme__espacio"[^>]*>([\s\S]*?)<!-- fin mi espacio -->/.exec(html)?.[1] ?? '';
  const perfil = (html) => /<section class="perfil"[\s\S]*?<\/section>/.exec(espacio(html))?.[0] ?? '';
  const posicion = (html, marca) => html.indexOf(marca);
  async function comprobarOrden(html, { conSelloAparte }) {
    const marcas = ['id="titulo-perfil"', 'id="mis-tesoros"', 'id="mis-kpopis"', ...(conSelloAparte ? ['id="titulo-sello-perfil"'] : []), '<!-- fin mi espacio -->', 'id="tu-decides"'];
    const posiciones = marcas.map((m) => posicion(html, m));
    for (const [i, p] of posiciones.entries()) assert.ok(p >= 0, `falta ${marcas[i]}`);
    assert.deepEqual([...posiciones].sort((a, b) => a - b), posiciones, `en orden: ${marcas.join(', ')}`);
    assert.match(perfil(html), /<dt>Alias<\/dt>[\s\S]*<dt>Cuenta creada<\/dt>/, 'el alias y la fecha de alta, con la imagen de perfil');
    assert.match(espacio(html), /<div class="mi-kme__mio">[\s\S]*id="mis-tesoros"[\s\S]*id="mis-kpopis"/, 'tesoros y Kpopis, juntos al lado de la imagen');
    if (!conSelloAparte) assert.doesNotMatch(html, /id="titulo-sello-perfil"/, 'sin apartado vacío para el sello');
  }

  await t.test('1. sin imagen de perfil: la invitación en su sitio, y después tesoros, Kpopis y «TÚ DECIDES»', async () => {
    const html = (await pedir('/mi-kme')).html;
    assert.match(html, /<div class="mi-kme__espacio" data-perfil-principal="ninguno">/);
    assert.match(perfil(html), /Todavía no has elegido tu imagen de perfil/);
    assert.doesNotMatch(perfil(html), /data-perfil="/);
    // «Mis Kpopis» dice dónde se ganan y dónde se gastan (desde D074 se canjean; la autora, E0102).
    const kpopis = /<section class="kpopis"[\s\S]*?<\/section>/.exec(html)?.[0] ?? '';
    assert.match(kpopis, /Se ganan en <a class="enlace" href="\/escenario">Mi escenario<\/a> y se canjean en <a class="enlace" href="\/studio\/coleccion-k">Colección «K»<\/a>\./);
    assert.doesNotMatch(kpopis, /Todavía no se pueden gastar/);
    await comprobarOrden(html, { conSelloAparte: false });
  });

  await t.test('2. solo avatar: el avatar grande en la imagen de perfil, con «Quitar»', async () => {
    assert.equal((await enviar('/perfil/avatar', { avatar: idAvatar })).estado, 302);
    const html = (await pedir('/mi-kme')).html;
    assert.match(html, /<div class="mi-kme__espacio" data-perfil-principal="avatar">/);
    assert.match(perfil(html), /data-perfil="avatar"[\s\S]*?<svg[\s\S]*Quitar el avatar del perfil/);
    await comprobarOrden(html, { conSelloAparte: false });
  });

  await t.test('3. avatar y sello: el avatar en la imagen de perfil y el sello en «Tu sello de perfil», después de los Kpopis', async () => {
    assert.equal((await enviar('/perfil/sello', { sello: idSello })).estado, 302);
    const html = (await pedir('/mi-kme')).html;
    assert.match(html, /<div class="mi-kme__espacio" data-perfil-principal="avatar">/);
    assert.match(perfil(html), /data-perfil="avatar"/);
    assert.doesNotMatch(perfil(html), /data-perfil="sello"/, 'el sello va aparte');
    const apartado = /<section class="sello-perfil" aria-labelledby="titulo-sello-perfil">[\s\S]*?<\/section>/.exec(html)?.[0] ?? '';
    assert.match(apartado, /<h2 id="titulo-sello-perfil">Tu sello de perfil<\/h2>/);
    assert.match(apartado, /data-perfil="sello"[\s\S]*?<svg[^>]*class="sello[\s\S]*Quitar el sello del perfil/);
    await comprobarOrden(html, { conSelloAparte: true });
  });

  await t.test('4. solo sello: el sello ocupa la imagen de perfil, sin apartado aparte', async () => {
    assert.equal((await enviar('/perfil/avatar', { avatar: '' })).estado, 302);
    const html = (await pedir('/mi-kme')).html;
    assert.match(html, /<div class="mi-kme__espacio" data-perfil-principal="sello">/);
    assert.match(perfil(html), /data-perfil="sello"[\s\S]*?<svg[^>]*class="sello[\s\S]*Quitar el sello del perfil/);
    assert.doesNotMatch(html, /data-perfil="avatar"/);
    await comprobarOrden(html, { conSelloAparte: false });
  });

  await t.test('5. la votación sigue funcionando sin recargar: la página carga su script', async () => {
    assert.match((await pedir('/mi-kme')).html, /<script src="\/js\/tu-decides\.js" defer><\/script>/);
  });
});
