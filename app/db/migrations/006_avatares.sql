-- Avatar Studio (TECH_SPEC §3; contrato v1 con ChatGPT, 23/11/2026): los avatares de cada cuenta.
-- Tabla nueva: no cambia ningún dato existente.
--
-- Un avatar se guarda como receta («composicion», JSONB): el objeto del editor de avatar (claves de
-- editor-avatar/editor-avatar/datos/kme.json → porDefecto), completado y validado en el servidor
-- (services/avatarService.js) con el catálogo del editor. Nunca se guarda un dibujo que llegue del
-- navegador: la imagen se dibuja al mostrarla.
-- «version» sube en cada guardado: lo guardado en otro dispositivo no se sobrescribe en silencio.
-- La imagen de perfil (D044) irá en una migración aparte.

CREATE TABLE IF NOT EXISTS avatares (
  id             BIGSERIAL   PRIMARY KEY,
  id_usuario     BIGINT      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre         VARCHAR(40) NOT NULL,
  composicion    JSONB       NOT NULL,
  version        INTEGER     NOT NULL DEFAULT 1,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS avatares_usuario ON avatares (id_usuario, actualizado_en DESC);
