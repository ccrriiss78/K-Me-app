import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('Las opciones nuevas muestran solo estrella o cerrado y conservan los archivos anteriores',async()=>{
  const d=JSON.parse(await readFile(new URL('../datos/kme.json',import.meta.url),'utf8'));
  let modulo;try{modulo=await import('../js/kme-opciones-ojos.js');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
  const catalogo={piezas:()=>d.piezas['ojos.estilo']};
  const visibles=modulo?modulo.opcionesOjosVisibles(catalogo):catalogo.piezas();
  const nuevos=visibles.filter(p=>p.coleccion==='kme-sugeridos');
  assert.equal(nuevos.length,12);
  assert.ok(nuevos.every(p=>!p.id.endsWith('-punto')));
  assert.equal(visibles.filter(p=>p.coleccion!=='kme-sugeridos').length,12);
  assert.equal(d.piezas['ojos.estilo'].filter(p=>p.coleccion==='kme-sugeridos').length,21,'Se conservan los assets para compatibilidad');
});
