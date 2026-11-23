// Colores del avatar.
// Las piezas SVG no llevan colores fijos en las zonas personalizables: llevan clases.
//   f-<nombre>  -> relleno (fill) con ese color
//   t-<nombre>  -> trazo (stroke) con ese color
// Este módulo calcula los colores de un avatar y genera el CSS que los aplica.
import { tono } from './utilidades.js';
import { opcionesMaquillaje } from './kme-maquillaje.js';

/** Devuelve { nombreDeColor: '#rrggbb' | null } para un avatar. */
export function coloresDelAvatar(a) {
  const labial = a.maquillaje.labial;
  return {
    'piel': a.piel,
    'piel-sombra': tono(a.piel, -0.13),
    'pecas': tono(a.piel, -0.38),
    'pelo': a.pelo.color,
    'pelo-trasero': tono(a.pelo.color, -0.12),
    'pelo-oscuro': tono(a.pelo.color, -0.28),
    'ojos': a.ojos.color,
    'ojos-claro': tono(a.ojos.color, 0.42),
    'sombra-ojos': a.maquillaje.sombra,          // null = sin sombra (se oculta)
    'labial': labial,                            // null = sin labial
    'labial-oscuro': labial ? tono(labial, -0.35) : null,
    ...Object.fromEntries(opcionesMaquillaje.map(opcion =>
      ['m-' + opcion.marca, a.maquillaje[opcion.color] || opcion.inicial])),
    'arriba': a.ropa.colorArriba,
    'arriba-oscuro': tono(a.ropa.colorArriba, -0.16),
    'arriba-claro': tono(a.ropa.colorArriba, 0.45),
    'abajo': a.ropa.colorAbajo,
    'abajo-oscuro': tono(a.ropa.colorAbajo, -0.18),
  };
}

/**
 * CSS que pinta las piezas. `ambito` limita las reglas a un contenedor
 * (por ejemplo '#avatar-3'), para que varios avatares convivan en la misma página.
 */
export function cssDeColores(avatar, ambito = '') {
  const p = ambito ? ambito + ' ' : '';
  let css = '';
  for (const [nombre, color] of Object.entries(coloresDelAvatar(avatar))) {
    css += color
      ? `${p}.f-${nombre}{fill:${color}}${p}.t-${nombre}{stroke:${color}}`
      : `${p}.f-${nombre},${p}.t-${nombre}{display:none}`;
  }
  // Cada boca trae dos versiones: con labial y sin labial.
  css += avatar.maquillaje.labial ? `${p}.sin-labial{display:none}` : `${p}.con-labial{display:none}`;
  return css;
}
