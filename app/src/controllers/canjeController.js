// CONTROLADOR de Colección «K»: el catálogo de canje y canjear (E0083). Rutas privadas; canjear,
// con CSRF. El resultado se pinta en la misma página. Recargar repite la petición, pero no cobra
// dos veces: una pieza ya tuya da «Esa pieza ya es tuya.».

import * as canje from '../services/canjeService.js';
import { saldoDeSesion } from '../services/recompensaService.js';

async function pintar(req, res, estado, extra = {}) {
  const catalogo = await canje.verCatalogo(req.session.usuarioId);
  res.status(estado).render('coleccion-k', { titulo: 'Colección «K»', ...catalogo, mensaje: null, error: null, ...extra });
}

export async function mostrarCatalogo(req, res, next) {
  try { await pintar(req, res, 200); } catch (err) { next(err); }
}

export async function canjear(req, res, next) {
  try {
    const pieza = await canje.canjear({ idUsuario: req.session.usuarioId, familia: req.body?.familia });
    res.locals.kpopisSesion = await saldoDeSesion(req.session.usuarioId); // la cabecera, ya con el gasto
    await pintar(req, res, 200, { mensaje: `¡Canjeado! Ya tienes ${pieza.nombre}.` });
  } catch (err) {
    if (err.codigo === 'NO_EXISTE') return pintar(req, res, 404, { error: 'Esa pieza no está en el catálogo de canje.' }).catch(next);
    if (err.codigo === 'YA_ES_TUYA') return pintar(req, res, 400, { error: 'Esa pieza ya es tuya.' }).catch(next);
    if (err.codigo === 'SALDO_INSUFICIENTE') return pintar(req, res, 400, { error: `No tienes Kpopis suficientes: te faltan ${err.falta}.` }).catch(next);
    next(err);
  }
}
