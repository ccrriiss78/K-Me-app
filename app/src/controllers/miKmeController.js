// CONTROLADOR de la página privada "Mi K-ME". Solo se llega aquí con sesión válida.
// Muestra el alias público, nunca el usuario con el que se entra (D020).

import { buscarPorId } from '../models/usuarioModel.js';

export async function mostrarMiKme(req, res, next) {
  try {
    const cuenta = await buscarPorId(req.session.usuarioId);
    if (!cuenta) {
      // La cuenta ya no existe: cerramos la sesión huérfana.
      return req.session.destroy(() => res.redirect('/entrar'));
    }
    res.render('mi-kme', { titulo: 'Mi K-ME', cuenta });
  } catch (err) {
    next(err);
  }
}
