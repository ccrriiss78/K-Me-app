// Fuente de dibujo: mismas uniones de cintura, siluetas más blandas y compactas.
// No escribe archivos. Permite revisar y regenerar los SVG sin cambiar el catálogo.
const trazo='stroke="#282126" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"';
const svgCuerpo=(titulo,contenido)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480"><title>${titulo}</title>\n${contenido}\n</svg>\n`;
function piernasSuaves(s){
  const l=170-8*s,r=400-l;
  return `<path data-parte="piernas" d="M${l} 351 C${l-4} 367 ${l-5} 389 ${168-2*s} 408 C160 419 177 424 187 414 C190 408 188 397 193 381 C197 376 203 376 207 381 C215 395 210 408 215 415 C226 423 240 416 232 407 C${r+5} 388 ${r+4} 368 ${r} 351 C220 349 181 349 ${l} 351Z" class="f-piel" fill="#fff5ef"/>
<path data-parte="calzado" d="M166 408 C158 410 151 417 153 424 C154 432 184 432 194 425 C198 421 192 414 187 410 C181 406 172 406 166 408Z M215 410 C211 414 205 421 208 426 C216 432 241 432 245 426 C248 421 239 412 232 409 C227 407 220 407 215 410Z" fill="#282126"/>
<path d="M158 425 C167 428 183 429 190 425 M213 426 C222 429 236 429 241 426" fill="none" stroke="#fff" stroke-width="2.7"/>`;
}
function superiorSuave(s,familia){
  const l=163-8*s,r=400-l,sh=162-8*s,o=143-8*s,n=187-2*s,der=400-n;
  const largo=familia==='sudadera'||familia==='chaqueta',fin=largo?337:323;
  // Opción 1 elegida: cápsula corta y robusta, sin separar mano o dedos.
  const rx=12+s*.5,ry=23,k=.55228475;
  const punto=(x,y)=>`${Number((o+10+x*Math.cos(.35)-y*Math.sin(.35)).toFixed(2))} ${Number((341+x*Math.sin(.35)+y*Math.cos(.35)).toFixed(2))}`;
  const brazo=`M${punto(0,-ry)} C${punto(-rx*k,-ry)} ${punto(-rx,-ry*k)} ${punto(-rx,0)} C${punto(-rx,ry*k)} ${punto(-rx*k,ry)} ${punto(0,ry)} C${punto(rx*k,ry)} ${punto(rx,ry*k)} ${punto(rx,0)} C${punto(rx,-ry*k)} ${punto(rx*k,-ry)} ${punto(0,-ry)}Z`;
  const hombro=`M${n} 293 C${n-7} 290 ${sh+10} 291 ${sh} 297 C${sh-9} 301 ${o-3} 313 ${o} ${fin} C${o+3} ${fin+5} ${o+12} ${fin+9} ${o+18} ${fin+7} C${o+21} ${fin+4} ${l+7} 326 ${l+7} 322 C${l+5} 335 ${l-3} 343 ${l} 350 C${l} 355 ${l} 360 ${l} 363 C187 366 213 366 ${r} 363 C${r} 359 ${r} 354 ${r} 350 C${r+3} 341 ${r-6} 334 ${r-7} 322 C${r-5} 326 ${400-o-21} ${fin+4} ${400-o-18} ${fin+7} C${400-o-12} ${fin+9} ${400-o-3} ${fin+5} ${400-o} ${fin} C${400-o+3} 313 ${400-sh+9} 301 ${400-sh} 297 C${400-sh-10} 291 ${der+7} 290 ${der} 293 C210 304 190 304 ${n} 293Z`;
  let detalles=`<path d="M${n-2} 294 C190 309 210 309 ${der+2} 294 M${l+7} 358 C185 362 215 362 ${r-7} 358" fill="none" stroke-width="1.3"/>`;
  if(familia==='sudadera')detalles+=`<path d="M181 292 C184 279 216 279 219 292 C221 302 216 309 211 312 C205 308 195 308 189 312 C184 309 179 302 181 292Z M189 313 C188 320 189 324 190 328 M211 313 C213 320 212 324 211 328 M183 345 C187 339 213 339 217 345 C219 349 219 354 216 356 C207 359 190 358 183 355 C181 353 181 348 183 345Z" fill="none" stroke-width="1.6"/>`;
  else if(familia==='chaqueta')detalles+=`<path d="M186 290 C188 295 193 302 200 307 C192 309 186 313 180 314 C181 306 183 297 186 290Z M214 290 C212 295 207 302 200 307 C208 309 214 313 220 314 C219 306 217 297 214 290Z" fill="#282126"/><path d="M200 309 C198 327 202 341 200 359 M${l+10} 331 C${l+16} 332 ${l+20} 333 ${l+25} 333 M${r-10} 331 C${r-16} 332 ${r-20} 333 ${r-25} 333" fill="none" stroke-width="1.5"/>`;
  else detalles+=`<path d="M200 317 L204 325 L213 327 L207 333 L208 342 L200 338 L192 342 L193 333 L187 327 L196 325Z" fill="#e83475" stroke="none"/>`;
  return `<g ${trazo}><path data-parte="cuello" class="f-piel" d="M${n} 263 C${n+1} 275 ${n-1} 288 ${n-1} 297 C192 308 208 308 ${der+1} 297 C${der+1} 285 ${der-1} 275 ${der} 263 C207 260 193 260 ${n} 263Z" fill="#fff5ef"/>
<path data-parte="brazo-izquierdo" class="f-piel" d="${brazo}" fill="#fff5ef"/>
<path data-parte="brazo-derecho" class="f-piel" transform="translate(400 0) scale(-1 1)" d="${brazo}" fill="#fff5ef"/>
<path data-parte="${familia==='camiseta-integrada'?'camiseta':'prenda-superior'}" d="${hombro}" class="f-arriba" fill="#fffaf7"/>
${detalles}</g>`;
}
function inferiorSuave(s,familia){
  const l=170-8*s,r=400-l;
  let d,detalle;
  if(familia==='cargo'){
    d=`M${l} 350 C190 348 210 348 ${r} 350 C${r+4} 365 ${r+7} 388 ${r-3} 409 C${r-5} 414 ${r-20} 414 ${r-27} 410 C${r-32} 403 210 394 204 379 C203 375 198 375 197 379 C194 392 190 405 ${l+27} 411 C${l+21} 416 ${l+1} 416 ${l-3} 409 C${l-7} 388 ${l-4} 365 ${l} 350Z`;
    detalle=`M${l+3} 377 C${l+8} 378 ${l+14} 378 ${l+18} 377 C${l+17} 382 ${l+17} 388 ${l+15} 391 C${l+10} 392 ${l+6} 391 ${l+2} 389 M${r-3} 377 C${r-8} 378 ${r-14} 378 ${r-18} 377 C${r-17} 382 ${r-17} 388 ${r-15} 391 C${r-10} 392 ${r-6} 391 ${r-2} 389 M${l+1} 405 C${l+9} 408 ${l+17} 408 ${l+23} 406 M${r-23} 406 C${r-17} 408 ${r-9} 408 ${r-1} 405`;
  }else if(familia==='falda'){
    d=`M${l} 350 C190 348 210 348 ${r} 350 C${r+1} 365 ${r+10} 376 ${r+14} 383 C${r+19} 389 235 394 202 394 C176 394 ${l-16} 391 ${l-14} 384 C${l-10} 376 ${l-2} 364 ${l} 350Z`;
    detalle=`M${l+14} 361 C${l+12} 371 ${l+9} 381 ${l+4} 387 M190 363 C189 374 187 384 187 390 M210 363 C212 374 214 384 214 390 M${r-14} 361 C${r-12} 371 ${r-9} 381 ${r-4} 387`;
  }else{
    d=`M${l} 350 C190 348 210 348 ${r} 350 C${r+5} 363 ${r+10} 378 ${r+6} 386 C${r+2} 392 ${r-21} 394 ${r-29} 389 C${r-31} 386 204 381 202 377 C200 374 198 374 196 378 C195 383 190 389 ${l+30} 390 C${l+24} 395 ${l-5} 391 ${l-7} 385 C${l-10} 374 ${l-4} 360 ${l} 350Z`;
    detalle=`M${l-1} 382 C${l+6} 385 ${l+18} 386 ${l+25} 384 M${r-25} 384 C${r-18} 386 ${r-6} 385 ${r+1} 382 M200 360 C199 365 199 369 200 373`;
  }
  return `<g data-capa="piernas" ${trazo}>${piernasSuaves(s)}</g>\n<g data-capa="prenda" ${trazo}><path data-parte="prenda" d="${d}" class="f-abajo" fill="#282126"/><path d="${detalle}" fill="none" stroke="#fff" opacity=".5" stroke-width="1.4"/></g>`;
}
export function cuerposRedibujados(){
  const resultado=[];
  for(const [s,talla]of ['delgado','medio','grueso'].entries()){
    for(const familia of ['camiseta-integrada','camiseta-revisada','sudadera','chaqueta']){
      const nombre=familia==='sudadera'||familia==='chaqueta'?familia+'-revisada':familia;
      resultado.push({ruta:`assets/kme/ropa_arriba/${nombre}-${talla}.svg`,svg:svgCuerpo(`${nombre} · silueta suave · ${talla}`,superiorSuave(s,familia))});
    }
    for(const familia of ['cargo','falda','bermudas'])resultado.push({ruta:`assets/kme/ropa_abajo/${familia}-integrada-${talla}.svg`,svg:svgCuerpo(`${familia} · silueta suave · ${talla}`,inferiorSuave(s,familia))});
    const nombre=['relajado','recto','amplio'][s];
    resultado.push({ruta:`assets/kme/cuerpo/${nombre}.svg`,svg:svgCuerpo(`Base inferior suave · ${talla}`,`<g ${trazo}>${piernasSuaves(s)}</g>`)});
  }
  return resultado;
}
