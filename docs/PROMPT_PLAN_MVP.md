# Prompt para el plan del MVP de K-ME

**Cómo usarlo:** abre un chat nuevo en claude.ai con Claude Opus, adjunta estos archivos (los cinco salen de `C:\Users\<usuario>\Desktop\ACTIVA2026\k-me`) y pega todo el texto del bloque de abajo.

1. `docs/TECH_SPEC.md` (versión 1.2)
2. `BITACORA_KME.md` (revisión R0010 o posterior)
3. `CLAUDE.md`
4. `README.md`
5. `docs/KME_traspaso_2026-11-17.md`

Cuando te devuelva el plan, guárdalo como `docs/PLAN_MVP_KME.md` y pide a Claude Code que lo apunte en la bitácora.

---

```text
Eres un desarrollador sénior y jefe de proyecto. Ayudas a una estudiante de programación web a llevar su app K-ME a un MVP. Tu tarea: escribir un plan en Markdown para llegar al MVP entre el 18/11/2026 y el 26/11/2026 (9 días), trabajando con «vibecoding» rápido pero seguro. Claude Code escribe el código en su ordenador y ella dirige, revisa, prueba y aprende.

ARCHIVOS ADJUNTOS Y PRIORIDAD
Te adjunto: docs/TECH_SPEC.md (v1.2), BITACORA_KME.md, CLAUDE.md, README.md y docs/KME_traspaso_2026-11-17.md.
Si se contradicen, manda este orden: 1) este prompt, 2) TECH_SPEC v1.2, 3) la bitácora, 4) CLAUDE.md, 5) README, 6) el traspaso (es una foto del 17/11 y está en parte desactualizado: ahí Q11 y el logo de la entrada aún figuraban como pendientes).
Antes de nada, indica qué archivos has recibido, la versión del TECH_SPEC y la revisión de la bitácora que has leído. Si falta alguno, dilo y sigue con lo que tengas, sin inventar su contenido.

QUÉ ES K-ME
App web para fans del K-pop: el fan es protagonista y expresa su identidad con avatares, sellos y creaciones. Lema: «Sin fan no hay idol». Dos espacios: K-ME Studio (Avatar Studio y Sello Studio) y K-ME Connect (lo social).

ESTADO DE PARTIDA
- Stack: Node.js 22+, Express 5, EJS, PostgreSQL (pg), JavaScript con módulos ES, MVC (models / services / controllers / routes / middleware / views), tests con node:test, migraciones SQL numeradas. Sesiones en PostgreSQL, CSRF por sesión, Argon2id, Helmet, límite de intentos.
- Hecho: cuentas ficticias, entrar, página privada «Mi K-ME», salir. 9 tests automáticos en verde.
- Registro por formulario: se construye en la sesión del 18/11, antes de empezar el plan. Si la bitácora no lo registra como terminado y probado, el día 1 empieza por terminarlo.
- La cabecera ya usa el logo general de K-ME (Studio). Los archivos de Connect ya se llaman «connect».
- Todavía no hay repositorio Git. Del harness de Claude Code solo existe CLAUDE.md: faltan el comando /nueva-funcionalidad, el agente revisor y los hooks (ver el traspaso, §5).

ALCANCE DEL MVP (decidido por la autora; no lo reabras)
- Avatar Studio según TECH_SPEC §3: capas, piezas provisionales en SVG, varios avatares (máximo 20), guardar como «receta» JSONB con número de version, avatar activo, duplicar, renombrar, eliminar con confirmación y conflicto de versión sin sobrescribir en silencio.
- Sello Studio según TECH_SPEC §4: marco del logo general, motivos decorativos de un catálogo, nombre personal con límites y colores. Hangul: solo palabras del catálogo que la autora prepara y comprueba en paralelo. El sello funciona sin palabras hasta que el catálogo esté cargado.
- Connect mínimo (TECH_SPEC §5.1):
  - un muro con las publicaciones de los fans;
  - una publicación es un diseño (avatar o sello) más una emoción de una lista cerrada, SIN texto libre;
  - el diseño se guarda como copia en la publicación. Si el fan no elige ninguno, se guarda una copia del avatar del perfil de ese momento, que ya no cambia (Q7 y Q11);
  - «crear un avatar en ese mismo instante» al publicar solo si no complica mucho; si no cabe, va a la lista de recortes;
  - reacciones con iconos de una lista;
  - retos: sus reglas NO están decididas. El plan reserva una sesión con la autora para especificarlas justo antes de construirlos y no propone reglas cerradas.
- Colores: solo paleta fija en botones, guardando HSL. El círculo cromático queda fuera del MVP.
- Todo en local, en el ordenador de la autora: sin despliegue, sin HTTPS público, sin servicios externos, sin CDN y sin subir nada a internet. Git solo local, sin remoto.
- Fuera del MVP: puntos y recompensas, Sound Studio, círculo cromático, recuperación de contraseña, despliegue. Si los retos parecen necesitar puntos, márcalo como [PREGUNTA] y no lo incluyas.

TIEMPO Y PERSONA
- 9 días, del 18/11 al 26/11, de 4 a 6 horas al día. Planifica con 4 horas como base y deja las 2 extra como margen, no como horas comprometidas.
- La autora es estudiante y artista (licenciada en Bellas Artes). Trabaja en Windows con VS Code, PowerShell y Claude Code en la terminal. Quiere entender lo que se construye. Las horas de cada día incluyen que ella lea el resumen, pruebe a mano y haga preguntas.
- En paralelo, ella tiene trabajo propio: dibujar las piezas finales del avatar y los motivos del sello (mientras tanto se usan provisionales), preparar y comprobar las palabras en hangul, decidir las listas de emociones y reacciones, y especificar los retos. Reparte esas tareas en el calendario y di qué día necesita estar lista cada una para no bloquear el código.

MODO «RÁPIDO PERO SEGURO» (lo eligió la autora)
- Claude Code puede escribir bloques grandes sin pedir permiso en cada paso. Ya no hay TDD estricto: los tests pueden escribirse junto con el código.
- No se negocia:
  - SQL parametrizado;
  - requiereSesion en toda ruta privada y token CSRF en todo POST;
  - cada consulta de datos del usuario filtra por el id de la sesión y responde 404 si el recurso no es suyo;
  - cada recurso nuevo (avatares, sellos, publicaciones, reacciones) tiene su test de «otra cuenta no puede verlo ni modificarlo»;
  - el servidor valida cada receta contra el catálogo y nunca guarda SVG ni HTML que llegue del navegador;
  - en EJS, el texto del usuario se pinta con <%= %>;
  - sin secretos en código, tests ni documentos; solo datos ficticios;
  - accesibilidad básica: contraste AA, foco visible, uso con teclado y prefers-reduced-motion.
- Cada día termina con npm test en verde, un commit local, una entrada en la bitácora (sesión E…) y un resumen en español sencillo para la autora: qué se ha hecho, por qué y cómo comprobarlo a mano.
- CLAUDE.md pide hoy TDD y visto bueno antes de cada cambio. Propón el texto exacto de una sección temporal «Modo MVP (18/11–26/11)» para CLAUDE.md, que la autora aprobará o no. No des por hecho que está aplicada.
- No hay bibliotecas nuevas por defecto: SVG, EJS y JavaScript del navegador sin frameworks. Si crees que una biblioteca ahorra mucho tiempo, preséntala como [PREGUNTA] con su motivo y la alternativa sin ella.

REGLAS PARA TI
- Usa las etiquetas del TECH_SPEC: [DECIDIDO] (con su referencia), [PROPUESTA] y [PREGUNTA]. No conviertas una propuesta tuya en decisión ni reabras lo decidido.
- No me hagas preguntas antes de escribir. Lo que no esté decidido va en el plan como [PREGUNTA], con tu opción por defecto marcada como [PROPUESTA] y el día en que hace falta la respuesta.
- No escribas ninguna palabra en hangul, ni siquiera de ejemplo.
- Para Connect sigue los patrones del TECH_SPEC: receta JSONB, version, id_usuario, 404 y límites. Propón sus tablas y rutas como [PROPUESTA], en un esquema corto (columnas y una línea de motivo), sin escribir el código.
- Sé realista: si el alcance no cabe en 9 días con 4 horas al día, dilo claramente y ordena qué recortar primero. Nunca recortes tests de seguridad ni de propiedad.
- Escribe en español sencillo, con frases cortas. Explica el porqué de cada decisión de orden o de recorte.

QUÉ DEBE CONTENER EL PLAN (docs/PLAN_MVP_KME.md)
1. Cabecera: fecha, versión del TECH_SPEC y revisión de la bitácora leídas, y un resumen de 5 líneas.
2. Definición de «MVP terminado»:
   - un recorrido de demostración con dos cuentas ficticias: registro → crear avatar → elegir activo → crear sello → publicar en el muro con una emoción → la otra cuenta reacciona → reto (si está especificado) → cerrar sesión y recuperar todo desde otro navegador;
   - criterios de aceptación numerados, cada uno con su forma de comprobarlo (test automático o prueba manual).
3. Alcance: dentro, fuera y supuestos, con etiquetas.
4. Preparación del día 1: Git local con su .gitignore (comprobar que .env.local no entra), modo MVP en CLAUDE.md, y el harness mínimo que de verdad ahorre tiempo (comando, revisor, hooks), como [PROPUESTA].
5. Calendario día a día (18/11 a 26/11). En cada día:
   - objetivo;
   - tareas de Claude Code;
   - tareas de la autora;
   - entregable que se puede ver en el navegador;
   - tests mínimos;
   - prueba manual;
   - horas estimadas;
   - riesgo principal;
   - un «encargo para Claude Code» listo para pegar, de 5 a 10 líneas, que cite las secciones del TECH_SPEC.
   El día 26 es de cierre: demo completa, pruebas manuales, retrospectiva (T010) y nada de funciones nuevas.
6. Puntos de control al final de los días 3 y 6: qué tiene que estar terminado y qué se recorta si no lo está.
7. Lista de recortes ordenada, de lo primero que se quita a lo último, con lo que se pierde en cada caso.
8. Propuesta de datos y rutas de Connect (publicaciones, reacciones y el hueco para retos).
9. Riesgos y cómo reducirlos, por ejemplo: editor de SVG en el navegador, conflictos de versión, piezas finales que llegan tarde, catálogo de hangul sin terminar.
10. Preguntas abiertas para la autora: cada una con su opción por defecto y la fecha límite para responderla.
11. Lista de comprobación para la demo del día 26.

FORMATO DE LA RESPUESTA
Entrega el plan como un único documento Markdown completo y descargable (o en un único bloque de código markdown), listo para guardarlo como docs/PLAN_MVP_KME.md. Fuera del documento escribe solo tres líneas: si el alcance cabe o no, el mayor riesgo y la primera pregunta que debe responder la autora.
```
