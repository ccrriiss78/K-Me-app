// Entrada del editor visual. La versión autónoma incorpora todos los módulos.
import { cargarCatalogo } from './catalogo.js';
import { montarEditorVisual } from './kme-vista-visual.js';
import { montarAmbienteVisual } from './kme-ambiente-visual.js';
import { montarImpresion } from './kme-impresion.js';

try {
  const catalogo=await cargarCatalogo('datos/kme.json');
  montarAmbienteVisual(document);
  const vista=montarEditorVisual(document,catalogo);
  montarImpresion(document,catalogo,vista);
} catch(error) {
  document.getElementById('estado').textContent='No se pudieron cargar las piezas. Abre KME_ABRIR_MUESTRA.html para usarlo sin servidor.';
  console.error(error);
}
