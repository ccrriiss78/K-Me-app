import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { documentoVisual } from './helpers/dom-visual.js';
import { mascara } from './helpers/silueta-ropa.js';
async function cargar(){
  const url=new URL('../datos/kme.json',import.meta.url),d=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
  for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){p.capas[capa]=[p.capas[capa]].flat();for(const ruta of p.capas[capa]){const s=await readFile(new URL(ruta,url),'utf8');archivos.set(ruta,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}}
  return new Catalogo(d,archivos);
}
test('Todas las miniaturas superiores muestran solo ropa, sin cuello, piel, abdomen, piernas ni prendas inferiores',async()=>{
  const c=await cargar(),doc=documentoVisual(),vista=montarEditorVisual(doc,c);
  for(const cuerpo of c.piezas('cuerpo')){
    vista.estado.elegirPieza('cuerpo',cuerpo.id);doc.buscar('Categoría: Ropa').click();
    for(const p of c.piezas('ropa.arriba').filter(p=>p.cuerpoCompatible===cuerpo.id||(!p.cuerpoCompatible&&p.id!=='camiseta'))){
      const b=doc.buscar('Parte superior: '+p.nombre);assert.ok(b,p.id);
      assert.match(b.innerHTML,/class="f-arriba"/);
      assert.doesNotMatch(b.innerHTML,/<(?:path|circle|g)[^>]*(?:class="f-piel"|data-parte="(?:cuello|brazo-[^"]+|piernas|abdomen|ombligo)"|class="f-abajo"|data-perfil=)/,p.id);
      assert.match(b.innerHTML,/viewBox="100 282 200 100"/);
    }
  }
});
test('Stage Noir tiene dos solapas interiores contenidas en la chaqueta en los tres grosores, sin superponer otro cuerpo con mangas',async()=>{
  const c=await cargar();
  for(const talla of ['delgado','medio','grueso']){
    const p=c.pieza('ropa.arriba','stage-noir-arriba-'+talla),s=c.archivos.get(p.capas.ropa_arriba[0]);
    const prenda=s.match(/<path data-parte="prenda-superior"[^>]*>/)?.[0];assert.ok(prenda);
    const solapas=[...s.matchAll(/<path data-parte="solapa"[^>]*>/g)].map(m=>m[0]);assert.equal(solapas.length,2);
    const m=mascara(prenda);
    for(const solapa of solapas){const detalle=mascara(solapa);let puntos=0;
      for(let i=0;i<detalle.length;i++)if(detalle[i]){puntos++;assert.equal(m[i],1,talla+': solapa fuera de la prenda');}
      assert.ok(puntos>20);
    }
  }
});

test('Cinco nuevos cortes de top tienen tres grosores, conservan la parte inferior elegida y muestran abdomen continuo con ombligo',async()=>{
  const c=await cargar();
  const { EditorVisual }=await import('../js/kme-editor-visual.js');
  const { svgDelAvatar }=await import('../js/renderizador.js');
  const { seleccionarPiezaKme }=await import('../js/kme-ropa.js');
  const formas=new Set();
  for(const id of ['top-orbita','top-halter','top-deportivo','top-cruzado','top-holgado'])for(const [talla,cuerpo] of [['delgado','relajado'],['medio','recto'],['grueso','amplio']]){
    const p=c.pieza('ropa.arriba',`${id}-arriba-${talla}`);assert.ok(p,'Falta '+id+'/'+talla);assert.equal(p.cuerpoCompatible,cuerpo);assert.ok(p.topCorto&&p.perfilIntegrado);
    const e=new EditorVisual(c);e.elegirPieza('cuerpo',cuerpo);
    const antes=e.avatar.ropa.abajo;e.elegirPieza('ropa.arriba',p.id);assert.equal(e.avatar.ropa.abajo,antes);
    if(talla==='medio')formas.add(c.contenido(e.avatar).ropa_arriba.match(/data-parte="prenda-superior" d="([^"]+)"/)[1]);
    for(const inferior of c.piezas('ropa.abajo').filter(q=>q.cuerpoCompatible===cuerpo)){
      seleccionarPiezaKme(c,e.avatar,'ropa.abajo',inferior.id);
      const svg=svgDelAvatar(c,e.avatar);assert.match(svg,/data-perfil="superior-unico"/);assert.match(svg,/data-parte="ombligo"/);
      assert.equal(e.avatar.ropa.arriba,p.id);
    }
  }
  assert.equal(formas.size,5,'Los cortes deben cambiar de silueta');
});
