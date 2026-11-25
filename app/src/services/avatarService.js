// SERVICIO de Avatar Studio (contrato v1 con ChatGPT, 23/11/2026; TECH_SPEC §3).
// - Un avatar se guarda en la cuenta como receta: el objeto del editor (claves de kme.json →
//   porDefecto), completado y VALIDADO aquí campo a campo. Nunca se guarda lo que llega tal cual.
// - Errores con «codigo» (el controlador decide el mensaje y el estado HTTP): OPCION_NO_VALIDA,
//   NOMBRE_NO_VALIDO, RECETA_DEMASIADO_GRANDE, LIMITE, VERSION (con la versión del servidor) y NO_EXISTE.
//
// Validación de cada campo:
// - piezas (rostro, ojos.estilo, ropa.arriba…): el id tiene que existir en el catálogo, en ese campo;
// - colores: hexadecimal #rrggbb y uno de los colores del catálogo del editor (sus paletas y nombres);
// - version: un número entero;
// - el resto (grosorCejas, pelo.acabado, pelo.mechones, maquillaje.grosorLabios, fondo…): uno de
//   los valores de la lista exacta del editor, kme-receta.js (valoresPermitidos), la única fuente
//   de verdad acordada en el contrato (T037). Una opción sin lista no admite ningún valor.

import * as Avatar from '../models/avatarModel.js';
import { obtenerCatalogo, normalizarReceta } from './avatarCatalogo.js';
import { valoresPermitidos, accesoriosExtraValidos } from '../../../editor-avatar/editor-avatar/js/kme-receta.js';
import { leerIds, pideTodos } from './borrarVarios.js';
import { comprobarPropiedad } from './canjeService.js';

export const MAX_AVATARES = 20; // Q1
export const MAX_BYTES_RECETA = 8192;
const LARGO_NOMBRE = { min: 1, max: 40 };
const HEX = /^#[0-9a-f]{6}$/i;

function errorAvatar(codigo, extra = {}) {
  const e = new Error(codigo);
  e.codigo = codigo;
  Object.assign(e, extra);
  return e;
}

// Las reglas de cada campo se construyen una vez, a partir del catálogo.
let reglas = null;
function reglasDeCampos() {
  if (reglas) return reglas;
  const catalogo = obtenerCatalogo();
  const { datos } = catalogo;
  const listas = valoresPermitidos(catalogo);
  const colores = new Set();
  JSON.stringify(datos, (clave, valor) => {
    if (typeof valor === 'string' && HEX.test(valor)) colores.add(valor.toLowerCase());
    if (HEX.test(clave)) colores.add(clave.toLowerCase());
    return valor;
  });
  reglas = [];
  const recorrer = (objeto, prefijo) => {
    for (const [clave, porDefecto] of Object.entries(objeto)) {
      const ruta = prefijo ? `${prefijo}.${clave}` : clave;
      // Varios accesorios a la vez (D071): la lista se valida entera, con la regla del editor.
      if (ruta === 'accesoriosExtra') {
        reglas.push({ ruta, valido: (v, receta) => accesoriosExtraValidos(catalogo, receta) });
        continue;
      }
      if (Array.isArray(porDefecto)) { reglas.push({ ruta, valido: () => false }); continue; }
      if (porDefecto && typeof porDefecto === 'object') { recorrer(porDefecto, ruta); continue; }
      let valido;
      if (datos.piezas[ruta]) {
        const ids = new Set(datos.piezas[ruta].map((p) => p.id));
        valido = (v) => typeof v === 'string' && ids.has(v);
      } else if (typeof porDefecto === 'string' && HEX.test(porDefecto)) {
        valido = (v) => typeof v === 'string' && HEX.test(v) && colores.has(v.toLowerCase());
      } else if (ruta === 'version') {
        valido = (v) => Number.isInteger(v) && v >= 1 && v <= 1000;
      } else {
        const permitidos = listas[ruta] ?? [];
        valido = (v) => permitidos.includes(v);
      }
      reglas.push({ ruta, valido });
    }
  };
  recorrer(datos.porDefecto, '');
  return reglas;
}

const valorEn = (objeto, ruta) => ruta.split('.').reduce((o, p) => (o == null ? undefined : o[p]), objeto);

export function leerReceta(receta) {
  if (!receta || typeof receta !== 'object' || Array.isArray(receta)) throw errorAvatar('OPCION_NO_VALIDA');
  if (Buffer.byteLength(JSON.stringify(receta), 'utf8') > MAX_BYTES_RECETA) throw errorAvatar('RECETA_DEMASIADO_GRANDE');
  const normal = normalizarReceta(receta);
  for (const { ruta, valido } of reglasDeCampos()) {
    if (!valido(valorEn(normal, ruta), normal)) throw errorAvatar('OPCION_NO_VALIDA', { campo: ruta });
  }
  return normal;
}

export function leerNombreAvatar(nombre) {
  const limpio = typeof nombre === 'string' ? nombre.trim() : '';
  const largo = [...limpio].length;
  if (largo < LARGO_NOMBRE.min || largo > LARGO_NOMBRE.max) throw errorAvatar('NOMBRE_NO_VALIDO');
  return limpio;
}

// Los ids son números positivos; cualquier otra cosa es un avatar que no existe.
function leerId(valor) {
  const id = typeof valor === 'string' ? valor : '';
  if (!/^[1-9]\d{0,17}$/.test(id)) throw errorAvatar('NO_EXISTE');
  return id;
}

const resumen = (fila) => ({ id: String(fila.id), nombre: fila.nombre, version: fila.version });

export async function verAvatares(idUsuario) {
  return Avatar.listar(idUsuario);
}

export async function abrir({ idUsuario, idAvatar }) {
  const fila = await Avatar.buscar({ idUsuario, idAvatar: leerId(idAvatar) });
  if (!fila) throw errorAvatar('NO_EXISTE');
  return fila;
}

export async function crear({ idUsuario, nombre, receta }) {
  const limpio = leerNombreAvatar(nombre);
  const composicion = leerReceta(receta);
  await comprobarPropiedad(idUsuario, composicion); // una pieza de canje, solo si es tuya (E0083)
  const id = await Avatar.crearSiCabe({ idUsuario, nombre: limpio, composicion, maximo: MAX_AVATARES });
  if (!id) throw errorAvatar('LIMITE');
  return { id: String(id), nombre: limpio, version: 1 };
}

// Guarda solo si la versión es la que se abrió. Si no, VERSION con la versión del servidor: nada se
// sobrescribe y el editor conserva los cambios del usuario.
export async function guardar({ idUsuario, idAvatar, nombre, receta, version }) {
  const actual = await abrir({ idUsuario, idAvatar });
  const limpio = leerNombreAvatar(nombre);
  const composicion = leerReceta(receta);
  await comprobarPropiedad(idUsuario, composicion); // una pieza de canje, solo si es tuya (E0083)
  if (!Number.isInteger(version) || version < 1) throw errorAvatar('VERSION', { version: actual.version });
  const nueva = await Avatar.guardar({ idUsuario, idAvatar: actual.id, version, nombre: limpio, composicion });
  if (nueva === null) {
    const ahora = await Avatar.buscar({ idUsuario, idAvatar: actual.id });
    if (!ahora) throw errorAvatar('NO_EXISTE');
    throw errorAvatar('VERSION', { version: ahora.version });
  }
  return { id: String(actual.id), nombre: limpio, version: nueva };
}

export async function duplicar({ idUsuario, idAvatar }) {
  const original = await abrir({ idUsuario, idAvatar });
  const nombre = [...`Copia de ${original.nombre}`].slice(0, LARGO_NOMBRE.max).join('');
  const id = await Avatar.crearSiCabe({ idUsuario, nombre, composicion: original.composicion, maximo: MAX_AVATARES });
  if (!id) throw errorAvatar('LIMITE');
  return { id: String(id), nombre, version: 1 };
}

export async function eliminar({ idUsuario, idAvatar }) {
  if (!(await Avatar.eliminar({ idUsuario, idAvatar: leerId(idAvatar) }))) throw errorAvatar('NO_EXISTE');
}

// Borrar varios o todos (D058). Primero, lo que se va a borrar, para confirmarlo: los elegidos o,
// con «todos», todos los de la cuenta. Solo salen los de esta cuenta.
export async function prepararBorrado({ idUsuario, cuerpo }) {
  if (pideTodos(cuerpo)) return (await Avatar.listar(idUsuario)).map((f) => ({ id: String(f.id), nombre: f.nombre }));
  const ids = leerIds(cuerpo?.ids, MAX_AVATARES);
  return ids.length ? Avatar.buscarVarios({ idUsuario, ids }) : [];
}

// Después de confirmar: borra los ids confirmados que son de esta cuenta y dice cuántos.
// NADA_QUE_BORRAR si no hay ninguno (tampoco si todos eran de otra cuenta).
export async function borrarVarios({ idUsuario, cuerpo }) {
  const ids = leerIds(cuerpo?.ids, MAX_AVATARES);
  const borrados = ids.length ? await Avatar.eliminarVarios({ idUsuario, ids }) : 0;
  if (!borrados) throw errorAvatar('NADA_QUE_BORRAR');
  return borrados;
}

export { resumen };
