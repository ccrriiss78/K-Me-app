-- Connect mínimo (TECH_SPEC §5.1, D038): el muro de los fans.
-- Una publicación es una emoción de la lista cerrada (src/catalogos/connect.js), sin texto libre,
-- y la copia del diseño que la acompaña (Q7, Q11). Mientras Avatar Studio no guarde diseños,
-- «diseno» queda vacío y el muro muestra la inicial del alias.
-- Las emociones y reacciones se guardan por su id; el servidor comprueba que existen en el catálogo,
-- así se pueden cambiar las listas sin tocar la base de datos.

CREATE TABLE IF NOT EXISTS publicaciones (
  id          BIGSERIAL PRIMARY KEY,
  id_usuario  BIGINT      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  emocion     VARCHAR(30) NOT NULL,
  diseno      JSONB,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS publicaciones_creado ON publicaciones (creado_en DESC, id DESC);
CREATE INDEX IF NOT EXISTS publicaciones_usuario ON publicaciones (id_usuario);

-- Cada fila es una pulsación: una persona puede dar varias reacciones del mismo tipo, hasta el
-- tope del catálogo (MAX_REACCIONES_POR_TIPO), y quitarlas después («la última» o «todas»).
CREATE TABLE IF NOT EXISTS reacciones (
  id             BIGSERIAL   PRIMARY KEY,
  id_publicacion BIGINT      NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  id_usuario     BIGINT      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo           VARCHAR(30) NOT NULL,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reacciones_publicacion ON reacciones (id_publicacion, id_usuario, tipo);
CREATE INDEX IF NOT EXISTS reacciones_usuario ON reacciones (id_usuario);
