# AGENTS.md · K-ME

## Lectura obligatoria
Antes de empezar:
1. Ejecutar git status.
2. Leer BITACORA_KME.md: revisión actual, última sesión y pendientes.
3. Leer CLAUDE.md, especialmente «Seguridad y Git».
   Las normas completas del proyecto están en ese archivo.
4. Consultar docs/TECH_SPEC.md para la tarea correspondiente.

Las instrucciones actuales de la autora prevalecen sobre estos archivos.
Si existen contradicciones que afecten a la tarea, consultarlas antes de editar.

## Carpeta de trabajo
Trabajar únicamente en k-me.
El editor está en editor-avatar/editor-avatar/.
No usar la ruta anterior ni trabajar en la copia antigua.

## Trabajo simultáneo y reparto de zonas
Claude Code y ChatGPT trabajan a la vez en esta carpeta.

Zona de ChatGPT:
- Todo editor-avatar/, incluidos sus tests y recursos.
- app/public/css/.
- Diseño y presentación de las vistas .ejs en app/src/views/.
- app/public/img/ y app/public/js/ (imágenes y JavaScript del navegador).
- AGENTS.md, solo con aprobación de la autora.

En las vistas, conservar:
- Los textos que comprueban los tests.
- Los nombres de los campos de los formularios.
- El campo _csrf y su funcionamiento.
- La lógica de autenticación, registro y sesiones.

En las vistas y el CSS, además:
- El texto del usuario se pinta siempre con <%= %> (escapado).
  <%- %> solo para incluir plantillas parciales propias.
- Nada de <script> escrito dentro de la vista ni atributos como onclick:
  la protección de la app (CSP) los bloquea. El JavaScript va en
  archivos de app/public/js/.
- Contraste AA, foco visible, uso con teclado y prefers-reduced-motion.

Zona de Claude:
- Login, registro y sesiones en app/src/, salvo su presentación.
- Tests de app/.
- Scripts de app/.
- Base de datos y migraciones.
- Hooks y CLAUDE.md.
- Código de servidor de Avatar Studio, Sello Studio y Connect: rutas,
  controladores, servicios y modelos.
- package.json y dependencias de app/.
- README.md.
- .gitignore, .gitattributes y la configuración de Git.

Zona compartida (una herramienta cada vez):
- BITACORA_KME.md.
- docs/TECH_SPEC.md: solo recoge decisiones de la autora;
  cada cambio sube su versión.

Ningún agente los modifica:
- Los originales de la raíz: K-ME-logos-revisados-v1.1/, KME_Studio_Kit_01/,
  KME_Rostros_Sin_Pelo/, los .zip y los .odt.

Cualquier archivo que no esté en ninguna zona: preguntar a la autora
antes de editarlo.

Si una tarea requiere modificar la zona de Claude, parar y preguntar
a la autora. No ampliar el alcance por iniciativa propia.

## Protección del trabajo ajeno
- Al empezar, ejecutar git status. Si falla, informar del error;
  no afirmar que el árbol está limpio.
- Si aparecen cambios que no son propios, avisar a la autora
  y conservarlos intactos.
- Antes de editar, releer los archivos afectados para detectar
  cambios concurrentes. Si otra herramienta está editando el mismo
  archivo, coordinar el acceso antes de escribir.
- No borrar, sobrescribir ni deshacer cambios ajenos.
- No usar git checkout ., git restore ., git stash ni git reset.

## Git y aprobación de commits
- Nunca usar git add . ni git add -A.
- Al terminar, mostrar git status y la lista exacta de archivos
  propios propuestos para el commit.
- Esperar la aprobación de la autora antes de preparar el commit.
- Añadir y hacer commit solo de los archivos aprobados,
  nombrándolos uno a uno.
- Si un archivo contiene cambios propios y ajenos, no incluirlo
  entero como propio: coordinar antes su incorporación.
- No reescribir el historial, hacer push, añadir remotos,
  saltarse hooks ni cambiar la configuración de Git.

## Seguridad
- Nunca leer, mostrar, copiar ni subir contraseñas, secretos,
  archivos .env, datos personales, tokens, cookies o sesiones.
- No leer, mostrar ni incluir en Git fan01.txt ni
  notalogindemo.despuesborrartxt.txt.
- .env.example solo puede contener valores ficticios.
- Usar datos ficticios y mínimos en pruebas y demostraciones.
- Cumplir íntegramente estas secciones de CLAUDE.md: «Seguridad (no negociable)»,
  «Seguridad y Git», «Reglas del producto» y «Tests».

## Desarrollo y validación
- Seguir TDD: escribir primero los tests y comprobar que fallan
  por el comportamiento que se quiere implementar.
- No modificar tests existentes sin aprobación de la autora.
- Los tests de app/ corresponden a Claude.
- No ejecutar npm install sin avisar previamente.
- Consultar antes de incorporar bibliotecas o tecnologías nuevas.
- No cambiar la paleta de colores sin aprobación de la autora.
- Comunicar qué pruebas se ejecutaron y sus resultados reales.
  Una prueba omitida no cuenta como superada.

## Bitácora compartida y cierre
- Al terminar cada sesión, registrar el trabajo en BITACORA_KME.md
  siguiendo su protocolo.
- La bitácora es compartida: solo una herramienta escribe cada vez.
- Releerla justo antes de guardar; si ha cambiado, integrar la
  actualización sobre la versión vigente sin pisar otras entradas.
- Conservar el historial, evitar duplicados y aumentar la revisión
  una sola vez por actualización.
- Distinguir propuestas, decisiones, cambios realizados,
  pruebas ejecutadas y pendientes.
- No modificar CLAUDE.md: corresponde a Claude. Si algo debería
  cambiar en él, proponerlo en el resumen final y en la bitácora;
  la autora se lo pedirá a Claude.
- Presentar al terminar los archivos propios modificados,
  la validación realizada y los pendientes.
