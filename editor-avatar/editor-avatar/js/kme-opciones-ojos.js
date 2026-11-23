// El brillo redondo deja de ser una elección, sin borrar dibujos anteriores.
export function opcionesOjosVisibles(catalogo) {
  return catalogo.piezas('ojos.estilo')
    // Las pruebas del mockup tienen su sección aparte; esta lista conserva las colecciones previas.
    .filter(p=>p.coleccion!=='kme-mockup')
    .filter(p=>p.coleccion!=='kme-sugeridos'||!p.id.endsWith('-punto'))
    .map(p=>({...p,nombre:p.nombre.replace(' · brillo estrella','')}));
}
