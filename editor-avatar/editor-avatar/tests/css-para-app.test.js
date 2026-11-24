// Estilos del editor dentro de la app (T037): los estilos aprobados (css/kme-muestras.css) se usan
// tal cual, pero limitados al contenedor .avatar-studio para no cambiar la cabecera ni el resto de
// la página. css/kme-muestras-app.css lo genera scripts/css-para-app.mjs: no se edita a mano.
// Las variables de color se quedan en :root para que «Mi ambiente» las pueda cambiar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { limitarCss, RAIZ } from '../scripts/css-para-app.mjs';

const leer = (ruta) => readFile(new URL(ruta, import.meta.url), 'utf8');
// Reglas sencillas «selectores{declaraciones}», también las de dentro de @media.
const reglas = (css) => [...css.replace(/@media[^{]*\{/g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selectores: m[1].trim(), cuerpo: m[2] }));

test('Limita cada selector al contenedor: body, main y :root pasan a ser el contenedor', () => {
  const css = limitarCss('body{margin:0}main{gap:1px}h1,a:hover{color:red}.x>span{top:0}');
  assert.match(css, /\.avatar-studio\{margin:0\}/);
  assert.match(css, /\.avatar-studio\{gap:1px\}/);
  assert.match(css, /\.avatar-studio h1,\.avatar-studio a:hover\{color:red\}/);
  assert.match(css, /\.avatar-studio \.x>span\{top:0\}/);
});

test('Las variables de :root se quedan en :root (para «Mi ambiente») y lo demás va al contenedor', () => {
  const css = limitarCss(':root{\n  --a:#fff;--b:#000;\n  font-family:Arial;color:var(--a)\n}');
  assert.match(css, /:root\{--a:#fff;--b:#000\}/);
  assert.match(css, /\.avatar-studio\{font-family:Arial;color:var\(--a\)\}/);
});

test('Respeta @media, los comentarios y las comas dentro de :is() o :has()', () => {
  const css = limitarCss('/* nota */@media(max-width:5px){*{x:y}.a:is(.b,.c){z:w}}');
  assert.doesNotMatch(css, /nota/);
  assert.match(css, /@media\(max-width:5px\)\{\.avatar-studio \*\{x:y\}\.avatar-studio \.a:is\(\.b,\.c\)\{z:w\}\}/);
});

test('Con los estilos aprobados, no queda ningún selector sin limitar y se conservan todas las reglas', async () => {
  const original = await leer('../css/kme-muestras.css');
  const css = limitarCss(original);
  const lista = reglas(css);
  assert.equal(lista.length, reglas(original.replace(/\/\*[\s\S]*?\*\//g, '')).length + 1, 'una más: :root se parte en dos');
  for (const { selectores, cuerpo } of lista) {
    if (selectores === ':root') {
      for (const d of cuerpo.split(';').filter((x) => x.trim())) assert.match(d.trim(), /^--/, `en :root solo variables: ${d}`);
      continue;
    }
    for (const s of selectores.split(/,(?![^(]*\))/)) assert.ok(s.trim().startsWith(RAIZ), `sin limitar: ${s}`);
  }
});

test('css/kme-muestras-app.css está al día con css/kme-muestras.css (se regenera con el script)', async () => {
  const generado = await leer('../css/kme-muestras-app.css');
  const esperado = limitarCss(await leer('../css/kme-muestras.css'));
  assert.ok(generado.includes(esperado), 'ejecuta: node scripts/css-para-app.mjs');
  assert.match(generado, /^\/\* GENERADO/, 'avisa de que no se edita a mano');
});
