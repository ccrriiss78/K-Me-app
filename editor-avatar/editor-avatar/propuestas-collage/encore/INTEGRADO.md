# Colección Encore · cómo se integró (Claude, 25/11/2026, E0086)

La entrega de ChatGPT (aprobada por la autora: «Me gusta adelante») está en esta carpeta: su `ENTREGA_PARA_CLAUDE.md`, sus comprobaciones y, por lote, el LEEME, el manifest, el catálogo propuesto, la verificación y las texturas originales. No se copiaron las referencias grandes ni el prompt con rutas del ordenador de la autora. Antes no había ninguna versión de Encore en el proyecto.

## Dibujos

- **Copiados sin cambios (17):** los SVG de los lotes 01 a 06, a `assets/kme/ropa_arriba`, `ropa_abajo` y `accesorio`. Un test comprueba sus huellas SHA-256 con los `manifest.json` de esta carpeta.
- **Una copia adaptada:** `collage-k-pendientes-cometa-ovalado.svg`, para el rostro ovalado, cuyas orejas están 14 unidades más dentro y algo más abajo. Solo cambian el título y los dos anclajes: 86→100, 314→300 y 232→236. Hecha por Claude; ChatGPT puede sustituirla por una suya.

## Catálogo (`datos/kme.json`), colección `collage-encore`

| Pieza | Ids | Cómo se monta |
| --- | --- | --- |
| Chaqueta Cristal Stage | `collage-k-chaqueta-cristal-{delgado,medio,grueso}` | Como la Chaqueta Denim Collage: perfil integrado, color de arriba, ajuste del bajo a 350/370. |
| Falda Satén Encore | `collage-k-falda-saten-{…}` | Como las faldas collage: sustituye las piernas, cintura 350, color de abajo, calzado compacto. |
| Pendientes Cometa | `collage-k-pendientes-cometa` | Ranura `orejas`, `zona: cabeza`. `indicePorRostro`: la copia para el ovalado. |
| Brazalete Fanchant | `collage-k-brazalete-fanchant` | Ranura `muneca`, `zona: muneca`. `indicePorCuerpo` (anclaje principal, perfil integrado) e `indiceSinPerfilIntegrado` (anclaje de la camiseta): se dibuja UNO, según la prenda de arriba. |
| Bolso Encore con Rizo | `collage-k-bolso-encore-rizo` | Ranura `bolso`, `zona: cuerpo`. Bolso, portaphotocard y Rizo son una sola pieza. |
| Lazo Satén Stage | `collage-k-lazo-saten` | Ranura `pin`, `zona: cabeza`: el lazo y el pin se pisan en el pelo, así que uno sustituye al otro. |

- **Orden de capas** (`ranurasAccesorio`): gorro, orejas, auriculares, gafas, pin (o lazo), bolso, muñeca, mano. Los auriculares tapan el gancho de los pendientes y el lightstick va delante del bolso.
- **Sin campos de color nuevos:** porDefecto no cambia.
- **Miniaturas:** los recortes de ChatGPT; un solo pendiente; el brazalete, algo más amplio (`108 328 70 42`) para que quepan los dos anclajes.

## Código

- `js/catalogo.js`: `indiceVariante` elige el archivo por rostro, por cuerpo o por cuerpo sin perfil integrado.
- App: `catalogos/canje.js` con las seis familias y los **precios propuestos** (25, 20, 10, 10, 30 y 10 Kpopis), pendientes de la autora. La vista previa del canje enseña también la falda y los accesorios. El recorte del rostro deja solo los accesorios de la cabeza: sin bolso, brazalete ni lightstick.

## Comprobado

- **Tests:** editor `tests/collage-encore.test.js` (12); app `tests/encore.test.js` (8 y uno pendiente), y los ajustes de `canje`, `varios-accesorios` y los recuentos de cinturas.
- **Chrome sin ventana:**
  - el brazalete con las 20 prendas de arriba y los tres cuerpos;
  - los pendientes y el lazo con los tres rostros y cuatro peinados;
  - las combinaciones con el gorro, los auriculares, el pin y el lightstick;
  - el editor real con el avatar guardado;
  - el catálogo de canje;
  - el sello y su vista previa filtrada (7 imágenes);
  - la exportación PNG y la photocard PDF con el código del editor.

## Pendiente

- **Límite de imágenes del filtro del sello:** resuelto en E0087 (D076). Pasa de 8 a 16; lo más cargado del catálogo llega a 12, y un test de `app/tests/encore.test.js` avisa si un lote nuevo lo supera.
- **Lote 07 (iris fotográfico):** solo está guardado en `07_collage-k-ojos-iris-fotografico/`; no está en el catálogo. Revisión de la autora pendiente.
- **Precios:** pendientes de confirmar.
- **Revisión de la autora en su navegador.**
