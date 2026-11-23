# Encargo para Claude · decisiones visuales y propuestas de eventos K-ME

Fuente: conversación de la autora con ChatGPT del 22/11/2026. Este encargo pide **incorporar y ordenar documentación**, no programar eventos, monedas, tienda, intercambios, cámara ni álbum fotográfico.

## 1. Lee y coordina antes de escribir

1. Ejecuta git status y conserva intactos los cambios ajenos. Lee AGENTS.md, CLAUDE.md, la revisión, última sesión y pendientes actuales de BITACORA_KME.md, y docs/TECH_SPEC.md.
2. ChatGPT comprobó como base R0052/E0052 y TECH_SPEC v1.7; **relee la versión vigente**, puede haber cambiado. No des por pendientes las pruebas de Connect que E0052 ya cerró ni pierdas D039 y las reacciones sin recargar.
3. Lee `editor-avatar/editor-avatar/propuestas-tesoros/NOTA_TESOROS_PENDIENTE.md` y `REVISION_Y_PROPUESTA.md`. Si necesitas conciliar la ropa o el estado del editor, consulta también `editor-avatar/editor-avatar/NOTA_BITACORA_PENDIENTE.md` y `NOTA_REVISION_VESTUARIO_PENDIENTE.md`; no las incorpores a ciegas como resultados de hoy.
4. Escribe en los documentos compartidos solo cuando estén libres. ChatGPT no ha escrito en la bitácora ni TECH_SPEC durante este encargo; ha dejado notas en su carpeta. No sobrescribas archivos de su zona ni regeneres el editor.
5. Integra sobre el contenido vigente, conservando historial y distinguiendo decisiones, propuestas y pruebas. Asigna IDs solo tras comprobar cuáles están disponibles. Aumenta revisión de bitácora una vez por actualización, y versión de TECH_SPEC si la modificas. No hagas staging, commit ni push.

## 2. Dirección artística APROBADA por la autora

La autora dijo que el entorno anterior resultaba sobrio y necesitaba atractivo. Recibió una lámina comparativa y después copió la siguiente dirección y respondió **«y esto ok»**:

| Dirección | Aplicación aprobada |
| --- | --- |
| Mi rincón fan | Base del editor y Mi K-ME: photocards superpuestas, etiquetas, cinta y pequeños trazos propios; cercanía y creatividad. |
| Mi escenario | Eventos y presentación de premios: iluminación suave, ondas y objeto protagonista. |
| Mi álbum vivo | Mis tesoros: bolsillos transparentes, recuerdos fechados y páginas de colección. |

Combinar rincón fan y álbum, reservando escenario para eventos. Aprueba:

- Cambiar la caja genérica de tesoros por un estuche de fan o álbum abierto.
- Dar protagonismo al objeto y su historia.
- Profundidad suave: papeles superpuestos, sombra ligera y transparencias.
- Firma visual K-ME: rayitas fucsias, estrellas, subrayados gestuales y etiquetas.
- Respuestas breves al tocar: levantar ligeramente una photocard, iluminar un objeto o previsualizar cómo queda puesto. Con movimiento reducido, mostrar directamente el estado final.
- Estado vacío cuidado: estuche abierto, etiqueta y frase cercana.

Además, acepta **mezclar acabados reales y vectoriales, frescos/artísticos y sobrios**, con criterio. No imponer que todo tenga el mismo acabado vectorial. Mantener paleta, logo original y legibilidad. La extensión concreta al resto de interfaces está condicionada a que le guste el resultado; esta aprobación no autoriza rehacer ahora todas las pantallas ni confirma cada geometría de los lightsticks de las láminas.

## 3. Mis tesoros · T029

Requisitos expresos del encargo: objeto propio de cada evento, distinto del de otros eventos; en conciertos, un lightstick. Mostrar nombre del evento, tipo y fecha ganada. Se gana en el evento, nunca se compra; una vez ganado permanece disponible y se puede poner o quitar del avatar.

ChatGPT preparó tres láminas estáticas y un informe en `editor-avatar/editor-avatar/propuestas-tesoros/`. Los botones dibujados aún no funcionan. El agarre del lightstick es un boceto, no una integración validada. No describas T029 como implementado. El código de la demo irá después de aprobar su diseño concreto, con tests nuevos primero, JSON ficticio separado y sin servidor. El guardado por cuenta corresponderá a Claude después.

Al integrarlo se deberán conservar gafas/auriculares y otros elementos: el editor actual usa `accesorio` singular y necesita resolver la equipación del objeto aparte. Respetar tres anchuras, manos/cuerpo, ropa, cabello, capas, ambos marcos e impresión. La nota del editor registra tres fallos que siguen pendientes; ChatGPT repitió la suite durante su revisión con resultado 116/119. No llamarlos pruebas superadas ni afirmar que todos son solo expectativas antiguas: hay un posible hueco de una combinación que requiere revisión geométrica.

## 4. NUEVA propuesta de la autora: emoción colectiva ANTES de los vídeos

La autora ha precisado que quiere recompensar la emoción conjunta de los fans, no las visualizaciones de YouTube. Su último mensaje propone:

«puede hacerse el recuento de reacciones en el previo a la visualizacion del /los videos , como muestra de la emocion previa de los fans en el evento».

Registrar como **propuesta concreta elegida para explorar**, todavía sin reglas completas ni autorización de implementar el sistema:

1. **Encuentro previo K-ME:** los fans se reúnen con sus avatares y expresan ilusión mediante reacciones propias de K-ME. La barra representaría participación colectiva, no una medición literal de sentimientos.
2. **Concesión del recuerdo:** se plantea alcanzar una meta colectiva y conceder el lightstick de ese evento antes de reproducir vídeos. La idea histórica menciona 100 %, pero no inventar fórmula, duración, límites, quién recibe el premio o condiciones de asistencia.
3. **Parte musical opcional:** quien quiera reproduce vídeos desde el reproductor oficial de YouTube y puede usar su lightstick ya ganado.

Salvaguardas propuestas por ChatGPT, pendientes de incorporarse al diseño: el premio ya concedido se mantiene aunque el fan no reproduzca vídeo, abandone antes de la parte musical o YouTube falle; ni el premio ni la barra usan minutos vistos, inicio/final de reproducción o interacciones con YouTube. Alcanzar la meta no debe bloquear ni desbloquear el acceso a un vídeo. No trasladar por defecto al evento el tope y retirada de reacciones del muro: D038/D039 describen Connect, no fijan las reglas del encuentro.

**Importante:** adelantar la fase de reacciones no demuestra automáticamente cumplimiento de las políticas. YouTube prohíbe incentivos por interacción directa e indirecta con su contenido. Registrar la separación como propuesta de producto que requiere revisión del diseño final, no como «aprobado por YouTube» ni como método para eludir restricciones. La regla de mantener el premio sin ver vídeos es una recomendación del asistente, no una frase ya aprobada por la autora.

## 5. NUEVA petición: usar el lightstick en el concierto con juegos de luces

La autora añade que los fans podrían usar el lightstick ganado en ese mismo concierto, con juegos de luces según la música.

Registrar el objetivo como idea de la autora. **No afirmar que la API entrega ritmo, volumen por instante o acceso al audio.** La IFrame Player API expone tiempo y estado de reproducción, pero no una señal de audio para analizar automáticamente.

Posible solución sugerida por ChatGPT, sin aprobar ni implementar: coreografía visual propia con cambios suaves programados en momentos concretos de cada canción; estudiar usar el tiempo/estado públicos del reproductor para situarla. Es una arquitectura inferida, no una función nativa de YouTube ni una aprobación de su uso concreto. Requiere comprobar condiciones y viabilidad.

- No capturar, descargar, separar ni analizar el audio de YouTube por vías ajenas a su API.
- Dibujar luces y avatares en áreas propias, sin tapar el reproductor ni controles. El vídeo permanece íntegro y visible.
- Contemplar pausa, búsqueda temporal, cambio de vídeo, velocidad y buffering antes de prometer sincronía.
- Distinguir efecto local sincronizado con el vídeo de cada usuario de un concierto sincronizado entre todos: lo segundo requiere arquitectura de evento y servidor todavía sin decidir.
- Ofrecer apagar efectos y respetar movimiento reducido. Evitar destellos rápidos; solo colores de la paleta. Estos son criterios de diseño sugeridos, no código existente.
- Los efectos del lightstick ya ganado no generan nuevos premios por mantener el vídeo reproduciéndose.

## 6. YouTube: reproducción prevista, captura fotográfica distinta

La autora quiere usar YouTube para mostrar música/vídeos legalmente, como han hecho compañeros. El reproductor oficial integrado es una vía contemplada por YouTube, sujeta a sus condiciones y a la inserción permitida para cada vídeo. No se ha implementado ni probado en K-ME.

Mantener vídeo, controles, atribución y anuncios; no poner avatares o marcos encima, ni ocultarlo para reproducir solo música. No confundir Data API (datos/búsqueda) con IFrame Player API (reproductor). La configuración futura de seguridad/CSP, Referer, privacidad y funcionamiento pertenece al trabajo de servidor de Claude; no debilitarla ni cambiarla en este encargo documental.

Fuentes oficiales consultadas el 22/11/2026; revisa su versión vigente al desarrollar:

- https://developers.google.com/youtube/iframe_api_reference
- https://developers.google.com/youtube/terms/developer-policies (III.F.3: incentivos directos e indirectos)
- https://developers.google.com/youtube/terms/required-minimum-functionality
- https://developers.google.com/youtube/terms/developer-policies-guide
- https://support.google.com/youtube/answer/171780?hl=es

## 7. Cámara y álbum: propuesta de ampliación

La autora preguntó por hacer fotos en eventos, con zoom y desplazamiento del encuadre, y conservarlas en un álbum.

Objetivo propuesto: modo foto de escenas K-ME, previsualización y conservación de recuerdos con evento y fecha. Un encuadre 2D no exige convertir los avatares en 3D; cambiar de punto de vista y descubrir caras nuevas de una escena requiere que esté preparada para ello. No prometer viajar por otros ángulos de un vídeo convencional.

El reproductor externo de YouTube no ofrece extracción de fotogramas para el álbum. Propuesta pendiente: capturar solo los avatares/escena propios de K-ME y resolver el área del vídeo con un cartel del evento o referencia al momento. No afirmar que se ha validado esa foto ni pedir captura de toda la pantalla del usuario.

«Mis recuerdos» como contenedor de **Mis tesoros** (objetos) y **Mi álbum** (fotos) es un nombre/estructura sugeridos por ChatGPT, no una aprobación expresa de nomenclatura. También son propuestas conservar una imagen fija del avatar del momento, guardar/repetir la foto y registrar hora. El guardado por cuenta sería de Claude; no está construido.

Fuentes técnicas: https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy y https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image . Las limitaciones de captura no impiden insertar el reproductor.

## 8. Lo que sigue abierto y fuera de implementación

Mantener P014–P018 como visión futura salvo las decisiones específicas que sí estén confirmadas. No programar monedas, tienda, reparto aleatorio, rarezas, intercambios ni eventos reales. No llamar «Poppys» a una moneda como nombre aprobado. Sigue abierta la compatibilidad entre un trofeo siempre disponible y su posible intercambio; tampoco está decidida la diferenciación por fan frente al objeto común del evento. No inventar reglas de retos.

## 9. Dónde incorporarlo y qué devolver

- **BITACORA_KME.md:** registrar la conversación, aprobaciones artísticas, propuesta de fase previa, lightsticks con luces y cámara/álbum; fuentes, límites y pendientes. Conservar la anterior idea de energía durante concierto como historia y enlazar la evolución de la propuesta; no borrarla ni convertir el sistema completo en decidido.
- **docs/TECH_SPEC.md:** incorporar las decisiones artísticas en sus apartados correspondientes y las ideas de eventos en §5.2 o en el lugar de propuestas que corresponda, etiquetadas y sin mezclar estados. Si cambia, aumentar versión y vincular con la bitácora.
- **CLAUDE.md:** actualizar solo el contexto operativo que sea necesario, sin convertir propuestas en estado construido y sin duplicar toda la especificación.
- No modificar ahora código, vistas, CSS, SVG, tests, migraciones, dependencias, Git ni archivos de la zona de ChatGPT. No implementar sistemas futuros por recibir este prompt.
- No reescribir las notas de ChatGPT; si necesitas marcar su incorporación, coordina la zona o registra la referencia en la bitácora.
- Devuélveme un resumen breve: decisiones incorporadas, propuestas preservadas, dudas pendientes, archivos modificados y revisión/versiones resultantes. Distingue verificación documental de pruebas de producto: este encargo no exige repetir npm test si solo cambian documentos. Sin commit; la autora revisará primero la lista exacta de archivos.
