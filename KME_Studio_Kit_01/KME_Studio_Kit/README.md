# K-ME Studio · Kit gráfico 01

Abre `editor.html` en un navegador para probar el editor. Es un archivo autónomo con todas las piezas incrustadas. `assets/` contiene las ilustraciones editables que usa el montaje.

## Catálogo

| Control | Opciones |
|---|---|
| Cuerpo | Masculino con chaqueta deportiva y cargo, femenino con chaqueta corta y falda-pantalón |
| Rostro | Redondo, alargado y cuadrado |
| Ojos | Almendrados, redondos y horizontales |
| Boca | Media sonrisa, risa, canto y temblor |
| Cabello | Flequillo asimétrico y moño fucsia |
| Pose | V de photocard y concierto con lightstick |
| Emoción | Neutro, alegría, tristeza con lágrima anclada al ojo y vergüenza con rubor translúcido |

Los rasgos y los peinados son comunes a los dos cuerpos. La emoción ajusta la apertura del ojo y puede proponer una boca. El fan puede elegir otra boca. Cada cuerpo tiene su propio conjunto de mangas y manos por pose. El lightstick se dibujó con el puño que lo sujeta y forma parte de la pose. Los pendientes forman parte del rostro.

## Dirección de arte

Redibujo vectorial de cuerpo entero a partir de la lámina aprobada. Se trabajaron las masas negras del cabello, mechones asimétricos, brillos de tinta, marcas de mejilla fucsias y ropa de concierto. Las tres familias tienen siluetas y coordenadas propias de rasgos. El acabado de este primer kit es de tinta vectorial limpia con trazos de pincel simplificados. Los bordes secos, la textura del papel y las manchas pictóricas de la referencia quedan para una siguiente pasada de arte. El encabezado del editor usa texto y el kit no incluye una recreación del logotipo.

## Guía para Claude

1. Lleva `assets/`, `manifest.json` y `composer.js` a la app. Conserva las rutas relativas de las piezas que figuran en el catálogo. `editor.html` sirve para ver la demo y `editor.template` contiene su código editable.
2. Carga `composer.js` en el cliente. Recoge los catálogos de `manifest.json` para poblar controles con `id` y `label`. Construye un diccionario que relacione cada ruta con los hijos de su elemento SVG. Puedes hacerlo en el build como en `build.py`, o leer únicamente las rutas del catálogo empaquetado, por ejemplo con `DOMParser` y `documentElement.innerHTML`.
3. Pasa el catálogo, diccionario y selección a `KMEAvatar.compose`. El resultado es un SVG completo con grupos `data-layer`. Úsalo con los assets propios del proyecto. Las opciones del usuario se resuelven por IDs del catálogo.
4. Para persistencia, recomiendo guardar en PostgreSQL la versión del catálogo y la selección de IDs. Al cargarla, usa `KMEAvatar.normalize` para recuperar valores válidos si falta un ID. Si se expone un endpoint de escritura, valida los IDs contra el manifiesto también en Express.

```js
const selection = {
  bodies: 'short',
  faces: 'round',
  eyes: 'round',
  mouths: 'laugh',
  hair: 'bun',
  poses: 'v',
  emotions: 'joy'
}
const svg = KMEAvatar.compose(manifest, assets, selection)
```

### Coordenadas y capas

- El lienzo de montaje es `0 0 320 420`. Pelo, rostro, cuello, torso, piernas, calzado y brazos ya vienen registrados en esas coordenadas. Los anclajes de cuerpo, accesorio y pelo están documentados para dibujar futuras piezas.
- Ojos, cejas, bocas y efectos cercanos a la cara usan un origen local `(0, 0)`. El compositor los coloca usando `face.anchors`. Refleja el ojo y la ceja derechos en torno a dicho anclaje.
- `layerOrder` define el orden de pintado. Los brazos quedan debajo del torso para que el hombro cierre la unión. El pelo se divide en frente y nuca. Los efectos de lágrima y rubor son capas transparentes independientes.
- `draw.py` reconstruye las ilustraciones y el manifiesto. Si editas los SVG directamente, ejecuta solo `python build.py` para actualizar la demo. Si modificas el dibujo en el generador, ejecuta primero `python draw.py` y luego `python build.py`.

## Comprobaciones realizadas

- Composición con las piezas finales y renderizado automatizado de las 1.152 combinaciones de IDs, a 160 × 210 píxeles, con Sharp. Todas generan una imagen con contenido visible. No se detectaron píxeles en el borde del lienzo.
- Inspección visual de las tres láminas de `revision/`. Contienen 76 montajes de prueba. La primera cruza las 24 variaciones de cuerpo × rostro × cabello × pose. La segunda cruza 36 variaciones de rostro × ojos × emoción. La tercera cruza 16 variaciones de boca × emoción. En cada lámina, las combinaciones aparecen en el orden de `manifest.json`, con la categoría situada más a la derecha de las enumeradas variando más rápido.
- `Dos-avatares.png` muestra las dos combinaciones iniciales recomendadas, a mayor tamaño.
- El editor incluye selección interactiva, guardado local y exportación transparente SVG y PNG (960 × 1260). Chromium no se pudo iniciar en el entorno de verificación. Quedan pendientes la ejecución en un navegador real, la inspección a tamaño móvil y la prueba de descarga con un clic.
- Finger heart, corazón con ambas manos, accesorios seleccionables y acabados adicionales quedan fuera de este primer catálogo.
