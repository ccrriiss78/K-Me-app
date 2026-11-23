import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const url=new URL('../datos/kme.json',import.meta.url);
async function dibujos(ruta,capa){
  const d=JSON.parse(await readFile(url,'utf8'));
  const rutas=new Set(d.piezas[ruta].flatMap(p=>[p.capas[capa]].flat()).filter(Boolean));
  return Promise.all([...rutas].map(async r=>({ruta:r,svg:await readFile(new URL(r,url),'utf8')})));
}
function trayectoria(svg,parte){const tag=svg.match(new RegExp('<path[^>]*data-parte="'+parte+'"[^>]*>'))?.[0];return tag?.match(/\bd="([^"]+)"/)?.[1];}

test('Todas las prendas superiores usan hombros y costados curvos y brazos flexibles con manos redondeadas',async()=>{
  for(const {ruta,svg}of await dibujos('ropa.arriba','ropa_arriba')){
    const prenda=trayectoria(svg,'camiseta')||trayectoria(svg,'prenda-superior');assert.ok(prenda,ruta);
    assert.ok((prenda.match(/C/g)||[]).length>=6,ruta+': hombros y costados necesitan curvas suaves');
    for(const lado of ['brazo-izquierdo','brazo-derecho']){
      const brazo=trayectoria(svg,lado);assert.ok(brazo,ruta);
      assert.ok((brazo.match(/C/g)||[]).length>=3,ruta+': brazo y mano deben fluir con curvas');
    }
  }
});
test('Falda, cargo y bermudas suavizan caderas, bajos y perneras en las tres tallas',async()=>{
  for(const {ruta,svg}of await dibujos('ropa.abajo','ropa_abajo')){
    const prenda=trayectoria(svg,'prenda');assert.ok(prenda,ruta);
    assert.ok((prenda.match(/C/g)||[]).length>=5,ruta+': la silueta inferior debe evitar bloques rectangulares');
    const zapatos=trayectoria(svg,'calzado');assert.ok(zapatos,ruta);
    assert.ok((zapatos.match(/C/g)||[]).length>=6,ruta+': calzado blando y redondeado');
  }
});
test('Los cuerpos mantienen cuello y cintura compatibles y un calzado más compacto para destacar la cabeza',async()=>{
  const inferiores=await dibujos('ropa.abajo','ropa_abajo'),bases=await dibujos('cuerpo','cuerpo');
  for(const {ruta,svg}of [...inferiores,...bases]){
    const zapatos=trayectoria(svg,'calzado');assert.ok(zapatos,ruta);
    const numeros=zapatos.match(/-?\d*\.?\d+/g).map(Number);
    const ys=numeros.filter((_,i)=>i%2===1);
    assert.ok(Math.max(...ys)<=432,ruta+': cuerpo compacto, sin alargar la figura');
    assert.match(svg,/data-parte="piernas"[^>]*class="f-piel"|data-parte="piernas"[^>]*d="[^"]+"[^>]*class="f-piel"/);
  }
});
