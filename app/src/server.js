// Punto de entrada: arranca el servidor web. Ejecutar desde app/:  npm run dev

import { crearApp } from './app.js';

try {
  const { app, config } = crearApp();
  app.listen(config.puerto, () => {
    console.log(`K-ME escuchando en http://localhost:${config.puerto}  (entorno: ${config.nodeEnv})`);
  });
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
