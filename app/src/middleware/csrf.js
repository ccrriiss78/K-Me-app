// Protección CSRF sencilla: cada sesión tiene un token secreto que los formularios
// deben devolver en el campo oculto "_csrf". Otra web no puede conocer ese token.

import crypto from 'node:crypto';

export function tokenCsrf(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

export function comprobarCsrf(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  const recibido = req.body?._csrf;
  const esperado = req.session.csrfToken;
  const valido = typeof recibido === 'string' && typeof esperado === 'string'
    && recibido.length === esperado.length
    && crypto.timingSafeEqual(Buffer.from(recibido), Buffer.from(esperado));
  if (!valido) {
    return res.status(403).render('error', {
      titulo: 'Petición rechazada',
      mensaje: 'El formulario ha caducado o no es válido. Vuelve a intentarlo.',
    });
  }
  next();
}
