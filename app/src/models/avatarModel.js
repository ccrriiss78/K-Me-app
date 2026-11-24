// MODELO de Avatar Studio: solo habla con la base de datos. Todas las consultas usan parámetros
// ($1...) y filtran por la cuenta de la sesión (idUsuario), nunca por un id que llegue del navegador:
// un avatar de otra cuenta «no existe».

import { consulta, obtenerPool } from '../config/db.js';

export async function listar(idUsuario) {
  const { rows } = await consulta(
    `SELECT id, nombre, composicion, version, actualizado_en
       FROM avatares WHERE id_usuario = $1
      ORDER BY actualizado_en DESC, id DESC`,
    [idUsuario],
  );
  return rows;
}

export async function buscar({ idUsuario, idAvatar }) {
  const { rows } = await consulta(
    'SELECT id, nombre, composicion, version FROM avatares WHERE id = $1 AND id_usuario = $2',
    [idAvatar, idUsuario],
  );
  return rows[0] ?? null;
}

// Crea un avatar si la cuenta no ha llegado al máximo. Devuelve su id, o null si ya está en el
// máximo. La cuenta se bloquea (FOR UPDATE) mientras se cuenta e inserta: dos pestañas a la vez
// no pueden pasarse del límite.
export async function crearSiCabe({ idUsuario, nombre, composicion, maximo }) {
  const cliente = await obtenerPool().connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query('SELECT id FROM usuarios WHERE id = $1 FOR UPDATE', [idUsuario]);
    const { rows: [{ total }] } = await cliente.query('SELECT count(*)::int AS total FROM avatares WHERE id_usuario = $1', [idUsuario]);
    if (total >= maximo) {
      await cliente.query('ROLLBACK');
      return null;
    }
    const { rows } = await cliente.query(
      'INSERT INTO avatares (id_usuario, nombre, composicion) VALUES ($1, $2, $3) RETURNING id',
      [idUsuario, nombre, composicion],
    );
    await cliente.query('COMMIT');
    return rows[0].id;
  } catch (err) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    cliente.release();
  }
}

// Guarda solo si la versión es la que se abrió. Devuelve la versión nueva, o null si no se ha
// guardado (no es de la cuenta o alguien lo guardó antes desde otro sitio).
export async function guardar({ idUsuario, idAvatar, version, nombre, composicion }) {
  const { rows } = await consulta(
    `UPDATE avatares SET nombre = $4, composicion = $5, version = version + 1, actualizado_en = now()
      WHERE id = $1 AND id_usuario = $2 AND version = $3
      RETURNING version`,
    [idAvatar, idUsuario, version, nombre, composicion],
  );
  return rows[0]?.version ?? null;
}

export async function eliminar({ idUsuario, idAvatar }) {
  const { rowCount } = await consulta('DELETE FROM avatares WHERE id = $1 AND id_usuario = $2', [idAvatar, idUsuario]);
  return rowCount > 0;
}
