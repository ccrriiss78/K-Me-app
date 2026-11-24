-- Connect con el diseño de cada fan y el mensaje con iconos (Q7, Q11; E0072).
-- «diseno» (ya existía, 004) recibe ahora la COPIA del avatar o del sello que acompaña a la
-- publicación: { "tipo": "avatar" | "sello", "origen": id del original, "copia": su receta }.
-- Si después se edita o se borra el original, la publicación no cambia.
-- «iconos»: el mensaje opcional, de 0 a 5 ids del catálogo (src/catalogos/connect.js,
-- ICONOS_MENSAJE), en el orden elegido. El servidor comprueba que existen; la base de datos, que no
-- pasan de 5.

ALTER TABLE publicaciones
  ADD COLUMN IF NOT EXISTS iconos TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE publicaciones DROP CONSTRAINT IF EXISTS publicaciones_iconos_max;
ALTER TABLE publicaciones
  ADD CONSTRAINT publicaciones_iconos_max CHECK (cardinality(iconos) <= 5);
