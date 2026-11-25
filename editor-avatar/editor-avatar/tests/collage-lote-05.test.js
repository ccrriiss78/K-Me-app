// Lote collage 05, alternativa MVP (D067; entrega de ChatGPT del 25/11/2026, elegida por la autora
// en E0082): la falda con botas de piel negras, ropa inferior NUEVA, una variante por cuerpo, con el
// mismo mecanismo que las faldas con piernas: sus piernas, con las botas, sustituyen a las del
// cuerpo (sin dejar debajo el calzado anterior). La falda usa ropa.colorAbajo; las botas, negras.
// El selector de calzado independiente NO se construye (queda para después del 1/12).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { seleccionarPiezaKme } from '../js/kme-ropa.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { documentoVisual } from './helpers/dom-visual.js';

const url = new URL('../datos/kme.json', import.meta.url);
const VARIANTE = { relajado: 'delgado', recto: 'medio', amplio: 'grueso' };
const FALDAS = Object.fromEntries(Object.entries(VARIANTE).map(([c, v]) => [c, `collage-falda-botas-piel-${v}`]));
async function cargar() {
  const d = JSON.parse(await readFile(url, 'utf8')), archivos = new Map();
  for (const lista of Object.values(d.piezas)) for (const p of lista) for (const capa in p.capas) {
    p.capas[capa] = [p.capas[capa]].flat();
    for (const a of p.capas[capa]) { const s = await readFile(new URL(a, url), 'utf8'); archivos.set(a, s.slice(s.indexOf('>') + 1, s.lastIndexOf('</svg>'))); }
  }
  return new Catalogo(d, archivos);
}
const ids = (svg) => [...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
// El grupo <g data-capa="nombre"> completo, con los grupos que lleve dentro.
function grupo(svg, nombre) {
  const inicio = svg.search(new RegExp(`<g\\b[^>]*data-capa="${nombre}"`));
  if (inicio < 0) return '';
  const etiquetas = /<\/?g\b[^>]*>/g;
  etiquetas.lastIndex = inicio;
  let profundidad = 0, e;
  while ((e = etiquetas.exec(svg))) {
    profundidad += e[0].startsWith('</') ? -1 : e[0].endsWith('/>') ? 0 : 1;
    if (profundidad === 0) return svg.slice(inicio, etiquetas.lastIndex);
  }
  return '';
}

test('Lote 05 (MVP): la falda con botas de piel entra como tres ids nuevos de ropa inferior; las faldas anteriores no cambian', async () => {
  const d = JSON.parse(await readFile(url, 'utf8'));
  for (const [cuerpo, variante] of Object.entries(VARIANTE)) {
    const archivo = `../assets/kme/ropa_abajo/collage-falda-botas-piel-${variante}.svg`;
    assert.deepEqual(d.piezas['ropa.abajo'].find(p => p.id === FALDAS[cuerpo]), {
      id: FALDAS[cuerpo], nombre: `Falda con botas de piel · ${variante}`, familia: 'collage-falda-botas-piel', coleccion: 'collage-05',
      cuerpoCompatible: cuerpo, cinturaY: 350, reemplazaCapas: ['piernas'],
      gruposPorCapa: { piernas: 'piernas', ropa_abajo: 'prenda' },
      capas: { piernas: archivo, ropa_abajo: archivo },
    });
    assert.equal(d.piezas['ropa.abajo'].find(p => p.id === `falda-integrada-${variante}`).capas.ropa_abajo, `../assets/kme/ropa_abajo/falda-integrada-${variante}.svg`);
    assert.equal(d.piezas['ropa.abajo'].find(p => p.id === `collage-falda-bolsillos-${variante}`).capas.ropa_abajo, `../assets/kme/ropa_abajo/collage-falda-bolsillos-${variante}.svg`);
  }
  assert.ok(!d.piezas.calzado && !('calzado' in d.porDefecto), 'no se crea un selector de calzado');
});

test('Sus dibujos solo incrustan PNG pequeños, sin enlaces externos ni scripts, con ids «collage-»', async () => {
  for (const variante of Object.values(VARIANTE)) {
    const svg = await readFile(new URL(`../assets/kme/ropa_abajo/collage-falda-botas-piel-${variante}.svg`, url), 'utf8');
    assert.match(svg, /viewBox="0 0 400 480"/);
    assert.doesNotMatch(svg, /<script|<foreignObject|\bon\w+\s*=|\ssrc\s*=|https?:\/\/(?!www\.w3\.org)/i);
    for (const [, enlace] of svg.matchAll(/href="([^"]*)"/g)) {
      const png = Buffer.from(/^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(enlace)?.[1] ?? '', 'base64');
      assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      assert.ok(png.length <= 20 * 1024 && png.readUInt32BE(16) <= 256 && png.readUInt32BE(20) <= 256);
    }
    for (const id of ids(svg)) assert.match(id, /^collage-/);
  }
});

test('Con cada cuerpo, las botas sustituyen al calzado anterior, la falda lleva el color de abajo y las botas siguen negras', async () => {
  const c = await cargar();
  for (const cuerpo of Object.keys(VARIANTE)) {
    const a = structuredClone(c.porDefecto);
    seleccionarPiezaKme(c, a, 'ropa.abajo', FALDAS[cuerpo]);
    a.ropa.colorAbajo = '#c5b1e3';
    assert.equal(a.cuerpo, cuerpo);
    const piernas = c.contenido(a).piernas;
    assert.match(piernas, /data-capa="calzado"/, `${cuerpo}: las botas van con las piernas`);
    assert.match(piernas, /data-parte="bota-izquierdo"/);
    // Sin el calzado anterior debajo: una sola marca de calzado, la de las botas nuevas, dentro de
    // su grupo, y ni rastro de la trayectoria de los zapatos de la falda de siempre.
    assert.equal((piernas.match(/data-parte="calzado"/g) ?? []).length, 1, `${cuerpo}: una sola marca de calzado`);
    assert.match(grupo(piernas, 'calzado'), /data-parte="calzado"/, `${cuerpo}: la marca es la de las botas`);
    const antigua = await readFile(new URL(`../assets/kme/ropa_abajo/falda-integrada-${VARIANTE[cuerpo]}.svg`, url), 'utf8');
    const zapatos = /<path data-parte="calzado"[^>]*\sd="([^"]+)"/.exec(antigua)?.[1] ?? /<path[^>]*\sd="([^"]+)"[^>]*data-parte="calzado"/.exec(antigua)?.[1];
    assert.ok(zapatos, 'la falda de siempre tiene sus zapatos');
    assert.ok(!piernas.includes(zapatos), `${cuerpo}: sin los zapatos antiguos`);
    const svg = svgDelAvatar(c, a);
    assert.match(svg, /\.f-abajo\{fill:#c5b1e3\}/);
    assert.doesNotMatch(svg, /\.f-calzado-collage\{/, 'las botas no toman ningún color de la receta');
    assert.match(svg, /class="f-calzado-collage" fill="#282126"/);
    assert.equal((svg.match(/<image\b/g) ?? []).length, 2);
  }
});

test('Varios avatares con la falda con botas en una página no repiten ids, y cada referencia es de su propio dibujo', async () => {
  const c = await cargar();
  const dibujos = Object.keys(VARIANTE).flatMap(cuerpo => {
    const a = structuredClone(c.porDefecto); seleccionarPiezaKme(c, a, 'ropa.abajo', FALDAS[cuerpo]);
    return [svgDelAvatar(c, a), svgDelAvatar(c, a)];
  });
  const todos = dibujos.flatMap(ids);
  assert.equal(new Set(todos).size, todos.length);
  for (const svg of dibujos) {
    const propios = new Set(ids(svg));
    for (const [, ref] of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(propios.has(ref), ref);
  }
});

test('En el editor, sale en «Parte inferior» de su cuerpo, con falda y botas en la miniatura, y se elige', async () => {
  const c = await cargar(), doc = documentoVisual(), vista = montarEditorVisual(doc, c);
  doc.buscar('Categoría: Colección «K»').click(); // las especiales, solo en Colección «K» (E0083)
  const cuerpo = vista.estado.avatar.cuerpo;
  const boton = doc.buscar(`Parte inferior: Falda con botas de piel · ${VARIANTE[cuerpo]}`);
  assert.ok(boton);
  assert.match(boton.innerHTML, /data-parte="bota-izquierdo"/);
  assert.match(boton.innerHTML, /data-parte="prenda"/);
  boton.click();
  assert.equal(vista.estado.avatar.ropa.abajo, FALDAS[cuerpo]);
});
