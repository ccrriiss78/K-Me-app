// Lote collage 04 (D067; entrega de ChatGPT del 25/11/2026, integrada por Claude en E0081):
// la Chaqueta Denim Collage, ropa superior NUEVA, una variante por cuerpo, sobre la silueta de
// Denim Layer (que no cambia). Usa el color de la ropa de arriba y el vaquero del lote 01.
// Se reutiliza lo resuelto antes: PNG incrustados, ids «collage-…» únicos por dibujo y el ajuste
// del bajo a la cintura elegida (350 o 370), que también mueve el recorte de la textura.
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
const CHAQUETAS = Object.fromEntries(Object.entries(VARIANTE).map(([c, v]) => [c, `collage-chaqueta-denim-${v}`]));
async function cargar() {
  const d = JSON.parse(await readFile(url, 'utf8')), archivos = new Map();
  for (const lista of Object.values(d.piezas)) for (const p of lista) for (const capa in p.capas) {
    p.capas[capa] = [p.capas[capa]].flat();
    for (const a of p.capas[capa]) { const s = await readFile(new URL(a, url), 'utf8'); archivos.set(a, s.slice(s.indexOf('>') + 1, s.lastIndexOf('</svg>'))); }
  }
  return new Catalogo(d, archivos);
}
const ids = (svg) => [...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
const maxY = (d) => Math.max(...d.match(/-?\d*\.?\d+/g).map(Number).filter((_, i) => i % 2));

test('Lote 04: la Chaqueta Denim Collage entra como tres ids nuevos, uno por cuerpo; Denim Layer no cambia', async () => {
  const d = JSON.parse(await readFile(url, 'utf8'));
  for (const [cuerpo, variante] of Object.entries(VARIANTE)) {
    const archivo = `../assets/kme/ropa_arriba/collage-chaqueta-denim-${variante}.svg`;
    assert.deepEqual(d.piezas['ropa.arriba'].find(p => p.id === CHAQUETAS[cuerpo]), {
      id: CHAQUETAS[cuerpo], nombre: `Chaqueta Denim Collage · ${variante}`, coleccion: 'collage-04', familia: 'collage-chaqueta-denim',
      cuerpoCompatible: cuerpo, perfilIntegrado: true, topCorto: false, ocultaCapas: ['cuerpo'],
      gruposPorCapa: { anatomia: 'perfil', torso: 'torso', ropa_arriba: 'superior' },
      capas: { anatomia: archivo, torso: archivo, ropa_arriba: archivo, piernas: `../assets/kme/cuerpo/${cuerpo}.svg` },
    });
    assert.equal(d.piezas['ropa.arriba'].find(p => p.id === `denim-layer-arriba-${variante}`).capas.ropa_arriba, `../assets/kme/ropa_arriba/denim-layer-${variante}.svg`);
  }
});

test('Sus dibujos solo incrustan PNG pequeños, sin enlaces externos ni scripts, con ids «collage-»', async () => {
  for (const variante of Object.values(VARIANTE)) {
    const svg = await readFile(new URL(`../assets/kme/ropa_arriba/collage-chaqueta-denim-${variante}.svg`, url), 'utf8');
    assert.match(svg, /viewBox="0 0 400 480"/);
    assert.match(svg, /<title>.+<\/title>/);
    assert.doesNotMatch(svg, /<script|<foreignObject|\bon\w+\s*=|\ssrc\s*=|https?:\/\/(?!www\.w3\.org)/i);
    for (const [, enlace] of svg.matchAll(/href="([^"]*)"/g)) {
      const png = Buffer.from(/^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(enlace)?.[1] ?? '', 'base64');
      assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      assert.ok(png.length <= 20 * 1024 && png.readUInt32BE(16) <= 256 && png.readUInt32BE(20) <= 256);
    }
    for (const id of ids(svg)) assert.match(id, /^collage-/);
  }
});

test('Con cada cuerpo y cada cintura (350 y 370), la chaqueta y su textura llegan a la cintura, con el color de arriba', async () => {
  const c = await cargar();
  for (const cuerpo of Object.keys(VARIANTE)) {
    const inferiores = c.piezas('ropa.abajo').filter(q => q.cuerpoCompatible === cuerpo);
    for (const cintura of [350, 370]) {
      const q = inferiores.find(p => (p.cinturaY || 350) === cintura);
      assert.ok(q, `${cuerpo}: hay una prenda con cintura ${cintura}`);
      const a = structuredClone(c.porDefecto);
      seleccionarPiezaKme(c, a, 'ropa.abajo', q.id);
      seleccionarPiezaKme(c, a, 'ropa.arriba', CHAQUETAS[cuerpo]);
      a.ropa.colorArriba = '#9673b7';
      const svg = svgDelAvatar(c, a);
      assert.equal(maxY(svg.match(/<path data-parte="prenda-superior" d="([^"]+)"/)[1]), cintura, `${cuerpo}/${q.id}: el bajo`);
      const recorte = svg.match(/<clipPath id="[^"]*collage-chaqueta-[a-z]+-recorte"><path d="([^"]+)"/)?.[1];
      assert.ok(recorte, 'la textura va recortada por la prenda');
      assert.equal(maxY(recorte), cintura, `${cuerpo}/${q.id}: la textura llega a la misma cintura`);
      assert.match(svg, /\.f-arriba\{fill:#9673b7\}/);
      assert.equal((svg.match(/<image\b/g) ?? []).length, 1);
    }
  }
});

test('Varios avatares con la chaqueta en una página no repiten ids, y cada referencia es de su propio dibujo', async () => {
  const c = await cargar();
  const dibujos = Object.keys(VARIANTE).flatMap(cuerpo => {
    const a = structuredClone(c.porDefecto); seleccionarPiezaKme(c, a, 'ropa.arriba', CHAQUETAS[cuerpo]);
    return [svgDelAvatar(c, a), svgDelAvatar(c, a)];
  });
  const todos = dibujos.flatMap(ids);
  assert.equal(new Set(todos).size, todos.length);
  for (const svg of dibujos) {
    const propios = new Set(ids(svg));
    for (const [, ref] of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(propios.has(ref), ref);
  }
});

test('En el editor, la chaqueta sale en «Parte superior» de su cuerpo, con su textura en la miniatura, y se elige', async () => {
  const c = await cargar(), doc = documentoVisual(), vista = montarEditorVisual(doc, c);
  doc.buscar('Categoría: Colección «K»').click(); // las especiales, solo en Colección «K» (E0083)
  const cuerpo = vista.estado.avatar.cuerpo;
  const boton = doc.buscar(`Parte superior: Chaqueta Denim Collage · ${VARIANTE[cuerpo]}`);
  assert.ok(boton);
  assert.match(boton.innerHTML, /<image\b/);
  boton.click();
  assert.equal(vista.estado.avatar.ropa.arriba, CHAQUETAS[cuerpo]);
});
