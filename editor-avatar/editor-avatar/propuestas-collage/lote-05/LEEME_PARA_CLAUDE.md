# K-ME · Lote 05 · Botas de piel collage

25/11/2026. Preparación gráfica fuera del proyecto. Claude mantiene la edición exclusiva; ChatGPT no ha modificado el repositorio.

## Qué está preparado

Familia de calzado: `collage-botas-piel`. Nombre: **Botas de piel collage**.

| id gráfico | cuerpo |
| --- | --- |
| collage-botas-piel-delgado | relajado |
| collage-botas-piel-medio | recto |
| collage-botas-piel-grueso | amplio |

Los tres SVG aislados están en `svg/collage-botas-piel-*.svg`, lienzo 400 × 480. Son gráficos nuevos, con forma vectorial original, piel generada, cordones, pespuntes, hebillas y suela. Se cubre el calzado de referencia dentro del rango aproximado x147–253, y388–438; la caña izquierda varía su borde exterior entre x163, x157 y x151, con el derecho simétrico. La forma exacta está en cada SVG; la segunda bota usa simetría horizontal alrededor de x200.

**El catálogo actual no tiene una ruta de calzado ni color independiente de botas.** `catalogo-propuesto.json` describe la propuesta gráfica, no es un parche para aplicar al catálogo actual.

## Alternativa concreta para el MVP

También se incluyen tres SVG de una opción nueva de **falda con botas negras**:

| id seleccionable propuesto | cuerpo |
| --- | --- |
| collage-falda-botas-piel-delgado | relajado |
| collage-falda-botas-piel-medio | recto |
| collage-falda-botas-piel-grueso | amplio |

Archivos: `svg/collage-falda-botas-piel-*.svg`. Catálogo orientativo: `catalogo-alternativa-mvp.json`.

Esta alternativa conserva el funcionamiento de `ropa.abajo`: grupos `piernas` y `prenda`, con sustitución de la capa piernas como en la falda integrada actual. Las botas se incluyen en las piernas de esta opción nueva, sin dejar dibujado debajo el calzado anterior. La falda reutiliza la forma existente y sigue usando `ropa.colorAbajo`; las botas permanecen negras. No cambia la falda antigua ni ninguna receta anterior.

Se ha compuesto y rasterizado con el catálogo y dibujador actuales, añadiendo el catálogo solo en memoria, sin inventar una ruta en la receta. Es una alternativa para valorar, no una decisión de producto ni una implementación en la app.

**Recomendación MVP:** si la autora elige incluirlas ahora, valorar primero la opción de falda con botas, porque no necesita crear un sistema nuevo de calzado. No ampliar por este paquete el contrato con una capa, selector o campo nuevo sin decidir antes su alcance con la autora.

## Material, color y derechos

| textura | dimensiones | bytes |
| --- | --- | --- |
| piel-gris-256.png | 256 × 256 | 7 894 |
| piel-sombra-256.png | 256 × 256 | 6 506 |
| piel-luz-256.png | 256 × 256 | 7 179 |

Ubicación: `texturas/`. Origen: **textura generada por ChatGPT**, sin fotos de terceros, personas ni marcas. La forma de botas es nueva; la falda y anatomía de la alternativa MVP proceden de recursos existentes de K-ME. No se atribuye CC0 ni se garantiza exclusividad sobre el material generado.

Las imágenes de sombra y luz ya están incrustadas como data URI PNG en los SVG. El gris es la referencia del material. Preparación técnica: reducción, mosaico especular de bordes iguales, 16 niveles de gris o alpha y PNG indexado.

Aplicación: base vectorial `.f-calzado-collage`, por defecto negra, con patrón de sombra negra alpha y luz blanca alpha, ambos al 100% y contenidos por el contorno. Patrón de 48 × 48 unidades. No requiere modo multiplicar ni archivos externos.

Colores fijos: contorno y suela tinta `#282126`, costuras blanco cálido `#fffaf7` y herrajes crema `#ede0cb`; son tonos existentes. Los colores ciruela y azul de la primera lámina son **muestras externas** aplicadas mediante CSS de referencia. No existe todavía una selección funcional de esos colores en la receta de calzado. La alternativa MVP usa únicamente botas negras.

## Referencias: distinguir los dos recorridos

- `referencias/KME_BOTAS_PIEL.png`: prueba gráfica de una capa de calzado hipotética sobre avatares reales; la capa se ha insertado solo en el SVG de referencia, delante de piernas y detrás de la falda. No demuestra que el editor tenga selector de calzado.
- `referencias/KME_FALDA_BOTAS_MVP.png`: composición de la nueva opción inferior mediante la estructura actual, con falda coloreable y botas negras.
- `botas-detalle-*.png`: ampliaciones aisladas de las botas en negro.
- Hay SVG/PNG individuales de las dos alternativas.

Todas son rasterizaciones offline; no son capturas del editor integrado ni exportaciones desde el navegador.

## Integración y comprobación por Claude

1. Releer AGENTS.md y el estado vigente. Presentar la alternativa MVP y la independencia de calzado como opciones distintas; no activar ambas por defecto ni decidir una ampliación del contrato por iniciativa propia.
2. Si se integra la falda con botas, añadir solo sus ids como familia nueva de ropa inferior, con los tests y la validación de servidor correspondientes. Conservar ids y apariencia de todas las piezas previas.
3. Comprobar namespaces `collage-`, varias instancias en una página y el filtro seguro de imágenes de Sello Studio. No abrir recursos externos ni desactivar el filtro.
4. Revisar miniatura: en la opción compuesta debe entenderse que incluye falda y botas; en un futuro selector independiente, solo las botas.
5. Revisar cuerpos, cinturas, solapes, guardado/recarga, perfil, Connect, sello y exportación PNG/PDF reales.
6. La versión aislada no está certificada con pantalones, vestidos u otras piernas. No superponerla a todo el catálogo sin revisar las combinaciones.
7. No hay precio, probador, canje ni propiedad implementados en este lote; su pertenencia al catálogo de monedas sigue siendo propuesta.

## Validación realizada fuera del proyecto

Texturas grises exactas, alpha, límites de peso/dimensiones y bordes coincidentes; PNG incrustados; ausencia de scripts/eventos/foreignObject; rasterización de botas; composición externa con las tres siluetas; alternativa de falda con botas compuesta con el dibujador actual; revisión visual de ambas láminas y detalle.

Pendiente: decisión de alternativa, integración del catálogo y servidor, tests del proyecto, editor real y exportación PNG/PDF desde navegador. No se han ejecutado los tests de la app durante esta producción gráfica.

## Prompt breve

Revisa el lote 05 Botas de piel collage y su guía. Incluye botas aisladas y una alternativa MVP de falda con botas negras usando la estructura actual. Valora esa alternativa conmigo antes de crear un selector independiente de calzado. Conserva todas las prendas y recetas anteriores, sigue TDD y distingue gráficos preparados, integración y comprobación real en navegador. No hay precio ni canje aprobado.
