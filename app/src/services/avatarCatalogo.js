// CATÁLOGO Y DIBUJO DEL AVATAR EN EL SERVIDOR (Avatar Studio, contrato v1, 23/11/2026).
//
// Reutiliza tal cual el catálogo y el dibujador del editor de ChatGPT (editor-avatar/editor-avatar/,
// su zona: aquí solo se leen). Como explica ChatGPT en propuestas-sello/ENTREGA_SELLO_A_CLAUDE.md,
// `Catalogo` y `svgDelAvatar` funcionan en Node si se precargan los dibujos desde el disco; el
// cargador del navegador (`cargarCatalogo`) no se usa aquí. Se carga una sola vez, al primer uso.

import { readFileSync } from 'node:fs';
import { Catalogo } from '../../../editor-avatar/editor-avatar/js/catalogo.js';
import { normalizarAvatar } from '../../../editor-avatar/editor-avatar/js/estado.js';
import { svgDelAvatar } from '../../../editor-avatar/editor-avatar/js/renderizador.js';
import { buscarEncuadre } from '../catalogos/sello.js';

const URL_DATOS = new URL('../../../editor-avatar/editor-avatar/datos/kme.json', import.meta.url);
let catalogo = null;

// Lee el catálogo (kme.json) y el interior de cada dibujo SVG que usan sus piezas, igual que el
// test del editor avatar-sello-node.test.js: capas como listas y las mismas claves que el JSON.
export function obtenerCatalogo() {
  if (catalogo) return catalogo;
  const datos = JSON.parse(readFileSync(URL_DATOS, 'utf8'));
  const archivos = new Map();
  const leerDibujo = (ruta) => {
    if (archivos.has(ruta)) return;
    const svg = readFileSync(new URL(ruta, URL_DATOS), 'utf8');
    archivos.set(ruta, svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>')));
  };
  for (const lista of Object.values(datos.piezas)) {
    for (const pieza of lista) {
      for (const capa in pieza.capas) {
        pieza.capas[capa] = [pieza.capas[capa]].flat();
        pieza.capas[capa].forEach(leerDibujo);
      }
    }
  }
  for (const fija of datos.fijas ?? []) if (fija.archivo) leerDibujo(fija.archivo);
  catalogo = new Catalogo(datos, archivos);
  return catalogo;
}

// La receta con la que empieza un avatar nuevo: los valores por defecto del catálogo («porDefecto»).
export function recetaPorDefecto() {
  return structuredClone(obtenerCatalogo().datos.porDefecto);
}

// Completa una receta con los valores por defecto y descarta las claves desconocidas, con la misma
// función que usa el editor. OJO: no valida (lo hace avatarService.leerReceta).
export function normalizarReceta(receta) {
  return normalizarAvatar(receta, obtenerCatalogo().datos.porDefecto);
}

// Dibuja un avatar YA VALIDADO como SVG, sin su capa de fondo (en el sello se ve el fondo del
// sello) y con un id propio en cada dibujo (svgDelAvatar numera los ids: no se repiten en una página).
// encuadre: «rostro» (solo las capas de la cabeza) o «cuerpo»; sin encuadre, el lienzo entero.
// alto (opcional, con encuadre): alto en píxeles; el ancho sale con la proporción del encuadre. El
// CSS puede cambiar después el tamaño sin tocar el servidor.
export function dibujarAvatar(receta, { encuadre = null, alto = null } = {}) {
  const e = encuadre ? buscarEncuadre(encuadre) : null;
  const opciones = { conFondo: false };
  if (e) {
    opciones.recorte = `${e.recorte.x} ${e.recorte.y} ${e.recorte.ancho} ${e.recorte.alto}`;
    if (e.capas) opciones.soloCapas = e.capas;
  }
  const svg = svgDelAvatar(obtenerCatalogo(), receta, opciones);
  if (!e || !alto) return svg;
  const ancho = Math.round((alto * e.recorte.ancho) / e.recorte.alto);
  return svg.replace(/^<svg\b/, `<svg width="${ancho}" height="${alto}"`);
}
