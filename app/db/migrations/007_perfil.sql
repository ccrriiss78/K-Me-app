-- Imagen de perfil (D044, D055; 24/11/2026): el fan elige uno de sus avatares, uno de sus sellos o
-- los dos. Añade dos columnas a «usuarios»; no cambia ningún dato existente.
--
-- Se guarda como REFERENCIA, no como copia: el perfil enseña siempre la versión actual del avatar o
-- del sello. (Las publicaciones de Connect, en cambio, guardan su propia copia: Q7, Q11.)
-- - Las dos columnas pueden ir vacías: sin imagen de perfil.
-- - La clave foránea hace que la base de datos garantice que lo elegido existe.
-- - ON DELETE SET NULL: si se borra ese avatar o ese sello, el perfil se queda sin él, sin errores.
-- - Que sea de la MISMA cuenta lo comprueba la consulta que lo elige (models/perfilModel.js), con su
--   test de «otra cuenta no puede» (tests/perfil.test.js).

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS id_avatar_perfil BIGINT NULL REFERENCES avatares(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS id_sello_perfil  BIGINT NULL REFERENCES sellos(id)   ON DELETE SET NULL;
