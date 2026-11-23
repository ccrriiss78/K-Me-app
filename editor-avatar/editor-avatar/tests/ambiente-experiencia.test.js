import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AmbienteVisual, montarAmbienteVisual } from '../js/kme-ambiente-visual.js';
import { documentoVisual } from './helpers/dom-visual.js';

function documentoAmbiente(){
  const doc=documentoVisual(),reglas=new Map(),eventos={};
  doc.documentElement={style:{setProperty:(k,v)=>reglas.set(k,v)}};
  const ids=Object.fromEntries(['mi-ambiente','opciones-ambiente','abrir-ambiente','cerrar-ambiente'].map(id=>[id,doc.createElement('div')]));
  ids['mi-ambiente'].append(ids['abrir-ambiente'],ids['cerrar-ambiente'],ids['opciones-ambiente']);
  ids['mi-ambiente'].open=true;
  const contiene=(n,target)=>n===target||n.children.some(c=>contiene(c,target));
  ids['mi-ambiente'].contains=n=>contiene(ids['mi-ambiente'],n);
  const get=doc.getElementById;doc.getElementById=id=>ids[id]||get(id);
  doc.addEventListener=(tipo,fn)=>{(eventos[tipo]??=[]).push(fn);};
  doc.enviar=(tipo,evento)=>eventos[tipo]?.forEach(fn=>fn(evento));
  doc.buscarAmbiente=label=>{
    const buscar=n=>n.getAttribute?.('aria-label')===label||n.textContent===label?n:n.children.map(buscar).find(Boolean);
    return buscar(ids['mi-ambiente']);
  };
  return {doc,reglas,ids};
}
const lum=c=>{const v=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722;};
const contraste=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);

test('Mi ambiente explica la aplicación inmediata y Listo cierra sin perder el color y devuelve el foco',()=>{
  const {doc,reglas,ids}=documentoAmbiente();montarAmbienteVisual(doc);
  const ayuda=doc.buscarAmbiente('Los cambios se aplican al instante. Pulsa «Listo» para volver al editor.');
  assert.ok(ayuda,'La explicación debe estar visible dentro del panel');
  doc.buscarAmbiente('Color de acento: Orquídea').click();assert.equal(reglas.get('--ui-accent'),'#8e4cd3');
  const listo=doc.buscarAmbiente('Listo');assert.ok(listo,'Existe un cierre explícito');listo.click();
  assert.equal(ids['mi-ambiente'].open,false);assert.equal(reglas.get('--ui-accent'),'#8e4cd3');
  assert.equal(doc.activeElement,ids['abrir-ambiente']);
  ids['mi-ambiente'].open=true;assert.equal(doc.buscarAmbiente('Color de acento: Orquídea').getAttribute('aria-pressed'),'true');
});
test('Se puede cerrar Mi ambiente con la cruz, Escape o fuera del panel, sin cerrarlo al elegir un color',()=>{
  const {doc,ids}=documentoAmbiente();montarAmbienteVisual(doc);
  ids['cerrar-ambiente'].click();assert.equal(ids['mi-ambiente'].open,false);
  ids['mi-ambiente'].open=true;doc.enviar('keydown',{key:'Escape',preventDefault(){}});assert.equal(ids['mi-ambiente'].open,false);
  ids['mi-ambiente'].open=true;doc.enviar('click',{target:doc.buscarAmbiente('Color de acento: Orquídea')});assert.equal(ids['mi-ambiente'].open,true);
  doc.enviar('click',{target:doc.createElement('main')});assert.equal(ids['mi-ambiente'].open,false);
});
test('La paleta visible amplía fondos, paneles y acentos con colores diferenciados y nombres claros',()=>{
  const {doc}=documentoAmbiente(),a=new AmbienteVisual(doc);
  assert.ok(a.opciones.fondo.length>=8);assert.ok(a.opciones.paneles.length>=7);assert.ok(a.opciones.acento.length>=10);
  const rgb=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
  for(const colores of Object.values(a.opciones)){
    for(let i=0;i<colores.length;i++){
      assert.ok(colores[i].nombre.length>2);
      for(let j=i+1;j<colores.length;j++){
        const x=rgb(colores[i].color),y=rgb(colores[j].color);
        const distancia=Math.hypot(...x.map((v,k)=>v-y[k]));
        assert.ok(distancia>=45,`${colores[i].nombre} y ${colores[j].nombre} resultan demasiado similares`);
      }
    }
  }
});
test('El texto, enlaces y botón de acento mantienen contraste de lectura en todas las combinaciones ofrecidas',()=>{
  const {doc,reglas}=documentoAmbiente(),a=new AmbienteVisual(doc);
  for(const f of a.opciones.fondo)for(const p of a.opciones.paneles)for(const c of a.opciones.acento){
    a.elegir('fondo',f.color);a.elegir('paneles',p.color);a.elegir('acento',c.color);
    for(const superficie of [f.color,p.color,reglas.get('--ui-accent-soft')]){
      for(const texto of ['--ui-ink','--ui-muted','--ui-accent-text']){
        const color=reglas.get(texto);assert.match(color||'',/^#[0-9a-f]{6}$/i);
        assert.ok(contraste(color,superficie)>=4.5,`${texto} debe leerse sobre ${superficie}`);
      }
    }
    assert.ok(contraste(reglas.get('--ui-accent-ink'),c.color)>=4.5);
  }
});
