// Comprueba la conexión a PostgreSQL con la configuración de .env.local.
// No muestra la contraseña. Ejecutar desde app/:  npm run comprobar-bd

import { cargarEnv } from '../src/config/env.js';
import { consulta, cerrarPool } from '../src/config/db.js';

try {
  const { bd } = cargarEnv();
  console.log(`Conectando a ${bd.user}@${bd.host}:${bd.port}/${bd.database} ...`);
  const { rows } = await consulta('SELECT current_user AS usuario, current_database() AS bd, version() AS version');
  console.log('Conexión correcta.');
  console.log(`  usuario: ${rows[0].usuario}   base de datos: ${rows[0].bd}`);
  console.log(`  servidor: ${rows[0].version.split(',')[0]}`);
  const tablas = await consulta(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1`);
  console.log(`  tablas: ${tablas.rows.map((r) => r.table_name).join(', ') || '(ninguna todavía; ejecuta npm run migrate)'}`);
} catch (err) {
  console.error('No se pudo conectar:', err.message);
  process.exitCode = 1;
} finally {
  await cerrarPool();
}
