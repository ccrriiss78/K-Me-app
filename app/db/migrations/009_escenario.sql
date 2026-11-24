-- «Mi escenario»: HANGUL LIVE 001, los Kpopis y «Mis tesoros» (D062–D064, T042; 24/11/2026).
-- Tres tablas nuevas; no cambia ningún dato existente. Todo es de una cuenta: al borrarla, se borra
-- también lo suyo (ON DELETE CASCADE).
-- Los textos de los retos y de los tesoros viven en src/catalogos/: aquí solo se guardan sus ids.

-- Progreso de cada cuenta en cada reto.
-- - aciertos: los números de las preguntas acertadas en la ronda actual. Se puede repetir cada
--   pregunta hasta acertar (regla a, E0073). Al acertar todas, la ronda se cierra y se vacía, para
--   poder repetir la miniclase.
-- - completado_en: la primera vez que se completó (no cambia al repetir).
CREATE TABLE IF NOT EXISTS retos_progreso (
  id_usuario     BIGINT      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  id_reto        VARCHAR(40) NOT NULL,
  aciertos       SMALLINT[]  NOT NULL DEFAULT '{}',
  completado_en  TIMESTAMPTZ NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id_usuario, id_reto)
);

-- Movimientos de Kpopis: el saldo es su suma. De momento solo se ganan (cantidad positiva); el canje,
-- que restará, llegará con su propia migración.
-- «clave» dice de dónde viene el movimiento (por ejemplo, «reto:hangul-live-001») y es ÚNICA por
-- cuenta: la base de datos impide cobrar dos veces la misma recompensa, aunque lleguen dos
-- respuestas a la vez.
CREATE TABLE IF NOT EXISTS kpopis_movimientos (
  id         BIGSERIAL   PRIMARY KEY,
  id_usuario BIGINT      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cantidad   INTEGER     NOT NULL CHECK (cantidad > 0),
  clave      VARCHAR(80) NOT NULL,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT kpopis_movimientos_clave_unica UNIQUE (id_usuario, clave)
);

-- Tesoros ganados («Mis tesoros»). Cada tesoro, una vez por cuenta. «origen»: el reto que lo dio.
CREATE TABLE IF NOT EXISTS tesoros_usuario (
  id_usuario BIGINT      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  id_tesoro  VARCHAR(40) NOT NULL,
  origen     VARCHAR(40) NOT NULL,
  ganado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id_usuario, id_tesoro)
);
