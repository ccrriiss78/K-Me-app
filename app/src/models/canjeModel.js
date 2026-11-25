// MODELO del canje de Kpopis (E0083): las piezas especiales de cada cuenta y el canje.
// Todas las consultas filtran por la cuenta de la sesión (idUsuario).

import { consulta, obtenerPool } from '../config/db.js';

// Las familias de piezas especiales que tiene la cuenta.
export async function familias(idUsuario) {
  const { rows } = await consulta('SELECT id_familia FROM piezas_usuario WHERE id_usuario = $1', [idUsuario]);
  return new Set(rows.map((f) => f.id_familia));
}

// Canjea una pieza en una transacción. La fila de la cuenta queda bloqueada (FOR UPDATE): dos canjes
// a la vez se hacen uno detrás de otro, así el saldo nunca queda en negativo. La clave única del
// movimiento («canje:<familia>») y la de la pieza impiden cobrarla dos veces.
// Devuelve { resultado: 'ok' | 'ya' | 'saldo', falta? }.
export async function canjear({ idUsuario, familia, precio }) {
  const cliente = await obtenerPool().connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query('SELECT id FROM usuarios WHERE id = $1 FOR UPDATE', [idUsuario]);
    const { rowCount: yaEsTuya } = await cliente.query('SELECT 1 FROM piezas_usuario WHERE id_usuario = $1 AND id_familia = $2', [idUsuario, familia]);
    if (yaEsTuya) { await cliente.query('ROLLBACK'); return { resultado: 'ya' }; }
    const { rows: [{ saldo }] } = await cliente.query('SELECT COALESCE(SUM(cantidad), 0)::int AS saldo FROM kpopis_movimientos WHERE id_usuario = $1', [idUsuario]);
    if (saldo < precio) { await cliente.query('ROLLBACK'); return { resultado: 'saldo', falta: precio - saldo }; }
    await cliente.query('INSERT INTO kpopis_movimientos (id_usuario, cantidad, clave) VALUES ($1, $2, $3)', [idUsuario, -precio, `canje:${familia}`]);
    await cliente.query("INSERT INTO piezas_usuario (id_usuario, id_familia, origen) VALUES ($1, $2, 'canje')", [idUsuario, familia]);
    await cliente.query('COMMIT');
    return { resultado: 'ok' };
  } catch (err) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    cliente.release();
  }
}
