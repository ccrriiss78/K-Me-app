// CATÁLOGO DE CANJE de Colección «K» (E0083). De momento, dos piezas especiales que se canjean
// con Kpopis; la autora añadirá otras. Se canjea la FAMILIA: una vez tuya, tienes sus variantes
// para los tres cuerpos. El precio solo lo aplica el servidor. Las piezas viven en el catálogo
// del editor (kme.json); aquí solo están su familia, su nombre, la parte del avatar y el precio.
// colorMuestra: el color de la paleta con el que se enseña en la vista previa del catálogo.
export const CANJE = [
  { familia: 'collage-top-lentejuelas', nombre: 'Top Destello', ruta: 'ropa.arriba', precio: 20, colorMuestra: '#e83475' },
  { familia: 'collage-chaqueta-denim', nombre: 'Chaqueta Denim Collage', ruta: 'ropa.arriba', precio: 20, colorMuestra: '#557a9d' },
];
export const buscarCanje = (familia) => CANJE.find((p) => p.familia === familia) ?? null;
