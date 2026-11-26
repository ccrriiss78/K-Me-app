// CONTROLADOR de la página privada "Mi K-ME". Solo se llega aquí con sesión válida.
// Muestra el alias público, nunca el usuario con el que se entra (D020), y la imagen de perfil
// (D044): el avatar y el sello elegidos, que ya ha leído el middleware cargarPerfil.

import { buscarPorId } from '../models/usuarioModel.js';
import { imagenesMiKme } from '../services/perfilService.js';
import { misRecompensas } from '../services/recompensaService.js';
import { verTuDecides } from '../services/tuDecidesService.js';

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
    // «K-ME · TÚ DECIDES» (D080): el voto de la cuenta y, si ya votó, los resultados. «?voto=guardado»
    // llega de la redirección tras votar y enseña la confirmación.
    const tuDecides = { ...(await verTuDecides(req.session.usuarioId)), guardado: req.query.voto === 'guardado' };
    res.render('mi-kme', { titulo: 'Mi K-ME', cuenta, perfil, recompensas, tuDecides });
  } catch (err) {
    next(err);
  }
}
