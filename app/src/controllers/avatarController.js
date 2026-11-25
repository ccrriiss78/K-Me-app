// CONTROLADOR de Avatar Studio (contrato v1 con ChatGPT, 23/11/2026).
// - Páginas: «Mis avatares» y el editor (nuevo o guardado). El editor lo monta el script de ChatGPT
//   (public/js/avatar-studio.js) en el contenedor #avatar-studio, con los datos del contrato.
// - Rutas JSON para ese script: listar, leer, crear, guardar (con versión), duplicar y borrar.
//   Duplicar y borrar también funcionan con un formulario normal (sin JavaScript): vuelven a la lista.
// Todas son privadas (requiereSesionOJson) y los POST llevan CSRF (ver routes/index.js).

import * as avatares from '../services/avatarService.js';
import { dibujarAvatar, recetaPorDefecto } from '../services/avatarCatalogo.js';
import { estaConfirmado, leerBorrados } from '../services/borrarVarios.js';
import { familiasBloqueadas } from '../services/canjeService.js';
import { recetaPresentacion } from '../catalogos/presentacion.js';

const ERRORES = {
  OPCION_NO_VALIDA: [400, 'Esa opción no existe.'],
  NOMBRE_NO_VALIDO: [400, 'Ponle al avatar un nombre de 1 a 40 caracteres.'],
  RECETA_DEMASIADO_GRANDE: [413, 'El avatar ocupa demasiado para guardarlo.'],
  LIMITE: [409, `Ya tienes ${avatares.MAX_AVATARES} avatares, el máximo. Borra uno para crear otro.`],
  VERSION: [409, 'Este avatar ha cambiado desde que lo abriste.'],
  NO_EXISTE: [404, 'Ese avatar no existe.'],
  PIEZA_NO_ES_TUYA: [403, 'Esa prenda todavía no es tuya: canjéala en Colección «K».'],
};

// ¿Lo pide un script (JSON) o el navegador (una página)?
const quiereJson = (req) => req.is('application/json') || req.accepts(['html', 'json']) === 'json';

function responderErrorJson(err, res, next) {
  const conocido = ERRORES[err.codigo];
  if (!conocido) return next(err); // fallo inesperado (por ejemplo, de la base de datos)
  const [estado, error] = conocido;
  return res.status(estado).json(err.codigo === 'VERSION' ? { error, version: err.version } : { error });
}

function noExiste(res) {
  return res.status(404).render('error', { titulo: 'No encontrado', mensaje: 'Ese avatar no existe.' });
}

// La página «Mis avatares», con un aviso o un error si los hay.
async function pintarLista(req, res, estado = 200, { error = null } = {}) {
  const filas = await avatares.verAvatares(req.session.usuarioId);
  res.status(estado).render('avatares', {
    titulo: 'Mis avatares',
    avatares: filas.map((f) => ({ ...avatares.resumen(f), dibujo: dibujarAvatar(f.composicion, { encuadre: 'cuerpo' }) })),
    maximo: avatares.MAX_AVATARES,
    eliminado: req.query.eliminado === '1',
    borrados: leerBorrados(req.query.borrados, avatares.MAX_AVATARES),
    error,
  });
}

// «Mis avatares» (página) o su lista en JSON.
export async function mostrarAvatares(req, res, next) {
  try {
    if (quiereJson(req)) {
      const filas = await avatares.verAvatares(req.session.usuarioId);
      return res.json({
        maximo: avatares.MAX_AVATARES,
        avatares: filas.map((f) => ({ ...avatares.resumen(f), actualizadoEn: f.actualizado_en.toISOString() })),
      });
    }
    await pintarLista(req, res);
  } catch (err) {
    next(err);
  }
}

// Borrar varios o todos (D058).
// - Formulario sin «confirmar»: página de confirmación con el número y los nombres (no borra nada).
// - Con «confirmar»: borra los ids confirmados y vuelve a la lista con «?borrados=N».
// - JSON (el editor, al llegar al límite): siempre con «confirmar»; responde { borrados }.
const NADA_QUE_BORRAR = 'Elige al menos un avatar para borrar.';
export async function borrarAvatares(req, res, next) {
  const json = quiereJson(req);
  const idUsuario = req.session.usuarioId;
  const cuerpo = req.body ?? {};
  try {
    if (!estaConfirmado(cuerpo)) {
      if (json) return res.status(400).json({ error: 'Falta la confirmación.' });
      const lista = await avatares.prepararBorrado({ idUsuario, cuerpo });
      if (!lista.length) return await pintarLista(req, res, 400, { error: NADA_QUE_BORRAR });
      return res.render('borrar-varios', {
        titulo: 'Borrar avatares', lista, singular: 'avatar', plural: 'avatares',
        accion: '/studio/avatares/borrar', volver: '/studio/avatares',
        aviso: 'Los sellos que lleven alguno de estos avatares conservan su copia. Si alguno es tu imagen de perfil, el perfil se quedará sin él.',
      });
    }
    const borrados = await avatares.borrarVarios({ idUsuario, cuerpo });
    if (json) return res.json({ borrados });
    res.redirect(`/studio/avatares?borrados=${borrados}`);
  } catch (err) {
    if (err.codigo !== 'NADA_QUE_BORRAR') return next(err);
    if (json) return res.status(400).json({ error: NADA_QUE_BORRAR });
    try {
      await pintarLista(req, res, 400, { error: NADA_QUE_BORRAR });
    } catch (e) {
      next(e);
    }
  }
}

async function pintarEditor(req, res, { id = '', version = '', nombre = 'Mi avatar' } = {}) {
  // Colección «K» (E0083): las piezas de canje que la cuenta aún no tiene no se ofrecen en el editor.
  const bloqueadas = await familiasBloqueadas(req.session.usuarioId);
  // Un avatar nuevo empieza con el de presentación (E0083); uno guardado, con su receta.
  const presentacion = id ? null : avatares.leerReceta(recetaPresentacion(recetaPorDefecto()));
  res.render('avatar-editor', {
    titulo: id ? 'Editar avatar' : 'Nuevo avatar', id, version, nombre, bloqueadas, presentacion,
    // Los estilos aprobados del editor, limitados a su contenedor (T037).
    // y los de las partes propias de la app (nombre, «Guardar», límite).
    estilosExtra: ['/editor/css/kme-muestras-app.css', '/css/avatar-studio.css'],
  });
}

export async function nuevoAvatar(req, res, next) {
  try { await pintarEditor(req, res); } catch (err) { next(err); }
}

// El editor con un avatar guardado (página) o el avatar en JSON.
export async function abrirAvatar(req, res, next) {
  const json = quiereJson(req);
  try {
    const fila = await avatares.abrir({ idUsuario: req.session.usuarioId, idAvatar: req.params.id });
    if (json) return res.json({ ...avatares.resumen(fila), receta: fila.composicion });
    await pintarEditor(req, res, { id: String(fila.id), version: String(fila.version), nombre: fila.nombre });
  } catch (err) {
    if (!json && err.codigo === 'NO_EXISTE') return noExiste(res);
    if (json) return responderErrorJson(err, res, next);
    next(err);
  }
}

export async function crearAvatar(req, res, next) {
  try {
    const creado = await avatares.crear({ idUsuario: req.session.usuarioId, nombre: req.body?.nombre, receta: req.body?.receta });
    res.status(201).json(creado);
  } catch (err) {
    responderErrorJson(err, res, next);
  }
}

export async function guardarAvatar(req, res, next) {
  try {
    const guardado = await avatares.guardar({
      idUsuario: req.session.usuarioId,
      idAvatar: req.params.id,
      nombre: req.body?.nombre,
      receta: req.body?.receta,
      version: req.body?.version,
    });
    res.json(guardado);
  } catch (err) {
    responderErrorJson(err, res, next);
  }
}

// Duplicar y borrar: JSON para el script, o volver a «Mis avatares» desde un formulario.
async function listaConError(req, res, estado, mensaje) {
  const filas = await avatares.verAvatares(req.session.usuarioId);
  res.status(estado).render('avatares', {
    titulo: 'Mis avatares',
    avatares: filas.map((f) => ({ ...avatares.resumen(f), dibujo: dibujarAvatar(f.composicion, { encuadre: 'cuerpo' }) })),
    maximo: avatares.MAX_AVATARES,
    eliminado: false,
    error: mensaje,
  });
}

export async function duplicarAvatar(req, res, next) {
  const json = quiereJson(req);
  try {
    const copia = await avatares.duplicar({ idUsuario: req.session.usuarioId, idAvatar: req.params.id });
    if (json) return res.status(201).json(copia);
    res.redirect('/studio/avatares');
  } catch (err) {
    if (json) return responderErrorJson(err, res, next);
    if (err.codigo === 'NO_EXISTE') return noExiste(res);
    if (err.codigo === 'LIMITE') return listaConError(req, res, 409, ERRORES.LIMITE[1]).catch(next);
    next(err);
  }
}

export async function eliminarAvatar(req, res, next) {
  const json = quiereJson(req);
  try {
    await avatares.eliminar({ idUsuario: req.session.usuarioId, idAvatar: req.params.id });
    if (json) return res.json({ eliminado: true });
    res.redirect('/studio/avatares?eliminado=1');
  } catch (err) {
    if (json) return responderErrorJson(err, res, next);
    if (err.codigo === 'NO_EXISTE') return noExiste(res);
    next(err);
  }
}

// Errores al leer el cuerpo JSON (mal formado o demasiado grande): respuesta en JSON, no la página
// de error. Se monta después de las rutas de Avatar Studio.
// eslint-disable-next-line no-unused-vars
export function erroresJsonAvatar(err, req, res, next) {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: ERRORES.RECETA_DEMASIADO_GRANDE[1] });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'No se ha podido leer el avatar.' });
  return next(err);
}
