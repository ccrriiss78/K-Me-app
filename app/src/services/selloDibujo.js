// DIBUJO del sello (D041, 22/11/2026): reparte el espacio del sello según lo que lleve y prepara
// los datos que pinta la plantilla views/partials/_sello.ejs. No toca la base de datos.
//
// El sello tiene la forma del logo de K-ME: un rectángulo vertical de esquinas redondeadas con la
// misma proporción (88,5 × 126,8 en el logo; aquí, 354 × 507) y el mismo grosor de borde.
// Dentro, de arriba abajo, como en el logo («K», carita y «ME»):
//   1. zona principal: la palabra en hangul, el avatar o las dos cosas;
//   2. una franja de adornos, si los hay;
//   3. el alias, si se muestra.
// La distribución es automática: lo que no está (alias, adornos) deja su sitio a la zona principal.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buscarColor, buscarMotivo, buscarEncuadre, MAX_MOTIVOS } from '../catalogos/sello.js';
import { buscarPalabra } from '../catalogos/hangul.js';

export const LIENZO = { ancho: 354, alto: 507, radio: 56, grosorMarco: 13 };
const MARGEN = 22; // aire entre el borde y el contenido
export const CAJA_INTERIOR = Object.freeze({
  x: LIENZO.grosorMarco + MARGEN,
  y: LIENZO.grosorMarco + MARGEN,
  ancho: LIENZO.ancho - 2 * (LIENZO.grosorMarco + MARGEN),
  alto: LIENZO.alto - 2 * (LIENZO.grosorMarco + MARGEN),
});

export const TAM_MIN_HANGUL = 56; // por debajo, el hangul pierde su protagonismo
const HUECO = 14; // separación entre zonas
const ALTO_ALIAS = 40;
const TAM_MAX_ALIAS = 28;
const ANCHO_LETRA_ALIAS = 0.62; // ancho medio de una letra en negrita, en «em» (estimación prudente)
const ALTO_ADORNOS = 36;
const TAM_ADORNO = 32;
const SEPARACION_ADORNOS = 14;
const AJUSTE_HANGUL = 0.9; // cada sílaba ocupa algo menos que su caja: evita que roce los bordes
// Con avatar, la palabra va arriba con este alto (parte de la zona principal): las palabras cortas
// dejan más sitio al avatar y las largas, que ya están limitadas por el ancho, conservan su tamaño.
const PARTE_PALABRA = { 1: 0.24, 2: 0.27, 3: 0.3 };
const PARTE_PALABRA_CUERPO = 0.9; // el cuerpo entero es alto y estrecho: necesita algo más de altura

const FUENTE_HANGUL = "'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Noto Sans CJK KR', sans-serif";
const FUENTE_ALIAS = "'Segoe UI', system-ui, -apple-system, Roboto, sans-serif";

const r2 = (n) => Math.round(n * 100) / 100;

// Reparte el espacio. Recibe cuántas sílabas tiene la palabra (0 = sin palabra), el recorte del
// avatar ({ ancho, alto } o null), el alias que se muestra (o null) y cuántos adornos hay.
export function distribuirSello({ silabas = 0, encuadre = null, alias = null, motivos = 0 }) {
  if (!silabas && !encuadre) throw new Error('El sello necesita una palabra o un avatar.');
  const caja = CAJA_INTERIOR;
  let abajo = caja.y + caja.alto;

  let cajaAlias = null;
  if (alias) {
    const tam = Math.min(TAM_MAX_ALIAS, caja.ancho / (alias.length * ANCHO_LETRA_ALIAS));
    const ancho = Math.min(caja.ancho, alias.length * ANCHO_LETRA_ALIAS * tam);
    cajaAlias = { tam, caja: { x: caja.x + (caja.ancho - ancho) / 2, y: abajo - ALTO_ALIAS, ancho, alto: ALTO_ALIAS } };
    abajo -= ALTO_ALIAS + HUECO;
  }

  const adornos = [];
  const cuantos = Math.min(motivos, MAX_MOTIVOS);
  if (cuantos) {
    const total = cuantos * TAM_ADORNO + (cuantos - 1) * SEPARACION_ADORNOS;
    const y = abajo - ALTO_ADORNOS + (ALTO_ADORNOS - TAM_ADORNO) / 2;
    for (let i = 0; i < cuantos; i++) {
      adornos.push({ x: caja.x + (caja.ancho - total) / 2 + i * (TAM_ADORNO + SEPARACION_ADORNOS), y, tam: TAM_ADORNO });
    }
    abajo -= ALTO_ADORNOS + HUECO;
  }

  const zona = { x: caja.x, y: caja.y, ancho: caja.ancho, alto: abajo - caja.y };
  const centroX = zona.x + zona.ancho / 2;
  let palabra = null;
  let avatar = null;

  const encajar = (ancho, alto, x, y) => {
    // El avatar se escala igual a lo ancho y a lo alto: nunca se deforma.
    const escala = Math.min(ancho / encuadre.ancho, alto / encuadre.alto);
    const a = encuadre.ancho * escala;
    const h = encuadre.alto * escala;
    return { x: x + (ancho - a) / 2, y, ancho: a, alto: h };
  };

  if (silabas && !encuadre) {
    // Solo palabra: en fila o en columna (una sílaba debajo de otra), lo que la haga más grande.
    const enFila = AJUSTE_HANGUL * Math.min(zona.ancho / silabas, zona.alto);
    const enColumna = AJUSTE_HANGUL * Math.min(zona.ancho, zona.alto / silabas);
    const modo = enColumna > enFila * 1.02 ? 'vertical' : 'horizontal';
    const tam = modo === 'vertical' ? enColumna : enFila;
    const ancho = modo === 'vertical' ? tam : tam * silabas;
    const alto = modo === 'vertical' ? tam * silabas : tam;
    palabra = { modo, tam, caja: { x: centroX - ancho / 2, y: zona.y + (zona.alto - alto) / 2, ancho, alto } };
  } else if (!silabas && encuadre) {
    // Solo avatar: aprovecha toda la zona principal.
    avatar = encajar(zona.ancho, zona.alto, zona.x, zona.y);
    avatar.y = zona.y + (zona.alto - avatar.alto) / 2;
  } else {
    // Palabra + avatar: la palabra arriba, en fila, y el avatar debajo.
    const esCuerpo = encuadre.ancho / encuadre.alto < 0.8;
    const porAncho = AJUSTE_HANGUL * zona.ancho / silabas;
    const objetivo = zona.alto * (PARTE_PALABRA[silabas] ?? PARTE_PALABRA[3]) * (esCuerpo ? PARTE_PALABRA_CUERPO : 1);
    const tam = Math.max(TAM_MIN_HANGUL, Math.min(porAncho, objetivo));
    avatar = encajar(zona.ancho, zona.alto - tam - HUECO, zona.x, 0);
    // Si sobra altura (avatar limitado por el ancho), el conjunto se centra en la zona.
    const sobra = zona.alto - (tam + HUECO + avatar.alto);
    const arriba = zona.y + sobra / 2;
    palabra = { modo: 'horizontal', tam, caja: { x: centroX - (tam * silabas) / 2, y: arriba, ancho: tam * silabas, alto: tam } };
    avatar.y = arriba + tam + HUECO;
  }

  return { zonaPrincipal: zona, palabra, avatar, motivos: adornos, alias: cajaAlias };
}

// --- Contraste (WCAG): avisar si un elemento se distingue poco del fondo. No impide guardar. ---

function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(hexA, hexB) {
  const [a, b] = [luminancia(hexA), luminancia(hexB)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

// Umbrales: 3:1 para dibujos y letras grandes, 4,5:1 para el alias (letra pequeña), 2:1 para que
// el marco no desaparezca contra el fondo.
export function avisosDeContraste(composicion) {
  const fondo = buscarColor(composicion.fondo)?.valor;
  if (!fondo) return [];
  const avisos = new Set();
  const poco = (idColor, minimo) => {
    const valor = buscarColor(idColor)?.valor;
    return valor && contraste(valor, fondo) < minimo;
  };
  if (poco(composicion.borde, 2)) avisos.add('El marco casi no se distingue del fondo.');
  if (composicion.palabra && poco(composicion.palabra.color, 3)) avisos.add('La palabra se distingue poco del fondo.');
  if (composicion.alias?.visible && poco(composicion.alias.color, 4.5)) avisos.add('El alias se lee mal sobre este fondo.');
  for (const m of composicion.motivos ?? []) {
    const motivo = buscarMotivo(m.id);
    if (motivo && poco(m.color, 3)) avisos.add(`El adorno «${motivo.texto}» se distingue poco del fondo.`);
  }
  return [...avisos];
}

// --- Datos para la plantilla _sello.ejs ---

// Los dibujos de los adornos se leen una vez de app/public. Son archivos propios: se quitan el
// <svg> exterior y los comentarios, y el negro pasa a «currentColor» para pintarlos del color elegido.
const carpetaPublica = fileURLToPath(new URL('../../public/', import.meta.url));
const dibujos = new Map();
function dibujoDe(motivo) {
  if (!dibujos.has(motivo.id)) {
    const svg = readFileSync(carpetaPublica + motivo.icono.replace(/^\//, ''), 'utf8');
    dibujos.set(motivo.id, svg
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/^[\s\S]*?<svg\b[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '')
      .replace(/(stroke|fill)="(#000|#000000|black)"/g, '$1="currentColor"')
      .trim());
  }
  return dibujos.get(motivo.id);
}

// Coloca el SVG de un avatar (salida del dibujador de avatares, nunca algo enviado por el navegador)
// en su caja del sello, con el recorte del encuadre y sin deformarlo.
function encajarSvgAvatar(svg, caja, recorte) {
  return svg.replace(/<svg\b[^>]*>/, (etiqueta) => etiqueta
    .replace(/\s(?:width|height|x|y|viewBox|preserveAspectRatio)="[^"]*"/g, '')
    .replace(/<svg/, `<svg x="${r2(caja.x)}" y="${r2(caja.y)}" width="${r2(caja.ancho)}" height="${r2(caja.alto)}" viewBox="${recorte.x} ${recorte.y} ${recorte.ancho} ${recorte.alto}" preserveAspectRatio="xMidYMid meet"`));
}

// composicion: la receta ya validada (selloService). alias: el alias público de la cuenta.
// avatarSvg: el avatar dibujado por selloService.dibujar, si lo hay; sin él, se marca su hueco.
export function prepararDibujo(composicion, { alias = '', avatarSvg = null } = {}) {
  const color = (id) => buscarColor(id)?.valor ?? '#000000';
  const palabra = composicion.palabra ? buscarPalabra(composicion.palabra.id) : null;
  const silabas = palabra ? [...palabra.hangul] : [];
  const encuadre = composicion.avatar ? buscarEncuadre(composicion.avatar.encuadre) : null;
  const textoAlias = composicion.alias?.visible && alias ? alias : null;
  const motivos = (composicion.motivos ?? []).map((m) => ({ ...m, motivo: buscarMotivo(m.id) })).filter((m) => m.motivo);
  const d = distribuirSello({ silabas: silabas.length, encuadre: encuadre?.recorte ?? null, alias: textoAlias, motivos: motivos.length });

  let dibujoPalabra = null;
  if (d.palabra) {
    const { tam, caja, modo } = d.palabra;
    const lineas = modo === 'vertical'
      ? silabas.map((s, i) => ({ texto: s, x: r2(caja.x + caja.ancho / 2), y: r2(caja.y + tam * (i + 0.5)) }))
      : [{ texto: silabas.join(''), x: r2(caja.x + caja.ancho / 2), y: r2(caja.y + tam / 2) }];
    dibujoPalabra = { lineas, tam: r2(tam), color: color(composicion.palabra.color), fuente: FUENTE_HANGUL };
  }

  let dibujoAvatar = null;
  if (d.avatar) {
    const caja = { x: r2(d.avatar.x), y: r2(d.avatar.y), ancho: r2(d.avatar.ancho), alto: r2(d.avatar.alto) };
    dibujoAvatar = { ...caja, svg: avatarSvg ? encajarSvgAvatar(avatarSvg, caja, encuadre.recorte) : null };
  }

  const partes = [];
  if (palabra) partes.push(`${palabra.hangul} (${palabra.significado})`);
  if (encuadre) partes.push(`avatar, ${encuadre.texto.toLowerCase()}`);
  if (textoAlias) partes.push(`alias ${textoAlias}`);

  return {
    lienzo: LIENZO,
    interior: {
      x: LIENZO.grosorMarco, y: LIENZO.grosorMarco,
      ancho: LIENZO.ancho - 2 * LIENZO.grosorMarco, alto: LIENZO.alto - 2 * LIENZO.grosorMarco,
      radio: LIENZO.radio - LIENZO.grosorMarco,
    },
    colores: { borde: color(composicion.borde), fondo: color(composicion.fondo) },
    etiqueta: `Sello: ${partes.join(', ')}`,
    palabra: dibujoPalabra,
    avatar: dibujoAvatar,
    motivos: d.motivos.map((caja, i) => ({
      x: r2(caja.x), y: r2(caja.y), escala: r2(caja.tam / 24), color: color(motivos[i].color), contenido: dibujoDe(motivos[i].motivo),
    })),
    alias: d.alias && {
      texto: textoAlias,
      x: r2(d.alias.caja.x + d.alias.caja.ancho / 2),
      y: r2(d.alias.caja.y + d.alias.caja.alto / 2),
      tam: r2(d.alias.tam),
      color: color(composicion.alias.color),
      fuente: FUENTE_ALIAS,
    },
  };
}
