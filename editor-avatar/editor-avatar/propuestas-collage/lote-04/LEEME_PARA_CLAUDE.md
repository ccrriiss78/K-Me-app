# K-ME · Lote 04 · Chaqueta Denim Collage

25/11/2026. Entrega gráfica externa; ningún archivo del proyecto ha sido escrito por ChatGPT. Claude mantiene la edición exclusiva del proyecto.

## Pieza

Nombre: **Chaqueta Denim Collage**. Capa: ropa superior. Familia propuesta: `collage-chaqueta-denim`.

| id | cuerpo |
| --- | --- |
| collage-chaqueta-denim-delgado | relajado |
| collage-chaqueta-denim-medio | recto |
| collage-chaqueta-denim-grueso | amplio |

Es una chaqueta abierta de manga corta con camiseta interior neutra, dos bolsillos de tapeta, solapas y vueltas de manga texturadas. No añade una ranura independiente para superponer prendas; chaqueta e interior forman una sola opción de ropa superior.

## Forma SVG

Los tres SVG están en `svg/`, con lienzo 400 × 480. Reutilizan la silueta y anatomía de Denim Layer existente, sin modificar sus archivos. La composición nueva cambia los detalles: bolsillos con costuras, solapas, vueltas de manga y botonadura.

Se conservan los grupos `perfil`, `torso` y `superior` para la separación del catálogo, con `perfilIntegrado: true` y `topCorto: false`. El contorno exacto está en el path `data-parte="prenda-superior"`. La prenda tiene origen de cintura y350 y utiliza el ajuste actual del bajo. No apilar otra anatomía sobre ella.

Los detalles se han dibujado en las coordenadas de la silueta media y escalado solo en x, alrededor de x200, con factores 0.88 / 1 / 1.12, mientras el contorno exterior es el de cada variante original. Revisar también cinturas distintas de la referencia antes de certificar todo el catálogo.

## Textura y aplicación

| archivo | tamaño | bytes |
| --- | --- | --- |
| texturas/denim-gris-128.png | 128 × 128 | 9 712 |
| texturas/denim-sombra-128.png | 128 × 128 | 8 724 |

Origen: denim generado por ChatGPT para el lote 01, reutilizado aquí. No es una foto de terceros ni contiene marcas o personas. El gris de referencia y las sombras alpha son los mismos materiales preparados en ese lote. No se atribuye una licencia CC0 ni se promete exclusividad sobre el contenido generado. La forma base pertenece a los recursos existentes de K-ME.

El PNG de sombras ya va incrustado en cada SVG como data URI. Base vectorial coloreable con `.f-arriba`, `.f-arriba-claro` y `.f-arriba-oscuro`: todas usan el campo existente `ropa.colorArriba`. Material con transparencia, sin mix-blend-mode: intensidad 0.28 sobre el cuerpo y 1 en bolsillos, solapas y puños, recortado por formas vectoriales. Patrón de 16 × 16 unidades.

Colores fijos de detalle: interior, costuras y botones en blanco cálido `#fffaf7`; contornos en tinta `#282126`, ambos existentes. No se añade un color metálico ni un campo de color nuevo. Los tonos azul, lavanda y fucsia de las referencias ya pertenecen a la paleta.

## Referencias

`referencias/KME_CHAQUETA_DENIM.png` muestra las tres siluetas. Hay SVG/PNG de cada avatar y detalles de prenda sola.

Son composiciones con el catálogo y dibujador actuales cargados en memoria, rasterizadas offline con Sharp; no son capturas del editor integrado. Se han revisado visualmente la lámina y el detalle de la variante media.

## Integración de Claude

1. Releer las instrucciones y el estado vigente del proyecto. Adaptar rutas del catálogo propuesto; no aplicarlo automáticamente.
2. Añadir los tres ids como familia nueva y su correspondencia entre siluetas. Conservar Denim Layer, otras chaquetas y todas las recetas existentes.
3. Incluir los ids nuevos en la validación del servidor siguiendo TDD. No hace falta ampliar el contrato de color.
4. Reutilizar el namespace del lote 01 para todos los ids `collage-` y referencias `url(#...)`, comprobándolo con varios avatares.
5. Reutilizar el filtro seguro de PNG incrustados de Sello Studio. No ampliar su permiso a recursos externos ni desactivar el sanitizador.
6. Revisar miniaturas de prenda sola, encaje y solapes, diferentes cinturas, cambio de color, guardar/recargar, perfil, Connect y sello; comprobar PNG/PDF desde la app.

Se propone para el catálogo especial con prueba antes de adquirirla. No hay precio aprobado, probador, propiedad ni consumo de Kpopis implementados en este paquete. No construir ni anunciar esas funciones a partir de los gráficos.

## Comprobaciones realizadas y pendientes

Comprobado: dimensiones y peso; gris exacto y alpha; bordes coincidentes del mosaico; imágenes PNG incrustadas; ausencia de scripts, eventos y foreignObject; rasterización y composición sobre las tres siluetas.

Pendiente: integración de catálogo/servidor, tests del proyecto, comprobación de otras cinturas y accesorios, editor y exportación PNG/PDF reales. No se han ejecutado los tests de la app durante esta preparación gráfica.

## Prompt breve

Revisa el lote 04 Chaqueta Denim Collage. Sigue esta guía y añade las tres variantes como opciones nuevas, manteniendo las chaquetas y recetas existentes. Reutiliza el color de ropa superior y lo resuelto en el lote 01. Comprueba las miniaturas, cinturas, guardado y exportación con los tests correspondientes. El canje con Kpopis es una propuesta pendiente, sin precio aprobado.
