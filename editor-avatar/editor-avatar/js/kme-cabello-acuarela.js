// Acuarela mate: pigmento irregular, grano y fibras dentro de cada mechón.
// Sin degradados luminosos, desenfoques, imágenes ni recursos externos.
export function aplicarCabelloAcuarela(svg,acabado,prefijo){
  if(acabado!=='acuarela'||!svg)return svg;
  const pigmento=`${prefijo}-pigmento`;
  // Semilla fija: el grano no salta ni cambia al elegir un color o deshacer.
  let semilla=71423;
  const azar=()=>{semilla=(Math.imul(semilla,1664525)+1013904223)>>>0;return semilla/4294967296;};
  const n=v=>Number(v.toFixed(2));
  const manchas=[];
  for(let i=0;i<64;i++){
    const x=45+azar()*310,y=10+azar()*350,rx=8+azar()*38,ry=5+azar()*21,puntos=[];
    for(let j=0;j<12;j++){const a=j*Math.PI/6,r=.68+azar()*.42;puntos.push([n(x+Math.cos(a)*rx*r),n(y+Math.sin(a)*ry*r)]);}
    const medio=(a,b)=>[n((a[0]+b[0])/2),n((a[1]+b[1])/2)].join(' ');
    let d='M'+medio(puntos.at(-1),puntos[0]);
    for(let j=0;j<12;j++)d+=`Q${puntos[j].join(' ')} ${medio(puntos[j],puntos[(j+1)%12])}`;
    manchas.push(`<path d="${d}Z" ${i%3?'fill="#fffaf7"':'class="f-pelo-oscuro"'} opacity="${n(.04+azar()*.14)}"/>`);
  }
  let granoClaro='',granoOscuro='',fibras='';
  for(let i=0;i<2300;i++){
    const x=n(40+azar()*320),y=n(5+azar()*365),r=n(.3+azar()*.8);
    const d=`M${x} ${y}l${r} ${n(r*.27)}l${n(-r*.3)} ${n(r*.8)}l${-r} ${n(-r*.4)}Z`;
    if(i%3)granoClaro+=d;else granoOscuro+=d;
  }
  for(let i=0;i<190;i++){
    const x=n(50+azar()*300),y=n(15+azar()*340),l=n(2+azar()*9);
    fibras+=`M${x} ${y}q${n(l*.3)} ${n(-l*.5)} ${n(l*.35)} ${-l}`;
  }
  const definiciones=`<defs><pattern id="${pigmento}" patternUnits="userSpaceOnUse" width="400" height="480"><rect width="400" height="480" fill="#fffaf7" opacity=".12"/><g data-textura="pigmento-irregular">${manchas.join('')}</g><g data-textura="grano-papel"><path d="${granoClaro}" fill="#fffaf7" opacity=".45"/><path d="${granoOscuro}" class="f-pelo-oscuro" opacity=".3"/><path d="${fibras}" fill="none" stroke="#fffaf7" stroke-width=".55" opacity=".19"/></g></pattern></defs>`;
  // Retira los reflejos pulidos de la versión de tinta: el blanco se reserva
  // al papel que asoma entre partículas, distribuido sin bandas de brillo.
  const mate=svg.replace(/<path\b(?=[^>]*fill="none")(?=[^>]*stroke="#(?:fff|ffffff|fffaf7)")[^>]*\/>/gi,'');
  const dibujo=mate.replace(/<path\b[^>]*class="f-pelo(?:-trasero|-oscuro)?"[^>]*\/>/g,tag=>{
    const d=tag.match(/\bd="([^"]+)"/)?.[1],transform=tag.match(/\btransform="([^"]+)"/)?.[1];
    if(!d)return tag;
    return tag+`<path d="${d}"${transform?` transform="${transform}"`:''} fill="url(#${pigmento})" stroke="none"/>`;
  });
  return definiciones+`<g data-acabado="acuarela-pelo" stroke-opacity=".72">${dibujo}</g>`;
}
