# Lotes collage 02 y 03 · cómo se integraron (Claude, 25/11/2026, E0080)

La documentación de ChatGPT y las texturas originales de cada lote están en `lote-02/` y `lote-03/`. Las referencias grandes no se copiaron.

## Lote 02 · Gorro de punto

- **Dibujo:** `assets/kme/accesorio/collage-gorro-punto.svg`, copiado sin cambios.
- **Catálogo:** `collage-gorro-punto` en «accesorio», con:
  - `zona: "cabeza"`;
  - `miniatura` propia (el gorro solo);
  - `rutaColor: "colorGorro"` y `tituloColor: "Color del gorro"`.
- **Color:**
  - campo NUEVO de la receta, `colorGorro`, lavanda (`#c5b1e3`) por defecto;
  - se elige con la paleta de la ropa (`kme-vista-visual.js` lo ofrece solo con el gorro puesto; `kme-editor-visual.js` lo valida);
  - `colores.js` pinta `.f-gorro-collage` con él;
  - nunca se toma el color de la camiseta.
- **Recetas anteriores:** sin el campo, reciben la lavanda al normalizarse. Ningún avatar guardado cambia de aspecto. El servidor valida el color con el catálogo, como los demás.
- **Encaje:** revisado con los 11 peinados y los 3 rostros (hoja de capturas del asistente). Con `mono` y `doble-mono-lazos` asoma parte del moño por fuera del gorro; queda para que la autora decida. No se ha tocado ningún peinado.
- **Una sola ranura de accesorio:** combinar varios accesorios es una decisión aparte (propuesta «uno por zona», pendiente de la autora).

## Lote 03 · Top Destello

- **Dibujos:** `assets/kme/ropa_arriba/collage-top-lentejuelas-{delgado,medio,grueso}.svg`, copiados sin cambios.
- **Catálogo:** tres ids por cuerpo, con la misma entrada que el halter (perfil, torso, superior, `perfilIntegrado`, `topCorto`) y sus propios archivos. El halter original no cambia.
- **Color:** el de la ropa de arriba (`ropa.colorArriba`).
- **Disponibilidad provisional:** pendiente de la autora. Hoy se ve en el menú como las demás prendas; no hay precio ni canje.

## Comprobado

- **Tests:**
  - editor: `tests/collage-lotes-02-03.test.js`, y el del lote 01 ajustado para admitir lotes nuevos;
  - app: `app/tests/avatar-collage.test.js`.
- **En Chrome:**
  - el editor real, eligiendo el top, el gorro y su color;
  - la photocard en PNG;
  - el filtro de la vista previa del sello.
