// Mantiene el mismo tamaño en cuerpo, camiseta y prenda con piernas integradas.
import { escribir } from './utilidades.js';

export function seleccionarPiezaKme(catalogo, avatar, ruta, id) {
  const pieza = catalogo.pieza(ruta, id);
  if (!pieza) throw new Error('La pieza no pertenece al catálogo.');
  escribir(avatar, ruta, id);
  if (ruta === 'ojos.estilo' && pieza.cejasSugeridas && catalogo.pieza('cejas', pieza.cejasSugeridas)) {
    avatar.cejas = pieza.cejasSugeridas;
  }
  if ((ruta === 'ropa.arriba' || ruta === 'ropa.abajo') && pieza.cuerpoCompatible) {
    avatar.cuerpo = pieza.cuerpoCompatible;
  }
  // Al revisar una prenda antigua, recupera también su montaje anterior.
  if (ruta === 'ropa.arriba' && !pieza.cuerpoCompatible) {
    const inferior = catalogo.pieza('ropa.abajo', avatar.ropa.abajo);
    if (inferior?.anterior) avatar.ropa.abajo = inferior.anterior;
    return avatar;
  }
  if (ruta === 'ropa.abajo' && pieza.cuerpoCompatible) {
    const superior = catalogo.pieza('ropa.arriba', avatar.ropa.arriba);
    if (!superior?.familia && pieza.coleccion !== 'lamina-kpop') {
      avatar.ropa.arriba = catalogo.piezas('ropa.arriba').find(p => p.familia === 'camiseta-integrada' && p.cuerpoCompatible === avatar.cuerpo).id;
    }
  }
  for (const prenda of ['ropa.arriba', 'ropa.abajo']) {
    const actual = catalogo.pieza(prenda, prenda === 'ropa.arriba' ? avatar.ropa.arriba : avatar.ropa.abajo);
    if (!actual?.familia) continue;
    const variante = catalogo.piezas(prenda).find(p => p.familia === actual.familia && p.cuerpoCompatible === avatar.cuerpo);
    if (variante) escribir(avatar, prenda, variante.id);
  }
  return avatar;
}
