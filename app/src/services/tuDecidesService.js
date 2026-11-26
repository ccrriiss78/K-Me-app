// SERVICIO de «K-ME · TÚ DECIDES» (D080): reglas de la votación.
// - Solo se vota una de las propuestas del catálogo (lo demás: PROPUESTA_NO_VALIDA).
// - El voto es siempre de la cuenta de la sesión; votar otra vez lo sustituye.
// - Los resultados son los porcentajes de todos los votos reales, sin nombres; se enseñan después
//   de votar.
import * as Voto from '../models/votoModel.js';
import { PROPUESTAS, esPropuesta, porcentajes } from '../catalogos/tu-decides.js';

export async function votar({ idUsuario, propuesta }) {
  if (typeof propuesta !== 'string' || !esPropuesta(propuesta)) {
    const e = new Error('PROPUESTA_NO_VALIDA');
    e.codigo = 'PROPUESTA_NO_VALIDA';
    throw e;
  }
  await Voto.votar(idUsuario, propuesta);
}

// Lo que necesita el bloque de «Mi K-ME»: las propuestas, cuál eligió la cuenta y, si ya votó, el
// porcentaje de cada una y el total de votos.
export async function verTuDecides(idUsuario) {
  const miVoto = await Voto.miVoto(idUsuario);
  const recuento = miVoto ? await Voto.recuento() : {};
  const porcentaje = porcentajes(recuento);
  return {
    miVoto,
    conResultados: Boolean(miVoto),
    total: Object.values(recuento).reduce((a, b) => a + b, 0),
    propuestas: PROPUESTAS.map((p) => ({ ...p, elegida: p.id === miVoto, porcentaje: porcentaje[p.id] })),
  };
}
