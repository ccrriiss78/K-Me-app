// Colección Encore (D075; entrega de ChatGPT del 25/11/2026, aprobada por la autora e integrada por
// Claude en E0086): seis familias especiales NUEVAS, solo en Colección «K».
// - Ropa: Chaqueta Cristal Stage (arriba) y Falda Satén Encore (abajo), una variante por cuerpo
//   (delgado = relajado, medio = recto, grueso = amplio), con el color de la ropa.
// - Accesorios, sin campo de color propio y combinables (D071), cada uno en su ranura:
//   Pendientes Cometa (orejas), Brazalete Fanchant (muñeca), Bolso Encore con Rizo (bolso: bolso,
//   portaphotocard y peluche son UNA pieza) y Lazo Satén Stage (en el pelo, donde va el pin: el
//   uno sustituye al otro, porque se pisan).
// - El brazalete trae dos anclajes por cuerpo: sobre los brazos del perfil integrado o sobre la
//   camiseta integrada. Se dibuja UNO, según la prenda de arriba.
// - Los pendientes se cuelgan del lóbulo: con el rostro ovalado, cuyas orejas están más dentro, se
//   usa una copia con los dos anclajes movidos (la única diferencia con el dibujo entregado).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { seleccionarPiezaKme } from '../js/kme-ropa.js';
import { EditorVisual } from '../js/kme-editor-visual.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { documentoVisual } from './helpers/dom-visual.js';

const url = new URL('../datos/kme.json', import.meta.url);
const VARIANTE = { relajado: 'delgado', recto: 'medio', amplio: 'grueso' };
const ACC = (n) => `../assets/kme/accesorio/${n}.svg`;
const PE = 'collage-k-pendientes-cometa', BR = 'collage-k-brazalete-fanchant', BO = 'collage-k-bolso-encore-rizo', LA = 'collage-k-lazo-saten';
const G = 'collage-gorro-punto', L = 'collage-lightstick-estudio';
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

test('Encore: la chaqueta y la falda entran como tres ids nuevos cada una, uno por cuerpo, en Colección «K»', async () => {
  const d = JSON.parse(await readFile(url, 'utf8'));
  for (const [cuerpo, v] of Object.entries(VARIANTE)) {
    const arriba = `../assets/kme/ropa_arriba/collage-k-chaqueta-cristal-${v}.svg`;
    assert.deepEqual(d.piezas['ropa.arriba'].find(p => p.id === `collage-k-chaqueta-cristal-${v}`), {
      id: `collage-k-chaqueta-cristal-${v}`, nombre: `Chaqueta Cristal Stage · ${v}`, coleccion: 'collage-encore', familia: 'collage-k-chaqueta-cristal',
      cuerpoCompatible: cuerpo, perfilIntegrado: true, topCorto: false, ocultaCapas: ['cuerpo'],
      gruposPorCapa: { anatomia: 'perfil', torso: 'torso', ropa_arriba: 'superior' },
      capas: { anatomia: arriba, torso: arriba, ropa_arriba: arriba, piernas: `../assets/kme/cuerpo/${cuerpo}.svg` },
    });
    const abajo = `../assets/kme/ropa_abajo/collage-k-falda-saten-${v}.svg`;
    assert.deepEqual(d.piezas['ropa.abajo'].find(p => p.id === `collage-k-falda-saten-${v}`), {
      id: `collage-k-falda-saten-${v}`, nombre: `Falda Satén Encore · ${v}`, familia: 'collage-k-falda-saten', coleccion: 'collage-encore',
      cuerpoCompatible: cuerpo, cinturaY: 350, reemplazaCapas: ['piernas'], gruposPorCapa: { piernas: 'piernas', ropa_abajo: 'prenda' },
      // E0088: la miniatura enseña solo la falda (sin piernas ni calzado), como pidió la autora.
      miniatura: { recorte: '131 340 138 63', capas: ['ropa_abajo'] },
      capas: { piernas: abajo, ropa_abajo: abajo },
    });
  }
  // Las prendas anteriores siguen ahí.
  for (const id of ['collage-chaqueta-denim-medio', 'collage-top-lentejuelas-medio', 'collage-falda-botas-piel-medio', 'collage-falda-bolsillos-medio']) {
    assert.ok([...d.piezas['ropa.arriba'], ...d.piezas['ropa.abajo']].some(p => p.id === id), id);
  }
});

test('Encore: los cuatro accesorios, cada uno en su ranura, sin campo de color, y el orden de capas', async () => {
  const d = JSON.parse(await readFile(url, 'utf8'));
  const por = (id) => d.piezas.accesorio.find(p => p.id === id);
  assert.deepEqual(por(PE), {
    id: PE, nombre: 'Pendientes Cometa', coleccion: 'collage-encore', zona: 'cabeza', ranura: 'orejas',
    indicePorRostro: { redondo: 0, ovalado: 1, cuadrado: 0 },
    miniatura: { recorte: '75 207 24 54', capas: ['accesorio'] },
    capas: { accesorio: [ACC(PE), ACC(`${PE}-ovalado`)] },
  });
  assert.deepEqual(por(BR), {
    id: BR, nombre: 'Brazalete Fanchant', coleccion: 'collage-encore', zona: 'muneca', ranura: 'muneca',
    indicePorCuerpo: { relajado: 0, recto: 1, amplio: 2 }, indiceSinPerfilIntegrado: { relajado: 3, recto: 4, amplio: 5 },
    miniatura: { recorte: '108 328 70 42', capas: ['accesorio'] },
    capas: { accesorio: ['delgado', 'medio', 'grueso', 'camiseta-delgado', 'camiseta-medio', 'camiseta-grueso'].map(v => ACC(`${BR}-${v}`)) },
  });
  assert.deepEqual(por(BO), {
    id: BO, nombre: 'Bolso Encore con Rizo', coleccion: 'collage-encore', zona: 'cuerpo', ranura: 'bolso',
    indicePorCuerpo: { relajado: 0, recto: 1, amplio: 2 },
    miniatura: { recorte: '215 289 133 115', capas: ['accesorio'] },
    capas: { accesorio: ['delgado', 'medio', 'grueso'].map(v => ACC(`${BO}-${v}`)) },
  });
  assert.deepEqual(por(LA), {
    id: LA, nombre: 'Lazo Satén Stage', coleccion: 'collage-encore', zona: 'cabeza', ranura: 'pin',
    miniatura: { recorte: '247 82 88 65', capas: ['accesorio'] },
    capas: { accesorio: ACC(LA) },
  });
  // E0088: el lote 06 añade «pecho» (los pines), entre el pin y el bolso.
  assert.deepEqual(d.ranurasAccesorio, ['gorro', 'orejas', 'auriculares', 'gafas', 'pin', 'pecho', 'bolso', 'muneca', 'mano']);
  for (const p of [por(PE), por(BR), por(BO), por(LA)]) assert.equal(p.rutaColor, undefined, `${p.id}: sin color propio`);
  assert.deepEqual(d.porDefecto.accesoriosExtra, [], 'porDefecto no gana campos con Encore');
});

test('Los 17 dibujos entregados se usan tal cual (las huellas de sus manifest) y solo incrustan PNG pequeños, sin enlaces ni scripts, con ids «collage-»', async () => {
  const carpeta = new URL('../propuestas-collage/encore/', import.meta.url);
  let dibujos = 0;
  for (const lote of (await readdir(carpeta)).filter(n => /^0[1-6]_/.test(n))) {
    const manifest = JSON.parse(await readFile(new URL(`${lote}/manifest.json`, carpeta), 'utf8'));
    for (const { archivo, sha256 } of manifest.archivos.filter(a => a.archivo.startsWith('svg/'))) {
      const nombre = archivo.slice(4), zona = lote.startsWith('01') ? 'ropa_arriba' : lote.startsWith('02') ? 'ropa_abajo' : 'accesorio';
      const svg = await readFile(new URL(`../assets/kme/${zona}/${nombre}`, url));
      assert.equal(crypto.createHash('sha256').update(svg).digest('hex'), sha256, nombre);
      dibujos++;
    }
  }
  assert.equal(dibujos, 17, '3 chaquetas, 3 faldas, pendientes, 6 brazaletes, 3 bolsos y el lazo');
  const archivos = (await readdir(new URL('../assets/kme/', url), { recursive: true })).filter(n => /collage-k-.*\.svg$/.test(n));
  assert.equal(archivos.length, 18, 'y la copia de los pendientes para el rostro ovalado');
  for (const nombre of archivos) {
    const svg = await readFile(new URL(`../assets/kme/${nombre.replaceAll('\\', '/')}`, url), 'utf8');
    assert.match(svg, /viewBox="0 0 400 480"/);
    assert.match(svg, /<title>.+<\/title>/);
    assert.doesNotMatch(svg, /<script|<foreignObject|\bon\w+\s*=|\ssrc\s*=|https?:\/\/(?!www\.w3\.org)/i, nombre);
    for (const [, enlace] of svg.matchAll(/href="([^"]*)"/g)) {
      if (enlace.startsWith('#')) continue;
      const png = Buffer.from(/^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(enlace)?.[1] ?? '', 'base64');
      assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', nombre);
      assert.ok(png.length <= 20 * 1024 && png.readUInt32BE(16) <= 256 && png.readUInt32BE(20) <= 256, nombre);
    }
    for (const id of ids(svg)) assert.match(id, /^collage-/, `${nombre}: ${id}`);
  }
});

test('La copia de los pendientes para el rostro ovalado solo cambia el título y los dos anclajes (86→100 y 314→300, 232→236)', async () => {
  const original = await readFile(new URL(ACC(PE), url), 'utf8');
  const ovalado = await readFile(new URL(ACC(`${PE}-ovalado`), url), 'utf8');
  const esperado = original
    .replace('<title>Pendientes Cometa</title>', '<title>Pendientes Cometa · rostro ovalado</title>')
    .replace('<g transform="translate(86 232)">', '<g transform="translate(100 236)">')
    .replace('<g transform="translate(314 232)">', '<g transform="translate(300 236)">');
  assert.notEqual(esperado, original);
  assert.equal(ovalado, esperado);
});

test('Con cada cuerpo y cada cintura (350 y 370), la chaqueta y su textura llegan a la cintura, con el color de arriba', async () => {
  const c = await cargar();
  for (const [cuerpo, v] of Object.entries(VARIANTE)) {
    const inferiores = c.piezas('ropa.abajo').filter(q => q.cuerpoCompatible === cuerpo);
    for (const cintura of [350, 370]) {
      const q = inferiores.find(p => (p.cinturaY || 350) === cintura);
      const a = avatar(c, { cuerpo, abajo: q.id, arriba: `collage-k-chaqueta-cristal-${v}` });
      a.ropa.colorArriba = '#9673b7';
      const svg = svgDelAvatar(c, a);
      assert.equal(maxY(svg.match(/<path data-parte="prenda-superior" d="([^"]+)"/)[1]), cintura, `${cuerpo}/${q.id}: el bajo`);
      const recorte = svg.match(/<clipPath id="[^"]*collage-k-cristal-[a-z]+-recorte"><path d="([^"]+)"/)?.[1];
      assert.ok(recorte, 'la textura va recortada por la prenda');
      assert.equal(maxY(recorte), cintura, `${cuerpo}/${q.id}: la textura llega a la misma cintura`);
      assert.match(svg, /\.f-arriba\{fill:#9673b7\}/);
      assert.equal((svg.match(/<image\b/g) ?? []).length, 1);
    }
  }
});

test('Con cada cuerpo, la falda sustituye a las piernas, lleva el color de abajo y conserva el calzado compacto', async () => {
  const c = await cargar();
  for (const [cuerpo, v] of Object.entries(VARIANTE)) {
    const a = avatar(c, { cuerpo, abajo: `collage-k-falda-saten-${v}` });
    a.ropa.colorAbajo = '#c5b1e3';
    const svg = svgDelAvatar(c, a);
    const calzado = svg.match(/<path data-parte="calzado"[^>]*\sd="([^"]+)"/g) ?? [];
    assert.equal(calzado.length, 1, `${cuerpo}: un solo calzado, sin zapatos debajo`);
    const d = calzado[0].match(/\sd="([^"]+)"/)[1];
    assert.ok((d.match(/C/g) ?? []).length >= 6, `${cuerpo}: calzado con curvas`);
    assert.ok(maxY(d) <= 432, `${cuerpo}: calzado compacto`);
    assert.match(svg, /\.f-abajo\{fill:#c5b1e3\}/);
    assert.equal((svg.match(/<image\b/g) ?? []).length, 1);
  }
});

test('El brazalete se dibuja una sola vez: sobre el perfil integrado, su anclaje principal; con la camiseta integrada, el de la camiseta', async () => {
  const c = await cargar();
  for (const [cuerpo, v] of Object.entries(VARIANTE)) {
    const principal = c.archivos.get(ACC(`${BR}-${v}`)), camiseta = c.archivos.get(ACC(`${BR}-camiseta-${v}`));
    const conPerfil = c.contenido(avatar(c, { cuerpo, arriba: `collage-k-chaqueta-cristal-${v}`, accesorios: [BR] })).accesorio;
    assert.ok(conPerfil.includes(principal) && !conPerfil.includes(camiseta), `${cuerpo}: perfil integrado`);
    const conCamiseta = c.contenido(avatar(c, { cuerpo, arriba: `camiseta-integrada-${v}`, accesorios: [BR] })).accesorio;
    assert.ok(conCamiseta.includes(camiseta) && !conCamiseta.includes(principal), `${cuerpo}: camiseta integrada`);
  }
});

test('Los pendientes cuelgan de la oreja de cada rostro: el dibujo entregado con el redondo y el cuadrado, la copia con el ovalado', async () => {
  const c = await cargar();
  for (const [rostro, archivo] of [['redondo', ACC(PE)], ['cuadrado', ACC(PE)], ['ovalado', ACC(`${PE}-ovalado`)]]) {
    assert.equal(c.contenido(avatar(c, { rostro, accesorios: [PE] })).accesorio, c.archivos.get(archivo), rostro);
  }
});

test('Con todos los accesorios a la vez, el orden de capas es gorro, pendientes, auriculares, gafas, lazo, bolso, brazalete y lightstick', async () => {
  const c = await cargar();
  const capa = c.contenido(avatar(c, { accesorios: [L, BR, BO, LA, 'gafas', 'auriculares', PE, G] })).accesorio;
  const pos = [G, PE, 'auriculares', 'gafas', LA, BO, BR, L].map(id => {
    const p = c.pieza('accesorio', id), archivos = p.capas.accesorio;
    return Math.max(...archivos.map(a => capa.indexOf(c.archivos.get(a))));
  });
  assert.ok(pos.every(p => p >= 0), 'salen los ocho');
  assert.deepEqual([...pos].sort((a, b) => a - b), pos);
});

test('En el editor, el lazo y el pin se sustituyen el uno al otro (se pisan en el pelo); lo demás se combina', async () => {
  const c = await cargar(), e = new EditorVisual(c);
  e.cargarAvatar(avatar(c, { accesorios: ['pin', PE, BO] }));
  e.alternarAccesorio(LA);
  assert.deepEqual([e.avatar.accesorio, ...e.avatar.accesoriosExtra].sort(), [BO, LA, PE].sort());
  e.alternarAccesorio('pin');
  assert.deepEqual([e.avatar.accesorio, ...e.avatar.accesoriosExtra].sort(), [BO, PE, 'pin'].sort());
});

test('Varios avatares con todo Encore en una página no repiten ids, y cada referencia es de su propio dibujo', async () => {
  const c = await cargar();
  const dibujos = Object.entries(VARIANTE).flatMap(([cuerpo, v]) => {
    const a = avatar(c, { cuerpo, arriba: `collage-k-chaqueta-cristal-${v}`, abajo: `collage-k-falda-saten-${v}`, accesorios: [PE, BR, BO, LA] });
    return [svgDelAvatar(c, a), svgDelAvatar(c, a)];
  });
  const todos = dibujos.flatMap(ids);
  assert.equal(new Set(todos).size, todos.length);
  for (const svg of dibujos) {
    const propios = new Set(ids(svg));
    for (const [, ref] of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(propios.has(ref), ref);
    assert.equal((svg.match(/<image\b/g) ?? []).length, 7, 'las seis piezas juntas: 7 texturas');
  }
});

test('En el editor, Encore sale solo en Colección «K»: la ropa de tu cuerpo y los cuatro accesorios, con textura en la miniatura; lo bloqueado no sale', async () => {
  const c = await cargar(), doc = documentoVisual();
  const vista = montarEditorVisual(doc, c, { categoriaInicial: 'coleccion', bloqueadas: [LA] });
  const v = VARIANTE[vista.estado.avatar.cuerpo];
  for (const etiqueta of [`Parte superior: Chaqueta Cristal Stage · ${v}`, `Parte inferior: Falda Satén Encore · ${v}`, 'Accesorio: Pendientes Cometa', 'Accesorio: Brazalete Fanchant', 'Accesorio: Bolso Encore con Rizo']) {
    assert.match(doc.buscar(etiqueta)?.innerHTML ?? '', /<image\b/, etiqueta);
  }
  assert.equal(doc.buscar('Accesorio: Lazo Satén Stage'), undefined, 'el lazo, bloqueado, no sale');
  doc.buscar('Accesorio: Bolso Encore con Rizo').click();
  doc.buscar('Accesorio: Pendientes Cometa').click();
  assert.equal(doc.buscar('Accesorio: Bolso Encore con Rizo').getAttribute('aria-pressed'), 'true');
  assert.equal(doc.buscar('Accesorio: Pendientes Cometa').getAttribute('aria-pressed'), 'true');
  doc.buscar('Categoría: Accesorios').click();
  assert.equal(doc.buscar('Accesorio: Pendientes Cometa'), undefined, 'no salen en «Accesorios»');
});
