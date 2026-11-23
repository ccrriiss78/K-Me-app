# K-ME · Documento de traspaso para un chat nuevo

**Fecha:** 17/11/2026 · **Autora:** Cristina (estudiante de programación web, licenciada en Bellas Artes)

> **Para el asistente del chat nuevo:** este documento resume todo lo trabajado sobre K-ME en un chat anterior. Léelo entero antes de empezar. Responde siempre en **español sencillo**, con pasos cortos y comandos exactos: la autora está aprendiendo y quiere **entender** lo que se construye, no solo que funcione.

---

## 1. Qué es K-ME

App web para fans del K-pop. Lema: **«Sin fan no hay idol»**. El fan es protagonista y expresa su identidad con **avatares**, **sellos personalizados** y creaciones.

Tiene dos espacios:

- **K-ME Studio** (creativo): Avatar Studio y Sello Studio.
- **K-ME Connect** (social): muro, publicaciones, reacciones y retos.

Es un **proyecto propio**, separado de los ejercicios de clase. Objetivo: un primer prototipo hacia finales de noviembre de 2026 (fecha y alcance exactos sin cerrar).

## 2. Dónde está

- **Carpeta:** `C:\Users\<usuario>\Desktop\ACTIVA2026\k-me`. Antes se llamaba `k_me`.
- Se abre `k-me` como carpeta general en VS Code. **Todo el código está en `k-me/app/`, y todos los comandos se ejecutan desde `app/`.**

| Archivo o carpeta | Qué es |
|---|---|
| `BITACORA_KME.md` | **Único cuaderno del proyecto**: historia, decisiones (D…), propuestas (P…), pruebas (V…), pendientes (T…) y sesiones (E…). Tiene su propio protocolo de revisiones (R0001, R0002…). Última revisión conocida: **R0009** (sesión E0009). |
| `README.md` | Puesta en marcha paso a paso y pruebas manuales de la fase 1 |
| `PROMPT_INICIAL_CLAUDE_KME.md` | Primer encargo que se dio a Claude: visión completa, seguridad y fase 1 |
| `CLAUDE.md` | **Nuevo (16/11):** normas para el agente de Claude Code (ver §5) |
| `docs/TECH_SPEC.md` | **Nuevo (16/11), versión 1.1:** qué se construye y cómo (ver §6) |
| `K-ME.odt`, `K-ME_app.odt` | Documentos de concepto |
| `K-ME-logos-revisados-v1.1/` | Originales de marca: no se tocan; solo se copian a `app/public/img/` los gráficos que la app sirve |
| `app/` | El código |

## 3. Tecnología y estado actual

**Stack:** Node.js 22+ (probado con 24.18), Express 5, EJS, PostgreSQL 18, JavaScript con módulos ES, tests con `node:test`. Arquitectura **MVC**:

- `src/models/`: SQL parametrizado;
- `src/services/`: reglas de negocio;
- `src/controllers/`: reciben la petición y eligen la vista;
- `src/routes/`: URL → middleware → controlador;
- `src/middleware/`: sesión, CSRF, límite de intentos, acceso privado;
- `src/views/`: plantillas EJS;
- `db/migrations/`: SQL numerado;
- `scripts/` y `tests/`.

**Fase 1 hecha y probada por la autora en su ordenador:**

- cuentas ficticias creadas con `npm run crear-cuenta`;
- entrar (`/entrar`), página privada «Mi K-ME» con el alias (`/mi-kme`) y salir;
- base `kme_dev` con el usuario `kme_app`;
- migraciones `001_usuarios.sql` y `002_sesiones.sql` aplicadas.

**Seguridad de la fase 1:**

- contraseñas con Argon2id;
- sesiones guardadas en PostgreSQL, cookie HttpOnly;
- token CSRF en los formularios;
- límite de 10 intentos cada 15 minutos;
- Helmet;
- secretos solo en `app/.env.local`, que está excluido de Git.

**Comandos (desde `app/`):** `npm run dev` (http://localhost:3000), `npm test`, `npm run comprobar-bd`, `npm run migrate`, `npm run crear-cuenta`.

> **Seguridad:** nunca pedir ni pegar contraseñas ni el contenido de `.env.local` en el chat. Si hace falta una contraseña, la autora la escribe ella misma en su terminal, de forma oculta.

## 4. Pendientes de la bitácora (estado al 16/11)

- **T013:** resto de pruebas manuales de la fase 1 (salir, página privada sin sesión, contraseña incorrecta, segundo navegador).
- **T014:** el logo de la entrada de la app (ver §6.3). Hoy la cabecera muestra el logo de Connect.
- **T012:** especificación de Avatar Studio y Sello Studio. **Hecha en borrador:** `docs/TECH_SPEC.md` v1.1. Falta registrarla en la bitácora.
- **T005, T006, T009:** guardado y conflictos, avatar en publicaciones, círculo cromático. Las tres están definidas en el TECH_SPEC.
- **Git:** todavía no hay repositorio (el `.gitignore` de la raíz ya está preparado).

**Pendiente de la sesión del 16/11:** apuntar en `BITACORA_KME.md` una sesión nueva (E0010, revisión R0010) siguiendo su protocolo. Debe recoger la creación de `CLAUDE.md` y `docs/TECH_SPEC.md`, las decisiones Q1–Q10 y la aclaración de los logos (§6.3), que completa D012.

## 5. El harness de K-ME

El **harness** son las instrucciones y comprobaciones que rodean al agente (Claude Code en la terminal de VS Code) para que trabaje bien. Se aprendió en el proyecto de clase (App Biblioteca), donde funcionó muy bien.

| Pieza | Para qué sirve | Estado en K-ME |
|---|---|---|
| `CLAUDE.md` | Normas que el agente lee al empezar | **Hecho** (16/11) |
| `.claude/commands/nueva-funcionalidad.md` | El método: plan → esperar visto bueno → tests en rojo → esperar → implementar → `npm test` → resumen | **Pendiente** |
| `.claude/agents/revisor.md` | Un segundo agente que revisa el trabajo, solo lee, relee el archivo actual y cita líneas exactas | **Pendiente** |
| `.claude/settings.json` (hooks) | Comprobaciones automáticas: bloquear escrituras por consola, ejecutar los tests al terminar… | **Pendiente** |

La carpeta `.claude` la tiene que crear **el agente de Claude Code de K-ME**, porque desde el chat no se puede escribir en ella.

**Qué dice el `CLAUDE.md` (resumen):**

- **Antes de empezar:** leer la bitácora y el TECH_SPEC; lo que no esté decidido se **pregunta**, no se inventa.
- **Seguridad:**
  - SQL parametrizado;
  - `requiereSesion` en las rutas privadas y CSRF en todo POST;
  - **propiedad de los recursos**: cada consulta filtra por el usuario de la sesión, y cada recurso tiene un test que demuestra que **otra cuenta no puede verlo ni modificarlo**;
  - los puntos solo los calcula el servidor;
  - en EJS, `<%= %>` para el texto del usuario.
- **Producto:** guardado en el servidor; no sobrescribir en silencio; círculo cromático; nada de hangul inventado; accesibilidad AA.
- **Tests:**
  - TDD: los tests fallan primero, por lo que comprueban;
  - un test por criterio, y su nombre dice lo que de verdad comprueba.
- **Forma de trabajar:**
  - planificar y esperar el visto bueno;
  - crear y editar archivos solo con Edit o Write, **nunca con Python, sed ni redirecciones** (las barras invertidas se pierden; lección de la biblioteca);
  - no decir «hecho» sin `npm test`;
  - al terminar, actualizar la bitácora.

**Lecciones del proyecto de clase que se aplican aquí:**

- Las reglas escritas a veces se incumplen. Las que comprueba una máquina (tests, hooks, lint) funcionan.
- El revisor también se equivoca: hay que comprobar lo que dice.
- Un test puede pasar sin comprobar lo que dice su nombre.
- Un hook también necesita tests.
- Probarlo una persona encuentra fallos que los tests no ven.

## 6. Decisiones del TECH_SPEC (versión 1.1, 16/11/2026)

Cada punto del TECH_SPEC está marcado como **[DECIDIDO]**, **[PROPUESTA]** o **[PREGUNTA]**. El agente solo implementa lo decidido o lo confirmado por la autora. El documento **se puede cambiar**: se sube la versión, se anota en la bitácora como decisión que sustituye a la anterior y, si ya hay datos guardados, se hace con una migración.

### 6.1 Principios comunes

- Cada diseño se guarda como **«receta»** (JSONB con las piezas, colores y opciones), no como imagen. Las piezas gráficas van separadas: se pueden redibujar sin romper lo guardado. El servidor valida cada receta.
- Varios diseños por cuenta: **20 avatares y 20 sellos** (Q1). Eliminar es **definitivo, con confirmación** (Q2).
- **Guardado manual** con aviso de cambios sin guardar (Q3). Número de `version` en cada diseño: si cambió en otro dispositivo, se avisa y no se sobrescribe.
- Si un diseño no es tuyo, la respuesta es **404**.
- Colores en HSL, elegidos con un **círculo cromático** (fase propia). Hasta entonces, una paleta fija.

### 6.2 Avatar Studio

- **Capas (Q4)**, de atrás hacia delante: fondo, cuerpo y tono de piel, ropa, cara, ojos, boca, pelo y accesorios (varios).
- **Expresión (Q5):** la combinación de ojos y boca elegida al diseñar, una por avatar. Ampliable más adelante.
- **Piezas (Q6):** las diseña la autora. Mientras tanto, el agente usa piezas provisionales sencillas en SVG (lienzo de 512 × 512), en `app/public/img/piezas/<capa>/`, con su catálogo en la tabla `piezas`.
- **Avatar del perfil y avatar de la publicación (Q7, resuelve T006):**
  - el **avatar del perfil** (activo) es tu identidad en la interfaz y siempre se ve el actual;
  - **al publicar**, eliges qué diseño acompaña a la publicación (cualquiera de tus avatares o sellos guardados, o uno que creas en ese momento), y se guarda **una copia**;
  - si no eliges nada, se usa el avatar del perfil.
  - **Q11 sigue abierta:** si no eliges nada y luego cambias el avatar del perfil, ¿cambia en esa publicación (A, propuesta) o se queda el del día de publicar (B)? Se decide antes de Connect.
- **Tablas propuestas:** `piezas`, `avatares` (id, id_usuario, nombre, composicion JSONB, version, fechas) y `usuarios.id_avatar_activo`.
- **Rutas propuestas:** `/studio/avatares` (listar, nuevo, crear, abrir, guardar, duplicar, activar y eliminar con confirmación).

### 6.3 Los logos (aclaración de la autora)

Los nombres de los archivos confunden:

| Logo | Cómo es | Archivo | Uso |
|---|---|---|---|
| **Logo general de K-ME** | Rectángulo vertical de esquinas redondeadas con «K», carita y «ME» | `K-ME-Studio.svg` | La marca y la **estructura de los sellos** |
| **Logo de K-ME Connect** | El mismo rectángulo dentro de un círculo con trazos rosas | `K-ME-general.svg` | La parte social: muro, publicaciones y retos |

- Propuesta: no renombrar los originales y, al copiarlos a la app, llamarlos `logo-kme.svg` y `logo-connect.svg`.
- **Pregunta pendiente:** ¿la cabecera de la app debe mostrar el logo general? Si es que sí, se resuelve T014.
- En la página de prueba de los logos (`COMPROBAR-LOGOS.html`), la imagen «General · PNG» sale rota en los dos fondos. Seguramente busca un archivo con otro nombre. No afecta a la app.

### 6.4 Sello Studio

- **(Q8)** Toma la **estructura del logo general**: el mismo rectángulo redondeado, cuya forma no cambia. El usuario personaliza el interior. Zonas propuestas (dime si las quieres distintas):
  - **arriba**, en lugar de la «K»: 1 o 2 palabras del catálogo, **en hangul**;
  - **centro**, en lugar de la carita: hasta 3 motivos decorativos de un catálogo de la app (corazón, estrellas, lightstick…), que diseña la autora;
  - **abajo**, en lugar de «ME»: el nombre del usuario;
  - **colores:** a elección para el borde, el fondo y cada elemento.
- **Nombre personal (Q9):** se permite además del alias. Límites propuestos:
  - de 2 a 15 letras;
  - siempre escapado al dibujarlo;
  - una lista de palabras no permitidas;
  - el aviso «sin apellidos».

  Se muestra en letras latinas y **no se transcribe automáticamente a hangul**. No hay más texto libre.
- **Catálogo de hangul (Q10):** una lista corta de palabras **propuestas por la autora**, preparada con ayuda de IA y **comprobada**:
  1. La autora elige la palabra en español.
  2. La IA propone el hangul, la romanización y una explicación.
  3. Se contrasta en un diccionario coreano (Naver o el del Instituto Nacional de la Lengua Coreana) y, si es posible, con una persona que hable coreano.
  4. Se anota la fuente.

  La IA sola no basta. El catálogo va en un archivo de datos (`app/db/datos/palabras_hangul.json`), y el agente **nunca** añade palabras por su cuenta.
- **Tablas propuestas:** `sellos` (como `avatares`, sin «activo») y `palabras_hangul` (id, hangul, romanización, significado, fuente, validada_por, validada_en). El sello guarda el `id` de la palabra, no el hangul copiado.

### 6.5 Orden de construcción propuesto

Cada paso es un encargo de `/nueva-funcionalidad`, con plan, tests en rojo, revisor y entrada en la bitácora.

1. Piezas provisionales y Avatar Studio mínimo: crear, guardar, listar, abrir, renombrar y eliminar, con propiedad y conflictos.
2. Avatar activo y duplicar.
3. Círculo cromático: ratón, teclado y pantalla táctil.
4. Sello Studio: marco, motivos, nombre y colores.
5. Palabras en hangul en el sello, cuando el catálogo esté comprobado. La autora puede ir preparándolo en paralelo.
6. Connect: muro y publicaciones con el diseño elegido, después de decidir Q11.

## 7. Próximos pasos sugeridos

1. Contestar las dos preguntas pendientes:
   - si la cabecera debe llevar el logo general (T014);
   - si las zonas del sello están bien.
2. En VS Code, con `k-me` abierto, arrancar Claude Code en la terminal (`claude`) y pedirle:
   - que cree las piezas que faltan del harness en `.claude/` (el comando `/nueva-funcionalidad`, el agente revisor y los hooks);
   - que añada la sesión E0010 a la bitácora.
3. Iniciar Git en `k-me`, con el `.gitignore` ya preparado. Comprobar antes de cada commit que `.env.local` no aparece.
4. Empezar el paso 1 del §6.5 con `/nueva-funcionalidad`.
5. Ir preparando la lista de palabras en hangul y el estilo de las piezas del avatar y de los motivos del sello.

## 8. Cómo trabaja la autora (para el asistente)

- Usa **VS Code en Windows** con PowerShell y **Claude Code en la terminal**. Copia en el chat lo que sale en la terminal, o envía capturas.
- Tiene activado el **autoguardado** de VS Code.
- Prefiere que el asistente **le guíe paso a paso**: qué pegar, dónde y qué esperar.
- En PowerShell, las variables se ponen así: `$env:PORT=3001; npm run dev`.
- El puerto 3000 es el de K-ME. El proyecto de clase usa el 3001.
