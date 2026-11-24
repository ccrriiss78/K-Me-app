// CONTROLADOR de la imagen de perfil (D044, D055). Solo se llega aquí con sesión y token CSRF.
// Elegir o quitar vuelve a «Mi K-ME», donde se ve el resultado. Algo que no existe en la cuenta
// (también lo de otra cuenta) da 404 con un mensaje claro.

import * as perfil from '../services/perfilService.js';

const ERRORES = {
  AVATAR_NO_EXISTE: [404, 'Ese avatar no existe.'],
  SELLO_NO_EXISTE: [404, 'Ese sello no existe.'],
};

function responder(accion) {
  return async (req, res, next) => {
    try {
      await accion(req);
      res.redirect('/mi-kme');
    } catch (err) {
      const conocido = ERRORES[err.codigo];
      if (!conocido) return next(err);
      res.status(conocido[0]).render('error', { titulo: 'No encontrado', mensaje: conocido[1] });
    }
  };
}

export const elegirAvatarPerfil = responder((req) => perfil.elegirAvatar({ idUsuario: req.session.usuarioId, valor: req.body.avatar }));
export const elegirSelloPerfil = responder((req) => perfil.elegirSello({ idUsuario: req.session.usuarioId, valor: req.body.sello }));
