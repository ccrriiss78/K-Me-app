import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Catalogo } from '../js/catalogo.js';
import { seleccionarPiezaKme } from '../js/kme-ropa.js';
import { svgDelAvatar } from '../js/renderizador.js';
import { mascara } from './helpers/silueta-ropa.js';

async function cargar() {
  const url=new URL('../datos/kme.json',import.meta.url);
  const d=JSON.parse(await readFile(url,'utf8')),archivos=new Map();
  for(const lista of Object.values(d.piezas))for(const p of lista)for(const capa in p.capas){
    p.capas[capa]=[p.capas[capa]].flat();
    for(const a of p.capas[capa]){const s=await readFile(new URL(a,url),'utf8');archivos.set(a,s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>')));}
  }
  return new Catalogo(d,archivos);
}
// Incluye la piel: un abdomen visible no es un hueco transparente.
// La máscara aplica los transforms de cada SVG y conserva las tres anchuras.
test('Todas las elecciones de ropa, cuerpo y orden mantienen una cintura continua con piel o ropa, incluidas las prendas de talle bajo',async()=>{
  const c=await cargar(),comprobados=new Set(),cache=new Map();let n=0,puntos=0;
  const forma=svg=>{svg=svg||'';if(!cache.has(svg))cache.set(svg,mascara(svg));return cache.get(svg);};
  for(const superior of c.piezas('ropa.arriba'))for(const inferior of c.piezas('ropa.abajo'))for(const cuerpo of c.piezas('cuerpo'))for(const orden of [0,1]){
    const a=structuredClone(c.porDefecto),elecciones=[['ropa.arriba',superior.id],['ropa.abajo',inferior.id]];
    if(orden)elecciones.reverse();
    for(const [ruta,id] of elecciones)seleccionarPiezaKme(c,a,ruta,id);
    seleccionarPiezaKme(c,a,'cuerpo',cuerpo.id);n++;
    const p=c.pieza('ropa.arriba',a.ropa.arriba),q=c.pieza('ropa.abajo',a.ropa.abajo);
    if(p.cuerpoCompatible)assert.equal(p.cuerpoCompatible,a.cuerpo);
    if(q.cuerpoCompatible)assert.equal(q.cuerpoCompatible,a.cuerpo);
    const key=[a.cuerpo,a.ropa.arriba,a.ropa.abajo].join('/');
    if(comprobados.has(key))continue;comprobados.add(key);
    const capas=c.contenido(a),superficies=['cuerpo','torso','piernas','ropa_abajo','ropa_arriba'].map(k=>forma(capas[k]));
    const cintura=q.cinturaY||350;
    // Se conserva la zona que originó el aviso y se añade la cintura real,
    // para comprobar tanto los pantalones altos como los de talle bajo.
    const zonas=[[173,227,2,357,367,2],[180,220,2,cintura-3,cintura+3,1]];
    for(const [x0,x1,pasoX,y0,y1,pasoY]of zonas)for(let y=y0;y<=y1;y+=pasoY)for(let x=x0;x<=x1;x+=pasoX){
      assert.ok(superficies.some(m=>m[y*400+x]),key+': hueco transparente en ('+x+','+y+')');puntos++;
    }
  }
  assert.equal(n,c.piezas('ropa.arriba').length*c.piezas('ropa.abajo').length*c.piezas('cuerpo').length*2);
  assert.ok(comprobados.size>=36);assert.ok(puntos>0);
});

test('Cambiar la piel colorea cara, cuello, brazos y piernas; los dos colores de ropa son independientes y se exportan',async()=>{
  const c=await cargar();let n=0;
  for(const superior of c.piezas('ropa.arriba'))for(const inferior of c.piezas('ropa.abajo'))for(const cuerpo of c.piezas('cuerpo')){
    const a=structuredClone(c.porDefecto);
    seleccionarPiezaKme(c,a,'ropa.arriba',superior.id);seleccionarPiezaKme(c,a,'ropa.abajo',inferior.id);seleccionarPiezaKme(c,a,'cuerpo',cuerpo.id);
    for(const piel of c.paleta('piel')){
      a.piel=piel;a.ropa.colorArriba='#e83475';a.ropa.colorAbajo='#6e737b';
      const capas=c.contenido(a),svg=svgDelAvatar(c,a,{id:'comprobar-colores'});
      assert.match(svg,new RegExp('\\.f-piel\\{fill:'+piel+'\\}'));
      assert.match(svg,/\.f-arriba\{fill:#e83475\}/);assert.match(svg,/\.f-abajo\{fill:#6e737b\}/);
      for(const [parte,capa] of [['cuello','ropa_arriba'],['brazo-izquierdo','ropa_arriba'],['brazo-derecho','ropa_arriba']])assert.match(capas[capa],new RegExp('<path[^>]*data-parte="'+parte+'"[^>]*class="f-piel"'));
      assert.match(capas.cabeza,/class="f-piel"/);assert.match(capas.piernas||capas.cuerpo,/data-parte="piernas"[^>]*class="f-piel"/);
      n++;
    }
  }assert.equal(n,c.piezas('ropa.arriba').length*c.piezas('ropa.abajo').length*c.piezas('cuerpo').length*c.paleta('piel').length);
});
