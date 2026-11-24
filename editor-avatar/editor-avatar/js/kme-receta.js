// VALORES PERMITIDOS de la receta del avatar (contrato v1 con la app, D052; T037).
// Las piezas y los colores se comprueban con el catálogo (kme.json). Las demás opciones de la
// receta tienen aquí su lista EXACTA: es la única fuente de verdad del editor y del servidor de la
// app (app/src/services/avatarService.js). Si se añade una opción a «porDefecto», hay que darle su
// lista aquí: el test tests/kme-receta.test.js lo comprueba.
import { grosoresKme } from './kme-grosores.js';
import { estilosMechonesKme } from './kme-cabello-pinceladas.js';

// Acabados del cabello que ofrece el editor (EditorVisual.elegirAcabadoPelo usa esta misma lista).
export const acabadosPeloKme = ['tinta', 'acuarela', 'pinceladas'];

export function valoresPermitidos(catalogo) {
  return {
    grosorCejas: [...grosoresKme],
    'maquillaje.grosorLabios': [...grosoresKme],
    'pelo.acabado': [...acabadosPeloKme],
    'pelo.mechones': estilosMechonesKme.map(([id]) => id),
    // Sin fondo propio: el fondo lo pone el sello o la página. Si algún día el catálogo trae fondos,
    // también valen sus ids.
    fondo: ['ninguno', ...(catalogo.datos.piezas.fondo ?? []).map((p) => p.id)],
    // Campos del editor anterior (colores.js): el editor visual no los cambia nunca.
    'maquillaje.sombra': [null],
    'maquillaje.labial': [null],
  };
}
