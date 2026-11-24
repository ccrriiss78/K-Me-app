import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { leer } from '../js/utilidades.js';

const url = new URL('../datos/kme.json', import.meta.url);
// Un catálogo ausente cuenta como colección vacía: el rojo expresa qué falta.
async function datos() {
  try { return JSON.parse(await readFile(url, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return { piezas: {}, bases: [] }; throw error; }
}
test('Hay tres bases completas y tres piezas distintas de rostro, cuerpo, cejas, mejillas, cabello, boca, ropa y accesorios', async () => {
  const d = await datos();
  assert.equal(d.bases.length, 3, 'Faltan las tres bases revisables');
  for (const ruta of ['rostro', 'cuerpo', 'cejas', 'maquillaje.mejillas', 'pelo.estilo', 'boca', 'ropa.arriba', 'ropa.abajo', 'accesorio']) {
    assert.ok(d.piezas[ruta]?.filter(p => Object.keys(p.capas).length).length >= 3, `Faltan opciones: ${ruta}`);
    assert.equal(new Set(d.piezas[ruta].map(p => p.id)).size, d.piezas[ruta].length, `IDs repetidos: ${ruta}`);
  }
});
test('Cada familia de ojos ofrece abiertos, cerrados y guiño a ambos lados, con dibujos diferentes', async () => {
  const d = await datos();
  for (const familia of ['redondos', 'almendrados', 'alargados']) {
    const dibujos = [];
    for (const expresion of ['abiertos', 'cerrados', 'guino-izquierdo', 'guino-derecho']) {
      const p = d.piezas['ojos.estilo']?.find(p => p.id === `${familia}-${expresion}`);
      assert.ok(p, `Faltan ${familia} ${expresion}`);
      dibujos.push(await readFile(new URL(p.capas.ojos, url), 'utf8'));
    }
    assert.equal(new Set(dibujos).size, 4);
  }
});
test('Todas las piezas encajan en el lienzo del editor y no introducen scripts ni recursos externos', async () => {
  const d = await datos();
  assert.deepEqual(d.lienzo, { ancho: 400, alto: 480 });
  const archivos = new Set(Object.values(d.piezas).flatMap(lista => lista.flatMap(p => Object.values(p.capas).flat())));
  assert.ok(archivos.size > 35);
  for (const archivo of archivos) {
    const svg = await readFile(new URL(archivo, url), 'utf8');
    assert.match(svg, /viewBox="0 0 400 480"/, archivo);
    // Desde el lote collage 01 (D067), una pieza puede llevar texturas: solo como <image> con un PNG
    // incrustado en base64 (nunca un archivo ni una dirección de fuera). Lo demás sigue prohibido.
    const sinTexturas = svg.replace(/<image\b[^>]*\shref="data:image\/png;base64,[A-Za-z0-9+/]+={0,2}"[^>]*\/>/g, '');
    assert.doesNotMatch(sinTexturas, /<script|<foreignObject|<image\b|\bon\w+\s*=|(?:href|src)\s*=/i, archivo);
    assert.match(svg, /<title>.+<\/title>/, archivo);
  }
});
test('El renderizador existente monta las tres bases y todas las opciones, conservando el orden de capas', async () => {
  const d = await datos();
  assert.equal(d.bases.length, 3);
  const archivos = new Map();
  for (const lista of Object.values(d.piezas)) for (const p of lista) for (const capa in p.capas) {
    p.capas[capa] = [p.capas[capa]].flat();
    for (const archivo of p.capas[capa]) {
      const svg = await readFile(new URL(archivo, url), 'utf8');
      archivos.set(archivo, svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>')));
    }
  }
  const c = new Catalogo(d, archivos);
  for (const base of d.bases) {
    for (const ruta of c.rutas()) assert.ok(c.pieza(ruta, leer(base.avatar, ruta)), `${base.nombre}: ${ruta}`);
    const svg = svgDelAvatar(c, base.avatar);
    let anterior = -1;
    for (const capa of c.capas) {
      if (!c.contenido(base.avatar)[capa.id]) continue;
      const indice = svg.indexOf(c.contenido(base.avatar)[capa.id]);
      assert.ok(indice > anterior, `Orden incorrecto: ${capa.id}`);
      anterior = indice;
    }
    assert.doesNotMatch(svg, /undefined|NaN/);
  }
  for (const ruta of c.rutas()) for (const p of c.piezas(ruta)) {
    const contenido = c.contenido(d.porDefecto);
    for (const capa of Object.keys(p.capas)) assert.ok(c.capas.some(x => x.id === capa));
    assert.ok(contenido);
  }
});
