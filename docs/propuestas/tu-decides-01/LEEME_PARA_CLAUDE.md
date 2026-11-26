# K-ME · TÚ DECIDES — propuesta gráfica

Estado: propuesta de dirección artística para revisar con la autora. No es una decisión aprobada ni una implementación. Solo Claude edita el proyecto.

## Los tres iconos

- **tu-decides-exchange.svg** (653 bytes): Una camiseta y un lazo, unidos por dos flechas: intercambiar piezas de la colección.
- **tu-decides-my-stage.svg** (775 bytes): Un personaje inventado actúa sobre una pequeña plataforma. La persona fan es la protagonista.
- **tu-decides-fan-events.svg** (737 bytes): Tres lightsticks originales en alto: energía compartida, encuentro y comunidad. No reproducen merchandising oficial.

Originales vectoriales dibujados para K-ME por ChatGPT; sin fotografías, material externo ni merchandising. Colores: negro #000, blanco #fff y fucsia #E83475. Fondo transparente. Contorno redondeado de 2,4 unidades; detalles faciales mínimos sin contorno. No incorporan logotipos ni las rayas del logo.

## Comprobaciones

- viewBox 0 0 48 48, sin width/height en la raíz. Menos de 4 KB por archivo.
- Solo svg, g, path, circle, rect, ellipse, line, polygon. Sin texto, imágenes, scripts, enlaces, estilos, fuentes, filtros ni degradados.
- Rasterización correcta. Límites de los dibujos comprobados en comprobaciones.json.
- vista-previa.png presenta cada icono a 48 y 32 píxeles sobre blanco y #fdecef. La revisión visual se hace sobre esta lámina; no es una comprobación en Chrome ni de la integración.
- Claude debe completar los tests de integración, foco, teclado, contraste de textos y revisión en Chrome real. Los iconos acompañan títulos visibles y llevan alt vacío; no sustituyen la etiqueta del radio ni el nombre de la propuesta.

## Propuesta de composición

Los dos PNG propuesta-* son maquetas, no capturas del producto. Usan el logotipo existente sin redibujarlo y un avatar renderizado con el editor actual, con una cuenta ficticia. El avatar es demostrativo: conservar siempre el avatar real elegido por cada cuenta y todos sus controles actuales. La textura pertenece al gorro existente; los tres nuevos iconos no contienen imágenes.

### Escritorio

- Contenido centrado, max-width 1120 px; márgenes laterales mínimos 24 px.
- A partir de 1152 px de viewport: columnas 272 px / espacio restante, separación 24 px. Identidad a la izquierda, votación a la derecha.
- Votación: padding 24 px. Tres tarjetas en fila solo cuando cada una pueda medir al menos 240 px; gap 12 px. Si no caben, apilar. La maqueta muestra tarjetas de 250 × 190 px; las alturas reales crecen según contenido y zoom.
- Bajar la prioridad de la fecha de alta. Mostrar antes el avatar y el alias. Mantener los textos y acciones actuales, incluido quitar imagen y sello si existe.

### Móvil y tamaños intermedios

- Por debajo de 1152 px: identidad encima y votación debajo. Margen 16 px. No encerrar las tarjetas en sucesivos contenedores con padding acumulado.
- Identidad móvil: avatar de 96 × 116 px junto al alias/bienvenida; acción inferior de al menos 44 px. No recortar ni alterar el avatar guardado. Si no hay avatar, conservar el estado vacío y sus indicaciones. Si hay sello, mantenerlo y sus acciones con el mismo orden lógico.
- Iconos 40 px móvil /48 px escritorio, en la cabecera junto a Propuesta futura; no una fila independiente. Reservar 24 px a la derecha para la marca de selección. En anchos estrechos, permitir que el título envuelva sin solaparse.
- Tarjeta móvil orientativa 155 px de alto, padding 14 px y gap 12 px; usar min-height o altura automática, nunca cortar texto para encajar. Cuerpo de texto real recomendado 14 px y line-height 1.45; la maqueta es orientativa.
- Aviso de voto con padding 12 px y texto 14 px; 36–48 px según salto de línea. Mantener role=status y el mensaje actual.
- Botón único del formulario de al menos 44 px; mantener radios reales, sus valores, CSRF y lógica existente. Conservar el texto ¡Esta es mi favorita! y porcentajes reales.
- Navegación opcional: primera fila de 64–72 px y una segunda fila horizontal desplazable de 44 px, con etiquetas completas. La maqueta deja asomar la siguiente opción: mantener todos los destinos actuales, foco visible y desplazamiento del elemento enfocado; no ocultar Mi escenario. Evitar añadir un menú nuevo. Este cambio requiere revisión propia.

### Jerarquía y carácter

Una sola tarjeta de identidad y un área de votación con aire, sin marco fuerte adicional dentro de otro marco fuerte. Negro para estructura; fucsia para selección y pequeños acentos. No introducir otra tipografía ni paleta. Mantener el subrayado original del título en la app; el de la maqueta solo señala su posición. No usar el trazo de la maqueta para sustituir el original.

La selección conserva fondo #fdecef, borde fucsia de 2 px y check visible. Sombra fucsia moderada de 2–3 px. No depender solo del color. Iconos de peso parecido para no favorecer visualmente ninguna opción.

Mis tesoros, Mis Kpopis, los sellos y el resto del contenido existente continúan debajo; las maquetas no los desarrollan. No eliminar funciones por no aparecer en ellas. No construir Exchange, actuaciones ni eventos nuevos: siguen siendo propuestas futuras.

## Entrega e integración

Copiar solo los tres SVG a public/img/tu-decides/ y enlazar los tres ids del catálogo actual. No copiar las maquetas como interfaz ni como imágenes de los iconos. Primero enseñar la propuesta a la autora. El rediseño es opcional y requiere su elección; integrar los iconos puede hacerse por separado.

Origen: los tres iconos son dibujos originales generados mediante código por ChatGPT para este proyecto, disponibles para que la autora los incorpore y modifique. Los recursos existentes del logo/avatar se reutilizan únicamente en las maquetas de la propia app; no se les asigna una licencia nueva.

Revisión visual realizada sobre los PNG generados: las tres siluetas se distinguen a 32 px en ambos fondos; sin recortes en los límites. Se han revisado también ambas maquetas tras ajustar el espacio entre textos y barras. No se ha ejecutado la app ni se ha probado esta composición con zoom, teclado o dispositivos reales. La maqueta simplifica algunos elementos de cabecera: conservar el saldo y su icono actuales, el avatar y todos los destinos de navegación al integrar.

