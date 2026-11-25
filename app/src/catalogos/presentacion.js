// AVATAR DE PRESENTACIÓN de K-ME Studio (E0083): con el que empieza un avatar nuevo, para que se vean
// enseguida las piezas especiales de Colección «K». Solo lleva especiales gratis (nunca una de canje:
// una cuenta nueva no la tiene). Los avatares guardados no cambian. Cambiarlo es editar este archivo.
// Pendiente: ojos con iris de aspecto fotográfico, cuando lleguen del lote de ChatGPT.
export function recetaPresentacion(porDefecto) {
  const receta = structuredClone(porDefecto);
  receta.ropa = { ...receta.ropa, abajo: 'collage-falda-botas-piel-delgado', colorAbajo: '#c5b1e3' };
  receta.accesorio = 'collage-gorro-punto';
  receta.colorGorro = '#e83475';
  return receta;
}
