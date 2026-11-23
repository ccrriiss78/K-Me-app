// RUTAS: relacionan cada URL con su controlador y los middleware que la protegen.

import { Router } from 'express';
import { mostrarEntrar, procesarEntrar, cerrarSesion } from '../controllers/authController.js';
import { mostrarRegistro, procesarRegistro } from '../controllers/registroController.js';
import { mostrarMiKme } from '../controllers/miKmeController.js';
import {
  mostrarMuro, publicar, reaccionar, quitarReacciones, eliminarPublicacion,
} from '../controllers/connectController.js';
import {
  mostrarSellos, nuevoSello, crearSello, abrirSello, guardarSello, duplicarSello, eliminarSello, vistaPrevia,
} from '../controllers/selloController.js';
import { requiereSesion } from '../middleware/requiereSesion.js';
import { comprobarCsrf } from '../middleware/csrf.js';
import { limiteIntentosLogin, limiteRegistro } from '../middleware/limiteIntentos.js';

export const rutas = Router();

rutas.get('/', (req, res) => res.redirect(req.session.usuarioId ? '/mi-kme' : '/entrar'));

rutas.get('/entrar', mostrarEntrar);
rutas.post('/entrar', limiteIntentosLogin, comprobarCsrf, procesarEntrar);

// Registro por formulario (T016). El límite va antes del CSRF: cuenta todos los intentos (D019).
rutas.get('/registro', mostrarRegistro);
rutas.post('/registro', limiteRegistro, comprobarCsrf, procesarRegistro);

rutas.post('/salir', comprobarCsrf, cerrarSesion);

rutas.get('/mi-kme', requiereSesion, mostrarMiKme);

// Connect mínimo (D038): el muro de los fans. Todo privado; cada POST, con CSRF.
rutas.get('/connect', requiereSesion, mostrarMuro);
rutas.post('/connect/publicaciones', requiereSesion, comprobarCsrf, publicar);
rutas.post('/connect/publicaciones/:id/reacciones', requiereSesion, comprobarCsrf, reaccionar);
rutas.post('/connect/publicaciones/:id/reacciones/quitar', requiereSesion, comprobarCsrf, quitarReacciones);
rutas.post('/connect/publicaciones/:id/eliminar', requiereSesion, comprobarCsrf, eliminarPublicacion);

// Sello Studio (D041): los sellos personales de cada cuenta. Todo privado; cada POST, con CSRF.
// «vista-previa» y «nuevo» van antes que «:id» para que no se lean como un id.
rutas.get('/studio/sellos', requiereSesion, mostrarSellos);
rutas.get('/studio/sellos/nuevo', requiereSesion, nuevoSello);
rutas.get('/studio/sellos/vista-previa', requiereSesion, vistaPrevia);
rutas.post('/studio/sellos', requiereSesion, comprobarCsrf, crearSello);
rutas.get('/studio/sellos/:id', requiereSesion, abrirSello);
rutas.post('/studio/sellos/:id', requiereSesion, comprobarCsrf, guardarSello);
rutas.post('/studio/sellos/:id/duplicar', requiereSesion, comprobarCsrf, duplicarSello);
rutas.post('/studio/sellos/:id/eliminar', requiereSesion, comprobarCsrf, eliminarSello);

// Pequeña ruta de salud para comprobar que el servidor responde (no requiere sesión).
rutas.get('/salud', (req, res) => res.json({ ok: true, app: 'k-me', fase: 1 }));
