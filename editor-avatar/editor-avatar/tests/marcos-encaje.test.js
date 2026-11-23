import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { svgConMarco } from '../js/kme-marcos.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { documentoVisual } from './helpers/dom-visual.js';

const url = new URL('../datos/kme.json', import.meta.url);
const datos = JSON.parse(await readFile(url, 'utf8')), archivos = new Map();
for (const lista of Object.values(datos.piezas)) for (const p of lista) for (const capa in p.capas) {
  p.capas[capa] = [p.capas[capa]].flat();
  for (const ruta of p.capas[capa]) {
    const s = await readFile(new URL(ruta, url), 'utf8');
    archivos.set(ruta, s.slice(s.indexOf('>') + 1, s.lastIndexOf('</svg>')));
  }
}
const catalogo = new Catalogo(datos, archivos);

test('Ambos marcos encajan el avatar grande alrededor de su eje x=200, sin tamaños físicos SVG anidados', () => {
  for (const base of datos.bases) for (const marco of ['transparente', 'charms']) {
    const avatar = svgDelAvatar(catalogo, base.avatar, {ancho:800, alto:960, id:'avatar-encaje'});
    const svg = svgConMarco(avatar, marco);
    const ventana = svg.match(/<svg data-parte="ventana-avatar"[^>]*>/)[0];
    assert.match(ventana, /viewBox="60 0 280 450"/);
    assert.match(ventana, /preserveAspectRatio="xMidYMid meet"/);
    assert.match(svg, /id="avatar-encaje"[^>]*x="0" y="0" width="400" height="480"/);
    assert.ok(svg.includes('data-parte="brazo-izquierdo"'));
    assert.doesNotMatch(svg, /width="800"|height="960"|data-formato=/);
    const [x,y,w,h] = ventana.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
    assert.equal(x + w/2, 200); assert.ok(h < 480); assert.equal(y, 0);
  }
});

test('La vista grande y las miniaturas usan el mismo encaje de marco; sin marco conserva la photocard', () => {
  const doc = documentoVisual(); montarEditorVisual(doc, catalogo);
  assert.match(doc.getElementById('avatar-grande').innerHTML, /data-formato="55x85"/);
  doc.buscar('Categoría: Marcos').click();doc.buscar('Marco: Con charms').click();
  const grande = doc.getElementById('avatar-grande').innerHTML;
  assert.doesNotMatch(grande, /data-formato=|width="55mm"/);
  assert.match(grande, /viewBox="60 0 280 450"/);
  assert.match(doc.buscar('Marco: Con charms').innerHTML, /viewBox="60 0 280 450"/);
  doc.buscar('Marco: Sin marco').click();
  assert.match(doc.getElementById('avatar-grande').innerHTML, /data-formato="55x85"/);
});
