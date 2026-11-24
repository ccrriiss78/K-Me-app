// CONTROLADOR de Avatar Studio (contrato v1 con ChatGPT, 23/11/2026).
// - Páginas: «Mis avatares» y el editor (nuevo o guardado). El editor lo monta el script de ChatGPT
//   (public/js/avatar-studio.js) en el contenedor #avatar-studio, con los datos del contrato.
// - Rutas JSON para ese script: listar, leer, crear, guardar (con versión), duplicar y borrar.
//   Duplicar y borrar también funcionan con un formulario normal (sin JavaScript): vuelven a la lista.
// Todas son privadas (requiereSesionOJson) y los POST llevan CSRF (ver routes/index.js).

import * as avatares from '../services/avatarService.js';
import { dibujarAvatar } from '../services/avatarCatalogo.js';

const ERRORES = {
  OPCION_NO_VALIDA: [400, 'Esa opción no existe.'],
  NOMBRE_NO_VALIDO: [400, 'Ponle al avatar un nombre de 1 a 40 caracteres.'],
  RECETA_DEMASIADO_GRANDE: [413, 'El avatar ocupa demasiado para guardarlo.'],
  LIMITE: [409, `Ya tienes ${avatares.MAX_AVATARES} avatares, el máximo. Borra uno para crear otro.`],
  VERSION: [409, 'Este avatar ha cambiado desde que lo abriste.'],
  NO_EXISTE: [404, 'Ese avatar no existe.'],
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

// «Mis avatares» (página) o su lista en JSON.
export async function mostrarAvatares(req, res, next) {
  try {
    const filas = await avatares.verAvatares(req.session.usuarioId);
    if (quiereJson(req)) {
      return res.json({
        maximo: avatares.MAX_AVATARES,
        avatares: filas.map((f) => ({ ...avatares.resumen(f), actualizadoEn: f.actualizado_en.toISOString() })),
      });
    }
    res.render('avatares', {
      titulo: 'Mis avatares',
      avatares: filas.map((f) => ({ ...avatares.resumen(f), dibujo: dibujarAvatar(f.composicion, { encuadre: 'cuerpo' }) })),
      maximo: avatares.MAX_AVATARES,
      eliminado: req.query.eliminado === '1',
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

function pintarEditor(req, res, { id = '', version = '', nombre = 'Mi avatar' } = {}) {
  res.render('avatar-editor', { titulo: id ? 'Editar avatar' : 'Nuevo avatar', id, version, nombre });
}

export function nuevoAvatar(req, res) {
  pintarEditor(req, res);
}

// El editor con un avatar guardado (página) o el avatar en JSON.
export async function abrirAvatar(req, res, next) {
  const json = quiereJson(req);
  try {
    const fila = await avatares.abrir({ idUsuario: req.session.usuarioId, idAvatar: req.params.id });
    if (json) return res.json({ ...avatares.resumen(fila), receta: fila.composicion });
    pintarEditor(req, res, { id: String(fila.id), version: String(fila.version), nombre: fila.nombre });
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
