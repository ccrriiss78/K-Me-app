// MODELO de los retos de «Mi escenario» (D062) y de su recompensa (D063, D064): solo habla con la
// base de datos. Todas las consultas usan parámetros ($1...) y filtran por la cuenta de la sesión
// (idUsuario), nunca por un id que llegue del navegador.

import { consulta, obtenerPool } from '../config/db.js';

// El progreso de la cuenta en un reto: las preguntas acertadas en la ronda actual y la primera vez
// que lo completó (o null).
export async function leerProgreso({ idUsuario, idReto }) {
  const { rows } = await consulta(
    'SELECT aciertos, completado_en FROM retos_progreso WHERE id_usuario = $1 AND id_reto = $2',
    [idUsuario, idReto],
  );
  return rows[0] ?? { aciertos: [], completado_en: null };
}

// Apunta una pregunta acertada en la ronda actual (si ya estaba, no cuenta doble). Si con ella la
// ronda tiene todas las preguntas, la cierra (la vacía, para poder repetir el reto) y entrega la
// recompensa, todo en una transacción:
// - La fila del progreso queda bloqueada hasta el final: dos respuestas a la vez se apuntan una
//   detrás de otra, y solo una de ellas cierra la ronda.
// - La recompensa solo se entrega la primera vez: las claves únicas de kpopis_movimientos y de
//   tesoros_usuario lo garantizan (ON CONFLICT DO NOTHING).
// Devuelve { aciertos, completado } y, si se ha completado, { primeraVez, ganadoEn }.
export async function apuntarAcierto({ idUsuario, idReto, numero, totalPreguntas, recompensa }) {
  const cliente = await obtenerPool().connect();
  try {
    await cliente.query('BEGIN');
    const { rows: [fila] } = await cliente.query(
      `INSERT INTO retos_progreso (id_usuario, id_reto, aciertos) VALUES ($1, $2, ARRAY[$3::smallint])
       ON CONFLICT (id_usuario, id_reto) DO UPDATE
         SET aciertos = CASE WHEN $3::smallint = ANY (retos_progreso.aciertos) THEN retos_progreso.aciertos
                             ELSE array_append(retos_progreso.aciertos, $3::smallint) END,
             actualizado_en = now()
       RETURNING aciertos`,
      [idUsuario, idReto, numero],
    );
    if (fila.aciertos.length < totalPreguntas) {
      await cliente.query('COMMIT');
      return { aciertos: fila.aciertos, completado: false };
    }
    const { rows: [cierre] } = await cliente.query(
      `UPDATE retos_progreso SET aciertos = '{}', completado_en = COALESCE(completado_en, now()), actualizado_en = now()
        WHERE id_usuario = $1 AND id_reto = $2
        RETURNING completado_en`,
      [idUsuario, idReto],
    );
    const { rowCount: pagado } = await cliente.query(
      `INSERT INTO kpopis_movimientos (id_usuario, cantidad, clave) VALUES ($1, $2, $3)
       ON CONFLICT (id_usuario, clave) DO NOTHING`,
      [idUsuario, recompensa.kpopis, `reto:${idReto}`],
    );
    await cliente.query(
      `INSERT INTO tesoros_usuario (id_usuario, id_tesoro, origen) VALUES ($1, $2, $3)
       ON CONFLICT (id_usuario, id_tesoro) DO NOTHING`,
      [idUsuario, recompensa.tesoro, idReto],
    );
    await cliente.query('COMMIT');
    return { aciertos: [], completado: true, primeraVez: pagado === 1, ganadoEn: cierre.completado_en };
  } catch (err) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    cliente.release();
  }
}
