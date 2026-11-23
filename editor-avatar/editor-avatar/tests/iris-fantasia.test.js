import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('El iris combina naturales y fantasía, incluye magenta y lila y evita tonos casi duplicados',async()=>{
  const d=JSON.parse(await readFile(new URL('../datos/kme.json',import.meta.url),'utf8'));
  const grupos=d.gruposPaleta?.ojos;
  assert.ok(grupos?.naturales?.length && grupos?.fantasia?.length,'Faltan los dos grupos visuales');
  assert.deepEqual([...grupos.naturales,...grupos.fantasia],d.paletas.ojos);
  assert.ok(grupos.fantasia.includes('#ff27c0'));
  assert.ok(grupos.fantasia.includes('#b878ff'));
  const rgb=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
  for(let i=0;i<d.paletas.ojos.length;i++)for(let j=i+1;j<d.paletas.ojos.length;j++){
    const a=rgb(d.paletas.ojos[i]),b=rgb(d.paletas.ojos[j]);
    const distancia=Math.hypot(...a.map((v,k)=>v-b[k]));
    assert.ok(distancia>=35,`Tonos demasiado próximos: ${d.paletas.ojos[i]} y ${d.paletas.ojos[j]}`);
  }
  for(const color of d.paletas.ojos)assert.ok(d.nombresColor[color]);
});
