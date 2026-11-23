import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Los tres rostros no llevan la curva rosada bajo las mejillas', async () => {
  for (const forma of ['redondo','ovalado','cuadrado']) {
    const svg = await readFile(new URL(`../assets/kme/cabeza/${forma}.svg`, import.meta.url), 'utf8');
    assert.doesNotMatch(svg, /stroke="#e5acba"/i, `Sobra el sombreado curvo en ${forma}`);
  }
});
