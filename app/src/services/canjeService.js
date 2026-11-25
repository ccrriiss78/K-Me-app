// SERVICIO del canje de Kpopis en Colección «K» (E0083).
// - El catálogo de canje (src/catalogos/canje.js) dice qué piezas se canjean y su precio.
// - Canjear: errores con «codigo» (el controlador decide el mensaje): NO_EXISTE, YA_ES_TUYA y
//   SALDO_INSUFICIENTE (con «falta»).
// - Una pieza de canje solo se puede llevar si es de la cuenta: comprobarPropiedad lo exige al
//   guardar un avatar (avatarService). Las demás piezas especiales son gratis.

import * as Canje from '../models/canjeModel.js';
import { CANJE, buscarCanje } from '../catalogos/canje.js';
import { textoKpopis, KPOPI } from '../catalogos/recompensas.js';
import { obtenerCatalogo, recetaPorDefecto, dibujarAvatar } from './avatarCatalogo.js';
import { saldoDeSesion } from './recompensaService.js';

function errorCanje(codigo, extra = {}) {
  const e = new Error(codigo);
  e.codigo = codigo;
  return Object.assign(e, extra);
}

// La familia de la pieza elegida en una parte del avatar (o su id, si no tiene familia).
const familiaDe = (ruta, id) => obtenerCatalogo().pieza(ruta, id)?.familia ?? id;

// Las familias de canje que la cuenta todavía NO tiene (el editor no las ofrece).
export async function familiasBloqueadas(idUsuario) {
  const tuyas = await Canje.familias(idUsuario);
  return CANJE.map((p) => p.familia).filter((f) => !tuyas.has(f));
}

// Lanza PIEZA_NO_ES_TUYA si la receta lleva una pieza de canje que la cuenta no tiene.
export async function comprobarPropiedad(idUsuario, receta) {
  const bloqueadas = new Set(await familiasBloqueadas(idUsuario));
  if (!bloqueadas.size) return;
  // Con varios accesorios (D071), también cada uno de «accesoriosExtra».
  const extra = Array.isArray(receta.accesoriosExtra) ? receta.accesoriosExtra : [];
  for (const [ruta, id] of [['ropa.arriba', receta.ropa?.arriba], ['ropa.abajo', receta.ropa?.abajo], ['accesorio', receta.accesorio], ...extra.map((x) => ['accesorio', x])]) {
    if (id && bloqueadas.has(familiaDe(ruta, id))) throw errorCanje('PIEZA_NO_ES_TUYA');
  }
}

// La vista previa: el avatar de presentación con la pieza, en la variante de su cuerpo. No gasta nada.
function vistaPrevia(pieza) {
  const receta = recetaPorDefecto();
  if (pieza.ruta === 'accesorio') {
    // Un accesorio, solo: sin los auriculares de la receta por defecto. El catálogo elige su variante.
    receta.accesorio = pieza.familia;
    receta.accesoriosExtra = [];
  } else {
    const variante = obtenerCatalogo().piezas(pieza.ruta).find((p) => p.familia === pieza.familia && p.cuerpoCompatible === receta.cuerpo);
    if (pieza.ruta === 'ropa.arriba') receta.ropa = { ...receta.ropa, arriba: variante.id, colorArriba: pieza.colorMuestra ?? receta.ropa.colorArriba };
    if (pieza.ruta === 'ropa.abajo') receta.ropa = { ...receta.ropa, abajo: variante.id, colorAbajo: pieza.colorMuestra ?? receta.ropa.colorAbajo };
  }
  return dibujarAvatar(receta, { encuadre: 'cuerpo', alto: 220 });
}

// El catálogo para la página: cada pieza con su precio, si ya es tuya y su vista previa; y el saldo.
export async function verCatalogo(idUsuario) {
  const tuyas = await Canje.familias(idUsuario);
  const { saldo } = await saldoDeSesion(idUsuario);
  return {
    saldo: textoKpopis(saldo),
    iconoKpopi: KPOPI.icono,
    piezas: CANJE.map((p) => ({ ...p, precioTexto: textoKpopis(p.precio), tuya: tuyas.has(p.familia), svg: vistaPrevia(p) })),
  };
}

export async function canjear({ idUsuario, familia }) {
  const pieza = buscarCanje(typeof familia === 'string' ? familia : '');
  if (!pieza) throw errorCanje('NO_EXISTE');
  const r = await Canje.canjear({ idUsuario, familia: pieza.familia, precio: pieza.precio });
  if (r.resultado === 'ya') throw errorCanje('YA_ES_TUYA');
  if (r.resultado === 'saldo') throw errorCanje('SALDO_INSUFICIENTE', { falta: r.falta });
  return pieza;
}
