// Lee la configuración del entorno y comprueba que no falte nada indispensable.
// Los valores reales viven en app/.env.local (excluido de Git). Ver app/.env.example.

const obligatorias = ['PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'SESSION_SECRET'];

export function cargarEnv({ exigirTodo = true } = {}) {
  const faltan = obligatorias.filter((clave) => !process.env[clave] || process.env[clave].startsWith('CAMBIAR_POR'));
  if (exigirTodo && faltan.length > 0) {
    const msg = [
      'Falta configuración privada. Variables sin valor real: ' + faltan.join(', '),
      'Copia app/.env.example como app/.env.local y rellena esos valores.',
      'Los comandos se ejecutan desde la carpeta app/.',
    ].join('\n');
    throw new Error(msg);
  }
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    puerto: Number(process.env.PORT ?? 3000),
    sessionSecret: process.env.SESSION_SECRET,
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    bd: {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT ?? 5432),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
    },
  };
}
