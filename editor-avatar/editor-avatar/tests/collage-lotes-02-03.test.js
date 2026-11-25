// Lotes collage 02 y 03 (D067; entregas de ChatGPT del 25/11/2026, integradas por Claude en E0080):
// - lote 02: el gorro de punto (accesorio), con su propio color de la paleta en un campo NUEVO de la
//   receta, «colorGorro» (lavanda por defecto): las recetas anteriores se completan solas y no cambian;
// - lote 03: el Top Destello (ropa superior), el halter actual con lentejuelas, una variante por
//   cuerpo; usa el color de la ropa de arriba. El halter original no cambia.
// Se reutiliza lo del lote 01: texturas PNG incrustadas, ids «collage-…» únicos en cada dibujo y
// miniatura propia.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { seleccionarPiezaKme } from '../js/kme-ropa.js';
import { normalizarAvatar } from '../js/estado.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { documentoVisual } from './helpers/dom-visual.js';

const url = new URL('../datos/kme.json', import.meta.url);
const anteriores = JSON.parse(await readFile(new URL('./collage-ids-anteriores.json', import.meta.url), 'utf8'));
const VARIANTE = { relajado: 'delgado', recto: 'medio', amplio: 'grueso' };
const TOPS = Object.fromEntries(Object.entries(VARIANTE).map(([c, v]) => [c, `collage-top-lentejuelas-${v}`]));
const GORRO = 'collage-gorro-punto';
const ARCHIVOS = [
  '../assets/kme/accesorio/collage-gorro-punto.svg',
  ...Object.values(VARIANTE).map(v => `../assets/kme/ropa_arriba/collage-top-lentejuelas-${v}.svg`),
];

async function cargar() {
  const d = JSON.parse(await readFile(url, 'utf8')), archivos = new Map();
  for (const lista of Object.values(d.piezas)) for (const p of lista) for (const capa in p.capas) {
    p.capas[capa] = [p.capas[capa]].flat();
    for (const a of p.capas[capa]) {
      const s = await readFile(new URL(a, url), 'utf8');
      archivos.set(a, s.slice(s.indexOf('>') + 1, s.lastIndexOf('</svg>')));
    }
  }
  return new Catalogo(d, archivos);
}
const ids = (svg) => [...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
const referencias = (svg) => [...svg.matchAll(/url\(#([^)]+)\)|href="#([^"]+)"/g)].map(m => m[1] ?? m[2]);
function conGorroYTop(c, cuerpo, colorGorro = '#c5b1e3') {
  const a = structuredClone(c.porDefecto);
  seleccionarPiezaKme(c, a, 'ropa.arriba', TOPS[cuerpo]);
  seleccionarPiezaKme(c, a, 'accesorio', GORRO);
  a.colorGorro = colorGorro;
  return a;
}

test('Lotes 02 y 03: se añaden el gorro de punto y el Top Destello (uno por cuerpo); el halter y todo lo anterior siguen igual', async () => {
  const d = JSON.parse(await readFile(url, 'utf8'));
  for (const [ruta, lista] of Object.entries(anteriores.piezas)) for (const id of lista) assert.ok(d.piezas[ruta].some(p => p.id === id), `${ruta}: falta ${id}`);
  for (const [cuerpo, variante] of Object.entries(VARIANTE)) {
    const archivo = `../assets/kme/ropa_arriba/collage-top-lentejuelas-${variante}.svg`;
    assert.deepEqual(d.piezas['ropa.arriba'].find(p => p.id === TOPS[cuerpo]), {
      id: TOPS[cuerpo], nombre: `Top Destello · ${variante}`, coleccion: 'collage-03', familia: 'collage-top-lentejuelas',
      cuerpoCompatible: cuerpo, perfilIntegrado: true, topCorto: true, ocultaCapas: ['cuerpo'],
      gruposPorCapa: { anatomia: 'perfil', torso: 'torso', ropa_arriba: 'superior' },
      capas: { anatomia: archivo, torso: archivo, ropa_arriba: archivo, piernas: `../assets/kme/cuerpo/${cuerpo}.svg` },
    });
    const halter = d.piezas['ropa.arriba'].find(p => p.id === `top-halter-arriba-${variante}`);
    assert.equal(halter.capas.ropa_arriba, `../assets/kme/ropa_arriba/top-halter-${variante}.svg`, 'el halter original no cambia');
  }
  assert.deepEqual(d.piezas.accesorio.find(p => p.id === GORRO), {
    // «ranura: gorro» (D071): se combina con los demás accesorios y se dibuja debajo de todos.
    id: GORRO, nombre: 'Gorro de punto', coleccion: 'collage-02', zona: 'cabeza', ranura: 'gorro', rutaColor: 'colorGorro', tituloColor: 'Color del gorro',
    miniatura: { recorte: '70 10 260 150', capas: ['accesorio'] },
    capas: { accesorio: '../assets/kme/accesorio/collage-gorro-punto.svg' },
  });
  assert.equal(d.porDefecto.colorGorro, '#c5b1e3', 'color nuevo, lavanda por defecto');
  assert.ok(d.paletas.arriba.includes('#c5b1e3'), 'el color por defecto es de la paleta de la ropa');
});

test('Las piezas de los lotes solo incrustan PNG pequeños, sin enlaces externos ni scripts, con ids «collage-»', async () => {
  for (const archivo of ARCHIVOS) {
    const svg = await readFile(new URL(archivo, url), 'utf8');
    assert.match(svg, /viewBox="0 0 400 480"/);
    assert.match(svg, /<title>.+<\/title>/);
    assert.doesNotMatch(svg, /<script|<foreignObject|\bon\w+\s*=|\ssrc\s*=|https?:\/\/(?!www\.w3\.org)/i, archivo);
    for (const [, enlace] of svg.matchAll(/href="([^"]*)"/g)) {
      const png = Buffer.from(/^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(enlace)?.[1] ?? '', 'base64');
      assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${archivo}: solo PNG incrustados`);
      assert.ok(png.length <= 20 * 1024 && png.readUInt32BE(16) <= 256 && png.readUInt32BE(20) <= 256, archivo);
    }
    for (const id of ids(svg)) assert.match(id, /^collage-/, `${archivo}: id ${id}`);
  }
});

test('El top lleva el color de la ropa de arriba y el gorro, su propio color; una receta anterior se completa sin cambiar', async () => {
  const c = await cargar();
  for (const cuerpo of Object.keys(VARIANTE)) {
    const a = conGorroYTop(c, cuerpo, '#557a9d');
    a.ropa.colorArriba = '#e83475';
    const svg = svgDelAvatar(c, a);
    assert.match(svg, /data-parte="tejido-collage"/, `${cuerpo}: lentejuelas`);
    assert.match(svg, /\.f-arriba\{fill:#e83475\}/);
    assert.match(svg, /\.f-gorro-collage\{fill:#557a9d\}/, 'el gorro tiene su color, no el de la camiseta');
    assert.equal((svg.match(/<image\b/g) ?? []).length, 3, 'dos texturas en el top y una en el gorro');
  }
  const antigua = structuredClone(anteriores.porDefectoAnterior);
  const normal = normalizarAvatar(antigua, c.porDefecto);
  assert.equal(normal.colorGorro, '#c5b1e3');
  for (const k of Object.keys(antigua)) assert.deepEqual(normal[k], antigua[k], `${k} no cambia`);
});

test('Varios avatares con el gorro y el top en una página no repiten ids, y cada referencia es de su propio dibujo', async () => {
  const c = await cargar();
  const dibujos = Object.keys(VARIANTE).flatMap(cuerpo => [svgDelAvatar(c, conGorroYTop(c, cuerpo)), svgDelAvatar(c, conGorroYTop(c, cuerpo), { estilos: false })]);
  const todos = dibujos.flatMap(ids);
  assert.equal(new Set(todos).size, todos.length);
  for (const svg of dibujos) {
    const propios = new Set(ids(svg));
    for (const ref of referencias(svg)) assert.ok(propios.has(ref), `#${ref}`);
  }
});

test('En el editor: el top en «Parte superior» de su cuerpo, el gorro en «Accesorio» con su miniatura, y su color en la paleta solo con el gorro puesto', async () => {
  const c = await cargar(), doc = documentoVisual(), vista = montarEditorVisual(doc, c);
  // Desde E0083, las piezas especiales están solo en la pestaña Colección «K».
  doc.buscar('Categoría: Ropa').click();
  assert.equal(doc.buscar('Parte superior: Top Destello · delgado'), undefined, 'no sale en «Ropa»');
  doc.buscar('Categoría: Colección «K»').click();
  const cuerpo = vista.estado.avatar.cuerpo;
  assert.equal(doc.buscar('Color del gorro: Lavanda'), undefined, 'sin gorro, no se ofrece su color');
  doc.buscar(`Parte superior: Top Destello · ${VARIANTE[cuerpo]}`).click();
  assert.equal(vista.estado.avatar.ropa.arriba, TOPS[cuerpo]);
  const gorro = doc.buscar('Accesorio: Gorro de punto');
  assert.match(gorro.innerHTML, /viewBox="70 10 260 150"/);
  gorro.click();
  assert.equal(vista.estado.avatar.accesorio, GORRO);
  const azul = doc.buscar('Color del gorro: ' + c.datos.nombresColor['#557a9d']);
  assert.ok(azul, 'con el gorro puesto, su color se elige con la paleta de la ropa');
  azul.click();
  assert.equal(vista.estado.avatar.colorGorro, '#557a9d');
  assert.equal(vista.estado.avatar.ropa.colorArriba, structuredClone(c.porDefecto).ropa.colorArriba, 'la camiseta no cambia');
});
