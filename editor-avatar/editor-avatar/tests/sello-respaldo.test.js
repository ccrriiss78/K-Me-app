import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const archivo=new URL('../../../app/public/js/sello.js',import.meta.url);
async function entorno({compatible=true,valido=true}={}){
  const eventos=new Map(),ventana=new Map(),trabajos=new Map(),peticiones=[],envios=[];let n=0;
  const nodo=()=>({textContent:'',hidden:false,dataset:{},setAttribute(){},removeAttribute(){},replaceChildren(){},append(){}});
  const nodos=Object.fromEntries(['dibujo','avisos','ayuda','error','estado','cambios'].map(k=>[k,nodo()]));
  const boton={name:'accion',value:'vista',hidden:false};
  const form={dataset:{selloId:'42',selloPendiente:'false'},valores:[['nombre','Mi sello'],['palabra','amistad'],['_csrf','valor-ficticio'],['version','3']],
    addEventListener(k,fn){eventos.set(k,fn);},querySelector(){return boton;},
    requestSubmit(b){if(!valido)return;const e={submitter:b,preventDefault(){this.impedido=true;}};eventos.get('submit')?.(e);if(!e.impedido)envios.push([...form.valores,[b.name,b.value]]);}};
  class Datos {constructor(f){this.d=f.valores;}[Symbol.iterator](){return this.d[Symbol.iterator]();}}
  const contexto={document:{querySelector(s){if(s==='[data-sello-editor]')return form;return nodos[s.match(/data-sello-(\w+)/)?.[1]];},createElement:nodo},
    window:{addEventListener(k,f){ventana.set(k,f);}},FormData:Datos,URLSearchParams,AbortController,DOMParser:class {},
    setTimeout(fn){trabajos.set(++n,fn);return n;},clearTimeout(i){trabajos.delete(i);},
    fetch:compatible?(url,opciones)=>new Promise((resolve,reject)=>peticiones.push({url,opciones,resolve,reject})):undefined};
  await vm.runInNewContext(await readFile(archivo,'utf8'),contexto);
  return {form,boton,nodos,eventos,peticiones,envios,
    async cambiar(palabra='luz'){form.valores=form.valores.filter(([k])=>k!=='palabra');form.valores.push(['palabra',palabra]);eventos.get('change')?.({target:{name:'palabra'}});for(const [i,fn]of [...trabajos]){trabajos.delete(i);fn();}await new Promise(r=>setImmediate(r));},
    async responder(i,{json=false,redirected=false,ok=true,datos={}}={}){peticiones[i].resolve({redirected,ok,headers:{get:()=>json?'application/json':'text/html'},json:async()=>datos});await new Promise(r=>setImmediate(r));},
    salir(){const e={preventDefault(){this.impedido=true;}};ventana.get('beforeunload')?.(e);return Boolean(e.impedido);}
  };
}
test('El script oculta el botón de respaldo solo después de arrancar; el HTML conserva el botón sin hidden',async()=>{
  const e=await entorno();assert.equal(e.boton.hidden,true);
  const vista=await readFile(new URL('../../../app/src/views/sello-editor.ejs',import.meta.url),'utf8');
  const boton=vista.match(/<button\b[^>]*name="accion"[^>]*value="vista"[^>]*>/)?.[0];
  assert.ok(boton);assert.doesNotMatch(boton,/\bhidden\b/);
});
test('Sin fetch compatible el respaldo sigue visible y no se intercepta el formulario',async()=>{
  const e=await entorno({compatible:false});assert.equal(e.boton.hidden,false);assert.equal(e.eventos.has('submit'),false);
});
test('Una respuesta HTML por sesión caducada envía el formulario original con accion=vista, CSRF y versión, sin guardar ni entrar en bucle',async()=>{
  const e=await entorno();await e.cambiar();assert.equal(e.salir(),true);await e.responder(0,{redirected:true});
  assert.equal(e.envios.length,1);const datos=new Map(e.envios[0]);
  assert.equal(datos.get('accion'),'vista');assert.equal(datos.get('_csrf'),'valor-ficticio');assert.equal(datos.get('version'),'3');assert.equal(datos.get('palabra'),'luz');
  assert.equal(e.boton.hidden,false);assert.equal(e.salir(),false);
  await e.cambiar('amor');assert.equal(e.peticiones.length,1,'El respaldo no vuelve a pedir JSON');
});
test('Una respuesta sin JSON también usa el respaldo aunque no venga marcada como redirección',async()=>{
  const e=await entorno();await e.cambiar();await e.responder(0);assert.equal(e.envios.length,1);assert.equal(new Map(e.envios[0]).get('accion'),'vista');
});
test('Una respuesta HTML antigua no provoca navegación si ya hay una selección posterior',async()=>{
  const e=await entorno();await e.cambiar();await e.cambiar('amor');await e.responder(0,{redirected:true});assert.equal(e.envios.length,0);
});
test('Un error 400 en JSON se muestra en el editor y no envía el formulario',async()=>{
  const e=await entorno();await e.cambiar('');await e.responder(0,{json:true,ok:false,datos:{error:'El sello necesita una palabra o un avatar.'}});
  assert.equal(e.envios.length,0);assert.match(e.nodos.error.textContent,/necesita una palabra/);assert.equal(e.salir(),true);
});
test('Si la validación nativa impide el envío de respaldo, los cambios siguen pendientes y el botón reaparece',async()=>{
  const e=await entorno({valido:false});await e.cambiar();await e.responder(0,{redirected:true});assert.equal(e.envios.length,0);assert.equal(e.boton.hidden,false);assert.equal(e.salir(),true);
});
