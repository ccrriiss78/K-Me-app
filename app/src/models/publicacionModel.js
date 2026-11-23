// MODELO de Connect: publicaciones del muro y sus reacciones (D038). Solo habla con la base de datos.
// Todas las consultas usan parámetros ($1...). Quién publica, reacciona o borra llega siempre de la
// sesión (idUsuario), nunca del formulario.

import { consulta } from '../config/db.js';

export async function crearPublicacion({ idUsuario, emocion, diseno = null }) {
  const { rows } = await consulta(
    'INSERT INTO publicaciones (id_usuario, emocion, diseno) VALUES ($1, $2, $3) RETURNING id, creado_en',
    [idUsuario, emocion, diseno],
  );
  return rows[0];
}

// Las últimas publicaciones del muro, de todos los fans. Para cada una: el alias de quien publica
// (nunca su usuario, D020), si es de quien mira, el total de cada tipo de reacción y las que ha
// dado quien mira.
export async function listarMuro({ idUsuario, limite = 50 }) {
  const { rows } = await consulta(
    `SELECT p.id, p.emocion, p.diseno, p.creado_en, u.alias,
            (p.id_usuario = $1) AS es_mia,
            COALESCE((SELECT json_object_agg(t.tipo, t.n)
                        FROM (SELECT tipo, count(*)::int AS n FROM reacciones r
                               WHERE r.id_publicacion = p.id GROUP BY tipo) t), '{}'::json) AS totales,
            COALESCE((SELECT json_object_agg(t.tipo, t.n)
                        FROM (SELECT tipo, count(*)::int AS n FROM reacciones r
                               WHERE r.id_publicacion = p.id AND r.id_usuario = $1 GROUP BY tipo) t), '{}'::json) AS mias
       FROM publicaciones p
       JOIN usuarios u ON u.id = p.id_usuario
      ORDER BY p.creado_en DESC, p.id DESC
      LIMIT $2`,
    [idUsuario, limite],
  );
  return rows;
}

// Las reacciones de una publicación: el total de cada tipo y las que ha dado quien mira.
export async function reaccionesDe({ idPublicacion, idUsuario }) {
  const { rows } = await consulta(
    `SELECT COALESCE(json_object_agg(tipo, total) FILTER (WHERE total > 0), '{}'::json) AS totales,
            COALESCE(json_object_agg(tipo, mias) FILTER (WHERE mias > 0), '{}'::json) AS mias
       FROM (SELECT tipo, count(*)::int AS total, count(*) FILTER (WHERE id_usuario = $2)::int AS mias
               FROM reacciones WHERE id_publicacion = $1 GROUP BY tipo) t`,
    [idPublicacion, idUsuario],
  );
  return rows[0];
}

export async function existePublicacion(id) {
  const { rowCount } = await consulta('SELECT 1 FROM publicaciones WHERE id = $1', [id]);
  return rowCount === 1;
}

// Suma una reacción si quien reacciona no ha llegado al tope de ese tipo en esa publicación.
// Devuelve 'sumada', 'tope', o null si la publicación no existe.
// (Dos pulsaciones exactamente a la vez podrían pasar el tope en una; para el muro no importa.)
export async function sumarReaccion({ idPublicacion, idUsuario, tipo, maximo }) {
  const { rows } = await consulta(
    `WITH pub AS (SELECT id FROM publicaciones WHERE id = $1),
          dadas AS (SELECT count(*)::int AS n FROM reacciones
                     WHERE id_publicacion = $1 AND id_usuario = $2 AND tipo = $3),
          nueva AS (INSERT INTO reacciones (id_publicacion, id_usuario, tipo)
                    SELECT pub.id, $2, $3 FROM pub, dadas WHERE dadas.n < $4
                    RETURNING id)
     SELECT (SELECT count(*) FROM pub)::int AS existe, (SELECT count(*) FROM nueva)::int AS sumada`,
    [idPublicacion, idUsuario, tipo, maximo],
  );
  const { existe, sumada } = rows[0];
  if (!existe) return null;
  return sumada ? 'sumada' : 'tope';
}

// Quita reacciones de quien lo pide, nunca las de otra cuenta: la última que dio en esa
// publicación, o todas las suyas. Devuelve cuántas ha quitado, o null si la publicación no existe.
export async function quitarReacciones({ idPublicacion, idUsuario, todas }) {
  if (!(await existePublicacion(idPublicacion))) return null;
  const sql = todas
    ? 'DELETE FROM reacciones WHERE id_publicacion = $1 AND id_usuario = $2'
    : `DELETE FROM reacciones WHERE id = (
         SELECT id FROM reacciones WHERE id_publicacion = $1 AND id_usuario = $2
          ORDER BY creado_en DESC, id DESC LIMIT 1)`;
  const { rowCount } = await consulta(sql, [idPublicacion, idUsuario]);
  return rowCount;
}

// Borra la publicación solo si es de quien lo pide (sus reacciones se borran con ella).
// Devuelve true si la ha borrado; false si no existe o es de otra cuenta.
export async function eliminarPublicacion({ id, idUsuario }) {
  const { rowCount } = await consulta('DELETE FROM publicaciones WHERE id = $1 AND id_usuario = $2', [id, idUsuario]);
  return rowCount === 1;
}
