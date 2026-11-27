// CONTROLADOR de «Mi escenario» (D062): la lista de retos, la miniclase HANGUL LIVE 001 y sus
// preguntas. Todas las rutas son privadas (requiereSesion) y responder lleva CSRF (routes/index.js).
// Responder una pregunta pinta el resultado en la misma página: acertar o fallar no es un error
// (200). Recargar repite la misma respuesta, sin efectos: un acierto no cuenta doble y la
// recompensa no se cobra dos veces.

import * as retos from '../services/retoService.js';
import { saldoDeSesion } from '../services/recompensaService.js';

const ESTILOS = ['/css/escenario.css'];

const NO_ENCONTRADO = {
  RETO_NO_EXISTE: 'Ese reto no existe.',
  PREGUNTA_NO_EXISTE: 'Esa pregunta no existe.',
};

function responderError(err, req, res, next) {
  const mensaje = NO_ENCONTRADO[err.codigo];
  if (mensaje) return res.status(404).render('error', { titulo: 'No encontrado', mensaje });
  if (err.codigo === 'RESPUESTA_NO_VALIDA') {
    return res.status(400).render('reto-pregunta', {
      titulo: err.vista.reto.titulo, estilosExtra: ESTILOS, ...err.vista, resultado: null, error: 'Elige una de las respuestas.',
    });
  }
  return next(err);
}

export async function mostrarEscenario(req, res, next) {
  try {
    const tarjetas = await retos.verEscenario(req.session.usuarioId);
    res.render('escenario', { titulo: 'Mi escenario', estilosExtra: ESTILOS, tarjetas });
  } catch (err) {
    next(err);
  }
}

export async function mostrarReto(req, res, next) {
  try {
    const datos = await retos.verReto({ idUsuario: req.session.usuarioId, idReto: req.params.reto });
    res.render('reto', { titulo: datos.reto.titulo, estilosExtra: ESTILOS, ...datos });
  } catch (err) {
    responderError(err, req, res, next);
  }
}

export async function mostrarPregunta(req, res, next) {
  try {
    const datos = await retos.verPregunta({ idUsuario: req.session.usuarioId, idReto: req.params.reto, numero: req.params.numero });
    res.render('reto-pregunta', { titulo: datos.reto.titulo, estilosExtra: ESTILOS, ...datos, resultado: null, error: null });
  } catch (err) {
    responderError(err, req, res, next);
  }
}

export async function responderPregunta(req, res, next) {
  try {
    const idUsuario = req.session.usuarioId;
    const datos = await retos.responder({
      idUsuario, idReto: req.params.reto, numero: req.params.numero, respuesta: req.body?.respuesta,
    });
    // Si se acaba de ganar la recompensa (o los Kpopis de repasar, D087), la cabecera de esta misma
    // página ya la cuenta.
    if (datos.final?.primeraVez || datos.final?.repaso) res.locals.kpopisSesion = await saldoDeSesion(idUsuario);
    res.render('reto-pregunta', { titulo: datos.reto.titulo, estilosExtra: ESTILOS, ...datos, error: null });
  } catch (err) {
    responderError(err, req, res, next);
  }
}
