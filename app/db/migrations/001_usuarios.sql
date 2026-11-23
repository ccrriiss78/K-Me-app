-- Tabla de usuarios (cuentas ficticias en la fase 1).
-- Datos mínimos: identificador interno, alias único y hash de contraseña (Argon2id).
-- CREATE TABLE IF NOT EXISTS: no borra ni toca datos si la tabla ya existe.

CREATE TABLE IF NOT EXISTS usuarios (
  id            BIGSERIAL PRIMARY KEY,
  alias         VARCHAR(30) NOT NULL,
  hash_password TEXT        NOT NULL,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT usuarios_alias_formato CHECK (alias ~ '^[A-Za-z0-9_]{3,30}$')
);

-- El alias es único sin distinguir mayúsculas: "Luna" y "luna" son la misma cuenta.
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_alias_unico ON usuarios (lower(alias));
