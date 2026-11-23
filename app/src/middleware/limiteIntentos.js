// Límites de intentos por dirección IP (express-rate-limit, contador en memoria).
// - Entrar: como máximo 10 intentos cada 15 minutos. Frena los ataques de fuerza bruta.
// - Registro: como máximo 10 intentos cada hora, contando también los fallidos (D019).
//   Frena la creación masiva de cuentas y que alguien vaya probando qué usuarios existen.

import rateLimit from 'express-rate-limit';

export const limiteIntentosLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('entrar', {
      titulo: 'Entrar',
      error: 'Demasiados intentos. Espera unos minutos antes de volver a probar.',
    });
  },
});

export const limiteRegistro = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('registro', {
      titulo: 'Crear cuenta',
      error: 'Demasiados registros desde este equipo. Espera una hora y vuelve a probar.',
    });
  },
});
