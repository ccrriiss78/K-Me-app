// SERVICIO de Sello Studio (TECH_SPEC §4, D041): reglas de los sellos personales.
// - Un sello lleva una palabra en hangul comprobada, el avatar de la cuenta o las dos cosas; nunca
//   va vacío. El alias público se muestra u oculta. No hay nombre personal ni otro texto libre.
// - Se guarda como receta con ids de los catálogos; aquí se valida cada id antes de guardar.
// - Si lleva avatar, la receta guarda una COPIA de la receta del avatar: editar o borrar después el
//   avatar original no cambia ni rompe el sello. «actual» = conservar la copia que ya tiene.
// - Errores con «codigo» (el controlador decide el mensaje): OPCION_NO_VALIDA, SELLO_VACIO,
//   NOMBRE_NO_VALIDO, LIMITE, VERSION y NO_EXISTE.

import * as Sello from '../models/selloModel.js';
import * as Avatar from '../models/avatarModel.js';
import { dibujarAvatar } from './avatarCatalogo.js';
import {
  MAX_SELLOS, MAX_MOTIVOS, LARGO_NOMBRE_SELLO, buscarColor, buscarMotivo, buscarEncuadre,
} from '../catalogos/sello.js';
import { buscarPalabra } from '../catalogos/hangul.js';
import { prepararDibujo, avisosDeContraste } from './selloDibujo.js';
import { leerIds, pideTodos } from './borrarVarios.js';

function errorSello(codigo) {
  const e = new Error(codigo);
  e.codigo = codigo;
  return e;
}

const texto = (valor) => (typeof valor === 'string' ? valor : '');

function colorDe(valor) {
  const id = texto(valor);
  if (!buscarColor(id)) throw errorSello('OPCION_NO_VALIDA');
  return id;
}

// Los ids de sello son números positivos; cualquier otra cosa es un sello que no existe.
function leerId(valor) {
  const id = texto(valor);
  if (!/^[1-9]\d{0,17}$/.test(id)) throw errorSello('NO_EXISTE');
  return id;
}

// Lee la receta del formulario. «avatares»: los avatares guardados de la cuenta ({ id, composicion }).
// «anterior»: la receta que tenía el sello, para conservar la copia de su avatar.
// Solo se leen los campos conocidos: cualquier otro (texto libre incluido) se ignora.
export function leerReceta(cuerpo = {}, { avatares = [], anterior = null } = {}) {
  const idPalabra = texto(cuerpo.palabra);
  let palabra = null;
  if (idPalabra) {
    if (!buscarPalabra(idPalabra)) throw errorSello('OPCION_NO_VALIDA');
    palabra = { id: idPalabra, color: colorDe(cuerpo.color_palabra) };
  }

  const idAvatar = texto(cuerpo.avatar);
  let avatar = null;
  if (idAvatar) {
    const encuadre = texto(cuerpo.encuadre);
    if (!buscarEncuadre(encuadre)) throw errorSello('OPCION_NO_VALIDA');
    if (idAvatar === 'actual') {
      if (!anterior?.avatar?.copia) throw errorSello('OPCION_NO_VALIDA');
      avatar = { origen: anterior.avatar.origen, encuadre, copia: structuredClone(anterior.avatar.copia) };
    } else {
      const elegido = avatares.find((a) => String(a.id) === idAvatar);
      if (!elegido) throw errorSello('OPCION_NO_VALIDA');
      avatar = { origen: String(elegido.id), encuadre, copia: structuredClone(elegido.composicion) };
    }
  }

  const borde = colorDe(cuerpo.borde);
  const fondo = colorDe(cuerpo.fondo);
  const alias = { visible: cuerpo.mostrar_alias === 'si', color: colorDe(cuerpo.color_alias) };
  const motivos = [];
  for (let i = 1; i <= MAX_MOTIVOS; i++) {
    const id = texto(cuerpo[`motivo${i}`]);
    if (!id) continue;
    if (!buscarMotivo(id)) throw errorSello('OPCION_NO_VALIDA');
    motivos.push({ id, color: colorDe(cuerpo[`color_motivo${i}`]) });
  }

  if (!palabra && !avatar) throw errorSello('SELLO_VACIO');
  return { borde, fondo, palabra, avatar, alias, motivos, distribucion: 'automatica' };
}

// El nombre con el que el fan encuentra el sello en «Mis sellos». No se dibuja en el sello.
export function leerNombre(cuerpo = {}) {
  const nombre = texto(cuerpo.nombre).trim();
  const largo = [...nombre].length;
  if (largo < LARGO_NOMBRE_SELLO.min || largo > LARGO_NOMBRE_SELLO.max) throw errorSello('NOMBRE_NO_VALIDO');
  return nombre;
}

// Avatares guardados de la cuenta de la sesión ([{ id, nombre, composicion }]), para elegir uno en
// el sello. Solo los suyos: el modelo filtra por idUsuario. Nunca se usa un avatar de muestra.
export async function avataresGuardados(idUsuario) {
  return Avatar.listar(idUsuario);
}

// Datos para dibujar un sello. Si lleva avatar, se dibuja su COPIA (no el avatar guardado, que puede
// haber cambiado o no existir ya) con el dibujador de Avatar Studio y el encuadre elegido.
export function dibujar(composicion, alias) {
  const avatar = composicion.avatar;
  const avatarSvg = avatar ? dibujarAvatar(avatar.copia, { encuadre: avatar.encuadre }) : null;
  return prepararDibujo(composicion, { alias, avatarSvg });
}

export { avisosDeContraste };

export async function verSellos({ idUsuario, alias }) {
  const sellos = await Sello.listar(idUsuario);
  return sellos.map((s) => ({ ...s, dibujo: dibujar(s.composicion, alias) }));
}

export async function abrir({ idUsuario, idSello }) {
  const sello = await Sello.buscar({ idUsuario, idSello: leerId(idSello) });
  if (!sello) throw errorSello('NO_EXISTE');
  return sello;
}

export async function crear({ idUsuario, cuerpo }) {
  const nombre = leerNombre(cuerpo);
  const composicion = leerReceta(cuerpo, { avatares: await avataresGuardados(idUsuario) });
  const id = await Sello.crearSiCabe({ idUsuario, nombre, composicion, maximo: MAX_SELLOS });
  if (!id) throw errorSello('LIMITE');
  return id;
}

export async function guardar({ idUsuario, idSello, cuerpo }) {
  const anterior = await abrir({ idUsuario, idSello });
  const nombre = leerNombre(cuerpo);
  const composicion = leerReceta(cuerpo, { avatares: await avataresGuardados(idUsuario), anterior: anterior.composicion });
  const version = Number(texto(cuerpo.version));
  if (!Number.isInteger(version) || version < 1) throw errorSello('VERSION');
  const nueva = await Sello.guardar({ idUsuario, idSello: anterior.id, version, nombre, composicion });
  if (nueva === null) throw errorSello('VERSION'); // alguien lo guardó antes desde otro sitio
  return nueva;
}

export async function duplicar({ idUsuario, idSello }) {
  const original = await abrir({ idUsuario, idSello });
  const nombre = [...`Copia de ${original.nombre}`].slice(0, LARGO_NOMBRE_SELLO.max).join('');
  const id = await Sello.crearSiCabe({ idUsuario, nombre, composicion: original.composicion, maximo: MAX_SELLOS });
  if (!id) throw errorSello('LIMITE');
  return id;
}

export async function eliminar({ idUsuario, idSello }) {
  if (!(await Sello.eliminar({ idUsuario, idSello: leerId(idSello) }))) throw errorSello('NO_EXISTE');
}

// Borrar varios o todos (D058). Primero, lo que se va a borrar, para confirmarlo: los elegidos o,
// con «todos», todos los de la cuenta. Solo salen los de esta cuenta.
export async function prepararBorrado({ idUsuario, cuerpo }) {
  if (pideTodos(cuerpo)) return (await Sello.listar(idUsuario)).map((f) => ({ id: String(f.id), nombre: f.nombre }));
  const ids = leerIds(cuerpo?.ids, MAX_SELLOS);
  return ids.length ? Sello.buscarVarios({ idUsuario, ids }) : [];
}

// Después de confirmar: borra los ids confirmados que son de esta cuenta y dice cuántos.
// NADA_QUE_BORRAR si no hay ninguno (tampoco si todos eran de otra cuenta).
export async function borrarVarios({ idUsuario, cuerpo }) {
  const ids = leerIds(cuerpo?.ids, MAX_SELLOS);
  const borrados = ids.length ? await Sello.eliminarVarios({ idUsuario, ids }) : 0;
  if (!borrados) throw errorSello('NADA_QUE_BORRAR');
  return borrados;
}

// Receta para la vista previa: la del formulario, o null si todavía no es válida.
export async function recetaParaVista({ idUsuario, cuerpo, idSello = null }) {
  const anterior = idSello ? (await Sello.buscar({ idUsuario, idSello }))?.composicion ?? null : null;
  return leerReceta(cuerpo, { avatares: await avataresGuardados(idUsuario), anterior });
}
