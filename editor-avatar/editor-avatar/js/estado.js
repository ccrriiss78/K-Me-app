// Estado del avatar: normalización e historial para "Deshacer".
import { clonar } from './utilidades.js';

/**
 * Completa un avatar (por ejemplo, uno guardado con una versión anterior)
 * con los valores por defecto del catálogo. Ignora claves desconocidas.
 */
export function normalizarAvatar(avatar, porDefecto) {
  const r = clonar(porDefecto);
  if (!avatar || typeof avatar !== 'object') return r;
  for (const k in r) {
    // Una lista (accesoriosExtra, D071) se copia tal cual llega: si no es una lista, la validación
    // del servidor la rechaza. Sin el campo (un avatar anterior), queda la lista por defecto.
    if (Array.isArray(r[k])) {
      if (k in avatar) r[k] = Array.isArray(avatar[k]) ? [...avatar[k]] : avatar[k];
    } else if (r[k] && typeof r[k] === 'object') {
      if (avatar[k] && typeof avatar[k] === 'object') {
        for (const j in r[k]) if (j in avatar[k]) r[k][j] = avatar[k][j];
      }
    } else if (k in avatar) {
      r[k] = avatar[k];
    }
  }
  return r;
}

/** Pila de estados anteriores. */
export class Historial {
  constructor(maximo = 60) {
    this.pila = [];
    this.maximo = maximo;
  }
  guardar(avatar) {
    this.pila.push(JSON.stringify(avatar));
    if (this.pila.length > this.maximo) this.pila.shift();
  }
  deshacer() {
    return this.pila.length ? JSON.parse(this.pila.pop()) : null;
  }
  get vacio() {
    return this.pila.length === 0;
  }
}
