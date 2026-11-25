// La photocard de Connect y la tarjeta del editor de Avatar Studio usan la misma clase, «photocard»
// (E0084). Los estilos de la de Connect (76 × 100 px, borde negro y rayitas fucsias, en estilos.css)
// tienen que quedarse en las publicaciones del muro: en el móvil aplastaban la tarjeta del editor a
// 100 px de alto y el avatar se salía por encima del botón «Guardar» (medido en Chrome a 390-504 px).
// No necesitan base de datos. Ejecutar desde app/:  npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const leer = (ruta) => readFile(new URL(ruta, import.meta.url), 'utf8');

test('Los estilos de la photocard de Connect solo alcanzan las publicaciones del muro, no la tarjeta del editor', async () => {
  const css = (await leer('../public/css/estilos.css')).replace(/\/\*[\s\S]*?\*\//g, '');
  const selectores = [...css.matchAll(/([^{}]+)\{/g)]
    .flatMap((m) => m[1].split(','))
    .map((s) => s.trim())
    .filter((s) => /\.photocard/.test(s));
  assert.ok(selectores.length >= 10, 'estilos.css tiene los estilos de la photocard de Connect');
  for (const s of selectores) assert.match(s, /^\.publicacion \.photocard/, `«${s}» alcanzaría también la tarjeta del editor`);
  // Las dos usan la clase: la de Connect, dentro de cada publicación; la del editor, fuera.
  assert.match(await leer('../src/views/connect.ejs'), /class="publicacion"[\s\S]*class="photocard/);
  assert.match(await leer('../src/views/avatar-editor.ejs'), /<div class="photocard">/);
});
