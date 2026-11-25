// Pestaña Colección «K» (E0083): las piezas especiales (lotes collage) van solo aquí. K-ME Studio la
// abre al cargar, resaltada, con el botón «Canjear Kpopis»; las piezas de canje que la cuenta no
// tiene no aparecen. Sin opciones (la muestra autónoma), la pestaña existe y lo enseña todo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { documentoVisual } from './helpers/dom-visual.js';

const url = new URL('../datos/kme.json', import.meta.url);
async function cargar() {
  const d = JSON.parse(await readFile(url, 'utf8')), archivos = new Map();
  for (const lista of Object.values(d.piezas)) for (const p of lista) for (const capa in p.capas) {
    p.capas[capa] = [p.capas[capa]].flat();
    for (const a of p.capas[capa]) { const s = await readFile(new URL(a, url), 'utf8'); archivos.set(a, s.slice(s.indexOf('>') + 1, s.lastIndexOf('</svg>'))); }
  }
  return new Catalogo(d, archivos);
}
const especiales = (c) => ['ropa.arriba', 'ropa.abajo', 'accesorio'].flatMap(r => c.piezas(r).filter(p => (p.coleccion || '').startsWith('collage-')));

test('En K-ME Studio, Colección «K» se abre al cargar, resaltada, con «Canjear Kpopis», y sin las piezas de canje que no tienes', async () => {
  const c = await cargar(), doc = documentoVisual();
  montarEditorVisual(doc, c, { categoriaInicial: 'coleccion', bloqueadas: ['collage-top-lentejuelas', 'collage-chaqueta-denim'], urlCanje: '/studio/coleccion-k' });
  const pestana = doc.buscar('Categoría: Colección «K»');
  assert.equal(pestana.getAttribute('aria-pressed'), 'true', 'abierta al cargar');
  assert.match(pestana.className, /categoria--k/, 'resaltada');
  assert.equal(doc.buscar('Canjear Kpopis')?.href, '/studio/coleccion-k');
  assert.equal(doc.buscar('Parte superior: Top Destello · delgado'), undefined, 'el top de canje no es tuyo');
  assert.ok(doc.buscar('Parte inferior: Falda con bolsillos de tela · delgado'), 'las especiales gratis sí');
  assert.ok(doc.buscar('Accesorio: Gorro de punto'));
});

test('Sin opciones (la muestra), Colección «K» enseña todas las especiales y no hay botón de canje; «Ropa» y «Accesorios», ninguna', async () => {
  const c = await cargar(), doc = documentoVisual(), vista = montarEditorVisual(doc, c);
  assert.equal(doc.buscar('Categoría: Colección «K»').getAttribute('aria-pressed'), 'false', 'la muestra sigue abriéndose en «Ojos»');
  doc.buscar('Categoría: Colección «K»').click();
  assert.equal(doc.buscar('Canjear Kpopis'), undefined);
  assert.ok(doc.buscar('Parte superior: Top Destello · ' + { relajado: 'delgado', recto: 'medio', amplio: 'grueso' }[vista.estado.avatar.cuerpo]));
  for (const [pestana, prefijos] of [['Ropa', ['Parte superior: ', 'Parte inferior: ']], ['Accesorios', ['Accesorio: ']]]) {
    doc.buscar('Categoría: ' + pestana).click();
    for (const p of especiales(c)) for (const prefijo of prefijos) assert.equal(doc.buscar(prefijo + p.nombre), undefined, `${p.id} no sale en «${pestana}»`);
  }
});
