// CONTROLADOR del registro por formulario (T016). Sin correo (D018).
// Al terminar no abre sesión: lleva a /entrar con un aviso (D019).
// Los errores no dan pistas: código 400 y el mismo mensaje para todo (D021), salvo dos casos
// que no revelan nada de otras cuentas: el alias público ya en uso y el alias igual al usuario.
// Tras un error el formulario vuelve vacío (D022). Excepción (D036): si el error es solo del alias,
// se devuelve el usuario escrito para no tener que repetirlo. Las contraseñas nunca se devuelven.

import { crearCuenta } from '../services/authService.js';

const MENSAJE_GENERAL = 'No se ha podido crear la cuenta. Revisa los datos y vuelve a intentarlo.';
const MENSAJES_VISIBLES = {
  ALIAS_DUPLICADO: 'Ese alias ya lo usa otro fan.', // el alias es público: decirlo no revela nada
  ALIAS_IGUAL_USUARIO: 'El alias tiene que ser distinto de tu usuario.',
  ALIAS_NO_PERMITIDO: 'Ese alias no está permitido. Elige otro.', // D042
};
// Errores que solo dependen del alias. En todos, el usuario ya ha pasado su validación
// (crearCuenta lo comprueba antes), así que se puede devolver al formulario tal cual.
const ERRORES_DEL_ALIAS = new Set(['ALIAS_DUPLICADO', 'ALIAS_IGUAL_USUARIO', 'ALIAS_NO_PERMITIDO']);

const texto = (valor) => (typeof valor === 'string' ? valor : '');

export function mostrarRegistro(req, res) {
  if (req.session.usuarioId) return res.redirect('/mi-kme');
  res.render('registro', { titulo: 'Crear cuenta', error: null });
}

export async function procesarRegistro(req, res, next) {
  if (req.session.usuarioId) return res.redirect('/mi-kme');
  const usuario = texto(req.body.usuario).trim();
  const alias = texto(req.body.alias).trim();
  const password = texto(req.body.password);
  const repetida = texto(req.body.password_repetida);
  const rechazar = (mensaje, { errorEnAlias = false } = {}) => res.status(400).render('registro', {
    titulo: 'Crear cuenta',
    error: mensaje,
    errorEnAlias,
    usuarioEscrito: errorEnAlias ? usuario : '',
  });

  if (password !== repetida) return rechazar(MENSAJE_GENERAL);
  try {
    await crearCuenta({ usuario, alias, password });
  } catch (err) {
    if (!err.codigo) return next(err); // fallo inesperado (por ejemplo, de la base de datos): página de error
    return rechazar(MENSAJES_VISIBLES[err.codigo] ?? MENSAJE_GENERAL, { errorEnAlias: ERRORES_DEL_ALIAS.has(err.codigo) });
  }
  res.redirect('/entrar?registro=1');
}
