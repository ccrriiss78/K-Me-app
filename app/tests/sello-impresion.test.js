// Pruebas de imprimir y descargar el sello (D045, T035; E0073):
// - photocard de 55 × 85 mm con el sello entero, sin recortarlo ni estirarlo;
// - PDF A4 con la tarjeta centrada y guías de corte, hecho con la misma función que el editor de
//   avatar (copiada a la app: debe dar los mismos bytes);
// - PNG a 300 ppp; nombre del archivo a partir del nombre del sello, sin símbolos;
// - en el editor del sello, «Imprimir», «Photocard 55 × 85 mm (PDF)» y «Descargar PNG», que
//   necesitan JavaScript (sin él, un aviso).
// Las primeras no necesitan base de datos; la última, sí (app/.env.local).
// Ejecutar desde app/:  npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  FORMATO, PIXELES, svgSelloPhotocard, crearPdfPhotocard, nombreArchivo,
} from '../public/js/kme-photocard.js';
import * as editor from '../../editor-avatar/editor-avatar/js/kme-impresion.js';

// Un sello como el que pinta _sello.ejs (lienzo 354 × 507), con su clase y su ancho de pantalla.
const SELLO = '<svg class="sello sello--editor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 354 507" width="300" role="img" aria-label="Sello de prueba">'
  + '<rect width="354" height="507" rx="56" fill="#000000"/><g data-parte="palabra"><text x="177" y="200">사랑</text></g></svg>';
// Una imagen JPEG mínima (los bytes de inicio y fin), como en los tests del editor.
const JPEG = new Uint8Array([255, 216, 255, 224, 0, 2, 255, 217]);
const latin1 = (bytes) => Buffer.from(bytes).toString('latin1');

test('La photocard del sello mide 55 × 85 mm y la imagen se prepara a 300 ppp (650 × 1004 píxeles)', () => {
  assert.deepEqual(FORMATO, { id: '55x85', ancho: 55, alto: 85 });
  assert.deepEqual(PIXELES, { ancho: 650, alto: 1004 });
});

test('La photocard lleva el sello entero, centrado y sin recortarlo ni estirarlo', () => {
  const svg = svgSelloPhotocard(SELLO);
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="55mm" height="85mm" viewBox="0 0 550 850"/);
  const interior = /<svg x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"[^>]*>/.exec(svg);
  assert.ok(interior, 'falta el sello dentro de la tarjeta');
  const [x, y, ancho, alto] = interior.slice(1).map(Number);
  assert.match(interior[0], /viewBox="0 0 354 507"/, 'conserva el lienzo entero del sello');
  assert.match(interior[0], /preserveAspectRatio="xMidYMid meet"/);
  assert.doesNotMatch(interior[0], /class=|width="300"/, 'sin la clase ni el ancho de la pantalla');
  assert.ok(Math.abs(ancho / alto - 354 / 507) < 0.005, 'sin estirar');
  assert.ok(x >= 12 && y >= 12 && x + ancho <= 538 && y + alto <= 838, 'cabe con margen');
  assert.ok(Math.abs(x * 2 + ancho - 550) < 0.5 && Math.abs(y * 2 + alto - 850) < 0.5, 'centrado');
  assert.match(svg, /data-parte="palabra"/);
  assert.match(svg, /사랑/);
});

test('Sin un sello válido no se prepara ninguna photocard', () => {
  assert.throws(() => svgSelloPhotocard(''));
  assert.throws(() => svgSelloPhotocard('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'), /sello/i);
  assert.throws(() => crearPdfPhotocard(new Uint8Array(), { hojaA4: true, anchoPx: 650, altoPx: 1004 }));
});

test('El PDF A4 lleva la tarjeta de 55 × 85 mm centrada, con guías de corte y el aviso de imprimir al 100 %', () => {
  const pdf = latin1(crearPdfPhotocard(JPEG, { formato: '55x85', hojaA4: true, anchoPx: 650, altoPx: 1004 }));
  assert.ok(pdf.startsWith('%PDF-1.4'));
  const caja = /\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/.exec(pdf);
  assert.ok(Math.abs(Number(caja[1]) * 25.4 / 72 - 210) < 0.001 && Math.abs(Number(caja[2]) * 25.4 / 72 - 297) < 0.001, 'hoja A4');
  assert.match(pdf, /\/Width 650 \/Height 1004/);
  assert.match(pdf, /% guias-corte/);
  assert.match(pdf, /55 x 85 mm \| Imprimir al 100%/);
});

test('El PDF de la app es idéntico, byte a byte, al del editor de avatar (la misma función copiada, D045)', () => {
  for (const hojaA4 of [false, true]) {
    const opciones = { formato: '55x85', hojaA4, anchoPx: 650, altoPx: 1004 };
    assert.ok(Buffer.from(crearPdfPhotocard(JPEG, opciones)).equals(Buffer.from(editor.crearPdfPhotocard(JPEG, opciones))), `hoja A4: ${hojaA4}`);
  }
});

test('El nombre del archivo sale del nombre del sello, sin acentos, símbolos ni carpetas', () => {
  assert.equal(nombreArchivo('Mi sello ✦ Amor', 'pdf'), 'kme-sello-mi-sello-amor-55x85.pdf');
  assert.equal(nombreArchivo('Corazón', 'png'), 'kme-sello-corazon-55x85.png');
  assert.equal(nombreArchivo('../../secreto', 'png'), 'kme-sello-secreto-55x85.png');
  assert.equal(nombreArchivo('', 'png'), 'kme-sello-55x85.png');
  assert.equal(nombreArchivo(undefined, 'pdf'), 'kme-sello-55x85.pdf');
});

// --- La página del editor del sello (con base de datos) ---

let servidor, base, cerrarPool, consulta;
const sufijo = crypto.randomBytes(4).toString('hex');
const password = 'Prueba-' + crypto.randomBytes(6).toString('hex');
const A = { usuario: `test_${sufijo}_imp`, alias: `fan_${sufijo}_imp` };

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
    await consulta('DELETE FROM usuarios WHERE usuario = $1', [A.usuario]); // borra también sus sellos
  } finally {
    await new Promise((ok) => servidor.close(ok));
    await cerrarPool();
  }
});

test('El editor del sello ofrece imprimir y descargar', { skip: !hayConfiguracion() && 'falta app/.env.local' }, async (t) => {
  let cookie = '';
  async function pedir(ruta, datos) {
    const res = await fetch(base + ruta, {
      method: datos ? 'POST' : 'GET', redirect: 'manual',
      headers: { cookie, ...(datos ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) },
      body: datos ? new URLSearchParams(datos).toString() : undefined,
    });
    const c = res.headers.get('set-cookie');
    if (c) cookie = c.split(';')[0];
    return { estado: res.status, destino: res.headers.get('location'), html: await res.text() };
  }
  const token = async () => /name="_csrf" value="([a-f0-9]+)"/.exec((await pedir(cookie ? '/mi-kme' : '/entrar')).html)[1];
  const enviar = async (ruta, datos) => pedir(ruta, { _csrf: await token(), ...datos });
  assert.equal((await enviar('/entrar', { usuario: A.usuario, password })).estado, 302);
  const guardado = await enviar('/studio/sellos', {
    nombre: 'Para imprimir', borde: 'negro', fondo: 'blanco', palabra: 'amor', color_palabra: 'fucsia',
    avatar: '', encuadre: 'rostro', mostrar_alias: 'si', color_alias: 'negro',
    motivo1: '', color_motivo1: 'negro', motivo2: '', color_motivo2: 'negro', motivo3: '', color_motivo3: 'negro',
  });
  const idSello = /^\/studio\/sellos\/(\d+)/.exec(guardado.destino ?? '')?.[1];
  assert.ok(idSello, 'se guarda el sello de prueba');

  for (const ruta of ['/studio/sellos/nuevo', `/studio/sellos/${idSello}`]) {
    await t.test(`${ruta}: los tres botones, ocultos hasta que arranca el script, y un aviso sin JavaScript`, async () => {
      const r = await pedir(ruta);
      assert.equal(r.estado, 200);
      // El bloque va justo antes de su aviso para cuando no hay JavaScript.
      const bloque = /<div class="sello-impresion"[\s\S]*?<\/noscript>/.exec(r.html)?.[0] ?? '';
      assert.match(bloque, /^<div class="sello-impresion" data-sello-impresion hidden>/, 'oculto sin JavaScript');
      for (const [accion, texto] of [['imprimir', 'Imprimir'], ['pdf', 'Photocard 55 × 85 mm (PDF)'], ['png', 'Descargar PNG']]) {
        assert.match(bloque, new RegExp(`<button type="button"[^>]*data-imprimir="${accion}"[^>]*>${texto.replace(/[()]/g, '\\$&')}</button>`));
      }
      assert.match(bloque, /<noscript><p class="nota">Para imprimir o descargar el sello hace falta JavaScript\.<\/p><\/noscript>$/);
      assert.match(r.html, /<script type="module" src="\/js\/sello-impresion\.js"><\/script>/);
    });
  }
  assert.ok(existsSync(fileURLToPath(new URL('../public/js/sello-impresion.js', import.meta.url))), 'falta el script del navegador');
});
