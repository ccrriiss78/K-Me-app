-- «K-ME · TÚ DECIDES» (D080, E0093): el voto de cada cuenta por la propuesta futura que quiere primero.
-- Un voto por cuenta: la clave primaria es la cuenta, así que votar otra vez SUSTITUYE el voto
-- (INSERT … ON CONFLICT … DO UPDATE en votoModel.js) y nunca se suman votos de la misma cuenta.
-- Las propuestas válidas son las del catálogo (src/catalogos/tu-decides.js); la base de datos las
-- comprueba también. Al borrar la cuenta, se borra su voto.
CREATE TABLE IF NOT EXISTS votos_tu_decides (
  id_usuario BIGINT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  propuesta VARCHAR(30) NOT NULL CHECK (propuesta IN ('exchange', 'my-stage', 'fan-events')),
  votado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
