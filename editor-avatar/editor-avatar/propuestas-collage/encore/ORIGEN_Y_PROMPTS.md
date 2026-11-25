# Origen y prompts creativos

Herramienta: image_gen integrada (sin CLI ni API propia).

## Lámina aprobada

Continuar la colección K-ME Encore a partir de sus ocho piezas y de los avatares actuales. Crear una lámina de seis paneles: chaqueta fucsia con paneles de cristal; falda negra con pliegues de satén y cadena de estrellas; par de pendientes de cristal facetado; brazalete metálico ancho sobre manga; bolso acolchado con portaphotocard ficticia y peluche original Rizo; lazo fucsia de satén. Mantener contornos de tinta redondeados, proporciones K-ME, paleta existente y acabados fotográficos selectivos. Sin logos nuevos o personas reales.

## Atlas de materiales

Una imagen horizontal con exactamente tres tercios iguales contiguos, sin bordes ni texto: satén negro/gris con trama fina y pliegue diagonal; pequeños cristales circulares transparentes facetados en filas, base gris; acero cepillado plateado con grano horizontal y bandas de reflexión. Todo estrictamente gris, macro fotográfico, sin objetos o marcas.

## Rizo

Recorte de producción del muñeco ficticio de la lámina aprobada, sin bolso, aro o cadena. Cabeza grande y redondeada, pelo corto rizado suave, un rizo en la frente, ojos bordados cerrados sonrientes y boca alegre; cuerpo pequeño, lazo al cuello y ropa plisada. Figura entera de frente, peluche táctil fotográfico, gris exacto, sin personajes comerciales ni persona real. Fondo transparente y sin sombra de suelo.

## Preparación técnica

construir.mjs recorta el atlas en tercios, reduce hasta 256 px como máximo, transforma la luminancia en una superposición neutra de luz/sombra con alpha y comprime el PNG para respetar 20 KiB. Rizo conserva su transparencia generada; se reduce y neutraliza RGB de forma exacta. Los originales de resolución completa se conservan en fuentes/. Los detalles vectoriales no se obtienen trazando el bitmap: se construyen en SVG para conservar la anatomía y los colores del editor.

Estos son los prompts creativos normalizados y el método utilizado; no incorporan instrucciones del sistema.

## Iris fotográfico sintético

Generar un disco circular frontal de iris sintético, original y gris, con finas fibras radiales de aspecto macro fotográfico; abertura circular central de 30% y exterior transparentes. Sin pupila, brillo, ojo completo, piel, pestañas, rostro o persona real. La pupila y el brillo se conservan como vectores existentes.
