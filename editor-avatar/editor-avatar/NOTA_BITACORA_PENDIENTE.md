# Anotación incorporada a BITACORA_KME.md

Preparada el 21/11/2026 sobre R0041/E0041 mientras Claude editaba la bitácora. Incorporada el mismo día en **R0042, sesión E0042**, después de que la autora indicase que Claude continuaría al terminar ChatGPT.
La referencia única y vigente es `../../BITACORA_KME.md`. El borrador del 21/11 se incorporó en R0042/E0042 y el seguimiento del 22/11 se ha incorporado en **R0044/E0044**, cerrando T023. Se conservan como históricos, incluidos sus estados intermedios; no deben volver a incorporarse ni usarse como una segunda bitácora.

### E<pendiente> · 2026-11-21 · Maquillaje, ojos de prueba, grosores y encaje del editor

- **Autoría y entorno:** ChatGPT, carpeta real `k-me`, editor autónomo `editor-avatar/editor-avatar/`. Archivos escritos y comprobados en esta carpeta. Claude trabaja simultáneamente; `.githooks/` se conserva intacto. No se ha escrito en su zona ni se han hecho commits.
- **Objetivo:** convertir las propuestas de maquillaje en capas SVG seleccionables, conservar los ojos actuales mientras se prueban otros, ajustar grosores y corregir la presentación dentro de los marcos y los saltos del panel.
- **Base leída:** R0041, E0041; AGENTS.md, CLAUDE.md y TECH_SPEC v1.6.
- **Hechos y trabajo realizado:** seis SVG de maquillaje (sombra acuarela, delineado, brillo, gemas, rubor y labios); categoría Maquillaje con efectos independientes, opción para retirarlos y colores existentes del catálogo. Se reutilizan 24 colores de ropa y 9 de fantasía del iris, sin crear tonos ni modificar los colores de marca. El delineado usa de partida Tinta y copia las curvas reales de los ojos, incluidos los guiños. El rubor nuevo sustituye al anterior al elegirlo, evitando duplicarlo. Se conservan los dibujos de mejillas anteriores.
- **Decisiones confirmadas:** la autora pide pigmento de labios pegado al borde exterior de la boca, aprueba C (Pigmento suave) y solicita fino, medio y grueso; pide esos tres grosores para cejas. Solicita ojos nuevos inspirados en los mockups, conservando los actuales hasta elegir. Pide avatar más grande y centrado dentro del marco y que al cambiar el grosor de cejas el panel no salte ni quede cortado.
- **Cambios o correcciones:** labios vectoriales que siguen los contornos exactos de sonrisa, risa y asombro, con color y grosor independientes; se conserva el negro original de la boca. Las tres formas actuales de cejas ofrecen grosores sin modificar sus SVG originales (Medio conserva su dibujo). Se añaden Dulces, Felinos y Escenario, con abiertos, cerrados y guiño a cada lado (12 archivos), sin retirar los 33 ojos anteriores. Las formas y expresiones nuevas admiten el color de iris y el delineado. Guardado por base, restauración y Deshacer siguen disponibles temporalmente en la muestra.
- **Corrección de marcos:** se elimina el montaje de una photocard con medidas físicas dentro del marco de pantalla. El marco recibe el avatar directamente, con lienzo normalizado y ventana `60 0 280 450`, centrada en x=200. Miniaturas y vista grande comparten el encaje. La impresión conserva sus formatos propios. Antes el avatar quedaba pequeño y desplazado.
- **Corrección del panel:** al reconstruir las opciones se conserva el desplazamiento del panel y de la página y se recupera el foco sin desplazarlo. Cambiar de categoría inicia sus opciones arriba; cambiar el grosor o deshacer dentro de una categoría mantiene la posición. Se regenera KME_ABRIR_MUESTRA.html.
- **Pruebas:** se escribieron primero tests nuevos y se ejecutaron en rojo por el comportamiento ausente; después pasaron. Maquillaje, ojos de prueba, cejas y encaje de marcos: 16 tests nuevos y 4 existentes de marcos, 20/20. Se comprobaron como XML los 18 SVG nuevos. Panel: 3 tests nuevos que reproducen el reinicio al vaciar sus opciones; inicialmente 0/3 y después 3/3. Última ejecución completa: `node --test "tests/*.test.js"`, 85 tests, 83 correctos, 2 fallidos, 0 omitidos. Los fallos ya existían antes de estas correcciones: ayuda antigua compartida de impresión y enlace retirado a KME_COMPARAR_OJOS.html. No se han cambiado esos tests ni otros tests preexistentes.
- **Problemas y pendientes:** revisión visual final por la autora. El control del navegador reconoció la ruta correcta del editor pero se detuvo al intentar recargar porque no pudo determinar la URL con suficiente confianza; no se afirma revisión visual completada. No hay persistencia por cuenta nueva. Gemas y brillo arrastrables: posibilidad consultada por la autora y propuesta por el asistente, aún sin decisión concreta sobre mover cada gema o el conjunto y sin implementar. Investigación y lámina de vestuario K-pop realizadas en esta conversación, sin prendas nuevas incorporadas.
- **Propuestas sin confirmar:** libertad de posición para gemas y brillos; conservar anclados los efectos que siguen ojos y boca. La propuesta de borrar ojos queda pendiente de la elección de la autora; no se ha eliminado ninguno.
- **Aprendizaje:** las medidas físicas de impresión no deben reutilizarse como coordenadas dentro de otro SVG de pantalla. Reconstruir un contenedor con desplazamiento puede reiniciar la barra; conservar el foco por sí solo no conserva su posición.
- **Siguiente paso:** comprobar en la muestra recargada los tres grosores de cejas sin saltos, el ajuste de labios y el avatar dentro de ambos marcos. Revisar con la autora los ojos que conservará y las dos pruebas antiguas que requieren autorización para actualizarse. Incorporar esta propuesta cuando la bitácora esté libre.
- **Revisión resultante:** pendiente; BITACORA_KME.md no se ha modificado.

## Filas y apartados a conciliar al incorporar

- Seguimiento posterior: la autora solicita retirar únicamente el título visible «Probar ojos del mockup» y ver propuestas de tristeza antes de elegir qué añadir. Se retira el encabezado, se conservan las miniaturas y sus opciones, y se regenera la muestra autónoma. Se ejecutan `tests/ojos-mockup.test.js` y `tests/panel-posicion.test.js`: 6/6 correctos. Se genera una lámina de seis propuestas A–F (Tristeza suave, Mirada caída, Desánimo, Pena contenida, A punto de llorar y Llanto silencioso). Son bocetos pendientes de elección; no se han añadido ojos tristes al catálogo ni se ha modificado ningún test existente.

- Seguimiento siguiente: la autora aprueba expresamente las seis posibilidades («añade todas las posibilidades»). Queda resuelta la elección pendiente anterior: se incorporan A–F en el apartado Tristeza de Ojos, como seis SVG independientes, con lágrimas en E y F y párpados cerrados sin iris en F. Se añade una pieza de cejas tristes, seleccionada junto con la mirada en una sola operación que admite Deshacer; después las cejas siguen siendo editables y conservan su grosor. Se mantienen boca, iris, maquillaje y los 45 ojos previos. Elegir una forma o un gesto normal permite salir de la mirada triste sin errores. El delineado utiliza los párpados identificados de cada SVG y coloca su remate en el extremo exterior, también cuando el ojo derecho está reflejado. Se regenera la muestra autónoma.
- Validación de tristeza: cinco tests nuevos en `tests/ojos-tristeza.test.js`, inicialmente 0/5 por opciones ausentes y después 5/5. Con ojos del mockup, maquillaje y posición del panel: 19/19. Siete SVG nuevos comprobados como XML. Última ejecución completa tras regenerar: 90 tests, 88 correctos y los mismos 2 fallos anteriores, 0 omitidos. `git diff --check` correcto en los archivos modificados. No se ha modificado ningún test preexistente, hecho commit ni escrito en BITACORA_KME.md. Aspecto final en navegador pendiente de la autora.

- T022: proponer su cierre por escritura real comprobada en `k-me` y ejecución de los tests del editor; no confundirlo con lectura solamente.
- Añadir las decisiones, pruebas y pendientes correspondientes con IDs provisionales resueltos sobre el archivo vigente.
- Actualizar el estado del editor y añadir una fila de revisión una sola vez al incorporar.
- Conciliar también los cambios previos de esta conversación aún no registrados (presentación del estudio, impresión y acabado E de iris) con los archivos actuales y las pruebas ya ejecutadas; no inventar aprobación visual ni resultados de impresión física.

## Archivos de la incorporación de las seis miradas tristes

Rutas relativas a `editor-avatar/editor-avatar/`:

```text
assets/kme/ojos/kme-tristeza-a-estrella.svg
assets/kme/ojos/kme-tristeza-b-estrella.svg
assets/kme/ojos/kme-tristeza-c-estrella.svg
assets/kme/ojos/kme-tristeza-d-estrella.svg
assets/kme/ojos/kme-tristeza-e-estrella.svg
assets/kme/ojos/kme-tristeza-f-cerrados-sin-brillo.svg
assets/kme/cejas/tristes.svg
datos/kme.json
js/kme-ropa.js
js/kme-editor-visual.js
js/kme-vista-visual.js
js/kme-maquillaje.js
tests/ojos-tristeza.test.js
KME_ABRIR_MUESTRA.html
NOTA_BITACORA_PENDIENTE.md
```

## Seguimiento incorporado en R0044/E0044 · 2026-11-22 · T023

- Base leída: BITACORA_KME.md R0043, última entrada E0043; AGENTS.md, CLAUDE.md y TECH_SPEC v1.6 consultados. Se conserva el trabajo ajeno de CLAUDE.md y .githooks/.
- La autora autoriza quitar solo la exigencia del enlace KME_COMPARAR_OJOS.html en tests/paletas-ampliadas.test.js y actualizar en tests/impresion-presentacion.test.js la ayuda esperada a «Descarga el PDF e imprímelo en tamaño real.». Pide ver el antes y el después antes de cambiarlo.
- Se muestran ambos cambios en la conversación y se aplican: una línea eliminada en paletas y una sustitución de expectativa en impresión, incluyendo el identificador actual ayuda-photocards.
- Se ejecuta el conjunto completo desde el editor: `node --test "tests/*.test.js"`. Resultado: 90 tests, 89 correctos, 1 fallido, 0 omitidos. `git diff --check` sin problemas en los dos tests.
- El fallo restante de esa ejecución correspondía a otra expectativa antigua del test de impresión: exigía aria-describedby="estado-impresion" en los tres botones. La interfaz aprobada asocia solo los botones de photocard a ayuda-photocards. Se muestra un ajuste concreto, se pide autorización y la autora responde «ok». Se aplica el ajuste: los tres botones deben existir, los dos de photocard deben apuntar a ayuda-photocards y el de impresión libre no debe usar esa ayuda. El nombre del test se actualiza para describirlo, mostrándolo antes de cambiarlo.
- Resultado final tras el ajuste aprobado: `node --test "tests/*.test.js"`, **90 tests, 90 correctos, 0 fallidos, 0 omitidos**, salida 0. Los dos fallos de T023 quedan resueltos; el pendiente está listo para marcarse terminado con esta evidencia cuando se incorpore la entrada al archivo compartido. Se conserva el resultado intermedio 89/90 para explicar por qué fue necesaria la autorización adicional.
- Archivos propios de esta tarea: tests/paletas-ampliadas.test.js, tests/impresion-presentacion.test.js y esta anotación; al documentar se actualiza BITACORA_KME.md a R0044/E0044. No se modifica la app, HTML de la muestra, lógica o estilos, ni se ejecutan tests de app/. Sin commit, staging ni cambios de Git. La anotación inicialmente pendiente queda incorporada y T023 figura terminado en la bitácora.
