// Propuestas estáticas. No modifica, ejecuta ni importa el servidor de la app.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { EMOCIONES, REACCIONES } from '../../../app/src/catalogos/connect.js';

const destino = new URL('./', import.meta.url);
const app = new URL('../../../app/', import.meta.url);
const fuentes = new Map();
async function leer(ruta) {
  const texto = await readFile(new URL(ruta, app), 'utf8');
  fuentes.set(ruta, createHash('sha256').update(texto).digest('hex'));
  return texto;
}
const vistas = {};
for (const n of ['entrar', 'registro', 'mi-kme', 'connect', '_cabecera', '_pie']) vistas[n] = await leer(`src/views/${n}.ejs`);
await leer('public/css/estilos.css');
await leer('src/catalogos/connect.js');
const logo = await leer('public/img/logo-kme.svg');
const avatar = await readFile(new URL('avatar-real-studio.svg', destino), 'utf8');
const registroAvatar = JSON.parse(await readFile(new URL('MOCKUP_REAL_FUENTES.json', destino), 'utf8'));
if (createHash('sha256').update(avatar).digest('hex') !== registroAvatar.svgAvatarSha256) throw new Error('El avatar no coincide con su fuente');
for (const campo of ['usuario', 'password', 'mantener_sesion', '_csrf']) if (!vistas.entrar.includes(`name="${campo}"`)) throw new Error('Revisar acceso vigente');
for (const campo of ['usuario', 'alias', 'password', 'password_repetida', '_csrf']) if (!vistas.registro.includes(`name="${campo}"`)) throw new Error('Revisar registro vigente');

const emociones = new Map(), reacciones = new Map();
for (const e of EMOCIONES) emociones.set(e.id, await leer('public' + e.icono));
for (const r of REACCIONES) reacciones.set(r.id, await leer('public' + r.icono));
const C = { blanco: '#ffffff', papel: '#f7f3ef', panel: '#fffdf9', negro: '#000000', rosa: '#e83475', lavanda: '#c8b0f0', linea: '#d8cfd1' };
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const texto = (x,y,s,n=20,p=400,c=C.negro,extra='') => `<text x="${x}" y="${y}" font-size="${n}" font-weight="${p}" fill="${c}" ${extra}>${esc(s)}</text>`;
const rect = (x,y,w,h,c=C.panel,b=C.negro,radio=0,g=1.5) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radio}" fill="${c}" stroke="${b}" stroke-width="${g}"/>`;
const en = (s,x,y,w,h) => `<svg x="${x}" y="${y}" width="${w}" height="${h}">${s}</svg>`;
const titulo = (x,y,s,n=54) => texto(x,y,s,n,900,C.negro,'font-family="Impact,Arial,sans-serif"');
const lineas = (x,y,ls,n=16,p=400,paso=23,c=C.negro) => ls.map((s,i)=>texto(x,y+i*paso,s,n,p,c)).join('');
const boton = (x,y,w,s,primario=true,h=54) => rect(x,y,w,h,primario?C.negro:C.panel,C.negro,8) + texto(x+w/2,y+h/2+8,s,20,750,primario?C.panel:C.negro,'text-anchor="middle"');
const rayas = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="${C.rosa}" stroke-width="5" stroke-linecap="round"><path d="M0 18L10 0M14 18L24 0"/></g>`;
const subrayado = (x,y,w) => `<path d="M${x} ${y}Q${x+w*.5} ${y-12} ${x+w} ${y-5}L${x+w-18} ${y+1}Q${x+w*.5} ${y-4} ${x+2} ${y+6}Z" fill="${C.rosa}"/>`;
const pincel = (x,y,w=450,h=440) => `<g transform="translate(${x} ${y}) scale(${w/600} ${h/540})"><path d="M15 382L535 77L519 112L574 86L556 128L585 115L538 160L563 154L484 218L533 193L80 478L92 445L30 470L42 430L8 440L68 391Z" fill="${C.rosa}"/><path d="M30 360L486 96L473 115L54 377ZM115 473L526 225L513 248L137 480Z" fill="${C.rosa}" opacity=".35"/><path d="M26 402L556 107M42 422L533 129M91 450L530 182" stroke="${C.panel}" stroke-width="3" opacity=".35"/></g>`;
const base = (id,nombre,contenido,nota) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 900" role="img" aria-labelledby="titulo-${id}"><title id="titulo-${id}">${esc(nombre)} · propuesta con recursos actuales</title>${rect(0,0,1400,900,C.papel,'none')}<g font-family="Segoe UI,Arial,sans-serif">${texto(34,25,'K-ME · PROPUESTA B+C · '+nombre.toUpperCase(),14,800)}${texto(1366,25,'MAQUETA ESTÁTICA',13,600,C.negro,'text-anchor="end"')}${contenido}${texto(34,879,nota,13)}${texto(1366,879,'Solo propuesta visual · sin cambios en la app',13,400,C.negro,'text-anchor="end"')}</g></svg>`;

// La banda es parte de la cabecera: ocupa todo su alto y es más ancha que el sello.
// Se conserva el logo intacto, sin recolorear ni añadir un segundo marco.
function cabecera(actual) {
  let s = rect(0,40,1400,100,C.negro,'none') + rect(0,40,156,100,C.blanco,'none');
  s += en(logo,48,47,60,86) + texto(182,103,'K-ME',28,850,C.panel);
  for (const [i,n] of ['Mi K-ME','Connect'].entries()) {
    const x=840+i*160;
    s += texto(x,100,n,19,n===actual?800:600,C.panel);
    if(n===actual)s+=rect(x,119,n==='Mi K-ME'?95:84,4,C.rosa,'none');
  }
  s += texto(1180,100,'fan_demo',17,700,C.panel) + rect(1300,70,72,41,C.negro,C.panel,8) + texto(1336,97,'Salir',16,650,C.panel,'text-anchor="middle"');
  return s;
}
function marcaEntrada(x,y,w,h) {
  const centro=x+w/2;
  const inicio=y+(h-480)/2;
  const altoLogo=260,anchoLogo=altoLogo*88.5/126.8;
  const lemaY=inicio+304,anchoLema=190,huecoRayas=12,escalaRayas=.6;
  let s = rect(x,y,w,h,C.panel,'none');
  // La pincelada queda detrás del sello y termina antes del lema y sus rayitas.
  s += pincel(x+4,inicio+5,w-10,242);
  s += `<path d="M${x+18} ${y+66}V${y+22}H${x+98}M${x+w-18} ${y+h-95}V${y+h-30}H${x+w-98}" stroke="#000" stroke-width="7" fill="none"/>`;
  s += `<g data-grupo="marca-centrada" data-eje="${centro}">`;
  s += en(logo,centro-anchoLogo/2,inicio,anchoLogo,altoLogo);
  s += texto(centro,lemaY,'Sin fan no hay idol.',21,750,C.negro,`text-anchor="middle" textLength="${anchoLema}" lengthAdjust="spacingAndGlyphs"`);
  s += rayas(centro-anchoLema/2-huecoRayas-24*escalaRayas,lemaY-15,escalaRayas) + rayas(centro+anchoLema/2+huecoRayas,lemaY-15,escalaRayas);
  s += texto(centro,inicio+394,'Aquí, el fan',45,900,C.negro,'font-family="Impact,Arial,sans-serif" text-anchor="middle"');
  s += texto(centro,inicio+445,'tiene voz.',45,900,C.negro,'font-family="Impact,Arial,sans-serif" text-anchor="middle"');
  s += '</g>';
  return s;
}
const campo = (x,y,w,nombre,ayuda=[]) => texto(x,y,nombre,18,700) + rect(x,y+14,w,53,C.panel,C.negro,8,1.5) + lineas(x,y+91,ayuda,14,400,21);

// Entrar: misma composición aprobada, sin cabecera de navegación.
let entrar = rect(104,118,1192,668,C.panel,C.negro,12,2.5) + marcaEntrada(106,120,426,664);
entrar += `<path d="M548 154V748" stroke="#000" stroke-width="1"/>`;
entrar += texto(918,224,'Entrar en K-ME',38,900,C.negro,'font-family="Impact,Arial,sans-serif" text-anchor="middle"') + subrayado(768,242,300);
entrar += campo(610,299,616,'Usuario') + campo(610,410,616,'Contraseña');
entrar += rect(610,506,21,21,C.panel,C.negro,3) + texto(644,524,'Mantener sesión abierta',17,650);
entrar += lineas(610,561,['Sin marcar, la sesión se cierra tras 24 h sin usar K-ME; marcada,','tras 7 días. No la marques en un ordenador compartido.'],15,400,24);
entrar += boton(610,624,616,'Entrar') + texto(610,723,'¿No tienes cuenta?',17) + texto(760,723,'Crea una.',17,750) + `<path d="M760 729H835" stroke="${C.rosa}" stroke-width="3"/>`;
const svgEntrar = base('entrar','Entrar',entrar,'Logo original y campos actuales · sin datos introducidos.');

// Registro: usuario/alias y contraseña/repetición mantienen las dos columnas.
let registro = rect(60,87,1280,730,C.panel,C.negro,12,2.5) + marcaEntrada(62,89,404,726);
registro += `<path d="M489 123V778" stroke="#000"/>` + texto(899,179,'Crear una cuenta',38,900,C.negro,'font-family="Impact,Arial,sans-serif" text-anchor="middle"') + subrayado(739,197,320);
registro += campo(532,252,348,'Usuario',['Privado: solo sirve para entrar y nadie más lo ve.','De 3 a 30 caracteres: letras, números o _.']);
registro += campo(918,252,348,'Alias',['Público: es el nombre que verán los demás fans.','De 3 a 30 caracteres: letras, números o _.','Tiene que ser distinto de tu usuario.']);
registro += campo(532,461,348,'Contraseña',['De 12 a 128 caracteres. No hace falta mezclar','mayúsculas, números ni símbolos.']);
registro += campo(918,461,348,'Repite la contraseña',['Repite la misma contraseña.']);
registro += boton(532,638,734,'Crear cuenta') + texto(532,741,'¿Ya tienes cuenta?',17) + texto(685,741,'Entra.',17,750) + `<path d="M685 748H739" stroke="${C.rosa}" stroke-width="3"/>`;
const svgRegistro = base('registro','Registro',registro,'Se conserva la separación entre usuario privado y alias público; no se altera el flujo de registro.');

// Mi K-ME: propuesta de integración visual con el avatar real, todavía no guardado por cuenta.
let perfil = cabecera('Mi K-ME') + titulo(55,207,'Mi K-ME',65) + subrayado(57,226,270);
perfil += texto(55,263,'Bienvenida, fan_demo. Este es tu espacio privado.',21);
perfil += pincel(61,302,515,442) + `<path d="M76 352V303H153M527 678V746H449" fill="none" stroke="#000" stroke-width="7"/>` + en(avatar,128,295,360,432);
perfil += rect(662,304,680,434,C.panel,C.negro,0,2.5) + titulo(697,363,'Tu espacio K-ME',43);
perfil += texto(697,423,'Alias',15,650) + texto(697,458,'fan_demo',28,800) + `<path d="M697 480H1307" stroke="${C.linea}"/>`;
perfil += texto(697,518,'Cuenta creada',15,650) + texto(697,548,'22/11/2026, 10:30',20,600);
perfil += boton(697,590,610,'Ir al muro de Connect') + texto(697,691,'Próximamente: Avatar Studio y Sello Studio.',17);
perfil += texto(55,802,'Sin fan no hay idol.',20,750) + rayas(258,785,.65);
const svgPerfil = base('perfil','Mi K-ME',perfil,'Alias y fecha ficticios. El avatar usa piezas existentes; su integración por cuenta es una propuesta.');

// Connect: catálogo y dibujos existentes; se conserva la inicial mientras no haya diseños guardados.
let connect = cabecera('Connect') + titulo(54,205,'Connect',65) + subrayado(57,225,280);
connect += texto(54,258,'El muro de los fans: cuenta cómo te sientes y reacciona a los demás.',20);
connect += texto(55,308,'Lo último de los fans',23,800);
function publicacion(y,alias,emocion,propia) {
  let s=rect(54,y,825,213,C.panel,C.negro,12,1.5);
  s+=rect(76,y+23,78,104,C.panel,C.negro,13,3)+texto(115,y+88,alias[0].toUpperCase(),42,850,C.negro,'text-anchor="middle"')+rayas(88,y+104,.42)+rayas(131,y+104,.42);
  s+=texto(179,y+39,alias,20,800)+texto(850,y+39,'Hace 5 min',13,400,C.negro,'text-anchor="end"');
  const e=EMOCIONES.find(e=>e.id===emocion);
  s+=en(emociones.get(emocion),180,y+54,44,44)+texto(236,y+83,e.texto,21,700);
  REACCIONES.forEach((r,i)=>{
    const x=179+i*74;
    s+=rect(x,y+111,65,39,C.panel,C.negro,19,1.2)+en(reacciones.get(r.id),x+10,y+119,21,21)+texto(x+47,y+137,String([7,4,6,2,1,3,1,2,1][i]),15,700,C.negro,'text-anchor="middle"');
  });
  s+=texto(180,y+183,propia?'Tus reacciones (3)':'Tus reacciones (1)',14,650);
  if(propia)s+=texto(770,y+183,'Borrar',14,650);
  return s;
}
connect += publicacion(331,'fan_demo','emocion',true)+publicacion(569,'fan_luz','gratitud',false);
connect += rect(915,294,430,538,C.panel,C.negro,0,2.5)+titulo(937,337,'¿Cómo te sientes hoy?',30);
EMOCIONES.forEach((e,i)=>{
  const x=937+(i%2)*199,y=356+Math.floor(i/2)*49;
  const seleccion=e.id==='emocion';
  connect+=rect(x,y,187,43,seleccion?C.rosa:C.panel,seleccion?C.negro:C.linea,8,seleccion?2:1)+en(emociones.get(e.id),x+5,y+4,33,33);
  const largo=e.texto.length>19;
  if(largo){const palabras=e.texto.split(' '),medio=Math.ceil(palabras.length/2);connect+=lineas(x+44,y+17,[palabras.slice(0,medio).join(' '),palabras.slice(medio).join(' ')],11,650,14);}
  else connect+=texto(x+44,y+26,e.texto,12,650);
});
connect += lineas(937,725,['Tu publicación llevará tu avatar cuando Avatar Studio','esté listo. Mientras tanto, tu inicial.'],13,400,20) + boton(937,774,386,'Publicar en el muro',true,42);
const svgConnect = base('connect','Connect',connect,'Publicaciones y cifras ficticias · 14 emociones y 9 reacciones reales · retirar reacciones sigue siendo una acción aparte.');

// Detalle pedido por la autora: mostrar el problema y la banda blanca propuesta.
let bandas = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 350" role="img" aria-labelledby="titulo-banda"><title id="titulo-banda">Contraste del sello en cabecera: banda blanca propuesta</title>${rect(0,0,1400,350,C.papel,'none')}<g font-family="Segoe UI,Arial,sans-serif">${texto(32,37,'MISMO SELLO · MÁS CONTRASTE Y AIRE',24,800)}${texto(32,82,'Sobre negro: el contorno exterior se funde',17,650)}${rect(32,98,620,94,C.negro,'none')}${en(logo,65,111,43,64)}${texto(132,154,'K-ME STUDIO',24,800,C.panel)}${texto(732,82,'Propuesta: banda blanca amplia, sin otro marco',17,650)}${rect(732,98,636,94,C.negro,'none')}${rect(732,98,132,94,C.blanco,'none')}${en(logo,777,113,43,64)}${texto(890,154,'K-ME STUDIO',24,800,C.panel)}${lineas(32,250,['El sello original se conserva. La banda ocupa toda la altura de la cabecera y es más ancha que el logo.','Su proporción horizontal y el aire alrededor permiten distinguir el soporte del propio sello.'],20,400,32)}</g></svg>`;

const pantallas = [
  ['KME_ENTRAR_PROPUESTA.svg',svgEntrar,'Entrar','Conservaría el logo grande a la izquierda y el formulario claro a la derecha.'],
  ['KME_REGISTRO_PROPUESTA.svg',svgRegistro,'Registro','Misma identidad; dos columnas y todas las ayudas actuales.'],
  ['KME_MI_KME_PROPUESTA.svg',svgPerfil,'Mi K-ME','Avatar existente como propuesta de integración visual, sin inventar ilustraciones.'],
  ['KME_CONNECT_PROPUESTA.svg',svgConnect,'Connect','Muro a la izquierda y publicar a la derecha; caritas e iconos originales.']
];
for(const [nombre,svg] of pantallas) await writeFile(new URL(nombre,destino),svg,'utf8');
await writeFile(new URL('KME_ENTRAR_AJUSTADA.svg',destino),svgEntrar.replace('viewBox="0 0 1400 900"','viewBox="104 118 1192 668"'),'utf8');
await writeFile(new URL('KME_REGISTRO_AJUSTADO.svg',destino),svgRegistro.replace('viewBox="0 0 1400 900"','viewBox="60 87 1280 730"'),'utf8');
const detalleMarca=base('marca-centrada','Marca centrada',marcaEntrada(100,70,600,760),'Detalle de alineación: logo, lema y frase comparten eje.');
await writeFile(new URL('KME_MARCA_CENTRADA.svg',destino),detalleMarca.replace('viewBox="0 0 1400 900"','viewBox="100 70 600 760"'),'utf8');
await writeFile(new URL('KME_CABECERA_CONTRASTE.svg',destino),bandas,'utf8');
// Cada pantalla tiene sus propios IDs de título; solo Mi K-ME incluye el avatar.
let conjunto=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 3820" role="img" aria-labelledby="titulo-conjunto"><title id="titulo-conjunto">Propuesta coherente de Entrar, Registro, Mi K-ME y Connect</title>${rect(0,0,1400,3820,C.papel,'none')}`;
pantallas.forEach(([,svg,nombre],i)=>{const y=i*950;conjunto+=texto(34,y+42,`${i+1} · ${nombre}`,28,800,C.negro,'font-family="Segoe UI,Arial,sans-serif"')+en(svg,0,y+55,1400,900);});
conjunto+='</svg>';
await writeFile(new URL('KME_APP_IDENTIDAD_CONJUNTA.svg',destino),conjunto,'utf8');
const indice=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>K-ME · Propuesta de identidad de la app</title><style>:root{color:#000;background:#f7f3ef;font:17px/1.5 'Segoe UI',Arial,sans-serif}body{margin:0}main{max-width:1400px;margin:auto;padding:28px}h1{font-size:2rem;margin:0}a{color:#000;text-underline-offset:4px}a:focus-visible{outline:3px solid #000;outline-offset:4px}nav{display:flex;flex-wrap:wrap;gap:22px;margin:18px 0}.aviso{border:1.5px solid #000;padding:15px 20px;background:#fffdf9;border-radius:8px}figure{margin:30px 0 45px}img{display:block;width:100%;height:auto;border:1px solid #000}figcaption{margin-top:8px}h2{margin-bottom:10px}p{max-width:100ch}</style></head><body><main><h1>Una identidad común para K-ME</h1><p class="aviso"><strong>Mockups estáticos con recursos reales.</strong> No se han cambiado las páginas ni el funcionamiento de Claude. Las cuentas y publicaciones mostradas son ficticias. El avatar de Mi K-ME es una propuesta visual de integración, todavía sin guardado por cuenta.</p><nav aria-label="Propuestas"><a href="#banda">Contraste del logo</a>${pantallas.map(([, ,n],i)=>`<a href="#pantalla-${i}">${n}</a>`).join('')}<a href="KME_STUDIO_MOCKUP_REAL.html">Studio de referencia</a></nav><section id="banda"><h2>El sello conserva su silueta sobre blanco</h2><figure><img src="CABECERA_BLANCA_GRANDE.svg" alt="Detalle ampliado del logo original sobre una banda blanca en la cabecera negra."><figcaption>Banda blanca, del mismo blanco que el fondo del logo.</figcaption></figure><figure><img src="KME_CABECERA_CONTRASTE.svg" alt="Comparación del logo directamente sobre negro y sobre una banda blanca más ancha que el sello."><figcaption>Mantener el negro y dar al logo su propio fondo amplio, sin añadirle otro marco.</figcaption></figure></section>${pantallas.map(([f,,n,d],i)=>`<section id="pantalla-${i}"><h2>${i+1}. ${n}</h2><figure><a href="${f}"><img src="${f}" alt="Propuesta visual de ${n} con el mismo lenguaje gráfico y artístico del Studio."></a><figcaption>${d}</figcaption></figure></section>`).join('')}<p>Frase propuesta: «Aquí, el fan tiene voz». Negro, fucsia, papel cálido, misma familia de botones y gestos de pincel. Las páginas de acceso conservan el logo grande sin barra de navegación; dentro de la app la cabecera usa la banda blanca para mantener visible el contorno del sello.</p><p>El aspecto de errores, el foco y los tamaños en móvil se tendrán que validar en una implementación posterior. La maqueta no acredita pruebas de accesibilidad ni de autenticación.</p></main></body></html>`;
await writeFile(new URL('ABRIR_PROPUESTAS_APP.html',destino),indice,'utf8');
await writeFile(new URL('MOCKUPS_APP_FUENTES.json',destino),JSON.stringify({estado:'Propuesta visual estática',avatarSha256:registroAvatar.svgAvatarSha256,fuentes:[...fuentes].map(([ruta,sha256])=>({ruta,sha256})),emociones:EMOCIONES.length,reacciones:REACCIONES.length,cuentas:'Ficticias; sin credenciales',pantallas:pantallas.map(([n])=>n),cabecera:'Logo original sobre banda blanca de altura completa, no recoloreado'},null,2)+'\n','utf8');
console.log(JSON.stringify({pantallas:pantallas.length,emocionesReales:EMOCIONES.length,reaccionesReales:REACCIONES.length,fuentesLeidas:fuentes.size,salidas:[...pantallas.map(([n])=>n),'KME_CABECERA_CONTRASTE.svg','KME_APP_IDENTIDAD_CONJUNTA.svg','ABRIR_PROPUESTAS_APP.html','MOCKUPS_APP_FUENTES.json'],appModificada:false},null,2));
