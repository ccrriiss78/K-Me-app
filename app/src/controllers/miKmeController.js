// CONTROLADOR de la página privada "Mi K-ME". Solo se llega aquí con sesión válida.
// Muestra el alias público, nunca el usuario con el que se entra (D020), y la imagen de perfil
// (D044): el avatar y el sello elegidos, que ya ha leído el middleware cargarPerfil.

import { buscarPorId } from '../models/usuarioModel.js';
import { imagenesMiKme } from '../services/perfilService.js';

export async function mostrarMiKme(req, res, next) {
  try {
    const cuenta = await buscarPorId(req.session.usuarioId);
    if (!cuenta) {
      // La cuenta ya no existe: cerramos la sesión huérfana.
      return req.session.destroy(() => res.redirect('/entrar'));
    }
    const perfil = imagenesMiKme(res.locals.perfilSesion, cuenta.alias);
    res.render('mi-kme', { titulo: 'Mi K-ME', cuenta, perfil });
  } catch (err) {
    next(err);
  }
}
