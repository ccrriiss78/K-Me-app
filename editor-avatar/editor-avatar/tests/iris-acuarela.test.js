import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';

const url = new URL('../datos/kme.json', import.meta.url);
const datos = JSON.parse(await readFile(url, 'utf8')), archivos = new Map();
for (const lista of Object.values(datos.piezas)) for (const pieza of lista) {
  for (const capa in pieza.capas) {
    pieza.capas[capa] = [pieza.capas[capa]].flat();
    for (const ruta of pieza.capas[capa]) {
      const svg = await readFile(new URL(ruta, url), 'utf8');
      archivos.set(ruta, svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>')));
    }
  }
}
const catalogo = new Catalogo(datos, archivos);
const pintar = (id, color = '#775d43') => {
  const avatar = structuredClone(catalogo.porDefecto);
  avatar.ojos = {estilo: id, color};
  return svgDelAvatar(catalogo, avatar, {soloCapas: ['ojos'], id: 'prueba-acuarela'});
};

test('El acabado E dibuja pigmento y borde irregular en cada iris abierto, también en los guiños de las tres formas', () => {
  for (const pieza of catalogo.piezas('ojos.estilo').filter(p => p.coleccion === 'kme-sugeridos')) {
    const svg = pintar(pieza.id);
    const cantidad = pieza.id.includes('cerrados') ? 0 : pieza.id.includes('abiertos') ? 2 : 1;
    assert.equal((svg.match(/data-acabado="acuarela-e"/g) || []).length, cantidad, pieza.id);
    if (cantidad) {
      assert.match(svg, /data-textura="borde-pigmentado"/);
      assert.match(svg, /data-textura="grano"/);
    }
  }
});

test('El iris acuarelado conserva exactamente pupila, brillo y línea de los ojos originales', () => {
  for (const pieza of catalogo.piezas('ojos.estilo').filter(p => p.coleccion === 'kme-sugeridos')) {
    const original = archivos.get(pieza.capas.ojos[0]), svg = pintar(pieza.id);
    for (const trazo of original.matchAll(/<path[^>]*(?:data-parte="(?:pupila-logo|linea-ojo)"|data-brillo=)[^>]*\/>/g)) {
      assert.ok(svg.includes(trazo[0]), pieza.id + ': se conserva ' + trazo[0]);
    }
    if (!pieza.id.includes('cerrados')) {
      assert.ok(svg.indexOf('data-textura="borde-pigmentado"') < svg.indexOf('data-parte="pupila-logo"'));
    }
  }
});

test('La textura admite toda la paleta, se exporta como vectores sin recursos externos y es estable al repintar', () => {
  for (const color of catalogo.paleta('ojos')) {
    const svg = pintar('kme-redondos-abiertos-estrella', color);
    assert.match(svg, /data-acabado="acuarela-e"/);
    assert.ok(svg.includes('.f-ojos{fill:' + color + '}'));
    for (const marca of svg.matchAll(/<(?:path|circle)[^>]*data-textura="[^"]+"[^>]*>/g)) {
      assert.match(marca[0], /class="f-ojos"/);
    }
    assert.doesNotMatch(svg, /<(?:image|filter|script|foreignObject)\b|url\(/);
    assert.equal(svg, pintar('kme-redondos-abiertos-estrella', color));
  }
});

test('Los ojos anteriores siguen mostrando sus trazos originales sin aplicarles la textura nueva', () => {
  for (const pieza of catalogo.piezas('ojos.estilo').filter(p => p.coleccion !== 'kme-sugeridos')) {
    const svg = pintar(pieza.id);
    assert.doesNotMatch(svg, /data-acabado="acuarela-e"/);
    assert.ok(svg.includes(archivos.get(pieza.capas.ojos[0])));
  }
});
