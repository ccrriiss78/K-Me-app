// SERVICIO de las recompensas (D063, D064): prepara el saldo de Kpopis, sus movimientos y los
// tesoros ganados para enseñarlos. Los nombres y los dibujos salen del catálogo
// (src/catalogos/recompensas.js); la base de datos solo guarda ids y cantidades.

import * as Recompensa from '../models/recompensaModel.js';
import { textoKpopis, buscarTesoro, KPOPI } from '../catalogos/recompensas.js';
import { buscarReto } from '../catalogos/hangul-live.js';
import { buscarCanje } from '../catalogos/canje.js';

// Las fechas, como día/mes/año en la hora de Madrid («24/11/2026»).
const formatoFecha = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Madrid' });
export const fechaCorta = (fecha) => formatoFecha.format(fecha);

// De dónde viene un movimiento, a partir de su clave («reto:hangul-live-001»).
function concepto(clave) {
  const [tipo, id] = clave.split(':');
  const reto = tipo === 'reto' ? buscarReto(id) : null;
  if (reto) return `${reto.titulo} completado`;
  const pieza = tipo === 'canje' ? buscarCanje(id) : null; // un gasto en Colección «K» (E0083)
  return pieza ? `Canje: ${pieza.nombre}` : clave;
}

// El saldo de la cabecera, para todas las páginas.
export async function saldoDeSesion(idUsuario) {
  const saldo = await Recompensa.saldo(idUsuario);
  // «nombre» va aparte para que, en el móvil, la cabecera pueda enseñar solo el número y el icono.
  return { saldo, texto: textoKpopis(saldo), nombre: saldo === 1 ? KPOPI.singular : KPOPI.plural, icono: KPOPI.icono };
}

// Lo que enseña «Mi K-ME»: el saldo, los movimientos y los tesoros. Un tesoro que ya no esté en el
// catálogo no se enseña (nunca se pinta un dibujo que no existe).
export async function misRecompensas(idUsuario) {
  const [saldo, movimientos, tesoros] = await Promise.all([
    Recompensa.saldo(idUsuario), Recompensa.movimientos(idUsuario), Recompensa.tesoros(idUsuario),
  ]);
  return {
    saldo: textoKpopis(saldo),
    iconoKpopi: KPOPI.icono,
    movimientos: movimientos.map((m) => ({
      cantidad: `${m.cantidad > 0 ? '+' : '−'}${textoKpopis(Math.abs(m.cantidad))}`,
      concepto: concepto(m.clave),
      fecha: fechaCorta(m.creado_en),
      fechaIso: m.creado_en.toISOString(),
    })),
    tesoros: tesoros
      .map((t) => ({ fila: t, tesoro: buscarTesoro(t.id_tesoro) }))
      .filter(({ tesoro }) => tesoro)
      .map(({ fila, tesoro }) => ({
        ...tesoro,
        origen: buscarReto(fila.origen)?.titulo ?? fila.origen,
        fecha: fechaCorta(fila.ganado_en),
        fechaIso: fila.ganado_en.toISOString(),
      })),
  };
}
