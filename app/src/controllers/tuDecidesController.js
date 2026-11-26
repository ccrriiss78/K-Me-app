// CONTROLADOR de «K-ME · TÚ DECIDES» (D080). Solo se llega aquí con sesión y token CSRF.
// - Formulario normal (sin JavaScript): votar vuelve a «Mi K-ME» con «?voto=guardado», que enseña la
//   confirmación y los resultados (patrón POST, redirección, GET: recargar la página no vuelve a
//   enviar el voto).
// - Con JavaScript (public/js/tu-decides.js pide JSON): responde el bloque de la votación ya
//   actualizado, { html }, y el script lo pone en su sitio sin recargar ni mover la página (E0098).
import { votar as guardarVoto, verTuDecides } from '../services/tuDecidesService.js';

const quiereJson = (req) => req.accepts(['html', 'json']) === 'json';

export async function votar(req, res, next) {
  const json = quiereJson(req);
  try {
    // El voto es de la cuenta de la sesión: cualquier otro campo del formulario se ignora.
    await guardarVoto({ idUsuario: req.session.usuarioId, propuesta: req.body.propuesta });
    if (!json) return res.redirect('/mi-kme?voto=guardado#tu-decides');
    const tuDecides = { ...(await verTuDecides(req.session.usuarioId)), guardado: true };
    // La misma vista parcial que pinta «Mi K-ME»: una sola fuente para el marcado.
    res.render('_tu-decides', { tuDecides }, (err, html) => (err ? next(err) : res.json({ html })));
  } catch (err) {
    if (err.codigo !== 'PROPUESTA_NO_VALIDA') return next(err);
    if (json) return res.status(400).json({ error: 'Esa propuesta no existe.' });
    res.status(400).render('error', { titulo: 'K-ME · TÚ DECIDES', mensaje: 'Esa propuesta no existe.' });
  }
}
