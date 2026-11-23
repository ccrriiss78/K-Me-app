-- Preparación LOCAL de la base de datos de desarrollo de K-ME.
-- Se ejecuta UNA vez como superusuario (postgres) desde la carpeta app/:
--
--   psql -U postgres -f db/setup_local.sql
--
-- No contiene contraseñas. Después de ejecutarlo, asigna la contraseña del usuario
-- kme_app de forma oculta con:
--
--   psql -U postgres -c "\password kme_app"
--
-- y escribe esa misma contraseña en app/.env.local (PGPASSWORD).

-- Usuario propio de la aplicación, sin privilegios de superusuario.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kme_app') THEN
    CREATE ROLE kme_app LOGIN;
  END IF;
END
$$;

-- Base de datos de desarrollo, propiedad de kme_app. No se toca si ya existe.
SELECT 'CREATE DATABASE kme_dev OWNER kme_app ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'kme_dev')
\gexec

\echo Preparacion terminada. Ahora: psql -U postgres -c "\password kme_app"
