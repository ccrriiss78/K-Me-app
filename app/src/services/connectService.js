// SERVICIO de Connect (D038): las reglas del muro. No sabe nada de HTTP ni de vistas.
// Si algo falla, lanza un error con codigo: EMOCION_NO_VALIDA, REACCION_NO_VALIDA,
// OPCION_NO_VALIDA o NO_EXISTE (publicación que no existe o que no es de quien la quiere borrar).

import * as Publicacion from '../models/publicacionModel.js';
import {
  REACCIONES, MAX_REACCIONES_POR_TIPO, EMOCION_RETIRADA, buscarEmocion, buscarReaccion,
} from '../catalogos/connect.js';

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

// El muro tal como lo ve quien tiene la sesión abierta, listo para la vista.
export async function verMuro({ idUsuario, ahora = new Date() }) {
  const filas = await Publicacion.listarMuro({ idUsuario });
  return filas.map((p) => {
    const { reacciones, totalMias } = construirReacciones(p.totales, p.mias);
    return {
      id: p.id,
      alias: p.alias,
      inicial: p.alias.charAt(0).toUpperCase(),
      esMia: p.es_mia,
      creadoEn: p.creado_en,
      hace: haceCuanto(p.creado_en, ahora),
      emocion: buscarEmocion(p.emocion) ?? EMOCION_RETIRADA,
      reacciones,
      totalMias,
    };
  });
}

export async function publicar({ idUsuario, emocion }) {
  if (typeof emocion !== 'string' || !buscarEmocion(emocion)) throw errorConCodigo('EMOCION_NO_VALIDA');
  // El diseño de la publicación (Q7, Q11) llegará con Avatar Studio; hasta entonces, sin diseño.
  return Publicacion.crearPublicacion({ idUsuario, emocion });
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
