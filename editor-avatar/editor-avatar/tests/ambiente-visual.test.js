import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function ambiente(){
  let modulo;try{modulo=await import('../js/kme-ambiente-visual.js');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
  const reglas=new Map(),doc={documentElement:{style:{setProperty:(k,v)=>reglas.set(k,v)}}};
  const control=modulo?new modulo.AmbienteVisual(doc):{valores:{},elegir(){},restaurar(){}};
  return {control,reglas};
}
test('La interfaz empieza con el ambiente K-ME y admite cambiar fondo, acento y paneles sin guardar datos',async()=>{
  const {control,reglas}=await ambiente();
  assert.equal(control.valores.acento,'#e83475');assert.equal(reglas.get('--ui-background'),'#f7f3ef');
  control.elegir('acento','#8e4cd3');control.elegir('fondo','#f5edf3');control.elegir('paneles','#fff4f7');
  assert.equal(reglas.get('--ui-accent'),'#8e4cd3');assert.equal(reglas.get('--ui-background'),'#f5edf3');assert.equal(reglas.get('--ui-panel'),'#fff4f7');
  control.restaurar();assert.equal(reglas.get('--ui-accent'),'#e83475');assert.equal(reglas.get('--ui-background'),'#f7f3ef');
});
test('Las preferencias visuales rechazan valores no disponibles y usan texto legible sobre el acento',async()=>{
  const {control,reglas}=await ambiente();
  assert.throws(()=>control.elegir('acento','url(inventado)'));assert.throws(()=>control.elegir('logo','#123456'));
  const rgb=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  const lum=c=>{const r=rgb(c);return .2126*r[0]+.7152*r[1]+.0722*r[2];};
  for(const c of control.opciones.acento){control.elegir('acento',c.color);const a=lum(c.color),b=lum(reglas.get('--ui-accent-ink'));assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5);}
});
test('La muestra incorpora el panel Mi ambiente sin depender de servicios de login o guardado',async()=>{
  const html=await readFile(new URL('../KME_ABRIR_MUESTRA.html',import.meta.url),'utf8');
  assert.match(html,/id="mi-ambiente"/);assert.match(html,/id="opciones-ambiente"/);
  assert.match(html,/class="photocard"/);
  assert.doesNotMatch(html,/localStorage\.setItem|fetch\(['"]\/.*(?:sesion|preferencia|ambiente)/);
});
