# K-ME · Lote 06 · Colección K — Encore

25/11/2026. Ocho familias gráficas nuevas, preparadas fuera del proyecto. «Encore» y los nombres de las piezas son propuestas para revisar con la autora. No se ha editado código, catálogo, tests ni bitácora de K-ME.

## Dirección artística y coherencia

La autora ha pedido expresamente mantener la identidad de K-ME. Se usan sus proporciones de avatar, contornos de tinta redondeados, blanco cálido y acentos fucsias. Los colores alternativos de prendas proceden de la paleta existente; no crean una segunda identidad de marca. Se conserva el protagonismo del fan.

El collage es selectivo: cristales en los paneles de la chaqueta y las gemas; satén suave en la falda y el lazo; bolso negro con detalles fucsias, espacio limpio para la photocard y un peluche gris con acabado textil. No llenar todas las superficies de brillo. No convertir la colección en una interfaz diferente ni cambiar tipografía, controles o paleta de la app.

Los logotipos y sus trazos no se han usado, regenerado ni alterado. No añadir una K inventada para marcar las piezas.

Las fotografías comerciales consultadas son referencias de uso: portaphotocards colgantes, ventanas transparentes, lazos y muñecos sujetos a bolsos. Ninguna fotografía de internet se incorpora a los SVG.

## Contenido

Consultar **FICHAS_PIEZAS.md**, **catalogo-propuesto.json**, **TEXTURAS.json**, **ARCHIVOS.json** y **VERIFICACION.json**.

- Ocho familias: chaqueta, falda, pendientes, pulseras, pines, bolso con photocard, Rizo y lazo.
- Variantes de prendas y accesorios de cuerpo para las tres siluetas.
- Anclajes alternativos de pulseras para camiseta integrada.
- Composiciones opcionales de bolso + Rizo para una ranura única.
- Cinco PNG de material preparados en gris/alpha; todos <=256 px y <20 KiB.
- SVG en lienzo 400 × 480 con las imágenes incrustadas.
- Lámina de piezas, detalles individuales y conjuntos sobre avatares actuales.

## Catálogo y contrato: NO es un parche automático

Los gráficos están preparados, pero los datos orientativos deben adaptarse al contrato vigente. Los campos `pieza` de las prendas reutilizan la estructura actual. En accesorios se proponen zonas de colocación, no categorías ya construidas.

En la inspección inicial del trabajo había una sola selección `accesorio` y D071 recogía el deseo de combinar varios. Releer el estado actual: Claude puede haber avanzado mientras se preparaban estas piezas.

Las referencias combinan las piezas **solo en memoria**, con el dibujador actual. No prueban que el editor real permita seleccionar pendientes, pulseras, bolso, lazo y pines a la vez. Integrar el sistema que corresponda al estado vigente sin perder recetas anteriores ni inventar que la combinación ya funciona.

Rizo es un colgante de bolso. No ofrecerlo flotando solo sobre el avatar: debe tener un soporte visible. Se incluyen `composicion-bolso-encore-rizo-*.svg` como alternativa de una sola selección, si la autora prefiere un conjunto. No publicar simultáneamente un conjunto y sus componentes con condiciones de propiedad incoherentes.

## Colores

Chaqueta: `ropa.colorArriba`, con sus variantes claro/oscuro existentes. Falda: `ropa.colorAbajo`. Conservan la paleta y el selector actuales.

Los accesorios tienen clases separadas para futuras vinculaciones de color: `f-k-pendientes`, `f-k-pulseras`, `f-k-pines`, `f-k-bolso`, `f-k-lazo`. **No hay una ruta de color creada por este paquete.** El catálogo orientativo usa `rutaColor: null`: no asociarlos al color de la camiseta ni al del gorro. Si se habilitan colores, hacerlo con valores de la paleta y compatibilidad con recetas antiguas.

Los SVG traen colores de referencia dentro de la paleta: tinta, fucsia y blanco cálido. Metales en gris/blanco; ribetes, botones, interior de chaqueta y lazos pequeños en blanco cálido. Rizo conserva su material gris generado. No hay un color libre ni campos HEX para el usuario.

## Anclaje y capas

- Pendientes: referencia del rostro redondo, junto a x86/x314 y la zona de las orejas. Revisar otros rostros y el orden frente/detrás del pelo.
- Lazo: sobre el pelo, en el lateral superior derecho. Revisar gorras, gorros y peinados.
- Pines y pulseras: **delante de la ropa**, con posibilidad de superponerse a las mangas. No recortarlos al interior de la prenda.
- Pulseras: archivos principales ajustados a los brazos de perfil continuo de la colección; variantes `-camiseta-*` para la camiseta integrada. Comprobar el resto de poses y mangas; no resolver todos los brazos con un desplazamiento supuesto.
- Bolso y colgante: posiciones distintas según cuerpo; el bolso lleva correa visible desde el hombro.
- El recorte de rostro debe excluir bolso, colgante, pulseras y pines del torso; mantener únicamente los accesorios de cabeza/orejas que encajen. Reutilizar o ampliar el criterio actual de zonas con tests.

## Photocard y peluche

La tarjeta lleva **un personaje ilustrado ficticio de muestra**. No es una foto de una persona real ni una función de subida de fotos. Sustituir esa muestra por el avatar del fan sería otra integración, no algo ya implementado.

Rizo es un diseño generado de un muñeco de artista ficticio: pelo suave, rostro bordado y lazo. No representa a un idol real ni es merchandising de un grupo. El nombre es provisional; no se promete que no exista otro uso del nombre en el mercado.

## Peso, imágenes y exportación

Cada pieza usa un PNG de material; el conjunto de las ocho familias suma **8 elementos image**, contando la fotografía de Rizo. La luz y sombra de cada tejido se combinan en un único PNG gris con alpha para limitar el coste.

El filtro actual de Sello Studio limita a 8 imágenes por dibujo. Los conjuntos mostrados respetan ese límite. Mezclar todos estos accesorios con otras prendas fotográficas que usan dos imágenes puede excederlo: comprobar las combinaciones. No desactivar el filtro ni aumentar límites a ciegas. Si conviene deduplicar materiales compartidos, conservar el namespace y demostrarlo con tests.

Todos los ids propios empiezan por `collage-`. Reutilizar el namespace por instancia del dibujador. No se añaden enlaces externos, scripts, animaciones ni fuentes web.

## Colección K y canje

La autora quiere estas piezas para Colección K, canjeables con Kpopis. Adaptarlas al sistema de canje vigente, por familia y con las variantes corporales incluidas, conservando la validación y la propiedad por cuenta.

**No hay precios nuevos aprobados en este lote.** Reutilizar la economía vigente y presentar los precios propuestos a la autora antes de fijarlos. El ZIP contiene gráficos, no migraciones ni lógica de gasto. El probador debe permitir ver la pieza sin consumir monedas; el servidor confirma la propiedad y el canje.

No sustituir Top Destello, Chaqueta Denim Collage ni los otros artículos actuales.

## Pruebas y cierre

Hecho fuera del proyecto: validación de los 26 SVG, ids/referencias, PNG incrustados y límites; gris exacto y bordes repetibles de las texturas; rasterización de las tres siluetas; 8 imágenes por conjunto; revisión visual de la lámina y conjuntos.

Se ejecutan las 3 pruebas existentes de `cuerpos-expresivos.test.js` en una copia externa que añade las dos familias de prendas. Resultado: **3 de 3 pasan**. Los tests originales no se editan.

Pendiente de Claude: integración aditiva, TDD del catálogo/servidor/canje, combinación de accesorios y colores, todos los rostros/poses, miniaturas, guardar/recargar, perfil, Connect, sellos y exportación PNG/PDF en el navegador. No se ha ejecutado la suite completa de la app.

Mantener las piezas actuales intactas. Registrar solo el trabajo real y sus resultados. No hacer commit ni push sin autorización de la autora.
