// Lightstick de estudio · encendido (D083; entrega de ChatGPT del 26/11/2026, integrada por Claude en
// E0098). La autora: «lo metemos».
// - Es una opción NUEVA, al lado del lightstick de siempre, que no cambia: ni su id, ni sus dibujos,
//   ni los avatares guardados con él.
// - Cada variante encendida es la de siempre más la luz: un núcleo blanco y rosa dentro de la bola, un
//   halo rosa suave y un reflejo blanco. Fija: sin animación, filtros ni nada externo.
// - Va en la misma ranura (la mano): uno sustituye al otro.
// - Como el de siempre, sale en la pestaña Colección «K», sin precio.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { seleccionarPiezaKme } from '../js/kme-ropa.js';
import { EditorVisual } from '../js/kme-editor-visual.js';
import { accesoriosExtraValidos } from '../js/kme-receta.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { documentoVisual } from './helpers/dom-visual.js';

const url = new URL('../datos/kme.json', import.meta.url);
const ORIGINAL = 'collage-lightstick-estudio', ENCENDIDO = 'collage-lightstick-estudio-encendido';
const GORRO = 'collage-gorro-punto';
const VARIANTE = { relajado: 'delgado', recto: 'medio', amplio: 'grueso' };
const archivo = (id, v) => `../assets/kme/accesorio/${id}-${v}.svg`;
// Las huellas de los dibujos de siempre (las mismas que comprobó ChatGPT antes de derivar los nuevos).
const HUELLA_ORIGINAL = {
  delgado: '0c3e6294ce5ec2a20dafd935850485c31775aa782265b64a9104dc1937d32273',
  medio: 'ca3f9236a8644135df0dc3851b0b3af555e4e37da27d92b2d92ab20581f2fe09',
  grueso: '77e9d244d54ab1ba51f0de98a307a15e0ce811ec49e07f0aa063687968897890',
};

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
const leer = (ruta) => readFile(new URL(ruta, url));
const ids = (svg) => [...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
const referencias = (svg) => [...svg.matchAll(/url\(#([^)]+)\)|href="#([^"]+)"/g)].map(m => m[1] ?? m[2]);
// Un avatar con ese cuerpo y ese lightstick (solo).
function avatarCon(c, cuerpo, lightstick) {
  const a = structuredClone(c.porDefecto);
  seleccionarPiezaKme(c, a, 'cuerpo', cuerpo);
  seleccionarPiezaKme(c, a, 'accesorio', lightstick);
  return a;
}
// El dibujo encendido sin la luz: el título y el id del recorte de siempre, sin los dos degradados ni
// las tres capas de luz.
const sinLuz = (svg, v) => svg
  .replace('<title>Lightstick de estudio encendido · luz fija</title>', '<title>Lightstick de estudio · collage de resina</title>')
  .replaceAll(`collage-lightstick-encendido-${v}-cabeza`, `collage-lightstick-${v}-cabeza`)
  .replace(/<radialGradient\b[\s\S]*?<\/radialGradient>/g, '')
  .replace(/<(?:ellipse|path)\b[^>]*\bdata-parte="luz-[a-z]+"[^>]*\/>/g, '');

test('Catálogo: el lightstick encendido es una pieza nueva, justo después del de siempre, con su mismo sitio (zona y ranura de la mano), su colocación por cuerpo y su miniatura', async () => {
  const lista = JSON.parse(await readFile(url, 'utf8')).piezas.accesorio;
  const i = lista.findIndex(p => p.id === ORIGINAL);
  assert.equal(lista[i + 1]?.id, ENCENDIDO, 'va justo después del de siempre');
  const { id, nombre, capas, ...resto } = lista[i + 1];
  const { id: _id, nombre: nombreOriginal, capas: capasOriginal, ...restoOriginal } = lista[i];
  assert.equal(nombre, 'Lightstick de estudio · encendido');
  assert.deepEqual(resto, restoOriginal, 'misma colección, zona, ranura, colocación por cuerpo y miniatura');
  assert.deepEqual(capas, { accesorio: Object.values(VARIANTE).map(v => archivo(ENCENDIDO, v)) });
  assert.equal(nombreOriginal, 'Lightstick de estudio', 'el de siempre conserva su nombre');
  assert.deepEqual(capasOriginal, { accesorio: Object.values(VARIANTE).map(v => archivo(ORIGINAL, v)) }, 'y sus dibujos');
});

test('Los dibujos de siempre no cambian; cada variante encendida es la de siempre, byte a byte, más la luz: mismo agarre, mismas texturas y misma colocación', async () => {
  for (const v of Object.values(VARIANTE)) {
    const original = await leer(archivo(ORIGINAL, v));
    assert.equal(createHash('sha256').update(original).digest('hex'), HUELLA_ORIGINAL[v], `${v}: el de siempre, intacto`);
    const encendido = (await leer(archivo(ENCENDIDO, v))).toString('utf8');
    assert.equal(sinLuz(encendido, v), original.toString('utf8'), `${v}: sin la luz, es exactamente el de siempre`);
  }
});

test('La luz: fija y sin nada externo; solo blanco, el fucsia de la marca y rosa claro; el núcleo y el reflejo, dentro de la bola, y el halo, alrededor', async () => {
  for (const v of Object.values(VARIANTE)) {
    const svg = (await leer(archivo(ENCENDIDO, v))).toString('utf8');
    assert.doesNotMatch(svg, /<script|<foreignObject|<filter|<animate|<set\b|\bon\w+\s*=|https?:\/\/(?!www\.w3\.org)/i, v);
    assert.deepEqual(ids(svg).filter(x => !x.endsWith('-cabeza')), [`collage-lightstick-encendido-${v}-halo`, `collage-lightstick-encendido-${v}-nucleo`], `${v}: dos degradados, con ids propios`);
    for (const id of ids(svg)) assert.match(id, /^collage-lightstick-encendido-/, `${v}: no comparte ids con el de siempre`);
    const colores = new Set([...svg.matchAll(/stop-color="([^"]+)"/g)].map(m => m[1].toLowerCase()));
    assert.deepEqual([...colores].sort(), ['#e83475', '#ffb8dc', '#ffffff'], `${v}: colores de la luz`);
    const bola = /<g clip-path="url\(#collage-lightstick-encendido-[a-z]+-cabeza\)">[\s\S]*?<\/g>/.exec(svg)[0];
    assert.match(bola, /data-parte="luz-nucleo"/, `${v}: el núcleo, recortado dentro de la bola`);
    assert.match(bola, /data-parte="luz-reflejo"/, `${v}: el reflejo, también`);
    assert.doesNotMatch(bola, /data-parte="luz-halo"/, `${v}: el halo, fuera del recorte`);
    assert.match(svg, /data-parte="luz-halo"/);
  }
});

test('Con cada cuerpo se dibuja su variante encendida; un avatar con el lightstick de siempre se dibuja exactamente igual que antes, sin luz', async () => {
  const c = await cargar();
  for (const [cuerpo, v] of Object.entries(VARIANTE)) {
    const encendido = avatarCon(c, cuerpo, ENCENDIDO);
    assert.equal(encendido.cuerpo, cuerpo);
    assert.equal(c.contenido(encendido).accesorio, c.archivos.get(archivo(ENCENDIDO, v)), `${cuerpo}: su variante encendida`);
    const svg = svgDelAvatar(c, encendido);
    assert.equal((svg.match(/<image\b/g) ?? []).length, 2, 'las dos texturas de siempre');
    assert.match(svg, /data-parte="luz-nucleo"/);
    const deSiempre = c.contenido(avatarCon(c, cuerpo, ORIGINAL)).accesorio;
    assert.equal(deSiempre, c.archivos.get(archivo(ORIGINAL, v)), `${cuerpo}: el de siempre, igual que antes`);
    assert.doesNotMatch(deSiempre, /luz-/);
  }
});

test('Dos avatares encendidos en una misma página no repiten ids, y los degradados de la luz apuntan a su propio dibujo', async () => {
  const c = await cargar();
  const a = avatarCon(c, 'recto', ENCENDIDO);
  const dibujos = [svgDelAvatar(c, a), svgDelAvatar(c, a), svgDelAvatar(c, a, { estilos: false })];
  const todos = dibujos.flatMap(ids);
  assert.equal(new Set(todos).size, todos.length, 'ningún id se repite en la página');
  for (const svg of dibujos) {
    const propios = new Set(ids(svg));
    for (const ref of referencias(svg)) assert.ok(propios.has(ref), `la referencia #${ref} está en su propio dibujo`);
    assert.doesNotMatch(svg, /\sid="collage-/, 'los ids de la pieza llevan delante el del dibujo');
    assert.match(svg, /fill="url\(#[^)]+-collage-lightstick-encendido-medio-nucleo\)"/);
  }
});

test('El encendido y el de siempre van en la misma ranura (la mano): en el editor, uno sustituye al otro; una receta con los dos a la vez no es válida', async () => {
  const c = await cargar(), e = new EditorVisual(c);
  e.cargarAvatar({ ...structuredClone(c.porDefecto), accesorio: ORIGINAL, accesoriosExtra: [GORRO] });
  e.alternarAccesorio(ENCENDIDO);
  assert.deepEqual([e.avatar.accesorio, ...e.avatar.accesoriosExtra].sort(), [ENCENDIDO, GORRO].sort(), 'el gorro sigue; el de siempre, fuera');
  const valida = (accesorio, accesoriosExtra) => accesoriosExtraValidos(c, { ...structuredClone(c.porDefecto), accesorio, accesoriosExtra });
  assert.equal(valida(ENCENDIDO, [GORRO, 'gafas', 'pin']), true, 'se combina con los de la cabeza');
  assert.equal(valida(ORIGINAL, [ENCENDIDO]), false, 'los dos lightsticks a la vez, no');
});

test('En el editor, sale en Colección «K», con su miniatura encendida, y se elige; no sale en «Accesorios»', async () => {
  const c = await cargar(), doc = documentoVisual(), vista = montarEditorVisual(doc, c);
  doc.buscar('Categoría: Colección «K»').click();
  const boton = doc.buscar('Accesorio: Lightstick de estudio · encendido');
  assert.ok(boton, 'está en Colección «K»');
  assert.ok(doc.buscar('Accesorio: Lightstick de estudio'), 'el de siempre, también');
  assert.match(boton.innerHTML, /viewBox="200 245 120 170"/, 'su miniatura enfoca el lightstick');
  assert.match(boton.innerHTML, /data-parte="luz-nucleo"/, 'y se ve encendido');
  boton.click();
  assert.equal(vista.estado.avatar.accesorio, ENCENDIDO);
  doc.buscar('Categoría: Accesorios').click();
  assert.equal(doc.buscar('Accesorio: Lightstick de estudio · encendido'), undefined, 'las especiales no salen en «Accesorios»');
});
