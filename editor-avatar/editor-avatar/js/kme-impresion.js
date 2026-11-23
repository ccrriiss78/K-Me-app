import { svgAImagen } from './utilidades.js';
import { svgDelAvatar } from './renderizador.js';

export const formatosPhotocard=[{id:'55x85',ancho:55,alto:85},{id:'54x86',ancho:54,alto:86}];
function formatoPhotocard(id){const f=formatosPhotocard.find(x=>x.id===id);if(!f)throw new Error('Tamaño de photocard no disponible');return f;}

// El lienzo de impresión tiene medidas reales; el personaje encaja sin deformarse.
export function svgPhotocard(avatarSvg,formato='55x85'){
  const f=formatoPhotocard(formato),w=f.ancho*10,h=f.alto*10;
  const dibujo=avatarSvg.replace(/<svg\b[^>]*>/,tag=>tag.replace(/\s(?:width|height|x|y|viewBox|preserveAspectRatio)="[^"]*"/g,'').replace('<svg',`<svg x="12" y="12" width="${w-24}" height="${h-24}" viewBox="60 0 280 450" preserveAspectRatio="xMidYMid meet"`));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${f.ancho}mm" height="${f.alto}mm" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" data-formato="${formato}"><rect width="${w}" height="${h}" fill="#fffdf9"/>${dibujo}</svg>`;
}

// PDF local y sin bibliotecas: una imagen a 300 ppp, con su tamaño físico en puntos.
export function crearPdfPhotocard(jpeg,{formato='55x85',hojaA4=false,anchoPx,altoPx}={}){
  const f=formatoPhotocard(formato);
  if(!(jpeg instanceof Uint8Array)||jpeg.length<4||jpeg[0]!==255||jpeg[1]!==216||!Number.isInteger(anchoPx)||!Number.isInteger(altoPx)||anchoPx<1||altoPx<1)throw new Error('Imagen de impresión no válida');
  const pt=mm=>mm*72/25.4,n=v=>Number(v.toFixed(5));
  const pw=pt(hojaA4?210:f.ancho),ph=pt(hojaA4?297:f.alto),w=pt(f.ancho),h=pt(f.alto),x=(pw-w)/2,y=(ph-h)/2;
  let contenido=`q ${n(w)} 0 0 ${n(h)} ${n(x)} ${n(y)} cm /Im0 Do Q\n`;
  if(hojaA4){
    contenido+='% guias-corte\n0.4 w 0 0 0 RG\n';
    const margen=pt(1),largo=pt(3);
    for(const cx of [x,x+w])for(const cy of [y,y+h]){
      const dx=cx===x?-1:1,dy=cy===y?-1:1;
      contenido+=`${n(cx+dx*margen)} ${n(cy)} m ${n(cx+dx*(margen+largo))} ${n(cy)} l S\n`;
      contenido+=`${n(cx)} ${n(cy+dy*margen)} m ${n(cx)} ${n(cy+dy*(margen+largo))} l S\n`;
    }
    contenido+=`BT /F1 10 Tf 36 36 Td (${f.ancho} x ${f.alto} mm | Imprimir al 100% - sin ajustar a pagina.) Tj ET\n`;
  }
  const encoder=new TextEncoder(),partes=[],offsets=[0];let longitud=0;
  const agregar=valor=>{const bytes=typeof valor==='string'?encoder.encode(valor):valor;partes.push(bytes);longitud+=bytes.length;};
  const objeto=(id,contenidoObjeto)=>{offsets[id]=longitud;agregar(`${id} 0 obj\n${contenidoObjeto}\nendobj\n`);};
  agregar('%PDF-1.4\n%KME\n');
  objeto(1,'<< /Type /Catalog /Pages 2 0 R >>');
  objeto(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objeto(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(pw)} ${n(ph)}] /Resources << /XObject << /Im0 4 0 R >> /Font << /F1 6 0 R >> >> /Contents 5 0 R >>`);
  offsets[4]=longitud;agregar(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${anchoPx} /Height ${altoPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);agregar(jpeg);agregar('\nendstream\nendobj\n');
  objeto(5,`<< /Length ${encoder.encode(contenido).length} >>\nstream\n${contenido}endstream`);
  objeto(6,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const inicioXref=longitud;
  agregar('xref\n0 7\n0000000000 65535 f \n');
  for(let i=1;i<=6;i++)agregar(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
  agregar(`trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`);
  const resultado=new Uint8Array(longitud);let pos=0;for(const p of partes){resultado.set(p,pos);pos+=p.length;}return resultado;
}

export function abrirImpresionAvatar(svg,abrir=()=>window.open('','_blank')){
  const ventana=abrir();if(!ventana)throw new Error('Permite la ventana de impresión y vuelve a intentarlo.');
  ventana.addEventListener('load',()=>{ventana.focus();ventana.print();},{once:true});
  ventana.addEventListener('afterprint',()=>ventana.close(),{once:true});
  ventana.document.open();
  ventana.document.write('<!doctype html><html lang="es"><meta charset="utf-8"><title>K-ME · Imprimir avatar</title><style>@page{size:auto;margin:12mm}html,body{margin:0;background:white}svg{display:block;width:100%;height:90vh}</style><body>'+svg+'</body></html>');
  ventana.document.close();
}
async function descargarPhotocardPdf(catalogo,avatar,formato,doc){
  const f=formatoPhotocard(formato),anchoPx=Math.round(f.ancho/25.4*300),altoPx=Math.round(f.alto/25.4*300);
  const svg=svgPhotocard(svgDelAvatar(catalogo,avatar),formato),img=await svgAImagen(svg);
  const canvas=doc.createElement('canvas');canvas.width=anchoPx;canvas.height=altoPx;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('No hay lienzo disponible');ctx.fillStyle='#fffdf9';ctx.fillRect(0,0,anchoPx,altoPx);ctx.drawImage(img,0,0,anchoPx,altoPx);
  const jpeg=Uint8Array.from(atob(canvas.toDataURL('image/jpeg',.98).split(',')[1]),c=>c.charCodeAt(0));
  const archivo=new Blob([crearPdfPhotocard(jpeg,{formato,hojaA4:true,anchoPx,altoPx})],{type:'application/pdf'});
  const url=URL.createObjectURL(archivo),a=doc.createElement('a');a.href=url;a.download='kme-photocard-'+formato+'-A4.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
export function montarImpresion(doc,catalogo,vista,acciones={}){
  const estado=doc.getElementById('estado-impresion'),libre=doc.getElementById('imprimir-avatar');if(!libre)return;
  const imprimir=acciones.imprimir||((c,a)=>abrirImpresionAvatar(svgDelAvatar(c,a,{recorte:'60 0 280 450'})));
  const descargar=acciones.descargar||descargarPhotocardPdf;
  libre.addEventListener('click',()=>{
    try{imprimir(catalogo,vista.estado.avatar);estado.textContent='Elige el papel y la escala en la ventana de impresión.';}
    catch(error){estado.textContent=error.message||'No se pudo abrir la impresión.';}
  });
  let ocupada=false;
  const botones=['imprimir-55x85','imprimir-54x86'].map(id=>doc.getElementById(id));
  async function tarjeta(formato){
    if(ocupada)return;ocupada=true;botones.forEach(b=>b.disabled=true);estado.textContent='Preparando tu photocard…';
    try{await descargar(catalogo,structuredClone(vista.estado.avatar),formato,doc);estado.textContent='PDF A4 preparado · '+formato.replace('x',' × ')+' mm. Imprime al 100 %, sin ajustar a la página.';}
    catch(error){estado.textContent='No se pudo preparar la tarjeta. Inténtalo de nuevo.';console.error(error);}
    finally{ocupada=false;botones.forEach(b=>b.disabled=false);}
  }
  botones[0].addEventListener('click',()=>tarjeta('55x85'));botones[1].addEventListener('click',()=>tarjeta('54x86'));
}
