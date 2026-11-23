# Editor de avatares chibi

Editor para crear un avatar personalizable (ojos, boca, maquillaje, cabello, ropa, accesorios y fondo) con dos vistas del mismo avatar:

- **2D por capas**: cada pieza es un archivo SVG transparente del mismo tamaño y se apilan en orden.
- **3D**: Three.js con formas básicas; la cara reutiliza los dibujos 2D como textura.

Todo funciona en local y sin internet (Three.js va incluido en `vendor/`).

---

## 1. Arrancar

El editor carga sus piezas con `fetch`, así que **no funciona abriendo `index.html` con doble clic**. Hace falta un servidor local; cualquiera de estos sirve:

| Opción | Cómo | Dirección |
| --- | --- | --- |
| Node | En esta carpeta: `npx serve .` (o `npm start`) | http://localhost:3000 |
| VS Code | Extensión **Live Server** → clic derecho en `index.html` → *Open with Live Server* | la que indique |
| XAMPP | Copiar la carpeta dentro de `htdocs` | http://localhost/editor-avatar/ |
| Python | `python -m http.server 8000` | http://localhost:8000 |

Las fuentes de Google del `index.html` son opcionales: sin internet se usan las del sistema.

---

## 2. Estructura

```
editor-avatar/
├── index.html              Página de demostración
├── css/editor-avatar.css   Estilos del editor (todo dentro de .av-editor)
├── js/
│   ├── main.js             Monta el editor en la demo y guarda en localStorage
│   ├── editor.js           La ventana completa: crearEditor(contenedor, opciones)
│   ├── catalogo.js         Lee datos/catalogo.json y precarga las piezas SVG
│   ├── renderizador.js     Dibuja un avatar como SVG o PNG (para usar en otras páginas)
│   ├── lienzo2d.js         Vista 2D: una capa encima de otra, "Ver capas", parpadeo
│   ├── vista3d.js          Vista 3D con Three.js (se carga al abrir la pestaña 3D)
│   ├── colores.js          Calcula los colores del avatar y genera su CSS
│   ├── estado.js           Normaliza avatares guardados e historial para Deshacer
│   └── utilidades.js       Funciones pequeñas (colores, rutas, SVG → imagen)
├── datos/catalogo.json     Capas, piezas, paletas, pestañas y avatar por defecto
├── assets/
│   ├── plantilla.svg       Guía para dibujar piezas nuevas
│   ├── fondo/ cuerpo/ cabeza/ maquillaje/ ojos/ boca/ pelo/ ropa/ accesorios/
├── ejemplos/perfil.html    Cómo mostrar el avatar guardado en otra página
└── vendor/three.module.min.js  Three.js r160 (licencia MIT en LICENSE-three.txt)
```

---

## 3. Integrarlo en la app

1. Copia las carpetas `css`, `js`, `datos`, `assets` y `vendor` a la app (pueden ir dentro de una carpeta, por ejemplo `avatar/`).
2. En la página donde va el editor:

```html
<link rel="stylesheet" href="avatar/css/editor-avatar.css">

<div id="editor"></div>

<script type="module">
  import { crearEditor } from './avatar/js/editor.js';

  const guardado = await (await fetch('/api/avatar')).json();   // o null si no hay

  const editor = await crearEditor(document.getElementById('editor'), {
    catalogo: 'avatar/datos/catalogo.json',
    avatar: guardado,
    async alGuardar(avatar, png) {
      await fetch('/api/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: avatar, png }),
      });
    },
  });
</script>
```

### Opciones de `crearEditor`

| Opción | Por defecto | Qué hace |
| --- | --- | --- |
| `catalogo` | `'datos/catalogo.json'` | Ruta al catálogo. Las piezas se buscan relativas a este archivo. |
| `avatar` | `null` | Avatar inicial. Si falta algún campo, se completa con el de por defecto. |
| `alGuardar` | `null` | `async (avatar, png) => {}`. Se llama al pulsar **Guardar**. `png` es un data URL. |
| `con3D` | `true` | Muestra u oculta la pestaña 3D. |
| `pestanaInicial` | `'pelo'` | Categoría abierta al empezar. |
| `nombreArchivo` | `'avatar.png'` | Nombre del archivo de **Descargar PNG**. |

`crearEditor` devuelve un objeto con:

- `obtenerAvatar()` → el JSON actual.
- `cambiarAvatar(avatar)` → carga otro avatar.
- `exportarPNG()` → promesa con el PNG (data URL) de la vista actual.
- `destruir()` → quita el editor de la página.

Además, el contenedor emite el evento `avatar-cambiado` en cada cambio:

```js
document.getElementById('editor').addEventListener('avatar-cambiado', e => console.log(e.detail));
```

### Mostrar el avatar en otras páginas (perfil, comentarios, menú)

```js
import { crearRenderizador } from './avatar/js/renderizador.js';
const r = await crearRenderizador('avatar/datos/catalogo.json');

div.innerHTML = r.svg(avatar, { recorte: '60 40 280 280', rellenar: true }); // solo la cabeza
img.src = await r.png(avatar, { ancho: 400, alto: 480 });                   // imagen PNG
```

`ejemplos/perfil.html` tiene un ejemplo completo. Con el SVG no hace falta guardar el PNG: basta con guardar el JSON y dibujarlo cuando se necesite.

### Guardar en la base de datos

Basta con una fila por usuario. Ejemplo en MySQL:

```sql
CREATE TABLE avatars (
  usuario_id   INT PRIMARY KEY,
  config       JSON NOT NULL,
  png          MEDIUMTEXT NULL,            -- opcional: data URL del PNG
  actualizado  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

Rutas mínimas: `GET /api/avatar` (devuelve `config`) y `PUT /api/avatar` (guarda `config` y, si se quiere, `png`).

---

## 4. El avatar (JSON)

```json
{
  "version": 1,
  "piel": "#f6d3b8",
  "ojos": { "estilo": "redondos", "color": "#6b4a3a" },
  "boca": "sonrisa",
  "maquillaje": { "sombra": "#c58bd6", "labial": "#e0607e", "mejillas": "rubor" },
  "pelo": { "estilo": "bob", "color": "#4a3328" },
  "ropa": { "arriba": "sudadera", "colorArriba": "#8fb8ea", "abajo": "falda", "colorAbajo": "#3d4466" },
  "accesorio": "ninguno",
  "fondo": "lavanda"
}
```

- Los campos de **estilo** guardan el `id` de una pieza del catálogo.
- Los campos de **color** guardan un color `#rrggbb`. `sombra` y `labial` pueden ser `null` (sin maquillaje).
- Si se añaden campos nuevos, hay que añadirlos también en `porDefecto` dentro del catálogo.

---

## 5. Añadir una pieza nueva (2D)

1. Abre `assets/plantilla.svg` en Inkscape o Figma. El lienzo mide **400 × 480** y tiene guías para los ojos, la boca, los hombros, la cintura y el suelo.
2. Dibuja la pieza encima de la plantilla y borra la plantilla antes de exportar.
3. Marca con una **clase** las formas que deben cambiar de color (tabla de abajo). Las que no la lleven conservan su color fijo.
4. Exporta en SVG **a lienzo completo** (`viewBox="0 0 400 480"`), con fondo transparente y sin recortar.
5. Guárdala en la carpeta que toque de `assets/` y añádela a `datos/catalogo.json`:

```json
{ "id": "ondulado", "nombre": "Ondulado",
  "capas": { "pelo_atras": "../assets/pelo/ondulado_atras.svg",
             "pelo_frente": "../assets/pelo/ondulado_frente.svg" } }
```

6. Recarga la página. La miniatura del panel se genera sola.

**Consejos**

- Cada peinado lleva **dos archivos**: la parte de atrás (va detrás de la cabeza y el cuerpo) y la de delante (flequillo).
- Una pieza puede ocupar varias capas o poner varios archivos en la misma capa (mira `"ambos"` en mejillas).
- Si una pieza tapa otra capa, añade `"ocultaCapas": ["ropa_abajo"]` (como el vestido).
- Usa colores planos. Evita degradados o filtros con `id`: la misma pieza se repite varias veces en la página (miniaturas) y los `id` duplicados dan problemas.
- **Figma no exporta las clases.** Después de exportar, abre el SVG en VS Code y añade `class="f-pelo"` (o la que toque) a esas formas. Inkscape sí conserva las clases (*Editar → Editor XML*).

### Clases de color

`f-` pinta el relleno y `t-` pinta el trazo (por ejemplo, `f-piel` y `t-piel`).

| Clase | Color que recibe |
| --- | --- |
| `f-piel`, `t-piel` | Tono de piel |
| `f-piel-sombra` | Piel un poco más oscura (cuello, orejas, nariz) |
| `f-pecas` | Pecas (derivado de la piel) |
| `f-pelo` | Pelo, parte delantera |
| `f-pelo-trasero` | Pelo, parte trasera (algo más oscuro) |
| `t-pelo-oscuro` | Mechones y cejas |
| `f-ojos`, `f-ojos-claro` | Iris y su reflejo |
| `f-sombra-ojos` | Sombra de ojos (se oculta si es `null`) |
| `f-labial`, `t-labial`, `t-labial-oscuro` | Labial y su contorno |
| `f-arriba`, `f-arriba-oscuro`, `f-arriba-claro` | Ropa superior y sus tonos (también con `t-`) |
| `f-abajo`, `t-abajo-oscuro` | Ropa inferior y sus costuras |

Clases especiales:

- En las bocas, `con-labial` y `sin-labial` son dos versiones; el editor muestra una u otra.
- En los ojos, el grupo con clase `parpadeo` es el que se cierra al parpadear.

Los tonos derivados (más claro u oscuro) se calculan en `js/colores.js`. Para añadir un color nuevo: crea el nombre allí, añade el campo al avatar y una sección de colores en el catálogo.

---

## 6. Capas y catálogo

Las capas se dibujan en el orden de `capas` del catálogo, de atrás hacia delante:

1. Fondo
2. Cabello trasero
3. Cuerpo
4. Ropa inferior
5. Ropa superior
6. Cabeza
7. Maquillaje (sombra de ojos y mejillas)
8. Ojos (con cejas)
9. Boca
10. Cabello delantero
11. Accesorio

Otras partes del catálogo:

- `fijas`: piezas que siempre están (cuerpo, cabeza, sombra de ojos).
- `piezas`: opciones elegibles, agrupadas por la ruta del JSON que cambian (`"pelo.estilo"`, `"boca"`...).
- `paletas`: colores de cada selector (`null` = botón "Sin").
- `categorias`: pestañas del panel y sus secciones. En las secciones de piezas, `recorte` es la zona que se ve en la miniatura y `fondoPiel` pone el color de piel detrás.

---

## 7. La vista 3D

Está en `js/vista3d.js` y solo se descarga al abrir la pestaña 3D.

- El cuerpo, el pelo, la ropa y los accesorios se crean con formas básicas en las funciones `construir()`, `pelo()` y `accesorio()`, cada una con un `switch` por `id` de pieza.
- La cara es una textura hecha con los mismos SVG de maquillaje, ojos y boca, así que cualquier ojo o boca nuevos aparecen también en 3D sin hacer nada.
- Si se añade un peinado o accesorio nuevo al catálogo y no se añade su `case` en 3D, simplemente no aparece en 3D.

**Para usar modelos de Blender (.glb) más adelante**

1. Modela el cuerpo base y todas las variantes en un mismo archivo; nombra cada objeto como el `id` de su pieza (`Pelo_bob`, `Ropa_sudadera`...).
2. Usa un material por zona coloreable (`Piel`, `Pelo`, `RopaArriba`, `RopaAbajo`) en color claro.
3. Exporta a `.glb` y cárgalo con `GLTFLoader` (está en `node_modules/three/examples/jsm/loaders/` al instalar `npm install three@0.160.0`; necesita un `importmap` que apunte `"three"` a `vendor/three.module.min.js`).
4. En lugar de crear formas, muestra u oculta objetos por nombre (`objeto.visible`) y cambia `material.color` según el avatar. La cara puede seguir siendo la textura 2D.

---

## 8. Cambiar el aspecto del editor

Los colores del editor son variables CSS. En el CSS de la app:

```css
.av-editor {
  --av-acento: #e8577e;      /* botones y selección */
  --av-acento-2: #ffb3c7;    /* capa resaltada */
  --av-fuente: 'Poppins', sans-serif;
}
```

El editor se adapta solo al ancho de su contenedor: por debajo de 860 px pasa a una columna.

---

## Licencias

- Three.js: MIT, ver `vendor/LICENSE-three.txt`.
- Código y piezas del editor: parte del proyecto.
