-- Tipo del mensaje con iconos de Connect (D084, E0099): qué es el mensaje (Mensaje, Reto, Pregunta,
-- Ánimo o Recomendación), para que en el muro se entienda. Sale delante de los iconos.
-- El id sale del catálogo (src/catalogos/connect.js, TIPOS_MENSAJE) y lo comprueba el servidor.
-- NULL: sin mensaje, o publicación de antes de esta migración (con iconos, se ve como «Mensaje»).

ALTER TABLE publicaciones
  ADD COLUMN IF NOT EXISTS tipo_mensaje VARCHAR(20);
