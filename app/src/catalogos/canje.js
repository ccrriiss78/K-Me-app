// CATÁLOGO DE CANJE de Colección «K» (E0083). Piezas especiales que se canjean con Kpopis. Se
// canjea la FAMILIA: una vez tuya, tienes sus variantes para los tres cuerpos (y, en un accesorio,
// todo lo que lleva: el bolso Encore, con su portaphotocard y Rizo). El precio solo lo aplica el
// servidor. Las piezas viven en el catálogo del editor (kme.json); aquí solo están su familia (en
// un accesorio, su id), su nombre, la parte del avatar y el precio.
// colorMuestra: el color de la paleta con el que se enseña la ropa en la vista previa del catálogo.
// Los accesorios no tienen color propio.
export const CANJE = [
  { familia: 'collage-top-lentejuelas', nombre: 'Top Destello', ruta: 'ropa.arriba', precio: 20, colorMuestra: '#e83475' },
  { familia: 'collage-chaqueta-denim', nombre: 'Chaqueta Denim Collage', ruta: 'ropa.arriba', precio: 20, colorMuestra: '#557a9d' },
  // Colección Encore (D075, E0086). PRECIOS PROPUESTOS por ChatGPT: la autora todavía no los ha confirmado.
  { familia: 'collage-k-chaqueta-cristal', nombre: 'Chaqueta Cristal Stage', ruta: 'ropa.arriba', precio: 25, colorMuestra: '#e83475' },
  { familia: 'collage-k-falda-saten', nombre: 'Falda Satén Encore', ruta: 'ropa.abajo', precio: 20, colorMuestra: '#282126' },
  { familia: 'collage-k-pendientes-cometa', nombre: 'Pendientes Cometa', ruta: 'accesorio', precio: 10 },
  { familia: 'collage-k-brazalete-fanchant', nombre: 'Brazalete Fanchant', ruta: 'accesorio', precio: 10 },
  { familia: 'collage-k-bolso-encore-rizo', nombre: 'Bolso Encore con Rizo', ruta: 'accesorio', precio: 30 },
  { familia: 'collage-k-lazo-saten', nombre: 'Lazo Satén Stage', ruta: 'accesorio', precio: 10 },
];
export const buscarCanje = (familia) => CANJE.find((p) => p.familia === familia) ?? null;
