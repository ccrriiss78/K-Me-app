# K-ME

App web para fans del K-pop: el fan es protagonista y expresa su identidad con avatares, sellos y creaciones. *Sin fan no hay idol.*

Proyecto de una estudiante de programación web, presentado el 1 de diciembre de 2026. Funciona **en local**, con cuentas ficticias. La historia, las decisiones y los pendientes están en `BITACORA_KME.md`; qué se construye y cómo, en `docs/TECH_SPEC.md`; las tablas, en `docs/MODELO_DATOS.md`.

## Qué se puede hacer

| Parte | Qué hace |
| --- | --- |
| **Cuenta** | Crear una cuenta con un usuario privado (solo para entrar) y un alias público, entrar, mantener la sesión abierta y salir. Sin correo. |
| **Avatar Studio** | Crear avatares con el editor ilustrado de K-ME y guardarlos en la cuenta (hasta 20), volver a abrirlos, duplicarlos, borrarlos, imprimirlos y descargar su photocard en PDF. Se pueden llevar varios accesorios a la vez (gorro, auriculares, gafas, pin y lightstick). |
| **Sello Studio** | Hacer un sello personal con una palabra en hangul comprobada en un diccionario oficial, uno de tus avatares o los dos, tu alias y adornos (hasta 20). Imprimirlo como photocard de 55 × 85 mm y descargarlo en PDF o PNG. |
| **Imagen de perfil** | Elegir uno de tus avatares, uno de tus sellos o los dos. Sale en la cabecera, en un marco como el del logo, y en «Mi K-ME». |
| **Connect** | Un muro de fans: publicar una emoción con tu diseño (una copia de tu avatar o de tu sello) y un mensaje de hasta 5 iconos, sin texto libre, y reaccionar a las publicaciones de otros fans. |
| **Colección «K»** | La pestaña de las piezas especiales de K-ME Studio, abierta al entrar. Con el botón «Canjear Kpopis» se abre el catálogo de canje: el Top Destello y la Chaqueta Denim Collage cuestan 20 Kpopis cada una. La colección Encore añade seis piezas más (chaqueta, falda, pendientes, brazalete, bolso con su peluche Rizo y lazo), con precios todavía por confirmar. Antes de canjear se puede ver cómo queda cada pieza. |
| **Mi escenario** | HANGUL LIVE 001, «Tu voz. Nuestra luz»: una miniclase de 3 expresiones en coreano y 3 preguntas. Al acertarlas por primera vez da 20 **Kpopis** y el lightstick **Luz Hangul 001**, que se guarda en «Mis tesoros». |

## Organización de la carpeta

| Ruta | Qué contiene |
| --- | --- |
| `app/` | La aplicación (MVC), `package.json` y la configuración privada. **Todos los comandos de la app se ejecutan desde aquí.** |
| `editor-avatar/editor-avatar/` | El editor de avatar. La app lo sirve en `/editor/…`; también se abre solo con `KME_ABRIR_MUESTRA.html`. |
| `docs/` | `TECH_SPEC.md` (especificación), `MODELO_DATOS.md` (tablas) y documentos de trabajo. |
| `BITACORA_KME.md` | El cuaderno del proyecto: sesiones, decisiones (D…), pruebas (V…) y pendientes (T…). |
| `CLAUDE.md`, `AGENTS.md` | Normas para los asistentes de IA que han trabajado en el proyecto. |
| `K-ME-logos-revisados-v1.1/` | Originales de marca. Solo se copian a `app/public/img/` los gráficos que la app sirve. |
| `.githooks/` | La comprobación antes de cada commit (secretos, `.env`, correos). |

Dentro de `app/`:

```
src/config/        lectura de .env.local y conexión a PostgreSQL
src/catalogos/     listas cerradas: emociones, iconos, palabras en hangul, colores, retos y tesoros
src/models/        acceso a datos (consultas SQL parametrizadas, siempre filtradas por la cuenta)
src/services/      reglas de negocio (contraseñas, recetas, dibujo de sellos y avatares, retos, Kpopis)
src/controllers/   reciben la petición y eligen la vista
src/routes/        URL -> middleware -> controlador
src/middleware/    sesión, CSRF, límite de intentos, acceso privado, perfil y saldo de la cabecera
src/views/         plantillas EJS (HTML)
public/            CSS, imágenes y JavaScript del navegador
db/migrations/     SQL numerado, se aplica una sola vez cada uno
scripts/           herramientas locales (migrar, crear cuenta, comprobar la base de datos)
tests/             pruebas automatizadas (una por funcionalidad, y el recorrido completo)
```

## Requisitos

- Node.js 22 o superior (probado con 24.18) y npm.
- PostgreSQL 14 o superior en marcha (probado con 18). Hace falta poder entrar como superusuario `postgres` una sola vez para preparar el usuario y la base de datos de K-ME.
- Una terminal (PowerShell o Git Bash) abierta en la carpeta `app/`.

## Puesta en marcha paso a paso

Todos los comandos se ejecutan **desde `app/`**. Desde la carpeta donde tengas `k-me`:

```powershell
cd k-me\app
```

### 1. Instalar dependencias

```powershell
npm install
```

### 2. Preparar usuario y base de datos (una sola vez)

Crea el usuario `kme_app` y la base de datos `kme_dev` sin tocar nada que ya exista:

```powershell
psql -U postgres -f db/setup_local.sql
```

Asigna la contraseña del usuario `kme_app` de forma oculta (no queda en el historial):

```powershell
psql -U postgres -c "\password kme_app"
```

Si `psql` no se encuentra, usa la ruta completa: `& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres ...`

### 3. Configuración privada

Copia la plantilla y rellénala con un editor:

```powershell
Copy-Item .env.example .env.local
```

En `.env.local` pon en `PGPASSWORD` la contraseña que acabas de asignar a `kme_app`, y en `SESSION_SECRET` una cadena larga y aleatoria. Puedes generarla con:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`.env.local` está excluido de Git por el `.gitignore` de la raíz. Nunca lo pegues en un chat ni en la bitácora.

### 4. Comprobar la conexión y aplicar migraciones

```powershell
npm run comprobar-bd
npm run migrate
```

`migrate` aplica en orden las migraciones de `db/migrations/` que falten, cada una dentro de una transacción. Si lo ejecutas otra vez, no repite nada ni borra datos:

| Migración | Qué hace |
| --- | --- |
| `001`, `002` | Cuentas y sesiones. |
| `003` | Separa el usuario privado del alias público. |
| `004` | Connect: publicaciones y reacciones. |
| `005`, `006` | Sellos y avatares. |
| `007` | Imagen de perfil (dos referencias en `usuarios`). |
| `008` | Mensaje con iconos en las publicaciones. |
| `009` | Mi escenario: progreso de los retos, Kpopis y tesoros. |

### 5. Crear una cuenta ficticia

Cada cuenta tiene dos nombres:

- **Usuario:** privado. Solo sirve para entrar y no aparece en ningún sitio de la app.
- **Alias:** público. Es el nombre que ven los demás fans. Tiene que ser distinto del usuario.

Los dos tienen de 3 a 30 caracteres (letras, números o `_`) y no se pueden repetir, aunque cambien las mayúsculas. El alias no puede llevar palabras ofensivas. La contraseña tiene de 12 a 128 caracteres, sin reglas de composición. Se guarda como hash Argon2id.

Hay dos formas de crear una cuenta:

- **En la web:** con la app arrancada (paso 6), abre `/registro`, o pulsa «Crea una» en la página de entrar.
- **Con la herramienta local:** `npm run crear-cuenta`. Pide usuario, alias y contraseña; la contraseña se teclea oculta, dos veces.

### 6. Arrancar la app

```powershell
npm run dev
```

Abre `http://localhost:3000`. Si el puerto 3000 ya lo usa otra app, arráncala en el 3001:

```powershell
$env:PORT = '3001'; npm run dev
```

y abre `http://localhost:3001`. El servidor se reinicia solo al guardar cambios en el código. Para pararlo: `Ctrl+C`.

## Qué probar a mano

Las direcciones son relativas: delante va `http://localhost:3000` (o `3001`). Para Connect hacen falta dos cuentas: una en la ventana normal y otra en una ventana InPrivate (Ctrl + Mayús + N).

**Cuenta**

1. Entra en `/mi-kme` sin haber iniciado sesión: debe llevarte a `/entrar`.
2. Pon un usuario correcto con contraseña incorrecta: aparece «Los datos introducidos no son válidos.», el formulario sale vacío y sigues fuera. Con un usuario que no existe sale el mismo mensaje.
3. Entra: ves «Mi K-ME» y la cabecera con tu **alias**. Tu usuario no aparece en ningún sitio.
4. Pulsa «Salir»: vuelves a `/entrar` y `/mi-kme` vuelve a estar bloqueada.
5. Falla la contraseña 11 veces seguidas: a partir de la 11.ª aparece «Demasiados intentos» durante 15 minutos.
6. En `/registro`, usa el alias de otra cuenta: aparece «Ese alias ya lo usa otro fan.», el usuario sigue escrito y el cursor queda en el alias.

**Avatar Studio**

7. Abre «Avatar Studio», crea un avatar, ponle nombre y pulsa «Guardar». Aparece en «Mis avatares»; ábrelo desde otro navegador y sigue igual.
8. Ábrelo en dos pestañas, guarda en una y después en la otra: la segunda avisa del conflicto y ofrece «Guardar como copia».

**Sello Studio**

9. Crea un sello con una palabra en hangul (debajo sale cómo se lee y qué significa), uno de tus avatares y algún adorno. Pulsa «Guardar sello».
10. Pulsa «Photocard 55 × 85 mm (PDF)», imprímelo al 100 %, sin ajustar a la página, y mide la tarjeta: 55 × 85 mm. Prueba también «Imprimir» y «Descargar PNG».

**Imagen de perfil**

11. Sin imagen de perfil, la cabecera enseña un marco con tu inicial. Pulsa «Usar en mi perfil» en uno de tus avatares: la cara sale en ese marco, y «Mi K-ME» la enseña entera.

**Connect**

12. Pulsa «Connect», elige una emoción, añade un mensaje con iconos y pulsa «Publicar en el muro»: tu publicación lleva la cara de tu avatar.
13. Con la otra cuenta, pulsa una reacción varias veces: el número sube una vez por pulsación, hasta 10 del mismo tipo.
14. Edita o borra el avatar de la publicación: la publicación no cambia (es una copia).

**Mi escenario**

15. Abre «Mi escenario» y HANGUL LIVE 001. Lee las tres expresiones y empieza las preguntas. Falla una: ves qué significa lo que elegiste y puedes volver a probar.
16. Acierta las tres: ganas 20 Kpopis, que salen en la cabecera, y Luz Hangul 001, que sale en «Mis tesoros» de «Mi K-ME».
17. Repítela: «¡Completado otra vez!», y el saldo sigue en 20.

## Pruebas automatizadas

Desde `app/`:

```powershell
npm test
```

Usan la base de datos de `.env.local`, crean cuentas con usuario `test_xxxx` y alias `fan_xxxx`, y las borran al terminar. Sin `.env.local` se marcan como omitidas, no como superadas. Entre ellas, `tests/recorrido-completo.test.js` hace la demo entera de principio a fin.

Los tests del editor de avatar, desde `editor-avatar/editor-avatar/`:

```powershell
node --test "tests/*.test.js"
```

## Seguridad

- **Contraseñas:**
  - de 12 a 128 caracteres, guardadas con Argon2id, nunca en texto legible;
  - más de 128 se rechazan antes de calcular el hash;
  - tiempo de respuesta parecido para usuario inexistente y contraseña incorrecta.
- **Sesiones:**
  - guardadas en el servidor, en PostgreSQL, con el identificador regenerado al entrar;
  - caducan tras 24 horas sin uso, o 7 días con «Mantener sesión abierta»;
  - cookie `HttpOnly` y `SameSite=Lax`.
- **Formularios:**
  - token CSRF en todos los formularios;
  - límite de 10 intentos de entrada por IP cada 15 minutos y de 10 registros por hora;
  - mensajes de error sin pistas, y formularios vacíos tras un error.
- **Datos de cada cuenta:**
  - cada consulta filtra por la cuenta de la sesión: un avatar, un sello o un progreso de otra cuenta «no existe» (404);
  - cada recurso tiene su test de «otra cuenta no puede».
- **Recompensas:**
  - el acierto, los Kpopis y los tesoros los decide solo el servidor;
  - la base de datos impide cobrar dos veces la misma recompensa.
- **Contenido:**
  - sin texto libre en Connect ni en los sellos: emociones, iconos, palabras y adornos salen de listas cerradas;
  - lo que escribe el usuario se pinta siempre escapado.
- **Navegador:** cabeceras de seguridad con Helmet, con una política de contenido (CSP) sin scripts en línea.
- **Secretos y Git:**
  - los secretos solo están en `.env.local`, fuera de Git;
  - el usuario de base de datos `kme_app` no es superusuario;
  - una comprobación antes de cada commit bloquea los `.env`, las contraseñas, las claves y los tokens.
- **Privacidad:** sin correo ni datos personales; las cuentas de prueba son ficticias.

## Pendiente (después del 1 de diciembre)

- Recuperación de contraseña, cambio de alias y borrado de cuenta.
- HTTPS y despliegue (cookie `Secure`, `trust proxy`).
- Más piezas de canje en Colección «K», nuevos retos, el encuentro previo a un concierto y los intercambios.
- La dirección visual de collage editorial (D067): más opciones con detalle fotográfico para el avatar (las dos primeras, la falda con bolsillos de tela y el lightstick de estudio, ya están) y su extensión a la interfaz.
- Revisar 안녕하세요 y 고마워요 con una persona que hable coreano.
