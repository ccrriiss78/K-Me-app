import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { documentoVisual } from './helpers/dom-visual.js';

const html = await readFile(new URL('../kme-muestras.html', import.meta.url), 'utf8');

test('Las tres salidas de impresión forman un grupo y solo las photocards comparten su ayuda', () => {
  const grupo = html.match(/<div class="botones-impresion"[^>]*>([\s\S]*?)<\/div>/)?.[1];
  assert.ok(grupo, 'Existe un grupo común de impresión');
  for (const id of ['imprimir-avatar', 'imprimir-55x85', 'imprimir-54x86']) {
    assert.match(grupo, new RegExp('<button[^>]*id="' + id + '"'));
  }
  for (const id of ['imprimir-55x85', 'imprimir-54x86']) {
    assert.match(grupo, new RegExp('<button[^>]*id="' + id + '"[^>]*aria-describedby="ayuda-photocards"'));
  }
  const botonAvatar = grupo.match(/<button[^>]*id="imprimir-avatar"[^>]*>/)[0];
  assert.doesNotMatch(botonAvatar, /aria-describedby="[^"]*\bayuda-photocards\b/);
  assert.match(html, /id="ayuda-photocards"[^>]*>Descarga el PDF e imprímelo en tamaño real\.</);
});

test('La pantalla de creación no muestra enlaces internos de comparación ni al editor antiguo', () => {
  assert.doesNotMatch(html, /Comparaciones de diseño|KME_COMPARAR_OJOS\.html|KME_REVISAR_UNIONES\.html|Abrir el editor anterior/);
});

test('La edición normal no añade mensajes de revisión debajo del estudio', async () => {
  const url = new URL('../datos/kme.json', import.meta.url);
  const datos = JSON.parse(await readFile(url, 'utf8')), archivos = new Map();
  for (const lista of Object.values(datos.piezas)) for (const pieza of lista) {
    for (const capa in pieza.capas) {
      pieza.capas[capa] = [pieza.capas[capa]].flat();
      for (const ruta of pieza.capas[capa]) {
        const svg = await readFile(new URL(ruta, url), 'utf8');
        archivos.set(ruta, svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>')));
      }
    }
  }
  const doc = documentoVisual();
  montarEditorVisual(doc, new Catalogo(datos, archivos));
  assert.equal(doc.getElementById('estado').textContent, '');
  doc.buscar('Base: 2').click();
  assert.equal(doc.getElementById('estado').textContent, '');
});
