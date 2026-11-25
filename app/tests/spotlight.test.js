// COLECCIÓN K · SPOTLIGHT en la app (el lote 06 de ChatGPT; D077 y D078, E0088 y E0089): propuestas
// en Colección «K», sin canje ni precio. Sus ids técnicos conservan «collage-k06-».
// - Una cuenta sin Kpopis ni piezas canjeadas puede guardar un avatar con todo Spotlight (no está en
//   el canje) y lo recupera tal cual.
// - El recorte del rostro (cabecera, Connect, sello «Rostro») lleva los pendientes y el lazo; los
//   pines, las pulseras y el bolso, no.
// - Todo Spotlight junto usa 8 imágenes: cabe incluso en el límite antiguo de 8 (hoy, 16, D076).
// - En el avatar dibujado, lo visible dice Spotlight, no Encore.
// Las primeras pruebas no necesitan base de datos; la última, sí (app/.env.local). Desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { leerReceta } from '../src/services/avatarService.js';
import { recetaPorDefecto, dibujarAvatar } from '../src/services/avatarCatalogo.js';
import { CANJE } from '../src/catalogos/canje.js';

const PE = 'collage-k06-pendientes-cometa', PU = 'collage-k06-pulseras-fanchant', PI = 'collage-k06-pines-fan-signal';
const BR = 'collage-k06-bolso-encore-rizo', LA = 'collage-k06-lazo-saten';
const MARCA = { [PE]: /collage-k-pendientes-/, [PU]: /collage-k-pulseras-/, [PI]: /collage-k-pines-/, [BR]: /collage-k-bolso-/, [LA]: /collage-k-lazo-/ };
function lote06(cuerpo = 'recto') {
  const v = { relajado: 'delgado', recto: 'medio', amplio: 'grueso' }[cuerpo];
  const r = recetaPorDefecto();
  return { ...r, cuerpo, ropa: { ...r.ropa, arriba: `collage-k06-chaqueta-cristal-${v}`, abajo: `collage-k06-falda-saten-${v}` }, accesorio: LA, accesoriosExtra: [PE, PU, PI, BR] };
}
const imagenes = (svg) => (svg.match(/<image\b/g) ?? []).length;

test('Spotlight es una propuesta: no está en el catálogo de canje', () => {
  for (const familia of ['collage-k06-chaqueta-cristal', 'collage-k06-falda-saten', PE, PU, PI, 'collage-k06-bolso-encore', BR, LA]) {
    assert.equal(CANJE.some((p) => p.familia === familia), false, familia);
  }
});

test('Con cada cuerpo, todo Spotlight junto es una receta válida, usa 8 imágenes (cabe incluso en el límite antiguo de 8) y lo visible dice Spotlight', () => {
  for (const cuerpo of ['relajado', 'recto', 'amplio']) {
    const svg = dibujarAvatar(leerReceta(lote06(cuerpo)), { encuadre: 'cuerpo' });
    for (const [id, marca] of Object.entries(MARCA)) assert.match(svg, marca, `${cuerpo}: ${id}`);
    assert.equal(imagenes(svg), 8, cuerpo);
    assert.doesNotMatch(svg, /<title>[^<]*(Encore|lote 06)/, `${cuerpo}: ningún título dice Encore`);
  }
});

test('En el recorte del rostro (sello «Rostro», cabecera, Connect) salen los pendientes y el lazo; los pines, las pulseras y el bolso, no', () => {
  const cara = dibujarAvatar(leerReceta(lote06()), { encuadre: 'rostro' });
  assert.match(cara, MARCA[PE]);
  assert.match(cara, MARCA[LA]);
  for (const id of [PI, PU, BR]) assert.doesNotMatch(cara, MARCA[id], id);
});

// Con base de datos: guardar y recargar con una cuenta nueva, sin canjear nada.
let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_e06`, alias: `fan_${sufijo}_e06` };
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
    await consulta(`DELETE FROM sesiones WHERE sess->>'usuarioId' IN (SELECT id::text FROM usuarios WHERE usuario = $1)`, [A.usuario]);
    await consulta('DELETE FROM usuarios WHERE usuario = $1', [A.usuario]);
  } finally { await new Promise((ok) => servidor.close(ok)); await cerrarPool(); }
});

function navegador() {
  let cookie = '';
  async function pedir(ruta, { metodo = 'GET', datos, json, html = false } = {}) {
    const cabeceras = { cookie, accept: html || datos ? 'text/html' : 'application/json' };
    if (json) cabeceras['content-type'] = 'application/json';
    if (datos) cabeceras['content-type'] = 'application/x-www-form-urlencoded';
    const res = await fetch(base + ruta, { method: metodo, redirect: 'manual', headers: cabeceras, body: json ? JSON.stringify(json) : datos ? new URLSearchParams(datos).toString() : undefined });
    const c = res.headers.get('set-cookie'); if (c) cookie = c.split(';')[0];
    const texto = await res.text();
    let cuerpo = null; try { cuerpo = JSON.parse(texto); } catch { /* HTML */ }
    return { estado: res.status, html: texto, cuerpo };
  }
  const token = async () => /name="_csrf" value="([a-f0-9]+)"/.exec((await pedir(cookie ? '/mi-kme' : '/entrar', { html: true })).html)[1];
  return {
    pedir,
    enviar: async (ruta, datos) => pedir(ruta, { metodo: 'POST', datos: { _csrf: await token(), ...datos } }),
    api: async (ruta, json) => pedir(ruta, { metodo: 'POST', json: { _csrf: await token(), ...json } }),
  };
}

test('Con base de datos', { skip: !hayConfiguracion() && 'falta app/.env.local' }, async (t) => {
  await t.test('una cuenta sin canjes guarda un avatar con todo el lote 06, lo recupera tal cual, y su sello «Rostro» lleva los pendientes y el lazo', async () => {
    const nav = navegador();
    assert.equal((await nav.enviar('/entrar', { usuario: A.usuario, password })).estado, 302);
    const receta = lote06('amplio');
    const r = await nav.api('/studio/avatares', { nombre: 'Lote 06', receta });
    assert.equal(r.estado, 201);
    const leida = (await nav.pedir(`/studio/avatares/${r.cuerpo.id}`)).cuerpo.receta;
    assert.deepEqual([leida.cuerpo, leida.ropa.arriba, leida.ropa.abajo, leida.accesorio, leida.accesoriosExtra],
      ['amplio', receta.ropa.arriba, receta.ropa.abajo, LA, [PE, PU, PI, BR]]);
    const sello = await nav.enviar('/studio/sellos', { nombre: 'Sello lote 06', borde: 'negro', fondo: 'blanco', palabra: 'amor', color_palabra: 'fucsia', avatar: r.cuerpo.id, encuadre: 'rostro', mostrar_alias: 'si', color_alias: 'negro', motivo1: '', color_motivo1: 'negro', motivo2: '', color_motivo2: 'negro', motivo3: '', color_motivo3: 'negro' });
    assert.equal(sello.estado, 302);
    const pagina = (await nav.pedir('/studio/sellos', { html: true })).html;
    assert.match(pagina, MARCA[PE], 'el sello en «Mis sellos», con los pendientes');
    assert.doesNotMatch(pagina, MARCA[BR], 'sin el bolso');
  });
});
