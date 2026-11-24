// MODELO de la imagen de perfil (D044, D055): solo habla con la base de datos.
// Todas las consultas usan parámetros ($1...) y filtran por la cuenta de la sesión (idUsuario).
// Al elegir, la misma consulta comprueba que el avatar o el sello son de esa cuenta: uno ajeno
// «no existe» y no se guarda nada.

import { consulta } from '../config/db.js';

// El avatar y el sello del perfil, con su receta, o null si no hay. Los JOIN vuelven a comprobar
// que son de la cuenta.
export async function leer(idUsuario) {
  const { rows } = await consulta(
    `SELECT a.id AS avatar_id, a.nombre AS avatar_nombre, a.composicion AS avatar_composicion,
            s.id AS sello_id, s.nombre AS sello_nombre, s.composicion AS sello_composicion
       FROM usuarios u
       LEFT JOIN avatares a ON a.id = u.id_avatar_perfil AND a.id_usuario = u.id
       LEFT JOIN sellos s ON s.id = u.id_sello_perfil AND s.id_usuario = u.id
      WHERE u.id = $1`,
    [idUsuario],
  );
  const f = rows[0];
  return {
    avatar: f?.avatar_id ? { id: String(f.avatar_id), nombre: f.avatar_nombre, composicion: f.avatar_composicion } : null,
    sello: f?.sello_id ? { id: String(f.sello_id), nombre: f.sello_nombre, composicion: f.sello_composicion } : null,
  };
}

// Pone en el perfil un avatar de la cuenta. Devuelve false si no existe en esta cuenta.
export async function elegirAvatar({ idUsuario, idAvatar }) {
  const { rowCount } = await consulta(
    `UPDATE usuarios u SET id_avatar_perfil = a.id
       FROM avatares a
      WHERE u.id = $1 AND a.id = $2 AND a.id_usuario = $1`,
    [idUsuario, idAvatar],
  );
  return rowCount > 0;
}

// Pone en el perfil un sello de la cuenta. Devuelve false si no existe en esta cuenta.
export async function elegirSello({ idUsuario, idSello }) {
  const { rowCount } = await consulta(
    `UPDATE usuarios u SET id_sello_perfil = s.id
       FROM sellos s
      WHERE u.id = $1 AND s.id = $2 AND s.id_usuario = $1`,
    [idUsuario, idSello],
  );
  return rowCount > 0;
}

export async function quitarAvatar(idUsuario) {
  await consulta('UPDATE usuarios SET id_avatar_perfil = NULL WHERE id = $1', [idUsuario]);
}

export async function quitarSello(idUsuario) {
  await consulta('UPDATE usuarios SET id_sello_perfil = NULL WHERE id = $1', [idUsuario]);
}
