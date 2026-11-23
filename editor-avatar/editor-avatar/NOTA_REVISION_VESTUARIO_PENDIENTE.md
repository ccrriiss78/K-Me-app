# Anotación pendiente de incorporar a la bitácora

Documento temporal, fuera del próximo commit. No sustituye a BITACORA_KME.md.

## Base y coordinación

- Base consultada: R0046, última sesión E0046; AGENTS.md, CLAUDE.md y TECH_SPEC v1.6.
- No se escribe en la bitácora compartida mientras no se confirme que Claude ha terminado de editarla. La pregunta sobre su disponibilidad sigue pendiente.
- La sesión no puede escribir en `.git`; no se hace staging, commit ni push.
- Al comenzar solo estaba pendiente la nota temporal anterior. Los demás cambios de esta ampliación son propios del editor.

## Indicaciones de la autora

- Confeccionar los ocho conjuntos a partir de su lámina: Cargo Beat, Denim Layer, School Remix, Racing Pop, Pocket Pop, Ribbon Punk, Denim Star y Stage Noir.
- Añadir cabello inspirado en ella, conservando lo anterior; después pide dos cortos más, un semirrecogido desenfadado con greñas y acabado de acuarela.
- Señala con capturas brazos separados del cuerpo, torso incompleto en tops y fallos de integración de piezas. Pide revisar las combinaciones, las miniaturas de Tamaño y añadir el punto sutil del ombligo cuando se vea abdomen.

## Trabajo guardado

- 48 SVG de ropa: ocho conjuntos, dos partes independientes y tres anchuras. No se retiran las prendas anteriores ni se cambian las paletas.
- Se corrige la primera adaptación: brazos elípticos que llegan hasta el hombro y torso de piel continuo, dibujado detrás de las prendas inferiores. Cuello y brazos permanecen en la capa superior; no se duplican piernas ni zapatos.
- El torso se limita a la cintura elegida al renderizar. Se acortan los tops, se ajustan sus detalles y se añade el ombligo como un punto de sombra de piel, con altura adaptada a cintura alta o baja.
- Las miniaturas de ropa y Tamaño incluyen el torso. Las de cabello dejan sitio para las trenzas y mechones largos.
- Elegir una parte inferior nueva conserva también la camiseta, sudadera o chaqueta anterior. Se comprueba el orden inverso.
- Ocho peinados adicionales, cada uno con capa trasera y frontal: cortinas con textura, coleta ondulada, dos moños con lazos, trenza lateral, media melena ondulada, corto despeinado, corto en dos bloques y semirrecogido con greñas. Se conservan los tres originales.
- Selector Tinta/Acuarela en Cabello. La acuarela añade pigmento vectorial dentro del contorno original, conserva el color elegido, admite Deshacer y se incluye en exportación y normalización del avatar. El guardado por cuenta sigue siendo trabajo pendiente de integración, no realizado aquí.
- Se regeneran KME_ABRIR_MUESTRA.html y la comparación KME_VESTUARIO_LAMINA.html/SVG. Los scripts permiten regenerarlas.

## Pruebas ejecutadas

- TDD: las nuevas comprobaciones de extremidades fallan antes de la corrección; las de peinados/acuarela, ombligo y mezcla con prendas antiguas fallan antes de su implementación correspondiente. Después pasan.
- Un muestreo de superficies SVG con curvas y transformaciones verifica uniones de hombros/brazos y mezcla de partes nuevas y anteriores, incluyendo piernas/calzado y detección de superficies flotantes. Se recorren 504 secuencias de composición en tres anchuras.
- Se mantienen las 192 comprobaciones de cintura de los conjuntos nuevos.
- Última suite: `node --test --test-reporter=tap "tests/*.test.js"`, desde el editor: 103 pruebas, 101 correctas, 2 fallidas, 0 omitidas, salida 1. No declarar el conjunto como superado.
- Fallos pendientes de aprobación para actualizar tests existentes: el test antiguo de 432 elecciones incluye ahora la colección nueva y presupone cintura cubierta; otro exige que no aparezca ombligo con cintura alta, contrario a la nueva indicación si se ve abdomen. No se modifican esas pruebas sin aprobación.
- 64 SVG nuevos válidos como XML. Sintaxis del JavaScript de la muestra autónoma comprobada con `vm.Script`. `git diff --check` correcto.
- La revisión visual final no se ha completado desde el navegador del asistente: HTTP local agotó el tiempo y la apertura `file:` fue rechazada por la política del navegador. No se cambia la seguridad ni se busca un atajo. Las capturas aportadas por la autora son las evidencias visuales disponibles; falta su revisión de la muestra regenerada.

## Pendientes para incorporar sin inventar IDs

- Actualizar T025 como en curso: prendas incorporadas, corrección de uniones aplicada, revisión artística final pendiente.
- Registrar las nuevas indicaciones de cabello, acabados y ombligo; conservar el historial de la primera versión defectuosa y su corrección.
- Registrar resultados reales y las dos autorizaciones de tests todavía pendientes. No cerrar T024 ni T027.
- Asignar E/D/V y aumentar revisión solo al incorporar sobre la bitácora vigente, una vez esté libre de edición concurrente.

## Revisión posterior: cintura común y cabello mate

- La autora vuelve a señalar diferencias de ancho entre torso y cintura, pide comprobar todas las mezclas y muestra una referencia de cabello mate de acuarela. Rechaza expresamente el acabado anterior, que parecía plástico brillante.
- Se localiza el desajuste: la escala general de los SVG nuevos no coincidía con los semianchos de cintura de las prendas anteriores. Se sustituyen las aproximaciones por los bordes comunes 170/230, 162/238 y 154/246 para delgado, medio y grueso. La transición al hombro y al calzado conserva sus anchuras; las coordenadas de las prendas quedan explícitas en SVG.
- El torso llega con el mismo ancho a pantalones y faldas, incluidos los modelos anteriores. Las nuevas prendas inferiores usan una costura horizontal común y medio píxel de solape para evitar rendijas de antialiasing. Se comprueban 336 combinaciones de cintura.
- Se elimina del dibujo renderizado la segunda silueta de abdomen superpuesta, causante de líneas verticales y de una cintura distinta. Se conserva un solo torso de piel continuo, detrás de la ropa inferior.
- El ombligo usa un punto de 1,45 unidades con el tono de pecas derivado de la piel para que sea sutil pero visible. Queda sobre piel descubierta y por encima de la cintura elegida.
- Las miniaturas superiores muestran también la parte inferior actual: permiten valorar el encaje real en vez de mostrar un torso aislado y cortado.
- El cabello en Acuarela retira los reflejos blancos pulidos y los degradados luminosos. Emplea pigmento irregular de baja opacidad, grano y fibras vectoriales de papel, dentro del contorno original. No utiliza filtros ni imágenes; Tinta se conserva. La semejanza artística con la referencia no se da por aprobada: falta la revisión visual de la autora sobre esta versión.
- TDD: las cuatro comprobaciones nuevas (tres de cintura/ombligo/miniaturas y una del acabado mate) fallan antes de sus cambios. En el ajuste de cintura se detecta además un solape numérico de borde en una comprobación previa; se corrige con el medio píxel de costura, sin cambiar ese test.
- Última ejecución completa: 107 pruebas, 105 correctas, 2 fallidas, 0 omitidas; salida 1. Persisten únicamente las dos expectativas anteriores ya descritas. Las pruebas existentes siguen sin cambiar mientras no se aprueben sus ajustes.
- Los 48 SVG de prendas se validan como XML, el JavaScript de la muestra autónoma tiene sintaxis válida y `git diff --check` es correcto. Muestra autónoma y lámina regeneradas.
- Aparecen cambios ajenos en el registro de la app (controlador, vista, CSS y tests); se informa a la autora y se mantienen intactos. No se hace commit ni se toca la configuración de Git.

## Aprobación artística posterior e implementación de mechones

- Nueva base leída: bitácora R0048/E0048, con el registro terminado por Claude. No se modifica el archivo compartido sin confirmar que esté libre.
- La autora rechaza todavía el vestuario y el encaje del cabello. Pide un mockup antes de modificar de nuevo esas geometrías. Se generan dos láminas de propuesta: cuerpo con un único perfil superior y seis peinados. No se aplican esas propuestas al editor, pues su aprobación continúa pendiente.
- Pide que el acabado del pelo use pinceladas de diferentes tonos, difuminados graduales y marcas de pincel visibles. Se muestra una comparación A/B/C. Elige B y pide conservar la otra opción como alternativa; solicita mechones de distintos colores.
- Se muestra un mockup con mechones frontales, varios tonos y color entre capas. Después de verlo, la autora dice «aplícalo»: autoriza esta implementación de cabello, no la nueva geometría de cuerpo y vestuario.
- Implementado `js/kme-cabello-pinceladas.js`: trazos curvos y veladuras longitudinales, marcas de cerdas y degradados lineales ligados al color base, sin luces circulares ni recursos externos. Se conservan Tinta y Acuarela anteriores.
- Tres colocaciones de mechones y opción Sin mechones. Dos colores independientes en Frontales, tres en Varios tonos/Entre capas. Los colores se escogen mediante muestras de la paleta existente; no se añaden tonos ni códigos que deba escribir el fan.
- Cada trazo se recorta por la superficie original de cabello y se inserta respetando su orden, para no colorear cara, lazos o accesorios. El acabado B se activa al elegir mechones; también se puede seleccionar solo. La base original se conserva con Tinta al restaurar.
- Elegir/quitar mechones, cambiar colores y acabado admite Deshacer. Las preferencias sobreviven al cambio de peinado y a la normalización de la composición; guardar por cuenta sigue pendiente de Claude.
- TDD: cinco pruebas nuevas de `tests/mechones-color.test.js`, inicialmente 0/5, después 5/5. Cubren once peinados y las tres colocaciones, independencia de colores, normalización, valores rechazados y unicidad de IDs en exportación/miniaturas.
- Se regenera la muestra autónoma. Se añaden `scripts/comparar-mechones.mjs` y `KME_MECHONES_REALES.html/.svg`, hechos con los SVG del renderizador, para revisar el resultado real y distinguirlo del mockup ilustrado.
- Suite completa: 112 pruebas, 110 correctas, 2 fallidas y 0 omitidas; salida 1. Persisten las dos expectativas ya pendientes de autorización (432 elecciones y ausencia de ombligo en cintura alta). No se modifican tests existentes.
- No se cambian recursos de cuerpo/vestuario en esta implementación. No se hace staging, commit, push ni cambios de configuración.

### Ajuste de tamaño de los mechones

- La autora pide mechones más grandes porque los iniciales resultan demasiado finos. Se amplían todas las colocaciones: frontales de 17 a 38 unidades; varios tonos de 17/19 a 38/40; entre capas y partes traseras pasan de 7–13 a 18–30. Se mantienen recortes por el cabello, colores independientes y acabado B.
- Se ejecutan las cinco pruebas de mechones: 5/5 correctas. Se regeneran muestra autónoma y comparación real. `git diff --check` correcto. No se repite la suite completa por este ajuste visual de anchura.
- Se detecta `app/tests/logo-entrada.test.js` como trabajo ajeno y se conserva intacto.

## Revisión del vestuario retomada el 22 de noviembre de 2026

- Base consultada: bitácora R0049/E0049 y especificación vigente. La autora pide retomar la ropa porque algunas piezas todavía no se adaptan al cuerpo. Se corrige la integración de los ocho diseños existentes; no se aplica un cambio general de proporciones del mockup anterior.
- Las 24 partes superiores nuevas pasan a mostrar un perfil continuo de piel: cuello, hombros, brazos y torso. Los marcadores anatómicos separados se conservan en el recurso para compatibilidad, pero se eliminan de la composición visible; no se dibujan brazos ovalados independientes ni un segundo abdomen.
- Se suaviza el contorno de hombros y mangas. Los detalles de chalecos, solapas y lazos quedan recortados dentro del contorno de cada prenda para impedir que sobresalgan como piezas flotantes.
- El bajo de las prendas largas se adapta a la cintura alta o baja de la parte inferior seleccionada. Se mantienen los tops cortos y el ombligo sutil cuando queda abdomen visible, con sus tres anchuras.
- Nuevo módulo `js/kme-ajuste-ropa.js`, integrado en catálogo, generador y muestra autónoma. Se regeneran los 48 recursos de ropa y la comparación de vestuario. El hash conjunto del cabello antes y después de regenerar es idéntico: esta revisión no modifica los peinados ni los mechones.
- TDD: las dos pruebas nuevas de `tests/ropa-perfil-unico.test.js` fallan primero y pasan tras la corrección. Comprobación dirigida junto con cintura y extremidades: 7/7 correctas; incluye las 336 combinaciones de cintura y las secuencias de unión de extremidades.
- Suite completa ejecutada: 114 pruebas, 112 correctas, 2 fallidas, 0 omitidas; salida 1. Persisten las dos expectativas existentes pendientes de autorización descritas arriba. No se modifican esos tests ni se declara toda la suite superada.
- Se genera `KME_REVISION_SILUETAS.png` con un rasterizador auxiliar de geometría SVG, sin navegador, para revisar los ocho conjuntos en los tres grosores. La inspección de esa lámina muestra brazos conectados, cinturas alineadas y ombligo en los tops. Es una revisión aproximada de geometría; no sustituye la revisión artística en el navegador, que sigue pendiente.
- Sintaxis del JavaScript de la muestra autónoma válida; 69 SVG de los directorios de ropa analizados como XML sin errores; `git diff --check` correcto.
- Durante el cierre aparecen cambios ajenos en BITACORA_KME.md, CLAUDE.md y `app/tests/limite-entrar.test.js`. Se informa y se conservan intactos. La bitácora compartida no se modifica: esta anotación queda preparada para incorporar cuando esté libre. Sin staging, commit, cambios de Git ni cambios en la zona de Claude.

## Ampliación de bocas, miniaturas y tops · 22 de noviembre de 2026

- Base documental releída: R0050/E0050 y TECH_SPEC v1.6. El estado inicial de Git muestra los cambios previos del editor; los cambios anteriores de Claude ya no aparecen pendientes. No se modifica su zona ni la bitácora compartida.
- La autora pide más bocas para expresar sentimientos, especialmente tristeza y desánimo. Se comprueba que solo había sonrisa pequeña, risa y asombro. Se conservan sus SVG y se añaden ocho bocas: tristeza suave, desánimo, puchero, preocupación, incomodidad, enfado contenido, serenidad y sonrisa tímida.
- Cada boca nueva tiene una curva distinta, combinable con los ojos. El pigmento suave copia su contorno exacto; conserva los tres grosores, la paleta existente, quitar color y Deshacer. Se añaden ocho SVG, `scripts/crear-bocas-emociones.mjs` y comparación real `KME_BOCAS_EMOCIONES.html`. Ninguna boca nueva se activa por defecto.
- TDD de bocas: dos pruebas nuevas fallan por ausencia de tristeza, luego pasan. Se comprueban también selección mediante los botones, normalización y conservación de ojos. Una comprobación previa del maquillaje esperaba que el atributo d fuera el primero: se conserva ese formato en los recursos nuevos sin modificar el test.
- Durante el trabajo, la autora señala Stage Noir y pide que el menú de partes superiores muestre solo la prenda. Se elimina la superposición de una segunda chaqueta con otras mangas: ahora el contorno común lleva dos solapas interiores contenidas en él. Corregido en las tres anchuras.
- Las miniaturas superiores muestran únicamente la ropa superior, sin cuello, brazos de piel, abdomen, pantalón, falda ni calzado. Recorte ajustado a la prenda; el avatar grande conserva su cuerpo completo. Esto sustituye expresamente la decisión anterior de mostrar todo el conjunto en esas miniaturas.
- La autora pide más variedad de tops. Se añaden cinco cortes, cada uno en tres anchuras: Órbita de un hombro, Halter de escenario, Top deportivo, Top cruzado y Camiseta corta holgada. Son 15 SVG nuevos, compatibles con las prendas inferiores disponibles, con perfil de cuerpo continuo y ombligo cuando queda abdomen visible. Mantienen colores independientes y Deshacer.
- Tres pruebas nuevas de miniaturas, solapas y tops fallan antes de implementar; después pasan. Último grupo dirigido (bocas, cuerpos expresivos, miniaturas y nuevos tops): 8/8 correctas. Grupo previo de bocas, maquillaje y miniaturas: 13/13 correctas.
- Última suite completa: 119 pruebas, 116 correctas, 3 fallidas, 0 omitidas; salida 1. A las dos expectativas pendientes anteriores se suma la prueba que pide mostrar el conjunto inferior en la miniatura superior, contraria a la nueva petición. No se cambia ningún test existente sin aprobación; no declarar la suite en verde.
- Muestra autónoma y lámina de vestuario regeneradas. Revisión geométrica auxiliar de los cinco tops y de Stage Noir en tres anchuras mediante PNG; revisión artística final en el navegador por la autora pendiente. Sintaxis de la muestra válida; 66 SVG de boca, ropa superior y pigmento de labios válidos como XML; `git diff --check` correcto.
- Archivos de esta ampliación: catálogo, muestra autónoma, pigmento de labios, ocho bocas SVG, 15 tops SVG, tres Stage Noir SVG, generador de vestuario, renderizador, vista visual, generador de bocas, comparación de bocas, lámina de vestuario, rasterizador auxiliar y sus PNG, dos archivos nuevos de tests y esta nota. Sin staging, commit, instalación de dependencias ni cambios de paleta.
