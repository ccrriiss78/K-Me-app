// Aplica las migraciones SQL de db/migrations en orden, una sola vez cada una.
// Lleva el control en la tabla schema_migrations. Nunca borra datos existentes.
// Ejecutar desde app/:  npm run migrate

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { obtenerPool, cerrarPool } from '../src/config/db.js';

const dirMigraciones = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations');

async function main() {
  const pool = obtenerPool();
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    nombre TEXT PRIMARY KEY,
    aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);

  const aplicadas = new Set((await pool.query('SELECT nombre FROM schema_migrations')).rows.map((r) => r.nombre));
  const archivos = (await readdir(dirMigraciones)).filter((f) => f.endsWith('.sql')).sort();

  let nuevas = 0;
  for (const archivo of archivos) {
    if (aplicadas.has(archivo)) {
      console.log(`  ya aplicada  ${archivo}`);
      continue;
    }
    const sql = await readFile(path.join(dirMigraciones, archivo), 'utf8');
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      await cliente.query(sql);
      await cliente.query('INSERT INTO schema_migrations (nombre) VALUES ($1)', [archivo]);
      await cliente.query('COMMIT');
      console.log(`  aplicada     ${archivo}`);
      nuevas++;
    } catch (err) {
      await cliente.query('ROLLBACK');
      throw new Error(`Error en ${archivo}: ${err.message}`);
    } finally {
      cliente.release();
    }
  }
  console.log(nuevas === 0 ? 'Base de datos al día: no había migraciones nuevas.' : `Migraciones nuevas aplicadas: ${nuevas}.`);
}

main()
  .catch((err) => { console.error('Migración fallida:', err.message); process.exitCode = 1; })
  .finally(cerrarPool);
