-- Separa el nombre para entrar del nombre público (D020).
-- · usuario: privado, solo sirve para entrar y nunca se muestra en la app.
-- · alias:   público, lo que ven los demás fans (cabecera, Mi K-ME, sello y muro).
-- Los dos son únicos sin distinguir mayúsculas y siguen el mismo formato.
-- Las cuentas que ya existen (todas ficticias) reciben como alias su usuario actual.
-- scripts/migrate.js aplica este archivo dentro de una transacción: o se hace todo, o nada.

-- 1. La columna que hasta ahora se llamaba alias es, en realidad, el usuario para entrar.
ALTER TABLE usuarios RENAME COLUMN alias TO usuario;
ALTER TABLE usuarios RENAME CONSTRAINT usuarios_alias_formato TO usuarios_usuario_formato;
ALTER INDEX usuarios_alias_unico RENAME TO usuarios_usuario_unico;

-- 2. Nueva columna para el alias público, rellenada con el usuario en las cuentas que ya existen.
ALTER TABLE usuarios ADD COLUMN alias VARCHAR(30);
UPDATE usuarios SET alias = usuario;
ALTER TABLE usuarios ALTER COLUMN alias SET NOT NULL;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_alias_formato CHECK (alias ~ '^[A-Za-z0-9_]{3,30}$');

-- 3. El alias también es único sin distinguir mayúsculas: "Luna" y "luna" son el mismo alias.
CREATE UNIQUE INDEX usuarios_alias_unico ON usuarios (lower(alias));
