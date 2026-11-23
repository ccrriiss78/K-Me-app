// CONTROLADOR de Connect (D038): recibe la petición, llama al servicio y elige la vista.
// Todas las rutas son privadas (requiereSesion) y los POST llevan CSRF (ver routes/index.js).
// Después de cada acción se vuelve al muro (patrón «enviar y redirigir»: recargar no repite la acción).
// Excepción: si el script del muro (public/js/connect.js) pide JSON al reaccionar o al quitar
// reacciones, se responde solo con los números de esa publicación, y el muro no se recarga.
// Sin JavaScript, todo funciona igual, recargando.

import * as connect from '../services/connectService.js';
import { EMOCIONES, MAX_REACCIONES_POR_TIPO } from '../catalogos/connect.js';

const ERRORES_VISIBLES = {
  EMOCION_NO_VALIDA: 'Elige una emoción de la lista.',
  REACCION_NO_VALIDA: 'Esa reacción no existe.',
  OPCION_NO_VALIDA: 'Esa opción no existe.',
};

async function pintarMuro(req, res, estado, extra = {}) {
  const publicaciones = await connect.verMuro({ idUsuario: req.session.usuarioId });
  res.status(estado).render('connect', {
    titulo: 'Connect',
    emociones: EMOCIONES,
    maxReacciones: MAX_REACCIONES_POR_TIPO,
    publicaciones,
    error: null,
    publicada: false,
    eliminada: false,
    ...extra,
  });
}

// ¿Pide JSON el script del muro? Un formulario normal pide HTML.
const quiereJson = (req) => req.accepts(['html', 'json']) === 'json';

function responderError(err, req, res, next) {
  const json = quiereJson(req);
  if (err.codigo === 'NO_EXISTE') {
    if (json) return res.status(404).json({ error: 'Esa publicación no existe.' });
    return res.status(404).render('error', { titulo: 'No encontrado', mensaje: 'Esa publicación no existe.' });
  }
  const mensaje = ERRORES_VISIBLES[err.codigo];
  if (mensaje && json) return res.status(400).json({ error: mensaje });
  if (mensaje) return pintarMuro(req, res, 400, { error: mensaje }).catch(next);
  return next(err); // fallo inesperado (por ejemplo, de la base de datos): página de error
}

// Tras reaccionar o quitar: el estado nuevo en JSON para el script, o volver al muro.
async function responderReacciones(req, res) {
  if (quiereJson(req)) {
    return res.json(await connect.estadoReacciones({ idUsuario: req.session.usuarioId, idPublicacion: req.params.id }));
  }
  return res.redirect(`/connect#publicacion-${req.params.id}`);
}

export async function mostrarMuro(req, res, next) {
  try {
    await pintarMuro(req, res, 200, { publicada: req.query.publicada === '1', eliminada: req.query.eliminada === '1' });
  } catch (err) {
    next(err);
  }
}

export async function publicar(req, res, next) {
  try {
    await connect.publicar({ idUsuario: req.session.usuarioId, emocion: req.body.emocion });
    res.redirect('/connect?publicada=1');
  } catch (err) {
    responderError(err, req, res, next);
  }
}

export async function reaccionar(req, res, next) {
  try {
    await connect.reaccionar({ idUsuario: req.session.usuarioId, idPublicacion: req.params.id, tipo: req.body.tipo });
    await responderReacciones(req, res);
  } catch (err) {
    responderError(err, req, res, next);
  }
}

export async function quitarReacciones(req, res, next) {
  try {
    await connect.quitarReacciones({ idUsuario: req.session.usuarioId, idPublicacion: req.params.id, que: req.body.que });
    await responderReacciones(req, res);
  } catch (err) {
    responderError(err, req, res, next);
  }
}

export async function eliminarPublicacion(req, res, next) {
  try {
    await connect.eliminar({ idUsuario: req.session.usuarioId, idPublicacion: req.params.id });
    res.redirect('/connect?eliminada=1');
  } catch (err) {
    responderError(err, req, res, next);
  }
}
