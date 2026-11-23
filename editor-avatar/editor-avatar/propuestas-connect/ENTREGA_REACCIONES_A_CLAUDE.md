# Connect · Más reacciones y corrección del fondo de sellos

23/11/2026 · R0064/E0065 · TECH_SPEC v1.13 · D049 y D050.

## Autorización y alcance

La autora autoriza expresamente a ChatGPT el cambio concreto del catálogo de Connect y sus pruebas: «Te autorizo ese cambio concreto». Se añade un archivo de tests de app; los existentes quedan intactos. No se cambia servicio, controlador, modelo, ruta, migración o dependencia.

Se conservan los nueve ids anteriores y se añaden `llorar`, `emocion`, `tristeza`, `abrazo`, `risa`, `sorpresa`, con etiquetas Llorar, Me emociona, Me entristece, Un abrazo, Me hace reír y Me sorprende. Los SVG nuevos son negros sobre transparente, viewBox 0 0 24 24, con caritas y gestos propios. No se amplía el catálogo de adornos del sello.

La presentación elige cinco accesos rápidos: corazón, aplauso, lightstick, mini corazón y fuego. Los otros diez se muestran en «+ Más reacciones», con nombres, totales y estado propio. El menú es un details nativo dentro del mismo formulario, con una sola copia por botón. Sin JS funciona igual con recarga; con JS se actualiza también la suma de adicionales, Escape devuelve el foco y pulsar fuera cierra. Los botones permiten seguir sumando mientras está abierto.

La autora también pide probar el collage en el fondo general de la colección, con tarjetas más pequeñas. Se aplica a Mis sellos, fuera de sus dibujos: ancho máximo 250 px y tarjetas blancas/opacas; cabecera y contador sobre blanco. La vista previa sigue limpia.

## Archivos de esta sesión

- `app/src/catalogos/connect.js`.
- `app/src/views/connect.ejs`, nuevos `_reacciones.ejs` y `_reaccion.ejs`.
- `app/public/js/connect.js`.
- `app/public/css/identidad.css` (archivo con cambios también de sesiones anteriores).
- Nuevos `app/public/img/connect/reacciones/llorar.svg`, `emocion.svg`, `tristeza.svg`, `abrazo.svg`, `risa.svg`, `sorpresa.svg`.
- Nuevo `app/tests/connect-reacciones-ampliadas.test.js`, autorizado por la autora.
- Revisiones regeneradas en `editor-avatar/editor-avatar/propuestas-sello/`: `KME_SELLO_EDITOR_REVISION.html`, `KME_MIS_SELLOS_REVISION.html`, `KME_SELLOS_VACIO_REVISION.html`.
- `BITACORA_KME.md`, `docs/TECH_SPEC.md` y esta nota.

## Validación y pendientes

TDD: catálogo/menú/HTTP en rojo, primero 3 fallos y 1 correcto; con Escape y cierre exterior, 5 fallos y 1 correcto; después 6/6 correctos. Prueba HTTP real con cuenta ficticia temporal: las seis reacciones persisten en SQL y aparecen en JSON y muro; se elimina la cuenta, sus sesiones, publicación y reacciones al acabar. Contadores y límite, ids antiguos, CSRF, escape del alias, botones únicos y navegación se conservan.

`npm test`: **128/128**, cero fallos y omitidos, salida 0. XML de los seis iconos, node --check y git diff --check correctos. Generador estático con salida 0. No se afirma revisión visual en navegador ni se repite la batería del editor autónomo.

App arrancada en http://localhost:3001 con npm start, tras no encontrar escucha en ese puerto. Entrada e icono nuevo responden 200. Pendiente: revisión visual en móvil y valoración artística de los iconos. Bitácora libre después de E0065. Sin staging ni commit; conservar el resto de cambios pendientes.
