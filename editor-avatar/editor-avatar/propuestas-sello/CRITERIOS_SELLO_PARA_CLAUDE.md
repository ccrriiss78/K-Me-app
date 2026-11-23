# Sello personal · criterios de la autora y propuesta visual

Fecha: 22/11/2026. Nota de coordinación de ChatGPT para el trabajo de Sello Studio con Claude. No es una implementación ni sustituye la bitácora o el TECH_SPEC.

## Indicaciones actuales de la autora

- La palabra elegida del catálogo en hangul debe tener el protagonismo.
- No quiere introducir un nombre personal en el sello. Como máximo, utilizar el alias público. Esta indicación actual sustituye la posibilidad de nombre personal recogida en TECH_SPEC §4.1/Q9; trasladar el cambio a la documentación compartida cuando Claude tenga libre su edición.
- Los colores se personalizan con la paleta de la app; los de la lámina son ejemplos.
- Pide prever insultos en el alias. Usar el alias no elimina por sí solo ese riesgo.

## Propuesta visual de ChatGPT, pendiente de aprobación

Lámina generada en la conversación: dos sellos personales con la misma composición, uno blanco/negro/fucsia con alias ficticio `@fan_luz`, otro lavanda/oscuro/claro sin alias.

- Marco rectangular vertical de esquinas redondeadas, conservando la estructura de la marca.
- `우정` (amistad), palabra que ya existe en `app/src/catalogos/hangul.js`, en dos bloques verticales: `우` arriba, `정` debajo. La palabra ocupa la mayor parte del interior.
- Pequeña estrella y rayitas de acento como adornos secundarios, sin tapar el hangul.
- Alias opcional, pequeño y centrado en la parte inferior. Sin un nuevo campo de texto libre para el sello.
- El significado español se muestra fuera del sello como ayuda; no compite con el hangul.
- Los colores de marco, fondo, palabra y adornos proceden de la paleta. La imagen ilustra la disposición; no aprueba una paleta nueva ni constituye un SVG listo para producción.

## Moderación del alias: propuesta, sin implementar

Validar en el servidor al crear o cambiar el alias, con reglas de longitud/caracteres y detección de términos ofensivos y variantes habituales. El sello solo debe reutilizar el alias público que se haya validado, sin permitir introducir otro texto. Un filtro no garantiza detectar todos los insultos; para una comunidad publicada habría que prever también revisión y denuncia. La opción de no mostrar alias evita que aparezca en ese sello, pero no resuelve por sí sola el alias en otras pantallas.

## Registro pendiente de incorporación por una sola herramienta

Base consultada: BITACORA_KME.md R0055, E0055. La autora está trabajando con Claude en el editor del sello. Para no ocupar ahora la documentación compartida, esta nota deja la información preparada para incorporarla a la bitácora y actualizar §4.1/Q9 con su versión correspondiente.

Trabajo de esta sesión: revisión de criterios existentes y del catálogo, consulta del diccionario NIKL y generación de una lámina de disposición con y sin alias. No se modifican app, tests, el catálogo hangul ni los originales de marca. No se ejecutan pruebas de producto porque no se implementa código. El mockup está pendiente de aprobación visual. Sin commit.

Fuente lingüística: https://krdict.korean.go.kr/eng/dicSearch/SearchView?ParaWordNo=26662&nation=eng (우정: friendship). No se añaden palabras al catálogo.
