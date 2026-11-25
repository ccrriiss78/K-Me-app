# K-ME · Lote collage 02 · Gorro de punto

Entrega gráfica externa, 25/11/2026. Ningún archivo del proyecto ha sido modificado. Claude sigue siendo el único editor. Es una pieza nueva para revisar e integrar, no una integración terminada.

## Pieza

- id: `collage-gorro-punto`
- Nombre: Gorro de punto
- Capa: accesorio, por encima del pelo frontal.
- Archivo: `svg/collage-gorro-punto.svg`, lienzo 400 × 480.
- Propuesta de disponibilidad: pieza inicial gratuita. La autora decide la disponibilidad final; no se añade precio ni canje en este lote.

## Qué incluye

SVG con forma vectorial original y textura PNG incrustada mediante data URI. No necesita descargar imágenes externas. Copa entre x89–311, y22–139 aproximadamente; vuelta entre x80–319, y102–151. Se conservan flequillo y laterales del cabello.

`texturas/punto-gris-128.png`: 128 × 128, 19 843 bytes. Material gris de referencia.

`texturas/punto-sombra-128.png`: 128 × 128, 13 955 bytes. Sombras negras con alpha, ya incrustadas en el SVG. El color procede de la base vectorial, sin teñir la fotografía ni depender de mix-blend-mode. Opacidad 0.42 en copa y 1 en la vuelta. Patrón de 192 × 192 unidades, recortado por clipPath. Los bordes del mosaico coinciden píxel a píxel mediante repetición especular; conviene revisar también la apariencia visual de la repetición en el navegador.

Origen de la textura: generada por ChatGPT, sin fotos de terceros ni personas. Preparación técnica: reducción, gris, mosaico y alpha. No se atribuye una licencia CC0 ni se promete exclusividad. No contiene marcas, merchandising ni logotipos. El SVG no cambia los logos de K-ME.

## Color: punto pendiente de integración

La clase nueva `f-gorro-collage` identifica las dos bases de color. El SVG trae lavanda como referencia, ya presente en la paleta. Las referencias muestran también fucsia y azul de la paleta existente.

El contrato inspeccionado no tiene un campo independiente de color de gorro. Las imágenes comparativas se han coloreado con CSS solo en las referencias externas. Esto no demuestra que el editor actual permita cambiar el color del gorro. Claude debe integrar un enlace validado a la paleta, con compatibilidad para recetas anteriores, o mantener inicialmente el color de referencia. No ligar silenciosamente el gorro al color de la camiseta, ni introducir campos libres o códigos HEX en la interfaz.

## Referencias reales y límites

Los SVG y PNG de `referencias/` se componen con el dibujador y catálogo actuales, cargados solo en memoria. Son referencias rasterizadas offline, no capturas del editor integrado. Se han revisado sobre el rostro redondo y los peinados `corto`, `bob` y `corto-dos-bloques`. Los colores son tres muestras de una misma pieza.

Moños, coletas altas y recogidos pueden sobresalir: no se certifican esas combinaciones. No borrar ni alterar el pelo o los avatares ya guardados para resolverlo. Comprobar el encaje con los otros rostros antes de habilitar todas las combinaciones. Este accesorio ocupa la ranura actual de accesorio: no implica poder combinarlo con gafas o auriculares; eso exigiría otra decisión de producto.

## Integración para Claude

1. Releer AGENTS.md, contrato y catálogo vigentes. Añadir, conservando todas las opciones existentes. `catalogo-propuesto.json` es orientativo, no un parche automático.
2. Integrar el nuevo id en catálogo y lista de valores del servidor siguiendo TDD. No modificar el id ni la geometría de las piezas actuales.
3. Dar un namespace único por instancia a `collage-gorro-tejido`, `collage-gorro-copa` y `collage-gorro-vuelta`, reescribiendo las referencias `url(#...)`. Comprobar varios avatares en la misma página.
4. Para Sello Studio, permitir únicamente imágenes incrustadas seguras PNG/JPEG con límites de tamaño y contenido. Mantener bloqueados recursos externos, SVG anidados como imagen y contenido activo. No desactivar el sanitizador completo para aceptar esta pieza.
5. Comprobar miniatura del gorro solo, vista completa, guardado/recarga, cabecera, Connect y sello; exportar PNG/PDF desde la app real.
6. Separar en el informe lo integrado, los tests ejecutados y lo revisado en navegador.

## Verificación realizada fuera del proyecto

- Ambas texturas son grises, 128 × 128 y menores de 20 KiB.
- Coincidencia exacta de bordes del mosaico.
- Recurso PNG incrustado; sin scripts, atributos de evento ni foreignObject.
- Rasterización del SVG y tres composiciones con Sharp.
- Revisión visual de las tres composiciones y del detalle del gorro.

No se han ejecutado los tests de la app ni se ha verificado el editor, Sello Studio o la exportación del navegador. Estos pasos corresponden a la integración de Claude.

## Texto breve que la autora puede pasar a Claude

Revisa este lote 02 y propón la integración aditiva de `collage-gorro-punto`. Conserva todas las piezas y recetas actuales. Sigue LEEME_PARA_CLAUDE.md, especialmente el color, los peinados y los ids de defs por instancia. La referencia está renderizada con el dibujador actual, pero faltan integración, tests y comprobación en navegador. No anuncies canje de monedas por esta pieza; se propone para el conjunto inicial. No añadas captura de ojos personales: la autora ha descartado esa idea.
