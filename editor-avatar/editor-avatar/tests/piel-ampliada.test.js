import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('La piel ofrece al menos 18 tonos con nombres y conserva los seis anteriores',async()=>{
  const d=JSON.parse(await readFile(new URL('../datos/kme.json',import.meta.url),'utf8'));
  assert.ok(d.paletas.piel.length>=18);
  assert.equal(new Set(d.paletas.piel).size,d.paletas.piel.length);
  for(const c of ['#fff5ef','#f6d3b8','#eab894','#d39b73','#a96f4c','#7a4a33'])assert.ok(d.paletas.piel.includes(c));
  for(const c of d.paletas.piel){assert.match(c,/^#[0-9a-f]{6}$/i);assert.ok(d.nombresColor[c]?.length>2);}
});
