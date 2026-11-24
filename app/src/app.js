// Construye la aplicación Express. Separado de server.js para poder usarla en las pruebas.

import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cargarEnv } from './config/env.js';
import { crearMiddlewareSesion } from './middleware/sesion.js';
import { tokenCsrf } from './middleware/csrf.js';
import { cargarPerfil } from './middleware/perfil.js';
import { cargarKpopis } from './middleware/kpopis.js';
import { rutas } from './routes/index.js';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export function crearApp() {
  const config = cargarEnv();
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(raiz, 'src', 'views'));
  app.set('trust proxy', false); // cambiar en despliegue detrás de un proxy

  // Cabeceras de seguridad (CSP, nosniff, etc.). En local sin HTTPS no se fuerza
  // "upgrade-insecure-requests"; en despliegue con HTTPS (COOKIE_SECURE=true) sí.
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        ...(config.cookieSecure ? {} : { 'upgrade-insecure-requests': null }),
      },
    },
  }));
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));
  app.use(express.static(path.join(raiz, 'public'), { index: false }));
  // El editor de avatar (zona de ChatGPT) se sirve desde su propia carpeta, sin copiarlo, para que
  // Avatar Studio lo use dentro de la app (contrato v1). Solo estas cinco subcarpetas: nada de
  // propuestas, tests, scripts ni páginas de revisión.
  const carpetaEditor = path.join(raiz, '..', 'editor-avatar', 'editor-avatar');
  for (const sub of ['js', 'css', 'datos', 'assets', 'vendor']) {
    app.use(`/editor/${sub}`, express.static(path.join(carpetaEditor, sub), { index: false, dotfiles: 'ignore', redirect: false }));
  }

  app.use(crearMiddlewareSesion(config));
  app.use(tokenCsrf);
  // Alias de quien tiene la sesión abierta, para la cabecera. Se llama aliasSesion (no alias)
  // para que no lo tape el alias escrito en el formulario de /entrar (T017).
  // rutaActual: para marcar en el menú la página en la que estás.
  app.use((req, res, next) => {
    res.locals.aliasSesion = req.session.alias ?? null;
    res.locals.rutaActual = req.path;
    next();
  });
  // Imagen de perfil de quien tiene la sesión, para la cabecera y las listas (D044, D055).
  app.use(cargarPerfil);
  // Saldo de Kpopis de quien tiene la sesión, para la cabecera (D063).
  app.use(cargarKpopis);

  app.use(rutas);

  app.use((req, res) => res.status(404).render('error', { titulo: 'No encontrado', mensaje: 'Esa página no existe.' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[error]', err);
    res.status(500).render('error', { titulo: 'Error', mensaje: 'Ha ocurrido un error en el servidor.' });
  });

  return { app, config };
}
