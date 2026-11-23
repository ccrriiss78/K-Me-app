import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const datos=async()=>JSON.parse(await readFile(new URL('../datos/kme.json',import.meta.url),'utf8'));

test('Los ojos y ambas prendas ofrecen una gama ampliada con nombres claros y conservan sus colores anteriores',async()=>{
  const d=await datos();
  for(const [paleta,minimo,anteriores] of [
    ['ojos',15,['#775d43','#4b7158','#282126']],
    ['arriba',24,['#fffaf7','#282126','#e83475']],
    ['abajo',24,['#282126','#6e737b','#e83475']]
  ]){
    assert.ok(d.paletas[paleta].length>=minimo,`Faltan colores en ${paleta}`);
    assert.equal(new Set(d.paletas[paleta]).size,d.paletas[paleta].length);
    for(const c of anteriores)assert.ok(d.paletas[paleta].includes(c));
    for(const c of d.paletas[paleta]){
      assert.match(c,/^#[0-9a-f]{6}$/i);
      assert.ok(d.nombresColor?.[c]?.length>2,`Falta el nombre de ${c}`);
    }
  }
});
test('La muestra autónoma incorpora los 21 ojos nuevos y mantiene los 12 anteriores disponibles',async()=>{
  const html=await readFile(new URL('../KME_ABRIR_MUESTRA.html',import.meta.url),'utf8');
  assert.match(html,/kme-redondos-abiertos-punto/);
  assert.match(html,/kme-almendrados-abiertos-estrella/);
  assert.match(html,/kme-alargados-guino-derecho-estrella/);
  assert.match(html,/redondos-guino-derecho/);
});
