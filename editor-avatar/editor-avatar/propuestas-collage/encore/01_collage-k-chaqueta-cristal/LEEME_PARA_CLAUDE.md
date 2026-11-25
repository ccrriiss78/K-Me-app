# 01 · Chaqueta Cristal Stage

Entrega gráfica externa, 25/11/2026. La autora aprobó las seis propuestas visuales ENCORE con «Me gusta adelante». No se ha escrito en el proyecto, su catálogo, sus tests o su bitácora. Esta entrega sustituye la propuesta gráfica anterior de esta misma familia cuando se decida integrar; comprobar primero si Claude llegó a integrar aquella versión para evitar duplicados.

## Pieza y familia

- Familia: collage-k-chaqueta-cristal.
- Parte del avatar: superior; zona propuesta: ropa_arriba.
- Archivos/ids propuestos:
- svg/collage-k-chaqueta-cristal-delgado.svg → collage-k-chaqueta-cristal-delgado (delgado, relajado).
- svg/collage-k-chaqueta-cristal-medio.svg → collage-k-chaqueta-cristal-medio (medio, recto).
- svg/collage-k-chaqueta-cristal-grueso.svg → collage-k-chaqueta-cristal-grueso (grueso, amplio).
- Delgado → relajado; medio → recto; grueso → amplio. En piezas universales se reutiliza el mismo archivo.

## Montaje

Ropa de arriba. data-capa="perfil", "torso" y "superior"; gruposPorCapa: anatomia→perfil, torso→torso, ropa_arriba→superior. perfilIntegrado=true, topCorto=false; conservar el ajuste vigente a las cinturas y350/y370. Los tres SVG incluyen el perfil continuo, cuello y brazos actuales. No duplicar el cuerpo.

Conservar contornos redondeados y la proporción pequeña del cuerpo frente a la cabeza. El acabado de material se concentra en zonas de la prenda; no sustituye su silueta ilustrada.

## Color

ropa.colorArriba; clases f-arriba, f-arriba-claro y f-arriba-oscuro. Sin campo nuevo.

Las texturas incrustadas son grises con transparencia, no imágenes coloreadas. Se han usado únicamente valores decorativos existentes de K-ME y metales neutros. No añadir campos HEX ni selectores libres. Un futuro cambio de color de accesorios exige decisión expresa y un campo propio que Claude integre con compatibilidad de recetas.

## Catálogo y canje

Precio orientativo: **25 Kpopis**, modalidad propuesta: canje. La autora ha aprobado el diseño; el precio continúa **pendiente de confirmación**. Cobrar por familia completa, nunca por cuerpo. catalogo-propuesto.json es documentación orientativa, no un parche para copiar automáticamente. No reemplazar Top Destello, Chaqueta Denim Collage ni los lotes 01–05. Usar el probador sin gasto y el sistema de propiedad/canje del servidor.

## Lienzo, miniatura y materiales

- SVG de producción: viewBox="0 0 400 480", con title.
- Miniatura completa: viewBox="118 284 164 73"; grupo superior. referencias/miniatura.svg es solo una referencia recortada, no debe copiarse como recurso de producción.
- PNG originales preparados: texturas/. Cada PNG incrustado coincide con su original y tiene como máximo 20 KiB y 256 px por lado.
- IDs y referencias propios con prefijo collage-. Mantener el namespace por dibujo del renderizador.
- manifest.json registra pesos, medidas, hashes y procedencia. Las fuentes generadas de mayor resolución están en fuentes/ de la carpeta general.
- Sin personas reales, fotografías de terceros, marcas de ropa, merchandising oficial ni regeneración de logos.

## Referencias

referencias/TRES_SILUETAS.png y los tres PNG individuales muestran la pieza sobre el avatar actual mediante render offline. referencias/PIEZA.png y DETALLE.png proceden de los SVG entregados. La lámina conceptual aprobada está en la carpeta general; los vectores se adaptan a las proporciones y anclajes del editor, por lo que esa lámina no se utiliza como una imagen pegada sobre el avatar.

## Comprobaciones y pendientes

Consultar VERIFICACION.json y COMPROBACIONES_GENERALES.json de la entrega general. Incluyen únicamente las comprobaciones que efectivamente se han ejecutado fuera: XML, seguridad del SVG, ids/referencias, neutralidad y límites de PNG, render y geometría aplicable. Las imágenes de las tres siluetas se han revisado visualmente. La chaqueta se comprueba por muestreo central con dos cinturas y tres colores, no mediante una prueba exhaustiva de todas las combinaciones.

**Pendiente de Claude:** integración en el editor y el catálogo, ranuras y combinaciones, otros rostros y poses, cambios de color en la paleta, guardar/recargar, presentación, perfil/Connect, sello y exportación PNG/PDF en navegador. También probador sin gasto, propiedad por cuenta, canje por familia y conservación de recetas anteriores. No se ha ejecutado npm test ni la suite de la app; esta entrega no acredita esas funciones.

Git status no pudo verificarse en esta sesión: la carpeta accesible no se reconoce como árbol de trabajo. No se afirma que esté limpia. No se han hecho commits ni push.
