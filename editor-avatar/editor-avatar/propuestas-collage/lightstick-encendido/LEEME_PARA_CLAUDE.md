# Lightstick de estudio — variante encendido

DECISIÓN CONFIRMADA: añadir una variante elegible encendido; conservar la opción actual y todos los avatares guardados. La instrucción anterior de iluminar todos queda expresamente descartada.

## Entrega

Tres SVG completos 400 × 480 con las variantes corporales delgado, medio y grueso; vista-previa.png y detalle-encendido.png. Dibujos preparados para integrar, todavía no conectados al catálogo ni al servidor. Se reutiliza el accesorio real del proyecto (id collage-lightstick-estudio), no el recuerdo Luz Hangul 001, que es otra pieza.

Nuevo id propuesto: collage-lightstick-estudio-encendido. Nombre: Lightstick de estudio · encendido. Capa accesorio, misma zona y ranura que el original. Copiar los metadatos de selección de variante corporal del original y cambiar exclusivamente id, nombre y rutas. No reutilizar su id actual ni sobrescribir sus archivos. No migrar recetas antiguas. La variante encendida debe ser incompatible con la normal en la misma ranura de mano, siguiendo las reglas existentes. Conservar el criterio de disponibilidad/colección del original; no inventar precio ni desbloqueo.

## Acabado

Luz fija blanca dentro de la cabeza de resina, halo rosa de baja opacidad y reflejo blanco recortado en ella. Dos radialGradient y una curva blanca; sin filtros, scripts, animación ni archivos externos. Color de luz rosa #e83475; núcleo blanco y borde #ffb8dc. El halo se limita a una elipse local 76 × 102 alrededor de la cabeza: excede unos 9 px lateralmente y 9 px por arriba. Puede solaparse de forma transparente con una pequeña parte de la prenda; no altera la mano. Revisar el encaje con prendas/cuerpos antes de integrar. El núcleo y el reflejo están dentro del clip existente. No hay nueva textura: se conservan las dos imágenes PNG originales incrustadas, con idénticos bytes.

Se conservan los transforms y el agarre exactos de cada variante. Los nuevos ids internos empiezan por collage-lightstick-encendido- para no colisionar con el original. El prefijo por instancia que use el editor debe cubrir también los ids de los gradientes y sus referencias url(#...).

## Validación y tareas de Claude

Comprobado: rasterización de los tres SVG con Sharp, igualdad de texturas y agarre, conservación de transforms y vista previa generada con el renderizador real usando reemplazos SOLO EN MEMORIA. Las huellas de los originales y tamaños están en comprobaciones.json. No se ha modificado código, catálogo, tests o bitácora, ni ejecutado la app.

Añadir id al catálogo y validación del servidor según el contrato vigente. Tests relevantes: selección/guardado/recarga de la nueva opción; ninguna receta antigua cambia; elección por cuerpo; exclusión en ranura de mano; PNG/PDF y vista previa de sello conservan la luminosidad. Revisar a tamaño pequeño y con las tres variantes corporales.

El saneador del sello debe admitir únicamente las definiciones internas necesarias (radialGradient, stop, stop-color, stop-opacity, offset y referencias locales) si actualmente las rechaza. No relajar reglas generales ni habilitar URLs externas. Si fuera preferible un recurso raster incrustado para compatibilidad, pedir una alternativa a ChatGPT antes de eliminar la luz.

Las reglas de iconos de TÚ DECIDES no se aplican a esta pieza del editor. No confundir esta variante con el lightstick-recuerdo ni cambiar otros lightsticks. Mostrar resultado real y registrar únicamente lo integrado.

Origen: derivación gráfica de ChatGPT sobre el SVG y texturas existentes de K-ME, autorizada por la autora.
