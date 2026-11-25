// Lote collage 01 en la app (D067; entrega de ChatGPT del 24/11/2026, integrada en E0079):
// la falda con bolsillos de tela y el lightstick de estudio, con texturas PNG incrustadas.
// - El servidor las acepta en una receta (están en el catálogo) y las devuelve igual.
// - En una página con varios avatares (Mi K-ME, Connect) no se repite ningún id: cada dibujo
//   numera los ids de sus patrones y recortes.
// - Los sellos con ese avatar llevan sus texturas, también en la vista previa (JSON).
// - El filtro de la vista previa del sello (public/js/svg-seguro.js) acepta solo PNG incrustados,
//   pequeños y válidos; rechaza enlaces externos y otros tipos.
// Las primeras pruebas no necesitan base de datos; las demás, sí (app/.env.local).
// Ejecutar desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { recetaPorDefecto } from '../src/services/avatarCatalogo.js';

const EDITOR = new URL('../../editor-avatar/editor-avatar/', import.meta.url);
const PIEZAS = [
  ...['delgado', 'medio', 'grueso'].flatMap((v) => [
    `assets/kme/ropa_abajo/collage-falda-bolsillos-${v}.svg`, `assets/kme/accesorio/collage-lightstick-estudio-${v}.svg`,
    `assets/kme/ropa_arriba/collage-top-lentejuelas-${v}.svg`, // lote 03
    `assets/kme/ropa_arriba/collage-chaqueta-denim-${v}.svg`, // lote 04
    `assets/kme/ropa_abajo/collage-falda-botas-piel-${v}.svg`, // lote 05 (MVP)
  ]),
  'assets/kme/accesorio/collage-gorro-punto.svg', // lote 02
];

// El filtro del navegador, cargado como lo carga la página (un script clásico que deja window.KME_SVG).
async function filtro() {
  const ventana = {};
  vm.runInNewContext(await readFile(new URL('../public/js/svg-seguro.js', import.meta.url), 'utf8'), { window: ventana, atob });
  return ventana.KME_SVG;
}
// Un PNG de mentira: firma, cabecera IHDR con su ancho y alto, y relleno hasta el tamaño pedido.
function png({ ancho = 16, alto = 16, bytes = 64 } = {}) {
  const b = Buffer.alloc(bytes);
  Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex').copy(b, 0);
  b.writeUInt32BE(ancho, 16);
  b.writeUInt32BE(alto, 20);
  return `data:image/png;base64,${b.toString('base64')}`;
}
const ids = (html) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const repetidos = (lista) => [...new Set(lista.filter((x, i) => lista.indexOf(x) !== i))];

test('El filtro de la vista previa acepta las texturas del lote: PNG incrustados, pequeños y válidos', async () => {
  const { pngIncrustadoValido } = await filtro();
  let texturas = 0;
  for (const pieza of PIEZAS) {
    const svg = await readFile(new URL(pieza, EDITOR), 'utf8');
    for (const [, href] of svg.matchAll(/href="([^"]+)"/g)) {
      assert.equal(pngIncrustadoValido(href), true, pieza);
      texturas++;
    }
  }
  assert.equal(texturas, 25, 'lote 01: 3 faldas con una y 3 lightsticks con dos; lote 02: el gorro, una; lote 03: 3 tops con dos; lote 04: 3 chaquetas con una; lote 05: 3 faldas con botas con dos');
  assert.equal(pngIncrustadoValido(png()), true, 'un PNG pequeño y bien formado');
});

test('El filtro rechaza enlaces externos, otros tipos de imagen, PNG demasiado grandes y datos que no son PNG', async () => {
  const { pngIncrustadoValido } = await filtro();
  const correcto = png().split(',')[1];
  for (const valor of [
    'https://ejemplo.com/textura.png', '/img/kpopi.svg', '#textura',
    `data:image/jpeg;base64,${correcto}`, `data:image/svg+xml;base64,${correcto}`,
    'data:image/png;base64,esto no es base64!', `data:image/png;base64,${Buffer.from('no es un png de verdad, solo texto').toString('base64')}`,
    png({ bytes: 21 * 1024 }), png({ ancho: 1024 }), png({ alto: 300 }), png({ ancho: 0 }), '', undefined,
  ]) {
    assert.equal(pngIncrustadoValido(valor), false, String(valor).slice(0, 40));
  }
});

test('El lightstick va en la mano: sale con el cuerpo entero, pero no en el recorte del rostro (cabecera, muro)', async () => {
  const { dibujarAvatar } = await import('../src/services/avatarCatalogo.js');
  const receta = { ...recetaPorDefecto(), cuerpo: 'recto', accesorio: 'collage-lightstick-estudio' };
  assert.match(dibujarAvatar(receta, { encuadre: 'cuerpo' }), /data-parte="agarre-collage"/);
  assert.doesNotMatch(dibujarAvatar(receta, { encuadre: 'rostro' }), /data-parte="agarre-collage"|<image\b/);
  // Los accesorios de la cabeza siguen saliendo en el rostro.
  assert.match(dibujarAvatar({ ...receta, accesorio: 'gafas' }, { encuadre: 'rostro' }), /gafas/i);
});

// --- Con la base de datos ---

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_col`, alias: `fan_${sufijo}_col` };

function hayConfiguracion() {
  return ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'SESSION_SECRET']
    .every((k) => process.env[k] && !process.env[k].startsWith('CAMBIAR_POR'));
}

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
    await consulta('DELETE FROM usuarios WHERE usuario = $1', [A.usuario]); // borra también sus avatares, sellos y publicaciones
  } finally {
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

test('Lote collage 01 en la app', { skip: !hayConfiguracion() && 'falta app/.env.local' }, async (t) => {
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

  const receta = { ...recetaPorDefecto(), cuerpo: 'recto' };
  receta.ropa = { ...receta.ropa, abajo: 'collage-falda-bolsillos-medio', arriba: 'camiseta-integrada-medio' };
  receta.accesorio = 'collage-lightstick-estudio';
  let idAvatar, idSello;

  await t.test('el servidor guarda un avatar con la falda con bolsillos y el lightstick, y lo devuelve igual; las recetas anteriores siguen valiendo', async () => {
    const r = await pedir('/studio/avatares', { metodo: 'POST', json: { _csrf: await token(), nombre: 'Collage', receta } });
    assert.equal(r.estado, 201);
    idAvatar = r.cuerpo.id;
    const guardada = (await consulta('SELECT composicion FROM avatares WHERE id = $1', [idAvatar])).rows[0].composicion;
    assert.equal(guardada.ropa.abajo, 'collage-falda-bolsillos-medio');
    assert.equal(guardada.accesorio, 'collage-lightstick-estudio');
    const antigua = await pedir('/studio/avatares', { metodo: 'POST', json: { _csrf: await token(), nombre: 'De siempre', receta: recetaPorDefecto() } });
    assert.equal(antigua.estado, 201);
  });

  await t.test('lotes 02 y 03: el servidor guarda el gorro con su color de la paleta y el Top Destello; rechaza un color de fuera; una receta sin colorGorro recibe la lavanda', async () => {
    const nueva = { ...recetaPorDefecto(), cuerpo: 'amplio', accesorio: 'collage-gorro-punto', colorGorro: '#557a9d' };
    nueva.ropa = { ...nueva.ropa, arriba: 'collage-top-lentejuelas-grueso', colorArriba: '#e83475', abajo: 'falda-integrada-grueso' };
    const r = await pedir('/studio/avatares', { metodo: 'POST', json: { _csrf: await token(), nombre: 'Gorro y destello', receta: nueva } });
    assert.equal(r.estado, 201);
    const guardada = (await consulta('SELECT composicion FROM avatares WHERE id = $1', [r.cuerpo.id])).rows[0].composicion;
    assert.equal(guardada.colorGorro, '#557a9d');
    assert.equal(guardada.ropa.arriba, 'collage-top-lentejuelas-grueso');
    const fuera = await pedir('/studio/avatares', { metodo: 'POST', json: { _csrf: await token(), nombre: 'Color inventado', receta: { ...nueva, colorGorro: '#123456' } } });
    assert.equal(fuera.estado, 400, 'solo colores del catálogo');
    const { colorGorro, ...sinCampo } = recetaPorDefecto();
    assert.ok(colorGorro, 'el campo existe por defecto');
    const vieja = await pedir('/studio/avatares', { metodo: 'POST', json: { _csrf: await token(), nombre: 'Receta de antes', receta: sinCampo } });
    assert.equal(vieja.estado, 201);
    assert.equal((await consulta('SELECT composicion FROM avatares WHERE id = $1', [vieja.cuerpo.id])).rows[0].composicion.colorGorro, '#c5b1e3');
    // Lote 04: la Chaqueta Denim Collage, con el color de arriba.
    const chaqueta = { ...nueva, ropa: { ...nueva.ropa, arriba: 'collage-chaqueta-denim-grueso', colorArriba: '#557a9d' } };
    const conChaqueta = await pedir('/studio/avatares', { metodo: 'POST', json: { _csrf: await token(), nombre: 'Chaqueta collage', receta: chaqueta } });
    assert.equal(conChaqueta.estado, 201);
    assert.equal((await consulta('SELECT composicion FROM avatares WHERE id = $1', [conChaqueta.cuerpo.id])).rows[0].composicion.ropa.arriba, 'collage-chaqueta-denim-grueso');
    // Lote 05 (MVP): la falda con botas de piel, con el color de abajo.
    const botas = { ...nueva, ropa: { ...nueva.ropa, abajo: 'collage-falda-botas-piel-grueso', colorAbajo: '#c5b1e3' } };
    const conBotas = await pedir('/studio/avatares', { metodo: 'POST', json: { _csrf: await token(), nombre: 'Falda con botas', receta: botas } });
    assert.equal(conBotas.estado, 201);
    const dibujo = (await import('../src/services/avatarCatalogo.js')).dibujarAvatar(guardada, { encuadre: 'cuerpo' });
    assert.match(dibujo, /\.f-gorro-collage\{fill:#557a9d\}/);
    assert.match(dibujo, /data-parte="tejido-collage"/);
  });

  await t.test('con ese avatar en el perfil, Mi K-ME (cabecera y cuerpo entero) lleva sus texturas y no repite ningún id', async () => {
    assert.equal((await enviar('/perfil/avatar', { avatar: idAvatar })).estado, 302);
    const mi = await pedir('/mi-kme');
    assert.match(mi.html, /<image\b[^>]*href="data:image\/png;base64,/);
    assert.deepEqual(repetidos(ids(mi.html)), []);
    assert.doesNotMatch(mi.html, /\sid="collage-/, 'los ids del lote llevan delante el del dibujo');
  });

  await t.test('dos publicaciones de Connect con ese avatar no repiten ningún id', async () => {
    for (let i = 0; i < 2; i++) {
      assert.equal((await enviar('/connect/publicaciones', { emocion: 'feliz', diseno: `avatar:${idAvatar}` })).estado, 302);
    }
    const muro = await pedir('/connect');
    assert.deepEqual(repetidos(ids(muro.html)), []);
  });

  await t.test('un sello con ese avatar de cuerpo entero lleva sus texturas, también en la vista previa, y la página carga el filtro antes que sello.js', async () => {
    const datos = {
      nombre: 'Sello collage', borde: 'negro', fondo: 'blanco', palabra: 'amor', color_palabra: 'fucsia',
      avatar: idAvatar, encuadre: 'cuerpo', mostrar_alias: 'si', color_alias: 'negro',
      motivo1: '', color_motivo1: 'negro', motivo2: '', color_motivo2: 'negro', motivo3: '', color_motivo3: 'negro',
    };
    const r = await enviar('/studio/sellos', datos);
    idSello = /^\/studio\/sellos\/(\d+)/.exec(r.destino ?? '')?.[1];
    assert.ok(idSello, 'se guarda el sello');
    const editor = await pedir(`/studio/sellos/${idSello}`);
    assert.match(editor.html, /<g data-parte="avatar">[\s\S]*?<image\b[^>]*href="data:image\/png;base64,/);
    assert.deepEqual(repetidos(ids(editor.html)), []);
    assert.match(editor.html, /<script src="\/js\/svg-seguro\.js" defer><\/script>\s*<script src="\/js\/sello\.js" defer><\/script>/);
    const { nombre, ...campos } = datos;
    const vista = await pedir(`/studio/sellos/vista-previa?${new URLSearchParams(campos)}`, { cabeceras: { accept: 'application/json' } });
    assert.equal(vista.estado, 200);
    assert.match(vista.cuerpo.svg, /<image\b[^>]*href="data:image\/png;base64,/);
    const { pngIncrustadoValido } = await filtro();
    for (const [, href] of vista.cuerpo.svg.matchAll(/<image\b[^>]*href="([^"]+)"/g)) assert.equal(pngIncrustadoValido(href), true, 'el filtro acepta la vista previa');
  });
});
