# TECH_SPEC · K-ME

**Estado:** versión 1.15 · 24/11/2026 · Responde al pendiente T012 de `BITACORA_KME.md`. Revisada con la autora: acepta las propuestas de Q1 a Q6 y decide Q7 a Q10 con cambios (ver §6). El 18/11 decide Q11, el alcance del MVP (§5.1) y los nombres de los logos (§4.0). El 19/11 sustituye el círculo cromático por la paleta de la app (§2.5). El 21/11 separa el usuario privado del alias público y añade el registro por formulario (§1). Ese mismo día se incorporan las decisiones del editor de avatar trabajadas con ChatGPT en otra carpeta (§2.2, §2.6, §3.3), y se decide que «Mi ambiente» también usa solo la paleta (§2.6, Q14). El 22/11 decide qué lleva el sello (§4.1, D041), protege el alias frente a palabras ofensivas (§1, D042), aprueba el catálogo de hangul comprobado (§4.2, D043), y decide que la imagen de perfil pueda ser un avatar, un sello o los dos (D044) y que el sello se pueda imprimir y descargar (D045). El 22 y 23/11 amplía la paleta del sello con colores vivos (D046). El 23/11 elige de momento la composición A+C para sellos y exige coherencia del tratamiento visual entre pantallas (§2.7, D047). El 24/11 decide guardar la imagen de perfil como referencia, con dos claves foráneas (§4.3, D055).

Este documento dice **qué se construye y cómo**. La bitácora dice qué ha pasado y por qué; `CLAUDE.md` dice cómo trabaja el agente.

Cada punto lleva una etiqueta:

- **[DECIDIDO]**: decisión de la autora ya registrada en la bitácora (se cita: D…, P…).
- **[PROPUESTA]**: propuesta razonada de este borrador. No vale como decisión hasta que la autora la confirme.
- **[PREGUNTA Qn]**: lo tiene que decidir la autora. Mientras siga abierta, el agente **no** la implementa.

---

## 1. Lo que ya existe (fase 1)

- **[DECIDIDO]** Stack: Node.js 22+, Express 5, EJS, PostgreSQL, JavaScript con módulos ES, MVC (D003, D011).
- Tablas `usuarios` (id, usuario, alias, hash Argon2id, creado_en) y `sesiones` (sesiones de servidor).
- **[DECIDIDO D020]** Cada cuenta tiene un **usuario** privado, que solo sirve para entrar y nunca se muestra en la app, y un **alias** público, que es lo que ven los demás fans (cabecera, Mi K-ME, sello y muro). Los dos son únicos sin distinguir mayúsculas, tienen de 3 a 30 letras, números o `_`, y el alias tiene que ser distinto del usuario. Más adelante, la autora quiere que el alias se pueda cambiar y que lleve asignado el sello del fan cuando exista Sello Studio.
- **[DECIDIDO D042, 22/11]** El alias es público (cabecera, Connect y, si el fan quiere, su sello), así que al crear la cuenta se rechazan los alias con **palabras no permitidas**, también con variantes habituales: mayúsculas, guiones bajos y números en lugar de letras («1d10ta»). Mensaje: «Ese alias no está permitido. Elige otro.», como error del alias (conserva el usuario, D036). Lista corta en `app/src/catalogos/palabras-no-permitidas.js`, pendiente de que la revise la autora. Un filtro no detecta todos los insultos: si K-ME se publica, harán falta también revisión y denuncias. Las cuentas creadas antes no se revisan.
- Rutas: `GET /entrar`, `POST /entrar`, `GET /registro`, `POST /registro`, `GET /mi-kme` (privada), `POST /salir`.
- Las cuentas se crean con el **formulario de registro** (D018–D022: sin correo; al terminar se va a `/entrar`; errores sin pistas; formularios vacíos tras un error; 10 intentos por IP cada hora) o con la herramienta local `npm run crear-cuenta`.

---

## 2. Principios comunes a Avatar Studio y Sello Studio

### 2.1 Un diseño se guarda como «receta», no como imagen

- **[PROPUESTA]** Un avatar o un sello se guarda como una **composición**: una lista de piezas del catálogo con sus colores y opciones, en una columna `JSONB`. La imagen se dibuja al mostrarla (SVG por capas).
- **Por qué:** así se cumple que los recursos gráficos estén separados de la lógica (prompt inicial, §5). Si se mejora el dibujo de una pieza, los diseños guardados siguen funcionando y se ven con la versión nueva.
- **[PROPUESTA]** El servidor **valida** cada composición antes de guardarla: cada pieza existe en el catálogo y es de la categoría correcta, y cada color existe en la paleta (§2.5). Nunca se guarda texto o SVG que llegue del navegador tal cual (seguridad: inyección de código en el dibujo).

### 2.2 Varios diseños por cuenta

- **[DECIDIDO 21/11, E0031; sustituye la selección de descargas de E0029]** La interfaz ofrece exactamente tres acciones de impresión: «Imprimir avatar» abre el diálogo del navegador para elegir papel y escala; «Photocard 55 × 85 mm» y «Photocard 54 × 86 mm» descargan directamente su PDF A4 a tamaño real con guías. Se retiran los botones de SVG, PNG y el selector intermedio. Mantener PDF al 100 % al imprimir. Vista de marco ampliada y espacio vacío del lienzo reducido, sin deformar el avatar.
- **[DECIDIDO 21/11, E0029]** Cristina aprueba dos tamaños de photocard: 55 × 85 mm como principal y 54 × 86 mm como alternativa. La vista de tarjeta debe conservar la proporción elegida sin estirar el personaje. La muestra autónoma permite PNG y PDF de tarjeta o A4 con guías de corte; imprimir el PDF al 100 %, sin ajustar a la página. El PNG aporta resolución, pero la medida física se conserva mediante PDF. Los marcos con cadenas son de presentación en pantalla y no se incluyen en esta impresión para introducir la tarjeta en un portaphotocard real. Integración con diseños guardados pendiente de Claude. Fuentes de medidas verificadas: [TXT, Weverse 55 × 85 mm](https://shop.weverse.io/es/shop/USD/artists/3/sales/31918) y [BTS BE, Weverse 54 × 86 mm](https://shop.weverse.io/en/shop/USD/artists/2/sales/71850); los dos ejemplos acreditan formatos distintos, no una medida universal.
- **[DECIDIDO 21/11, E0027–E0028]** Ofrecer varios marcos decorativos prediseñados seleccionables mediante miniaturas para presentar el avatar, inspirados en portaphotocards K-pop con cadenitas y pequeños colgantes (estrellas, auriculares y elementos similares). Cristina aprueba probar primero uno transparente y otro con charms, además de «Sin marco». Implementados como presentación temporal en la muestra autónoma; dibujos pendientes de aprobación visual. Guardado del marco por diseño e inclusión en impresión pendientes de concretar. La fabricación y el diseño 3D se dejan como posible evolución, fuera del trabajo actual.
- **[DECIDIDO 21/11, E0026; pendiente de implementar]** El usuario podrá reutilizar cualquiera de sus avatares guardados y elegir cualquiera de ellos para imprimirlo como photocard, aunque no sea su avatar activo. La impresión utilizará el diseño guardado seleccionado. Tamaño, contenido, reverso y formato de descarga quedan pendientes de aprobación; no se consideran decididos los ejemplos propuestos en la conversación.

- **[DECIDIDO]** Cada cuenta conserva varios avatares y varios sellos, y puede recuperarlos y seguir editándolos (D005).
- **[DECIDIDO]** Lo guardado se recupera desde otro navegador o dispositivo: vive en PostgreSQL, asociado a la cuenta (D004).
- Operaciones: crear, listar «mis diseños», abrir, guardar, renombrar, duplicar, eliminar (con confirmación) y, en avatares, **elegir el activo**.
- **[DECIDIDO Q1]** Límite de 20 avatares y 20 sellos por cuenta en la demo.
- **[DECIDIDO Q2]** Eliminar es definitivo, con confirmación clara.

### 2.3 Guardado y ediciones a la vez

- **[DECIDIDO]** «Recuperar la última sesión» = recuperar lo **confirmado como guardado**; no se prometen cambios que no llegaron al servidor (prompt inicial, §4).
- **[DECIDIDO Q3]** Guardado **manual** (botón «Guardar»), con aviso «Tienes cambios sin guardar» si intentas salir del editor.
- **[PROPUESTA]** Cada diseño tiene un número de `version`. Al guardar, el navegador envía la versión que abrió. Si en el servidor ya hay otra más nueva (por ejemplo, lo guardaste desde el móvil), **no se sobrescribe**: se avisa «Este diseño ha cambiado en otro dispositivo» y se ofrece *recargar* o *guardar como copia*. Cumple «nada se sobrescribe en silencio» (VP004).

### 2.4 Propiedad y seguridad

- **[DECIDIDO]** Comprobar autenticación y propiedad en el servidor (prompt inicial, §6).
- **[PROPUESTA]** Todas las consultas filtran por el usuario de la sesión: `WHERE id = $1 AND id_usuario = $2`. Si el diseño no es tuyo, la respuesta es **404** (no 403), para no revelar que existe.
- **[PROPUESTA]** Cada ruta nueva tiene un test que demuestra que **otra cuenta no puede ver, guardar, duplicar, activar ni eliminar** el diseño (VP006).

### 2.5 Colores

- **[DECIDIDO 19/11]** Los colores se eligen **solo de la paleta que ofrece la app**: muestras de color en botones, nunca escribiendo códigos. **No habrá círculo cromático**, ni en el MVP ni después. Sustituye al círculo cromático (D007, P006) y a la decisión del 18/11 («paleta en el MVP, círculo después»); las decisiones antiguas se conservan en la bitácora.
- **Motivo de la autora:** así la paleta puede crecer, y algunos colores nuevos (por ejemplo, un color de ojos) se podrán **canjear por puntos o monedas** que consiga el fan.
- **[PROPUESTA]** Cada color de la paleta tiene un **nombre** (por ejemplo `rosa-01`) y los diseños guardan ese nombre, no el valor del color. Si se retoca un tono, se actualiza en todos los diseños, igual que las palabras en hangul (§4.2). Además, saber qué color es cada uno es lo que permite, más adelante, marcar cuáles se canjean.
- **[PROPUESTA]** La paleta es un archivo de datos revisable (`app/db/datos/paleta.json`) que una migración carga en una tabla `colores`: nombre, nombre visible («Rosa chicle»), valor del color, capas donde se puede usar y si está activo. El servidor rechaza cualquier color que no esté en la paleta.
- **[PROPUESTA]** En el MVP **todos los colores están disponibles para todos**. Canjear colores por puntos o monedas llega después del MVP, junto con los puntos y recompensas (§5). La tabla `colores` podrá recibir entonces un precio sin cambiar los diseños guardados.
- **[PREGUNTA Q12]** ¿Quién diseña la paleta y cómo se organiza? Propuesta: la paleta definitiva la diseña la autora (como las piezas, Q6). Mientras tanto, el agente usa una provisional con unos 12 colores generales y una lista aparte de unos 6 tonos de piel variados.

### 2.6 Aspecto de la interfaz: «Mi ambiente»

- **[DECIDIDO 21/11, D024; resuelve Q14]** «Mi ambiente» usa **solo la paleta de la app**, como los diseños (§2.5): muestras de color en botones, sin selector cromático libre ni círculo cromático. Sustituye al «selector cromático libre» que E0025 y E0029 dejaban pendiente. La autora lo decide «de momento»: si queda tiempo después del MVP, podrá revisarlo con una decisión nueva.

- **[DECIDIDO 21/11, E0029; implementado en la muestra]** Aplicación visual inmediata y botón «Listo» para cerrar, con explicación visible, cruz de cierre, Escape y clic fuera. «Listo» no indica guardado por cuenta. Paleta visible ampliada y diferenciada: 8 fondos, 10 acentos y 7 paneles. Texto principal, secundario, enlaces y botón de acento comprobados con contraste mínimo 4,5:1 en las 560 combinaciones. Selector cromático libre y persistencia siguen pendientes. *(Sustituido en parte por D024: no habrá selector cromático libre; la persistencia sigue pendiente.)*

- **[DECIDIDO 21/11, E0024]** La dirección visual inicial es un estudio creativo inspirado en photocards y diseño editorial K-pop, con blanco cálido, negro tinta y fucsia. Será la base común del resto de pantallas.
- **[DECIDIDO 21/11]** Una cuenta sin preferencias empieza con ese aspecto original. Si personaliza la interfaz, las siguientes sesiones recuperan su última configuración guardada; una modificación posterior sustituye a la anterior.
- **[DECIDIDO 21/11]** «Restaurar estilo K-ME» recupera la configuración original y esa restauración también se conserva para sesiones posteriores. No elimina avatares, sellos ni sus colores.
- **[DECIDIDO 21/11]** La personalización es por cuenta y debe mantenerse al cerrar sesión y volver a entrar. Siguiendo el guardado de datos importantes del proyecto, la implementación debe persistirla en la base de datos local de la app; no confundirla con un ajuste temporal del editor autónomo.
- **[PROPUESTA]** Controles de «Mi ambiente»: fondo general, color de acento y fondo de tarjetas/paneles. Se conserva el logotipo, la estructura y la legibilidad. Los elementos personalizables concretos requieren aprobación de Cristina.
- **[PROPUESTA]** Cambios con vista previa inmediata y guardado automático con confirmación visible; si falla, se avisa y no se presenta como guardado. Cargar las preferencias al entrar antes de mostrar la pantalla privada evita un salto de colores.
- **Pendiente de implementar:** antes del código, tests de cuenta sin preferencias, recuperación al volver a entrar, sustitución por el último cambio, restauración persistente y aislamiento entre cuentas. Esta sección documenta requisitos, no acredita guardado implementado.

### 2.7 Dirección artística (D040)

- **[DECIDIDO 22/11, D040]** La autora encuentra el entorno demasiado sobrio. En su conversación con ChatGPT aprueba tres direcciones («y esto ok»):

  | Dirección | Dónde se usa |
  |---|---|
  | **Mi rincón fan** | Base del editor y de «Mi K-ME»: photocards superpuestas, etiquetas, cinta y pequeños trazos propios. |
  | **Mi escenario** | Eventos y entrega de premios: luz suave, ondas y el objeto como protagonista. |
  | **Mi álbum vivo** | «Mis tesoros»: bolsillos transparentes, recuerdos con fecha y páginas de colección. |

  Se combinan el rincón fan y el álbum, y el escenario se reserva para los eventos.
- **[DECIDIDO 22/11, D040]** Aprueba además:
  - un estuche de fan o un álbum abierto en lugar de una caja genérica de tesoros;
  - que el objeto y su historia sean los protagonistas;
  - profundidad suave: papeles superpuestos, sombra ligera y transparencias;
  - la firma visual de K-ME: rayitas fucsias, estrellas, subrayados gestuales y etiquetas;
  - respuestas breves al tocar (levantar un poco una photocard, iluminar un objeto, previsualizar cómo queda puesto), mostrando directamente el estado final si se pide reducir el movimiento;
  - un estado vacío cuidado.
- **[DECIDIDO 22/11, D040]** Se pueden **mezclar acabados reales y vectoriales, frescos y artísticos o sobrios**, con criterio: no todo tiene que ser vectorial. Se mantienen la paleta, el logo original y la legibilidad (contraste AA).
- **[DECIDIDO 23/11, D047]** Para sellos, la autora elige **de momento el mockup A+C, «Fuerza con orden»**: distribución y lectura de A (creación grande a la izquierda y edición agrupada a la derecha), con pinceladas, papel rasgado y trama editorial de A y C. El sello conserva el protagonismo; los controles quedan en superficies limpias. Este tratamiento debe ser **coherente en todas las pantallas**: familia tipográfica, navegación, botones, foco, contraste y recursos gráficos comunes, adaptando la intensidad a cada función. No convierte las otras composiciones concretas de los mockups en diseños aprobados ni cambia la paleta, los logos o el contenido del sello.
- **[DECIDIDO 23/11, D048]** Tras ver la implementación, la autora rechaza el collage detrás de los sellos porque dificulta distinguirlos. Miniaturas, vista previa y zona de marca del estado vacío quedan sobre una superficie limpia. La identidad se expresa en cabeceras, tipografía, subrayados, botones y detalles exteriores de las tarjetas. Este criterio corrige la colocación de recursos de D047; se mantienen su orden de lectura y la coherencia entre pantallas.
- **[DECIDIDO 23/11, D050]** La autora propone colocar el collage en el fondo general de Mis sellos, con tarjetas algo más pequeñas por encima. Se admite en los huecos y márgenes de la colección; las tarjetas son blancas y opacas y la vista previa del editor conserva su superficie limpia. Amplía D048 sin volver a decorar directamente el área de cada creación.
- **Límites:**
  - es una dirección, no un diseño cerrado;
  - llevarla al resto de pantallas depende de que a la autora le guste el resultado concreto;
  - no aprueba cada forma de los lightsticks de las láminas, ni autoriza rehacer ahora todas las pantallas;
  - D036 y D037 (registro y logo de las páginas de entrada) siguen vigentes.
- **[PROPUESTA de ChatGPT, pendiente]** Revisión de coherencia entre la app y el editor (`editor-avatar/editor-avatar/propuestas-tesoros/REVISION_Y_PROPUESTA.md`, §1):
  - el fondo cálido del editor como base común;
  - una sola familia de botones;
  - un contorno de foco común;
  - textos sin género (por ejemplo, «Bienvenida» en «Mi K-ME»).
- **[PENDIENTE, T030] Contraste:**
  - El botón principal actual (blanco sobre el fucsia `#e83475`) da **4,05:1**, por debajo de AA para texto normal (4,5:1); Claude lo comprueba también y le sale 4,06:1.
  - Negro sobre ese fucsia da 5,18:1, y blanco sobre el fucsia oscuro `#b9235a`, 6,09:1.
  - El borde de los campos (`#e4dde0` sobre blanco) da 1,34:1.
  - D047 permite aplicar la familia de controles común: en E0063 se usan botones principales oscuros con texto blanco, pestañas fucsias con texto negro y bordes de campos `#6e737b`. Contrastes calculados: 17,40:1, 5,18:1 y 4,77:1, respectivamente. La revisión visual y de foco en navegador de esta versión sigue pendiente; los resultados anteriores describen la versión previa.
  - **[DECIDIDO 24/11, D053]** La autora elige texto **negro sobre el fucsia**, salvo que el diseño de la interfaz pida otra cosa. El arreglo de E0063 ya lo cumple; falta comprobarlo en el navegador.
- **[DECIDIDO 24/11, D054]** Plan hasta la presentación del **1 de diciembre de 2026**:
  - primero, la demo de principio a fin: cuenta, Avatar Studio, sello con su avatar, imagen de perfil, Connect con el diseño de cada fan e impresión;
  - retos, monedas, eventos y lightsticks, si da tiempo; si no, se presentan como ideas de futuro.

---

## 3. Avatar Studio

- **[DECIDIDO]** Avatares por capas, con expresiones y accesorios; varios diseños, editar, duplicar y elegir uno activo; eliminar con confirmación (prompt inicial, §3).

### 3.1 Capas

**[DECIDIDO Q4]** Capas del avatar, de atrás hacia delante:

| Orden | Capa | ¿Obligatoria? | ¿Color elegible? |
|---|---|---|---|
| 1 | Fondo | No | Sí |
| 2 | Cuerpo y tono de piel | Sí | Sí |
| 3 | Ropa | No | Sí |
| 4 | Cara (forma) | Sí | Sigue al tono de piel |
| 5 | Ojos | Sí | Sí (iris) |
| 6 | Boca | Sí | No |
| 7 | Pelo | No | Sí |
| 8 | Accesorios (gafas, lazos, lightstick…) | No, varios a la vez | Sí |

### 3.2 Expresiones

- **[DECIDIDO Q5]** Una expresión es la combinación de ojos y boca que eliges al diseñar: cada avatar guarda una. Más adelante se podrá ampliar a varias expresiones por avatar (útil para las «publicaciones emocionales» de Connect, P003) sin rehacer lo guardado. Como el usuario puede guardar varios avatares, ya puede tener uno por estado de ánimo.

### 3.3 Piezas gráficas

- **[DECIDIDO 21/11, E0031]** Cristina elige el brazo 01 («Cilindro corto») de la lámina de seis alternativas: forma corta, robusta y redondeada, sin separar dedos. Aplicado a las 12 prendas superiores de las tres tallas; rostro y resto del personaje no se sustituyen por los de la lámina. Pulseras y anillos son posibilidades comentadas, no nuevos accesorios aprobados para implementar en esta sesión.

- **[DECIDIDO 21/11, E0030]** Cuerpos chibi con cabeza proporcionalmente grande, formas suaves y expresivas, evitando el aspecto geométrico rígido. Cristina solicita revisar también la ropa para adaptarla. Primera revisión implementada en los 24 SVG de cuerpos y prendas utilizados por el catálogo: hombros, brazos, caderas, bajos y calzado redondeados; parte inferior más compacta. Se conservan las tres tallas, las uniones y los colores independientes. La referencia aportada orienta la naturalidad y proporciones; no se copia. Dibujo concreto pendiente de aprobación visual.

- **[DECIDIDO Q6]** Las piezas finales las diseña la autora. Mientras tanto, el agente usa **piezas provisionales sencillas** (formas geométricas en SVG) para construir y probar todo; se sustituyen por las definitivas sin tocar los diseños guardados (gracias a §2.1).
- **[PROPUESTA]** Las piezas son archivos SVG en `app/public/img/piezas/<capa>/`, y el catálogo (id, capa, archivo, si admite color) está en una tabla `piezas` cargada por una migración. Tamaño común del lienzo: 512 × 512.

### 3.4 Avatar del perfil y avatar de cada publicación (resuelve la discrepancia T006)

La bitácora recogía dos ideas que chocaban: F02 decía que al cambiar el avatar se actualizara en tus publicaciones; F01 proponía conservar las publicaciones antiguas tal como eran.

**[DECIDIDO Q7]** Se distinguen dos cosas:

- **Avatar del perfil** (el «activo»): es tu identidad en la interfaz de la app (cabecera, «Mi K-ME», tu perfil). Siempre se ve el actual.
- **Avatar de la publicación**: al publicar, el usuario elige qué diseño acompaña a esa publicación. Puede ser cualquiera de sus avatares o sellos guardados, o uno que crea en ese momento. Si no elige nada, se usa el avatar del perfil.
- Cuando el usuario **elige** un diseño para una publicación, se guarda **una copia** en la publicación: si después edita o elimina ese diseño, la publicación no cambia.

**[DECIDIDO Q11, 18/11]** Si **no elige** nada, la publicación guarda una **copia del avatar del perfil que tenía en ese momento**, y esa copia ya no cambia (opción B). Si mañana cambias el avatar del perfil, las publicaciones antiguas siguen como estaban. Así, toda publicación guarda siempre su propia copia del diseño, lo haya elegido el fan o no.

Palabras de la autora: «la publicación mostrará el diseño de avatar que quiera el usuario en ese momento (podrá crear uno en ese mismo instante si no es complejo de hacer así programáticamente, o seleccionar uno de los que tenga creados anteriormente); en el caso de que no seleccione ninguno se mostrará por defecto el que tenga seleccionado para su perfil en esa sesión».

**[PROPUESTA]** «Crear uno en ese mismo instante» solo si no complica mucho: por ejemplo, un botón «Crear un avatar nuevo» que abre Avatar Studio y, al guardar, vuelve a la publicación con ese diseño elegido. Si no cabe en el MVP, se deja para después.

### 3.5 Base de datos (propuesta)

```sql
-- 003_piezas.sql
CREATE TABLE piezas (
  id            TEXT PRIMARY KEY,            -- 'pelo-corto-01'
  capa          TEXT NOT NULL,               -- 'pelo'
  archivo       TEXT NOT NULL,               -- 'piezas/pelo/pelo-corto-01.svg'
  admite_color  BOOLEAN NOT NULL DEFAULT true,
  activa        BOOLEAN NOT NULL DEFAULT true -- retirar una pieza sin romper diseños
);

-- 004_avatares.sql
CREATE TABLE avatares (
  id             BIGSERIAL PRIMARY KEY,
  id_usuario     BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre         VARCHAR(40) NOT NULL,
  composicion    JSONB NOT NULL,
  version        INTEGER NOT NULL DEFAULT 1,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX avatares_usuario ON avatares (id_usuario);
ALTER TABLE usuarios ADD COLUMN id_avatar_activo BIGINT REFERENCES avatares(id) ON DELETE SET NULL;
```

Ejemplo de `composicion`:

```json
{
  "cuerpo":     { "pieza": "cuerpo-01", "color": "piel-03" },
  "ojos":       { "pieza": "ojos-redondos-02", "color": "azul-02" },
  "boca":       { "pieza": "boca-sonrisa-01" },
  "pelo":       { "pieza": "pelo-corto-01", "color": "rosa-01" },
  "accesorios": [ { "pieza": "lazo-01", "color": "blanco" } ]
}
```

### 3.6 Rutas (propuesta, todas privadas y con CSRF en los POST)

| Método y ruta | Qué hace |
|---|---|
| `GET /studio/avatares` | Mis avatares, con el activo marcado |
| `GET /studio/avatares/nuevo` | Editor vacío |
| `POST /studio/avatares` | Crea uno nuevo y abre su editor |
| `GET /studio/avatares/:id` | Abre el editor con ese avatar |
| `POST /studio/avatares/:id` | Guarda (comprueba `version`) |
| `POST /studio/avatares/:id/duplicar` | Crea una copia «Copia de …» |
| `POST /studio/avatares/:id/activar` | Lo elige como avatar activo |
| `GET /studio/avatares/:id/eliminar` | Pide confirmación |
| `POST /studio/avatares/:id/eliminar` | Elimina (si era el activo, la cuenta se queda sin activo) |

**[HECHO 23/11, D052, E0067] Así ha quedado en el servidor (contrato v1 con ChatGPT):**
- **Tabla `avatares`** (migración `006_avatares.sql`, nueva): `id`, `id_usuario`, `nombre` (de 1 a 40 caracteres), `composicion` (la receta, JSONB), `version`, `creado_en` y `actualizado_en`. La imagen de perfil (D044) va en otra migración, la 007 (D055, §4.3). No hay `…/activar`: se usa `POST /perfil/avatar`.
- **Receta:** el objeto del editor (claves de `editor-avatar/editor-avatar/datos/kme.json` → `porDefecto`), como mucho 8 KB. El servidor la completa con `normalizarAvatar` del editor y la **valida** campo a campo:
  - las piezas, con el catálogo;
  - los colores, en hexadecimal y del catálogo;
  - las otras 8 opciones, de momento solo con un formato seguro, hasta que llegue `kme-receta.js` de ChatGPT (`valoresPermitidos`).

  No sustituye a la tabla de piezas de §3.5: el catálogo es el del editor.
- **Páginas:** `GET /studio/avatares` («Mis avatares», con miniaturas dibujadas en el servidor), `GET /studio/avatares/nuevo` y `GET /studio/avatares/:id`. El editor lo monta `app/public/js/avatar-studio.js` (ChatGPT) en `#avatar-studio`.
- **Rutas JSON** (`Accept` o cuerpo JSON, con `_csrf` en el cuerpo):
  - listar y leer;
  - `POST /studio/avatares` (201);
  - `POST /studio/avatares/:id` con `version` (200, o 409 con la versión del servidor, sin sobrescribir);
  - `…/duplicar` (201) y `…/eliminar` (200; también por formulario, que vuelve a «Mis avatares»).

  Errores como `{ error }`: 400, 401 sin sesión, 403 sin CSRF, 404 si es de otra cuenta, 409 en el límite de 20 y 413.
- **El editor se sirve desde su carpeta:** solo `/editor/js`, `/editor/css`, `/editor/datos`, `/editor/assets` y `/editor/vendor`.
- **Dibujo en Node:** `services/avatarCatalogo.js` usa `Catalogo` y `svgDelAvatar` del editor, sin fondo y con ids únicos. Con encuadre, usa el recorte y las capas de `ENCUADRES` (§4.1).
- **Tests:** `tests/avatar-receta.test.js` y `tests/avatares.test.js`.

---

## 4. Sello Studio

- **[DECIDIDO]** Crear y conservar varios sellos, recuperarlos y seguir editándolos (prompt inicial, §3).
- **[DECIDIDO]** Separar el **logo de K-ME** (la marca) del **sello personal** que diseña cada fan. El usuario nunca edita la marca: crea su propio sello con la misma estructura.

### 4.0 Los logos de K-ME (aclaración de la autora, 16/11/2026; nombres corregidos el 18/11/2026)

En la entrega de marca, los archivos de Connect se llamaban «general» y eso confundía. **[DECIDIDO 18/11]** Se han renombrado a «connect» en la carpeta descomprimida, actualizando sus referencias internas (LEEME, `COMPROBAR-LOGOS.html`, `integracion-web.html`, `site.webmanifest`). El zip `K-ME-logos-revisados-v1.1.zip` conserva los nombres de la entrega original.

| Logo | Cómo es | Archivos originales (en `K-ME-logos-revisados-v1.1/`) | En la app (`app/public/img/`) | Uso |
|---|---|---|---|---|
| **Logo general de K-ME** | Rectángulo vertical de esquinas redondeadas con «K», carita y «ME» | `02-sello-Studio/K-ME-Studio.*`, `03-web/K-ME-Studio.*`, `icono-Studio-*.png`, `favicon-Studio.ico` | `logo-kme.svg`, `favicon-kme.ico` | La marca de K-ME, la cabecera de toda la app y la **estructura de los sellos personales** |
| **Logo de K-ME Connect** | El mismo rectángulo dentro de un círculo con trazos rosas | `01-logo-connect/K-ME-connect.*`, `03-web/K-ME-connect.*`, `icono-connect-*.png`, `favicon-connect.ico` | `logo-connect.svg`, cuando existan páginas de Connect | La parte social: muro, publicaciones, retos… |

- Esto completa la decisión D012 de la bitácora y resuelve T014: la cabecera y el favicon de la app usan el logo general.
- En la app, cada gráfico de marca se copia con un nombre claro (`logo-…`, `favicon-…`) y solo cuando una página lo usa.
- **[DECIDIDO]** Nada de hangul inventado: solo palabras de un catálogo comprobado (P008).

### 4.1 Cómo es un sello personal

**[DECIDIDO 22/11, D041; amplía Q8 y sustituye en parte Q9 y las zonas propuestas en v1.1]** Contenido del sello (hecho en E0057):

- **Tres composiciones:** solo una **palabra en hangul**; palabra + **su avatar**; o solo su avatar. Nunca vacío: si no lleva palabra ni avatar, no se guarda («El sello necesita una palabra o un avatar.»). Es **una** palabra del catálogo comprobado (§4.2), no dos.
- **Alias opcional:** en cualquier composición, el fan muestra u oculta su **alias público**. Nunca el usuario privado (D020).
- **Sin texto libre dentro del sello:** no hay nombre personal ni ningún otro texto escrito por el fan. El servidor ignora cualquier campo de texto que llegue.
- **Ayuda fuera del sello:** la lectura y el significado de la palabra se muestran en el editor, junto al sello, nunca dentro.
- **Marco:** el del logo general, rectángulo vertical de esquinas redondeadas con su proporción (88,5 × 126,8; en la app, 354 × 507) y su grosor de borde. No se cambia.
- **Colores** del marco, el fondo, el hangul, el alias y cada adorno, con **muestras** de la paleta del sello (§2.5): primero los tres del logo original (Negro K-ME `#000000`, Blanco K-ME `#FFFFFF` y Fucsia K-ME `#E83475`, el mismo tono que el «Fucsia» del editor) y después los otros 23 colores de la ropa del editor de avatar, con sus nombres. Son 26; el fan nunca escribe códigos. El sello empieza con los colores del logo. **(D046, 22 y 23/11)** Entre los del logo y los de la ropa van 9 colores vivos:
  - rojo `#e2231a` y amarillo `#ffd000`;
  - de los acentos de «Mi ambiente»: verde, naranja (allí, «Mandarina»), amarillo pop, lima, turquesa, azul eléctrico y orquídea.

  En total, **35**.
- **Avisos de contraste:** si el marco, la palabra, el alias o un adorno se distinguen poco del fondo, el editor lo avisa (umbrales: 2:1 para el marco, 3:1 para la palabra y los adornos, 4,5:1 para el alias). Avisa, pero deja guardar.
- **Adornos:** hasta 3, cada uno de su color, en una franja propia: acompañan sin tapar la palabra ni el avatar. Reutilizan los 9 dibujos de las reacciones de Connect, en una lista aparte. La autora aprobó añadir estrella, nota musical y rayitas del logo «de momento». **Hecho:** ChatGPT los dibujó en `app/public/img/sello/motivos/` (E0058) y están en el catálogo (E0060): 12 adornos. Su dibujo concreto está pendiente de la aprobación visual de la autora.
- **Avatar, dos encuadres del mismo avatar guardado:** **solo rostro** (cara, pelo y accesorios de la cabeza) y **cuerpo entero** (con ropa y accesorios). Se elige entre los avatares guardados de la propia cuenta y se dibuja sin deformarlo, con sus colores. Recortes del lienzo del editor (400 × 480), **medidos por ChatGPT** con todo el catálogo del editor (E0058, V066) y en el catálogo desde E0060:
  - rostro: `25 -5 350 370`, y solo las capas de la cabeza (pelo, cabeza, maquillaje, ojos, cejas, boca y accesorio), para que con el pelo largo no se vea la ropa;
  - cuerpo entero: `25 -5 350 450`, con todas las capas.

  Los dos dejan al menos 8 de margen sobre lo más lejos que llega el dibujo, centrados en x = 200. No cortan nada, pero el avatar sale algo pequeño (V071): pendiente de la aprobación visual de la autora, con la propuesta P025 de ajustar el recorte a cada avatar. *Recortes anteriores (E0057), sustituidos porque cortaban el pelo largo y los bordes: cuerpo `60 0 280 450` y rostro `55 8 290 300`. El recorte «solo la cabeza» del editor (`60 40 280 280`) cortaba el pelo por arriba.*
- **Distribución automática:** el sello se reparte de arriba abajo como el logo (la «K», la carita y «ME»): la zona principal, la franja de adornos y el alias. Lo que no está deja su sitio a la zona principal.
  - Solo palabra: el hangul llena la zona principal, en fila o en columna (una sílaba debajo de otra), lo que lo haga más grande.
  - Solo avatar: el avatar llena la zona principal.
  - Palabra + avatar: la palabra va arriba, en fila, y el avatar debajo. Una palabra corta ocupa menos alto y deja más sitio al avatar; una larga ocupa todo el ancho y conserva un tamaño legible.
  - Siempre hay margen dentro del marco, nada se solapa, el avatar no se deforma y nada queda diminuto: el hangul mide al menos 56 de 354 de ancho, y el avatar, al menos el 45 % del alto interior.
  - El control «Más palabra ↔ Más avatar» fue una **propuesta de ChatGPT**, sin aprobar: no está hecho.
- **[PENDIENTE] Avatar en el sello:** Avatar Studio todavía no guarda avatares en la app (falta la tabla `avatares`, §3.5). Hasta entonces, el editor dice «Todavía no tienes avatares guardados» y el servidor rechaza cualquier avatar. El sello nunca usa un avatar de muestra. La estructura está preparada:
  - la receta guarda una **copia** del avatar elegido (`origen`, `encuadre`, `copia`), así que editar o borrar después el avatar original no cambia ni rompe el sello;
  - al volver a guardar, «el avatar que ya lleva este sello» conserva esa copia.

  Falta: (1) la tabla y el guardado de avatares por cuenta; (2) dibujar un avatar en el servidor a partir de su receta. *Corrección de E0058:* el dibujador del editor (`Catalogo` y `svgDelAvatar`, en `editor-avatar/editor-avatar/js/`) **sí funciona en Node** si se precarga el catálogo desde el disco; solo `cargarCatalogo` y el PNG necesitan el navegador. Dentro del sello se dibuja con `conFondo: false` y con ids únicos. La receta del avatar se valida en el servidor, porque `normalizarAvatar` no valida. (3) Los recortes ya están medidos (ver arriba).

**[DECIDIDO Q8, 16/11]** El sello personal toma la **estructura del logo general de K-ME** (§4.0): el mismo **rectángulo vertical de esquinas redondeadas**. La forma del marco no se cambia. El usuario personaliza lo que lleva dentro *(lista original; desde D041, sin nombre personal y con una sola palabra, avatar opcional y alias opcional)*:

- **palabras en hangul** elegidas del catálogo (§4.2);
- **su nombre** *(sustituido por D041: no hay nombre personal)*;
- **motivos decorativos** elegidos de un catálogo de la app;
- **los colores** que quiera para cada elemento.

**[PROPUESTA de v1.1, sustituida por la distribución automática de D041]** Zonas del sello, imitando cómo está construido el logo (arriba la «K», en medio la carita y abajo «ME»):

| Zona | En el logo | En el sello personal |
|---|---|---|
| Arriba | La «K» grande | 1 o 2 palabras del catálogo, **en hangul** |
| Centro | La carita con las mejillas «//» | Motivos decorativos del catálogo (corazón, estrellas, lightstick, mejillas…), hasta 3 |
| Abajo | «ME» | El alias público o el nombre personal (ver Q9); nunca el usuario con el que se entra (D020) |
| Marco y fondo | Borde negro, interior blanco | Colores elegibles para el borde, el fondo y cada elemento |

**[PROPUESTA]** Los motivos decorativos son piezas SVG de un catálogo, como las del avatar (§3.3): las diseña la autora y, mientras tanto, se usan provisionales. Más adelante se podría añadir la opción de poner uno de tus avatares en el centro. *(D041: el avatar ya forma parte del contenido del sello, con dos encuadres.)*

**[DECIDIDO Q9, 16/11; sustituido en parte por D041 el 22/11]** Además del alias (el alias público, D020), el sello puede llevar un **nombre personal**. Aparte de ese nombre, no hay más texto libre: las palabras salen del catálogo. *Desde D041: no hay nombre personal; solo el alias, que se muestra u oculta.*

**[PROPUESTA, sin efecto desde D041: ya no hay nombre personal]** Límites del nombre personal, porque es el único texto que escribe el usuario y se verá cuando comparta el sello:

- de 2 a 15 caracteres, solo letras (incluidas tildes y ñ), espacios y guion;
- se escapa siempre al dibujarlo (nunca se interpreta como código);
- una lista corta de palabras no permitidas (insultos);
- aviso en el editor: «Pon tu nombre o un apodo, sin apellidos».

El nombre se muestra **tal como lo escribe el usuario** (en letras latinas). No se traduce ni se transcribe automáticamente al hangul: una transcripción automática de nombres puede salir mal, y solo se muestra hangul comprobado.

### 4.2 Catálogo de palabras en hangul

**[DECIDIDO Q10]** Es una lista corta de palabras **propuesta por la autora**, preparada con ayuda de IA y **comprobada** para que la traducción sea correcta.

**[DECIDIDO 22/11, D043; hecho en E0057]** Catálogo de **36 palabras** en `app/src/catalogos/hangul.js`, en cuatro grupos: emociones y sentimientos, música y escenario, idols y fans, y símbolos. La autora aprueba la lista en español que propone el asistente y pide: «usa solo lo que esté bien comprobado como correcto». Por eso solo entra una palabra con **su propia entrada** en un diccionario del Instituto Nacional de la Lengua Coreana (NIKL):
- **B**, el Diccionario Básico de Coreano, con traducción al español (https://krdict.korean.go.kr/spa), que da el significado en español: 32 palabras.
- **U**, Urimalsaem, el diccionario abierto (https://opendict.korean.go.kr), para palabras de fans como 설렘, 응원법 (fanchant), 포카 (photocard) y 팬심: 4 palabras. Da la definición en coreano, y el significado en español es una traducción del asistente, señalada en el archivo.

Cada palabra lleva su hangul, la lectura con la romanización oficial (a partir de la pronunciación del diccionario), su significado, la entrada (con el número de homónimo si lo hay), el enlace comprobado el 22/11/2026 y «validada por la autora». Si una palabra tiene otro significado (팬 también es «sartén»), lleva un aviso.

Quedan **fuera**:
- 응원봉 (lightstick), que no está en ningún diccionario;
- 화이팅, porque la forma oficial es 파이팅, que sí está;
- 사랑해, 고마워 y 보고 싶어, porque son formas conjugadas sin entrada propia.

Una persona que hable coreano no lo ha revisado todavía. El catálogo es un **archivo, no una tabla** (elección A de la autora, como en Connect): el sello guarda solo el id de la palabra. Si un día se quiere añadir palabras desde una pantalla de la app, se pasa a una tabla sin perder nada. Tests en `app/tests/catalogo-hangul.test.js`.

**[PROPUESTA]** Cómo comprobar cada palabra. La IA ayuda a preparar la lista, pero **no basta como única fuente**, porque se puede equivocar con seguridad:

1. La autora elige la palabra en español (por ejemplo, «amistad»).
2. La IA propone el hangul (우정), la romanización (ujeong) y una explicación de uso.
3. Se contrasta en un diccionario de referencia, como el diccionario coreano-español de Naver o el del Instituto Nacional de la Lengua Coreana, y si es posible con una persona que hable coreano.
4. Solo si coinciden, la palabra entra en el catálogo, con la fuente anotada.

**[PROPUESTA, sustituida por D043: el catálogo es `app/src/catalogos/hangul.js`, sin tabla]** El catálogo es un archivo de datos revisable (`app/db/datos/palabras_hangul.json`) que una migración carga en la base de datos. El agente **nunca** añade ni cambia palabras por su cuenta *(esto sigue vigente)*.

### 4.3 Base de datos y rutas, explicado

**Tabla `sellos`.** Es como un cajón donde se guardan los sellos de todos los usuarios. Cada fila es un sello y tiene las mismas columnas que un avatar: quién es su dueño (`id_usuario`), su nombre («Mi sello de verano»), su receta (`composicion`: qué imagen, qué nombre, qué palabras y qué colores) y su número de `version`. La diferencia es que no hay «sello activo»: el avatar activo existe porque es tu cara en la app, y los sellos son creaciones que usas cuando quieras.

**Tabla `palabras_hangul`.** Es el catálogo: una fila por palabra comprobada.

| Columna | Ejemplo | Para qué |
|---|---|---|
| `id` | `amistad` | Identificador; es lo que guarda el sello |
| `hangul` | 우정 | Lo que se dibuja en el sello |
| `romanizacion` | ujeong | Para que el fan sepa leerla |
| `significado` | amistad | Lo que ve el usuario al elegir |
| `fuente` | Diccionario Naver, 2026-11-20 | Dónde se comprobó |
| `validada_por` / `validada_en` | autora / 2026-11-20 | Quién la dio por buena y cuándo |

El sello **no** guarda el hangul copiado, sino el `id` de la palabra. Así, si se corrige una palabra del catálogo, se corrige en todos los sellos.

**Rutas.** Son las direcciones que el navegador pide al servidor. Funcionan igual que las de los avatares (§3.6), cambiando `avatares` por `sellos`: `GET /studio/sellos` (mis sellos), `GET /studio/sellos/nuevo`, `POST /studio/sellos` (crear), `GET /studio/sellos/:id` (abrir), `POST /studio/sellos/:id` (guardar), `…/duplicar` y `…/eliminar`. No hay `…/activar`, porque no hay sello activo. *(D044 cambia esto: el sello podrá ser la imagen de perfil; ver más abajo.)*

**[HECHO 22/11, E0057] Así ha quedado (D041):**

- **Tabla `sellos`** (migración `005_sellos.sql`, tabla nueva que no cambia datos existentes): `id`, `id_usuario` (la cuenta; si se borra la cuenta, se borran sus sellos), `nombre` (de 1 a 40 caracteres, para encontrarlo en «Mis sellos»; **no** se dibuja en el sello), `composicion` (la receta, JSONB), `version`, `creado_en` y `actualizado_en`.
- **Receta** (`composicion`), solo con ids de los catálogos `src/catalogos/sello.js` y `hangul.js`:

  ```json
  {
    "borde": "negro",
    "fondo": "blanco",
    "palabra": { "id": "amistad", "color": "fucsia" },
    "avatar": null,
    "alias": { "visible": true, "color": "negro" },
    "motivos": [{ "id": "corazon", "color": "fucsia" }],
    "distribucion": "automatica"
  }
  ```

  Con avatar, `"avatar": { "origen": "<id del avatar>", "encuadre": "rostro" | "cuerpo", "copia": { …receta del avatar… } }`. La receta no copia el texto del alias: se dibuja con el alias actual de la cuenta (ver Q13).
- **Rutas:** las siete de arriba, más `GET /studio/sellos/vista-previa`, que devuelve solo el dibujo del sello con lo elegido, sin guardar, para un script que lo actualice sin recargar. Ese script va en `app/public/js/`, zona de ChatGPT, y está **pendiente**. Sin JavaScript, el botón «Ver cómo queda» (`accion=vista`) vuelve a pintar el editor con lo elegido, sin guardar. **Hecho (E0058–E0060):**
  - si se pide JSON, la ruta responde `{ svg, avisos, ayuda }`, o `{ error }` con 400 (Claude, test 19b);
  - `app/public/js/sello.js` (ChatGPT) actualiza el sello, los avisos y la ayuda sin recargar, avisa de los cambios sin guardar y oculta «Ver cómo queda». Si no le llega JSON (por ejemplo, con la sesión caducada), envía el formulario normal. Comprobado en Edge (V071).
- **Reglas** (`services/selloService.js`):
  - el servidor valida cada id antes de guardar;
  - si la versión no es la que se abrió, responde 409 «Este sello ha cambiado en otro dispositivo…» y ofrece «Guardar como copia» o volver a abrirlo;
  - límite de 20 sellos por cuenta (409), contado con la cuenta bloqueada para que dos pestañas no lo superen;
  - el sello de otra cuenta da 404;
  - tras un error, el editor conserva lo elegido.
- **Dibujo:**
  - `services/selloDibujo.js` reparte el espacio y calcula los avisos de contraste;
  - `views/_sello.ejs` pinta el SVG, con el alias y los textos escapados.
  - Fuente del hangul: la del sistema (Malgun Gothic en Windows, Apple SD Gothic Neo en Apple, Noto Sans KR). No se ha añadido ninguna fuente web.
- **Tests:**
  - `tests/sello-dibujo.test.js`: la distribución, con todas las combinaciones, y los avisos;
  - `tests/sello-receta.test.js`: la receta y la copia del avatar;
  - `tests/sellos.test.js`: las pantallas, incluida la prueba de «otra cuenta no puede».

**[DECIDIDO 22/11, D044; pendiente de implementar]** El fan elige su **imagen de perfil**: un avatar, un sello o los dos. Se verá en la cabecera, en «Mi K-ME» y junto a sus publicaciones de Connect. Sustituye a «no hay sello activo». Cada publicación guardará su copia del diseño (Q7, Q11).

**[DECIDIDO 24/11, D055; HECHO en el servidor, E0069]** La imagen de perfil se guarda como **referencia**, no como copia: el perfil enseña siempre la versión actual.
- **Datos:** dos columnas en `usuarios`, `id_avatar_perfil` e `id_sello_perfil` (migración `007_perfil.sql`), con clave foránea, que pueden ir vacías y con `ON DELETE SET NULL`: si se borra ese avatar o ese sello, el perfil se queda sin él.
- **Propiedad:** la consulta que elige comprueba que el avatar o el sello son de la cuenta; si no, 404 («Ese avatar no existe.» / «Ese sello no existe.»).
- **Rutas:** `POST /perfil/avatar` (campo `avatar`) y `POST /perfil/sello` (campo `sello`), con sesión y CSRF. El id elige; vacío, quita. Las dos vuelven a «Mi K-ME».
- **Dónde se ve (24/11, a propuesta del asistente):**
  - cabecera: la cara del avatar o, si solo hay sello, el sello; sin imagen de perfil, queda como antes;
  - «Mi K-ME»: los dos, con «Quitar»;
  - «Mis avatares» y «Mis sellos»: «Usar en mi perfil», y «En tu perfil» en el elegido.
- El tamaño y el sitio son diseño (ChatGPT): se pueden cambiar sin tocar el servidor. Tests en `tests/perfil.test.js`.

**[DECIDIDO 22/11, D045; pendiente de implementar]** El sello se podrá **imprimir**, a tamaño photocard 55 × 85 mm como el avatar, y **descargar** en PDF y en PNG. Para el PDF se copiará a la app el generador del editor (`kme-impresion.js`), sin tocar la carpeta de ChatGPT.

---

## 5. Orden de construcción propuesto

Cada paso es un encargo de `/nueva-funcionalidad`, con plan, tests en rojo, revisor y entrada en la bitácora.

1. **Piezas y Avatar Studio mínimo:** catálogo con piezas provisionales; crear, guardar, listar, abrir, renombrar y eliminar; propiedad y conflictos de versión, con tests.
2. **Avatar activo y duplicar:** el avatar activo aparece en «Mi K-ME» y en la cabecera.
3. **Paleta definitiva de la autora** (T009): sustituye a la provisional; los diseños guardados no cambian (§2.5).
4. **Sello Studio**: marco del logo general, motivos decorativos del catálogo, nombre personal y colores.
5. **Palabras en hangul en el sello**, en cuanto el catálogo esté comprobado. La autora puede ir preparando la lista en paralelo a los pasos 1 a 4.
6. Después: Connect (muro y publicaciones), con el avatar o sello de cada publicación (§3.4) y la respuesta a Q11.

**Fuera de este documento** (fases posteriores): retos, puntos y recompensas, sonido, despliegue y las ideas de §5.2. Connect mínimo sí entra en el MVP (§5.1, D038). El registro por formulario ya está hecho (§1).

### 5.1 Alcance del MVP (decidido por la autora el 18/11/2026)

- **[DECIDIDO]** Fechas: del **18/11 al 26/11/2026**. La autora dedica de 4 a 6 horas al día.
- **[DECIDIDO]** Todo **en local**, en el ordenador de la autora: nada publicado en internet ni en servicios externos.
- **[DECIDIDO]** Registro por formulario en la web: se construye antes de empezar el plan. Hecho el 21/11, sin correo (§1, D018–D022).
- **[DECIDIDO]** Entran: **Avatar Studio** (§3), **Sello Studio** (§4) y **Connect mínimo**.
- **[DECIDIDO]** Connect mínimo:
  - un muro con las publicaciones de los fans;
  - una publicación es **un diseño** (avatar o sello, guardado como copia según Q7 y Q11) y **una emoción elegida de una lista cerrada**, **sin texto libre**;
  - **reacciones** con iconos de una lista (corazón, lightstick…);
  - **retos**: sus reglas se especifican con la autora cuando se trabaje en ellos. Hasta entonces, el agente **no** las inventa.
- **[DECIDIDO 19/11]** Colores: solo la paleta de la app, sin círculo cromático (§2.5). En el MVP todos los colores están disponibles; canjearlos por puntos llega después.
- **[DECIDIDO]** Hangul: la autora prepara y comprueba el catálogo en paralelo (§4.2). El sello funciona sin palabras hasta que el catálogo esté cargado. *(22/11, D043: catálogo de 36 palabras comprobadas, hecho.)*
- **[HECHO 22/11, D041, E0057] Sello Studio:**
  - «Mis sellos» y el editor, con la palabra en hangul, el alias opcional, los adornos y las muestras de color;
  - la distribución automática y los avisos de contraste;
  - guardar con versión, duplicar, borrar y el límite de 20.

  Pendiente:
  - ~~el avatar dentro del sello~~ (hecho el 24/11, T034, E0068: el editor ofrece los avatares guardados de la cuenta y el sello dibuja su copia con el encuadre);
  - la aprobación visual de la autora del diseño de ChatGPT, los 3 adornos nuevos y el tamaño del avatar (hechos en E0058–E0060);
  - ~~la imagen de perfil (D044)~~ (parte de servidor hecha el 24/11, D055, E0069; falta su diseño);
  - imprimir y descargar (D045).
- **[DECIDIDO]** Forma de trabajar: «rápido pero seguro». El agente puede escribir bloques grandes sin pedir permiso en cada paso, pero se mantienen los tests de seguridad y de «otra cuenta no puede», `npm test` en verde y un resumen explicado al final de cada día.
- **[DECIDIDO 22/11, D038; resuelve la pregunta de las emociones y reacciones]** La autora encarga al asistente las listas y el diseño gráfico de Connect, «como versión definitiva pero con posibilidad de cambiar cualquier aspecto»:
  - **14 emociones y 15 reacciones**: las nueve originales (corazón, aplauso, lightstick, mini corazón, brillas, fuego, fanchant, corona y flores) y seis añadidas el 23/11 (D049: llorar, emoción, tristeza, abrazo, risa y sorpresa), en `app/src/catalogos/connect.js`. En la base de datos se guarda el id; textos y dibujos se cambian sin migración. Los identificadores anteriores se conservan.
  - **[DECIDIDO 23/11, D049]** Accesos rápidos para las reacciones habituales y **«+ Más reacciones»**, desplegable con el resto y sus nombres visibles. Elección inicial de presentación de ChatGPT: cinco accesos (corazón, aplauso, lightstick, mini corazón y fuego); diez adicionales en el desplegable. Se mantienen totales, reacciones propias, límite de diez pulsaciones por tipo y funcionamiento sin JavaScript. El resumen muestra el total de las adicionales. Con JS, Escape cierra y devuelve el foco; pulsar fuera también cierra. La autora autoriza expresamente a ChatGPT esta ampliación del catálogo y sus pruebas, como excepción al reparto habitual de AGENTS.md.
  - **Cada pulsación suma una reacción.** Dar muchas es una forma de darle más fuerza; el tope es de 10 de cada tipo por persona y publicación, y se cambia en el catálogo (`MAX_REACCIONES_POR_TIPO`).
  - **Las reacciones se quitan aparte**, nunca volviendo a pulsar: «Quitar la última» o «Quitar todas las mías». Nunca se tocan las de otra cuenta.
  - **Reaccionar y quitar no recargan el muro** (D039, 22/11): un script pide los números nuevos en JSON. Sin JavaScript, todo funciona recargando.
  - **Borrar una publicación:** solo la tuya, con confirmación. Si es de otra cuenta, la respuesta es 404.
  - **Dibujos:** las caritas de las emociones usan el marco y las rayitas del logo (`public/img/connect/emociones/`). Los iconos de las reacciones son de una sola tinta y el botón los pinta de su color (`public/img/connect/reacciones/`). Colores y tamaños, en variables `--connect-…` de `estilos.css`.
  - **Organización:** en el ordenador, el muro a la izquierda y «Publicar» en un panel a la derecha que se queda fijo al bajar; en el móvil, las emociones en una fila que se desliza. Así el muro se ve nada más entrar.
  - Mientras Avatar Studio no guarde diseños, cada publicación muestra una photocard con la inicial del alias. La columna `diseno` de la publicación recibirá la copia del diseño (Q7, Q11).
  - Los retos siguen sin reglas: se especifican con la autora.

### 5.2 Ideas de la autora para después del MVP (22/11/2026)

**[PROPUESTA]** Recogidas para no perderlas; nada de esto está decidido ni se construye en el MVP (bitácora, P014–P018):

- **Monedas** que se ganan reaccionando, publicando, creando retos o participando en eventos. Servirían para conseguir objetos, pero nunca los exclusivos de un evento.
- **Eventos de distintos tipos:** conciertos, encuentros para intercambiar accesorios u otros que se ocurran. Cada tipo tendrá sus reglas. En un **concierto**:
  - un vídeo integrado en un escenario de K-ME, con los avatares actuales de los fans que asisten;
  - sus reacciones continuadas (por ejemplo, muchos aplausos) suben una barra de **energía K-poper**;
  - al llegar al 100 %, cada asistente gana el **lightstick propio de ese evento**, distinto del de cualquier otro evento.
  
  Para el vídeo hay que revisar las condiciones de YouTube, que no permiten ocultar ni tapar su reproductor. Además, el MVP es solo en local.
- **Objeto propio de cada evento** (en un concierto, su lightstick): se guarda como accesorio del avatar, con la fecha en que se ganó. Está siempre disponible una vez ganado y **nunca se puede comprar con monedas**. En el editor tendrá su apartado propio, «Mis tesoros» (T029). ChatGPT preparó el 22/11 tres láminas en `editor-avatar/editor-avatar/propuestas-tesoros/`, pendientes de que la autora apruebe el diseño concreto. No está implementado.
- **Intercambios en Connect** de lightsticks, accesorios o ropa entre fans. Falta decidir qué pasa con la fecha de un lightstick que cambia de dueño.
- **Objetos distintos para cada fan**, para que no haya avatares iguales y den ganas de intercambiar.

**Evolución de la idea de eventos (22/11, conversación de la autora con ChatGPT; bitácora P019–P022).** La idea de arriba, con la energía durante el concierto, se conserva como historia. La autora la precisa: quiere premiar la emoción conjunta de los fans, no las visualizaciones de YouTube. Nada de esto está decidido para construir.

- **[PROPUESTA elegida para explorar, P019] Encuentro previo.** Antes de los vídeos, los fans se reúnen con sus avatares y muestran su ilusión con reacciones de K-ME. Palabras de la autora: «puede hacerse el recuento de reacciones en el previo a la visualización del/los vídeos, como muestra de la emoción previa de los fans en el evento».
  - La barra representa la participación colectiva; no mide sentimientos.
  - Al llegar a una meta colectiva se concede el lightstick del evento, antes de los vídeos. Después, quien quiera ve los vídeos con su lightstick ya ganado.
  - Sin reglas: fórmula, duración, límites, quién recibe el premio y condiciones de asistencia están por decidir.
  - *Salvaguardas que propone ChatGPT, sin aprobar:*
    - el premio ya concedido se mantiene aunque el fan no vea el vídeo, se vaya antes o YouTube falle;
    - ni el premio ni la barra usan minutos vistos, inicio o final de reproducción ni interacciones con YouTube;
    - llegar a la meta no bloquea ni desbloquea el acceso a un vídeo;
    - las reglas del muro (tope de 10 y quitar reacciones, D038 y D039) no se trasladan por defecto al encuentro.
  - *Cumplimiento:* las políticas de YouTube prohíben dar incentivos por interactuar, directa o indirectamente, con su contenido. Separar las reacciones de la reproducción es una propuesta de producto que habrá que revisar con el diseño final. No es una aprobación de YouTube ni una forma de esquivar sus normas.
- **[PROPUESTA, P020] Lightstick con juegos de luces.** Usar en el mismo concierto el lightstick ganado, con luces según la música.
  - *Límite técnico:* la API del reproductor (IFrame Player API) da el tiempo y el estado de reproducción, no el audio ni el ritmo.
  - *Sugerencia de ChatGPT, sin aprobar:* una coreografía de luces propia, con cambios suaves en momentos fijados de cada canción, situada con el tiempo del reproductor. Habría que prever pausas, saltos, cambios de vídeo, velocidad y cargas antes de prometer que va sincronizada.
  - Unas luces locales (cada fan con su vídeo) no son lo mismo que un concierto sincronizado entre todos: eso necesitaría servidor y una arquitectura de evento sin decidir.
  - *Criterios:*
    - no capturar, descargar ni analizar el audio de YouTube;
    - luces y avatares en zonas propias, sin tapar el reproductor ni sus controles;
    - poder apagar los efectos, respetar «reducir movimiento» y evitar destellos rápidos;
    - solo colores de la paleta;
    - las luces no dan premios nuevos.
- **[PROPUESTA, P021] Música y vídeos de YouTube en los eventos.** Con el reproductor oficial integrado (iframe o IFrame Player API), como han hecho compañeros de la autora, cumpliendo sus condiciones y con vídeos que permitan la inserción.
  - El reproductor queda visible y entero, con sus controles, su atribución y sus anuncios.
  - Avatares y marcos van fuera de él, y nunca se oculta para usar solo el audio.
  - La Data API sirve para buscar datos, no para reproducir.
  - La configuración de seguridad (CSP, Referer y privacidad) será trabajo de servidor de Claude cuando se decida. Hoy el MVP es solo en local (D014).
  - Sin implementar ni probar.
- **[PROPUESTA, P022] Cámara y álbum de recuerdos.** En un evento, hacer una «foto» con zoom y desplazamiento del encuadre, y guardarla en un álbum.
  - Un encuadre 2D no exige avatares en 3D. Ver otros ángulos sí exigiría una escena preparada para ello, y un vídeo grabado no tiene ángulos nuevos.
  - El reproductor de YouTube no permite sacar fotogramas. La foto recogería la escena de K-ME (avatares, objetos y escenario) y, en el sitio del vídeo, un cartel del evento o una referencia al momento. Nunca se captura la pantalla del usuario.
  - *Sugerencias de ChatGPT, sin aprobar:*
    - el recorrido encuadrar → hacer la foto → revisar → guardar o repetir;
    - evento, fecha y hora en cada foto;
    - un apartado «Mis recuerdos» con «Mis tesoros» (objetos) y «Mi álbum» (fotos). El nombre no está aprobado.
- **Fuentes que consultó ChatGPT el 22/11** (hay que revisar su versión vigente al desarrollar):
  - [IFrame Player API](https://developers.google.com/youtube/iframe_api_reference) y [parámetros del reproductor](https://developers.google.com/youtube/player_parameters);
  - [políticas para desarrolladores](https://developers.google.com/youtube/terms/developer-policies) (III.F.3, incentivos) y su [guía](https://developers.google.com/youtube/terms/developer-policies-guide);
  - [funcionalidad mínima requerida](https://developers.google.com/youtube/terms/required-minimum-functionality);
  - [ayuda de YouTube sobre insertar vídeos](https://support.google.com/youtube/answer/171780?hl=es);
  - en MDN, la [política del mismo origen](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy) y las [imágenes con CORS](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image).
- **Preguntas abiertas** (revisión de ChatGPT, apartado D):
  - ¿Los objetos de evento se quedan siempre con quien los ganó, y solo se intercambian otros accesorios? Así P016 y P017 no chocarían.
  - ¿La colección es de la cuenta, o cada avatar guarda lo que lleva puesto?
  - ¿Cuántos objetos de mano a la vez?
  - ¿Todos los asistentes reciben el mismo diseño, o hay variantes?
  - ¿Qué fecha cuenta como «ganado»?
  - Reglas de la energía: ¿colectiva o individual?, ¿qué cuenta?, ¿qué pasa si no se llega a la meta?
  - Reglas de los retos.
  - Monedas: nombre, acciones, importes y catálogo. «Poppys» no está confirmado como nombre.
  - Q13 y las paletas definitivas (Q12).

---

## 6. Decisiones y preguntas

| # | Tema | Decisión (16/11/2026) |
|---|---|---|
| Q1 | Límite de diseños | 20 avatares y 20 sellos por cuenta |
| Q2 | Eliminar | Definitivo, con confirmación |
| Q3 | Guardado | Manual, con aviso de cambios sin guardar |
| Q4 | Capas del avatar | Tabla de §3.1 |
| Q5 | Expresión | Ojos y boca elegidos al diseñar, una por avatar |
| Q6 | Piezas gráficas | Las diseña la autora; provisionales mientras tanto |
| Q7 | Avatar en publicaciones | Avatar del perfil en la interfaz; en cada publicación, el diseño que se elija (copia), y si no se elige, el del perfil (§3.4) |
| Q8 | Sello | Estructura del logo general de K-ME (rectángulo redondeado); dentro, hangul del catálogo, nombre, motivos decorativos del catálogo y colores a elección (§4.1). **(22/11, D041)** Dentro: una palabra en hangul, el avatar de la cuenta (rostro o cuerpo entero) o los dos, nunca vacío; hasta 3 adornos; colores de la paleta del sello; distribución automática |
| Q9 | Texto en el sello | Alias (público, D020) o nombre personal con límites; el resto, palabras del catálogo. **(22/11, D041, sustituye lo anterior)** Solo el alias público, que se muestra u oculta; sin nombre personal ni otro texto libre |
| Q10 | Hangul | Lista corta de la autora, preparada con IA y comprobada en diccionario (§4.2). **(22/11, D043)** Hecho: 36 palabras con entrada en los diccionarios del NIKL; catálogo en archivo |
| Q11 | Publicación sin diseño elegido | (18/11) B: copia del avatar del perfil del momento de publicar, que ya no cambia (§3.4) |
| — | Alcance del MVP | (18/11) Avatar Studio, Sello Studio y Connect mínimo, del 18/11 al 26/11, en local (§5.1) |
| — | Logos | (18/11) La app usa el logo general (Studio); los archivos de Connect se renombran de «general» a «connect» (§4.0) |
| — | Colores | (19/11) Solo la paleta de la app, sin círculo cromático. Motivo: colores nuevos canjeables por puntos o monedas (§2.5) |
| **Q12** | **Paleta** | **Abierta:** ¿la diseña la autora, con una provisional de unos 12 colores y 6 tonos de piel mientras tanto? (§2.5). *(22/11) El sello ya tiene su paleta, la de D041: los 3 colores del logo y los 24 de la ropa del editor. Q12 sigue abierta para la paleta general.* |
| — | Cuentas | (21/11) Usuario privado para entrar y alias público; registro por formulario sin correo (§1, D018–D022) |
| **Q13** | **Alias en Connect** | **Abierta, para cuando se construya Connect:** como el alias se podrá cambiar, ¿una publicación muestra el alias que tenía el fan al publicar o el actual? *(22/11) El sello guarda solo si el alias se ve, y lo dibuja con el alias actual; al copiar un sello en una publicación (D044) habrá que decidirlo.* |
| Q14 | Color en «Mi ambiente» | (21/11) Solo la paleta de la app, sin selector libre ni círculo cromático, «de momento»: la autora podrá revisarlo después del MVP si hay tiempo (§2.6, D024) |
| — | Alias | (22/11, D042) Al crear la cuenta se rechazan los alias con palabras no permitidas, también con variantes (§1) |
| — | Imagen de perfil | (22/11, D044) Un avatar, un sello o los dos; pendiente de implementar (§4.3) |
| — | Imprimir el sello | (22/11, D045) Photocard 55 × 85 mm, PDF y PNG; pendiente de implementar (§4.3) |
| — | Paleta del sello | (22 y 23/11, D046) Más 9 colores vivos: rojo, amarillo y 7 de «Mi ambiente»; 35 en total (§4.1) |

---

## 7. Cambios en este documento

Este documento **se puede cambiar** cuando la app avance. Cada cambio se hace así:

1. Se cambia aquí y se sube la versión (versión 2, 3…).
2. Se anota en `BITACORA_KME.md` como decisión nueva que **sustituye** a la anterior, con el motivo, sin borrar la antigua.
3. Si ya hay datos guardados con la forma antigua, el cambio lleva su migración, para no estropear lo que los usuarios ya crearon.

| Versión | Fecha | Cambio |
|---|---|---|
| 1 | 16/11/2026 | Primera versión: Avatar Studio y Sello Studio, revisada con la autora |
| 1.1 | 16/11/2026 | Aclaración de los logos (§4.0) y zonas del sello personal con motivos decorativos (§4.1) |
| 1.2 | 18/11/2026 | Q11 decidida (B); alcance y fechas del MVP (§5.1); solo paleta fija en el MVP (§2.5); logos renombrados y usados en la app (§4.0, resuelve T014) |
| 1.3 | 19/11/2026 | Sin círculo cromático: los colores salen solo de la paleta de la app y se guardan por su nombre (§2.5, §3.5); paso 3 del orden de construcción y §5.1 actualizados; nueva pregunta Q12 |
| 1.4 | 21/11/2026 | Usuario privado y alias público (§1, D020); registro por formulario hecho (§1, §5, §5.1); el sello usa el alias público, nunca el usuario (§4.1, Q9); nueva pregunta Q13. Migración `003_usuario_y_alias.sql` |
| 1.5 | 21/11/2026 | Unión con el trabajo del editor de avatar hecho con ChatGPT en la carpeta `k-me - copia` (bitácora E0015–E0031): impresión, photocards y marcos (§2.2), «Mi ambiente» (§2.6, nueva), brazo y cuerpos (§3.3). Nueva pregunta Q14 |
| 1.6 | 21/11/2026 | Q14 decidida: «Mi ambiente» usa solo la paleta de la app, de momento (§2.6, D024) |
| 1.7 | 22/11/2026 | Connect mínimo construido (§5.1, D038): emociones y reacciones en un catálogo, reacciones que se suman varias veces y se quitan aparte. Nuevo §5.2 con las ideas de la autora para después del MVP (monedas, eventos, lightsticks de evento, intercambios). |
| 1.8 | 22/11/2026 | Nuevo §2.7: dirección artística aprobada (D040) y contraste pendiente (T030). §5.2: evolución de los eventos con ChatGPT (encuentro previo, luces, YouTube, cámara y álbum; P019–P022), salvaguardas, límites, fuentes y preguntas abiertas. §5 corregido: Connect mínimo sí entra en el MVP. |
| 1.9 | 22/11/2026 | Sello Studio construido (§4.1, §4.3, §5.1; D041): palabra, avatar o los dos, alias opcional, sin nombre personal (sustituye en parte Q9), colores del logo más los 24 del editor, adornos, dos encuadres del avatar, distribución automática y avisos de contraste. Catálogo de 36 palabras en hangul comprobadas (§4.2, D043). Alias sin palabras no permitidas (§1, D042). Imagen de perfil (D044) e impresión del sello (D045), decididas y pendientes. Migración `005_sellos.sql` (tabla nueva). |
| 1.10 | 23/11/2026 | Sello (§4.1, §4.3, §5.1): 9 colores vivos (D046, 35 en total); adornos estrella, nota y rayitas de ChatGPT; recortes del avatar medidos por ChatGPT, con el rostro solo con las capas de la cabeza; vista previa en JSON y script sin recargar. Corrección: el dibujador del avatar sí funciona en Node. Nueva propuesta P025 (encuadre ajustado a cada avatar), en la bitácora. |
| 1.11 | 23/11/2026 | D047 (§2.7): la autora elige de momento el mockup A+C para sellos, conservando el orden y la lectura de A y mezclando recursos gráficos y artísticos de A y C. Tratamiento coherente entre todas las pantallas; paleta y logo conservados. Se registra el arreglo de contraste de los controles comunes y la revisión visual pendiente. |
| 1.12 | 23/11/2026 | D048 (§2.7): sin collage detrás de las creaciones; identidad en cabeceras, controles y detalles exteriores. Corrige la colocación de recursos de D047 tras la revisión de la autora. |
| 1.13 | 23/11/2026 | D049 (§5.1): seis reacciones nuevas y «Más reacciones» en Connect; autorización concreta de catálogo y tests a ChatGPT. D050 (§2.7): collage en el fondo general de la colección, con tarjetas más compactas, blancas y opacas; el dibujo conserva una superficie limpia. |
| 1.14 | 23/11/2026 | §3.6: Avatar Studio en el servidor, según el contrato v1 con ChatGPT (D052): tabla `avatares` (migración 006), receta validada con el catálogo del editor, páginas y rutas JSON, versión con 409, límite de 20, editor servido desde su carpeta y dibujo en Node. Falta el cliente de ChatGPT y `kme-receta.js` (T037). |
| 1.15 | 24/11/2026 | §4.3: imagen de perfil (D044) guardada como referencia con dos claves foráneas en `usuarios` (D055, migración 007): rutas `POST /perfil/avatar` y `POST /perfil/sello`, la cara del avatar (o el sello) en la cabecera y los dos en «Mi K-ME». §3.6 y §5.1: el avatar ya va dentro del sello (T034). |
