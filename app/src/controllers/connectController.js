// CONTROLADOR de Connect (D038): recibe la petición, llama al servicio y elige la vista.
// Todas las rutas son privadas (requiereSesion) y los POST llevan CSRF (ver routes/index.js).
// Después de cada acción se vuelve al muro (patrón «enviar y redirigir»: recargar no repite la acción).
// Excepción: si el script del muro (public/js/connect.js) pide JSON al reaccionar o al quitar
// reacciones, se responde solo con los números de esa publicación, y el muro no se recarga.
// Sin JavaScript, todo funciona igual, recargando.

import * as connect from '../services/connectService.js';
import {
  EMOCIONES, MAX_REACCIONES_POR_TIPO, ICONOS_MENSAJE, GRUPOS_ICONOS, MAX_ICONOS_MENSAJE,
  TIPOS_MENSAJE, TIPO_MENSAJE_POR_DEFECTO,
} from '../catalogos/connect.js';

const ERRORES_VISIBLES = {
  EMOCION_NO_VALIDA: 'Elige una emoción de la lista.',
  REACCION_NO_VALIDA: 'Esa reacción no existe.',
  OPCION_NO_VALIDA: 'Esa opción no existe.',
  ICONOS_NO_VALIDOS: 'Elige hasta 5 iconos de la lista.',
  TIPO_MENSAJE_NO_VALIDO: 'Elige qué es tu mensaje de la lista.',
};

async function pintarMuro(req, res, estado, extra = {}) {
  const idUsuario = req.session.usuarioId;
  const [publicaciones, disenos] = await Promise.all([connect.verMuro({ idUsuario }), connect.disenosParaPublicar(idUsuario)]);
  res.status(estado).render('connect', {
    titulo: 'Connect',
    emociones: EMOCIONES,
    maxReacciones: MAX_REACCIONES_POR_TIPO,
    disenos,
    iconosMensaje: ICONOS_MENSAJE,
    gruposIconos: GRUPOS_ICONOS,
    maxIconos: MAX_ICONOS_MENSAJE,
    tiposMensaje: TIPOS_MENSAJE,
    tipoMensajePorDefecto: TIPO_MENSAJE_POR_DEFECTO,
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
  // Un avatar o sello que no es de la cuenta (o que se acaba de borrar en otra pestaña): 404, como
  // en el resto de K-ME, pero con el muro y el formulario para elegir otro.
  if (err.codigo === 'DISENO_NO_EXISTE') return pintarMuro(req, res, 404, { error: 'Ese diseño no existe. Elige otro.' }).catch(next);
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
    const { emocion, diseno, iconos, tipo_mensaje: tipoMensaje } = req.body;
    await connect.publicar({ idUsuario: req.session.usuarioId, emocion, diseno, iconos, tipoMensaje });
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
