// SERVICIO de Connect (D038): las reglas del muro. No sabe nada de HTTP ni de vistas.
// Si algo falla, lanza un error con codigo: EMOCION_NO_VALIDA, REACCION_NO_VALIDA,
// OPCION_NO_VALIDA, ICONOS_NO_VALIDOS, DISENO_NO_EXISTE (avatar o sello que no es de la cuenta) o
// NO_EXISTE (publicación que no existe o que no es de quien la quiere borrar).
//
// El diseño de cada publicación (Q7, Q11; E0072) es una COPIA del avatar o del sello: si después se
// editan o se borran, la publicación no cambia. Sin elegir, la imagen de perfil (el avatar; si no
// hay, el sello); si no hay ninguna, el muro enseña la inicial.

import * as Publicacion from '../models/publicacionModel.js';
import * as Avatar from '../models/avatarModel.js';
import * as Sello from '../models/selloModel.js';
import * as Perfil from '../models/perfilModel.js';
import { dibujarAvatar } from './avatarCatalogo.js';
import { dibujar as dibujarSello } from './selloService.js';
import {
  REACCIONES, MAX_REACCIONES_POR_TIPO, EMOCION_RETIRADA, MAX_ICONOS_MENSAJE,
  buscarEmocion, buscarReaccion, buscarIconoMensaje,
} from '../catalogos/connect.js';

// Tamaño del diseño en la photocard del muro (76 × 100 px; el CSS lo ajusta en el móvil).
// Del avatar se ve la cara: el cuerpo entero quedaría diminuto.
const ALTO_CARA_MURO = 70;
const ANCHO_SELLO_MURO = 66;
// Valor del desplegable «Diseño»: vacío (la imagen de perfil), «avatar:id» o «sello:id».
const VALOR_DISENO = /^(avatar|sello):([1-9]\d{0,17})$/;

function errorConCodigo(codigo) {
  const e = new Error(codigo);
  e.codigo = codigo;
  return e;
}

// El id de una publicación llega en la URL: solo vale un número entero positivo.
// (Hasta 18 cifras, para no pasar del máximo de BIGINT.)
function leerId(valor) {
  return typeof valor === 'string' && /^[1-9]\d{0,17}$/.test(valor) ? valor : null;
}

// Cuánto hace, en palabras: «ahora mismo», «hace 5 min», «hace 2 h», «ayer», «hace 3 días» o la fecha.
export function haceCuanto(fecha, ahora = new Date()) {
  const segundos = Math.round((ahora - fecha) / 1000);
  if (segundos < 60) return 'ahora mismo';
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' });
}

// Las reacciones del catálogo con sus números para quien mira: total, suyas, si ha llegado al tope
// y la etiqueta que lee un lector de pantalla. La usan el muro y las respuestas en JSON.
function construirReacciones(totales, mias) {
  const reacciones = REACCIONES.map((r) => {
    const total = totales[r.id] ?? 0;
    const suyas = mias[r.id] ?? 0;
    const completa = suyas >= MAX_REACCIONES_POR_TIPO;
    const tuyas = suyas ? `, ${suyas} ${suyas === 1 ? 'tuya' : 'tuyas'}` : '';
    const accion = completa ? `Has llegado al máximo de ${MAX_REACCIONES_POR_TIPO}.` : 'Añadir una más.';
    return { ...r, total, mias: suyas, completa, etiqueta: `${r.texto}: ${total} en total${tuyas}. ${accion}` };
  });
  return { reacciones, totalMias: reacciones.reduce((suma, r) => suma + r.mias, 0) };
}

// Estado de las reacciones de una publicación para quien mira (para actualizar el muro sin recargar).
export async function estadoReacciones({ idUsuario, idPublicacion }) {
  const id = leerId(idPublicacion);
  if (!id) throw errorConCodigo('NO_EXISTE');
  const { totales, mias } = await Publicacion.reaccionesDe({ idPublicacion: id, idUsuario });
  return construirReacciones(totales, mias);
}

// Lo que se dibuja en la photocard de una publicación: la cara del avatar o el sello entero
// (con el alias de quien publica), o null para enseñar la inicial.
function dibujoDelDiseno(diseno, alias) {
  if (diseno?.tipo === 'avatar') {
    return { tipo: 'avatar', svg: dibujarAvatar(diseno.copia, { encuadre: 'rostro', alto: ALTO_CARA_MURO }) };
  }
  if (diseno?.tipo === 'sello') {
    return { tipo: 'sello', dibujo: dibujarSello(diseno.copia, alias), ancho: ANCHO_SELLO_MURO };
  }
  return null;
}

// El muro tal como lo ve quien tiene la sesión abierta, listo para la vista.
export async function verMuro({ idUsuario, ahora = new Date() }) {
  const filas = await Publicacion.listarMuro({ idUsuario });
  return filas.map((p) => {
    const { reacciones, totalMias } = construirReacciones(p.totales, p.mias);
    return {
      id: p.id,
      alias: p.alias,
      inicial: p.alias.charAt(0).toUpperCase(),
      dibujo: dibujoDelDiseno(p.diseno, p.alias),
      // Un icono que ya no está en el catálogo no se ve (como una emoción retirada, sin romper el muro).
      mensaje: (p.iconos ?? []).map(buscarIconoMensaje).filter(Boolean),
      esMia: p.es_mia,
      creadoEn: p.creado_en,
      hace: haceCuanto(p.creado_en, ahora),
      emocion: buscarEmocion(p.emocion) ?? EMOCION_RETIRADA,
      reacciones,
      totalMias,
    };
  });
}

// Los diseños que se ofrecen en «Publicar»: los avatares y sellos de la cuenta, por su nombre.
export async function disenosParaPublicar(idUsuario) {
  const [avatares, sellos] = await Promise.all([Avatar.listar(idUsuario), Sello.listar(idUsuario)]);
  const opcion = (f) => ({ id: String(f.id), nombre: f.nombre });
  return { avatares: avatares.map(opcion), sellos: sellos.map(opcion) };
}

// El mensaje con iconos: llegan los 5 desplegables (los vacíos no cuentan). Cada icono tiene que
// estar en el catálogo y no pueden ser más de MAX_ICONOS_MENSAJE.
export function leerIconos(valor) {
  const lista = valor === undefined ? [] : [].concat(valor);
  if (!lista.every((v) => typeof v === 'string')) throw errorConCodigo('ICONOS_NO_VALIDOS');
  const iconos = lista.filter((v) => v !== '');
  if (iconos.length > MAX_ICONOS_MENSAJE || !iconos.every(buscarIconoMensaje)) throw errorConCodigo('ICONOS_NO_VALIDOS');
  return iconos;
}

// La copia del diseño elegido, siempre de la propia cuenta: un avatar o sello de otra cuenta «no
// existe». Vacío = la imagen de perfil del momento (Q11), que también se copia.
async function copiarDiseno({ idUsuario, valor }) {
  if (valor === undefined || valor === '') {
    const { avatar, sello } = await Perfil.leer(idUsuario);
    if (avatar) return { tipo: 'avatar', origen: avatar.id, copia: avatar.composicion };
    if (sello) return { tipo: 'sello', origen: sello.id, copia: sello.composicion };
    return null;
  }
  const elegido = typeof valor === 'string' ? VALOR_DISENO.exec(valor) : null;
  if (!elegido) throw errorConCodigo('DISENO_NO_EXISTE');
  const [, tipo, id] = elegido;
  const fila = tipo === 'avatar'
    ? await Avatar.buscar({ idUsuario, idAvatar: id })
    : await Sello.buscar({ idUsuario, idSello: id });
  if (!fila) throw errorConCodigo('DISENO_NO_EXISTE');
  return { tipo, origen: String(fila.id), copia: fila.composicion };
}

export async function publicar({ idUsuario, emocion, diseno, iconos }) {
  if (typeof emocion !== 'string' || !buscarEmocion(emocion)) throw errorConCodigo('EMOCION_NO_VALIDA');
  const mensaje = leerIconos(iconos);
  const copia = await copiarDiseno({ idUsuario, valor: diseno });
  return Publicacion.crearPublicacion({ idUsuario, emocion, diseno: copia, iconos: mensaje });
}

// Suma una reacción. Devuelve 'sumada' o 'tope' (ya había dado el máximo de ese tipo).
export async function reaccionar({ idUsuario, idPublicacion, tipo }) {
  const id = leerId(idPublicacion);
  if (!id) throw errorConCodigo('NO_EXISTE');
  if (typeof tipo !== 'string' || !buscarReaccion(tipo)) throw errorConCodigo('REACCION_NO_VALIDA');
  const resultado = await Publicacion.sumarReaccion({ idPublicacion: id, idUsuario, tipo, maximo: MAX_REACCIONES_POR_TIPO });
  if (resultado === null) throw errorConCodigo('NO_EXISTE');
  return resultado;
}

// Quita las reacciones propias: que = 'ultima' (la última que diste) o 'todas'.
export async function quitarReacciones({ idUsuario, idPublicacion, que }) {
  const id = leerId(idPublicacion);
  if (!id) throw errorConCodigo('NO_EXISTE');
  if (que !== 'ultima' && que !== 'todas') throw errorConCodigo('OPCION_NO_VALIDA');
  const quitadas = await Publicacion.quitarReacciones({ idPublicacion: id, idUsuario, todas: que === 'todas' });
  if (quitadas === null) throw errorConCodigo('NO_EXISTE');
  return quitadas;
}

// Borra la publicación si es tuya. Si no existe o es de otra cuenta, NO_EXISTE (404): no se
// dice que exista una publicación ajena.
export async function eliminar({ idUsuario, idPublicacion }) {
  const id = leerId(idPublicacion);
  if (!id || !(await Publicacion.eliminarPublicacion({ id, idUsuario }))) throw errorConCodigo('NO_EXISTE');
}
