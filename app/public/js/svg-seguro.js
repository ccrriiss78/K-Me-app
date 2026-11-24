// FILTRO DE SEGURIDAD para los SVG que llegan del servidor y se insertan en la página (la vista
// previa del sello, public/js/sello.js). El servidor ya los dibuja a partir de recetas validadas;
// esto es una segunda barrera por si algo llegara alterado.
// - Rechaza scripts, foreignObject, iframes, enlaces, animaciones y cualquier atributo «on…».
// - Los enlaces internos («#…») se permiten; los externos, no.
// - Desde el lote collage 01 (D067, E0079), una pieza del avatar puede llevar texturas: solo
//   <image> con un PNG incrustado en base64, válido (firma y cabecera PNG), de 20 KiB como mucho,
//   256 px por lado como mucho, y hasta 8 imágenes por dibujo. Nunca una dirección de fuera.
// Script clásico: deja window.KME_SVG para sello.js (se carga antes, con defer). Sin dependencias.
(() => {
  'use strict';
  const MAX_BYTES = 20 * 1024;
  const MAX_LADO = 256;
  const MAX_IMAGENES = 8;
  const FIRMA_PNG = '\x89PNG\r\n\x1a\n';
  const PROHIBIDOS = 'parsererror, script, foreignObject, iframe, object, embed, a, animate, set';

  // ¿Es un PNG incrustado, bien formado y pequeño? Lee la cabecera sin pintar nada.
  function pngIncrustadoValido(valor) {
    const m = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(typeof valor === 'string' ? valor : '');
    if (!m) return false;
    let bytes;
    try { bytes = atob(m[1]); } catch { return false; }
    if (bytes.length < 24 || bytes.length > MAX_BYTES) return false;
    if (bytes.slice(0, 8) !== FIRMA_PNG || bytes.slice(12, 16) !== 'IHDR') return false;
    const entero = (i) => ((bytes.charCodeAt(i) << 24) >>> 0) + (bytes.charCodeAt(i + 1) << 16) + (bytes.charCodeAt(i + 2) << 8) + bytes.charCodeAt(i + 3);
    const ancho = entero(16);
    const alto = entero(20);
    return ancho >= 1 && alto >= 1 && ancho <= MAX_LADO && alto <= MAX_LADO;
  }

  // Convierte el texto en un nodo SVG listo para insertar, o lanza un error si algo no está permitido.
  function svgSeguro(texto) {
    if (typeof texto !== 'string') throw new Error('Dibujo no válido');
    const xml = new DOMParser().parseFromString(texto, 'image/svg+xml');
    const svg = xml.documentElement;
    if (svg.localName !== 'svg' || svg.namespaceURI !== 'http://www.w3.org/2000/svg' || xml.querySelector(PROHIBIDOS)) {
      throw new Error('Dibujo no válido');
    }
    let imagenes = 0;
    for (const elemento of [svg, ...svg.querySelectorAll('*')]) {
      const esImagen = elemento.localName === 'image';
      if (esImagen && ++imagenes > MAX_IMAGENES) throw new Error('Dibujo no válido');
      let conFuente = false;
      for (const atributo of elemento.attributes) {
        if (/^on/i.test(atributo.name) || /^src$/i.test(atributo.name)) throw new Error('Dibujo no válido');
        if (!/href$/i.test(atributo.name)) continue;
        if (esImagen) {
          if (!pngIncrustadoValido(atributo.value)) throw new Error('Dibujo no válido');
          conFuente = true;
        } else if (!atributo.value.startsWith('#')) {
          throw new Error('Dibujo no válido');
        }
      }
      if (esImagen && !conFuente) throw new Error('Dibujo no válido');
    }
    return document.importNode(svg, true);
  }

  window.KME_SVG = Object.freeze({ pngIncrustadoValido, svgSeguro });
})();
