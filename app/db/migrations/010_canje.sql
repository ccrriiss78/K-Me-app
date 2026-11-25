-- Canje de Kpopis en Colección «K» (E0083, 25/11/2026): la autora decide canjear piezas especiales
-- con Kpopis antes del 1/12, empezando por dos (Top Destello y Chaqueta Denim Collage, 20 Kpopis).
--
-- 1. Los movimientos pueden ser gastos (cantidad negativa). Sigue sin admitirse un 0. La clave
--    única por cuenta (canje:<familia>) impide cobrar dos veces la misma pieza.
ALTER TABLE kpopis_movimientos DROP CONSTRAINT IF EXISTS kpopis_movimientos_cantidad_check;
ALTER TABLE kpopis_movimientos DROP CONSTRAINT IF EXISTS kpopis_movimientos_cantidad_no_cero;
ALTER TABLE kpopis_movimientos ADD CONSTRAINT kpopis_movimientos_cantidad_no_cero CHECK (cantidad <> 0);

-- 2. Las piezas especiales que tiene cada cuenta. Se guarda la familia (una pieza con sus variantes
--    por cuerpo cuenta como una), una sola vez por cuenta. «origen»: de dónde viene ('canje').
CREATE TABLE IF NOT EXISTS piezas_usuario (
  id_usuario  BIGINT      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  id_familia  VARCHAR(60) NOT NULL,
  origen      VARCHAR(20) NOT NULL,
  obtenida_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id_usuario, id_familia)
);
