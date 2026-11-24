// Solo deja pasar si hay un usuario autenticado en la sesión. Si no, redirige al inicio de sesión.

export function requiereSesion(req, res, next) {
  if (req.session?.usuarioId) return next();
  return res.redirect('/entrar');
}

// Igual, pero si la petición es de un script que pide o envía JSON (Avatar Studio, contrato v1),
// responde 401 en JSON en lugar de redirigir: así el script sabe que la sesión ha caducado y no
// pierde lo que hay en pantalla.
export function requiereSesionOJson(req, res, next) {
  if (req.session?.usuarioId) return next();
  if (req.is('application/json') || req.accepts(['html', 'json']) === 'json') {
    return res.status(401).json({ error: 'Tu sesión ha caducado. Vuelve a entrar.' });
  }
  return res.redirect('/entrar');
}
