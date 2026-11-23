// Reconstruye únicamente la colección adicional aprobada a partir de la lámina.
// No altera las piezas anteriores ni las paletas.
import { readFile, writeFile } from 'node:fs/promises';
import { ajustarBajoPrendaKme } from '../js/kme-ajuste-ropa.js';
const raiz=new URL('../',import.meta.url),url=new URL('datos/kme.json',raiz);
const datos=JSON.parse(await readFile(url,'utf8'));
const modelos=[['cargo-beat','Cargo Beat'],['denim-layer','Denim Layer'],['school-remix','School Remix'],['racing-pop','Racing Pop'],['pocket-pop','Pocket Pop'],['ribbon-punk','Ribbon Punk'],['denim-star','Denim Star'],['stage-noir','Stage Noir']];
const topsNuevos=[['top-orbita','Órbita · un hombro'],['top-halter','Halter de escenario'],['top-deportivo','Top deportivo'],['top-cruzado','Top cruzado'],['top-holgado','Camiseta corta holgada']];
const esTop=id=>['pocket-pop','denim-star',...topsNuevos.map(([id])=>id)].includes(id);
const tallas=[['delgado','relajado',.88],['medio','recto',1],['grueso','amplio',1.15]];
const trazo='stroke="#282126" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"';
const path=(d,clase='',fill='none',extra='')=>`<path d="${d}"${clase?` class="${clase}"`:''} fill="${fill}" ${extra}/>`;
const linea=d=>path(d,'','none','stroke-width="1.1"');
const blanco=(d)=>path(d,'','#fffaf7');
const negro=(d)=>path(d,'','#282126');
const metal=(x,y,w=9,h=6)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1" fill="none" stroke="#fffaf7" stroke-width="1.5"/>`;
const estrella=(x,y,r=7,clase='')=>path(`M${x} ${y-r} L${x+2} ${y-2} L${x+r} ${y-2} L${x+4} ${y+2} L${x+5} ${y+r} L${x} ${y+4} L${x-5} ${y+r} L${x-4} ${y+2} L${x-r} ${y-2} L${x-2} ${y-2}Z`,clase,'#fffaf7','stroke-width="1"');
const pliegues=linea('M173 366 C170 378 165 390 161 399 M187 366 C187 380 184 395 183 405 M210 366 C211 381 214 396 215 405 M225 365 C228 378 234 392 241 400');
const bolsillo=(x,y)=>path(`M${x} ${y} L${x+17} ${y} L${x+16} ${y+16} Q${x+8} ${y+20} ${x} ${y+15}Z`,'f-abajo-oscuro','#555','stroke-width="1.4"')+linea(`M${x} ${y+4} L${x+17} ${y+4}`)+`<circle cx="${x+9}" cy="${y+7}" r="1.2" fill="#fffaf7" stroke="none"/>`;
const chapa=path('M222 307 L232 307 L227 317 L217 317Z','','#e83475','stroke="none"');
const torso=()=>`M184 292 C177 291 167 294 160 298 C154 301 145 311 141 319 C140 324 148 330 157 332 C160 331 165 326 167 321 C166 334 162 342 162 350 C181 350 219 350 238 350 C238 342 234 334 233 321 C235 326 240 331 243 332 C252 330 260 324 259 319 C255 311 246 301 240 298 C233 294 223 291 216 292 C211 302 189 302 184 292Z`;
// Los tops dejan ver el torso y brazos propios, sin imponer el tono de piel.
const topTirantes=(asim=false)=>`M178 293 C174 292 166 294 163 299 C163 308 166 314 165 322 C163 327 160 331 159 334 C180 338 220 338 241 ${asim?325:334} C240 329 237 326 235 322 C234 312 237 304 237 299 C230 294 221 293 217 293 C211 310 189 310 178 293Z`;
// Torso común bajo la ropa: une los hombros con la cadera sin depender de
// que la prenda tenga mangas o de cuánto abdomen deje visible.
const pielTorso='<path data-parte="torso" class="f-piel" d="M184 290 C178 290 168 293 159 300 C156 305 157 315 161 324 C163 330 162 334 162 340 C162 351 162 365 162 375 C187 375 213 375 238 375 C238 365 238 351 238 340 C238 334 237 330 239 324 C243 315 244 305 241 300 C232 293 222 290 216 290 C211 300 189 300 184 290Z" fill="#fff5ef"/>';
// Un único contorno visible desde el cuello hasta manos y cintura.
// Las marcas anatómicas antiguas se conservan en el SVG como compatibilidad,
// pero el renderizador sustituye sus contornos por este perfil continuo.
const perfilSuperior='<path data-perfil="superior-unico" class="f-piel" d="M185 263 C186 275 185 284 184 291 C173 291 161 295 154 302 C147 313 140 327 137 339 C133 349 136 355 142 356 C149 358 155 350 159 339 C162 331 165 325 167 321 C167 333 162 341 162 350 C162 361 162 368 162 375 C187 375 213 375 238 375 C238 368 238 361 238 350 C238 341 233 333 233 321 C235 325 238 331 241 339 C245 350 251 358 258 356 C264 355 267 349 263 339 C260 327 253 313 246 302 C239 295 227 291 216 291 C215 284 214 275 215 263 C207 260 193 260 185 263Z" fill="#fff5ef"/>';
function brazoUnido(lado){
  // Elipse inclinada convexa: conserva el brazo cilíndrico sin dedos y
  // llega hasta el hombro, en lugar de empezar por debajo de la sisa.
  const k=.55228475,ang=20*Math.PI/180;
  const punto=(x,y)=>[151+x*Math.cos(ang)-y*Math.sin(ang),326+x*Math.sin(ang)+y*Math.cos(ang)];
  const pares=[[0,-30],[11*k,-30],[11,-30*k],[11,0],[11,30*k],[11*k,30],[0,30],[-11*k,30],[-11,30*k],[-11,0],[-11,-30*k],[-11*k,-30],[0,-30]].map(p=>punto(...p).map(n=>Number(n.toFixed(2))).join(' '));
  const d=`M${pares[0]} C${pares.slice(1,4).join(' ')} C${pares.slice(4,7).join(' ')} C${pares.slice(7,10).join(' ')} C${pares.slice(10,13).join(' ')}Z`;
  return `<path data-parte="brazo-${lado}" class="f-piel" ${lado==='derecho'?'transform="translate(400 0) scale(-1 1)" ':''}d="${d}" fill="#fff5ef"/>`;
}
function superior(id,base){
  const cuello=base.match(/<path data-parte="cuello"[^>]+\/>/)[0];
  const brazos=brazoUnido('izquierdo')+brazoUnido('derecho');
  const corto=esTop(id);
  const abdomen=corto?'<path data-parte="abdomen" class="f-piel" d="M162 317 C182 313 218 313 238 317 C238 338 238 357 238 375 C216 375 184 375 162 375 C162 357 162 338 162 317Z" fill="#fff5ef"/>':'';
  // El bajo largo solapa también las cinturas bajas al combinar colecciones.
  let d=torso(),detalle='';
  if(id==='cargo-beat')detalle=path('M164 297 L185 294 L194 313 L191 366 L155 366 L162 327Z M215 294 L236 297 L238 327 L245 366 L209 366 L206 313Z','','#282126')+path('M166 312 H183 V325 H164Z M217 312 H234 V325 H217Z M163 339 H184 V355 H160Z M216 339 H237 L240 355 H216Z','','#454147','stroke-width="1.3"')+linea('M167 316 H181 M220 316 H232')+metal(174,345,6,5)+metal(220,345,6,5)+chapa;
  if(id==='denim-layer')detalle=blanco('M185 294 L200 311 L215 294 L212 366 L188 366Z')+path('M178 296 L186 293 L197 309 L185 320Z M222 296 L214 293 L203 309 L215 320Z','f-arriba-claro','#eee')+linea('M175 323 L175 360 M225 323 L225 360 M156 355 L184 358 M216 358 L244 355 M151 311 L145 322 M249 311 L255 322')+path('M161 317 H179 V333 H161Z M221 317 H239 V333 H221Z','f-arriba-oscuro','#555','stroke-width="1.1"')+chapa;
  if(id==='school-remix')detalle=blanco('M182 293 L200 308 L187 320 L177 298Z M218 293 L200 308 L213 320 L223 298Z')+negro('M197 309 L203 309 L205 315 L202 320 L207 350 L200 358 L193 350 L198 320 L195 315Z')+linea('M200 358 V366 M164 313 L158 329 M236 313 L242 329')+chapa;
  if(id==='racing-pop')detalle=negro('M182 294 L200 309 L218 294 L218 367 L182 367Z')+blanco('M154 300 L165 296 L183 320 L180 328Z M246 300 L235 296 L217 320 L220 328Z M140 315 L149 308 L164 334 L154 337Z M260 315 L251 308 L236 334 L246 337Z')+linea('M200 307 V367')+metal(196,335,8,8)+chapa;
  if(id==='pocket-pop'){d=topTirantes();detalle=blanco('M164 312 L236 318 L235 326 L164 320Z')+linea('M163 330 Q200 336 239 330')+chapa;}
  if(id==='ribbon-punk')detalle=blanco('M181 293 L200 303 L219 293 L215 364 L185 364Z')+negro('M162 298 L181 294 L189 317 L183 344 L154 349 L161 323 L144 334 L133 322Z M238 298 L219 294 L211 317 L217 344 L246 349 L239 323 L256 334 L267 322Z')+path('M199 306 Q183 296 183 309 Q182 319 198 311 L191 330 L200 323 L209 330 L202 311 Q217 319 217 308 Q217 296 201 306Z','f-arriba','#e83475','stroke-width="1.3"')+metal(163,334,10,6)+metal(227,334,10,6);
  if(id==='denim-star'){d=topTirantes(true);detalle=negro('M163 302 L173 293 L235 320 L239 326 L226 334 L163 316Z')+linea('M163 330 Q189 338 211 332')+estrella(222,317,5);}
  if(id==='stage-noir'){
    // La chaqueta usa el contorno común. Solo las solapas se dibujan dentro:
    // no se superpone una segunda chaqueta con otras mangas y hombros.
    detalle=blanco('M186 295 L200 306 L214 295 L212 374 L188 374Z')
      +negro('M198 307 L202 307 L204 313 L201 318 L205 350 L200 356 L195 350 L199 318 L196 313Z')
      +'<path data-parte="solapa" d="M182 297 L196 309 L187 322 L177 306Z" class="f-arriba-claro" fill="#fffaf7" stroke-width="1.3"/>'
      +'<path data-parte="solapa" d="M218 297 L204 309 L213 322 L223 306Z" class="f-arriba-claro" fill="#fffaf7" stroke-width="1.3"/>'
      +linea('M185 323 L182 346 L181 374 M215 323 L218 346 L219 374 M169 348 L179 348 M221 348 L231 348 M157 311 L150 321 M243 311 L250 321')+chapa;
  }
  if(id==='top-orbita'){
    d='M164 315 C173 309 180 302 184 292 C187 291 191 292 193 294 C202 308 220 314 237 316 C238 321 238 327 237 332 C217 339 184 338 163 334 C162 328 163 321 164 315Z';
    detalle=linea('M169 318 Q200 333 233 322')+estrella(220,321,5);
  }
  if(id==='top-halter'){
    d='M190 292 C196 297 204 297 210 292 C214 298 218 305 222 310 C224 318 231 325 237 330 C238 332 238 334 238 336 C213 340 187 340 162 336 C162 334 162 332 163 330 C169 325 176 318 178 310 C182 304 186 298 190 292Z';
    detalle=linea('M189 300 Q200 306 211 300 M178 321 Q200 333 222 321')+metal(196,307,8,5);
  }
  if(id==='top-deportivo'){
    d='M177 294 C179 293 183 293 185 294 C188 310 212 310 215 294 C217 293 221 293 223 294 C221 311 229 322 237 326 C238 329 238 333 238 336 C213 340 187 340 162 336 C162 333 162 329 163 326 C171 322 179 311 177 294Z';
    detalle=negro('M163 330 Q200 336 237 330 L238 336 Q200 341 162 336Z')+estrella(200,319,6);
  }
  if(id==='top-cruzado'){
    d='M178 294 C181 293 184 292 187 293 C192 297 196 303 200 308 C204 303 208 297 213 293 C216 292 219 293 222 294 C223 310 229 322 237 328 C238 330 238 334 238 336 C213 339 187 339 162 336 C162 334 162 330 163 328 C171 322 177 310 178 294Z';
    detalle=path('M186 296 L224 326 L236 328 L237 334 Q213 337 195 336 L171 315Z','f-arriba-claro','#fffaf7','stroke-width="1.1"')+linea('M177 329 L216 312')+path('M218 330 Q225 320 229 327 Q232 334 219 333 L231 341 M219 332 L211 339','','none','stroke-width="1.2"');
  }
  if(id==='top-holgado'){
    d=ajustarBajoPrendaKme(`<path d="${torso()}"/>`,336).match(/d="([^"]+)"/)[1];
    detalle=linea('M184 296 Q200 311 216 296 M172 331 Q200 335 228 331 M157 311 L151 321 M243 311 L249 321')+chapa;
  }
  if(!corto)detalle=ajustarBajoPrendaKme(detalle,350,374);
  return cuello+brazos+abdomen+`<path data-parte="prenda-superior" d="${d}" class="f-arriba" fill="#fffaf7"/><defs><clipPath id="__KME_PRENDA__"><path d="${d}"/></clipPath></defs><g clip-path="url(#__KME_PRENDA__)">${detalle}</g>`;
}
const pantalon=y=>`M162 ${y} C190 ${y} 210 ${y} 238 ${y} C238 ${y+12} 248 388 240 412 C234 418 215 417 208 412 C206 403 210 394 204 379 C203 375 198 375 197 379 C194 392 193 405 191 413 C181 419 160 418 153 412 C153 390 162 ${y+12} 162 ${y}Z`;
const baggy=y=>`M162 ${y} C187 ${y} 213 ${y} 238 ${y} C238 ${y+12} 245 390 248 412 C239 418 217 419 207 414 C205 403 210 391 204 378 C202 374 198 374 196 378 C191 393 196 403 191 414 C178 419 157 418 149 413 C153 390 162 ${y+12} 162 ${y}Z`;
const falda=y=>`M162 ${y} C187 ${y} 213 ${y} 238 ${y} C238 ${y+10} 249 376 253 385 C257 393 230 397 201 397 C173 397 144 393 147 385 C152 375 162 ${y+10} 162 ${y}Z`;
function inferior(id,piernas){
  const bajo=['pocket-pop','denim-star'].includes(id),y=bajo?370:350;
  // Medio píxel de solape bajo la costura evita rendijas de antialiasing;
  // el ancho y la línea visible de la cinturilla siguen siendo los comunes.
  let d=(['denim-layer','school-remix','denim-star','racing-pop'].includes(id)?baggy:pantalon)(y-.5),detalle='';
  if(['ribbon-punk','stage-noir'].includes(id))d=falda(y-.5);
  if(id==='cargo-beat'||id==='pocket-pop')detalle=bolsillo(151,380)+bolsillo(231,380)+linea('M170 362 L164 375 M230 362 L236 375 M160 407 L184 409 M216 409 L241 407')+path('M174 373 L178 373 L176 396 L172 396Z M222 373 L226 373 L228 396 L224 396Z','','#282126','stroke-width="1"');
  if(id==='denim-layer')detalle=linea('M165 360 Q180 378 191 362 M209 362 Q220 378 235 360 M200 357 L200 375 M173 380 L164 410 M227 380 L239 410')+path('M156 408 Q174 412 192 408 M207 408 Q226 413 245 408','','none','stroke="#fffaf7" stroke-width="1.5"')+path('M172 361 Q197 389 229 361','','none','stroke="#fffaf7" stroke-width="1.3"');
  if(id==='school-remix')detalle=pliegues+path('M155 358 L171 359 L168 393 L148 390Z','f-arriba','#e83475','stroke-width="1"')+path('M153 367 L169 369 M150 379 L169 381 M160 359 L157 392','','none','stroke="#fffaf7" stroke-width="1"');
  if(id==='racing-pop')detalle=path('M163 361 C159 380 158 395 158 409 M170 362 C166 382 166 397 167 411 M237 361 C241 380 242 395 242 409 M230 362 C234 382 234 397 233 411','','none','stroke="#fffaf7" stroke-width="2.7"')+linea('M194 358 L191 372 M206 358 L209 372');
  if(id==='ribbon-punk')detalle=pliegues+path('M158 365 L246 365 M153 376 L250 376 M150 386 L250 386 M174 354 L165 393 M193 353 L190 396 M212 353 L216 395 M231 354 L241 392','','none','stroke="#fffaf7" stroke-width="1.4" opacity=".65"');
  if(id==='denim-star')detalle=linea('M164 379 Q179 391 191 376 M209 376 Q222 391 237 379 M200 376 L200 389 M170 391 L159 410 M230 391 L241 410')+estrella(200,374,7)+estrella(223,392,7)+path('M171 376 Q187 398 211 378','','none','stroke="#fffaf7" stroke-width="1.2"');
  if(id==='stage-noir')detalle=pliegues+path('M163 355 L241 361 L240 368 L160 363Z M163 369 L247 379 L248 385 L158 376Z','','#282126')+metal(225,360,10,7)+metal(229,377,10,6);
  const calzadoExtra=id==='ribbon-punk'?path('M162 399 Q176 395 188 399 L189 418 Q175 423 158 418Z M212 399 Q225 395 238 399 L242 418 Q225 423 211 418Z','','#fffaf7')+linea('M161 405 Q175 410 188 405 M159 413 Q176 417 188 413 M213 405 Q226 410 240 405 M212 413 Q227 418 241 413'):id==='stage-noir'?negro('M162 397 L188 397 L189 420 L159 420Z M212 397 L238 397 L241 420 L211 420Z')+metal(166,402,10,6)+metal(221,402,10,6):'';
  const piernasConCalzado=piernas.replace('</g>',calzadoExtra+'</g>');
  const cintura=negro(`M162 ${y} C185 ${y} 215 ${y} 238 ${y} L238 ${y+6} C215 ${y+6} 185 ${y+6} 162 ${y+6}Z`)+metal(194,y,12,6);
  return piernasConCalzado+`<g data-capa="prenda" ${trazo}><path data-parte="prenda" d="${d}" class="f-abajo" fill="#6e737b"/>${detalle}${cintura}</g>`;
}
function svg(titulo,contenido,escala=1){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480"><title>${titulo}</title><g transform="translate(200 0) scale(${escala} 1) translate(-200 0)" ${trazo}>${contenido}</g></svg>\n`;}
// En la cintura se usan las mismas medidas de las prendas anteriores:
// semiancho 30/38/46, en vez de escalar todo el cuerpo a ojo.
// Se conserva el ancho de hombros y calzado; la transición es progresiva.
function adaptarCinturaSvg(svg,escala){
  const objetivo=escala===.88?30/38:escala===1.15?46/38:1;
  const factor=y=>{const peso=y<=330?0:y<344?(y-330)/14:y<=378?1:y<408?(408-y)/30:0;return escala+(objetivo-escala)*peso;};
  const red=n=>Number(n.toFixed(3));
  return svg.replace(/<(path|rect|circle)\b[^>]*\/?\s*>/g,(tag,tipo)=>{
    const fijo=/data-parte="(?:brazo-[^"]+|cuello)"/.test(tag),f=y=>fijo?escala:factor(y),x=(v,y)=>red(200+(v-200)*f(y));
    if(tipo==='path')return tag.replace(/\bd="([^"]+)"/,(_,d)=>{
      const t=d.match(/[MLCQHVZ]|-?\d*\.?\d+/g);let i=0,px=0,py=0,sx=0,sy=0,salida='';
      while(i<t.length){const cmd=t[i++],n=()=>Number(t[i++]);
        if(cmd==='Z'){salida+='Z';px=sx;py=sy;continue;}
        if(cmd==='H'){px=n();salida+=`L${x(px,py)} ${py} `;continue;}
        if(cmd==='V'){py=n();salida+=`L${x(px,py)} ${py} `;continue;}
        const pares=cmd==='C'?3:cmd==='Q'?2:1;salida+=cmd;
        for(let k=0;k<pares;k++){px=n();py=n();salida+=`${x(px,py)} ${py} `;}
        if(cmd==='M'){sx=px;sy=py;}
      }return `d="${salida.trim()}"`;
    });
    const valor=k=>Number(tag.match(new RegExp('\\b'+k+'="([^"]+)"'))?.[1]||0);
    if(tipo==='rect'){const y=valor('y'),ancho=valor('width')*f(y);return tag.replace(/\bx="[^"]+"/,`x="${x(valor('x'),y)}"`).replace(/\bwidth="[^"]+"/,`width="${red(ancho)}"`);}
    return tag.replace(/\bcx="[^"]+"/,`cx="${x(valor('cx'),valor('cy'))}"`);
  });
}
function grupo(nombre,contenido,escala){return `<g data-capa="${nombre}" ${trazo}>${adaptarCinturaSvg(contenido,escala)}</g>`;}
if(!datos.capas.some(c=>c.id==='torso'))datos.capas.splice(datos.capas.findIndex(c=>c.id==='ropa_abajo'),0,{id:'torso',nombre:'torso unido bajo la ropa'});
if(!datos.capas.some(c=>c.id==='anatomia'))datos.capas.splice(datos.capas.findIndex(c=>c.id==='torso'),0,{id:'anatomia',nombre:'perfil superior continuo'});
for(const [id,nombre] of [...modelos,...topsNuevos])for(const [talla,cuerpo,escala] of tallas){
  const base=await readFile(new URL('assets/kme/ropa_arriba/camiseta-integrada-medio.svg',raiz),'utf8');
  const original=await readFile(new URL('assets/kme/ropa_abajo/cargo-integrada-medio.svg',raiz),'utf8');
  const piernas=original.match(/<g data-capa="piernas"[\s\S]*?<\/g>/)[0];
  for(const lado of ['arriba','abajo']){
    if(lado==='abajo'&&topsNuevos.some(([top])=>top===id))continue;
    const archivo=`../assets/kme/ropa_${lado}/${id}-${talla}.svg`;
    // El transform queda dentro de cada grupo extraíble, para conservar la anchura.
    let contenido=lado==='arriba'?`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480"><title>${nombre} · ${talla}</title>${grupo('perfil',perfilSuperior,escala)}${grupo('torso',pielTorso,escala)}${grupo('superior',superior(id,base),escala)}</svg>\n`:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480"><title>${nombre} · ${talla}</title>${adaptarCinturaSvg(inferior(id,piernas),escala)}</svg>\n`;
    await writeFile(new URL(archivo,url),contenido);
    const p={id:`${id}-${lado}-${talla}`,nombre:`${nombre} · ${talla}`,coleccion:topsNuevos.some(([top])=>top===id)?'tops-kpop':'lamina-kpop',familia:id,cuerpoCompatible:cuerpo};
    if(lado==='arriba')Object.assign(p,{perfilIntegrado:true,topCorto:esTop(id),ocultaCapas:['cuerpo'],gruposPorCapa:{anatomia:'perfil',torso:'torso',ropa_arriba:'superior'},capas:{anatomia:archivo,torso:archivo,ropa_arriba:archivo,piernas:`../assets/kme/cuerpo/${cuerpo}.svg`}});
    else Object.assign(p,{cinturaY:['pocket-pop','denim-star'].includes(id)?370:350,ocultaCapas:['cuerpo'],reemplazaCapas:['piernas'],gruposPorCapa:{piernas:'piernas',ropa_abajo:'prenda'},capas:{piernas:archivo,ropa_abajo:archivo}});
    const lista=datos.piezas[`ropa.${lado}`],indice=lista.findIndex(x=>x.id===p.id);if(indice<0)lista.push(p);else lista[indice]=p;
  }
}
// Flequillo de cortinas: laterales abiertos, sin invadir iris ni cejas.
const flequillo=path('M94 179 C78 142 92 96 125 83 C145 64 176 65 200 76 C228 62 260 71 279 93 C301 111 310 151 301 180 L285 174 C280 145 263 121 231 112 C246 134 259 146 276 153 C244 154 217 128 201 99 C188 126 164 150 131 157 C147 140 163 124 168 110 C135 120 119 145 114 178Z','f-pelo','#252027');
const mechones=linea('M113 130 C121 105 145 88 171 89 M146 104 Q170 80 191 86 M210 85 C239 79 265 96 278 118 M217 96 Q238 126 259 137');
const casquete=path('M94 185 C72 145 84 87 130 70 C174 49 241 54 273 79 C309 100 322 151 307 190 L286 206 L276 128 L126 128 L115 205Z','f-pelo-trasero','#252027');
const ondaIzq=path('M104 123 C73 131 65 165 78 189 C56 201 61 231 76 246 C53 261 62 288 79 298 C64 315 73 337 94 339 C88 323 112 319 111 298 C133 282 121 258 116 247 C132 226 117 209 112 195 C126 173 112 158 118 146Z','f-pelo-trasero','#252027');
const ondaDer=ondaIzq.replace('<path ','<path transform="translate(400 0) scale(-1 1)" ');
const brillos=path('M101 117 Q91 144 100 164 M92 211 Q83 229 96 243 M92 270 Q83 287 95 299 M300 123 Q309 144 300 165','','none','stroke="#fffaf7" opacity=".3" stroke-width="1.5"');
const lazo=(x,y)=>path(`M${x} ${y} Q${x-26} ${y-23} ${x-25} ${y-4} Q${x-27} ${y+9} ${x-2} ${y+3} L${x-14} ${y+32} L${x-2} ${y+24} L${x+3} ${y+10} L${x+14} ${y+30} L${x+21} ${y+34} L${x+10} ${y+2} Q${x+34} ${y+5} ${x+27} ${y-13} Q${x+20} ${y-22} ${x+3} ${y-2}Z`,'','#e83475','stroke-width="1.8"');
const bucle=(x,y,r=16)=>path(`M${x-r} ${y} C${x-r-8} ${y-10} ${x-6} ${y-r} ${x+5} ${y-r+3} C${x+r+12} ${y-r} ${x+r+7} ${y+10} ${x+6} ${y+r} C${x-1} ${y+r+9} ${x-r-6} ${y+14} ${x-r} ${y}Z`,'f-pelo','#252027');
const trenza=[0,1,2,3,4].map(i=>bucle(288-i*3,240+i*20,14-i)).join('')+path('M274 331 Q288 334 292 352 Q276 345 270 355 Q265 342 274 331Z','f-pelo','#252027');
const pelos=[
  ['cortinas-textura','Cortinas con textura',casquete+path('M97 124 L80 116 L89 142 L75 150 L92 160 L83 184 L111 186 M294 123 L313 115 L306 142 L325 150 L309 162 L319 183 L291 187','f-pelo-trasero','#252027'),flequillo+mechones],
  ['coleta-ondas','Coleta ondulada',casquete+ondaIzq+ondaIzq.replace('<path ','<path transform="translate(-15 -24)" ')+brillos,flequillo+mechones+lazo(102,115)+path('M119 157 C131 174 119 186 122 202 M281 157 C267 175 281 190 276 210','','none','class="t-pelo" stroke-width="7"')],
  ['doble-mono-lazos','Dos moños con lazos',casquete+bucle(104,89,30)+bucle(296,89,30),flequillo+mechones+lazo(100,105)+lazo(300,105)+linea('M92 80 Q102 62 118 83 M281 79 Q298 62 309 85')],
  ['trenza-lateral','Trenza lateral',casquete+ondaDer+trenza,flequillo+mechones+path('M276 152 C289 174 272 189 283 208 C292 220 294 232 281 240','f-pelo','#252027')+brillos+estrella(278,137,6)+path('M271 329 L285 331','','none','stroke="#e83475" stroke-width="5"')],
  ['media-melena-ondas','Media melena ondulada',casquete+ondaIzq+ondaDer+brillos,flequillo+mechones+path('M119 146 C101 169 126 186 114 205 C96 223 125 237 114 253 M281 146 C299 169 274 186 286 205 C304 223 275 237 286 253','','none','class="t-pelo" stroke-width="8"')]
];
pelos.push(
  ['corto-despeinado','Corto despeinado',
    path('M99 188 L84 172 L91 155 L80 140 L97 141 C88 105 113 77 146 72 L145 57 L173 66 L189 50 L210 61 L237 53 L246 72 C282 77 310 103 304 142 L319 140 L308 160 L316 179 L298 191 L283 161 L275 126 L124 125 L116 173Z','f-pelo-trasero','#252027'),
    path('M99 165 C91 118 115 90 150 81 L145 69 L176 76 L195 62 L207 78 L236 67 L239 86 C270 88 291 111 301 155 L281 148 L281 164 L253 145 L258 159 C232 149 213 131 202 113 L186 145 L180 133 L151 158 L156 142 L116 168 L122 151Z','f-pelo','#252027')+linea('M120 122 Q144 93 167 96 M213 93 Q246 94 270 119 M164 118 L180 99')],
  ['corto-dos-bloques','Corto en dos bloques',
    path('M100 191 C81 151 86 106 122 83 C161 58 229 54 272 80 C306 100 317 153 300 190 L284 183 L278 135 L122 135 L117 184Z','f-pelo-trasero','#252027')+path('M100 158 L115 155 L116 185 L105 191Z M285 155 L300 158 L294 191 L283 185Z','f-pelo-oscuro','#252027'),
    path('M97 157 C86 104 130 69 189 74 C240 59 291 87 303 149 C281 155 261 147 244 133 C249 143 255 149 258 155 C228 144 205 121 197 99 C188 119 168 142 141 154 L149 136 C135 150 118 158 97 157Z','f-pelo','#252027')+linea('M112 121 C135 91 164 88 186 87 M209 87 C244 80 275 107 283 130')],
  ['semirrecogido-grenas','Semirrecogido con greñas',
    casquete+ondaIzq+ondaDer+bucle(202,64,29)+path('M185 55 Q166 35 176 21 Q188 30 194 47 M213 49 Q228 24 241 29 Q241 42 221 62 M226 72 Q257 61 260 82 Q241 77 229 89','f-pelo','#252027'),
    flequillo+mechones+path('M139 129 Q115 148 121 175 Q132 194 119 214 M258 127 Q285 143 276 165 Q263 185 280 205 M122 170 Q103 176 106 193 M276 170 Q297 179 293 195','','none','class="t-pelo" stroke-width="6"')+path('M183 84 Q203 92 222 84','','none','stroke="#e83475" stroke-width="4"')]
);
for(const [id,nombre,atras,frente] of pelos){
  for(const [capa,dibujo] of [['pelo_atras',atras],['pelo_frente',frente]])await writeFile(new URL(`assets/kme/${capa}/${id}.svg`,raiz),svg(nombre+' · '+capa,dibujo));
  const p={id,nombre,coleccion:'lamina-kpop',capas:{pelo_atras:`../assets/kme/pelo_atras/${id}.svg`,pelo_frente:`../assets/kme/pelo_frente/${id}.svg`}};
  const lista=datos.piezas['pelo.estilo'],i=lista.findIndex(x=>x.id===id);if(i<0)lista.push(p);else lista[i]=p;
}
datos.porDefecto.pelo.acabado??='tinta';
for(const base of datos.bases)base.avatar.pelo.acabado??='tinta';
await writeFile(url,JSON.stringify(datos,null,2)+'\n');
console.log('Colección lista: 48 prendas de la lámina, 15 tops y 16 capas de cabello; paletas y piezas anteriores conservadas.');
