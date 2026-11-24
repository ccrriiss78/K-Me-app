// SERVICIO de la imagen de perfil (D044, D055): reglas para elegirla y para dibujarla.
// - El fan pone en su perfil uno de sus avatares, uno de sus sellos o los dos; un valor vacío lo quita.
// - Es una referencia: se dibuja siempre la versión actual del avatar o del sello.
// - Cabecera: la cara del avatar; si solo hay sello, el sello. «Mi K-ME»: los dos.
// - Errores con «codigo» (el controlador decide el mensaje): AVATAR_NO_EXISTE y SELLO_NO_EXISTE.

import * as Perfil from '../models/perfilModel.js';
import { dibujarAvatar } from './avatarCatalogo.js';
import { dibujar as dibujarSello } from './selloService.js';

function errorPerfil(codigo) {
  const e = new Error(codigo);
  e.codigo = codigo;
  return e;
}

const texto = (valor) => (typeof valor === 'string' ? valor : '');
// Los ids son números positivos; cualquier otra cosa es algo que no existe.
const ID_VALIDO = /^[1-9]\d{0,17}$/;

// Tamaño por defecto de cada dibujo (alto en píxeles), con la proporción de su encuadre. El diseño
// (CSS) puede cambiarlo después sin tocar el servidor.
const ALTO_CABECERA = 40;
const ALTO_MI_KME = 200;
const ANCHO_SELLO_CABECERA = 28; // el sello tiene la proporción del logo: 28 de ancho, 40 de alto
const ANCHO_SELLO_MI_KME = 140;

const avatarConTamano = (composicion, encuadre, alto) => dibujarAvatar(composicion, { encuadre, alto });

export async function elegirAvatar({ idUsuario, valor }) {
  const id = texto(valor);
  if (id === '') return Perfil.quitarAvatar(idUsuario);
  if (!ID_VALIDO.test(id) || !(await Perfil.elegirAvatar({ idUsuario, idAvatar: id }))) throw errorPerfil('AVATAR_NO_EXISTE');
}

export async function elegirSello({ idUsuario, valor }) {
  const id = texto(valor);
  if (id === '') return Perfil.quitarSello(idUsuario);
  if (!ID_VALIDO.test(id) || !(await Perfil.elegirSello({ idUsuario, idSello: id }))) throw errorPerfil('SELLO_NO_EXISTE');
}

// El perfil de quien tiene la sesión, para todas las páginas: los ids elegidos (para marcar
// «En tu perfil» en las listas) y lo que se dibuja en la cabecera.
export async function perfilDeSesion({ idUsuario, alias }) {
  const perfil = await Perfil.leer(idUsuario);
  let cabecera = null;
  if (perfil.avatar) {
    cabecera = { tipo: 'avatar', svg: avatarConTamano(perfil.avatar.composicion, 'rostro', ALTO_CABECERA) };
  } else if (perfil.sello) {
    cabecera = { tipo: 'sello', dibujo: dibujarSello(perfil.sello.composicion, alias), ancho: ANCHO_SELLO_CABECERA };
  }
  return { ...perfil, idAvatar: perfil.avatar?.id ?? null, idSello: perfil.sello?.id ?? null, cabecera };
}

// Lo que enseña «Mi K-ME»: el avatar de cuerpo entero y el sello, los que haya.
export function imagenesMiKme(perfil, alias) {
  return {
    avatar: perfil?.avatar && {
      id: perfil.avatar.id,
      nombre: perfil.avatar.nombre,
      svg: avatarConTamano(perfil.avatar.composicion, 'cuerpo', ALTO_MI_KME),
    },
    sello: perfil?.sello && {
      id: perfil.sello.id,
      nombre: perfil.sello.nombre,
      dibujo: dibujarSello(perfil.sello.composicion, alias),
      ancho: ANCHO_SELLO_MI_KME,
    },
  };
}
