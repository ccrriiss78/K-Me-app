# Nota temporal · Revisión y diseño de Mis tesoros

22/11/2026 · Para incorporar cuando la autora confirme que la bitácora está libre.

## Base y alcance

- BITACORA_KME.md R0051 / E0051; TECH_SPEC v1.7; AGENTS.md; CLAUDE.md y ambas notas pendientes del editor, leídos.
- Al empezar, Git ya mostraba modificaciones y archivos nuevos de Claude y de anteriores sesiones del editor. Se avisó a la autora y se conservaron. Esta sesión solo crea la carpeta `editor-avatar/editor-avatar/propuestas-tesoros/`.
- Mandato actual: revisión, recuperación de antecedentes A–D, propuestas nuevas E y diseño de T029. La implementación espera aprobación de la lámina. No se escribe en la bitácora ni la especificación compartidas.
- No se tocan Connect, app/src/, estilos de la app, tests anteriores ni los originales. Sin staging, commit, configuración de Git, instalación de dependencias ni publicación.

## Trabajo realizado

- `REVISION_Y_PROPUESTA.md`: auditoría visual y funcional del código, fuentes y límites, tablas A–E y plan posterior de TDD. Se distinguen citas recuperadas de resúmenes; no se inventa una conversación completa ni una aprobación de economía.
- Recuperación histórica: 17/11, «Lo de subir la energía del fandom al 100% me parece muy guay...» y «Sí , solo de los eventos». Confirman la idea y exclusividad históricas, no las reglas ni la entrada de eventos reales en el alcance actual. P014–P018 son ideas de la autora, no propuestas atribuidas a ChatGPT. «Poppys» no se considera nombre confirmado.
- Revisión de las vistas de Entrar, Registro, Mi K-ME y Connect, CSS y dibujos; revisión de catálogo, capas, paletas, marcos e impresión del editor. Observada Mi K-ME en ventana local; al detectarse actividad de la autora se abandona la interacción para no interferir. No se acredita revisión en navegador de las otras pantallas ni de las láminas SVG.
- Tres láminas vectoriales estáticas: apartado Mis tesoros con avatar del renderizador real; plantilla con tres lightsticks originales para conciertos ficticios; ideas de Connect/energía/motivación. Índice HTML para abrirlas sin servidor. Los botones dibujados no funcionan.
- Imagen conceptual adicional mostrada en el chat. Su silueta, navegación y colores interpretados son orientativos y no sustituyen al avatar, logo ni paleta vigentes; las láminas SVG y el informe concretan la propuesta precisa.
- Se enumeran objetos para otros tipos de evento sin dibujarlos.

## Hallazgos y decisiones pendientes

- No se decide ni aplica una unificación estética. Se propone acercar las pantallas al taller cálido del editor, corregir contraste de controles y unificar botones, sin alterar D036–D038.
- Texto blanco sobre el fucsia principal: 4,05:1, insuficiente para AA normal; negro sobre fucsia 5,18:1; blanco sobre fucsia oscuro existente 6,09:1. Borde de campos claro/blanco: 1,34:1.
- Equipación futura independiente de `accesorio` para conservar gafas/auriculares. El editor actual usa un accesorio singular, aunque la especificación admite varios. El agarre no está implementado; se prevén anclajes por anchura y comprobación de los dos marcos e impresión.
- No decidir transferencias de recuerdos: siempre disponible tras ganarlo puede chocar con perderlo al intercambiarlo. Diferenciar trofeo por evento de variantes por fan, todavía sin mecanismo aprobado.
- Corregir documentación obsoleta cuando esté libre: cabecera de bitácora v1.6 / 90 tests / frase T013 pendiente; T025 desfasado frente a la nota de vestuario; frase de TECH_SPEC §5 que aún deja Connect fuera frente a §5.1 y D038. No se han corregido aquí.

## Pruebas ejecutadas

- Sintaxis del nuevo generador correcta y generación completada; los 23 SVG de Connect se leen sin escribirlos.
- Las tres láminas se analizan como XML válido. Comprobación de referencias locales, IDs y ausencia de lógica de producto descrita en el cierre. No se confunde XML válido con revisión artística del renderizado.
- Suite actual del editor: `node --test --test-reporter=tap "tests/*.test.js"`, 119 tests, 116 correctos, **3 fallidos**, 0 omitidos, salida 1.
- Dos expectativas contradicen indicaciones posteriores: miniatura superior mostrando piernas, y ausencia de ombligo con cualquier cintura alta.
- Tercer fallo: camiseta integrada delgada con Pocket Pop inferior delgado, hueco `(173,365)`. El test usa total antiguo y no contempla piel en su criterio, pero el diagnóstico puntual de torso da falso: **posible problema geométrico por revisar**, no descartarlo como mera expectativa antigua. Revisar composición completa antes de cambiar el test.
- No se ejecutan tests de app/. No hay implementación T029 ni nuevos tests funcionales de ella hasta aprobar la lámina.

## Lista exacta de archivos propios de este bloque

Todos bajo `editor-avatar/editor-avatar/propuestas-tesoros/`:

1. `REVISION_Y_PROPUESTA.md`
2. `NOTA_TESOROS_PENDIENTE.md`
3. `crear-laminas.mjs`
4. `ABRIR_PROPUESTA.html`
5. `KME_MIS_TESOROS_PROPUESTA.svg`
6. `KME_LIGHTSTICKS_PLANTILLA.svg`
7. `KME_IDEAS_VISUALES.svg`

Son únicamente los archivos nuevos de este bloque, no todos los cambios pendientes del editor. Claude debe usar esta lista acotada si la autora aprueba incorporarlos; no se prepara ningún commit aquí. Los IDs de sesión, decisión, propuesta y prueba quedan sin asignar hasta incorporar sobre la bitácora vigente, conservando historial y aumentando revisión una sola vez.

## Siguiente paso

La autora revisa y aprueba o corrige el apartado y los lightsticks. Solo después: tests nuevos primero, JSON ficticio separado, equipar/quitar y Deshacer en el editor; servidor y guardado por cuenta posteriores de Claude. Monedas, tienda, intercambios y eventos reales permanecen fuera de este bloque.

## Actualización · dirección artística aprobada y propuesta de cámara · 22/11/2026

Esta actualización matiza el siguiente paso anterior. No se añaden IDs oficiales ni se escribe en la bitácora compartida.

### Decisión expresa de la autora

- La autora expresa que acepta mezclar «unos reales otros mas vectoriales, unos frescos y artisticos otros mas sobrios» y aplicarlo al resto de interfaces si le gusta el resultado.
- Después copia la tabla de las tres direcciones y los detalles de aplicación y responde «y esto ok». Queda aprobada la dirección: **Mi rincón fan** como base del editor y Mi K-ME; **Mi escenario** para eventos y presentación de premio; **Mi álbum vivo** para Mis tesoros; combinar primera y tercera reservando el escenario para eventos.
- Aprueba cambiar la caja genérica por un estuche de fan o álbum abierto; protagonismo del objeto; profundidad suave con papeles superpuestos, sombras y transparencias; detalles gráficos de K-ME; pequeñas respuestas al tocar, con estado directo al reducir movimiento; y un estado vacío cuidado.
- No restringir todos los acabados a ilustración vectorial suave: esa era una recomendación del asistente que la autora amplía expresamente. Conservar marca y paleta actuales; comprobar contraste y manejo de los controles al aplicar la mezcla.
- Esto aprueba una **dirección y sus recursos visuales**, no cada geometría exacta de los lightsticks ni una captura funcional de evento. La lámina anterior no se considera aprobada íntegramente por esta respuesta. La extensión al resto de interfaces sigue condicionada a que le guste la aplicación concreta.

### Idea nueva de la autora: cámara y álbum fotográfico

- Pregunta si en eventos, por ejemplo conciertos, podría hacer una «foto», con zoom y desplazamiento de cámara, y añadir un álbum de fotos de recuerdos. Se registra como propuesta de producto para después del MVP; no se construyen eventos ni servidor.
- Viabilidad: un visor sobre una escena K-ME propia puede desplazar el encuadre y ampliar elementos, y generar una imagen del estado capturado. En 2D esto es encuadre/zoom; cambiar el punto de vista y ver lados nuevos de una escena exige que esos elementos existan en una escena preparada para ello. Un vídeo convencional ya grabado no aporta ángulos que no contenga.
- Límite técnico comprobado en documentación: el reproductor de YouTube vive en un iframe externo; su API permite control de reproducción, pero no ofrece extracción de fotogramas. El acceso entre orígenes y la exportación de imágenes con recursos externos tienen restricciones. Por ello no prometer capturar el vídeo de YouTube dentro de la foto con un botón de K-ME. Diseñar la captura de la escena propia y definir qué aparece donde se muestra el vídeo (por ejemplo, cartel del evento y referencia al momento) como propuesta pendiente.
- Ideas del asistente, no decisiones nuevas: encuadrar/zoom, ocultar controles en la imagen, capturar, previsualizar y guardar o repetir; registrar evento, fecha y hora; conservar una imagen fija del avatar/escena de ese momento; álbum de fotos junto a la colección de objetos, sin mezclar sus datos ni prometer guardado por cuenta antes de Claude.
- Fuentes consultadas el 22/11/2026: https://developers.google.com/youtube/iframe_api_reference ; https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy ; https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image . Consulta documental, sin prueba de captura implementada.

### Archivos y validación de esta actualización

- Solo se actualizan esta nota y `REVISION_Y_PROPUESTA.md`, en la carpeta propia de propuestas. No se cambian las láminas anteriores, código de producto, tests, Connect, paleta ni archivos de Claude.
- Actualización documental: se comprueba presencia de la aprobación, distinción de la cámara como propuesta y ausencia de espacios finales. No se repite la suite al no cambiar código; el último resultado sigue siendo 116/119, con tres fallos pendientes. Sin staging ni commit.

## Aclaración posterior · música de YouTube en eventos · 22/11/2026

- La autora precisa que quiere mostrar música de YouTube en los eventos mediante su API, como han hecho compañeros, cumpliendo sus condiciones. La restricción comentada antes se refería a extraer fotogramas para el álbum, **no** a insertar el reproductor ni a escuchar los vídeos desde él.
- La documentación de YouTube contempla insertar vídeos y listas con su reproductor oficial, mediante iframe o IFrame Player API, sujetos a sus condiciones y disponibilidad de cada vídeo. La Data API serviría para buscar/consultar datos si se necesitara, no sustituye al reproductor.
- Propuesta para K-ME: reproductor visible e íntegro en una zona del escenario, y avatares/reacciones en áreas propias sin cubrir el vídeo ni sus controles. Elegir vídeos que admitan inserción. No extraer solo audio, ocultar el reproductor, quitar anuncios o marcas, ni reproducir como música de fondo con el reproductor oculto.
- La guía de YouTube también prohíbe premiar a usuarios por ver vídeos. Revisar la idea futura de energía/lightstick para no basar recompensas en iniciar/completar reproducciones, minutos vistos ni interacciones de YouTube. Cualquier actividad premiada propia de K-ME necesitará reglas independientes y revisión del diseño concreto; esta consulta no certifica ese futuro sistema.
- Fuentes oficiales verificadas: https://developers.google.com/youtube/player_parameters ; https://developers.google.com/youtube/terms/required-minimum-functionality ; https://developers.google.com/youtube/terms/developer-policies-guide ; https://support.google.com/youtube/answer/171780?hl=es . No se ha implementado ni probado reproducción.
- Único archivo actualizado en esta aclaración: `editor-avatar/editor-avatar/propuestas-tesoros/NOTA_TESOROS_PENDIENTE.md`. Cambio documental; sin repetir tests, tocar bitácora, código, configuración, staging o commit. Se conservan los cambios ajenos observados en Git.

## Encargo de traspaso a Claude · previo del concierto y juegos de luces · 22/11/2026

- Nueva base observada: bitácora R0052/E0052 y TECH_SPEC v1.7. Claude ha terminado la prueba de Connect (T028) y añadido D039; hay cambios suyos pendientes que se conservan. No se edita la documentación compartida desde ChatGPT.
- La autora propone contar las reacciones en el encuentro **previo** a los vídeos, como emoción anticipada de los fans, y obtener el lightstick entonces para usarlo en ese mismo concierto con juegos de luces según la música. Solicita expresamente un prompt con lo hablado para pasárselo ella a Claude e incorporarlo donde corresponda.
- Se crea `PROMPT_PARA_CLAUDE.md` en esta carpeta. Reúne dirección artística aprobada, T029 y sus límites, fase previa propuesta, lightstick con luces, reproducción oficial de YouTube, cámara/álbum y cuestiones futuras. Pide a Claude integrar documentación sobre la versión vigente y coordinar los archivos compartidos; no programar ni hacer commit.
- No se afirma que mover las reacciones al previo garantice cumplimiento: la política de YouTube incluye incentivos indirectos. Conservar el premio aunque no se vea el vídeo y no bloquear el acceso al vídeo tras una meta son salvaguardas propuestas por ChatGPT, todavía por revisar, no aprobaciones atribuidas a la autora.
- La API oficial ofrece tiempo y estado, no audio crudo o detección de ritmo. Una coreografía propia con hitos temporales es una posibilidad técnica sugerida que requiere revisión; no es una sincronización ya construida ni una autorización de YouTube. Distinguir luces locales de sincronización entre asistentes; no tapar el reproductor, extraer audio ni añadir destellos rápidos.
- Fuentes verificadas: https://developers.google.com/youtube/iframe_api_reference y https://developers.google.com/youtube/terms/developer-policies . Sin prueba funcional nueva.
- Archivos propios de este bloque: **nuevo** `editor-avatar/editor-avatar/propuestas-tesoros/PROMPT_PARA_CLAUDE.md`; **actualizado** `editor-avatar/editor-avatar/propuestas-tesoros/NOTA_TESOROS_PENDIENTE.md`. Solo documentación. Validación de contenido y espacios finales; sin tests de producto, staging, commit ni envío de mensajes a Claude.
