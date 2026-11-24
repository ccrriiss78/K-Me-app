# Entrega gráfica K-ME · collage · lote 01
Estado: recursos gráficos preparados FUERA del proyecto; integración pendiente de Claude. No ejecutar una copia masiva ni sustituir recursos existentes.

## Contenido
- Pieza nueva `collage-falda-bolsillos`: Falda con bolsillos de tela, capa ropa inferior (`ropa_abajo`), selección `ropa.abajo`. Tres SVG de 400 × 480 para cuerpos relajado, recto y amplio.
- Pieza nueva `collage-lightstick-estudio`: Lightstick de estudio, capa accesorio. Tres variantes de colocación para los mismos cuerpos. El archivo sin sufijo es una copia de la variante delgado, no otra opción de catálogo.
- Texturas PNG en grises y transparencia, todas incrustadas mediante data:image/png;base64 en los SVG.
- Referencias PNG/SVG compuestas con el catálogo y dibujador existentes, en memoria, sin editar el repositorio.
- `catalogo-propuesto.json`: descripción aditiva para integrar, NO catálogo completo para sustituir el actual.
- `manifest.json`: medidas, pesos, origen, comprobaciones y límites.

## Falda con bolsillos de tela
- Contorno y piernas basados en los tres SVG de falda existentes de K-ME, sin modificarlos. Bolsillos y material nuevos.
- Cintura y=350; las formas copiadas conservan las coordenadas existentes.
- Bolsillos: y=361 a 388; ancho proporcional a la cintura; sus coordenadas exactas están en cada SVG.
- El color usa la clase existente `f-abajo`. El fucsia del atributo fill es solo el respaldo de vista previa; el CSS del avatar lo sustituye por el color permitido elegido.
- Tejido SOLO en los bolsillos. Se repite en mosaico de 12 × 12 unidades de lienzo; ajustar esa escala requerirá una revisión visual.
- `denim-gris-128.png`: fuente monocroma de 128 × 128, 9.712 bytes.
- `denim-sombra-128.png`: derivado negro con transparencia, 128 × 128, 8.724 bytes; es el que usa el SVG.
- Aplicación por transparencia: color de base + sombra negra en alpha. No necesita mix-blend-mode ni feBlend.
- Los bordes opuestos de ambos mosaicos coinciden píxel a píxel. Esto evita un salto en el borde, pero no demuestra por sí solo repetición visual imperceptible a cualquier escala.
- Las puntadas blancas y los contornos tinta son detalles vectoriales neutros; no incluyen un segundo color de tejido fijo.

## Lightstick de estudio
- Diseño ficticio original: cabeza de resina con material generado, mango y correa vectoriales. No es merchandising oficial ni lightstick de un evento.
- Lienzo 400 × 480. Cabeza local x=272..330, y=242..328; mango local x=293..310, y=322..377.
- Cada variante desplaza el grupo completo: delgado (-47,15), medio (-39,15), grueso (-31,15).
- Incluye un pequeño agarre vectorial con la clase existente f-piel. Revisado visualmente con las camisetas integradas de referencia de los tres cuerpos. Otras prendas, brazos y peinados requieren comprobación.
- `resina-sombra-160x240.png`: negro con transparencia, 160 × 240, 9.109 bytes.
- `resina-luz-160x240.png`: blanco con transparencia, 160 × 240, 12.795 bytes.
- Aplicación por transparencia, recortada en la cabeza: base clara con tinte, sombras negras, inserto vectorial y luces blancas. Sin imágenes externas, filtros SVG ni modos de mezcla.
- COLORES FIJOS PROPUESTOS EN ESTA VERSIÓN: tinta #282126, blanco cálido #fffaf7 y fucsia de marca #e83475. Son colores ya presentes. El acento está marcado con data-zona-color="acento", pero NO se ha inventado una clave nueva de receta para cambiarlo. Si la autora quiere elegirlo, Claude debe acordar y probar el enlace a la paleta.
- No dar por decidido precio, disponibilidad inicial ni condición de desbloqueo.

## Origen y derechos
- Los tejidos y la resina se generaron con ChatGPT/image_gen para esta entrega el 24/11/2026. No contienen fotos de personas, marcas de ropa ni recursos externos.
- Reducción, paso a grises/alpha y compresión realizados como preparación técnica de exportación.
- No se atribuye licencia CC0 a imágenes generadas. Uso sujeto a las condiciones aplicables del servicio.
- Las siluetas, piernas y personajes de referencia proceden de los recursos propios del proyecto K-ME; se conservaron sus geometrías. Los nuevos detalles de bolsillos y lightstick se prepararon para esta entrega.
- Ningún logotipo de K-ME fue alterado ni incluido como trazo redibujado.

## Integración para Claude
1. Leer primero el estado vigente y conservar el trabajo en curso. No sobrescribir imágenes, piezas, ids ni recetas anteriores.
2. Revisar esta entrega y añadirla en una carpeta nueva de recursos cuando corresponda. Las rutas de catalogo-propuesto.json son relativas a este paquete: adaptarlas al destino.
3. Añadir los dos ids nuevos al catálogo y a la validación, con TDD. Mantener todos los anteriores y porDefecto.
4. La familia de falda agrupa prenda y piernas, conforme al mecanismo existente gruposPorCapa/reemplazaCapas/indicePorCuerpo. No añadirla solo como una capa encima de un pantalón.
5. Los defs/pattern/clipPath tienen ids estáticos en los ficheros: asignar un prefijo único por instancia cuando se compongan varios avatares en un mismo documento y reescribir todas sus referencias. No reescribir piezas antiguas por esta entrega.
6. Permitir en la vista previa del sello solo los tipos de imagen incrustada que se hayan validado: PNG de este lote, bytes decodificados válidos, dimensiones y peso limitados. Mantener rechazados recursos remotos y contenido activo.
7. Probar el renderizador real de navegador, conversión a PNG y PDF, sello y avatar dentro del sello. El render offline de esta entrega no sustituye esas pruebas.
8. Probar propiedad por cuenta, persistencia de nuevas opciones y conservación de recetas antiguas.
9. Si se habilita catálogo de Kpopis: probar sin cobrar al previsualizar, confirmar el canje, persistir propiedad y evitar cargos duplicados. No convertir la vista previa en propiedad adquirida. Estas reglas de producto deben concretarse con la autora.

## Comprobado en esta entrega
- Texturas en gris, menor o igual a 256 px por lado y menos de 20 KiB cada una.
- Bordes opuestos del mosaico denim coincidentes.
- SVG sin scripts, foreignObject, manejadores de eventos ni href externos.
- Render offline de referencias completas con Sharp/libvips y el dibujador actual.
- Variantes de los tres cuerpos y tres colores existentes de la paleta.
- La cabeza del lightstick está incrustada y el material queda en su recorte.
- No se ejecutaron pruebas de la app ni migraciones, ni se cambió su base de datos.

## No certificado todavía
- Integración del editor, catálogo, guardado y desbloqueos.
- Sanitizador de Sello Studio.
- Exportación por el navegador y PDF real.
- Todos los cruces de brazos, prendas y peinados.
- Presentación en miniaturas de cabecera y muro.
- Rendimiento del avatar completo en páginas con muchas publicaciones.
La falda incorpora una textura usada; el lightstick incorpora dos. Base64 añade aproximadamente un tercio al tamaño de esos datos. Las referencias PNG grandes NO deben usarse como texturas dentro del avatar.

