import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';

async function muestra() {
  try { return await readFile(new URL('../KME_ABRIR_MUESTRA.html', import.meta.url), 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return ''; throw error; }
}
test('La muestra para doble clic lleva sus dibujos, estilos, logo y código dentro del archivo', async () => {
  const html = await muestra();
  assert.match(html, /<title>K-ME/);
  assert.match(html, /<style>/);
  assert.match(html, /data:image\/svg\+xml;base64,/);
  assert.match(html, /redondos-guino-derecho/);
  assert.match(html, /cuadrado/);
  assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+rel="stylesheet"|<script[^>]+type="module"/);
  const codigo = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x => x[1]).join('\n');
  assert.ok(codigo.length > 20000, 'Debe incluir los assets y el renderizador');
  assert.doesNotThrow(() => new Script(codigo), 'Código ejecutable sin cargar módulos externos');
  assert.match(codigo, /const catalogo=KME_CATALOGO_LOCAL/);
});
