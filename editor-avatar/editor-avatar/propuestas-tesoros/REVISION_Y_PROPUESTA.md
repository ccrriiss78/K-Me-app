# K-ME · Revisión y propuesta «Mis tesoros»

22/11/2026 · Base: BITACORA_KME R0051 / E0051 y TECH_SPEC v1.7.

**Documento de revisión y diseño. No convierte propuestas en decisiones. No implementa T029.** El encargo actual autoriza las láminas; el código del apartado espera su aprobación. No se han editado la bitácora, la especificación, Connect, app/src/, estilos de la app, tests existentes ni archivos previos del editor.

## Fuentes y límites

- Leídos AGENTS.md, CLAUDE.md, revisión y pendientes de BITACORA_KME.md, TECH_SPEC v1.7, NOTA_BITACORA_PENDIENTE.md y NOTA_REVISION_VESTUARIO_PENDIENTE.md.
- Revisados las cuatro vistas (entrar, registro, Mi K-ME y Connect), cabecera/pie, estilos de la app, catálogo y 23 SVG de Connect, paletas, catálogo, vista y renderizador del editor, marcos e impresión.
- Se ha observado Mi K-ME en la ventana local ya abierta. El control del navegador detectó actividad de la autora: se dejó de interactuar para no interferir. No se acredita aquí una revisión visual nueva de Entrar, Registro, Connect ni del editor en un navegador, ni una prueba responsive completa. Las conclusiones de esas pantallas proceden del código y de los SVG vigentes.
- Las notas temporales del editor son evidencia de trabajo anterior. En esta sesión se ha repetido la suite: **119 tests, 116 correctos, 3 fallidos, 0 omitidos**, salida 1. El detalle y sus límites se recogen al final; no se convierte ese resultado en verde.
- La recuperación de chats aportó extractos y resúmenes fechados, no conversaciones completas. Solo se entrecomillan los fragmentos literales recuperados; no se reconstruyen frases completas. Las búsquedas no garantizan haber encontrado todos los mensajes.
- El encargo del 22/11 de esta conversación es fuente primaria actual y prevalece sobre los documentos anteriores.

## 1. Coherencia del producto construido

La identidad común existe: negro, fucsia, superficies claras, lema y expresividad. El mayor salto está entre el taller editorial del editor y la interfaz administrativa de Mi K-ME.

| Hallazgo comprobable | Cómo lo unificaría, pendiente de aprobación | Prioridad y zona |
| --- | --- | --- |
| App: fondo `#faf7f9`, panel blanco, tinta `#1a1a1a`. Editor: papel `#f7f3ef`, panel `#fffdf9`, tinta negra. | Tomar el papel cálido y marfil ya usados por el editor como base común; conservar fucsia y marca originales. Consolidar variables comunes al integrar, sin introducir una paleta nueva. | MVP; CSS de ChatGPT, coordinación porque el CSS tiene cambios de Claude. |
| `.boton`: blanco sobre `#e83475`, peso 600 y tamaño normal. Contraste calculado 4,05:1; AA normal pide 4,5:1. Negro sobre ese fucsia da 5,18:1 y blanco sobre `#b9235a`, 6,09:1. | Elegir un tratamiento común accesible: negro sobre fucsia, como permite el editor, o blanco sobre el fucsia oscuro existente. La lámina propone botón primario negro con texto marfil y fucsia decorativo. No se ha aplicado ninguna de las opciones. | MVP; ChatGPT. |
| Borde de los campos `#e4dde0` sobre blanco: 1,34:1. No hay otro límite fuerte de campo. | Reforzar el borde de los controles con una tinta existente y comprobar 3:1 para identificar el control. Diferenciarlo de los bordes puramente decorativos, que no necesitan ese contraste. | MVP; ChatGPT. |
| App: botones de 8 px; emociones de 14 px; reacciones en cápsula; editor: controles de 14–16 px. | Familia de botones de acción de 14 px; cápsulas reservadas para filtros/estados/reacciones. Jerarquía primaria / secundaria / destructiva consistente. Mantener la eliminación separada y con confirmación. | MVP; ChatGPT. |
| `.boton` cambia de fondo al foco, pero carece de un contorno explícito común. Menú, emociones y reacciones sí tienen `focus-visible`. Algunas acciones pequeñas no garantizan 44 px. | Contorno visible de 3 px con separación; comprobar teclado y un objetivo de diseño de 44 px. No presentar 44 px como el mínimo AA universal. | MVP; ChatGPT. |
| El editor usa iconos de línea de 24 unidades; Connect usa reacciones de masas negras de 24 unidades. A 20 px algunos gestos pierden detalle. | Mantener dos funciones gráficas: caritas de marco negro y rubor fucsia; acciones de línea redondeada; reacciones de silueta legible. Igualar tamaño óptico, no obligar a todos los dibujos a tener marco. Probar Aplauso y Mini corazón a tamaño real antes de sustituirlos. | MVP si se aprueba; Connect se describe para Claude, sin editarlo. |
| Las 14 caritas comparten marco y rubor: eso ya es coherente con D038. | Conservar esas dos señas. Diferenciar emoción por ojos/boca y pose, no solo por símbolos pequeños. No reemplazar las caras por los rostros acuarelados del editor: cumplen otra función. | Revisión visual MVP; propuesta para Claude. |
| Mi K-ME es una tarjeta de 420 px con alias y fecha de creación. El editor presenta identidad y creación. | Dar protagonismo al avatar activo, y accesos a Avatar Studio, Sello Studio y Mis tesoros cuando existan. Mantener la fecha en un detalle secundario. No añadir enlaces a páginas aún inexistentes. | Presentación ChatGPT; avatar guardado e integración Claude. |
| «Bienvenida» presupone género; el resto habla al fan en segunda persona. Connect dice «cuenta cómo te sientes» aunque no permite texto libre. | Proponer «Hola, [alias]. Este es tu espacio K-ME.» y «Elige cómo te sientes y acompaña a otros fans». Para tesoros: Poner / Quitar del avatar / Ganado. Conservar textos de tests hasta coordinar los cambios con Claude. | MVP; propuestas de texto, sin modificar vistas. |
| Connect tiene una photocard de 76 × 100; el editor usa formato de impresión 55 × 85 o 54 × 86 y marcos 480 × 590. | La tarjeta del muro puede ser una miniatura de perfil, sin prometer medida física. Acordar recorte propio; imprimir sigue usando su tamaño real. Evitar deformar el avatar para igualar rectángulos. | Integración MVP; ChatGPT + Claude. |
| Entrar/Registro ya comparten logo grande, lema y rayitas (D037), y las columnas del registro responden a D036. | Conservar esa composición aprobada. Unificar solamente superficies, botones y legibilidad si se aprueba, sin rehacer el acceso ni alterar errores, campos, foco del alias o CSRF. | MVP; coordinación con Claude. |
| «Próximamente», «fase 1» y detalles de implementación aparecen en textos provisionales. | Mientras sea una demo, identificarla con claridad. En el cierre del MVP, mostrar estados útiles y accesos reales en vez de explicaciones de desarrollo. No fingir funciones terminadas. | Cierre MVP, con Claude para textos comprobados por tests. |

Los colores de marca no deben cambiar al personalizar Mi ambiente. La adaptación de superficies y colores del usuario a la app completa aún no existe por cuenta; no se promete aquí.

## A. Aprobaciones expresas y requisitos actuales

| Fecha y fuente | Palabras disponibles de la autora | Qué acredita y su límite |
| --- | --- | --- |
| 14/11, recuperación de conversación; H007 / D006 | La recuperación resume que aceptó retos/juegos de interpretar composiciones y recompensas. No se recuperó el mensaje completo. | Dirección histórica de producto y conservación de actividad; **literal completo sin confirmar**. No concreta reglas, importes ni su implementación en el MVP. |
| 17/11, extracto de chat recuperado | «Lo de subir la energía del fandom al 100% me parece muy guay...» | Aceptación histórica del concepto de energía; el extracto no fija cómputo, asistencia ni reglas. El encargo actual deja los eventos reales sin decidir para construir. |
| 17/11, extracto de chat recuperado | «Sí , solo de los eventos» | Exclusividad histórica de los lightsticks. No acredita tienda ni moneda aprobada. Coincide con el requisito actual de no comprarlos. |
| 19/11, TECH_SPEC §2.5; 21/11 D024 | No se conserva aquí la frase literal original. El acuerdo está documentado: solo paleta de la app, sin círculo cromático. | Regla vigente confirmada además en el encargo actual. El canje de colores es motivo/visión futura, no una economía lista para programar. |
| 22/11, D036, cita registrada | «3 ok» para las dos columnas, con elección de conservar usuario y vaciar contraseñas al fallar solo el alias. | Flujo de registro aprobado; ninguna propuesta estética de este documento lo sustituye. |
| 22/11, D037, citas registradas | «1 sí, 2 sí, 3 hazlo tú»; «rayitas que había del logo»; bueno «de momento». | Logo al lado, lema, rayitas y tarjeta centrada aprobados; no cambiar la estructura por iniciativa propia. |
| 22/11, D038, citas registradas | «haz tú la base de Connect; inventa posible listado de reacciones y visualización gráfica; intenta ser creativo y coherente con la app»; «debería poderse dar muchas veces»; «buscar otra manera para quitar la reacción». | Listas y diseño delegados; reacciones acumulables y retirada aparte aprobadas. El límite 10 lo propuso Claude y quedó en D038; no es una cifra original de la autora. Prueba manual pendiente. |
| 22/11, encargo actual | «Cada evento […] su propio objeto»; «con el nombre del evento, su tipo y la fecha en que se ganó»; «Se gana en el evento, nunca se compra». | Requisitos de diseño de T029 expresos hoy. El objeto estará disponible una vez ganado, y podrá ponerse o quitarse. No autoriza construir los eventos. |
| 22/11, encargo actual | «Cuando yo apruebe la lámina: prográmalo con tests primero […] en un JSON aparte y sin servidor». | Autorización por fases: diseño ahora; programación tras aprobación. Demo ficticia separada; persistencia por cuenta de Claude después. |

**Distinción:** ideas aceptadas en una conversación anterior no son automáticamente parte del alcance vigente. Se conserva el hecho histórico; el mandato actual de no construir monedas, tienda, intercambios ni eventos prevalece.

## B. Propuestas anteriores del asistente sin aprobación acreditada

| Propuesta | Fuente disponible | Estado |
| --- | --- | --- |
| Moneda llamada «Poppys». | Recuperación resumida del 17/11; otra consulta no recuperó el turno posterior completo. | Sin confirmar como nombre. Se recupera una duda de la autora por su asociación con Trolls, sin cita completa; no se usa como nombre del producto. |
| Eventos «K-ME Mystery», «Party» y «Style Challenge». | Resumen de respuesta del asistente del 17/11. | No consta aceptación individual de esos formatos ni de sus reglas. No se implementan. |
| K-ME Music / estudio musical y firma sonora. | Recuperación del 17/11; P005 y F01. | Ampliación propuesta; no forma parte de este bloque. |
| Cantidades de puntos, catálogo de canjes, historial de recompensas y prevención de duplicados. | P004; TECH_SPEC §2.5 y §5.2. | Reglas y cantidades pendientes. La seguridad de una futura implementación sigue siendo obligatoria; lo que no está aprobado es la mecánica. |
| Crear un avatar dentro del flujo de publicar y volver al muro automáticamente. | TECH_SPEC §3.4. | Condicionado a complejidad; sin flujo concreto aprobado. |
| Navegación Explorar / Crear / Mi K-ME, retos de interpretación con opciones controladas. | P003 / F01. | La visión de retos existe; no está aprobado cada paso ni cada regla. |
| Pulseras y anillos; mover gemas y brillos con puntero. | TECH_SPEC §3.3; P013. | Posibilidades comentadas, no accesorios nuevos aprobados ni interacción decidida. |

P014–P018 **no son propuestas que pueda atribuirme**: la bitácora dice que son ideas de la autora. A 22/11 siguen sin decidir como sistemas para construir: monedas; tipos de evento y concierto con energía; intercambios; reparto de variantes por fan. P016 recibe hoy un encargo limitado de diseño y posterior demo condicionada. Las notas de vestuario no contienen acuerdos de economía, conciertos o intercambios.

La tienda de compras físicas y recogida local de noviembre era otra línea: una recuperación del 04/11 cita «Quizá se podría hacer compras entre varios para poder compartir los gastos d envío ?». No demuestra una tienda virtual de monedas, un acuerdo con comercios ni un servicio operativo.

## C. Choques y ambigüedades que deben quedar visibles

| Punto | Choque real o riesgo de confusión | Tratamiento de esta propuesta |
| --- | --- | --- |
| Energía aprobada como idea el 17/11 frente a §5.2 del 22/11. | La conversación muestra entusiasmo y exclusividad; la especificación agrupa el sistema como propuesta futura. | Conservar la aceptación conceptual como historia. No resolverla atribuyendo aprobación de una fórmula ni construir eventos; manda el encargo actual. |
| Objeto permanente frente a intercambio de lightsticks. | P016 dice siempre disponible tras ganarlo; P017 deja abierta su transferencia. Si se pierde al intercambiarlo, deja de estar siempre disponible. | No diseñar transferencia de trofeos como decidida. Proponer separarla de objetos intercambiables en E; la autora decide después. |
| Distinto por evento frente a distinto por fan. | El trofeo identifica al evento, pero P018 aspira a objetos diferentes por persona. No exige alterar el trofeo común. | Tres eventos tienen tres objetos inequívocos. Variantes por fan solo como propuesta futura, no reparto aleatorio implementado. |
| Reacciones del muro frente a energía del concierto. | D038 suma hasta 10 de cada tipo y retira aparte. No define gasto de energía, puntos ni reglas de concierto. | No reutilizar esos contadores como economía o energía sin una decisión nueva. No cambiar el comportamiento de pulsación para hacerlo un interruptor. |
| Avatares y publicaciones. | Q7/Q11 exigen copia del diseño; Connect actual solo muestra inicial y reserva `diseno`. | Integración incompleta y documentada, no fallo visual que se arregle cambiando CSS. El equipo que añade servidor debe completar y probar la copia. |
| Accesorios simultáneos. | TECH_SPEC §3.1 admite varios; el editor actual tiene `accesorio` singular (ninguno/gafas/auriculares/pin). | La futura equipación del tesoro debe ser independiente para no borrar gafas ni auriculares. No modificar el esquema existente en este bloque de diseño. |
| Paleta y medidas. | La tabla técnica sugiere 512 × 512; el editor real usa 400 × 480, y marco/impresión usan recorte `60 0 280 450`. Las paletas de ambiente y piezas son distintas. | Diseñar contra las coordenadas reales. Usar solo colores existentes y separar paleta del objeto, piel y marca. No añadir círculo, HEX ni hangul inventado. |
| TECH_SPEC §5. | La frase «Fuera de este documento […] Connect» contradice la sección posterior §5.1 y D038. | Nota para actualizar cuando la documentación compartida esté libre; no editarla ahora. |
| Resumen de bitácora y T025. | La cabecera cita v1.6, resultado 90/90 y al final aún dice T013 pendiente, aunque E0050 lo cierra. T025 dice sin ropa incorporada; la nota temporal registra nuevas prendas y última suite 116/119. | Son estados documentales desfasados; integrar las notas sobre versión vigente con Claude cuando esté libre. No borrar el historial ni presentar los 3 fallos como pruebas superadas. |
| D036–D037. | Unificar pantallas podría alterar textos de error, vaciado, foco, columnas y logo ya aprobados. | Ninguna de esas decisiones se cambia en este encargo. |

## D. Preguntas abiertas, sin bloquear las láminas

1. ¿Los trofeos de evento se quedan siempre con quien los ganó, y solo otros accesorios se intercambian? Es la forma más clara de resolver P016/P017; sigue pendiente.
2. ¿La colección es por cuenta y cada avatar guarda su equipación, o hay un único objeto puesto para el perfil activo? La lámina muestra una vista; no decide propiedad ni exclusividad entre avatares.
3. ¿Se puede llevar más de un objeto de mano a la vez? Para la futura demo propongo uno por mano disponible; no hay regla aprobada todavía.
4. ¿Todos los asistentes reciben el mismo diseño del evento o cada fan elige una variante? No hay azar, rareza ni probabilidades aprobadas.
5. ¿Fecha ganada corresponde al momento de concesión, al cierre del evento o a su fecha programada? La lámina distingue evento y fecha ganada; Claude concretará con la autora el dato de servidor.
6. Energía: ¿colectiva o individual?, ¿qué participa?, ¿cómo se cuenta a quien necesita descansar?, ¿qué pasa si no se llega al 100 %? Sin reglas implementadas.
7. Retos: objetivos, respuestas, moderación y recompensas. La aceptación de la idea no fija reglas.
8. Monedas: nombre, acciones válidas, importes, límites y catálogo. «Poppys» no confirmado. Una tienda virtual no se deduce de las compras físicas.
9. Q13 sigue abierta: alias de la publicación histórico o actual. Q7/Q11 ya resuelven la imagen y no deben reabrirse para decidir el alias.
10. Revisar paletas definitivas (Q12) y cerrar la revisión artística e impresión física pendientes del editor. La propuesta utiliza los colores ya presentes, sin ampliar la paleta.

## E. Ideas nuevas · todas pendientes de aprobación

Estas ideas nacen en esta revisión. Los identificadores E-idea no son IDs de sesión ni decisiones de la bitácora.

| Idea | Qué es y por qué aporta valor | Zona y horizonte |
| --- | --- | --- |
| E-idea 01 · Estuche de recuerdos | «Mis tesoros» muestra objetos ganados, no un escaparate de objetos bloqueados. Miniatura, evento, tipo y fecha; la identidad del fan se cuenta con lo vivido. | ChatGPT diseño y demo tras aprobación; candidato MVP. Claude guardado después. |
| E-idea 02 · Prueba junto a tu photocard | Avatar real visible mientras seleccionas un objeto. Poner y quitar son acciones reversibles, con estado «Puesto», no solo un borde de color. Reduce ensayo y error y conserva rasgos y ropa. | ChatGPT; demo candidata MVP, condicionada a aprobar y verificar agarres/marcos. |
| E-idea 03 · Trofeo común, detalle elegido | El evento tiene un objeto reconocible; en el futuro cada fan podría elegir el motivo secundario de la correa entre variantes aprobadas. Diversidad con identidad compartida y sin sorteo. | ChatGPT plantillas; Claude propiedad/catálogo; después del MVP. |
| E-idea 04 · Familias de prendas compatibles | Un bloque anatómico y puntos de unión comunes por talla; variar cuello, mangas, largo y motivos por separado. Probar mangas, cabello, mano y cintura en combinaciones reales antes de publicar una colección. | ChatGPT SVG y pruebas; después, salvo correcciones del vestuario ya encargado. |
| E-idea 05 · Colecciones, sin jerarquía | Colecciones por evento/temporada con nombre y procedencia. Preferir «Recuerdo de…» a común/raro/legendario; rarezas serían una decisión posterior, nunca probabilidades ocultas ni presión para completar. | ChatGPT presentación; Claude catálogo; después del MVP. |
| E-idea 06 · Energía que respira | Boceto de barra con porcentaje, frase de contribución colectiva y crecimiento suave una sola vez al actualizar. Sin parpadeos ni repetición continua. La versión de movimiento reducido cambia directamente al estado final. | ChatGPT interfaz; Claude cálculo y evento; después del MVP. No se fija fórmula. |
| E-idea 07 · El recuerdo llega con calma | Tarjeta con objeto y «Este recuerdo ya es tuyo». Aparición corta, sin sonido automático ni confeti; queda consultable. El premio no exige otra pulsación frenética. | ChatGPT visual; Claude concesión válida; después para eventos. Estado estático en la demo. |
| E-idea 08 · Reacciones que se entienden | Conservar las 9 reacciones de D038; redibujar Aplauso y Mini corazón si la autora confirma mejor lectura a 20–24 px. Mostrar ayuda accesible con nombre y aportaciones propias. | Boceto de ChatGPT para pasar a Claude; candidato MVP tras aprobar. Ningún archivo de Connect editado. |
| E-idea 09 · Presencia sin clasificación | Dar razones para volver: probar una combinación, encontrar una emoción afín, mirar el recuerdo de otro fan. Sin rachas, rankings, obligación diaria, avisos de pérdida ni «faltan X para completar». | ChatGPT experiencia; Claude datos si hacen falta; redacción candidata MVP, sistema después. |
| E-idea 10 · Intercambiar piezas, conservar recuerdos | Si se decide un mercado de intercambio, separar claramente accesorios transferibles de recuerdos personales de asistencia. Conservar la historia sin convertir la colección en una carencia. | Diseño compartido; transacción/seguridad de Claude; después del MVP y pendiente de decisión. |
| E-idea 11 · Estados vacíos sin promesas falsas | «Aquí vivirán tus recuerdos de eventos». En la demo, aviso visible de que los datos son ficticios; no CTA «Ir a un evento» si no existe ninguno. | ChatGPT; candidato MVP. |
| E-idea 12 · Firma de objetos K-ME | Silueta negra redondeada, una zona de color de la paleta y un motivo legible. Las rayitas fucsias se usan como firma puntual, sin convertir cada icono de acción en una nueva carita. | ChatGPT recursos; candidato MVP para las tres muestras; resto después. |

## T029 · Propuesta concreta para aprobar

### Qué presentan las láminas

- Apartado dentro de Avatar Studio, junto a Accesorios, sin sustituirlo; no se añade una página real ni navegación funcional todavía.
- Tres tarjetas de conciertos ficticios: **Pulso compartido**, **Órbita fan** y **Jardín de voces**. Son eventos inventados para diseño, no idols ni eventos reales.
- Nombre del objeto y del evento, tipo y fecha ganada; fecha no confundida con compra o última equipación.
- Un objeto seleccionado y puesto; Poner / Quitar del avatar, estado textual y botón distinguible sin depender del color.
- Avatar procedente del renderizador vigente; objeto superpuesto solo como boceto de colocación. La mano, capas y marco todavía requieren integración y validación. La imagen conceptual generada utiliza una silueta ilustrativa, no sustituye al avatar real ni autoriza su ropa o menú.
- Estado vacío y estado de objeto ganado estáticos. Los otros tipos de evento se explican debajo sin dibujar sus objetos.

### Plantilla de lightstick

Base modular propuesta, en un lienzo propio de 160 × 220: cabeza, cuello, mango, correa, motivo interior y dos rayitas de firma. El objeto del evento mantiene su identidad; la plantilla no ofrece personalización libre ni cambia un premio ya ganado.

| Concierto ficticio | Cabeza | Motivo | Color ya existente |
| --- | --- | --- | --- |
| Pulso compartido | Bola circular | Estrella de cuatro puntas / pulso | Fucsia K-ME `#e83475` |
| Órbita fan | Bola ovalada | Planeta con órbita | Lavanda `#c8b0f0`, de Mi ambiente |
| Jardín de voces | Cabeza de flor redondeada | Semilla / pétalos | Menta `#afe0bf`, de Mi ambiente |

Negro, marfil y los tres acentos proceden de archivos actuales. No se propone selector cromático, HEX al fan, hangul nuevo ni nombre de moneda. Las variantes son ilustraciones por aprobar; no se registran como piezas del catálogo.

### Otros tipos de evento: solo ideas de objeto, sin dibujarlos

| Evento posible | Objeto posible | Sentido |
| --- | --- | --- |
| Taller de creación | Broche de pincel o lápiz | Recuerdo de haber creado algo propio. |
| Encuentro local | Charm de nudo / lazo compartido | Relación entre fans; sin dirección ni datos personales. |
| Sesión de baile | Pulsera de ritmo | Recuerdo corporal del baile, compatible con el brazo corto. |
| Encuentro de intercambio | Etiqueta de estuche | Recuerdo de la participación; no decide si el trofeo es transferible. |
| Encuentro de escucha o club cultural | Pin de onda / marcapáginas | Dar identidad a actividades distintas del concierto. |

### Siguiente bloque, solo tras aprobación

No hay nuevos tests de funcionalidad en este bloque: todavía no hay comportamiento autorizado para implementar. La secuencia propuesta es:

1. Escribir tests **nuevos** en tests/ del editor con funciones iniciales que fallen por comportamiento, no por falta de importación. No modificar los existentes.
2. JSON ficticio separado del catálogo real: objeto, evento, tipo, fecha ganada e identificador. Etiqueta visible «Demostración · datos ficticios». Sin servidor ni promesa de guardado por cuenta.
3. Poner y quitar modifican solo la equipación del objeto; el objeto permanece en la colección. Mantener gafas, auriculares, ropa, cuerpo, rostro e historial de Deshacer. Una clave separada evita sustituir `accesorio`.
4. La geometría usa el lienzo 400 × 480. Preparar anclajes de mano por las tres anchuras y revisar por separado las prendas anteriores y las de perfil continuo. Un accesorio dibujado al final de todas las capas no produce por sí mismo un agarre correcto.
5. Composición: brazo/palma posterior, mango, parte delantera de la mano sin dedos separados; cabeza del lightstick por delante de ropa pero sin tapar la cara. Resolver pelo largo, mangas y pin mediante orden explícito. El recorte debe contener el objeto entero en `60 0 280 450` y en ambos marcos; no agrandar o deformar el personaje para conseguirlo.
6. Probar selección, retirada, Deshacer y conservación de otros elementos; IDs SVG únicos; misma composición en vista y exportación; los dos tamaños de photocard; sin-marco/transparente/charms; las tres anchuras y combinaciones de ropa y cabello. Validación geométrica más revisión artística en navegador: una no sustituye a la otra.
7. Comprobar teclado, foco conservado al repintar, botones con nombre/estado, mensajes anunciables y movimiento reducido. No animación continua ni información solo en color.
8. Ejecutar los tests nuevos y la suite del editor; informar por separado de los 3 fallos anteriores si siguen vigentes. No ejecutar ni modificar tests de app/ en esta fase de editor.
9. Claude implementará después propiedad y persistencia por cuenta, catálogo validado, integridad de concesión y conflictos de guardado. El navegador no acreditará que un evento se ganó de verdad.

No se diseñan aquí cantidades de monedas, tienda, transferencias, calendarios ni eventos funcionales. El plazo del 26/11 aconseja priorizar guardar Avatar Studio y Sello Studio; la demo visual de tesoros se acepta como candidato, no se declara compromiso de entrega del sistema completo.

## Validación realizada el 22/11 en este bloque

- `node --check crear-laminas.mjs`: correcto.
- Generación de las tres láminas SVG y del índice HTML: correcta. Se leen los 23 dibujos actuales de Connect (14 emociones y 9 reacciones) y 190 recursos del avatar, sin modificarlos.
- Las tres láminas se analizan como XML sin errores. Los dibujos SVG son el documento vectorial preciso; no se ha realizado una inspección nueva de su renderizado en navegador. La imagen conceptual generada en la conversación es orientativa, no una reproducción exacta de la paleta ni del avatar.
- Contrastes calculados con luminancia sRGB: blanco/fucsia 4,05:1; negro/fucsia 5,18:1; blanco/fucsia oscuro existente 6,09:1; borde claro/blanco 1,34:1.
- Suite del editor: `node --test --test-reporter=tap "tests/*.test.js"`: 119 tests, **116 correctos, 3 fallidos, 0 omitidos**, salida 1, unos 13 segundos.

| Test que falla | Resultado observado | Interpretación y pendiente |
| --- | --- | --- |
| cintura-comun.test.js: miniatura superior con conjunto inferior | Espera piernas y ombligo en el menú superior. | Choca con la petición posterior de mostrar solo la prenda. Requiere aprobación antes de cambiar ese test. |
| vestuario-lamina.test.js: ombligo solo con cintura baja | Espera ausencia del punto al seleccionar una cintura alta. | Choca con mostrar el ombligo si queda abdomen descubierto. Requiere aprobación para ajustar el criterio, conservando que nunca se pinte sobre ropa. |
| union-y-colores.test.js: las 432 elecciones | Falla antes de llegar al recuento: `relajado/camiseta-integrada-delgado/pocket-pop-abajo-delgado`, hueco en `(173,365)`. | El test presupone cintura cubierta por ropa y conserva un total fijo antiguo. **No basta con eso para descartar el fallo geométrico**: un diagnóstico puntual con la máscara del torso devuelve ausencia de piel en ese punto. Hace falta revisar todas las capas visibles y la combinación real, y corregir la geometría si hay un hueco. No se declara resuelto ni se propone eliminar esta comprobación. |

No se ejecutan tests de app/, no se instalan dependencias y no se cambian tests existentes. No se introduce comportamiento nuevo de producto, por lo que este bloque de láminas/documentación no declara un ciclo TDD de T029. Los tests de esa función se escribirán primero después de aprobar el diseño.

## Actualización posterior · 22/11/2026 · dirección artística aprobada

El informe anterior conserva su estado histórico. Después de revisarlo, la autora señaló sobriedad en el entorno y recibió una lámina exploratoria con tres direcciones. Copia su tabla y los detalles y confirma «y esto ok».

| Dirección aprobada | Aplicación |
| --- | --- |
| Mi rincón fan | Base del editor y Mi K-ME: photocards superpuestas, etiquetas, cinta y trazos propios. |
| Mi escenario | Eventos y presentación de un premio: luz suave, ondas y objeto protagonista. |
| Mi álbum vivo | Mis tesoros: bolsillos transparentes, recuerdos fechados y páginas de colección. |

Aprueba combinar rincón fan y álbum, reservando escenario para eventos; cambiar la caja por estuche/álbum; aumentar protagonismo del objeto; añadir profundidad suave, detalles propios, microinteracciones respetando movimiento reducido y un estado vacío cuidado. También acepta explícitamente mezclar acabados reales, vectoriales, frescos, artísticos y sobrios, con criterio. **La dirección ya no exige un acabado uniformemente vectorial.** La aplicación al resto de interfaces depende de que le guste el resultado concreto; no se da por aprobada cada geometría ni todo el diseño de los lightsticks anteriores.

### Cámara y álbum de fotos: nueva idea de la autora, sin implementar

La autora pregunta por fotografiar eventos con zoom y desplazamiento de cámara y guardar recuerdos en un álbum. Es viable diseñar esa experiencia sobre escenas K-ME propias. El encuadre 2D no necesita convertir todo el avatar en 3D; un cambio real de punto de vista sí requiere una escena que lo permita. El zoom sobre un vídeo grabado no descubre ángulos nuevos.

Si el concierto usa YouTube, no se debe prometer que la foto automática contenga el fotograma: su API de iframe no ofrece esa extracción y el navegador limita el acceso a contenido de otro origen. Propuesta por decidir: fotografiar avatares, objetos y escenario K-ME propios, con un cartel del evento y referencia al momento en lugar del vídeo en la imagen exportada. No se implementa captura de pantalla ni se solicita acceso a la pantalla del usuario.

Posible flujo, aún propuesto: encuadrar → hacer foto → revisar → guardar o repetir. Imagen fija del momento, con evento y fecha/hora; álbum de fotografías diferenciado de los objetos ganados, dentro del mismo mundo visual. Guardado real por cuenta sería trabajo posterior de Claude. Los eventos, álbum y cámara funcionales siguen fuera del MVP actual.

Consulta técnica del 22/11: [API oficial de YouTube](https://developers.google.com/youtube/iframe_api_reference), [restricciones entre orígenes](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy) y [exportación de canvas con recursos externos](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image). Es comprobación documental, no prueba de una función construida.
