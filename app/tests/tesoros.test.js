// «Mis tesoros» (D082): Luz Hangul 001 encendida (E0097). La luz son capas de adorno en CSS
// (identidad.css, bloque «Mis tesoros como recuerdos») colocadas con las medidas del dibujo original,
// que no se cambia: lienzo de 160 × 220 y la bola de luz centrada en (80, 70), con radio 44 y un
// contorno de 5. Si alguien cambia el dibujo, este test avisa de que hay que recolocar la luz.
// No necesita base de datos. Desde app/:  npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const svg = readFileSync(new URL('../public/img/tesoros/luz-hangul-001.svg', import.meta.url), 'utf8');

test('Luz Hangul 001 conserva las medidas con las que se coloca su luz: lienzo 160 × 220 y bola en (80, 70) con radio 44', () => {
  assert.match(svg, /viewBox="0 0 160 220"/, 'el lienzo');
  assert.match(svg, /<circle cx="80" cy="70" r="44" fill="#fff" stroke="#000" stroke-width="5"\/>/, 'la bola de luz, blanca con contorno negro');
});
