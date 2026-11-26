// Lightstick de estudio · encendido en la app (D083, E0098): una opción nueva del editor, al lado del
// lightstick de siempre, que no cambia.
// - El servidor lo acepta en una receta (está en el catálogo del editor) y rechaza llevarlo a la vez
//   que el de siempre (van en la misma ranura, la mano).
// - Es gratis, como el de siempre: no está en el catálogo de canje.
// - Va en la mano: sale con el cuerpo entero, pero no en el recorte del rostro.
// - Los degradados de su luz llevan delante el id de cada dibujo, y la vista previa del sello lo trae.
// Las primeras pruebas no necesitan base de datos; las demás, sí (app/.env.local). Desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { leerReceta } from '../src/services/avatarService.js';
import { recetaPorDefecto, dibujarAvatar } from '../src/services/avatarCatalogo.js';
import { CANJE } from '../src/catalogos/canje.js';

const ORIGINAL = 'collage-lightstick-estudio', ENCENDIDO = 'collage-lightstick-estudio-encendido';
const receta = (accesorio, accesoriosExtra = []) => ({ ...recetaPorDefecto(), cuerpo: 'recto', accesorio, accesoriosExtra });
const codigoDe = (fn) => { try { fn(); return null; } catch (e) { return [e.codigo, e.campo]; } };
const ids = (html) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const repetidos = (lista) => [...new Set(lista.filter((x, i) => lista.indexOf(x) !== i))];
const referencias = (svg) => [...svg.matchAll(/url\(#([^)]+)\)|href="#([^"]+)"/g)].map((m) => m[1] ?? m[2]);
async function filtro() {
  const ventana = {};
  vm.runInNewContext(await readFile(new URL('../public/js/svg-seguro.js', import.meta.url), 'utf8'), { window: ventana, atob });
  return ventana.KME_SVG;
}

test('El servidor acepta el lightstick encendido, solo o con los de la cabeza, y rechaza llevarlo con el de siempre (la misma ranura)', () => {
  assert.equal(codigoDe(() => leerReceta(receta(ENCENDIDO))), null);
  assert.equal(codigoDe(() => leerReceta(receta(ENCENDIDO, ['collage-gorro-punto', 'gafas']))), null);
  assert.equal(codigoDe(() => leerReceta(receta(ORIGINAL))), null, 'el de siempre sigue valiendo');
  assert.deepEqual(codigoDe(() => leerReceta(receta(ORIGINAL, [ENCENDIDO]))), ['OPCION_NO_VALIDA', 'accesoriosExtra']);
});

test('Es gratis, como el de siempre: ninguno de los dos está en el catálogo de canje', () => {
  for (const id of [ORIGINAL, ENCENDIDO]) assert.equal(CANJE.some((p) => id.startsWith(p.familia)), false, id);
});

test('Con el cuerpo entero sale encendido y sus degradados apuntan a su propio dibujo; en el recorte del rostro no sale', () => {
  const cuerpo = dibujarAvatar(leerReceta(receta(ENCENDIDO)), { encuadre: 'cuerpo' });
  assert.match(cuerpo, /data-parte="luz-nucleo"/);
  assert.match(cuerpo, /data-parte="agarre-collage"/);
  const propios = new Set(ids(cuerpo));
  for (const ref of referencias(cuerpo)) assert.ok(propios.has(ref), `#${ref} está en el dibujo`);
  assert.doesNotMatch(cuerpo, /\sid="collage-/, 'los ids llevan delante el del dibujo');
  assert.doesNotMatch(dibujarAvatar(leerReceta(receta(ENCENDIDO)), { encuadre: 'rostro' }), /luz-|agarre-collage/);
  assert.doesNotMatch(dibujarAvatar(leerReceta(receta(ORIGINAL)), { encuadre: 'cuerpo' }), /luz-/, 'el de siempre, sin luz');
});

test('El dibujo pasa el filtro de la vista previa del sello: sus texturas son PNG válidos y no lleva nada prohibido', async () => {
  const { pngIncrustadoValido } = await filtro();
  const svg = dibujarAvatar(leerReceta(receta(ENCENDIDO)), { encuadre: 'cuerpo' });
  assert.doesNotMatch(svg, /<(?:script|foreignObject|iframe|object|embed|a|animate|set)\b|\son\w+\s*=|\ssrc\s*=/i);
  for (const [, enlace] of svg.matchAll(/href="([^"]+)"/g)) {
    assert.ok(enlace.startsWith('#') || pngIncrustadoValido(enlace), enlace.slice(0, 40));
  }
});

// --- Con la base de datos ---

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_luz`, alias: `fan_${sufijo}_luz` };
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

test('Lightstick encendido en la app', { skip: !hayConfiguracion() && 'falta app/.env.local' }, async (t) => {
  let cookie = '';
  async function pedir(ruta, { metodo = 'GET', datos, json, cabeceras = {} } = {}) {
    const tipo = json ? { 'content-type': 'application/json', accept: 'application/json' } : datos ? { 'content-type': 'application/x-www-form-urlencoded' } : {};
    const res = await fetch(base + ruta, {
      method: metodo, redirect: 'manual', headers: { cookie, ...tipo, ...cabeceras },
      body: json ? JSON.stringify(json) : datos ? new URLSearchParams(datos).toString() : undefined,
    });
    const c = res.headers.get('set-cookie');
    if (c) cookie = c.split(';')[0];
    const html = await res.text();
    let cuerpo = null;
    try { cuerpo = JSON.parse(html); } catch { /* HTML */ }
    return { estado: res.status, destino: res.headers.get('location'), html, cuerpo };
  }
  const token = async () => /name="_csrf" value="([a-f0-9]+)"/.exec((await pedir(cookie ? '/mi-kme' : '/entrar')).html)[1];
  const enviar = async (ruta, datos) => pedir(ruta, { metodo: 'POST', datos: { _csrf: await token(), ...datos } });
  assert.equal((await enviar('/entrar', { usuario: A.usuario, password })).estado, 302);
  let idAvatar;

  await t.test('una cuenta nueva, sin canjear nada, guarda un avatar con el lightstick encendido y lo recupera igual; con los dos lightsticks, 400', async () => {
    const r = await pedir('/studio/avatares', { metodo: 'POST', json: { _csrf: await token(), nombre: 'Luz encendida', receta: receta(ENCENDIDO) } });
    assert.equal(r.estado, 201);
    idAvatar = r.cuerpo.id;
    assert.equal((await consulta('SELECT composicion FROM avatares WHERE id = $1', [idAvatar])).rows[0].composicion.accesorio, ENCENDIDO);
    const dos = await pedir('/studio/avatares', { metodo: 'POST', json: { _csrf: await token(), nombre: 'Dos luces', receta: receta(ORIGINAL, [ENCENDIDO]) } });
    assert.equal(dos.estado, 400);
  });

  await t.test('un sello con ese avatar de cuerpo entero lo trae encendido, también en la vista previa, sin repetir ids', async () => {
    const datos = {
      nombre: 'Sello con luz', borde: 'negro', fondo: 'blanco', palabra: 'amor', color_palabra: 'fucsia',
      avatar: idAvatar, encuadre: 'cuerpo', mostrar_alias: 'si', color_alias: 'negro',
      motivo1: '', color_motivo1: 'negro', motivo2: '', color_motivo2: 'negro', motivo3: '', color_motivo3: 'negro',
    };
    const r = await enviar('/studio/sellos', datos);
    const idSello = /^\/studio\/sellos\/(\d+)/.exec(r.destino ?? '')?.[1];
    assert.ok(idSello, 'se guarda el sello');
    const editor = await pedir(`/studio/sellos/${idSello}`);
    assert.match(editor.html, /<g data-parte="avatar">[\s\S]*?data-parte="luz-nucleo"/);
    assert.deepEqual(repetidos(ids(editor.html)), []);
    const { nombre, ...campos } = datos;
    const vista = await pedir(`/studio/sellos/vista-previa?${new URLSearchParams(campos)}`, { cabeceras: { accept: 'application/json' } });
    assert.equal(vista.estado, 200);
    assert.match(vista.cuerpo.svg, /data-parte="luz-nucleo"/);
  });
});
