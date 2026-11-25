// Lote collage 01 (D067; entrega de ChatGPT del 24/11/2026, integrada por Claude en E0079):
// - dos piezas NUEVAS con detalle de material: la falda con bolsillos de tela (una variante por
//   cuerpo, como las demás prendas con piernas) y el lightstick de estudio (accesorio, colocado
//   según el cuerpo con indicePorCuerpo);
// - no desaparece ni cambia ninguna pieza anterior, ni porDefecto ni las bases;
// - las texturas van incrustadas como PNG pequeños (nada externo);
// - los ids internos de las piezas («collage-…») se vuelven únicos en cada dibujo, para que varios
//   avatares en una misma página no compartan patrones ni recortes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { seleccionarPiezaKme } from '../js/kme-ropa.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { documentoVisual } from './helpers/dom-visual.js';

const url = new URL('../datos/kme.json', import.meta.url);
const anteriores = JSON.parse(await readFile(new URL('./collage-ids-anteriores.json', import.meta.url), 'utf8'));
const FALDAS = { relajado: 'collage-falda-bolsillos-delgado', recto: 'collage-falda-bolsillos-medio', amplio: 'collage-falda-bolsillos-grueso' };
const VARIANTE = { relajado: 'delgado', recto: 'medio', amplio: 'grueso' };
const LIGHTSTICK = 'collage-lightstick-estudio';
// Cada variante del lightstick desplaza el grupo entero hasta la mano de su cuerpo (entrega de ChatGPT).
const DESPLAZAMIENTO = { relajado: 'translate(-47 15)', recto: 'translate(-39 15)', amplio: 'translate(-31 15)' };
const ARCHIVOS_NUEVOS = [
  ...Object.values(VARIANTE).map(v => `../assets/kme/ropa_abajo/collage-falda-bolsillos-${v}.svg`),
  ...Object.values(VARIANTE).map(v => `../assets/kme/accesorio/collage-lightstick-estudio-${v}.svg`),
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
const sha = (valor) => createHash('sha256').update(JSON.stringify(valor)).digest('hex');
const ids = (svg) => [...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
const referencias = (svg) => [...svg.matchAll(/url\(#([^)]+)\)|href="#([^"]+)"/g)].map(m => m[1] ?? m[2]);
// Un avatar con la falda nueva para ese cuerpo y el lightstick.
function avatarCollage(c, cuerpo) {
  const a = structuredClone(c.porDefecto);
  seleccionarPiezaKme(c, a, 'ropa.abajo', FALDAS[cuerpo]);
  seleccionarPiezaKme(c, a, 'accesorio', LIGHTSTICK);
  return a;
}

test('Lote collage 01: se añaden la falda con bolsillos de tela (una por cuerpo) y el lightstick de estudio, sin quitar ni cambiar nada anterior', async () => {
  const d = JSON.parse(await readFile(url, 'utf8'));
  for (const [ruta, lista] of Object.entries(anteriores.piezas)) {
    const actuales = d.piezas[ruta].map(p => p.id);
    for (const id of lista) assert.ok(actuales.includes(id), `${ruta}: ha desaparecido ${id}`);
  }
  // Los lotes collage solo AÑADEN piezas, siempre con ids «collage-…» (lotes 01, 02 y 03).
  for (const ruta of Object.keys(d.piezas)) {
    for (const p of d.piezas[ruta]) {
      if (!anteriores.piezas[ruta].includes(p.id)) assert.match(p.id, /^collage-/, `${ruta}: pieza añadida ${p.id}`);
    }
  }
  // porDefecto conserva todos sus valores anteriores; desde el lote 02 solo se le añaden campos nuevos.
  assert.equal(sha(anteriores.porDefectoAnterior), anteriores.porDefectoSha256, 'la copia guardada es la original');
  const conserva = (antes, ahora, ruta = '') => {
    for (const [k, v] of Object.entries(antes)) {
      if (v && typeof v === 'object') conserva(v, ahora?.[k], `${ruta}${k}.`);
      else assert.equal(ahora?.[k], v, `porDefecto.${ruta}${k} no cambia`);
    }
  };
  conserva(anteriores.porDefectoAnterior, d.porDefecto);
  assert.equal(sha(d.bases), anteriores.basesSha256, 'las bases no cambian');

  for (const [cuerpo, id] of Object.entries(FALDAS)) {
    const p = d.piezas['ropa.abajo'].find(x => x.id === id);
    assert.ok(p, `falta ${id}`);
    const archivo = `../assets/kme/ropa_abajo/collage-falda-bolsillos-${VARIANTE[cuerpo]}.svg`;
    assert.deepEqual(p, {
      id, nombre: `Falda con bolsillos de tela · ${VARIANTE[cuerpo]}`, familia: 'collage-falda-bolsillos', coleccion: 'collage-01',
      cuerpoCompatible: cuerpo, cinturaY: 350, reemplazaCapas: ['piernas'],
      gruposPorCapa: { piernas: 'piernas', ropa_abajo: 'prenda' },
      capas: { piernas: archivo, ropa_abajo: archivo },
    });
  }
  const luz = d.piezas.accesorio.find(x => x.id === LIGHTSTICK);
  assert.deepEqual(luz, {
    // «zona: mano»: no es un accesorio de la cabeza; los recortes del rostro lo dejan fuera.
    // «ranura: mano» (D071): se combina con los accesorios de la cabeza y se dibuja el último.
    id: LIGHTSTICK, nombre: 'Lightstick de estudio', coleccion: 'collage-01', zona: 'mano', ranura: 'mano',
    indicePorCuerpo: { relajado: 0, recto: 1, amplio: 2 },
    miniatura: { recorte: '200 245 120 170', capas: ['accesorio'] },
    capas: { accesorio: Object.values(VARIANTE).map(v => `../assets/kme/accesorio/collage-lightstick-estudio-${v}.svg`) },
  });
});

test('Las piezas del lote solo incrustan PNG pequeños: sin enlaces externos ni scripts, y sus ids empiezan por «collage-»', async () => {
  for (const archivo of ARCHIVOS_NUEVOS) {
    const svg = await readFile(new URL(archivo, url), 'utf8');
    assert.match(svg, /viewBox="0 0 400 480"/, archivo);
    assert.match(svg, /<title>.+<\/title>/, archivo);
    assert.doesNotMatch(svg, /<script|<foreignObject|\bon\w+\s*=|\ssrc\s*=|https?:\/\/(?!www\.w3\.org)/i, archivo);
    const enlaces = [...svg.matchAll(/(?:xlink:)?href="([^"]*)"/g)].map(m => m[1]);
    assert.ok(enlaces.length >= 1, `${archivo}: lleva su textura`);
    for (const enlace of enlaces) {
      const m = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(enlace);
      assert.ok(m, `${archivo}: solo PNG incrustados`);
      const png = Buffer.from(m[1], 'base64');
      assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${archivo}: firma PNG`);
      assert.equal(png.subarray(12, 16).toString('latin1'), 'IHDR');
      assert.ok(png.length <= 20 * 1024, `${archivo}: ${png.length} bytes`);
      assert.ok(png.readUInt32BE(16) <= 256 && png.readUInt32BE(20) <= 256, `${archivo}: como mucho 256 px por lado`);
    }
    for (const id of ids(svg)) assert.match(id, /^collage-/, `${archivo}: id ${id}`);
  }
});

test('Con cada cuerpo se dibuja su variante: la falda sustituye a las piernas, se colorea con la paleta, y el lightstick va a la altura de la mano', async () => {
  const c = await cargar();
  for (const cuerpo of Object.keys(FALDAS)) {
    const a = avatarCollage(c, cuerpo);
    assert.equal(a.cuerpo, cuerpo);
    const contenido = c.contenido(a);
    const archivoFalda = await readFile(new URL(`../assets/kme/ropa_abajo/collage-falda-bolsillos-${VARIANTE[cuerpo]}.svg`, url), 'utf8');
    const piernas = /<g data-capa="piernas"[\s\S]*?<\/g>/.exec(archivoFalda)[0];
    assert.equal(contenido.piernas, piernas, `${cuerpo}: las piernas son las de la falda`);
    assert.match(contenido.ropa_abajo, /data-parte="bolsillo-izquierdo"/);
    assert.match(contenido.accesorio, new RegExp(DESPLAZAMIENTO[cuerpo].replace(/[()]/g, '\\$&')), `${cuerpo}: variante de su cuerpo`);
    const svg = svgDelAvatar(c, a);
    assert.equal((svg.match(/<image\b/g) ?? []).length, 3, 'una textura en la falda y dos en el lightstick');
    assert.match(svg, new RegExp(`\\.f-abajo\\{fill:${a.ropa.colorAbajo}\\}`), 'la falda lleva el color elegido de la paleta');
  }
});

test('Dos avatares con las piezas nuevas en una misma página no repiten ids, y cada referencia apunta a un id de su propio dibujo', async () => {
  const c = await cargar();
  const a = avatarCollage(c, 'recto');
  const dibujos = [svgDelAvatar(c, a), svgDelAvatar(c, a), svgDelAvatar(c, a, { estilos: false })];
  const todos = dibujos.flatMap(ids);
  assert.equal(new Set(todos).size, todos.length, 'ningún id se repite en la página');
  for (const svg of dibujos) {
    const propios = new Set(ids(svg));
    for (const ref of referencias(svg)) assert.ok(propios.has(ref), `la referencia #${ref} está en su propio dibujo`);
    assert.doesNotMatch(svg, /\sid="collage-/, 'los ids del lote llevan delante el del dibujo');
  }
});

test('Al cambiar de cuerpo, la falda cambia a su variante, como las demás prendas de familia', async () => {
  const c = await cargar();
  const a = structuredClone(c.porDefecto);
  seleccionarPiezaKme(c, a, 'ropa.abajo', FALDAS.relajado);
  seleccionarPiezaKme(c, a, 'cuerpo', 'amplio');
  assert.equal(a.ropa.abajo, FALDAS.amplio);
  seleccionarPiezaKme(c, a, 'cuerpo', 'recto');
  assert.equal(a.ropa.abajo, FALDAS.recto);
});

test('En el editor, la falda sale en «Parte inferior» para su cuerpo y el lightstick en «Accesorio», con una miniatura donde se ve entero', async () => {
  const c = await cargar(), doc = documentoVisual(), vista = montarEditorVisual(doc, c);
  // Desde E0083, las piezas especiales están solo en la pestaña Colección «K».
  doc.buscar('Categoría: Colección «K»').click();
  const falda = doc.buscar('Parte inferior: Falda con bolsillos de tela · ' + VARIANTE[vista.estado.avatar.cuerpo]);
  assert.ok(falda, 'la falda de su cuerpo está en «Parte inferior»');
  falda.click();
  assert.equal(vista.estado.avatar.ropa.abajo, FALDAS[vista.estado.avatar.cuerpo]);
  assert.equal(doc.buscar('Parte inferior: Falda con bolsillos de tela · ' + VARIANTE[vista.estado.avatar.cuerpo]).getAttribute('aria-pressed'), 'true');
  const luz = doc.buscar('Accesorio: Lightstick de estudio');
  assert.ok(luz, 'el lightstick está en «Accesorio» de Colección «K»');
  assert.match(luz.innerHTML, /viewBox="200 245 120 170"/, 'su miniatura enfoca el lightstick');
  assert.match(luz.innerHTML, /<image\b/);
  luz.click();
  assert.equal(vista.estado.avatar.accesorio, LIGHTSTICK);
  doc.buscar('Categoría: Accesorios').click();
  assert.match(doc.buscar('Accesorio: Gafas redondas')?.innerHTML ?? '', /viewBox="65 60 270 215"/, 'los demás accesorios conservan su miniatura');
  assert.equal(doc.buscar('Accesorio: Lightstick de estudio'), undefined, 'las especiales no salen en «Accesorios»');
});
