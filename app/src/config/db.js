// Conexión a PostgreSQL mediante un "pool" (conjunto de conexiones reutilizables).
// Todas las consultas pasan por aquí y usan parámetros ($1, $2...) para evitar inyección SQL.

import pg from 'pg';
import { cargarEnv } from './env.js';

const { Pool } = pg;
let pool;

export function obtenerPool() {
  if (!pool) {
    const { bd } = cargarEnv();
    pool = new Pool({ ...bd, max: 10, connectionTimeoutMillis: 5000 });
    pool.on('error', (err) => console.error('[bd] error en una conexión inactiva:', err.message));
  }
  return pool;
}

export function consulta(texto, parametros = []) {
  return obtenerPool().query(texto, parametros);
}

export async function cerrarPool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
