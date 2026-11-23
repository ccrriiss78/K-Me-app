// MODELO de usuario: solo habla con la base de datos. No sabe nada de HTTP ni de vistas.
// Todas las consultas usan parámetros ($1...) para que el valor nunca se mezcle con el SQL.
// Cada cuenta tiene un usuario (privado, para entrar) y un alias (público). D020.

import { consulta } from '../config/db.js';

// Formato del usuario y del alias: de 3 a 30 letras, números o guion bajo.
export const NOMBRE_REGEX = /^[A-Za-z0-9_]{3,30}$/;

export async function buscarPorUsuario(usuario) {
  const { rows } = await consulta(
    'SELECT id, usuario, alias, hash_password, creado_en FROM usuarios WHERE lower(usuario) = lower($1)',
    [usuario],
  );
  return rows[0] ?? null;
}

// No devuelve el usuario: lo que se muestra en las páginas es el alias.
export async function buscarPorId(id) {
  const { rows } = await consulta('SELECT id, alias, creado_en FROM usuarios WHERE id = $1', [id]);
  return rows[0] ?? null;
}

// Devuelve la cuenta creada. Si el usuario o el alias ya existen, lanza un error
// con codigo 'USUARIO_DUPLICADO' o 'ALIAS_DUPLICADO'.
export async function crear({ usuario, alias, hashPassword }) {
  try {
    const { rows } = await consulta(
      'INSERT INTO usuarios (usuario, alias, hash_password) VALUES ($1, $2, $3) RETURNING id, usuario, alias, creado_en',
      [usuario, alias, hashPassword],
    );
    return rows[0];
  } catch (err) {
    if (err.code === '23505') { // violación de un índice único en PostgreSQL; err.constraint dice cuál
      const e = err.constraint === 'usuarios_alias_unico'
        ? new Error(`El alias "${alias}" ya lo usa otra cuenta.`)
        : new Error(`El usuario "${usuario}" ya existe.`);
      e.codigo = err.constraint === 'usuarios_alias_unico' ? 'ALIAS_DUPLICADO' : 'USUARIO_DUPLICADO';
      throw e;
    }
    throw err;
  }
}
