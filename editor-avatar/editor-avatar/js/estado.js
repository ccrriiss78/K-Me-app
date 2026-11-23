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
    if (r[k] && typeof r[k] === 'object') {
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
