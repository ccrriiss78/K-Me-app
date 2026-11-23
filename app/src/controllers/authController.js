// CONTROLADOR de acceso: recibe la petición, llama al servicio y decide qué vista mostrar.
// Se entra con el usuario (privado); en la sesión y en las páginas solo se usa el alias (D020).

import { comprobarCredenciales } from '../services/authService.js';
import { DURACION_SESION_LARGA } from '../middleware/sesion.js';

export function mostrarEntrar(req, res) {
  if (req.session.usuarioId) return res.redirect('/mi-kme');
  res.render('entrar', {
    titulo: 'Entrar',
    error: null,
    salida: req.query.salida === '1',     // viene de «Salir»
    registro: req.query.registro === '1', // viene de crear una cuenta (D019)
  });
}

export async function procesarEntrar(req, res, next) {
  const usuario = typeof req.body.usuario === 'string' ? req.body.usuario.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  // Casilla «Mantener sesión abierta»: solo cuenta si llega exactamente el valor '1'.
  const mantenerSesion = req.body.mantener_sesion === '1';
  try {
    const cuenta = await comprobarCredenciales({ usuario, password });
    if (!cuenta) {
      // Mismo mensaje si falla el usuario o la contraseña: no se revela cuál de los dos (D017).
      // El formulario vuelve vacío: no se devuelve lo escrito (D022).
      return res.status(401).render('entrar', { titulo: 'Entrar', error: 'Los datos introducidos no son válidos.' });
    }
    // Regenerar la sesión al autenticar: el identificador anterior deja de valer
    // (evita el ataque de "fijación de sesión").
    req.session.regenerate((err) => {
      if (err) return next(err);
      // La sesión nueva dura 24 h. Si se marcó la casilla, 7 días. express-session guarda
      // esta duración dentro de la sesión, así que rolling la sigue renovando a 7 días.
      if (mantenerSesion) req.session.cookie.maxAge = DURACION_SESION_LARGA;
      req.session.usuarioId = cuenta.id;
      req.session.alias = cuenta.alias; // alias público: es lo que muestra la cabecera
      req.session.save((err2) => {
        if (err2) return next(err2);
        res.redirect('/mi-kme');
      });
    });
  } catch (err) {
    next(err);
  }
}

export function cerrarSesion(req, res, next) {
  // destroy() elimina la fila de la tabla sesiones; después borramos la cookie del navegador.
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('kme.sid');
    res.redirect('/entrar?salida=1');
  });
}
