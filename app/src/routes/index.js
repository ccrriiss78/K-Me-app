// RUTAS: relacionan cada URL con su controlador y los middleware que la protegen.

import express, { Router } from 'express';
import { mostrarEntrar, procesarEntrar, cerrarSesion } from '../controllers/authController.js';
import { mostrarRegistro, procesarRegistro } from '../controllers/registroController.js';
import { mostrarMiKme } from '../controllers/miKmeController.js';
import {
  mostrarMuro, publicar, reaccionar, quitarReacciones, eliminarPublicacion,
} from '../controllers/connectController.js';
import {
  mostrarSellos, nuevoSello, crearSello, abrirSello, guardarSello, duplicarSello, eliminarSello, vistaPrevia, borrarSellos,
} from '../controllers/selloController.js';
import {
  mostrarAvatares, nuevoAvatar, abrirAvatar, crearAvatar, guardarAvatar, duplicarAvatar, eliminarAvatar, erroresJsonAvatar,
  borrarAvatares,
} from '../controllers/avatarController.js';
import { elegirAvatarPerfil, elegirSelloPerfil } from '../controllers/perfilController.js';
import { votar as votarTuDecides } from '../controllers/tuDecidesController.js';
import { mostrarCatalogo as mostrarCatalogoCanje, canjear as canjearPieza } from '../controllers/canjeController.js';
import {
  mostrarEscenario, mostrarReto, mostrarPregunta, responderPregunta,
} from '../controllers/escenarioController.js';
import { requiereSesion, requiereSesionOJson } from '../middleware/requiereSesion.js';
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
// Imagen de perfil (D044, D055): el id de un avatar o de un sello propio, o vacío para quitarlo.
rutas.post('/perfil/avatar', requiereSesion, comprobarCsrf, elegirAvatarPerfil);
rutas.post('/perfil/sello', requiereSesion, comprobarCsrf, elegirSelloPerfil);
// «K-ME · TÚ DECIDES» (D080): votar una propuesta futura desde «Mi K-ME». Un voto por cuenta.
rutas.post('/tu-decides', requiereSesion, comprobarCsrf, votarTuDecides);

// Connect mínimo (D038): el muro de los fans. Todo privado; cada POST, con CSRF.
rutas.get('/connect', requiereSesion, mostrarMuro);
rutas.post('/connect/publicaciones', requiereSesion, comprobarCsrf, publicar);
rutas.post('/connect/publicaciones/:id/reacciones', requiereSesion, comprobarCsrf, reaccionar);
rutas.post('/connect/publicaciones/:id/reacciones/quitar', requiereSesion, comprobarCsrf, quitarReacciones);
rutas.post('/connect/publicaciones/:id/eliminar', requiereSesion, comprobarCsrf, eliminarPublicacion);

// Mi escenario (D062): los retos, de momento la miniclase HANGUL LIVE 001. Todo privado; responder,
// con CSRF. El servidor decide si se acierta y entrega la recompensa (una sola vez).
rutas.get('/escenario', requiereSesion, mostrarEscenario);
rutas.get('/escenario/:reto', requiereSesion, mostrarReto);
rutas.get('/escenario/:reto/preguntas/:numero', requiereSesion, mostrarPregunta);
rutas.post('/escenario/:reto/preguntas/:numero', requiereSesion, comprobarCsrf, responderPregunta);

// Sello Studio (D041): los sellos personales de cada cuenta. Todo privado; cada POST, con CSRF.
// «vista-previa» y «nuevo» van antes que «:id» para que no se lean como un id.
rutas.get('/studio/sellos', requiereSesion, mostrarSellos);
rutas.get('/studio/sellos/nuevo', requiereSesion, nuevoSello);
rutas.get('/studio/sellos/vista-previa', requiereSesion, vistaPrevia);
rutas.post('/studio/sellos', requiereSesion, comprobarCsrf, crearSello);
rutas.post('/studio/sellos/borrar', requiereSesion, comprobarCsrf, borrarSellos); // varios o todos (D058)
rutas.get('/studio/sellos/:id', requiereSesion, abrirSello);
rutas.post('/studio/sellos/:id', requiereSesion, comprobarCsrf, guardarSello);
rutas.post('/studio/sellos/:id/duplicar', requiereSesion, comprobarCsrf, duplicarSello);
rutas.post('/studio/sellos/:id/eliminar', requiereSesion, comprobarCsrf, eliminarSello);

// Colección «K» (E0083): catálogo de canje de Kpopis. Privado; canjear, con CSRF.
rutas.get('/studio/coleccion-k', requiereSesion, mostrarCatalogoCanje);
rutas.post('/studio/coleccion-k/canjear', requiereSesion, comprobarCsrf, canjearPieza);

// Avatar Studio (contrato v1 con ChatGPT): páginas y rutas JSON para el script del editor.
// Sin sesión, las peticiones JSON reciben 401 en JSON. Los POST leen JSON (hasta 16 kB; la receta,
// como mucho 8 kB) antes del CSRF, que va en el cuerpo («_csrf»). «nuevo» va antes que «:id».
const leerJson = express.json({ limit: '16kb' });
rutas.get('/studio/avatares', requiereSesionOJson, mostrarAvatares);
rutas.get('/studio/avatares/nuevo', requiereSesion, nuevoAvatar);
rutas.post('/studio/avatares', requiereSesionOJson, leerJson, comprobarCsrf, crearAvatar);
rutas.post('/studio/avatares/borrar', requiereSesionOJson, leerJson, comprobarCsrf, borrarAvatares); // varios o todos (D058)
rutas.get('/studio/avatares/:id', requiereSesionOJson, abrirAvatar);
rutas.post('/studio/avatares/:id', requiereSesionOJson, leerJson, comprobarCsrf, guardarAvatar);
rutas.post('/studio/avatares/:id/duplicar', requiereSesionOJson, leerJson, comprobarCsrf, duplicarAvatar);
rutas.post('/studio/avatares/:id/eliminar', requiereSesionOJson, leerJson, comprobarCsrf, eliminarAvatar);
rutas.use('/studio/avatares', erroresJsonAvatar);

// Pequeña ruta de salud para comprobar que el servidor responde (no requiere sesión).
rutas.get('/salud', (req, res) => res.json({ ok: true, app: 'k-me', fase: 1 }));
