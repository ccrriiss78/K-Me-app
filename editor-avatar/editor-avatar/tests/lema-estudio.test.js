import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('El lema Sin fan no hay idol tiene un lugar propio en la cabecera y no repite el remate descartado', async () => {
  const html = await readFile(new URL('../kme-muestras.html', import.meta.url), 'utf8');
  const cabecera = html.match(/<header\b[\s\S]*?<\/header>/)?.[0];
  assert.match(cabecera, /class="lema-principal"[^>]*>Sin <strong>fan<\/strong>,? no hay <strong>idol<\/strong>\./);
  assert.doesNotMatch(html, /Sin ti, no hay otro tú|<footer\b/);
});

test('Las opciones que no caben permiten recibir foco para desplazarse con el teclado', async () => {
  const html = await readFile(new URL('../kme-muestras.html', import.meta.url), 'utf8');
  assert.match(html, /id="panel-editor"[^>]*tabindex="0"[^>]*role="region"[^>]*aria-label="Opciones de la categoría"/);
});
