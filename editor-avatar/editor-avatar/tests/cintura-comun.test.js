import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { seleccionarPiezaKme } from '../js/kme-ropa.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { montarEditorVisual } from '../js/kme-vista-visual.js';
import { documentoVisual } from './helpers/dom-visual.js';
import { mascara } from './helpers/silueta-ropa.js';
async function cargar(){
  const url=new URL('../datos/kme.json',import.meta.url),d=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
  for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){p.capas[capa]=[p.capas[capa]].flat();for(const ruta of p.capas[capa]){const s=await readFile(new URL(ruta,url),'utf8');archivos.set(ruta,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}}
  return new Catalogo(d,archivos);
}
function limites(m,y){const fila=m.slice(y*400,(y+1)*400);return [fila.indexOf(1),fila.lastIndexOf(1)+1];}
test('Torso y cintura de todos los pantalones y faldas comparten los bordes 170/230, 162/238 y 154/246 en las tres anchuras',async()=>{
  const c=await cargar();let casos=0;
  for(const [cuerpo,izq,der] of [['relajado',170,230],['recto',162,238],['amplio',154,246]]){
    const superiores=c.piezas('ropa.arriba').filter(p=>p.coleccion==='lamina-kpop'&&p.cuerpoCompatible===cuerpo);
    const inferiores=c.piezas('ropa.abajo').filter(p=>!p.cuerpoCompatible||p.cuerpoCompatible===cuerpo);
    for(const p of superiores)for(const q of inferiores){
      const a=structuredClone(c.porDefecto);seleccionarPiezaKme(c,a,'ropa.arriba',p.id);seleccionarPiezaKme(c,a,'ropa.abajo',q.id);seleccionarPiezaKme(c,a,'cuerpo',cuerpo);
      const capas=c.contenido(a),y=q.cinturaY||350;
      const piel=limites(mascara(capas.torso),y-1),ropa=limites(mascara(capas.ropa_abajo),y+1);
      for(let lado=0;lado<2;lado++){
        const esperado=lado?der:izq;
        assert.ok(Math.abs(piel[lado]-esperado)<=1,`${p.id}/${q.id}: torso ${piel}, esperado ${izq}/${der}`);
        assert.ok(Math.abs(ropa[lado]-esperado)<=1,`${p.id}/${q.id}: cintura ${ropa}, esperado ${izq}/${der}`);
        assert.ok(Math.abs(piel[lado]-ropa[lado])<=1,`${p.id}/${q.id}: salto entre torso y ropa`);
      }casos++;
    }
  }assert.equal(casos,384); // 336 hasta el lote collage 01; cada falda nueva suma 8 tops × 3 cuerpos (lote 01, E0079; lote 05, E0082)
});
test('En todos los tops el ombligo tiene contraste y queda dentro de piel visible, por encima de cualquier cintura',async()=>{
  const c=await cargar();
  for(const p of c.piezas('ropa.arriba').filter(p=>p.topCorto))for(const q of c.piezas('ropa.abajo').filter(q=>!q.cuerpoCompatible||q.cuerpoCompatible===p.cuerpoCompatible)){
    const a=structuredClone(c.porDefecto);seleccionarPiezaKme(c,a,'ropa.arriba',p.id);seleccionarPiezaKme(c,a,'ropa.abajo',q.id);
    const svg=svgDelAvatar(c,a),marca=svg.match(/<circle data-parte="ombligo"[^>]*>/)?.[0];assert.ok(marca);
    assert.match(marca,/class="f-pecas"/,'El punto no debe perderse en el tono claro de piel');
    const y=Number(marca.match(/cy="([^"]+)"/)[1]);assert.ok(y+1.4<(q.cinturaY||350));
    assert.ok(mascara(c.contenido(a).torso)[Math.round(y)*400+200],p.id+': el punto cae en la piel');
  }
});
test('La miniatura superior de Pocket Pop muestra solo la prenda, sin piernas, calzado, piel ni ombligo',async()=>{
  const c=await cargar(),doc=documentoVisual();montarEditorVisual(doc,c);doc.buscar('Categoría: Ropa').click();
  const boton=doc.buscar('Parte superior: Pocket Pop · delgado');assert.ok(boton);
  assert.match(boton.innerHTML,/data-parte="prenda-superior"/);
  assert.doesNotMatch(boton.innerHTML,/<(?:path|circle|g)[^>]*(?:data-parte="(?:piernas|calzado|abdomen|ombligo|cuello|brazo-[^"]+)"|class="f-(?:piel|abajo)"|data-perfil=)/);
});
