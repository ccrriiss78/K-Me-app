// COLECCIÓN K · SPOTLIGHT (D077 y D078): el lote 06 de ChatGPT (entregado como «Encore» a las 16:42
// del 25/11/2026, antes de la colección aprobada que conserva ese nombre, D075). La autora quiere
// «todo, si no son lo mismo»: sus piezas distintas de las de Encore entran como opciones NUEVAS y
// PROPUESTAS (gratis en Colección «K», sin canje ni precio), y su nombre visible es Spotlight.
// - Ropa: Chaqueta Cristal Spotlight y Falda Satén Spotlight, una por cuerpo. Su miniatura enseña
//   solo la pieza (también la de la falda de Encore).
// - Accesorios: Pendientes Cometa Spotlight (orejas, con su copia para el rostro ovalado), Pulseras
//   Fanchant (muñeca, sobre el brazo o sobre la manga de la camiseta), Pines Fan Signal (pecho, una
//   ranura nueva, delante de la ropa), Bolso Spotlight con photocard y Bolso Spotlight con photocard
//   y Rizo (bolso; Rizo nunca va suelto) y Lazo Satén Spotlight (en la ranura del pin).
// - Los ids y los archivos conservan el prefijo técnico «collage-k06-» (D078: no cambian, por las
//   recetas guardadas). Los títulos internos de los SVG, que llegaron con los nombres antiguos, se
//   sustituyen al dibujar por el nombre visible («retitular»): los archivos siguen como se entregaron.
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
const ACC = (n) => `../assets/kme/accesorio/${n}.svg`;
const PE = 'collage-k06-pendientes-cometa', PU = 'collage-k06-pulseras-fanchant', PI = 'collage-k06-pines-fan-signal';
const BO = 'collage-k06-bolso-encore', BR = 'collage-k06-bolso-encore-rizo', LA = 'collage-k06-lazo-saten';
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
function avatar(c, { cuerpo = 'recto', rostro, arriba, abajo, accesorios = [] } = {}) {
  const a = structuredClone(c.porDefecto);
  a.cuerpo = cuerpo;
  if (rostro) a.rostro = rostro;
  if (abajo) seleccionarPiezaKme(c, a, 'ropa.abajo', abajo);
  if (arriba) seleccionarPiezaKme(c, a, 'ropa.arriba', arriba);
  a.accesorio = accesorios.at(-1) ?? 'ninguno';
  a.accesoriosExtra = accesorios.slice(0, -1);
  return a;
}
// El dibujo de un archivo de accesorio Spotlight, con sus títulos internos cambiados por el nombre visible.
const retitulado = (c, id, archivo) => c.archivos.get(archivo).replace(/<title>[\s\S]*?<\/title>/g, `<title>${c.pieza('accesorio', id).nombre}</title>`);

test('Spotlight: la chaqueta y la falda entran como opciones nuevas, una por cuerpo, sin tocar las de Encore; la miniatura de las dos faldas enseña solo la falda', async () => {
  const d = JSON.parse(await readFile(url, 'utf8'));
  for (const [cuerpo, v] of Object.entries(VARIANTE)) {
    const arriba = `../assets/kme/ropa_arriba/collage-k06-chaqueta-cristal-${v}.svg`;
    assert.deepEqual(d.piezas['ropa.arriba'].find(p => p.id === `collage-k06-chaqueta-cristal-${v}`), {
      id: `collage-k06-chaqueta-cristal-${v}`, nombre: `Chaqueta Cristal Spotlight · ${v}`, coleccion: 'collage-spotlight', familia: 'collage-k06-chaqueta-cristal',
      cuerpoCompatible: cuerpo, perfilIntegrado: true, topCorto: false, ocultaCapas: ['cuerpo'],
      gruposPorCapa: { anatomia: 'perfil', torso: 'torso', ropa_arriba: 'superior' },
      capas: { anatomia: arriba, torso: arriba, ropa_arriba: arriba, piernas: `../assets/kme/cuerpo/${cuerpo}.svg` },
    });
    const abajo = `../assets/kme/ropa_abajo/collage-k06-falda-saten-${v}.svg`;
    assert.deepEqual(d.piezas['ropa.abajo'].find(p => p.id === `collage-k06-falda-saten-${v}`), {
      id: `collage-k06-falda-saten-${v}`, nombre: `Falda Satén Spotlight · ${v}`, familia: 'collage-k06-falda-saten', coleccion: 'collage-spotlight',
      cuerpoCompatible: cuerpo, cinturaY: 350, reemplazaCapas: ['piernas'], gruposPorCapa: { piernas: 'piernas', ropa_abajo: 'prenda' },
      miniatura: { recorte: '132 340 136 63', capas: ['ropa_abajo'] },
      capas: { piernas: abajo, ropa_abajo: abajo },
    });
    // Las aprobadas siguen con sus archivos; la falda aprobada gana la miniatura de solo la falda.
    assert.equal(d.piezas['ropa.arriba'].find(p => p.id === `collage-k-chaqueta-cristal-${v}`).capas.ropa_arriba, `../assets/kme/ropa_arriba/collage-k-chaqueta-cristal-${v}.svg`);
    assert.deepEqual(d.piezas['ropa.abajo'].find(p => p.id === `collage-k-falda-saten-${v}`).miniatura, { recorte: '131 340 138 63', capas: ['ropa_abajo'] });
  }
});

test('Spotlight: los accesorios, cada uno en su ranura (pecho, nueva, para los pines), sin color propio y con su nombre visible en el dibujo', async () => {
  const d = JSON.parse(await readFile(url, 'utf8'));
  const por = (id) => d.piezas.accesorio.find(p => p.id === id);
  const cuerpos = (n) => ['delgado', 'medio', 'grueso'].map(v => ACC(`${n}-${v}`));
  assert.deepEqual(por(PE), {
    id: PE, nombre: 'Pendientes Cometa Spotlight', coleccion: 'collage-spotlight', zona: 'cabeza', ranura: 'orejas', retitular: true,
    indicePorRostro: { redondo: 0, ovalado: 1, cuadrado: 0 },
    miniatura: { recorte: '72 207 30 48', capas: ['accesorio'] },
    capas: { accesorio: [ACC(PE), ACC(`${PE}-ovalado`)] },
  });
  assert.deepEqual(por(PU), {
    id: PU, nombre: 'Pulseras Fanchant', coleccion: 'collage-spotlight', zona: 'muneca', ranura: 'muneca', retitular: true,
    indicePorCuerpo: { relajado: 0, recto: 1, amplio: 2 }, indiceSinPerfilIntegrado: { relajado: 3, recto: 4, amplio: 5 },
    miniatura: { recorte: '112 328 62 38', capas: ['accesorio'] },
    capas: { accesorio: [...cuerpos(PU), ...cuerpos(`${PU}-camiseta`)] },
  });
  assert.deepEqual(por(PI), {
    id: PI, nombre: 'Pines Fan Signal', coleccion: 'collage-spotlight', zona: 'cuerpo', ranura: 'pecho', retitular: true,
    indicePorCuerpo: { relajado: 0, recto: 1, amplio: 2 },
    miniatura: { recorte: '138 296 124 48', capas: ['accesorio'] },
    capas: { accesorio: cuerpos(PI) },
  });
  for (const [id, nombre] of [[BO, 'Bolso Spotlight con photocard'], [BR, 'Bolso Spotlight con photocard y Rizo']]) {
    assert.deepEqual(por(id), {
      id, nombre, coleccion: 'collage-spotlight', zona: 'cuerpo', ranura: 'bolso', retitular: true,
      indicePorCuerpo: { relajado: 0, recto: 1, amplio: 2 },
      miniatura: { recorte: '212 285 136 125', capas: ['accesorio'] },
      capas: { accesorio: cuerpos(id) },
    });
  }
  assert.deepEqual(por(LA), {
    id: LA, nombre: 'Lazo Satén Spotlight', coleccion: 'collage-spotlight', zona: 'cabeza', ranura: 'pin', retitular: true,
    miniatura: { recorte: '245 80 95 75', capas: ['accesorio'] },
    capas: { accesorio: ACC(LA) },
  });
  assert.deepEqual(d.ranurasAccesorio, ['gorro', 'orejas', 'auriculares', 'gafas', 'pin', 'pecho', 'bolso', 'muneca', 'mano']);
  assert.equal(d.piezas.accesorio.some(p => /rizo/i.test(p.id) && !p.id.includes('bolso')), false, 'Rizo nunca va suelto: solo con el bolso');
});

test('Sus dibujos son los del lote (los bytes de ARCHIVOS.json), seguros, con PNG pequeños e ids «collage-»; la copia del ovalado solo mueve los anclajes', async () => {
  const lote = JSON.parse(await readFile(new URL('../propuestas-collage/spotlight/ARCHIVOS.json', import.meta.url), 'utf8'));
  const bytes = Object.fromEntries(lote.map(a => [a.archivo.replace(/^svg\//, ''), a.bytes]));
  const usados = {
    ropa_arriba: ['delgado', 'medio', 'grueso'].map(v => [`collage-k06-chaqueta-cristal-${v}.svg`, `collage-k-chaqueta-cristal-${v}.svg`]),
    ropa_abajo: ['delgado', 'medio', 'grueso'].map(v => [`collage-k06-falda-saten-${v}.svg`, `collage-k-falda-saten-${v}.svg`]),
    accesorio: [
      ['collage-k06-pendientes-cometa.svg', 'collage-k-pendientes-cometa.svg'], ['collage-k06-lazo-saten.svg', 'collage-k-lazo-saten.svg'],
      ...['delgado', 'medio', 'grueso'].flatMap(v => [
        [`collage-k06-pulseras-fanchant-${v}.svg`, `collage-k-pulseras-fanchant-${v}.svg`],
        [`collage-k06-pulseras-fanchant-camiseta-${v}.svg`, `collage-k-pulseras-fanchant-camiseta-${v}.svg`],
        [`collage-k06-pines-fan-signal-${v}.svg`, `collage-k-pines-fan-signal-${v}.svg`],
        [`collage-k06-bolso-encore-${v}.svg`, `collage-k-bolso-encore-${v}.svg`],
        [`collage-k06-bolso-encore-rizo-${v}.svg`, `composicion-bolso-encore-rizo-${v}.svg`],
      ]),
    ],
  };
  let n = 0;
  for (const [zona, pares] of Object.entries(usados)) for (const [nuestro, suyo] of pares) {
    const svg = await readFile(new URL(`../assets/kme/${zona}/${nuestro}`, url), 'utf8');
    assert.equal(Buffer.byteLength(svg), bytes[suyo], `${nuestro}: el archivo ${suyo} del lote, sin cambios`);
    assert.match(svg, /viewBox="0 0 400 480"/);
    assert.doesNotMatch(svg, /<script|<foreignObject|\bon\w+\s*=|\ssrc\s*=|https?:\/\/(?!www\.w3\.org)/i, nuestro);
    for (const [, enlace] of svg.matchAll(/href="([^"]*)"/g)) {
      if (enlace.startsWith('#')) continue;
      const png = Buffer.from(/^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(enlace)?.[1] ?? '', 'base64');
      assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', nuestro);
      assert.ok(png.length <= 20 * 1024 && png.readUInt32BE(16) <= 256 && png.readUInt32BE(20) <= 256, nuestro);
    }
    for (const id of ids(svg)) assert.match(id, /^collage-/, `${nuestro}: ${id}`);
    n++;
  }
  assert.equal(n, 23);
  const original = await readFile(new URL(ACC(PE), url), 'utf8');
  const ovalado = await readFile(new URL(ACC(`${PE}-ovalado`), url), 'utf8');
  assert.equal(ovalado, original
    .replace('<title>Pendientes Cometa</title>', '<title>Pendientes Cometa · rostro ovalado</title>')
    .replace('<g transform="translate(86 235)">', '<g transform="translate(100 239)">')
    .replace('<g transform="translate(314 235)">', '<g transform="translate(300 239)">'));
});

test('Con cada cuerpo y cada cintura, la chaqueta Spotlight llega a la cintura con el color de arriba; la falda sustituye las piernas, con el color de abajo y el calzado compacto', async () => {
  const c = await cargar();
  for (const [cuerpo, v] of Object.entries(VARIANTE)) {
    for (const cintura of [350, 370]) {
      const q = c.piezas('ropa.abajo').find(p => p.cuerpoCompatible === cuerpo && (p.cinturaY || 350) === cintura);
      const a = avatar(c, { cuerpo, abajo: q.id, arriba: `collage-k06-chaqueta-cristal-${v}` });
      a.ropa.colorArriba = '#9673b7';
      const svg = svgDelAvatar(c, a);
      assert.equal(maxY(svg.match(/<path data-parte="prenda-superior" d="([^"]+)"/)[1]), cintura, `${cuerpo}/${q.id}`);
      assert.match(svg, /\.f-arriba\{fill:#9673b7\}/);
    }
    const a = avatar(c, { cuerpo, abajo: `collage-k06-falda-saten-${v}`, arriba: `collage-k06-chaqueta-cristal-${v}` });
    a.ropa.colorAbajo = '#c5b1e3';
    const svg = svgDelAvatar(c, a);
    const calzado = svg.match(/<path data-parte="calzado"[^>]*\sd="([^"]+)"/g) ?? [];
    assert.equal(calzado.length, 1, `${cuerpo}: un solo calzado`);
    const d = calzado[0].match(/\sd="([^"]+)"/)[1];
    assert.ok((d.match(/C/g) ?? []).length >= 6 && maxY(d) <= 432, `${cuerpo}: calzado compacto`);
    assert.match(svg, /\.f-abajo\{fill:#c5b1e3\}/);
    assert.equal((svg.match(/<image\b/g) ?? []).length, 2, `${cuerpo}: chaqueta y falda, una textura cada una`);
  }
});

test('Las pulseras se dibujan una vez: sobre el brazo con el perfil integrado y sobre la manga con la camiseta integrada; los pendientes, por rostro', async () => {
  const c = await cargar();
  for (const [cuerpo, v] of Object.entries(VARIANTE)) {
    const brazo = c.archivos.get(ACC(`${PU}-${v}`)), manga = c.archivos.get(ACC(`${PU}-camiseta-${v}`));
    const conPerfil = c.contenido(avatar(c, { cuerpo, arriba: `collage-k06-chaqueta-cristal-${v}`, accesorios: [PU] })).accesorio;
    assert.ok(conPerfil.includes(brazo) && !conPerfil.includes(manga), cuerpo);
    const conCamiseta = c.contenido(avatar(c, { cuerpo, arriba: `camiseta-integrada-${v}`, accesorios: [PU] })).accesorio;
    assert.ok(conCamiseta.includes(manga) && !conCamiseta.includes(brazo), cuerpo);
  }
  for (const [rostro, archivo] of [['redondo', ACC(PE)], ['cuadrado', ACC(PE)], ['ovalado', ACC(`${PE}-ovalado`)]]) {
    assert.equal(c.contenido(avatar(c, { rostro, accesorios: [PE] })).accesorio, retitulado(c, PE, archivo), rostro);
  }
});

test('Los pines van delante de la ropa (capa de accesorios) y bajo la correa del bolso; todo Spotlight junto, con ids únicos y 8 imágenes', async () => {
  const c = await cargar();
  const a = avatar(c, { arriba: 'collage-k06-chaqueta-cristal-medio', abajo: 'collage-k06-falda-saten-medio', accesorios: [PE, PU, PI, BR, LA] });
  const capas = c.contenido(a);
  assert.ok(capas.accesorio.includes(retitulado(c, PI, ACC(`${PI}-medio`))), 'los pines, en la capa de accesorios, sobre la ropa');
  const capa = capas.accesorio, pos = (id, archivo) => capa.indexOf(retitulado(c, id, archivo));
  assert.ok(pos(PE, ACC(PE)) < pos(LA, ACC(LA)) && pos(LA, ACC(LA)) < pos(PI, ACC(`${PI}-medio`)) && pos(PI, ACC(`${PI}-medio`)) < pos(BR, ACC(`${BR}-medio`)) && pos(BR, ACC(`${BR}-medio`)) < pos(PU, ACC(`${PU}-medio`)));
  const dibujos = [svgDelAvatar(c, a), svgDelAvatar(c, a)];
  const todos = dibujos.flatMap(ids);
  assert.equal(new Set(todos).size, todos.length);
  for (const svg of dibujos) {
    const propios = new Set(ids(svg));
    for (const [, ref] of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(propios.has(ref), ref);
    assert.equal((svg.match(/<image\b/g) ?? []).length, 8, 'chaqueta, falda, pendientes, pulseras, pines y lazo, una cada uno; el bolso con Rizo, dos');
  }
});

test('Ninguna pieza repite un id interno de otra que se pueda llevar a la vez (otra parte del avatar u otra ranura)', async () => {
  const c = await cargar();
  const piezas = [];
  for (const ruta of c.rutas()) for (const p of c.piezas(ruta)) {
    const grupo = ruta === 'accesorio' ? `accesorio:${p.ranura}` : ruta;
    const propios = new Set(Object.values(p.capas).flat().flatMap(a => ids(c.archivos.get(a) ?? '')));
    if (propios.size) piezas.push({ id: p.id, grupo, propios });
  }
  for (let i = 0; i < piezas.length; i++) for (let j = i + 1; j < piezas.length; j++) {
    if (piezas[i].grupo === piezas[j].grupo) continue;
    const comunes = [...piezas[i].propios].filter(x => piezas[j].propios.has(x));
    assert.deepEqual(comunes, [], `${piezas[i].id} y ${piezas[j].id}`);
  }
});

test('Lo visible de Spotlight dice Spotlight: ni sus nombres, ni sus miniaturas, ni el avatar que las lleva dicen «Encore», «lote 06» ni los nombres de las piezas de Encore', async () => {
  const c = await cargar(), doc = documentoVisual();
  const piezas = ['ropa.arriba', 'ropa.abajo', 'accesorio'].flatMap(r => c.piezas(r).filter(p => p.coleccion === 'collage-spotlight'));
  assert.equal(piezas.length, 12, '3 chaquetas, 3 faldas y 6 accesorios');
  const antiguo = /Encore|lote 06|Cristal Stage|Satén Stage/;
  for (const p of piezas) assert.doesNotMatch(p.nombre, antiguo, p.id);
  montarEditorVisual(doc, c, { categoriaInicial: 'coleccion' });
  for (const p of piezas.filter(p => !p.cuerpoCompatible || p.cuerpoCompatible === 'relajado')) {
    const ruta = c.piezas('accesorio').includes(p) ? 'Accesorio' : c.piezas('ropa.arriba').includes(p) ? 'Parte superior' : 'Parte inferior';
    assert.doesNotMatch(doc.buscar(`${ruta}: ${p.nombre}`)?.innerHTML ?? 'no está', antiguo, p.id);
  }
  for (const [cuerpo, v] of Object.entries(VARIANTE)) {
    const svg = svgDelAvatar(c, avatar(c, { cuerpo, arriba: `collage-k06-chaqueta-cristal-${v}`, abajo: `collage-k06-falda-saten-${v}`, accesorios: [PE, PU, PI, BR, LA] }));
    assert.doesNotMatch(svg, antiguo, cuerpo);
    assert.match(svg, /<title>Bolso Spotlight con photocard y Rizo<\/title>/);
  }
});

test('En el editor, Spotlight sale en Colección «K» (sin canje: no está en las bloqueadas) y no en «Ropa» ni «Accesorios»', async () => {
  const c = await cargar(), doc = documentoVisual();
  const vista = montarEditorVisual(doc, c, { categoriaInicial: 'coleccion', bloqueadas: ['collage-k-chaqueta-cristal', 'collage-k-falda-saten'] });
  const v = VARIANTE[vista.estado.avatar.cuerpo];
  for (const etiqueta of [`Parte superior: Chaqueta Cristal Spotlight · ${v}`, `Parte inferior: Falda Satén Spotlight · ${v}`,
    'Accesorio: Pendientes Cometa Spotlight', 'Accesorio: Pulseras Fanchant', 'Accesorio: Pines Fan Signal',
    'Accesorio: Bolso Spotlight con photocard', 'Accesorio: Bolso Spotlight con photocard y Rizo', 'Accesorio: Lazo Satén Spotlight']) {
    assert.match(doc.buscar(etiqueta)?.innerHTML ?? '', /<image\b/, etiqueta);
  }
  // La miniatura de la falda enseña solo la falda: sin piernas ni zapatos.
  assert.doesNotMatch(doc.buscar(`Parte inferior: Falda Satén Spotlight · ${v}`).innerHTML, /data-parte="calzado"/);
  assert.equal(doc.buscar(`Parte superior: Chaqueta Cristal Stage · ${v}`), undefined, 'la aprobada, bloqueada, no sale');
  doc.buscar('Accesorio: Pines Fan Signal').click();
  doc.buscar('Accesorio: Pulseras Fanchant').click();
  assert.equal(doc.buscar('Accesorio: Pines Fan Signal').getAttribute('aria-pressed'), 'true');
  doc.buscar('Categoría: Accesorios').click();
  assert.equal(doc.buscar('Accesorio: Pines Fan Signal'), undefined);
});
