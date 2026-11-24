// MODELO de las recompensas (D063, D064): el saldo y los movimientos de Kpopis y los tesoros ganados.
// Solo lectura: lo que se gana lo apunta retoModel.apuntarAcierto, dentro de su transacción.
// Todas las consultas filtran por la cuenta de la sesión (idUsuario).

import { consulta } from '../config/db.js';

// El saldo es la suma de los movimientos (0 si no hay ninguno).
export async function saldo(idUsuario) {
  const { rows } = await consulta(
    'SELECT COALESCE(SUM(cantidad), 0)::int AS saldo FROM kpopis_movimientos WHERE id_usuario = $1',
    [idUsuario],
  );
  return rows[0].saldo;
}

// Los últimos movimientos, del más nuevo al más antiguo.
export async function movimientos(idUsuario, limite = 50) {
  const { rows } = await consulta(
    `SELECT cantidad, clave, creado_en FROM kpopis_movimientos
      WHERE id_usuario = $1
      ORDER BY creado_en DESC, id DESC
      LIMIT $2`,
    [idUsuario, limite],
  );
  return rows;
}

// Los tesoros ganados, del más nuevo al más antiguo.
export async function tesoros(idUsuario) {
  const { rows } = await consulta(
    `SELECT id_tesoro, origen, ganado_en FROM tesoros_usuario
      WHERE id_usuario = $1
      ORDER BY ganado_en DESC, id_tesoro`,
    [idUsuario],
  );
  return rows;
}
