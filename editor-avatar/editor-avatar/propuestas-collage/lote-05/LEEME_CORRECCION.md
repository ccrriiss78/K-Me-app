# Lote 05 · Corrección de las tres faldas con botas

Se entregan los tres SVG con los mismos nombres:

- collage-falda-botas-piel-delgado.svg
- collage-falda-botas-piel-medio.svg
- collage-falda-botas-piel-grueso.svg

Se han preparado fuera del proyecto, tomando como base una copia de los tres SVG que Claude estaba integrando. No se ha escrito en el repositorio ni se ha cambiado ningún test.

## Cambios

Solo cambia el interior del grupo `data-capa="calzado"`.

- Compresión vertical de las botas, aplicada a coordenadas reales de paths y hebillas, alrededor de y388 con factor 0.8. No se usa una transformación para ocultar coordenadas que incumplan el límite.
- Suela y contornos redondeados con curvas cúbicas.
- Un único `<path data-parte="calzado" ...>` dibuja el contorno de ambas botas: 10 curvas C por bota, 20 en total. Se conserva así también la regla de una sola marca de calzado por avatar.
- Máximo de coordenadas de todo el calzado: y429.6. Añadiendo un margen conservador de 1.4 unidades por el trazo heredado, la cota es y431, inferior a 432.

Comprobado por igualdad exacta: path de piernas, grupo completo de falda, defs, ids «collage-», patrones e imágenes PNG incrustadas permanecen intactos. Se conservan los grupos de cada bota y `data-capa="calzado"`.

## Pruebas ejecutadas en una copia externa

Antes de corregir, `cuerpos-expresivos.test.js`: 1 pasa, 2 fallan por falta de la marca de calzado.

Después de corregir:

- cuerpos-expresivos.test.js
- ropa-piernas-integradas.test.js
- camiseta-integrada.test.js
- mezclas-prendas.test.js

Resultado conjunto: **13 de 13 pasan**.

Se ejecutó también `collage-lote-05.test.js` sin modificarlo: **4 pasan y 1 falla**. La única causa es su línea 68:

`assert.doesNotMatch(piernas, /data-parte="calzado"/, ...)`

Esta comprobación identifica erróneamente cualquier marca de calzado como el dibujo viejo y contradice la regla general aprobada y el encargo actual, que exigen esa marca en las botas nuevas.

Claude debe conservar la comprobación de ausencia del calzado viejo, pero verificarla por su geometría o por la estructura del grupo: un único path marcado dentro del grupo de botas nuevas, con ambas botas y sin la trayectoria antigua. No volver a quitar `data-parte="calzado"`, no añadir una marca ficticia u oculta y no relajar las reglas generales para eludir la contradicción.

No se han modificado tests. No se ha ejecutado toda la suite de la app ni probado el navegador: esos pasos corresponden a Claude al sustituir los tres SVG.

`VERIFICACION.json` incluye los límites, igualdad de zonas preservadas y SHA-256 de cada SVG corregido. La referencia PNG se compone con el dibujador actual sobre la copia externa.
