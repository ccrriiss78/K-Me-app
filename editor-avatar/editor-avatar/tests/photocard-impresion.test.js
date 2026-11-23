import { test } from 'node:test';
import assert from 'node:assert/strict';
let impresion;
try{impresion=await import('../js/kme-impresion.js');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;impresion={formatosPhotocard:[],svgPhotocard:s=>s,crearPdfPhotocard:()=>new Uint8Array()};}
const avatar='<svg viewBox="0 0 400 480" preserveAspectRatio="xMidYMid meet"><path data-avatar="completo"/></svg>';
test('La tarjeta ofrece los dos tamaños aprobados y conserva el personaje completo sin estirarlo',()=>{
  assert.deepEqual(impresion.formatosPhotocard.map(f=>[f.id,f.ancho,f.alto]),[['55x85',55,85],['54x86',54,86]]);
  for(const [formato,w,h]of [['55x85',55,85],['54x86',54,86]]){
    const svg=impresion.svgPhotocard(avatar,formato);
    assert.match(svg,new RegExp('width="'+w+'mm" height="'+h+'mm"'));
    assert.match(svg,new RegExp('viewBox="0 0 '+w*10+' '+h*10+'"'));
    assert.match(svg,/preserveAspectRatio="xMidYMid meet"/);assert.match(svg,/data-avatar="completo"/);
    assert.doesNotMatch(svg,/slice|scale\(/);
  }
});
const jpeg=new Uint8Array([255,216,255,224,0,2,255,217]);
test('El PDF de tarjeta conserva los milímetros elegidos y el PDF A4 centra la tarjeta con guías de corte',()=>{
  for(const f of ['55x85','54x86'])for(const a4 of [false,true]){
    const bytes=impresion.crearPdfPhotocard(jpeg,{formato:f,hojaA4:a4,anchoPx:650,altoPx:1004});
    const pdf=Buffer.from(bytes).toString('latin1');assert.ok(pdf.startsWith('%PDF-1.4'));
    const caja=/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/.exec(pdf);assert.ok(caja);
    const [w,h]=a4?[210,297]:f.split('x').map(Number);
    assert.ok(Math.abs(Number(caja[1])*25.4/72-w)<.001);assert.ok(Math.abs(Number(caja[2])*25.4/72-h)<.001);
    assert.match(pdf,/\/Filter \/DCTDecode/);assert.match(pdf,/\/Width 650 \/Height 1004/);
    if(a4){assert.match(pdf,/Imprimir al 100%/);assert.match(pdf,/% guias-corte/);}
  }
});
test('El PDF mantiene offsets binarios correctos para que los lectores encuentren objetos e imagen',()=>{
  const bytes=impresion.crearPdfPhotocard(jpeg,{formato:'55x85',hojaA4:true,anchoPx:650,altoPx:1004});
  const pdf=Buffer.from(bytes).toString('latin1'),xref=/startxref\n(\d+)\n%%EOF/.exec(pdf);assert.ok(xref);
  assert.equal(pdf.slice(Number(xref[1]),Number(xref[1])+4),'xref');
  const tabla=/xref\n0 7\n([\s\S]*?)trailer/.exec(pdf);assert.ok(tabla);
  tabla[1].trimEnd().split('\n').slice(1).forEach((fila,i)=>assert.ok(pdf.slice(Number(fila.slice(0,10))).startsWith((i+1)+' 0 obj')));
});
test('No se generan descargas con medidas desconocidas ni imágenes vacías',()=>{
  assert.throws(()=>impresion.svgPhotocard(avatar,'inventado'));
  assert.throws(()=>impresion.crearPdfPhotocard(new Uint8Array(),{formato:'55x85',anchoPx:650,altoPx:1004}));
});
