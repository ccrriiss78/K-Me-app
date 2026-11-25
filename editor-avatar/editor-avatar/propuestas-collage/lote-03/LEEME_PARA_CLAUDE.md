# K-ME · Lote 03 · Top Destello

25/11/2026. Pieza gráfica externa: no se ha escrito en el proyecto. Claude sigue siendo el único editor.

## Identidad y forma

Nombre: **Top Destello**. Capa: ropa superior. Familia: `collage-top-lentejuelas`.

Ids seleccionables propuestos:

| id | cuerpo |
| --- | --- |
| collage-top-lentejuelas-delgado | relajado |
| collage-top-lentejuelas-medio | recto |
| collage-top-lentejuelas-grueso | amplio |

La forma es el **halter actual de K-ME**, reutilizado como base de una pieza nueva. No se ha dibujado ni cambiado el halter existente. Los nuevos SVG conservan sus perfiles de piel, torso y forma de prenda para encajar con las tres anatomías. Mantener los grupos `perfil`, `torso` y `superior`, `perfilIntegrado` y `topCorto`, como recoge el catálogo propuesto. Lienzo 400 × 480; torso de la prenda aproximadamente y292–340. Para la forma exacta, consultar el path `data-parte="prenda-superior"` de cada SVG.

Cada SVG es autónomo en imágenes incrustadas y también contiene los grupos anatómicos que el catálogo separa por capas. La miniatura debe enseñar solo la prenda; no dibujar encima otra anatomía duplicada. No aplicar este acabado a ids antiguos: los avatares guardados deben conservar su aspecto.

## Material y aplicación

Origen: **textura generada por ChatGPT**, sin fotos de terceros, personas, marcas ni merchandising. Forma base: prenda ya existente de la autora en K-ME. El material generado no se atribuye a CC0 ni se presenta como exclusivo. Se permite entregarlo para el proyecto conforme a los términos aplicables al contenido generado; no hay una licencia de terceros que atribuir.

| archivo | dimensiones | bytes |
| --- | --- | --- |
| texturas/lentejuelas-gris-256.png | 256 × 256 | 12 676 |
| texturas/lentejuelas-sombra-256.png | 256 × 256 | 12 660 |
| texturas/lentejuelas-luz-256.png | 256 × 256 | 7 327 |

El gris es el material de referencia. Los dos PNG con alpha están ya dentro del SVG, en data URI PNG. No necesitan enlaces a webs.

Aplicación: base vectorial `.f-arriba`, con el color actual `ropa.colorArriba`; sombras negras transparentes y reflejos blancos transparentes, ambos al 100% sobre esa base y recortados por la forma. No se utiliza mix-blend-mode. El patrón mide 140 × 140 unidades SVG. Incluye ribete vectorial y dos pequeños destellos blancos estáticos, sin animación. No hay color fijo de metal: la luz blanca y sombra negra permiten conservar el tono elegido en la paleta existente.

Preparación técnica: reducción a 128 px de muestreo, mosaico especular final de 256 px, 16 niveles y PNG indexado sin colores ajenos al gris. Los bordes coinciden píxel a píxel. Revisar el aspecto de la repetición también en navegador.

## Referencias incluidas

`referencias/KME_TOP_DESTELLO.png` muestra las tres siluetas. Los SVG/PNG individuales y los detalles de la prenda están en esa carpeta.

Se han compuesto con el catálogo y dibujador actuales, cargados solo en memoria, y se han rasterizado offline con Sharp. Son referencias de la pieza real; no son capturas del editor integrado ni prueba de impresión real.

Los tres colores son ejemplos de una misma prenda, no tres productos distintos. Los tres ids corresponden a las tres siluetas, siguiendo la organización actual de los tops. No introducir nuevos colores ni campos HEX.

## Integración

1. Releer AGENTS.md y el estado actual. El catálogo propuesto no es un parche: adaptar rutas y arrays mediante el cargador vigente.
2. Añadir la familia y sus tres ids al catálogo, su correspondencia entre cuerpos y la validación del servidor, siguiendo TDD. Conservar ids, formas y recetas anteriores.
3. Reutilizar el enlace de color de ropa superior: esta pieza no necesita un campo de color nuevo.
4. Revisar que los ids que empiezan por `collage-` y sus referencias reciben un namespace por instancia. En la lectura actual del dibujador ya aparece un tratamiento para los ids del lote 01; comprobarlo también con estos tres SVG, con varios avatares y colores en la misma página.
5. Mantener los límites del sanitizador. Para Sello Studio, aceptar solo imágenes PNG/JPEG incrustadas seguras, sin abrir recursos externos ni contenido activo. Su implementación no se modifica en este lote.
6. Comprobar miniaturas de prenda sola, los tres cuerpos, diferentes cinturas, cambios de color, guardar/recargar, perfil, Connect, sello y exportación PNG/PDF real.

## Catálogo y monedas

Se propone como pieza especial que pueda canjearse por Kpopis, con prueba previa sin gastar monedas. **Este lote contiene gráficos, no un sistema de tienda.** No hay precio aprobado, ni consumo de saldo ni gestión de propiedad implementados aquí. No anunciar que se puede comprar hasta que esas funciones existan y estén probadas. Mantener disponible al menos alguna pieza de collage inicial como el gorro o la falda, según decida la autora.

## Verificación y pendientes

Hecho fuera del proyecto: dimensiones y peso de las tres texturas, gris exacto, alpha, igualdad de bordes, recursos incrustados, ausencia de scripts/eventos/foreignObject, rasterización de las tres siluetas y revisión visual de la lámina y el detalle.

Pendiente: integración de catálogo/validador, tests de la app y del editor, miniaturas y guardado reales, sanitizador de Sello Studio y exportación PNG/PDF del navegador. No se han ejecutado los tests del proyecto durante esta preparación gráfica.

## Mensaje breve de la autora

Revisa el lote 03 Top Destello. Integra solo como opción nueva, conservando el halter y las recetas actuales. Sigue esta guía y los tests del proyecto. El top ya usa el campo de color de ropa superior. El canje y el probador son propuestas pendientes: no inventes precio ni anuncies compra funcional. La captura de ojos personales está descartada.
