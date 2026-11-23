# Entrega de ChatGPT · Sello Studio

22/11/2026. Trabajo solicitado por la autora a partir del encargo de Claude (T033). No se han modificado servidor, catálogos, migraciones, tests de app ni `_sello.ejs`.

## Adornos listos para que los incorpores al catálogo

- `/img/sello/motivos/estrella.svg`
- `/img/sello/motivos/nota.svg`
- `/img/sello/motivos/rayitas.svg`

Los tres tienen `viewBox="0 0 24 24"`, fondo transparente y una sola tinta negra. Usan `fill="#000"` o `stroke="#000"`, para que el servidor sustituya la tinta. La estrella es de cinco puntas, la nota es doble y las rayitas reproducen el gesto inclinado de K-ME. Aprobación visual de su dibujo concreto pendiente; no se han añadido al catálogo desde ChatGPT.

## Vistas y script

Se han diseñado `sellos.ejs`, `sello-editor.ejs` y `_muestras-color.ejs`, con CSS propio al final de `estilos.css`, limitado al sello. Se mantienen los campos, los valores, CSRF, selected/checked y los textos que comprueban tus tests. El nombre de la creación sigue siendo privado y no se dibuja en el sello. Los colores proceden del catálogo vigente.

El editor muestra el sello en un panel lateral que queda fijo al bajar en escritorio; a 760 px pasa a una columna. Las muestras son radios nativos, con nombre accesible, navegación por teclado y marca de foco visible. Los botones principales son negros con texto blanco; los acentos conservan el fucsia de marca. Se conserva la regla general de reducir movimiento. La revisión real del ancho de 390 px y del contraste calculado en navegador queda pendiente: no se presenta la inspección de CSS como una prueba visual superada.

`app/public/js/sello.js` ya está enlazado como archivo externo. Usa el contrato que has incorporado a `vistaPrevia`:

```text
GET /studio/sellos/vista-previa?<opciones>&sello=<id al editar>
Accept: application/json
200: { svg, avisos, ayuda: { hangul, lectura, significado } | null }
400: { error }
```

- Actualiza dibujo, ayuda y avisos y anuncia el resultado mediante aria-live.
- Espera 220 ms, cancela peticiones anteriores e ignora respuestas que llegan fuera de orden, también durante esa espera.
- No envía el nombre privado de la creación, CSRF ni versión por GET.
- Los errores se insertan como texto. Una respuesta no válida conserva la última vista previa y lo indica explícitamente.
- Valida que lo insertado sea un SVG sin código activo ni enlaces externos.
- Muestra «Tienes cambios sin guardar» y activa beforeunload. Ver una vista previa no marca guardado. Restaurar exactamente las opciones iniciales retira el aviso; los errores y conflictos del servidor entran marcados como pendientes.
- Sin JavaScript se conservan los envíos originales de «Ver cómo queda» y «Guardar».

La respuesta JSON que has añadido durante este trabajo ya aparece en el controlador. No lo he editado.

## Recortes propuestos, con margen

**Método:** cotas conservadoras de geometría SVG, puntos de control de curvas, transformaciones, trazos y clips. No son límites ajustados a los píxeles visibles. Se ha revisado todo el catálogo de rostros, peinados, accesorios, cuerpos, superiores e inferiores (incluido calzado), y las combinaciones de 11 peinados × 3 acabados × 4 modos de mechones: **234 casos**. Las variaciones independientes se reúnen por su envolvente; no se han generado todas las combinaciones cartesianas. El script no usa navegador, red ni dependencias nuevas.

| Encuadre | Cota conservadora del contenido: izquierda, arriba, derecha, abajo | viewBox propuesto |
|---|---|---|
| Solo rostro, con todo el pelo | 36,75 · 6,60 · 348,25 · 356,25 | `25 -5 350 370` |
| Cuerpo entero | 36,75 · 6,60 · 348,25 · 433,40 | `25 -5 350 450` |

Ambos conservan el eje horizontal en x=200 y dejan **al menos 8 unidades** sobre estas cotas; se redondean hacia fuera. El origen y=-5 da aire por encima del pelo, sin mover el avatar. La ventana puede extenderse fuera del lienzo; ese espacio queda transparente. Usar `preserveAspectRatio="xMidYMid meet"`.

Los recortes anteriores no se pueden confirmar como seguros: el rostro `55 8 290 300` deja fuera pelo largo y cotas laterales; el cuerpo `60 0 280 450` no cubre todas las cotas laterales. Los propuestos son deliberadamente más amplios; se debe confirmar su equilibrio visual antes de cerrarlos como definitivos.

**Importante para «solo rostro»:** no basta con recortar el SVG del cuerpo entero. La ventana necesaria para conservar pelo largo llega hasta y=365 y mostraría ropa si se dibujan todas las capas. Pasa también:

```js
const capasRostro = [
  'pelo_atras', 'cabeza', 'maquillaje', 'ojos', 'maquillaje_detalles',
  'cejas', 'boca', 'pelo_frente', 'accesorio'
];
const svg = svgDelAvatar(catalogo, recetaNormalizada, {
  conFondo: false,
  soloCapas: capasRostro,
  recorte: '25 -5 350 370',
});
```

Hoy los cuatro accesorios del catálogo son de cabeza o «ninguno». Si se añaden accesorios de mano, habrá que clasificarlos antes de reutilizar esta lista. Para cuerpo entero, omite soloCapas y usa `recorte: '25 -5 350 450'`.

Reproducir las medidas:

```text
Desde editor-avatar/editor-avatar/:
node scripts/medir-encuadres.mjs
```

Resultado detallado: `propuestas-sello/MEDIDAS_ENCUADRES.json`. No se ha modificado `app/src/catalogos/sello.js`: actualízalo tú con sus tests si aceptas las propuestas.

## Receta y renderizado del avatar en Node (T034)

La receta es un objeto JSON con los campos de `datos/kme.json → porDefecto`. No es el HTML ni el SVG. Sus claves actuales son:

```text
version, rostro, cuerpo, cejas, grosorCejas, piel,
ojos: { estilo, color }, boca,
maquillaje: { sombra, labial, sombraEstilo, labios, grosorLabios,
  colorLabios, delineado, brillo, gemas, colorSombra, colorDelineado,
  colorBrillo, colorGemas, colorRubor, mejillas },
pelo: { estilo, color, acabado, mechones, mechon1, mechon2, mechon3 },
ropa: { arriba, colorArriba, abajo, colorAbajo }, accesorio, fondo
```

`normalizarAvatar(receta, catalogo.porDefecto)` completa claves omitidas y descarta las desconocidas según los valores por defecto. **No es una validación de seguridad:** no comprueba que ids, tipos o colores pertenezcan al catálogo. Eso se debe validar en el servicio del servidor antes de guardar o dibujar. Los colores del editor actual son valores hex internos, elegidos de sus paletas; los del sello usan ids de su catálogo. No hay que confundir ambas recetas.

**Corrección a la suposición de TECH_SPEC/CLAUDE:** `Catalogo` y `svgDelAvatar` YA funcionan en Node si se precargan los datos y archivos. Se ha comprobado sin document, window, Image ni canvas. No hace falta cambiar el renderizador para generar SVG.

1. Leer el JSON local y precargar solo los archivos propios que referencia el catálogo. Normalizar `capas` a arrays, igual que hace el cargador actual; incorporar también las piezas fijas si existen.
2. Construir `new Catalogo(datos, archivos)`, con el interior de cada SVG en el Map y las mismas claves que usa el JSON.
3. Normalizar y validar la receta de la cuenta.
4. Llamar a `svgDelAvatar(catalogo, receta, { conFondo: false, recorte, ... })`.

La función que sí depende del navegador es `cargarCatalogo`: usa `document.baseURI` y fetch. `crearRenderizador` la llama. Para SVG de servidor, usa directamente la clase y `svgDelAvatar`. La exportación PNG del editor usa Image/canvas/document; esa parte no funciona en Node tal como está.

**Sí, dentro del sello debe ir sin fondo propio:** `conFondo: false`, para conservar visible el fondo que el fan eligió para el sello. El catálogo actual no tiene una capa de fondo visible, pero el flag ya funciona y se ha comprobado con una capa de prueba.

El SVG lleva ids para estilos, clips y texturas. Al reutilizarlo varias veces en una misma página, usa ids únicos; no clones la misma cadena con ids repetidos. Se mantienen los colores del avatar y la copia guardada por el sello.

## Reutilizar la impresión (T035)

**Sí, puedes copiar y adaptar el generador a app sin tocar la carpeta del editor.** `crearPdfPhotocard` es una función pura que recibe bytes JPEG y sus dimensiones; para copiarla necesita también `formatosPhotocard` y `formatoPhotocard`.

Precaución concreta: `svgPhotocard` está preparado para AVATARES y fuerza `viewBox="60 0 280 450"`. No debe aplicarse así al sello: recortaría su composición. Adapta el encaje al lienzo del sello, **354 × 507**, conservando entero el marco, la proporción y el tamaño final de 55 × 85 mm. Tampoco necesitas copiar las importaciones del renderizador ni las funciones de ventana/PNG si solo reutilizas el constructor del PDF.

## Validación y límites

- Seis tests nuevos del script en `tests/sello-interfaz.test.js`: fallaron antes de implementar el comportamiento y pasan después.
- Dos tests de compatibilidad en `tests/avatar-sello-node.test.js`: SVG en Node, fondo omitido y cabeza sin ropa/calzado; correctos.
- `npm test` en app, última ejecución de E0059: **122/122, 0 fallos y 0 omitidos** (incluye el trabajo paralelo de Claude; antes, en E0058, 119/119). Tests de app intactos por parte de ChatGPT.
- Conjunto completo del editor, última ejecución de E0059: **137/137, 0 fallos y 0 omitidos**. Bitácora registrada en **R0058, E0059**; queda libre de nuevo para Claude.
- `_sello.ejs` conserva su huella: `c13f14212769122cb2e6b8eb88d04fed35576bfed48a936f64b94fe214b40a42`.
- La revisión visual en navegador quedó bloqueada por revisión automática: detectó una conexión de telemetría de Visual Studio no autorizada. No se ha repetido ni sorteado esa vía. Por eso no se afirman capturas, pruebas a 390 px, contraste computado en navegador ni una prueba real de la vista previa dinámica.
- Se entregan vistas estáticas portátiles con datos ficticios: `KME_SELLO_EDITOR_REVISION.html`, `KME_MIS_SELLOS_REVISION.html` y `KME_SELLOS_VACIO_REVISION.html`. No guardan ni sustituyen las páginas de la app.

Pendiente para Claude: incorporar los adornos y recortes con sus tests, T034 y T035. Pendiente de revisión: el aspecto real, móvil y teclado, y confirmar en navegador los recortes conservadores. Sin commit.

## Ajuste posterior · 23/11/2026 (E0059)

- El botón accion=vista permanece en el HTML, sin hidden de origen: funciona sin JS y el test 13 se conserva.
- sello.js lo oculta después de instalarse; si faltan capacidades o nodos, mantiene el formulario original. CSS respeta hidden dentro de Sello Studio.
- Si la respuesta se redirige o no es JSON, el script deja de interceptar y envía el formulario con accion=vista, conservando campos, CSRF y versión. No guarda automáticamente, no entra en bucle y una respuesta antigua no puede activar este respaldo.
- Si la validación nativa impide el envío, vuelve a verse el botón y se mantiene el aviso de cambios pendientes.
- Siete tests nuevos en tests/sello-respaldo.test.js: correctos. Los seis tests anteriores del script siguen intactos y correctos.
- La respuesta JSON del servidor y su test 19b son trabajo de Claude; esta nota no sustituye el registro que él hará a continuación. La bitácora está libre desde R0058.

## Diseño A+C elegido por la autora · 23/11/2026 · E0063

La autora elige de momento el mockup A+C y exige coherencia del tratamiento entre pantallas (D047, TECH_SPEC v1.11). Se aplica el orden de A: sello grande a la izquierda, categorías a la derecha y guardado tras las opciones. Se combinan pincel, papel rasgado fucsia y trama. Los controles comparten base de identidad con la app; los originales de marca no se alteran.

Archivos propios de esta actualización (sin staging ni commit):

- `app/public/css/identidad.css`: nuevo; tokens, controles comunes y presentación A+C de editor, colección y estado vacío. Se carga después de estilos.css.
- `app/public/img/identidad/collage.svg`: nuevo recurso decorativo; nunca entra en el SVG personal guardado o exportado del sello.
- `app/public/js/sello-paneles.js`: nuevo; categorías con teclado y mejora progresiva. No interviene en peticiones, guardado o aviso de cambios.
- `app/src/views/_cabecera.ejs`: carga el CSS compartido; conserva el logo y los formularios de sesión.
- `app/src/views/sello-editor.ejs`: categorías Contenido/Colores/Detalles, avatar y alias desplegables, nombre privado y guardado a la derecha. Sin JS las tres secciones quedan visibles. Campos, valores y CSRF se conservan.
- `app/src/views/_muestras-color.ejs`: parámetro opcional para empezar una paleta abierta. Colores del catálogo completos, incluidos los del logo.
- `editor-avatar/editor-avatar/tests/sello-paneles.test.js`: cuatro tests nuevos; anteriores intactos.
- `editor-avatar/editor-avatar/scripts/revisar-sello-ui.mjs`: incorpora ambos CSS y el collage en las revisiones offline; elimina los scripts de producto.
- `editor-avatar/editor-avatar/propuestas-sello/KME_SELLO_EDITOR_REVISION.html`, `KME_MIS_SELLOS_REVISION.html` y `KME_SELLOS_VACIO_REVISION.html`: regenerados, ficticios, estáticos y sin guardado.
- `BITACORA_KME.md` y `docs/TECH_SPEC.md`: R0062/E0063 y v1.11, con la decisión y los límites de validación.
- Esta nota de entrega.

Validación: app **122/122**, editor **141/141**, cero fallos y omitidos. Cuatro tests nuevos: rojo de comportamiento 3 fallos/1 correcto; verde 4/4. Contrastes calculados: 17,40:1 en botón compartido, 5,18:1 en pestaña fucsia con negro y 4,77:1 en borde de campo sobre blanco. Los tests anteriores de vista previa y sesión caducada siguen pasando. `_sello.ejs` mantiene su huella anterior. No se afirma una nueva revisión visual del diseño en navegador ni a 390 px; la prueba V071 de Claude corresponde a la presentación anterior. La generación offline inicial termina correctamente; la repetición posterior escribe las tres vistas y se interrumpe al permanecer abierto el proceso, como recoge E0063.

Comprobación final del generador: se eliminan espacios sobrantes al final de línea de la salida EJS y se regeneran los tres HTML con **salida 0**. `git diff --check` queda correcto después de esta limpieza; no se modifica la estructura de las vistas por ese motivo.

La integración de adornos y recortes ya la hizo Claude en E0060; no sigue pendiente. Continúan T034, T035 y la revisión visual del nuevo resultado. Bitácora libre después de E0063. La base común no acredita un rediseño completo de las demás pantallas ni modifica el editor autónomo del avatar.

## Corrección visual de la autora · E0064 · 23/11/2026

D048, TECH_SPEC v1.12: la autora rechaza el collage detrás de los sellos porque compite con ellos. `identidad.css` desactiva los pseudo-elementos de fondo en las miniaturas y en la vista previa y deja esas áreas blancas; también se retira del estado vacío. El SVG decorativo queda conservado, sin uso. La identidad se mantiene en cabeceras, tipografía, subrayados, botones y detalles exteriores (numeración con pequeño acento fucsia y separador de acciones). No se cambia geometría, colores elegidos, receta, formularios o JavaScript.

Se regeneran los tres HTML de revisión. App **122/122**, sin fallos ni omitidos; generador y git diff --check con salida 0. No se repite el conjunto del editor por esta corrección solo visual ni se afirma una nueva comprobación de navegador. Archivos de este ajuste: identidad.css, los tres HTML de revisión, esta nota, TECH_SPEC y bitácora. R0063/E0064; bitácora libre; sin commit.
