-- Sello Studio (TECH_SPEC §4, D041): los sellos personales de cada cuenta.
-- Tabla nueva: no cambia ningún dato existente.
--
-- Un sello se guarda como receta («composicion», JSONB) con ids de los catálogos
-- (src/catalogos/sello.js y hangul.js): colores, palabra, adornos, encuadre del avatar, si se ve el
-- alias y la distribución. El servidor la valida antes de guardarla (services/selloService.js);
-- nunca se guarda un dibujo enviado por el navegador. Si lleva avatar, la receta guarda una COPIA
-- de la receta del avatar: editar o borrar después el avatar original no cambia el sello.
-- «nombre» es el nombre con el que el fan lo encuentra en «Mis sellos»; no se dibuja en el sello.
-- «version» sube en cada guardado: lo guardado en otro dispositivo no se sobrescribe en silencio.

CREATE TABLE IF NOT EXISTS sellos (
  id             BIGSERIAL   PRIMARY KEY,
  id_usuario     BIGINT      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre         VARCHAR(40) NOT NULL,
  composicion    JSONB       NOT NULL,
  version        INTEGER     NOT NULL DEFAULT 1,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sellos_usuario ON sellos (id_usuario, actualizado_en DESC);
