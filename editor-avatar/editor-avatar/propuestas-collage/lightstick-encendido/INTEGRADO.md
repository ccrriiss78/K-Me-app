# Lightstick de estudio · encendido · cómo se integró (Claude, 26/11/2026, E0098)

Es una entrega de ChatGPT del 26/11/2026 (`LEEME_PARA_CLAUDE.md` y `comprobaciones.json` de esta carpeta), y `vista-previa.png` y `detalle-encendido.png` son sus imágenes de revisión. La autora decidió meterla en la app con un «lo metemos» (D083).

## Qué entró

- **Dibujos**, copiados sin cambios (byte a byte): `assets/kme/accesorio/collage-lightstick-estudio-encendido-{delgado,medio,grueso}.svg`. Las copias de la entrega se quitaron, porque eran idénticas.
- **Catálogo** (`datos/kme.json`), solo añadiendo:
  - una pieza nueva, `collage-lightstick-estudio-encendido` («Lightstick de estudio · encendido»), justo después de `collage-lightstick-estudio`;
  - con los mismos datos que el de siempre: `coleccion` `collage-01`, `zona` y `ranura` `mano`, `indicePorCuerpo` y `miniatura`. Cambian solo el id, el nombre y los dibujos.
- **Nada más:**
  - el lightstick de siempre, sus dibujos y los avatares guardados con él no cambian;
  - no hay precio ni canje: es gratis, como el de siempre, y sale en la pestaña Colección «K».

## Comprobaciones

- **Tests del editor** (`tests/collage-lightstick-encendido.test.js`):
  - cada variante, sin la luz, es exactamente la de siempre;
  - la luz es fija, solo en blanco, fucsia y rosa claro;
  - colocación por cuerpo, ids únicos en la página, misma ranura que el de siempre y la pestaña «K».
- **Test ampliado** (`tests/varios-accesorios.test.js`): la lista de ranuras incluye la pieza nueva.
- **Tests de la app** (`app/tests/lightstick-encendido.test.js`):
  - el servidor la acepta y rechaza los dos lightsticks a la vez;
  - es gratis;
  - no sale en el recorte del rostro;
  - se ve en el sello y en su vista previa.
- **En Chrome sin ventana:**
  - el filtro `svg-seguro.js` acepta la vista previa real del sello con la luz y rechaza un script añadido;
  - la photocard del sello en PNG sale encendida;
  - en el editor real, la pestaña «K» la enseña al lado del de siempre.
- **Sin tocar:**
  - el filtro del sello, que ya admitía los degradados, porque solo prohíbe lo peligroso;
  - `renderizador.js`, que ya antepone el id de cada dibujo a los `url(#collage-…)` de los degradados.

## Lo que sigue sin revisar

- La revisión de la autora en el navegador (guía del viernes, paso 4).
- A tamaño pequeño, la diferencia con el de siempre es suave.
- El halo pasa unos 9 px por fuera de la bola, en transparencia, y puede cubrir un poco la prenda. En las pruebas con camiseta, Chaqueta Denim, Chaqueta Cristal y Top Destello no se vio ningún problema.
