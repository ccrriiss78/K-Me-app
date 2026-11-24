// SALDO DE KPOPIS en todas las páginas (D063): si hay sesión, deja en res.locals.kpopisSesion el
// saldo para la cabecera ({ saldo, texto, icono }). Sin sesión, null.
// Va después de la sesión y de cargarPerfil (app.js), y antes de las rutas.

import { saldoDeSesion } from '../services/recompensaService.js';

export async function cargarKpopis(req, res, next) {
  res.locals.kpopisSesion = null;
  if (!req.session.usuarioId) return next();
  try {
    res.locals.kpopisSesion = await saldoDeSesion(req.session.usuarioId);
    next();
  } catch (err) {
    next(err);
  }
}
