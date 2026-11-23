-- Tabla de sesiones de servidor, usada por connect-pg-simple.
-- Guarda el identificador de sesión, su contenido (JSON) y la fecha de caducidad.
-- Al cerrar sesión la fila se elimina; las caducadas se limpian periódicamente.

CREATE TABLE IF NOT EXISTS sesiones (
  sid    VARCHAR       NOT NULL COLLATE "default",
  sess   JSON          NOT NULL,
  expire TIMESTAMP(6)  NOT NULL,
  CONSTRAINT sesiones_pkey PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS sesiones_expire_idx ON sesiones (expire);
