// Solo deja pasar si hay un usuario autenticado en la sesión. Si no, redirige al inicio de sesión.

export function requiereSesion(req, res, next) {
  if (req.session?.usuarioId) return next();
  return res.redirect('/entrar');
}
