// Utilidades pequeñas que usan los demás módulos.

/** Color de las líneas de contorno de todas las piezas. */
export const LINEA = '#3d2f45';

/** '#rrggbb' -> [r, g, b] */
export function rgb(color) {
  let h = color.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** [r, g, b] -> '#rrggbb' */
export function hex(r, g, b) {
  return '#' + [r, g, b]
    .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Aclara (cantidad > 0) u oscurece (cantidad < 0) un color.
 * tono('#8fb8ea', -0.2) -> un 20 % más oscuro
 */
export function tono(color, cantidad) {
  const [r, g, b] = rgb(color);
  if (cantidad < 0) {
    const k = 1 + cantidad;
    return hex(r * k, g * k, b * k);
  }
  return hex(r + (255 - r) * cantidad, g + (255 - g) * cantidad, b + (255 - b) * cantidad);
}

/** Copia profunda de un objeto JSON. */
export const clonar = obj => JSON.parse(JSON.stringify(obj));

/** leer(avatar, 'pelo.color') -> avatar.pelo.color */
export const leer = (obj, ruta) => ruta.split('.').reduce((a, k) => (a == null ? a : a[k]), obj);

/** escribir(avatar, 'pelo.color', '#000') */
export function escribir(obj, ruta, valor) {
  const claves = ruta.split('.');
  const ultima = claves.pop();
  claves.reduce((a, k) => a[k], obj)[ultima] = valor;
}

/** Convierte un texto SVG en una imagen cargada (para canvas, PNG o texturas 3D). */
export function svgAImagen(svg) {
  return new Promise((resolver, rechazar) => {
    const img = new Image();
    img.onload = () => resolver(img);
    img.onerror = rechazar;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

export const escaparHTML = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
