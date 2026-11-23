// Genera vistas estáticas portátiles con datos ficticios. Sin servidor, red, cuentas ni guardado.
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { COLORES, MOTIVOS, ENCUADRES, DISENO_INICIAL } from '../../../app/src/catalogos/sello.js';
import { PALABRAS_HANGUL, GRUPOS_HANGUL } from '../../../app/src/catalogos/hangul.js';
import { prepararDibujo } from '../../../app/src/services/selloDibujo.js';
const app=new URL('../../../app/',import.meta.url),destino=new URL('../propuestas-sello/',import.meta.url);
const require=createRequire(new URL('package.json',app)),ejs=require('ejs');
let css=(await Promise.all(['estilos','identidad'].map(n=>readFile(new URL('public/css/'+n+'.css',app),'utf8')))).join('\n');
for (const m of [...css.matchAll(/url\(['"]?(\/img\/[^)'"\s]+\.svg)['"]?\)/g)]) {
 const bytes=await readFile(new URL('public'+m[1],app));
 css=css.replaceAll(m[0],'url("data:image/svg+xml;base64,'+bytes.toString('base64')+'")');
}
const render=(nombre,datos)=>ejs.renderFile(fileURLToPath(new URL('src/views/'+nombre+'.ejs',app)),datos);
const comunes={titulo:'Sello Studio · vista estática',aliasSesion:'fan_demo',rutaActual:'/studio/sellos',csrfToken:'ficticio-sin-validez'};
const valores={nombre:'Mi sello',palabra:'amistad',color_palabra:'negro',avatar:'',encuadre:'rostro',mostrar_alias:true,color_alias:'negro',borde:'negro',fondo:'blanco',motivos:[{id:'corazon',color:'fucsia'},{id:'',color:'negro'},{id:'',color:'negro'}]};
const gruposPalabras=GRUPOS_HANGUL.map(g=>({...g,palabras:PALABRAS_HANGUL.filter(p=>p.grupo===g.id)}));
const paginas=[
 ['KME_SELLO_EDITOR_REVISION.html','sello-editor',{accion:'/studio/sellos',idSello:null,version:null,valores,dibujo:prepararDibujo(DISENO_INICIAL,{alias:'fan_demo'}),avisos:[],ayudaPalabra:PALABRAS_HANGUL.find(p=>p.id==='amistad'),error:null,conflicto:false,guardado:false,gruposPalabras,colores:COLORES,motivos:MOTIVOS,encuadres:ENCUADRES,avatares:[],tieneCopiaAvatar:false}],
 ...[['KME_MIS_SELLOS_REVISION.html',true],['KME_SELLOS_VACIO_REVISION.html',false]].map(([archivo,conSellos])=>[archivo,'sellos',{sellos:conSellos?['Mi amistad','Luz de escenario','Mi rincón fan'].map((nombre,i)=>({id:i+1,nombre,dibujo:prepararDibujo({...DISENO_INICIAL,fondo:['blanco','lavanda','rosa-pastel'][i]},{alias:'fan_demo'})})):[],maximo:20,eliminado:false,error:null}])
];
for(const [archivo,vista,datos]of paginas){
 let html=await render(vista,{...comunes,...datos});
 html=html.replace('<link rel="stylesheet" href="/css/estilos.css">','<style>'+css+'</style>')
   .replace('<link rel="stylesheet" href="/css/identidad.css">','')
   .replace(/<script src="\/js\/sello(?:-paneles)?\.js" defer><\/script>/g,'')
   .replace(/<link rel="icon"[^>]*>/,'')
   .replaceAll('type="submit"','type="button"')
   .replace('<body>','<body><p style="margin:0;padding:10px;background:#fff;color:#000;text-align:center;font:14px sans-serif">VISTA ESTÁTICA · datos ficticios · los cambios no se guardan</p>');
 for(const m of [...html.matchAll(/src="(\/img\/[^"]+)"/g)]){
   const s=await readFile(new URL('public'+m[1],app));
   html=html.replaceAll(m[0],'src="data:image/svg+xml;base64,'+s.toString('base64')+'"');
 }
 html=html.replaceAll('href="/studio/sellos/nuevo"','href="KME_SELLO_EDITOR_REVISION.html"').replaceAll('href="/studio/sellos"','href="KME_MIS_SELLOS_REVISION.html"');
 await writeFile(new URL(archivo,destino),html.replace(/[ \t]+$/gm,''),'utf8');
 console.log(archivo);
}

