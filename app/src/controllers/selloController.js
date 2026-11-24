// CONTROLADOR de Sello Studio (D041): recibe la petición, llama al servicio y elige la vista.
// Todas las rutas son privadas (requiereSesion) y los POST llevan CSRF (ver routes/index.js).
// Funciona sin JavaScript: «Ver cómo queda» vuelve a pintar el editor con lo elegido, sin guardar.
// Tras un error, el editor conserva lo que el fan había elegido.

import * as sellos from '../services/selloService.js';
import {
  COLORES, MOTIVOS, ENCUADRES, MAX_MOTIVOS, MAX_SELLOS, DISENO_INICIAL,
} from '../catalogos/sello.js';
import { PALABRAS_HANGUL, GRUPOS_HANGUL, buscarPalabra } from '../catalogos/hangul.js';
import { estaConfirmado, leerBorrados } from '../services/borrarVarios.js';

const ERRORES = {
  OPCION_NO_VALIDA: [400, 'Esa opción no existe.'],
  SELLO_VACIO: [400, 'El sello necesita una palabra o un avatar.'],
  NOMBRE_NO_VALIDO: [400, 'Ponle al sello un nombre de 1 a 40 caracteres.'],
  LIMITE: [409, `Ya tienes ${MAX_SELLOS} sellos, el máximo. Borra uno para crear otro.`],
  VERSION: [409, 'Este sello ha cambiado en otro dispositivo. Tus cambios siguen aquí sin guardar: puedes guardarlos como copia o volver a abrir el sello.'],
};

const PALABRAS_POR_GRUPO = GRUPOS_HANGUL.map((g) => ({ ...g, palabras: PALABRAS_HANGUL.filter((p) => p.grupo === g.id) }));
const texto = (valor) => (typeof valor === 'string' ? valor : '');

// Lo elegido en el editor, para marcar cada opción: desde una receta guardada o desde el formulario.
function valoresDeReceta(c, nombre) {
  return {
    nombre,
    borde: c.borde,
    fondo: c.fondo,
    palabra: c.palabra?.id ?? '',
    color_palabra: c.palabra?.color ?? 'negro',
    avatar: c.avatar ? 'actual' : '',
    encuadre: c.avatar?.encuadre ?? 'rostro',
    mostrar_alias: Boolean(c.alias?.visible),
    color_alias: c.alias?.color ?? 'negro',
    motivos: Array.from({ length: MAX_MOTIVOS }, (_, i) => ({ id: c.motivos[i]?.id ?? '', color: c.motivos[i]?.color ?? 'negro' })),
  };
}

function valoresDeFormulario(b) {
  return {
    nombre: texto(b.nombre),
    borde: texto(b.borde),
    fondo: texto(b.fondo),
    palabra: texto(b.palabra),
    color_palabra: texto(b.color_palabra),
    avatar: texto(b.avatar),
    encuadre: texto(b.encuadre),
    mostrar_alias: b.mostrar_alias === 'si',
    color_alias: texto(b.color_alias),
    motivos: Array.from({ length: MAX_MOTIVOS }, (_, i) => ({ id: texto(b[`motivo${i + 1}`]), color: texto(b[`color_motivo${i + 1}`]) })),
  };
}

// Pinta el editor. «receta»: la receta válida que se dibuja (o null si lo elegido no es válido).
async function pintarEditor(req, res, estado, { valores, receta, idSello = null, version = null, error = null, conflicto = false, guardado = false, tieneCopiaAvatar = false }) {
  const alias = req.session.alias;
  const palabra = valores.palabra ? buscarPalabra(valores.palabra) : null;
  res.status(estado).render('sello-editor', {
    titulo: idSello ? 'Editar sello' : 'Nuevo sello',
    accion: idSello ? `/studio/sellos/${idSello}` : '/studio/sellos',
    idSello,
    version,
    valores,
    dibujo: receta ? sellos.dibujar(receta, alias) : null,
    avisos: receta ? sellos.avisosDeContraste(receta) : [],
    ayudaPalabra: palabra,
    error,
    conflicto,
    guardado,
    gruposPalabras: PALABRAS_POR_GRUPO,
    colores: COLORES,
    motivos: MOTIVOS,
    encuadres: ENCUADRES,
    avatares: await sellos.avataresGuardados(req.session.usuarioId),
    tieneCopiaAvatar,
  });
}

function noExiste(res) {
  return res.status(404).render('error', { titulo: 'No encontrado', mensaje: 'Ese sello no existe.' });
}

// Errores al guardar o ver: se vuelve al editor con lo elegido y el mensaje.
async function responderErrorEditor(err, req, res, next, extra = {}) {
  if (err.codigo === 'NO_EXISTE') return noExiste(res);
  const conocido = ERRORES[err.codigo];
  if (!conocido) return next(err); // fallo inesperado (por ejemplo, de la base de datos): página de error
  const [estado, mensaje] = conocido;
  try {
    await pintarEditor(req, res, estado, {
      valores: valoresDeFormulario(req.body),
      receta: null,
      error: mensaje,
      conflicto: err.codigo === 'VERSION',
      ...extra,
    });
  } catch (e) {
    next(e);
  }
}

// La página «Mis sellos», con un aviso o un error si los hay.
async function pintarLista(req, res, estado = 200, { error = null } = {}) {
  const lista = await sellos.verSellos({ idUsuario: req.session.usuarioId, alias: req.session.alias });
  res.status(estado).render('sellos', {
    titulo: 'Mis sellos', sellos: lista, maximo: MAX_SELLOS, eliminado: req.query.eliminado === '1',
    borrados: leerBorrados(req.query.borrados, MAX_SELLOS), error,
  });
}

export async function mostrarSellos(req, res, next) {
  try {
    await pintarLista(req, res);
  } catch (err) {
    next(err);
  }
}

// Borrar varios o todos (D058). Sin «confirmar», una página de confirmación con el número y los
// nombres (no borra nada); con «confirmar», borra los ids confirmados y vuelve con «?borrados=N».
const NADA_QUE_BORRAR = 'Elige al menos un sello para borrar.';
export async function borrarSellos(req, res, next) {
  const idUsuario = req.session.usuarioId;
  const cuerpo = req.body ?? {};
  try {
    if (!estaConfirmado(cuerpo)) {
      const lista = await sellos.prepararBorrado({ idUsuario, cuerpo });
      if (!lista.length) return await pintarLista(req, res, 400, { error: NADA_QUE_BORRAR });
      return res.render('borrar-varios', {
        titulo: 'Borrar sellos', lista, singular: 'sello', plural: 'sellos',
        accion: '/studio/sellos/borrar', volver: '/studio/sellos',
        aviso: 'Si alguno es tu imagen de perfil, el perfil se quedará sin él.',
      });
    }
    const borrados = await sellos.borrarVarios({ idUsuario, cuerpo });
    res.redirect(`/studio/sellos?borrados=${borrados}`);
  } catch (err) {
    if (err.codigo !== 'NADA_QUE_BORRAR') return next(err);
    try {
      await pintarLista(req, res, 400, { error: NADA_QUE_BORRAR });
    } catch (e) {
      next(e);
    }
  }
}

export async function nuevoSello(req, res, next) {
  try {
    await pintarEditor(req, res, 200, { valores: valoresDeReceta(DISENO_INICIAL, 'Mi sello'), receta: DISENO_INICIAL });
  } catch (err) {
    next(err);
  }
}

// «Ver cómo queda»: vuelve a pintar el editor con lo elegido, sin guardar.
async function verComoQueda(req, res, next, { idSello = null, version = null, tieneCopiaAvatar = false } = {}) {
  try {
    const receta = await sellos.recetaParaVista({ idUsuario: req.session.usuarioId, cuerpo: req.body, idSello });
    await pintarEditor(req, res, 200, { valores: valoresDeFormulario(req.body), receta, idSello, version, tieneCopiaAvatar });
  } catch (err) {
    await responderErrorEditor(err, req, res, next, { idSello, version, tieneCopiaAvatar });
  }
}

export async function crearSello(req, res, next) {
  if (req.body.accion === 'vista') return verComoQueda(req, res, next);
  try {
    const id = await sellos.crear({ idUsuario: req.session.usuarioId, cuerpo: req.body });
    res.redirect(`/studio/sellos/${id}?guardado=1`);
  } catch (err) {
    await responderErrorEditor(err, req, res, next);
  }
}

export async function abrirSello(req, res, next) {
  try {
    const sello = await sellos.abrir({ idUsuario: req.session.usuarioId, idSello: req.params.id });
    await pintarEditor(req, res, 200, {
      valores: valoresDeReceta(sello.composicion, sello.nombre),
      receta: sello.composicion,
      idSello: sello.id,
      version: sello.version,
      guardado: req.query.guardado === '1',
      tieneCopiaAvatar: Boolean(sello.composicion.avatar),
    });
  } catch (err) {
    if (err.codigo === 'NO_EXISTE') return noExiste(res);
    next(err);
  }
}

export async function guardarSello(req, res, next) {
  let sello;
  try {
    sello = await sellos.abrir({ idUsuario: req.session.usuarioId, idSello: req.params.id });
  } catch (err) {
    if (err.codigo === 'NO_EXISTE') return noExiste(res);
    return next(err);
  }
  const contexto = { idSello: sello.id, version: texto(req.body.version), tieneCopiaAvatar: Boolean(sello.composicion.avatar) };
  if (req.body.accion === 'vista') return verComoQueda(req, res, next, contexto);
  try {
    await sellos.guardar({ idUsuario: req.session.usuarioId, idSello: sello.id, cuerpo: req.body });
    res.redirect(`/studio/sellos/${sello.id}?guardado=1`);
  } catch (err) {
    await responderErrorEditor(err, req, res, next, contexto);
  }
}

export async function duplicarSello(req, res, next) {
  try {
    const id = await sellos.duplicar({ idUsuario: req.session.usuarioId, idSello: req.params.id });
    res.redirect(`/studio/sellos/${id}?guardado=1`);
  } catch (err) {
    if (err.codigo === 'NO_EXISTE') return noExiste(res);
    if (err.codigo === 'LIMITE') {
      try {
        const lista = await sellos.verSellos({ idUsuario: req.session.usuarioId, alias: req.session.alias });
        return res.status(409).render('sellos', { titulo: 'Mis sellos', sellos: lista, maximo: MAX_SELLOS, eliminado: false, error: ERRORES.LIMITE[1] });
      } catch (e) {
        return next(e);
      }
    }
    next(err);
  }
}

export async function eliminarSello(req, res, next) {
  try {
    await sellos.eliminar({ idUsuario: req.session.usuarioId, idSello: req.params.id });
    res.redirect('/studio/sellos?eliminado=1');
  } catch (err) {
    if (err.codigo === 'NO_EXISTE') return noExiste(res);
    next(err);
  }
}

// Vista previa para el script del editor (public/js/sello.js, zona de ChatGPT), que actualiza el
// sello sin recargar la página. No guarda nada. Recibe los mismos campos que el formulario y, al
// editar un sello guardado, «sello=<id>» (solo cuenta si es de esta cuenta).
// - Si se pide JSON («Accept: application/json»): { svg, avisos, ayuda } o, con un error, 400 { error }.
//   «svg» se dibuja igual que en el editor (clase «sello--editor», 240 px de ancho); «ayuda» es
//   { hangul, lectura, significado } de la palabra, o null si el sello no lleva palabra.
// - Si no: solo el SVG, o 400 con el mensaje en texto.
// Si la sesión ha caducado, requiereSesion lleva a /entrar: el script debe notar que no le llega JSON.
const quiereJson = (req) => req.accepts(['html', 'json']) === 'json';

export async function vistaPrevia(req, res, next) {
  const json = quiereJson(req);
  try {
    const idSello = /^[1-9]\d{0,17}$/.test(texto(req.query.sello)) ? req.query.sello : null;
    const receta = await sellos.recetaParaVista({ idUsuario: req.session.usuarioId, cuerpo: req.query, idSello });
    const dibujo = sellos.dibujar(receta, req.session.alias);
    if (!json) return res.render('_sello', { dibujo, ancho: null, clase: null });
    res.render('_sello', { dibujo, ancho: 240, clase: 'sello--editor' }, (err, svg) => {
      if (err) return next(err);
      const palabra = receta.palabra ? buscarPalabra(receta.palabra.id) : null;
      res.json({
        svg: svg.trim(),
        avisos: sellos.avisosDeContraste(receta),
        ayuda: palabra && { hangul: palabra.hangul, lectura: palabra.lectura, significado: palabra.significado },
      });
    });
  } catch (err) {
    const conocido = ERRORES[err.codigo];
    if (!conocido) return next(err);
    if (json) return res.status(400).json({ error: conocido[1] });
    return res.status(400).type('text/plain').send(conocido[1]);
  }
}
