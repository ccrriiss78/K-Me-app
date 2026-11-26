// CONTROLADOR de «K-ME · TÚ DECIDES» (D080). Solo se llega aquí con sesión y token CSRF.
// Votar vuelve a «Mi K-ME» con «?voto=guardado», que enseña la confirmación y los resultados
// (patrón POST, redirección, GET: recargar la página no vuelve a enviar el voto).
import { votar as guardarVoto } from '../services/tuDecidesService.js';

export async function votar(req, res, next) {
  try {
    // El voto es de la cuenta de la sesión: cualquier otro campo del formulario se ignora.
    await guardarVoto({ idUsuario: req.session.usuarioId, propuesta: req.body.propuesta });
    res.redirect('/mi-kme?voto=guardado#tu-decides');
  } catch (err) {
    if (err.codigo !== 'PROPUESTA_NO_VALIDA') return next(err);
    res.status(400).render('error', { titulo: 'K-ME · TÚ DECIDES', mensaje: 'Esa propuesta no existe.' });
  }
}
