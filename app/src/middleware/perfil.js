// IMAGEN DE PERFIL en todas las páginas (D044, D055): si hay sesión, deja en res.locals.perfilSesion
// lo que necesitan la cabecera y las listas («En tu perfil»). Sin sesión, null.
// Va después de la sesión y del alias (app.js), y antes de las rutas.

import { perfilDeSesion } from '../services/perfilService.js';

export async function cargarPerfil(req, res, next) {
  res.locals.perfilSesion = null;
  if (!req.session.usuarioId) return next();
  try {
    res.locals.perfilSesion = await perfilDeSesion({ idUsuario: req.session.usuarioId, alias: req.session.alias });
    next();
  } catch (err) {
    next(err);
  }
}
