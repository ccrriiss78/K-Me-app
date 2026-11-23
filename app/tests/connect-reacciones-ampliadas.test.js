// Ampliación concreta de catálogo y pruebas autorizada por la autora el 23/11/2026.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';
import { REACCIONES, EMOCIONES } from '../src/catalogos/connect.js';

const nuevas = ['llorar','emocion','tristeza','abrazo','risa','sorpresa'];
const antiguas = ['corazon','aplauso','lightstick','minicorazon','brillas','fuego','fanchant','corona','flores'];
test('Connect conserva las nueve reacciones anteriores y añade seis respuestas emocionales distintas', () => {
  assert.deepEqual(REACCIONES.slice(0,9).map(r=>r.id),antiguas);
  for(const id of nuevas) assert.ok(REACCIONES.some(r=>r.id===id),`falta ${id}`);
  assert.equal(new Set(REACCIONES.map(r=>r.id)).size,REACCIONES.length);
});

const vista = datos => ejs.renderFile(fileURLToPath(new URL('../src/views/connect.ejs',import.meta.url)),{
  titulo:'Connect', aliasSesion:'fan_demo', rutaActual:'/connect', csrfToken:'ficticio',
  emociones:EMOCIONES,maxReacciones:10,error:null,publicada:false,eliminada:false,
  publicaciones:[{id:37,alias:'fan_demo',inicial:'F',creadoEn:new Date('2026-11-23T00:00Z'),hace:'Ahora',
    emocion:EMOCIONES[0],totalMias:1,esMia:false,
    reacciones:REACCIONES.map((r,i)=>({...r,total:i,mias:i===8?1:0,completa:false,etiqueta:r.texto+': '+i+' en total'})),...datos}]
});

test('El muro ofrece accesos rápidos y Más reacciones con nombres, sin duplicar ni perder ningún botón',async()=>{
  const html=await vista();
  assert.ok(/<details[^>]*data-mas-reacciones/.test(html),'el desplegable funciona también sin JavaScript');
  assert.ok(html.includes('Más reacciones'));
  for(const r of REACCIONES) assert.equal((html.match(new RegExp(`name="tipo" value="${r.id}"`,'g'))||[]).length,1,r.id);
  const menu=html.match(/<details[^>]*data-mas-reacciones[\s\S]*?<\/details>/)?.[0]||'';
  for(const id of ['brillas','corona',...nuevas]) assert.ok(menu.includes(`value="${id}"`),`${id} está en Más`);
  assert.ok(menu.includes('reaccion__nombre'),'los iconos adicionales tienen texto visible');
  assert.ok(html.includes('name="_csrf" value="ficticio"'));
  assert.ok(!/<script(?![^>]*\bsrc=)|\bonclick=/.test(html));
});

test('El desplegable conserva los totales y el límite por reacción y escapa el alias público',async()=>{
  const html=await vista({alias:'<b>fan</b>',reacciones:REACCIONES.map(r=>({...r,total:10,mias:10,completa:true,etiqueta:r.texto}))});
  assert.ok(!html.includes('<b>fan</b>')); assert.ok(html.includes('&lt;b&gt;fan&lt;/b&gt;'));
  for(const r of REACCIONES) {
    const boton=html.match(new RegExp(`<button[^>]*name="tipo" value="${r.id}"[^>]*>`))?.[0]||'';
    assert.ok(boton.includes('data-total="10"')&&boton.includes('data-mias="10"')&&boton.includes('disabled'),r.id);
  }
});

async function entornoMenu(){
  const eventos=new Map();
  const foco={};
  const menu={open:true,contains:n=>n?.dentro===true,querySelector:()=>({focus(){foco.devuelto=true;}})};
  const document={getElementById:()=>null,querySelectorAll:()=>menu.open?[menu]:[],
    addEventListener:(tipo,fn)=>eventos.set(tipo,fn)};
  vm.runInNewContext(await readFile(new URL('../public/js/connect.js',import.meta.url),'utf8'),{document});
  return {eventos,menu,foco};
}
test('Escape cierra Más reacciones y devuelve el foco al control que lo abrió',async()=>{
  const e=await entornoMenu(); let impedido=false;
  e.eventos.get('keydown')?.({key:'Escape',target:{closest:()=>e.menu},preventDefault(){impedido=true;}});
  assert.equal(e.menu.open,false); assert.equal(e.foco.devuelto,true); assert.equal(impedido,true);
});
test('Pulsar fuera cierra el desplegable; elegir una reacción dentro permite seguir sumando',async()=>{
  const e=await entornoMenu();
  e.eventos.get('click')?.({target:{dentro:true}}); assert.equal(e.menu.open,true);
  e.eventos.get('click')?.({target:{dentro:false}}); assert.equal(e.menu.open,false);
});

let servidor,base,consulta,cerrarPool,idCuenta,idPublicacion;
const sufijo=crypto.randomBytes(5).toString('hex'),usuario='test_'+sufijo+'_react',alias='fan_'+sufijo+'_react';
const password='Prueba-'+crypto.randomBytes(8).toString('hex');
const configurado=['PGHOST','PGDATABASE','PGUSER','PGPASSWORD','SESSION_SECRET'].every(k=>process.env[k]&&!process.env[k].startsWith('CAMBIAR_POR'));
before(async()=>{
  if(!configurado)return;
  ({consulta,cerrarPool}=await import('../src/config/db.js'));
  const {crearCuenta}=await import('../src/services/authService.js');
  const {crearApp}=await import('../src/app.js');
  idCuenta=(await crearCuenta({usuario,alias,password})).id;
  const {app}=crearApp();
  await new Promise(ok=>{servidor=app.listen(0,'127.0.0.1',ok);});
  base='http://127.0.0.1:'+servidor.address().port;
});
after(async()=>{
  if(!cerrarPool)return;
  try {
    if(idCuenta){
      await consulta("DELETE FROM sesiones WHERE sess->>'usuarioId' = $1",[String(idCuenta)]);
      await consulta('DELETE FROM usuarios WHERE id = $1',[idCuenta]);
    }
  } finally {
    if(servidor) await new Promise(ok=>servidor.close(ok));
    await cerrarPool();
  }
});
test('Las seis reacciones nuevas se aceptan por HTTP, persisten y se devuelven en JSON y en el muro',{
  skip:!configurado&&'Sin configuración de base de datos: prueba bloqueada.'
},async()=>{
  let cookie='';
  async function pedir(ruta,datos,json=false){
    const r=await fetch(base+ruta,{method:datos?'POST':'GET',redirect:'manual',
      headers:{cookie,...(datos?{'content-type':'application/x-www-form-urlencoded'}:{}),...(json?{Accept:'application/json'}:{})},
      body:datos?new URLSearchParams(datos):undefined});
    const c=r.headers.get('set-cookie'); if(c)cookie=c.split(';')[0];
    return {estado:r.status,html:await r.text()};
  }
  const entrada=await pedir('/entrar');
  let csrf=/name="_csrf" value="([a-f0-9]+)"/.exec(entrada.html)?.[1]; assert.ok(csrf,'token de entrada');
  assert.equal((await pedir('/entrar',{_csrf:csrf,usuario,password})).estado,302);
  const muro=await pedir('/connect');
  csrf=/name="_csrf" value="([a-f0-9]+)"/.exec(muro.html)?.[1]; assert.ok(csrf,'token de sesión');
  assert.equal((await pedir('/connect/publicaciones',{_csrf:csrf,emocion:'feliz'})).estado,302);
  idPublicacion=(await consulta('SELECT id FROM publicaciones WHERE id_usuario = $1 ORDER BY id DESC LIMIT 1',[idCuenta])).rows[0].id;
  for(const tipo of nuevas){
    const r=await pedir(`/connect/publicaciones/${idPublicacion}/reacciones`,{_csrf:csrf,tipo},true);
    assert.equal(r.estado,200,tipo);
    const estado=JSON.parse(r.html),reaccion=estado.reacciones.find(r=>r.id===tipo);
    assert.equal(reaccion?.total,1,tipo); assert.equal(reaccion?.mias,1,tipo);
  }
  const filas=(await consulta('SELECT tipo FROM reacciones WHERE id_publicacion = $1',[idPublicacion])).rows;
  assert.deepEqual(filas.map(r=>r.tipo).sort(),[...nuevas].sort());
  const final=await pedir('/connect'); assert.equal(final.estado,200);
  for(const tipo of nuevas)assert.ok(final.html.includes(`name="tipo" value="${tipo}"`),tipo);
});
