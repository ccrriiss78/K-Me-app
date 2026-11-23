// Sesiones de servidor guardadas en PostgreSQL (tabla "sesiones").
// El navegador solo recibe una cookie con un identificador firmado; los datos viven en el servidor.

import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { obtenerPool } from '../config/db.js';

const PgStore = connectPgSimple(session);

// Duración de la sesión (D016). Con rolling: true el plazo se cuenta desde la última petición.
const HORA = 1000 * 60 * 60;
export const DURACION_SESION = 24 * HORA;           // por defecto: 24 horas
export const DURACION_SESION_LARGA = 7 * 24 * HORA; // con «Mantener sesión abierta»: 7 días

export function crearMiddlewareSesion(config) {
  return session({
    name: 'kme.sid',
    store: new PgStore({ pool: obtenerPool(), tableName: 'sesiones', pruneSessionInterval: 60 * 15 }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,      // no crea filas hasta que haya algo que guardar
    rolling: true,                 // renueva la caducidad con cada petición
    cookie: {
      httpOnly: true,              // el JavaScript del navegador no puede leer la cookie
      sameSite: 'lax',             // no se envía en peticiones POST desde otros sitios
      secure: config.cookieSecure, // true solo con HTTPS (despliegue futuro)
      maxAge: DURACION_SESION,     // 24 horas; el controlador la amplía a 7 días si se pide
    },
  });
}
