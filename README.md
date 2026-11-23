# K-ME

App web para fans del K-pop: el fan es protagonista y expresa su identidad con avatares, sellos y creaciones. *Sin fan no hay idol.*

Este README explica cómo poner en marcha la **fase 1**: crear una cuenta ficticia (con el formulario de registro o con la herramienta local), entrar, ver el alias y cerrar sesión. La historia, decisiones y pendientes del proyecto están en `BITACORA_KME.md`.

## Organización de la carpeta

| Ruta | Qué contiene |
| --- | --- |
| `app/` | Código de la aplicación (MVC), `package.json`, dependencias y configuración privada. **Todos los comandos de la app se ejecutan desde aquí.** |
| `BITACORA_KME.md` | Único cuaderno del proyecto. |
| `PROMPT_INICIAL_CLAUDE_KME.md` | Contexto y encargo de la primera fase. |
| `K-ME.odt`, `K-ME_app.odt` | Documentos de concepto. |
| `K-ME-logos-revisados-v1.1/` | Originales de marca. Solo se copian a `app/public/img/` los gráficos que la app sirve. |

Dentro de `app/`:

```
src/config/        lectura de .env.local y conexión a PostgreSQL
src/models/        acceso a datos (consultas SQL parametrizadas)
src/services/      reglas de negocio (hash de contraseñas, comprobación de credenciales)
src/controllers/   reciben la petición y eligen la vista
src/routes/        URL -> middleware -> controlador
src/middleware/    sesión, CSRF, límite de intentos, acceso privado
src/views/         plantillas EJS (HTML)
public/            CSS e imágenes servidas al navegador
db/migrations/     SQL numerado, se aplica una sola vez cada uno
scripts/           herramientas locales (migrar, crear cuenta, comprobar bd)
tests/             pruebas automatizadas
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

`migrate` crea las tablas `usuarios`, `sesiones` y `schema_migrations`. Si lo ejecutas otra vez, no repite nada ni borra datos. La migración `003` separa el usuario del alias: en las cuentas que ya existían, el alias pasa a ser igual que el usuario. La `004` crea las tablas de Connect, `publicaciones` y `reacciones`.

### 5. Crear una cuenta ficticia

Cada cuenta tiene dos nombres:

- **Usuario:** privado. Solo sirve para entrar y no aparece en ningún sitio de la app.
- **Alias:** público. Es el nombre que ven los demás fans. Tiene que ser distinto del usuario.

Los dos tienen de 3 a 30 caracteres (letras, números o `_`) y no se pueden repetir, aunque cambien las mayúsculas. La contraseña tiene de 12 a 128 caracteres, sin reglas de composición: no hace falta mezclar mayúsculas, números ni símbolos. Se guarda como hash Argon2id.

Hay dos formas de crear una cuenta:

- **En la web:** con la app arrancada (paso 6), abre `http://localhost:3000/registro`, o pulsa «Crea una» en la página de entrar. Al terminar te lleva a `/entrar` con el aviso «Cuenta creada. Ya puedes entrar.».
- **Con la herramienta local:**

  ```powershell
  npm run crear-cuenta
  ```

  Pide usuario, alias y contraseña. La contraseña se teclea oculta, dos veces.

Si tu cuenta se creó antes del 21/11/2026, su alias es igual que su usuario. Como el alias todavía no se puede cambiar, crea una cuenta nueva si quieres que sean distintos. Si además su contraseña tiene menos de 12 caracteres, el formulario de entrar no te deja enviarla.

### 6. Arrancar la app

```powershell
npm run dev
```

Abre `http://localhost:3000`. El servidor se reinicia solo al guardar cambios en el código. Para pararlo: `Ctrl+C`.

## Qué probar a mano

1. Entra en `http://localhost:3000/mi-kme` sin haber iniciado sesión: debe llevarte a `/entrar`.
2. Pon un usuario correcto con contraseña incorrecta: aparece «Los datos introducidos no son válidos.», el formulario sale vacío y sigues fuera. Con un usuario que no existe sale el mismo mensaje.
3. Entra con la cuenta creada: ves «Mi K-ME» y la cabecera con tu **alias**. Tu usuario no aparece en ningún sitio.
4. Abre otro navegador (o una ventana privada) y entra con la misma cuenta: funciona sin expulsar al primero.
5. Pulsa «Salir»: vuelves a `/entrar` y `/mi-kme` vuelve a estar bloqueada.
6. Falla la contraseña 11 veces seguidas: a partir de la 11ª aparece «Demasiados intentos» durante 15 minutos.
7. Escribe una contraseña de menos de 12 caracteres en `/entrar`: el navegador no deja enviar el formulario.
8. Entra sin marcar «Mantener sesión abierta» y mira la cookie `kme.sid` (F12 → Aplicación → Cookies → `http://localhost:3000`, columna «Expires»): caduca dentro de unas 24 h. Sal, vuelve a entrar marcando la casilla: ahora caduca dentro de unos 7 días.
9. En un ordenador, el formulario de `/registro` se ve entero, a dos columnas, sin desplazar la página. Crea una cuenta: te lleva a `/entrar` con «Cuenta creada. Ya puedes entrar.» y todavía no estás dentro. Entra con el usuario y la contraseña que elegiste.
10. En `/registro`, escribe dos contraseñas distintas: aparece «No se ha podido crear la cuenta. Revisa los datos y vuelve a intentarlo.» y el formulario sale vacío. Sale el mismo mensaje si el usuario ya existe: no se dice cuál es el problema.
11. En `/registro`, usa el alias de otra cuenta: aparece «Ese alias ya lo usa otro fan.», el usuario sigue escrito y el cursor queda en el alias, vacío. Si el alias es igual que el usuario: «El alias tiene que ser distinto de tu usuario.», con el mismo comportamiento.
12. Intenta registrarte 11 veces en menos de una hora: a partir del intento 11 aparece «Demasiados registros desde este equipo».

**Connect, el muro de los fans.** Hacen falta dos cuentas: una en la ventana normal y otra en una ventana InPrivate (Ctrl + Mayús + N).

13. Con la sesión abierta, pulsa «Connect» en la cabecera. Elige una emoción (en el ordenador, en el panel de la derecha; en el móvil, en la fila de arriba, que se desliza) y pulsa «Publicar en el muro»: aparece «¡Publicado en el muro!» y tu publicación, arriba, con tu alias.
14. Con la otra cuenta, pulsa varias veces una reacción de esa publicación: el número sube una vez por pulsación. Al llegar a 10 del mismo tipo, el botón ya no deja sumar más.
15. Con esa misma cuenta, abre «Tus reacciones» y prueba «Quitar la última» y «Quitar todas las mías». Solo se quitan las tuyas.
16. La otra cuenta no ve «Borrar» en una publicación que no es suya. Con la tuya, abre «Borrar» y confirma: aparece «Publicación borrada.» y desaparece del muro.

Las emociones y reacciones se cambian en `app/src/catalogos/connect.js`; sus dibujos están en `app/public/img/connect/`, y los colores y tamaños, en las variables `--connect-…` de `app/public/css/estilos.css`.

## Pruebas automatizadas

```powershell
npm test
```

Usan la base de datos de `.env.local`, crean cuentas con usuario `test_xxxx` y alias `fan_xxxx`, y las borran al terminar. Sin `.env.local` la prueba se marca como omitida, no como superada.

## Seguridad implementada en esta fase

- Contraseñas de 12 a 128 caracteres, sin reglas de composición, guardadas con Argon2id (parámetros recomendados por OWASP), nunca en texto legible.
- Al entrar, una contraseña de más de 128 caracteres se rechaza antes de calcular ningún hash, con el mensaje de siempre.
- Sesiones en el servidor, guardadas en PostgreSQL; identificador regenerado al entrar; destruidas al salir. Caducan tras 24 horas sin uso, o tras 7 días si se marca «Mantener sesión abierta» (sin marcar por defecto). Cada visita renueva el plazo.
- Cookie `HttpOnly`, `SameSite=Lax`; `Secure` se activa con `COOKIE_SECURE=true` cuando haya HTTPS.
- Token CSRF por sesión en todos los formularios.
- Límite de 10 intentos de entrada por IP cada 15 minutos, y de 10 intentos de registro por IP cada hora (también cuentan los fallidos).
- Usuario privado y alias público: quien ve tu alias no sabe con qué nombre entras.
- Mensajes de error sin pistas: al entrar, el mismo mensaje si falla el usuario o la contraseña; al registrarse, el mismo mensaje y el mismo código (400) para todos los errores de datos, también si el usuario ya existe.
- Tras un error, los formularios salen vacíos y el campo del usuario lleva `autocomplete="off"`, por si el dispositivo es compartido.
- Sin correo: K-ME funciona solo en local.
- Consultas SQL siempre parametrizadas; validación de usuario, alias y contraseña en el servidor.
- Cabeceras de seguridad con Helmet (CSP, nosniff, etc.).
- Secretos solo en `.env.local`, excluido de Git. El usuario de base de datos `kme_app` no es superusuario.
- Tiempo de respuesta parecido para usuario inexistente y contraseña incorrecta.

## Pendiente (no incluido en la fase 1)

- Recuperación de contraseña, cambio de alias, borrado de cuenta.
- HTTPS y configuración de despliegue (cookie `Secure`, `trust proxy`).
- Registro de intentos fallidos por cuenta, además de por IP.
