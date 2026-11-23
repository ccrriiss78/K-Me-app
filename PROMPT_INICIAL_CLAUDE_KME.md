# Primer mensaje para Claude · Proyecto K-ME

Quiero comenzar contigo un proyecto nuevo llamado K-ME. Este es el primer mensaje que te paso sobre él: no presupongas que conoces nuestras conversaciones de ChatGPT ni que existe código desarrollado. Soy estudiante de programación web y necesito comprender lo que construimos.

## 1. Carpeta y contexto de trabajo

Trabaja exclusivamente en `C:\Users\<usuario>\Desktop\ACTIVA2026\k-me`. Confirma la carpeta activa antes de modificar archivos. Mantén separado cualquier ejercicio o archivo de clase en el que estuvieras trabajando.

Organización de partida: `k-me` es la carpeta general que se abre en VS Code. El código, `package.json`, las dependencias y la configuración privada de la aplicación deben ir dentro de la subcarpeta `app/`. La bitácora, este prompt, los ODT y los originales de marca se conservan en la raíz o en sus carpetas actuales. `app/` se ha preparado vacía; comprueba su estado antes de escribir. Mantén el README general y las exclusiones de Git en la raíz para documentar y proteger el conjunto. Lleva a los recursos públicos de la app únicamente los gráficos que necesite servir; los documentos, ZIP, bitácora y secretos deben quedar fuera del contenido público.

Lee las instrucciones aplicables a esta carpeta y `BITACORA_KME.md`, que contiene la historia, las decisiones y los pendientes. Inspecciona los documentos y recursos existentes. Los dos ODT son documentos de concepto y la carpeta de logos contiene recursos de marca, no una aplicación ya construida. Si no puedes leer algún formato, indícalo y utiliza el contexto de este mensaje y la bitácora, sin inventar su contenido.

## 2. Propósito y origen

K-ME es una app web para fans del K-pop. Su propósito central es dar al fan el protagonismo que merece mediante la personalización y la expresión de su identidad: «Sin fan no hay idol».

El origen exploraba un producto personalizado dentro de un posible proyecto de máquina de vending. Después, el encargo académico de una app y una primera clase de emprendimiento llevaron a pensar en una comunidad donde esos productos pudieran tener cabida. El profesor señaló que crear una comunidad requiere tiempo y no es fácil. Esto explica la evolución de la idea; no constituye una validación comercial.

La experiencia creativa surgió al imaginar que los fans pudieran diseñar sus avatares personales y reforzar su identidad con sellos personalizables. Queremos que K-ME se sienta como un espacio propio, donde el fan pueda crear, compartir y conectar.

## 3. Visión de la demo de noviembre de 2026

Estos son los objetivos del conjunto de la demo. Ordénalos por fases y señala dependencias y problemas de alcance; no prometas una fecha de entrega sin valorar el trabajo.

- **Mi K-ME:** cuenta, perfil con alias, bibliotecas de diseños, preferencias e historial.
- **Avatar Studio:** crear avatares por capas, con expresiones y accesorios; guardar varios diseños, recuperarlos, editarlos, duplicarlos y elegir uno activo. Confirmar las eliminaciones.
- **Sello Studio:** crear y conservar varios sellos, recuperarlos y seguir editándolos. El catálogo de palabras en hangul y sus significados deberá verificarse; no inventes traducciones. Revisa los recursos de marca existentes y distingue el sello corporativo del diseño personalizable del usuario antes de asumir que son equivalentes.
- **Crear:** composiciones visuales con iconos seleccionables y borradores guardados.
- **Explorar:** muro, publicaciones, reacciones e interacciones entre cuentas ficticias.
- **Retos:** participar en interpretaciones de composiciones, conservar respuestas y resultados y recuperar el historial.
- **Puntos y recompensas:** conservar movimientos y desbloqueos; comprobar las reglas y el saldo en el servidor, evitando concesiones o duplicaciones manipuladas. Sin dinero real.
- **Mi ambiente:** elegir colores mediante un círculo cromático visual, sin exigir escribir códigos HEX, RGB o HSL. Incluir saturación y luminosidad, vista previa y guardado. Mantener legibilidad, accesibilidad y movimiento reducido. La paleta del entorno sigue abierta; conserva por separado los recursos de marca.
- **Sonido:** compositor breve y firma sonora como ampliación posterior, condicionada a la estabilidad del núcleo. Usar sonidos originales o con licencia adecuada y reproducción voluntaria.

Como propuesta de navegación, considera Explorar / Crear / Mi K-ME. Para la interacción inicial, considera iconos y opciones controladas, con publicaciones emocionales sin respuesta correcta y retos que distinguen la intención del creador. Estos detalles proceden de propuestas anteriores: documenta las cuestiones abiertas y no los presentes como reglas ya probadas.

Eventos, tiendas, compras colectivas, noticias y productos físicos pertenecen a la visión futura. Consérvalos como contexto y concentra la primera construcción en la experiencia creativa y la persistencia de identidad.

## 4. Continuidad entre navegadores y dispositivos

Un usuario debe poder guardar sus datos y recuperarlos al entrar con la misma cuenta desde otro navegador o dispositivo conectado al mismo servidor. Esto incluye avatares, sellos, borradores, publicaciones, retos jugados, respuestas, reacciones realizadas y recibidas, preferencias, puntos y recompensas.

Usa persistencia de servidor asociada a una identidad autenticada. PostgreSQL será la base técnica de partida; localStorage solo puede ser un apoyo no sensible, nunca el único almacén de las creaciones o de la identidad de acceso.

Define claramente qué queda guardado y cuándo. Recuperar la última sesión significa recuperar los cambios confirmados como guardados; no prometas recuperar cambios que nunca llegaron al servidor. Prevé un mecanismo sencillo para detectar ediciones simultáneas y evitar sobrescrituras silenciosas.

Distingue la prueba local con dos navegadores, el acceso desde dos dispositivos en una red común y un futuro despliegue. Cada escenario necesita una comprobación propia.

## 5. Arquitectura y base técnica

La arquitectura debe ser MVC (Modelo-Vista-Controlador), siguiendo lo enseñado en clase, con separación comprensible entre datos, interfaz y control de solicitudes. Puedes añadir servicios pequeños y middleware cuando ayuden a ordenar la lógica.

Como base de partida utiliza HTML semántico, CSS, JavaScript modular, Node.js, Express y PostgreSQL. Prioriza una estructura sencilla y explicable. Justifica cualquier cambio necesario de estas tecnologías antes de introducirlo.

Mantén los recursos gráficos separados de la lógica para poder sustituir las ilustraciones provisionales sin romper los diseños guardados. Conserva los logos existentes. Antes de implementar publicaciones, resuelve la diferencia entre actualizar el avatar visible del autor y conservar el contenido histórico de la publicación.

## 6. Seguridad y datos

- Utiliza únicamente usuarios ficticios durante esta primera fase local. Recoge los datos mínimos necesarios; para la primera cuenta basta con un identificador interno, alias único y credencial protegida.
- Guarda contraseñas como hashes seguros, preferentemente Argon2id, con una biblioteca mantenida. Nunca como texto legible ni con funciones caseras.
- Gestiona sesiones en el servidor y guárdalas de forma persistente en PostgreSQL. Regenera el identificador al autenticar, permite expirar y revocar sesiones y destrúyelas al cerrar sesión.
- Configura cookies HttpOnly y SameSite, con Secure cuando haya HTTPS; explica la configuración local y la futura configuración de despliegue.
- Comprueba autenticación y propiedad de los recursos en el servidor. Aplica validación, consultas parametrizadas, protección CSRF, tratamiento seguro de contenido y límite de intentos de acceso.
- Usa `app/.env.local` para la configuración privada y excluye de Git los archivos reales `.env` y sus variantes, permitiendo solo una plantilla `app/.env.example` sin secretos. No incluyas credenciales en código, semillas, documentación, capturas ni mensajes del chat.
- Si necesitas una contraseña de base de datos, explícame cómo introducirla en mi configuración local sin pedirme que la publique en la conversación.
- Enumera las medidas implementadas y las pendientes con lenguaje sencillo para que pueda revisarlas. No afirmes que el proyecto cumple una normativa por haber añadido controles técnicos.
- Mantén el trabajo local. Publicar la app o subirla a un servicio externo será una acción posterior que deberá indicarse expresamente.

## 7. Primera fase que debes construir ahora

Primero resume brevemente lo que has entendido, lo que existe en la carpeta y el orden de trabajo. Después avanza con esta fase inicial dentro de la carpeta indicada:

1. Comprueba herramientas y conexión a PostgreSQL. Disponer de `psql` no demuestra que el servidor esté operativo. Si falta un dato indispensable, pide solo ese dato o guíame para configurarlo localmente; continúa con lo que no dependa de él.
2. Prepara la estructura MVC y la configuración de desarrollo dentro de `app/`. Sitúa allí `package.json` y documenta que los comandos de la aplicación, incluido `npm run dev`, se ejecutan desde `app/`. VS Code y la conversación de Claude pueden permanecer abiertos en la raíz `k-me` para consultar la documentación.
3. Crea migraciones reproducibles para usuarios y sesiones sin borrar datos existentes.
4. Prepara una herramienta local para crear cuentas ficticias con alias único. La contraseña debe introducirse de forma oculta, sin quedar en argumentos, historial ni registros. Evita contraseñas predeterminadas en el repositorio.
5. Construye una pantalla sencilla de inicio de sesión, una página privada con el alias y un cierre de sesión funcional. El formulario de registro se abordará después; la herramienta local permitirá crear las cuentas iniciales.
6. Ejecuta comprobaciones de creación de cuenta, alias duplicado, contraseña incorrecta, acceso privado sin sesión, entrada correcta y cierre de sesión. Comprueba que la misma cuenta puede iniciar sesión desde otro navegador. Separa los resultados automatizados de las pruebas manuales realmente realizadas.
7. Crea un README en la raíz con requisitos, configuración, migraciones, creación de cuentas, arranque y pasos para que yo lo pruebe. Indica expresamente la carpeta desde la que se ejecuta cada comando. Describe los bloqueos reales sin sustituir la base de datos por una simulación presentada como persistencia real.
8. Actualiza la bitácora al terminar esta fase y explica qué funciona y qué sigue pendiente antes de ampliar a avatares y sellos.

El resultado esperado de esta primera fase es poder crear una cuenta ficticia, entrar, ver su alias y cerrar sesión. Construye progresivamente y explica cada bloque para que pueda seguirlo. Si existe un bloqueo, deja claro qué está implementado y qué no se ha podido ejecutar.

## 8. Bitácora única y forma de colaborar

Mantén `BITACORA_KME.md` como único cuaderno del proyecto. Sigue su plantilla y protocolo de revisión: lee la versión vigente, añade una entrada de sesión, conserva el historial, evita duplicados y comprueba antes de guardar que no ha cambiado desde tu lectura.

Distingue hechos históricos, decisiones explícitas mías, propuestas tuyas, desarrollo realizado, pruebas con evidencia, pendientes y aprendizajes. Este mensaje autoriza la primera fase descrita y establece su base de trabajo; registra también qué detalles del resto de la demo quedan por acordar. No presentes como realizadas funciones que solo aparecen en este prompt.

Habla en español sencillo. Relaciona cada cambio con su propósito y dime cómo comprobarlo. Si no tienes acceso a los archivos o no puedes ejecutar una prueba, dilo claramente.
