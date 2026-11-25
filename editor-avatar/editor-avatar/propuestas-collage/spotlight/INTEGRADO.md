# COLECCIÓN K · SPOTLIGHT · cómo se integró (Claude, 25/11/2026, E0088 y E0089)

**Nombre visible aprobado por la autora (D078):** COLECCIÓN K · SPOTLIGHT. **Lema:** «Brilla en tu propio escenario». Se ve en la pestaña «K», debajo del título del apartado Spotlight (E0091).

## De dónde viene

- **Origen:** el lote 06 de ChatGPT (`KME_coleccion_K_Encore_lote06.zip`, 16:42), que llegó con «Encore» en el nombre.
- **Por qué no se llama Encore:** ese nombre se reserva para la colección aprobada (`../encore/`, D075), de las 17:34.
- **Qué entró:** la autora quiso todo «si no son lo mismo» (D077). Las piezas distintas de las de Encore entran como **opciones nuevas y propuestas**: en Colección «K», sin canje ni precio. Las de Encore no cambian.
- **Qué hay en esta carpeta:** su LEEME, las fichas, el catálogo propuesto, `ARCHIVOS.json` (bytes de cada archivo), las texturas y la verificación. Rizo suelto, en `svg-sin-usar/`. No se copiaron las referencias grandes ni `PROMPTS_PARA_CLAUDE.txt`, que lleva rutas del ordenador de la autora.

## Las ocho familias del ZIP, identificadas por su contenido

Cada archivo del ZIP se usa una sola vez; el test `collage-spotlight` lo comprueba con los bytes de `ARCHIVOS.json`.

| Familia del ZIP (por contenido) | Nombre visible | Id técnico (no cambia) | Archivos |
| --- | --- | --- | --- |
| Chaqueta de paneles de cristal | Chaqueta Cristal Spotlight · cuerpo | `collage-k06-chaqueta-cristal-*` | 3 |
| Falda de satén con cuadros | Falda Satén Spotlight · cuerpo | `collage-k06-falda-saten-*` | 3 |
| Pendientes de gota ovalada | Pendientes Cometa Spotlight | `collage-k06-pendientes-cometa` | 1, más la copia para el rostro ovalado |
| Pulseras | Pulseras Fanchant | `collage-k06-pulseras-fanchant` | 6 (brazo y manga) |
| Pines con cadena | Pines Fan Signal | `collage-k06-pines-fan-signal` | 3 |
| Bolso con photocard | Bolso Spotlight con photocard | `collage-k06-bolso-encore` | 3 |
| Rizo (siempre colgado del bolso) | Bolso Spotlight con photocard y Rizo | `collage-k06-bolso-encore-rizo` | 3 (la composición del ZIP) |
| Lazo con colas | Lazo Satén Spotlight | `collage-k06-lazo-saten` | 1 |

- **Lo que no cambia:**
  - los ids y los nombres de archivo (`collage-k06-…`, también los que dicen «encore»), para no romper recetas guardadas;
  - los archivos SVG, tal como se entregaron.
- **Colección técnica:** `collage-spotlight`.
- **Los títulos internos de los SVG:** llegaron con los nombres antiguos («Bolso Encore…», «Lazo Satén Stage»…). En los accesorios esos títulos van dentro del dibujo y el navegador los puede enseñar al pasar el ratón. Por eso el catálogo los marca con `retitular`, y al dibujarlos se cambian por el nombre visible. En la ropa no hace falta: el título no entra en el dibujo.

## Montaje

| Pieza | Montaje |
| --- | --- |
| Chaqueta | Una por cuerpo, perfil integrado, color de arriba, bajo a 350/370. |
| Falda | Una por cuerpo, sustituye las piernas, color de abajo, calzado compacto. Miniatura de solo la falda. |
| Pendientes | Ranura `orejas`; copia para el rostro ovalado (anclajes 86→100, 314→300, 235→239). |
| Pulseras | Ranura `muneca` (como el brazalete de Encore: una u otro). Anclaje sobre el brazo con el perfil integrado y sobre la manga con la camiseta integrada. |
| Pines | Ranura NUEVA `pecho`, delante de la ropa y bajo la correa del bolso. |
| Bolsos | Ranura `bolso`. Rizo cuelga de una argolla visible y nunca va suelto. |
| Lazo | Ranura `pin`. |

- **Además:** la falda de Encore también enseña solo la falda en su miniatura.
- **Orden de capas:** gorro, orejas, auriculares, gafas, pin, pecho, bolso, muñeca, mano.
- **Identidad de K-ME:** sin cambios en el dibujo. Se mantienen los contornos negros redondeados, el blanco y el fucsia, los colores de la paleta y las texturas selectivas; los logos no se tocan.

## Comprobado

- **Tests:**
  - editor `tests/collage-spotlight.test.js` (9), que incluye que nada visible diga «Encore» ni «lote 06»;
  - app `tests/spotlight.test.js` (4).
- **Chrome sin ventana:**
  - las dos prendas en las tres siluetas, y con la falda con botas del lote 05 (sin problemas);
  - las pulseras con las 21 prendas de arriba;
  - los pendientes y el lazo con tres rostros y cuatro peinados;
  - el bolso con Rizo;
  - el editor real con un avatar guardado por cuerpo (recargado igual) y el selector con los nombres Spotlight;
  - el sello «Rostro».
- **Imágenes:** todo Spotlight junto usa 8. Lo más cargado del catálogo llega a 13, dentro del límite de 16 (D076).

## Pendiente

- La revisión de la autora (T049).
- Los precios y el canje.
- El lema: E0090 lo dejó solo apuntado y E0091 lo enseña en la app. En «K», un apartado propio con el título, el lema debajo y las piezas Spotlight (`colecciones` en `kme.json`).
- Rizo destaca poco sobre fondo blanco.
