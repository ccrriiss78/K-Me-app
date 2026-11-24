# Lote collage 01 · cómo se integró (Claude, 25/11/2026, E0079)

Entrega de ChatGPT del 24/11/2026 (`LEEME_PARA_CLAUDE.md`, `manifest.json`, `catalogo-propuesto.json` y las texturas originales de esta carpeta). Las referencias PNG grandes no se copiaron: eran composiciones de revisión, no recursos.

## Qué entró

- **Dibujos**, copiados sin cambios (byte a byte):
  - `assets/kme/ropa_abajo/collage-falda-bolsillos-{delgado,medio,grueso}.svg`;
  - `assets/kme/accesorio/collage-lightstick-estudio-{delgado,medio,grueso}.svg`.

  La copia sin sufijo del lightstick no entró (era igual que la delgada).
- **Catálogo** (`datos/kme.json`), solo añadiendo:
  - **Falda:** tres ids, uno por cuerpo (`collage-falda-bolsillos-delgado`, `-medio` y `-grueso`), con `familia`, `cuerpoCompatible`, `cinturaY`, `reemplazaCapas` y `gruposPorCapa`. Es el mismo mecanismo que las demás prendas con piernas: el menú «Parte inferior» enseña solo las del cuerpo elegido, y al cambiar de cuerpo se cambia de variante. La propuesta usaba un solo id con `indicePorCuerpo`, pero así no habría salido en el menú.
  - **Lightstick:** un id, `collage-lightstick-estudio`, con `indicePorCuerpo`, que ya existía en `catalogo.js`. Lleva además:
    - `miniatura`: su propio encuadre en el menú, porque está en la mano;
    - `zona: "mano"`: el recorte del rostro de la app (cabecera, Connect y sello «Solo rostro») lo deja fuera, para que no quede cortado junto a la barbilla.

## Comprobaciones nuevas

- **Ids únicos:** `renderizador.js` antepone el id de cada dibujo a los ids «collage-…» y a sus referencias. Así, varios avatares en una página no comparten patrones ni recortes. Las piezas anteriores no cambian.
- **Texturas:** solo `<image>` con PNG incrustado en base64, de 20 KiB y 256 px por lado como mucho:
  - en las piezas: `tests/collage-lote-01.test.js` y la regla nueva de `tests/kme-assets.test.js`;
  - en la vista previa del sello: `app/public/js/svg-seguro.js`.
- **Tests:**
  - editor: `tests/collage-lote-01.test.js`;
  - app: `app/tests/avatar-collage.test.js`.
- **En Chrome:**
  - filtro de la vista previa;
  - photocard del avatar y del sello en PNG, con las texturas;
  - editor real con las dos piezas elegidas.

## Lo que sigue sin revisar

- Todos los cruces del lightstick con brazos, prendas y peinados.
- La revisión de la autora en el navegador (T044).
- El color del acento del lightstick: es fijo, el fucsia de la marca. Elegirlo de la paleta necesitaría una clave nueva en la receta, que no se ha creado.
