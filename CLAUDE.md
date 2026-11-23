# CLAUDE.md · K-ME

K-ME: app web para fans del K-pop. El fan es protagonista y expresa su identidad con avatares, sellos y creaciones. *Sin fan no hay idol.*
La autora es estudiante de programación web: explica cada bloque en español sencillo, relaciona cada cambio con su propósito y dile cómo comprobarlo.

## Dónde está cada cosa
- `BITACORA_KME.md`: único cuaderno del proyecto (historia, decisiones D…, propuestas P…, pruebas V…, pendientes T…). Léelo antes de empezar.
- `docs/TECH_SPEC.md`: qué se construye y cómo (datos, rutas, reglas). Cada punto está marcado como [DECIDIDO], [PROPUESTA] o [PREGUNTA]: solo se implementa lo decidido o lo que la autora haya confirmado; las preguntas abiertas **no** se implementan. Si algo no está ni ahí ni en la bitácora, **pregunta**: no lo decidas tú.
- `README.md`: puesta en marcha y pruebas manuales.
- `AGENTS.md`: normas de ChatGPT y reparto de zonas (D028). Claude trabaja solo en su zona; si una tarea toca la de ChatGPT o un archivo sin zona, pregunta antes.
- `app/`: todo el código. **Todos los comandos se ejecutan desde `app/`.**
- `K-ME-logos-revisados-v1.1/`: originales de marca. Solo se copian a `app/public/img/` los gráficos que la app sirve.

## Estado actual
- Hecho (fase 1): cuentas ficticias creadas con `npm run crear-cuenta` o con el formulario `/registro` (T016, 21/11/2026), entrar, página privada «Mi K-ME» con el alias y salir. Probado por la autora en su ordenador (bitácora, V010). La cabecera y el favicon usan el logo general (`logo-kme.svg`, `favicon-kme.ico`; D015). En «Entrar» y «Crear cuenta» no hay cabecera: el logo va muy grande dentro de la tarjeta, a la izquierda del formulario en el ordenador, con el lema y las rayitas fucsias del logo (D037, E0049; tests en `tests/logo-entrada.test.js`).
- Login ajustado a las indicaciones del profesor (D016, 18/11/2026): contraseña de 12 a 128 caracteres y casilla «Mantener sesión abierta». Si falla el alias o la contraseña, el mensaje es «Los datos introducidos no son válidos.» (D017). Tests en `tests/contrasena-y-sesion.test.js`. El límite de 10 intentos cada 15 minutos al entrar, en `tests/limite-entrar.test.js` (E0050).
- Cuentas con usuario privado y alias público (D020); registro sin correo, con errores sin pistas y formularios vacíos tras un error (D018, D019, D021, D022), salvo los errores del alias, que conservan el usuario y llevan el cursor al alias; en el ordenador, el registro va a dos columnas (D036, E0047). Tests en `tests/registro.test.js`; `npm test` pasa 122 de 122 (23/11/2026). Al crear la cuenta se rechazan los alias con palabras no permitidas (D042; lista en `src/catalogos/palabras-no-permitidas.js`, tests en `tests/alias-no-permitido.test.js`, aparte porque `registro.test.js` ya agota el límite de 10 registros por hora). La autora ha probado el registro en su navegador, pruebas 9 a 12 (T016 terminado, E0048).
- Editor de avatar autónomo (`editor-avatar/editor-avatar/`), zona de ChatGPT (`AGENTS.md`). Se abre con `KME_ABRIR_MUESTRA.html`, sin servidor. Desde esa carpeta: se regenera con `node scripts/empaquetar-muestra.mjs` y sus tests se pasan con `node --test "tests/*.test.js"` (56 de 56 el 21/11/2026, V029). Su historia y sus pendientes (aprobaciones visuales, impresión real, guardado por cuenta) están en la bitácora, sesiones E0015–E0031 y siguientes. Hasta el 21/11/2026 la carpeta de fuera se llamaba `editor-avatar-chibi/` (E0039). La copia antigua (`k-me - copia-antigua`) no se usa ni se arranca (T020).
- MVP decidido (D014, TECH_SPEC §5.1): del 18/11 al 26/11/2026, solo en local. Incluye Avatar Studio, Sello Studio y Connect mínimo. El plan día a día irá en `docs/PLAN_MVP_KME.md` (T015).
- Git local en la raíz de `k-me`, sin remoto (D025, 21/11/2026, E0037): nada se sube a internet. Fuera de Git, lo que dice `.gitignore`: cualquier `.env` salvo `.env.example`, claves, copias de la base de datos, logs, temporales, `node_modules`, la carpeta `privado/` y dos notas sueltas de la autora. `.gitattributes` hace que Git guarde los archivos byte a byte, porque los tests del editor comprueban huellas SHA-256 de algunos SVG. La comprobación antes de cada commit está en `.githooks/` (D034, E0043): bloquea los `.env`, las contraseñas, las claves y los tokens de GitHub, y para el commit con un aviso si encuentra un correo que no está en `.githooks/correos-permitidos.txt`. Activada el 22/11/2026 (E0045) con `git config core.hooksPath .githooks`; en una copia nueva del repositorio hay que ejecutar esa orden una vez. La sesión de ChatGPT no puede escribir en `.git` (T027): mientras sea así, sus commits los hace Claude con la lista y el mensaje que apruebe la autora, sin la línea de coautoría de Claude.
- Fase 1 probada a mano entera (T013 terminado, E0050).
- Connect mínimo hecho (D038, E0051): muro privado `/connect` donde se publica una emoción (sin texto libre) y se reacciona. En el ordenador, el muro va a la izquierda y «Publicar» en un panel fijo a la derecha; en el móvil, las emociones van en una fila deslizable. Cada pulsación suma una reacción, hasta 10 de cada tipo por persona; se quitan aparte («la última» o «todas las mías»); solo se borra lo propio. Listas en `src/catalogos/connect.js` (en la base de datos, solo el id), dibujos en `public/img/connect/`, variables `--connect-…` en `estilos.css`, migración `004_connect.sql`, tests en `tests/connect.test.js`. Reaccionar y quitar no recargan el muro (D039): `public/js/connect.js` pide JSON (`Accept: application/json`) y el controlador responde los números; sin JavaScript, se recarga como antes. Probado por la autora (T028 terminado). Las ideas de monedas, eventos e intercambios son propuestas para después del MVP (TECH_SPEC §5.2): no se construyen sin que la autora las decida.
- Sello Studio hecho (D041, E0057): «Mis sellos» y el editor en `/studio/sellos`.
  - **Contenido:** una palabra en hangul, el avatar o los dos, nunca vacío; alias opcional; **sin nombre personal ni texto libre**; hasta 3 de los 12 adornos (9 de las reacciones de Connect y estrella, nota y rayitas, dibujados por ChatGPT en `public/img/sello/motivos/`); paleta del sello de 35 colores: los 3 del logo, 9 vivos que pidió la autora (D046: rojo, amarillo y los vivos de «Mi ambiente») y los 23 de la ropa del editor.
  - **Encuadres del avatar:** recortes medidos por ChatGPT con todo el catálogo del editor (rostro `25 -5 350 370`, solo con las capas de la cabeza; cuerpo `25 -5 350 450`). Son amplios para no cortar nada, y el avatar sale algo pequeño: pendiente de que la autora lo confirme.
  - **Vista previa:** `GET /studio/sellos/vista-previa` responde `{ svg, avisos, ayuda }` si se pide JSON (test 19b); la usa `public/js/sello.js` (ChatGPT). Sin JavaScript, el botón «Ver cómo queda».
  - **Dibujo:** distribución automática y avisos de contraste en `services/selloDibujo.js`; se pinta con `views/_sello.ejs`.
  - **Guardado:** receta validada en `services/selloService.js`, con versión, límite de 20 y 404 para otra cuenta. Tabla en la migración `005_sellos.sql`.
  - **Catálogos:** `src/catalogos/sello.js` y `hangul.js`.
  - **Avatar:** la receta guardará una copia del avatar (`origen`, `encuadre`, `copia`), pero hasta que Avatar Studio guarde avatares el servidor rechaza cualquiera. Nunca uses un avatar de muestra como si fuera del usuario. El dibujador del editor (`Catalogo` y `svgDelAvatar`) **sí funciona en Node** si se precarga el catálogo desde el disco, sin `cargarCatalogo` (que usa el navegador): así lo hace `editor-avatar/editor-avatar/tests/avatar-sello-node.test.js`. Dentro del sello, con `conFondo: false`. La entrega de ChatGPT, con la receta del avatar y cómo reutilizar el PDF, está en `editor-avatar/editor-avatar/propuestas-sello/ENTREGA_SELLO_A_CLAUDE.md`.
  - **Vistas:** su diseño es de ChatGPT (E0058). Conserva los nombres de los campos y los textos de `tests/sellos.test.js`.
  - **Pendiente:** el avatar dentro del sello (T034); la imagen de perfil, que puede ser un avatar, un sello o los dos (D044); e imprimir y descargar (D045, T035).
- Pendiente del MVP (D014): Avatar Studio, que espera a que la autora termine el editor con ChatGPT.
- Dirección artística aprobada (D040, TECH_SPEC §2.7): «Mi rincón fan» (editor y Mi K-ME), «Mi escenario» (eventos) y «Mi álbum vivo» (Mis tesoros), con acabados mezclados y la paleta y el logo de siempre. Es una dirección, no un diseño cerrado: no rehagas pantallas sin que la autora lo pida. Pendiente de corregir: el contraste AA del botón principal y del borde de los campos (T030).
- Encuentro previo, luces, YouTube, cámara y álbum son **propuestas** (P019–P022, TECH_SPEC §5.2): no se construyen sin decisión de la autora. Si algún día se integra YouTube: reproductor oficial, visible y entero; nada de premios por ver vídeos, porque las políticas de YouTube lo prohíben; y habrá que ajustar la CSP. Las notas y láminas de ChatGPT sobre esto están en `editor-avatar/editor-avatar/propuestas-tesoros/` (su zona: no las edites).

## Comandos (desde `app/`)
- Arrancar: `npm run dev` → http://localhost:3000. Si el 3000 está ocupado (la autora tiene otra app en él), en PowerShell: `$env:PORT = '3001'; npm run dev` → http://localhost:3001
- Tests: `npm test` (necesitan `app/.env.local`; sin él se marcan como omitidos, **no** como superados)
- Un solo archivo de tests: `node --env-file-if-exists=.env.local --test tests/auth.test.js`
- No uses `--test-name-pattern` con `tests/auth.test.js`: sus subtests van dentro de un test padre y el proceso se queda colgado (comprobado el 17/11/2026).
- Cada `after()` de los tests cierra el servidor y la conexión dentro de un `finally`. Si no, cuando la limpieza falla (por ejemplo, en rojo, antes de su migración), `npm test` se queda colgado (V022, 21/11/2026). Los archivos de tests nuevos siguen el mismo patrón.
- Base de datos: `npm run comprobar-bd`, `npm run migrate`
- Tests de la comprobación antes de cada commit, **desde la raíz de `k-me`** (no desde `app/`): `node --test ".githooks/tests/*.test.mjs"` (23 tests, unos 30 s). Con la carpeta (`.githooks/tests/`) en vez del patrón entre comillas, `node --test` falla.

## Stack y estructura
JavaScript con módulos ES (`import`), Node.js 22+, Express 5, EJS, PostgreSQL (`pg`), tests con `node:test`. MVC:
- `src/models/`: solo acceso a datos (SQL). `src/services/`: reglas de negocio. `src/controllers/`: reciben la petición y eligen la vista.
- `src/routes/`: URL → middleware → controlador. `src/middleware/`: sesión, CSRF, límite de intentos, acceso privado.
- `src/views/`: plantillas EJS. `public/`: CSS e imágenes. `db/migrations/`: SQL numerado (`003_….sql`), nunca se edita una migración ya aplicada.
- `tests/`: un archivo por funcionalidad (`avatares.test.js`…).
Cualquier biblioteca o tecnología nueva se justifica y se pregunta antes de instalarla.

## Cómo funciona por dentro
- `src/app.js` exporta `crearApp()` (los tests la arrancan en un puerto libre); `src/server.js` solo la pone a escuchar.
- Orden de middleware en `app.js`: helmet → formularios (`urlencoded`, 10 kb) → estáticos → sesión → `tokenCsrf` → `res.locals.aliasSesion` (el alias de la sesión, para la cabecera; no llamarlo `alias`, para que no lo tape ningún dato que una vista reciba con ese nombre) y `res.locals.rutaActual` (marca la página actual en el menú) → rutas → 404 → error 500. Los middleware nuevos se colocan respetando este orden.
- Sesión: en PostgreSQL (tabla `sesiones`), dura 24 h, o 7 días si al entrar se marca la casilla `mantener_sesion` (constantes en `middleware/sesion.js`). Con `rolling` cada petición renueva el plazo. La cuenta está en `req.session.usuarioId` y su alias público en `req.session.alias`.
- Cuentas (D020): columna `usuario` (privado, solo para entrar; nunca se guarda en la sesión ni se muestra) y columna `alias` (público), las dos únicas sin distinguir mayúsculas. `crearCuenta` lanza errores con `codigo` (`DATOS_NO_VALIDOS`, `ALIAS_IGUAL_USUARIO`, `ALIAS_NO_PERMITIDO`, `USUARIO_DUPLICADO`, `ALIAS_DUPLICADO`) y `registroController` decide el mensaje: el general para todo salvo los errores del alias (en uso, igual al usuario o con una palabra no permitida; D021, D042). Los formularios nunca se rellenan con lo escrito (D022), salvo el usuario tras un error del alias (D036: `errorEnAlias` y `usuarioEscrito` en la vista). Las contraseñas nunca vuelven en la página.
- Contraseña: de 12 a 128 caracteres, sin reglas de composición (`validarPassword` en `authService.js`). Al entrar, más de 128 se rechaza antes de calcular el hash.
- CSRF: `tokenCsrf` deja `csrfToken` disponible en todas las vistas, y cada formulario lo envía en el campo oculto `_csrf`. Cada ruta POST añade `comprobarCsrf`. En `/entrar` y `/registro` va después del límite de intentos (`limiteIntentosLogin`, `limiteRegistro`), para que cuenten todos los intentos.
- Errores: se muestra `error.ejs` con `{ titulo, mensaje }`. Cada vista incluye `_cabecera` y `_pie`. Las páginas de entrada los incluyen con `{ paginaDeEntrada: true }`: sin barra de cabecera y sin el lema en el pie (D037).
- Configuración: los scripts de npm cargan `.env.local` con `--env-file-if-exists`. `cargarEnv()` se detiene si falta una variable o si todavía vale `CAMBIAR_POR…`.
- Migraciones: `scripts/migrate.js` aplica cada `.sql` dentro de una transacción y apunta en `schema_migrations` las que ya se han aplicado.

## Seguridad (no negociable)
Las reglas de secretos, datos ficticios y Git están en «Seguridad y Git», justo debajo.
- SQL siempre parametrizado (`$1, $2…`), nunca concatenando texto.
- Toda ruta privada usa `requiereSesion`. Todo formulario `POST` lleva el token CSRF.
- **Propiedad de los recursos:** cada consulta de datos de un usuario filtra por el id de la sesión (`WHERE id_usuario = $1`), nunca por un id que llegue del formulario o de la URL. Cada recurso nuevo tiene un test que demuestra que **otra cuenta no puede verlo ni modificarlo**.
- Puntos y recompensas solo los calcula el servidor; nunca se fían de un valor enviado por el navegador.
- En EJS, el texto del usuario se pinta con `<%= %>` (escapado); `<%- %>` solo para plantillas parciales propias.
- Trabajo local: no publicar ni subir nada a servicios externos sin que la autora lo pida expresamente. Sin envío de correos ni verificación por correo (D018).

## Seguridad y Git
El repositorio de GitHub (`ccrriiss78/K-Me-app`) es **público**: lo que se sube lo puede ver cualquiera y, aunque se borre después, queda en el historial.
- Nunca entran en Git: `.env` ni ningún `.env.*` (salvo `.env.example`, con valores ficticios), contraseñas, claves, tokens, cookies, identificadores de sesión, copias de la base de datos, registros (logs) ni datos personales.
- Nunca leas, muestres ni copies el contenido de `app/.env.local` ni de otros secretos.
- Usuarios de prueba y de demo: siempre ficticios y con los datos mínimos. Nunca nombres, correos, fotos ni datos de personas reales.
- Nada de secretos en el código, los tests, las semillas, el README, la bitácora, los mensajes de commit, los mensajes de error ni el chat.
- Al empezar una sesión, `git status` (si falla, dilo; no des el árbol por limpio). Los cambios sin commit que no son tuyos son de otra sesión o de ChatGPT: avisa a la autora y consérvalos intactos. No los deshagas (`git checkout .`, `git restore .`, `git stash`, `git reset`) ni los metas en tus commits.
- Antes de editar un archivo, reléelo: ChatGPT puede haberlo cambiado mientras tanto.
- Antes de cada commit: enseña a la autora `git status` y la lista de archivos que van a entrar, y espera su aprobación. Añade solo los archivos aprobados, por su nombre (nunca `git add -A` ni `git add .` sin esa revisión).
- No hagas commits, no añadas el remoto ni hagas `git push` sin que la autora lo pida.
- En `k-me`, el correo de los commits es el correo privado de GitHub de la autora (noreply), configurado solo en esta carpeta (D035). No lo cambies ni lo escribas en ningún archivo.
- Prohibido sin permiso de la autora: `git push --force`, reescribir el historial (`rebase`, `commit --amend`, `reset` de commits ya hechos), saltarse la comprobación previa al commit (`--no-verify`), cambiar la visibilidad del repositorio o crear tokens.
- Si la comprobación antes del commit lo para por un correo, pregunta a la autora: solo ella decide qué direcciones se añaden a `.githooks/correos-permitidos.txt`. Si lo bloquea por un secreto, quita el dato o saca el archivo del commit; nunca te la saltes.
- Si se sube un secreto por error: para, avisa a la autora y no intentes arreglarlo por tu cuenta.

## Reglas del producto
- Guardado en el servidor (PostgreSQL), asociado a la cuenta: lo guardado se recupera desde otro navegador o dispositivo. `localStorage` solo para comodidades no importantes.
- «Recuperar la última sesión» = recuperar lo **confirmado como guardado**. Dos ediciones a la vez de la misma creación no se sobrescriben en silencio (por ejemplo, con un número de versión).
- Los colores del usuario se eligen solo de la paleta de la app (muestras de color en botones), nunca escribiendo códigos. No hay círculo cromático, ni en el MVP ni después (TECH_SPEC §2.5, decidido el 19/11/2026). «Mi ambiente» también usa solo la paleta, sin selector libre (D024, «de momento»: la autora podrá revisarlo después del MVP). Los colores de marca y los del usuario van por separado.
- No inventes palabras ni traducciones en hangul: usa solo el catálogo validado por la autora (`src/catalogos/hangul.js`, D043). Solo entra una palabra con su propia entrada en un diccionario del NIKL, con su fuente y el visto bueno de la autora.
- Los recursos gráficos van separados de la lógica, para poder cambiar ilustraciones sin romper diseños guardados.
- Accesibilidad: contraste AA, foco visible, se puede usar con teclado y se respeta `prefers-reduced-motion`.

## Tests
- TDD: primero los tests, que deben fallar por lo que comprueban (no porque falte un archivo).
- Al menos un test por criterio de aceptación, con el criterio en el nombre. El nombre describe lo que de verdad puede hacerlo fallar.
- Cada test de error comprueba el estado HTTP y el mensaje que ve el usuario.
- Cada recurso de usuario tiene su test de «otra cuenta no puede» (ver Seguridad).
- Los tests crean sus cuentas con usuario `test_xxxx` y alias `fan_xxxx` (el uno no contiene al otro) y las borran al terminar.
- Patrón de tests (ver `tests/auth.test.js`): `before` arranca `crearApp()` en el puerto 0; `navegador()` simula un navegador que guarda la cookie y saca el `_csrf` del HTML; los subtests van dentro de un `test` padre con `skip` si no hay configuración; `after` borra las cuentas `test_…` y, en un `finally`, cierra el servidor y el pool.

## Forma de trabajar
- Planifica antes de editar y espera el visto bueno de la autora.
- Para crear o modificar archivos usa Edit o Write, nunca Python, sed ni redirecciones (las barras invertidas se pierden; aprendido en el proyecto de la biblioteca).
- No digas que algo está hecho sin haber ejecutado `npm test`; si los tests se omiten por falta de configuración, dilo.
- Al terminar: actualiza «Estado actual», añade la sesión a `BITACORA_KME.md` siguiendo su protocolo (sin secretos) y termina con un resumen que incluya las decisiones que has tomado sin preguntar.
- Protocolo de la bitácora (apartados 1, 10 y 11): sesión nueva E000N con la plantilla del apartado 10; actualizar solo los D/T/V afectados; subir la revisión (R000N) **una vez** por actualización, con su fila en el apartado 13; «funciona» solo con una prueba V… que lo respalde.
