import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const url=new URL('../datos/kme.json',import.meta.url);
const datos=async()=>JSON.parse(await readFile(url,'utf8'));
test('Los doce ojos anteriores conservan sus archivos, IDs y dibujos intactos',async()=>{
  const d=await datos(),guardados=JSON.parse(await readFile(new URL('./ojos-anteriores.sha256.json',import.meta.url),'utf8'));
  assert.equal(guardados.length,12);
  for(const anterior of guardados){
    const ruta='../assets/kme/ojos/'+anterior.nombre;
    assert.ok(d.piezas['ojos.estilo'].some(p=>p.id===anterior.nombre.replace('.svg','')&&p.capas.ojos===ruta));
    assert.equal(createHash('sha256').update(await readFile(new URL(ruta,url))).digest('hex'),anterior.hash);
  }
});
test('La nueva colección ofrece tres formas con abiertos, cerrados y guiño a cada lado, sin contorno blanco cerrado',async()=>{
  const d=await datos(),nuevos=d.piezas['ojos.estilo'].filter(p=>p.coleccion==='kme-sugeridos');
  assert.equal(nuevos.length,21);
  const formas=new Set();
  for(const familia of ['redondos','almendrados','alargados']){
    for(const expresion of ['abiertos','guino-izquierdo','guino-derecho','cerrados']){
      const brillos=expresion==='cerrados'?['sin-brillo']:['punto','estrella'];
      for(const brillo of brillos){
        const p=nuevos.find(x=>x.id===`kme-${familia}-${expresion}-${brillo}`);assert.ok(p,`Falta ${familia} ${expresion} ${brillo}`);
        const svg=await readFile(new URL(p.capas.ojos,url),'utf8');
        assert.doesNotMatch(svg,/<(?:path|ellipse)[^>]*fill="#fffaf7"/i,'Sin blanco opaco alrededor del iris');
        assert.match(svg,/data-parte="linea-ojo"[^>]*fill="none"/);
        const pupilas=(svg.match(/data-parte="pupila-logo"/g)||[]).length;
        assert.equal(pupilas,expresion==='abiertos'?2:expresion==='cerrados'?0:1);
        if(pupilas){
          assert.match(svg,/class="f-ojos"/);
          assert.match(svg,new RegExp('data-brillo="'+brillo+'"'));
          if(expresion==='abiertos'&&brillo==='punto')formas.add(svg.match(/data-parte="iris"[^>]*rx="([^"]+)"[^>]*ry="([^"]+)"/).slice(1).join('/'));
        }
      }
    }
  }
  assert.equal(formas.size,3,'Cada familia modifica la silueta del iris');
});
test('La pupila reproduce el ojo abierto del logo y mantiene su forma con cualquier familia de iris',async()=>{
  const d=await datos();
  const logo=await readFile(new URL('../../../K-ME-logos-revisados-v1.1/K-ME-logos-revisados-v1.1/03-web/K-ME-Studio.svg',import.meta.url),'utf8');
  const pupila=logo.match(/<path fill="#000000" d="(M57\.2 79[^"]+)"/)[1];
  for(const p of d.piezas['ojos.estilo'].filter(p=>p.coleccion==='kme-sugeridos'&&!p.id.includes('cerrados'))){
    const svg=await readFile(new URL(p.capas.ojos,url),'utf8');
    assert.ok(svg.includes(`data-parte="pupila-logo" d="${pupila}"`));
    assert.doesNotMatch(svg,/<ellipse[^>]*data-parte="pupila-logo"/);
  }
});
