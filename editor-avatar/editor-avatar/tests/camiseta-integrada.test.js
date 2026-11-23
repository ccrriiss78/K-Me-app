import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { escribir } from '../js/utilidades.js';
const url = new URL('../datos/kme.json', import.meta.url);
const tallas = { relajado: 'delgado', recto: 'medio', amplio: 'grueso' };
async function cargar() {
  const datos = JSON.parse(await readFile(url, 'utf8'));
  const archivos = new Map();
  for (const lista of Object.values(datos.piezas)) for (const p of lista) for (const capa in p.capas) {
    p.capas[capa] = [p.capas[capa]].flat();
    for (const archivo of p.capas[capa]) {
      const texto = await readFile(new URL(archivo, url), 'utf8');
      archivos.set(archivo, texto.slice(texto.indexOf('>') + 1, texto.lastIndexOf('</svg>')));
    }
  }
  return new Catalogo(datos, archivos);
}
async function seleccionar(...args) {
  let modulo;
  try { modulo = await import('../js/kme-ropa.js'); }
  catch (error) { if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error; }
  // Antes de implementar la adaptación se conserva el comportamiento actual.
  if (modulo) return modulo.seleccionarPiezaKme(...args);
  const [, avatar, ruta, valor] = args; escribir(avatar, ruta, valor);
}
test('La camiseta tiene tres siluetas distintas y reúne cuello, brazos, manos y tejido con colores independientes', async () => {
  const c = await cargar(), dibujos = [];
  for (const talla of Object.values(tallas)) {
    const pieza = c.pieza('ropa.arriba', `camiseta-integrada-${talla}`);
    assert.ok(pieza, `Falta camiseta ${talla}`);
    const svg = c.archivos.get(pieza.capas.ropa_arriba[0]);
    for (const parte of ['cuello', 'brazo-izquierdo', 'brazo-derecho', 'camiseta']) assert.match(svg, new RegExp(`data-parte="${parte}"`));
    assert.match(svg, /class="f-piel"/);
    assert.match(svg, /class="f-arriba"/);
    dibujos.push(svg.match(/data-parte="camiseta"[^>]*d="([^"]+)"/)[1]);
  }
  assert.equal(new Set(dibujos).size, 3, 'La silueta debe cambiar, no solo el nombre');
});
test('Al combinar la camiseta con cualquier cuerpo y prenda inferior se oculta el cuerpo antiguo y siguen visibles piernas y calzado', async () => {
  const c = await cargar();
  for (const cuerpo of Object.keys(tallas)) for (const talla of Object.values(tallas)) for (const inferior of c.piezas('ropa.abajo')) {
    const avatar = structuredClone(c.porDefecto);
    avatar.cuerpo = cuerpo;
    avatar.ropa.arriba = `camiseta-integrada-${talla}`;
    avatar.ropa.abajo = inferior.id;
    const capas = c.contenido(avatar);
    assert.equal(capas.cuerpo, '', 'No deben reaparecer los brazos ni el cuello antiguos');
    assert.match(capas.ropa_arriba, /data-parte="cuello"/);
    assert.match(capas.piernas ?? '', /data-parte="piernas"/);
    assert.match(capas.piernas ?? '', /data-parte="calzado"/);
    assert.ok(capas.ropa_abajo);
  }
});
test('Cambiar el tamaño del cuerpo adapta la camiseta; elegir una camiseta concreta selecciona su cuerpo correspondiente', async () => {
  const c = await cargar(), avatar = structuredClone(c.porDefecto);
  avatar.ropa.arriba = 'camiseta-integrada-delgado';
  for (const [cuerpo,talla] of Object.entries(tallas)) {
    await seleccionar(c, avatar, 'cuerpo', cuerpo);
    assert.equal(avatar.ropa.arriba, `camiseta-integrada-${talla}`);
  }
  for (const [cuerpo,talla] of Object.entries(tallas)) {
    await seleccionar(c, avatar, 'ropa.arriba', `camiseta-integrada-${talla}`);
    assert.equal(avatar.cuerpo, cuerpo);
  }
  await seleccionar(c, avatar, 'ropa.arriba', 'chaqueta');
  assert.ok(c.contenido(avatar).cuerpo, 'La ropa anterior debe conservar su cuerpo original');
  assert.equal(c.contenido(avatar).piernas, '', 'No se deben duplicar las piernas con ropa anterior');
});
test('Las tres bases permiten comparar inicialmente la camiseta delgada, media y gruesa', async () => {
  const c = await cargar();
  assert.deepEqual(c.datos.bases.map(b => b.avatar.ropa.arriba), Object.values(tallas).map(t => `camiseta-integrada-${t}`));
});
