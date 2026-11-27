// SERVICIO de los retos de «Mi escenario» (D062): las reglas de la miniclase HANGUL LIVE 001.
// - Primero se enseñan las expresiones; después, las preguntas, que se pueden responder en
//   cualquier orden y repetir hasta acertar (regla a, E0073).
// - Si la respuesta no es una de las opciones: error RESPUESTA_NO_VALIDA. Un reto o una pregunta
//   que no existen: RETO_NO_EXISTE y PREGUNTA_NO_EXISTE (el controlador decide el mensaje).
// - Si se falla, no se guarda nada. Si se acierta, se apunta en la cuenta; al acertar todas, el reto
//   se completa y, solo la primera vez, da su recompensa (lo garantiza la base de datos).
// - El acierto y la recompensa los decide el servidor con el catálogo; del navegador solo se lee
//   la opción elegida.

import * as Reto from '../models/retoModel.js';
import { RETOS, REPASO, buscarReto, buscarExpresion, retoAnterior, retoSiguiente } from '../catalogos/hangul-live.js';
import { buscarTesoro, textoKpopis, KPOPI } from '../catalogos/recompensas.js';
import { fechaCorta } from './recompensaService.js';

function errorReto(codigo) {
  const e = new Error(codigo);
  e.codigo = codigo;
  return e;
}

const NUMERO_VALIDO = /^[1-9]\d{0,2}$/;

function retoOError(idReto) {
  const reto = buscarReto(idReto);
  if (!reto) throw errorReto('RETO_NO_EXISTE');
  return reto;
}

function preguntaOError(reto, numero) {
  const pregunta = NUMERO_VALIDO.test(String(numero)) ? reto.preguntas.find((p) => p.numero === Number(numero)) : null;
  if (!pregunta) throw errorReto('PREGUNTA_NO_EXISTE');
  return pregunta;
}

// La primera pregunta que falta por acertar en la ronda (o la primera, si no falta ninguna).
const siguientePendiente = (reto, aciertos) => reto.preguntas.find((p) => !aciertos.includes(p.numero)) ?? reto.preguntas[0];

// La recompensa con sus textos y dibujos, para enseñarla. Las clases 002 y 003 (D086) no llevan
// tesoro: entonces «tesoro» es null.
function recompensaVisible(reto) {
  const tesoro = reto.recompensa.tesoro ? buscarTesoro(reto.recompensa.tesoro) : null;
  return { kpopis: textoKpopis(reto.recompensa.kpopis), iconoKpopi: KPOPI.icono, tesoro, repaso: textoKpopis(REPASO.kpopis) };
}

// El día de hoy en Madrid («2026-11-27»): el repaso cuenta una vez por clase y día (D087).
const formatoDia = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' });
const claveRepaso = (idReto, ahora = new Date()) => `repaso:${idReto}:${formatoDia.format(ahora)}`;

// La clase de antes (para repasar) y la de después (para seguir), si las hay (D086).
const enlace = (reto) => (reto ? { id: reto.id, titulo: reto.titulo } : null);
const vecinas = (reto) => ({ claseAnterior: enlace(retoAnterior(reto.id)), claseSiguiente: enlace(retoSiguiente(reto.id)) });

// El estado del progreso, para «Mi escenario» y la miniclase.
function estado(reto, progreso) {
  const aciertos = progreso.aciertos ?? [];
  return {
    aciertos: aciertos.length,
    total: reto.preguntas.length,
    completadoEl: progreso.completado_en ? fechaCorta(progreso.completado_en) : null,
    siguiente: siguientePendiente(reto, aciertos).numero,
  };
}

// «Mi escenario»: los retos con el progreso de la cuenta.
export async function verEscenario(idUsuario) {
  return Promise.all(RETOS.map(async (reto) => ({
    reto,
    recompensa: recompensaVisible(reto),
    estado: estado(reto, await Reto.leerProgreso({ idUsuario, idReto: reto.id })),
  })));
}

// La miniclase: las expresiones y el progreso.
export async function verReto({ idUsuario, idReto }) {
  const reto = retoOError(idReto);
  const progreso = await Reto.leerProgreso({ idUsuario, idReto });
  return { reto, recompensa: recompensaVisible(reto), estado: estado(reto, progreso), ...vecinas(reto) };
}

// Las opciones de una pregunta, con su hangul y su lectura (sin la traducción).
const opciones = (reto, pregunta) => pregunta.opciones.map((id) => {
  const e = buscarExpresion(reto, id);
  return { id: e.id, hangul: e.hangul, lectura: e.lectura };
});

// Una pregunta, para responderla.
export async function verPregunta({ idUsuario, idReto, numero }) {
  const reto = retoOError(idReto);
  const pregunta = preguntaOError(reto, numero);
  const progreso = await Reto.leerProgreso({ idUsuario, idReto });
  return { reto, pregunta, opciones: opciones(reto, pregunta), estado: estado(reto, progreso) };
}

// Responde una pregunta. Devuelve lo que necesita la página:
// - resultado: 'bien' o 'mal', con la expresión elegida y lo que se dice de ella;
// - si se ha acertado y falta alguna: la siguiente pregunta pendiente;
// - si se ha completado: final, con primeraVez y la fecha en que se ganó la recompensa.
export async function responder({ idUsuario, idReto, numero, respuesta }) {
  const reto = retoOError(idReto);
  const pregunta = preguntaOError(reto, numero);
  const vista = { reto, pregunta, opciones: opciones(reto, pregunta), ...vecinas(reto) };
  if (typeof respuesta !== 'string' || !pregunta.opciones.includes(respuesta)) {
    const e = errorReto('RESPUESTA_NO_VALIDA');
    e.vista = { ...vista, estado: estado(reto, await Reto.leerProgreso({ idUsuario, idReto })) };
    throw e;
  }
  const elegida = buscarExpresion(reto, respuesta);
  if (respuesta !== pregunta.respuesta) {
    const progreso = await Reto.leerProgreso({ idUsuario, idReto });
    return { ...vista, estado: estado(reto, progreso), resultado: { acierto: false, elegida } };
  }
  const apunte = await Reto.apuntarAcierto({
    idUsuario, idReto, numero: pregunta.numero, totalPreguntas: reto.preguntas.length, recompensa: reto.recompensa,
    repaso: { kpopis: REPASO.kpopis, clave: claveRepaso(reto.id) },
  });
  const resultado = { acierto: true, elegida };
  if (!apunte.completado) {
    return {
      ...vista,
      estado: estado(reto, { aciertos: apunte.aciertos }),
      resultado,
      siguiente: siguientePendiente(reto, apunte.aciertos).numero,
    };
  }
  return {
    ...vista,
    estado: estado(reto, { aciertos: [], completado_en: apunte.ganadoEn }),
    resultado,
    // repaso: los Kpopis ganados hoy por repasar (D087), o null.
    final: {
      primeraVez: apunte.primeraVez,
      ganadoEl: fechaCorta(apunte.ganadoEn),
      recompensa: recompensaVisible(reto),
      repaso: apunte.repaso ? textoKpopis(REPASO.kpopis) : null,
    },
  };
}
