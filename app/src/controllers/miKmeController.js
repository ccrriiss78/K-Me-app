// CONTROLADOR de la página privada "Mi K-ME". Solo se llega aquí con sesión válida.
// Muestra el alias público, nunca el usuario con el que se entra (D020), y la imagen de perfil
// (D044): el avatar y el sello elegidos, que ya ha leído el middleware cargarPerfil.

import { buscarPorId } from '../models/usuarioModel.js';
import { imagenesMiKme } from '../services/perfilService.js';
import { misRecompensas } from '../services/recompensaService.js';

export async function mostrarMiKme(req, res, next) {
  try {
    const cuenta = await buscarPorId(req.session.usuarioId);
    if (!cuenta) {
      // La cuenta ya no existe: cerramos la sesión huérfana.
      return req.session.destroy(() => res.redirect('/entrar'));
    }
    const perfil = imagenesMiKme(res.locals.perfilSesion, cuenta.alias);
    // «Mis Kpopis» y «Mis tesoros» (D063, D064).
    const recompensas = await misRecompensas(req.session.usuarioId);
    res.render('mi-kme', { titulo: 'Mi K-ME', cuenta, perfil, recompensas });
  } catch (err) {
    next(err);
  }
}
