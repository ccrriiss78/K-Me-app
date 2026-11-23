import { tono } from './utilidades.js';

export const estilosMechonesKme=[['sin','Sin mechones'],['frontales','Frontales'],['varios','Varios tonos'],['capas','Entre capas']];
export function coloresMechonesKme(catalogo){
  return [...new Set([...catalogo.paleta('pelo'),...catalogo.paleta('arriba'),...(catalogo.datos.gruposPaleta?.ojos?.fantasia||[])])];
}
// Guías de crecimiento: desde la raya hacia sienes/puntas; atrás bajan
// siguiendo el cabello largo. Se recortan SIEMPRE por el dibujo real.
function guiasPinceladas(capa){
  return capa==='pelo_frente'?
    [[[199,79],[169,91],[166,129],[112,157]],[[210,81],[239,94],[247,134],[292,165]],[[187,77],[147,75],[114,98],[98,144]],[[219,78],[263,80],[291,105],[302,151]],[[198,83],[185,107],[182,127],[153,144]],[[212,83],[223,108],[236,130],[263,146]]]:
    [[[192,67],[150,46],[92,86],[94,184]],[[212,66],[258,49],[308,96],[306,189]],[[103,149],[76,186],[102,242],[87,307]],[[295,148],[321,191],[295,250],[282,328]]];
}
function puntoPincelada(p,t,desplazamiento=0){
  const u=1-t,[a,b,c,d]=p;
  const x=u**3*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t**3*d[0],y=u**3*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t**3*d[1];
  const dx=3*u*u*(b[0]-a[0])+6*u*t*(c[0]-b[0])+3*t*t*(d[0]-c[0]);
  const dy=3*u*u*(b[1]-a[1])+6*u*t*(c[1]-b[1])+3*t*t*(d[1]-c[1]),l=Math.hypot(dx,dy)||1;
  return [x-dy/l*desplazamiento,y+dx/l*desplazamiento];
}
function parPincelada(p){return p.map(n=>Number(n.toFixed(2))).join(' ');}
function cintaPincelada(guia,ancho,desplazamiento=0){
  const lados=[[],[]];
  for(let i=0;i<=28;i++){
    const t=i/28,radio=ancho*.5*(.08+.92*Math.sin(Math.PI*t)**.65)*(1+.045*Math.sin(i*2.7));
    lados[0].push(puntoPincelada(guia,t,desplazamiento-radio));lados[1].push(puntoPincelada(guia,t,desplazamiento+radio));
  }
  return 'M'+lados[0].concat(lados[1].reverse()).map(parPincelada).join('L')+'Z';
}
function fibrasPincelada(guia,color,ancho){
  let dibujo='';
  for(let j=0;j<7;j++){
    let d='';const ini=.12+(j%3)*.05,fin=.91-(j%2)*.12,offset=(j-3)*ancho/9;
    for(let i=0;i<=16;i++){const t=ini+(fin-ini)*i/16;d+=(i===0||i===9?'M':'L')+parPincelada(puntoPincelada(guia,t,offset));}
    dibujo+=`<path d="${d}" fill="none" stroke="${tono(color,j%2?.28:-.32)}" stroke-width="${j%2?.55:.8}" stroke-opacity=".24" stroke-linecap="round"/>`;
  }return dibujo;
}
function degradadoPincelada(id,guia,color){
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${guia[0][0]}" y1="${guia[0][1]}" x2="${guia[3][0]}" y2="${guia[3][1]}"><stop stop-color="${tono(color,-.12)}" stop-opacity=".1"/><stop offset=".22" stop-color="${tono(color,.18)}"/><stop offset=".58" stop-color="${tono(color,.06)}"/><stop offset=".86" stop-color="${tono(color,-.13)}"/><stop offset="1" stop-color="${color}" stop-opacity=".05"/></linearGradient>`;
}
function recortarSobreCabello(svg,prefijo,pintura,definiciones){
  let indice=0;
  // Insertar justo después de cada superficie mantiene lazos, orejas y otros
  // detalles delante, y respeta los transforms propios de cada pieza.
  const resultado=svg.replace(/<path\b[^>]*class="f-pelo(?:-trasero|-oscuro)?"[^>]*\/>/g,tag=>{
    const d=tag.match(/\bd="([^"]+)"/)?.[1],transform=tag.match(/\btransform="([^"]+)"/)?.[1];if(!d)return tag;
    const clip=`${prefijo}-recorte-${indice++}`;
    return tag+`<defs><clipPath id="${clip}" clipPathUnits="userSpaceOnUse"><path d="${d}"${transform?` transform="${transform}"`:''} fill="#fff" stroke="none"/></clipPath></defs><g clip-path="url(#${clip})">${pintura}</g>`;
  });
  return `<defs>${definiciones}</defs>`+resultado;
}
export function aplicarPinceladasCabello(svg,acabado,color,capa,prefijo){
  if(acabado!=='pinceladas'||!svg)return svg;
  const guias=guiasPinceladas(capa);let pintura='',defs='';
  guias.forEach((guia,i)=>{
    const id=`${prefijo}-veladura-${i}`,ancho=i<2?32:21;
    defs+=degradadoPincelada(id,guia,i%2?tono(color,-.1):tono(color,.08));
    pintura+=`<g data-pincelada="${i+1}" opacity=".38"><path d="${cintaPincelada(guia,ancho)}" fill="url(#${id})" stroke="none"/>${fibrasPincelada(guia,color,ancho)}</g>`;
  });
  const mate=svg.replace(/<path\b(?=[^>]*fill="none")(?=[^>]*stroke="#(?:fff|ffffff|fffaf7)")[^>]*\/>/gi,'');
  return `<g data-acabado="pinceladas-b">${recortarSobreCabello(mate,prefijo,pintura,defs)}</g>`;
}
export function aplicarMechonesCabello(svg,pelo,capa,prefijo,coloresPermitidos){
  if(!svg||!['frontales','varios','capas'].includes(pelo.mechones))return svg;
  const f=guiasPinceladas('pelo_frente'),b=guiasPinceladas('pelo_atras');
  let opciones;
  if(pelo.mechones==='capas'){
    opciones=capa==='pelo_frente'?[[1,[[145,133],[133,144],[122,151],[108,166]],24],[2,[[260,135],[274,145],[287,151],[298,166]],24],[3,[[167,127],[159,139],[146,148],[134,156]],18]]:[[3,b[2],30],[2,b[3],24]];
  }else if(capa==='pelo_frente')opciones=pelo.mechones==='frontales'?[[1,f[0],38],[2,f[1],38]]:[[1,f[0],38],[2,f[2],40],[3,f[1],38]];
  else opciones=pelo.mechones==='varios'?[[2,b[2],30],[3,b[3],30]]:[];
  if(!opciones.length)return svg;
  let pintura='',defs='';
  for(const [i,guia,ancho] of opciones){
    const color=pelo['mechon'+i];if(!coloresPermitidos.includes(color))continue;
    const id=`${prefijo}-color-${i}`;defs+=degradadoPincelada(id,guia,color);
    pintura+=`<g data-mechon="${i}" data-color="${color}"><path d="${cintaPincelada(guia,ancho)}" fill="url(#${id})" stroke="none"/>${fibrasPincelada(guia,color,ancho)}</g>`;
  }
  return recortarSobreCabello(svg,'mechon-'+prefijo,pintura,defs);
}
