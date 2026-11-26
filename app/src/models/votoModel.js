// MODELO de «K-ME · TÚ DECIDES» (D080): solo acceso a datos. Cada consulta usa el id de la sesión,
// que le pasa el servicio; nunca un id que llegue del formulario.
import { consulta } from '../config/db.js';

// Guarda el voto de la cuenta, o lo sustituye si ya tenía uno (un voto por cuenta: clave primaria).
// Es una sola operación: dos votos a la vez de la misma cuenta dejan uno, el último.
export async function votar(idUsuario, propuesta) {
  await consulta(
    `INSERT INTO votos_tu_decides (id_usuario, propuesta) VALUES ($1, $2)
     ON CONFLICT (id_usuario) DO UPDATE SET propuesta = EXCLUDED.propuesta, votado_en = now()`,
    [idUsuario, propuesta],
  );
}

// El voto de la cuenta, o null.
export async function miVoto(idUsuario) {
  const { rows } = await consulta('SELECT propuesta FROM votos_tu_decides WHERE id_usuario = $1', [idUsuario]);
  return rows[0]?.propuesta ?? null;
}

// Cuántos votos tiene cada propuesta ({ id: votos }). Sin nombres ni cuentas: solo los totales.
export async function recuento() {
  const { rows } = await consulta('SELECT propuesta, COUNT(*)::int AS votos FROM votos_tu_decides GROUP BY propuesta');
  return Object.fromEntries(rows.map((f) => [f.propuesta, f.votos]));
}
