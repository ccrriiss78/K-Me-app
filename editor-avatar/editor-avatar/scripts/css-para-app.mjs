// ESTILOS DEL EDITOR PARA LA APP (T037). Genera css/kme-muestras-app.css a partir de los estilos
// aprobados (css/kme-muestras.css) sin cambiarlos: solo los limita al contenedor .avatar-studio de la
// app, para que no toquen la cabecera, el menú ni el resto de la página.
// - Cada selector pasa a ir dentro del contenedor («h1» → «.avatar-studio h1»).
// - body, html y main (la página de la muestra) pasan a ser el propio contenedor.
// - Las variables de :root se quedan en :root, porque «Mi ambiente» las cambia en la raíz de la
//   página; lo demás de :root (letra, color, fondo) va al contenedor.
// - Se quitan los comentarios. Las reglas @media se conservan, con sus reglas limitadas.
// Uso, desde editor-avatar/editor-avatar/:  node scripts/css-para-app.mjs
// El test tests/css-para-app.test.js comprueba que el archivo generado está al día.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const RAIZ = '.avatar-studio';
const COMO_CONTENEDOR = new Set([':root', 'html', 'body', 'main']);

// Parte por comas que no estén dentro de paréntesis (:is(.a,.b) es un solo selector).
function partirPorComas(texto) {
  const partes = [];
  let nivel = 0, actual = '';
  for (const c of texto) {
    if (c === '(') nivel++;
    if (c === ')') nivel--;
    if (c === ',' && nivel === 0) { partes.push(actual); actual = ''; } else actual += c;
  }
  partes.push(actual);
  return partes.map((p) => p.trim()).filter(Boolean);
}

const limitarSelector = (selector, raiz) => (COMO_CONTENEDOR.has(selector) ? raiz : `${raiz} ${selector}`);

// Las declaraciones de un bloque, sin espacios sobrantes ni la última «;».
const declaraciones = (cuerpo) => cuerpo.split(';').map((d) => d.trim()).filter(Boolean);

// Busca la llave que cierra la que se abre en «desde» (los estilos no llevan llaves en textos).
function cierre(css, desde) {
  let nivel = 0;
  for (let i = desde; i < css.length; i++) {
    if (css[i] === '{') nivel++;
    if (css[i] === '}' && --nivel === 0) return i;
  }
  throw new Error('Falta una llave de cierre en los estilos.');
}

function limitarBloque(css, raiz) {
  let salida = '';
  let i = 0;
  while (i < css.length) {
    const abre = css.indexOf('{', i);
    if (abre === -1) break;
    const preludio = css.slice(i, abre).trim();
    const fin = cierre(css, abre);
    const cuerpo = css.slice(abre + 1, fin);
    if (preludio.startsWith('@media') || preludio.startsWith('@supports')) {
      salida += `${preludio}{${limitarBloque(cuerpo, raiz).replace(/\n/g, '')}}\n`;
    } else if (preludio.startsWith('@')) {
      salida += `${preludio}{${cuerpo.trim()}}\n`; // @keyframes, @font-face…: tal cual
    } else if (preludio === ':root') {
      const lista = declaraciones(cuerpo);
      const variables = lista.filter((d) => d.startsWith('--'));
      const resto = lista.filter((d) => !d.startsWith('--'));
      if (variables.length) salida += `:root{${variables.join(';')}}\n`;
      if (resto.length) salida += `${raiz}{${resto.join(';')}}\n`;
    } else {
      const selectores = partirPorComas(preludio).map((s) => limitarSelector(s, raiz)).join(',');
      salida += `${selectores}{${declaraciones(cuerpo).join(';')}}\n`;
    }
    i = fin + 1;
  }
  return salida;
}

export function limitarCss(css, raiz = RAIZ) {
  return limitarBloque(css.replace(/\/\*[\s\S]*?\*\//g, ''), raiz);
}

// Ejecutado como script: escribe css/kme-muestras-app.css.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const raiz = new URL('../', import.meta.url);
  const original = await readFile(new URL('css/kme-muestras.css', raiz), 'utf8');
  const aviso = '/* GENERADO por scripts/css-para-app.mjs a partir de css/kme-muestras.css (los estilos aprobados del\n'
    + '   editor), limitado al contenedor .avatar-studio de la app. No se edita a mano: se regenera. */\n';
  await writeFile(new URL('css/kme-muestras-app.css', raiz), aviso + limitarCss(original), 'utf8');
  console.log('Preparado: css/kme-muestras-app.css');
}
