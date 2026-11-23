import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const script = new URL('../../../app/public/js/sello.js', import.meta.url);
function entorno() {
  const eventos = new Map(), ventana = new Map(), trabajos = new Map(), peticiones = [];
  let secuencia = 0;
  const nodo = () => ({ textContent: '', hidden: false, dataset: {}, attributes: [], children: [],
    setAttribute(k,v){this[k]=v;}, removeAttribute(k){delete this[k];},
    replaceChildren(...h){this.children=h;this.textContent=h.map(n=>typeof n==='string'?n:n.textContent).join('');}, append(...h){this.children.push(...h);this.textContent=this.children.map(n=>typeof n==='string'?n:n.textContent).join('');},
    querySelector(){return null;},querySelectorAll(){return [];} });
  const nodos = Object.fromEntries(['dibujo','avisos','ayuda','error','estado','cambios'].map(k=>[k,nodo()]));
  const form = { dataset:{selloId:'42',selloPendiente:'false'}, valores:[['nombre','Mi sello'],['palabra','amistad'],['borde','negro'],['mostrar_alias','si'],['_csrf','no-se-debe-enviar'],['version','3']],
    addEventListener(k,fn){eventos.set(k,fn);}, querySelector(){return null;}, querySelectorAll(){return [];} };
  const doc = {querySelector(s){if(s==='[data-sello-editor]')return form;const k=s.match(/data-sello-(\w+)/)?.[1];return nodos[k]||null;},
    createElement:nodo,importNode:n=>n};
  class FormDataFicticio {constructor(f){this.d=f.valores;} *entries(){yield* this.d;} [Symbol.iterator](){return this.entries();}}
  class Parser {parseFromString(s){const root=nodo();root.localName='svg';root.namespaceURI='http://www.w3.org/2000/svg';root.textContent=s;return {documentElement:root,querySelector(){return /<script|foreignObject/.test(s)?{}:null;}};}}
  const contexto={document:doc,window:{addEventListener(k,f){ventana.set(k,f);}},FormData:FormDataFicticio,URLSearchParams,AbortController,DOMParser:Parser,
    setTimeout(fn){const id=++secuencia;trabajos.set(id,fn);return id;},clearTimeout(id){trabajos.delete(id);},
    fetch(url,opciones){return new Promise((resolve,reject)=>peticiones.push({url,opciones,resolve,reject}));}};
  return {form,nodos,peticiones,eventos,ventana,
    async iniciar(){vm.runInNewContext(await readFile(script,'utf8'),contexto);},
    cambiar(campo='palabra',valor='luz'){form.valores=form.valores.filter(([k])=>k!==campo);form.valores.push([campo,valor]);eventos.get('change')?.({target:{name:campo}});},
    async reloj(){for(const [id,fn]of [...trabajos]){trabajos.delete(id);fn();}await new Promise(r=>setImmediate(r));},
    async responder(i,datos,ok=true){peticiones[i].resolve({ok,status:ok?200:400,headers:{get:()=> 'application/json'},json:async()=>datos});await new Promise(r=>setImmediate(r));},
    salir(){const e={preventDefault(){this.impedido=true;}};ventana.get('beforeunload')?.(e);return Boolean(e.impedido);}
  };
}

test('La vista previa pide JSON, conserva el id del sello y no envía CSRF, versión ni nombre privado por GET',async()=>{
  const e=entorno();await e.iniciar();e.cambiar();await e.reloj();
  assert.equal(e.peticiones.length,1);
  const r=e.peticiones[0],q=new URLSearchParams(r.url.split('?')[1]);
  assert.equal(r.opciones.headers.Accept,'application/json');assert.equal(q.get('sello'),'42');assert.equal(q.get('palabra'),'luz');
  for(const k of ['_csrf','version','nombre'])assert.equal(q.has(k),false,k);
});

test('Una respuesta antigua nunca sustituye la vista previa más reciente y se actualizan ayuda y avisos',async()=>{
  const e=entorno();await e.iniciar();e.cambiar();await e.reloj();e.cambiar('palabra','amor');await e.reloj();
  assert.equal(e.peticiones.length,2);assert.equal(e.peticiones[0].opciones.signal.aborted,true);
  await e.responder(1,{svg:'<svg>nuevo</svg>',avisos:['Contraste bajo'],ayuda:{hangul:'사랑',lectura:'sarang',significado:'amor'}});
  await e.responder(0,{svg:'<svg>antiguo</svg>',avisos:[],ayuda:null});
  assert.equal(e.nodos.dibujo.children[0].textContent,'<svg>nuevo</svg>');
  assert.match(e.nodos.ayuda.textContent,/sarang/);assert.equal(e.nodos.avisos.children[0].textContent,'Contraste bajo');
  assert.match(e.nodos.estado.textContent,/actualizada/i);
});

test('Ver el sello no borra el aviso de cambios sin guardar; guardar sí permite la navegación del formulario',async()=>{
  const e=entorno();await e.iniciar();assert.equal(e.salir(),false);e.cambiar();assert.equal(e.salir(),true);await e.reloj();
  await e.responder(0,{svg:'<svg/>',avisos:[],ayuda:null});assert.equal(e.salir(),true);
  e.eventos.get('submit')?.({submitter:{name:'accion',value:'guardar'},preventDefault(){}});assert.equal(e.salir(),false);
  e.ventana.get('pageshow')?.();assert.equal(e.salir(),true);
});

test('Un error de selección se muestra como texto, mantiene los cambios y permite corregirlos',async()=>{
  const e=entorno();await e.iniciar();e.cambiar('palabra','');await e.reloj();
  await e.responder(0,{error:'<b>El sello necesita una palabra o un avatar.</b>'},false);
  assert.equal(e.nodos.error.textContent,'<b>El sello necesita una palabra o un avatar.</b>');assert.equal(e.salir(),true);
  assert.match(e.nodos.estado.textContent,/anterior|actualizar/i);
  e.cambiar();await e.reloj();await e.responder(1,{svg:'<svg/>',avisos:[],ayuda:null});assert.equal(e.nodos.error.hidden,true);
});

test('Ver cómo queda intercepta solo la vista previa, sin cambiar el envío normal de Guardar',async()=>{
  const e=entorno();await e.iniciar();let impedido=false;
  e.eventos.get('submit')?.({submitter:{name:'accion',value:'vista'},preventDefault(){impedido=true;}});
  await e.reloj();assert.equal(impedido,true);assert.equal(e.peticiones.length,1);
});

test('No se inserta un SVG que contenga código activo',async()=>{
  const e=entorno();await e.iniciar();e.cambiar();await e.reloj();await e.responder(0,{svg:'<svg><script>mal</script></svg>',avisos:[],ayuda:null});
  assert.equal(e.nodos.dibujo.children.length,0);assert.equal(e.nodos.error.hidden,false);
});
